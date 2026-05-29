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
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, CheckCircle2, Clock, X, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { KPICard } from "@/components/ui/KPICard";

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
    return r ? labelRisco(r) : "Risco";
  }
  if (acao.registro_mudanca_id) {
    const m = mudancas.find(x => x.id === acao.registro_mudanca_id);
    return m ? labelMudanca(m) : "Mudança";
  }
  return "—";
}

export default function PlanoAcao({ projectId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAcao, setEditingAcao] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();
  const [vinculoTipo, setVinculoTipo] = useState("risco");
  const { toast } = useToast();

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

  const { data: mudancas = [] } = useQuery({
    queryKey: ["mudancas_contratuais", projectId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: projectId }),
    enabled: !!projectId,
  });

  const createAcaoMutation = useMutation({
    mutationFn: (data) => entities.Acao.create({ ...data, projeto_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acoes"] });
      setShowForm(false);
      setFormData(emptyForm);
      setVinculoTipo("risco");
      toast({ variant: "success", description: "Ação criada." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateAcaoMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Acao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acoes"] });
      setEditingAcao(null);
      setShowForm(false);
      setFormData(emptyForm);
      setVinculoTipo("risco");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      projeto_id: projectId,
      registro_risco_id:   vinculoTipo === "risco"   ? formData.registro_risco_id   : null,
      registro_mudanca_id: vinculoTipo === "mudanca" ? formData.registro_mudanca_id : null,
    };
    if (editingAcao) {
      updateAcaoMutation.mutate({ id: editingAcao.id, data: payload });
    } else {
      createAcaoMutation.mutate(payload);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAcao(null);
    setFormData(emptyForm);
    setVinculoTipo("risco");
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
            onClick={() => { setEditingAcao(null); setFormData(emptyForm); setVinculoTipo("risco"); setShowForm(!showForm); }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Ação
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border border-border rounded-lg bg-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição da Ação *</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva a ação..." required rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Formato da Tratativa</Label>
                  <Select value={formData.formato_tratativa} onValueChange={(v) => setFormData({ ...formData, formato_tratativa: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reunião">Reunião</SelectItem>
                      <SelectItem value="Documento">Documento</SelectItem>
                      <SelectItem value="Inspeção">Inspeção</SelectItem>
                      <SelectItem value="Análise Técnica">Análise Técnica</SelectItem>
                      <SelectItem value="Negociação">Negociação</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                      <SelectItem value="Atrasada">Atrasada</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Início Prevista</Label>
                  <Input type="date" value={formData.data_inicio_prevista}
                    onChange={(e) => setFormData({ ...formData, data_inicio_prevista: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Data Fim Prevista</Label>
                  <Input type="date" value={formData.data_fim_prevista}
                    onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Responsável</Label>
                  <Input value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Nome do responsável" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais..." rows={2} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Vincular a</Label>
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
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {vinculoTipo === "risco"
                        ? riscos.map(r => (
                            <SelectItem key={r.id} value={r.id}>{labelRisco(r)}</SelectItem>
                          ))
                        : mudancas.map(m => (
                            <SelectItem key={m.id} value={m.id}>{labelMudanca(m)}</SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" variant="save"
                  disabled={createAcaoMutation.isPending || updateAcaoMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {createAcaoMutation.isPending || updateAcaoMutation.isPending ? "Salvando..." : "Salvar Ação"}
                </Button>
              </div>
            </form>
          )}

          {isLoadingAcoes ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : isErrorAcoes ? (
            <div className="text-center py-12 text-sm text-status-critical">Erro ao carregar ações. Tente recarregar a página.</div>
          ) : acoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhuma ação registrada. Clique em &quot;Nova Ação&quot; para começar.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vínculo</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acoes.map((acao) => (
                    <TableRow key={acao.id} className="hover:bg-muted">
                      <TableCell className="max-w-md">
                        <p className="font-medium text-foreground line-clamp-2">{acao.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">{acao.formato_tratativa}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{getVinculoLabel(acao, riscos, mudancas)}</TableCell>
                      <TableCell className="text-sm">{acao.responsavel || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {acao.data_fim_prevista ? format(new Date(acao.data_fim_prevista), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={acao.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="text-muted-foreground border-border"
                            onClick={() => {
                              setEditingAcao(acao);
                              setFormData({
                                descricao: acao.descricao,
                                formato_tratativa: acao.formato_tratativa || "Reunião",
                                data_inicio_prevista: acao.data_inicio_prevista || "",
                                data_fim_prevista: acao.data_fim_prevista || "",
                                responsavel: acao.responsavel || "",
                                status: acao.status,
                                observacoes: acao.observacoes || "",
                                registro_risco_id: acao.registro_risco_id || null,
                                registro_mudanca_id: acao.registro_mudanca_id || null,
                              });
                              setVinculoTipo(acao.registro_mudanca_id ? "mudanca" : "risco");
                              setShowForm(true);
                            }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                                          <Button size="sm" variant="outline" className="text-status-critical border-status-critical/30 hover:bg-status-critical/10"
                            onClick={() => setDeleteId(acao.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { deleteAcaoMutation.mutate(deleteId); setDeleteId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
