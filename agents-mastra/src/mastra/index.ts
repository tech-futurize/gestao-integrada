import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { loadSchema } from './schema/schema-loader';
import { loadAgentsFromDB } from './loaders/agent-loader';

loadSchema().catch((err) => console.warn('[schema-loader] Falha ao pré-carregar schema:', err));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agents: Record<string, any> = {};

try {
  agents = await loadAgentsFromDB();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`[mastra] ⚠️  Falha ao carregar agentes do banco: ${msg}`);
  console.warn('[mastra] Usando agentes estáticos como fallback.');
  const { supabaseAnalystAgent } = await import('./agents/supabase-analyst-agent');
  const { businessAnalystAgent }  = await import('./agents/business-analyst-agent');
  const { contractualAnalystAgent } = await import('./agents/contractual-analyst-agent');
  agents = {
    'supabase-analyst-agent': supabaseAnalystAgent,
    'business-analyst-agent': businessAnalystAgent,
    'contractual-analyst-agent': contractualAnalystAgent,
  };
  console.info(`[mastra] ${Object.keys(agents).length} agente(s) estático(s) carregado(s).`);
}

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
