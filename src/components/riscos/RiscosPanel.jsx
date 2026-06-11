import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Plus, Upload, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import { useSortTable } from "@/hooks/useSortTable";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { entities } from "@/api/supabaseEntities";
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
import { useToast } from "@/components/ui/use-toast";
import RiscoHoverCard from "@/components/riscos/RiscoHoverCard";
import {
  CATEGORIAS_RISCO as CATEGORIAS, CAT_COLORS, SCORE_COLORS, IMPACTO_DIMS,
  getScoreLevel, getNivelLabel, PROBABILIDADE_OPTIONS, IMPACTO_OPTIONS,
  STATUS_RISCO, STATUS_RISCO_COLORS, pesoProbabilidade, pesoImpacto,
  calcScoreRisco, calcImpactoFinanceiro, calcImpactoPrazo, NIVEL_OPTIONS,
} from "@/utils/riscosUtils";
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";

const RISCO_COLUMNS = [
  { key: "codigo",         label: "Código",                   type: "string" },
  { key: "descricao",      label: "Descrição",                type: "string", required: true },
  { key: "categoria",      label: "Categoria",                type: "string" },
  { key: "probabilidade",  label: "Probabilidade",            type: "string" },
  { key: "impacto",        label: "Impacto",                  type: "string" },
  { key: "status",         label: "Status",                   type: "string" },
  { key: "responsavel",    label: "Responsável",              type: "string" },
  { key: "mitigacao",      label: "Plano de Resposta",        type: "string" },
  { key: "escopo_texto",   label: "Impacto no Escopo",        type: "string" },
  { key: "prazo_dias",     label: "Impacto Prazo (dias)",     type: "number" },
  { key: "valor_impacto",  label: "Impacto Financeiro (R$)",  type: "number" },
];

const EMPTY_FORM = {
  codigo: "", descricao: "", categoria: "", probabilidade: "Média", impacto: "Médio",
  status: "Ativo", responsavel: "",
  impactos: [],
  areas_impacto: [],
  escopo_texto: "", prazo_dias: "", valor_impacto: "",
  mitigacao: "",
};

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function ScoreBadge({ score }) {
  const level = getScoreLevel(score || 0);
  const cfg = SCORE_COLORS[level];
  const label = level === "high" ? "Alto" : level === "medium" ? "Médio" : "Baixo";
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ color: cfg.color, borderColor: `${cfg.color}55` }}>
      {label} ({score || 0})
    </span>
  );
}

function getCellStyle(score) {
  if (score >= 12) return { bg: "bg-red-500/15",    border: "border-red-500/30"    };
  if (score >= 6)  return { bg: "bg-yellow-400/15", border: "border-yellow-400/30" };
  return            { bg: "bg-green-500/15",  border: "border-green-500/30"  };
}

function getCellChipStyle(score) {
  if (score >= 12) return { activeColor: "#ef4444", normalBg: "rgba(239,68,68,0.4)",   textColor: "#fca5a5" };
  if (score >= 6)  return { activeColor: "#eab308", normalBg: "rgba(234,179,8,0.4)",   textColor: "#fef08a" };
  return            { activeColor: "#22c55e", normalBg: "rgba(34,197,94,0.4)",    textColor: "#86efac" };
}

