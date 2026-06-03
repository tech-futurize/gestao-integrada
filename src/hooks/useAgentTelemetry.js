import { useMutation } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';

export function useAgentTelemetry() {
  const { mutate } = useMutation({
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
        usuario_email: usuarioEmail ?? null,
        projeto_id: projetoId ?? null,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        latencia_ms: latenciaMs ?? null,
        status,
        thread_id: threadId ?? null,
      });
    },
    onError: (err) => { if (import.meta.env.DEV) console.warn('[telemetry] Falha ao gravar log de uso:', err.message); },
  });

  return mutate;
}
