import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, ArrowRight, TrendingUp, Calendar, User } from "lucide-react";

const STAGES = [
  { key: "Identificada", label: "Identificada", color: "#64748b", bg: "#f8fafc" },
  { key: "Em Análise", label: "Em Análise", color: "#3b82f6", bg: "#eff6ff" },
  { key: "Em Negociação", label: "Em Negociação", color: "#f59e0b", bg: "#fffbeb" },
  { key: "Aprovada", label: "Aprovada", color: "#22c55e", bg: "#f0fdf4" },
  { key: "Rejeitada", label: "Rejeitada", color: "#ef4444", bg: "#fef2f2" },
];

const NEXT_STATUS = {
  "Identificada": "Em Análise",
  "Em Análise": "Em Negociação",
  "Em Negociação": "Aprovada",
};

const categoriaColors = {
  Escopo: "bg-blue-100 text-blue-800",
  Prazo: "bg-orange-100 text-orange-800",
  Custo: "bg-red-100 text-red-800",
};

const origemColors = {
  Contratada: "bg-blue-50 text-blue-700 border-blue-200",
  Contratante: "bg-amber-50 text-amber-700 border-amber-200",
};

function MudancaCard({ mudanca, onEdit, onDelete, onUpdateStatus }) {
  const nextStatus = NEXT_STATUS[mudanca.status];
  const formatCusto = (val) => {
    if (!val && val !== 0) return null;
    const abs = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    return val >= 0 ? `+${abs}` : `-${abs.replace("-", "")}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 leading-tight flex-1">{mudanca.titulo}</p>
        <Badge variant="outline" className={`text-xs shrink-0 ${origemColors[mudanca.origem]}`}>
          {mudanca.origem}
        </Badge>
      </div>

      {mudanca.categorias?.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {mudanca.categorias.map(cat => (
            <Badge key={cat} variant="outline" className={`text-xs ${categoriaColors[cat]}`}>{cat}</Badge>
          ))}
        </div>
      )}

      <div className="space-y-1 text-xs text-gray-500">
        {mudanca.impacto_custo != null && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className={mudanca.impacto_custo >= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
              {formatCusto(mudanca.impacto_custo)}
            </span>
            {mudanca.impacto_prazo_dias != null && (
              <span className="ml-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {mudanca.impacto_prazo_dias > 0 ? `+${mudanca.impacto_prazo_dias}d` : `${mudanca.impacto_prazo_dias}d`}
              </span>
            )}
          </div>
        )}
        {mudanca.responsavel && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{mudanca.responsavel}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
        {nextStatus && (
          <Button size="sm" variant="outline" className="flex-1 text-xs h-7"
            onClick={() => onUpdateStatus(mudanca.id, nextStatus)}>
            <ArrowRight className="w-3 h-3 mr-1" />
            {nextStatus}
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-gray-500" onClick={() => onEdit(mudanca)}>
          <Edit className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => onDelete(mudanca.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function MudancaKanban({ mudancas, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map(s => (
          <div key={s.key} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const totalCusto = mudancas.filter(m => m.status === "Aprovada").reduce((acc, m) => acc + (m.impacto_custo || 0), 0);
  const totalDias = mudancas.filter(m => m.status === "Aprovada").reduce((acc, m) => acc + (m.impacto_prazo_dias || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-green-700 font-medium">Impacto Custo Aprovado</p>
            <p className={`text-xl font-bold mt-1 ${totalCusto >= 0 ? "text-red-600" : "text-green-600"}`}>
              {totalCusto >= 0 ? "+" : ""}{totalCusto.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-orange-700 font-medium">Impacto Prazo Aprovado</p>
            <p className={`text-xl font-bold mt-1 ${totalDias >= 0 ? "text-red-600" : "text-green-600"}`}>
              {totalDias >= 0 ? "+" : ""}{totalDias} dias
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-blue-700 font-medium">Total de Mudanças</p>
            <p className="text-xl font-bold mt-1 text-blue-800">{mudancas.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const stageMudancas = mudancas.filter(m => m.status === stage.key);
          return (
            <div key={stage.key} className="flex-shrink-0 w-64">
              <div className="rounded-t-lg px-3 py-2 mb-2 flex items-center justify-between"
                style={{ backgroundColor: stage.bg, borderBottom: `3px solid ${stage.color}` }}>
                <span className="text-sm font-bold" style={{ color: stage.color }}>{stage.label}</span>
                <span className="text-xs font-bold rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: stage.color }}>
                  {stageMudancas.length}
                </span>
              </div>
              <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "60vh" }}>
                {stageMudancas.map(m => (
                  <MudancaCard key={m.id} mudanca={m} onEdit={onEdit} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
                ))}
                {stageMudancas.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
                    Nenhuma
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}