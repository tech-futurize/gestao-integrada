import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/dateUtils";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function ContratosList({ contratos, isLoading, onSelect, onEdit, onDelete }) {
  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );

  if (!contratos.length) return (
    <Card className="text-center p-12">
      <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Nenhum contrato cadastrado</p>
      <p className="text-muted-foreground/60 text-sm mt-1">Clique em &quot;Novo Contrato&quot; para começar.</p>
    </Card>
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {contratos.map(c => (
        <Card key={c.id} className="bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(c)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {c.numero && <span className="text-xs font-mono text-muted-foreground">{c.numero}</span>}
                  <StatusBadge status={c.status} />
                  {c.tipo && <Badge variant="outline" className="text-xs">{c.tipo}</Badge>}
                </div>
                <p className="font-semibold text-sm text-foreground">{c.objeto}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{c.fornecedor} {c.cnpj && <span className="text-xs text-muted-foreground/70">· {c.cnpj}</span>}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-base text-ocre">{fmt(c.valor_total)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{(formatDate(c.data_inicio) || "—")} → {(formatDate(c.data_fim) || "—")}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Gestor: {c.gestor || "—"}</span>
              <RowActions
                onView={() => onSelect(c)}
                onEdit={() => onEdit(c)}
                onDelete={() => onDelete(c.id)}
                deleteDescription="O contrato será excluído permanentemente."
                size="md"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
