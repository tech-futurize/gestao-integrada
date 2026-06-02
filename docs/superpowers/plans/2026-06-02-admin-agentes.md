# Admin de Agentes de IA — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a área "Admin de Agentes" com configuração editável (modelo, prompt, tools) via UI + painel de métricas de uso/custo, substituindo a tela read-only atual e o bootstrap hard-coded do Mastra.

**Architecture:** Novas tabelas Supabase (`agentes`, `agente_tools`, `agente_uso_logs`, `modelo_precos`) persistem as definições; o backend Mastra passa a carregar os agentes dinamicamente do banco no startup e registra telemetria por execução; o frontend expõe CRUD via página "Admin de Agentes" com 4 abas e consumo via React Query.

**Tech Stack:** React 18 + Vite (JSX), Tailwind + shadcn/ui (FormDialog, Tabs, KPICard), React Query 5, Supabase, Mastra `@mastra/core@^1.30`, TypeScript no backend.

---

> **⚠️ GATE DE DESIGN (Pré-condição):** As Tasks 4–8 (frontend) dependem do layout aprovado pelo PO.
> **Antes de iniciar o código**, invocar o Designer com `/designer` para brainstorm visual com o
> Companion (mockups das 4 abas). Somente após aprovação PO prosseguir para Task 4.
> Tasks 1–3 (banco + backend) podem ser feitas em paralelo com o brainstorm visual.

---

## Mapa de Arquivos

### Novos
- `src/pages/Configuracoes/AdminAgentes.jsx` — página principal com 4 abas
- `src/components/agentes/AgentEditor.jsx` — formulário de criação/edição de agente (Blocos A–D)
- `src/components/agentes/AgentCard.jsx` — card de agente na listagem
- `src/components/agentes/ToolEditor.jsx` — formulário CRUD de tool SQL customizada
- `src/components/agentes/ToolsList.jsx` — listagem de tools com ações
- `src/components/agentes/MetricsDashboard.jsx` — aba de métricas/custos
- `src/components/agentes/ProvidersTab.jsx` — aba de status de provedores
- `agents-mastra/src/mastra/loaders/agent-loader.ts` — carrega agentes do Supabase em runtime
- `agents-mastra/src/mastra/middleware/telemetry.ts` — grava uso por execução

### Modificados
- `src/api/supabaseEntities.js` — adicionar 4 entidades ao TABLE_MAP
- `src/App.jsx` — nova rota `/configuracoes/agentes-admin`
- `src/lib/navigationConfig.js` — item de navegação Admin de Agentes
- `agents-mastra/src/mastra/index.ts` — bootstrap dinâmico + telemetria
- `docs/database/supabase-migration.sql` — schema das novas tabelas

---

## Task 1: Migração do Banco de Dados (Supabase)

**Files:**
- Modify: `docs/database/supabase-migration.sql`
- Modify: `src/api/supabaseEntities.js:3-30`

- [ ] **Step 1.1: Escrever migration SQL**

Adicionar ao final de `docs/database/supabase-migration.sql`:

