import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_LIST = ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"];

export default function MedicoesList({ medicoes, contratos, isLoading, onEdit, onDelete, onUpdateStatus }) {
  const [viewItem, setViewItem] = useState(null);

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;

  const getContrato = (id) => contratos.find(c => c.id === id);

  if (!medicoes.length) return (
    <Card className="text-center p-12">
      <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Nenhuma medição registrada</p>
    </Card>
  );

  return (
    <>
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
                      <StatusBadge status={m.status} />
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
                  <RowActions
                    onView={() => setViewItem(m)}
                    onEdit={() => onEdit(m)}
                    onDelete={() => onDelete(m.id)}
                    deleteDescription="A medição será excluída permanentemente."
                    size="md"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {viewItem && (
        <DetailDialog
          open={!!viewItem}
          onOpenChange={(o) => !o && setViewItem(null)}
          title={`Medição ${viewItem.numero || ""}`}
          sections={[
            { label: "Número", value: viewItem.numero },
            { label: "Status", value: viewItem.status },
            { label: "Valor", value: fmt(viewItem.valor) },
            { label: "Período início", value: viewItem.periodo_inicio },
            { label: "Período fim", value: viewItem.periodo_fim },
            { label: "Observações", value: viewItem.observacoes, full: true },
          ]}
        />
      )}
    </>
  );
}
