import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShoppingCart, CheckCircle, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { SectionHeader, KpiCard } from "@/components/dashboard/DashboardPrimitives";

// ── Constantes ────────────────────────────────────────────────────────────────

const MODULE_COLOR = "#c35e1e";

const ETAPAS_AQUISICAO = [
  { label: "Requisição (SC)", keywords: ["requisi", "sc"] },
  { label: "Cotação", keywords: ["cota"] },
  { label: "Compra / Pedido", keywords: ["compra", "pedido"] },
  { label: "Fabricação", keywords: ["fabrica"] },
  { label: "Entrega", keywords: ["entrega"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseEtapas(etapas) {
  if (!etapas || !Array.isArray(etapas) || etapas.length === 0) return null;
  return etapas;
}

function matchEtapa(nomeEtapa, keywords) {
  if (!nomeEtapa) return false;
  const lower = nomeEtapa.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// ── Derivações ────────────────────────────────────────────────────────────────

function deriveKpis(itens) {
  const hoje = new Date().toISOString().slice(0, 10);
  const total = itens.length;
  const emAndamento = itens.filter((i) => i.status === "Em andamento").length;
  const concluidos = itens.filter((i) => i.status === "Concluído").length;
  const atrasados = itens.filter(
    (i) => i.data_cronograma && i.data_cronograma < hoje && i.status !== "Concluído"
  ).length;

  // Aderência: itens com etapas onde todas as etapas com data_real têm data_real <= data_prevista
  const itensComEtapas = itens.filter((i) => parseEtapas(i.etapas) !== null);
  let aderencia = null;
  if (itensComEtapas.length > 0) {
    const aderentes = itensComEtapas.filter((i) => {
      const etapas = parseEtapas(i.etapas);
      // Etapas com data_real preenchida
      const etapasComReal = etapas.filter((e) => e.data_real);
      if (etapasComReal.length === 0) return true; // sem dados de execução, considera aderente
      return etapasComReal.every((e) => e.data_real <= e.data_prevista);
    });
    aderencia = Math.round((aderentes.length / itensComEtapas.length) * 100);
  }

  return { total, emAndamento, concluidos, atrasados, aderencia };
}

function deriveEtapasChartData(itens) {
  const itensComEtapas = itens.filter((i) => parseEtapas(i.etapas) !== null);
  if (itensComEtapas.length === 0) return null;

  return ETAPAS_AQUISICAO.map(({ label, keywords }) => {
    let noPrazo = 0;
    let atrasado = 0;

    for (const item of itensComEtapas) {
      const etapas = parseEtapas(item.etapas);
      const etapasMatch = etapas.filter((e) => matchEtapa(e.nome, keywords));
      for (const etapa of etapasMatch) {
        if (!etapa.data_real) continue;
        if (etapa.data_real <= etapa.data_prevista) {
          noPrazo += 1;
        } else {
          atrasado += 1;
        }
      }
    }

    return { etapa: label, "No prazo": noPrazo, Atrasado: atrasado };
  });
}

function deriveAtrasados(itens) {
  const hoje = new Date().toISOString().slice(0, 10);
  return itens
    .filter((i) => i.data_cronograma && i.data_cronograma < hoje && i.status !== "Concluído")
    .sort((a, b) => (a.data_cronograma < b.data_cronograma ? -1 : 1))
    .slice(0, 5);
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function EtapasChart({ data }) {
  if (!data) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Nenhum item com etapas cadastradas.
      </p>
    );
  }

  const hasData = data.some((d) => d["No prazo"] > 0 || d.Atrasado > 0);
  if (!hasData) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Sem registros de execução de etapas.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(140, ETAPAS_AQUISICAO.length * 32)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
        <YAxis
          type="category"
          dataKey="etapa"
          width={120}
          tick={{ fontSize: 10 }}
          tickLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Bar dataKey="No prazo" fill="#00a49a" stackId="a" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Atrasado" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AtrasadosList({ itens }) {
  if (itens.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Nenhum item atrasado.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {itens.map((item) => (
        <div
          key={item.id}
          className="rounded-lg p-3"
          style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <p className="text-xs font-bold" style={{ color: "#991b1b" }}>
            {item.descricao || "—"}
          </p>
          {item.fornecedor && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.fornecedor}</p>
          )}
          <p className="text-xs text-red-500 mt-0.5">{formatDate(item.data_cronograma)}</p>
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SuprimentosSection({ projetoId }) {
  const { data: itens = [], isPending, isError } = useQuery({
    queryKey: ["suprimentos_mas_dash", projetoId],
    queryFn: () => entities.ItemMAS.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  return (
    <Card className="border-0 shadow-md">
      <SectionHeader
        title="Suprimentos"
        icon={ShoppingCart}
        color={MODULE_COLOR}
        subtitle="Mapa de Suprimentos · aquisições e entregas"
      />

      <CardContent className="pt-4 pb-6 px-6">
        {/* Estado de carregamento */}
        {isPending && <Skeleton className="h-64 w-full" />}

        {/* Estado de erro */}
        {isError && !isPending && (
          <div className="flex items-center gap-2 text-destructive py-8 justify-center">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Erro ao carregar dados de suprimentos.</span>
          </div>
        )}

        {/* Estado vazio */}
        {!isPending && !isError && itens.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum item cadastrado no Mapa de Suprimentos.
          </p>
        )}

        {/* Conteúdo */}
        {!isPending && !isError && itens.length > 0 && (() => {
          const { total, emAndamento, concluidos, atrasados, aderencia } = deriveKpis(itens);
          const etapasChartData = deriveEtapasChartData(itens);
          const atrasadosList = deriveAtrasados(itens);

          return (
            <div className="flex flex-col gap-6">
              {/* KPIs — 5 colunas */}
              <div className="grid grid-cols-5 gap-3">
                <KpiCard
                  label="Itens"
                  value={total}
                  icon={ShoppingCart}
                  color={MODULE_COLOR}
                />
                <KpiCard
                  label="Em andamento"
                  value={emAndamento}
                  icon={Clock}
                  color="#3b82f6"
                />
                <KpiCard
                  label="Concluídos"
                  value={concluidos}
                  icon={CheckCircle}
                  color="#00a49a"
                />
                <KpiCard
                  label="Atrasados"
                  value={atrasados}
                  icon={AlertCircle}
                  color="#ef4444"
                />
                <KpiCard
                  label="Aderência geral"
                  value={aderencia !== null ? `${aderencia}%` : "—"}
                  icon={TrendingUp}
                  color="#16a34a"
                />
              </div>

              {/* Painel inferior: gráfico + lista */}
              <div className="flex gap-6">
                {/* Barras por etapa de aquisição */}
                <div style={{ flex: 1.5 }}>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Aderência por etapa de aquisição
                  </p>
                  <EtapasChart data={etapasChartData} />
                </div>

                {/* Lista de itens atrasados */}
                <div style={{ flex: 1 }}>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Itens atrasados
                  </p>
                  <AtrasadosList itens={atrasadosList} />
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
