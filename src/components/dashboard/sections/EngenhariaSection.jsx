import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Ruler, CheckCircle, AlertCircle, BarChart2 } from "lucide-react";
import { SectionHeader, KpiCard } from "@/components/dashboard/DashboardPrimitives";
import { todayISO } from "@/lib/dateUtils";

// ── Constantes ────────────────────────────────────────────────────────────────

const ETAPAS = [
  { label: "A Emitir", color: "#94a3b8" },
  { label: "Em Elaboração", color: "#3b82f6" },
  { label: "Em Verificação Técnica", color: "#f59e0b" },
  { label: "Comentários do Cliente", color: "#c35e1e" },
  { label: "Aprovado", color: "#00a49a" },
];

const MODULE_COLOR = "#00a49a";

// ── Derivações ────────────────────────────────────────────────────────────────

function deriveKpis(documentos) {
  const total = documentos.length;
  const progressoMedio =
    total > 0
      ? Math.round(documentos.reduce((acc, d) => acc + (d.progresso ?? 0), 0) / total)
      : 0;
  const aprovados = documentos.filter((d) => d.etapa === "Aprovado").length;
  const hoje = todayISO();
  const atrasados = documentos.filter(
    (d) => d.deadline && d.deadline < hoje && (d.progresso ?? 0) < 100
  ).length;
  return { total, progressoMedio, aprovados, atrasados };
}

function deriveDonutData(documentos) {
  const counts = {};
  for (const d of documentos) {
    const etapa = d.etapa || "A Emitir";
    counts[etapa] = (counts[etapa] || 0) + 1;
  }
  return ETAPAS.map((e) => ({ ...e, value: counts[e.label] || 0 }));
}

function deriveBarsData(documentos) {
  const map = {};
  for (const d of documentos) {
    const disc = d.disciplina || "Sem disciplina";
    if (!map[disc]) map[disc] = { soma: 0, count: 0 };
    map[disc].soma += d.progresso ?? 0;
    map[disc].count += 1;
  }
  return Object.entries(map)
    .map(([disciplina, { soma, count }]) => ({
      disciplina,
      progresso: Math.round(soma / count),
    }))
    .sort((a, b) => b.progresso - a.progresso);
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function DonutChart({ data }) {
  const pieData = data.filter((e) => e.value > 0);

  return (
    <div className="flex items-center gap-4">
      {/* Donut */}
      <div className="flex-shrink-0">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={pieData.length > 0 ? pieData : [{ value: 1, label: "Sem dados" }]}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              nameKey="label"
              stroke="none"
            >
              {pieData.length > 0 ? (
                pieData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))
              ) : (
                <Cell fill="#e2e8f0" />
              )}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda customizada */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {ETAPAS.map((e) => {
          const entry = data.find((d) => d.label === e.label);
          const count = entry?.value ?? 0;
          return (
            <div key={e.label} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: e.color }}
              />
              <span className="text-muted-foreground truncate">
                {e.label}
                <span className="font-semibold text-foreground ml-1">· {count}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarsChart({ data }) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Nenhuma disciplina registrada.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 32)}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          type="category"
          dataKey="disciplina"
          width={110}
          tick={{ fontSize: 10 }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Progresso médio"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="progresso" fill={MODULE_COLOR} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function EngenhariaSection({ projetoId }) {
  const { data: documentos = [], isPending, isError } = useQuery({
    queryKey: ["engenharia_docs_dash", projetoId],
    queryFn: () => entities.DocumentoEngenharia.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  return (
    <Card className="border-0 shadow-md">
      <SectionHeader
        title="Engenharia"
        icon={Ruler}
        color={MODULE_COLOR}
        subtitle="Documentos de engenharia"
      />

      <CardContent className="pt-4 pb-6 px-6">
        {/* Estado de carregamento */}
        {isPending && <Skeleton className="h-64 w-full" />}

        {/* Estado de erro */}
        {isError && !isPending && (
          <div className="flex items-center gap-2 text-destructive py-8 justify-center">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Erro ao carregar dados de engenharia.</span>
          </div>
        )}

        {/* Estado vazio */}
        {!isPending && !isError && documentos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum documento cadastrado.
          </p>
        )}

        {/* Conteúdo */}
        {!isPending && !isError && documentos.length > 0 && (() => {
          const { total, progressoMedio, aprovados, atrasados } = deriveKpis(documentos);
          const donutData = deriveDonutData(documentos);
          const barsData = deriveBarsData(documentos);

          return (
            <div className="flex flex-col gap-6">
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-3">
                <KpiCard
                  label="Total de documentos"
                  value={total}
                  icon={Ruler}
                  color={MODULE_COLOR}
                />
                <KpiCard
                  label="Progresso médio"
                  value={`${progressoMedio}%`}
                  icon={BarChart2}
                  color="#3b82f6"
                />
                <KpiCard
                  label="Aprovados"
                  value={aprovados}
                  icon={CheckCircle}
                  color="#00a49a"
                />
                <KpiCard
                  label="Atrasados"
                  value={atrasados}
                  icon={AlertCircle}
                  color="#ef4444"
                />
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-2 gap-6">
                {/* Donut por etapa */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Documentos por etapa
                  </p>
                  <DonutChart data={donutData} />
                </div>

                {/* Barras por disciplina */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Progresso por disciplina
                  </p>
                  <BarsChart data={barsData} />
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
