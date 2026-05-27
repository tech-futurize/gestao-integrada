import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Save, X } from "lucide-react";

const ACCENT = "#6366f1"; // indigo — identidade do módulo de planejamento

function SectionDivider({ label, color }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function TarefaForm({ tarefa, tarefas, onSave, onClose }) {
  const [form, setForm] = useState({
    codigo_wbs: "", nome: "", tipo: "Atividade", pai_id: null,
    data_inicio_planejada: "", data_fim_planejada: "",
    data_inicio_baseline: "", data_fim_baseline: "",
    data_inicio_real: "", data_fim_real: "",
    area: "", disciplina: "",
    responsavel: "", predecessoras: "",
    ...tarefa,
    avanco_previsto: tarefa?.avanco_previsto ?? 0,
    avanco_realizado: tarefa?.avanco_realizado ?? 0,
    nivel: tarefa?.nivel ?? 1,
    caminho_critico: tarefa?.caminho_critico ?? false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      pai_id: form.pai_id || null,
      nivel: parseInt(form.nivel) || 1,
      avanco_previsto: parseFloat(form.avanco_previsto) || 0,
      avanco_realizado: parseFloat(form.avanco_realizado) || 0,
    });
  };

  const pais = tarefas.filter(t => t.tipo === "Resumo" && t.id !== tarefa?.id);

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
              <div className="text-base font-bold text-foreground leading-tight">
                {tarefa ? "Editar Tarefa" : "Nova Tarefa"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {tarefa?.codigo_wbs ? `WBS ${tarefa.codigo_wbs}` : "Preencha os dados da atividade"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          <SectionDivider label="Identificação" color="#6366f1" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Código WBS</Label>
              <Input value={form.codigo_wbs} onChange={e => set("codigo_wbs", e.target.value)} placeholder="1.1.2" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Resumo", "Atividade", "Marco"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Nome da Tarefa *</Label>
            <Input required value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Descrição da atividade" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Tarefa Pai</Label>
              <Select value={form.pai_id || "__none__"} onValueChange={v => set("pai_id", v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma (raiz)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma (raiz)</SelectItem>
                  {pais.map(t => <SelectItem key={t.id} value={t.id}>{t.codigo_wbs ? `${t.codigo_wbs} - ` : ""}{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nível Hierárquico</Label>
              <Input type="number" min={1} max={5} value={form.nivel} onChange={e => set("nivel", e.target.value)} />
            </div>
          </div>

          <SectionDivider label="Planejamento" color="#3b82f6" />

          {form.tipo !== "Marco" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Início Planejado</Label>
                <Input type="date" value={form.data_inicio_planejada} onChange={e => set("data_inicio_planejada", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fim Planejado</Label>
                <Input type="date" value={form.data_fim_planejada} onChange={e => set("data_fim_planejada", e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Data do Marco</Label>
              <Input type="date" value={form.data_inicio_planejada} onChange={e => { set("data_inicio_planejada", e.target.value); set("data_fim_planejada", e.target.value); }} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Início Baseline</Label>
              <Input type="date" value={form.data_inicio_baseline} onChange={e => set("data_inicio_baseline", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim Baseline</Label>
              <Input type="date" value={form.data_fim_baseline} onChange={e => set("data_fim_baseline", e.target.value)} />
            </div>
          </div>

          <SectionDivider label="Execução" color="#10b981" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Início Real</Label>
              <Input type="date" value={form.data_inicio_real} onChange={e => set("data_inicio_real", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim Real</Label>
              <Input type="date" value={form.data_fim_real} onChange={e => set("data_fim_real", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Avanço Previsto (%)</Label>
              <Input type="number" min={0} max={100} value={form.avanco_previsto} onChange={e => set("avanco_previsto", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Avanço Realizado (%)</Label>
              <Input type="number" min={0} max={100} value={form.avanco_realizado} onChange={e => set("avanco_realizado", e.target.value)} />
            </div>
          </div>

          <SectionDivider label="Classificação" color="#f59e0b" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Área</Label>
              <Input value={form.area} onChange={e => set("area", e.target.value)} placeholder="Ex: Civil" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Disciplina</Label>
              <Input value={form.disciplina} onChange={e => set("disciplina", e.target.value)} placeholder="Ex: Estrutura" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Responsável</Label>
              <Input value={form.responsavel} onChange={e => set("responsavel", e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Predecessoras</Label>
              <Input value={form.predecessoras} onChange={e => set("predecessoras", e.target.value)} placeholder="Ex: 1.1, 1.2" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="cc" checked={form.caminho_critico} onChange={e => set("caminho_critico", e.target.checked)} className="w-4 h-4 accent-red-500" />
            <Label htmlFor="cc" className="cursor-pointer text-xs">Caminho Crítico</Label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 bg-muted/30 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="save" onClick={handleSubmit}>
            <Save className="w-3.5 h-3.5 mr-1" />
            {tarefa ? "Atualizar" : "Criar Tarefa"}
          </Button>
        </div>
      </div>
    </div>
  );
}
