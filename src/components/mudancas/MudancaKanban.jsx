import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, ArrowRight, DollarSign, Clock, User, GitBranch } from "lucide-react";

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
  Escopo: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  Prazo: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
  Custo: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
};

const origemColors = {
  Contratada: "bg-blue-50 text-blue-700 border-blue-200",
  Contratante: "bg-amber-50 text-amber-700 border-amber-200",
};

function MudancaCard({ mudanca, onEdit, onDelete, onUpdateStatus }) {
  const nextStatus = NEXT_STATUS[mudanca.status];
  const stageConfig = STAGES.find(s => s.key === mudanca.status);

  const formatCusto = (val) => {
    if (!val && val !== 0) return null;
    const abs = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    return val >= 0 ? `+${abs}` : `-${abs.replace("-", "")}`;
  };

  return (
    <div
      className="bg-card rounded-xl shadow-sm p-3.5 space-y-2.5 hover:shadow-md transition-all duration-150 group border border-border"
      style={{ borderLeftWidth: 3, borderLeftColor: stageConfig?.color || '#e5e7eb' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-snug flex-1">{mudanca.titulo}</p>
        {mudanca.origem && (
          <Badge variant="outline" className={`text-xs shrink-0 ${origemColors[mudanca.origem] || ''}`}>
            {mudanca.origem}
          </Badge>
        )}
      </div>

      {mudanca.categorias?.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {mudanca.categorias.map(cat => (
            <span key={cat} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoriaColors[cat] || 'bg-muted text-muted-foreground'}`}>
              {cat}
            </span>
          ))}
        </div>
      )}

      {(mudanca.impacto_custo != null || mudanca.impacto_prazo_dias != null) && (
        <div className="flex items-center gap-3 py-1.5 px-2.5 bg-muted rounded-lg">
          {mudanca.impacto_custo != null && (
            <div className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className={`font-semibold ${mudanca.impacto_custo >= 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCusto(mudanca.impacto_custo)}
              </span>
            </div>
          )}
          {mudanca.impacto_prazo_dias != null && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className={`font-semibold ${mudanca.impacto_prazo_dias > 0 ? "text-red-600" : mudanca.impacto_prazo_dias < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                {mudanca.impacto_prazo_dias > 0 ? `+${mudanca.impacto_prazo_dias}d` : `${mudanca.impacto_prazo_dias}d`}
              </span>
            </div>
          )}
        </div>
      )}

      {mudanca.responsavel && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span>{mudanca.responsavel}</span>
        </div>
      )}

      <div className="flex items-center gap-1 pt-1 border-t border-border">
        {nextStatus && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-7 font-medium"
            onClick={() => onUpdateStatus(mudanca.id, nextStatus)}
          >
            <ArrowRight className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">{nextStatus}</span>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(mudanca)}
        >
          <Edit className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(mudanca.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function MudancaKanban({ mudancas, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map(s => (
          <div key={s.key} className="flex-shrink-0 w-60 space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const totalCusto = mudancas.filter(m => m.status === "Aprovada").reduce((acc, m) => acc + (m.impacto_custo || 0), 0);
  const totalDias = mudancas.filter(m => m.status === "Aprovada").reduce((acc, m) => acc + (m.impacto_prazo_dias || 0), 0);

  return (
    <div className="space-y-5">
      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: DollarSign,
            label: "Custo Aprovado",
            value: `${totalCusto >= 0 ? "+" : ""}${totalCusto.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}`,
            valueColor: totalCusto >= 0 ? "text-red-600" : "text-green-600",
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
          },
          {
            icon: Clock,
            label: "Prazo Aprovado",
            value: `${totalDias >= 0 ? "+" : ""}${totalDias} dias`,
            valueColor: totalDias >= 0 ? "text-red-600" : "text-green-600",
            iconBg: "bg-orange-50",
            iconColor: "text-orange-500",
          },
          {
            icon: GitBranch,
            label: "Total de Mudanças",
            value: mudancas.length,
            valueColor: "text-brand-primary",
            iconBg: "bg-blue-50",
            iconColor: "text-blue-500",
          },
        ].map(({ icon: Icon, label, value, valueColor, iconBg, iconColor }) => (
          <div key={label} className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className={`text-lg font-bold mt-0.5 ${valueColor}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-3">
        {STAGES.map((stage) => {
          const stageMudancas = mudancas.filter(m => m.status === stage.key);
          return (
            <div
              key={stage.key}
              className="flex-shrink-0 w-60 flex flex-col rounded-xl overflow-hidden bg-muted"
            >
              <div
                className="px-3 py-2.5 flex items-center justify-between"
                style={{ borderBottom: `2px solid ${stage.color}` }}
              >
                <span className="text-sm font-bold" style={{ color: stage.color }}>{stage.label}</span>
                <span
                  className="text-xs font-bold rounded-full px-2 py-0.5 text-white"
                  style={{ backgroundColor: stage.color }}
                >
                  {stageMudancas.length}
                </span>
              </div>
              <div
                className="p-2 space-y-2 overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 440px)", minHeight: 120 }}
              >
                {stageMudancas.map(m => (
                  <MudancaCard key={m.id} mudanca={m} onEdit={onEdit} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
                ))}
                {stageMudancas.length === 0 && (
                  <div
                    className="flex items-center justify-center h-20 border-2 border-dashed rounded-xl text-xs text-muted-foreground"
                    style={{ borderColor: `${stage.color}50` }}
                  >
                    Nenhuma mudança
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
