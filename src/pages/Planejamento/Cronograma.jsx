import { useState, useMemo, useDeferredValue } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import GanttChart from "@/components/cronograma/GanttChart";
import ViewTarefaModal from "@/components/cronograma/ViewTarefaModal";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import FilterBar from "@/components/ui/FilterBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, Upload, Eye, GitBranch, Search } from "lucide-react";

const EXPORT_COLUMNS = [
  { key: "codigo_wbs",               label: "WBS",                     type: "string",  required: true },
  { key: "nome",                     label: "Nome",                    type: "string",  required: true },
  { key: "tipo",                     label: "Tipo",                    type: "string" },
  { key: "nivel",                    label: "Nível",                   type: "number" },
  { key: "data_inicio_planejada",    label: "Início Planejado",        type: "date" },
  { key: "data_fim_planejada",       label: "Fim Planejado",           type: "date" },
  { key: "data_inicio_baseline",     label: "Início Baseline",         type: "date" },
  { key: "data_fim_baseline",        label: "Fim Baseline",            type: "date" },
  { key: "data_inicio_real",         label: "Início Real",             type: "date" },
  { key: "data_fim_real",            label: "Fim Real",                type: "date" },
  { key: "avanco_previsto",          label: "Avanço Previsto (%)",     type: "number" },
  { key: "avanco_realizado",         label: "Avanço Realizado (%)",    type: "number" },
  { key: "area",                     label: "Área",                    type: "string" },
  { key: "disciplina",               label: "Disciplina",              type: "string" },
  { key: "responsavel",              label: "Responsável",             type: "string" },
  { key: "predecessoras",            label: "Predecessoras",           type: "string" },
  { key: "caminho_critico",          label: "Caminho Crítico",         type: "boolean" },
];

