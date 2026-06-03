import EngenhariaSection from "@/components/dashboard/sections/EngenhariaSection";
import SuprimentosSection from "@/components/dashboard/sections/SuprimentosSection";
import PlanejamentoSection from "@/components/dashboard/sections/PlanejamentoSection";
import AdmContratualSection from "@/components/dashboard/sections/AdmContratualSection";
import RiscosSection from "@/components/dashboard/sections/RiscosSection";

export default function ModulosResumo({ projetoId }) {
  return (
    <div className="space-y-5">
      {/* Engenharia + Suprimentos: lado a lado em telas grandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EngenhariaSection projetoId={projetoId} />
        <SuprimentosSection projetoId={projetoId} />
      </div>

      <PlanejamentoSection projetoId={projetoId} />
      <AdmContratualSection projetoId={projetoId} />
      <RiscosSection projetoId={projetoId} />
    </div>
  );
}
