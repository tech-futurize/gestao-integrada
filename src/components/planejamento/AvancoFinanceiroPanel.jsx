// src/components/planejamento/AvancoFinanceiroPanel.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  eachMonthOfInterval,
  startOfMonth,
  parseISO,
  format,
  endOfMonth,
  isBefore,
  isAfter,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PageEmptyState from "@/components/ui/PageEmptyState";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { computeAvancoSeries } from "./avancoSeries";
import AvancoCards from "./AvancoCards";
import CurvaSChart from "./CurvaSChart";
import AvancoTabela from "./AvancoTabela";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "yyyy-MM" — chave do período mensal */
function mesKey(d) {
  return format(d, "yyyy-MM");
}

/** "MMM/yy" — label exibido (ex: "jan/26") */
function mesLabel(d) {
  return format(d, "MMM/yy", { locale: ptBR });
}

function getProjectMonths(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return [];
  try {
    return eachMonthOfInterval({
      start: parseISO(dataInicio),
      end:   parseISO(dataFim),
    });
  } catch {
    return [];
  }
}

function isCurrentOrPastMonth(date) {
  return startOfMonth(date) <= startOfMonth(new Date());
}

const FIELDS = {
  prev: "faturamento_previsto_mensal",
  real: "faturamento_realizado_mensal",
  proj: "faturamento_projetado",
};

const EXPORT_COLUMNS = [
  { key: "mes_referencia",               label: "Mês (YYYY-MM-DD)",    type: "string", required: true },
  { key: "faturamento_previsto_mensal",   label: "Previsto (R$)",        type: "number" },
  { key: "faturamento_realizado_mensal",  label: "Real (R$)",            type: "number" },
  { key: "faturamento_projetado",         label: "Projetado (R$)",       type: "number" },
];

