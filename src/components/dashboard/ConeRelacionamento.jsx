import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const estagios = [
  {
    nome: "Relações entre Potenciais Adversários",
    nivel: 1,
    cor: "#4CAF50",
    descricao: "Colaboração e negociação",
  },
  {
    nome: "Situação de Conflito Subjacente",
    nivel: 2,
    cor: "#8BC34A",
    descricao: "Problemas começam a surgir",
  },
  {
    nome: "Conflito Social Manifesto",
    nivel: 3,
    cor: "#FFC107",
    descricao: "Conflito aparente",
  },
  {
    nome: "Contenção",
    nivel: 4,
    cor: "#FF9800",
    descricao: "Tentativas de contenção",
  },
  {
    nome: "Conduta Coercitiva",
    nivel: 5,
    cor: "#FF5722",
    descricao: "Ações agressivas",
  },
  {
    nome: "Conduta Destrutiva",
    nivel: 6,
    cor: "#F44336",
    descricao: "Pior estado",
  },
];

const getEstagioFromClassificacao = (classificacao) => {
  const map = {
    Excelente: 1,
    Bom: 2,
    Neutro: 3,
    Tenso: 4,
    Crítico: 5,
  };
  return map[classificacao] || 3;
};

export default function ConeRelacionamento({ projetoId }) {
  const { data: relacionamentos = [] } = useQuery({
    queryKey: ["relacionamentos", projetoId],
    queryFn: () =>
      entities.Relacionamento.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const distribuicao = useMemo(() => {
    const dist = {};
    estagios.forEach((e) => {
      dist[e.nivel] = relacionamentos.filter(
        (r) => getEstagioFromClassificacao(r.classificacao) === e.nivel
      ).length;
    });
    return dist;
  }, [relacionamentos]);

  const estagioAtual = useMemo(() => {
    if (relacionamentos.length === 0) return 1;
    const medias = relacionamentos.map((r) =>
      getEstagioFromClassificacao(r.classificacao)
    );
    const media = medias.reduce((a, b) => a + b, 0) / medias.length;
    return Math.round(media);
  }, [relacionamentos]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: '#AE3121' }} />
          Cone de Relacionamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg viewBox="0 0 400 500" className="w-full h-full">
            {/* Cone */}
            {estagios.map((estagio, index) => {
              const y = index * 80 + 20;
              const width = 350 - index * 50;
              const x = (400 - width) / 2;
              const count = distribuicao[estagio.nivel] || 0;
              const isAtual = estagio.nivel === estagioAtual;

              return (
                <g key={estagio.nivel}>
                  <Link to={createPageUrl("Relacionamentos")}>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height="70"
                      fill={estagio.cor}
                      stroke={isAtual ? "#1B1A29" : "white"}
                      strokeWidth={isAtual ? "3" : "2"}
                      rx="8"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      opacity="0.9"
                    >
                      <title>
                        {estagio.nome}: {count} tratativas
                      </title>
                    </rect>
                  </Link>
                  <text
                    x={x + width / 2}
                    y={y + 30}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {estagio.nome}
                  </text>
                  <text
                    x={x + width / 2}
                    y={y + 48}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    className="pointer-events-none"
                  >
                    {estagio.descricao}
                  </text>
                  <text
                    x={x + width / 2}
                    y={y + 65}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {count}
                  </text>
                  {isAtual && (
                    <text
                      x={x - 15}
                      y={y + 40}
                      textAnchor="end"
                      fill="#1B1A29"
                      fontSize="24"
                      fontWeight="bold"
                    >
                      ➤
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F4B9A3' }}>
          <div className="text-sm font-medium" style={{ color: '#1B1A29' }}>
            Estágio Atual do Relacionamento:{" "}
            <span className="font-bold">
              {estagios[estagioAtual - 1]?.nome || "Indefinido"}
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-2">
            Baseado em {relacionamentos.length} tratativas registradas. O cone
            afunila conforme o relacionamento se deteriora, indicando menor
            espaço para negociação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}