import { useState, useMemo } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eachMonthOfInterval, format, parseISO, startOfMonth, endOfMonth, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Minus } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import RowActions from "@/components/ui/RowActions";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getProjectMonths(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return [];
  try {
    return eachMonthOfInterval({
      start: parseISO(dataInicio),
      end: parseISO(dataFim),
    });
  } catch {
    return [];
  }
}

function isFutureMonth(mesReferencia) {
  if (!mesReferencia) return false;
  const hojeInicio = startOfMonth(new Date());
  return parseISO(mesReferencia) > hojeInicio;
}

function mesKey(date) {
  return format(date, "yyyy-MM");
}

function mesLabel(date) {
  return format(date, "MMM/yy", { locale: ptBR });
}


// ── CelulaEditavel — defined OUTSIDE main component to prevent remount ────────
function CelulaEditavel({ registro, campo, onSave, isFirstInMonth = false }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const cancelRef = React.useRef(false);

  const borderClass = isFirstInMonth ? "border-l-2 border-border" : "border-l border-border/40";

  if (!registro) {
    return (
      <td className={`px-2 py-1 text-center text-muted-foreground text-xs w-12 ${borderClass}`}>—</td>
    );
  }

  const disabled =
    (campo === "quantidade_realizada_mensal" && isFutureMonth(registro.mes_referencia)) ||
    (campo === "qtd_projetado" && !isFutureMonth(registro.mes_referencia));

  if (disabled) {
    return (
      <td
        className={`px-2 py-1 text-center ${borderClass} bg-slate-100/80 dark:bg-slate-700/25 text-muted-foreground/60 text-xs w-12 cursor-not-allowed`}
        title={campo === "qtd_projetado" ? "Mês passado/atual — projetado bloqueado" : "Mês futuro — edição de Real bloqueada"}
      >
        —
      </td>
    );
  }

  const valor = registro[campo] ?? 0;

  const handleBlur = () => {
    if (cancelRef.current) { cancelRef.current = false; setEditing(false); return; }
    const numVal = Number(inputVal);
    const parsed = isNaN(numVal) ? 0 : numVal;
    const original = registro[campo] ?? 0;
    if (parsed !== original) {
      onSave(registro, campo, parsed);
    }
    setEditing(false);
  };

  return (
    <td
      className={`px-2 py-1 text-center cursor-pointer hover:bg-muted/40 w-12 ${borderClass}`}
      onClick={() => {
        if (!editing) {
          setInputVal(valor ? String(valor) : "");
          setEditing(true);
        }
      }}
    >
      {editing ? (
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              cancelRef.current = false;
              e.target.blur();
            }
            if (e.key === "Escape") {
              cancelRef.current = true;
              setEditing(false);
            }
          }}
          className="w-10 text-center border rounded text-xs p-0 bg-background text-foreground"
        />
      ) : (
        <span className="text-xs">{valor || "—"}</span>
      )}
    </td>
  );
}

// ── HistogramaTabela ──────────────────────────────────────────────────────────