/** Formatador compacto para células (ex: R$ 1,23M, R$ 500,00 mil) — 2 casas decimais */
const formatCellBRL = (v) => {
  if (v === 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

/** Formatador completo para cards (ex: R$ 1.234.567,89) */
const formatCardBRL = (v) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

// Definição das linhas da tabela — cores iguais ao físico (mesmo domínio visual)
function buildRows(cards) {
  return [
    {
      campo:           FIELDS.prev,
      label:           "Previsto",
      dotColor:        "bg-blue-500",
      rowCls:          "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/20",
      headerActiveBg:  "bg-blue-50 dark:bg-card border-r border-border",
      headerCls:       "text-blue-700 dark:text-blue-300",
      acumValue:       cards.prevAcum,
      isRealRow:       false,
    },
    {
      campo:           FIELDS.real,
      label:           "Real",
      dotColor:        "bg-green-500",
      rowCls:          "bg-green-50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/20",
      headerActiveBg:  "bg-green-50 dark:bg-card border-r border-border",
      headerCls:       "text-green-700 dark:text-green-300",
      acumValue:       cards.realAcum,
      isRealRow:       true,
      readOnlyRow:     true, // Real é derivado do módulo Faturamento (não editável aqui)
    },
    {
      campo:           FIELDS.proj,
      label:           "Projetado",
      dotColor:        "bg-amber-500",
      rowCls:          "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20",
      headerActiveBg:  "bg-yellow-50 dark:bg-card border-r border-border",
      headerCls:       "text-amber-700 dark:text-amber-300",
      acumValue:       cards.projAcum,
      isRealRow:       false,
      blockWhenField:  FIELDS.real,
    },
  ];
}

// ── AvancoFinanceiroPanel ──────────────────────────────────────────────────────

export default function AvancoFinanceiroPanel({ showImportExport, setShowImportExport }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showPrev, setShowPrev] = React.useState(true);
  const [showReal, setShowReal] = React.useState(true);
  const [showProj, setShowProj] = React.useState(true);
  const [periodFilter, setPeriodFilter] = React.useState(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: financeiros = [], isPending, isError } = useQuery({
    queryKey: ["financeiro", selectedProjectId],
    queryFn: () => entities.Financeiro.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: projetoArr = [] } = useQuery({
    queryKey: ["projetos", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const projeto = projetoArr[0] ?? null;

  // Faturamentos do projeto — fonte única do "Real" financeiro (derivação)
  const { data: faturamentos = [] } = useQuery({
    queryKey: ["faturamentos", selectedProjectId],
    queryFn: () => entities.Faturamento.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const onErr = (e) =>
    toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const onSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["financeiro", selectedProjectId] });
    toast({ title: "Salvo", description: "Faturamento atualizado.", duration: 2000 });
  };

  const updateMut = useMutation({
    mutationFn: ({ id, updates }) => entities.Financeiro.update(id, updates),
    onSuccess: onSaved,
    onError: onErr,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.Financeiro.create(data),
    onSuccess: onSaved,
    onError: onErr,
  });

  // ── Derived data ──────────────────────────────────────────────────────────────

  const projectMonths = useMemo(
    () => getProjectMonths(projeto?.data_inicio, projeto?.data_prevista_termino),
    [projeto]
  );

  const monthsFiltrados = useMemo(() => {
    if (!periodFilter?.from || !periodFilter?.to) return projectMonths;
    const from = startOfMonth(periodFilter.from);
    const to   = endOfMonth(periodFilter.to);
    return projectMonths.filter(m => !isBefore(m, from) && !isAfter(m, to));
  }, [projectMonths, periodFilter]);

  // Real financeiro derivado: Σ valor_medido dos faturamentos por mês (fonte única)
  const realPorMes = useMemo(() => {
    const m = new Map();
    faturamentos.forEach((f) => {
      if (!f.mes_referencia) return;
      const k = f.mes_referencia.slice(0, 7);
      m.set(k, (m.get(k) ?? 0) + (Number(f.valor_medido) || 0));
    });
    return m;
  }, [faturamentos]);

  const dataMap = useMemo(() => {
    const m = new Map();
    // Null out realizado: só deve exibir valor quando vem do módulo Faturamento
    financeiros.forEach((r) => {
      if (r.mes_referencia) m.set(r.mes_referencia.slice(0, 7), { ...r, faturamento_realizado_mensal: null });
    });
    // Sobrepõe o realizado com a soma dos faturamentos (injeta registro sintético se faltar)
    realPorMes.forEach((val, k) => {
      const existing = m.get(k) ?? { mes_referencia: `${k}-01` };
      m.set(k, { ...existing, faturamento_realizado_mensal: val });
    });
    return m;
  }, [financeiros, realPorMes]);

  const { chartData, cards, lastRealPeriod } = useMemo(() => {
    if (monthsFiltrados.length === 0) {
      return {
        chartData: [],
        cards: { prevAcum: 0, realAcum: 0, projAcum: 0, desvio: 0 },
        lastRealPeriod: null,
      };
    }
    return computeAvancoSeries({
      dataMap,
      periods: monthsFiltrados,
      periodKey: mesKey,
      periodLabel: mesLabel,
      fields: FIELDS,
      currentPeriodKey: mesKey(startOfMonth(new Date())),
    });
  }, [dataMap, monthsFiltrados]);

  const lastRealLabel = lastRealPeriod ? mesLabel(lastRealPeriod) : null;
  const tableRows = buildRows(cards);

  // ── Save handler ──────────────────────────────────────────────────────────────

  const handleSave = (pk, campo, valor) => {
    if (campo === FIELDS.real) return; // Real é derivado do módulo Faturamento — não editável
    const existing = dataMap.get(pk);
    // registros sintéticos (Real vindo só do Faturamento) não têm id — precisam de create
    if (existing?.id) {
      const updates = { [campo]: valor };
      // Regra de negócio: ao salvar Real, zera Projetado do mesmo mês
      if (campo === "faturamento_realizado_mensal") updates.faturamento_projetado = 0;
      updateMut.mutate({ id: existing.id, updates });
    } else {
      const data = {
        projeto_id: selectedProjectId,
        mes_referencia: `${pk}-01`,   // DATE: "yyyy-MM-01"
        [campo]: valor,
      };
      if (campo === "faturamento_realizado_mensal") data.faturamento_projetado = 0;
      createMut.mutate(data);
    }
  };

  // ── Import handler (normaliza mes_referencia) ─────────────────────────────────

  const handleImport = async (row) => {
    try {
      const rawMes = (row.mes_referencia ?? "").trim();
      // Aceita "YYYY-MM" ou "YYYY-MM-DD"
      const mesRef = /^\d{4}-\d{2}$/.test(rawMes) ? `${rawMes}-01` : rawMes;
      const pk = mesRef.slice(0, 7);
      const payload = {
        projeto_id:                    selectedProjectId,
        mes_referencia:                mesRef,
        faturamento_previsto_mensal:   Number(row.faturamento_previsto_mensal)  || 0,
        faturamento_realizado_mensal:  Number(row.faturamento_realizado_mensal) || 0,
        faturamento_projetado:         Number(row.faturamento_projetado)        || 0,
      };
      const existing = dataMap.get(pk);
      if (existing?.id) {
        await entities.Financeiro.update(existing.id, payload);
      } else {
        await entities.Financeiro.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["financeiro", selectedProjectId] });
    } catch (e) {
      toast({ title: "Erro ao importar", description: friendlyMessage(e), variant: "destructive" });
    }
  };

  // ── Early returns ─────────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[320px] rounded-xl" />
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-32" />
              {[...Array(8)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-14" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
        Erro ao carregar dados de avanço financeiro. Tente recarregar a página.
      </div>
    );
  }

  if (!projeto?.data_inicio || !projeto?.data_prevista_termino) {
    return (
      <PageEmptyState description="Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto." />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Chips de toggle + botão Import/Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Exibir:
        </span>
        {[
          { key: "prev", label: "Previsto",  show: showPrev, setShow: setShowPrev, activeStyle: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300" },
          { key: "real", label: "Real",      show: showReal, setShow: setShowReal, activeStyle: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
          { key: "proj", label: "Projetado", show: showProj, setShow: setShowProj, activeStyle: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400" },
        ].map(({ key, label, show, setShow, activeStyle }) => (
          <button
            key={key}
            onClick={() => setShow((v) => !v)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
              ${show ? activeStyle : "bg-muted text-muted-foreground border-border opacity-50"}`}
          >
            {show ? "●" : "○"} {label}
          </button>
        ))}
        <div className="ml-auto">
          <DateRangePicker
            label="Período"
            value={periodFilter}
            onChange={setPeriodFilter}
            onClear={() => setPeriodFilter(null)}
          />
        </div>
      </div>

      {/* Cards KPI */}
      <AvancoCards
        prevAcum={cards.prevAcum}
        realAcum={cards.realAcum}
        projAcum={cards.projAcum}
        desvio={cards.desvio}
        formatValue={formatCardBRL}
        lastRealLabel={lastRealLabel}
        periodUnitLabel="mês"
      />

      {/* Gráfico Curva S */}
      <CurvaSChart
        data={chartData}
        xKey="label"
        showPrev={showPrev}
        showReal={showReal}
        showProj={showProj}
        valueFormatter={formatCardBRL}
        title="Evolução de Avanço Financeiro"
      />

      {/* Tabela transposta mensal */}
      <p className="text-xs text-muted-foreground">
        A linha <span className="font-semibold text-green-600 dark:text-green-400">Real</span> é
        derivada do módulo{" "}
        <Link to="/planejamento/faturamento" className="underline hover:text-foreground">Faturamento</Link>{" "}
        (somatório dos faturamentos por mês) e não é editável aqui.
      </p>
      <AvancoTabela
        periods={monthsFiltrados}
        dataMap={dataMap}
        periodKey={mesKey}
        columnLabel={mesLabel}
        groupByMonth={false}
        rows={tableRows}
        formatValue={formatCellBRL}
        isBlocked={(d) => !isCurrentOrPastMonth(d)}
        onSave={handleSave}
        cellWidth="w-28"
      />

      {/* Import/Export */}
      {showImportExport && (
        <ImportExportDialog
          open={showImportExport}
          onOpenChange={setShowImportExport}
          title="Avanço Financeiro"
          exportFileName="avanco_financeiro"
          columns={EXPORT_COLUMNS}
          onExport={() =>
            financeiros.map((r) => ({
              mes_referencia:              r.mes_referencia,
              faturamento_previsto_mensal:  r.faturamento_previsto_mensal,
              faturamento_realizado_mensal: r.faturamento_realizado_mensal,
              faturamento_projetado:        r.faturamento_projetado ?? 0,
            }))
          }
          onImport={handleImport}
        />
      )}
    </div>
  );
}
