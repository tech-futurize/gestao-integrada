import FieldInput from "./FieldInput";

export default function FormRenderer({ definition, value, onChange, errors, readOnly }) {
  if (!Array.isArray(definition?.sections)) return null;

  return (
    <div className="space-y-3">
      {definition.sections.map(sec => (
        <div key={sec.id} className="space-y-3">
          {sec.title && (
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-semibold text-muted-foreground px-2">{sec.title}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
          {sec.fields.map(field => {
            if (field.type === "section") {
              return (
                <div key={field.id} className="pt-1">
                  {field.label && <h3 className="text-base font-semibold">{field.label}</h3>}
                  {field.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{field.description}</p>
                  )}
                </div>
              );
            }
            return (
              <FieldInput
                key={field.id}
                field={field}
                value={value[field.id] ?? (field.type === "multiple_choice" ? [] : field.type === "rating" ? null : "")}
                onChange={val => onChange(field.id, val)}
                error={errors[field.id]}
                readOnly={readOnly}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
