import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { supabaseAnalystAgent } from './agents/supabase-analyst-agent';
import { businessAnalystAgent } from './agents/business-analyst-agent';
import { contractualAnalystAgent } from './agents/contractual-analyst-agent';
import { loadSchema } from './schema/schema-loader';

loadSchema().catch((err) => console.warn('[schema-loader] Falha ao pré-carregar schema:', err));

export const mastra = new Mastra({
  agents: { supabaseAnalystAgent, businessAnalystAgent, contractualAnalystAgent },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
