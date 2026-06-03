// src/components/planejamento/AvancoTabela.jsx
import React, { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── CelulaEditavelAvanco — definido FORA do componente principal para evitar remount ──

/**
 * @param {object|null} registro     – registro do Supabase para este período (ou null)
 * @param {string}      campo        – nome do campo a editar
 * @param {boolean}     blocked      – período futuro (só aplicável à linha Real)
 * @param {function}    onSave       – (campo, valor) => void
 * @param {function}    [formatValue]– (number) => string para exibição (com vírgula como decimal)
 * @param {string}      [cellWidth]  – classe Tailwind de largura da célula (ex: "w-14", "w-28")
 */
function CelulaEditavelAvanco({ registro, campo, blocked, onSave, formatValue, cellWidth = "w-14" }) {
  const [editing, setEditing] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("");
  const cancelRef = React.useRef(false);

  const fmt = formatValue ?? ((v) => Number(v).toFixed(2).replace(".", ","));

  const handleSave = () => {
    if (cancelRef.current) { cancelRef.current = false; return; }
    const numVal = Number(inputVal.replace(",", "."));
    const parsed = isNaN(numVal) ? 0 : numVal;
    const original = registro?.[campo] ?? 0;
    if (parsed !== original) {
      onSave(campo, parsed);
    }
  };

  // Campo de texto (sem setas de incremento) — padrão pt-BR com vírgula decimal
  const inputEl = (
    <input
      autoFocus
      type="text"
      inputMode="decimal"
      value={inputVal}
      onChange={(e) => setInputVal(e.target.value)}
      onBlur={() => {
        handleSave();
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { cancelRef.current = false; e.target.blur(); }
        if (e.key === "Escape") { cancelRef.current = true; setEditing(false); }
      }}
      className="w-full text-center border rounded text-xs p-0 bg-background text-foreground"
    />
  );

  if (blocked) {
    return (
      <td
        className={`px-2 py-1 text-center bg-muted text-muted-foreground text-xs ${cellWidth} cursor-not-allowed`}
        title="Período futuro — edição de Real bloqueada"
      >
        —
      </td>
    );
  }

  if (!registro) {
    return editing ? (
      <td className={`px-1 py-1 text-center ${cellWidth}`}>{inputEl}</td>
    ) : (
      <td
        className={`px-2 py-1 text-center cursor-pointer hover:bg-muted/40 text-muted-foreground text-xs ${cellWidth}`}
        onClick={() => { setInputVal(""); setEditing(true); }}
      >
        —
      </td>
    );
  }

  const valor = registro[campo] ?? 0;

  return (
    <td
      className={`px-2 py-1 text-center cursor-pointer hover:bg-muted/40 ${cellWidth}`}
      onClick={() => {
        if (!editing) {
          setInputVal(valor ? Number(valor).toFixed(2).replace(".", ",") : "");
          setEditing(true);
        }
      }}
    >
      {editing ? inputEl : (
        <span className="text-xs">{valor ? fmt(valor) : "—"}</span>
      )}
    </td>
  );
}

// ── AvancoTabela ───────────────────────────────────────────────────────────────

/**
 * Tabela transposta de avanço: COLUNAS = períodos (datas), LINHAS = Previsto/Real/Projetado.
 * Suporta granularidade semanal (groupByMonth=true, 2 níveis de header)
 * ou mensal (groupByMonth=false, 1 nível de header).
 * Sem barras de preenchimento (alinhado ao padrão visual do Histograma).
 *
 * @param {Date[]}     periods       – array ordenado de datas de cada período
 * @param {Map}        dataMap       – periodKey → record do Supabase
 * @param {function}   periodKey     – (Date) => string
 * @param {function}   columnLabel   – (Date) => string exibido no header
 * @param {boolean}    groupByMonth  – true → header de 2 níveis (semanas agrupadas por mês)
 * @param {object[]}   rows          – [{campo, label, dotColor, rowCls, headerActiveBg, headerCls, acumValue, isRealRow}]
 * @param {function}   formatValue   – (number) => string para células e acum no header da linha
 * @param {function}   isBlocked     – (Date) => boolean (aplicado somente à linha Real)
 * @param {function}   onSave        – (periodKey, campo, valor) => void
 * @param {string}     [cellWidth]   – classe Tailwind de largura das células de dados (default "w-14")
 */
export default function AvancoTabela({
  periods,
  dataMap,
  periodKey,
  columnLabel,
  groupByMonth = false,
  rows,
  formatValue,
  isBlocked,
  onSave,
  cellWidth = "w-14",
  readOnly = false,
}) {
  const fmt = formatValue ?? ((v) => Number(v).toFixed(1));
  // Agrupamento por mês para o header de 2 níveis (usado quando groupByMonth=true)
  const monthGroups = useMemo(() => {
    if (!groupByMonth) return null;
    const groups = [];
    let current = null;
    periods.forEach((p) => {
      const label = format(p, "MMM/yy", { locale: ptBR });
      if (!current || current.label !== label) {
        current = { label, periods: [p] };
        groups.push(current);
      } else {
        current.periods.push(p);
      }
    });
    return groups;
  }, [groupByMonth, periods]);

  if (!periods || periods.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-max min-w-full">
          <thead className="sticky top-0 z-20">
            {groupByMonth ? (
              <>
                {/* Linha 1: coluna label (rowspan=2) + meses (colspan=N semanas) */}
                <tr className="bg-muted border-b border-border">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-30 bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[160px]"
                  >
                    —
                  </th>
                  {monthGroups.map(({ label, periods: gPeriods }) => (
                    <th
                      key={label}
                      colSpan={gPeriods.length}
                      className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l-2 border-border whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
                {/* Linha 2: dd/MM de cada período */}
                <tr className="bg-muted/60 border-b border-border">
                  {periods.map((p) => (
                    <th
                      key={periodKey(p)}
                      className="px-2 py-1 text-center text-[10px] font-medium text-muted-foreground border-l border-border whitespace-nowrap"
                    >
                      {columnLabel(p)}
                    </th>
                  ))}
                </tr>
              </>
            ) : (
              /* Header de 1 nível (mensal) */
              <tr className="bg-muted border-b border-border">
                <th className="sticky left-0 z-30 bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[160px]">
                  —
                </th>
                {periods.map((p) => (
                  <th
                    key={periodKey(p)}
                    className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l border-border whitespace-nowrap"
                  >
                    {columnLabel(p)}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map(
              ({
                campo,
                label,
                dotColor,
                rowCls,
                headerActiveBg,
                headerCls,
                acumValue,
                isRealRow,
                blockWhenField,
                readOnlyRow,
              }) => (
                <tr
                  key={campo}
                  className={`border-b border-border ${rowCls} transition-colors`}
                >
                  {/* Célula sticky da linha (label + acumulado — SEM barra de preenchimento) */}
                  <td
                    className={`sticky left-0 z-10 px-4 py-2 min-w-[160px] ${headerActiveBg}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                      <span className={`text-xs font-bold ${headerCls}`}>{label}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {formatValue ? formatValue(acumValue) : Number(acumValue).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  {/* Células de dados por período */}
                  {periods.map((p) => {
                    const pk = periodKey(p);
                    const rec = dataMap.get(pk) ?? null;
                    if (readOnly || readOnlyRow) {
                      const rawValor = rec?.[campo];
                      const valor = readOnlyRow ? rawValor : (rawValor ?? 0);
                      return (
                        <td
                          key={pk + "-" + campo}
                          className={`px-2 py-1 text-center text-xs ${cellWidth} ${readOnlyRow ? "text-muted-foreground" : ""}`}
                          title={readOnlyRow ? "Derivado do módulo Faturamento" : undefined}
                        >
                          {readOnlyRow && valor == null ? "—" : fmt(valor)}
                        </td>
                      );
                    }
                    // Bloqueia projetado quando o campo real foi explicitamente preenchido (incluindo zero)
                    const blockedByReal = blockWhenField
                      ? rec !== null && rec[blockWhenField] !== null && rec[blockWhenField] !== undefined
                      : false;
                    return (
                      <CelulaEditavelAvanco
                        key={pk + "-" + campo}
                        registro={rec}
                        campo={campo}
                        blocked={(isRealRow && isBlocked ? isBlocked(p) : false) || blockedByReal}
                        onSave={(c, v) => onSave(pk, c, v)}
                        formatValue={formatValue}
                        cellWidth={cellWidth}
                      />
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