```sql
-- =====================================================================
-- ADMIN DE AGENTES DE IA
-- =====================================================================

-- Provedores de modelo suportados
CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'google', 'groq');

-- Tabela de preços por modelo (para custo auditável)
CREATE TABLE IF NOT EXISTS modelo_precos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider      ai_provider NOT NULL,
  modelo        TEXT NOT NULL,
  preco_input_1k  NUMERIC(10, 6) NOT NULL DEFAULT 0,  -- USD por 1k tokens de input
  preco_output_1k NUMERIC(10, 6) NOT NULL DEFAULT 0,  -- USD por 1k tokens de output
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim    DATE,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, modelo, vigencia_inicio)
);

-- Dados iniciais de preços (gpt-4o-mini como referência)
INSERT INTO modelo_precos (provider, modelo, preco_input_1k, preco_output_1k) VALUES
  ('openai', 'gpt-4o-mini', 0.000150, 0.000600),
  ('openai', 'gpt-4o', 0.002500, 0.010000),
  ('openai', 'gpt-4.1-mini', 0.000400, 0.001600),
  ('anthropic', 'claude-haiku-4-5-20251001', 0.000800, 0.004000),
  ('anthropic', 'claude-sonnet-4-6', 0.003000, 0.015000)
ON CONFLICT DO NOTHING;

-- Definições de agentes (substitui hard-code no Mastra)
CREATE TABLE IF NOT EXISTS agentes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,  -- usado no endpoint /api/agents/{slug}/stream
  nome            TEXT NOT NULL,
  descricao       TEXT,
  icone           TEXT DEFAULT 'Bot',    -- nome de ícone lucide-react
  cor             TEXT DEFAULT '#26405d',
  provider        ai_provider NOT NULL DEFAULT 'openai',
  modelo          TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperatura     NUMERIC(3,2),          -- NULL = default do modelo
  max_tokens      INTEGER,               -- NULL = sem limite
  instructions    TEXT NOT NULL,         -- system prompt
  injetar_schema  BOOLEAN NOT NULL DEFAULT false,
  injetar_data    BOOLEAN NOT NULL DEFAULT true,
  forcar_projeto  BOOLEAN NOT NULL DEFAULT true,
  sugestoes       TEXT[] DEFAULT '{}',   -- prompts sugeridos no chat
  ativo           BOOLEAN NOT NULL DEFAULT true,
  ordem           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Tools de sistema disponíveis por agente (get-schema, execute-sql, etc.)
CREATE TABLE IF NOT EXISTS agente_system_tools (
  agente_id  UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  tool_id    TEXT NOT NULL,   -- 'get-schema' | 'execute-sql' | 'analyze-table' | 'query-database'
  PRIMARY KEY (agente_id, tool_id)
);

-- Tools SQL customizadas (reutilizáveis entre agentes)
CREATE TABLE IF NOT EXISTS agente_tools (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome         TEXT NOT NULL UNIQUE,
  descricao    TEXT NOT NULL,           -- texto que o LLM lê para decidir quando usar
  sql_template TEXT NOT NULL,           -- query parametrizada (somente SELECT)
  parametros   JSONB DEFAULT '[]',      -- [{nome, tipo, descricao}]
  ativo        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Associação agente ↔ tool customizada
CREATE TABLE IF NOT EXISTS agente_tool_links (
  agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  tool_id   UUID NOT NULL REFERENCES agente_tools(id) ON DELETE CASCADE,
  PRIMARY KEY (agente_id, tool_id)
);

-- Logs de uso por execução (telemetria)
CREATE TABLE IF NOT EXISTS agente_uso_logs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agente_slug      TEXT NOT NULL,
  modelo           TEXT NOT NULL,
  provider         ai_provider NOT NULL,
  usuario_email    TEXT,
  projeto_id       UUID,
  prompt_tokens    INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens     INTEGER NOT NULL DEFAULT 0,
  custo_usd        NUMERIC(10, 6),     -- calculado a partir de modelo_precos
  latencia_ms      INTEGER,
  status           TEXT DEFAULT 'success',  -- 'success' | 'error'
  thread_id        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance nos dashboards
CREATE INDEX IF NOT EXISTS idx_uso_logs_agente ON agente_uso_logs(agente_slug);
CREATE INDEX IF NOT EXISTS idx_uso_logs_criado ON agente_uso_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uso_logs_usuario ON agente_uso_logs(usuario_email);
CREATE INDEX IF NOT EXISTS idx_uso_logs_projeto ON agente_uso_logs(projeto_id);

-- RLS
ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_system_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_tool_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_uso_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_precos ENABLE ROW LEVEL SECURITY;

-- Policies: autenticados têm acesso total (padrão do projeto)
CREATE POLICY "Autenticados leem agentes" ON agentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados gerenciam agentes" ON agentes FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticados leem system tools" ON agente_system_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados gerenciam system tools" ON agente_system_tools FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticados leem tools" ON agente_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados gerenciam tools" ON agente_tools FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticados leem tool links" ON agente_tool_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados gerenciam tool links" ON agente_tool_links FOR ALL TO authenticated USING (true);
CREATE POLICY "Autenticados leem logs" ON agente_uso_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados inserem logs" ON agente_uso_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados leem precos" ON modelo_precos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados gerenciam precos" ON modelo_precos FOR ALL TO authenticated USING (true);

-- Migração: popular agentes com os dados hard-coded atuais
INSERT INTO agentes (slug, nome, descricao, icone, cor, provider, modelo, instructions, injetar_schema, injetar_data, forcar_projeto, sugestoes) VALUES
(
  'supabase-analyst-agent',
  'Analista de Dados',
  'Executa consultas SQL e analisa dados do projeto diretamente no banco.',
  'Database',
  '#26405d',
  'openai',
  'gpt-4o-mini',
  'Você é um executor de consultas SQL para um sistema de gestão EPC (engenharia e construção).

## Processo

1. Chame get-schema (sem parâmetros) para descobrir tabelas e colunas disponíveis.
2. Construa a query SQL com base na pergunta recebida. Sempre inclua filtro por projeto_id quando fornecido.
3. Chame execute-sql com a query.
4. Retorne os dados em formato estruturado conforme abaixo.

## Formato de resposta obrigatório

Sempre responda usando esta estrutura:

**Consulta executada:** `[SQL resumido ou descrição da query]`

**Resultados:**
| Campo | Valor |
|-------|-------|
| ...   | ...   |

(Use tabela Markdown quando os dados forem tabulares. Use lista com bullets quando forem itens não tabulares. Se vazio, escreva: "Nenhum dado encontrado para esta consulta.")

**Resumo:** [1 frase resumindo o resultado]

## Restrições

- Nunca execute DELETE, DROP ou TRUNCATE sem confirmação explícita.
- Nunca retorne dados de outros projetos (sempre filtre por projeto_id).
- Responda sempre em português do Brasil.
- Se a query falhar, descreva o erro claramente e sugira como reformular.

## Integridade de Dados

- NUNCA afirme, assuma ou extrapole dados que não estejam no retorno da query.
- Se a query retornar vazio, escreva exatamente: "Nenhum dado encontrado para esta consulta."
- NUNCA use "provavelmente", "deve ser", "tipicamente" para compensar dados ausentes.
- NUNCA invente valores, datas, nomes ou métricas.',
  true, true, true,
  ARRAY['Quais são os riscos críticos deste projeto?', 'Mostre o avanço físico por disciplina', 'Liste os contratos ativos e seus valores']
),
(
  'business-analyst-agent',
  'Analista de Negócio',
  'Interpreta dados e gera análises estratégicas com contexto do domínio EPC.',
  'TrendingUp',
  '#c35e1e',
  'openai',
  'gpt-4o-mini',
  'Você é um Analista de Negócio especializado em projetos EPC. Faça perguntas precisas e relevantes antes de executar consultas. Máximo 3 perguntas durante toda a conversa. Delegue consultas SQL ao Executor via query-database. Sintetize análises em máximo 400 palavras.

## Integridade de Dados
- NUNCA afirme dados não retornados pelo executor.
- Declare "Não há dados suficientes" se o executor retornar vazio.
- Estrutura obrigatória: Situação / Dados Encontrados / Análise / Recomendação',
  true, true, true,
  ARRAY['Qual é a situação atual do avanço físico?', 'Analise os riscos do projeto', 'Como está o desempenho de suprimentos?']
),
(
  'contractual-analyst-agent',
  'Analista Contratual',
  'Especialista jurídico-contratual: pleitos, atas, documentos e relacionamentos.',
  'FileText',
  '#00a49a',
  'openai',
  'gpt-4o-mini',
  'Você é um Analista Contratual especializado em contratos EPC. Consulte dados via query-database antes de emitir pareceres. Postura: defende os interesses do contratado. Responda sempre em português do Brasil.

## Integridade de Dados
- NUNCA afirme dados não retornados pelo executor.
- Declare "Não há dados suficientes" quando aplicável.',
  false, true, true,
  ARRAY['Quais são os pleitos em aberto?', 'Analise as atas de reunião recentes', 'Mostre os documentos contratuais do projeto']
)
ON CONFLICT (slug) DO NOTHING;

-- Inserir system tools para cada agente migrado
INSERT INTO agente_system_tools (agente_id, tool_id)
SELECT id, 'get-schema'       FROM agentes WHERE slug = 'supabase-analyst-agent'
UNION ALL
SELECT id, 'execute-sql'      FROM agentes WHERE slug = 'supabase-analyst-agent'
UNION ALL
SELECT id, 'analyze-table'    FROM agentes WHERE slug = 'supabase-analyst-agent'
UNION ALL
SELECT id, 'query-database'   FROM agentes WHERE slug = 'business-analyst-agent'
UNION ALL
SELECT id, 'query-database'   FROM agentes WHERE slug = 'contractual-analyst-agent'
ON CONFLICT DO NOTHING;
```

