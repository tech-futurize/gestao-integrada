import { cn } from "@/lib/utils";

/**
 * Título de seção padronizado.
 * Aplica: text-xs font-semibold uppercase tracking-wide text-muted-foreground
 */
export function SectionTitle({ children, className, as: Tag = "h3", ...props }) {
  return (
    <Tag
      className={cn(
        "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
