import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { Loader2 } from "lucide-react";
import VinculoModulosGrid from "./VinculoModulosGrid";

export default function VinculosTab({ pleito }) {
  const { selectedProjectId } = useProject();
  const projetoId = pleito.projeto_id ?? selectedProjectId;

  const pleitoComProjeto = useMemo(
    () => ({ ...pleito, projeto_id: projetoId }),
    [pleito, projetoId]
  );

  const { data: vinculos = [], isPending, isError } = useQuery({
    queryKey: ["pleito-vinculos", pleito.id],
    queryFn: () => entities.PleitoVinculo.filter({ pleito_id: pleito.id }),
    enabled: !!pleito.id,
  });

  const vinculosPorModulo = useMemo(() => {
    const mapa = {};
    for (const v of vinculos) {
      if (!mapa[v.entidade]) mapa[v.entidade] = [];
      mapa[v.entidade].push(v);
    }
    return mapa;
  }, [vinculos]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando vínculos...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-destructive text-sm">
        Erro ao carregar vínculos.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Conecte este pleito a registros de outros módulos para facilitar a análise contratual.
      </p>
      <VinculoModulosGrid pleito={pleitoComProjeto} vinculosPorModulo={vinculosPorModulo} />
    </div>
  );
}
