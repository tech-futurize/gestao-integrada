import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CloseButton from "@/components/ui/CloseButton";

export default function TarefaForm({ tarefa, tarefas, onSave, onClose }) {
  const [form, setForm] = useState({
    codigo_wbs: "", nome: "", tipo: "Atividade", nivel: 1, pai_id: null,
    data_inicio_planejada: "", data_fim_planejada: "",
    data_inicio_baseline: "", data_fim_baseline: "",
    avanco_previsto: 0, avanco_realizado: 0,
    caminho_critico: false, responsavel: "", predecessoras: "",
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-foreground">{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Código WBS</Label><Input value={form.codigo_wbs} onChange={e => set("codigo_wbs", e.target.value)} placeholder="1.1.2" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Resumo", "Atividade", "Marco"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div><Label>Nome da Tarefa *</Label><Input required value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Descrição da atividade" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tarefa Pai</Label>
              <Select value={form.pai_id || "__none__"} onValueChange={v => set("pai_id", v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma (raiz)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma (raiz)</SelectItem>
                  {pais.map(t => <SelectItem key={t.id} value={t.id}>{t.codigo_wbs ? `${t.codigo_wbs} - ` : ""}{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nível Hierárquico</Label><Input type="number" min={1} max={5} value={form.nivel} onChange={e => set("nivel", e.target.value)} /></div>
          </div>

          {form.tipo !== "Marco" && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Início Planejado</Label><Input type="date" value={form.data_inicio_planejada} onChange={e => set("data_inicio_planejada", e.target.value)} /></div>
              <div><Label>Fim Planejado</Label><Input type="date" value={form.data_fim_planejada} onChange={e => set("data_fim_planejada", e.target.value)} /></div>
            </div>
          )}

          {form.tipo === "Marco" && (
            <div><Label>Data do Marco</Label><Input type="date" value={form.data_inicio_planejada} onChange={e => { set("data_inicio_planejada", e.target.value); set("data_fim_planejada", e.target.value); }} /></div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Início Baseline</Label><Input type="date" value={form.data_inicio_baseline} onChange={e => set("data_inicio_baseline", e.target.value)} /></div>
            <div><Label>Fim Baseline</Label><Input type="date" value={form.data_fim_baseline} onChange={e => set("data_fim_baseline", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Avanço Previsto (%)</Label><Input type="number" min={0} max={100} value={form.avanco_previsto} onChange={e => set("avanco_previsto", e.target.value)} /></div>
            <div><Label>Avanço Realizado (%)</Label><Input type="number" min={0} max={100} value={form.avanco_realizado} onChange={e => set("avanco_realizado", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => set("responsavel", e.target.value)} placeholder="Nome do responsável" /></div>
            <div><Label>Predecessoras</Label><Input value={form.predecessoras} onChange={e => set("predecessoras", e.target.value)} placeholder="Ex: 1.1, 1.2" /></div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="cc" checked={form.caminho_critico} onChange={e => set("caminho_critico", e.target.checked)} className="w-4 h-4" />
            <Label htmlFor="cc" className="cursor-pointer">Caminho Crítico</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="save">
              {tarefa ? "Atualizar" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}