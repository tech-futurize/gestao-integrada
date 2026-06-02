import { SectionDivider } from "@/components/ui/FormDialog";
import { formatDate } from "@/lib/dateUtils";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const Field = ({ label, value, full = false, accent = false }) => (
  <div className={`rounded-lg border border-border bg-muted/30 px-3 py-2 ${full ? "col-span-full" : ""}`}>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-0.5 whitespace-pre-wrap break-words ${accent ? "text-base font-bold text-ocre" : "text-sm font-medium text-foreground"}`}>
      {value || "—"}
    </p>
  </div>
);

const Section = ({ label, children }) => (
  <div className="space-y-3">
    <SectionDivider label={label} />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
  </div>
);

export default function ContratoVisaoGeral({ contrato, aditivos = [] }) {
  const somaAditivos = aditivos
    .filter((a) => a.status === "Assinado")
    .reduce((s, a) => s + (a.valor || 0), 0);

  return (
    <div className="space-y-5">
      <Section label="Identificação">
        <Field label="Número" value={contrato.numero} />
        <Field label="Fornecedor" value={contrato.fornecedor} />
        <Field label="CNPJ" value={contrato.cnpj} />
        <Field label="Tipo" value={contrato.tipo} />
        <Field label="Modalidade" value={contrato.modalidade} />
        <Field label="Origem" value={contrato.origem} />
        <Field label="Objeto" value={contrato.objeto} full />
      </Section>

      <Section label="Valores">
        <Field label="Valor total" value={fmt(contrato.valor_total)} accent />
        <Field label="Σ Aditivos (assinados)" value={fmt(somaAditivos)} />
      </Section>

      <Section label="Prazo">
        <Field label="Início" value={formatDate(contrato.data_inicio)} />
        <Field label="Término" value={formatDate(contrato.data_fim)} />
      </Section>

      <Section label="Gestão">
        <Field label="Gestor" value={contrato.gestor} />
        <Field label="Centro de custo" value={contrato.centro_custo} />
        <Field label="Observações" value={contrato.observacoes} full />
      </Section>
    </div>
  );
}
