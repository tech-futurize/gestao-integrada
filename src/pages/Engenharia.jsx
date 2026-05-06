import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, LayoutGrid, BarChart2 } from "lucide-react";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/lib/ProjectContext";
import DocGrid from "../components/engenharia/DocGrid";
import DocKanban from "../components/engenharia/DocKanban";
import DocDetalhe from "../components/engenharia/DocDetalhe";
import DocDashboard from "../components/engenharia/DocDashboard";

export default function Engenharia() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [view, setView] = useState("grid"); // grid | kanban
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState("docs");

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["docs-engenharia", selectedProjectId],
    queryFn: () => entities.DocumentoEngenharia.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.DocumentoEngenharia.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(["docs-engenharia"]),
  });

  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
    if (selectedDoc && selectedDoc.id === id) {
      setSelectedDoc(prev => ({ ...prev, ...data }));
    }
  };

  const handleMoveDoc = (id, novaEtapa) => {
    handleUpdate(id, { etapa: novaEtapa });
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={BarChart3} description="Selecione um projeto no menu lateral para visualizar documentos de engenharia." />;
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-full mx-auto space-y-4">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-full mx-auto space-y-6">
        {selectedDoc ? (
          <DocDetalhe
            doc={selectedDoc}
            onBack={() => setSelectedDoc(null)}
            onUpdate={handleUpdate}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="docs" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />Documentos
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />Dashboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="docs">
              {view === "grid" ? (
                <DocGrid
                  docs={docs}
                  onSelectDoc={setSelectedDoc}
                  onSwitchView={setView}
                />
              ) : (
                <DocKanban
                  docs={docs}
                  onSelectDoc={setSelectedDoc}
                  onSwitchView={setView}
                  onMoveDoc={handleMoveDoc}
                />
              )}
            </TabsContent>

            <TabsContent value="dashboard">
              <DocDashboard docs={docs} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}