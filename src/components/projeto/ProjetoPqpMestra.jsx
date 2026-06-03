import PqpEditor from "@/components/planejamento/PqpEditor";

export default function ProjetoPqpMestra({ itens = [], onChange, readOnly = false }) {
  return (
    <PqpEditor
      mode="definicao"
      itens={itens}
      onChange={onChange}
      readOnly={readOnly}
    />
  );
}
