import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const FormDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
FormDialogOverlay.displayName = "FormDialogOverlay";

/**
 * FormDialog — padrão único para todos os modais de edição/visualização do sistema.
 *
 * Props:
 *   open, onOpenChange          — controle Radix
 *   icon          {LucideIcon}  — ícone lucide exibido no chip do header
 *   title         {string}      — título (DialogPrimitive.Title, obrigatório p/ ARIA)
 *   subtitle      {string}      — subtítulo/descrição opcional
 *   badge         {ReactNode}   — conteúdo opcional à direita do título (ex: StatusBadge)
 *   variant       {"bar-left"|"bar-top"} — estilo da faixa de accent (default: "bar-left")
 *   maxWidth      {string}      — classe Tailwind de largura máx (default: "max-w-lg")
 *   children      {ReactNode}   — corpo (scrollável automaticamente)
 *   mode          {"edit"|"view"} — controla footer padrão (default: "edit")
 *   onClose       {function}    — callback de fechar
 *   onSave        {function}    — callback de salvar (mode="edit")
 *   saving        {boolean}     — exibe "Salvando..." e desabilita botões
 *   saveDisabled  {boolean}     — desabilita só o botão Salvar
 *   saveLabel     {string}      — label do botão de ação (default: "Salvar")
 *   cancelLabel   {string}      — label cancelar (default: "Cancelar")
 *   closeLabel    {string}      — label fechar (default: "Fechar")
 *   footer        {ReactNode}   — footer completamente customizado (sobrepõe o padrão)
 *   hideFooter    {boolean}     — oculta o footer
 */
export function FormDialog({
  open,
  onOpenChange,
  icon: Icon,
  title,
  subtitle,
  badge,
  variant = "bar-left",
  maxWidth = "max-w-lg",
  children,
  mode = "edit",
  onClose,
  onSave,
  saving = false,
  saveDisabled = false,
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
  closeLabel = "Fechar",
  footer,
  hideFooter = false,
}) {
  const handleClose = () => {
    if (onClose) onClose();
    else if (onOpenChange) onOpenChange(false);
  };

  const defaultFooter =
    mode === "view" ? (
      <Button variant="outline" onClick={handleClose} disabled={saving}>
        {closeLabel}
      </Button>
    ) : (
      <>
        <Button variant="outline" onClick={handleClose} disabled={saving}>
          {cancelLabel}
        </Button>
        <Button
          variant="save"
          onClick={onSave}
          disabled={saving || saveDisabled}
        >
          {saving ? "Salvando..." : saveLabel}
        </Button>
      </>
    );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <FormDialogOverlay />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
            maxWidth,
            "rounded-xl border border-border bg-card shadow-2xl",
            "flex flex-col max-h-[90vh] p-0 overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {/* Faixa superior (bar-top) */}
          {variant === "bar-top" && (
            <div className="h-1.5 w-full shrink-0 bg-primary" />
          )}

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {/* Faixa lateral (bar-left) */}
              {variant === "bar-left" && (
                <div className="w-1 self-stretch rounded-full shrink-0 min-h-[40px] bg-primary" />
              )}

              {/* Chip de ícone */}
              {Icon && (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              )}

              {/* Título + subtítulo */}
              <div className="min-w-0 pt-0.5">
                <DialogPrimitive.Title className="text-base font-bold text-foreground leading-tight">
                  {title}
                </DialogPrimitive.Title>
                {subtitle && (
                  <DialogPrimitive.Description className="text-xs text-muted-foreground mt-0.5 truncate">
                    {subtitle}
                  </DialogPrimitive.Description>
                )}
              </div>
            </div>

            {/* Badge + botão fechar */}
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              {badge}
              <DialogPrimitive.Close
                className="text-muted-foreground hover:text-foreground transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Body scrollável */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {children}
          </div>

          {/* Footer */}
          {!hideFooter && (
            <div className="border-t border-border px-6 py-4 flex justify-end gap-2 shrink-0 bg-muted/20">
              {footer ?? defaultFooter}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * SectionDivider — divisor de seção tokenizado para usar dentro de FormDialog.
 * Substitui as cópias locais com hex hardcoded em cada arquivo.
 *
 * @example  <SectionDivider label="Identificação" />
 */
export function SectionDivider({ label, className }) {
  return (
    <div className={cn("flex items-center gap-2 pt-1", className)}>
      <div className="w-2 h-2 rounded-full shrink-0 bg-primary" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
