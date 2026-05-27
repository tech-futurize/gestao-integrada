import { Ruler } from "lucide-react";
import TakeOffCommodities from "@/components/planejamento/TakeOffCommodities";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";

export default function TakeOff() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1"><PageEmptyState icon={Ruler} description="Selecione um projeto no menu lateral para acessar o Take-Off." /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6">
        <TakeOffCommodities />
      </div>
    </div>
  );
}
