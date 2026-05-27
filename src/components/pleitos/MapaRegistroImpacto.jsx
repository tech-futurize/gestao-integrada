import { useMemo, useState } from "react";
import { format, endOfWeek, startOfWeek, isWithinInterval, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HeatmapDrilldown from "./HeatmapDrilldown";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

const CATEGORIES = [
  "Engenharia", "Suprimentos", "Liberação de Área",
  "Escopo", "Planejamento", "Gestão & Comunicação",
  "Recursos", "Produtividade", "Segurança", "Qualidade"
];


const VISIBLE_WEEKS = 12;

// Paleta alinhada ao DESIGN.md §1 — Heatmap Mapa de Impacto (6 níveis)
const HEATMAP_STEPS = [
  { bg: "#ffffff", text: "#334155" }, // 0 — Nenhum
  { bg: "#dcfce7", text: "#166534" }, // 1 — Muito Baixo (green-100)
  { bg: "#86efac", text: "#166534" }, // 2 — Baixo (green-300)
  { bg: "#fde047", text: "#713f12" }, // 3 — Médio (yellow-300)
  { bg: "#f97316", text: "#ffffff" }, // 4 — Alto (orange-500)
  { bg: "#dc2626", text: "#ffffff" }, // 5 — Crítico (red-600)
];

const getHeatStep = (count) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count <= 6)  return 4;
  return 5;
};

const getHeatColor = (count) => HEATMAP_STEPS[getHeatStep(count)].bg;
const getTextColor = (count) => HEATMAP_STEPS[getHeatStep(count)].text;

