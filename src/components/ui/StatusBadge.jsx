import { cn } from "@/lib/utils";

const STATUS_MAP = {
  // info (azul) — estado inicial / aberto
  "Aberto":            "info",
  "Ativo":             "info",
  "Novo":              "info",
  "Registrado":        "info",
  "Identificada":      "info",
  // attention (ocre) — em andamento / análise / negociação
  "Em Análise":        "attention",
  "Em Andamento":      "attention",
  "Em andamento":      "attention",
  "Em Revisão":        "attention",
  "Revisão":           "attention",
  "Planejado":         "attention",
  "Elaboração":        "attention",
  "Em Aprovação":      "attention",
  "Em Negociação":     "attention",
  "Pendente":          "attention",
  // positive (verde) — concluído / resolvido / aprovado
  "Resolvido":         "positive",
  "Concluído":         "positive",
  "Concluída":         "positive",
  "Concluido":         "positive",
  "Aprovado":          "positive",
  "Aprovada":          "positive",
  "Pago":              "positive",
  "Paga":              "positive",
  "Executado":         "positive",
  "Assinado":          "positive",
  "Mitigado":          "positive",
  // critical (magenta) — cancelado / bloqueado / atrasado
  "Cancelado":         "critical",
  "Cancelada":         "critical",
  "Crítico":           "critical",
  "Bloqueado":         "critical",
  "Atrasado":          "critical",
  "Atrasada":          "critical",
  "Rejeitado":         "critical",
  "Rejeitada":         "critical",
  "Paralisado":        "critical",
  // neutral (titanium) — fechado / encerrado / inativo / draft
  "Fechado":           "neutral",
  "Encerrado":         "neutral",
  "Arquivado":         "neutral",
  "Inativo":           "neutral",
  "A iniciar":         "neutral",
};

const STYLE_MAP = {
  info:       "bg-status-info/15 text-status-info border-status-info/30",
  positive:   "bg-status-positive/15 text-status-positive border-status-positive/30",
  attention:  "bg-status-attention/15 text-status-attention border-status-attention/30",
  critical:   "bg-status-critical/15 text-status-critical border-status-critical/30",
  neutral:    "bg-status-neutral/15 text-status-neutral border-status-neutral/30",
};

/**
 * Badge de status tokenizado com padrão neon-pill.
 *
 * @param {{ status: string, className?: string }} props
 *   - status: label do status (ex: "Aberto", "Concluído")
 *   - tone: forçar tom manualmente ("info"|"positive"|"attention"|"critical"|"neutral")
 */
export function StatusBadge({ status, tone, className, ...props }) {
  const resolvedTone = tone ?? STATUS_MAP[status] ?? "neutral";
  const styles = STYLE_MAP[resolvedTone] ?? STYLE_MAP.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles,
        className,
      )}
      {...props}
    >
      {status}
    </span>
  );
}
