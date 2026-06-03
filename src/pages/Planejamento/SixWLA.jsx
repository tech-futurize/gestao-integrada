import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus, AlertCircle, Upload, Search } from "lucide-react";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { cn } from "@/lib/utils";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import { getSemanas, getSemanasBadge, formatData, formatDataDDMM, getWeekBadgeStyle } from "@/utils/sixWLAUtils";
import { useDarkMode } from "@/hooks/useDarkMode";
import SixWLATable from "@/components/planejamento/SixWLATable";
import AdicionarCronogramaModal from "@/components/planejamento/AdicionarCronogramaModal";
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";

const SIXWLA_EXPORT_COLUMNS = [
  { key: "tarefa_nome",            label: "Atividade",           type: "string" },
  { key: "restricao_projeto_eng",  label: "Proj/Engenharia",     type: "string" },
  { key: "restricao_material",     label: "Material",            type: "string" },
  { key: "restricao_mao_obra",     label: "Mão de Obra",         type: "string" },
  { key: "restricao_equipamentos", label: "Equipamentos",        type: "string" },
  { key: "restricao_externas",     label: "Externas/Regulatório", type: "string" },
  { key: "restricao_informacoes",  label: "Informações/Decisões", type: "string" },
];

const RESTRICOES = [
  { key: "restricao_projeto_eng",  cardLabel: "Engenharia",  tableLabel: "Eng",  full: "Projeto/Engenharia" },
  { key: "restricao_material",     cardLabel: "Materiais",   tableLabel: "Mat",  full: "Material/Suprimentos" },
  { key: "restricao_mao_obra",     cardLabel: "Mão de Obra", tableLabel: "MO",   full: "Mão de Obra" },
  { key: "restricao_equipamentos", cardLabel: "Equipamento", tableLabel: "Eq",   full: "Equipamentos" },
  { key: "restricao_externas",     cardLabel: "Externo",     tableLabel: "Ext",  full: "Externas/Regulatórias" },
  { key: "restricao_informacoes",  cardLabel: "SSMA",        tableLabel: "SSMA", full: "Informações/Decisões" },
];

