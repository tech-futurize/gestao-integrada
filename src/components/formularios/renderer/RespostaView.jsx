import { FormDialog } from "@/components/ui/FormDialog";
import FormRenderer from "./FormRenderer";

export default function RespostaView({ open, onClose, definition, answers, respondente, createdAt }) {
  if (!definition || !answers) return null;

  const subtitle = respondente
    ? `Respondente: ${respondente}`
    : createdAt
      ? `Enviado em ${new Date(createdAt).toLocaleString("pt-BR")}`
      : undefined;

  return (
    <FormDialog
      open={open}
      onOpenChange={onClose}
      title="Visualizar Resposta"
      subtitle={subtitle}
      mode="view"
      onClose={onClose}
    >
      <FormRenderer
        definition={definition}
        value={answers}
        onChange={() => {}}
        errors={{}}
        readOnly
      />
    </FormDialog>
  );
}
