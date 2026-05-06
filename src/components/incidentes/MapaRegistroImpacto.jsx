import React, { useMemo, useState } from "react";
import { format, endOfWeek, startOfWeek, isWithinInterval, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import HeatmapDrilldown from "./HeatmapDrilldown";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

const CATEGORIES = [
  "Engenharia", "Suprimentos", "Liberação de Área",
  "Escopo", "Planejamento", "Gestão & Comunicação",
  "Recursos", "Produtividade", "Segurança", "Qualidade"
];


const VISIBLE_WEEKS = 12;

const getHeatColor = (count) => {
  if (count === 0) return "#f0f2f5";
  if (count === 1) return "#f5ddd2";
  if (count === 2) return "#e8b99a";
  if (count === 3) return "#d98a62";
  if (count <= 6) return "#c35e1e";
  if (count <= 10) return "#a04a12";
  return "#7a330a";
};

const getTextColor = (count) => count >= 3 ? "#fff" : "#7a4a30";

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Mapa de Registro (Heatmap Temporal)</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Distribuição de impactos críticos por categoria e semana
            {responsabilidadeFiltro && (
              <span
                className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer"
                style={{ backgroundColor: responsabilidadeFiltro === "Contratada" ? "#c35e1e" : "#26405d", color: "#fff" }}
                onClick={() => setResponsabilidadeFiltro(null)}
                title="Clique para remover o filtro"
              >
                {responsabilidadeFiltro} ✕
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Intensidade:</span>
            {[
              "#f0f2f5", "#f5ddd2", "#e8b99a", "#d98a62", "#c35e1e", "#7a330a"
            ].map((color, i) => (
              <div key={i} className="w-5 h-5 rounded-sm" style={{ backgroundColor: color, border: i === 0 ? "1px solid #e2e8f0" : "none" }} />
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOffsetWeeks(o => o - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <ChevronLeft className="w-4 h-4" /> Semana anterior
        </button>
        <span className="text-xs font-semibold text-gray-500 px-3">{rangeLabel}</span>
        <button
          onClick={() => setOffsetWeeks(o => o + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
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
                  className="text-center pb-1 text-xs font-bold tracking-widest"
                  style={{
                    color: "#26405d",
                    borderLeft: mi > 0 ? "2px solid #c35e1e" : "none",
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
              <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Categorias
              </th>
              {visibleWeeks.map((w, idx) => {
                const isMonthStart = monthGroups.some(g => g.startIdx === idx && idx > 0);
                return (
                  <th
                    key={idx}
                    className="text-center py-2 text-xs font-medium text-gray-400"
                    style={{
                      borderLeft: isMonthStart ? "2px solid #c35e1e" : "none",
                    }}
                  >
                    {format(w, "dd/MM", { locale: ptBR })}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row) => (
              <tr key={row.category}>
                <td className="py-1 pr-4 text-sm font-medium text-gray-600 whitespace-nowrap">
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
                      style={{ borderLeft: isMonthStart ? "2px solid #c35e1e" : "none" }}
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

      {/* Footer */}
      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">Clique em uma célula para ver os registros detalhados.</span>
        <span className="text-xs text-gray-400">Use as setas para navegar entre semanas.</span>
      </div>

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-5 border-t border-gray-100">
      {/* Pie chart */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-1">Responsabilidade Contratual</h4>
        <p className="text-xs text-gray-400 mb-3">
          Clique em uma fatia para filtrar o mapa acima
          {responsabilidadeFiltro && (
            <span className="ml-2 font-semibold" style={{ color: responsabilidadeFiltro === "Contratada" ? "#c35e1e" : "#26405d" }}>
              — filtrando: {responsabilidadeFiltro}
            </span>
          )}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              cursor="pointer"
              onClick={(data) => onPieClick(data.name)}
              label={({ name, value }) =>
                `${name}: ${Math.round((value / totalPie) * 100)}%`
              }
              labelLine={true}
            >
              {pieData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                  opacity={responsabilidadeFiltro && responsabilidadeFiltro !== entry.name ? 0.35 : 1}
                  stroke={responsabilidadeFiltro === entry.name ? "#fff" : "none"}
                  strokeWidth={responsabilidadeFiltro === entry.name ? 3 : 0}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} registro(s)`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Radar chart */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-1">Distribuição por Categoria</h4>
        <p className="text-xs text-gray-400 mb-3">Total de registros por categoria de impacto</p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: "#6b7280" }}
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