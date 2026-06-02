import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Save } from "lucide-react";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";

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

  const handleSubmit = () => {
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
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={CalendarDays}
      title={tarefa ? "Editar Tarefa" : "Nova Tarefa"}
      subtitle={tarefa?.codigo_wbs ? `WBS ${tarefa.codigo_wbs}` : "Preencha os dados da atividade"}
      variant="bar-top"
      maxWidth="max-w-xl"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="save" onClick={handleSubmit}>
            <Save className="w-3.5 h-3.5" />
            {tarefa ? "Atualizar" : "Criar Tarefa"}
          </Button>
        </>
      }
    >
      <SectionDivider label="Identificação" />

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

      <SectionDivider label="Planejamento" />

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

      <SectionDivider label="Execução" />

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

      <SectionDivider label="Classificação" />

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

      <div className="flex items-center gap-2">
        <input type="checkbox" id="cc" checked={form.caminho_critico} onChange={e => set("caminho_critico", e.target.checked)} className="w-4 h-4 accent-red-500" />
        <Label htmlFor="cc" className="cursor-pointer text-xs">Caminho Crítico</Label>
      </div>
    </FormDialog>
  );
}
