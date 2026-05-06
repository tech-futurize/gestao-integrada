import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { DollarSign, TrendingUp, Percent, CheckCircle2 } from "lucide-react";

export default function KpisContrato({ projetoId }) {
  const { data: projeto } = useQuery({
    queryKey: ["projeto", projetoId],
    queryFn: async () => {
      const projetos = await entities.Projeto.list();
      return projetos.find((p) => p.id === projetoId);
    },
    enabled: !!projetoId,
  });

  const { data: financeiros = [] } = useQuery({
    queryKey: ["financeiros", projetoId],
    queryFn: () => entities.Financeiro.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: avancos = [] } = useQuery({
    queryKey: ["avancos", projetoId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const kpis = useMemo(() => {
    const sortedFin = [...financeiros].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
    const sortedAv = [...avancos].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
    const ultimoFinanceiro = sortedFin[sortedFin.length - 1];
    const ultimoAvanco = sortedAv[sortedAv.length - 1];
    const valorContrato = projeto?.valor_contrato || 0;
    const fatRealizado = ultimoFinanceiro?.faturamento_realizado_acumulado || 0;
    const fatPrevisto = ultimoFinanceiro?.faturamento_previsto_acumulado || 1;
    const avancoRealizado = ultimoAvanco?.avanco_realizado_acumulado || 0;
    return {
      valor_contrato: valorContrato,
      pct_faturado: valorContrato > 0 ? ((fatRealizado / valorContrato) * 100).toFixed(1) : 0,
      avanco_fisico: avancoRealizado.toFixed(1),
      aderencia: fatPrevisto > 0 ? ((fatRealizado / fatPrevisto) * 100).toFixed(1) : 0,
    };
  }, [financeiros, avancos, projeto]);

  const cards = [
    { title: "Valor do Contrato", value: `R$ ${(kpis.valor_contrato / 1000000).toFixed(1)}M`, icon: DollarSign, color: "#26405d", featured: true },
    { title: "% Faturado", value: `${kpis.pct_faturado}%`, icon: TrendingUp, color: "#c35e1e" },
    { title: "Avanço Físico", value: `${kpis.avanco_fisico}%`, icon: Percent, color: "#00a49a" },
    { title: "Aderência Financeira", value: `${kpis.aderencia}%`, icon: CheckCircle2, color: "#4CAF50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
      {cards.map((card) => (
        <Card key={card.title} className={`border-0 shadow-md ${card.featured ? "ring-2 ring-brand-primary/20" : ""}`}>
          <CardContent className={`p-4 ${card.featured ? "bg-brand-primary/5 rounded-xl" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.title}</div>
                <div className={`font-bold mt-1 ${card.featured ? "text-3xl" : "text-2xl"}`} style={{ color: card.color }}>
                  {card.value}
                </div>
              </div>
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${card.color}20` }}>
                <card.icon className={`${card.featured ? "w-7 h-7" : "w-6 h-6"}`} style={{ color: card.color }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}