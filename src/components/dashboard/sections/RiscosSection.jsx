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
import { ShieldAlert, AlertCircle, Clock, DollarSign } from "lucide-react";
import { SectionHeader, KpiCard } from "@/components/dashboard/DashboardPrimitives";

// ── Constantes ────────────────────────────────────────────────────────────────

const CAT_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#16a34a",
  "#ef4444",
  "#8b5cf6",
  "#c35e1e",
  "#94a3b8",
];

const SEVERIDADE_FAIXAS = [
  { label: "Crítico (≥12)", min: 12, max: Infinity, color: "#ef4444" },
  { label: "Médio (6–11)", min: 6, max: 11, color: "#f59e0b" },
  { label: "Baixo (<6)", min: 0, max: 5, color: "#16a34a" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMilhoes(value) {
  if (!value && value !== 0) return "—";
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(0)}k`;
  return `R$ ${value.toFixed(0)}`;
}

function sumField(arr, field) {
  return arr.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
}

// ── Derivações ────────────────────────────────────────────────────────────────

function deriveKpis(riscos) {
  const total = riscos.length;
  const criticos = riscos.filter((r) => Number(r.score) >= 12).length;
  const ativos = riscos.filter((r) => r.status === "Ativo").length;
  const exposicao = sumField(
    riscos.filter((r) => r.status === "Ativo"),
    "valor_impacto"
  );
  return { total, criticos, ativos, exposicao };
}

function deriveAmeacas(riscos) {
  const ameacas = riscos.filter((r) => r.classificacao === "Ameaça");
  const criticas = ameacas.filter((r) => Number(r.score) >= 12).length;
  const exposicao = sumField(ameacas, "valor_impacto");
  const prazoDias = sumField(ameacas, "prazo_dias");
  const ativas = ameacas.filter((r) => r.status === "Ativo").length;
  const monitoramento = ameacas.filter((r) => r.status !== "Ativo" && r.status !== "Encerrado" && r.status !== "Cancelado").length;
  return { total: ameacas.length, criticas, exposicao, prazoDias, ativas, monitoramento };
}

function deriveOportunidades(riscos) {
  const opors = riscos.filter((r) => r.classificacao === "Oportunidade");
  const altas = opors.filter((r) => Number(r.score) >= 12).length;
  const ganho = sumField(opors, "valor_impacto");
  const prazoDias = sumField(opors, "prazo_dias");
  const ativas = opors.filter((r) => r.status === "Ativo").length;
  const capturadas = opors.filter((r) => r.status === "Mitigado").length;
  return { total: opors.length, altas, ganho, prazoDias, ativas, capturadas };
}

function deriveSeveridade(riscos) {
  return SEVERIDADE_FAIXAS.map(({ label, min, max, color }) => {
    const count = riscos.filter((r) => {
      const s = Number(r.score);
      return s >= min && s <= max;
    }).length;
    return { label, count, color };
  });
}

function deriveCategorias(riscos) {
  const map = {};
  for (const r of riscos) {
    const cat = r.categoria || "Outros";
    map[cat] = (map[cat] || 0) + 1;
  }
  return Object.entries(map)
    .filter(([, count]) => count > 0)
    .map(([name, value], idx) => ({ name, value, color: CAT_COLORS[idx % CAT_COLORS.length] }));
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function DetalheRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-t border-dashed border-current border-opacity-20 first:border-t-0">
      <span className="text-xs opacity-70">{label}</span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
}

function CardClassificacao({ tipo, total, linhas, bgColor, borderColor, textColor, numColor, label }) {
  return (
    <div
      className="flex-1 rounded-xl p-4"
      style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}`, color: textColor }}
    >
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-extrabold" style={{ color: numColor }}>
          {total}
        </span>
        <span className="font-bold text-xs mb-1">{label}</span>
      </div>
      <div className="flex flex-col">
        {linhas.map(({ l, v }) => (
          <DetalheRow key={l} label={l} value={v} />
        ))}
      </div>
    </div>
  );
}

