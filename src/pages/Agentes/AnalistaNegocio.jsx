import React from "react";
import { BrainCircuit } from "lucide-react";
import AgenteChat from "@/components/agentes/AgenteChat";

const AGENT = {
  id: "business-analyst-agent",
  name: "Analista de Negócio",
  icon: BrainCircuit,
  iconColor: "text-indigo-500",
  iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
  description: "Análises comparativas e históricas. Refina os parâmetros da solicitação antes de executar para entregar análises direcionadas e objetivas.",
  color: "bg-indigo-600",
  ring: "focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400",
  btnColor: "bg-indigo-600 hover:bg-indigo-700",
  suggestions: [
    "Como está o desempenho do histograma de mão de obra no último mês?",
    "Quais contratos estão com prazo vencido ou próximo do vencimento?",
    "Compare o avanço físico planejado vs realizado nas últimas 4 semanas.",
    "Quais são os riscos críticos abertos há mais tempo?",
  ],
};

export default function AnalistaNegocio() {
  return <AgenteChat agent={AGENT} />;
}
