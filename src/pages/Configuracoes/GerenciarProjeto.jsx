import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, CheckCircle, Clock, PauseCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/lib/ProjectContext";

const STATUS_OPTIONS = ["Planejamento", "Em Andamento", "Pausado", "Concluído", "Cancelado"];

const STATUS_CFG = {
  Planejamento: { icon: Clock, color: "#3b82f6", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  "Em Andamento": { icon: CheckCircle, color: "#16a34a", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  Pausado: { icon: PauseCircle, color: "#d97706", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  Concluído: { icon: CheckCircle, color: "#6b7280", bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  Cancelado: { icon: XCircle, color: "#ef4444", bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const EMPTY_FORM = {
  nome: "", descricao: "", status: "Planejamento", data_inicio: "", data_fim_prevista: "",
  cliente: "", responsavel: "", contrato_numero: "", valor_contrato: "",
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function GerenciarProjeto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setSelectedProjectId } = useProject();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewItem, setViewItem] = useState(null);

  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ["projetos"],
    queryFn: () => entities.Projeto.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.Projeto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Projeto criado com sucesso." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Projeto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Projeto atualizado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Projeto.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projetos"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleEdit = (projeto) => {
    setEditing(projeto);
    setForm({
      nome: projeto.nome || "",
      descricao: projeto.descricao || "",
      status: projeto.status || "Planejamento",
      data_inicio: projeto.data_inicio || "",
      data_fim_prevista: projeto.data_prevista_termino || "",
      cliente: projeto.cliente || "",
      responsavel: projeto.responsavel_geral || "",
      contrato_numero: projeto.contrato_numero || "",
      valor_contrato: projeto.valor_contrato ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.nome.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o nome do projeto.", variant: "destructive" });
      return;
    }
    if (!form.cliente.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o cliente do projeto.", variant: "destructive" });
      return;
    }
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao,
      status: form.status,
      data_inicio: form.data_inicio || null,
      data_prevista_termino: form.data_fim_prevista || null,
      cliente: form.cliente.trim(),
      responsavel_geral: form.responsavel,
      contrato_numero: form.contrato_numero,
      valor_contrato: parseFloat(form.valor_contrato) || 0,
    };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const handleSelect = (projetoId) => {
    setSelectedProjectId(projetoId);
    toast({ variant: "success", description: "Projeto selecionado com sucesso." });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Novo Projeto
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Cards de Projetos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : projetos.length === 0 ? (
        <PageEmptyState icon={Settings} description="Nenhum projeto cadastrado. Crie o primeiro projeto." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projetos.map(p => {
            const cfg = STATUS_CFG[p.status] || STATUS_CFG.Planejamento;
            const _StatusIcon = cfg.icon;
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base leading-tight truncate">{p.nome}</h3>
                    {p.cliente && <p className="text-xs text-muted-foreground mt-0.5">{p.cliente}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg}`}>
                    {p.status}
                  </span>
                </div>
                {p.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{p.descricao}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {p.data_inicio && <div><span className="font-medium">Início:</span> {formatDate(p.data_inicio)}</div>}
                  {p.data_prevista_termino && <div><span className="font-medium">Fim Prev.:</span> {formatDate(p.data_prevista_termino)}</div>}
                  {p.responsavel_geral && <div className="col-span-2"><span className="font-medium">Resp.:</span> {p.responsavel_geral}</div>}
                  {p.valor_contrato && <div className="col-span-2"><span className="font-medium">Contrato:</span> {fmt(p.valor_contrato)}</div>}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Button size="sm" variant="outline" className="flex-1 mr-2" onClick={() => handleSelect(p.id)}>
                    Selecionar
                  </Button>
                  <RowActions
                    onView={() => setViewItem(p)}
                    onEdit={() => handleEdit(p)}
                    onDelete={() => deleteMut.mutate(p.id)}
                    deleteDescription="O projeto será excluído permanentemente. Esta ação não pode ser desfeita."
                    size="md"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <FormDialog
        open={showForm}
        onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}
        icon={Settings}
        title={editing ? "Editar Projeto" : "Novo Projeto"}
        subtitle={editing ? editing.nome : "Configurar novo projeto"}
        maxWidth="max-w-2xl"
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSave={handleSubmit}
        saving={createMut.isPending || updateMut.isPending}
        saveLabel={editing ? "Salvar" : "Criar Projeto"}
        footer={
          <>
            {editing && <Button variant="destructive" onClick={() => { deleteMut.mutate(editing.id); setShowForm(false); }}>Excluir</Button>}
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button>
            <Button variant="save" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salvar" : "Criar Projeto"}
            </Button>
          </>
        }
      >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Nome do Projeto *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Planta Industrial XYZ" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data Fim Prevista</Label>
              <Input type="date" value={form.data_fim_prevista} onChange={e => setForm(f => ({ ...f, data_fim_prevista: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Nº do Contrato</Label>
              <Input value={form.contrato_numero} onChange={e => setForm(f => ({ ...f, contrato_numero: e.target.value }))} placeholder="CT-2026-001" />
            </div>
            <div className="space-y-1">
              <Label>Valor do Contrato (R$)</Label>
              <Input type="number" value={form.valor_contrato} onChange={e => setForm(f => ({ ...f, valor_contrato: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
      </FormDialog>

      {viewItem && (
        <DetailDialog
          open={!!viewItem}
          onOpenChange={(o) => !o && setViewItem(null)}
          title={viewItem.nome}
          sections={[
            { label: "Nome", value: viewItem.nome },
            { label: "Status", value: viewItem.status },
            { label: "Cliente", value: viewItem.cliente },
            { label: "Responsável", value: viewItem.responsavel_geral },
            { label: "Início", value: formatDate(viewItem.data_inicio) },
            { label: "Fim previsto", value: formatDate(viewItem.data_prevista_termino) },
            { label: "Descrição", value: viewItem.descricao, full: true },
          ]}
        />
      )}
      </div>
    </div>
  );
}
