import { Fragment, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, AlertTriangle, X } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import ItemMASForm from "./ItemMASForm";
import FilterBar from "@/components/ui/FilterBar";
import FilterToolbar from "@/components/ui/FilterToolbar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/use-toast";

const PER_PAGE = 25;
const FILTROS_STORAGE_KEY = "suprimentos-filtros";

const ETAPAS = [
  { key: "requisicao",  label: "Requisição",   abbr: "Req.",    cor: "#64748b" },
  { key: "cotacao",     label: "Cotação",       abbr: "Cot.",    cor: "#57767e" },
  { key: "patec",       label: "PATEC",         abbr: "PATEC",   cor: "#4a7871" },
  { key: "aquisicao",   label: "Aquisição",     abbr: "Aquis.",  cor: "#3d7a64" },
  { key: "fabricacao",  label: "Fabricação",    abbr: "Fabr.",   cor: "#307c57" },
  { key: "transporte",  label: "Transporte",    abbr: "Transp.", cor: "#237e4a" },
  { key: "fornecimento",label: "Fornecimento",  abbr: "Forn.",   cor: "#15803d" },
];

const DEFAULT_ETAPAS = ETAPAS.map(e => ({ nome: e.label, status: "pendente", data: "" }));

function getEtapaStatus(item, idx) {
  return item.etapas?.[idx]?.status || "pendente";
}

function NodeColor(status) {
  if (status === "concluida")    return "#15803d";
  if (status === "em_andamento") return "#c35e1e";
  if (status === "nao_aplicavel") return "#d1d5db";
  return "#d1d5db";
}