function RiscoChip({ risco, cellScore, isActive, isDimmed, onMouseEnter, onMouseLeave }) {
  const chipStyle = getCellChipStyle(cellScore);
  return (
    <span
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: "block", width: "100%", fontSize: "8px", fontWeight: 700,
        padding: "2px 6px", borderRadius: "4px", textAlign: "center", cursor: "pointer",
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

export default function RiscosPanel({ projectId, classificacao }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filtros, setFiltros] = useState({});
  const [filterKey, setFilterKey] = useState(0);
  const [busca, setBusca] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [hoveredRisco, setHoveredRisco] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const FILTROS_KEY = `riscos-filtros-${classificacao}`;
  const label = classificacao === "Ameaça" ? "Ameaça" : "Oportunidade";
  const labelPlural = classificacao === "Ameaça" ? "Ameaças" : "Oportunidades";

  const { data: riscos = [], isPending: isLoading, isError } = useQuery({
    queryKey: ["riscos", projectId, classificacao],
    queryFn: () => entities.Risco.filter({ projeto_id: projectId, classificacao }),
    enabled: !!projectId,
  });

  const { data: categoriasNomes = [], isPending: categoriasPending } = useCategoriasImpacto();

  const riscosCalc = useMemo(() => riscos.map(r => {
    const score = r.score || calcScoreRisco(r.probabilidade, r.impacto);
    return {
      ...r,
      _score:    score,
      _impFin:   calcImpactoFinanceiro(r.valor_impacto, r.probabilidade),
      _impPrazo: calcImpactoPrazo(r.prazo_dias, r.probabilidade),
      _nivel:    getNivelLabel(score),
    };
  }), [riscos]);

  const createMut = useMutation({
    mutationFn: (data) => entities.Risco.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      toast({ variant: "success", description: `${label} criada.` });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Risco.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      toast({ variant: "success", description: `${label} atualizada.` });
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
      return { ...f, impactos: current.includes(dim) ? current.filter(d => d !== dim) : [...current, dim] };
    });

  const toggleAreaImpacto = (area) =>
    setForm(f => ({
      ...f,
      areas_impacto: f.areas_impacto.includes(area)
        ? f.areas_impacto.filter(a => a !== area)
        : [...f.areas_impacto, area],
    }));

  const filtered = useMemo(() => {
    const st  = filtros.status    || [];
    const cat = filtros.categoria || [];
    const niv = filtros.nivel     || [];
    let r = riscosCalc;
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(x => x.descricao?.toLowerCase().includes(b) || x.codigo?.toLowerCase().includes(b));
    }
    if (st.length  > 0) r = r.filter(x => st.includes(x.status));
    if (cat.length > 0) r = r.filter(x => cat.includes(x.categoria));
    if (niv.length > 0) r = r.filter(x => niv.includes(x._nivel));
    return r;
  }, [riscosCalc, busca, filtros]);

  const { sortedData: riscosSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "codigo" });

  const matrixCells = useMemo(() => {
    const grid = {};
    riscos.forEach(r => {
      const key = `${pesoProbabilidade(r.probabilidade)}-${pesoImpacto(r.impacto)}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(r);
    });
    return grid;
  }, [riscos]);

  const totalImpFin   = riscosCalc.reduce((s, r) => s + r._impFin, 0);
  const totalImpPrazo = riscosCalc.reduce((s, r) => s + r._impPrazo, 0);
  const totalAtivos   = riscosCalc.filter(r => r.status === "Ativo").length;

  const handleEdit = (risco) => {
    setEditing(risco);
    setForm({
      codigo:        risco.codigo        || "",
      descricao:     risco.descricao     || "",
      categoria:     risco.categoria     || "",
      probabilidade: risco.probabilidade || "Média",
      impacto:       risco.impacto       || "Médio",
      status:        risco.status        || "Ativo",
      responsavel:   risco.responsavel   || "",
      impactos:      Array.isArray(risco.impactos)      ? risco.impactos      : [],
      areas_impacto: Array.isArray(risco.areas_impacto) ? risco.areas_impacto : [],
      escopo_texto:  risco.escopo_texto  || "",
      prazo_dias:    risco.prazo_dias    ?? "",
      valor_impacto: risco.valor_impacto ?? "",
      mitigacao:     risco.mitigacao     || "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const score = calcScoreRisco(form.probabilidade, form.impacto);
    const payload = {
      ...form,
      projeto_id:    projectId,
      classificacao,
      score,
      prazo_dias:    form.prazo_dias    !== "" ? Number(form.prazo_dias)    : null,
      valor_impacto: form.valor_impacto !== "" ? Number(form.valor_impacto) : null,
    };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  function SortIcon({ col }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />;
    return sortDir === "asc"
      ? <ArrowUp   className="w-3 h-3 inline ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />;
  }

  const impFinCalc   = calcImpactoFinanceiro(form.valor_impacto, form.probabilidade);
  const impPrazoCalc = calcImpactoPrazo(form.prazo_dias, form.probabilidade);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
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
              { key: "status",    label: "Status",    options: STATUS_RISCO },
              { key: "categoria", label: "Categoria", options: CATEGORIAS   },
              { key: "nivel",     label: "Nível",     options: NIVEL_OPTIONS },
            ]}
            onChange={setFiltros}
          />
        </FilterToolbar>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar / Exportar
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {`Nova ${label}`}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label={`Total de ${labelPlural} Registradas`} value={riscos.length} />
        <KPICard label="Total Ativo" value={totalAtivos} accent="text-status-attention" />
        <KPICard label="Imp. Financeiro Calc." value={formatBRL(totalImpFin)} accent="text-status-critical" />
        <KPICard label="Imp. de Prazo Calc." value={`${totalImpPrazo.toFixed(1)} dias`} accent="text-status-attention" />
      </div>

      {/* Matriz + Distribuição */}
      <div className="flex gap-4 items-stretch">
        <Card className="border shadow-sm" style={{ flex: "0 0 70%" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Matriz de Riscos — Probabilidade × Impacto
            </p>
            <div className="flex gap-3 items-start">
              <div className="flex flex-col items-end shrink-0" style={{ paddingTop: "20px" }}>
                {[5,4,3,2,1].map(p => (
                  <div key={p} className="flex items-center justify-end" style={{ height: "72px", marginBottom: "6px" }}>
                    <span className="text-xs text-muted-foreground w-4 text-right">{p}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 mb-1.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-xs text-muted-foreground">{i}</span>
                    </div>
                  ))}
                </div>
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
                <div className="text-center mt-1">
                  <span className="text-xs text-muted-foreground">Impacto →</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Distribuição</p>
          {CATEGORIAS.map(cat => {
            const count = riscos.filter(r => r.categoria === cat).length;
            const color = CAT_COLORS[cat];
            const pct = riscos.length > 0 ? (count / riscos.length) * 100 : 0;
            return (
              <div key={cat} className="bg-background rounded-lg p-2.5 border-l-4" style={{ borderLeftColor: color }}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground">{cat}</span>
                  <span className="text-sm font-extrabold" style={{ color }}>{count}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
          <div className="flex flex-row gap-4 mt-auto pt-3 border-t border-border">
            {[
              { label: "Baixo (1–5)",  bg: "bg-green-500/80"  },
              { label: "Médio (6–11)", bg: "bg-yellow-400/80" },
              { label: "Alto (≥12)",   bg: "bg-red-500/80"    },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded shrink-0 ${l.bg}`} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hoveredRisco && (
        <RiscoHoverCard
          risco={hoveredRisco.risco}
          anchorRect={hoveredRisco.anchorRect}
          onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
          onMouseLeave={() => { hoverTimeoutRef.current = setTimeout(() => setHoveredRisco(null), 80); }}
        />
      )}

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: "68px" }} />   {/* Código */}
              <col style={{ width: "180px" }} />  {/* Descrição */}
              <col style={{ width: "90px" }} />   {/* Categoria */}
              <col style={{ width: "90px" }} />   {/* Impactos */}
              <col style={{ width: "68px" }} />   {/* Prob. */}
              <col style={{ width: "68px" }} />   {/* Impac. */}
              <col style={{ width: "100px" }} />  {/* Score */}
              <col style={{ width: "100px" }} />  {/* Imp. Fin. Calc. */}
              <col style={{ width: "100px" }} />  {/* Imp. Prazo Calc. */}
              <col style={{ width: "100px" }} />  {/* Responsável */}
              <col style={{ width: "88px" }} />   {/* Status */}
              <col style={{ width: "56px" }} />   {/* Ações */}
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted">
                <th onClick={() => handleSort("codigo")} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Código<SortIcon col="codigo" /></th>
                <th onClick={() => handleSort("descricao")} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Descrição<SortIcon col="descricao" /></th>
                <th onClick={() => handleSort("categoria")} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Categoria<SortIcon col="categoria" /></th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Impactos</th>
                <th onClick={() => handleSort("probabilidade")} className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Prob.<SortIcon col="probabilidade" /></th>
                <th onClick={() => handleSort("impacto")} className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Impac.<SortIcon col="impacto" /></th>
                <th onClick={() => handleSort("_score")} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Score<SortIcon col="_score" /></th>
                <th onClick={() => handleSort("_impFin")} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Fin. Calc.<SortIcon col="_impFin" /></th>
                <th onClick={() => handleSort("_impPrazo")} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Prazo Calc.<SortIcon col="_impPrazo" /></th>
                <th onClick={() => handleSort("responsavel")} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Responsável<SortIcon col="responsavel" /></th>
                <th onClick={() => handleSort("status")} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group whitespace-nowrap">Status<SortIcon col="status" /></th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={12} className="py-10 text-center text-muted-foreground">Carregando...</td></tr>}
              {isError   && <tr><td colSpan={12} className="py-10 text-center text-status-critical text-sm">Erro ao carregar. Verifique sua conexão e tente novamente.</td></tr>}
              {!isLoading && !isError && riscosSorted.length === 0 && <tr><td colSpan={12} className="py-10 text-center text-muted-foreground">Nenhum registro encontrado</td></tr>}
              {riscosSorted.map((r, i) => {
                const statusColor = STATUS_RISCO_COLORS[r.status] || "";
                return (
                  <tr key={r.id} className={`border-b border-border hover:bg-muted/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-3 py-3 font-bold text-xs text-foreground whitespace-nowrap">{r.codigo || "—"}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-foreground text-sm line-clamp-2">{r.descricao}</div>
                    </td>
                    <td className="px-3 py-3">
                      {r.categoria && (
                        <span className="text-xs font-medium" style={{ color: CAT_COLORS[r.categoria] || "#6b7280" }}>
                          {r.categoria}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(Array.isArray(r.impactos) ? r.impactos : []).map(dim => {
                          const dimColors = {
                            "Escopo": { text: "text-blue-600",    border: "border-blue-500/20"    },
                            "Prazo":  { text: "text-orange-600",  border: "border-orange-500/20"  },
                            "Valor":  { text: "text-emerald-600", border: "border-emerald-500/20" },
                          };
                          const c = dimColors[dim] || { text: "text-muted-foreground", border: "border-border" };
                          return (
                            <span key={dim} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${c.text} ${c.border}`}>
                              {dim}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-muted-foreground">{r.probabilidade}</td>
                    <td className="px-2 py-3 text-center text-xs text-muted-foreground">{r.impacto}</td>
                    <td className="px-3 py-3 text-center"><ScoreBadge score={r._score} /></td>
                    <td className="px-3 py-3 text-center text-xs text-muted-foreground">{r._impFin !== 0 ? formatBRL(r._impFin) : "—"}</td>
                    <td className="px-3 py-3 text-center text-xs text-muted-foreground">{r._impPrazo !== 0 ? `${r._impPrazo.toFixed(1)} d` : "—"}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.responsavel || "—"}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-semibold ${statusColor}`}>{r.status || "—"}</span>
                    </td>
                    <td className="px-3 py-3">
                      <RowActions
                        onEdit={() => handleEdit(r)}
                        onDelete={() => deleteMut.mutate(r.id)}
                        deleteDescription="O registro será excluído permanentemente."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal novo/editar */}
      <FormDialog
        open={showForm}
        onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}
        icon={ShieldAlert}
        title={editing ? `Editar ${label}` : `Nova ${label}`}
        subtitle={editing ? editing.codigo || `Editar registro` : `Cadastrar nova ${label.toLowerCase()}`}
        maxWidth="max-w-lg"
        onClose={() => { setShowForm(false); setEditing(null); }}
        footer={
          <>
            {editing && (
              <Button variant="destructive" onClick={() => { setDeleteId(editing.id); setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }}>
                Excluir
              </Button>
            )}
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
            <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} placeholder={`Descrição da ${label.toLowerCase()}`} />
          </div>
        </div>

        <SectionDivider label="Avaliação" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Probabilidade</Label>
            <Select value={form.probabilidade} onValueChange={v => setForm(f => ({ ...f, probabilidade: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROBABILIDADE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Impacto</Label>
            <Select value={form.impacto} onValueChange={v => setForm(f => ({ ...f, impacto: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{IMPACTO_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 p-2 bg-muted rounded-lg text-sm">
            Score calculado:{" "}
            <strong style={{ color: SCORE_COLORS[getScoreLevel(calcScoreRisco(form.probabilidade, form.impacto))].color }}>
              {calcScoreRisco(form.probabilidade, form.impacto)}
            </strong>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_RISCO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
            <Label>Categorias de Impacto</Label>
            {categoriasPending ? (
              <p className="text-xs text-muted-foreground">Carregando categorias...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categoriasNomes.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleAreaImpacto(area)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      form.areas_impacto.includes(area)
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground bg-background hover:border-primary/50"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Dimensões de Impacto</Label>
            <div className="flex gap-4 flex-wrap">
              {IMPACTO_DIMS.map(dim => (
                <label key={dim} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.impactos.includes(dim)} onCheckedChange={() => toggleImpacto(dim)} />
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
          <div className="space-y-1">
            <Label>Plano de Resposta</Label>
            <Textarea
              value={form.mitigacao}
              onChange={e => setForm(f => ({ ...f, mitigacao: e.target.value }))}
              rows={2}
              placeholder="Como o risco será mitigado ou tratado..."
            />
          </div>
          {(form.impactos.includes("Prazo") || form.impactos.includes("Valor")) && (
            <div className="p-2 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium text-muted-foreground text-xs mb-1">Impacto Calculado (dimensão × fator de probabilidade)</p>
              {form.impactos.includes("Valor") && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Financeiro:</span>
                  <strong className="text-xs">{formatBRL(impFinCalc)}</strong>
                </div>
              )}
              {form.impactos.includes("Prazo") && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Prazo:</span>
                  <strong className="text-xs">{impPrazoCalc.toFixed(1)} dias</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </FormDialog>

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={RISCO_COLUMNS}
        exportFileName={classificacao === "Ameaça" ? "ameacas" : "oportunidades"}
        title={`${labelPlural} — Importar / Exportar`}
        onExport={() => filtered}
        onImport={(row) => createMut.mutateAsync({
          ...row,
          projeto_id: projectId,
          classificacao,
          score: calcScoreRisco(row.probabilidade, row.impacto),
        })}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Excluir ${label.toLowerCase()}?`}</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-critical hover:bg-status-critical/90 text-white"
              onClick={() => { deleteMut.mutate(deleteId); setDeleteId(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
