// src/components/planejamento/AvancoFisicoPanel.jsx
import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  startOfMonth,
  subMonths,
  addYears,
  parseISO,
  format,
  eachWeekOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { computeAvancoSeries } from "./avancoSeries";
import AvancoCards from "./AvancoCards";
import CurvaSChart from "./CurvaSChart";
import AvancoTabela from "./AvancoTabela";

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekKey(monday) {
  return `${getISOWeekYear(monday)}-W${String(getISOWeek(monday)).padStart(2, "0")}`;
}

function monthKey(date) {
  return format(startOfMonth(date), "yyyy-MM");
}

function getProjectWeeks(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return [];
  try {
    return eachWeekOfInterval(
      { start: subMonths(parseISO(dataInicio), 3), end: addYears(parseISO(dataFim), 1) },
      { weekStartsOn: 1 }
    );
  } catch {
    return [];
  }
}

function isCurrentOrPastWeek(monday) {
  return monday <= startOfISOWeek(new Date());
}

const FIELDS = {
  prev: "avanco_previsto_mensal",
  real: "avanco_realizado_mensal",
  proj: "avanco_projetado",
};

const EXPORT_COLUMNS = [
  { key: "semana_iso",              label: "Semana ISO",    type: "string", required: true },
  { key: "avanco_previsto_mensal",  label: "Previsto (%)",  type: "number" },
  { key: "avanco_realizado_mensal", label: "Real (%)",      type: "number" },
  { key: "avanco_projetado",        label: "Projetado (%)", type: "number" },
];

const formatPct = (v) => `${Number(v).toFixed(2).replace(".", ",")}%`;

function buildRows(cards) {
  return [
    {
      campo:          FIELDS.prev,
      label:          "Previsto",
      dotColor:       "bg-blue-500",
      rowCls:         "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/20",
      headerActiveBg: "bg-blue-50 dark:bg-card border-r border-border",
      headerCls:      "text-blue-700 dark:text-blue-300",
      acumValue:      cards.prevAcum,
      isRealRow:      false,
    },
    {
      campo:          FIELDS.real,
      label:          "Real",
      dotColor:       "bg-green-500",
      rowCls:         "bg-green-50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/20",
      headerActiveBg: "bg-green-50 dark:bg-card border-r border-border",
      headerCls:      "text-green-700 dark:text-green-300",
      acumValue:      cards.realAcum,
      isRealRow:      true,
    },
    {
      campo:          FIELDS.proj,
      label:          "Projetado",
      dotColor:       "bg-amber-500",
      rowCls:         "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20",
      headerActiveBg: "bg-yellow-50 dark:bg-card border-r border-border",
      headerCls:      "text-amber-700 dark:text-amber-300",
      acumValue:      cards.projAcum,
      isRealRow:      false,
      blockWhenField: FIELDS.real,
    },
  ];
}

// ── AvancoFisicoPanel ──────────────────────────────────────────────────────────

