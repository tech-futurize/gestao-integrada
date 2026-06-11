import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormDialog } from '@/components/ui/FormDialog';
import { Eye, EyeOff, Key, CheckCircle2, AlertCircle } from 'lucide-react';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    description: 'GPT-4o, GPT-4o-mini e família GPT',
    prefix: 'sk-',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    description: 'Claude Opus, Sonnet e Haiku',
    prefix: 'sk-ant-',
  },
  {
    id: 'google',
    name: 'Google AI',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    description: 'Gemini 2.0 Flash e família Gemini',
    prefix: 'AIza',
  },
  {
    id: 'groq',
    name: 'Groq',
    envKey: 'GROQ_API_KEY',
    description: 'Llama, Mixtral e Gemma via Groq Cloud (inferência rápida)',
    prefix: 'gsk_',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    envKey: 'MISTRAL_API_KEY',
    description: 'Mistral Large, Mistral Small e Codestral',
    prefix: '',
    staticModelos: [
      { modelo: 'mistral-large-2',  preco_input_1k: 0.002000, preco_output_1k: 0.006000 },
      { modelo: 'mistral-small-3',  preco_input_1k: 0.000100, preco_output_1k: 0.000300 },
      { modelo: 'codestral-2501',   preco_input_1k: 0.000300, preco_output_1k: 0.000900 },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    envKey: 'PERPLEXITY_API_KEY',
    description: 'Sonar Pro e Sonar Reasoning (modelos com busca na web)',
    prefix: 'pplx-',
    staticModelos: [
      { modelo: 'sonar-pro',       preco_input_1k: 0.003000, preco_output_1k: 0.015000 },
      { modelo: 'sonar',           preco_input_1k: 0.001000, preco_output_1k: 0.001000 },
      { modelo: 'sonar-reasoning', preco_input_1k: 0.002000, preco_output_1k: 0.008000 },
    ],
  },
  {
    id: 'xai',
    name: 'xAI',
    envKey: 'XAI_API_KEY',
    description: 'Grok-3 e Grok-3 mini da xAI',
    prefix: 'xai-',
    staticModelos: [
      { modelo: 'grok-3',          preco_input_1k: 0.003000, preco_output_1k: 0.015000 },
      { modelo: 'grok-3-mini',     preco_input_1k: 0.000300, preco_output_1k: 0.000500 },
      { modelo: 'grok-2',          preco_input_1k: 0.002000, preco_output_1k: 0.010000 },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    description: 'DeepSeek V3 e DeepSeek R1 (raciocínio)',
    prefix: 'sk-',
    staticModelos: [
      { modelo: 'deepseek-chat',   preco_input_1k: 0.000140, preco_output_1k: 0.000280 },
      { modelo: 'deepseek-reasoner', preco_input_1k: 0.000550, preco_output_1k: 0.002190 },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    envKey: 'TOGETHER_API_KEY',
    description: 'Meta Llama 3, Qwen e outros modelos open-source',
    prefix: '',
    staticModelos: [
      { modelo: 'Llama-3.3-70B',   preco_input_1k: 0.000540, preco_output_1k: 0.000540 },
      { modelo: 'Qwen2.5-72B',     preco_input_1k: 0.000400, preco_output_1k: 0.000400 },
      { modelo: 'Llama-3.2-90B',   preco_input_1k: 0.001200, preco_output_1k: 0.001200 },
    ],
  },
];

function KeyDialog({ provider, config, open, onOpenChange, onSaved }) {
  const [keyValue, setKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () =>
      entities.ProviderConfig.update(config.id, {
        api_key: keyValue.trim() || null,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-configs'] });
      toast({ title: `Chave ${provider.name} salva!`, variant: 'success' });
      setKeyValue('');
      onSaved?.();
    },
    onError: (err) => toast({ title: 'Erro ao salvar chave', description: err.message, variant: 'destructive' }),
  });

  const handleOpen = (isOpen) => {
    if (isOpen) setKeyValue('');
    onOpenChange(isOpen);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpen}
      title={`Configurar chave — ${provider.name}`}
      subtitle={`Variável de ambiente: ${provider.envKey}`}
      onSave={() => saveMutation.mutate()}
      saving={saveMutation.isPending}
      saveLabel="Salvar chave"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200">
          <p className="font-semibold mb-1">⚠️ Segurança</p>
          <p>A chave é armazenada no banco de dados com acesso restrito a administradores (RLS). Nunca compartilhe esta chave.</p>
        </div>

        <div className="space-y-1.5">
          <Label>API Key</Label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder={`${provider.prefix}...`}
              className="pr-10 font-mono text-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {config?.api_key
              ? 'Uma chave já está configurada. Digite uma nova para substituí-la, ou deixe vazio para remover.'
              : 'Nenhuma chave configurada ainda.'}
          </p>
        </div>
      </div>
    </FormDialog>
  );
}

