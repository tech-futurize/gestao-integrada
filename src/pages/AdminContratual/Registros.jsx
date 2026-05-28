import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertTriangle, Search, Edit, Trash2, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import FilterBar from "@/components/ui/FilterBar";
import { entities } from "@/api/supabaseEntities";
import RegistroForm from "@/components/pleitos/RegistroForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  Registrado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Em Análise": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Resolvido: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const TIPO_COLORS = {
  "Ata de Reunião": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "E-mail": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Notificação: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const DIMENSION_COLORS = {
  "Ata de Reunião": { text: "text-purple-400", bar: "#c084fc" },
  "E-mail": { text: "text-orange-400", bar: "#fb923c" },
  "Notificação": { text: "text-red-400", bar: "#f87171" },
  "Contratada": { text: "text-blue-400", bar: "#60a5fa" },
  "Contratante": { text: "text-amber-400", bar: "#fbbf24" },
  "Registrado": { text: "text-blue-400", bar: "#60a5fa" },
  "Em Análise": { text: "text-amber-400", bar: "#fbbf24" },
  "Resolvido": { text: "text-green-400", bar: "#4ade80" },
};

export default function Registros() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (msg) => toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });

  const [showForm, setShowForm] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtros, setFiltros] = useState({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: incidentes = [], isLoading, isError } = useQuery({
    queryKey: ["registros", selectedProjectId],
    queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Registro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      setShowForm(false);
      setEditingRegistro(null);
    },
    onError: (e) => onErr(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Registro.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      setShowForm(false);
      setEditingRegistro(null);
    },
    onError: (e) => onErr(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Registro.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["registros"] }),
    onError: (e) => onErr(e.message),
  });

  const handleSubmit = (data) => {
    const payload = { ...data, projeto_id: selectedProjectId };
    if (editingRegistro) updateMutation.mutate({ id: editingRegistro.id, data: payload });
    else createMutation.mutate(payload);
  };

  const baseList = useMemo(
    () => incidentes.filter((i) => i.tipo_registro !== "RDO"),
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
      if (dateFrom && inc.data_hora && new Date(inc.data_hora) < new Date(dateFrom)) return false;
      if (dateTo && inc.data_hora && new Date(inc.data_hora) > new Date(dateTo + "T23:59:59")) return false;
      const needle = searchText.toLowerCase();
      if (needle) {
        const matchText =
          (inc.descricao || "").toLowerCase().includes(needle) ||
          (inc.tipo_registro || "").toLowerCase().includes(needle) ||
          (inc.responsavel_registro || "").toLowerCase().includes(needle);
        if (!matchText) return false;
      }
      return true;
    });
  }, [baseList, filtros, searchText, dateFrom, dateTo]);

  const kpis = useMemo(() => {
    const total = baseList.length;
    return {
      total,
      porTipo: [
        { label: "Ata de Reunião", count: baseList.filter((i) => i.tipo_registro === "Ata de Reunião").length },
        { label: "E-mail", count: baseList.filter((i) => i.tipo_registro === "E-mail").length },
        { label: "Notificação", count: baseList.filter((i) => i.tipo_registro === "Notificação").length },
      ],
      porResp: [
        { label: "Contratada", count: baseList.filter((i) => i.responsabilidade === "Contratada").length },
        { label: "Contratante", count: baseList.filter((i) => i.responsabilidade === "Contratante").length },
      ],
      porStatus: [
        { label: "Registrado", count: baseList.filter((i) => i.status === "Registrado").length },
        { label: "Em Análise", count: baseList.filter((i) => i.status === "Em Análise").length },
        { label: "Resolvido", count: baseList.filter((i) => i.status === "Resolvido").length },
      ],
    };
  }, [baseList]);

  const dimensionGroups = [
    { title: "Por Tipo", items: kpis.porTipo },
    { title: "Por Responsabilidade", items: kpis.porResp },
    { title: "Por Status", items: kpis.porStatus },
  ];

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

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditingRegistro(null); setShowForm(true); }}>
            <Plus className="w-5 h-5 mr-2" />
            Novo Registro
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {isError && (
          <div className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
            Erro ao carregar registros. Tente recarregar a página.
          </div>
        )}

        {/* Form inline */}
        {showForm && (
          <RegistroForm
            key={editingRegistro?.id || "new-incidente"}
            incidente={editingRegistro}
            casos={[]}
            tarefas={tarefas}
            selectedProjectId={selectedProjectId}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingRegistro(null); }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

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
            <div
              className="rounded-xl px-4 py-4 flex flex-col justify-center gap-1 lg:min-w-[110px]"
              style={{
                background: "rgba(38,255,255,0.06)",
                border: "1px solid rgba(38,255,255,0.2)",
                boxShadow: "0 0 14px rgba(38,255,255,0.12)",
              }}
            >
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Total</span>
              <span
                className="text-3xl font-bold leading-none text-cyan-electric"
                style={{ textShadow: "0 0 14px rgba(38,255,255,0.6)" }}
              >
                {kpis.total}
              </span>
              <span className="text-[10px] text-muted-foreground">registros</span>
            </div>

            {/* Por Tipo */}
            <div className="flex-1 rounded-xl px-4 py-3 bg-card border border-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">Por Tipo</p>
              <div className="flex flex-col gap-2">
                {kpis.porTipo.map(({ label, count }) => {
                  const colors = DIMENSION_COLORS[label] || { text: "text-foreground", bar: "#8195A9" };
                  const pct = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
                  return (
                    <div key={label} className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
                        <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
                      </div>
                      <div className="h-[3px] w-full rounded-full bg-muted/40">
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

            {/* Por Responsabilidade */}
            <div className="flex-1 rounded-xl px-4 py-3 bg-card border border-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">Por Responsabilidade</p>
              <div className="flex flex-col gap-2">
                {kpis.porResp.map(({ label, count }) => {
                  const colors = DIMENSION_COLORS[label] || { text: "text-foreground", bar: "#8195A9" };
                  const pct = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
                  return (
                    <div key={label} className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
                        <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
                      </div>
                      <div className="h-[3px] w-full rounded-full bg-muted/40">
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

            {/* Por Status */}
            <div className="flex-1 rounded-xl px-4 py-3 bg-card border border-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">Por Status</p>
              <div className="flex flex-col gap-2">
                {kpis.porStatus.map(({ label, count }) => {
                  const colors = DIMENSION_COLORS[label] || { text: "text-foreground", bar: "#8195A9" };
                  const pct = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
                  return (
                    <div key={label} className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
                        <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
                      </div>
                      <div className="h-[3px] w-full rounded-full bg-muted/40">
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

          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por descrição, tipo ou responsável..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-0">
              <FilterBar
                storageKey="registros-filtros"
                filters={[
                  { key: "tipo", label: "Tipo", options: ["Ata de Reunião", "E-mail", "Notificação"] },
                  { key: "status", label: "Status", options: ["Registrado", "Em Análise", "Resolvido"] },
                  { key: "responsabilidade", label: "Responsabilidade", options: ["Contratada", "Contratante"] },
                ]}
                onChange={setFiltros}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CalendarRange className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                className="w-36 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Data inicial"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input
                type="date"
                className="w-36 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Data final"
              />
            </div>
          </div>
        </div>

        {/* Cards Grid */}
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
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-base font-medium">
              {baseList.length === 0 ? "Nenhum registro cadastrado" : "Nenhum registro corresponde aos filtros"}
            </p>
            {baseList.length === 0 && (
              <p className="text-sm mt-1">Clique em &quot;Novo Registro&quot; para começar.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((inc) => {
              const dataFormatada = inc.data_hora
                ? format(new Date(inc.data_hora), "dd/MM/yyyy", { locale: ptBR })
                : "—";
              const tipoClass = TIPO_COLORS[inc.tipo_registro] || "bg-muted text-muted-foreground";
              const statusClass = STATUS_COLORS[inc.status] || "bg-muted text-muted-foreground";

              return (
                <div
                  key={inc.id}
                  className="bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
                    <Badge variant="outline" className={`text-xs font-semibold ${tipoClass}`}>
                      {inc.tipo_registro || "—"}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{dataFormatada}</span>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-2 flex-1 space-y-1">
                    <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                      {inc.descricao || inc.ocorrencias || <span className="text-muted-foreground italic">Sem descrição</span>}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${statusClass} shrink-0`}>
                        {inc.status || "—"}
                      </Badge>
                      {inc.responsavel_registro && (
                        <span className="text-xs text-muted-foreground truncate">
                          {inc.responsavel_registro}
                        </span>
                      )}
                      {inc.anexos?.length > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0" title={`${inc.anexos.length} anexo(s)`}>
                          📎 {inc.anexos.length}
                        </span>
                      )}
                      {inc.atividades_vinculadas?.length > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0" title={`${inc.atividades_vinculadas.length} atividade(s) vinculada(s)`}>
                          🔗 {inc.atividades_vinculadas.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => { setEditingRegistro(inc); setShowForm(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-status-critical hover:bg-status-critical/10"
                        onClick={() => deleteMutation.mutate(inc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
