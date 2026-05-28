/**
 * Retorna as próximas 6 semanas a partir de `hoje` (início na segunda-feira).
 * @param {Date} hoje
 * @returns {{ label: string, weekNumber: number, start: Date, end: Date }[]}
 */
export function getSemanas(hoje) {
  return Array.from({ length: 6 }, (_, i) => {
    const start = _startOfWeek(_addDays(hoje, i * 7));
    const end = _addDays(start, 6);
    return { label: `S${i + 1}`, weekNumber: _getISOWeek(start), start, end };
  });
}

/**
 * Retorna quais labels de semana uma tarefa sobrepõe.
 * Usa data_inicio_planejada/data_fim_planejada com fallback para inicio_previsto/termino_previsto.
 * Datas são parseadas como horário local (T00:00:00) para evitar desvio de fuso.
 * @param {{ data_inicio_planejada?: string|null, data_fim_planejada?: string|null, inicio_previsto?: string|null, termino_previsto?: string|null }} tarefa
 * @param {{ label: string, start: Date, end: Date }[]} semanas
 * @returns {string[]}
 */
export function getSemanasBadge(tarefa, semanas) {
  const iniStr = tarefa.data_inicio_planejada || tarefa.inicio_previsto;
  const fimStr = tarefa.data_fim_planejada    || tarefa.termino_previsto;
  if (!iniStr || !fimStr) return [];
  const inicio = new Date(iniStr + "T00:00:00");
  const termino = new Date(fimStr + "T00:00:00");
  return semanas
    .filter(s => inicio <= s.end && termino >= s.start)
    .map(s => s.label);
}

/**
 * Formata uma Date como "23 jun" em pt-BR.
 * @param {Date} date
 * @returns {string}
 */
export function formatData(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Formata uma Date como "DD/MM" em pt-BR.
 * @param {Date} date
 * @returns {string}
 */
export function formatDataDDMM(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const WEEK_ALPHAS = [
  { bg: 0.22, border: 1.00, text: 1.00, glow: true  },
  { bg: 0.17, border: 0.80, text: 0.90, glow: false },
  { bg: 0.12, border: 0.60, text: 0.73, glow: false },
  { bg: 0.08, border: 0.42, text: 0.57, glow: false },
  { bg: 0.05, border: 0.28, text: 0.42, glow: false },
  { bg: 0.02, border: 0.18, text: 0.30, glow: false },
];

/**
 * Retorna inline style para o badge/pill de uma semana.
 * @param {number} weekIndex 0 (S1) a 5 (S6)
 * @param {boolean} isDark
 * @returns {React.CSSProperties}
 */
export function getWeekBadgeStyle(weekIndex, isDark) {
  const a = WEEK_ALPHAS[Math.max(0, Math.min(weekIndex, 5))];
  const [r, g, b] = isDark ? [38, 255, 255] : [16, 42, 68];
  return {
    background:  `rgba(${r},${g},${b},${a.bg})`,
    borderColor: `rgba(${r},${g},${b},${a.border})`,
    color:       `rgba(${r},${g},${b},${a.text})`,
    ...(a.glow && isDark
      ? { boxShadow: `0 0 8px rgba(${r},${g},${b},0.5)` }
      : {}),
  };
}

/**
 * Formata uma string de data ISO (YYYY-MM-DD) como "dd/mm/aa" em pt-BR.
 * Retorna "—" para valores null/undefined/vazios.
 * @param {string|null} val
 * @returns {string}
 */
export function fmtDateStr(val) {
  if (!val) return "—";
  const d = new Date(val + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ── helpers internos ──────────────────────────────────────────────

function _startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Recua para segunda-feira (weekStartsOn = 1)
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function _addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function _getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
