import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import FieldCardEditor from "./FieldCardEditor";

export default function SortableFieldCard({ field, onUpdate, onRemove, onDuplicate }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex gap-2 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 mt-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        tabIndex={-1}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <FieldCardEditor
          field={field}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
        />
      </div>
    </div>
  );
}
