import React, { useState } from "react";
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
import { Plus, Edit, Trash2 } from "lucide-react";

const statusColors = {
  Iniciado: "bg-gray-100 text-gray-800 border-gray-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  Concluído: "bg-green-100 text-green-800 border-green-200",
};

export default function EngenhariaPanel({ tipo, projetoId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAcao, setEditingAcao] = useState(null);
  const queryClient = useQueryClient();

  const { data: acoes = [] } = useQuery({
    queryKey: ["engenharias", projetoId, tipo],
    queryFn: () => entities.Engenharia.filter({ projeto_id: projetoId, nome: tipo }),
  });

  const [formData, setFormData] = useState({ descricao_acao: "", responsavel: "", finalidade: "", status: "Iniciado" });

  const createAcaoMutation = useMutation({
    mutationFn: (data) => entities.Engenharia.create({ ...data, projeto_id: projetoId, nome: tipo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engenharias"] });
      setShowForm(false);
      setFormData({ descricao_acao: "", responsavel: "", finalidade: "", status: "Iniciado" });
    },
  });

  const updateAcaoMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Engenharia.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["engenharias"] }); setEditingAcao(null); setShowForm(false); setFormData({ descricao_acao: "", responsavel: "", finalidade: "", status: "Iniciado" }); },
  });

  const deleteAcaoMutation = useMutation({
    mutationFn: (id) => entities.Engenharia.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engenharias"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAcao) {
      updateAcaoMutation.mutate({ id: editingAcao.id, data: formData });
    } else {
      createAcaoMutation.mutate(formData);
    }
  };

  const statusCount = {
    Iniciado: acoes.filter((a) => a.status === "Iniciado").length,
    "Em Andamento": acoes.filter((a) => a.status === "Em Andamento").length,
    Concluído: acoes.filter((a) => a.status === "Concluído").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(statusCount).map(([status, count]) => (
          <Card key={status} className={`border-2 ${statusColors[status]}`}>
            <CardContent className="p-3">
              <p className="text-xs font-medium text-gray-600">{status}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ações de {tipo}</CardTitle>
          <Button onClick={() => { setEditingAcao(null); setShowForm(true); setFormData({ descricao_acao: "", responsavel: "", finalidade: "", status: "Iniciado" }); }}
            size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />Nova Ação
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição da Ação *</Label>
                  <Textarea value={formData.descricao_acao}
                    onChange={(e) => setFormData({ ...formData, descricao_acao: e.target.value })}
                    placeholder="Descreva a ação..." required rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Nome do responsável" />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Iniciado">Iniciado</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Finalidade</Label>
                  <Textarea value={formData.finalidade}
                    onChange={(e) => setFormData({ ...formData, finalidade: e.target.value })}
                    placeholder="Qual é a finalidade desta ação?" rows={2} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingAcao(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700"
                  disabled={createAcaoMutation.isPending || updateAcaoMutation.isPending}>
                  {createAcaoMutation.isPending || updateAcaoMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          )}

          {acoes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Nenhuma ação registrada para {tipo}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Finalidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acoes.map((acao) => (
                    <TableRow key={acao.id} className="hover:bg-gray-50">
                      <TableCell className="max-w-md">
                        <p className="font-medium text-gray-900">{acao.descricao_acao}</p>
                      </TableCell>
                      <TableCell className="text-sm">{acao.responsavel || "-"}</TableCell>
                      <TableCell className="max-w-xs text-sm text-gray-600">
                        <p className="line-clamp-2">{acao.finalidade || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[acao.status]}>{acao.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="text-gray-600 border-gray-300"
                            onClick={() => { setEditingAcao(acao); setFormData({ descricao_acao: acao.descricao_acao, responsavel: acao.responsavel, finalidade: acao.finalidade, status: acao.status }); setShowForm(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
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