import { useEffect, useRef } from "react";
import {
  AlignLeft, AlignJustify, Hash, Mail, CircleDot,
  CheckSquare, ChevronDown, Calendar, Clock, Star, Minus,
} from "lucide-react";
import { FIELD_TYPES } from "@/lib/formularios/formSchema";

const ICONS = {
  short_text:      AlignLeft,
  long_text:       AlignJustify,
  number:          Hash,
  email:           Mail,
  single_choice:   CircleDot,
  multiple_choice: CheckSquare,
  dropdown:        ChevronDown,
  date:            Calendar,
  time:            Clock,
  rating:          Star,
  section:         Minus,
};

export default function FieldTypePicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-lg p-2 grid grid-cols-2 gap-1"
    >
      {FIELD_TYPES.map(t => {
        const Icon = ICONS[t.value];
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 text-sm font-medium text-left transition-colors"
          >
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
