import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import GanttChart from "@/components/cronograma/GanttChart";
import TarefaForm from "@/components/cronograma/TarefaForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function Cronograma() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarefa, setEditTarefa] = useState(null);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const [zoom, setZoom] = useState("semanas");

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ["tarefas", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createTarefa = useMutation({
    mutationFn: (data) => entities.TarefaCronograma.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["tarefas"]); setShowForm(false); },
  });

  const updateTarefa = useMutation({
    mutationFn: ({ id, data }) => entities.TarefaCronograma.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["tarefas"]); setShowForm(false); setEditTarefa(null); },
  });

  const deleteTarefa = useMutation({
    mutationFn: (id) => entities.TarefaCronograma.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["tarefas"]),
  });

  if (!selectedProjectId) {
    return <PageEmptyState icon={Calendar} description="Selecione um projeto no menu lateral para acessar o cronograma." />;
  }

  const today = new Date();
  const atrasadas = tarefas.filter(t => {
    if (!t.data_fim_planejada || t.tipo === "Resumo") return false;
    return new Date(t.data_fim_planejada) < today && (t.avanco_realizado || 0) < 100;
  });
  const emAndamento = tarefas.filter(t => (t.avanco_realizado || 0) > 0 && (t.avanco_realizado || 0) < 100);
  const concluidas = tarefas.filter(t => (t.avanco_realizado || 0) >= 100);
  const criticas = tarefas.filter(t => t.caminho_critico);

  const handleSave = (data) => {
    if (editTarefa) updateTarefa.mutate({ id: editTarefa.id, data });
    else createTarefa.mutate({ ...data, projeto_id: selectedProjectId });
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Tarefas", value: tarefas.filter(t => t.tipo !== "Resumo").length, icon: Calendar, color: "#26405d" },
          { label: "Em Andamento", value: emAndamento.length, icon: Clock, color: "#3b82f6" },
          { label: "Concluídas", value: concluidas.length, icon: CheckCircle, color: "#00a49a" },
          { label: "Atrasadas", value: atrasadas.length, icon: AlertTriangle, color: "#ef4444" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-brand-primary">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {["dias", "semanas"].map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${zoom === z ? "bg-brand-primary text-white" : "text-gray-500"}`}
              >
                {z.charAt(0).toUpperCase() + z.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCritical(!showCritical)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={showCritical ? { backgroundColor: "#ef444420", borderColor: "#ef4444", color: "#ef4444" } : { borderColor: "#e5e7eb", color: "#6b7280" }}
          >
            Caminho Crítico
          </button>
          <button
            onClick={() => setShowBaseline(!showBaseline)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={showBaseline ? { backgroundColor: "#3b82f620", borderColor: "#3b82f6", color: "#3b82f6" } : { borderColor: "#e5e7eb", color: "#6b7280" }}
          >
            Baseline
          </button>
        </div>

      </div>

      <GanttChart
        tarefas={tarefas}
        isLoading={isLoading}
        zoom={zoom}
        showBaseline={showBaseline}
        showCritical={showCritical}
        onEdit={(t) => { setEditTarefa(t); setShowForm(true); }}
        onDelete={(id) => deleteTarefa.mutate(id)}
        onUpdateAvanco={(id, avanco) => updateTarefa.mutate({ id, data: { avanco_realizado: avanco } })}
      />

      {showForm && (
        <TarefaForm
          tarefa={editTarefa}
          tarefas={tarefas}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarefa(null); }}
        />
      )}
    </div>
  );
}