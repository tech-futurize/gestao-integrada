import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import MedicoesList from "@/components/contratos/MedicoesList";
import MedicaoForm from "@/components/contratos/MedicaoForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import FilterBar from "@/components/ui/FilterBar";

export default function Medicoes() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [editMedicao, setEditMedicao] = useState(null);

  const { data: medicoes = [], isLoading } = useQuery({
    queryKey: ["medicoes", selectedProjectId],
    queryFn: () => entities.Medicao.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const [filtros, setFiltros] = useState({});

  const medicoesFiltradas = useMemo(() => {
    const st = filtros.status || [];
    if (st.length === 0) return medicoes || [];
    return (medicoes || []).filter(m => st.includes(m.status));
  }, [medicoes, filtros]);

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos", selectedProjectId],
    queryFn: () => entities.Contrato.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMedicao = useMutation({
    mutationFn: (data) => entities.Medicao.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medicoes"] }); setShowForm(false); },
    onError: onErr,
  });

  const updateMedicao = useMutation({
    mutationFn: ({ id, data }) => entities.Medicao.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medicoes"] }); setShowForm(false); setEditMedicao(null); },
    onError: onErr,
  });

  const deleteMedicao = useMutation({
    mutationFn: (id) => entities.Medicao.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicoes"] }),
    onError: onErr,
  });

  const handleSave = (data) => {
    if (editMedicao) updateMedicao.mutate({ id: editMedicao.id, data });
    else createMedicao.mutate({ ...data, projeto_id: selectedProjectId });
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={ClipboardList} description="Selecione um projeto no menu lateral para acessar as medições." />;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Medições</h2>
        <Button onClick={() => { setEditMedicao(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Medição
        </Button>
      </div>

      <FilterBar
        storageKey="medicoes-filtros"
        filters={[
          { key: "status", label: "Status", options: ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"] },
        ]}
        onChange={setFiltros}
      />
      <MedicoesList
        medicoes={medicoesFiltradas}
        contratos={contratos}
        isLoading={isLoading}
        onEdit={(m) => { setEditMedicao(m); setShowForm(true); }}
        onDelete={(id) => deleteMedicao.mutate(id)}
        onUpdateStatus={(id, status) => updateMedicao.mutate({ id, data: { status } })}
      />

      {showForm && (
        <MedicaoForm
          key={editMedicao?.id || "new-medicao"}
          medicao={editMedicao}
          contratos={contratos}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditMedicao(null); }}
        />
      )}
    </div>
  );
}
