import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Plus, Upload, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { formatDate, toLocalDateISO } from "@/lib/dateUtils";
import RowActions from "@/components/ui/RowActions";
import { useSortTable } from "@/hooks/useSortTable";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import MudancasResumo from "@/components/mudancas/MudancasResumo";
import MapaImpacto from "@/components/mudancas/MapaImpacto";
import MudancaForm from "@/components/mudancas/MudancaForm";
import MudancaView from "@/components/mudancas/MudancaView";
import { Button } from "@/components/ui/button";
import FilterBar from "@/components/ui/FilterBar";
import FilterToolbar from "@/components/ui/FilterToolbar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge } from "@/components/ui/StatusBadge";

const ORIGEM_COLORS = {
  "Contratada": "bg-blue-50 text-blue-700 border border-blue-200",
  "Contratante": "bg-amber-50 text-amber-700 border border-amber-200",
};

const STATUS_OPTIONS = ["Identificada", "Em Análise", "Aprovada", "Rejeitada", "Implementada"];

const MUDANCA_COLUMNS = [
  { key: "titulo",             label: "Título",              type: "string", required: true },
  { key: "descricao",          label: "Descrição",           type: "string" },
  { key: "origem",             label: "Origem",              type: "string" },
  { key: "status",             label: "Status",              type: "string" },
  { key: "data_ocorrencia",    label: "Data Registro",       type: "date" },
  { key: "impacto_custo",      label: "Impacto Custo (R$)",  type: "number" },
  { key: "impacto_prazo_dias", label: "Impacto Prazo (dias)", type: "number" },
  { key: "impacto_escopo",     label: "Impacto Escopo",      type: "string" },
  { key: "responsavel",        label: "Responsável",         type: "string" },
  { key: "observacoes",        label: "Observações",         type: "string" },
];

function fmtCurrency(val) {
  if (val === null || val === undefined || val === "") return "—";
  const abs = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return val >= 0 ? `+${abs}` : `-${abs.replace("-", "")}`;
}

