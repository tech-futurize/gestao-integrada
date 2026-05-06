import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS = {
  Rascunho: "bg-gray-100 text-gray-600",
  Aprovada: "bg-green-100 text-green-700",
  "Em Cotação": "bg-blue-100 text-blue-700",
  "Pedido Emitido": "bg-purple-100 text-purple-700",
  Recebido: "bg-emerald-100 text-emerald-700",
  Cancelada: "bg-red-100 text-red-700",
};

const STATUS_LIST = ["Rascunho", "Aprovada", "Em Cotação", "Pedido Emitido", "Recebido", "Cancelada"];

const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default function RequisicoesList({ requisicoes, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;
  if (!requisicoes.length) return (
    <Card className="text-center p-12">
      <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 font-medium">Nenhuma requisição cadastrada</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {requisicoes.map(r => (
        <Card key={r.id} className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {r.numero && <span className="text-xs font-mono text-gray-400">{r.numero}</span>}
                  <Badge className={STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}>{r.status}</Badge>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#26405d" }}>
                  {r.itens?.length ? `${r.itens.length} item(ns)` : "Sem itens"} · {r.solicitante}
                </p>
                {r.itens?.slice(0, 2).map((item, i) => (
                  <p key={i} className="text-xs text-gray-500">{item.quantidade} {item.unidade} · {item.descricao}</p>
                ))}
                {r.justificativa && <p className="text-xs text-gray-400 mt-1 italic">"{r.justificativa}"</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">Necessidade</p>
                <p className="text-sm font-semibold" style={{ color: "#26405d" }}>{fmtDate(r.data_necessidade)}</p>
                {r.centro_custo && <p className="text-xs text-gray-400 mt-1">{r.centro_custo}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="w-44">
                <Select value={r.status} onValueChange={v => onUpdateStatus(r.id, v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_LIST.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(r)}><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(r.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}