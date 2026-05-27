import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAnalystAgent } from '../agents/supabase-analyst-agent';

export const queryExecutorTool = createTool({
  id: 'query-database',
  description:
    'Envia uma pergunta precisa e estruturada ao executor SQL para buscar dados no banco. Use somente quando já tiver todos os parâmetros necessários: projeto, período e escopo da análise.',
  inputSchema: z.object({
    question: z
      .string()
      .describe(
        'Pergunta completa e específica para o executor. Inclua o project_id, período e quaisquer filtros relevantes.'
      ),
  }),
  outputSchema: z.object({
    data: z.string(),
  }),
  execute: async (input) => {
    const response = await supabaseAnalystAgent.generate([
      { role: 'user', content: input.question },
    ]);
    return { data: response.text };
  },
});
