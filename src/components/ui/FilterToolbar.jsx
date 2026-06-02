import { SlidersHorizontal, X } from "lucide-react";

export default function FilterToolbar({ active, onClearAll, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <SlidersHorizontal className="w-4 h-4" />
        <span className="relative pr-1">
          Filtros
          {active && onClearAll && (
            <button
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 z-10 transition-colors"
              onClick={onClearAll}
              aria-label="Limpar todos os filtros"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      </span>
      {children}
    </div>
  );
}
