import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, DollarSign, ClipboardList, CheckCircle } from "lucide-react";
import ContratosList from "@/components/contratos/ContratosList";
import ContratoForm from "@/components/contratos/ContratoForm";
import ContratoDetalhes from "@/components/contratos/ContratoDetalhes";
import MedicoesList from "@/components/contratos/MedicoesList";
import MedicaoForm from "@/components/contratos/MedicaoForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function Contratos({ initialTab = "contratos" }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(initialTab);
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [editContrato, setEditContrato] = useState(null);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [showMedicaoForm, setShowMedicaoForm] = useState(false);
  const [editMedicao, setEditMedicao] = useState(null);

  const { data: contratos = [], isLoading: loadingContratos } = useQuery({
    queryKey: ["contratos", selectedProjectId],
    queryFn: () => entities.Contrato.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: medicoes = [], isLoading: loadingMedicoes } = useQuery({
    queryKey: ["medicoes", selectedProjectId],
    queryFn: () => entities.Medicao.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createContrato = useMutation({
    mutationFn: (data) => entities.Contrato.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["contratos"]); setShowContratoForm(false); },
  });

  const updateContrato = useMutation({
    mutationFn: ({ id, data }) => entities.Contrato.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["contratos"]); setShowContratoForm(false); setEditContrato(null); },
  });

  const deleteContrato = useMutation({
    mutationFn: (id) => entities.Contrato.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["contratos"]); setSelectedContrato(null); },
  });

  const createMedicao = useMutation({
    mutationFn: (data) => entities.Medicao.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["medicoes"]); setShowMedicaoForm(false); },
  });

  const updateMedicao = useMutation({
    mutationFn: ({ id, data }) => entities.Medicao.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["medicoes"]); setShowMedicaoForm(false); setEditMedicao(null); },
  });

  const deleteMedicao = useMutation({
    mutationFn: (id) => entities.Medicao.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["medicoes"]),
  });

  if (!selectedProjectId) {
    return <PageEmptyState icon={FileText} description="Selecione um projeto no menu lateral para acessar os contratos." />;
  }

  const totalContratado = contratos.reduce((s, c) => s + (c.valor_total || 0), 0);
  const medicoesPagas = medicoes.filter(m => m.status === "Paga").reduce((s, m) => s + (m.valor_liquido || 0), 0);
  const medioesEmAprovacao = medicoes.filter(m => ["Em Revisão", "Em Aprovação"].includes(m.status)).length;
  const contratosAtivos = contratos.filter(c => c.status === "Ativo").length;

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const handleSaveContrato = (data) => {
    if (editContrato) updateContrato.mutate({ id: editContrato.id, data });
    else createContrato.mutate({ ...data, projeto_id: selectedProjectId });
  };

  const handleSaveMedicao = (data) => {
    if (editMedicao) updateMedicao.mutate({ id: editMedicao.id, data });
    else createMedicao.mutate({ ...data, projeto_id: selectedProjectId });
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Contratado", value: fmt(totalContratado), icon: DollarSign, color: "#26405d" },
          { label: "Pago em Medições", value: fmt(medicoesPagas), icon: CheckCircle, color: "#00a49a" },
          { label: "Contratos Ativos", value: contratosAtivos, icon: FileText, color: "#c35e1e" },
          { label: "Medições Pendentes", value: medioesEmAprovacao, icon: ClipboardList, color: "#f59e0b" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-brand-primary">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="medicoes">Medições</TabsTrigger>
          </TabsList>
          <Button
            onClick={() => { setEditContrato(null); setEditMedicao(null); tab === "medicoes" ? setShowMedicaoForm(true) : setShowContratoForm(true); }}
            className="bg-brand-accent text-white hover:bg-brand-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            {tab === "medicoes" ? "Nova Medição" : "Novo Contrato"}
          </Button>
        </div>

        <TabsContent value="contratos" className="mt-4">
          {selectedContrato ? (
            <ContratoDetalhes
              contrato={selectedContrato}
              medicoes={medicoes.filter(m => m.contrato_id === selectedContrato.id)}
              onBack={() => setSelectedContrato(null)}
              onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
              onDelete={(id) => deleteContrato.mutate(id)}
              onNovaMedicao={() => { setShowMedicaoForm(true); }}
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
        </TabsContent>

        <TabsContent value="medicoes" className="mt-4">
          <MedicoesList
            medicoes={medicoes}
            contratos={contratos}
            isLoading={loadingMedicoes}
            onEdit={(m) => { setEditMedicao(m); setShowMedicaoForm(true); }}
            onDelete={(id) => deleteMedicao.mutate(id)}
            onUpdateStatus={(id, status) => updateMedicao.mutate({ id, data: { status } })}
          />
        </TabsContent>
      </Tabs>

      {showContratoForm && (
        <ContratoForm
          contrato={editContrato}
          onSave={handleSaveContrato}
          onClose={() => { setShowContratoForm(false); setEditContrato(null); }}
        />
      )}

      {showMedicaoForm && (
        <MedicaoForm
          medicao={editMedicao}
          contratos={contratos}
          defaultContratoId={selectedContrato?.id}
          onSave={handleSaveMedicao}
          onClose={() => { setShowMedicaoForm(false); setEditMedicao(null); }}
        />
      )}
    </div>
  );
}