import { useState, useMemo } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labelRisco } from "@/utils/riscosUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RowActions from "@/components/ui/RowActions";
import FilterBar from "@/components/ui/FilterBar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { Plus, CheckCircle2, Clock, X, Search, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, toLocalDateISO } from "@/lib/dateUtils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSortTable } from "@/hooks/useSortTable";
import { SortableTableHead } from "@/components/ui/SortableTableHead";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_ACAO = ["Pendente", "Em Andamento", "Concluída", "Atrasada", "Cancelada"];

const emptyForm = {
  descricao: "",
  formato_tratativa: "Reunião",
  data_inicio_prevista: "",
  data_fim_prevista: "",
  responsavel: "",
  status: "Pendente",
  observacoes: "",
  registro_risco_id: null,
};

function getVinculoLabel(acao, riscos) {
  if (acao.registro_risco_id) {
    const r = riscos.find(x => x.id === acao.registro_risco_id);
    return r ? labelRisco(r) : "Risco";
  }
  return "—";
}

export default function PlanoAcao({ projectId }) {
  const [showForm, setShowForm]           = useState(false);
  const [editingAcao, setEditingAcao]     = useState(null);
  const [formData, setFormData]           = useState(emptyForm);
  const [filtros, setFiltros]             = useState({});
  const [filterKey, setFilterKey]         = useState(0);
  const [busca, setBusca]                       = useState("");
  const [periodoRange, setPeriodoRange]         = useState(null);
  const [tipoFiltro, setTipoFiltro]             = useState(() => new Set(["Ameaça", "Oportunidade"]));
  const [activeCardFilter, setActiveCardFilter] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const FILTROS_KEY = "plano-acao-filtros";

  const { data: acoes = [], isPending: isLoadingAcoes, isError: isErrorAcoes } = useQuery({
    queryKey: ["acoes", projectId],
    queryFn: () => entities.Acao.filter({ projeto_id: projectId }),
    enabled: !!projectId,
  });

  const { data: riscos = [] } = useQuery({
    queryKey: ["riscos", projectId],
    queryFn: () => entities.Risco.filter({ projeto_id: projectId }),
    enabled: !!projectId,
  });

  const riscoById = useMemo(() => {
    const map = {};
    riscos.forEach(r => { map[r.id] = r; });
    return map;
  }, [riscos]);

  const acoesCalc = useMemo(() => acoes.map(a => ({
    ...a,
    _classificacao: a.registro_risco_id ? (riscoById[a.registro_risco_id]?.classificacao || null) : null,
  })), [acoes, riscoById]);

  const filtered = useMemo(() => {
    const statusFiltro = filtros.status || [];
    let r = acoesCalc;

    // 1. Tipo (minicards) — se Set tem exatamente 1 valor, filtra; 0 ou 2 = sem filtro
    if (tipoFiltro.size === 1) {
      const [tipo] = tipoFiltro;
      r = r.filter(a => (a._classificacao || "Ameaça") === tipo);
    }

    // 2. Status (FilterBar)
    if (statusFiltro.length > 0) r = r.filter(a => statusFiltro.includes(a.status));

    // 3. Filtro de card ativo (acumula com demais)
    if (activeCardFilter === "Concluída") r = r.filter(a => a.status === "Concluída");
    if (activeCardFilter === "Pendente")  r = r.filter(a => ["Pendente", "Em Andamento"].includes(a.status));
    if (activeCardFilter === "Atrasada")  r = r.filter(a => a.status === "Atrasada");

    // 4. Período (DateRangePicker)
    if (periodoRange?.from) {
      const from = toLocalDateISO(periodoRange.from);
      const to   = periodoRange.to ? toLocalDateISO(periodoRange.to) : from;
      r = r.filter(a => {
        const di = a.data_inicio_prevista || "";
        const df = a.data_fim_prevista    || "";
        return (di && di >= from && di <= to) || (df && df >= from && df <= to);
      });
    }

    // 5. Busca texto aberta (descrição + responsável + label do risco)
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(a => {
        const desc  = (a.descricao   || "").toLowerCase();
        const resp  = (a.responsavel || "").toLowerCase();
        const risco = labelRisco(riscoById[a.registro_risco_id] || null).toLowerCase();
        return desc.includes(b) || resp.includes(b) || risco.includes(b);
      });
    }

    return r;
  }, [acoesCalc, busca, tipoFiltro, filtros, periodoRange, activeCardFilter, riscoById]);

  const { sortedData: acoesSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "descricao" });

  const createAcaoMutation = useMutation({
    mutationFn: (data) => entities.Acao.create({ ...data, projeto_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acoes"] });
      handleCancel();
      toast({ variant: "success", description: "Ação criada." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateAcaoMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Acao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acoes"] });
      handleCancel();
      toast({ variant: "success", description: "Ação atualizada." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteAcaoMutation = useMutation({
    mutationFn: (id) => entities.Acao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acoes"] });
      toast({ variant: "success", description: "Ação excluída." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    const payload = {
      ...formData,
      projeto_id:        projectId,
      registro_risco_id: formData.registro_risco_id,
      // Postgres rejeita "" em colunas DATE — sem isso, criar ação sem datas falhava
      data_inicio_prevista: formData.data_inicio_prevista || null,
      data_fim_prevista:    formData.data_fim_prevista    || null,
    };
    if (editingAcao) updateAcaoMutation.mutate({ id: editingAcao.id, data: payload });
    else createAcaoMutation.mutate(payload);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAcao(null);
    setFormData(emptyForm);
  };

  const handleEdit = (acao) => {
    setEditingAcao(acao);
    setFormData({
      descricao:            acao.descricao            || "",
      formato_tratativa:    acao.formato_tratativa    || "Reunião",
      data_inicio_prevista: acao.data_inicio_prevista || "",
      data_fim_prevista:    acao.data_fim_prevista    || "",
      responsavel:          acao.responsavel          || "",
      status:               acao.status               || "Pendente",
      observacoes:          acao.observacoes          || "",
      registro_risco_id:    acao.registro_risco_id    || null,
    });
    setShowForm(true);
  };

  const acoesCompletas = acoes.filter(a => a.status === "Concluída").length;
  const acoesPendentes = acoes.filter(a => ["Pendente", "Em Andamento"].includes(a.status)).length;
  const acoesAtrasadas = acoes.filter(a => a.status === "Atrasada").length;

  const temFiltroAtivo = !!(busca || periodoRange?.from || activeCardFilter ||
    Object.values(filtros).some(a => a?.length > 0) ||
    tipoFiltro.size < 2);

  const limparFiltros = () => {
    setBusca("");
    setPeriodoRange(null);
    setActiveCardFilter(null);
    setTipoFiltro(new Set(["Ameaça", "Oportunidade"]));
    setFiltros({});
    localStorage.removeItem(FILTROS_KEY);
    setFilterKey(k => k + 1);
  };

  return (
    <div className="space-y-4 p-6">

      {/* ── LINHA DE FILTROS + NOVA AÇÃO ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Label "Filtros" com botão de limpar */}
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground relative">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="relative pr-1">
            Filtros
            {temFiltroAtivo && (
              <button
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 z-10 transition-colors"
                onClick={limparFiltros}
                aria-label="Limpar todos os filtros"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        </span>

        {/* Minicards Ameaça / Oportunidade */}
        {[
          { key: "Ameaça",       activeStyle: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300"   },
          { key: "Oportunidade", activeStyle: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
        ].map(({ key, activeStyle }) => {
          const isActive = tipoFiltro.has(key);
          return (
            <button
              key={key}
              onClick={() => setTipoFiltro(prev => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key); else next.add(key);
                return next;
              })}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
                ${isActive ? activeStyle : "bg-muted text-muted-foreground border-border opacity-50"}`}
            >
              {isActive ? "●" : "○"} {key}
            </button>
          );
        })}

        {/* Separador */}
        <div className="h-5 w-px bg-border mx-1" />

        {/* FilterBar — apenas Status */}
        <FilterBar
          key={filterKey}
          storageKey={FILTROS_KEY}
          filters={[
            { key: "status", label: "Status", options: STATUS_ACAO },
          ]}
          onChange={setFiltros}
        />

        {/* DateRangePicker */}
        <DateRangePicker
          label="Período"
          value={periodoRange}
          onChange={setPeriodoRange}
          onClear={() => setPeriodoRange(null)}
        />

        {/* Busca aberta — ao final */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-64 bg-background text-foreground"
            placeholder="Buscar por descrição, risco ou responsável..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Botão Nova Ação — direita */}
        <Button
          onClick={() => { setEditingAcao(null); setFormData(emptyForm); setShowForm(true); }}
          size="sm"
          className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      {/* ── 4 KPI CARDS CLICÁVEIS ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Ações", value: acoes.length,   filter: null,        icon: <CheckCircle2 />, accent: "text-foreground"         },
          { label: "Concluídas",     value: acoesCompletas, filter: "Concluída", icon: <CheckCircle2 />, accent: "text-status-positive"    },
          { label: "Pendentes",      value: acoesPendentes, filter: "Pendente",  icon: <Clock />,        accent: "text-status-attention"   },
          { label: "Atrasadas",      value: acoesAtrasadas, filter: "Atrasada",  icon: <X />,            accent: "text-status-critical"    },
        ].map(({ label, value, filter, icon, accent }) => {
          const isCardActive = activeCardFilter === filter;
          return (
            <button
              key={label}
              className={`text-left rounded-lg border p-4 transition-all cursor-pointer
                ${isCardActive
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "bg-card hover:bg-muted/50 border-border shadow-sm"}`}
              onClick={() => setActiveCardFilter(prev => prev === filter ? null : filter)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                <span className="text-muted-foreground/60 [&_svg]:size-4">{icon}</span>
              </div>
              <span className={`text-2xl font-bold leading-none ${accent}`}>{value}</span>
            </button>
          );
        })}
      </div>

      {/* ── CARD DA TABELA ─────────────────────────────────────────────── */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Plano de Ação
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoadingAcoes ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : isErrorAcoes ? (
            <div className="text-center py-12 text-sm text-status-critical">Erro ao carregar ações. Tente recarregar a página.</div>
          ) : acoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhuma ação registrada. Clique em &quot;Nova Ação&quot; para começar.</div>
          ) : (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <SortableTableHead columnKey="descricao"         sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Descrição</SortableTableHead>
                    <TableHead>Risco Vinculado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <SortableTableHead columnKey="responsavel"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Responsável</SortableTableHead>
                    <SortableTableHead columnKey="data_fim_prevista" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Previsão</SortableTableHead>
                    <SortableTableHead columnKey="status"            sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Status</SortableTableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acoesSorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Nenhuma ação encontrada com os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : acoesSorted.map((acao) => {
                    const vinculoLabel   = getVinculoLabel(acao, riscos);
                    const temVinculo     = !!acao.registro_risco_id;
                    const classificacao  = temVinculo ? (riscoById[acao.registro_risco_id]?.classificacao || "Ameaça") : null;
                    return (
                      <TableRow key={acao.id} className="hover:bg-muted">
                        <TableCell className="max-w-sm">
                          <p className="font-medium text-foreground line-clamp-2">{acao.descricao}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{acao.formato_tratativa}</p>
                        </TableCell>
                        <TableCell>
                          {temVinculo ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-700 border-amber-500/20 max-w-[160px] truncate block">
                              {vinculoLabel}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {classificacao ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap
                              ${classificacao === "Ameaça"
                                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"}`}>
                              {classificacao}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{acao.responsavel || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(acao.data_fim_prevista) || "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={acao.status} />
                        </TableCell>
                        <TableCell>
                          <RowActions
                            onEdit={() => handleEdit(acao)}
                            onDelete={() => deleteAcaoMutation.mutate(acao.id)}
                            deleteDescription="A ação de tratamento será excluída permanentemente."
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── FORM DIALOG ────────────────────────────────────────────────── */}
      <FormDialog
        open={showForm}
        onOpenChange={(open) => { if (!open) handleCancel(); }}
        icon={CheckCircle2}
        title={editingAcao ? "Editar Ação" : "Nova Ação"}
        subtitle={editingAcao ? "Editar registro de ação" : "Registrar nova ação de tratamento"}
        maxWidth="max-w-lg"
        onClose={handleCancel}
        footer={
          <>
            {editingAcao && (
              <Button variant="destructive" onClick={() => { deleteAcaoMutation.mutate(editingAcao.id); handleCancel(); }}>
                Excluir
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            <Button variant="save" onClick={handleSubmit} disabled={createAcaoMutation.isPending || updateAcaoMutation.isPending}>
              {editingAcao ? "Salvar" : "Criar"}
            </Button>
          </>
        }
      >
        <SectionDivider label="Risco Associado" />
        <div className="space-y-2">
          <Label>Risco</Label>
          <Select
            value={formData.registro_risco_id || "__none__"}
            onValueChange={(v) => setFormData(f => ({ ...f, registro_risco_id: v === "__none__" ? null : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Selecione o risco..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Nenhum</SelectItem>
              {riscos.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {`[${r.classificacao || "Ameaça"}] ${labelRisco(r)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SectionDivider label="Identificação" />
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Descrição da Ação *</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva a ação de tratamento..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>Formato da Tratativa</Label>
            <Select value={formData.formato_tratativa} onValueChange={(v) => setFormData({ ...formData, formato_tratativa: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Reunião", "Documento", "Inspeção", "Análise Técnica", "Negociação", "Outros"].map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SectionDivider label="Prazo e Responsável" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Início Previsto</Label>
            <Input type="date" value={formData.data_inicio_prevista}
              onChange={(e) => setFormData({ ...formData, data_inicio_prevista: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Fim Previsto</Label>
            <Input type="date" value={formData.data_fim_prevista}
              onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Responsável</Label>
            <Input
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável"
            />
          </div>
        </div>

        <SectionDivider label="Acompanhamento" />
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ACAO.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
