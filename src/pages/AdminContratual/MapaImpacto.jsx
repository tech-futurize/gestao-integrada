import React from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import MapaRegistroImpacto from "@/components/pleitos/MapaRegistroImpacto";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function MapaImpacto() {
  const { selectedProjectId } = useProject();

  const { data: incidentes = [] } = useQuery({
    queryKey: ["registros", selectedProjectId],
    queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  if (!selectedProjectId) {
    return <PageEmptyState icon={MapPin} description="Selecione um projeto na barra lateral para ver o mapa de impacto." />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <MapaRegistroImpacto incidentes={incidentes} />
      </div>
    </div>
  );
}
