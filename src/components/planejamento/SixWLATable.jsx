import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { getWeekBadgeStyle } from "@/utils/sixWLAUtils";
import { useDarkMode } from "@/hooks/useDarkMode";

/**
 * @param {{
 *   items: Array<{
 *     id: string,
 *     tarefa: object|null,
 *     semanasBadge: string[],
 *     restricao_projeto_eng: boolean,
 *     restricao_material: boolean,
 *     restricao_mao_obra: boolean,
 *     restricao_equipamentos: boolean,
 *     restricao_externas: boolean,
 *     restricao_informacoes: boolean,
 *     observacao: string|null
 *   }>,
 *   restricoes: { key: string, label: string, full: string }[],
 *   isLoading: boolean,
 *   onUpdate: (id: string, data: object) => void,
 *   onDelete: (id: string) => void
 * }} props
 */
export default function SixWLATable({ items, restricoes, isLoading, onUpdate, onDelete }) {
  const [editingObs, setEditingObs] = useState(null); // { id: string, value: string }
  const isDark = useDarkMode();

  const handleObsClose = (open, item) => {
    if (!open && editingObs?.id === item.id) {
      onUpdate(item.id, { observacao: editingObs.value });
      setEditingObs(null);
    }
  };

  const totalCols = 5 + restricoes.length + 2; // Atividade, Área, Sem., %Prev, %Real + N restrições + Obs + Remover

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Atividade</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Área / Disc.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Sem.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">%Prev</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">%Real</th>
              {restricoes.map(r => (
                <th
                  key={r.key}
                  className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  title={r.full}
                >
                  {r.tableLabel}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Obs.</th>
              <th className="px-2 py-3" />
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
              return (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-muted/40 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                    <span className="line-clamp-2">{item.tarefa?.nome || "—"}</span>
                    {item.tarefa?.status && (
                      <span className="text-xs text-muted-foreground block">{item.tarefa.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {[item.tarefa?.area, item.tarefa?.disciplina].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
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
                  <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                    {item.tarefa?.avanco_previsto != null ? `${item.tarefa.avanco_previsto}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
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
                  {restricoes.map(r => (
                    <td key={r.key} className="px-2 py-2 text-center">
                      <Checkbox
                        checked={!!item[r.key]}
                        onCheckedChange={(checked) => onUpdate(item.id, { [r.key]: !!checked })}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
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
                          <Pencil className="w-3.5 h-3.5" />
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
                  <td className="px-2 py-3">
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"
                      title="Remover do 6WLA"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
