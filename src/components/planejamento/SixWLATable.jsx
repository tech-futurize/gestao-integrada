import { useState } from "react";
import { Edit, Eye, Info } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { getWeekBadgeStyle, fmtDateStr } from "@/utils/sixWLAUtils";
import { useDarkMode } from "@/hooks/useDarkMode";

// Larguras fixas das colunas sticky esquerda (px)
const COL = { atividade: 200, semana: 176, previsto: 72, real: 72, det: 40 };

// Larguras fixas das colunas sticky direita (px)
const R = { restricao: 36, obs: 64, remove: 32 };

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
export default function SixWLATable({ items, restricoes = [], isLoading, disciplinaMap = {}, onUpdate, onDelete }) {
  const [editingObs, setEditingObs] = useState(null);
  const isDark = useDarkMode();

  const handleObsClose = (open, item) => {
    if (!open && editingObs?.id === item.id) {
      onUpdate(item.id, { observacao: editingObs.value });
      setEditingObs(null);
    }
  };

  const totalCols = 5 + restricoes.length + 2;

  // Offsets left acumulados para cada coluna sticky esquerda
  const L = {
    sem:  COL.atividade,
    prev: COL.atividade + COL.semana,
    real: COL.atividade + COL.semana + COL.previsto,
    det:  COL.atividade + COL.semana + COL.previsto + COL.real,
  };

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
                className="px-1 py-3 text-center text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
                style={{ left: L.det, width: COL.det, minWidth: COL.det }}
              >
                Det.
              </th>

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
              const discCor = item.tarefa?.disciplina
                ? (disciplinaMap[item.tarefa.disciplina.toLowerCase()] ?? "#6b7280")
                : null;
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
                    <div className="flex flex-nowrap gap-1 justify-center">
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
                  <td
                    className={cn("px-1 py-2 text-center sticky z-10", stickyBg)}
                    style={{ left: L.det, width: COL.det, minWidth: COL.det }}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          aria-label="Ver detalhes da atividade"
                          title="Ver detalhes (área, disciplina, datas)"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-3" side="right" align="start">
                        <div className="space-y-2 text-xs">
                          {/* Área */}
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-10 shrink-0">Área</span>
                            <span className="font-medium text-foreground">{item.tarefa?.area || "—"}</span>
                          </div>
                          {/* Disciplina mini-card */}
                          {discCor ? (
                            <div
                              className="rounded px-2.5 py-1.5 text-xs font-semibold"
                              style={{
                                borderLeft: `3px solid ${discCor}`,
                                background: `${discCor}18`,
                                color: discCor,
                              }}
                            >
                              {item.tarefa.disciplina}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <span className="text-muted-foreground w-10 shrink-0">Disc.</span>
                              <span className="font-medium text-foreground">—</span>
                            </div>
                          )}
                          {/* Datas em grid 3×3: label | Início | Fim */}
                          <div className="grid grid-cols-3 gap-x-3 gap-y-1 border-t border-border pt-2 mt-1">
                            <div />
                            <span className="text-muted-foreground font-medium">Início</span>
                            <span className="text-muted-foreground font-medium">Fim</span>
                            <span className="text-muted-foreground">BL</span>
                            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_inicio_baseline)}</span>
                            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_fim_baseline)}</span>
                            <span className="text-muted-foreground">Real</span>
                            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_inicio_real)}</span>
                            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_fim_real)}</span>
                            <span className="text-muted-foreground">Proj</span>
                            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.inicio_previsto)}</span>
                            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.termino_previsto)}</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>

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

</>
  );
}
