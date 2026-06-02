import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * DetailDialog — diálogo genérico de visualização (read-only) para qualquer entidade.
 *
 * Não faz fetch próprio: recebe os dados já carregados pelo pai.
 *
 * @param {boolean} open
 * @param {function} onOpenChange
 * @param {string} title  — ex: "Risco R-001"
 * @param {Array} sections — formato simples: [{ label, value }]
 *                          ou com agrupamento: [{ heading, fields: [{ label, value }] }]
 */
export default function DetailDialog({ open, onOpenChange, title, sections = [] }) {
  const isGrouped = sections.length > 0 && "fields" in sections[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {isGrouped
            ? sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {section.heading}
                    </p>
                  )}
                  <FieldGrid fields={section.fields} />
                </div>
              ))
            : <FieldGrid fields={sections} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldGrid({ fields = [] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
      {fields.map((f, i) => (
        <div key={i} className={f.full ? "col-span-2" : ""}>
          <dt className="text-xs text-muted-foreground">{f.label}</dt>
          <dd className="text-sm text-foreground font-medium break-words">
            {f.value !== undefined && f.value !== null && f.value !== ""
              ? String(f.value)
              : "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
