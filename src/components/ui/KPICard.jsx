import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Card de métrica padronizado (KPI).
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   icon?: React.ReactNode,
 *   accent?: string,       // classe Tailwind de cor para o valor (padrão: text-foreground)
 *   className?: string,
 * }} props
 */
export function KPICard({ label, value, icon, accent, className }) {
  return (
    <Card className={cn("p-4", className)}>
      <CardContent className="p-0 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {icon && (
            <span className="text-muted-foreground/60 [&_svg]:size-4">{icon}</span>
          )}
        </div>
        <span className={cn("text-2xl font-bold leading-none", accent ?? "text-foreground")}>
          {value ?? "—"}
        </span>
      </CardContent>
    </Card>
  );
}
