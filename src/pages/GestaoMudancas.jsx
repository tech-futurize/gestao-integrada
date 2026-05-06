import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, GitBranch, BarChart2, LayoutDashboard } from "lucide-react";
import DashboardExecutivo from "../components/mudancas/DashboardExecutivo";

import MudancaKanban from "../components/mudancas/MudancaKanban";
import MudancaForm from "../components/mudancas/MudancaForm";
import MudancaTermometro from "../components/mudancas/MudancaTermometro";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function GestaoMudancas() {
  const [showForm, setShowForm] = useState(false);
  const [editingMudanca, setEditingMudanca] = useState(null);
  const queryClient = useQueryClient();
  const { selectedProjectId } = useProject();

  const { data: mudancas = [], isLoading } = useQuery({
    queryKey: ["mudancas", selectedProjectId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: projeto } = useQuery({
    queryKey: ["projeto_single", selectedProjectId],
    queryFn: async () => {
      const list = await entities.Projeto.list();
      return list.find((p) => p.id === selectedProjectId);
    },
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.MudancaContratual.create({ ...data, projeto_id: selectedProjectId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mudancas"] }); setShowForm(false); setEditingMudanca(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.MudancaContratual.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mudancas"] }); setShowForm(false); setEditingMudanca(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.MudancaContratual.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mudancas"] }),
  });

  const handleSubmit = (data) => {
    if (editingMudanca) {
      updateMutation.mutate({ id: editingMudanca.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={GitBranch} description="Selecione um projeto para gerenciar mudanças." />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-brand-primary">Gestão de Mudanças</h2>
            <p className="text-gray-600">Controle de alterações contratuais e seus impactos</p>
          </div>
          <Button onClick={() => { setEditingMudanca(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700 shadow-md">
            <Plus className="w-5 h-5 mr-2" />
            Nova Mudança
          </Button>
        </div>

        {showForm && (
          <MudancaForm
            mudanca={editingMudanca}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingMudanca(null); }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

        <Tabs defaultValue="kanban">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Workflow de Mudanças
            </TabsTrigger>
            <TabsTrigger value="termometro" className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Termômetro de Desvio
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Executivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <MudancaKanban
              mudancas={mudancas}
              isLoading={isLoading}
              onEdit={(m) => { setEditingMudanca(m); setShowForm(true); }}
              onDelete={deleteMutation.mutate}
              onUpdateStatus={(id, status) => updateMutation.mutate({ id, data: { status } })}
            />
          </TabsContent>

          <TabsContent value="termometro">
            <MudancaTermometro mudancas={mudancas} projeto={projeto} />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardExecutivo mudancas={mudancas} projeto={projeto} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}