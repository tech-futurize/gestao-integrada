import { useState, useEffect } from 'react';
import { FormDialog } from '@/components/ui/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Lock } from 'lucide-react';

const PARAM_TIPOS = [
  { value: 'string', label: 'Texto (string)' },
  { value: 'number', label: 'Número (number)' },
  { value: 'date',   label: 'Data (YYYY-MM-DD)' },
  { value: 'uuid',   label: 'UUID' },
];

// Descrição interna de cada tool de sistema — lida pelo desenvolvedor/admin, não pelo LLM
const SYSTEM_BEHAVIOR = {
  'get-schema': `Chama a RPC get_db_schema() no Supabase (SECURITY DEFINER).
Retorna lista de todas as tabelas visíveis, com colunas, tipos de dados e constraints (PK, FK, NOT NULL).
Usado para que o LLM conheça a estrutura do banco antes de construir queries.`,
  'execute-sql': `Chama a RPC exec_readonly_sql(query TEXT) no Supabase (SECURITY DEFINER).
Somente SELECT é permitido — qualquer tentativa de DML (INSERT, UPDATE, DELETE) ou DDL (DROP, ALTER) é bloqueada por regex antes de chegar ao banco.
Retorna as linhas resultantes como JSON.`,
  'analyze-table': `Executa SELECT COUNT(*) FROM <tabela> no banco.
Retorna o número total de registros da tabela informada pelo LLM.
Útil para saber se uma tabela está vazia ou para calibrar o escopo de uma query.`,
  'query-database': `Delega a consulta a um agente especializado em dados.
Usado por outros agentes que precisam de dados mas não executam SQL diretamente.
O agente de destino recebe a pergunta em linguagem natural e retorna o resultado.`,
};

const EMPTY = {
  nome: '', descricao: '', sql_template: '', parametros: [], ativo: true,
};

export default function ToolEditor({ open, onOpenChange, tool, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!tool?.id;
  const isSystemTool = !!tool?.is_system;

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

  const canSave = form.nome.trim() && form.descricao.trim() && (isSystemTool || form.sql_template.trim());

  const behavior = isSystemTool ? (SYSTEM_BEHAVIOR[tool?.tool_key ?? tool?.nome] ?? null) : null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditing
          ? <span className="flex items-center gap-2">
              {isSystemTool && <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-0">Sistema</Badge>}
              {!isSystemTool && <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-0">SQL</Badge>}
              {form.nome}
            </span>
          : 'Nova Tool SQL'
      }
      subtitle={
        isSystemTool
          ? 'Tool nativa do executor. Edite a descrição que o LLM usa para decidir quando chamá-la.'
          : 'Tools SQL são chamadas pelo LLM para consultar dados específicos.'
      }
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
          <p className="text-xs text-muted-foreground">Identificador único, usado internamente pelo LLM.</p>
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
            Descreva <strong>quando</strong> o LLM deve usar esta tool. O modelo decide com base neste texto.
          </p>
        </div>

        {/* Comportamento interno — apenas tools de sistema */}
        {isSystemTool && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label>Comportamento interno</Label>
              <Lock size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">(somente leitura)</span>
            </div>
            <Textarea
              value={behavior ?? 'Implementação não documentada.'}
              readOnly
              rows={5}
              className="font-mono text-xs resize-none bg-muted/50 text-muted-foreground cursor-default"
            />
            <p className="text-xs text-muted-foreground">
              O que esta tool executa internamente no servidor. Não editável — definido no código da Edge Function.
            </p>
          </div>
        )}

        {/* SQL Template — apenas tools SQL customizadas */}
        {!isSystemTool && (
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
        )}

        {/* Parâmetros — apenas tools SQL customizadas */}
        {!isSystemTool && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Parâmetros</Label>
              <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={addParam}>
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
        )}

        {/* Status */}
        <div className="flex items-center gap-2">
          <Switch checked={form.ativo} onCheckedChange={v => set('ativo', v)} id="tool-ativo" />
          <label htmlFor="tool-ativo" className="text-sm font-medium cursor-pointer">Tool ativa</label>
        </div>
      </div>
    </FormDialog>
  );
}
