import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, Upload } from "lucide-react";
import MedicoesList from "@/components/contratos/MedicoesList";
import MedicaoForm from "@/components/contratos/MedicaoForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import FilterBar from "@/components/ui/FilterBar";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const EXPORT_COLUMNS = [
  { key: "numero",         label: "Número",         type: "string", required: true },
  { key: "contrato_id",    label: "Contrato ID",     type: "string" },
  { key: "periodo_inicio", label: "Período Início",  type: "string" },
  { key: "periodo_fim",    label: "Período Fim",     type: "string" },
  { key: "valor",          label: "Valor",           type: "number" },
  { key: "status",         label: "Status",          type: "string" },
  { key: "observacoes",    label: "Observações",     type: "string" },
];

export default function Medicoes() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [editMedicao, setEditMedicao] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);

  const { data: medicoes = [], isLoading, isError } = useQuery({
    queryKey: ["medicoes", selectedProjectId],
    queryFn: () => entities.Medicao.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const [filtros, setFiltros] = useState({});

  const medicoesFiltradas = useMemo(() => {
    const st = filtros.status || [];
    if (st.length === 0) return medicoes;
    return medicoes.filter(m => st.includes(m.status));
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

  const handleImport = async (row) => {
    await entities.Medicao.create({
      projeto_id: selectedProjectId,
      numero:         String(row.numero || ""),
      contrato_id:    row.contrato_id || null,
      periodo_inicio: row.periodo_inicio || null,
      periodo_fim:    row.periodo_fim || null,
      valor:          Number(row.valor) || 0,
      status:         row.status || "Elaboração",
      observacoes:    row.observacoes || "",
      itens:          [],
    });
    queryClient.invalidateQueries({ queryKey: ["medicoes"] });
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={ClipboardList} description="Selecione um projeto no menu lateral para acessar as medições." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={ClipboardList} description="Erro ao carregar as medições. Verifique sua conexão e tente novamente." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
            </Button>
            <Button onClick={() => { setEditMedicao(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Medição
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-4">
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

        <ImportExportDialog
          open={showImportExport}
          onOpenChange={setShowImportExport}
          title="Medições"
          exportFileName="medicoes"
          columns={EXPORT_COLUMNS}
          onExport={() => medicoes.map(m => ({
            numero:         m.numero,
            contrato_id:    m.contrato_id,
            periodo_inicio: m.periodo_inicio,
            periodo_fim:    m.periodo_fim,
            valor:          m.valor,
            status:         m.status,
            observacoes:    m.observacoes,
          }))}
          onImport={handleImport}
        />
      </div>
    </div>
  );
}
