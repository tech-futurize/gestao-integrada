import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, Pencil, Trash2, CheckCircle, Clock, PauseCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/lib/ProjectContext";

const STATUS_OPTIONS = ["Ativo", "Em Pausa", "Encerrado"];

const STATUS_CFG = {
  Ativo: { icon: CheckCircle, color: "#16a34a", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  "Em Pausa": { icon: PauseCircle, color: "#d97706", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  Encerrado: { icon: Clock, color: "#6b7280", bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const EMPTY_FORM = {
  nome: "", descricao: "", status: "Ativo", data_inicio: "", data_fim_prevista: "",
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
      status: projeto.status || "Ativo",
      data_inicio: projeto.data_inicio || "",
      data_fim_prevista: projeto.data_fim_prevista || "",
      cliente: projeto.cliente || "",
      responsavel: projeto.responsavel || "",
      contrato_numero: projeto.contrato_numero || "",
      valor_contrato: projeto.valor_contrato ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = { ...form, valor_contrato: parseFloat(form.valor_contrato) || 0 };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const handleSelect = (projetoId) => {
    localStorage.setItem("selectedProjectId", projetoId);
    if (setSelectedProjectId) setSelectedProjectId(projetoId);
    toast({ variant: "success", description: "Projeto selecionado com sucesso." });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Projeto
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Cards de Projetos */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando projetos...</div>
      ) : projetos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum projeto cadastrado. Crie o primeiro projeto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projetos.map(p => {
            const cfg = STATUS_CFG[p.status] || STATUS_CFG.Ativo;
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
                  {p.data_inicio && <div><span className="font-medium">Início:</span> {p.data_inicio}</div>}
                  {p.data_fim_prevista && <div><span className="font-medium">Fim Prev.:</span> {p.data_fim_prevista}</div>}
                  {p.responsavel && <div className="col-span-2"><span className="font-medium">Resp.:</span> {p.responsavel}</div>}
                  {p.valor_contrato && <div className="col-span-2"><span className="font-medium">Contrato:</span> {fmt(p.valor_contrato)}</div>}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSelect(p.id)}>
                    Selecionar
                  </Button>
                  <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMut.mutate(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1 col-span-2">
              <Label>Nome do Projeto *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Planta Industrial XYZ" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Cliente</Label>
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
          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMut.mutate(editing.id); setShowForm(false); }}>Excluir</Button>}
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="save" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salvar" : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
