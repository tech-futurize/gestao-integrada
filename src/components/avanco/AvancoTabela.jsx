import { useState } from "react";
import React from "react";
import { isFutureWeek, formatWeekLabel } from "@/utils/isoWeek";

// Definido fora do componente principal — evita remount ao re-render do pai
function CelulaEditavel({ value, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const cancelRef = React.useRef(false);

  if (disabled) {
    return (
      <td
        className="px-2 py-1 text-center bg-muted text-muted-foreground text-xs w-14 cursor-not-allowed select-none"
        title="Semana futura — edição de Real bloqueada"
      >
        —
      </td>
    );
  }

  const valor = value ?? 0;

  const handleBlur = () => {
    if (cancelRef.current) { cancelRef.current = false; return; }
    const num = parseFloat(inputVal);
    if (isNaN(num)) { setEditing(false); return; }
    if (num !== valor) onSave(num);
    setEditing(false);
  };

  return (
    <td
      className="px-1 py-1 text-center cursor-pointer hover:bg-accent w-14"
      onClick={() => { if (!editing) { setInputVal(String(valor)); setEditing(true); } }}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => {
            if (e.key === "Enter") { cancelRef.current = false; e.target.blur(); }
            if (e.key === "Escape") { cancelRef.current = true; setEditing(false); }
          }}
          className="w-12 text-center border rounded text-xs p-0"
        />
      ) : (
        <span className="text-xs tabular-nums">{valor.toFixed(2)}</span>
      )}
    </td>
  );
}

/**
 * Tabela transposta de Avanço Físico.
 *
 * Props:
 *   weeks       {string[]}   — todas as semanas ISO da escala ("YYYY-Www")
 *   monthGroups {Array}      — [{key, label, weeks[]}] de groupWeeksByMonth()
 *   dataMap     {Map}        — Map<semana_iso, registro> com dados do banco
 *   onSave      {Function}   — (semana_iso, field, value) => void
 */
export default function AvancoTabela({ weeks, monthGroups, dataMap, onSave }) {
  const ROWS = [
    {
      label: "Previsto",
      field: "avanco_previsto_mensal",
      labelClass: "text-blue-600 dark:text-blue-400",
      isDisabled: () => false,
    },
    {
      label: "Real",
      field: "avanco_realizado_mensal",
      labelClass: "text-green-600 dark:text-green-400",
      isDisabled: w => isFutureWeek(w),
    },
    {
      label: "Projetado",
      field: "avanco_projetado",
      labelClass: "text-yellow-600 dark:text-yellow-500",
      isDisabled: w => !isFutureWeek(w), // editável apenas para semanas futuras
    },
  ];

  // Totais do rodapé por row
  const totals = ROWS.map(row => ({
    field: row.field,
    total: weeks.reduce((s, w) => s + (dataMap.get(w)?.[row.field] ?? 0), 0),
  }));

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-max min-w-full">
          <thead>
            {/* Linha 1: meses (colspan = nº semanas) */}
            <tr className="bg-muted border-b border-border">
              <th
                rowSpan={2}
                className="sticky left-0 z-10 bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[110px]"
              >
                Tipo
              </th>
              {monthGroups.map(g => (
                <th
                  key={g.key}
                  colSpan={g.weeks.length}
                  className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l border-border whitespace-nowrap capitalize"
                >
                  {g.label}
                </th>
              ))}
              <th
                rowSpan={2}
                className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground border-l-2 border-border whitespace-nowrap"
              >
                Total
              </th>
            </tr>
            {/* Linha 2: semanas */}
            <tr className="bg-muted/50 border-b border-border">
              {weeks.map(w => (
                <th
                  key={w}
                  className="px-1 py-1 text-center text-[10px] font-medium text-muted-foreground border-l border-border whitespace-nowrap w-14"
                >
                  {formatWeekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row, idx) => (
              <tr
                key={row.field}
                className={`border-b border-border hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
              >
                <td className={`sticky left-0 z-10 bg-card px-4 py-2 font-semibold whitespace-nowrap min-w-[110px] ${row.labelClass}`}>
                  {row.label}
                </td>
                {weeks.map(w => {
                  const rec = dataMap.get(w);
                  return (
                    <CelulaEditavel
                      key={w}
                      value={rec?.[row.field] ?? 0}
                      disabled={row.isDisabled(w)}
                      onSave={num => onSave(w, row.field, num)}
                    />
                  );
                })}
                <td className={`px-3 py-2 text-center font-semibold text-xs border-l-2 border-border tabular-nums ${row.labelClass}`}>
                  {totals.find(t => t.field === row.field)?.total.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>

          {/* Rodapé TOTAL por semana */}
          <tfoot>
            <tr className="border-t-2 border-border bg-muted font-bold text-xs">
              <td className="sticky left-0 z-10 bg-muted px-4 py-2 text-muted-foreground uppercase tracking-wide">
                TOTAL
              </td>
              {weeks.map(w => {
                const rec  = dataMap.get(w);
                const prev = rec?.avanco_previsto_mensal  ?? 0;
                const real = rec?.avanco_realizado_mensal ?? 0;
                const proj = rec?.avanco_projetado        ?? 0;
                const sum  = prev + real + proj;
                return (
                  <td key={w} className="px-1 py-2 text-center border-l border-border tabular-nums">
                    {sum > 0 ? sum.toFixed(1) : "·"}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center border-l-2 border-border tabular-nums">
                {totals.reduce((s, t) => s + t.total, 0).toFixed(2)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
