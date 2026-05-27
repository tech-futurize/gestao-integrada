import React from "react";
import { AlertCircle } from "lucide-react";
import ModulosResumo from "@/components/dashboard/ModulosResumo";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";

export default function Dashboard() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={AlertCircle}
            description="Selecione um projeto na barra lateral para visualizar o dashboard."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <ModulosResumo projetoId={selectedProjectId} />
        </div>
      </div>
    </div>
  );
}