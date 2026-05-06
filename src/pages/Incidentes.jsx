import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, AlertTriangle, MapPin, FileText } from "lucide-react";

import IncidenteForm from "../components/incidentes/IncidenteForm";
import IncidentesList from "../components/incidentes/IncidentesList";
import RDOsList from "../components/incidentes/RDOsList";
import MapaRegistroImpacto from "../components/incidentes/MapaRegistroImpacto";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

export default function Incidentes() {
  const [showForm, setShowForm] = useState(false);
  const [editingIncidente, setEditingIncidente] = useState(null);
  const queryClient = useQueryClient();
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const { data: incidentes = [], isLoading } = useQuery({
    queryKey: ["incidentes", selectedProjectId],
    queryFn: () => entities.Incidente.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: casos = [] } = useQuery({
    queryKey: ["casos", selectedProjectId],
    queryFn: () => entities.Caso.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Incidente.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["incidentes"] }); setShowForm(false); setEditingIncidente(null); },
    onError: onErr,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Incidente.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["incidentes"] }); setShowForm(false); setEditingIncidente(null); },
    onError: onErr,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Incidente.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidentes"] }),
    onError: onErr,
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
    onError: onErr,
  });

  const handleSubmit = (data) => {
    const payload = { ...data, projeto_id: selectedProjectId };
    if (editingIncidente) {
      updateMutation.mutate({ id: editingIncidente.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={AlertTriangle} description="Selecione um projeto na barra lateral para gerenciar registros." />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {showForm && (
          <IncidenteForm
            key={editingIncidente?.id || "new"}
            incidente={editingIncidente}
            casos={casos}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingIncidente(null); }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

        <Tabs defaultValue="lista">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="lista" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Lista de Registros
              </TabsTrigger>
              <TabsTrigger value="rdos" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                RDOs
              </TabsTrigger>
              <TabsTrigger value="mapa" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Mapa de Registro × Impacto
              </TabsTrigger>
            </TabsList>
            <Button onClick={() => { setEditingIncidente(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700 shadow-md">
              <Plus className="w-5 h-5 mr-2" />
              Novo Registro
            </Button>
          </div>

          <TabsContent value="lista">
            <IncidentesList
              incidentes={incidentes.filter(i => i.tipo_registro !== "RDO")}
              casos={casos}
              isLoading={isLoading}
              onEdit={(inc) => { setEditingIncidente(inc); setShowForm(true); }}
              onDelete={deleteMutation.mutate}
              onCriarCaso={criarCasoMutation.mutate}
              isCriandoCaso={criarCasoMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="rdos">
            <RDOsList
              rdos={incidentes.filter(i => i.tipo_registro === "RDO")}
              casos={casos}
              isLoading={isLoading}
              onEdit={(inc) => { setEditingIncidente(inc); setShowForm(true); }}
              onDelete={deleteMutation.mutate}
              onCriarCaso={criarCasoMutation.mutate}
              isCriandoCaso={criarCasoMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="mapa">
            <MapaRegistroImpacto incidentes={incidentes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}