// src/components/planejamento/AvancoTabela.jsx
import React, { useMemo } from "react";
import { format, getISOWeek, getISOWeekYear, startOfISOWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Helpers ──────────────────────────────────────────────────────────────────

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
        <span className="text-xs">{valor ? Number(valor).toFixed(1) : "0"}</span>
      )}
    </td>
  );
}

// ── AvancoTabela ──────────────────────────────────────────────────────────────

export default function AvancoTabela({ projectWeeks, weekMap, prevAcum, realAcum, projAcum, onSave }) {
  const monthGroups = useMemo(() => groupWeeksByMonth(projectWeeks), [projectWeeks]);

  if (projectWeeks.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-max min-w-full">
          <thead className="sticky top-0 z-20">
            {/* Linha 1: coluna label (rowspan=2) + meses (colspan=N semanas) */}
            <tr className="bg-muted border-b border-border">
              <th
                rowSpan={2}
                className="sticky left-0 z-30 bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[160px]"
              >
                —
              </th>
              {monthGroups.map(({ label, weeks }) => (
                <th
                  key={label}
                  colSpan={weeks.length}
                  className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l-2 border-border whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
            {/* Linha 2: dd/MM de cada segunda-feira */}
            <tr className="bg-muted/60 border-b border-border">
              {projectWeeks.map((w) => (
                <th
                  key={weekKey(w)}
                  className="px-2 py-1 text-center text-[10px] font-medium text-muted-foreground border-l border-border whitespace-nowrap"
                >
                  {weekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ── Linha Previsto ─────────────────────────────── */}
            <tr className="border-b border-border bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors">
              <td className="sticky left-0 z-10 bg-blue-50 dark:bg-blue-950/20 px-4 py-2 min-w-[160px] border-r border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Previsto</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{prevAcum.toFixed(1)}%</span>
                </div>
              </td>
              {projectWeeks.map((w) => {
                const wk = weekKey(w);
                return (
                  <CelulaEditavelAvanco
                    key={wk + "-prev"}
                    registro={weekMap.get(wk) ?? null}
                    campo="avanco_previsto_mensal"
                    blocked={false}
                    onSave={(campo, valor) => onSave(wk, campo, valor)}
                  />
                );
              })}
            </tr>

            {/* ── Linha Real ──────────────────────────────────── */}
            <tr className="border-b border-border bg-green-50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors">
              <td className="sticky left-0 z-10 bg-green-50 dark:bg-green-950/20 px-4 py-2 min-w-[160px] border-r border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-300">Real</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{realAcum.toFixed(1)}%</span>
                </div>
                {prevAcum > 0 && (
                  <>
                    <div className="h-[3px] bg-muted rounded-full mt-1.5">
                      <div
                        className="h-[3px] bg-green-500 rounded-full"
                        style={{ width: `${Math.min((realAcum / prevAcum) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {realAcum.toFixed(1)} / {prevAcum.toFixed(1)} prev
                    </div>
                  </>
                )}
              </td>
              {projectWeeks.map((w) => {
                const wk = weekKey(w);
                return (
                  <CelulaEditavelAvanco
                    key={wk + "-real"}
                    registro={weekMap.get(wk) ?? null}
                    campo="avanco_realizado_mensal"
                    blocked={!isCurrentOrPastWeek(w)}
                    onSave={(campo, valor) => onSave(wk, campo, valor)}
                  />
                );
              })}
            </tr>

            {/* ── Linha Projetado ─────────────────────────────── */}
            <tr className="border-b border-border bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20 transition-colors">
              <td className="sticky left-0 z-10 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-2 min-w-[160px] border-r border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Projetado</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{projAcum.toFixed(1)}%</span>
                </div>
                {prevAcum > 0 && (
                  <>
                    <div className="h-[3px] bg-muted rounded-full mt-1.5">
                      <div
                        className="h-[3px] bg-amber-500 rounded-full"
                        style={{ width: `${Math.min((projAcum / prevAcum) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {projAcum.toFixed(1)} / {prevAcum.toFixed(1)} prev
                    </div>
                  </>
                )}
              </td>
              {projectWeeks.map((w) => {
                const wk = weekKey(w);
                return (
                  <CelulaEditavelAvanco
                    key={wk + "-proj"}
                    registro={weekMap.get(wk) ?? null}
                    campo="avanco_projetado"
                    blocked={false}
                    onSave={(campo, valor) => onSave(wk, campo, valor)}
                  />
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
