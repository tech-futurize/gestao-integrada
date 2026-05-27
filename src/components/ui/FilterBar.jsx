import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import usePersistedFilters from "@/hooks/usePersistedFilters";

export default function FilterBar({ storageKey, filters = [], onChange }) {
  const filterKeys = filters.map(f => f.key);
  const [selected, setFieldValues, clearAll] = usePersistedFilters(storageKey, filterKeys);

  // Reporta estado inicial persistido ao pai na primeira montagem
  useEffect(() => {
    onChange(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key, values) => {
    setFieldValues(key, values);
    onChange({ ...selected, [key]: values });
  };

  const handleClearAll = () => {
    clearAll();
    onChange(Object.fromEntries(filterKeys.map(k => [k, []])));
  };

  const removeChip = (key, value) => {
    const next = (selected[key] || []).filter(v => v !== value);
    setFieldValues(key, next);
    onChange({ ...selected, [key]: next });
  };

  const hasActive = filterKeys.some(k => (selected[k] || []).length > 0);

  const chips = filterKeys.flatMap(key =>
    (selected[key] || []).map(value => ({
      key,
      value,
      filterLabel: filters.find(f => f.key === key)?.label || key,
    }))
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <MultiSelectDropdown
            key={f.key}
            label={f.label}
            options={f.options}
            selected={selected[f.key] || []}
            onChange={values => handleChange(f.key, values)}
          />
        ))}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground gap-1 hover:text-foreground"
            onClick={handleClearAll}
          >
            <X className="w-3 h-3" /> Limpar tudo
          </Button>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {chips.map(({ key, value }) => (
            <span
              key={`${key}-${value}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
            >
              {value}
              <button
                onClick={() => removeChip(key, value)}
                className="hover:text-primary/60 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
