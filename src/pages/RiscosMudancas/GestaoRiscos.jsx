import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Plus, Upload, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";
import { useSortTable } from "@/hooks/useSortTable";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KPICard } from "@/components/ui/KPICard";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import FilterBar from "@/components/ui/FilterBar";
import FilterToolbar from "@/components/ui/FilterToolbar";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import PlanoAcao from "@/components/riscos/PlanoAcao";
import { CATEGORIAS_RISCO as CATEGORIAS, CAT_COLORS, SCORE_COLORS, IMPACTO_DIMS, getScoreLevel } from "@/utils/riscosUtils";

const RISCO_COLUMNS = [
  { key: "codigo",         label: "Código",                    type: "string" },
  { key: "descricao",      label: "Descrição",                 type: "string", required: true },
  { key: "categoria",      label: "Categoria",                 type: "string" },
  { key: "probabilidade",  label: "Probabilidade",             type: "number" },
  { key: "impacto",        label: "Impacto",                   type: "number" },
  { key: "status",         label: "Status",                    type: "string" },
  { key: "responsavel",    label: "Responsável",               type: "string" },
  { key: "plano_resposta", label: "Plano de Resposta",         type: "string" },
  { key: "escopo_texto",   label: "Impacto no Escopo",         type: "string" },
  { key: "prazo_dias",     label: "Impacto Prazo (dias)",      type: "number" },
  { key: "valor_impacto",  label: "Impacto Financeiro (R$)",   type: "number" },
];
const STATUS_OPTIONS = ["Ativo", "Mitigado", "Encerrado"];

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
  const [filterKey, setFilterKey] = useState(0);
  const [busca, setBusca] = useState("");
  const [tab, setTab] = useState("riscos");
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const FILTROS_KEY = "riscos-filtros";

  const { data: riscos = [], isPending: isLoading, isError } = useQuery({
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
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(x => x.descricao?.toLowerCase().includes(b) || x.codigo?.toLowerCase().includes(b));
    }
    if (st.length > 0) r = r.filter(x => st.includes(x.status));
    if (cat.length > 0) r = r.filter(x => cat.includes(x.categoria));
    return r;
  }, [riscos, busca, filtros]);

  const { sortedData: riscosSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "codigo" })

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

  function SortIcon({ col }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />
  }

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
        actions={tab === "riscos" ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar / Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Risco
            </Button>
          </div>
        ) : null}
      />
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border px-6">
        {["riscos", "plano-acao"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "riscos" ? "Riscos" : "Plano de Ação"}
          </button>
        ))}
      </div>

      {tab === "plano-acao" && <PlanoAcao projectId={selectedProjectId} />}

      {tab === "riscos" && (
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Filtros */}
      <FilterToolbar
        active={!!busca || Object.values(filtros).some(a => a?.length > 0)}
        onClearAll={() => { setBusca(""); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <FilterBar
          key={filterKey}
          storageKey={FILTROS_KEY}
          filters={[
            { key: "status", label: "Status", options: STATUS_OPTIONS },
            { key: "categoria", label: "Categoria", options: CATEGORIAS },
          ]}
          onChange={setFiltros}
        />
      </FilterToolbar>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total de Riscos" value={kpi.total} />
        <KPICard label="Críticos (≥12)" value={kpi.criticos} accent="text-status-critical" />
        <KPICard label="Ativos" value={kpi.ativos} accent="text-status-attention" />
        <KPICard label="Mitigados" value={kpi.mitigados} accent="text-status-positive" />
      </div>

      {/* Cards por Categoria */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Categoria</p>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {CATEGORIAS.map(cat => {
            const count = riscos.filter(r => r.categoria === cat).length;
            const color = CAT_COLORS[cat];
            return (
              <div
                key={cat}
                className="bg-card rounded-xl border border-border border-l-4 p-3"
                style={{ borderLeftColor: color }}
              >
                <p className="text-xs text-muted-foreground">{cat}</p>
                <p className="text-2xl font-bold text-foreground">{count}</p>
              </div>
            );
          })}
        </div>
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

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th onClick={() => handleSort("codigo")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Código<SortIcon col="codigo" /></th>
                <th onClick={() => handleSort("descricao")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Descrição<SortIcon col="descricao" /></th>
                <th onClick={() => handleSort("categoria")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Categoria<SortIcon col="categoria" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Impactos</th>
                <th onClick={() => handleSort("probabilidade")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">P<SortIcon col="probabilidade" /></th>
                <th onClick={() => handleSort("impacto")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">I<SortIcon col="impacto" /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Score</th>
                <th onClick={() => handleSort("responsavel")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Responsável<SortIcon col="responsavel" /></th>
                <th onClick={() => handleSort("status")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Status<SortIcon col="status" /></th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="py-10 text-center text-muted-foreground">Carregando...</td></tr>}
              {isError && <tr><td colSpan={10} className="py-10 text-center text-status-critical text-sm">Erro ao carregar riscos. Verifique sua conexão e tente novamente.</td></tr>}
              {!isLoading && !isError && riscosSorted.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-muted-foreground">Nenhum risco encontrado</td></tr>}
              {riscosSorted.map((r, i) => {
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
                        {(Array.isArray(r.impactos) ? r.impactos : []).map(dim => (
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
                      <RowActions
                        onView={() => setViewItem(r)}
                        onEdit={() => handleEdit(r)}
                        onDelete={() => deleteMut.mutate(r.id)}
                        deleteDescription="O risco será excluído permanentemente."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <FormDialog
        open={showForm}
        onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}
        icon={ShieldAlert}
        title={editing ? "Editar Risco" : "Novo Risco"}
        subtitle={editing ? editing.codigo || "Editar registro de risco" : "Cadastrar novo risco"}
        maxWidth="max-w-lg"
        onClose={() => { setShowForm(false); setEditing(null); }}
        footer={
          <>
            {editing && <Button variant="destructive" onClick={() => { setDeleteId(editing.id); setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }}>Excluir</Button>}
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button>
            <Button variant="save" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </>
        }
      >
          <SectionDivider label="Identificação" />
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <SectionDivider label="Avaliação" />
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <SectionDivider label="Impactos no Projeto" />
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Dimensões de Impacto</Label>
              <div className="flex gap-4 flex-wrap">
                {IMPACTO_DIMS.map(dim => (
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
              <div className="space-y-1">
                <Label>Descrição do Impacto no Escopo</Label>
                <Textarea
                  value={form.escopo_texto}
                  onChange={e => setForm(f => ({ ...f, escopo_texto: e.target.value }))}
                  rows={2}
                  placeholder="Descreva o que entra ou sai do escopo..."
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
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
          </div>
      </FormDialog>
      </div>
      )}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={RISCO_COLUMNS}
        exportFileName="riscos"
        title="Riscos — Importar / Exportar"
        onExport={() => filtered}
        onImport={(row) => createMut.mutateAsync({ ...row, projeto_id: selectedProjectId })}
      />
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir risco?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-status-critical hover:bg-status-critical/90 text-white" onClick={() => { deleteMut.mutate(deleteId); setDeleteId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewItem && (
        <DetailDialog
          open={!!viewItem}
          onOpenChange={(o) => !o && setViewItem(null)}
          title={`Risco ${viewItem.codigo || ""}`}
          sections={[
            { label: "Código", value: viewItem.codigo },
            { label: "Categoria", value: viewItem.categoria },
            { label: "Status", value: viewItem.status },
            { label: "Probabilidade", value: viewItem.probabilidade },
            { label: "Impacto", value: viewItem.impacto },
            { label: "Responsável", value: viewItem.responsavel },
            { label: "Descrição", value: viewItem.descricao, full: true },
            { label: "Plano de resposta", value: viewItem.plano_resposta, full: true },
          ]}
        />
      )}
    </div>
  );
}
