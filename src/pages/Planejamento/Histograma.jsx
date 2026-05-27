import HistogramaEquipamentos from "@/components/histograma/HistogramaEquipamentos";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { BarChart3 } from "lucide-react";

export default function Histograma() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return <PageEmptyState icon={BarChart3} description="Selecione um projeto na barra lateral para ver o histograma de equipamentos." />;
  }

  return (
    <div className="p-6">
      <HistogramaEquipamentos />
    </div>
  );
}
