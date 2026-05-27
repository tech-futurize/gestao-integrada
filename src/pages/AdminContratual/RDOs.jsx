import { FileText } from "lucide-react";
import RDOModule from "@/components/rdo/RDOModule";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";

export default function RDOs() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1"><PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para acessar os RDOs." /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <RDOModule selectedProjectId={selectedProjectId} />
      </div>
    </div>
  );
}
