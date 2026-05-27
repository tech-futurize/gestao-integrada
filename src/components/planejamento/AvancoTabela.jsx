// src/components/planejamento/AvancoTabela.jsx
import React, { useMemo } from "react";
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

// ── CelulaEditavelAvanco — defined OUTSIDE main component to prevent remount ──

function CelulaEditavelAvanco({ registro, campo, blocked, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("");
  const cancelRef = React.useRef(false);

  if (blocked) {
    return (
      <td
        className="px-2 py-1 text-center bg-muted text-muted-foreground text-xs w-10 cursor-not-allowed"
        title="Semana futura — edição de Real bloqueada"
      >
        —
      </td>
    );
  }

  if (!registro) {
    // No record yet — show editable zero
    const handleClick = () => {
      setInputVal("0");
      setEditing(true);
    };
    return editing ? (
      <td className="px-1 py-1 text-center w-10">
        <input
          autoFocus
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={() => {
            if (!cancelRef.current) onSave(campo, Number(inputVal));
            cancelRef.current = false;
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { cancelRef.current = false; e.target.blur(); }
            if (e.key === "Escape") { cancelRef.current = true; setEditing(false); }
          }}
          className="w-10 text-center border rounded text-xs p-0"
        />
      </td>
    ) : (
      <td
        className="px-2 py-1 text-center cursor-pointer hover:bg-accent text-muted-foreground text-xs w-10"
        onClick={handleClick}
      >
        0
      </td>
    );
  }

  const valor = registro[campo] ?? 0;

  const handleBlur = () => {
    if (cancelRef.current) { cancelRef.current = false; return; }
    onSave(campo, Number(inputVal));
    setEditing(false);
  };

  return (
    <td
      className="px-2 py-1 text-center cursor-pointer hover:bg-accent w-10"
      onClick={() => { if (!editing) { setInputVal(String(valor)); setEditing(true); } }}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") { cancelRef.current = false; e.target.blur(); }
            if (e.key === "Escape") { cancelRef.current = true; setEditing(false); }
          }}
          className="w-10 text-center border rounded text-xs p-0"
        />
      ) : (
        <span className="text-xs">{valor || "0"}</span>
      )}
    </td>
  );
}

// ── AvancoTabela ──────────────────────────────────────────────────────────────

export default function AvancoTabela({ projectWeeks, weekMap, prevAcum, realAcum, projAcum, onSave }) {
  return <div>placeholder</div>;
}
