import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, ClipboardList, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_COLORS = {
  Elaboração: "bg-gray-100 text-gray-600",
  "Em Revisão": "bg-yellow-100 text-yellow-700",
  "Em Aprovação": "bg-blue-100 text-blue-700",
  Aprovada: "bg-green-100 text-green-700",
  Paga: "bg-emerald-100 text-emerald-700",
  Rejeitada: "bg-red-100 text-red-700",
};

const STATUS_LIST = ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"];

export default function MedicoesList({ medicoes, contratos, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;

  const getContrato = (id) => contratos.find(c => c.id === id);

  if (!medicoes.length) return (
    <Card className="text-center p-12">
      <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 font-medium">Nenhuma medição registrada</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {medicoes.map(m => {
        const contrato = getContrato(m.contrato_id);
        return (
          <Card key={m.id} className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold" style={{ color: "#26405d" }}>Medição {m.numero}</span>
                    <Badge className={STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"}>{m.status}</Badge>
                  </div>
                  {contrato && <p className="text-xs text-gray-500">{contrato.fornecedor} · {contrato.objeto?.substring(0, 50)}...</p>}
                  <p className="text-xs text-gray-400 mt-1">Período: {m.periodo_inicio || "—"} → {m.periodo_fim || "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold" style={{ color: "#c35e1e" }}>{fmt(m.valor_liquido || m.valor_bruto)}</p>
                  {m.valor_retencao > 0 && <p className="text-xs text-gray-400">Retenção: {fmt(m.valor_retencao)}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
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
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}