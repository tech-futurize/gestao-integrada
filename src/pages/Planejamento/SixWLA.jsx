import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus, Info, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import { getSemanas, getSemanasBadge, formatData } from "@/utils/sixWLAUtils";
import SixWLATable from "@/components/planejamento/SixWLATable";
import AdicionarCronogramaModal from "@/components/planejamento/AdicionarCronogramaModal";

const RESTRICOES = [
  { key: "restricao_projeto_eng",  label: "Proj/Eng", full: "Projeto/Engenharia" },
  { key: "restricao_material",     label: "Mat",      full: "Material/Suprimentos" },
  { key: "restricao_mao_obra",     label: "MO",       full: "Mão de Obra" },
  { key: "restricao_equipamentos", label: "Eq",       full: "Equipamentos" },
  { key: "restricao_externas",     label: "Ext",      full: "Externas/Regulatórias" },
  { key: "restricao_informacoes",  label: "Info",     full: "Informações/Decisões" },
];

export default function SixWLAPage() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const semanas = useMemo(() => getSemanas(new Date()), []);
  const [semanasAtivas, setSemanasAtivas] = useState(() => semanas.map(s => s.label));
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [novasAtividades, setNovasAtividades] = useState([]);
  const bannerChecked = useRef(false);

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

  // Auto-sync: detectar atividades da janela sem registro em itens_6wla
  useEffect(() => {
    if (pendingItens || pendingTarefas || bannerChecked.current) return;
    bannerChecked.current = true;
    const novas = tarefasNaJanela.filter(t => !existingTarefaIds.has(t.id));
    if (novas.length > 0) {
      setNovasAtividades(novas);
      setShowBanner(true);
    }
  }, [pendingItens, pendingTarefas, tarefasNaJanela, existingTarefaIds]);

  // Filtrar tabela pelas semanas ativas (pills S1–S6)
  const filtered = useMemo(() => {
    if (semanasAtivas.length === semanas.length) return merged;
    return merged.filter(item =>
      item.semanasBadge.some(s => semanasAtivas.includes(s))
    );
  }, [merged, semanasAtivas, semanas.length]);

  // KPIs — 7 cards: Total + 1 por categoria de restrição
  const kpis = useMemo(() => ({
    total: merged.length,
    ...Object.fromEntries(RESTRICOES.map(r => [r.key, merged.filter(i => i[r.key]).length])),
  }), [merged]);

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Item6WLA.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Item6WLA.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const bulkCreateMut = useMutation({
    mutationFn: (tarefaIds) =>
      Promise.all(
        tarefaIds.map(tarefa_cronograma_id =>
          entities.Item6WLA.create({
            projeto_id: selectedProjectId,
            tarefa_cronograma_id,
            restricao_projeto_eng:  false,
            restricao_material:     false,
            restricao_mao_obra:     false,
            restricao_equipamentos: false,
            restricao_externas:     false,
            restricao_informacoes:  false,
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens_6wla"] });
      setShowBanner(false);
      setNovasAtividades([]);
      toast({ variant: "success", description: "Atividades adicionadas ao 6WLA." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

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
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar do Cronograma
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">

        {/* Banner auto-sync */}
        {showBanner && novasAtividades.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-300 flex-1">
              {novasAtividades.length} atividade{novasAtividades.length > 1 ? "s novas" : " nova"} encontrada{novasAtividades.length > 1 ? "s" : ""} no cronograma.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
              onClick={() => bulkCreateMut.mutate(novasAtividades.map(t => t.id))}
              disabled={bulkCreateMut.isPending}
            >
              Importar automaticamente
            </Button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPIs — Total + 6 categorias de restrição */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="rounded-xl border p-3 bg-[#102A44] border-[#1e4a6e]">
            <p className="text-xs font-medium text-[#8195A9]">Total Atividades</p>
            <p className="text-2xl font-bold text-[#26FFFF]">{kpis.total}</p>
            <p className="text-[10px] text-[#8195A9]/70 mt-0.5">no 6WLA</p>
          </div>
          {RESTRICOES.map(r => (
            <div
              key={r.key}
              className="rounded-xl border p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
              title={r.full}
            >
              <p className="text-xs font-medium text-amber-900/70 dark:text-amber-500/80 truncate">{r.label}</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{kpis[r.key]}</p>
            </div>
          ))}
        </div>

        {/* Pills S1–S6 — filtro multi-select da tabela */}
        <div className="flex flex-wrap gap-2">
          {semanas.map(s => {
            const ativa = semanasAtivas.includes(s.label);
            return (
              <button
                key={s.label}
                onClick={() => toggleSemana(s.label)}
                title={`${formatData(s.start)} – ${formatData(s.end)}`}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  ativa
                    ? "bg-[#102A44] text-[#26FFFF] border-[#102A44]"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                )}
              >
                {s.label} · {formatData(s.start)}
              </button>
            );
          })}
        </div>

        {/* Visualização — pills S1–S6 por linha, 6 checkboxes de restrição, observacao */}
        <SixWLATable
          items={filtered}
          restricoes={RESTRICOES}
          isLoading={isPending}
          onUpdate={(id, data) => updateMut.mutate({ id, data })}
          onDelete={(id) => deleteMut.mutate(id)}
        />
      </div>

      <AdicionarCronogramaModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tarefas={tarefasDisponiveis}
        onConfirm={(ids) => { bulkCreateMut.mutate(ids); setShowModal(false); }}
      />
    </div>
  );
}
