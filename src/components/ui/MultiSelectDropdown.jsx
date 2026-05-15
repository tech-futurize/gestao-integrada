import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiSelectDropdown({ label, options = [], selected = [], onChange, placeholder = "Pesquisar..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const allSelected = filteredOptions.length > 0 && filteredOptions.every(o => selected.includes(o));

  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter(s => !filteredOptions.includes(s)));
    } else {
      onChange([...new Set([...selected, ...filteredOptions])]);
    }
  };

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={v => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-sm font-normal",
            selected.length > 0 && "border-primary text-primary bg-primary/5"
          )}
        >
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-primary text-primary-foreground px-1.5 text-xs font-bold leading-4">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder={placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-7 text-sm mb-2"
        />
        <div
          className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted cursor-pointer"
          onClick={toggleAll}
        >
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            id={`${label}-all`}
          />
          <label htmlFor={`${label}-all`} className="text-sm cursor-pointer select-none font-medium">
            Selecionar todos
          </label>
        </div>
        <div className="my-1 border-t border-border" />
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filteredOptions.map(option => (
            <div
              key={option}
              className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted cursor-pointer"
              onClick={() => toggle(option)}
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => toggle(option)}
                id={`${label}-${option}`}
              />
              <label htmlFor={`${label}-${option}`} className="text-sm cursor-pointer select-none">
                {option}
              </label>
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2 text-center">Nenhum resultado</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
