import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Eye, FileText } from "lucide-react";
import ConfirmDeleteButton from "@/components/ui/ConfirmDeleteButton";

const STATUS_COLORS = {
  Ativo: "bg-status-positive/15 text-status-positive",
  "Em Revisão": "bg-status-attention/15 text-status-attention",
  Suspenso: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Encerrado: "bg-muted text-muted-foreground",
  Cancelado: "bg-status-critical/15 text-status-critical",
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

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
                  <Badge className={STATUS_COLORS[c.status] || "bg-muted text-muted-foreground"}>{c.status}</Badge>
                  {c.tipo && <Badge variant="outline" className="text-xs">{c.tipo}</Badge>}
                </div>
                <p className="font-semibold text-sm text-foreground">{c.objeto}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{c.fornecedor} {c.cnpj && <span className="text-xs text-muted-foreground/70">· {c.cnpj}</span>}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-base text-ocre">{fmt(c.valor_total)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(c.data_inicio)} → {fmtDate(c.data_fim)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Gestor: {c.gestor || "—"}</span>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" title="Visualizar" onClick={() => onSelect(c)}><Eye className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" title="Editar" onClick={() => onEdit(c)}><Edit className="w-4 h-4" /></Button>
                <ConfirmDeleteButton size="sm" onConfirm={() => onDelete(c.id)} description="O contrato será excluído permanentemente." />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
