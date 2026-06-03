import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import {
  DndContext, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  addField, addSection, createField,
  removeField, duplicateField, reorderFields,
  updateField, updateSection,
} from "@/lib/formularios/formSchema";
import SortableFieldCard from "./SortableFieldCard";
import FieldTypePicker from "./FieldTypePicker";

export default function FormBuilderCanvas({ definition, onChange }) {
  const [openPickerSectionId, setOpenPickerSectionId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    for (const sec of definition.sections) {
      const ids = sec.fields.map(f => f.id);
      const oldIdx = ids.indexOf(active.id);
      const newIdx = ids.indexOf(over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        onChange(reorderFields(definition, sec.id, oldIdx, newIdx));
        return;
      }
    }
  }

  function handleAddField(sectionId, type) {
    const field = createField(type);
    onChange(addField(definition, sectionId, field));
    setOpenPickerSectionId(null);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {definition.sections.map((sec, secIdx) => (
          <div key={sec.id} className="space-y-3">
            {/* Section title — show if more than one section or if it has a title */}
            {(definition.sections.length > 1 || sec.title) && (
              <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-border" />
                <input
                  value={sec.title}
                  onChange={e => onChange(updateSection(definition, sec.id, { title: e.target.value }))}
                  placeholder={`Seção ${secIdx + 1}...`}
                  className="text-sm font-semibold text-muted-foreground bg-transparent border-0 focus:outline-none text-center min-w-28"
                />
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            <SortableContext
              items={sec.fields.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {sec.fields.map(field => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  onUpdate={patch => onChange(updateField(definition, sec.id, field.id, patch))}
                  onRemove={() => onChange(removeField(definition, sec.id, field.id))}
                  onDuplicate={() => onChange(duplicateField(definition, sec.id, field.id))}
                />
              ))}
            </SortableContext>

            {/* Add field button + picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenPickerSectionId(
                  openPickerSectionId === sec.id ? null : sec.id
                )}
                className="w-full border-2 border-dashed border-border rounded-xl p-3 text-sm font-semibold text-primary hover:bg-primary/5 hover:border-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar item
              </button>
              {openPickerSectionId === sec.id && (
                <FieldTypePicker
                  onSelect={type => handleAddField(sec.id, type)}
                  onClose={() => setOpenPickerSectionId(null)}
                />
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onChange(addSection(definition))}
          className="w-full border border-dashed border-border rounded-xl p-3 text-sm text-muted-foreground hover:bg-muted/30 flex items-center justify-center gap-2 transition-colors"
        >
          <Layers className="w-4 h-4" /> Adicionar seção
        </button>
      </div>
    </DndContext>
  );
}
