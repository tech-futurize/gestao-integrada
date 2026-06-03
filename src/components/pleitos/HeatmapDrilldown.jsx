import { useState } from "react";
import { formatDateTime, formatDate } from "@/lib/dateUtils";
import { X, ArrowLeft, FileText, Calendar, User, AlertTriangle, Tag, DollarSign, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";

// Badge de fonte — substitui tipoColors anterior
const FONTE_BADGE = {
  "Registro": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "RDO":      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Mudança":  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function fmtCurrency(val) {
  if (val == null || val === 0) return null;
  const formatted = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return val > 0 ? `+${formatted}` : `-${formatted}`;
}

function DetalheRegistro({ r }) {
  return (
    <div className="space-y-3">
      {r.descricao && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Descrição</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{r.descricao}</p>
        </div>
      )}
      {r.impacto_preliminar && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Impacto Preliminar</p>
          <p className="text-sm text-foreground">{r.impacto_preliminar}</p>
        </div>
      )}
    </div>
  );
}

function DetalheRdo({ r }) {
  return (
    <div className="space-y-3">
      <div className="bg-muted rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">RDO Nº / Área</p>
        <p className="text-sm font-semibold text-foreground">
          {r._numero_rdo || "—"}{r._area ? ` · ${r._area}` : ""}
        </p>
      </div>
      {r.descricao && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Ocorrência</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{r.descricao}</p>
        </div>
      )}
    </div>
  );
}

function DetalheMudanca({ r }) {
  const custo = fmtCurrency(r._impacto_custo);
  return (
    <div className="space-y-3">
      {r._titulo && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Título da Mudança</p>
          <p className="text-sm font-semibold text-foreground">{r._titulo}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {custo && (
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Impacto Custo</p>
              <p className="text-sm font-medium text-foreground">{custo}</p>
            </div>
          </div>
        )}
        {r._impacto_prazo_dias != null && r._impacto_prazo_dias !== 0 && (
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Impacto Prazo</p>
              <p className="text-sm font-medium text-foreground">
                {r._impacto_prazo_dias > 0 ? "+" : ""}{r._impacto_prazo_dias} dias
              </p>
            </div>
          </div>
        )}
      </div>
      {r._impacto_escopo && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Impacto no Escopo</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{r._impacto_escopo}</p>
        </div>
      )}
    </div>
  );
}

function RegistroDetalhe({ registro, onBack }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à lista
      </button>

      {/* Badges de cabeçalho */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={FONTE_BADGE[registro.fonte] || "bg-muted text-muted-foreground"}>
          {registro.fonte}
        </Badge>
        {registro.fonte === "Registro" && registro.tipo_registro && (
          <span className="text-xs text-muted-foreground">{registro.tipo_registro}</span>
        )}
        {registro.status && <StatusBadge status={registro.status} />}
        {registro.responsabilidade && (
          <Badge
            variant="outline"
            className={
              registro.responsabilidade === "Contratada"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-status-attention/15 text-status-attention"
            }
          >
            {registro.responsabilidade}
          </Badge>
        )}
      </div>

      {/* Data e responsável */}
      <div className="grid grid-cols-2 gap-3">
        {registro.data_hora && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="text-sm font-medium text-foreground">
                {registro.fonte === "RDO"
                  ? formatDate(registro.data_hora)
                  : formatDateTime(registro.data_hora)}
              </p>
            </div>
          </div>
        )}
        {registro.responsavel_registro && (
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="text-sm font-medium text-foreground">{registro.responsavel_registro}</p>
            </div>
          </div>
        )}
        {registro.gravidade && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Gravidade</p>
              <p className="text-sm font-medium text-foreground">{registro.gravidade}</p>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo específico por fonte */}
      {registro.fonte === "RDO" && <DetalheRdo r={registro} />}
      {registro.fonte === "Mudança" && <DetalheMudanca r={registro} />}
      {registro.fonte === "Registro" && <DetalheRegistro r={registro} />}

      {/* Categorias de impacto */}
      {registro.impacto_ocorrencia?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Categorias de Impacto
          </p>
          <div className="flex flex-wrap gap-1">
            {registro.impacto_ocorrencia.map((cat) => (
              <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium bg-ocre/15 text-ocre">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeatmapDrilldown({ open, onClose, category, weekLabel, registros }) {
  const [selected, setSelected] = useState(null);

  if (!open) return null;

  const realRegistros = registros.filter((r) => r.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => { setSelected(null); onClose(); }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-card shadow-2xl flex flex-col"
        style={{ borderLeft: "3px solid var(--color-ocre, #c35e1e)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-foreground">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
              {weekLabel}
            </p>
            <h3 className="text-base font-bold text-white mt-0.5">{category}</h3>
            {!selected && (
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                {realRegistros.length === 0
                  ? "Nenhum registro nesta célula"
                  : `${realRegistros.length} registro(s) encontrado(s)`}
              </p>
            )}
          </div>
          <button
            onClick={() => { setSelected(null); onClose(); }}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {selected ? (
            <RegistroDetalhe registro={selected} onBack={() => setSelected(null)} />
          ) : realRegistros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum registro para</p>
              <p className="text-foreground font-semibold mt-1">{category} · {weekLabel}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {realRegistros.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-ocre/40 hover:bg-ocre/5 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${FONTE_BADGE[r.fonte] || "bg-muted text-muted-foreground"}`}
                        >
                          {r.fonte}
                        </Badge>
                        {r.fonte === "Registro" && r.tipo_registro && (
                          <span className="text-xs text-muted-foreground">{r.tipo_registro}</span>
                        )}
                        {r.status && <StatusBadge status={r.status} />}
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {r.fonte === "RDO"
                          ? `RDO Nº ${r._numero_rdo || "—"}${r._area ? ` · ${r._area}` : ""}`
                          : r.descricao}
                      </p>
                      {r.data_hora && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.fonte === "RDO" ? formatDate(r.data_hora) : formatDateTime(r.data_hora)}
                        </p>
                      )}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-ocre rotate-180 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
