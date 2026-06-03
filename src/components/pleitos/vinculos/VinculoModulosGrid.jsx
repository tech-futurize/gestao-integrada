import { MODULOS_VINCULAVEIS } from "./moduloConfig";
import VinculoModuloCard from "./VinculoModuloCard";

export default function VinculoModulosGrid({ pleito, vinculosPorModulo }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {MODULOS_VINCULAVEIS.map((modulo) => (
        <VinculoModuloCard
          key={modulo.entidade}
          pleito={pleito}
          modulo={modulo}
          vinculos={vinculosPorModulo[modulo.entidade] ?? []}
        />
      ))}
    </div>
  );
}
