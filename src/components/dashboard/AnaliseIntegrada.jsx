import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

export default function AnaliseIntegrada({ projetoId }) {
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

  const { data: histogramas = [] } = useQuery({
    queryKey: ["histogramas", projetoId],
    queryFn: () => entities.Histograma.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const valorContrato = projeto?.valor_contrato || 1;

  const dadosIntegrados = useMemo(() => {
    const tempDados = {};
    financeiros.forEach((f) => {
      const mesKey = format(new Date(f.mes_referencia), "yyyy-MM");
      const displayMes = format(new Date(f.mes_referencia), "MMM/yy", { locale: ptBR });
      tempDados[mesKey] = {
        mesKey,
        mes: displayMes,
        fat_previsto: valorContrato > 0 ? parseFloat(((f.faturamento_previsto_acumulado || 0) / valorContrato * 100).toFixed(1)) : 0,
        fat_realizado: valorContrato > 0 ? parseFloat(((f.faturamento_realizado_acumulado || 0) / valorContrato * 100).toFixed(1)) : 0,
        fis_previsto: 0,
        fis_realizado: 0,
      };
    });
    avancos.forEach((a) => {
      const mesKey = format(new Date(a.mes_referencia), "yyyy-MM");
      if (tempDados[mesKey]) {
        tempDados[mesKey].fis_previsto = parseFloat((a.avanco_previsto_acumulado || 0).toFixed(1));
        tempDados[mesKey].fis_realizado = parseFloat((a.avanco_realizado_acumulado || 0).toFixed(1));
      }
    });
    return Object.values(tempDados).sort((a, b) => a.mesKey.localeCompare(b.mesKey));
  }, [financeiros, avancos, valorContrato]);

  const dadosHistograma = useMemo(() => {
    return histogramas
      .map((h) => ({
        mesKey: format(new Date(h.mes_referencia), "yyyy-MM"),
        mes: format(new Date(h.mes_referencia), "MMM/yy", { locale: ptBR }),
        previsto: h.quantidade_prevista_mensal || 0,
        realizado: h.quantidade_realizada_mensal || 0,
      }))
      .sort((a, b) => a.mesKey.localeCompare(b.mesKey));
  }, [histogramas]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: "#c35e1e" }} />
          Análise Integrada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financeiro">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="financeiro">Financeiro (%)</TabsTrigger>
            <TabsTrigger value="fisico">Físico (%)</TabsTrigger>
            <TabsTrigger value="comparacao">Comparação</TabsTrigger>
            <TabsTrigger value="histograma">Histograma</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosIntegrados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="fat_previsto" stroke="#26405d" strokeWidth={2} name="Previsto" />
                <Line type="monotone" dataKey="fat_realizado" stroke="#c35e1e" strokeWidth={2} name="Realizado" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="fisico">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosIntegrados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="fis_previsto" stroke="#26405d" strokeWidth={2} name="Previsto" />
                <Line type="monotone" dataKey="fis_realizado" stroke="#c35e1e" strokeWidth={2} name="Realizado" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="comparacao">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosIntegrados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="fat_realizado" stroke="#c35e1e" strokeWidth={2} name="Faturamento %" />
                <Line type="monotone" dataKey="fis_realizado" stroke="#26405d" strokeWidth={2} name="Avanço Físico %" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="histograma">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosHistograma}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="previsto" fill="#26405d" name="Previsto" />
                <Bar dataKey="realizado" fill="#c35e1e" name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}