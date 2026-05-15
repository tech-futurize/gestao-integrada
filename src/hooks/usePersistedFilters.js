import { useState } from "react";

export default function usePersistedFilters(storageKey, filterKeys) {
  const [selected, setSelected] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const initial = {};
      filterKeys.forEach(key => {
        initial[key] = Array.isArray(saved[key]) ? saved[key] : [];
      });
      return initial;
    } catch {
      return Object.fromEntries(filterKeys.map(k => [k, []]));
    }
  });

  const setFieldValues = (key, values) => {
    setSelected(prev => {
      const next = { ...prev, [key]: values };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const clearAll = () => {
    const empty = Object.fromEntries(filterKeys.map(k => [k, []]));
    setSelected(empty);
    localStorage.removeItem(storageKey);
  };

  return [selected, setFieldValues, clearAll];
}
