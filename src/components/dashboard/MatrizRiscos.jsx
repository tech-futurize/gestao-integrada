import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Grid3x3 } from "lucide-react";

const niveis = ["Baixa", "Média", "Alta"];

const getCellStyle = (prob, grav) => {
  const colorMap = {
    "Alta-Baixa": { bg: "#FFF9C4", text: "#795548" },
    "Alta-Média": { bg: "#EF9A9A", text: "#B71C1C" },
    "Alta-Alta": { bg: "#B71C1C", text: "#ffffff" },
    "Média-Baixa": { bg: "#A5D6A7", text: "#1B5E20" },
    "Média-Média": { bg: "#FFB74D", text: "#BF360C" },
    "Média-Alta": { bg: "#EF9A9A", text: "#B71C1C" },
    "Baixa-Baixa": { bg: "#C8E6C9", text: "#1B5E20" },
    "Baixa-Média": { bg: "#A5D6A7", text: "#1B5E20" },
    "Baixa-Alta": { bg: "#FFF9C4", text: "#795548" },
  };
  return colorMap[`${prob}-${grav}`] || { bg: "#F5F5F5", text: "#616161" };
};

export default function MatrizRiscos({ projetoId }) {
  const { data: incidentes = [] } = useQuery({
    queryKey: ["incidentes", projetoId],
    queryFn: () => entities.Incidente.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5" style={{ color: "#c35e1e" }} />
          Matriz Probabilidade × Impacto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[280px]">
            <div className="grid grid-cols-4 gap-1 text-xs mb-1">
              <div />
              {niveis.map((n) => (
                <div key={n} className="text-center font-bold text-gray-600 py-1 bg-gray-100 rounded">
                  {n}
                </div>
              ))}
            </div>
            {[...niveis].reverse().map((prob) => (
              <div key={prob} className="grid grid-cols-4 gap-1 mb-1">
                <div className="font-bold text-gray-600 text-xs flex items-center justify-center bg-gray-100 rounded px-1">
                  {prob}
                </div>
                {niveis.map((grav) => {
                  const count = incidentes.filter((i) => i.probabilidade === prob && i.gravidade === grav).length;
                  const { bg, text } = getCellStyle(prob, grav);
                  return (
                    <div
                      key={`${prob}-${grav}`}
                      className="rounded flex items-center justify-center h-14 font-bold text-lg"
                      style={{ backgroundColor: bg, color: text }}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="text-center text-xs text-gray-400 mt-2">← Impacto →</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:"#B71C1C"}} /><span>Extremo</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:"#EF9A9A"}} /><span>Crítico</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:"#FFB74D"}} /><span>Alto</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:"#FFF9C4"}} /><span>Moderado</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:"#C8E6C9"}} /><span>Baixo</span></div>
        </div>
      </CardContent>
    </Card>
  );
}