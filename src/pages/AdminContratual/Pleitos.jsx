import { useState } from "react";
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
    return <PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para gerenciar pleitos." />;
  }

  if (selectedPleito) {
    return (
      <PleitoDetalhes
        pleito={selectedPleito}
        onBack={() => setSelectedPleito(null)}
        onEdit={(pleito) => { setEditingPleito(pleito); setShowForm(true); setSelectedPleito(null); }}
      />
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pleitos</h2>
          <Button onClick={() => { setEditingPleito(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pleito
          </Button>
        </div>

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
  );
}
