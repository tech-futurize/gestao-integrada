
/**
 * 4 KPI cards para os painéis de Avanço (Físico e Financeiro).
 * Sem barras de preenchimento — alinhado ao padrão visual do Histograma.
 *
 * @param {number}   prevAcum          – acumulado previsto até o período atual
 * @param {number}   realAcum          – acumulado realizado
 * @param {number}   projAcum          – acumulado projetado
 * @param {number}   desvio            – realAcum − prevAcum
 * @param {function} formatValue       – (number) => string (ex: v => `${v.toFixed(1)}%`)
 * @param {string}   lastRealLabel     – label do último período lançado (ex: "10/02" ou "fev/26")
 * @param {string}   periodUnitLabel   – "semana" | "mês"
 */
export default function AvancoCards({
  prevAcum,
  realAcum,
  projAcum,
  desvio,
  formatValue,
  lastRealLabel,
  periodUnitLabel = "semana",
}) {
  const fmt = formatValue ?? ((v) => String(v));
  const desvioPositive = desvio >= 0;

  // Para o card de desvio: sinal explícito + valor absoluto formatado
  const desvioDisplay = `${desvioPositive ? "+" : "−"}${fmt(Math.abs(desvio))}`;

  const cards = [
    {
      label: "Previsto Acumulado",
      value: fmt(prevAcum),
      sub: "até período atual",
      color: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "Real Acumulado",
      value: fmt(realAcum),
      sub: lastRealLabel
        ? `até última ${periodUnitLabel} lançada (${lastRealLabel})`
        : "nenhum lançamento ainda",
      color: "text-green-700 dark:text-green-300",
    },
    {
      label: "Projetado Acumulado",
      value: fmt(projAcum),
      sub: "até fim do projeto",
      color: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Desvio (Real − Previsto)",
      value: desvioDisplay,
      sub: desvioPositive ? "adiantado" : "atraso em relação ao previsto",
      color: desvioPositive
        ? "text-green-700 dark:text-green-300"
        : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, color }) => (
        <div key={label} className="bg-card border border-border rounded-xl px-3 py-2">
          <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            {label}
          </div>
          <div className={`text-base font-bold ${color}`}>{value}</div>
          <div className="text-[9px] text-muted-foreground">{sub}</div>
        </div>
      ))}
    </div>
  );
}
