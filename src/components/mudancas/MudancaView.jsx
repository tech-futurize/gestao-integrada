import { ArrowRightLeft } from "lucide-react";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/dateUtils";

function Campo({ label, value, accent }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium text-foreground ${accent || ""}`}>{value}</p>
    </div>
  );
}

function fmtCusto(val) {
  if (val === null || val === undefined || val === "") return null;
  const abs = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return val >= 0 ? `+${abs}` : `-${abs.replace("-", "")}`;
}

export default function MudancaView({ mudanca, open, onClose }) {
  if (!mudanca) return null;

  const custoFmt = fmtCusto(mudanca.impacto_custo);
  const custoAccent = mudanca.impacto_custo > 0
    ? "text-status-critical"
    : mudanca.impacto_custo < 0
    ? "text-status-positive"
    : undefined;

  const prazoFmt = mudanca.impacto_prazo_dias != null && mudanca.impacto_prazo_dias !== ""
    ? `${mudanca.impacto_prazo_dias > 0 ? "+" : ""}${mudanca.impacto_prazo_dias} dias`
    : null;

  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      icon={ArrowRightLeft}
      title={mudanca.titulo || "Mudança"}
      badge={mudanca.status ? <StatusBadge status={mudanca.status} /> : undefined}
      mode="view"
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <SectionDivider label="Identificação" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Campo label="Origem" value={mudanca.origem} />
        <Campo label="Data de Registro" value={formatDate(mudanca.data_ocorrencia)} />
        <Campo label="Responsável" value={mudanca.responsavel} />
      </div>

      {mudanca.categorias?.length > 0 && (
        <>
          <SectionDivider label="Categorias" />
          <div className="flex flex-wrap gap-2">
            {mudanca.categorias.map((cat) => (
              <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                {cat}
              </span>
            ))}
          </div>
        </>
      )}

      <SectionDivider label="Impactos" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {custoFmt && <Campo label="Impacto Financeiro" value={custoFmt} accent={custoAccent} />}
        {prazoFmt && <Campo label="Impacto em Prazo" value={prazoFmt} />}
        {mudanca.impacto_escopo_tipo && <Campo label="Escopo" value={mudanca.impacto_escopo_tipo} />}
      </div>

      {mudanca.impacto_escopo && (
        <Campo label="Descrição do Impacto no Escopo" value={mudanca.impacto_escopo} />
      )}

      {mudanca.descricao && (
        <>
          <SectionDivider label="Descrição" />
          <p className="text-sm text-foreground leading-relaxed">{mudanca.descricao}</p>
        </>
      )}

      {mudanca.observacoes && (
        <>
          <SectionDivider label="Observações" />
          <p className="text-sm text-muted-foreground">{mudanca.observacoes}</p>
        </>
      )}
    </FormDialog>
  );
}
