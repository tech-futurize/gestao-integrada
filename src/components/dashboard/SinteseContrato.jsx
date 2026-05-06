import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import {
  FileText, ClipboardList, AlertCircle, BookOpen,
  BarChart3, TrendingUp, DollarSign, GitBranch
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function SinteseRow({ icon: Icon, iconColor, label, value, sublabel, link }) {
  const inner = (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer">
      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${iconColor}18` }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {sublabel && <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>}
      </div>
      <div className="text-2xl font-bold flex-shrink-0" style={{ color: "#26405d" }}>{value}</div>
    </div>
  );
  return link ? <Link to={createPageUrl(link)}>{inner}</Link> : inner;
}

function AdherenceRow({ icon: Icon, iconColor, label, pct, link }) {
  const color = pct >= 90 ? "#00a49a" : pct >= 70 ? "#FB8C00" : "#F44C41";
  const inner = (
    <div className="p-3 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${iconColor}18` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 text-sm font-medium text-gray-700">{label}</div>
        <div className="text-lg font-bold" style={{ color }}>{pct}%</div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
  return link ? <Link to={createPageUrl(link)}>{inner}</Link> : inner;
}

export default function SinteseContrato({ projetoId }) {
  const { data: casos = [] } = useQuery({
    queryKey: ["casos", projetoId],
    queryFn: () => entities.Caso.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: incidentes = [] } = useQuery({
    queryKey: ["incidentes", projetoId],
    queryFn: () => entities.Incidente.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: histogramas = [] } = useQuery({
    queryKey: ["histogramas", projetoId],
    queryFn: () => entities.Histograma.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: avancos = [] } = useQuery({
    queryKey: ["avancos", projetoId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: financeiros = [] } = useQuery({
    queryKey: ["financeiros", projetoId],
    queryFn: () => entities.Financeiro.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: mudancas = [] } = useQuery({
    queryKey: ["mudancas", projetoId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const metrics = useMemo(() => {
    // Pleitos
    const pleitos = casos.length;
    const pleitosAbertos = casos.filter(c => ["Aberto", "Em Análise", "Em Andamento"].includes(c.status)).length;

    // RDOs
    const rdos = incidentes.filter(i => i.tipo_registro === "RDO").length;

    // Aderência Histograma: soma realizado / soma previsto
    const totalPrevHist = histogramas.reduce((s, h) => s + (h.quantidade_prevista_mensal || 0), 0);
    const totalRealHist = histogramas.reduce((s, h) => s + (h.quantidade_realizada_mensal || 0), 0);
    const aderenciaHist = totalPrevHist > 0 ? Math.round((totalRealHist / totalPrevHist) * 100) : null;

    // Aderência Avanço Físico: último mês acumulado real/previsto
    const sortedAv = [...avancos].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
    const ultimoAv = sortedAv[sortedAv.length - 1];
    const aderenciaAv = ultimoAv?.avanco_previsto_acumulado > 0
      ? Math.round((ultimoAv.avanco_realizado_acumulado / ultimoAv.avanco_previsto_acumulado) * 100)
      : null;

    // Aderência Financeira: faturamento real acumulado / previsto acumulado
    const sortedFin = [...financeiros].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
    const ultimoFin = sortedFin[sortedFin.length - 1];
    const aderenciaFin = ultimoFin?.faturamento_previsto_acumulado > 0
      ? Math.round((ultimoFin.faturamento_realizado_acumulado / ultimoFin.faturamento_previsto_acumulado) * 100)
      : null;

    // Mudanças
    const totalMudancas = mudancas.length;
    const mudancasAprovadas = mudancas.filter(m => m.status === "Aprovada").length;

    return { pleitos, pleitosAbertos, rdos, aderenciaHist, aderenciaAv, aderenciaFin, totalMudancas, mudancasAprovadas };
  }, [casos, incidentes, histogramas, avancos, financeiros, mudancas]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" style={{ color: "#c35e1e" }} />
          Síntese do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">

        {/* Pleitos */}
        <SinteseRow
          icon={AlertCircle} iconColor="#c35e1e"
          label="Pleitos registrados"
          value={metrics.pleitos}
          sublabel={`${metrics.pleitosAbertos} em aberto`}
          link="Pleitos"
        />

        {/* RDOs */}
        <SinteseRow
          icon={BookOpen} iconColor="#26405d"
          label="RDOs"
          value={metrics.rdos}
          sublabel="Relatórios Diários de Obra"
          link="Registros"
        />

        {/* Mudanças Contratuais */}
        <SinteseRow
          icon={GitBranch} iconColor="#6366f1"
          label="Mudanças Contratuais"
          value={metrics.totalMudancas}
          sublabel={`${metrics.mudancasAprovadas} aprovadas`}
          link="GestaoMudancas"
        />

        <div className="pt-2 border-t border-gray-100 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pb-1">Aderências</p>

          {/* Aderência Histograma */}
          {metrics.aderenciaHist !== null ? (
            <AdherenceRow icon={BarChart3} iconColor="#00a49a" label="Histograma (HH)" pct={metrics.aderenciaHist} link="Histograma" />
          ) : (
            <SinteseRow icon={BarChart3} iconColor="#00a49a" label="Histograma" value="—" sublabel="Sem dados" link="Histograma" />
          )}

          {/* Aderência Avanço Físico */}
          {metrics.aderenciaAv !== null ? (
            <AdherenceRow icon={TrendingUp} iconColor="#FB8C00" label="Avanço Físico" pct={metrics.aderenciaAv} link="AvancoFisico" />
          ) : (
            <SinteseRow icon={TrendingUp} iconColor="#FB8C00" label="Avanço Físico" value="—" sublabel="Sem dados" link="AvancoFisico" />
          )}

          {/* Aderência Financeira */}
          {metrics.aderenciaFin !== null ? (
            <AdherenceRow icon={DollarSign} iconColor="#26405d" label="Financeiro" pct={metrics.aderenciaFin} link="Financeiro" />
          ) : (
            <SinteseRow icon={DollarSign} iconColor="#26405d" label="Financeiro" value="—" sublabel="Sem dados" link="Financeiro" />
          )}
        </div>

      </CardContent>
    </Card>
  );
}