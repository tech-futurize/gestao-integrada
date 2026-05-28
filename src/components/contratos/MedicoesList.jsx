import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, ClipboardList } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_COLORS = {
  Elaboração: "bg-muted text-muted-foreground",
  "Em Revisão": "bg-status-attention/15 text-status-attention",
  "Em Aprovação": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Aprovada: "bg-status-positive/15 text-status-positive",
  Paga: "bg-status-positive/20 text-status-positive",
  Rejeitada: "bg-status-critical/15 text-status-critical",
};

const STATUS_LIST = ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"];

export default function MedicoesList({ medicoes, contratos, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;

  const getContrato = (id) => contratos.find(c => c.id === id);

  if (!medicoes.length) return (
    <Card className="text-center p-12">
      <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Nenhuma medição registrada</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {medicoes.map(m => {
        const contrato = getContrato(m.contrato_id);
        return (
          <Card key={m.id} className="bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-foreground">Medição {m.numero}</span>
                    <Badge className={STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"}>{m.status}</Badge>
                  </div>
                  {contrato && <p className="text-xs text-muted-foreground">{contrato.fornecedor} · {contrato.objeto?.substring(0, 50)}...</p>}
                  <p className="text-xs text-muted-foreground mt-1">Período: {m.periodo_inicio || "—"} → {m.periodo_fim || "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-ocre">{fmt(m.valor)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="w-44" onClick={e => e.stopPropagation()}>
                  <Select value={m.status} onValueChange={v => onUpdateStatus(m.id, v)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_LIST.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(m)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-status-critical" onClick={() => onDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
