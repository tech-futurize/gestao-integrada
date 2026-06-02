import { useState, useMemo } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eachMonthOfInterval, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Minus } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
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

function normalizeStr(s) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}

function isSimilar(a, b) {
  const na = normalizeStr(a);
  const nb = normalizeStr(b);
  if (na === nb || na.length < 3 || nb.length < 3) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  return levenshtein(na, nb) / Math.max(na.length, nb.length) <= 0.35;
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

  const hasReal = (registro.quantidade_realizada_mensal ?? 0) > 0;

  const disabled =
    (campo === "quantidade_realizada_mensal" && isFutureMonth(registro.mes_referencia)) ||
    (campo === "qtd_projetado" && hasReal);

  if (disabled) {
    const valorBloqueado = registro[campo] ?? 0;
    return (
      <td
        className={`px-2 py-1 text-center ${borderClass} bg-slate-100/80 dark:bg-slate-700/25 text-muted-foreground/60 text-xs w-12 cursor-not-allowed`}
        title={campo === "qtd_projetado" ? "Mês com real preenchido — projetado congelado" : "Mês futuro — edição de Real bloqueada"}
      >
        {valorBloqueado > 0 ? valorBloqueado : "—"}
      </td>
    );
  }

  const valor = registro[campo] ?? 0;

  const handleBlur = () => {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    onSave(registro, campo, Number(inputVal));
    setEditing(false);
  };

  return (
    <td
      className={`px-2 py-1 text-center cursor-pointer hover:bg-muted/40 w-12 ${borderClass}`}
      onClick={() => {
        if (!editing) {
          setInputVal(String(valor));
          setEditing(true);
        }
      }}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          step="1"
          min="0"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={handleBlur}
          onWheel={(e) => e.currentTarget.blur()}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
            if (e.key === "Enter") {
              cancelRef.current = false;
              e.target.blur();
            }
            if (e.key === "Escape") {
              cancelRef.current = true;
              setEditing(false);
            }
          }}
          className="w-10 text-center border rounded text-xs p-0 bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <span className="text-xs">{valor}</span>
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
  const [filterSubtipo, setFilterSubtipo] = useState(null);
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoSubtipo, setNovoSubtipo] = useState("MOD");
  const [similarWarning, setSimilarWarning] = useState(null);

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

  const projectMonths = useMemo(
    () => getProjectMonths(projeto?.data_inicio, projeto?.data_prevista_termino),
    [projeto]
  );

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
      for (const m of projectMonths) {
        await entities.Histograma.create({
          projeto_id: selectedProjectId,
          tipo,
          nome_recurso,
          mes_referencia: format(m, "yyyy-MM-dd"),
          quantidade_prevista_mensal: 0,
          quantidade_realizada_mensal: 0,
          qtd_projetado: 0,
          ...(tipo === "MO" ? { subtipo_mo: novoSubtipo } : {}),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["histogramas", selectedProjectId, tipo] });
      setShowNovoDialog(false);
      setNovoNome("");
      setNovoSubtipo("MOD");
      setSimilarWarning(null);
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
    const filtH = (tipo === "MO" && filterSubtipo)
      ? histogramas.filter(h => h.subtipo_mo === filterSubtipo)
      : histogramas;

    const monthsWithReal = new Set(
      filtH.filter(h => (h.quantidade_realizada_mensal ?? 0) > 0)
        .map(h => h.mes_referencia?.slice(0, 7))
    );
    const lastRealIdx = projectMonths.reduce(
      (last, m, i) => (monthsWithReal.has(mesKey(m)) ? i : last), -1
    );
    const totalReal = filtH.reduce(
      (s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0
    );

    let prevAcum = 0, realAcum = 0, projAcumDelta = 0;
    return projectMonths.map((m, i) => {
      const mk = mesKey(m);
      const linhas = filtH.filter((h) => h.mes_referencia?.startsWith(mk));
      const prev = linhas.reduce((s, h) => s + (h.quantidade_prevista_mensal ?? 0), 0);
      const real = linhas.reduce((s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0);
      const proj = linhas.reduce((s, h) => s + (h.qtd_projetado ?? 0), 0);
      prevAcum += prev;
      realAcum += real;

      let projAcum = null;
      if (lastRealIdx >= 0 && i >= lastRealIdx) {
        projAcumDelta += proj;
        projAcum = totalReal + projAcumDelta;
      }

      return {
        mes: mesLabel(m), prev, real, proj,
        prevAcum: prevAcum > 0 ? prevAcum : null,
        realAcum: real > 0 ? realAcum : null,
        projAcum,
      };
    });
  }, [histogramas, projectMonths, filterSubtipo, tipo]);

  // Derived: filtered resources + dynamic sticky total columns
  const recursosFiltrados = (tipo === "MO" && filterSubtipo)
    ? recursos.filter(r => r.subtipo_mo === filterSubtipo)
    : recursos;

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
              onClick={() => setFilterSubtipo(prev => prev === sub ? null : sub)}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
                ${filterSubtipo === sub
                  ? sub === "MOD"
                    ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300"
                  : "bg-muted text-muted-foreground border-border opacity-60"}`}
            >
              {filterSubtipo === sub ? "●" : "○"} {sub}
            </button>
          ))}
        </>}
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowNovoDialog(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Novo {tipo === "MO" ? "Função" : "Equipamento"}
        </Button>
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
                  <Legend />
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
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-max min-w-full">
            <thead>
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
                {projectMonths.map((m) => {
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
                {projectMonths.flatMap((m) => {
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
                    {filterSubtipo
                      ? `Nenhum ${tipo === "MO" ? "função" : "equipamento"} do tipo ${filterSubtipo}.`
                      : `Nenhum ${tipo === "MO" ? "função" : "equipamento"} cadastrado.`}
                  </td>
                </tr>
              )}
              {recursosFiltrados.map((recurso, idx) => (
                <tr key={recurso.nome}
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
                  {projectMonths.flatMap((m) => {
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
              ))}
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
                  {projectMonths.flatMap((m) => {
                    const mk = mesKey(m);
                    const linhas = histogramas.filter((h) =>
                      h.mes_referencia?.startsWith(mk) &&
                      (tipo !== "MO" || !filterSubtipo || h.subtipo_mo === filterSubtipo)
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
      <Dialog open={showNovoDialog} onOpenChange={(open) => { setShowNovoDialog(open); if (!open) { setNovoNome(""); setNovoSubtipo("MOD"); setSimilarWarning(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo {tipo === "MO" ? "Função (MO)" : "Equipamento"}</DialogTitle>
          </DialogHeader>
          {(() => {
            const nomeTrim = novoNome.trim();
            const isDuplicate = recursos.some(
              (r) => r.nome.toLowerCase() === nomeTrim.toLowerCase()
            );
            const similarMatch = !isDuplicate && nomeTrim.length >= 2
              ? (recursos.find(r => isSimilar(r.nome, nomeTrim))?.nome ?? null)
              : null;

            const handleCreate = () => {
              if (!nomeTrim || isDuplicate) return;
              if (similarMatch && !similarWarning) {
                setSimilarWarning(similarMatch);
                return;
              }
              setSimilarWarning(null);
              createRecurso.mutate(nomeTrim);
            };

            return (
              <>
                <div className="py-2 space-y-3">
                  {tipo === "MO" && (
                    <div className="space-y-1">
                      <Label>Tipo *</Label>
                      <div className="flex gap-2">
                        {["MOD", "MOI"].map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setNovoSubtipo(sub)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                              ${novoSubtipo === sub
                                ? sub === "MOD"
                                  ? "bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300"
                                  : "bg-orange-100 border-orange-400 text-orange-700 dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-300"
                                : "border-border text-muted-foreground hover:bg-muted/50"}`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>{tipo === "MO" ? "Nome da função" : "Tipo de equipamento"} *</Label>
                    <Input
                      value={novoNome}
                      onChange={(e) => { setNovoNome(e.target.value); setSimilarWarning(null); }}
                      placeholder={tipo === "MO" ? "Ex: Soldador, Montador" : "Ex: Guindaste, Munck"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && nomeTrim && !isDuplicate) handleCreate();
                      }}
                    />
                  </div>
                  {similarWarning && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                      <span className="mt-0.5 shrink-0">⚠</span>
                      <span>
                        Existe {tipo === "MO" ? "uma função" : "um equipamento"} parecido:{" "}
                        <strong>"{similarWarning}"</strong>. Clique em <em>Criar mesmo assim</em> para confirmar.
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Serão criados {projectMonths.length} registros mensais com valores zerados.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowNovoDialog(false); setNovoNome(""); setNovoSubtipo("MOD"); setSimilarWarning(null); }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="save"
                    disabled={!nomeTrim || createRecurso.isPending || isDuplicate}
                    onClick={handleCreate}
                  >
                    {createRecurso.isPending
                      ? "Criando..."
                      : isDuplicate
                      ? "Já existe"
                      : similarWarning
                      ? "Criar mesmo assim"
                      : "Criar"}
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
