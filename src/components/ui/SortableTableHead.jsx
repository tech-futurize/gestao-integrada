import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function SortableTableHead({ columnKey, sortKey, sortDir, onSort, children, className }) {
  const isActive = sortKey === columnKey
  const Icon = !isActive ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead
      className={cn("cursor-pointer select-none group", className)}
      onClick={() => onSort(columnKey)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <Icon className={cn(
          "w-3.5 h-3.5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
        )} />
      </span>
    </TableHead>
  )
}
