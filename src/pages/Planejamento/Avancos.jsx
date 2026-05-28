import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getISOWeek, getISOWeekYear, startOfISOWeek,
  subMonths, addYears, parseISO, format,
  eachWeekOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Upload } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/ui/PageHeader";
import AvancoTabela from "@/components/planejamento/AvancoTabela";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── Helpers locais ────────────────────────────────────────────────────────────

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

const EXPORT_COLUMNS = [
  { key: "semana_iso",                label: "Semana ISO",              type: "string", required: true },
  { key: "avanco_previsto_mensal",    label: "Previsto (%)",            type: "number" },
  { key: "avanco_realizado_mensal",   label: "Real (%)",                type: "number" },
  { key: "avanco_projetado",          label: "Projetado (%)",           type: "number" },
];

// ── Avancos ────────────────────────────────────────────────────────────────────

export default function Avancos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = React.useState(false);
  const [showPrev, setShowPrev] = React.useState(true);
  const [showReal, setShowReal] = React.useState(true);
  const [showProj, setShowProj] = React.useState(true);
  const [granularidade, setGranularidade] = React.useState("semana");

  // ── Queries ──

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

  // ── Mutations ──

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

  // ── Derived data ──

  const projectWeeks = useMemo(
    () => getProjectWeeks(projeto?.data_inicio, projeto?.data_fim_prevista),
    [projeto]
  );

  const weekMap = useMemo(() => {
    const m = new Map();
    avancos.forEach((r) => r.semana_iso && m.set(r.semana_iso, r));
    return m;
  }, [avancos]);

  const { prevAcum, realAcum, projAcum, desvio } = useMemo(() => {
    const currentWK = weekKey(startOfISOWeek(new Date()));
    let prev = 0, real = 0, proj = 0;
    avancos.forEach((r) => {
      if (r.semana_iso <= currentWK) {
        prev += r.avanco_previsto_mensal ?? 0;
      }
      real += r.avanco_realizado_mensal ?? 0;
      proj += r.avanco_projetado ?? 0;
    });
    return { prevAcum: prev, realAcum: real, projAcum: proj, desvio: real - prev };
  }, [avancos]);

  const chartData = useMemo(() => {
    let pAcum = 0, rAcum = 0;
    return projectWeeks.map((w) => {
      const wk = weekKey(w);
      const r = weekMap.get(wk);
      const prev = r?.avanco_previsto_mensal ?? 0;
      const real = r?.avanco_realizado_mensal ?? 0;
      const proj = r?.avanco_projetado ?? 0;
      pAcum += prev;
      rAcum += real;
      return { week: format(w, "dd/MM"), prev, real, proj, prevAcum: pAcum, realAcum: rAcum };
    });
  }, [projectWeeks, weekMap]);

  // Agrupamento mensal: soma barras semanais e usa último acumulado do mês
  const chartDataMensal = useMemo(() => {
    const monthMap = new Map();
    projectWeeks.forEach((w, i) => {
      const mLabel = format(w, "MMM/yy", { locale: ptBR });
      const wd = chartData[i];
      if (!wd) return;
      if (!monthMap.has(mLabel)) {
        monthMap.set(mLabel, { month: mLabel, prev: 0, real: 0, proj: 0, prevAcum: 0, realAcum: 0 });
      }
      const m = monthMap.get(mLabel);
      m.prev += wd.prev;
      m.real += wd.real;
      m.proj += wd.proj;
      m.prevAcum = wd.prevAcum;
      m.realAcum = wd.realAcum;
    });
    return [...monthMap.values()];
  }, [projectWeeks, chartData]);

  // ── Save handler ──

  const handleSave = (semanaIso, campo, valor) => {
    const existing = weekMap.get(semanaIso);
    if (existing) {
      const updates = { [campo]: valor };
      // Ao salvar Real, limpar Projetado da mesma semana (regra de negócio)
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

  // ── Early returns ──

  if (!selectedProjectId) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Selecione um projeto para ver o avanço físico.
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-32" />
              {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-4 w-14" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-red-500 text-sm">
        Erro ao carregar dados de avanço físico.
      </div>
    );
  }

  if (!projeto?.data_inicio || !projeto?.data_fim_prevista) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto.
      </div>
    );
  }

  // ── Render ──

  const desvioPositive = desvio >= 0;
  const activeChartData = granularidade === "semana" ? chartData : chartDataMensal;
  const chartXKey = granularidade === "semana" ? "week" : "month";

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Previsto Acumulado",
            value: `${prevAcum.toFixed(1)}%`,
            sub: "até semana atual",
            color: "text-blue-700 dark:text-blue-300",
            fill: "#3b82f6",
            pct: Math.min(prevAcum, 100),
          },
          {
            label: "Real Acumulado",
            value: `${realAcum.toFixed(1)}%`,
            sub: "até última semana lançada",
            color: "text-green-700 dark:text-green-300",
            fill: "#16a34a",
            pct: Math.min(realAcum, 100),
          },
          {
            label: "Projetado Acumulado",
            value: `${projAcum.toFixed(1)}%`,
            sub: "até fim do projeto",
            color: "text-amber-700 dark:text-amber-300",
            fill: "#f59e0b",
            pct: Math.min(projAcum, 100),
          },
          {
            label: "Desvio (Real − Previsto)",
            value: `${desvio >= 0 ? "+" : ""}${desvio.toFixed(1)}%`,
            sub: desvioPositive ? "adiantado" : "atraso em relação ao previsto",
            color: desvioPositive ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400",
            fill: desvioPositive ? "#16a34a" : "#dc2626",
            pct: Math.min(Math.abs(desvio), 100),
          },
        ].map(({ label, value, sub, color, fill, pct }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {label}
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
            <div className="h-[3px] bg-muted rounded-full mt-3">
              <div className="h-[3px] rounded-full" style={{ background: fill, width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabela Transposta */}
      <AvancoTabela
        projectWeeks={projectWeeks}
        weekMap={weekMap}
        prevAcum={prevAcum}
        realAcum={realAcum}
        projAcum={projAcum}
        onSave={handleSave}
      />

      {/* Gráfico Curva S */}
      {activeChartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground text-sm">
                Evolução de Avanço Físico
              </h3>
              <div className="flex rounded overflow-hidden border border-border">
                {[
                  { key: "semana", label: "Semana" },
                  { key: "mes", label: "Mês" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setGranularidade(key)}
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      granularidade === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                { key: "prev", label: "Previsto", show: showPrev, setShow: setShowPrev, color: "#3b82f6" },
                { key: "real", label: "Real",     show: showReal, setShow: setShowReal, color: "#16a34a" },
                { key: "proj", label: "Projetado", show: showProj, setShow: setShowProj, color: "#f59e0b" },
              ].map(({ key, label, show, setShow, color }) => (
                <button
                  key={key}
                  onClick={() => setShow((v) => !v)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-opacity ${show ? "opacity-100" : "opacity-40"}`}
                  style={{ background: color + "22", color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={activeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey={chartXKey}
                tick={{ fontSize: 10 }}
                interval={granularidade === "semana" ? 3 : 0}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
              <Legend />
              <Bar yAxisId="left" dataKey="prev" name="Previsto" fill="#3b82f6" opacity={0.7} hide={!showPrev} />
              <Bar yAxisId="left" dataKey="real" name="Real"     fill="#16a34a" opacity={0.7} hide={!showReal} />
              <Bar yAxisId="left" dataKey="proj" name="Projetado" fill="#f59e0b" opacity={0.7} hide={!showProj} />
              <Line yAxisId="right" type="monotone" dataKey="prevAcum" name="Acum. Prev"
                stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} hide={!showPrev} />
              <Line yAxisId="right" type="monotone" dataKey="realAcum" name="Acum. Real"
                stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} hide={!showReal} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

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
