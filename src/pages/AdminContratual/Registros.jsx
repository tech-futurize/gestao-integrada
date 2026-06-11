import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  AlertTriangle,
  Search,
  Trash2,
  Paperclip,
  Link2,
  Upload,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FilterBar from "@/components/ui/FilterBar";
import FilterToolbar from "@/components/ui/FilterToolbar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { FormDialog } from "@/components/ui/FormDialog";
import { entities } from "@/api/supabaseEntities";
import RegistroForm from "@/components/pleitos/RegistroForm";
import RegistroDetalhes from "@/components/pleitos/RegistroDetalhes";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast } from "@/components/ui/use-toast";

const TIPOS_REGISTRO = [
  "Ata de Reunião",
  "Notificação",
  "Carta",
  "E-mail",
  "Memória de Cálculo",
  "Liberações/Autorizações",
  "Solicitações/Requisições",
  "Registros de Qualidade",
  "Registros de Segurança",
  "Registros de Meio Ambiente",
  "Outros",
];

const TIPO_COLORS = {
  "Ata de Reunião":          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Notificação":             "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Carta":                   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "E-mail":                  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Memória de Cálculo":      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Liberações/Autorizações": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Solicitações/Requisições":"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Registros de Qualidade":  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "Registros de Segurança":  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "Registros de Meio Ambiente": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Outros":                  "bg-muted text-muted-foreground",
};

const DIMENSION_COLORS = {
  "Ata de Reunião":          { text: "text-purple-400",  bar: "#c084fc" },
  "Notificação":             { text: "text-red-400",     bar: "#f87171" },
  "Carta":                   { text: "text-blue-400",    bar: "#60a5fa" },
  "E-mail":                  { text: "text-orange-400",  bar: "#fb923c" },
  "Memória de Cálculo":      { text: "text-cyan-400",    bar: "#22d3ee" },
  "Liberações/Autorizações": { text: "text-green-400",   bar: "#4ade80" },
  "Solicitações/Requisições":{ text: "text-yellow-400",  bar: "#facc15" },
  "Registros de Qualidade":  { text: "text-teal-400",    bar: "#2dd4bf" },
  "Registros de Segurança":  { text: "text-rose-400",    bar: "#fb7185" },
  "Registros de Meio Ambiente": { text: "text-emerald-400", bar: "#34d399" },
  "Outros":                  { text: "text-muted-foreground", bar: "#8195A9" },
  "Contratada":              { text: "text-blue-400",    bar: "#60a5fa" },
  "Contratante":             { text: "text-amber-400",   bar: "#fbbf24" },
  "Registrado":              { text: "text-blue-400",    bar: "#60a5fa" },
  "Em Análise":              { text: "text-amber-400",   bar: "#fbbf24" },
  "Resolvido":               { text: "text-green-400",   bar: "#4ade80" },
};

const STATUS_ORDER = ["Registrado", "Em Análise", "Resolvido"];

