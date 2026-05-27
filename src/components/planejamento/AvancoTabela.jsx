// src/components/planejamento/AvancoTabela.jsx
import { useMemo } from "react";
import {
  eachWeekOfInterval, format, parseISO,
  subMonths, addYears, getISOWeek, getISOWeekYear, startOfISOWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getProjectWeeks(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return [];
  try {
    return eachWeekOfInterval(
      { start: subMonths(parseISO(dataInicio), 3), end: addYears(parseISO(dataFim), 1) },
      { weekStartsOn: 1 }
    );
  } catch {
    return [];
  }
}

function weekKey(monday) {
  // ISO week key: "2026-W05" — must match Builder A1 migration format
  return `${getISOWeekYear(monday)}-W${String(getISOWeek(monday)).padStart(2, "0")}`;
}

function weekLabel(monday) {
  return format(monday, "dd/MM");
}

function monthLabel(monday) {
  return format(monday, "MMM/yy", { locale: ptBR });
}

// Groups weeks by the month of their Monday (Monday determines the month)
function groupWeeksByMonth(weeks) {
  const groups = [];
  let current = null;
  weeks.forEach((w) => {
    const label = monthLabel(w);
    if (!current || current.label !== label) {
      current = { label, weeks: [w] };
      groups.push(current);
    } else {
      current.weeks.push(w);
    }
  });
  return groups;
}

function isCurrentOrPastWeek(monday) {
  return monday <= startOfISOWeek(new Date());
}

// ── AvancoTabela ──────────────────────────────────────────────────────────────

export default function AvancoTabela({ projectWeeks, weekMap, prevAcum, realAcum, projAcum, onSave }) {
  return <div>placeholder</div>;
}
