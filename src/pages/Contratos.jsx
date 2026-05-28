import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, DollarSign } from "lucide-react";
import ContratosList from "@/components/contratos/ContratosList";
import ContratoForm from "@/components/contratos/ContratoForm";
import ContratoDetalhes from "@/components/contratos/ContratoDetalhes";
import AditivoForm from "@/components/contratos/AditivoForm";
import MedicaoForm from "@/components/contratos/MedicaoForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function Contratos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const [showContratoForm, setShowContratoForm] = useState(false);
  const [editContrato, setEditContrato] = useState(null);
  const [selectedContrato, setSelectedContrato] = useState(null);

  const [showAditivoForm, setShowAditivoForm] = useState(false);
  const [editAditivo, setEditAditivo] = useState(null);

  const [showMedicaoForm, setShowMedicaoForm] = useState(false);

  // ── Contratos ──────────────────────────────────────────────────
  const { data: contratos = [], isLoading: loadingContratos, isError: errorContratos } = useQuery({
    queryKey: ["contratos", selectedProjectId],
    queryFn: () => entities.Contrato.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createContrato = useMutation({
    mutationFn: (data) => entities.Contrato.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contratos"] }); setShowContratoForm(false); },
    onError: onErr,
  });

  const updateContrato = useMutation({
    mutationFn: ({ id, data }) => entities.Contrato.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      setShowContratoForm(false);
      setEditContrato(null);
    },
    onError: onErr,
  });

  const deleteContrato = useMutation({
    mutationFn: (id) => entities.Contrato.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contratos"] }); setSelectedContrato(null); },
    onError: onErr,
  });

  // ── Aditivos (ativo quando há contrato selecionado) ───────────
  const { data: aditivos = [] } = useQuery({
    queryKey: ["aditivos", selectedContrato?.id],
    queryFn: () => entities.Aditivo.filter({ contrato_id: selectedContrato.id }),
    enabled: !!selectedContrato?.id,
  });

  const createAditivo = useMutation({
    mutationFn: (data) => entities.Aditivo.create(data),
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ["aditivos", variables.contrato_id] }); setShowAditivoForm(false); },
    onError: onErr,
  });

  const updateAditivo = useMutation({
    mutationFn: ({ id, data }) => entities.Aditivo.update(id, data),
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ["aditivos", variables.data.contrato_id] }); setShowAditivoForm(false); setEditAditivo(null); },
    onError: onErr,
  });

  const deleteAditivo = useMutation({
    mutationFn: ({ id, contratoId }) => entities.Aditivo.delete(id),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["aditivos", variables.contratoId] }),
    onError: onErr,
  });

  // ── Medições (ativo quando há contrato selecionado) ───────────
  const { data: medicoes = [] } = useQuery({
    queryKey: ["medicoes", "contrato", selectedContrato?.id],
    queryFn: () => entities.Medicao.filter({ contrato_id: selectedContrato.id }),
    enabled: !!selectedContrato?.id,
  });

  const createMedicao = useMutation({
    mutationFn: (data) => entities.Medicao.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medicoes"] }); setShowMedicaoForm(false); },
    onError: onErr,
  });

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={FileText} description="Selecione um projeto no menu lateral para acessar os contratos." />
        </div>
      </div>
    );
  }

  if (errorContratos) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={FileText} description="Erro ao carregar os contratos. Verifique sua conexão e tente novamente." />
        </div>
      </div>
    );
  }

  const totalContratado = contratos.reduce((s, c) => s + (c.valor_total || 0), 0);
  const emAndamento = contratos.filter(c => c.status === "Em andamento").length;

  const handleSaveContrato = (data) => {
    if (editContrato) updateContrato.mutate({ id: editContrato.id, data });
    else createContrato.mutate({ ...data, projeto_id: selectedProjectId });
  };

  const handleSaveAditivo = (data) => {
    if (editAditivo) updateAditivo.mutate({ id: editAditivo.id, data });
    else createAditivo.mutate({ ...data, contrato_id: selectedContrato.id, projeto_id: selectedProjectId });
  };

  const handleSaveMedicao = (data) => {
    createMedicao.mutate({ ...data, contrato_id: selectedContrato.id, projeto_id: selectedProjectId });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditContrato(null); setShowContratoForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Contratado", value: fmt(totalContratado), icon: DollarSign, color: "#26405d" },
            { label: "Em Andamento", value: emAndamento, icon: FileText, color: "#c35e1e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedContrato ? (
          <ContratoDetalhes
            contrato={selectedContrato}
            medicoes={medicoes}
            aditivos={aditivos}
            onBack={() => setSelectedContrato(null)}
            onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
            onDelete={(id) => deleteContrato.mutate(id)}
            onNovaMedicao={() => setShowMedicaoForm(true)}
            onAddAditivo={() => { setEditAditivo(null); setShowAditivoForm(true); }}
            onEditAditivo={(a) => { setEditAditivo(a); setShowAditivoForm(true); }}
            onDeleteAditivo={(id) => deleteAditivo.mutate({ id, contratoId: selectedContrato?.id })}
          />
        ) : (
          <ContratosList
            contratos={contratos}
            isLoading={loadingContratos}
            onSelect={setSelectedContrato}
            onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
            onDelete={(id) => deleteContrato.mutate(id)}
          />
        )}

        {showContratoForm && (
          <ContratoForm
            key={editContrato?.id || "new-contrato"}
            contrato={editContrato}
            onSave={handleSaveContrato}
            onClose={() => { setShowContratoForm(false); setEditContrato(null); }}
          />
        )}

        {showAditivoForm && (
          <AditivoForm
            key={editAditivo?.id || "new-aditivo"}
            aditivo={editAditivo}
            contratoId={selectedContrato?.id}
            projetoId={selectedProjectId}
            onSave={handleSaveAditivo}
            onClose={() => { setShowAditivoForm(false); setEditAditivo(null); }}
          />
        )}

        {showMedicaoForm && (
          <MedicaoForm
            key="new-medicao-from-contrato"
            medicao={null}
            contratos={contratos}
            defaultContratoId={selectedContrato?.id}
            onSave={handleSaveMedicao}
            onClose={() => setShowMedicaoForm(false)}
          />
        )}
      </div>
    </div>
  );
}
