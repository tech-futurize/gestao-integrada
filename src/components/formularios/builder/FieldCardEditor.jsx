import { useState } from "react";
import { Copy, Trash2, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FIELD_TYPES, createField } from "@/lib/formularios/formSchema";
import FieldPropertiesEditor from "./FieldPropertiesEditor";

export default function FieldCardEditor({ field, onUpdate, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(true);

  function handleTypeChange(newType) {
    const fresh = createField(newType);
    // Clear all type-specific keys first, then spread fresh to avoid stale properties
    // from the previous type (e.g. options from single_choice leaking into number)
    onUpdate({
      options: undefined,
      validation: undefined,
      placeholder: undefined,
      max: undefined,
      minLabel: undefined,
      maxLabel: undefined,
      ...fresh,
      id: field.id,
      label: field.label,
      required: field.required,
    });
  }

  // Section type has simpler editing
  if (field.type === "section") {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-1">
        <input
          value={field.label}
          onChange={e => onUpdate({ label: e.target.value })}
          placeholder="Título da seção..."
          className="w-full text-base font-semibold bg-transparent border-0 focus:outline-none"
        />
        <input
          value={field.description || ''}
          onChange={e => onUpdate({ description: e.target.value })}
          placeholder="Descrição da seção (opcional)..."
          className="w-full text-sm text-muted-foreground bg-transparent border-0 focus:outline-none"
        />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onDuplicate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Copy className="w-3.5 h-3.5" /> Duplicar
          </button>
          <button onClick={onRemove} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-status-critical">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl p-4 transition-all border ${
      expanded ? 'border-primary ring-2 ring-primary/10' : 'border-border'
    }`}>
      {/* Header row: label + type selector + required star */}
      <div className="flex items-start gap-3 mb-2">
        <input
          value={field.label}
          onChange={e => onUpdate({ label: e.target.value })}
          placeholder="Título do item..."
          className="flex-1 text-sm font-semibold bg-transparent border-0 border-b border-dashed border-transparent hover:border-border focus:border-primary focus:outline-none pb-0.5"
          onFocus={() => setExpanded(true)}
        />
        {field.required && <span className="text-status-critical text-sm font-bold flex-shrink-0 mt-0.5">∗</span>}
        {/* Type selector */}
        <div className="relative flex-shrink-0">
          <select
            value={field.type}
            onChange={e => handleTypeChange(e.target.value)}
            className="text-xs font-semibold text-muted-foreground bg-muted/40 border border-border rounded-lg pl-2.5 pr-7 py-1.5 appearance-none focus:outline-none cursor-pointer"
          >
            {FIELD_TYPES.filter(t => t.value !== "section").map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Type-specific properties when expanded */}
      {expanded && <FieldPropertiesEditor field={field} onUpdate={onUpdate} />}

      {/* Footer: Duplicate / Delete / Required toggle */}
      <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-border/50">
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Copy className="w-3.5 h-3.5" /> Duplicar
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-status-critical"
        >
          <Trash2 className="w-3.5 h-3.5" /> Excluir
        </button>
        <div className="flex items-center gap-2">
          <Switch
            id={`req-${field.id}`}
            checked={field.required}
            onCheckedChange={val => onUpdate({ required: val })}
          />
          <Label htmlFor={`req-${field.id}`} className="text-xs cursor-pointer">
            Obrigatório
          </Label>
        </div>
      </div>
    </div>
  );
}
