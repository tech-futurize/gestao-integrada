import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entities } from "@/api/supabaseEntities";
import PleitoForm from "@/components/pleitos/PleitoForm";
import PleitosList from "@/components/pleitos/PleitosList";
import PleitoDetalhes from "@/components/pleitos/PleitoDetalhes";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast } from "@/components/ui/use-toast";

export default function Pleitos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (msg) => toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [editingPleito, setEditingPleito] = useState(null);
  const [selectedPleito, setSelectedPleito] = useState(null);

  const { data: casos = [], isLoading } = useQuery({
    queryKey: ["pleitos", selectedProjectId],
    queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Pleito.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pleitos"] }); setShowForm(false); setEditingPleito(null); },
    onError: (e) => onErr(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Pleito.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pleitos"] }); setShowForm(false); setEditingPleito(null); setSelectedPleito(null); },
    onError: (e) => onErr(e.message),
  });

  const handleSubmit = (data) => {
    const casoData = { ...data, projeto_id: selectedProjectId };
    if (editingPleito) updateMutation.mutate({ id: editingPleito.id, data: casoData });
    else createMutation.mutate(casoData);
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={FileText}
            description="Selecione um projeto na barra lateral para gerenciar pleitos."
          />
        </div>
      </div>
    );
  }

  if (selectedPleito) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-auto">
          <PleitoDetalhes
            pleito={selectedPleito}
            onBack={() => setSelectedPleito(null)}
            onEdit={(pleito) => { setEditingPleito(pleito); setShowForm(true); setSelectedPleito(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditingPleito(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pleito
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {showForm && (
            <PleitoForm
              key={editingPleito?.id || "new-pleito"}
              pleito={editingPleito}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingPleito(null); }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          )}

          <PleitosList casos={casos} isLoading={isLoading} onSelect={setSelectedPleito} />
        </div>
      </div>
    </div>
  );
}
