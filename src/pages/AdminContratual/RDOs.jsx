import React from "react";
import { FileText } from "lucide-react";
import RDOModule from "@/components/rdo/RDOModule";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function RDOs() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return <PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para acessar os RDOs." />;
  }

  return (
    <div className="p-6 md:p-8">
      <RDOModule selectedProjectId={selectedProjectId} />
    </div>
  );
}
