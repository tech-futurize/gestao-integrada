import { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labelRisco, labelMudanca } from "@/utils/riscosUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RowActions from "@/components/ui/RowActions";
import { Plus, CheckCircle2, Clock, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/dateUtils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KPICard } from "@/components/ui/KPICard";
import { useSortTable } from "@/hooks/useSortTable";
import { SortableTableHead } from "@/components/ui/SortableTableHead";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emptyForm = {
  descricao: "",
  formato_tratativa: "Reunião",
  data_inicio_prevista: "",
  data_fim_prevista: "",
  responsavel: "",
  status: "Pendente",
  observacoes: "",
  registro_risco_id: null,
  registro_mudanca_id: null,
};

function getVinculoLabel(acao, riscos, mudancas) {
  if (acao.registro_risco_id) {
    const r = riscos.find(x => x.id === acao.registro_risco_id);
    return { label: r ? labelRisco(r) : "Risco", tipo: "risco" };
  }
  if (acao.registro_mudanca_id) {
    const m = mudancas.find(x => x.id === acao.registro_mudanca_id);
    return { label: m ? labelMudanca(m) : "Mudança", tipo: "mudanca" };
  }
  return { label: "—", tipo: null };
}

export default function PlanoAcao({ projectId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAcao, setEditingAcao] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [vinculoTipo, setVinculoTipo] = useState("risco");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: acoes = [], isPending: isLoadingAcoes, isError: isErrorAcoes } = useQuery({
    queryKey: ["acoes", projectId],
    queryFn: () => entities.Acao.filter({ projeto_id: projectId }),
    enabled: !!projectId,
  });

  const { sortedData: acoesSorted, sortKey, sortDir, handleSort } = useSortTable(acoes, { defaultKey: "descricao" });

  const { data: riscos = [] } = useQuery({
    queryKey: ["riscos", projectId],
    queryFn: () => entities.Risco.filter({ projeto_id: projectId }),
    enabled: !!projectId,
  });

  const { data: mudancas = [] } = useQuery({
    queryKey: ["mudancas_contratuais", projectId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: projectId }),
    enabled: !!projectId,
  });

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
      projeto_id: projectId,
      registro_risco_id:   vinculoTipo === "risco"   ? formData.registro_risco_id   : null,
      registro_mudanca_id: vinculoTipo === "mudanca" ? formData.registro_mudanca_id : null,
    };
    if (editingAcao) updateAcaoMutation.mutate({ id: editingAcao.id, data: payload });
    else createAcaoMutation.mutate(payload);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAcao(null);
    setFormData(emptyForm);
    setVinculoTipo("risco");
  };

  const handleEdit = (acao) => {
    setEditingAcao(acao);
    setFormData({
      descricao: acao.descricao || "",
      formato_tratativa: acao.formato_tratativa || "Reunião",
      data_inicio_prevista: acao.data_inicio_prevista || "",
      data_fim_prevista: acao.data_fim_prevista || "",
      responsavel: acao.responsavel || "",
      status: acao.status || "Pendente",
      observacoes: acao.observacoes || "",
      registro_risco_id: acao.registro_risco_id || null,
      registro_mudanca_id: acao.registro_mudanca_id || null,
    });
    setVinculoTipo(acao.registro_mudanca_id ? "mudanca" : "risco");
    setShowForm(true);
  };

  const acoesCompletas = acoes.filter((a) => a.status === "Concluída").length;
  const acoesPendentes = acoes.filter((a) => ["Pendente", "Em Andamento"].includes(a.status)).length;
  const acoesAtrasadas = acoes.filter((a) => a.status === "Atrasada").length;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Pendentes" value={acoesPendentes} icon={<Clock />} accent="text-status-attention" />
        <KPICard label="Concluídas" value={acoesCompletas} icon={<CheckCircle2 />} accent="text-status-positive" />
        <KPICard label="Atrasadas" value={acoesAtrasadas} icon={<X />} accent="text-status-critical" />
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Plano de Ação
          </CardTitle>
          <Button
            onClick={() => { setEditingAcao(null); setFormData(emptyForm); setVinculoTipo("risco"); setShowForm(true); }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Ação
          </Button>
        </CardHeader>
        <CardContent>
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
                    <SortableTableHead columnKey="descricao" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Descrição</SortableTableHead>
                    <TableHead>Vínculo</TableHead>
                    <SortableTableHead columnKey="responsavel" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Responsável</SortableTableHead>
                    <SortableTableHead columnKey="data_fim_prevista" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Previsão</SortableTableHead>
                    <SortableTableHead columnKey="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Status</SortableTableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acoesSorted.map((acao) => {
                    const vinculo = getVinculoLabel(acao, riscos, mudancas);
                    const vinculoStyle = vinculo.tipo === "risco"
                      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      : vinculo.tipo === "mudanca"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : "";
                    return (
                      <TableRow key={acao.id} className="hover:bg-muted">
                        <TableCell className="max-w-sm">
                          <p className="font-medium text-foreground line-clamp-2">{acao.descricao}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{acao.formato_tratativa}</p>
                        </TableCell>
                        <TableCell>
                          {vinculo.tipo ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${vinculoStyle} max-w-[140px] truncate block`}>
                              {vinculo.label}
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
        <SectionDivider label="Vínculo" />
        <div className="space-y-3">
          <div className="flex gap-4">
            {[["risco", "Risco"], ["mudanca", "Mudança"]].map(([tipo, label]) => (
              <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="vinculo-tipo"
                  value={tipo}
                  checked={vinculoTipo === tipo}
                  onChange={() => {
                    setVinculoTipo(tipo);
                    setFormData(f => ({ ...f, registro_risco_id: null, registro_mudanca_id: null }));
                  }}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          <Select
            value={
              vinculoTipo === "risco"
                ? (formData.registro_risco_id || "__none__")
                : (formData.registro_mudanca_id || "__none__")
            }
            onValueChange={(v) => {
              const id = v === "__none__" ? null : v;
              setFormData(f =>
                vinculoTipo === "risco"
                  ? { ...f, registro_risco_id: id, registro_mudanca_id: null }
                  : { ...f, registro_risco_id: null, registro_mudanca_id: id }
              );
            }}
          >
            <SelectTrigger><SelectValue placeholder="Selecione o vínculo..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Nenhum</SelectItem>
              {vinculoTipo === "risco"
                ? riscos.map(r => <SelectItem key={r.id} value={r.id}>{labelRisco(r)}</SelectItem>)
                : mudancas.map(m => <SelectItem key={m.id} value={m.id}>{labelMudanca(m)}</SelectItem>)
              }
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
            <Input value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável" />
          </div>
        </div>

        <SectionDivider label="Acompanhamento" />
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Pendente", "Em Andamento", "Concluída", "Atrasada", "Cancelada"].map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..." rows={2} />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
