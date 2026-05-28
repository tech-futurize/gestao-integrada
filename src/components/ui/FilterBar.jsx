import { useEffect } from "react";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import usePersistedFilters from "@/hooks/usePersistedFilters";

export default function FilterBar({ storageKey, filters = [], onChange }) {
  const filterKeys = filters.map(f => f.key);
  const [selected, setFieldValues] = usePersistedFilters(storageKey, filterKeys);

  // Reporta estado inicial persistido ao pai na primeira montagem
  useEffect(() => {
    onChange(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key, values) => {
    setFieldValues(key, values);
    onChange({ ...selected, [key]: values });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map(f => (
        <MultiSelectDropdown
          key={f.key}
          label={f.label}
          options={f.options}
          selected={selected[f.key] || []}
          onChange={values => handleChange(f.key, values)}
          onClear={() => handleChange(f.key, [])}
        />
      ))}
    </div>
  );
}
