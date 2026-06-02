import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Plus, Upload, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
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
import RiscoHoverCard from "@/components/riscos/RiscoHoverCard";
import { CATEGORIAS_RISCO as CATEGORIAS, CAT_COLORS, SCORE_COLORS, IMPACTO_DIMS, getScoreLevel, PROBABILIDADE_OPTIONS, IMPACTO_OPTIONS, STATUS_RISCO, STATUS_RISCO_COLORS, pesoProbabilidade, pesoImpacto, calcScoreRisco } from "@/utils/riscosUtils";

const RISCO_COLUMNS = [
  { key: "codigo",         label: "Código",                    type: "string" },
  { key: "descricao",      label: "Descrição",                 type: "string", required: true },
  { key: "categoria",      label: "Categoria",                 type: "string" },
  { key: "probabilidade",  label: "Probabilidade",             type: "string" },
  { key: "impacto",        label: "Impacto",                   type: "string" },
  { key: "status",         label: "Status",                    type: "string" },
  { key: "responsavel",    label: "Responsável",               type: "string" },
  { key: "plano_resposta", label: "Plano de Resposta",         type: "string" },
  { key: "escopo_texto",   label: "Impacto no Escopo",         type: "string" },
  { key: "prazo_dias",     label: "Impacto Prazo (dias)",      type: "number" },
  { key: "valor_impacto",  label: "Impacto Financeiro (R$)",   type: "number" },
];
const STATUS_OPTIONS = STATUS_RISCO;

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

function RiscoChip({ risco, cellScore, isActive, isDimmed, onMouseEnter, onMouseLeave }) {
  const chipStyle = getCellChipStyle(cellScore);
  return (
    <span
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: "block",
        width: "100%",
        fontSize: "8px",
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: "4px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.1s",
        background: isActive ? chipStyle.activeColor : chipStyle.normalBg,
        color: isActive ? "#fff" : chipStyle.textColor,
        opacity: isDimmed ? 0.35 : 1,
        outline: isActive ? "1.5px solid rgba(255,255,255,0.5)" : "none",
        boxShadow: isActive ? `0 2px 8px ${chipStyle.activeColor}88` : "none",
      }}
    >
      {risco.codigo || "—"}
    </span>
  );
}

const EMPTY_FORM = {
  codigo: "", descricao: "", categoria: "", probabilidade: "Média", impacto: "Médio",
  status: "Ativo", responsavel: "", plano_resposta: "",
  impactos: [],
  escopo_texto: "", prazo_dias: "", valor_impacto: "",
};

function getCellStyle(score) {
  if (score >= 12) return { bg: "bg-red-500/15",    border: "border-red-500/30"    };
  if (score >= 6)  return { bg: "bg-amber-500/15",  border: "border-amber-500/30"  };
  if (score >= 4)  return { bg: "bg-yellow-400/15", border: "border-yellow-400/30" };
  return            { bg: "bg-green-500/15",  border: "border-green-500/30"  };
}

