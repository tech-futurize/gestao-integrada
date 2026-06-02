// src/components/planejamento/AvancoFisicoPanel.jsx
import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  subMonths,
  addYears,
  parseISO,
  format,
  eachWeekOfInterval,
} from "date-fns";
import { Upload } from "lucide-react";
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
  { key: "semana_iso",              label: "Semana ISO",   type: "string", required: true },
  { key: "avanco_previsto_mensal",  label: "Previsto (%)", type: "number" },
  { key: "avanco_realizado_mensal", label: "Real (%)",     type: "number" },
  { key: "avanco_projetado",        label: "Projetado (%)", type: "number" },
];

const formatPct = (v) => `${Number(v).toFixed(2).replace(".", ",")}%`;

// Definição das linhas da tabela (Previsto / Real / Projetado) — recebe acumValues dinâmicos
function buildRows(cards) {
  return [
    {
      campo:           FIELDS.prev,
      label:           "Previsto",
      dotColor:        "bg-blue-500",
      rowCls:          "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/20",
      headerActiveBg:  "bg-blue-50 dark:bg-blue-950/20 border-r border-border",
      headerCls:       "text-blue-700 dark:text-blue-300",
      acumValue:       cards.prevAcum,
      isRealRow:       false,
    },
    {
      campo:           FIELDS.real,
      label:           "Real",
      dotColor:        "bg-green-500",
      rowCls:          "bg-green-50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/20",
      headerActiveBg:  "bg-green-50 dark:bg-green-950/20 border-r border-border",
      headerCls:       "text-green-700 dark:text-green-300",
      acumValue:       cards.realAcum,
      isRealRow:       true,
    },
    {
      campo:           FIELDS.proj,
      label:           "Projetado",
      dotColor:        "bg-amber-500",
      rowCls:          "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20",
      headerActiveBg:  "bg-yellow-50 dark:bg-yellow-950/20 border-r border-border",
      headerCls:       "text-amber-700 dark:text-amber-300",
      acumValue:       cards.projAcum,
      isRealRow:       false,
    },
  ];
}

// ── AvancoFisicoPanel ──────────────────────────────────────────────────────────

export default function AvancoFisicoPanel() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showImportExport, setShowImportExport] = React.useState(false);
  const [showPrev, setShowPrev] = React.useState(true);
  const [showReal, setShowReal] = React.useState(true);
  const [showProj, setShowProj] = React.useState(true);

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

  const { chartData, cards, lastRealPeriod } = useMemo(() => {
    if (projectWeeks.length === 0) {
      return {
        chartData: [],
        cards: { prevAcum: 0, realAcum: 0, projAcum: 0, desvio: 0 },
        lastRealPeriod: null,
      };
    }
    return computeAvancoSeries({
      dataMap,
      periods: projectWeeks,
      periodKey: weekKey,
      periodLabel: (d) => format(d, "dd/MM"),
      fields: FIELDS,
      currentPeriodKey: weekKey(startOfISOWeek(new Date())),
    });
  }, [dataMap, projectWeeks]);

  const lastRealLabel = lastRealPeriod ? format(lastRealPeriod, "dd/MM") : null;
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
        {/* Chips skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {/* Chart skeleton */}
        <Skeleton className="h-[320px] rounded-xl" />
        {/* Table skeleton */}
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
      {/* Chips de toggle + botão Import/Export */}
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
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => setShowImportExport(true)}
        >
          <Upload className="w-3.5 h-3.5 mr-1" />
          Importar / Exportar
        </Button>
      </div>

      {/* Cards KPI */}
      <AvancoCards
        prevAcum={cards.prevAcum}
        realAcum={cards.realAcum}
        projAcum={cards.projAcum}
        desvio={cards.desvio}
        formatValue={formatPct}
        lastRealLabel={lastRealLabel}
        periodUnitLabel="semana"
      />

      {/* Gráfico Curva S */}
      <CurvaSChart
        data={chartData}
        xKey="label"
        showPrev={showPrev}
        showReal={showReal}
        showProj={showProj}
        valueFormatter={formatPct}
        title="Evolução de Avanço Físico"
      />

      {/* Tabela transposta */}
      <AvancoTabela
        periods={projectWeeks}
        dataMap={dataMap}
        periodKey={weekKey}
        columnLabel={(d) => format(d, "dd/MM")}
        groupByMonth={true}
        rows={tableRows}
        formatValue={(v) => Number(v).toFixed(2).replace(".", ",")}
        isBlocked={(d) => !isCurrentOrPastWeek(d)}
        onSave={handleSave}
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
