import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import UnidadesMedida from "./UnidadesMedida";
import Disciplinas from "./Disciplinas";
import Funcoes from "./Funcoes";
import Equipamentos from "./Equipamentos";
import Pacotes from "./Pacotes";

const TABS = [
  { key: "unidades",     label: "Unidades de Medida" },
  { key: "disciplinas",  label: "Disciplinas" },
  { key: "funcoes",      label: "Funções" },
  { key: "equipamentos", label: "Equipamentos" },
  { key: "pacotes",      label: "Pacotes" },
];

export default function Cadastros() {
  const [activeTab, setActiveTab] = useState("unidades");

  return (
    <div className="flex flex-col h-full">
      <PageHeader />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-0">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === key
                  ? "bg-card border border-b-card border-border text-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba ativa */}
        <div>
          {activeTab === "unidades"     && <UnidadesMedida asTab />}
          {activeTab === "disciplinas"  && <Disciplinas asTab />}
          {activeTab === "funcoes"      && <Funcoes asTab />}
          {activeTab === "equipamentos" && <Equipamentos asTab />}
          {activeTab === "pacotes"      && <Pacotes asTab />}
        </div>
      </div>
    </div>
  );
}