export default function GestaoMudancas() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtros, setFiltros] = useState({});
  const [filterKey, setFilterKey] = useState(0);
  const [viewItem, setViewItem] = useState(null);
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState(null);
  const FILTROS_KEY = "mudancas-filtros";

  const { data: mudancas = [], isPending: isLoading, isError } = useQuery({
    queryKey: ["mudancas_contratuais", selectedProjectId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: pleitos = [] } = useQuery({
    queryKey: ["pleitos", selectedProjectId],
    queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.MudancaContratual.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mudancas_contratuais"] });
      setShowForm(false); setEditing(null);
      toast({ variant: "success", description: "Mudança registrada." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.MudancaContratual.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mudancas_contratuais"] });
      setShowForm(false); setEditing(null);
      toast({ variant: "success", description: "Mudança atualizada." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.MudancaContratual.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mudancas_contratuais"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const st = filtros.status || [];
    const or = filtros.origem || [];
    let r = mudancas;
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(m => m.titulo?.toLowerCase().includes(b) || m.descricao?.toLowerCase().includes(b));
    }
    if (st.length > 0) r = r.filter(m => st.includes(m.status));
    if (or.length > 0) r = r.filter(m => or.includes(m.origem));
    if (periodo?.from) {
      const fromStr = toLocalDateISO(periodo.from);
      r = r.filter(m => m.data_ocorrencia && m.data_ocorrencia >= fromStr);
    }
    if (periodo?.to) {
      const toStr = toLocalDateISO(periodo.to);
      r = r.filter(m => m.data_ocorrencia && m.data_ocorrencia <= toStr);
    }
    return r;
  }, [mudancas, busca, filtros, periodo]);

  const { sortedData: mudancasSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "titulo" });

  const handleSubmit = (data) => {
    const payload = { ...data, projeto_id: selectedProjectId };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const handleEdit = (mudanca) => {
    setEditing(mudanca);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditing(null);
  };

  function SortIcon({ col }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />;
  }

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1"><PageEmptyState icon={ArrowRightLeft} description="Selecione um projeto para ver as mudanças contratuais." /></div>
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
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" /> Nova Mudança
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Filtros */}
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
              { key: "status", label: "Status", options: STATUS_OPTIONS },
              { key: "origem", label: "Origem", options: ["Contratada", "Contratante"] },
            ]}
            onChange={setFiltros}
          />
          <DateRangePicker
            label="Data Registro"
            value={periodo}
            onChange={setPeriodo}
            onClear={() => setPeriodo(null)}
          />
        </FilterToolbar>

        {/* KPIs */}
        {mudancas.length > 0 && <MudancasResumo mudancas={mudancas} />}

        {/* Tabela */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th onClick={() => handleSort("titulo")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Título<SortIcon col="titulo" /></th>
                  <th onClick={() => handleSort("origem")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Origem<SortIcon col="origem" /></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Categorias</th>
                  <th onClick={() => handleSort("impacto_custo")} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Impacto Custo<SortIcon col="impacto_custo" /></th>
                  <th onClick={() => handleSort("impacto_prazo_dias")} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Prazo<SortIcon col="impacto_prazo_dias" /></th>
                  <th onClick={() => handleSort("status")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Status<SortIcon col="status" /></th>
                  <th onClick={() => handleSort("responsavel")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Responsável<SortIcon col="responsavel" /></th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Carregando...</td></tr>}
                {isError && <tr><td colSpan={8} className="py-10 text-center text-status-critical text-sm">Erro ao carregar mudanças. Verifique sua conexão e tente novamente.</td></tr>}
                {!isLoading && !isError && filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Nenhuma mudança encontrada</td></tr>
                )}
                {mudancasSorted.map((m, i) => (
                  <tr key={m.id} className={`border-b border-border hover:bg-muted/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-foreground line-clamp-1">{m.titulo}</div>
                      {m.data_ocorrencia && <div className="text-xs text-muted-foreground">{formatDate(m.data_ocorrencia)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {m.origem && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ORIGEM_COLORS[m.origem] || "bg-muted text-muted-foreground"}`}>
                          {m.origem}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(m.categorias || []).map(cat => (
                          <span key={cat} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{cat}</span>
                        ))}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${m.impacto_custo > 0 ? "text-status-critical" : m.impacto_custo < 0 ? "text-status-positive" : ""}`}>
                      {fmtCurrency(m.impacto_custo)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {m.impacto_prazo_dias != null && m.impacto_prazo_dias !== "" ? `${m.impacto_prazo_dias > 0 ? "+" : ""}${m.impacto_prazo_dias}d` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.responsavel || "—"}</td>
                    <td className="px-4 py-3">
                      <RowActions
                        onView={() => setViewItem(m)}
                        onEdit={() => handleEdit(m)}
                        onDelete={() => deleteMut.mutate(m.id)}
                        deleteDescription="A mudança será excluída permanentemente."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mapa de Impacto */}
        {mudancas.length > 0 && <MapaImpacto mudancas={mudancas} />}
      </div>

      {/* Modais */}
      <MudancaForm
        key={editing?.id || "new"}
        open={showForm}
        onOpenChange={(o) => { if (!o) handleFormClose(); }}
        mudanca={editing}
        onSubmit={handleSubmit}
        onCancel={handleFormClose}
        isSubmitting={createMut.isPending || updateMut.isPending}
        pleitos={pleitos}
      />

      <MudancaView
        mudanca={viewItem}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
      />

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={MUDANCA_COLUMNS}
        exportFileName="mudancas-contratuais"
        title="Mudanças — Importar / Exportar"
        onExport={() => filtered}
        onImport={(row) => createMut.mutateAsync({ ...row, projeto_id: selectedProjectId })}
      />
    </div>
  );
}
