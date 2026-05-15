import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import PleitoForm from "@/components/pleitos/PleitoForm";
import PleitosList from "@/components/pleitos/PleitosList";
import PleitoDetalhes from "@/components/pleitos/PleitoDetalhes";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { useToast } from "@/components/ui/use-toast";

export default function Pleitos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (msg) => toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [editingCaso, setEditingCaso] = useState(null);
  const [selectedCaso, setSelectedCaso] = useState(null);

  const { data: casos = [], isLoading } = useQuery({
    queryKey: ["casos", selectedProjectId],
    queryFn: () => entities.Caso.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Caso.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["casos"] }); setShowForm(false); setEditingCaso(null); },
    onError: (e) => onErr(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Caso.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["casos"] }); setShowForm(false); setEditingCaso(null); setSelectedCaso(null); },
    onError: (e) => onErr(e.message),
  });

  const handleSubmit = (data) => {
    const casoData = { ...data, projeto_id: selectedProjectId };
    if (editingCaso) updateMutation.mutate({ id: editingCaso.id, data: casoData });
    else createMutation.mutate(casoData);
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para gerenciar pleitos." />;
  }

  if (selectedCaso) {
    return (
      <PleitoDetalhes
        caso={selectedCaso}
        onBack={() => setSelectedCaso(null)}
        onEdit={(caso) => { setEditingCaso(caso); setShowForm(true); setSelectedCaso(null); }}
      />
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pleitos</h2>
          <Button onClick={() => { setEditingCaso(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pleito
          </Button>
        </div>

        {showForm && (
          <PleitoForm
            key={editingCaso?.id || "new-caso"}
            caso={editingCaso}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingCaso(null); }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

        <PleitosList casos={casos} isLoading={isLoading} onSelect={setSelectedCaso} />
      </div>
    </div>
  );
}
