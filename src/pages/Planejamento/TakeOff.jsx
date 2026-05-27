import { Ruler } from "lucide-react";
import TakeOffCommodities from "@/components/planejamento/TakeOffCommodities";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function TakeOff() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return <PageEmptyState icon={Ruler} description="Selecione um projeto no menu lateral para acessar o Take-Off." />;
  }

  return (
    <div className="p-6">
      <TakeOffCommodities />
    </div>
  );
}
