import { useState, useMemo } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labelRisco, CLASSIFICACOES } from "@/utils/riscosUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RowActions from "@/components/ui/RowActions";
import FilterBar from "@/components/ui/FilterBar";
import FilterToolbar from "@/components/ui/FilterToolbar";
import { Plus, CheckCircle2, Clock, X, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/dateUtils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KPICard } from "@/components/ui/KPICard";
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
  const [buscaResp, setBuscaResp]         = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim]       = useState("");
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

  const responsaveisDistintos = useMemo(() =>
    [...new Set(acoes.map(a => a.responsavel).filter(Boolean))].sort(),
  [acoes]);

  const filtered = useMemo(() => {
    const statusFiltro = filtros.status         || [];
    const classFiltro  = filtros.classificacao  || [];
    let r = acoesCalc;

    if (buscaResp) {
      const b = buscaResp.toLowerCase();
      r = r.filter(a => a.responsavel?.toLowerCase().includes(b));
    }
    if (statusFiltro.length  > 0) r = r.filter(a => statusFiltro.includes(a.status));
    if (classFiltro.length   > 0) r = r.filter(a => classFiltro.includes(a._classificacao));

    if (periodoInicio || periodoFim) {
      r = r.filter(a => {
        const inicio = a.data_inicio_prevista || "";
        const fim    = a.data_fim_prevista    || "";
        const dentroInicio = inicio && (!periodoInicio || inicio >= periodoInicio) && (!periodoFim || inicio <= periodoFim);
        const dentroFim    = fim    && (!periodoInicio || fim    >= periodoInicio) && (!periodoFim || fim    <= periodoFim);
        return dentroInicio || dentroFim;
      });
    }

    return r;
  }, [acoesCalc, buscaResp, filtros, periodoInicio, periodoFim]);

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

  const temFiltroAtivo = buscaResp || periodoInicio || periodoFim ||
    Object.values(filtros).some(a => a?.length > 0);

  const limparFiltros = () => {
    setBuscaResp(""); setPeriodoInicio(""); setPeriodoFim("");
    setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Pendentes"  value={acoesPendentes} icon={<Clock />}         accent="text-status-attention" />
        <KPICard label="Concluídas" value={acoesCompletas} icon={<CheckCircle2 />}  accent="text-status-positive"  />
        <KPICard label="Atrasadas"  value={acoesAtrasadas} icon={<X />}             accent="text-status-critical"  />
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Plano de Ação
          </CardTitle>
          <Button
            onClick={() => { setEditingAcao(null); setFormData(emptyForm); setShowForm(true); }}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Ação
          </Button>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <div className="mb-4">
            <FilterToolbar active={temFiltroAtivo} onClearAll={limparFiltros}>
              {/* Busca por responsável */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-44 bg-background text-foreground"
                  placeholder="Responsável..."
                  value={buscaResp}
                  onChange={e => setBuscaResp(e.target.value)}
                />
              </div>

              {/* Filtros de Status e Ameaça/Oportunidade */}
              <FilterBar
                key={filterKey}
                storageKey={FILTROS_KEY}
                filters={[
                  { key: "status",         label: "Status",             options: STATUS_ACAO    },
                  { key: "classificacao",  label: "Ameaça/Oportunidade", options: CLASSIFICACOES },
                ]}
                onChange={setFiltros}
              />

              {/* Filtro de período */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Período:</span>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={e => setPeriodoInicio(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={e => setPeriodoFim(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>
            </FilterToolbar>
          </div>

          {isLoadingAcoes ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : isErrorAcoes ? (
            <div className="text-center py-12 text-sm text-status-critical">Erro ao carregar ações. Tente recarregar a página.</div>
          ) : acoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhuma ação registrada. Clique em "Nova Ação" para começar.</div>
          ) : (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <SortableTableHead columnKey="descricao"        sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Descrição</SortableTableHead>
                    <TableHead>Risco Vinculado</TableHead>
                    <SortableTableHead columnKey="responsavel"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Responsável</SortableTableHead>
                    <SortableTableHead columnKey="data_fim_prevista" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Previsão</SortableTableHead>
                    <SortableTableHead columnKey="status"           sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Status</SortableTableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acoesSorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Nenhuma ação encontrada com os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : acoesSorted.map((acao) => {
                    const vinculoLabel = getVinculoLabel(acao, riscos);
                    const temVinculo   = !!acao.registro_risco_id;
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

      {/* Popup de nova/editar ação */}
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
