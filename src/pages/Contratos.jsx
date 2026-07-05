import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/ui/KPICard";
import { Plus, FileText, DollarSign, Upload, Search } from "lucide-react";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import ContratosList from "@/components/contratos/ContratosList";
import ContratoForm from "@/components/contratos/ContratoForm";
import ContratoDetalhes from "@/components/contratos/ContratoDetalhes";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { toLocalDateISO } from "@/lib/dateUtils";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CONTRATO_COLUMNS = [
  { key: "numero",      label: "Número",       type: "string" },
  { key: "objeto",      label: "Objeto",        type: "string", required: true },
  { key: "fornecedor",  label: "Fornecedor",    type: "string" },
  { key: "cnpj",        label: "CNPJ",          type: "string" },
  { key: "tipo",        label: "Tipo",          type: "string" },
  { key: "status",      label: "Status",        type: "string" },
  { key: "valor_total", label: "Valor Total",   type: "number" },
  { key: "data_inicio", label: "Data Início",   type: "date" },
  { key: "data_fim",    label: "Data Fim",      type: "date" },
];

export default function Contratos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const [showImportExport, setShowImportExport] = useState(false);
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [editContrato, setEditContrato] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({});
  const [periodo, setPeriodo] = useState(null);
  const [filterKey, setFilterKey] = useState(0);
  const FILTROS_KEY = "contratos-filtros";

  const { data: contratos = [], isLoading: loadingContratos, isError: errorContratos } = useQuery({
    queryKey: ["contratos", selectedProjectId],
    queryFn: () => entities.Contrato.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: todosAditivos = [] } = useQuery({
    queryKey: ["aditivos", "projeto", selectedProjectId],
    queryFn: () => entities.Aditivo.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  // Contrato selecionado derivado do cache (reflete edições automaticamente)
  const selectedContrato = useMemo(
    () => (selectedId ? contratos.find((c) => c.id === selectedId) || null : null),
    [contratos, selectedId]
  );

  const tipoOptions = useMemo(
    () => [...new Set(contratos.map((c) => c.tipo).filter(Boolean))].sort(),
    [contratos]
  );

  const filteredContratos = useMemo(() => {
    let r = contratos;
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter((c) => c.objeto?.toLowerCase().includes(b) || c.fornecedor?.toLowerCase().includes(b));
    }
    if (filtros.status?.length) r = r.filter((c) => filtros.status.includes(c.status));
    if (filtros.tipo?.length) r = r.filter((c) => filtros.tipo.includes(c.tipo));
    if (periodo?.from) {
      const fromStr = toLocalDateISO(periodo.from);
      r = r.filter((c) => !c.data_fim || c.data_fim >= fromStr);
    }
    if (periodo?.to) {
      const toStr = toLocalDateISO(periodo.to);
      r = r.filter((c) => !c.data_inicio || c.data_inicio <= toStr);
    }
    return r;
  }, [contratos, busca, filtros, periodo]);

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contratos"] }); setSelectedId(null); },
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
  const emAndamento = contratos.filter((c) => c.status === "Em andamento").length;

  const handleSaveContrato = (data) => {
    if (editContrato) updateContrato.mutate({ id: editContrato.id, data });
    else createContrato.mutate({ ...data, projeto_id: selectedProjectId });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          !selectedContrato && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
                <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditContrato(null); setShowContratoForm(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Novo Contrato
              </Button>
            </div>
          )
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPIs gerais — somem ao entrar no detalhe de um contrato */}
        {!selectedContrato && (
          <div className="grid grid-cols-2 gap-4">
            <KPICard label="Total Contratado" value={fmt(totalContratado)} icon={<DollarSign />} />
            <KPICard label="Em Andamento" value={emAndamento} icon={<FileText />} />
          </div>
        )}

        {!selectedContrato && (
          <FilterToolbar
            active={!!busca || !!periodo?.from || Object.values(filtros).some((a) => a?.length > 0)}
            onClearAll={() => { setBusca(""); setPeriodo(null); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey((k) => k + 1); }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
                placeholder="Buscar por objeto ou fornecedor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <FilterBar
              key={filterKey}
              storageKey={FILTROS_KEY}
              filters={[
                { key: "status", label: "Status", options: ["A iniciar", "Em andamento", "Concluído", "Paralisado"] },
                { key: "tipo", label: "Tipo", options: tipoOptions },
              ]}
              onChange={setFiltros}
            />
            <DateRangePicker label="Período" value={periodo} onChange={setPeriodo} onClear={() => setPeriodo(null)} />
          </FilterToolbar>
        )}

        {selectedContrato ? (
          <ContratoDetalhes
            contrato={selectedContrato}
            onBack={() => setSelectedId(null)}
            onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
            onDelete={(id) => deleteContrato.mutate(id)}
          />
        ) : (
          <ContratosList
            contratos={filteredContratos}
            aditivos={todosAditivos}
            isLoading={loadingContratos}
            onSelect={(c) => setSelectedId(c.id)}
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
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={CONTRATO_COLUMNS}
        exportFileName="contratos"
        title="Contratos — Importar / Exportar"
        onExport={() => contratos}
        onImport={(row) => createContrato.mutateAsync({ ...row, projeto_id: selectedProjectId })}
      />
    </div>
  );
}
