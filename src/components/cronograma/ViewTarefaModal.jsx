import React from "react";
import { X, CalendarDays } from "lucide-react";

const ACCENT = "#6366f1";

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T00:00:00");
  return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function SectionDivider({ label, color }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      <div className="flex-1 h-px bg-border" />
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-6 px-4">
      <div className="w-full max-w-xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col my-auto">

        {/* Barra colorida + cabeçalho */}
        <div className="h-1.5 w-full" style={{ backgroundColor: ACCENT }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}20` }}>
              <CalendarDays className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-base font-bold text-foreground leading-tight">Detalhe da Tarefa</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {tarefa.codigo_wbs ? `WBS ${tarefa.codigo_wbs}` : "Visualização somente-leitura"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge avanco_realizado={tarefa.avanco_realizado} avanco_previsto={tarefa.avanco_previsto} />
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-4 overflow-y-auto">

          <SectionDivider label="Identificação" color="#6366f1" />
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

          <SectionDivider label="Planejamento (Previsto)" color="#3b82f6" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Início Previsto" value={fmtDate(tarefa.data_inicio_planejada)} />
            <Field label="Término Previsto" value={fmtDate(tarefa.data_fim_planejada)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Avanço Previsto" value={`${tarefa.avanco_previsto ?? 0}%`} />
          </div>

          <SectionDivider label="Baseline" color="#8b5cf6" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Início BL" value={fmtDate(tarefa.data_inicio_baseline)} />
            <Field label="Término BL" value={fmtDate(tarefa.data_fim_baseline)} />
          </div>

          <SectionDivider label="Execução (Real)" color="#10b981" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Início Real" value={fmtDate(tarefa.data_inicio_real)} />
            <Field label="Término Real" value={fmtDate(tarefa.data_fim_real)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Avanço Realizado" value={`${tarefa.avanco_realizado ?? 0}%`} />
          </div>

          <SectionDivider label="Outros" color="#f59e0b" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Responsável" value={tarefa.responsavel} />
            <Field label="Predecessoras" value={tarefa.predecessoras} />
          </div>

          {/* Barra de progresso */}
          <div className="pt-2 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Previsto: {tarefa.avanco_previsto ?? 0}%</span>
              <span>Realizado: {tarefa.avanco_realizado ?? 0}%</span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div className="absolute h-full rounded-full bg-muted-foreground/30" style={{ width: `${Math.min(tarefa.avanco_previsto ?? 0, 100)}%` }} />
              <div className="absolute h-full rounded-full" style={{ width: `${Math.min(tarefa.avanco_realizado ?? 0, 100)}%`, backgroundColor: (tarefa.avanco_realizado ?? 0) >= (tarefa.avanco_previsto ?? 0) ? "#16a34a" : "#ef4444" }} />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
