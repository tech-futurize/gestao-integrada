import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileText, ChevronRight, AlertCircle, Clock, Layers } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/dateUtils";

const PRIORITY_TONE = { Baixa: "info", Média: "attention", Alta: "attention", Crítica: "critical" };

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
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: casos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  if (isLoading) return <LoadingSkeleton />;

  const total = casos.length;
  const abertos = casos.filter(c => c.status === "Aberto").length;
  const emAndamento = casos.filter(c => ["Em Análise", "Em Andamento"].includes(c.status)).length;
  const criticos = casos.filter(c => c.prioridade === "Crítica").length;

  if (total === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
          <FileText size={28} className="text-primary opacity-70" />
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
          color="text-status-info"
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

        {/* Linhas virtualizadas */}
        <div
          ref={parentRef}
          className="overflow-y-auto max-h-[min(600px,60vh)]"
        >
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map(vr => {
              const pleito = casos[vr.index];
              return (
                <div
                  key={vr.key}
                  onClick={() => onSelect(pleito)}
                  className={`grid items-center px-5 py-3.5 cursor-pointer transition-colors hover:bg-muted/50 ${
                    vr.index < casos.length - 1 ? "border-b border-border" : ""
                  }`}
                  style={{
                    gridTemplateColumns: "3fr 1.5fr 1fr 1fr 1.5fr 1fr 40px",
                    position: "absolute",
                    top: vr.start,
                    left: 0,
                    right: 0,
                  }}
                >
                  {/* Título */}
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-foreground truncate">{pleito.titulo}</p>
                    {pleito.descricao_problema && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{pleito.descricao_problema}</p>
                    )}
                  </div>

                  {/* Categoria */}
                  <div className="flex flex-wrap gap-1">
                    {(pleito.categorias || []).slice(0, 2).map(cat => (
                      <span key={cat} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Prioridade */}
                  <div>
                    <StatusBadge status={pleito.prioridade} tone={PRIORITY_TONE[pleito.prioridade] ?? "attention"} />
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={pleito.status} />
                  </div>

                  {/* Responsável */}
                  <div className="text-xs text-muted-foreground truncate">{pleito.responsavel || "—"}</div>

                  {/* Data */}
                  <div className="text-xs text-muted-foreground">
                    {formatDate(pleito.data_abertura) || "—"}
                  </div>

                  {/* Chevron */}
                  <div className="flex justify-end">
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