export default function Cronograma() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast: _toast } = useToast();

  const [showImportExport, setShowImportExport] = useState(false);
  const [viewingTarefa, setViewingTarefa] = useState(null);
  const [zoom, setZoom] = useState("semanas");
  const [showBaseline, setShowBaseline] = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const [busca, setBusca] = useState("");
  const deferredBusca = useDeferredValue(busca);
  const [filtros, setFiltros] = useState({});

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const areaOptions = useMemo(() => [...new Set(tarefas.map(t => t.area).filter(Boolean))].sort(), [tarefas]);
  const discOptions = useMemo(() => [...new Set(tarefas.map(t => t.disciplina).filter(Boolean))].sort(), [tarefas]);

  const calcStatusLabel = (t) => {
    const real = t.avanco_realizado ?? 0;
    const prev = t.avanco_previsto ?? 0;
    if (real >= 100) return "Concluído";
    if (real >= prev) return "Em Dia";
    return "Atrasado";
  };

  const filteredTarefas = useMemo(() => {
    const statuses  = filtros.status      || [];
    const areas     = filtros.area        || [];
    const discs     = filtros.disciplina  || [];
    return tarefas.filter(t => {
      if (deferredBusca) {
        const b = deferredBusca.toLowerCase();
        if (!t.codigo_wbs?.toLowerCase().includes(b) && !t.nome?.toLowerCase().includes(b)) return false;
      }
      if (statuses.length > 0 && !statuses.includes(calcStatusLabel(t))) return false;
      if (areas.length    > 0 && !areas.includes(t.area))        return false;
      if (discs.length    > 0 && !discs.includes(t.disciplina))  return false;
      return true;
    });
  }, [tarefas, deferredBusca, filtros]);

  const handleImport = async (row) => {
    const payload = {
      projeto_id:            selectedProjectId,
      codigo_wbs:            row.codigo_wbs            || "",
      nome:                  row.nome                  || "",
      tipo:                  row.tipo                  || "Atividade",
      nivel:                 row.nivel                 ?? 1,
      data_inicio_planejada: row.data_inicio_planejada || null,
      data_fim_planejada:    row.data_fim_planejada    || null,
      data_inicio_baseline:  row.data_inicio_baseline  || null,
      data_fim_baseline:     row.data_fim_baseline     || null,
      data_inicio_real:      row.data_inicio_real      || null,
      data_fim_real:         row.data_fim_real         || null,
      avanco_previsto:       row.avanco_previsto       ?? 0,
      avanco_realizado:      row.avanco_realizado      ?? 0,
      area:                  row.area                  || "",
      disciplina:            row.disciplina            || "",
      responsavel:           row.responsavel           || "",
      predecessoras:         row.predecessoras         || "",
      caminho_critico:       row.caminho_critico       ?? false,
    };

    // Match por codigo_wbs dentro do projeto; fallback: cria novo
    const existing = tarefas.find(t => t.codigo_wbs && t.codigo_wbs === row.codigo_wbs);
    if (existing) {
      await entities.TarefaCronograma.update(existing.id, payload);
    } else {
      await entities.TarefaCronograma.create(payload);
    }
    queryClient.invalidateQueries({ queryKey: ["tarefas_cronograma"] });
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={CalendarDays} description="Selecione um projeto na barra lateral para ver o cronograma." />;
  }

  const totalTarefas = filteredTarefas.length;
  const concluidas   = filteredTarefas.filter(t => (t.avanco_realizado || 0) === 100).length;
  const atrasadas    = filteredTarefas.filter(t => t.data_fim_planejada && new Date(t.data_fim_planejada) < new Date() && (t.avanco_realizado || 0) < 100).length;
  const criticas     = filteredTarefas.filter(t => t.caminho_critico).length;

  return (
    <div className="p-6 flex flex-col gap-4 h-[calc(100vh-64px)]">
      {/* Controles de topo */}
      <div className="flex items-center justify-end shrink-0">
        <Button variant="outline" onClick={() => setShowImportExport(true)}>
          <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {[
          { label: "Total de Tarefas",  value: totalTarefas, color: "#26405d" },
          { label: "Concluídas",        value: concluidas,   color: "#16a34a" },
          { label: "Atrasadas",         value: atrasadas,    color: "#ef4444" },
          { label: "Caminho Crítico",   value: criticas,     color: "#c35e1e" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-start gap-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className="border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm w-56 bg-background text-foreground"
            placeholder="Buscar WBS ou atividade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <FilterBar
          storageKey="cronograma-filtros"
          filters={[
            { key: "status",      label: "Status",     options: ["Em Dia", "Atrasado", "Concluído"] },
            { key: "area",        label: "Área",        options: areaOptions },
            { key: "disciplina",  label: "Disciplina",  options: discOptions },
          ]}
          onChange={setFiltros}
        />
      </div>

      {/* Controles */}
      <div className="flex gap-2 flex-wrap items-center shrink-0">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setZoom("semanas")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${zoom === "semanas" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
          >
            Semanas
          </button>
          <button
            onClick={() => setZoom("meses")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${zoom === "meses" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
          >
            Meses
          </button>
        </div>
        <Button variant={showBaseline ? "default" : "outline"} size="sm" onClick={() => setShowBaseline(b => !b)}>
          <Eye className="w-3.5 h-3.5 mr-1" /> Baseline
        </Button>
        <Button variant={showCritical ? "default" : "outline"} size="sm" onClick={() => setShowCritical(c => !c)}>
          <GitBranch className="w-3.5 h-3.5 mr-1" /> Caminho Crítico
        </Button>
      </div>

      {/* Gantt — flex-1 min-h-0 para ocupar o restante da altura disponível */}
      <div className="flex-1 min-h-0">
        <GanttChart
          tarefas={filteredTarefas}
          isLoading={isLoading}
          zoom={zoom}
          showBaseline={showBaseline}
          showCritical={showCritical}
          onView={setViewingTarefa}
        />
      </div>

      {/* Modal de visualização */}
      {viewingTarefa && (
        <ViewTarefaModal
          tarefa={viewingTarefa}
          onClose={() => setViewingTarefa(null)}
        />
      )}

      {/* Import/Export */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Cronograma"
        exportFileName="cronograma"
        columns={EXPORT_COLUMNS}
        onExport={() => tarefas}
        onImport={handleImport}
      />
    </div>
  );
}
