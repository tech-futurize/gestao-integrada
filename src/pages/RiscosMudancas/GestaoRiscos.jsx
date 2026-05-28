import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import FilterBar from "@/components/ui/FilterBar";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIAS = ["Técnico", "Financeiro", "Prazo", "Segurança", "Regulatório", "Ambiental", "Outros"];

const RISCO_COLUMNS = [
  { key: "codigo",         label: "Código",          type: "string" },
  { key: "descricao",      label: "Descrição",        type: "string", required: true },
  { key: "categoria",      label: "Categoria",        type: "string" },
  { key: "probabilidade",  label: "Probabilidade",    type: "number" },
  { key: "impacto",        label: "Impacto",          type: "number" },
  { key: "status",         label: "Status",           type: "string" },
  { key: "responsavel",    label: "Responsável",      type: "string" },
  { key: "plano_resposta", label: "Plano de Resposta", type: "string" },
  { key: "impactos",       label: "Impactos",          type: "string" },
];
const STATUS_OPTIONS = ["Ativo", "Mitigado", "Encerrado"];

const SCORE_COLORS = {
  high: { color: "#ef4444", bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  medium: { color: "#f59e0b", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  low: { color: "#16a34a", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

function getScoreLevel(score) {
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

function ScoreBadge({ score }) {
  const level = getScoreLevel(score || 0);
  const cfg = SCORE_COLORS[level];
  const label = level === "high" ? "Crítico" : level === "medium" ? "Alto" : "Baixo";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg}`}>
      {label} ({score || 0})
    </span>
  );
}

const CAT_COLORS = {
  "Técnico": "#3b82f6", "Financeiro": "#f59e0b", "Prazo": "#c35e1e",
  "Segurança": "#ef4444", "Regulatório": "#8b5cf6", "Ambiental": "#10b981", "Outros": "#6b7280",
};

const EMPTY_FORM = {
  codigo: "", descricao: "", categoria: "", probabilidade: 3, impacto: 3,
  status: "Ativo", responsavel: "", plano_resposta: "",
  impactos: [],
  escopo_texto: "", prazo_dias: "", valor_impacto: "",
};

// 5×5 matrix cell colors
function matrixColor(p, i) {
  const score = p * i;
  if (score >= 12) return "bg-red-500/80";
  if (score >= 6) return "bg-amber-400/80";
  if (score >= 4) return "bg-yellow-300/80";
  return "bg-green-300/80";
}

export default function GestaoRiscos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filtros, setFiltros] = useState({});

  const { data: riscos = [], isLoading } = useQuery({
    queryKey: ["riscos", selectedProjectId],
    queryFn: () => entities.Risco.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.Risco.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Risco criado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Risco.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Risco atualizado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Risco.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["riscos"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleImpacto = (dim) =>
    setForm(f => {
      const current = Array.isArray(f.impactos) ? f.impactos : [];
      return {
        ...f,
        impactos: current.includes(dim)
          ? current.filter(d => d !== dim)
          : [...current, dim],
      };
    });

  const filtered = useMemo(() => {
    const st = filtros.status || [];
    const cat = filtros.categoria || [];
    let r = riscos;
    if (st.length > 0) r = r.filter(x => st.includes(x.status));
    if (cat.length > 0) r = r.filter(x => cat.includes(x.categoria));
    return r.sort((a, b) => (b.score || b.probabilidade * b.impacto || 0) - (a.score || a.probabilidade * a.impacto || 0));
  }, [riscos, filtros]);

  // Matriz 5×5 — count risks in each cell
  const matrixData = useMemo(() => {
    const grid = {};
    riscos.forEach(r => {
      const key = `${r.probabilidade}-${r.impacto}`;
      grid[key] = (grid[key] || 0) + 1;
    });
    return grid;
  }, [riscos]);

  const kpi = {
    total: riscos.length,
    criticos: riscos.filter(r => (r.score || r.probabilidade * r.impacto || 0) >= 12).length,
    ativos: riscos.filter(r => r.status === "Ativo").length,
    mitigados: riscos.filter(r => r.status === "Mitigado").length,
  };

  const handleEdit = (risco) => {
    setEditing(risco);
    setForm({
      codigo: risco.codigo || "",
      descricao: risco.descricao || "",
      categoria: risco.categoria || "",
      probabilidade: risco.probabilidade ?? 3,
      impacto: risco.impacto ?? 3,
      status: risco.status || "Ativo",
      responsavel: risco.responsavel || "",
      plano_resposta: risco.plano_resposta || "",
      impactos: Array.isArray(risco.impactos) ? risco.impactos : [],
      escopo_texto:  risco.escopo_texto  || "",
      prazo_dias:    risco.prazo_dias    ?? "",
      valor_impacto: risco.valor_impacto ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const score = (Number(form.probabilidade) || 3) * (Number(form.impacto) || 3);
    const payload = {
      ...form,
      projeto_id: selectedProjectId,
      probabilidade: Number(form.probabilidade) || 3,
      impacto: Number(form.impacto) || 3,
      score,
      prazo_dias:    form.prazo_dias    !== "" ? Number(form.prazo_dias)    : null,
      valor_impacto: form.valor_impacto !== "" ? Number(form.valor_impacto) : null,
    };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1"><PageEmptyState icon={ShieldAlert} description="Selecione um projeto para ver a gestão de riscos." /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Importar / Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Risco
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de Riscos", value: kpi.total, color: "#26405d" },
          { label: "Críticos (≥12)", value: kpi.criticos, color: "#ef4444" },
          { label: "Ativos", value: kpi.ativos, color: "#d97706" },
          { label: "Mitigados", value: kpi.mitigados, color: "#16a34a" },
        ].map(k => (
          <div key={k.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Matriz 5×5 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Matriz de Riscos (Probabilidade × Impacto)</p>
          <div className="flex gap-4 items-start">
            <div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-xs text-muted-foreground w-16 text-right">Prob.</span>
                {[1,2,3,4,5].map(i => <span key={i} className="text-xs text-center w-10 text-muted-foreground">{i}</span>)}
              </div>
              {[5,4,3,2,1].map(p => (
                <div key={p} className="flex items-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground w-16 text-right">{p}</span>
                  {[1,2,3,4,5].map(i => {
                    const count = matrixData[`${p}-${i}`] || 0;
                    return (
                      <div key={i} className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold text-white ${matrixColor(p, i)}`}>
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex items-center gap-1 mt-1">
                <span className="w-16" />
                <span className="text-xs text-muted-foreground flex-1 text-center">Impacto →</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {[
                { color: "bg-red-500/80", label: "Crítico (≥12)" },
                { color: "bg-amber-400/80", label: "Alto (6-11)" },
                { color: "bg-yellow-300/80", label: "Moderado (4-5)" },
                { color: "bg-green-300/80", label: "Baixo (1-3)" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${l.color}`} />
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <FilterBar
        storageKey="riscos-filtros"
        filters={[
          { key: "status", label: "Status", options: STATUS_OPTIONS },
          { key: "categoria", label: "Categoria", options: CATEGORIAS },
        ]}
        onChange={setFiltros}
      />

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Impactos</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">P</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">I</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Responsável</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="py-10 text-center text-muted-foreground">Carregando...</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-muted-foreground">Nenhum risco encontrado</td></tr>}
              {filtered.map((r, i) => {
                const score = r.score || (r.probabilidade * r.impacto) || 0;
                const statusColor = { Ativo: "text-amber-600", Mitigado: "text-blue-600", Encerrado: "text-green-600" }[r.status] || "";
                return (
                  <tr key={r.id} className={`border-b border-border hover:bg-muted/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3 font-bold text-xs text-foreground whitespace-nowrap">{r.codigo || "—"}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-foreground text-sm line-clamp-2">{r.descricao}</div>
                      {r.plano_resposta && <div className="text-xs text-muted-foreground truncate mt-0.5">{r.plano_resposta}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {r.categoria && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CAT_COLORS[r.categoria] || "#6b7280" }}>
                          {r.categoria}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(r.impactos || []).map(dim => (
                          <span key={dim} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            {dim}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">{r.probabilidade}</td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">{r.impacto}</td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={score} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.responsavel || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${statusColor}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(r)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteMut.mutate(r.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Risco" : "Novo Risco"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Código</Label>
              <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="RSC-001" />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Descrição *</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} placeholder="Descrição do risco" />
            </div>
            <div className="space-y-1">
              <Label>Probabilidade (1-5)</Label>
              <Input type="number" min={1} max={5} value={form.probabilidade} onChange={e => setForm(f => ({ ...f, probabilidade: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Impacto (1-5)</Label>
              <Input type="number" min={1} max={5} value={form.impacto} onChange={e => setForm(f => ({ ...f, impacto: e.target.value }))} />
            </div>
            <div className="col-span-2 p-2 bg-muted rounded-lg text-sm">
              Score calculado: <strong style={{ color: SCORE_COLORS[getScoreLevel((form.probabilidade || 3) * (form.impacto || 3))].color }}>
                {(form.probabilidade || 3) * (form.impacto || 3)}
              </strong>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Plano de Resposta</Label>
              <Textarea value={form.plano_resposta} onChange={e => setForm(f => ({ ...f, plano_resposta: e.target.value }))} rows={2} placeholder="Ações de mitigação..." />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Dimensões de Impacto</Label>
              <div className="flex gap-4 flex-wrap">
                {["Escopo", "Prazo", "Valor"].map(dim => (
                  <label key={dim} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.impactos.includes(dim)}
                      onCheckedChange={() => toggleImpacto(dim)}
                    />
                    <span className="text-sm">{dim}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.impactos.includes("Escopo") && (
              <div className="space-y-1 col-span-2">
                <Label>Descrição do Impacto no Escopo</Label>
                <Textarea
                  value={form.escopo_texto}
                  onChange={e => setForm(f => ({ ...f, escopo_texto: e.target.value }))}
                  rows={2}
                  placeholder="Descreva o que entra ou sai do escopo..."
                />
              </div>
            )}
            {form.impactos.includes("Prazo") && (
              <div className="space-y-1">
                <Label>Impacto em Prazo (dias)</Label>
                <Input
                  type="number"
                  value={form.prazo_dias}
                  onChange={e => setForm(f => ({ ...f, prazo_dias: e.target.value }))}
                  placeholder="+15 ou -5"
                />
              </div>
            )}
            {form.impactos.includes("Valor") && (
              <div className="space-y-1">
                <Label>Impacto Financeiro (R$)</Label>
                <Input
                  type="number"
                  value={form.valor_impacto}
                  onChange={e => setForm(f => ({ ...f, valor_impacto: e.target.value }))}
                  placeholder="+150000 ou -50000"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMut.mutate(editing.id); setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }}>Excluir</Button>}
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="save" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={RISCO_COLUMNS}
        exportFileName="riscos"
        title="Riscos — Importar / Exportar"
        onExport={() => filtered}
        onImport={(row) => createMut.mutateAsync({ ...row, projeto_id: selectedProjectId })}
      />
    </div>
  );
}
