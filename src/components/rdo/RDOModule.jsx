import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { FileText, Search, Sun, CloudRain, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import { useSortTable } from "@/hooks/useSortTable";
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { formatDate } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/use-toast";
import { RDOForm } from "./RDOForm";
import { RDODetail } from "./RDODetail";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const RDO_COLUMNS = [
  { key: "numero", label: "Nº RDO", type: "string", required: true },
  { key: "data",   label: "Data",    type: "date",   required: true },
  { key: "area",   label: "Área",    type: "string", required: false },
];

export default function RDOModule({
  selectedProjectId,
  showForm, setShowForm,
  editRDO, setEditRDO,
  showImport, setShowImport,
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewRDO, setViewRDO]   = useState(null);
  const [search, setSearch]     = useState("");
  const [periodo, setPeriodo]   = useState(null);
  const [filtros, setFiltros] = useState({});
  const [filterKey, setFilterKey] = useState(0);
  const FILTROS_KEY = "rdo-filtros";

  const { data: rdos = [], isLoading, isError } = useQuery({
    queryKey: ["rdos", selectedProjectId],
    queryFn: () => entities.Rdo.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const areaOptions = useMemo(
    () => [...new Set(rdos.map(r => r.area).filter(Boolean))].sort(),
    [rdos]
  );

  const { data: casos = [] } = useQuery({
    queryKey: ["pleitos", selectedProjectId],
    queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const deleteMut = useMutation({
    mutationFn: id => entities.Rdo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rdos"] }),
    onError: e => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const handleImport = async row => {
    await entities.Rdo.create({ ...row, projeto_id: selectedProjectId });
    queryClient.invalidateQueries({ queryKey: ["rdos"] });
  };

  const onSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["rdos"] });
    setShowForm(false);
    setEditRDO(null);
  };

  const filtered = useMemo(() => {
    let result = rdos;
    if (search) result = result.filter(r =>
      (r.numero || r.area || "").toLowerCase().includes(search.toLowerCase())
    );
    if (filtros.area?.length > 0) result = result.filter(r => filtros.area.includes(r.area));
    if (periodo?.from) {
      const fromStr = periodo.from.toISOString().split("T")[0];
      result = result.filter(r => r.data && r.data >= fromStr);
    }
    if (periodo?.to) {
      const toStr = periodo.to.toISOString().split("T")[0];
      result = result.filter(r => r.data && r.data <= toStr);
    }
    return result;
  }, [rdos, search, filtros, periodo]);

  const { sortedData: rdosSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "data", defaultDir: "desc" });

  const climaCell = turno => {
    if (!turno?.ativo) return <span className="text-muted-foreground/40 text-xs">—</span>;
    const ok = turno.praticabilidade !== "Impraticável";
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${ok ? "text-status-positive" : "text-blue-700 dark:text-blue-400"}`}>
        {ok ? <Sun className="w-3 h-3" /> : <CloudRain className="w-3 h-3" />}
        {ok ? "Prat." : "Imprat."}
      </span>
    );
  };

  const isFilterActive = !!search || !!periodo?.from || Object.values(filtros).some(a => a?.length > 0);
  const handleClearAll = () => {
    setSearch("");
    setPeriodo(null);
    setFiltros({});
    localStorage.removeItem(FILTROS_KEY);
    setFilterKey(k => k + 1);
  };

  function SortIcon({ col }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />;
  }

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="h-8 border border-border rounded-md pl-8 pr-3 text-sm bg-background text-foreground"
            placeholder="Nº RDO, área..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <FilterBar
          key={filterKey}
          storageKey={FILTROS_KEY}
          filters={[
            { key: "area", label: "Área", options: areaOptions },
          ]}
          onChange={setFiltros}
        />
        <DateRangePicker
          label="Período"
          value={periodo}
          onChange={setPeriodo}
          onClear={() => setPeriodo(null)}
        />
      </FilterToolbar>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th onClick={() => handleSort("data")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none group">Data<SortIcon col="data" /></th>
              <th onClick={() => handleSort("numero")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none group">Nº RDO<SortIcon col="numero" /></th>
              <th onClick={() => handleSort("area")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none group">Área<SortIcon col="area" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Disciplinas</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Clima M/T/N</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">MO</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Equip.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Ocorrências</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Evidências</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap w-28"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {isError && (
              <tr><td colSpan={10} className="py-12 text-center text-sm text-status-critical">Erro ao carregar RDOs. Verifique sua conexão e tente novamente.</td></tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Nenhum RDO registrado</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Clique em &quot;Novo RDO&quot; para começar</p>
                </td>
              </tr>
            )}
            {rdosSorted.map(rdo => {
              const nMdo   = (rdo.mao_de_obra  || []).reduce((s, m) => s + (parseInt(m.quantidade) || 0), 0);
              const nEquip = (rdo.equipamentos || []).reduce((s, e) => s + (parseInt(e.quantidade) || 0), 0);
              const nOcorr = (rdo.ocorrencias  || []).length;
              const nEvid  = (rdo.evidencias   || []).length;
              return (
                <tr key={rdo.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {formatDate(rdo.data) || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-bold">{rdo.numero || "—"}</td>
                  <td className="px-4 py-3 text-xs max-w-24 truncate">{rdo.area || "—"}</td>
                  <td className="px-4 py-3">
                    {(rdo.disciplinas || []).length > 0
                      ? <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{rdo.disciplinas.join(", ")}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {climaCell(rdo.clima?.manha)}
                      <span className="text-border text-xs">/</span>
                      {climaCell(rdo.clima?.tarde)}
                      <span className="text-border text-xs">/</span>
                      {climaCell(rdo.clima?.noite)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold">{nMdo > 0 ? nMdo : "—"}</td>
                  <td className="px-4 py-3 text-center text-xs font-bold">{nEquip > 0 ? nEquip : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {nOcorr > 0
                      ? <span className="text-xs bg-status-attention/15 text-status-attention px-2 py-0.5 rounded-full font-medium">{nOcorr}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {nEvid > 0
                      ? <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">{nEvid}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      onView={() => setViewRDO(rdo)}
                      onEdit={() => { setEditRDO(rdo); setShowForm(true); }}
                      onDelete={() => deleteMut.mutate(rdo.id)}
                      deleteDescription="O RDO será excluído permanentemente."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <RDOForm
          rdo={editRDO}
          selectedProjectId={selectedProjectId}
          casos={casos}
          tarefas={tarefas}
          onClose={() => { setShowForm(false); setEditRDO(null); }}
          onSaved={onSaved}
        />
      )}

      {viewRDO && (
        <RDODetail rdo={viewRDO} casos={casos} tarefas={tarefas} onClose={() => setViewRDO(null)} />
      )}

      <ImportExportDialog
        open={showImport}
        onOpenChange={setShowImport}
        title="Importar / Exportar RDOs"
        exportFileName="rdos-export"
        columns={RDO_COLUMNS}
        onImport={handleImport}
        onExport={() => filtered}
      />
    </div>
  );
}
