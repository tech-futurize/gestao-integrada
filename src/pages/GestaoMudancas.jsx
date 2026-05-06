import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, GitBranch, LayoutDashboard, LayoutGrid, LayoutList } from "lucide-react";
import DashboardExecutivo from "../components/mudancas/DashboardExecutivo";
import MudancaKanban from "../components/mudancas/MudancaKanban";
import MudancaForm from "../components/mudancas/MudancaForm";
import MudancaTermometro from "../components/mudancas/MudancaTermometro";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

export default function GestaoMudancas() {
  const [showForm, setShowForm] = useState(false);
  const [editingMudanca, setEditingMudanca] = useState(null);
  const [viewMode, setViewMode] = useState("kanban");
  const [activeTab, setActiveTab] = useState("workflow");
  const queryClient = useQueryClient();
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

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
    onError: onErr,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.MudancaContratual.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mudancas"] }); setShowForm(false); setEditingMudanca(null); },
    onError: onErr,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.MudancaContratual.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mudancas"] }),
    onError: onErr,
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
        {showForm && (
          <MudancaForm
            key={editingMudanca?.id || "new-mudanca"}
            mudanca={editingMudanca}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingMudanca(null); }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Executivo
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              {activeTab === "workflow" && (
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === "kanban"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode("lista")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === "lista"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                    Lista
                  </button>
                </div>
              )}
              <Button onClick={() => { setEditingMudanca(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700 shadow-md">
                <Plus className="w-5 h-5 mr-2" />
                Nova Mudança
              </Button>
            </div>
          </div>

          <TabsContent value="workflow">
            {viewMode === "kanban" ? (
              <MudancaKanban
                mudancas={mudancas}
                isLoading={isLoading}
                onEdit={(m) => { setEditingMudanca(m); setShowForm(true); }}
                onDelete={deleteMutation.mutate}
                onUpdateStatus={(id, status) => updateMutation.mutate({ id, data: { status } })}
              />
            ) : (
              <MudancaTermometro mudancas={mudancas} projeto={projeto} />
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardExecutivo mudancas={mudancas} projeto={projeto} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
