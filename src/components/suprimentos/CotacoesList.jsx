import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, BarChart2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS = {
  Aberta: "bg-blue-100 text-blue-700",
  "Em Análise": "bg-yellow-100 text-yellow-700",
  Aprovada: "bg-green-100 text-green-700",
  Cancelada: "bg-red-100 text-red-700",
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default function CotacoesList({ cotacoes, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;
  if (!cotacoes.length) return (
    <Card className="text-center p-12">
      <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 font-medium">Nenhuma cotação registrada</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {cotacoes.map(c => {
        const menorProposta = c.propostas?.length ? Math.min(...c.propostas.map(p => p.valor_total || 0)) : null;
        return (
          <Card key={c.id} className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {c.numero && <span className="text-xs font-mono text-gray-400">{c.numero}</span>}
                    <Badge className={STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600"}>{c.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#26405d" }}>{c.titulo}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{c.propostas?.length || 0} proposta(s)</span>
                    {c.data_limite && <span className="text-xs text-gray-400">Limite: {fmtDate(c.data_limite)}</span>}
                    {c.fornecedor_selecionado && <span className="text-xs font-medium" style={{ color: "#00a49a" }}>✓ {c.fornecedor_selecionado}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {menorProposta !== null && (
                    <>
                      <p className="text-xs text-gray-400">Menor proposta</p>
                      <p className="font-bold" style={{ color: "#c35e1e" }}>{fmt(menorProposta)}</p>
                    </>
                  )}
                  {c.valor_aprovado && (
                    <>
                      <p className="text-xs text-gray-400 mt-1">Aprovado</p>
                      <p className="font-bold text-green-600">{fmt(c.valor_aprovado)}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="w-44">
                  <Select value={c.status} onValueChange={v => onUpdateStatus(c.id, v)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Aberta", "Em Análise", "Aprovada", "Cancelada"].map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(c)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}