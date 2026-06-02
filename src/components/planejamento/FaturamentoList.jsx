import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import RowActions from "@/components/ui/RowActions";
import { StatusBadge } from "@/components/ui/StatusBadge";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const mesLabel = (d) => {
  if (!d) return "—";
  try { return format(parseISO(d), "MMM/yy", { locale: ptBR }); } catch { return d; }
};

export default function FaturamentoList({ faturamentos, isLoading, onEdit, onDelete }) {
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;

  if (!faturamentos.length) return (
    <Card className="text-center p-12">
      <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Nenhum faturamento registrado</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {faturamentos.map((f) => (
        <Card key={f.id} className="bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-foreground">{f.numero || "Faturamento"}</span>
                  <StatusBadge status={f.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Mês de referência: {mesLabel(f.mes_referencia)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-emerald-600">{fmt(f.valor_medido)}</p>
                <p className="text-xs text-muted-foreground">medido no período</p>
              </div>
            </div>
            <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
              <RowActions
                onEdit={() => onEdit(f)}
                onDelete={() => onDelete(f.id)}
                deleteDescription="O faturamento será excluído permanentemente."
                size="md"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