- [ ] **Step 1.2: Executar migration no Supabase**

Copiar o SQL acima e executar via Supabase Dashboard → SQL Editor, ou via MCP `execute_sql`.

Verificar criação das tabelas:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('agentes','agente_tools','agente_uso_logs','modelo_precos','agente_system_tools','agente_tool_links')
ORDER BY table_name;
```
Esperado: 6 linhas.

- [ ] **Step 1.3: Adicionar entidades ao TABLE_MAP**

Abrir `src/api/supabaseEntities.js` e adicionar após a linha `PacoteSuprimento: 'pacotes_suprimento',`:

```js
  Agente: 'agentes',
  AgenteSystemTool: 'agente_system_tools',
  AgenteTool: 'agente_tools',
  AgenteToolLink: 'agente_tool_links',
  AgenteUsoLog: 'agente_uso_logs',
  ModeloPreco: 'modelo_precos',
```

- [ ] **Step 1.4: Commit**

```bash
git add docs/database/supabase-migration.sql src/api/supabaseEntities.js
git commit -m "feat(agentes): schema de admin de agentes + entidades Supabase"
```

---

## Task 2: Backend Mastra — Loader Dinâmico

**Files:**
- Create: `agents-mastra/src/mastra/loaders/agent-loader.ts`
- Modify: `agents-mastra/src/mastra/index.ts`

O Mastra não importa mais agentes estáticos. Em vez disso, lê `agentes` + `agente_system_tools` do Supabase e instancia `Agent` dinamicamente.

- [ ] **Step 2.1: Criar cliente Supabase para o backend Mastra**

Criar `agents-mastra/src/mastra/loaders/agent-loader.ts`:

```typescript
import { Agent } from '@mastra/core/agent';
import { createClient } from '@supabase/supabase-js';
import { getSchemaTool, executeSQLTool, analyzeTableTool } from '../tools/supabase-tools';
import { queryExecutorTool } from '../tools/query-executor-tool';
import { loadSchema } from '../schema/schema-loader';
import { today, lastNWeeks } from '../utils/date-helpers';

// Mapa de tools de sistema disponíveis
const SYSTEM_TOOLS: Record<string, ReturnType<typeof createTool>> = {
  'get-schema': getSchemaTool,
  'execute-sql': executeSQLTool,
  'analyze-table': analyzeTableTool,
  'query-database': queryExecutorTool,
};

type AgentRow = {
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
};

type SystemToolRow = { agente_id: string; tool_id: string };

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL/KEY não definidos no .env');
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

  const { data: agentRows, error: agentError } = await supabase
    .from('agentes')
    .select('*, agente_system_tools(tool_id)')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (agentError) throw new Error(`Falha ao carregar agentes: ${agentError.message}`);
  if (!agentRows || agentRows.length === 0) {
    console.warn('[agent-loader] Nenhum agente ativo encontrado no banco.');
    return {};
  }

  const agents: Record<string, Agent> = {};

  for (const row of agentRows as (AgentRow & { agente_system_tools: SystemToolRow[] })[]) {
    const tools: Record<string, ReturnType<typeof createTool>> = {};
    for (const { tool_id } of row.agente_system_tools ?? []) {
      if (SYSTEM_TOOLS[tool_id]) tools[tool_id.replace(/-/g, '_')] = SYSTEM_TOOLS[tool_id];
    }

    const modelString = `${row.provider}/${row.modelo}`;
    const instructions = await buildInstructions(row);

    agents[row.slug] = new Agent({
      id: row.slug,
      name: row.nome,
      instructions,
      model: modelString,
      ...(row.temperatura != null ? { defaultGenerateOptions: { temperature: row.temperatura } } : {}),
      ...(row.max_tokens != null ? { defaultGenerateOptions: { maxTokens: row.max_tokens } } : {}),
      tools,
    });
  }

  console.info(`[agent-loader] ${Object.keys(agents).length} agente(s) carregado(s) do banco.`);
  return agents;
}
```

> **Nota:** `@supabase/supabase-js` precisa ser adicionado ao `agents-mastra/package.json`.

- [ ] **Step 2.2: Instalar dependência do Supabase no agents-mastra**

```bash
cd agents-mastra && npm install @supabase/supabase-js && cd ..
```

- [ ] **Step 2.3: Atualizar index.ts para bootstrap dinâmico**

Substituir o conteúdo de `agents-mastra/src/mastra/index.ts`:

```typescript
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { loadSchema } from './schema/schema-loader';
import { loadAgentsFromDB } from './loaders/agent-loader';

loadSchema().catch((err) => console.warn('[schema-loader] Falha ao pré-carregar schema:', err));

const agents = await loadAgentsFromDB();