function SeveridadeChart({ data }) {
  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Sem dados de severidade.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
      >
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fontSize: 10 }}
          tickLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v, "Riscos"]} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CategoriasDonut({ data }) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Sem dados por categoria.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <PieChart width={140} height={140}>
        <Pie
          data={data}
          cx={65}
          cy={65}
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, n) => [v, n]} />
      </PieChart>
      {/* Legenda lateral */}
      <div className="flex flex-col gap-1 min-w-0">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
            <span className="text-xs font-bold ml-auto pl-2">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RiscosSection({ projetoId }) {
  const { data: riscos = [], isPending, isError } = useQuery({
    queryKey: ["riscos_sec_dash", projetoId],
    queryFn: () => entities.Risco.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  return (
    <Card className="border-0 shadow-md">
      <SectionHeader
        title="Riscos"
        icon={ShieldAlert}
        color="#ef4444"
        subtitle="Gestão de Riscos · ameaças e oportunidades"
      />

      <CardContent className="pt-4 pb-6 px-6">
        {/* Estado de carregamento */}
        {isPending && <Skeleton className="h-64 w-full" />}

        {/* Estado de erro */}
        {isError && !isPending && (
          <div className="flex items-center gap-2 text-destructive py-8 justify-center">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Erro ao carregar dados de riscos.</span>
          </div>
        )}

        {/* Estado vazio */}
        {!isPending && !isError && riscos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum risco cadastrado.
          </p>
        )}

        {/* Conteúdo */}
        {!isPending && !isError && riscos.length > 0 && (() => {
          const { total, criticos, ativos, exposicao } = deriveKpis(riscos);
          const ameacas = deriveAmeacas(riscos);
          const oportunidades = deriveOportunidades(riscos);
          const severidadeData = deriveSeveridade(riscos);
          const categoriasData = deriveCategorias(riscos);

          return (
            <div className="flex flex-col gap-6">
              {/* SEÇÃO 1 — KPIs principais */}
              <div className="grid grid-cols-4 gap-3">
                <KpiCard
                  label="Riscos"
                  value={total}
                  icon={ShieldAlert}
                  color="#ef4444"
                />
                <KpiCard
                  label="Críticos"
                  value={criticos}
                  icon={AlertCircle}
                  color="#ef4444"
                />
                <KpiCard
                  label="Ativos"
                  value={ativos}
                  icon={Clock}
                  color="#f59e0b"
                />
                <KpiCard
                  label="Exposição financeira"
                  value={formatMilhoes(exposicao)}
                  icon={DollarSign}
                  color="#ef4444"
                />
              </div>

              {/* SEÇÃO 2 — Cards Ameaças × Oportunidades */}
              <div className="flex gap-4">
                <CardClassificacao
                  tipo="ameaca"
                  total={ameacas.total}
                  label="▼ AMEAÇAS"
                  numColor="#dc2626"
                  bgColor="#fef2f2"
                  borderColor="#fecaca"
                  textColor="#991b1b"
                  linhas={[
                    { l: "Críticas (score ≥12)", v: ameacas.criticas },
                    { l: "Exposição financeira", v: formatMilhoes(ameacas.exposicao) },
                    { l: "Impacto em prazo", v: `+${ameacas.prazoDias} dias` },
                    { l: "Ativas / Monitoramento", v: `${ameacas.ativas} / ${ameacas.monitoramento}` },
                  ]}
                />
                <CardClassificacao
                  tipo="oportunidade"
                  total={oportunidades.total}
                  label="▲ OPORTUNIDADES"
                  numColor="#16a34a"
                  bgColor="#ecfdf3"
                  borderColor="#bbf7d0"
                  textColor="#15803d"
                  linhas={[
                    { l: "Alto potencial (score ≥12)", v: oportunidades.altas },
                    { l: "Ganho potencial", v: `+${formatMilhoes(oportunidades.ganho)}` },
                    { l: "Redução de prazo", v: `-${oportunidades.prazoDias} dias` },
                    { l: "Ativas / Capturadas", v: `${oportunidades.ativas} / ${oportunidades.capturadas}` },
                  ]}
                />
              </div>

              {/* SEÇÃO 3 — Gráficos */}
              <div className="flex gap-6">
                {/* Barras — severidade */}
                <div style={{ flex: 1 }}>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Severidade por score
                  </p>
                  <SeveridadeChart data={severidadeData} />
                </div>

                {/* Donut — categorias */}
                <div style={{ flex: 1 }}>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Riscos por categoria
                  </p>
                  <CategoriasDonut data={categoriasData} />
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
