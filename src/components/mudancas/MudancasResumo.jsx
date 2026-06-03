import { useMemo } from "react";
import { Clock, DollarSign, Layers, ArrowRightLeft } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";

function fmtValor(val) {
  const abs = Math.abs(val);
  const fmt = abs >= 1_000_000
    ? `R$ ${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
    ? `R$ ${(abs / 1_000).toFixed(0)}k`
    : `R$ ${abs.toLocaleString("pt-BR")}`;
  return val >= 0 ? `+${fmt}` : `-${fmt}`;
}

export default function MudancasResumo({ mudancas = [] }) {
  const totalPrazo = useMemo(
    () => mudancas.reduce((s, m) => s + (m.impacto_prazo_dias || 0), 0),
    [mudancas]
  );

  const totalCusto = useMemo(
    () => mudancas.reduce((s, m) => s + (m.impacto_custo || 0), 0),
    [mudancas]
  );

  const totalEscopo = useMemo(
    () => mudancas.filter(m => m.categorias?.includes("Escopo")).length,
    [mudancas]
  );

  const prazoAccent = totalPrazo > 0
    ? "text-status-critical"
    : totalPrazo < 0
    ? "text-status-positive"
    : undefined;

  const custoAccent = totalCusto > 0
    ? "text-status-critical"
    : totalCusto < 0
    ? "text-status-positive"
    : undefined;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard
        label="Desvio de Prazo"
        value={`${totalPrazo > 0 ? "+" : ""}${totalPrazo}d`}
        icon={<Clock />}
        accent={prazoAccent}
      />
      <KPICard
        label="Impacto em Valor"
        value={fmtValor(totalCusto)}
        icon={<DollarSign />}
        accent={custoAccent}
      />
      <KPICard
        label="Com Escopo"
        value={totalEscopo}
        icon={<Layers />}
      />
      <KPICard
        label="Total de Mudanças"
        value={mudancas.length}
        icon={<ArrowRightLeft />}
      />
    </div>
  );
}
