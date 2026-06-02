import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import AvancoFisicoPanel from "@/components/planejamento/AvancoFisicoPanel";
import AvancoFinanceiroPanel from "@/components/planejamento/AvancoFinanceiroPanel";

// ── Avancos — container de abas Físico / Financeiro ───────────────────────────
// Espelha a estrutura de Histograma.jsx (abas coladas ao card, padrão visual unificado).

export default function Avancos() {
  const { selectedProjectId } = useProject();
  const [activeTab, setActiveTab] = useState("fisico");

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={BarChart3}
            description="Selecione um projeto na barra lateral para ver os avanços."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Abas coladas ao card — mesmo padrão do Histograma */}
        <div className="flex gap-1 border-b border-border pb-0">
          {[
            { key: "fisico",      label: "Avanço Físico" },
            { key: "financeiro",  label: "Avanço Financeiro" },
          ].map(({ key, label }) => (
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

        {activeTab === "fisico"
          ? <AvancoFisicoPanel />
          : <AvancoFinanceiroPanel />}
      </div>
    </div>
  );
}
