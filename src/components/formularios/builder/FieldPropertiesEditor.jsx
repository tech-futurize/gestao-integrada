import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOption } from "@/lib/formularios/formSchema";

const CHOICE_TYPES = new Set(["single_choice", "multiple_choice", "dropdown"]);

export default function FieldPropertiesEditor({ field, onUpdate }) {
  const { type } = field;

  if (CHOICE_TYPES.has(type)) {
    return (
      <div className="space-y-2 mt-2">
        {(field.options || []).map((opt, idx) => (
          <div key={opt.value} className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-border rounded-full flex-shrink-0" />
            <Input
              value={opt.label}
              onChange={e => {
                const options = field.options.map((o, i) =>
                  i === idx ? { ...o, label: e.target.value } : o
                );
                onUpdate({ options });
              }}
              placeholder={`Opção ${idx + 1}`}
              className="h-8 text-sm"
            />
            {field.options.length > 1 && (
              <button
                type="button"
                onClick={() => onUpdate({ options: field.options.filter((_, i) => i !== idx) })}
                className="text-muted-foreground hover:text-status-critical flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onUpdate({ options: [...(field.options || []), createOption()] })}
          className="text-xs text-primary font-semibold flex items-center gap-1 mt-1"
        >
          <Plus className="w-3 h-3" /> Adicionar opção
        </button>
      </div>
    );
  }

  if (type === "rating") {
    return (
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <Label className="text-xs">Estrelas máximas</Label>
          <Input
            type="number" min={2} max={10}
            value={field.max || 5}
            onChange={e => onUpdate({ max: Math.max(2, Math.min(10, Number(e.target.value) || 5)) })}
            className="h-8 mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Rótulo mínimo</Label>
          <Input
            value={field.minLabel || ''}
            onChange={e => onUpdate({ minLabel: e.target.value })}
            className="h-8 mt-1"
            placeholder="ex: Ruim"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Rótulo máximo</Label>
          <Input
            value={field.maxLabel || ''}
            onChange={e => onUpdate({ maxLabel: e.target.value })}
            className="h-8 mt-1"
            placeholder="ex: Ótimo"
          />
        </div>
      </div>
    );
  }

  if (type === "short_text" || type === "long_text") {
    return (
      <div className="space-y-2 mt-2">
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={e => onUpdate({ placeholder: e.target.value })}
            className="h-8 mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Mín. caracteres</Label>
            <Input
              type="number" min={0}
              value={field.validation?.minLength || ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, minLength: e.target.value ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Máx. caracteres</Label>
            <Input
              type="number" min={0}
              value={field.validation?.maxLength || ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, maxLength: e.target.value ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
        </div>
      </div>
    );
  }

  if (type === "email") {
    return (
      <div className="mt-2">
        <Label className="text-xs">Placeholder</Label>
        <Input
          value={field.placeholder || ''}
          onChange={e => onUpdate({ placeholder: e.target.value })}
          className="h-8 mt-1"
          placeholder="email@exemplo.com"
        />
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="space-y-2 mt-2">
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={e => onUpdate({ placeholder: e.target.value })}
            className="h-8 mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Valor mínimo</Label>
            <Input
              type="number"
              value={field.validation?.min ?? ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, min: e.target.value !== '' ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Valor máximo</Label>
            <Input
              type="number"
              value={field.validation?.max ?? ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, max: e.target.value !== '' ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
        </div>
      </div>
    );
  }

  // date, time, section — no extra properties
  return null;
}
