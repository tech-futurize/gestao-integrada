import React from "react";
import { AlertCircle } from "lucide-react";
import ModulosResumo from "../components/dashboard/ModulosResumo";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function Dashboard() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return <PageEmptyState icon={AlertCircle} description="Selecione um projeto na barra lateral para visualizar o dashboard." />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ModulosResumo projetoId={selectedProjectId} />
      </div>
    </div>
  );
}