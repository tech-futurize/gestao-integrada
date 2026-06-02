import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Scrollable Curva-S ComposedChart — compartilhado entre Físico e Financeiro.
 * Espelha o gráfico de HistogramaTabela.jsx:
 *   - scroll horizontal quando há mais de 12 períodos
 *   - 3 barras (Previsto / Real / Projetado) + 3 linhas acumuladas
 *   - realAcum truncado no último período lançado
 *   - projAcum âmbar tracejado partindo do totalReal
 *
 * @param {object[]}  data            – chartData de computeAvancoSeries (campo "label")
 * @param {string}    xKey            – dataKey para o eixo X (default "label")
 * @param {boolean}   showPrev
 * @param {boolean}   showReal
 * @param {boolean}   showProj
 * @param {function}  valueFormatter  – (number) => string para o Tooltip
 * @param {string}    title
 */
export default function CurvaSChart({
  data,
  xKey = "label",
  showPrev,
  showReal,
  showProj,
  valueFormatter,
  title,
  yLeftDomain,
  yRightDomain,
  yTickFormatter,
}) {
  if (!data || data.length === 0) return null;

  const fmt = valueFormatter ?? ((v) => (typeof v === "number" ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v));

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 className="font-semibold mb-4 text-foreground text-sm">{title}</h3>
      {/* Scroll horizontal quando há mais de 12 períodos (padrão histograma) */}
      <div className="overflow-x-auto">
        <div
          style={{
            width: `${(Math.max(data.length, 12) / 12) * 100}%`,
            minWidth: "100%",
          }}
        >
          <ResponsiveContainer width="100%" height={191}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                {...(yLeftDomain ? { domain: yLeftDomain } : {})}
                {...(yTickFormatter ? { tickFormatter: yTickFormatter } : {})}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                {...(yRightDomain ? { domain: yRightDomain } : {})}
                {...(yTickFormatter ? { tickFormatter: yTickFormatter } : {})}
              />
              <Tooltip
                formatter={(v, name) => [
                  typeof v === "number" ? fmt(v) : v,
                  name,
                ]}
              />
              {/* Barras mensais / semanais */}
              {showPrev && (
                <Bar
                  yAxisId="left"
                  dataKey="prev"
                  name="Previsto"
                  fill="#3b82f6"
                  opacity={0.8}
                />
              )}
              {showReal && (
                <Bar
                  yAxisId="left"
                  dataKey="real"
                  name="Real"
                  fill="#16a34a"
                  opacity={0.8}
                />
              )}
              {showProj && (
                <Bar
                  yAxisId="left"
                  dataKey="proj"
                  name="Projetado"
                  fill="#f59e0b"
                  opacity={0.8}
                />
              )}

              {/* Linhas acumuladas */}
              {showPrev && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="prevAcum"
                  name="Acum. Prev"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls={false}
                />
              )}
              {showReal && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="realAcum"
                  name="Acum. Real"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              )}
              {showProj && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="projAcum"
                  name="Acum. Proj"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
