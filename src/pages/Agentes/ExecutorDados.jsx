import { Bot } from "lucide-react";
import AgenteChat from "@/components/agentes/AgenteChat";
import PageHeader from "@/components/ui/PageHeader";

const AGENT = {
  id: "supabase-analyst-agent",
  name: "Executor de Dados",
  icon: Bot,
  iconColor: "text-blue-500",
  iconBg: "bg-blue-100 dark:bg-blue-900/30",
  description: "Consultas diretas à base de dados. Busca e retorna informações específicas do projeto.",
  color: "bg-blue-600",
  ring: "focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500",
  btnColor: "bg-blue-600 hover:bg-blue-700",
  suggestions: [
    "Quantos projetos existem no sistema?",
    "Liste os contratos ativos com seus valores.",
    "Qual é o histórico de mão de obra do mês passado?",
    "Quais são os riscos mais críticos cadastrados?",
  ],
};

export default function ExecutorDados() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-hidden">
        <AgenteChat agent={AGENT} />
      </div>
    </div>
  );
}
