import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, addDaysToDate } from "@/lib/dateUtils";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function ContratosList({ contratos, aditivos = [], isLoading, onSelect, onEdit, onDelete }) {
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
      {contratos.map(c => {
  const aditivosDoContrato = aditivos.filter(
    (a) => a.contrato_id === c.id && a.status === "Assinado"
  );
  const valorAjustado = (c.valor_total || 0) + aditivosDoContrato.reduce((s, a) => s + (a.valor || 0), 0);
  const prazoDias = aditivosDoContrato.reduce((s, a) => s + (a.prazo_dias || 0), 0);
  const terminoAjustado = prazoDias > 0 ? addDaysToDate(c.data_fim, prazoDias) : c.data_fim;
  const qtdAditivosAssinados = aditivosDoContrato.length;

  return (
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
            <p className="font-bold text-base text-status-positive">{fmt(valorAjustado)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(formatDate(c.data_inicio) || "—")} → {(formatDate(terminoAjustado) || "—")}</p>
            {qtdAditivosAssinados > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{qtdAditivosAssinados}</span>
                {" "}aditivo{qtdAditivosAssinados !== 1 ? "s" : ""} assinado{qtdAditivosAssinados !== 1 ? "s" : ""}
              </p>
            )}
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
  );
})}
    </div>
  );
}
