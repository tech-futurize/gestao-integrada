import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, DollarSign } from "lucide-react";
import ContratosList from "@/components/contratos/ContratosList";
import ContratoForm from "@/components/contratos/ContratoForm";
import ContratoDetalhes from "@/components/contratos/ContratoDetalhes";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

export default function Contratos({ initialTab: _initialTab = "contratos" }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [editContrato, setEditContrato] = useState(null);
  const [selectedContrato, setSelectedContrato] = useState(null);

  const { data: contratos = [], isLoading: loadingContratos } = useQuery({
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contratos"] }); setShowContratoForm(false); setEditContrato(null); },
    onError: onErr,
  });

  const deleteContrato = useMutation({
    mutationFn: (id) => entities.Contrato.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contratos"] }); setSelectedContrato(null); },
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

  const totalContratado = contratos.reduce((s, c) => s + (c.valor_total || 0), 0);
  const contratosAtivos = contratos.filter(c => c.status === "Ativo").length;
  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const handleSaveContrato = (data) => {
    if (editContrato) updateContrato.mutate({ id: editContrato.id, data });
    else createContrato.mutate({ ...data, projeto_id: selectedProjectId });
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
            { label: "Contratos Ativos", value: contratosAtivos, icon: FileText, color: "#c35e1e" },
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
            medicoes={[]}
            onBack={() => setSelectedContrato(null)}
            onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
            onDelete={(id) => deleteContrato.mutate(id)}
            onNovaMedicao={() => {}}
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
      </div>
    </div>
  );
}