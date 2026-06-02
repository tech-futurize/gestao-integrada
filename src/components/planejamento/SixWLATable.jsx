import { useState } from "react";
import { Edit, Info, ChevronRight, ChevronLeft } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { getWeekBadgeStyle, fmtDateStr } from "@/utils/sixWLAUtils";
import { useDarkMode } from "@/hooks/useDarkMode";

// Larguras fixas das colunas sticky esquerda (px)
const COL = { atividade: 200, semana: 80, previsto: 72, real: 72, toggle: 24 };

// Larguras fixas das colunas sticky direita (px)
const R = { restricao: 48, obs: 80, remove: 40 };

// Offset right de cada coluna de restrição (da mais à direita para a mais à esquerda)
function rRight(idx, total) {
  return (total - 1 - idx) * R.restricao + R.obs + R.remove;
}

/**
 * @param {{
 *   items: Array<{
 *     id: string,
 *     tarefa: object|null,
 *     semanasBadge: string[],
 *     adicionado_manualmente: boolean,
 *     restricao_projeto_eng: boolean,
 *     restricao_material: boolean,
 *     restricao_mao_obra: boolean,
 *     restricao_equipamentos: boolean,
 *     restricao_externas: boolean,
 *     restricao_informacoes: boolean,
 *     observacao: string|null
 *   }>,
 *   restricoes: { key: string, cardLabel: string, tableLabel: string, full: string }[],
 *   isLoading: boolean,
 *   onUpdate: (id: string, data: object) => void,
 *   onDelete: (id: string) => void
 * }} props
 */
