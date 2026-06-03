import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Upload, AlertTriangle, Search, Loader2 } from "lucide-react";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { entities } from "@/api/supabaseEntities";
import PleitoForm from "@/components/pleitos/PleitoForm";
import PleitosList from "@/components/pleitos/PleitosList";
import PleitoDetalhes from "@/components/pleitos/PleitoDetalhes";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast } from "@/components/ui/use-toast";
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import DateRangePicker from "@/components/ui/DateRangePicker";

const PLEITO_COLUMNS = [
  { key: "titulo",              label: "Título",             type: "string", required: true },
  { key: "descricao_problema",  label: "Descrição",          type: "string" },
  { key: "contexto",            label: "Contexto",           type: "string" },
  { key: "data_abertura",       label: "Data Abertura",      type: "date" },
  { key: "status",              label: "Status",             type: "string" },
  { key: "responsavel",         label: "Responsável",        type: "string" },
  { key: "prioridade",          label: "Prioridade",         type: "string" },
];

export default function Pleitos() {
  const { selectedProjectId } = useProject();
  const { id: pleitoIdParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (msg) => toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
  const [showImportExport, setShowImportExport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPleito, setEditingPleito] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({});
  const [periodo, setPeriodo] = useState(null);
  const [filterKey, setFilterKey] = useState(0);
  const FILTROS_KEY = "pleitos-filtros";

  const { data: casos = [], isPending: isLoading, isError } = useQuery({
    queryKey: ["pleitos", selectedProjectId],
    queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  // Fallback para deep-link: busca o pleito diretamente se ainda não está na lista
  const pleitoNaLista = pleitoIdParam ? casos.find(c => c.id === pleitoIdParam) : null;
  const { data: pleitoFallback, isPending: fallbackPending } = useQuery({
    queryKey: ["pleito", pleitoIdParam],
    queryFn: () => entities.Pleito.filter({ id: pleitoIdParam }).then(r => r[0] ?? null),
    enabled: !!pleitoIdParam && !isLoading && !pleitoNaLista,
  });
  const pleitoSelecionado = pleitoNaLista ?? pleitoFallback ?? null;

  const statusOptions = useMemo(
    () => [...new Set(casos.map(c => c.status).filter(Boolean))].sort(),
    [casos]
  );

  const filteredCasos = useMemo(() => {
    let r = casos;
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(p => p.titulo?.toLowerCase().includes(b) || p.descricao_problema?.toLowerCase().includes(b));
    }
    if (filtros.status?.length)    r = r.filter(p => filtros.status.includes(p.status));
    if (filtros.prioridade?.length) r = r.filter(p => filtros.prioridade.includes(p.prioridade));
    if (periodo?.from) {
      const fromStr = periodo.from.toISOString().split("T")[0];
      r = r.filter(p => p.data_abertura && p.data_abertura >= fromStr);
    }
    if (periodo?.to) {
      const toStr = periodo.to.toISOString().split("T")[0];
      r = r.filter(p => p.data_abertura && p.data_abertura <= toStr);
    }
    return r;
  }, [casos, busca, filtros, periodo]);

  const createMutation = useMutation({
    mutationFn: (data) => entities.Pleito.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pleitos"] }); setShowForm(false); setEditingPleito(null); },
    onError: (e) => onErr(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Pleito.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pleitos"] }); setShowForm(false); setEditingPleito(null); navigate("/admin-contratual/pleitos"); },
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

  // Renderizar detalhe quando há um ID na URL
  if (pleitoIdParam) {
    const carregando = (isLoading || fallbackPending) && !pleitoSelecionado;

    if (carregando) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader detail="Carregando..." />
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando pleito...
          </div>
        </div>
      );
    }

    if (!pleitoSelecionado) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader detail="Não encontrado" />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <p className="text-sm">Pleito não encontrado.</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin-contratual/pleitos")}>
              Voltar à lista
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <PageHeader detail={pleitoSelecionado.titulo} />
        <div className="flex-1 overflow-auto">
          <PleitoDetalhes
            pleito={pleitoSelecionado}
            onBack={() => navigate("/admin-contratual/pleitos")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar / Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditingPleito(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pleito
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4">

          {isError && (
            <div className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Erro ao carregar pleitos. Verifique sua conexão e tente novamente.
            </div>
          )}

          {showForm && (
            <PleitoForm
              key={editingPleito?.id || "new-pleito"}
              pleito={editingPleito}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingPleito(null); }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          )}

          <FilterToolbar
            active={!!busca || !!periodo?.from || Object.values(filtros).some(a => a?.length > 0)}
            onClearAll={() => { setBusca(""); setPeriodo(null); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
                placeholder="Buscar por título..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <FilterBar
              key={filterKey}
              storageKey={FILTROS_KEY}
              filters={[
                { key: "status",    label: "Status",    options: statusOptions },
                { key: "prioridade", label: "Prioridade", options: ["Baixa", "Média", "Alta", "Crítica"] },
              ]}
              onChange={setFiltros}
            />
            <DateRangePicker
              label="Data Abertura"
              value={periodo}
              onChange={setPeriodo}
              onClear={() => setPeriodo(null)}
            />
          </FilterToolbar>

          <PleitosList
            casos={filteredCasos}
            isLoading={isLoading}
            onSelect={(pleito) => navigate(`/admin-contratual/pleitos/${pleito.id}`)}
          />
        </div>
      </div>
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={PLEITO_COLUMNS}
        exportFileName="pleitos"
        title="Pleitos — Importar / Exportar"
        onExport={() => casos}
        onImport={(row) => createMutation.mutateAsync({ ...row, projeto_id: selectedProjectId })}
      />
    </div>
  );
}
