import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Upload } from "lucide-react";
import { addMonths, parseISO } from "date-fns";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import AvancoTabela from "@/components/avanco/AvancoTabela";
import {
  generateWeeksScale,
  groupWeeksByMonth,
} from "@/utils/isoWeek";

const EXPORT_COLUMNS = [
  { key: "semana_iso",              label: "Semana ISO",    type: "string", required: true },
  { key: "avanco_previsto_mensal",  label: "Previsto (%)",  type: "number" },
  { key: "avanco_realizado_mensal", label: "Realizado (%)", type: "number" },
  { key: "avanco_projetado",        label: "Projetado (%)", type: "number" },
];

export default function Avancos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = useState(false);
  const [viewMode, setViewMode] = useState("mes"); // "semana" | "mes"

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

  // ── Escala de semanas (-3m / +1a) ────────────────────────────────────────────

  const { weeks, monthGroups } = useMemo(() => {
    if (!projeto?.data_inicio || !projeto?.data_fim_prevista) {
      return { weeks: [], monthGroups: [] };
    }
    const start = addMonths(parseISO(projeto.data_inicio), -3);
    const end   = addMonths(parseISO(projeto.data_fim_prevista), 12);
    const ws    = generateWeeksScale(start, end);
    return { weeks: ws, monthGroups: groupWeeksByMonth(ws) };
  }, [projeto]);

  // ── Map semana_iso → registro ─────────────────────────────────────────────────

  const dataMap = useMemo(() => {
    const m = new Map();
    for (const row of avancos) {
      if (row.semana_iso) m.set(row.semana_iso, row);
    }
    return m;
  }, [avancos]);

  // ── Acumulados e KPIs ────────────────────────────────────────────────────────

  const { withAccum, accumByWeek, kpis } = useMemo(() => {
    const sorted = weeks
      .filter(w => dataMap.has(w))
      .map(w => dataMap.get(w));

    let prevAcum = 0, realAcum = 0, projAcum = 0;
    const accumByWeek = new Map();

    const withAccum = sorted.map(row => {
      prevAcum += row.avanco_previsto_mensal  ?? 0;
      realAcum += row.avanco_realizado_mensal ?? 0;
      projAcum += row.avanco_projetado        ?? 0;
      accumByWeek.set(row.semana_iso, { prevAcum, realAcum, projAcum });
      return { ...row, prevAcum, realAcum, projAcum };
    });

    const totalPrev    = prevAcum;
    const pctTotalReal = totalPrev > 0 ? (realAcum / totalPrev) * 100 : 0;
    const pctTotalProj = totalPrev > 0 ? (projAcum / totalPrev) * 100 : 0;
    const desvio       = realAcum - prevAcum;

    return { withAccum, accumByWeek, kpis: { pctTotalReal, pctTotalProj, desvio } };
  }, [weeks, dataMap]);

  // ── Dados do gráfico ──────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    if (viewMode === "semana") {
      return withAccum.map(row => ({
        name:     "S" + row.semana_iso.split("-W")[1],
        previsto:  row.avanco_previsto_mensal  ?? 0,
        realizado: row.avanco_realizado_mensal ?? 0,
        projetado: row.avanco_projetado        ?? 0,
        prevAcum:  row.prevAcum,
        realAcum:  row.realAcum,
      }));
    }
    // Modo mês: agrupa semanas por monthGroups
    return monthGroups.map(g => {
      const prev = g.weeks.reduce((s, w) => s + (dataMap.get(w)?.avanco_previsto_mensal  ?? 0), 0);
      const real = g.weeks.reduce((s, w) => s + (dataMap.get(w)?.avanco_realizado_mensal ?? 0), 0);
      const proj = g.weeks.reduce((s, w) => s + (dataMap.get(w)?.avanco_projetado        ?? 0), 0);
      const lastW = g.weeks[g.weeks.length - 1];
      const acum  = accumByWeek.get(lastW) ?? { prevAcum: 0, realAcum: 0 };
      return { name: g.label, previsto: prev, realizado: real, projetado: proj, prevAcum: acum.prevAcum, realAcum: acum.realAcum };
    });
  }, [viewMode, withAccum, monthGroups, dataMap, accumByWeek]);

  // ── Mutation de save inline ───────────────────────────────────────────────────

  const saveMut = useMutation({
    mutationFn: async ({ semana_iso, field, value }) => {
      const existing = dataMap.get(semana_iso);
      const payload = {
        projeto_id:              selectedProjectId,
        semana_iso,
        avanco_previsto_mensal:  existing?.avanco_previsto_mensal  ?? 0,
        avanco_realizado_mensal: existing?.avanco_realizado_mensal ?? 0,
        avanco_projetado:        existing?.avanco_projetado        ?? 0,
        [field]: value,
      };
      // Regra: ao salvar Real, zerar Projetado da mesma semana
      if (field === "avanco_realizado_mensal") {
        payload.avanco_projetado = 0;
      }
      if (existing?.id) {
        return entities.AvancoFisico.update(existing.id, payload);
      }
      return entities.AvancoFisico.create(payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["avanco_fisico", selectedProjectId] }),
    onError: e =>
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const handleSave = (semana_iso, field, value) => {
    saveMut.mutate({ semana_iso, field, value });
  };

  // ── Import / Export ───────────────────────────────────────────────────────────

  const handleExport = () =>
    weeks.map(w => {
      const row = dataMap.get(w) ?? {};
      return {
        semana_iso:              w,
        avanco_previsto_mensal:  row.avanco_previsto_mensal  ?? 0,
        avanco_realizado_mensal: row.avanco_realizado_mensal ?? 0,
        avanco_projetado:        row.avanco_projetado        ?? 0,
      };
    });

  const handleImport = async row => {
    const existing = await entities.AvancoFisico.filter({
      projeto_id: selectedProjectId,
      semana_iso: row.semana_iso,
    });
    const payload = {
      projeto_id:              selectedProjectId,
      semana_iso:              row.semana_iso,
      avanco_previsto_mensal:  parseFloat(row.avanco_previsto_mensal)  || 0,
      avanco_realizado_mensal: parseFloat(row.avanco_realizado_mensal) || 0,
      avanco_projetado:        parseFloat(row.avanco_projetado)        || 0,
    };
    if (existing.length > 0) {
      await entities.AvancoFisico.update(existing[0].id, payload);
    } else {
      await entities.AvancoFisico.create(payload);
    }
    queryClient.invalidateQueries({ queryKey: ["avanco_fisico", selectedProjectId] });
  };

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={TrendingUp}
            description="Selecione um projeto na barra lateral para ver o avanço físico."
          />
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={TrendingUp}
            description="Erro ao carregar dados de avanço físico. Tente recarregar a página."
          />
        </div>
      </div>
    );
  }

  if (!projeto?.data_inicio || !projeto?.data_fim_prevista) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={TrendingUp}
            description="Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto."
          />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "%Total Real",       value: `${kpis.pctTotalReal.toFixed(1)}%`, color: "#3b82f6" },
            { label: "%Total Projetado",  value: `${kpis.pctTotalProj.toFixed(1)}%`, color: "#f59e0b" },
            {
              label: "Desvio Acumulado",
              value: `${kpis.desvio >= 0 ? "+" : ""}${kpis.desvio.toFixed(1)}%`,
              color: kpis.desvio >= 0 ? "#16a34a" : "#ef4444",
            },
            { label: "Semanas c/ Dados", value: avancos.filter(a => a.semana_iso).length, color: "#26405d" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Avanço Físico — {viewMode === "mes" ? "Mensal" : "Semanal"}
              </p>
              <div className="flex gap-1">
                {[
                  { key: "mes",    label: "Mês" },
                  { key: "semana", label: "Semana" },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setViewMode(m.key)}
                    className={`px-2.5 py-0.5 text-xs rounded transition-colors ${
                      viewMode === m.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis yAxisId="left"  tick={{ fontSize: 10 }} unit="%" domain={[0, "auto"]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v, name) => [`${Number(v).toFixed(2)}%`, name]} />
                <Legend />
                <Bar yAxisId="left" dataKey="previsto"  name="Previsto"  fill="#e5e7eb" radius={[3,3,0,0]} />
                <Bar yAxisId="left" dataKey="realizado" name="Realizado" fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar yAxisId="left" dataKey="projetado" name="Projetado" fill="#f59e0b" radius={[3,3,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="prevAcum" name="Prev. Acum." stroke="#9ca3af" strokeDasharray="5 3" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="realAcum" name="Real. Acum." stroke="#2563eb" dot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela transposta */}
        <AvancoTabela
          weeks={weeks}
          monthGroups={monthGroups}
          dataMap={dataMap}
          onSave={handleSave}
          isSaving={saveMut.isPending}
        />

      </div>

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Avanço Físico"
        exportFileName="avanco_fisico"
        columns={EXPORT_COLUMNS}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
}
