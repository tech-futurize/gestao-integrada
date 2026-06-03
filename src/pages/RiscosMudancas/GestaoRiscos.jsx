import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import PlanoAcao from "@/components/riscos/PlanoAcao";
import RiscosPanel from "@/components/riscos/RiscosPanel";

export default function GestaoRiscos() {
  const { selectedProjectId } = useProject();
  const [tab, setTab] = useState("ameacas");

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={ShieldAlert} description="Selecione um projeto para ver a gestão de riscos." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-0 px-6 pt-4">
        {[
          { key: "ameacas",      label: "Ameaças"      },
          { key: "oportunidades", label: "Oportunidades" },
          { key: "plano-acao",   label: "Plano de Ação" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === key
                ? "bg-card border border-b-card border-border text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "ameacas"       && <RiscosPanel projectId={selectedProjectId} classificacao="Ameaça"       />}
      {tab === "oportunidades" && <RiscosPanel projectId={selectedProjectId} classificacao="Oportunidade" />}
      {tab === "plano-acao"    && <PlanoAcao   projectId={selectedProjectId} />}
    </div>
  );
}
