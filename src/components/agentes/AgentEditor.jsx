import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Check, ArrowLeft, ArrowRight } from 'lucide-react';

const PROVIDERS = [
  { value: 'openai',    label: 'OpenAI',    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o1-mini'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8'] },
  { value: 'google',    label: 'Google',    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { value: 'groq',      label: 'Groq',      models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'] },
];

const SYSTEM_TOOLS = [
  { id: 'get-schema',     label: 'get-schema',     desc: 'Lê a estrutura do banco de dados' },
  { id: 'execute-sql',    label: 'execute-sql',     desc: 'Executa queries SELECT no banco' },
  { id: 'analyze-table',  label: 'analyze-table',   desc: 'Estatísticas e análise de tabela' },
  { id: 'query-database', label: 'query-database',  desc: 'Delega consulta ao Executor de Dados' },
];

const STEPS = [
  { key: 'identidade', label: 'Identidade' },
  { key: 'modelo',     label: 'Modelo' },
  { key: 'prompt',     label: 'Prompt' },
  { key: 'tools',      label: 'Tools' },
];

const EMPTY = {
  slug: '', nome: '', descricao: '', icone: 'Bot', cor: '#26405d',
  provider: 'openai', modelo: 'gpt-4o-mini',
  temperatura: null, max_tokens: null,
  instructions: '', injetar_schema: false, injetar_data: true, forcar_projeto: true,
  sugestoes: [], ativo: true,
};

export default function AgentEditor({ agent, systemTools = [], onCancel, onSaved }) {
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));
  const [form, setForm] = useState(EMPTY);
  const [selectedTools, setSelectedTools] = useState([]);
  const [sugestaoInput, setSugestaoInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!agent?.id;

  useEffect(() => {
    if (agent) {
      setForm({ ...EMPTY, ...agent });
      setSelectedTools(systemTools);
    } else {
      setForm(EMPTY);
      setSelectedTools([]);
    }
    setStep(0);
    setVisited(new Set([0]));
  }, [agent]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const currentProvider = PROVIDERS.find(p => p.value === form.provider) ?? PROVIDERS[0];

  const goTo = (idx) => {
    setVisited(v => new Set([...v, idx]));
    setStep(idx);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug,
        nome: form.nome,
        descricao: form.descricao || null,
        icone: form.icone || 'Bot',
        cor: form.cor || '#26405d',
        provider: form.provider,
        modelo: form.modelo,
        temperatura: form.temperatura,
        max_tokens: form.max_tokens,
        instructions: form.instructions,
        injetar_schema: form.injetar_schema,
        injetar_data: form.injetar_data,
        forcar_projeto: form.forcar_projeto,
        sugestoes: form.sugestoes,
        ativo: form.ativo,
        updated_at: new Date().toISOString(),
      };

      let agentId = agent?.id;
      if (isEditing) {
        await entities.Agente.update(agentId, payload);
      } else {
        const created = await entities.Agente.create(payload);
        agentId = created.id;
      }

      // Sync system tools
      await supabase.from('agente_system_tools').delete().eq('agente_id', agentId);
      if (selectedTools.length > 0) {
        await supabase.from('agente_system_tools').insert(
          selectedTools.map(toolId => ({ agente_id: agentId, tool_id: toolId }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
      queryClient.invalidateQueries({ queryKey: ['agente-system-tools'] });
      toast({ title: isEditing ? 'Agente atualizado!' : 'Agente criado!', variant: 'success' });
      onSaved?.();
    },
    onError: err => toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' }),
  });

  const addSugestao = () => {
    const val = sugestaoInput.trim();
    if (!val) return;
    set('sugestoes', [...(form.sugestoes || []), val]);
    setSugestaoInput('');
  };

  const toggleTool = (toolId) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  // ── Stepper header ──────────────────────────────────────────────────────────
  const StepperHeader = () => (
    <div className="flex items-center gap-0 py-4 px-6 border-b border-border bg-card">
      {STEPS.map((s, idx) => {
        const isDone   = visited.has(idx) && idx < step;
        const isActive = idx === step;
        return (
          <div key={s.key} className="flex items-center" style={{ flex: idx < STEPS.length - 1 ? '1' : 'none' }}>
            <button
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => visited.has(idx) && goTo(idx)}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                isDone   ? 'bg-green-600 text-white' :
                isActive ? 'bg-[hsl(210_62%_16%)] text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <Check size={12} /> : idx + 1}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">
                  Passo {idx + 1}
                </div>
                <div className={`text-xs font-semibold leading-tight ${
                  isDone   ? 'text-green-600' :
                  isActive ? 'text-[hsl(210_62%_16%)]' :
                  'text-muted-foreground'
                }`}>
                  {s.label}
                </div>
              </div>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded-full ${isDone ? 'bg-green-600' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Passo 1: Identidade ─────────────────────────────────────────────────────
  const StepIdentidade = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">Identidade & Apresentação</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Nome, ícone e como o agente aparece no chat</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Nome *</Label>
          <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Analista de Dados" />
        </div>
        <div className="space-y-1">
          <Label>Slug / endpoint {isEditing && <span className="text-muted-foreground">(imutável)</span>}</Label>
          <Input
            value={form.slug}
            onChange={e => !isEditing && set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
            placeholder="analista-dados"
            disabled={isEditing}
            className={isEditing ? 'font-mono text-muted-foreground bg-muted' : 'font-mono'}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Descrição</Label>
        <Input value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Para que serve este agente?" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Ícone (lucide-react)</Label>
          <Input value={form.icone} onChange={e => set('icone', e.target.value)} placeholder="Bot" />
        </div>
        <div className="space-y-1">
          <Label>Cor</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={form.cor}
              onChange={e => set('cor', e.target.value)}
              className="h-9 w-12 rounded border border-border cursor-pointer p-0.5"
            />
            <Input value={form.cor} onChange={e => set('cor', e.target.value)} className="font-mono" />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <div className="flex items-center gap-2 h-9">
            <Switch checked={form.ativo} onCheckedChange={v => set('ativo', v)} id="sw-ativo" />
            <label htmlFor="sw-ativo" className={`text-sm font-medium cursor-pointer ${form.ativo ? 'text-green-600' : 'text-muted-foreground'}`}>
              {form.ativo ? 'Ativo' : 'Inativo'}
            </label>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Sugestões de prompt</Label>
        <div className="flex gap-2">
          <Input
            value={sugestaoInput}
            onChange={e => setSugestaoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSugestao())}
            placeholder="Digite uma sugestão e pressione Enter"
          />
          <Button type="button" variant="outline" size="sm" onClick={addSugestao}><Plus size={14} /></Button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[28px]">
          {(form.sugestoes || []).map((s, i) => (
            <Badge key={i} variant="secondary" className="gap-1 text-xs pr-1">
              {s}
              <button
                onClick={() => set('sugestoes', form.sugestoes.filter((_, j) => j !== i))}
                className="hover:text-destructive"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Passo 2: Modelo ─────────────────────────────────────────────────────────
  const StepModelo = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">Modelo de Linguagem</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Provider, modelo e parâmetros de geração</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Provider</Label>
          <Select value={form.provider} onValueChange={v => { set('provider', v); set('modelo', PROVIDERS.find(p => p.value === v)?.models[0] ?? ''); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Modelo</Label>
          <Select value={form.modelo} onValueChange={v => set('modelo', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{currentProvider.models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="p-3 rounded-md border border-border bg-muted/30 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold">Chave API — {currentProvider.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Gerenciada via variável de ambiente no servidor Mastra. Não editável pela UI.</p>
        </div>
        <Badge className="bg-green-600 text-white text-xs">✓ Configurada</Badge>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Temperatura: <span className="font-bold text-foreground">{form.temperatura ?? 'padrão'}</span></Label>
          <Slider
            min={0} max={2} step={0.1}
            value={[form.temperatura ?? 1]}
            onValueChange={([v]) => set('temperatura', v === 1 ? null : v)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground">0 = determinístico · 2 = muito criativo · padrão = recomendado</p>
        </div>
        <div className="space-y-1">
          <Label>Max Tokens</Label>
          <Input
            type="number"
            value={form.max_tokens ?? ''}
            onChange={e => set('max_tokens', e.target.value ? Number(e.target.value) : null)}
            placeholder="Sem limite"
          />
          <p className="text-xs text-muted-foreground">Deixe vazio para usar o limite do modelo</p>
        </div>
      </div>
    </div>
  );

  // ── Passo 3: Prompt ─────────────────────────────────────────────────────────
  const StepPrompt = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">Prompt (System Instructions)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">O que o agente é e como deve se comportar</p>
      </div>
      <div className="space-y-1">
        <Label>Instructions *</Label>
        <Textarea
          value={form.instructions}
          onChange={e => set('instructions', e.target.value)}
          rows={12}
          className="font-mono text-xs resize-y"
          placeholder="Você é um especialista em..."
        />
      </div>
      <div className="p-4 rounded-md border border-border bg-muted/30 space-y-3">
        <p className="text-xs font-semibold text-foreground">Injeção automática no prompt</p>
        {[
          { key: 'injetar_schema', label: 'Injetar schema do banco', desc: 'Adiciona tabelas/colunas a cada execução' },
          { key: 'injetar_data',   label: 'Injetar data atual',       desc: 'Contexto temporal (hoje, semanas recentes)' },
          { key: 'forcar_projeto', label: 'Forçar filtro por projeto', desc: 'Garante projeto_id presente sempre' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-start gap-3">
            <Switch checked={form[key]} onCheckedChange={v => set(key, v)} id={`sw-${key}`} className="mt-0.5" />
            <div>
              <label htmlFor={`sw-${key}`} className="text-sm font-medium cursor-pointer">{label}</label>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Variáveis disponíveis:{' '}
        <code className="bg-muted px-1 rounded">{'{schema}'}</code>{' '}
        <code className="bg-muted px-1 rounded">{'{hoje}'}</code>{' '}
        <code className="bg-muted px-1 rounded">{'{projeto_id}'}</code>
      </p>
    </div>
  );

  // ── Passo 4: Tools ──────────────────────────────────────────────────────────
  const StepTools = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">Tools de Sistema</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Capacidades disponíveis para este agente</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SYSTEM_TOOLS.map(tool => {
          const active = selectedTools.includes(tool.id);
          return (
            <div
              key={tool.id}
              className={`flex items-start gap-2 p-3 rounded-md border transition-colors cursor-pointer ${
                active ? 'border-[hsl(210_62%_16%/30%)] bg-[hsl(210_62%_16%/5%)]' : 'border-border bg-card'
              }`}
              onClick={() => toggleTool(tool.id)}
            >
              <Switch checked={active} onCheckedChange={() => toggleTool(tool.id)} className="mt-0.5" />
              <div>
                <p className="font-mono text-xs font-semibold">{tool.label}</p>
                <p className="text-xs text-muted-foreground">{tool.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">Tools SQL Customizadas</p>
        <div className="p-4 rounded-md border border-dashed border-border bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground">
            Crie tools SQL customizadas na aba <strong>Tools</strong> e vincule-as ao agente.
          </p>
        </div>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={onCancel} className="hover:text-foreground transition-colors">Admin de Agentes</button>
          <span>/</span>
          <span className="text-foreground font-semibold">{isEditing ? agent.nome : 'Novo Agente'}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.nome || !form.slug || !form.instructions}
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <StepperHeader />

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          {step === 0 && <StepIdentidade />}
          {step === 1 && <StepModelo />}
          {step === 2 && <StepPrompt />}
          {step === 3 && <StepTools />}
        </div>
      </div>

      {/* Footer de navegação */}
      <div className="border-t border-border bg-card px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Passo {step + 1} de {STEPS.length}</span>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => goTo(step - 1)}>
              <ArrowLeft size={14} className="mr-1" /> {STEPS[step - 1].label}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button size="sm" className="bg-[hsl(210_62%_16%)] hover:bg-[hsl(210_62%_20%)] text-white" onClick={() => goTo(step + 1)}>
              Próximo: {STEPS[step + 1].label} <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.nome || !form.slug || !form.instructions}
            >
              <Check size={14} className="mr-1" /> Concluir e Salvar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
