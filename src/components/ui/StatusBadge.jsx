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
  "Implementada":      "positive",
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

// solid: fundo + texto + borda (padrão original)
const SOLID_MAP = {
  info:       "bg-status-info/15 text-status-info border-status-info/30",
  positive:   "bg-status-positive/15 text-status-positive border-status-positive/30",
  attention:  "bg-status-attention/15 text-status-attention border-status-attention/30",
  critical:   "bg-status-critical/15 text-status-critical border-status-critical/30",
  neutral:    "bg-status-neutral/15 text-status-neutral border-status-neutral/30",
};

// outline: sem fundo, apenas texto + borda
const OUTLINE_MAP = {
  info:       "text-status-info border-status-info/40",
  positive:   "text-status-positive border-status-positive/40",
  attention:  "text-status-attention border-status-attention/40",
  critical:   "text-status-critical border-status-critical/40",
  neutral:    "text-status-neutral border-status-neutral/40",
};

// text: apenas cor do texto, sem pílula
const TEXT_MAP = {
  info:       "text-status-info",
  positive:   "text-status-positive",
  attention:  "text-status-attention",
  critical:   "text-status-critical",
  neutral:    "text-status-neutral",
};

/**
 * Badge de status tokenizado.
 *
 * @param {{ status: string, tone?: string, variant?: "solid"|"outline"|"text", className?: string }} props
 *   - variant "solid" (default): fundo + texto + borda (comportamento original)
 *   - variant "outline": sem fundo, apenas texto + borda
 *   - variant "text": apenas texto colorido, sem pílula
 */
export function StatusBadge({ status, tone, variant = "solid", className, ...props }) {
  const resolvedTone = tone ?? STATUS_MAP[status] ?? "neutral";

  if (variant === "text") {
    const colorClass = TEXT_MAP[resolvedTone] ?? TEXT_MAP.neutral;
    return (
      <span
        className={cn("inline-flex items-center text-xs font-semibold whitespace-nowrap", colorClass, className)}
        {...props}
      >
        {status}
      </span>
    );
  }

  const styleMap = variant === "outline" ? OUTLINE_MAP : SOLID_MAP;
  const styles = styleMap[resolvedTone] ?? styleMap.neutral;

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
