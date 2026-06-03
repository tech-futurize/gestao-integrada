import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";

export function useCategoriasImpacto() {
  const { selectedProjectId } = useProject();
  return useQuery({
    queryKey: ["categorias_impacto", selectedProjectId],
    queryFn: () => entities.CategoriaImpacto.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
    select: (data) => data.map((c) => c.nome),
  });
}
