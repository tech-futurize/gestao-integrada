import { useState, useEffect } from 'react';
import { FormDialog } from '@/components/ui/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const PARAM_TIPOS = [
  { value: 'string', label: 'Texto (string)' },
  { value: 'number', label: 'Número (number)' },
  { value: 'date',   label: 'Data (YYYY-MM-DD)' },
  { value: 'uuid',   label: 'UUID' },
];

const EMPTY = {
  nome: '', descricao: '', sql_template: '', parametros: [], ativo: true,
};

export default function ToolEditor({ open, onOpenChange, tool, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!tool?.id;

  useEffect(() => {
    setForm(tool ? { ...EMPTY, ...tool, parametros: tool.parametros ?? [] } : EMPTY);
  }, [tool, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addParam = () =>
    set('parametros', [...form.parametros, { nome: '', tipo: 'string', descricao: '' }]);

  const updateParam = (i, key, val) =>
    set('parametros', form.parametros.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  const removeParam = (i) =>
    set('parametros', form.parametros.filter((_, idx) => idx !== i));

  const canSave = form.nome.trim() && form.descricao.trim() && form.sql_template.trim();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Editar Tool: ${form.nome}` : 'Nova Tool SQL'}
      subtitle="Tools SQL são chamadas pelo LLM para consultar dados específicos."
      onSave={() => onSave(form)}
      saving={saving}
      saveDisabled={!canSave}
      saveLabel={isEditing ? 'Salvar' : 'Criar'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-1">
          <Label>Nome da Tool *</Label>
          <Input
            value={form.nome}
            onChange={e => set('nome', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
            placeholder="buscar-contratos-ativos"
            className="font-mono"
            disabled={isEditing}
          />
          <p className="text-xs text-muted-foreground">Identificador único, usado internamente.</p>
        </div>

        {/* Descrição para o LLM */}
        <div className="space-y-1">
          <Label>Descrição (lida pelo LLM) *</Label>
          <Textarea
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
            rows={3}
            placeholder="Busca contratos ativos do projeto. Use quando o usuário pedir contratos vigentes ou em andamento."
          />
          <p className="text-xs text-muted-foreground">
            Descreva <strong>quando</strong> o LLM deve usar esta tool. Seja preciso — o modelo decide com base neste texto.
          </p>
        </div>

        {/* SQL Template */}
        <div className="space-y-1">
          <Label>SQL Template (somente SELECT) *</Label>
          <Textarea
            value={form.sql_template}
            onChange={e => set('sql_template', e.target.value)}
            rows={6}
            className="font-mono text-xs resize-y"
            placeholder={`SELECT id, titulo, valor\nFROM contratos\nWHERE projeto_id = $1\n  AND status = 'ativo'\nORDER BY created_at DESC`}
          />
          <p className="text-xs text-muted-foreground">
            Use <code className="bg-muted px-1 rounded">$1</code>, <code className="bg-muted px-1 rounded">$2</code>... para parâmetros.
            Somente SELECT — DML/DDL são bloqueados automaticamente.
          </p>
        </div>

        {/* Parâmetros */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Parâmetros</Label>
            <Button type="button" variant="outline" size="sm" onClick={addParam}>
              <Plus size={12} className="mr-1" /> Adicionar
            </Button>
          </div>
          {form.parametros.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Sem parâmetros. Adicione caso o SQL use $1, $2...</p>
          ) : (
            <div className="space-y-2">
              {form.parametros.map((param, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_2fr_32px] gap-2 items-start p-2 rounded-md border border-border bg-muted/20">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">${i + 1} Nome</p>
                    <Input
                      value={param.nome}
                      onChange={e => updateParam(i, 'nome', e.target.value)}
                      placeholder="projeto_id"
                      className="text-xs font-mono h-8"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                    <Select value={param.tipo} onValueChange={v => updateParam(i, 'tipo', v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PARAM_TIPOS.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição para o LLM</p>
                    <Input
                      value={param.descricao}
                      onChange={e => updateParam(i, 'descricao', e.target.value)}
                      placeholder="UUID do projeto ativo"
                      className="text-xs h-8"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mt-5 text-muted-foreground hover:text-destructive"
                    onClick={() => removeParam(i)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Switch checked={form.ativo} onCheckedChange={v => set('ativo', v)} id="tool-ativo" />
          <label htmlFor="tool-ativo" className="text-sm font-medium cursor-pointer">Tool ativa</label>
        </div>
      </div>
    </FormDialog>
  );
}
