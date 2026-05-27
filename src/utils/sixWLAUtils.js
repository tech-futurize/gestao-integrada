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
 * Considera null/undefined em datas como "sem sobreposição".
 * @param {{ inicio_previsto: string|null, termino_previsto: string|null }} tarefa
 * @param {{ label: string, start: Date, end: Date }[]} semanas
 * @returns {string[]}
 */
export function getSemanasBadge(tarefa, semanas) {
  if (!tarefa.inicio_previsto || !tarefa.termino_previsto) return [];
  const inicio = new Date(tarefa.inicio_previsto);
  const termino = new Date(tarefa.termino_previsto);
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