const STATUS_SECTION_COLORS = {
  "Registrado": {
    text: "text-blue-600 dark:text-blue-400",
    bar:  "bg-blue-500 dark:bg-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  "Em Análise": {
    text: "text-amber-600 dark:text-amber-400",
    bar:  "bg-amber-500 dark:bg-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  "Resolvido": {
    text: "text-green-600 dark:text-green-400",
    bar:  "bg-green-500 dark:bg-green-400",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
};

const RESP_COLORS = {
  "Contratada":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Contratante": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const REGISTRO_COLUMNS = [
  { key: "tipo_registro",       label: "Tipo",            type: "string" },
  { key: "descricao",           label: "Descrição",       type: "string", required: true },
  { key: "data_hora",           label: "Data/Hora",       type: "date" },
  { key: "responsavel_registro",label: "Responsável",     type: "string" },
  { key: "impacto_preliminar",  label: "Impacto",         type: "string" },
  { key: "responsabilidade",    label: "Responsabilidade",type: "string" },
  { key: "status",              label: "Status",          type: "string" },
];

// Regex para validar UUID v4
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Registros() {
  const { selectedProjectId } = useProject();
  const { id: registroIdParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (msg) =>
    toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });

  const [showForm, setShowForm] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtros, setFiltros] = useState({});
  const [periodoData, setPeriodoData] = useState(null);
  const [filterKey, setFilterKey] = useState(0);
  const [showImportExport, setShowImportExport] = useState(false);
  const [collapsed, setCollapsed] = useState(new Set());
  const FILTROS_KEY = "registros-filtros";

  const { data: incidentes = [], isLoading, isError } = useQuery({
    queryKey: ["registros", selectedProjectId],
    queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  // Fallback para deep-link: busca o registro diretamente se ainda não está na lista
  const isValidUUID = UUID_RE.test(registroIdParam ?? "");
  const registroNaLista = registroIdParam
    ? incidentes.find((i) => i.id === registroIdParam)
    : null;
  const { data: registroFallback, isPending: fallbackPending } = useQuery({
    queryKey: ["registro", registroIdParam],
    queryFn: () =>
      entities.Registro.filter({ id: registroIdParam }).then((r) => r[0] ?? null),
    enabled: isValidUUID && !isLoading && !registroNaLista,
  });
  const registroSelecionado = registroNaLista ?? registroFallback ?? null;

  const createMutation = useMutation({
    mutationFn: (data) => entities.Registro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      setShowForm(false);
      setEditingRegistro(null);
      toast({ title: "Registro criado com sucesso." });
    },
    onError: (e) => onErr(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Registro.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      toast({ title: "Registro excluído." });
    },
    onError: (e) => onErr(e.message),
  });

  const handleSubmit = (data) => {
    const payload = { ...data, projeto_id: selectedProjectId };
    if (editingRegistro) {
      // edição ocorre no detalhe
    } else {
      createMutation.mutate(payload);
    }
  };

  const baseList = useMemo(
    () => incidentes
      .filter((i) => i.tipo_registro !== "RDO")
      .map((i) => i.status === "Fechado" ? { ...i, status: "Resolvido" } : i),
    [incidentes]
  );

  const filtered = useMemo(() => {
    const tp = filtros.tipo || [];
    const st = filtros.status || [];
    const resp = filtros.responsabilidade || [];
    return baseList.filter((inc) => {
      if (tp.length > 0 && !tp.includes(inc.tipo_registro)) return false;
      if (st.length > 0 && !st.includes(inc.status)) return false;
      if (resp.length > 0 && !resp.includes(inc.responsabilidade)) return false;
      if (periodoData?.from && inc.data_hora && new Date(inc.data_hora) < periodoData.from)
        return false;
      if (
        periodoData?.to &&
        inc.data_hora &&
        new Date(inc.data_hora) > new Date(periodoData.to.getTime() + 86399999)
      )
        return false;
      const needle = searchText.toLowerCase();
      if (needle) {
        const match =
          (inc.descricao || "").toLowerCase().includes(needle) ||
          (inc.tipo_registro || "").toLowerCase().includes(needle) ||
          (inc.responsavel_registro || "").toLowerCase().includes(needle);
        if (!match) return false;
      }
      return true;
    });
  }, [baseList, filtros, searchText, periodoData]);

  // Agrupamento por status na ordem definida
  const groupedByStatus = useMemo(() => {
    const groups = [];
    const used = new Set();
    for (const status of STATUS_ORDER) {
      const items = filtered.filter((i) => i.status === status);
      if (items.length > 0) {
        groups.push({ status, items });
        used.add(status);
      }
    }
    const outros = filtered.filter((i) => !used.has(i.status));
    if (outros.length > 0) groups.push({ status: "Outros", items: outros });
    return groups;
  }, [filtered]);

  const kpis = useMemo(() => {
    const total = baseList.length;

    // Tipos presentes na lista, ordenados por contagem decrescente
    const tipoMap = {};
    baseList.forEach((i) => {
      if (i.tipo_registro) tipoMap[i.tipo_registro] = (tipoMap[i.tipo_registro] || 0) + 1;
    });
    const porTipo = Object.entries(tipoMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    return {
      total,
      porTipo,
      porResp: [
        { label: "Contratada",  count: baseList.filter((i) => i.responsabilidade === "Contratada").length },
        { label: "Contratante", count: baseList.filter((i) => i.responsabilidade === "Contratante").length },
      ],
      porStatus: [
        { label: "Registrado", count: baseList.filter((i) => i.status === "Registrado").length },
        { label: "Em Análise", count: baseList.filter((i) => i.status === "Em Análise").length },
        { label: "Resolvido",  count: baseList.filter((i) => i.status === "Resolvido").length },
      ],
    };
  }, [baseList]);

  const dimensionGroups = [
    { title: "Por Tipo",            items: kpis.porTipo },
    { title: "Por Responsabilidade",items: kpis.porResp },
    { title: "Por Status",          items: kpis.porStatus },
  ];

  function toggleCollapse(status) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  // ─────────────────────────────────────────────────────────
  // Sem projeto selecionado
  // ─────────────────────────────────────────────────────────
  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={AlertTriangle}
            description="Selecione um projeto na barra lateral para ver os registros."
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Detalhe por rota
  // ─────────────────────────────────────────────────────────
  if (registroIdParam) {
    const carregando =
      isValidUUID && (isLoading || fallbackPending) && !registroSelecionado;

    if (carregando) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader detail="Carregando..." />
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando registro...
          </div>
        </div>
      );
    }

    if (!registroSelecionado) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader detail="Não encontrado" />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <p className="text-sm">Registro não encontrado.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin-contratual/registros")}
            >
              Voltar à lista
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <PageHeader
          detail={`${registroSelecionado.tipo_registro || "Registro"} — ${formatDate(registroSelecionado.data_hora)}`}
        />
        <div className="flex-1 overflow-auto">
          <RegistroDetalhes
            registro={registroSelecionado}
            onBack={() => navigate("/admin-contratual/registros")}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Lista principal
  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar / Exportar
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditingRegistro(null); setShowForm(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {isError && (
            <div className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
              Erro ao carregar registros. Tente recarregar a página.
            </div>
          )}

          {/* Filtros */}
          {(() => {
            const isFilterActive =
              !!searchText ||
              !!periodoData?.from ||
              Object.values(filtros).some((a) => a?.length > 0);
            const handleClearAll = () => {
              setSearchText("");
              setPeriodoData(null);
              setFiltros({});
              localStorage.removeItem(FILTROS_KEY);
              setFilterKey((k) => k + 1);
            };
            return (
              <FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    className="h-8 border border-border bg-background text-foreground rounded-md pl-8 pr-3 text-sm"
                    placeholder="Buscar por descrição, tipo ou responsável..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <FilterBar
                  key={filterKey}
                  storageKey={FILTROS_KEY}
                  filters={[
                    { key: "tipo",             label: "Tipo",             options: TIPOS_REGISTRO },
                    { key: "status",           label: "Status",           options: ["Registrado", "Em Análise", "Resolvido"] },
                    { key: "responsabilidade", label: "Responsabilidade", options: ["Contratada", "Contratante"] },
                  ]}
                  onChange={setFiltros}
                />
                <DateRangePicker
                  label="Período"
                  value={periodoData}
                  onChange={setPeriodoData}
                  onClear={() => setPeriodoData(null)}
                />
              </FilterToolbar>
            );
          })()}

          {/* KPI Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl flex-1" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">

              {/* Card Total */}
              <div className="rounded-xl px-4 py-4 flex flex-col justify-center gap-1 lg:min-w-[110px] bg-card border border-border dark:bg-cyan-electric/[0.06] dark:border-cyan-electric/20 dark:shadow-[0_0_14px_rgba(38,255,255,0.12)]">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Total</span>
                <span className="text-3xl font-bold leading-none text-foreground dark:text-cyan-electric">
                  {kpis.total}
                </span>
                <span className="text-[10px] text-muted-foreground">registros</span>
              </div>

              {dimensionGroups.map(({ title, items }) => (
                <div
                  key={title}
                  className="flex-1 rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">
                    {title}
                  </p>
                  <div className="flex flex-col gap-2">
                    {items.map(({ label, count }) => {
                      const colors = DIMENSION_COLORS[label] || { text: "text-foreground", bar: "#8195A9" };
                      const pct = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
                      return (
                        <div key={label} className="flex flex-col gap-0.5">
                          <div className="flex justify-between items-center">
                            <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
                            <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
                          </div>
                          <div className="h-[3px] w-full rounded-full bg-muted/30">
                            <div
                              className="h-[3px] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: colors.bar }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seções por status */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-28 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-base font-medium">
                {baseList.length === 0
                  ? "Nenhum registro cadastrado"
                  : "Nenhum registro corresponde aos filtros"}
              </p>
              {baseList.length === 0 && (
                <p className="text-sm mt-1">Clique em &quot;Novo Registro&quot; para começar.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByStatus.map(({ status, items }) => {
                const isCollapsed = collapsed.has(status);
                const secColors = STATUS_SECTION_COLORS[status] || {
                  text: "text-muted-foreground",
                  bar: "bg-border",
                  badge: "bg-muted text-muted-foreground",
                };
                return (
                  <div key={status}>
                    {/* Cabeçalho da seção */}
                    <button
                      onClick={() => toggleCollapse(status)}
                      className="w-full flex items-center gap-2 py-2 px-1 mb-3 text-left group"
                    >
                      {isCollapsed ? (
                        <ChevronRight className={`w-4 h-4 ${secColors.text} shrink-0`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${secColors.text} shrink-0`} />
                      )}
                      <span className={`text-sm font-bold uppercase tracking-wider ${secColors.text}`}>
                        {status}
                      </span>
                      <span className={`ml-1 text-xs font-bold rounded-full px-2 py-0.5 ${secColors.badge}`}>
                        {items.length}
                      </span>
                      <div className={`flex-1 h-px ${secColors.bar} ml-2 opacity-40`} />
                    </button>

                    {/* Grid de cards */}
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((inc) => {
                          const dataFormatada = formatDate(inc.data_hora) || "—";
                          const tipoClass =
                            TIPO_COLORS[inc.tipo_registro] || "bg-muted text-muted-foreground";
                          return (
                            <div
                              key={inc.id}
                              onClick={() => navigate(`/admin-contratual/registros/${inc.id}`)}
                              className="bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:border-border/80 transition-all cursor-pointer"
                            >
                              {/* Card Header */}
                              <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-semibold ${tipoClass}`}
                                >
                                  {inc.tipo_registro || "—"}
                                </Badge>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {dataFormatada}
                                </span>
                              </div>

                              {/* Card Body */}
                              <div className="px-4 py-2 flex-1 space-y-2">
                                <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                                  {inc.descricao || (
                                      <span className="text-muted-foreground italic">
                                        Sem descrição
                                      </span>
                                    )}
                                </p>
                                {inc.impacto_preliminar && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 italic border-l-2 border-border pl-2">
                                    {inc.impacto_preliminar}
                                  </p>
                                )}
                                {inc.responsabilidade && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RESP_COLORS[inc.responsabilidade] || "bg-muted text-muted-foreground"}`}>
                                      {inc.responsabilidade}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Card Footer */}
                              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {inc.responsavel_registro && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {inc.responsavel_registro}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span
                                    className={`flex items-center gap-1 text-xs font-medium ${(inc.anexos?.length || 0) > 0 ? "text-foreground" : "text-muted-foreground/50"}`}
                                    title={`${inc.anexos?.length || 0} anexo(s)`}
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    {inc.anexos?.length || 0}
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 text-xs font-medium ${(inc.atividades_vinculadas?.length || 0) > 0 ? "text-foreground" : "text-muted-foreground/50"}`}
                                    title={`${inc.atividades_vinculadas?.length || 0} vínculo(s)`}
                                  >
                                    <Link2 className="w-3.5 h-3.5" />
                                    {inc.atividades_vinculadas?.length || 0}
                                  </span>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-status-critical hover:bg-status-critical/10 shrink-0"
                                  aria-label="Excluir registro"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(inc.id);
                                  }}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Modal — Novo Registro */}
      <FormDialog
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingRegistro(null); } }}
        icon={FileText}
        title={editingRegistro ? "Editar Registro" : "Novo Registro"}
        subtitle="Preencha os dados do registro contratual"
        maxWidth="max-w-3xl"
        hideFooter
      >
        <RegistroForm
          key={editingRegistro?.id || "new-registro"}
          incidente={editingRegistro}
          selectedProjectId={selectedProjectId}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingRegistro(null); }}
          isSubmitting={createMutation.isPending}
          noChrome
        />
      </FormDialog>

      {/* Confirm delete */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-critical hover:bg-status-critical/90"
              onClick={() => {
                deleteMutation.mutate(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import/Export */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={REGISTRO_COLUMNS}
        exportFileName="registros"
        title="Registros — Importar / Exportar"
        onExport={() => baseList}
        onImport={(row) =>
          createMutation.mutateAsync({ ...row, projeto_id: selectedProjectId })
        }
      />
    </div>
  );
}