export default function SixWLAPage() {
  const { selectedProjectId } = useProject();
  const isDark = useDarkMode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const semanas = useMemo(() => getSemanas(new Date()), []);
  const [semanasAtivas, setSemanasAtivas] = useState([]);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filtros, setFiltros] = useState({});
  const [filterKey, setFilterKey] = useState(0);
  const [filtroRestricao, setFiltroRestricao] = useState(null);
  const FILTROS_KEY = "sixwla-filtros";
  const autoImported = useRef(false);

  // Q1 — registros 6WLA do projeto
  const {
    data: itens = [],
    isPending: pendingItens,
    isError: errorItens,
  } = useQuery({
    queryKey: ["itens_6wla", selectedProjectId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  // Q2 — atividades do cronograma (tipo=Atividade; sobreposição com janela calculada no front)
  const {
    data: tarefas = [],
    isPending: pendingTarefas,
    isError: errorTarefas,
  } = useQuery({
    queryKey: ["tarefas_cronograma_atividades", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId, tipo: "Atividade" }),
    enabled: !!selectedProjectId,
  });

  // Q3 — disciplinas cadastradas (globais, sem filtro de projeto)
  const { data: disciplinasDB = [] } = useQuery({
    queryKey: ["disciplinas"],
    queryFn: () => entities.Disciplina.list(),
  });

  // Atividades com sobreposição nas próximas 6 semanas (hoje até +42 dias)
  const tarefasNaJanela = useMemo(
    () => tarefas.filter(t => getSemanasBadge(t, semanas).length > 0),
    [tarefas, semanas]
  );

  const existingTarefaIds = useMemo(
    () => new Set(itens.map(i => i.tarefa_cronograma_id)),
    [itens]
  );

  // Merge: itens_6wla ← tarefa + semanasBadge calculados
  const merged = useMemo(() => {
    return itens.map(item => {
      const tarefa = tarefas.find(t => t.id === item.tarefa_cronograma_id) || null;
      return {
        ...item,
        tarefa,
        semanasBadge: tarefa ? getSemanasBadge(tarefa, semanas) : [],
      };
    });
  }, [itens, tarefas, semanas]);

  const disciplinas = useMemo(
    () => [...new Set(merged.map(i => i.tarefa?.disciplina).filter(Boolean))].sort(),
    [merged]
  );

  const areas = useMemo(
    () => [...new Set(merged.map(i => i.tarefa?.area).filter(Boolean))].sort(),
    [merged]
  );

  const disciplinaMap = useMemo(
    () => Object.fromEntries(
      disciplinasDB.map(d => [d.nome.toLowerCase(), d.cor || "#6b7280"])
    ),
    [disciplinasDB]
  );

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Item6WLA.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["itens_6wla", selectedProjectId] });
      const previous = queryClient.getQueryData(["itens_6wla", selectedProjectId]);
      queryClient.setQueryData(["itens_6wla", selectedProjectId], (old) =>
        old ? old.map((item) => (item.id === id ? { ...item, ...data } : item)) : old
      );
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["itens_6wla", selectedProjectId], ctx.previous);
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Item6WLA.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const bulkCreateMut = useMutation({
    mutationFn: ({ tarefaIds, manualmente = false }) =>
      Promise.all(
        tarefaIds.map(tarefa_cronograma_id =>
          entities.Item6WLA.create({
            projeto_id: selectedProjectId,
            tarefa_cronograma_id,
            adicionado_manualmente: manualmente,
            restricao_projeto_eng:  false,
            restricao_material:     false,
            restricao_mao_obra:     false,
            restricao_equipamentos: false,
            restricao_externas:     false,
            restricao_informacoes:  false,
          })
        )
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itens_6wla"] });
      if (variables.manualmente) {
        toast({ variant: "success", description: "Atividades adicionadas ao 6WLA." });
      }
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Resetar guard ao trocar projeto para permitir re-execução do auto-import
  useEffect(() => {
    autoImported.current = false;
  }, [selectedProjectId]);

  // Auto-import silencioso: importar atividades da janela sem registro em itens_6wla
  useEffect(() => {
    if (pendingItens || pendingTarefas || autoImported.current) return;
    autoImported.current = true;
    const novas = tarefasNaJanela.filter(t => !existingTarefaIds.has(t.id));
    if (novas.length > 0) {
      bulkCreateMut.mutate({ tarefaIds: novas.map(t => t.id), manualmente: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bulkCreateMut is stable (useMutation)
  }, [pendingItens, pendingTarefas, tarefasNaJanela, existingTarefaIds]);

  const filtered = useMemo(() => {
    let items = merged;
    const discs = filtros.disciplina || [];
    const areasFilter = filtros.area || [];

    const q = searchText.trim().toLowerCase();
    if (q) {
      items = items.filter(i =>
        (i.tarefa?.nome || "").toLowerCase().includes(q) ||
        (i.tarefa?.codigo_wbs || "").toLowerCase().includes(q)
      );
    }

    if (discs.length > 0) {
      items = items.filter(i => discs.includes(i.tarefa?.disciplina));
    }

    if (areasFilter.length > 0) {
      items = items.filter(i => areasFilter.includes(i.tarefa?.area));
    }

    if (semanasAtivas.length > 0) {
      items = items.filter(i => i.semanasBadge.some(s => semanasAtivas.includes(s)));
    }

    if (filtroRestricao) {
      items = items.filter(i => Boolean(i[filtroRestricao]));
    }

    return items;
  }, [merged, searchText, filtros, semanasAtivas, filtroRestricao]);

  // KPIs — 7 cards: Total + 1 por categoria de restrição
  const kpis = useMemo(() => ({
    total: merged.length,
    ...Object.fromEntries(RESTRICOES.map(r => [r.key, merged.filter(i => i[r.key]).length])),
  }), [merged]);

  const toggleSemana = (label) =>
    setSemanasAtivas(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );

  const tarefasDisponiveis = useMemo(
    () => tarefas.filter(t => !existingTarefaIds.has(t.id)),
    [tarefas, existingTarefaIds]
  );

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={CalendarRange}
            description="Selecione um projeto para acessar o 6WLA."
          />
        </div>
      </div>
    );
  }

  if (errorItens || errorTarefas) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-medium">Erro ao carregar dados do 6WLA.</p>
            <p className="text-xs text-muted-foreground">Verifique a conexão e recarregue a página.</p>
          </div>
        </div>
      </div>
    );
  }

  const isPending = pendingItens || pendingTarefas;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar / Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar do Cronograma
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">

        {/* KPIs — Total + 6 categorias de restrição */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="rounded-xl border p-3 bg-card border-border dark:bg-cobalt dark:border-cobalt">
            <p className="text-xs font-medium text-muted-foreground dark:text-titanium">Total Atividades</p>
            <p className="text-2xl font-bold text-foreground dark:text-cyan-electric">{kpis.total}</p>
            <p className="text-[10px] text-muted-foreground/70 dark:text-titanium/70 mt-0.5">no 6WLA</p>
          </div>
          {RESTRICOES.map(r => {
            const isActive = filtroRestricao === r.key;
            return (
              <div
                key={r.key}
                role="button"
                tabIndex={0}
                onClick={() => setFiltroRestricao(isActive ? null : r.key)}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && setFiltroRestricao(isActive ? null : r.key)}
                className={cn(
                  "rounded-xl border p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 cursor-pointer transition-all select-none",
                  isActive && "ring-2 ring-amber-500"
                )}
                title={isActive ? `Clique para remover filtro: ${r.full}` : r.full}
              >
                <p className="text-xs font-medium text-amber-900/70 dark:text-amber-500/80 truncate">{r.cardLabel}</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{kpis[r.key]}</p>
              </div>
            );
          })}
        </div>

        {/* Filtros */}
        <FilterToolbar
          active={!!searchText || semanasAtivas.length > 0 || Object.values(filtros).some(a => a?.length > 0)}
          onClearAll={() => { setSearchText(""); setSemanasAtivas([]); setFiltros({}); setFilterKey(k => k + 1); }}
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Buscar por ID ou atividade..."
              aria-label="Buscar atividade"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <FilterBar
            key={filterKey}
            storageKey={FILTROS_KEY}
            filters={[
              { key: "disciplina", label: "Disciplina", options: disciplinas },
              { key: "area", label: "Área", options: areas },
            ]}
            onChange={setFiltros}
          />
          {semanas.map((s, i) => {
            const ativa = semanasAtivas.includes(s.label);
            return (
              <button
                key={s.label}
                onClick={() => toggleSemana(s.label)}
                title={`${formatData(s.start)} – ${formatData(s.end)}`}
                style={ativa ? getWeekBadgeStyle(i, isDark) : undefined}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  ativa
                    ? ""
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                )}
              >
                {s.label}-{formatDataDDMM(s.start)}
              </button>
            );
          })}
        </FilterToolbar>

        {/* Visualização — pills S1–S6 por linha, 6 checkboxes de restrição, observacao */}
        <SixWLATable
          items={filtered}
          restricoes={RESTRICOES}
          isLoading={isPending}
          disciplinaMap={disciplinaMap}
          onUpdate={(id, data) => updateMut.mutate({ id, data })}
          onDelete={(id) => deleteMut.mutate(id)}
        />
      </div>

      <AdicionarCronogramaModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tarefas={tarefasDisponiveis}
        onConfirm={(ids) => { bulkCreateMut.mutate({ tarefaIds: ids, manualmente: true }); setShowModal(false); }}
      />
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        exportOnly
        columns={SIXWLA_EXPORT_COLUMNS}
        exportFileName="6wla-restricoes"
        title="6WLA — Exportar Restrições"
        onExport={() => filtered.map(item => ({
          ...item,
          tarefa_nome: item.tarefa?.nome || "",
          restricao_projeto_eng:  item.restricao_projeto_eng  ? "Sim" : "Não",
          restricao_material:     item.restricao_material     ? "Sim" : "Não",
          restricao_mao_obra:     item.restricao_mao_obra     ? "Sim" : "Não",
          restricao_equipamentos: item.restricao_equipamentos ? "Sim" : "Não",
          restricao_externas:     item.restricao_externas     ? "Sim" : "Não",
          restricao_informacoes:  item.restricao_informacoes  ? "Sim" : "Não",
        }))}
      />
    </div>
  );
}
