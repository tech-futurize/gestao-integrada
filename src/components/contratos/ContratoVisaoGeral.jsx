import { formatDate } from "@/lib/dateUtils";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const Field = ({ label, value, full = false }) => (
  <div className={full ? "col-span-full" : ""}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{value || "—"}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{title}</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
  </div>
);

export default function ContratoVisaoGeral({ contrato, aditivos = [] }) {
  const somaAditivos = aditivos
    .filter((a) => a.status === "Assinado")
    .reduce((s, a) => s + (a.valor || 0), 0);

  return (
    <div className="space-y-6">
      <Section title="Identificação">
        <Field label="Número" value={contrato.numero} />
        <Field label="Fornecedor" value={contrato.fornecedor} />
        <Field label="CNPJ" value={contrato.cnpj} />
        <Field label="Tipo" value={contrato.tipo} />
        <Field label="Modalidade" value={contrato.modalidade} />
        <Field label="Origem" value={contrato.origem} />
        <Field label="Objeto" value={contrato.objeto} full />
      </Section>

      <Section title="Valores">
        <Field label="Valor total" value={fmt(contrato.valor_total)} />
        <Field label="Σ Aditivos (assinados)" value={fmt(somaAditivos)} />
      </Section>

      <Section title="Prazo">
        <Field label="Início" value={formatDate(contrato.data_inicio)} />
        <Field label="Término" value={formatDate(contrato.data_fim)} />
      </Section>

      <Section title="Gestão">
        <Field label="Gestor" value={contrato.gestor} />
        <Field label="Centro de custo" value={contrato.centro_custo} />
        <Field label="Observações" value={contrato.observacoes} full />
      </Section>
    </div>
  );
}
