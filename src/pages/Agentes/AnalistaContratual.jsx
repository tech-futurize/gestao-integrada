import { Scale } from "lucide-react";
import AgenteChat from "@/components/agentes/AgenteChat";

const AGENT = {
  id: "contractual-analyst-agent",
  name: "Analista Contratual",
  icon: Scale,
  iconColor: "text-emerald-500",
  iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
  description: "Elabora respostas formais a cartas de notificação, emails e atas de reunião com base nos registros de pleitos do projeto.",
  color: "bg-emerald-600",
  ring: "focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500",
  btnColor: "bg-emerald-600 hover:bg-emerald-700",
  suggestions: [
    "Quero elaborar uma resposta a uma carta de notificação sobre atraso.",
    "Preciso redigir um email formal sobre o pleito de variação de quantitativos.",
    "Me ajude a responder a ata de reunião mais recente.",
    "Liste os pleitos abertos para eu escolher qual responder.",
  ],
};

export default function AnalistaContratual() {
  return <AgenteChat agent={AGENT} />;
}