function Popover({ item, etapaIdx, rect, onClose, onSave }) {
  const etapa = item.etapas?.[etapaIdx] || { nome: ETAPAS[etapaIdx].label, status: "pendente", data: "" };
  const [status, setStatus] = useState(etapa.status);
  const [data, setData] = useState(etapa.status === "nao_aplicavel" ? "" : (etapa.data || ""));

  const handleStatusChange = (e) => {
    const novoStatus = e.target.value;
    setStatus(novoStatus);
    if (novoStatus === "nao_aplicavel") setData("");
  };

  const handleSave = () => {
    const novasEtapas = [...(item.etapas || DEFAULT_ETAPAS)];
    while (novasEtapas.length < 7) novasEtapas.push({ nome: ETAPAS[novasEtapas.length].label, status: "pendente", data: "" });

    if (status === "concluida") {
      for (let i = 0; i <= etapaIdx; i++) {
        novasEtapas[i] = { ...novasEtapas[i], nome: ETAPAS[i].label, status: "concluida" };
      }
      novasEtapas[etapaIdx] = { ...novasEtapas[etapaIdx], data };
    } else if (status === "pendente") {
      for (let i = etapaIdx; i < 7; i++) {
        novasEtapas[i] = { ...novasEtapas[i], status: "pendente", data: "" };
      }
    } else {
      novasEtapas[etapaIdx] = {
        ...novasEtapas[etapaIdx],
        nome: ETAPAS[etapaIdx].label,
        status,
        data: status === "nao_aplicavel" ? "" : data,
      };
    }

    let lastDate = null;
    for (let i = 0; i < 7; i++) {
      if (novasEtapas[i].status === "nao_aplicavel") continue;
      if (novasEtapas[i].data) {
        lastDate = new Date(novasEtapas[i].data);
      } else if (lastDate) {
        lastDate = new Date(lastDate.getTime() + 7 * 86400000);
        novasEtapas[i] = { ...novasEtapas[i], data: lastDate.toISOString().split("T")[0] };
      }
    }

    const allDone = novasEtapas.every(e => e.status === "concluida" || e.status === "nao_aplicavel");
    const hasCancelled = item.status === "Cancelado";
    const anyActive = novasEtapas.some(e => e.status === "em_andamento");
    const anyDone = novasEtapas.some(e => e.status === "concluida");
    let novoStatus = item.status;
    if (!hasCancelled) {
      if (allDone) novoStatus = "Concluído";
      else if (anyActive || anyDone) novoStatus = "Em andamento";
      else novoStatus = "A iniciar";
    }

    onSave({ etapas: novasEtapas, status: novoStatus });
    onClose();
  };

  // Posição: abre abaixo do botão se houver espaço, caso contrário abre acima
  const POPOVER_W = 288;
  const POPOVER_H = 210;
  const GAP = 6;
  let left = rect.left + rect.width / 2 - POPOVER_W / 2;
  left = Math.max(GAP, Math.min(left, window.innerWidth - POPOVER_W - GAP));
  const spaceBelow = window.innerHeight - rect.bottom - GAP;
  const top = spaceBelow >= POPOVER_H
    ? rect.bottom + GAP
    : Math.max(GAP, rect.top - GAP - POPOVER_H);

  return createPortal(
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div
        className="absolute bg-card rounded-xl shadow-2xl border border-border w-72 p-4"
        style={{ top, left }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-foreground">{ETAPAS[etapaIdx].label}</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status da etapa</label>
            <select
              className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm"
              value={status}
              onChange={handleStatusChange}
            >
              <option value="pendente">Não iniciada</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="nao_aplicavel">Não aplicável</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data referência</label>
            <input
              type="date"
              className={`w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm ${status === "nao_aplicavel" ? "opacity-40 cursor-not-allowed" : ""}`}
              value={data}
              onChange={e => setData(e.target.value)}
              disabled={status === "nao_aplicavel"}
            />
          </div>
          <Button variant="save" className="w-full text-sm" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MapaSuprimentos({ selectedProjectId, triggerNew = 0 }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [popover, setPopover] = useState(null);
  const [filtroSC, setFiltroSC] = useState("");
  const [filtros, setFiltros] = useState({});
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [periodoFornecimento, setPeriodoFornecimento] = useState(null);
  const [filterKey, setFilterKey] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (triggerNew > 0) { setEditItem(null); setShowForm(true); }
  }, [triggerNew]);

  const { data: itens = [], isPending: isLoading, isError } = useQuery({
    queryKey: ["itemMAS", selectedProjectId],
    queryFn: () => entities.ItemMAS.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: tarefas = [], isLoading: _isLoadingTarefas } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }) => entities.ItemMAS.update(id, data),
    onMutate: async ({ id, data: patch }) => {
      await queryClient.cancelQueries({ queryKey: ["itemMAS", selectedProjectId] });
      const prev = queryClient.getQueryData(["itemMAS", selectedProjectId]);
      queryClient.setQueryData(["itemMAS", selectedProjectId], (old) =>
        Array.isArray(old) ? old.map(i => i.id === id ? { ...i, ...patch } : i) : old
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(["itemMAS", selectedProjectId], ctx.prev);
      }
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["itemMAS"] }),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => entities.ItemMAS.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itemMAS"] }),
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const { data: pacotes = [] } = useQuery({
    queryKey: ["pacotes_suprimento", selectedProjectId],
    queryFn: () => entities.PacoteSuprimento.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const pacoteMap = useMemo(
    () => Object.fromEntries(pacotes.map((p) => [p.id, p.nome])),
    [pacotes]
  );

  const tarefaLabel = (id) => {
    if (!id) return "—";
    const t = tarefas.find(t => t.id === id);
    if (!t) return "—";
    return t.codigo_wbs ? `${t.codigo_wbs} — ${t.nome}` : t.nome;
  };

  const kpis = ETAPAS.map((etapa, idx) => ({
    ...etapa,
    count: itens.filter(item => {
      const etapas = item.etapas || [];
      const current = etapas.findIndex(e => e.status === "em_andamento");
      if (current === idx) return true;
      if (current === -1) {
        const lastDone = [...(item.etapas || [])].reverse().findIndex(e => e.status === "concluida");
        if (lastDone !== -1) {
          const realIdx = 6 - lastDone;
          return realIdx === idx;
        }
      }
      return false;
    }).length,
  }));

  const handleClearFilters = () => {
    setFiltroSC("");
    setFiltros({});
    setFiltroResponsavel("");
    setFiltroFornecedor("");
    setPeriodoFornecimento(null);
    localStorage.removeItem(FILTROS_STORAGE_KEY);
    setFilterKey(k => k + 1);
  };

  const isAtrasado = (item) => {
    const fornData = item.etapas?.[6]?.data;
    return !!(fornData && item.data_cronograma && fornData > item.data_cronograma);
  };

  const filtered = useMemo(() => {
    let result = [...itens].sort((a, b) => {
      const dateCompare = new Date(b.created_at) - new Date(a.created_at);
      if (dateCompare !== 0) return dateCompare;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    if (filtroSC) result = result.filter(i => i.numero_sc?.toLowerCase().includes(filtroSC.toLowerCase()));
    const st = filtros.status || [];
    if (st.length > 0) {
      result = result.filter(i => {
        const statusMatch = st.some(s => s !== "Atrasado" && s === i.status);
        const atrasadoMatch = st.includes("Atrasado") && isAtrasado(i);
        return statusMatch || atrasadoMatch;
      });
    }
    const etps = filtros.etapa || [];
    if (etps.length > 0) {
      result = result.filter(i =>
        etps.some(label => {
          const idx = ETAPAS.findIndex(e => e.label === label);
          if (idx < 0) return false;
          return i.etapas?.[idx]?.status === "em_andamento";
        })
      );
    }
    if (filtroResponsavel) result = result.filter(i => i.responsavel?.toLowerCase().includes(filtroResponsavel.toLowerCase()));
    if (filtroFornecedor) result = result.filter(i => i.fornecedor?.toLowerCase().includes(filtroFornecedor.toLowerCase()));
    if (periodoFornecimento?.from) {
      const fromStr = periodoFornecimento.from.toISOString().split("T")[0];
      result = result.filter(i => (i.etapas?.[6]?.data || "") >= fromStr);
    }
    if (periodoFornecimento?.to) {
      const toStr = periodoFornecimento.to.toISOString().split("T")[0];
      result = result.filter(i => (i.etapas?.[6]?.data || "") <= toStr);
    }
    return result;
  }, [itens, filtroSC, filtros, filtroResponsavel, filtroFornecedor, periodoFornecimento]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [filtroSC, filtros, filtroResponsavel, filtroFornecedor, periodoFornecimento]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const isFilterActive =
    !!filtroSC || !!filtroResponsavel || !!filtroFornecedor ||
    !!periodoFornecimento?.from ||
    Object.values(filtros).some(a => a?.length > 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FilterToolbar active={isFilterActive} onClearAll={handleClearFilters}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="h-8 border border-border bg-background text-foreground rounded-md pl-8 pr-3 text-sm"
            placeholder="Nº SC/OC"
            value={filtroSC}
            onChange={e => setFiltroSC(e.target.value)}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="h-8 border border-border bg-background text-foreground rounded-md pl-8 pr-3 text-sm"
            placeholder="Responsável"
            value={filtroResponsavel}
            onChange={e => setFiltroResponsavel(e.target.value)}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="h-8 border border-border bg-background text-foreground rounded-md pl-8 pr-3 text-sm"
            placeholder="Fornecedor"
            value={filtroFornecedor}
            onChange={e => setFiltroFornecedor(e.target.value)}
          />
        </div>
        <FilterBar
          key={filterKey}
          storageKey={FILTROS_STORAGE_KEY}
          filters={[
            { key: "status", label: "Status", options: ["A iniciar", "Em andamento", "Concluído", "Cancelado", "Atrasado"] },
            { key: "etapa", label: "Etapa", options: ETAPAS.map(e => e.label) },
          ]}
          onChange={setFiltros}
        />
        <DateRangePicker
          label="Período de Fornecimento"
          value={periodoFornecimento}
          onChange={setPeriodoFornecimento}
          onClear={() => setPeriodoFornecimento(null)}
        />
      </FilterToolbar>

      {/* KPI Cards — stage colors are pipeline identity, kept as inline styles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map(etapa => (
          <Card key={etapa.key} className="shadow-sm border-0" style={{ backgroundColor: etapa.cor }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-white">{etapa.count}</p>
              <p className="text-xs text-white/80 mt-1 leading-tight">{etapa.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground min-w-40">Descrição</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground min-w-24">Pacote</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground min-w-20">Fornecedor</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">Qtd / Und</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-24">Nº SC/OC</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground">Linha do Tempo do Processo</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">Data Crono.</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground min-w-24 whitespace-normal leading-tight">ID Cronograma</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground min-w-16">Status</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 10 }).map((__, j) => (
                    <td key={j} className="py-3 px-3"><Skeleton className="h-5 w-full" /></td>
                  ))}
                </tr>
              ))}
              {!isLoading && isError && (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <p className="text-status-critical font-medium">Erro ao carregar dados</p>
                    <p className="text-muted-foreground/50 text-xs mt-1">Tente recarregar a página</p>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <p className="text-muted-foreground font-medium">Nenhum item cadastrado</p>
                    <p className="text-muted-foreground/50 text-xs mt-1">Clique em &quot;Novo Item&quot; para começar</p>
                  </td>
                </tr>
              )}
              {paginated.map(item => {
                const etapas = item.etapas?.length === 7 ? item.etapas : DEFAULT_ETAPAS;
                const atrasado = isAtrasado(item);

                return (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-medium text-foreground text-xs leading-snug">{item.descricao}</p>
                      {item.responsavel && <p className="text-muted-foreground text-xs mt-0.5">{item.responsavel}</p>}
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {item.pacote_id ? pacoteMap[item.pacote_id] || "—" : "—"}
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {item.fornecedor || "—"}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {item.quantidade ? (
                        <span className="text-xs text-foreground">
                          {item.quantidade}{item.unidade ? <span className="text-muted-foreground/70 ml-0.5">{item.unidade}</span> : null}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">{item.numero_sc || "—"}</span>
                    </td>
                    {/* Timeline — node colors are pipeline stage indicators, kept as inline styles */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-0">
                        {ETAPAS.map((etapaConf, idx) => {
                          const est = getEtapaStatus(item, idx);
                          const cor = NodeColor(est);
                          const dataEtapa = est === "nao_aplicavel" ? "" : etapas[idx]?.data;
                          const isLast = idx === ETAPAS.length - 1;

                          return (
                            <Fragment key={etapaConf.key}>
                              <div className="flex flex-col items-center">
                                <span className="text-muted-foreground/60" style={{ fontSize: 9, marginBottom: 2, whiteSpace: "nowrap" }}>{etapaConf.abbr}</span>
                                <div className="relative flex items-center justify-center">
                                  <button
                                    onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPopover({ itemId: item.id, etapaIdx: idx, rect: r }); }}
                                    className="w-5 h-5 rounded-full border-2 border-card shadow transition-transform hover:scale-125 focus:outline-none"
                                    style={{ backgroundColor: cor, boxShadow: `0 0 0 2px ${cor}40` }}
                                    title={`${etapaConf.label}: ${est}`}
                                  />
                                  {est === "nao_aplicavel" && (
                                    <div
                                      className="absolute pointer-events-none rounded-full"
                                      style={{ width: "140%", height: 2, backgroundColor: "#6b7280", transform: "rotate(-45deg)" }}
                                    />
                                  )}
                                </div>
                                <div className="mt-1 h-3 flex items-center justify-center">
                                  <span
                                    className={`font-medium ${atrasado && isLast ? "text-status-critical" : "text-muted-foreground/60"}`}
                                    style={{ fontSize: 8, whiteSpace: "nowrap" }}
                                  >
                                    {atrasado && isLast && <AlertTriangle className="inline w-2 h-2 mr-0.5" />}
                                    {formatDate(dataEtapa)}
                                  </span>
                                </div>
                              </div>
                              {!isLast && (
                                <div className="h-0.5 flex-1" style={{ backgroundColor: est === "concluida" ? "#15803d" : "#e5e7eb", minWidth: 6 }} />
                              )}
                            </Fragment>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center text-xs text-muted-foreground whitespace-nowrap">
                      {item.data_cronograma ? formatDate(item.data_cronograma) : "—"}
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground max-w-24">
                      {item.id_cronograma ? (
                        <span className="leading-snug break-words">
                          {tarefaLabel(item.id_cronograma)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <StatusBadge status={item.status} className="px-1.5 py-px text-[10px]" />
                    </td>
                    <td className="py-3 px-2">
                      <RowActions
                        onEdit={() => { setEditItem(item); setShowForm(true); }}
                        onDelete={() => deleteItem.mutate(item.id)}
                        deleteDescription={`${item.descricao || "Este item"} será removido permanentemente.`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted text-xs text-muted-foreground">
          <span>
            {filtered.length === 0
              ? "0 itens"
              : `Mostrando ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} de ${filtered.length} itens`}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-card"
            >‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-2 py-1 rounded border ${p === page ? "bg-foreground text-background border-foreground" : "border-border hover:bg-card"}`}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-card"
            >›</button>
          </div>
        </div>
      </div>

      {popover && (() => {
        const item = itens.find(i => i.id === popover.itemId);
        if (!item) return null;
        return (
          <Popover
            item={item}
            etapaIdx={popover.etapaIdx}
            rect={popover.rect}
            onClose={() => setPopover(null)}
            onSave={(data) => updateItem.mutate({ id: item.id, data })}
          />
        );
      })()}

      {showForm && (
        <ItemMASForm
          item={editItem}
          selectedProjectId={selectedProjectId}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ["itemMAS"] }); setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
