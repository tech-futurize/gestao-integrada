import React from "react";
import { FileText, ChevronRight, AlertCircle, Clock, Layers } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Badge helpers ─────────────────────────────────────────────────────────
   Cores semânticas FuturizeNow conforme o manual de identidade visual.
   Background semi-transparente + borda 1px + glow neon (status activo/crítico).
   box-shadow mantido como inline style — único valor não expresso pelo Tailwind v3.
*/
function statusBadge(status) {
  const map = {
    Aberto:          { cls: "bg-cyan-electric/10 border border-cyan-electric text-cyan-electric", glow: "0 0 8px rgba(38,255,255,0.45)" },
    "Em Análise":    { cls: "bg-ocre/10 border border-ocre text-ocre",                            glow: "0 0 8px rgba(169,135,67,0.45)" },
    "Em Andamento":  { cls: "bg-ocre/10 border border-ocre text-ocre",                            glow: "0 0 8px rgba(169,135,67,0.45)" },
    Resolvido:       { cls: "bg-cyan-electric/[0.07] border border-cyan-electric/40 text-cyan-electric" },
    Fechado:         { cls: "bg-titanium/10 border border-titanium/40 text-titanium" },
    Cancelado:       { cls: "bg-magenta/10 border border-magenta text-magenta",                   glow: "0 0 8px rgba(219,73,116,0.45)" },
  };
  return map[status] || map.Fechado;
}

function prioridadeBadge(prioridade) {
  const map = {
    Baixa:   { cls: "bg-cyan-electric/[0.07] border border-cyan-electric/40 text-cyan-electric" },
    Média:   { cls: "bg-ocre/10 border border-ocre text-ocre" },
    Alta:    { cls: "bg-ocre/[0.16] border border-ocre text-ocre",                               glow: "0 0 6px rgba(169,135,67,0.35)" },
    Crítica: { cls: "bg-magenta/[0.14] border border-magenta text-magenta",                      glow: "0 0 8px rgba(219,73,116,0.5)" },
  };
  return map[prioridade] || map.Média;
}

const badgeBase = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

/* ── KPI Card ──────────────────────────────────────────────────────────── */
function KpiCard({ label, value, color, glow, icon: Icon, sub }) {
  return (
    <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon size={15} className={color} />
      </div>
      <span
        className={`text-3xl font-bold leading-none ${color}`}
        style={glow ? { textShadow: `0 0 14px ${glow}` } : undefined}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-24 bg-card border border-border rounded-xl animate-pulse opacity-60" />
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 border-b border-border last:border-0 mx-4 animate-pulse opacity-30" />
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function PleitosList({ casos, isLoading, onSelect }) {
  if (isLoading) return <LoadingSkeleton />;

  const total = casos.length;
  const abertos = casos.filter(c => c.status === "Aberto").length;
  const emAndamento = casos.filter(c => ["Em Análise", "Em Andamento"].includes(c.status)).length;
  const criticos = casos.filter(c => c.prioridade === "Crítica").length;

  if (total === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-electric/[0.08] border border-cyan-electric/20 flex items-center justify-center mx-auto mb-5">
          <FileText size={28} className="text-cyan-electric opacity-70" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Nenhum Pleito Registrado</h3>
        <p className="text-sm text-muted-foreground">Crie pleitos para gerenciar questões contratuais</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* KPI row */}
      <div className="flex gap-3.5">
        <KpiCard
          label="Total de Pleitos"
          value={total}
          color="text-foreground"
          icon={Layers}
        />
        <KpiCard
          label="Abertos"
          value={abertos}
          color="text-cyan-electric"
          glow="rgba(38,255,255,0.6)"
          icon={FileText}
          sub={total > 0 ? `${Math.round((abertos / total) * 100)}% do total` : null}
        />
        <KpiCard
          label="Em Andamento"
          value={emAndamento}
          color="text-ocre"
          glow="rgba(169,135,67,0.6)"
          icon={Clock}
          sub={total > 0 ? `${Math.round((emAndamento / total) * 100)}% do total` : null}
        />
        <KpiCard
          label="Prioridade Crítica"
          value={criticos}
          color={criticos > 0 ? "text-magenta" : "text-muted-foreground"}
          glow={criticos > 0 ? "rgba(219,73,116,0.6)" : undefined}
          icon={AlertCircle}
          sub={criticos > 0 ? "Requer atenção imediata" : "Nenhum pleito crítico"}
        />
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Cabeçalho da tabela */}
        <div className="grid gap-0 border-b border-border bg-background px-5 py-2.5"
             style={{ gridTemplateColumns: "3fr 1.5fr 1fr 1fr 1.5fr 1fr 40px" }}>
          {["Título", "Categoria", "Prioridade", "Status", "Responsável", "Abertura", ""].map((h, i) => (
            <span key={i} className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {h}
            </span>
          ))}
        </div>

        {/* Linhas */}
        {casos.map((caso, idx) => (
          <div
            key={caso.id}
            onClick={() => onSelect(caso)}
            className={`grid items-center px-5 py-3.5 cursor-pointer transition-colors hover:bg-muted/50 ${
              idx < casos.length - 1 ? "border-b border-border" : ""
            }`}
            style={{ gridTemplateColumns: "3fr 1.5fr 1fr 1fr 1.5fr 1fr 40px" }}
          >
            {/* Título */}
            <div className="min-w-0 pr-3">
              <p className="text-sm font-semibold text-foreground truncate">{caso.titulo}</p>
              {caso.descricao_problema && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{caso.descricao_problema}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="flex flex-wrap gap-1">
              {(caso.categorias || []).slice(0, 2).map(cat => (
                <span key={cat} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
                  {cat}
                </span>
              ))}
            </div>

            {/* Prioridade */}
            <div>
              {(() => {
                const b = prioridadeBadge(caso.prioridade);
                return (
                  <span className={`${badgeBase} ${b.cls}`} style={b.glow ? { boxShadow: b.glow } : undefined}>
                    {caso.prioridade}
                  </span>
                );
              })()}
            </div>

            {/* Status */}
            <div>
              {(() => {
                const b = statusBadge(caso.status);
                return (
                  <span className={`${badgeBase} ${b.cls}`} style={b.glow ? { boxShadow: b.glow } : undefined}>
                    {caso.status}
                  </span>
                );
              })()}
            </div>

            {/* Responsável */}
            <div className="text-xs text-muted-foreground truncate">{caso.responsavel || "—"}</div>

            {/* Data */}
            <div className="text-xs text-muted-foreground">
              {caso.data_abertura
                ? format(new Date(caso.data_abertura), "dd/MM/yyyy", { locale: ptBR })
                : "—"}
            </div>

            {/* Chevron */}
            <div className="flex justify-end">
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
