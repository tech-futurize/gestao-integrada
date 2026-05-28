import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, Building } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const STATUS_COLORS = {
  "A iniciar":    "bg-muted text-muted-foreground",
  "Em andamento": "bg-status-positive/15 text-status-positive",
  "Concluído":    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Paralisado":   "bg-status-critical/15 text-status-critical",
};

const MEDICAO_STATUS_COLORS = {
  Elaboração: "bg-muted text-muted-foreground",
  "Em Revisão": "bg-status-attention/15 text-status-attention",
  "Em Aprovação": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Aprovada: "bg-status-positive/15 text-status-positive",
  Paga: "bg-status-positive/20 text-status-positive",
  Rejeitada: "bg-status-critical/15 text-status-critical",
};

export default function ContratoDetalhes({ contrato, medicoes, onBack, onEdit, onDelete, onNovaMedicao }) {
  const totalMedido = medicoes.filter(m => ["Aprovada", "Paga"].includes(m.status)).reduce((s, m) => s + (m.valor_liquido || 0), 0);
  const saldo = (contrato.valor_total || 0) - totalMedido;
  const percentMedido = contrato.valor_total ? (totalMedido / contrato.valor_total) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h2 className="text-lg font-bold flex-1 text-foreground">Detalhes do Contrato</h2>
        <Button size="sm" variant="outline" onClick={() => onEdit(contrato)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
        <Button size="sm" variant="outline" className="text-status-critical border-status-critical/30" onClick={() => onDelete(contrato.id)}><Trash2 className="w-4 h-4" /></Button>
      </div>

      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {contrato.numero && <span className="text-xs font-mono text-muted-foreground">{contrato.numero}</span>}
                <Badge className={STATUS_COLORS[contrato.status]}>{contrato.status}</Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground">{contrato.objeto}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-ocre">{fmt(contrato.valor_total)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fornecedor</p>
                <p className="text-sm font-semibold text-foreground">{contrato.fornecedor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Gestor</p>
                <p className="text-sm font-semibold text-foreground">{contrato.gestor || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vigência</p>
                <p className="text-sm font-semibold text-foreground">{fmtDate(contrato.data_inicio)} → {fmtDate(contrato.data_fim)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-sm font-semibold ${saldo >= 0 ? "text-status-positive" : "text-status-critical"}`}>{fmt(saldo)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Medido</span>
              <span className="text-xs font-semibold text-foreground">{percentMedido.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full transition-all bg-ocre" style={{ width: `${Math.min(percentMedido, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Pago/Aprovado: {fmt(totalMedido)}</span>
              <span className="text-xs text-muted-foreground">Total: {fmt(contrato.valor_total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground">Medições</CardTitle>
            <Button size="sm" onClick={onNovaMedicao}>+ Nova Medição</Button>
          </div>
        </CardHeader>
        <CardContent>
          {medicoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma medição registrada.</p>
          ) : (
            <div className="divide-y divide-border">
              {medicoes.map(m => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">Medição {m.numero}</span>
                    <span className="text-xs text-muted-foreground ml-2">{m.periodo_inicio} → {m.periodo_fim}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-foreground">{fmt(m.valor_liquido || m.valor_bruto)}</span>
                    <Badge className={MEDICAO_STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"}>{m.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
