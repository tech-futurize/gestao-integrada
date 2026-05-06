import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const camadas = [
  {
    numero: 1,
    nome: "Camada 1",
    descricao: "Atividades Rotineiras",
    cor: "#F4B9A3",
  },
  {
    numero: 2,
    nome: "Camada 2",
    descricao: "Execução Operacional",
    cor: "#E88A75",
  },
  { 
    numero: 3, 
    nome: "Camada 3", 
    descricao: "Ações Táticas", 
    cor: "#D45B47" 
  },
  {
    numero: 4,
    nome: "Camada 4",
    descricao: "Decisões de Gestão",
    cor: "#AE3121",
  },
  {
    numero: 5,
    nome: "Camada 5",
    descricao: "Ações Estratégicas de Longo Prazo",
    cor: "#1B1A29",
  },
];

export default function PiramideEstrategia({ projetoId }) {
  const { data: acoes = [] } = useQuery({
    queryKey: ["acoes", projetoId],
    queryFn: async () => {
      const casos = await entities.Caso.filter({ projeto_id: projetoId });
      const todasAcoes = await entities.Acao.list();
      const casosIds = casos.map((c) => c.id);
      return todasAcoes.filter((a) => casosIds.includes(a.caso_id));
    },
    enabled: !!projetoId,
  });

  const distribuicao = useMemo(() => {
    const dist = {};
    camadas.forEach((c) => {
      dist[c.numero] = acoes.filter((a) => a.marca_causa === c.nome).length;
    });
    return dist;
  }, [acoes]);

  const totalAcoes = acoes.length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" style={{ color: '#AE3121' }} />
          Estratégia e Marca de Causa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {camadas.map((camada, index) => {
            const count = distribuicao[camada.numero] || 0;
            const percentage =
              totalAcoes > 0 ? ((count / totalAcoes) * 100).toFixed(1) : 0;
            const width = 100 - (4 - index) * 15;

            return (
              <Link key={camada.numero} to={createPageUrl("Casos")}>
                <div
                  className="relative cursor-pointer hover:opacity-90 transition-all rounded-lg overflow-hidden"
                  style={{
                    width: `${width}%`,
                    marginLeft: `${(100 - width) / 2}%`,
                    backgroundColor: camada.cor,
                    minHeight: "60px",
                  }}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">
                        {camada.nome}
                      </div>
                      <div className="text-white text-xs opacity-80 mt-1">
                        {camada.descricao}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {count}
                      </div>
                      <div className="text-xs text-white opacity-80">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Total de Ações:</span>
              <span className="font-bold" style={{ color: '#1B1A29' }}>
                {totalAcoes}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              A pirâmide representa a distribuição estratégica das ações por
              camada de atuação, permitindo visualizar onde os esforços estão
              concentrados.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}