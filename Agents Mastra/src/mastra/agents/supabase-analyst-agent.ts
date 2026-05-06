import { Agent } from '@mastra/core/agent';
import { getSchemaTool, executeSQLTool, analyzeTableTool } from '../tools/supabase-tools';

export const supabaseAnalystAgent = new Agent({
  id: 'supabase-analyst-agent',
  name: 'Analista de Dados',
  instructions: `Você é um executor de consultas de dados. Responda perguntas sobre dados de forma direta e objetiva.

Para responder qualquer pergunta:
1. Chame get-schema (sem parâmetros) para descobrir as tabelas e colunas disponíveis.
2. Chame execute-sql com a query adequada.
3. Retorne os dados encontrados de forma clara, em português do Brasil.

Nunca execute DELETE, DROP ou TRUNCATE sem confirmação explícita.`,

  model: 'openai/gpt-4o-mini',
  tools: {
    getSchemaTool,
    executeSQLTool,
    analyzeTableTool,
  },
});