export default function HistogramaTabela({ tipo }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) =>
    toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  // Column visibility state
  const [showPrev, setShowPrev] = useState(true);
  const [showReal, setShowReal] = useState(true);
  const [showProj, setShowProj] = useState(true);
  const [showTotals, setShowTotals] = useState(false);
  const [activeSubtipos, setActiveSubtipos] = useState(() => new Set(["MOD", "MOI"]));
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [novoFuncao, setNovoFuncao] = useState(null);
  const [periodFilter, setPeriodFilter] = useState(null);

  // Data queries
  const { data: histogramas = [], isPending, isError } = useQuery({
    queryKey: ["histogramas", selectedProjectId, tipo],
    queryFn: () => entities.Histograma.filter({ projeto_id: selectedProjectId, tipo }),
    enabled: !!selectedProjectId,
  });

  const { data: projetoArr = [] } = useQuery({
    queryKey: ["projetos", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const projeto = projetoArr[0] ?? null;

  const { data: opcoesRecurso = [] } = useQuery({
    queryKey: tipo === "MO" ? ["funcoes"] : ["tipos_equipamento"],
    queryFn: () => tipo === "MO" ? entities.Funcao.list() : entities.TipoEquipamento.list(),
  });
  const opcoesAtivas = opcoesRecurso.filter(f => f.ativo !== false);

  const projectMonths = useMemo(
    () => getProjectMonths(projeto?.data_inicio, projeto?.data_prevista_termino),
    [projeto]
  );

  const mesesFiltrados = useMemo(() => {
    if (!periodFilter?.from || !periodFilter?.to) return projectMonths;
    const from = startOfMonth(periodFilter.from);
    const to   = endOfMonth(periodFilter.to);
    return projectMonths.filter(m => !isBefore(m, from) && !isAfter(m, to));
  }, [projectMonths, periodFilter]);

  // Mutations
  const updateMut = useMutation({
    mutationFn: ({ id, updates }) => entities.Histograma.update(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["histogramas", selectedProjectId, tipo] }),
    onError: onErr,
  });

  const updateCelula = (registro, campo, valor) => {
    const updates = { [campo]: valor };
    if (campo === "quantidade_realizada_mensal") updates.qtd_projetado = 0;
    updateMut.mutate({ id: registro.id, updates });
  };

  const deleteRecurso = (nome_recurso) => {
    const toDelete = histogramas.filter((r) => r.nome_recurso === nome_recurso);
    Promise.all(toDelete.map((r) => entities.Histograma.delete(r.id)))
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["histogramas", selectedProjectId, tipo] })
      )
      .catch(onErr);
  };

  const createRecurso = useMutation({
    mutationFn: async (nome_recurso) => {
      const subtipo = novoFuncao?.subtipo_mo ?? null;
      for (const m of projectMonths) {
        await entities.Histograma.create({
          projeto_id: selectedProjectId,
          tipo,
          nome_recurso,
          mes_referencia: format(m, "yyyy-MM-dd"),
          quantidade_prevista_mensal: 0,
          quantidade_realizada_mensal: 0,
          qtd_projetado: 0,
          ...(tipo === "MO" && subtipo ? { subtipo_mo: subtipo } : {}),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["histogramas", selectedProjectId, tipo] });
      setShowNovoDialog(false);
      setNovoFuncao(null);
    },
    onError: onErr,
  });

  // Derived data: resources grouped by name with totals and running sums
  const recursos = useMemo(() => {
    const nomes = [...new Set(histogramas.map((h) => h.nome_recurso))].filter(Boolean).sort();
    return nomes.map((nome) => {
      const registros = [...histogramas.filter((h) => h.nome_recurso === nome)].sort(
        (a, b) => (a.mes_referencia ?? "").localeCompare(b.mes_referencia ?? "")
      );
      let prevAcum = 0, realAcum = 0, projAcum = 0;
      const byMes = {};
      registros.forEach((r) => {
        prevAcum += r.quantidade_prevista_mensal ?? 0;
        realAcum += r.quantidade_realizada_mensal ?? 0;
        projAcum += r.qtd_projetado ?? 0;
        byMes[r.mes_referencia?.slice(0, 7) ?? ""] = r;
      });
      const projFinal = realAcum + projAcum;
      const pctReal = prevAcum > 0 ? Math.round((realAcum / prevAcum) * 100) : 0;
      const pctProj = prevAcum > 0 ? Math.round((projFinal / prevAcum) * 100) : 0;
      const subtipo_mo = registros[0]?.subtipo_mo ?? null;
      return { nome, subtipo_mo, byMes, totalPrev: prevAcum, totalReal: realAcum, totalProj: projFinal, pctReal, pctProj };
    });
  }, [histogramas]);

  // Chart data: monthly totals + running accumulation
  const chartData = useMemo(() => {
    const filtH = (tipo === "MO" && activeSubtipos.size > 0)
      ? histogramas.filter(h => !h.subtipo_mo || activeSubtipos.has(h.subtipo_mo))
      : histogramas;

    const monthsWithReal = new Set(
      filtH.filter(h => (h.quantidade_realizada_mensal ?? 0) > 0)
        .map(h => h.mes_referencia?.slice(0, 7))
    );
    const lastRealIdx = mesesFiltrados.reduce(
      (last, m, i) => (monthsWithReal.has(mesKey(m)) ? i : last), -1
    );
    const totalReal = filtH.reduce(
      (s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0
    );

    // lastProjIdx: último mês (>= lastRealIdx) com qtd_projetado > 0
    const lastProjIdx = mesesFiltrados.reduce((last, m, i) => {
      if (i < lastRealIdx) return last;
      const mk = mesKey(m);
      const hasProj = filtH.some((h) => h.mes_referencia?.startsWith(mk) && (h.qtd_projetado ?? 0) > 0);
      return hasProj ? i : last;
    }, -1);

    let prevAcum = 0, realAcum = 0, projAcumDelta = 0;
    return mesesFiltrados.map((m, i) => {
      const mk = mesKey(m);
      const linhas = filtH.filter((h) => h.mes_referencia?.startsWith(mk));
      const prev = linhas.reduce((s, h) => s + (h.quantidade_prevista_mensal ?? 0), 0);
      const real = linhas.reduce((s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0);
      const proj = linhas.reduce((s, h) => s + (h.qtd_projetado ?? 0), 0);
      prevAcum += prev;
      realAcum += real;

      let projAcum = null;
      if (lastRealIdx >= 0 && lastProjIdx >= 0 && i >= lastRealIdx && i <= lastProjIdx) {
        projAcumDelta += proj;
        projAcum = totalReal + projAcumDelta;
      }

      return {
        mes: mesLabel(m), prev, real, proj,
        prevAcum: prevAcum > 0 ? prevAcum : null,
        realAcum: i <= lastRealIdx ? realAcum : null,
        projAcum,
      };
    });
  }, [histogramas, mesesFiltrados, activeSubtipos, tipo]);

  // Derived: filtered + sorted resources + dynamic sticky total columns
  const recursosFiltrados = (() => {
    if (tipo !== "MO" || activeSubtipos.size === 0) return recursos;
    const SUB_ORDER = { MOD: 0, MOI: 1 };
    return [...recursos]
      .filter(r => !r.subtipo_mo || activeSubtipos.has(r.subtipo_mo))
      .sort((a, b) => (SUB_ORDER[a.subtipo_mo] ?? 99) - (SUB_ORDER[b.subtipo_mo] ?? 99));
  })();

  const stickyTotalCols = (() => {
    if (!showTotals) return [];
    const cols = [];
    const W = 52;
    let off = 180;
    if (showPrev) { cols.push({ key: "totalPrev", label: "T.Prev", left: off, cls: "text-blue-700 dark:text-blue-300" }); off += W; }
    if (showReal) { cols.push({ key: "totalReal", label: "T.Real", left: off, cls: "text-green-700 dark:text-green-300" }); off += W; }
    if (showProj) { cols.push({ key: "totalProj", label: "T.Proj", left: off, cls: "text-amber-600 dark:text-amber-400" }); off += W; }
    if (showReal) { cols.push({ key: "pctReal",   label: "%Real",  left: off, cls: "text-green-700 dark:text-green-300", pct: true }); off += W; }
    if (showProj) { cols.push({ key: "pctProj",   label: "%Proj",  left: off, cls: "text-amber-600 dark:text-amber-400", pct: true }); }
    return cols;
  })();

  if (!selectedProjectId) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Selecione um projeto para ver o histograma.
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-32" />
              {[...Array(6)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-10" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-20 text-center text-red-500 text-sm">
        Erro ao carregar dados do histograma.
      </div>
    );
  }
  if (!projeto?.data_inicio || !projeto?.data_prevista_termino) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chips de toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exibir:</span>
        {[
          { key: "prev", label: "Previsto", active: showPrev, setActive: setShowPrev, activeStyle: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300" },
          { key: "real", label: "Real", active: showReal, setActive: setShowReal, activeStyle: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
          { key: "proj", label: "Projetado", active: showProj, setActive: setShowProj, activeStyle: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400" },
        ].map(({ key, label, active, setActive, activeStyle }) => (
          <button
            key={key}
            onClick={() => setActive((v) => !v)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
              ${active ? activeStyle : "bg-muted text-muted-foreground border-border opacity-50"}`}
          >
            {active ? "●" : "○"} {label}
          </button>
        ))}
        {tipo === "MO" && <>
          <div className="h-5 w-px bg-border mx-1" />
          {["MOD", "MOI"].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubtipos(prev => {
                const next = new Set(prev);
                if (next.has(sub)) next.delete(sub); else next.add(sub);
                return next;
              })}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
                ${activeSubtipos.has(sub)
                  ? sub === "MOD"
                    ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300"
                  : "bg-muted text-muted-foreground border-border opacity-50"}`}
            >
              {activeSubtipos.has(sub) ? "●" : "○"} {sub}
            </button>
          ))}
        </>}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowNovoDialog(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Novo {tipo === "MO" ? "Função" : "Equipamento"}
          </Button>
          <DateRangePicker
            label="Período"
            value={periodFilter}
            onChange={setPeriodFilter}
            onClear={() => setPeriodFilter(null)}
          />
        </div>
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-foreground text-sm">
            Evolução Mensal — {tipo === "MO" ? "Mão de Obra" : "Equipamentos"}
          </h3>
          <div className="overflow-x-auto">
            <div style={{ width: `${Math.max(chartData.length, 12) / 12 * 100}%`, minWidth: "100%" }}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  {showPrev && <Bar yAxisId="left" dataKey="prev" name="Previsto" fill="#3b82f6" opacity={0.8} />}
                  {showReal && <Bar yAxisId="left" dataKey="real" name="Real" fill="#16a34a" opacity={0.8} />}
                  {showProj && <Bar yAxisId="left" dataKey="proj" name="Projetado" fill="#f59e0b" opacity={0.8} />}
                  {showPrev && (
                    <Line yAxisId="right" type="monotone" dataKey="prevAcum" name="Acum. Prev"
                      stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  )}
                  {showReal && (
                    <Line yAxisId="right" type="monotone" dataKey="realAcum" name="Acum. Real"
                      stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                  )}
                  {showProj && (
                    <Line yAxisId="right" type="monotone" dataKey="projAcum" name="Acum. Proj"
                      stroke="#d97706" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div style={{ maxHeight: 420, overflowX: "auto", overflowY: "auto" }}>
          <table className="text-sm border-separate w-max min-w-full" style={{ borderSpacing: 0 }}>
            <thead className="sticky top-0 z-[50]">
              <tr className="bg-muted border-b border-border">
                {/* Nome + botão expandir (APENAS NO HEADER) */}
                <th
                  rowSpan={2}
                  style={{ position: "sticky", left: 0, zIndex: 30, width: 180, minWidth: 180 }}
                  className="bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="whitespace-nowrap">{tipo === "MO" ? "Função" : "Equipamento"}</span>
                    <button
                      onClick={() => setShowTotals(v => !v)}
                      title={showTotals ? "Recolher totais" : "Expandir totais"}
                      className="flex-shrink-0 w-4 h-4 rounded border border-border flex items-center justify-center hover:bg-muted-foreground/20 text-muted-foreground"
                    >
                      {showTotals ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                </th>
                {/* Totais sticky dinâmicos (expandido, condicionais ao chip) */}
                {stickyTotalCols.map(col => (
                  <th key={col.key} rowSpan={2}
                      style={{ position: "sticky", left: col.left, zIndex: 30 }}
                      className="bg-muted px-2 py-3 text-center text-xs font-semibold text-muted-foreground border-l border-border w-[52px] whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                {/* Meses */}
                {mesesFiltrados.map((m) => {
                  const colCount = [showPrev, showReal, showProj].filter(Boolean).length || 1;
                  return (
                    <th key={mesKey(m)} colSpan={colCount}
                      className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l border-border whitespace-nowrap">
                      {mesLabel(m)}
                    </th>
                  );
                })}
                <th rowSpan={2} className="px-2 py-3" />
              </tr>
              <tr className="bg-muted border-b border-border">
                {mesesFiltrados.flatMap((m) => {
                  const mk = mesKey(m);
                  const cols = [];
                  if (showPrev) cols.push(<th key={`${mk}-prev`} className="px-2 py-1 text-center text-[10px] font-medium text-blue-600 border-l-2 border-border whitespace-nowrap bg-muted">Prev</th>);
                  if (showReal) cols.push(<th key={`${mk}-real`} className={`px-2 py-1 text-center text-[10px] font-medium text-green-600 ${cols.length === 0 ? "border-l-2" : "border-l"} border-border whitespace-nowrap bg-muted`}>Real</th>);
                  if (showProj) cols.push(<th key={`${mk}-proj`} className={`px-2 py-1 text-center text-[10px] font-medium text-amber-600 ${cols.length === 0 ? "border-l-2" : "border-l"} border-border whitespace-nowrap bg-muted`}>Proj</th>);
                  if (cols.length === 0) cols.push(<th key={`${mk}-empty`} className="px-2 py-1 border-l-2 border-border bg-muted" />);
                  return cols;
                })}
              </tr>
            </thead>

            <tbody>
              {recursosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={99} className="py-12 text-center text-muted-foreground text-sm">
                    {tipo === "MO" && activeSubtipos.size < 2
                    ? `Nenhuma função do tipo ${[...activeSubtipos].join("/") || "selecionado"}.`
                    : `Nenhum ${tipo === "MO" ? "função" : "equipamento"} cadastrado.`}
                  </td>
                </tr>
              )}
              {(() => {
                const hasGroups = tipo === "MO" &&
                  recursosFiltrados.some(r => r.subtipo_mo === "MOD") &&
                  recursosFiltrados.some(r => r.subtipo_mo === "MOI");
                return recursosFiltrados.map((recurso, idx) => {
                  const prevSub = idx > 0 ? recursosFiltrados[idx - 1].subtipo_mo : "__start__";
                  const isGroupStart = hasGroups && recurso.subtipo_mo && recurso.subtipo_mo !== prevSub;
                  return (
                    <React.Fragment key={recurso.nome}>
                      {isGroupStart && (() => {
                        const grpRes = recursosFiltrados.filter(r => r.subtipo_mo === recurso.subtipo_mo);
                        const gPrev = grpRes.reduce((s, r) => s + r.totalPrev, 0);
                        const gReal = grpRes.reduce((s, r) => s + r.totalReal, 0);
                        const gProj = grpRes.reduce((s, r) => s + r.totalProj, 0);
                        const gPctReal = gPrev > 0 ? Math.round((gReal / gPrev) * 100) : 0;
                        const gPctProj = gPrev > 0 ? Math.round((gProj / gPrev) * 100) : 0;
                        const gt = { totalPrev: gPrev, totalReal: gReal, totalProj: gProj, pctReal: gPctReal, pctProj: gPctProj };
                        const isMOD = recurso.subtipo_mo === "MOD";
                        const stickyBg = isMOD ? "bg-blue-50 dark:bg-card" : "bg-orange-50 dark:bg-card";
                        const rowBg = isMOD ? "bg-blue-50/40 dark:bg-blue-950/20" : "bg-orange-50/40 dark:bg-orange-950/20";
                        const labelCls = isMOD ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300";
                        const colCount = [showPrev, showReal, showProj].filter(Boolean).length || 1;
                        return (
                          <tr className={`${rowBg} ${idx > 0 ? "border-t-2 border-border" : ""} text-xs font-bold`}>
                            <td style={{ position: "sticky", left: 0, zIndex: 10, width: 180, minWidth: 180 }}
                                className={`${stickyBg} px-3 py-1.5 ${labelCls}`}>
                              {recurso.subtipo_mo}
                            </td>
                            {stickyTotalCols.map(col => (
                              <td key={col.key}
                                  style={{ position: "sticky", left: col.left, zIndex: 10 }}
                                  className={`${stickyBg} px-2 py-1.5 text-center ${col.cls} border-l border-border w-[52px]`}>
                                {col.pct ? `${gt[col.key]}%` : gt[col.key]}
                              </td>
                            ))}
                            {mesesFiltrados.flatMap((m) => {
                              const mk = mesKey(m);
                              const linhas = histogramas.filter(h =>
                                h.mes_referencia?.startsWith(mk) && h.subtipo_mo === recurso.subtipo_mo
                              );
                              const tPrev = linhas.reduce((s, h) => s + (h.quantidade_prevista_mensal ?? 0), 0);
                              const tReal = linhas.reduce((s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0);
                              const tProj = linhas.reduce((s, h) => s + (h.qtd_projetado ?? 0), 0);
                              const cells = [];
                              if (showPrev) cells.push(<td key={`${mk}-prev`} className="px-2 py-1.5 text-center text-blue-700/80 dark:text-blue-300/80 border-l-2 border-border/50">{tPrev || "·"}</td>);
                              if (showReal) cells.push(<td key={`${mk}-real`} className={`px-2 py-1.5 text-center text-green-700/80 dark:text-green-300/80 ${cells.length === 0 ? "border-l-2" : "border-l"} border-border/50`}>{tReal || "·"}</td>);
                              if (showProj) cells.push(<td key={`${mk}-proj`} className={`px-2 py-1.5 text-center text-amber-600/80 dark:text-amber-400/80 ${cells.length === 0 ? "border-l-2" : "border-l"} border-border/50`}>{tProj || "·"}</td>);
                              if (cells.length === 0) cells.push(<td key={`${mk}-empty`} className="border-l-2 border-border/20 py-1.5" />);
                              return cells;
                            })}
                            <td />
                          </tr>
                        );
                      })()}
                <tr
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                  {/* Nome + badge subtipo (sem botão — botão só no header) */}
                  <td
                    style={{ position: "sticky", left: 0, zIndex: 10, width: 180, minWidth: 180 }}
                    className="bg-card px-3 py-2 font-medium text-foreground"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate text-xs">{recurso.nome}</span>
                      {tipo === "MO" && recurso.subtipo_mo && (
                        <span className={`flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded leading-tight ${
                          recurso.subtipo_mo === "MOD"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                        }`}>
                          {recurso.subtipo_mo}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Totais sticky dinâmicos */}
                  {stickyTotalCols.map(col => (
                    <td key={col.key}
                        style={{ position: "sticky", left: col.left, zIndex: 10 }}
                        className={`bg-card px-2 py-2 text-center text-xs font-semibold ${col.cls} border-l border-border w-[52px]`}>
                      {col.pct ? `${recurso[col.key]}%` : recurso[col.key]}
                    </td>
                  ))}
                  {/* Meses */}
                  {mesesFiltrados.flatMap((m) => {
                    const mk = mesKey(m);
                    const reg = recurso.byMes[mk];
                    const cells = [];
                    if (showPrev) cells.push(
                      <CelulaEditavel key={`${mk}-prev`} registro={reg} campo="quantidade_prevista_mensal" onSave={updateCelula} isFirstInMonth={true} />
                    );
                    if (showReal) cells.push(
                      <CelulaEditavel key={`${mk}-real`} registro={reg} campo="quantidade_realizada_mensal" onSave={updateCelula} isFirstInMonth={cells.length === 0} />
                    );
                    if (showProj) cells.push(
                      <CelulaEditavel key={`${mk}-proj`} registro={reg} campo="qtd_projetado" onSave={updateCelula} isFirstInMonth={cells.length === 0} />
                    );
                    if (cells.length === 0) {
                      cells.push(<td key={`${mk}-empty`} className="px-2 py-2 border-l-2 border-border w-12" />);
                    }
                    return cells;
                  })}
                  {/* Excluir */}
                  <td className="px-2 py-2">
                    <RowActions
                      onDelete={() => deleteRecurso(recurso.nome)}
                      deleteTitle={`Excluir "${recurso.nome}"?`}
                      deleteDescription="Esta ação removerá todos os registros mensais e não pode ser desfeita."
                    />
                  </td>
                </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>

            {recursosFiltrados.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted font-bold text-xs">
                  <td style={{ position: "sticky", left: 0, zIndex: 20, width: 180, minWidth: 180 }}
                      className="bg-muted px-3 py-2 text-muted-foreground uppercase tracking-wide">TOTAL</td>
                  {/* Grand totais dinâmicos (expandido) */}
                  {(() => {
                    if (!showTotals) return null;
                    const gPrev = recursosFiltrados.reduce((s, r) => s + r.totalPrev, 0);
                    const gReal = recursosFiltrados.reduce((s, r) => s + r.totalReal, 0);
                    const gProj = recursosFiltrados.reduce((s, r) => s + r.totalProj, 0);
                    const gPctReal = gPrev > 0 ? Math.round((gReal / gPrev) * 100) : 0;
                    const gPctProj = gPrev > 0 ? Math.round((gProj / gPrev) * 100) : 0;
                    const gt = { totalPrev: gPrev, totalReal: gReal, totalProj: gProj, pctReal: gPctReal, pctProj: gPctProj };
                    return stickyTotalCols.map(col => (
                      <td key={col.key}
                          style={{ position: "sticky", left: col.left, zIndex: 20 }}
                          className={`bg-muted px-2 py-2 text-center ${col.cls} border-l border-border w-[52px]`}>
                        {col.pct ? `${gt[col.key]}%` : gt[col.key]}
                      </td>
                    ));
                  })()}
                  {/* Totais mensais (filtrados por subtipo) */}
                  {mesesFiltrados.flatMap((m) => {
                    const mk = mesKey(m);
                    const linhas = histogramas.filter((h) =>
                      h.mes_referencia?.startsWith(mk) &&
                      (tipo !== "MO" || activeSubtipos.size === 0 || !h.subtipo_mo || activeSubtipos.has(h.subtipo_mo))
                    );
                    const tPrev = linhas.reduce((s, h) => s + (h.quantidade_prevista_mensal ?? 0), 0);
                    const tReal = linhas.reduce((s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0);
                    const tProj = linhas.reduce((s, h) => s + (h.qtd_projetado ?? 0), 0);
                    const cells = [];
                    if (showPrev) cells.push(<td key={`${mk}-prev`} className="px-2 py-2 text-center text-blue-700 dark:text-blue-300 border-l-2 border-border">{tPrev || "·"}</td>);
                    if (showReal) cells.push(<td key={`${mk}-real`} className={`px-2 py-2 text-center text-green-700 dark:text-green-300 ${cells.length === 0 ? "border-l-2" : "border-l"} border-border`}>{tReal || "·"}</td>);
                    if (showProj) cells.push(<td key={`${mk}-proj`} className={`px-2 py-2 text-center text-amber-600 dark:text-amber-400 ${cells.length === 0 ? "border-l-2" : "border-l"} border-border`}>{tProj || "·"}</td>);
                    if (cells.length === 0) cells.push(<td key={`${mk}-empty`} className="px-2 py-2 border-l-2 border-border w-12" />);
                    return cells;
                  })}
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Dialog novo recurso */}
      <Dialog open={showNovoDialog} onOpenChange={(open) => { setShowNovoDialog(open); if (!open) setNovoFuncao(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo {tipo === "MO" ? "Função" : "Equipamento"}</DialogTitle>
          </DialogHeader>
          {(() => {
            const isDuplicate = novoFuncao
              ? recursos.some(r => r.nome.toLowerCase() === novoFuncao.nome.toLowerCase())
              : false;
            return (
              <>
                <div className="py-2 space-y-3">
                  <div className="space-y-1">
                    <Label>Selecione {tipo === "MO" ? "a função" : "o equipamento"} *</Label>
                    {opcoesAtivas.length === 0 ? (
                      <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-200">
                        Nenhum cadastrado. Acesse <strong>Configurações → Cadastros</strong> para adicionar.
                      </p>
                    ) : (
                      <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                        {opcoesAtivas.map(opcao => (
                          <button
                            key={opcao.id}
                            type="button"
                            onClick={() => setNovoFuncao(opcao)}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                              novoFuncao?.id === opcao.id
                                ? "bg-primary/10 text-foreground"
                                : "hover:bg-muted/50 text-foreground"
                            }`}
                          >
                            {tipo === "MO" && opcao.subtipo_mo && (
                              <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${
                                opcao.subtipo_mo === "MOD"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                              }`}>{opcao.subtipo_mo}</span>
                            )}
                            <span>{opcao.nome}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {isDuplicate && (
                    <p className="text-xs text-destructive">
                      {tipo === "MO" ? "Esta função" : "Este equipamento"} já foi adicionado ao histograma.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Serão criados {projectMonths.length} registros mensais com valores zerados.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowNovoDialog(false); setNovoFuncao(null); }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="save"
                    disabled={!novoFuncao || createRecurso.isPending || isDuplicate}
                    onClick={() => { if (novoFuncao && !isDuplicate) createRecurso.mutate(novoFuncao.nome); }}
                  >
                    {createRecurso.isPending ? "Criando..." : isDuplicate ? "Já existe" : "Criar"}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}
