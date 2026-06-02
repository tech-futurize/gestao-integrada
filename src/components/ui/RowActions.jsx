import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * RowActions — botões de ação padrão para linhas de tabela e cards.
 *
 * Renderiza apenas os ícones cujos handlers forem fornecidos.
 * Sempre alinhados à direita via justify-end no container.
 *
 * @param {function} [onView]            — abre visualização
 * @param {function} [onEdit]            — abre formulário de edição
 * @param {function} [onDelete]          — executado após confirmação de exclusão
 * @param {string}   [deleteTitle]       — título do AlertDialog de exclusão
 * @param {string}   [deleteDescription] — descrição do AlertDialog de exclusão
 * @param {{view?: boolean, edit?: boolean, delete?: boolean}} [disabled] — desabilita ações individualmente
 * @param {"sm"|"md"} [size="sm"]        — "sm" = botão 28px / ícone 3.5 | "md" = 32px / ícone 4
 * @param {boolean}  [stopPropagation=true] — impede que o clique propague para a linha/card
 * @param {import("react").ReactNode} [extra] — ações customizadas renderizadas antes do trio
 * @param {string}   [className]         — classe extra no container
 */
export default function RowActions({
  onView,
  onEdit,
  onDelete,
  deleteTitle = "Confirmar exclusão",
  deleteDescription = "Esta ação não pode ser desfeita.",
  disabled = {},
  size = "sm",
  stopPropagation = true,
  extra,
  className,
}) {
  const isSm = size === "sm";
  const btnCls = isSm ? "h-7 w-7 [&_svg]:size-3.5" : "h-8 w-8 [&_svg]:size-4";

  const handleContainerClick = stopPropagation
    ? (e) => e.stopPropagation()
    : undefined;

  return (
    <div
      className={cn("flex items-center justify-end gap-1", className)}
      onClick={handleContainerClick}
    >
      {extra}

      {onView && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Visualizar"
          aria-label="Visualizar"
          disabled={disabled.view}
          className={cn(
            btnCls,
            "text-status-info/70 hover:text-status-info hover:bg-status-info/10"
          )}
          onClick={onView}
        >
          <Eye />
        </Button>
      )}

      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Editar"
          aria-label="Editar"
          disabled={disabled.edit}
          className={cn(
            btnCls,
            "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          onClick={onEdit}
        >
          <Edit />
        </Button>
      )}

      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Excluir"
              aria-label="Excluir"
              disabled={disabled.delete}
              className={cn(
                btnCls,
                "text-status-critical hover:text-status-critical hover:bg-status-critical/10 focus:ring-status-critical/30"
              )}
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-status-critical hover:bg-status-critical/90 text-white"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