export default function AvancoFisicoPanel({ showImportExport, setShowImportExport }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showPrev, setShowPrev] = React.useState(true);
  const [showReal, setShowReal] = React.useState(true);
  const [showProj, setShowProj] = React.useState(true);
  const [viewMode, setViewMode] = React.useState("semanal"); // "semanal" | "mensal"

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: avancos = [], isPending, isError } = useQuery({
    queryKey: ["avanco_fisico", selectedProjectId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: projetoArr = [] } = useQuery({
    queryKey: ["projetos", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const projeto = projetoArr[0] ?? null;

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const onErr = (e) =>
    toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const onSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["avanco_fisico", selectedProjectId] });
    toast({ title: "Salvo", description: "Avanço atualizado.", duration: 2000 });
  };

  const updateMut = useMutation({
    mutationFn: ({ id, updates }) => entities.AvancoFisico.update(id, updates),
    onSuccess: onSaved,
    onError: onErr,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.AvancoFisico.create(data),
    onSuccess: onSaved,
    onError: onErr,
  });

  // ── Derived data ──────────────────────────────────────────────────────────────

  const projectWeeks = useMemo(
    () => getProjectWeeks(projeto?.data_inicio, projeto?.data_prevista_termino),
    [projeto]
  );

  const dataMap = useMemo(() => {
    const m = new Map();
    avancos.forEach((r) => r.semana_iso && m.set(r.semana_iso, r));
    return m;
  }, [avancos]);

  // Períodos mensais únicos derivados das semanas do projeto
  const monthPeriods = useMemo(() => {
    const seen = new Set();
    const months = [];
    projectWeeks.forEach((monday) => {
      const k = monthKey(monday);
      if (!seen.has(k)) { seen.add(k); months.push(startOfMonth(monday)); }
    });
    return months;
  }, [projectWeeks]);

  // dataMap mensal: soma dos valores semanais agrupados por mês (read-only)
  const monthDataMap = useMemo(() => {
    const m = new Map();
    projectWeeks.forEach((monday) => {
      const mKey = monthKey(monday);
      const weekRec = dataMap.get(weekKey(monday));
      if (!weekRec) return;
      const existing = m.get(mKey) ?? {
        [FIELDS.prev]: 0,
        [FIELDS.real]: 0,
        [FIELDS.proj]: 0,
      };
      existing[FIELDS.prev] += weekRec[FIELDS.prev] ?? 0;
      existing[FIELDS.real] += weekRec[FIELDS.real] ?? 0;
      existing[FIELDS.proj] += weekRec[FIELDS.proj] ?? 0;
      m.set(mKey, existing);
    });
    return m;
  }, [dataMap, projectWeeks]);

  const isMensal = viewMode === "mensal";

  const { chartData, cards, lastRealPeriod } = useMemo(() => {
    const periods = isMensal ? monthPeriods : projectWeeks;
    if (periods.length === 0) {
      return {
        chartData: [],
        cards: { prevAcum: 0, realAcum: 0, projAcum: 0, desvio: 0 },
        lastRealPeriod: null,
      };
    }
    const dMap   = isMensal ? monthDataMap : dataMap;
    const pKey   = isMensal ? monthKey : weekKey;
    const pLabel = isMensal
      ? (d) => format(startOfMonth(d), "MMM/yy", { locale: ptBR })
      : (d) => format(d, "dd/MM");
    const curKey = isMensal
      ? monthKey(new Date())
      : weekKey(startOfISOWeek(new Date()));

    return computeAvancoSeries({
      dataMap: dMap,
      periods,
      periodKey: pKey,
      periodLabel: pLabel,
      fields: FIELDS,
      currentPeriodKey: curKey,
    });
  }, [viewMode, isMensal, monthPeriods, monthDataMap, projectWeeks, dataMap]);

  const lastRealLabel = lastRealPeriod
    ? (isMensal
        ? format(startOfMonth(lastRealPeriod), "MMM/yy", { locale: ptBR })
        : format(lastRealPeriod, "dd/MM"))
    : null;

  const tableRows = buildRows(cards);

  // ── Save handler ──────────────────────────────────────────────────────────────

  const handleSave = (semanaIso, campo, valor) => {
    const existing = dataMap.get(semanaIso);
    if (existing) {
      const updates = { [campo]: valor };
      // Regra de negócio: ao salvar Real, zera Projetado da mesma semana
      if (campo === "avanco_realizado_mensal") updates.avanco_projetado = 0;
      updateMut.mutate({ id: existing.id, updates });
    } else {
      const data = {
        projeto_id: selectedProjectId,
        semana_iso: semanaIso,
        [campo]: valor,
      };
      if (campo === "avanco_realizado_mensal") data.avanco_projetado = 0;
      createMut.mutate(data);
    }
  };

  // ── Early returns ─────────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[320px] rounded-xl" />
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-32" />
              {[...Array(8)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-14" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
        Erro ao carregar dados de avanço físico. Tente recarregar a página.
      </div>
    );
  }

  if (!projeto?.data_inicio || !projeto?.data_prevista_termino) {
    return (
      <PageEmptyState description="Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto." />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Chips de toggle + separador granularidade + botão Import/Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Exibir:
        </span>
        {[
          { key: "prev", label: "Previsto",  show: showPrev, setShow: setShowPrev, activeStyle: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300" },
          { key: "real", label: "Real",      show: showReal, setShow: setShowReal, activeStyle: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
          { key: "proj", label: "Projetado", show: showProj, setShow: setShowProj, activeStyle: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400" },
        ].map(({ key, label, show, setShow, activeStyle }) => (
          <button
            key={key}
            onClick={() => setShow((v) => !v)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
              ${show ? activeStyle : "bg-muted text-muted-foreground border-border opacity-50"}`}
          >
            {show ? "●" : "○"} {label}
          </button>
        ))}

        {/* Separador + toggle Semanal / Mensal */}
        <div className="h-5 w-px bg-border mx-1" />
        {[
          { key: "semanal", label: "Semanal" },
          { key: "mensal",  label: "Mensal"  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
              ${viewMode === key
                ? "bg-muted text-foreground border-border"
                : "bg-muted text-muted-foreground border-border opacity-50"}`}
          >
            {label}
          </button>
        ))}

      </div>

      {/* Cards KPI */}
      <AvancoCards
        prevAcum={cards.prevAcum}
        realAcum={cards.realAcum}
        projAcum={cards.projAcum}
        desvio={cards.desvio}
        formatValue={formatPct}
        lastRealLabel={lastRealLabel}
        periodUnitLabel={isMensal ? "mês" : "semana"}
      />

      {/* Gráfico Curva S */}
      <CurvaSChart
        data={chartData}
        xKey="label"
        showPrev={showPrev}
        showReal={showReal}
        showProj={showProj}
        valueFormatter={formatPct}
        title={`Evolução de Avanço Físico — ${isMensal ? "Mensal" : "Semanal"}`}
        yRightDomain={[0, 100]}
        yTickFormatter={(v) => `${v}%`}
      />

      {/* Tabela transposta */}
      <AvancoTabela
        periods={isMensal ? monthPeriods : projectWeeks}
        dataMap={isMensal ? monthDataMap : dataMap}
        periodKey={isMensal ? monthKey : weekKey}
        columnLabel={isMensal
          ? (d) => format(startOfMonth(d), "MMM/yy", { locale: ptBR })
          : (d) => format(d, "dd/MM")}
        groupByMonth={!isMensal}
        rows={tableRows}
        formatValue={formatPct}
        isBlocked={!isMensal ? (d) => !isCurrentOrPastWeek(d) : undefined}
        onSave={handleSave}
        readOnly={isMensal}
      />

      {/* Import/Export */}
      {showImportExport && (
        <ImportExportDialog
          open={showImportExport}
          onOpenChange={setShowImportExport}
          data={avancos}
          columns={EXPORT_COLUMNS}
          entityName="AvancoFisico"
          projectId={selectedProjectId}
        />
      )}
    </div>
  );
}
