import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus, Info, X } from "lucide-react";
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

  // Q1 — registros 6WLA
  const { data: itens = [], isLoading: loadingItens } = useQuery({
    queryKey: ["itens_6wla", selectedProjectId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  // Q2 — atividades do cronograma
  const { data: tarefas = [], isLoading: loadingTarefas } = useQuery({
    queryKey: ["tarefas_cronograma_atividades", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId, tipo: "Atividade" }),
    enabled: !!selectedProjectId,
  });

  const existingTarefaIds = useMemo(
    () => new Set(itens.map(i => i.tarefa_cronograma_id)),
    [itens]
  );

  // Merge + calcular badges de semana
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

  // Auto-sync: detectar atividades novas nas próximas 6 semanas
  useEffect(() => {
    if (loadingItens || loadingTarefas || bannerChecked.current) return;
    bannerChecked.current = true;
    const novas = tarefas.filter(t => {
      if (existingTarefaIds.has(t.id)) return false;
      return getSemanasBadge(t, semanas).length > 0;
    });
    if (novas.length > 0) {
      setNovasAtividades(novas);
      setShowBanner(true);
    }
  }, [loadingItens, loadingTarefas, tarefas, existingTarefaIds, semanas]);

  // Filtrar por semanas ativas
  const filtered = useMemo(() => {
    if (semanasAtivas.length === semanas.length) return merged;
    return merged.filter(item =>
      item.semanasBadge.some(s => semanasAtivas.includes(s))
    );
  }, [merged, semanasAtivas, semanas.length]);

  // KPIs
  const kpis = useMemo(() => ({
    total: merged.length,
    ...Object.fromEntries(RESTRICOES.map(r => [r.key, merged.filter(i => i[r.key]).length])),
  }), [merged]);

  // Mutations
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

  const isLoading = loadingItens || loadingTarefas;

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

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
          </div>
          {RESTRICOES.map(r => (
            <div key={r.key} className="bg-card rounded-xl border border-border p-3" title={r.full}>
              <p className="text-xs text-muted-foreground truncate">{r.label}</p>
              <p className="text-2xl font-bold text-amber-600">{kpis[r.key]}</p>
            </div>
          ))}
        </div>

        {/* Pills S1–S6 */}
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
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                )}
              >
                {s.label} · Sem.{s.weekNumber}
              </button>
            );
          })}
        </div>

        {/* Tabela */}
        <SixWLATable
          items={filtered}
          restricoes={RESTRICOES}
          isLoading={isLoading}
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
