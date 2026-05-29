import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import ConfirmDeleteButton from "@/components/ui/ConfirmDeleteButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

const fmt = (v) => v != null && v !== 0
  ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
  : "—";

const TIPO_COLORS = {
  Prazo:          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Valor:          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Prazo e Valor": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function AditivosList({ aditivos, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">Aditivos</span>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="w-3 h-3 mr-1" /> Aditivo
        </Button>
      </div>

      {aditivos.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">Nenhum aditivo registrado.</p>
      ) : (
        <div className="divide-y divide-border">
          {aditivos.map(a => (
            <div key={a.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {a.numero && <span className="text-xs font-mono text-muted-foreground">{a.numero}</span>}
                  <Badge className={TIPO_COLORS[a.tipo] || "bg-muted text-muted-foreground"}>{a.tipo}</Badge>
                  <StatusBadge status={a.status} />
                </div>
                {a.escopo_texto && (
                  <p className="text-xs text-muted-foreground truncate">{a.escopo_texto}</p>
                )}
                <div className="flex items-center gap-4 mt-1">
                  {a.prazo_dias > 0 && (
                    <span className="text-xs text-muted-foreground">+{a.prazo_dias} dias</span>
                  )}
                  {a.valor > 0 && (
                    <span className="text-xs font-semibold text-ocre">{fmt(a.valor)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => onEdit(a)}><Edit className="w-3 h-3" /></Button>
                <ConfirmDeleteButton size="sm" onConfirm={() => onDelete(a.id)} description="O aditivo será excluído permanentemente." />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
