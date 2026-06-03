import { MODULOS_VINCULAVEIS } from "./moduloConfig";
import VinculoModuloCard from "./VinculoModuloCard";

export default function VinculoModulosGrid({ pleito, vinculosPorModulo }) {
  return (
    <div className="space-y-3">
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
