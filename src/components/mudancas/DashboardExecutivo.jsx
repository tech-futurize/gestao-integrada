import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, DollarSign, Layers } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = {
  "Identificada": "#9ca3af",
  "Em Análise": "#f59e0b",
  "Em Negociação": "#3b82f6",
  "Aprovada": "#22c55e",
  "Rejeitada": "#ef4444",
};

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="flex-1">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-2xl font-bold" style={{ color: "#26405d" }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-[200px]">
        <p className="font-bold text-gray-800 mb-1">{d.titulo}</p>
        <p className="text-gray-500">Custo: <span className="font-semibold text-gray-700">R$ {d.custo?.toLocaleString("pt-BR") ?? 0}</span></p>
        <p className="text-gray-500">Prazo: <span className="font-semibold text-gray-700">{d.prazo ?? 0} dias</span></p>
        <p className="text-gray-500">Escopo: <span className="font-semibold text-gray-700">{d.escopo ? "Sim" : "Não"}</span></p>
        <p className="text-gray-500">Status: <span className="font-semibold" style={{ color: STATUS_COLORS[d.status] }}>{d.status}</span></p>
      </div>
    );
  }
  return null;
};

export default function DashboardExecutivo({ mudancas = [], projeto }) {
  const totalPrazo = useMemo(() =>
    mudancas.reduce((s, m) => s + (m.impacto_prazo_dias || 0), 0), [mudancas]);

  const totalCusto = useMemo(() =>
    mudancas.reduce((s, m) => s + (m.impacto_custo || 0), 0), [mudancas]);

  const totalEscopo = useMemo(() =>
    mudancas.filter(m => m.categorias?.includes("Escopo")).length, [mudancas]);

  const prazoTotal = useMemo(() => {
    if (!projeto?.data_inicio || !projeto?.data_prevista_termino) return null;
    const diff = (new Date(projeto.data_prevista_termino) - new Date(projeto.data_inicio)) / 86400000;
    return diff > 0 ? diff : null;
  }, [projeto]);

  const pctPrazo = prazoTotal ? ((totalPrazo / prazoTotal) * 100).toFixed(1) : null;
  const pctCusto = projeto?.valor_contrato
    ? ((totalCusto / projeto.valor_contrato) * 100).toFixed(1)
    : null;

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
      escopo: m.categorias?.includes("Escopo"),
      scopeLevel: getScopeLevel(m),
      status: m.status,
    }));
  }, [mudancas]);

  const BUBBLE_SIZES = { alto: 28, medio: 18, baixo: 10, none: 6 };
  const getBubbleSize = (d) => BUBBLE_SIZES[d.scopeLevel || "none"];

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const r = getBubbleSize(payload);
    const fill = STATUS_COLORS[payload.status] || "#9ca3af";
    return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} />;
  };

  const midCusto = totalCusto / 2;
  const midPrazo = totalPrazo / 2;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="flex flex-col md:flex-row gap-4">
        <KpiCard
          icon={Clock}
          label="Impacto de Prazo"
          value={`${totalPrazo} dias`}
          sub={pctPrazo ? `${pctPrazo}% do prazo do projeto` : "Projeto sem datas definidas"}
          color="#c35e1e"
        />
        <KpiCard
          icon={DollarSign}
          label="Impacto de Custo"
          value={`R$ ${totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={pctCusto ? `${pctCusto}% do valor do contrato` : "Projeto sem valor definido"}
          color="#26405d"
        />
        <KpiCard
          icon={Layers}
          label="Alterações de Escopo"
          value={totalEscopo}
          sub={`de ${mudancas.length} mudança(s) total`}
          color="#00a49a"
        />
      </div>

      {/* Four-quadrant chart */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-sm font-bold text-gray-700 mb-1">Mapa de Impacto das Mudanças</h4>
          <p className="text-xs text-gray-400 mb-4">
            Eixo horizontal = Custo · Eixo vertical = Prazo · Tamanho do círculo = impacto de Escopo
          </p>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            {Object.entries(STATUS_COLORS).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-xs text-gray-500">{s}</span>
              </div>
            ))}
            <div className="h-4 w-px bg-gray-200 mx-2" />
            <span className="text-xs text-gray-400 font-medium mr-1">Escopo:</span>
            {[
              { label: "Alto", size: 22, color: "#c35e1e" },
              { label: "Médio", size: 14, color: "#c35e1e" },
              { label: "Baixo", size: 8, color: "#c35e1e" },
              { label: "Sem escopo", size: 6, color: "#d1d5db" },
            ].map(({ label, size, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color, opacity: 0.75 }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis
                type="number"
                dataKey="custo"
                name="Custo"
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                label={{ value: "Custo (R$)", position: "insideBottomRight", offset: -10, fontSize: 11, fill: "#9ca3af" }}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="prazo"
                name="Prazo"
                tickFormatter={(v) => `${v}d`}
                label={{ value: "Prazo (dias)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#9ca3af" }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={midCusto} stroke="#c35e1e" strokeDasharray="5 3" strokeOpacity={0.5} />
              <ReferenceLine y={midPrazo} stroke="#26405d" strokeDasharray="5 3" strokeOpacity={0.5} />
              <Scatter data={scatterData} shape={<CustomDot />} />
            </ScatterChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: "Baixo Custo / Baixo Prazo", desc: "Mudanças de menor impacto", color: "#22c55e" },
              { label: "Alto Custo / Baixo Prazo", desc: "Impacto financeiro alto", color: "#f59e0b" },
              { label: "Baixo Custo / Alto Prazo", desc: "Risco de atraso", color: "#3b82f6" },
              { label: "Alto Custo / Alto Prazo", desc: "Mudanças críticas", color: "#ef4444" },
            ].map((q) => (
              <div key={q.label} className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: q.color }} />
                <div>
                  <p className="text-xs font-semibold text-gray-700">{q.label}</p>
                  <p className="text-xs text-gray-400">{q.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}