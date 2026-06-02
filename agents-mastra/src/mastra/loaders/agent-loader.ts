import { Agent } from '@mastra/core/agent';
import { createClient } from '@supabase/supabase-js';
import { getSchemaTool, executeSQLTool, analyzeTableTool } from '../tools/supabase-tools';
import { queryExecutorTool } from '../tools/query-executor-tool';
import { loadSchema } from '../schema/schema-loader';
import { today, lastNWeeks } from '../utils/date-helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SYSTEM_TOOLS: Record<string, any> = {
  'get-schema': getSchemaTool,
  'execute-sql': executeSQLTool,
  'analyze-table': analyzeTableTool,
  'query-database': queryExecutorTool,
};

const PROVIDER_ENV_KEYS: Record<string, string> = {
  openai:    'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google:    'GOOGLE_GENERATIVE_AI_API_KEY',
  groq:      'GROQ_API_KEY',
};

type AgentRow = {
  id: string;
  slug: string;
  nome: string;
  provider: string;
  modelo: string;
  instructions: string;
  temperatura: number | null;
  max_tokens: number | null;
  injetar_schema: boolean;
  injetar_data: boolean;
  ativo: boolean;
  // tool links from agente_tool_links (new unified)
  agente_tool_links: { tool_id: string; agente_tools: { tool_key: string | null; is_system: boolean } | null }[];
  // legacy system tools — kept for backwards compat during migration
  agente_system_tools: { tool_id: string }[];
};

type ProviderConfigRow = {
  provider: string;
  api_key: string | null;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url) {
    throw new Error('[agent-loader] SUPABASE_URL não definida. Configure em agents-mastra/.env.local');
  }
  if (!key) {
    throw new Error(
      '[agent-loader] SUPABASE_SERVICE_KEY obrigatória — a anon key não tem permissão ' +
      'para ler agentes (RLS exige role authenticated com perfil Admin). ' +
      'Configure SUPABASE_SERVICE_KEY em agents-mastra/.env.local'
    );
  }
  return createClient(url, key);
}

/** Carrega API keys do banco e seta process.env para cada provider.
 *  Prioridade: env file vence — só define se ainda não estiver setado. */
async function loadProviderKeys(supabase: ReturnType<typeof createClient>): Promise<void> {
  const { data, error } = await supabase
    .from('provider_configs')
    .select('provider, api_key')
    .eq('ativo', true)
    .not('api_key', 'is', null);

  if (error) {
    console.warn('[agent-loader] Não foi possível carregar API keys do banco:', error.message);
    return;
  }

  for (const row of (data ?? []) as ProviderConfigRow[]) {
    const envKey = PROVIDER_ENV_KEYS[row.provider];
    if (!envKey) continue;
    if (process.env[envKey]) {
      // env file já tem a chave — não sobrescrever
      console.info(`[agent-loader] ${envKey} já definida via env file — ignorando chave do banco.`);
    } else if (row.api_key) {
      process.env[envKey] = row.api_key;
      console.info(`[agent-loader] ${envKey} carregada do banco para provider '${row.provider}'.`);
    }
  }
}

async function buildInstructions(row: AgentRow): Promise<string | (() => Promise<string>)> {
  const needsDynamic = row.injetar_schema || row.injetar_data;
  if (!needsDynamic) return row.instructions;

  return async () => {
    let extra = '';

    if (row.injetar_schema) {
      const tables = await loadSchema();
      const schemaText = tables
        .map((t) => {
          const cols = t.columns
            .map((c) => `    - ${c.name}${c.isPrimaryKey ? ' [PK]' : ''}${c.nullable ? '?' : ''}: ${c.type}`)
            .join('\n');
          return `  • ${t.name}\n${cols}`;
        })
        .join('\n\n');
      extra += `\n\n## Estrutura de dados disponível\n\n${schemaText}`;
    }

    if (row.injetar_data) {
      const w4 = lastNWeeks(4);
      const w8 = lastNWeeks(8);
      extra += `\n\n## Contexto temporal\n- Hoje: ${today()}\n- Últimas 4 semanas: ${w4.start} até ${w4.end}\n- Últimas 8 semanas: ${w8.start} até ${w8.end}`;
    }

    return row.instructions + extra;
  };
}

export async function loadAgentsFromDB(): Promise<Record<string, Agent>> {
  const supabase = getSupabase();

  // Carregar API keys do banco antes de criar agentes
  await loadProviderKeys(supabase);

  const { data: agentRows, error } = await supabase
    .from('agentes')
    .select(`
      *,
      agente_tool_links (
        tool_id,
        agente_tools ( tool_key, is_system )
      ),
      agente_system_tools ( tool_id )
    `)
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (error) throw new Error(`Falha ao carregar agentes do banco: ${error.message}`);

  if (!agentRows || agentRows.length === 0) {
    console.warn('[agent-loader] Nenhum agente ativo encontrado no banco.');
    return {};
  }

  const agents: Record<string, Agent> = {};

  for (const row of agentRows as AgentRow[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: Record<string, any> = {};

    // 1. Tools via agente_tool_links (nova arquitetura unificada)
    for (const link of row.agente_tool_links ?? []) {
      const toolKey = link.agente_tools?.tool_key;
      if (toolKey && SYSTEM_TOOLS[toolKey]) {
        tools[toolKey.replace(/-/g, '_')] = SYSTEM_TOOLS[toolKey];
      }
    }

    // 2. Fallback: agente_system_tools (compatibilidade com agentes migrados ainda não reassociados)
    if (Object.keys(tools).length === 0) {
      for (const { tool_id } of row.agente_system_tools ?? []) {
        if (SYSTEM_TOOLS[tool_id]) {
          tools[tool_id.replace(/-/g, '_')] = SYSTEM_TOOLS[tool_id];
        }
      }
    }

    const modelString = `${row.provider}/${row.modelo}`;
    const instructions = await buildInstructions(row);

    const agentOptions: ConstructorParameters<typeof Agent>[0] = {
      id: row.slug,
      name: row.nome,
      instructions,
      model: modelString,
      tools,
    };

    if (row.temperatura != null) {
      (agentOptions as Record<string, unknown>).defaultGenerateOptions = { temperature: row.temperatura };
    }

    agents[row.slug] = new Agent(agentOptions);
  }

  console.info(`[agent-loader] ${Object.keys(agents).length} agente(s) carregado(s) do banco.`);
  return agents;
}
