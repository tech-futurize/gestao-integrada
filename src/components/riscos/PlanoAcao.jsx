import { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, CheckCircle2, Clock, X, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  Pendente: "bg-muted text-foreground",
  "Em Andamento": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Concluída: "bg-status-positive/15 text-status-positive",
  Atrasada: "bg-status-critical/15 text-status-critical",
  Cancelada: "bg-muted text-foreground",
};

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
    return r ? (r.codigo || r.descricao || "Risco") : "Risco";
  }
  if (acao.registro_mudanca_id) {
    const m = mudancas.find(x => x.id === acao.registro_mudanca_id);
    return m ? (m.titulo || m.descricao || "Mudança") : "Mudança";
  }
  return "—";
}

export default function PlanoAcao({ projectId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAcao, setEditingAcao] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const queryClient = useQueryClient();
  const [vinculoTipo, setVinculoTipo] = useState("risco");

  const { data: acoes = [] } = useQuery({
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
    },
  });

  const updateAcaoMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Acao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acoes"] });
      setEditingAcao(null);
      setShowForm(false);
      setFormData(emptyForm);
      setVinculoTipo("risco");
    },
  });

  const deleteAcaoMutation = useMutation({
    mutationFn: (id) => entities.Acao.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acoes"] }),
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
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{acoesPendentes}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{acoesCompletas}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Atrasadas</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{acoesAtrasadas}</p>
            </div>
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </CardContent>
        </Card>
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
                      {(vinculoTipo === "risco" ? riscos : mudancas).map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.codigo || item.titulo || item.descricao || item.id}
                        </SelectItem>
                      ))}
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

          {acoes.length === 0 ? (
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
                        <Badge variant="outline" className={statusColors[acao.status]}>{acao.status}</Badge>
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
                            onClick={() => deleteAcaoMutation.mutate(acao.id)}>
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
    </div>
  );
}
