import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function FieldInput({ field, value, onChange, error, readOnly }) {
  const { type, label, description, required, placeholder } = field;

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-3 ${error ? 'border-status-critical' : 'border-border'}`}>
      {/* Label + description */}
      <div>
        <Label className="text-sm font-semibold flex items-center gap-1">
          {label || "(sem título)"}
          {required && <span className="text-status-critical">∗</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Input by type */}
      {type === "short_text" && (
        <Input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ""}
          disabled={readOnly}
          inputMode="text"
        />
      )}

      {type === "long_text" && (
        <Textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ""}
          disabled={readOnly}
          rows={3}
        />
      )}

      {type === "number" && (
        <Input
          type="number"
          value={value ?? ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          disabled={readOnly}
          inputMode="numeric"
        />
      )}

      {type === "email" && (
        <Input
          type="email"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "email@exemplo.com"}
          disabled={readOnly}
          inputMode="email"
        />
      )}

      {type === "single_choice" && (
        <div className="space-y-2">
          {(field.options || []).map(opt => (
            <button
              key={opt.value}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(opt.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                value === opt.value
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:bg-muted/30"
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 relative ${
                value === opt.value ? "border-primary" : "border-border"
              }`}>
                {value === opt.value && (
                  <span className="absolute inset-0.5 rounded-full bg-primary" />
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {type === "multiple_choice" && (
        <div className="space-y-2">
          {(field.options || []).map(opt => {
            const checked = Array.isArray(value) && value.includes(opt.value);
            return (
              <div
                key={opt.value}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/20"
              >
                <Checkbox
                  id={`${field.id}-${opt.value}`}
                  checked={checked}
                  disabled={readOnly}
                  onCheckedChange={ch => {
                    const arr = Array.isArray(value) ? value : [];
                    onChange(ch ? [...arr, opt.value] : arr.filter(v => v !== opt.value));
                  }}
                />
                <label
                  htmlFor={`${field.id}-${opt.value}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {opt.label}
                </label>
              </div>
            );
          })}
        </div>
      )}

      {type === "dropdown" && (
        <Select value={value || ""} onValueChange={onChange} disabled={readOnly}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || "Selecione uma opção..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "date" && (
        <Input
          type="date"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          disabled={readOnly}
        />
      )}

      {type === "time" && (
        <Input
          type="time"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          disabled={readOnly}
        />
      )}

      {type === "rating" && (
        <div>
          <div className="flex gap-1.5">
            {Array.from({ length: field.max || 5 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && onChange(n)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    n <= (value || 0)
                      ? "text-amber-400 fill-amber-400"
                      : "text-border hover:text-amber-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {(field.minLabel || field.maxLabel) && (
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{field.minLabel}</span>
              <span>{field.maxLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-status-critical flex items-center gap-1">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