// Returns start-of-week (monday) for a given date
function getMonday(date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

// Group weeks by the month in which the week STARTS
function groupVisibleWeeksByMonth(weeks) {
  const groups = [];
  weeks.forEach((w, idx) => {
    const label = format(w, "MMM", { locale: ptBR }).toUpperCase();
    const year = format(w, "yyyy");
    const last = groups[groups.length - 1];
    if (last && last.label === label && last.year === year) {
      last.span += 1;
    } else {
      groups.push({ label, year, span: 1, startIdx: idx });
    }
  });
  return groups;
}

export default function MapaRegistroImpacto({ incidentes }) {
  const [drilldown, setDrilldown] = useState(null);
  const [responsabilidadeFiltro, setResponsabilidadeFiltro] = useState(null); // null = todos

  const anchorWeek = useMemo(() => getMonday(subWeeks(new Date(), 8)), []);
  const [offsetWeeks, setOffsetWeeks] = useState(0);

  const visibleWeeks = useMemo(() => {
    return Array.from({ length: VISIBLE_WEEKS }, (_, i) =>
      addWeeks(anchorWeek, offsetWeeks + i)
    );
  }, [anchorWeek, offsetWeeks]);

  const monthGroups = useMemo(() => groupVisibleWeeksByMonth(visibleWeeks), [visibleWeeks]);

  const todasOcorrencias = useMemo(() => {
    const reais = incidentes.filter(i => i.impacto_ocorrencia?.length > 0 && i.data_hora);
    return reais;
  }, [incidentes]);

  // Ocorrências filtradas pela responsabilidade selecionada no gráfico de pizza
  const ocorrenciasFiltradas = useMemo(() => {
    if (!responsabilidadeFiltro) return todasOcorrencias;
    return todasOcorrencias.filter(i => i.responsabilidade === responsabilidadeFiltro);
  }, [todasOcorrencias, responsabilidadeFiltro]);

  const heatmapData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const cells = visibleWeeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const matching = ocorrenciasFiltradas.filter(i => {
          const date = new Date(i.data_hora);
          return isWithinInterval(date, { start: weekStart, end: weekEnd }) &&
            i.impacto_ocorrencia?.includes(cat);
        });
        return { count: matching.length, registros: matching };
      });
      return { category: cat, cells };
    });
  }, [ocorrenciasFiltradas, visibleWeeks]);

  const getDrilldownRegistros = () => {
    if (!drilldown) return [];
    const row = heatmapData.find(r => r.category === drilldown.category);
    return row?.cells[drilldown.weekIdx]?.registros || [];
  };

  // Range label for the current window
  const rangeLabel = useMemo(() => {
    const first = visibleWeeks[0];
    const last = visibleWeeks[VISIBLE_WEEKS - 1];
    return `${format(first, "dd/MM/yyyy")} — ${format(last, "dd/MM/yyyy")}`;
  }, [visibleWeeks]);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Mapa de Registro (Heatmap Temporal)</h3>
          {responsabilidadeFiltro && (
            <span
              className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer bg-foreground text-background"
              onClick={() => setResponsabilidadeFiltro(null)}
              title="Clique para remover o filtro"
            >
              {responsabilidadeFiltro} ✕
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">Intensidade:</span>
          {HEATMAP_STEPS.map((step, i) => (
            <div key={i} className="w-5 h-5 rounded-sm" style={{ backgroundColor: step.bg, border: i === 0 ? "1px solid #e2e8f0" : "none" }} />
          ))}
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOffsetWeeks(o => o - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors border border-border"
        >
          <ChevronLeft className="w-4 h-4" /> Semana anterior
        </button>
        <span className="text-xs font-semibold text-muted-foreground px-3">{rangeLabel}</span>
        <button
          onClick={() => setOffsetWeeks(o => o + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors border border-border"
        >
          Próxima semana <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Table — fixed 12 columns, no horizontal scroll needed */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 150 }} />
            {visibleWeeks.map((_, i) => <col key={i} style={{ width: 52 }} />)}
          </colgroup>
          <thead>
            {/* Month row */}
            <tr>
              <th />
              {monthGroups.map((group, mi) => (
                <th
                  key={mi}
                  colSpan={group.span}
                  className="text-center pb-1 text-xs font-bold tracking-widest text-foreground"
                  style={{
                    borderLeft: mi > 0 ? "2px solid var(--color-ocre, #c35e1e)" : "none",
                    paddingLeft: 4,
                    paddingRight: 4,
                  }}
                >
                  {group.label} {group.year}
                </th>
              ))}
            </tr>
            {/* Week row */}
            <tr>
              <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categorias
              </th>
              {visibleWeeks.map((w, idx) => {
                const isMonthStart = monthGroups.some(g => g.startIdx === idx && idx > 0);
                return (
                  <th
                    key={idx}
                    className="text-center py-2 text-xs font-medium text-muted-foreground"
                    style={{
                      borderLeft: isMonthStart ? "2px solid var(--color-ocre, #c35e1e)" : "none",
                    }}
                  >
                    S-{format(w, "dd/MM", { locale: ptBR })}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row) => (
              <tr key={row.category}>
                <td className="py-1 pr-4 text-sm font-medium text-foreground whitespace-nowrap max-w-[140px] truncate" title={row.category}>
                  {row.category}
                </td>
                {row.cells.map((cell, wIdx) => {
                  const w = visibleWeeks[wIdx];
                  const monthLabel = format(w, "MMM yyyy", { locale: ptBR });
                  const weekLabel = `${monthLabel.toUpperCase()} · W${wIdx % 4 + 1}`;
                  const isMonthStart = monthGroups.some(g => g.startIdx === wIdx && wIdx > 0);
                  return (
                    <td
                      key={wIdx}
                      className="py-1"
                      style={{ borderLeft: isMonthStart ? "2px solid var(--color-ocre, #c35e1e)" : "none" }}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg mx-0.5 transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-orange-300"
                        style={{
                          backgroundColor: getHeatColor(cell.count),
                          height: 36,
                          color: getTextColor(cell.count),
                        }}
                        title={`${row.category} · ${weekLabel} · ${cell.count} ocorrência(s)`}
                        onClick={() => setDrilldown({ category: row.category, weekIdx: wIdx, weekLabel })}
                      >
                        {cell.count > 0 && (
                          <span className="text-sm font-bold leading-none">{cell.count}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HeatmapDrilldown
        open={!!drilldown}
        onClose={() => setDrilldown(null)}
        category={drilldown?.category}
        weekLabel={drilldown?.weekLabel}
        registros={getDrilldownRegistros()}
      />

      <div className="mt-4 pt-3 border-t border-border" />

      {/* Charts row */}
      <ChartsRow
        todasOcorrencias={todasOcorrencias}
        heatmapData={heatmapData}
        responsabilidadeFiltro={responsabilidadeFiltro}
        onPieClick={(name) => setResponsabilidadeFiltro(prev => prev === name ? null : name)}
      />
    </div>
  );
}

function RadarAngleTick({ x, y, payload, cx, cy }) {
  const words = payload.value.split(/\s+/);
  const lineHeight = 11;
  const totalHeight = words.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;

  let textAnchor = "middle";
  if (x < cx - 10) textAnchor = "end";
  else if (x > cx + 10) textAnchor = "start";

  return (
    <text textAnchor={textAnchor} fontSize={9} fill="#6b7280">
      {words.map((word, i) => (
        <tspan key={i} x={x} y={startY + i * lineHeight}>{word}</tspan>
      ))}
    </text>
  );
}

function renderPieLabel({ cx, cy, midAngle, outerRadius, name, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fontSize={10}
      fill="#6b7280"
      textAnchor={x > cx ? "start" : "end"}
    >
      <tspan x={x} dy="0">{name}</tspan>
      <tspan x={x} dy="14">{`${(percent * 100).toFixed(0)}%`}</tspan>
    </text>
  );
}

function ChartsRow({ todasOcorrencias, heatmapData, responsabilidadeFiltro, onPieClick }) {
  const pieData = useMemo(() => {
    const contratada = todasOcorrencias.filter(i => i.responsabilidade === "Contratada").length;
    const contratante = todasOcorrencias.filter(i => i.responsabilidade === "Contratante").length;
    const total = contratada + contratante;
    if (total === 0) return [
      { name: "Contratada", value: 50 },
      { name: "Contratante", value: 50 },
    ];
    return [
      { name: "Contratada", value: contratada },
      { name: "Contratante", value: contratante },
    ];
  }, [todasOcorrencias]);

  const PIE_COLORS = ["#c35e1e", "#26405d"];

  const radarData = useMemo(() => {
    return heatmapData.map(row => ({
      category: row.category,
      total: row.cells.reduce((sum, c) => sum + c.count, 0),
    }));
  }, [heatmapData]);

  const totalPie = pieData.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-5 border-t border-border">
      {/* Pie chart */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">
          Responsabilidade Contratual
          {responsabilidadeFiltro && (
            <span className="ml-2 text-xs font-semibold text-ocre">— filtrando: {responsabilidadeFiltro}</span>
          )}
        </h4>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart margin={{ top: 30, right: 50, bottom: 30, left: 50 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={72}
              dataKey="value"
              cursor="pointer"
              onClick={(data) => onPieClick(data.name)}
              label={renderPieLabel}
              labelLine={true}
            >
              {pieData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                  opacity={responsabilidadeFiltro && responsabilidadeFiltro !== entry.name ? 0.35 : 1}
                  stroke={responsabilidadeFiltro === entry.name ? "#fff" : "none"}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} registro(s)`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Radar chart */}
      <div>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData} outerRadius="60%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="category"
              tick={<RadarAngleTick />}
            />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: "#9ca3af" }} />
            <Radar
              name="Registros"
              dataKey="total"
              stroke="#c35e1e"
              fill="#c35e1e"
              fillOpacity={0.25}
            />
            <Tooltip formatter={(value) => [`${value} registro(s)`, "Total"]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}