export const mastra = new Mastra({
  agents,
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
```

> **Nota:** o `await` no top-level requer `"type": "module"` no package.json (já existe) e target ES2022+ no tsconfig (já existe).

- [ ] **Step 2.4: Adicionar SUPABASE_URL e SUPABASE_SERVICE_KEY ao .env.example do agents-mastra**

Abrir `agents-mastra/.env.example` e adicionar:
```
# Supabase (para carregar agentes do banco)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key
```

- [ ] **Step 2.5: Testar que o servidor sobe com agentes do banco**

```bash
npm run dev:mastra
```

Esperado: log `[agent-loader] 3 agente(s) carregado(s) do banco.` e servidor em `localhost:4111`.

- [ ] **Step 2.6: Commit**

```bash
git add agents-mastra/src/mastra/loaders/agent-loader.ts agents-mastra/src/mastra/index.ts agents-mastra/.env.example agents-mastra/package.json agents-mastra/package-lock.json
git commit -m "feat(mastra): bootstrap dinâmico — carrega agentes do Supabase em runtime"
```

---

## Task 3: Backend Mastra — Telemetria de Uso

**Files:**
- Create: `agents-mastra/src/mastra/middleware/telemetry.ts`
- Modify: `agents-mastra/src/mastra/index.ts`

Gravar uma linha em `agente_uso_logs` após cada execução de agente.

- [ ] **Step 3.1: Criar middleware de telemetria**

Criar `agents-mastra/src/mastra/middleware/telemetry.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

type TelemetryEntry = {
  agente_slug: string;
  modelo: string;
  provider: string;
  usuario_email?: string;
  projeto_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latencia_ms?: number;
  status?: string;
  thread_id?: string;
};

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function logUsage(entry: TelemetryEntry): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('[telemetry] Supabase não configurado — log de uso ignorado.');
    return;
  }

  // Buscar preço do modelo para calcular custo
  const { data: preco } = await supabase
    .from('modelo_precos')
    .select('preco_input_1k, preco_output_1k')
    .eq('provider', entry.provider)
    .eq('modelo', entry.modelo)
    .eq('ativo', true)
    .order('vigencia_inicio', { ascending: false })
    .limit(1)
    .single();

  const custo_usd = preco
    ? (entry.prompt_tokens / 1000) * Number(preco.preco_input_1k) +
      (entry.completion_tokens / 1000) * Number(preco.preco_output_1k)
    : null;

  const { error } = await supabase.from('agente_uso_logs').insert({
    ...entry,
    custo_usd,
  });

  if (error) console.error('[telemetry] Falha ao gravar log de uso:', error.message);
}
```

- [ ] **Step 3.2: Integrar telemetria no agent-loader**

No arquivo `agents-mastra/src/mastra/loaders/agent-loader.ts`, a telemetria será chamada **no nível HTTP** — não no agent-loader, pois o Mastra não expõe hooks de middleware de agente na v1.30.

A abordagem é: o frontend envia `usuario_email` e `projeto_id` no corpo do request; o servidor Mastra expõe um handler customizado. Como o Mastra v1.30 usa seu próprio server interno, a alternativa é interceptar via proxy Vite ou criar um endpoint de log separado.

**Abordagem pragmática para MVP:** adicionar uma Edge Function Supabase ou um endpoint simples no frontend que o `AgenteChat.jsx` chama após cada resposta com os metadados.

Criar `src/hooks/useAgentTelemetry.js`:

```js
import { useMutation } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';

export function useAgentTelemetry() {
  return useMutation({
    mutationFn: async ({
      agenteSlug,
      modelo,
      provider,
      usuarioEmail,
      projetoId,
      promptTokens = 0,
      completionTokens = 0,
      latenciaMs,
      status = 'success',
      threadId,
    }) => {
      await entities.AgenteUsoLog.create({
        agente_slug: agenteSlug,
        modelo,
        provider,
        usuario_email: usuarioEmail,
        projeto_id: projetoId,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        latencia_ms: latenciaMs,
        status,
        thread_id: threadId,
      });
    },
    onError: (err) => console.warn('[telemetry] Falha ao gravar log:', err),
  });
}
```

> **Nota:** a contagem de tokens do streaming SSE não vem na resposta do Mastra por padrão. Para MVP, registrar o log com `prompt_tokens = 0`, `completion_tokens = 0` e focar em **contagem de execuções** e **latência**. O custo será calculado quando o Mastra expuser usage no streaming (roadmap).

- [ ] **Step 3.3: Integrar hook em AgenteChat.jsx**

Em `src/components/agentes/AgenteChat.jsx`, adicionar após o streaming completar:

```js
// Importar no topo:
import { useAgentTelemetry } from '@/hooks/useAgentTelemetry';
import { useAuth } from '@/lib/AuthContext';

// Dentro do componente:
const { mutate: logTelemetry } = useAgentTelemetry();
const { user } = useAuth();

// Após receber toda a resposta (onde today streamingComplete):
logTelemetry({
  agenteSlug: agent.id,
  modelo: 'gpt-4o-mini',   // TODO: virá do banco após Task 4
  provider: 'openai',
  usuarioEmail: user?.email,
  projetoId: selectedProjectId,
  latenciaMs: Date.now() - startTime,
  threadId,
  status: 'success',
});
```

- [ ] **Step 3.4: Commit**

```bash
git add agents-mastra/src/mastra/middleware/telemetry.ts src/hooks/useAgentTelemetry.js src/components/agentes/AgenteChat.jsx
git commit -m "feat(agentes): telemetria de uso — grava execuções em agente_uso_logs"
```

---

## Task 4: Frontend — Estrutura de Rota e Página (pós-aprovação do design)

**Files:**
- Create: `src/pages/Configuracoes/AdminAgentes.jsx`
- Modify: `src/App.jsx`
- Modify: `src/lib/navigationConfig.js`

> ⚠️ **Iniciar apenas após o Designer aprovar o layout visual** (Gate do Lote 1).

- [ ] **Step 4.1: Criar página AdminAgentes.jsx com 4 abas**

```jsx
import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissionsMap } from '@/hooks/usePermissions';
import AgentsList from '@/components/agentes/AgentsList';
import ToolsList from '@/components/agentes/ToolsList';
import MetricsDashboard from '@/components/agentes/MetricsDashboard';
import ProvidersTab from '@/components/agentes/ProvidersTab';

const TABS = [
  { key: 'agentes', label: 'Agentes' },
  { key: 'tools', label: 'Tools' },
  { key: 'metricas', label: 'Métricas & Custos' },
  { key: 'provedores', label: 'Provedores' },
];

