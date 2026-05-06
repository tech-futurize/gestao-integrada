import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

import { Plus, FileText, AlertTriangle, MapPin, ClipboardList } from "lucide-react";

import CasoForm from "../components/casos/CasoForm";
import CasosList from "../components/casos/CasosList";
import CasoDetalhes from "../components/casos/CasoDetalhes";
import IncidenteForm from "../components/incidentes/IncidenteForm";
import IncidentesList from "../components/incidentes/IncidentesList";
import RDOsList from "../components/incidentes/RDOsList";
import MapaRegistroImpacto from "../components/incidentes/MapaRegistroImpacto";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function Casos() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("pleitos");
  const [editingCaso, setEditingCaso] = useState(null);
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [showIncidenteForm, setShowIncidenteForm] = useState(false);
  const [editingIncidente, setEditingIncidente] = useState(null);
  const queryClient = useQueryClient();
  const { selectedProjectId } = useProject();
  const { toast } = useToast();

  const { data: casos = [], isLoading } = useQuery({
    queryKey: ["casos", selectedProjectId],
    queryFn: () => entities.Caso.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: incidentes = [], isLoading: loadingIncidentes } = useQuery({
    queryKey: ["incidentes", selectedProjectId],
    queryFn: () => entities.Incidente.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const onErr = (msg) => toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });

  const createCasoMutation = useMutation({
    mutationFn: (data) => entities.Caso.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["casos"] }); setShowForm(false); setEditingCaso(null); },
    onError: (e) => onErr(e.message),
  });

  const updateCasoMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Caso.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["casos"] }); setShowForm(false); setEditingCaso(null); setSelectedCaso(null); },
    onError: (e) => onErr(e.message),
  });

  const createIncidenteMutation = useMutation({
    mutationFn: (data) => entities.Incidente.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["incidentes"] }); setShowIncidenteForm(false); setEditingIncidente(null); },
    onError: (e) => onErr(e.message),
  });

  const updateIncidenteMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Incidente.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["incidentes"] }); setShowIncidenteForm(false); setEditingIncidente(null); },
    onError: (e) => onErr(e.message),
  });

  const deleteIncidenteMutation = useMutation({
    mutationFn: (id) => entities.Incidente.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidentes"] }),
    onError: (e) => onErr(e.message),
  });

  const criarCasoMutation = useMutation({
    mutationFn: async (incidente) => {
      const novoCaso = await entities.Caso.create({
        projeto_id: incidente.projeto_id,
        titulo: `Pleito: ${(incidente.descricao || incidente.ocorrencias || "Novo Pleito").substring(0, 50)}`,
        descricao_problema: incidente.descricao || incidente.ocorrencias || "",
        data_abertura: new Date().toISOString().split("T")[0],
        status: "Aberto",
        responsavel: incidente.responsavel_registro,
        prioridade: "Média",
      });
      await entities.Incidente.update(incidente.id, { caso_id: novoCaso.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      queryClient.invalidateQueries({ queryKey: ["casos"] });
    },
    onError: (e) => onErr(e.message),
  });

  const handleSubmitCaso = (data) => {
    const casoData = { ...data, projeto_id: selectedProjectId };
    if (editingCaso) updateCasoMutation.mutate({ id: editingCaso.id, data: casoData });
    else createCasoMutation.mutate(casoData);
  };

  const handleSubmitIncidente = (data) => {
    const payload = { ...data, projeto_id: selectedProjectId };
    if (editingIncidente) updateIncidenteMutation.mutate({ id: editingIncidente.id, data: payload });
    else createIncidenteMutation.mutate(payload);
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para gerenciar pleitos." />;
  }

  if (selectedCaso) {
    return (
      <CasoDetalhes
        caso={selectedCaso}
        onBack={() => setSelectedCaso(null)}
        onEdit={(caso) => { setEditingCaso(caso); setShowForm(true); setSelectedCaso(null); }}
      />
    );
  }


  const tabs = [
    { value: "pleitos", label: "Pleitos", icon: <FileText className="w-4 h-4" /> },
    { value: "registros", label: "Registros", icon: <AlertTriangle className="w-4 h-4" /> },
    { value: "rdos", label: "RDOs", icon: <ClipboardList className="w-4 h-4" /> },
    { value: "mapa", label: "Mapa de Impacto", icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tab bar + action button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          {activeTab === "pleitos" && (
            <Button onClick={() => { setEditingCaso(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700 shadow-md">
              <Plus className="w-5 h-5 mr-2" />Novo Pleito
            </Button>
          )}
          {activeTab === "registros" && (
            <Button onClick={() => { setEditingIncidente(null); setShowIncidenteForm(true); }} className="bg-green-600 hover:bg-green-700 shadow-md">
              <Plus className="w-5 h-5 mr-2" />Novo Registro
            </Button>
          )}
          {activeTab === "rdos" && (
            <Button onClick={() => { setEditingIncidente(null); setShowIncidenteForm(true); }} className="bg-green-600 hover:bg-green-700 shadow-md">
              <Plus className="w-5 h-5 mr-2" />Novo RDO
            </Button>
          )}
        </div>

        {activeTab === "pleitos" && (
          <div className="space-y-4">
            {showForm && (
              <CasoForm
                key={editingCaso?.id || "new-caso"}
                caso={editingCaso}
                onSubmit={handleSubmitCaso}
                onCancel={() => { setShowForm(false); setEditingCaso(null); }}
                isSubmitting={createCasoMutation.isPending || updateCasoMutation.isPending}
              />
            )}
            <CasosList casos={casos} isLoading={isLoading} onSelect={setSelectedCaso} />
          </div>
        )}

        {activeTab === "registros" && (
          <div className="space-y-4">
            {showIncidenteForm && (
              <IncidenteForm
                key={editingIncidente?.id || "new-incidente"}
                incidente={editingIncidente}
                casos={casos}
                onSubmit={handleSubmitIncidente}
                onCancel={() => { setShowIncidenteForm(false); setEditingIncidente(null); }}
                isSubmitting={createIncidenteMutation.isPending || updateIncidenteMutation.isPending}
              />
            )}
            <IncidentesList
              incidentes={incidentes.filter(i => i.tipo_registro !== "RDO")}
              casos={casos}
              isLoading={loadingIncidentes}
              onEdit={(inc) => { setEditingIncidente(inc); setShowIncidenteForm(true); }}
              onDelete={deleteIncidenteMutation.mutate}
              onCriarCaso={criarCasoMutation.mutate}
              isCriandoCaso={criarCasoMutation.isPending}
            />
          </div>
        )}

        {activeTab === "rdos" && (
          <div className="space-y-4">
            {showIncidenteForm && (
              <IncidenteForm
                key={editingIncidente?.id || "new-incidente"}
                incidente={editingIncidente}
                casos={casos}
                onSubmit={handleSubmitIncidente}
                onCancel={() => { setShowIncidenteForm(false); setEditingIncidente(null); }}
                isSubmitting={createIncidenteMutation.isPending || updateIncidenteMutation.isPending}
              />
            )}
            <RDOsList
              rdos={incidentes.filter(i => i.tipo_registro === "RDO")}
              casos={casos}
              isLoading={loadingIncidentes}
              onEdit={(inc) => { setEditingIncidente(inc); setShowIncidenteForm(true); }}
              onDelete={deleteIncidenteMutation.mutate}
              onCriarCaso={criarCasoMutation.mutate}
              isCriandoCaso={criarCasoMutation.isPending}
            />
          </div>
        )}

        {activeTab === "mapa" && (
          <MapaRegistroImpacto incidentes={incidentes} />
        )}
      </div>
    </div>
  );
}