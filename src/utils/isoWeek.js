import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeekYear,
  addWeeks,
  addDays,
  eachWeekOfInterval,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Converte Date → string "YYYY-Www" (ISO 8601) */
export function dateToISOWeek(date) {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Retorna semana ISO atual como "YYYY-Www" */
export function getCurrentISOWeek() {
  return dateToISOWeek(new Date());
}

/** Retorna true se semana_iso é estritamente posterior à semana atual */
export function isFutureWeek(semana_iso) {
  return semana_iso > getCurrentISOWeek();
}

/**
 * Retorna a segunda-feira de uma semana ISO "YYYY-Www".
 * Usa April 1 como âncora (sempre no mesmo ano ISO que o ano calendário).
 */
export function isoWeekToDate(semana_iso) {
  const [yearStr, weekStr] = semana_iso.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  const refDate = new Date(year, 3, 1); // 1º de abril
  const weekYearStart = startOfISOWeekYear(refDate); // segunda-feira da W01
  return addWeeks(weekYearStart, week - 1);
}

/**
 * Gera array de semanas ISO de startDate a endDate (inclusive).
 * Cada semana é representada pela sua segunda-feira (ISO 8601).
 */
export function generateWeeksScale(startDate, endDate) {
  const mondays = eachWeekOfInterval(
    { start: new Date(startDate), end: new Date(endDate) },
    { weekStartsOn: 1 }
  );
  const seen = new Set();
  const result = [];
  for (const d of mondays) {
    const w = dateToISOWeek(d);
    if (!seen.has(w)) {
      seen.add(w);
      result.push(w);
    }
  }
  return result;
}

/** Formata "2025-W03" → "S03" */
export function formatWeekLabel(semana_iso) {
  return 'S' + semana_iso.split('-W')[1];
}

/**
 * Agrupa semanas por mês usando a quinta-feira da semana para atribuição
 * (quinta define o ano ISO, elimina ambiguidade W01/W52 nas bordas).
 * Retorna [{key: "2025-01", label: "jan/25", weeks: ["2025-W01", ...]}]
 */
export function groupWeeksByMonth(weeks) {
  const groups = [];
  for (const w of weeks) {
    const monday   = isoWeekToDate(w);
    const thursday = addDays(monday, 3);
    const key      = format(thursday, 'yyyy-MM');
    const label    = format(thursday, "MMM/yy", { locale: ptBR });
    const last     = groups[groups.length - 1];
    if (last && last.key === key) {
      last.weeks.push(w);
    } else {
      groups.push({ key, label, weeks: [w] });
    }
  }
  return groups;
}
