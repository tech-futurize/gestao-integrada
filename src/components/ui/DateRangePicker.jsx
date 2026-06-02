import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function DateRangePicker({ label, value, onChange, onClear }) {
  const [open, setOpen] = useState(false);

  const hasValue = value?.from;

  const displayLabel = hasValue
    ? `${format(value.from, "dd/MM/yy", { locale: ptBR })} – ${value.to ? format(value.to, "dd/MM/yy", { locale: ptBR }) : "..."}`
    : label;

  const handleSelect = (range) => {
    onChange(range || null);
    if (range?.from && range?.to) setOpen(false);
  };

  return (
    <div className="relative inline-flex">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-sm font-normal",
              hasValue && "border-primary text-primary bg-primary/5"
            )}
          >
            <CalendarRange className="w-3.5 h-3.5 opacity-60" />
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            locale={ptBR}
            selected={value || undefined}
            onSelect={handleSelect}
            defaultMonth={value?.from}
          />
        </PopoverContent>
      </Popover>
      {hasValue && onClear && (
        <button
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 z-10 transition-colors"
          onClick={e => { e.stopPropagation(); onClear(); }}
          aria-label={`Limpar ${label}`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}
