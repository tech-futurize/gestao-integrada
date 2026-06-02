import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4o, GPT-4o-mini e família GPT',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://console.anthropic.com',
    description: 'Claude Opus, Sonnet e Haiku',
  },
  {
    id: 'google',
    name: 'Google AI',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    docsUrl: 'https://aistudio.google.com',
    description: 'Gemini 2.0 Flash e família Gemini',
  },
  {
    id: 'groq',
    name: 'Groq',
    envKey: 'GROQ_API_KEY',
    docsUrl: 'https://console.groq.com',
    description: 'Llama, Mixtral e Gemma via Groq Cloud',
  },
];

export default function ProvidersTab() {
  const { data: precos = [], isPending } = useQuery({
    queryKey: ['modelo-precos'],
    queryFn: () => entities.ModeloPreco.list({ ativo: true }),
  });

  const precosByProvider = (providerId) =>
    precos.filter(p => p.provider === providerId);

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
        <p>
          As chaves de API são configuradas como variáveis de ambiente no servidor Mastra
          (<code className="bg-muted px-1 rounded text-xs">agents-mastra/.env.local</code> ou via CI/CD).
          Esta interface mostra quais provedores têm modelos cadastrados e seus preços para cálculo de custo.
        </p>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVIDERS.map(provider => {
            const providerPrecos = precosByProvider(provider.id);
            return (
              <Card key={provider.id} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold">{provider.name}</span>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">{provider.description}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      {provider.envKey}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Configure em{' '}
                    <code className="bg-muted px-1 rounded">agents-mastra/.env.local</code>
                  </p>

                  {providerPrecos.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhum modelo cadastrado para este provider.
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 text-muted-foreground font-semibold">Modelo</th>
                          <th className="text-right py-1.5 text-muted-foreground font-semibold">Input / 1k</th>
                          <th className="text-right py-1.5 text-muted-foreground font-semibold">Output / 1k</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providerPrecos.map(p => (
                          <tr key={p.id} className="border-b border-border/40">
                            <td className="py-1.5 font-mono">{p.modelo}</td>
                            <td className="py-1.5 text-right text-muted-foreground">
                              ${Number(p.preco_input_1k).toFixed(6)}
                            </td>
                            <td className="py-1.5 text-right text-muted-foreground">
                              ${Number(p.preco_output_1k).toFixed(6)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