export default function AdminAgentes() {
  const [activeTab, setActiveTab] = useState('agentes');
  const { isAdmin } = usePermissionsMap();

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Acesso restrito a administradores.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto">
        {/* Barra de abas — padrão de Cadastros.jsx */}
        <div className="flex gap-1 border-b border-border px-6 md:px-8 bg-background sticky top-0 z-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-primary bg-card'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'agentes' && <AgentsList />}
            {activeTab === 'tools' && <ToolsList />}
            {activeTab === 'metricas' && <MetricsDashboard />}
            {activeTab === 'provedores' && <ProvidersTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Registrar rota em App.jsx**

Em `src/App.jsx`, adicionar o lazy import junto aos demais:

```js
const AdminAgentes = lazy(() => import('./pages/Configuracoes/AdminAgentes'));
```

E dentro do bloco de rotas `/configuracoes/`:

```jsx
<Route path="/configuracoes/agentes-admin" element={wrap(AdminAgentes, 'Configurações')} />
```

- [ ] **Step 4.3: Adicionar item de navegação**

Em `src/lib/navigationConfig.js`, no grupo `"Configurações"`, adicionar:

```js
{ title: 'Admin de Agentes', path: '/configuracoes/agentes-admin' },
```

- [ ] **Step 4.4: Commit**

```bash
git add src/pages/Configuracoes/AdminAgentes.jsx src/App.jsx src/lib/navigationConfig.js
git commit -m "feat(agentes): rota e estrutura da página Admin de Agentes (4 abas)"
```

---

## Task 5: Frontend — Lista e Editor de Agentes

**Files:**
- Create: `src/components/agentes/AgentsList.jsx`
- Create: `src/components/agentes/AgentCard.jsx`
- Create: `src/components/agentes/AgentEditor.jsx`

- [ ] **Step 5.1: Criar AgentCard.jsx**

```jsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RowActions from '@/components/ui/RowActions';
import * as Icons from 'lucide-react';

const PROVIDER_LABELS = { openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google', groq: 'Groq' };

export default function AgentCard({ agent, onEdit, onDelete }) {
  const IconComp = Icons[agent.icone] ?? Icons.Bot;

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4 flex items-start gap-4">
        <div className="rounded-lg p-2.5 flex-shrink-0" style={{ background: agent.cor + '20' }}>
          <IconComp size={20} style={{ color: agent.cor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{agent.nome}</span>
            {!agent.ativo && <Badge variant="secondary">Inativo</Badge>}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{agent.descricao}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {PROVIDER_LABELS[agent.provider] ?? agent.provider} / {agent.modelo}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">/{agent.slug}</span>
          </div>
        </div>
        <RowActions onEdit={() => onEdit(agent)} onView={null} />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5.2: Criar AgentEditor.jsx (formulário Blocos A–D)**

```jsx
import { useState, useEffect } from 'react';
import { FormDialog, SectionDivider } from '@/components/ui/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'] },
  { value: 'google', label: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { value: 'groq', label: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b'] },
];

const SYSTEM_TOOLS_OPTIONS = [
  { id: 'get-schema', label: 'get-schema', desc: 'Lê estrutura do banco de dados' },
  { id: 'execute-sql', label: 'execute-sql', desc: 'Executa queries SQL (somente leitura)' },
  { id: 'analyze-table', label: 'analyze-table', desc: 'Estatísticas de tabela' },
  { id: 'query-database', label: 'query-database', desc: 'Delega consulta ao Executor de Dados' },
];

const EMPTY = {
  slug: '', nome: '', descricao: '', icone: 'Bot', cor: '#26405d',
  provider: 'openai', modelo: 'gpt-4o-mini', temperatura: null, max_tokens: null,
  instructions: '', injetar_schema: false, injetar_data: true, forcar_projeto: true,
  sugestoes: [], ativo: true, systemTools: [],
};

export default function AgentEditor({ open, onOpenChange, agent, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);
  const [sugestaoInput, setSugestaoInput] = useState('');
  const isEditing = !!agent?.id;

  useEffect(() => {
    if (agent) {
      setForm({ ...EMPTY, ...agent, systemTools: agent.systemTools ?? [] });
    } else {
      setForm(EMPTY);
    }
  }, [agent, open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const currentProvider = PROVIDERS.find((p) => p.value === form.provider) ?? PROVIDERS[0];

  const addSugestao = () => {
    const val = sugestaoInput.trim();
    if (!val) return;
    set('sugestoes', [...form.sugestoes, val]);
    setSugestaoInput('');
  };

  const toggleSystemTool = (toolId) => {
    const current = form.systemTools ?? [];
    set('systemTools', current.includes(toolId) ? current.filter((t) => t !== toolId) : [...current, toolId]);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Editar: ${form.nome}` : 'Novo Agente'}
      subtitle="Configure o modelo, prompt e tools do agente."
      onSave={() => onSave(form)}
      saving={saving}
      saveDisabled={!form.slug || !form.nome || !form.instructions}
      maxWidth="max-w-3xl"
    >
      {/* BLOCO A — Identidade */}
      <SectionDivider label="Identidade & Apresentação" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Nome *</Label>
          <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Analista de Dados" />
        </div>
        <div className="space-y-1">
          <Label>Slug (ID do endpoint) *</Label>
          <Input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="analista-dados"
            disabled={isEditing}
            className={isEditing ? 'opacity-60' : ''}
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Descrição</Label>
          <Input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Para que serve este agente?" />
        </div>
        <div className="space-y-1">
          <Label>Ícone (lucide-react)</Label>
          <Input value={form.icone} onChange={(e) => set('icone', e.target.value)} placeholder="Bot" />
        </div>
        <div className="space-y-1">
          <Label>Cor</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.cor} onChange={(e) => set('cor', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
            <Input value={form.cor} onChange={(e) => set('cor', e.target.value)} className="flex-1" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Switch checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} id="switch-ativo" />
        <Label htmlFor="switch-ativo">Agente ativo</Label>
      </div>

      {/* Sugestões */}
      <div className="space-y-2 mt-2">
        <Label>Sugestões de prompt</Label>
        <div className="flex gap-2">
          <Input value={sugestaoInput} onChange={(e) => setSugestaoInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSugestao()} placeholder="Digite e pressione Enter" />
          <Button type="button" size="sm" variant="outline" onClick={addSugestao}><Plus size={14} /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.sugestoes.map((s, i) => (
            <Badge key={i} variant="secondary" className="gap-1 text-xs">
              {s}
              <button onClick={() => set('sugestoes', form.sugestoes.filter((_, j) => j !== i))}><X size={10} /></button>
            </Badge>
          ))}
        </div>
      </div>

      {/* BLOCO B — Modelo */}
      <SectionDivider label="Modelo de Linguagem" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Provider</Label>
          <Select value={form.provider} onValueChange={(v) => { set('provider', v); set('modelo', PROVIDERS.find((p) => p.value === v)?.models[0] ?? ''); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Modelo</Label>
          <Select value={form.modelo} onValueChange={(v) => set('modelo', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currentProvider.models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Temperatura: {form.temperatura ?? 'padrão'}</Label>
          <Slider
            min={0} max={2} step={0.1}
            value={[form.temperatura ?? 1]}
            onValueChange={([v]) => set('temperatura', v)}
          />
        </div>
        <div className="space-y-1">
          <Label>Max Tokens</Label>
          <Input type="number" value={form.max_tokens ?? ''} onChange={(e) => set('max_tokens', e.target.value ? Number(e.target.value) : null)} placeholder="Sem limite" />
        </div>
      </div>

      {/* BLOCO C — Prompt */}
      <SectionDivider label="Prompt (System Instructions)" />
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Instructions *</Label>
          <Textarea
            value={form.instructions}
            onChange={(e) => set('instructions', e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder="Você é um especialista em..."
          />
        </div>
        <div className="flex flex-col gap-2 p-3 rounded-md bg-muted/40 text-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Injeção automática no prompt</p>
          {[
            { key: 'injetar_schema', label: 'Injetar schema do banco', desc: 'Adiciona tabelas/colunas ao início do prompt em cada execução' },
            { key: 'injetar_data', label: 'Injetar data atual', desc: 'Adiciona hoje e semanas recentes para contexto temporal' },
            { key: 'forcar_projeto', label: 'Forçar filtro por projeto', desc: 'Instrui o agente a filtrar sempre por projeto_id' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start gap-3">
              <Switch checked={form[key]} onCheckedChange={(v) => set(key, v)} id={`sw-${key}`} className="mt-0.5" />
              <div>
                <Label htmlFor={`sw-${key}`} className="cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Variáveis disponíveis: <code className="bg-muted px-1 rounded">{'{schema}'}</code> <code className="bg-muted px-1 rounded">{'{hoje}'}</code> <code className="bg-muted px-1 rounded">{'{projeto_id}'}</code></p>
      </div>

      {/* BLOCO D — Tools */}
      <SectionDivider label="Tools de Sistema" />
      <div className="grid grid-cols-2 gap-3">
        {SYSTEM_TOOLS_OPTIONS.map((tool) => (
          <div key={tool.id} className="flex items-start gap-3 p-3 rounded-md border border-border">
            <Switch
              checked={(form.systemTools ?? []).includes(tool.id)}
              onCheckedChange={() => toggleSystemTool(tool.id)}
              id={`tool-${tool.id}`}
            />
            <div>
              <Label htmlFor={`tool-${tool.id}`} className="cursor-pointer font-mono text-xs">{tool.label}</Label>
              <p className="text-xs text-muted-foreground">{tool.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </FormDialog>
  );
}
```

- [ ] **Step 5.3: Criar AgentsList.jsx**

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import AgentCard from './AgentCard';
import AgentEditor from './AgentEditor';

export default function AgentsList() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agentes, isPending } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => entities.Agente.list({}, { pageSize: 50 }),
  });

  const { data: systemToolsData } = useQuery({
    queryKey: ['agente-system-tools'],
    queryFn: () => entities.AgenteSystemTool.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const { systemTools, ...agentData } = form;
      let agentId = form.id;

      if (agentId) {
        await entities.Agente.update(agentId, { ...agentData, updated_at: new Date().toISOString() });
      } else {
        const created = await entities.Agente.create(agentData);
        agentId = created.id;
      }

      // Atualizar system tools: deletar antigas, inserir novas
      // (supabaseEntities não tem delete por filter — usar supabase direto via import)
      const { supabase } = await import('@/lib/supabaseClient');
      await supabase.from('agente_system_tools').delete().eq('agente_id', agentId);
      if (systemTools.length > 0) {
        await supabase.from('agente_system_tools').insert(
          systemTools.map((toolId) => ({ agente_id: agentId, tool_id: toolId }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
      queryClient.invalidateQueries({ queryKey: ['agente-system-tools'] });
      setEditorOpen(false);
      toast({ title: 'Agente salvo!', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' }),
  });

  const handleEdit = (agent) => {
    const agentSystemTools = (systemToolsData ?? [])
      .filter((st) => st.agente_id === agent.id)
      .map((st) => st.tool_id);
    setEditingAgent({ ...agent, systemTools: agentSystemTools });
    setEditorOpen(true);
  };

  if (isPending) {
    return <div className="grid gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Agentes configurados</h2>
        <Button size="sm" onClick={() => { setEditingAgent(null); setEditorOpen(true); }}>
          <Plus size={14} className="mr-1" /> Novo agente
        </Button>
      </div>
      <div className="grid gap-4">
        {(agentes ?? []).map((agent) => (
          <AgentCard key={agent.id} agent={agent} onEdit={handleEdit} />
        ))}
        {agentes?.length === 0 && (
          <p className="text-muted-foreground text-center py-8 text-sm">Nenhum agente cadastrado.</p>
        )}
      </div>
      <AgentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        agent={editingAgent}
        onSave={(form) => saveMutation.mutate(form)}
        saving={saveMutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 5.4: Commit**

```bash
git add src/components/agentes/AgentCard.jsx src/components/agentes/AgentEditor.jsx src/components/agentes/AgentsList.jsx
git commit -m "feat(agentes): lista e editor de agentes (CRUD com modelo, prompt, tools)"
```

---

## Task 6: Frontend — CRUD de Tools SQL Customizadas

**Files:**
- Create: `src/components/agentes/ToolEditor.jsx`
- Create: `src/components/agentes/ToolsList.jsx`

- [ ] **Step 6.1: Criar ToolEditor.jsx**

```jsx
import { useState, useEffect } from 'react';
import { FormDialog, SectionDivider } from '@/components/ui/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const EMPTY = { nome: '', descricao: '', sql_template: '', parametros: [], ativo: true };

const PARAM_TIPOS = [
  { value: 'string', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data (YYYY-MM-DD)' },
  { value: 'uuid', label: 'UUID' },
];

export default function ToolEditor({ open, onOpenChange, tool, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!tool?.id;

  useEffect(() => {
    setForm(tool ? { ...EMPTY, ...tool, parametros: tool.parametros ?? [] } : EMPTY);
  }, [tool, open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addParam = () =>
    set('parametros', [...form.parametros, { nome: '', tipo: 'string', descricao: '' }]);

  const updateParam = (i, key, value) =>
    set('parametros', form.parametros.map((p, idx) => idx === i ? { ...p, [key]: value } : p));

  const removeParam = (i) =>
    set('parametros', form.parametros.filter((_, idx) => idx !== i));

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Editar Tool: ${form.nome}` : 'Nova Tool SQL'}
      subtitle="Tools SQL são chamadas pelo LLM para consultar dados específicos."
      onSave={() => onSave(form)}
      saving={saving}
      saveDisabled={!form.nome || !form.descricao || !form.sql_template}
      maxWidth="max-w-2xl"
    >
      <SectionDivider label="Identificação" />
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Nome da Tool *</Label>
          <Input value={form.nome} onChange={(e) => set('nome', e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="buscar-contratos-ativos" />
          <p className="text-xs text-muted-foreground">Identificador único usado internamente</p>
        </div>
        <div className="space-y-1">
          <Label>Descrição (lida pelo LLM) *</Label>
          <Textarea
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            rows={3}
            placeholder="Busca contratos ativos filtrando por projeto_id e status. Use quando o usuário pedir contratos vigentes ou em andamento."
          />
          <p className="text-xs text-muted-foreground">Descreva QUANDO o LLM deve usar esta tool. Seja preciso.</p>
        </div>
      </div>

      <SectionDivider label="SQL Template (somente leitura)" />
      <div className="space-y-1">
        <Textarea
          value={form.sql_template}
          onChange={(e) => set('sql_template', e.target.value)}
          rows={6}
          className="font-mono text-xs"
          placeholder="SELECT id, titulo, valor FROM contratos WHERE projeto_id = $1 AND status = 'ativo' ORDER BY created_at DESC"
        />
        <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">$1</code>, <code className="bg-muted px-1 rounded">$2</code>... para parâmetros. Somente SELECT — DML é bloqueado.</p>
      </div>

      <SectionDivider label="Parâmetros" />
      <div className="space-y-2">
        {form.parametros.map((param, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_2fr_auto] gap-2 items-start p-2 rounded border border-border">
            <Input placeholder="nome ($1)" value={param.nome} onChange={(e) => updateParam(i, 'nome', e.target.value)} className="text-xs" />
            <Select value={param.tipo} onValueChange={(v) => updateParam(i, 'tipo', v)}>
              <SelectTrigger className="text-xs w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{PARAM_TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="descrição para o LLM" value={param.descricao} onChange={(e) => updateParam(i, 'descricao', e.target.value)} className="text-xs" />
            <Button size="icon" variant="ghost" onClick={() => removeParam(i)}><Trash2 size={14} /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={addParam}><Plus size={14} className="mr-1" /> Adicionar parâmetro</Button>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Switch checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} id="tool-ativo" />
        <Label htmlFor="tool-ativo">Tool ativa</Label>
      </div>
    </FormDialog>
  );
}
```

- [ ] **Step 6.2: Criar ToolsList.jsx**

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Code2 } from 'lucide-react';
import RowActions from '@/components/ui/RowActions';
import ToolEditor from './ToolEditor';

export default function ToolsList() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tools, isPending } = useQuery({
    queryKey: ['agente-tools'],
    queryFn: () => entities.AgenteTool.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (form) => {
      const { id, ...data } = form;
      return id
        ? entities.AgenteTool.update(id, { ...data, updated_at: new Date().toISOString() })
        : entities.AgenteTool.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-tools'] });
      setEditorOpen(false);
      toast({ title: 'Tool salva!', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  if (isPending) return <div className="grid gap-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tools SQL Customizadas</h2>
        <Button size="sm" onClick={() => { setEditingTool(null); setEditorOpen(true); }}>
          <Plus size={14} className="mr-1" /> Nova tool
        </Button>
      </div>
      <div className="grid gap-3">
        {(tools ?? []).map((tool) => (
          <Card key={tool.id} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <Code2 size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium">{tool.nome}</span>
                  {!tool.ativo && <Badge variant="secondary">Inativa</Badge>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tool.descricao}</p>
                {tool.parametros?.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {tool.parametros.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">${i+1}: {p.nome}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <RowActions onEdit={() => { setEditingTool(tool); setEditorOpen(true); }} />
            </CardContent>
          </Card>
        ))}
        {tools?.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">Nenhuma tool criada ainda.</p>}
      </div>
      <ToolEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        tool={editingTool}
        onSave={(form) => saveMutation.mutate(form)}
        saving={saveMutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 6.3: Commit**

```bash
git add src/components/agentes/ToolEditor.jsx src/components/agentes/ToolsList.jsx
git commit -m "feat(agentes): CRUD de tools SQL customizadas"
```

---

## Task 7: Frontend — Dashboard de Métricas & Custos

**Files:**
- Create: `src/components/agentes/MetricsDashboard.jsx`

- [ ] **Step 7.1: Criar MetricsDashboard.jsx**

```jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, DollarSign, Zap, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, defs, linearGradient
} from 'recharts';
import DateRangePicker from '@/components/ui/DateRangePicker';

const COLORS = ['#26405d', '#c35e1e', '#00a49a', '#3b82f6', '#f59e0b', '#ef4444'];

function useLogs(dateFrom, dateTo) {
  return useQuery({
    queryKey: ['agente-uso-logs', dateFrom, dateTo],
    queryFn: () => entities.AgenteUsoLog.list({
      ...(dateFrom ? { created_at_gte: dateFrom } : {}),
      ...(dateTo ? { created_at_lte: dateTo } : {}),
    }),
  });
}

function aggregateByField(logs, field) {
  const acc = {};
  for (const log of logs) {
    const key = log[field] ?? 'N/A';
    if (!acc[key]) acc[key] = { name: key, execucoes: 0, tokens: 0, custo: 0 };
    acc[key].execucoes += 1;
    acc[key].tokens += log.total_tokens ?? 0;
    acc[key].custo += Number(log.custo_usd ?? 0);
  }
  return Object.values(acc).sort((a, b) => b.execucoes - a.execucoes);
}

function aggregateByDay(logs) {
  const acc = {};
  for (const log of logs) {
    const day = log.created_at?.slice(0, 10) ?? 'desconhecido';
    if (!acc[day]) acc[day] = { day, execucoes: 0, custo: 0 };
    acc[day].execucoes += 1;
    acc[day].custo += Number(log.custo_usd ?? 0);
  }
  return Object.values(acc).sort((a, b) => a.day.localeCompare(b.day));
}

export default function MetricsDashboard() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: logs = [], isPending, isError } = useLogs(dateFrom, dateTo);

  const totalExecucoes = logs.length;
  const totalTokens = logs.reduce((s, l) => s + (l.total_tokens ?? 0), 0);
  const totalCusto = logs.reduce((s, l) => s + Number(l.custo_usd ?? 0), 0);
  const custoMedio = totalExecucoes > 0 ? (totalCusto / totalExecucoes) : 0;

  const byAgent = aggregateByField(logs, 'agente_slug');
  const byModel = aggregateByField(logs, 'modelo');
  const byUser = aggregateByField(logs, 'usuario_email').slice(0, 10);
  const byDay = aggregateByDay(logs);

  if (isPending) return <div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (isError) return <p className="text-destructive text-sm">Erro ao carregar métricas.</p>;

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm border rounded px-2 py-1" />
        <span className="text-sm">até</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm border rounded px-2 py-1" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Execuções" value={totalExecucoes.toLocaleString('pt-BR')} icon={<Activity size={16} />} />
        <KPICard label="Total Tokens" value={totalTokens.toLocaleString('pt-BR')} icon={<Zap size={16} />} />
        <KPICard label="Custo Total (USD)" value={`$${totalCusto.toFixed(4)}`} icon={<DollarSign size={16} />} />
        <KPICard label="Custo Médio" value={`$${custoMedio.toFixed(4)}`} icon={<TrendingUp size={16} />} />
      </div>

      {/* Gráfico: execuções ao longo do tempo */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Execuções por dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={byDay}>
              <defs>
                <linearGradient id="grad-exec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#26405d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#26405d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="execucoes" stroke="#26405d" fill="url(#grad-exec)" strokeWidth={2} name="Execuções" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Por agente */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Por Agente</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byAgent} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
                <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} />
                <Bar dataKey="execucoes" name="Execuções" radius={[0, 4, 4, 0]}>
                  {byAgent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por modelo */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Por Modelo</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byModel} dataKey="execucoes" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {byModel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking por usuário */}
      {byUser.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ranking de Usuários</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byUser} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={180} />
                <Tooltip />
                <Bar dataKey="execucoes" name="Execuções" fill="#26405d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 && (
        <p className="text-muted-foreground text-center py-12 text-sm">Nenhuma execução registrada no período.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/components/agentes/MetricsDashboard.jsx
git commit -m "feat(agentes): dashboard de métricas e custos (KPIs + 4 gráficos)"
```

---

## Task 8: Frontend — Aba Provedores

**Files:**
- Create: `src/components/agentes/ProvidersTab.jsx`

- [ ] **Step 8.1: Criar ProvidersTab.jsx**

```jsx
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY', docs: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', docs: 'https://console.anthropic.com' },
  { id: 'google', name: 'Google AI', envKey: 'GOOGLE_GENERATIVE_AI_API_KEY', docs: 'https://aistudio.google.com' },
  { id: 'groq', name: 'Groq', envKey: 'GROQ_API_KEY', docs: 'https://console.groq.com' },
];

export default function ProvidersTab() {
  const { data: precos, isPending } = useQuery({
    queryKey: ['modelo-precos'],
    queryFn: () => entities.ModeloPreco.list({ ativo: true }),
  });

  if (isPending) return <div className="grid gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        As chaves de API são configuradas como variáveis de ambiente no servidor Mastra (<code className="bg-muted px-1 rounded">.env.local</code>).
        A UI não tem acesso às chaves — apenas confirma quais provedores têm agentes configurados.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((provider) => {
          const providerPrecos = (precos ?? []).filter((p) => p.provider === provider.id);
          return (
            <Card key={provider.id} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  {provider.name}
                  <Badge variant="outline" className="font-mono text-xs">{provider.envKey}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Configure em <code className="bg-muted px-1 rounded">agents-mastra/.env.local</code>
                </p>
                {providerPrecos.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left py-1">Modelo</th>
                        <th className="text-right py-1">Input/1k</th>
                        <th className="text-right py-1">Output/1k</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerPrecos.map((p) => (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="py-1 font-mono">{p.modelo}</td>
                          <td className="py-1 text-right">${Number(p.preco_input_1k).toFixed(6)}</td>
                          <td className="py-1 text-right">${Number(p.preco_output_1k).toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum modelo cadastrado.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Commit final**

```bash
git add src/components/agentes/ProvidersTab.jsx
git commit -m "feat(agentes): aba de provedores com tabela de preços por modelo"
```

---

## Verificação End-to-End

- [ ] **V1: Migração**
  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  AND table_name IN ('agentes','agente_tools','agente_uso_logs','modelo_precos');
  -- Esperado: 4 linhas
  SELECT count(*) FROM agentes; -- Esperado: 3 (migrados dos hard-coded)
  ```

- [ ] **V2: Backend dinâmico**
  ```bash
  npm run dev:mastra
  # Log esperado: "[agent-loader] 3 agente(s) carregado(s) do banco."
  curl http://localhost:4111/api/agents
  # Esperado: lista com 3 agentes
  ```

- [ ] **V3: Chat funcional após migração**
  - Abrir `/agentes/executor` → enviar mensagem → resposta ok
  - Abrir Network → ver request para `/mastra-api/api/agents/supabase-analyst-agent/stream`

- [ ] **V4: CRUD de agente**
  - Abrir `/configuracoes/agentes-admin` → aba Agentes → editar "Analista de Dados" → mudar temperatura → salvar
  - Confirmar no banco: `SELECT temperatura FROM agentes WHERE slug = 'supabase-analyst-agent';`
  - Reiniciar Mastra → confirmar que agente carregou com nova temperatura

- [ ] **V5: Tool SQL customizada**
  - Criar tool "buscar-riscos" com SQL `SELECT * FROM riscos WHERE projeto_id = $1 LIMIT 10`
  - Tentar SQL inválido: `DELETE FROM riscos WHERE id = $1` → esperado: erro "Query bloqueada"

- [ ] **V6: Telemetria**
  - Rodar 3 execuções no chat
  - `SELECT agente_slug, usuario_email, latencia_ms FROM agente_uso_logs ORDER BY created_at DESC LIMIT 5;`
  - Abrir aba "Métricas & Custos" → ver KPI "Execuções" ≥ 3

- [ ] **V7: Build**
  ```bash
  npm run build
  # Esperado: sem erros
  ```
