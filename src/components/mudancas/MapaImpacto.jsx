import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = {
  "Identificada":  "#9ca3af",
  "Em Análise":    "#f59e0b",
  "Aprovada":      "#22c55e",
  "Rejeitada":     "#ef4444",
  "Implementada":  "#10b981",
};

const BUBBLE_SIZES = { alto: 26, medio: 16, baixo: 9, none: 5 };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs max-w-[200px]">
      <p className="font-bold text-foreground mb-1">{d.titulo}</p>
      <p className="text-muted-foreground">Custo: <span className="font-semibold text-foreground">R$ {d.custo?.toLocaleString("pt-BR") ?? 0}</span></p>
      <p className="text-muted-foreground">Prazo: <span className="font-semibold text-foreground">{d.prazo ?? 0} dias</span></p>
      <p className="text-muted-foreground">Status: <span className="font-semibold" style={{ color: STATUS_COLORS[d.status] }}>{d.status}</span></p>
    </div>
  );
};

export default function MapaImpacto({ mudancas = [] }) {
  const scatterData = useMemo(() => {
    const comEscopo = mudancas.filter(m => m.categorias?.includes("Escopo"));
    const custos = comEscopo.map(m => Math.abs(m.impacto_custo || 0)).sort((a, b) => a - b);
    const p33 = custos[Math.floor(custos.length / 3)] ?? 0;
    const p66 = custos[Math.floor((custos.length * 2) / 3)] ?? 0;

    const getScopeLevel = (m) => {
      if (!m.categorias?.includes("Escopo")) return null;
      const v = Math.abs(m.impacto_custo || 0);
      if (v <= p33) return "baixo";
      if (v <= p66) return "medio";
      return "alto";
    };

    return mudancas.map(m => ({
      titulo: m.titulo,
      custo: m.impacto_custo || 0,
      prazo: m.impacto_prazo_dias || 0,
      scopeLevel: getScopeLevel(m),
      status: m.status,
    }));
  }, [mudancas]);

  const CustomDot = ({ cx, cy, payload }) => {
    const r = BUBBLE_SIZES[payload.scopeLevel || "none"];
    const fill = STATUS_COLORS[payload.status] || "#9ca3af";
    return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} />;
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-foreground">Mapa de Impacto</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Custo × Prazo · tamanho = escopo</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-xs text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="custo"
            name="Custo"
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="prazo"
            name="Prazo"
            tickFormatter={(v) => `${v}d`}
            tick={{ fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={scatterData} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
