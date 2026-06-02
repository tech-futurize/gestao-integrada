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
  agente_system_tools: { tool_id: string }[];
};

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY não definidos no .env');
  return createClient(url, key);
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

  const { data: agentRows, error } = await supabase
    .from('agentes')
    .select('*, agente_system_tools(tool_id)')
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
    for (const { tool_id } of row.agente_system_tools ?? []) {
      if (SYSTEM_TOOLS[tool_id]) {
        const key = tool_id.replace(/-/g, '_');
        tools[key] = SYSTEM_TOOLS[tool_id];
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