function getCellChipStyle(score) {
  if (score >= 12) return { activeColor: "#ef4444", normalBg: "rgba(239,68,68,0.4)",   textColor: "#fca5a5" };
  if (score >= 6)  return { activeColor: "#f59e0b", normalBg: "rgba(245,158,11,0.4)",  textColor: "#fcd34d" };
  if (score >= 4)  return { activeColor: "#eab308", normalBg: "rgba(234,179,8,0.4)",   textColor: "#fef08a" };
  return            { activeColor: "#22c55e", normalBg: "rgba(34,197,94,0.4)",    textColor: "#86efac" };
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
  const [hoveredRisco, setHoveredRisco] = useState(null);
  const hoverTimeoutRef = useRef(null);
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

  const matrixCells = useMemo(() => {
    const grid = {};
    riscos.forEach(r => {
      const key = `${pesoProbabilidade(r.probabilidade)}-${pesoImpacto(r.impacto)}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(r);
    });
    return grid;
  }, [riscos]);

  const kpi = {
    total: riscos.length,
    criticos: riscos.filter(r => (r.score || calcScoreRisco(r.probabilidade, r.impacto)) >= 12).length,
    ativos: riscos.filter(r => r.status === "Ativo").length,
    mitigados: riscos.filter(r => r.status === "Mitigado").length,
  };

  const handleEdit = (risco) => {
    setEditing(risco);
    setForm({
      codigo: risco.codigo || "",
      descricao: risco.descricao || "",
      categoria: risco.categoria || "",
      probabilidade: risco.probabilidade || "Média",
      impacto: risco.impacto || "Médio",
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
    const score = calcScoreRisco(form.probabilidade, form.impacto);
    const payload = {
      ...form,
      projeto_id: selectedProjectId,
      probabilidade: form.probabilidade,
      impacto: form.impacto,
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
      <div className="flex gap-1 border-b border-border pb-0 px-6">
        {[
          { key: "riscos", label: "Riscos" },
          { key: "plano-acao", label: "Plano de Ação" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === key
                ? "bg-card border border-b-card border-border text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
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

      {/* Seção principal: Matriz 72% + Distribuição 28% */}
      <div className="flex gap-4 items-stretch">

        {/* Coluna esquerda — Matriz 5×5 interativa */}
        <Card className="border shadow-sm" style={{ flex: "0 0 70%" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Matriz de Riscos — Probabilidade × Impacto
            </p>
            <div className="flex gap-3 items-start">
              {/* Eixo Y */}
              <div className="flex flex-col items-end shrink-0" style={{ paddingTop: "20px" }}>
                {[5,4,3,2,1].map(p => (
                  <div key={p} className="flex items-center justify-end" style={{ height: "72px", marginBottom: "6px" }}>
                    <span className="text-xs text-muted-foreground w-4 text-right">{p}</span>
                  </div>
                ))}
              </div>

              {/* Grade */}
              <div className="flex-1 min-w-0">
                {/* Header impacto */}
                <div className="flex gap-1.5 mb-1.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-xs text-muted-foreground">{i}</span>
                    </div>
                  ))}
                </div>

                {/* Linhas P=5 até P=1 */}
                {[5,4,3,2,1].map(p => (
                  <div key={p} className="flex gap-1.5 mb-1.5">
                    {[1,2,3,4,5].map(i => {
                      const score = p * i;
                      const cellStyle = getCellStyle(score);
                      const chips = matrixCells[`${p}-${i}`] || [];
                      const hasHoveredInCell = chips.some(c => c.id === hoveredRisco?.risco?.id);
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-lg border overflow-y-auto flex flex-col gap-1 p-1 ${cellStyle.bg} ${cellStyle.border}`}
                          style={{ height: "72px" }}
                        >
                          {chips.map(r => (
                            <RiscoChip
                              key={r.id}
                              risco={r}
                              cellScore={score}
                              isActive={hoveredRisco?.risco?.id === r.id}
                              isDimmed={hasHoveredInCell && hoveredRisco?.risco?.id !== r.id}
                              onMouseEnter={(e) => {
                                clearTimeout(hoverTimeoutRef.current);
                                setHoveredRisco({ risco: r, anchorRect: e.currentTarget.getBoundingClientRect() });
                              }}
                              onMouseLeave={() => {
                                hoverTimeoutRef.current = setTimeout(() => setHoveredRisco(null), 80);
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Eixo X label */}
                <div className="text-center mt-1">
                  <span className="text-xs text-muted-foreground">Impacto →</span>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Coluna direita — Distribuição por categoria */}
        <div className="flex-1 bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Distribuição</p>
          {CATEGORIAS.map(cat => {
            const count = riscos.filter(r => r.categoria === cat).length;
            const color = CAT_COLORS[cat];
            const pct = riscos.length > 0 ? (count / riscos.length) * 100 : 0;
            return (
              <div
                key={cat}
                className="bg-background rounded-lg p-2.5 border-l-4"
                style={{ borderLeftColor: color }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground">{cat}</span>
                  <span className="text-sm font-extrabold" style={{ color }}>{count}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
          {/* Legenda de severidade */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-auto pt-3 border-t border-border">
            {[
              { label: "Crítico (≥12)",  bg: "bg-red-500/80"    },
              { label: "Moderado (4–5)", bg: "bg-yellow-400/80" },
              { label: "Alto (6–11)",    bg: "bg-amber-500/80"  },
              { label: "Baixo (1–3)",   bg: "bg-green-500/80"  },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded shrink-0 ${l.bg}`} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup de hover — renderizado via portal em RiscoHoverCard */}
      {hoveredRisco && (
        <RiscoHoverCard
          risco={hoveredRisco.risco}
          anchorRect={hoveredRisco.anchorRect}
          onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
          onMouseLeave={() => {
            hoverTimeoutRef.current = setTimeout(() => setHoveredRisco(null), 80);
          }}
        />
      )}

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
                const score = r.score || calcScoreRisco(r.probabilidade, r.impacto);
                const statusColor = STATUS_RISCO_COLORS[r.status] || "";
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
                        {(Array.isArray(r.impactos) ? r.impactos : []).map(dim => {
                          const dimColors = {
                            "Escopo": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
                            "Prazo":  { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" },
                            "Valor":  { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
                          };
                          const c = dimColors[dim] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
                          return (
                            <span key={dim} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
                              {dim}
                            </span>
                          );
                        })}
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
              <Label>Probabilidade</Label>
              <Select value={form.probabilidade} onValueChange={v => setForm(f => ({ ...f, probabilidade: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{PROBABILIDADE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Impacto</Label>
              <Select value={form.impacto} onValueChange={v => setForm(f => ({ ...f, impacto: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{IMPACTO_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 p-2 bg-muted rounded-lg text-sm">
              Score calculado: <strong style={{ color: SCORE_COLORS[getScoreLevel(calcScoreRisco(form.probabilidade, form.impacto))].color }}>
                {calcScoreRisco(form.probabilidade, form.impacto)}
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
        onImport={(row) => createMut.mutateAsync({ ...row, projeto_id: selectedProjectId, score: calcScoreRisco(row.probabilidade, row.impacto) })}
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
    </div>
  );
}
