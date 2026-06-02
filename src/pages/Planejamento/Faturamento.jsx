import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Upload, Search } from "lucide-react";
import { startOfMonth, endOfMonth, isBefore, isAfter, parseISO } from "date-fns";
import FaturamentoList from "@/components/planejamento/FaturamentoList";
import FaturamentoForm from "@/components/planejamento/FaturamentoForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import FilterBar from "@/components/ui/FilterBar";
import FilterToolbar from "@/components/ui/FilterToolbar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const EXPORT_COLUMNS = [
  { key: "numero",         label: "Número",          type: "string", required: true },
  { key: "mes_referencia", label: "Mês (YYYY-MM-DD)", type: "string" },
  { key: "valor_medido",   label: "Valor medido",     type: "number" },
  { key: "status",         label: "Status",           type: "string" },
  { key: "observacoes",    label: "Observações",      type: "string" },
];

export default function Faturamento() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState(null);
  const [filtros, setFiltros] = useState({});
  const [filterKey, setFilterKey] = useState(0);
  const FILTROS_KEY = "faturamentos-filtros";

  const { data: faturamentos = [], isPending, isError } = useQuery({
    queryKey: ["faturamentos", selectedProjectId],
    queryFn: () => entities.Faturamento.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const filtrados = useMemo(() => {
    const st = filtros.status || [];
    let r = faturamentos;
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter((f) => f.numero?.toLowerCase().includes(b));
    }
    if (st.length > 0) r = r.filter((f) => st.includes(f.status));
    if (periodo?.from) {
      const from = startOfMonth(periodo.from);
      r = r.filter((f) => f.mes_referencia && !isBefore(parseISO(f.mes_referencia), from));
    }
    if (periodo?.to) {
      const to = endOfMonth(periodo.to);
      r = r.filter((f) => f.mes_referencia && !isAfter(parseISO(f.mes_referencia), to));
    }
    return r;
  }, [faturamentos, busca, filtros, periodo]);

  const createMut = useMutation({
    mutationFn: (data) => entities.Faturamento.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["faturamentos"] }); setShowForm(false); },
    onError: onErr,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Faturamento.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["faturamentos"] }); setShowForm(false); setEditItem(null); },
    onError: onErr,
  });
  const deleteMut = useMutation({
    mutationFn: (id) => entities.Faturamento.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faturamentos"] }),
    onError: onErr,
  });

  const handleSave = (data) => {
    if (editItem) updateMut.mutate({ id: editItem.id, data });
    else createMut.mutate({ ...data, projeto_id: selectedProjectId });
  };

  const handleImport = async (row) => {
    const rawMes = (row.mes_referencia ?? "").trim();
    const mes = /^\d{4}-\d{2}$/.test(rawMes) ? `${rawMes}-01` : rawMes;
    await entities.Faturamento.create({
      projeto_id: selectedProjectId,
      numero: String(row.numero || ""),
      mes_referencia: mes || null,
      valor_medido: Number(row.valor_medido) || 0,
      status: row.status === "Concluído" ? "Concluído" : "Elaboração",
      observacoes: row.observacoes || "",
      itens: [],
    });
    queryClient.invalidateQueries({ queryKey: ["faturamentos"] });
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={Receipt} description="Selecione um projeto no menu lateral para acessar o faturamento." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={Receipt} description="Erro ao carregar os faturamentos. Verifique sua conexão e tente novamente." />
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
              <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditItem(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Faturamento
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <FilterToolbar
          active={!!busca || !!periodo?.from || Object.values(filtros).some((a) => a?.length > 0)}
          onClearAll={() => { setBusca(""); setPeriodo(null); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey((k) => k + 1); }}
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
              placeholder="Buscar por número..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <FilterBar
            key={filterKey}
            storageKey={FILTROS_KEY}
            filters={[{ key: "status", label: "Status", options: ["Elaboração", "Concluído"] }]}
            onChange={setFiltros}
          />
          <DateRangePicker label="Mês de referência" value={periodo} onChange={setPeriodo} onClear={() => setPeriodo(null)} />
        </FilterToolbar>

        <FaturamentoList
          faturamentos={filtrados}
          isLoading={isPending}
          onEdit={(f) => { setEditItem(f); setShowForm(true); }}
          onDelete={(id) => deleteMut.mutate(id)}
        />

        {showForm && (
          <FaturamentoForm
            key={editItem?.id || "new-faturamento"}
            faturamento={editItem}
            faturamentos={faturamentos}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
          />
        )}

        <ImportExportDialog
          open={showImportExport}
          onOpenChange={setShowImportExport}
          title="Faturamento"
          exportFileName="faturamentos"
          columns={EXPORT_COLUMNS}
          onExport={() => faturamentos.map((f) => ({
            numero: f.numero,
            mes_referencia: f.mes_referencia,
            valor_medido: f.valor_medido,
            status: f.status,
            observacoes: f.observacoes,
          }))}
          onImport={handleImport}
        />
      </div>
    </div>
  );
}
