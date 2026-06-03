import { useMemo } from "react";
import { FileText, CheckCircle2, Clock, Building2, DollarSign, Percent, TrendingUp } from "lucide-react";
import { calcFaturamentoSummary } from "@/utils/faturamentoSummary";

const brl = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const pct = (v) =>
  v === null ? "—" : `${v.toFixed(1)}%`;

function SummaryCard({ icon: Icon, label, value, sub, iconClass }) {
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 flex items-start gap-3">
      <div className={`mt-0.5 ${iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5 truncate">
          {label}
        </div>
        <div className="text-base font-bold text-foreground leading-tight">{value}</div>
        <div className="text-[9px] text-muted-foreground truncate">{sub}</div>
      </div>
    </div>
  );
}

export default function FaturamentoSummary({ faturamentos, valorContrato }) {
  const s = useMemo(
    () => calcFaturamentoSummary(faturamentos, valorContrato),
    [faturamentos, valorContrato]
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={FileText}
          label="Total de medições"
          value={s.totalCount}
          sub="faturamentos no período"
          iconClass="text-blue-500"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Total concluído"
          value={s.concluidosCount}
          sub={brl(s.concluidosValor)}
          iconClass="text-emerald-500"
        />
        <SummaryCard
          icon={Clock}
          label="Em elaboração"
          value={s.elaboracaoCount}
          sub={brl(s.elaboracaoValor)}
          iconClass="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={Building2}
          label="Valor do contrato"
          value={brl(valorContrato)}
          sub="valor contratado"
          iconClass="text-blue-500"
        />
        <SummaryCard
          icon={DollarSign}
          label="Valor total medido"
          value={brl(s.totalMedido)}
          sub="medido no período"
          iconClass="text-emerald-500"
        />
        <SummaryCard
          icon={Percent}
          label="Percentual medido"
          value={pct(s.percentual)}
          sub="do contrato medido"
          iconClass="text-violet-500"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Saldo a medir"
          value={s.saldo === null ? "—" : brl(s.saldo)}
          sub="saldo restante"
          iconClass="text-slate-500"
        />
      </div>
    </div>
  );
}
