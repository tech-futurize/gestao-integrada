import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Settings } from "lucide-react";

const categorias = ["Engenharia", "Suprimentos", "Construção", "Planejamento", "Contratos", "Qualidade/SSMA"];

export default function GraficoPlanosAcao({ projetoId }) {
  const { data: engenharias = [] } = useQuery({
    queryKey: ["engenharias", projetoId],
    queryFn: () => entities.Engenharia.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const dadosGrafico = useMemo(() => {
    return categorias.map((cat) => ({
      categoria: cat.length > 11 ? cat.substring(0, 10) + "." : cat,
      fullName: cat,
      Iniciado: engenharias.filter((e) => e.nome === cat && e.status === "Iniciado").length,
      "Em Andamento": engenharias.filter((e) => e.nome === cat && e.status === "Em Andamento").length,
      Concluído: engenharias.filter((e) => e.nome === cat && e.status === "Concluído").length,
    }));
  }, [engenharias]);

  const total = engenharias.length;
  const emAberto = engenharias.filter((e) => e.status !== "Concluído").length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" style={{ color: "#c35e1e" }} />
            Planos de Ação por Categoria
          </div>
          <div className="text-sm font-normal text-gray-500">
            {emAberto} em aberto / {total} total
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dadosGrafico} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="categoria" width={85} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Iniciado" fill="#9E9E9E" stackId="a" />
            <Bar dataKey="Em Andamento" fill="#2196F3" stackId="a" />
            <Bar dataKey="Concluído" fill="#4CAF50" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}