export default function SixWLATable({ items, restricoes, isLoading, onUpdate, onDelete }) {
  const [editingObs, setEditingObs] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const isDark = useDarkMode();

  const handleObsClose = (open, item) => {
    if (!open && editingObs?.id === item.id) {
      onUpdate(item.id, { observacao: editingObs.value });
      setEditingObs(null);
    }
  };

  const detailColCount = showDetails ? 8 : 0;
  const totalCols = 5 + detailColCount + restricoes.length + 2;

  // Offsets left acumulados para cada coluna sticky esquerda
  const L = {
    sem:    COL.atividade,
    prev:   COL.atividade + COL.semana,
    real:   COL.atividade + COL.semana + COL.previsto,
    toggle: COL.atividade + COL.semana + COL.previsto + COL.real,
  };

  // Separator visual na zona expansível
  const sepStart = "border-l-2 border-slate-300 dark:border-slate-600";
  const sepEnd   = "border-r-2 border-slate-300 dark:border-slate-600";

  return (
    <>
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              {/* ── STICKY ESQUERDA ─────────────────────────────────── */}
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 bg-muted z-20"
                style={{ width: COL.atividade, minWidth: COL.atividade }}
              >
                Atividade
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
                style={{ left: L.sem, width: COL.semana, minWidth: COL.semana }}
              >
                Sem.
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
                style={{ left: L.prev, width: COL.previsto, minWidth: COL.previsto }}
              >
                %Prev
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
                style={{ left: L.real, width: COL.real, minWidth: COL.real }}
              >
                %Real
              </th>
              <th
                className="px-1 py-3 text-center sticky bg-muted z-20"
                style={{ left: L.toggle, width: COL.toggle, minWidth: COL.toggle }}
              >
                <button
                  onClick={() => setShowDetails(v => !v)}
                  className="p-0.5 rounded hover:bg-border text-muted-foreground hover:text-foreground transition-colors"
                  title={showDetails ? "Recolher: Área, Disciplina, Datas" : "Expandir: Área, Disciplina, Datas BL/Real/Proj"}
                >
                  {showDetails
                    ? <ChevronLeft className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </th>

              {/* ── EXPANSÍVEL (rolagem horizontal) ─────────────────── */}
              {showDetails && (
                <>
                  <th className={cn("px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap", sepStart)}>Área</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Disciplina</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">BL Ini</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">BL Fim</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Real Ini</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Real Fim</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Proj Ini</th>
                  <th className={cn("px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap", sepEnd)}>Proj Fim</th>
                </>
              )}

              {/* ── STICKY DIREITA ──────────────────────────────────── */}
              {restricoes.map((r, idx) => (
                <th
                  key={r.key}
                  className="py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap sticky bg-muted z-20"
                  title={r.full}
                  style={{ right: rRight(idx, restricoes.length), width: R.restricao, minWidth: R.restricao }}
                >
                  {r.tableLabel}
                </th>
              ))}
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
                style={{ right: R.remove, width: R.obs, minWidth: R.obs }}
              >
                Obs.
              </th>
              <th
                className="px-2 py-3 sticky bg-muted z-20"
                style={{ right: 0, width: R.remove, minWidth: R.remove }}
              />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={totalCols} className="py-12 text-center text-muted-foreground text-sm">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="py-12 text-center text-muted-foreground text-sm">
                  Nenhuma atividade no período selecionado
                </td>
              </tr>
            )}
            {items.map((item, i) => {
              const avReal = item.tarefa?.avanco_realizado;
              const isOdd = i % 2 !== 0;
              // Células sticky precisam de fundo sólido para não mostrar conteúdo em rolagem
              const stickyBg = "bg-card";
              return (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-muted/40 transition-colors ${isOdd ? "bg-muted/10" : ""}`}
                >
                  {/* ── STICKY ESQUERDA ─────────────────────────────── */}
                  <td
                    className={cn("px-4 py-3 font-medium text-foreground sticky left-0 z-10", stickyBg)}
                    style={{ width: COL.atividade, minWidth: COL.atividade }}
                  >
                    <div className="flex items-start gap-1.5">
                      {item.adicionado_manualmente && (
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" title="Adicionado manualmente" />
                      )}
                      <div>
                        <span className="line-clamp-2">{item.tarefa?.nome || "—"}</span>
                        {item.tarefa?.status && (
                          <span className="text-xs text-muted-foreground block">{item.tarefa.status}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    className={cn("px-4 py-3 text-center sticky z-10", stickyBg)}
                    style={{ left: L.sem, width: COL.semana, minWidth: COL.semana }}
                  >
                    <div className="flex flex-wrap gap-1 justify-center">
                      {item.semanasBadge.length > 0
                        ? item.semanasBadge.map(s => (
                            <span
                              key={s}
                              style={getWeekBadgeStyle(Math.max(0, (parseInt(s.slice(1), 10) || 1) - 1), isDark)}
                              className="text-xs font-semibold px-1.5 py-0.5 rounded border"
                            >
                              {s}
                            </span>
                          ))
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td
                    className={cn("px-4 py-3 text-center text-xs font-medium text-muted-foreground sticky z-10", stickyBg)}
                    style={{ left: L.prev, width: COL.previsto, minWidth: COL.previsto }}
                  >
                    {item.tarefa?.avanco_previsto != null ? `${item.tarefa.avanco_previsto}%` : "—"}
                  </td>
                  <td
                    className={cn("px-4 py-3 text-center sticky z-10", stickyBg)}
                    style={{ left: L.real, width: COL.real, minWidth: COL.real }}
                  >
                    <span className={cn(
                      "text-xs font-bold",
                      avReal >= 100 ? "text-green-600 dark:text-green-400" :
                      avReal >= 50  ? "text-amber-600 dark:text-amber-400" :
                      avReal > 0    ? "text-red-500 dark:text-red-400" :
                                      "text-muted-foreground"
                    )}>
                      {avReal != null ? `${avReal}%` : "—"}
                    </span>
                  </td>
                  {/* placeholder do toggle — mantém alinhamento */}
                  <td
                    className={cn("px-1 py-3 sticky z-10", stickyBg)}
                    style={{ left: L.toggle, width: COL.toggle, minWidth: COL.toggle }}
                  />

                  {/* ── EXPANSÍVEL ──────────────────────────────────── */}
                  {showDetails && (
                    <>
                      <td className={cn("px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", sepStart)}>
                        {item.tarefa?.area || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {item.tarefa?.disciplina || "—"}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateStr(item.tarefa?.data_inicio_baseline)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateStr(item.tarefa?.data_fim_baseline)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateStr(item.tarefa?.data_inicio_real)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateStr(item.tarefa?.data_fim_real)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDateStr(item.tarefa?.inicio_previsto)}
                      </td>
                      <td className={cn("px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap", sepEnd)}>
                        {fmtDateStr(item.tarefa?.termino_previsto)}
                      </td>
                    </>
                  )}

                  {/* ── STICKY DIREITA ──────────────────────────────── */}
                  {restricoes.map((r, idx) => (
                    <td
                      key={r.key}
                      className={cn("px-2 py-2 text-center sticky z-10", stickyBg)}
                      style={{ right: rRight(idx, restricoes.length), width: R.restricao, minWidth: R.restricao }}
                    >
                      <Checkbox
                        checked={!!item[r.key]}
                        onCheckedChange={(checked) => onUpdate(item.id, { [r.key]: !!checked })}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                    </td>
                  ))}
                  <td
                    className={cn("px-4 py-3 sticky z-10", stickyBg)}
                    style={{ right: R.remove, width: R.obs, minWidth: R.obs }}
                  >
                    <Popover
                      open={editingObs?.id === item.id}
                      onOpenChange={(open) => handleObsClose(open, item)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={() => setEditingObs({ id: item.id, value: item.observacao || "" })}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title={item.observacao || "Adicionar observação"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" side="left">
                        <p className="text-xs font-semibold mb-2 text-foreground">Observação</p>
                        <Textarea
                          rows={3}
                          value={editingObs?.id === item.id ? editingObs.value : ""}
                          onChange={e =>
                            setEditingObs(prev => prev?.id === item.id ? { ...prev, value: e.target.value } : prev)
                          }
                          placeholder="Descreva a restrição ou observação..."
                          className="text-xs resize-none"
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td
                    className={cn("px-2 py-3 sticky z-10", stickyBg)}
                    style={{ right: 0, width: R.remove, minWidth: R.remove }}
                  >
                    <RowActions
                      onView={() => setViewItem(item)}
                      onDelete={() => onDelete(item.id)}
                      deleteTitle="Remover do 6WLA"
                      deleteDescription="Esta atividade será removida da seleção de semanas. A tarefa no cronograma não será excluída."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {viewItem && (
      <DetailDialog
        open={!!viewItem}
        onOpenChange={(o) => !o && setViewItem(null)}
        title={viewItem.tarefa?.nome || "Atividade"}
        sections={[
          { label: "Status", value: viewItem.tarefa?.status },
          { label: "Área", value: viewItem.tarefa?.area },
          { label: "Disciplina", value: viewItem.tarefa?.disciplina },
          { label: "Responsável", value: viewItem.tarefa?.responsavel },
          { label: "Avanço previsto", value: viewItem.tarefa?.avanco_previsto != null ? `${viewItem.tarefa.avanco_previsto}%` : null },
          { label: "Avanço realizado", value: viewItem.tarefa?.avanco_realizado != null ? `${viewItem.tarefa.avanco_realizado}%` : null },
          { label: "Início planejado", value: viewItem.tarefa?.data_inicio_planejada },
          { label: "Fim planejado", value: viewItem.tarefa?.data_fim_planejada },
          { label: "Observação", value: viewItem.observacao, full: true },
        ]}
      />
    )}
    </>
  );
}