export default function ProvidersTab() {
  const [editingProvider, setEditingProvider] = useState(null);

  const { data: configs = [], isPending } = useQuery({
    queryKey: ['provider-configs'],
    queryFn: () => entities.ProviderConfig.list(),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: precos = [] } = useQuery({
    queryKey: ['modelo-precos'],
    queryFn: () => entities.ModeloPreco.list({ ativo: true }),
  });

  const getConfig = (providerId) => configs.find((c) => c.provider === providerId);
  const getPrecos = (provider) => {
    const dbPrecos = precos.filter((p) => p.provider === provider.id);
    if (dbPrecos.length > 0) return { rows: dbPrecos, isStatic: false };
    if (provider.staticModelos?.length > 0) return { rows: provider.staticModelos.map((m, i) => ({ id: i, ...m })), isStatic: true };
    return { rows: [], isStatic: false };
  };
  const hasKey = (providerId) => !!getConfig(providerId)?.api_key;

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-56" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
        As API keys configuradas aqui são carregadas pelo servidor Mastra no startup.
        Se uma chave também estiver definida no arquivo <code className="bg-muted px-1 rounded text-xs">agents-mastra/.env.local</code>,
        o arquivo local tem prioridade.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((provider) => {
          const { rows: providerPrecos, isStatic } = getPrecos(provider);
          const isConfigured = hasKey(provider.id);

          return (
            <Card key={provider.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold">{provider.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
                  </div>
                  {isConfigured ? (
                    <Badge className="bg-green-600 text-white text-xs gap-1 shrink-0">
                      <CheckCircle2 size={11} /> Configurada
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                      <AlertCircle size={11} /> Não configurada
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs truncate min-w-0 max-w-[55%]"
                    title={provider.envKey}
                  >
                    {provider.envKey}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={() => setEditingProvider(provider.id)}
                  >
                    <Key size={12} />
                    {isConfigured ? 'Atualizar chave' : 'Configurar chave'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {providerPrecos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum modelo com preço cadastrado.</p>
                ) : (
                  <>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 text-muted-foreground font-semibold">Modelo</th>
                          <th className="text-right py-1.5 text-muted-foreground font-semibold">Input/1k</th>
                          <th className="text-right py-1.5 text-muted-foreground font-semibold">Output/1k</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providerPrecos.map((p) => (
                          <tr key={p.id} className="border-b border-border/40">
                            <td className="py-1.5 font-mono">{p.modelo}</td>
                            <td className="py-1.5 text-right text-muted-foreground">${Number(p.preco_input_1k).toFixed(4)}</td>
                            <td className="py-1.5 text-right text-muted-foreground">${Number(p.preco_output_1k).toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {isStatic && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5 italic">* Preços aproximados — atualize via banco de dados.</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingProvider && (
        <KeyDialog
          provider={PROVIDERS.find((p) => p.id === editingProvider)}
          config={getConfig(editingProvider)}
          open={!!editingProvider}
          onOpenChange={(open) => !open && setEditingProvider(null)}
          onSaved={() => setEditingProvider(null)}
        />
      )}
    </div>
  );
}
