import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const engenhariasConfig = [
  { nome: "Engenharia", angle: 0, color: "#4CAF50" },
  { nome: "Suprimentos", angle: 60, color: "#2196F3" },
  { nome: "Construção", angle: 120, color: "#9C27B0" },
  { nome: "Planejamento", angle: 180, color: "#F44336" },
  { nome: "Contratos", angle: 240, color: "#FF9800" },
  { nome: "Qualidade/SSMA", angle: 300, color: "#00BCD4" },
];

const getStatusColor = (status) => {
  const colorMap = {
    "Iniciado": "#9E9E9E",
    "Em Andamento": "#2196F3",
    "Concluído": "#4CAF50",
  };
  return colorMap[status] || "#9E9E9E";
};

export default function MandalaEngenharias({ projetoId }) {
  const { data: engenharias = [] } = useQuery({
    queryKey: ["engenharias", projetoId],
    queryFn: () => entities.Engenharia.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const totalAcoes = engenharias.length;

  const getEngenhariaStatus = (nome) => {
    const items = engenharias.filter((e) => e.nome === nome);
    if (items.length === 0) return "Iniciado";
    const concluidos = items.filter((e) => e.status === "Concluído").length;
    const emAndamento = items.filter((e) => e.status === "Em Andamento").length;
    if (concluidos === items.length) return "Concluído";
    if (emAndamento > 0 || concluidos > 0) return "Em Andamento";
    return "Iniciado";
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: "#c35e1e" }} />
          Planos de Ação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-square max-w-md mx-auto">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="45" fill="#26405d" />
            <text x="200" y="196" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Planos</text>
            <text x="200" y="210" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">de Ação</text>
            <text x="200" y="226" textAnchor="middle" fill="#c35e1e" fontSize="14" fontWeight="bold">{totalAcoes}</text>

            {engenhariasConfig.map((eng, index) => {
              const status = getEngenhariaStatus(eng.nome);
              const statusColor = getStatusColor(status);
              const nextAngle = engenhariasConfig[(index + 1) % engenhariasConfig.length].angle;
              const radius = 140;
              const innerRadius = 55;
              const startAngle = (eng.angle - 90) * (Math.PI / 180);
              const endAngle = (nextAngle - 90) * (Math.PI / 180);
              const x1 = 200 + innerRadius * Math.cos(startAngle);
              const y1 = 200 + innerRadius * Math.sin(startAngle);
              const x2 = 200 + radius * Math.cos(startAngle);
              const y2 = 200 + radius * Math.sin(startAngle);
              const x3 = 200 + radius * Math.cos(endAngle);
              const y3 = 200 + radius * Math.sin(endAngle);
              const x4 = 200 + innerRadius * Math.cos(endAngle);
              const y4 = 200 + innerRadius * Math.sin(endAngle);
              const largeArcFlag = nextAngle - eng.angle > 180 ? 1 : 0;
              const pathData = `M ${x1} ${y1} L ${x2} ${y2} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1} Z`;
              const labelAngle = (eng.angle + 30) * (Math.PI / 180);
              const labelRadius = 95;
              const labelX = 200 + labelRadius * Math.cos(labelAngle - Math.PI / 2);
              const labelY = 200 + labelRadius * Math.sin(labelAngle - Math.PI / 2);
              const shortName = eng.nome.length > 11 ? eng.nome.substring(0, 9) + "." : eng.nome;
              const count = engenharias.filter((e) => e.nome === eng.nome).length;

              return (
                <g key={eng.nome}>
                  <Link to={createPageUrl("Engenharias")}>
                    <path d={pathData} fill={statusColor} stroke="white" strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-opacity" opacity="0.85">
                      <title>{`${eng.nome}: ${count} ações`}</title>
                    </path>
                  </Link>
                  <text x={labelX} y={labelY - 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="600" className="pointer-events-none">
                    {shortName}
                  </text>
                  <text x={labelX} y={labelY + 8} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" className="pointer-events-none">
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { status: "Iniciado", color: "#9E9E9E" },
            { status: "Em Andamento", color: "#2196F3" },
            { status: "Concluído", color: "#4CAF50" },
          ].map(({ status, color }) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}