/**
 * Shared series computation for Avanço Físico and Financeiro panels.
 * Replicates the accumulation / truncation logic from HistogramaTabela.jsx
 * (lastRealIdx pattern: realAcum truncado, projAcum âmbar partindo do totalReal).
 */

/**
 * Computes chart data, card KPIs, and the last period with real data.
 *
 * @param {object}                    opts
 * @param {Map<string, object>}       opts.dataMap         – periodKey → record from Supabase
 * @param {Date[]}                    opts.periods         – ordered array of period start dates
 * @param {(Date) => string}          opts.periodKey       – converts a Date to the map lookup key
 * @param {(Date) => string}          opts.periodLabel     – converts a Date to the X-axis label
 * @param {{ prev:string, real:string, proj:string }} opts.fields – field names in the record
 * @param {string}                    opts.currentPeriodKey – key for "now" (caps prevAcum in cards)
 *
 * @returns {{ chartData: object[], cards: object, lastRealIdx: number, lastRealPeriod: Date|null }}
 */
export function computeAvancoSeries({
  dataMap,
  periods,
  periodKey,
  periodLabel,
  fields,
  currentPeriodKey,
}) {
  const { prev: fPrev, real: fReal, proj: fProj } = fields;

  // ── Card KPIs ──────────────────────────────────────────────────────────────
  // prevAcum: acumula apenas até o período atual (semantica de "previsto até hoje")
  // realAcum / projAcum: todos os registros
  let cPrev = 0, cReal = 0, cProj = 0;
  periods.forEach((p) => {
    const pk = periodKey(p);
    const r = dataMap.get(pk);
    if (!r) return;
    if (pk <= currentPeriodKey) cPrev += r[fPrev] ?? 0;
    cReal += r[fReal] ?? 0;
    cProj += r[fProj] ?? 0;
  });

  // ── lastRealIdx: índice do último período com real > 0 ────────────────────
  const lastRealIdx = periods.reduce(
    (last, p, i) => ((dataMap.get(periodKey(p))?.[fReal] ?? 0) > 0 ? i : last),
    -1
  );
  const totalReal = cReal;
  const lastRealPeriod = lastRealIdx >= 0 ? periods[lastRealIdx] : null;

  // ── chartData com lógica de truncamento idêntica ao Histograma ─────────────
  let runPrev = 0, runReal = 0, projDelta = 0;
  const chartData = periods.map((p, i) => {
    const pk = periodKey(p);
    const r = dataMap.get(pk);
    const prev = r?.[fPrev] ?? 0;
    const real = r?.[fReal] ?? 0;
    const proj = r?.[fProj] ?? 0;
    runPrev += prev;
    runReal += real;

    // projAcum começa no lastRealIdx e cresce somando os projetados futuros
    let projAcum = null;
    if (lastRealIdx >= 0 && i >= lastRealIdx) {
      projDelta += proj;
      projAcum = totalReal + projDelta;
    }

    return {
      label: periodLabel(p),
      prev,
      real,
      proj,
      prevAcum: runPrev > 0 ? runPrev : null,
      // realAcum TRUNCADO: null após o último período lançado (evita cair a zero)
      realAcum: i <= lastRealIdx ? runReal : null,
      projAcum,
    };
  });

  return {
    chartData,
    cards: {
      prevAcum: cPrev,
      realAcum: cReal,
      projAcum: cProj,
      desvio: cReal - cPrev,
    },
    lastRealIdx,
    lastRealPeriod,
  };
}
