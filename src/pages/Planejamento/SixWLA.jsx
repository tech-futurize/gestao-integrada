import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CalendarRange, Plus, Pencil, Trash2 } from "lucide-react";

const CATEGORIAS = [
  "Projeto/Engenharia",
  "Material/Suprimentos",
  "Mão de Obra",
  "Equipamentos",
  "Externas/Regulatórias",
  "Informações/Decisões",
];

const STATUS_OPTIONS = ["Planejada", "Em Andamento", "Concluída", "Removida"];

const STATUS_COLORS = {
  Planejada: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Em Andamento": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Concluída: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Removida: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const CAT_COLORS = {
  "Projeto/Engenharia": "#3b82f6",
  "Material/Suprimentos": "#f59e0b",
  "Mão de Obra": "#10b981",
  "Equipamentos": "#8b5cf6",
  "Externas/Regulatórias": "#ef4444",
  "Informações/Decisões": "#c35e1e",
};

const EMPTY_FORM = {
  semana_ano: "",
  atividade: "",
  responsavel: "",
  restricoes: "",
  categoria_restricao: "",
  status: "Planejada",
  ppc: 0,
};

// Gera lista de semanas do ano atual
const WEEKS_OF_YEAR = (() => {
  const year = new Date().getFullYear();
  return Array.from({ length: 52 }, (_, i) => `${year}-W${String(i + 1).padStart(2, "0")}`);
})();

function formatWeek(semana_ano) {
  if (!semana_ano) return "—";
  const [year, week] = semana_ano.split("-W");
  return `Semana ${week}/${year}`;
}

export default function SixWLAPage() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filtroSemana, setFiltroSemana] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens_6wla", selectedProjectId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.Item6WLA.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens_6wla"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Item criado com sucesso." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Item6WLA.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens_6wla"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Item atualizado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Item6WLA.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const semanas = useMemo(() => [...new Set(itens.map(i => i.semana_ano).filter(Boolean))].sort(), [itens]);

  const filtered = useMemo(() => {
    let r = itens;
    if (filtroSemana) r = r.filter(i => i.semana_ano === filtroSemana);
    if (filtroStatus) r = r.filter(i => i.status === filtroStatus);
    if (filtroCategoria) r = r.filter(i => i.categoria_restricao === filtroCategoria);
    return r;
  }, [itens, filtroSemana, filtroStatus, filtroCategoria]);

  const ppcMedio = useMemo(() => {
    const comPpc = itens.filter(i => i.ppc > 0);
    if (!comPpc.length) return null;
    return Math.round(comPpc.reduce((s, i) => s + (i.ppc || 0), 0) / comPpc.length);
  }, [itens]);

  const catDistrib = useMemo(() => {
    return CATEGORIAS.map(cat => ({
      cat,
      count: itens.filter(i => i.categoria_restricao === cat).length,
      color: CAT_COLORS[cat],
    })).filter(c => c.count > 0);
  }, [itens]);

  const handleOpenNew = () => {
    const now = new Date();
    const week = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 86400000));
    setEditing(null);
    setForm({ ...EMPTY_FORM, semana_ano: `${now.getFullYear()}-W${String(week).padStart(2, "0")}` });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      semana_ano: item.semana_ano || "",
      atividade: item.atividade || "",
      responsavel: item.responsavel || "",
      restricoes: item.restricoes || "",
      categoria_restricao: item.categoria_restricao || "",
      status: item.status || "Planejada",
      ppc: item.ppc ?? 0,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = { ...form, projeto_id: selectedProjectId, ppc: Number(form.ppc) || 0 };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={CalendarRange} description="Selecione um projeto no menu lateral para acessar o 6WLA." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Controles de topo */}
      <div className="flex items-center justify-end">
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Atividade
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total de Itens</p>
          <p className="text-2xl font-bold text-foreground">{itens.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">PPC Médio</p>
          <p className="text-2xl font-bold" style={{ color: ppcMedio !== null ? (ppcMedio >= 80 ? "#16a34a" : ppcMedio >= 60 ? "#d97706" : "#ef4444") : "#9ca3af" }}>
            {ppcMedio !== null ? `${ppcMedio}%` : "—"}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Concluídas</p>
          <p className="text-2xl font-bold text-green-600">{itens.filter(i => i.status === "Concluída").length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Com Restrições</p>
          <p className="text-2xl font-bold text-amber-600">{itens.filter(i => i.restricoes).length}</p>
        </div>
      </div>

      {/* Restrições por Categoria */}
      {catDistrib.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Restrições por Categoria</p>
            <div className="flex flex-wrap gap-3">
              {catDistrib.map(({ cat, count, color }) => (
                <div key={cat} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-foreground">{cat}</span>
                  <span className="text-xs font-bold" style={{ color }}>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
          value={filtroSemana}
          onChange={e => setFiltroSemana(e.target.value)}
        >
          <option value="">Todas as Semanas</option>
          {semanas.map(s => <option key={s} value={s}>{formatWeek(s)}</option>)}
        </select>
        <select
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Semana</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Atividade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Responsável</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Restrições</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">PPC</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Nenhuma atividade encontrada</td></tr>
              )}
              {filtered.map((item, i) => (
                <tr key={item.id} className={`border-b border-border hover:bg-muted/40 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">{formatWeek(item.semana_ano)}</td>
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                    <span className="line-clamp-2">{item.atividade || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.responsavel || "—"}</td>
                  <td className="px-4 py-3">
                    {item.categoria_restricao && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                        style={{ backgroundColor: CAT_COLORS[item.categoria_restricao] || "#6b7280" }}>
                        {item.categoria_restricao}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-48">
                    <span className="line-clamp-2">{item.restricoes || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold" style={{ color: (item.ppc || 0) >= 80 ? "#16a34a" : (item.ppc || 0) >= 60 ? "#d97706" : "#ef4444" }}>
                      {item.ppc ? `${item.ppc}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || "bg-muted text-muted-foreground"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(item)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(item.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1 col-span-2">
              <Label>Semana / Ano</Label>
              <Select value={form.semana_ano} onValueChange={v => setForm(f => ({ ...f, semana_ano: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a semana" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {WEEKS_OF_YEAR.map(w => <SelectItem key={w} value={w}>{formatWeek(w)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Atividade *</Label>
              <Input value={form.atividade} onChange={e => setForm(f => ({ ...f, atividade: e.target.value }))} placeholder="Descrição da atividade" />
            </div>
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>PPC (%)</Label>
              <Input type="number" min={0} max={100} value={form.ppc} onChange={e => setForm(f => ({ ...f, ppc: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Categoria de Restrição</Label>
              <Select value={form.categoria_restricao} onValueChange={v => setForm(f => ({ ...f, categoria_restricao: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Restrições Identificadas</Label>
              <Input value={form.restricoes} onChange={e => setForm(f => ({ ...f, restricoes: e.target.value }))} placeholder="Descreva as restrições" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="destructive" onClick={() => { deleteMut.mutate(editing.id); setShowForm(false); }}>Excluir</Button>
            )}
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="save" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salvar alterações" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
