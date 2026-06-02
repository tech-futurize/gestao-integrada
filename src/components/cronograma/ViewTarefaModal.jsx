import { CalendarDays } from "lucide-react";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
import { formatDate } from "@/lib/dateUtils";

function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function StatusBadge({ avanco_realizado, avanco_previsto }) {
  const real = avanco_realizado ?? 0;
  const prev = avanco_previsto ?? 0;
  let label, color;
  if (real >= 100)      { label = "Concluído"; color = "#16a34a"; }
  else if (real >= prev) { label = "Em Dia";   color = "#2563eb"; }
  else                   { label = "Atrasado"; color = "#ef4444"; }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color, backgroundColor: color + "18" }}>
      {label}
    </span>
  );
}

export default function ViewTarefaModal({ tarefa, onClose }) {
  if (!tarefa) return null;
  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={CalendarDays}
      title="Detalhe da Tarefa"
      subtitle={tarefa.codigo_wbs ? `WBS ${tarefa.codigo_wbs}` : "Visualização somente-leitura"}
      variant="bar-top"
      maxWidth="max-w-xl"
      mode="view"
      onClose={onClose}
      badge={<StatusBadge avanco_realizado={tarefa.avanco_realizado} avanco_previsto={tarefa.avanco_previsto} />}
    >
      <SectionDivider label="Identificação" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Código WBS" value={tarefa.codigo_wbs} />
        <Field label="Tipo" value={tarefa.tipo} />
      </div>
      <Field label="Nome da Tarefa" value={tarefa.nome} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nível Hierárquico" value={tarefa.nivel} />
        <Field label="Caminho Crítico" value={tarefa.caminho_critico ? "Sim" : "Não"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Área" value={tarefa.area} />
        <Field label="Disciplina" value={tarefa.disciplina} />
      </div>

      <SectionDivider label="Planejamento (Previsto)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Início Previsto" value={(formatDate(tarefa.data_inicio_planejada) || "—")} />
        <Field label="Término Previsto" value={(formatDate(tarefa.data_fim_planejada) || "—")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Avanço Previsto" value={`${tarefa.avanco_previsto ?? 0}%`} />
      </div>

      <SectionDivider label="Baseline" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Início BL" value={(formatDate(tarefa.data_inicio_baseline) || "—")} />
        <Field label="Término BL" value={(formatDate(tarefa.data_fim_baseline) || "—")} />
      </div>

      <SectionDivider label="Execução (Real)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Início Real" value={(formatDate(tarefa.data_inicio_real) || "—")} />
        <Field label="Término Real" value={(formatDate(tarefa.data_fim_real) || "—")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Avanço Realizado" value={`${tarefa.avanco_realizado ?? 0}%`} />
      </div>

      <SectionDivider label="Outros" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Responsável" value={tarefa.responsavel} />
        <Field label="Predecessoras" value={tarefa.predecessoras} />
      </div>

      {/* Barra de progresso previsto vs realizado */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Previsto: {tarefa.avanco_previsto ?? 0}%</span>
          <span>Realizado: {tarefa.avanco_realizado ?? 0}%</span>
        </div>
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div className="absolute h-full rounded-full bg-muted-foreground/30" style={{ width: `${Math.min(tarefa.avanco_previsto ?? 0, 100)}%` }} />
          <div className="absolute h-full rounded-full" style={{ width: `${Math.min(tarefa.avanco_realizado ?? 0, 100)}%`, backgroundColor: (tarefa.avanco_realizado ?? 0) >= (tarefa.avanco_previsto ?? 0) ? "#16a34a" : "#ef4444" }} />
        </div>
      </div>
    </FormDialog>
  );
}
