import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HistogramaEquipamentos from "@/components/histograma/HistogramaEquipamentos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Plus, Save, X, Upload, Edit, Trash2 } from "lucide-react";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProject } from "@/lib/ProjectContext";

const formatPeriodo = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  const start = startOfMonth(d);
  const end = endOfMonth(d);
  return `${format(start, "dd/MM/yy")} - ${format(end, "dd/MM/yy")}`;
};

const getWeekLabel = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  const start = startOfMonth(d);
  return `S${format(start, "ww", { locale: ptBR })}`;
};

export default function Histograma() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({ recurso_id: "", mes_referencia: "", quantidade_prevista_mensal: "", quantidade_rdo_mensal: "" });
  const [recursoSelecionado, setRecursoSelecionado] = useState("");

  const { data: recursos = [] } = useQuery({
    queryKey: ["recursos", selectedProjectId],
    queryFn: () => entities.Recurso.list(),
    enabled: !!selectedProjectId,
  });

  const { data: histogramas = [], isLoading } = useQuery({
    queryKey: ["histogramas", selectedProjectId, recursoSelecionado],
    queryFn: () => {
      if (!recursoSelecionado) return entities.Histograma.filter({ projeto_id: selectedProjectId });
      return entities.Histograma.filter({ projeto_id: selectedProjectId, recurso_id: recursoSelecionado });
    },
    enabled: !!selectedProjectId,
  });

  const sorted = [...histogramas]
    .filter(h => !h.tipo_equipamento)
    .sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));

  const createMutation = useMutation({
    mutationFn: (data) => entities.Histograma.create({ ...data, projeto_id: selectedProjectId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["histogramas"] }); setShowNewRow(false); setNewRow({ recurso_id: "", mes_referencia: "", quantidade_prevista_mensal: "", quantidade_realizada_mensal: "", quantidade_rdo_mensal: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Histograma.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["histogramas"] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Histograma.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["histogramas"] }),
  });

  const dadosGrafico = sorted.map((h) => ({
    semana: `S${format(new Date(h.mes_referencia + "T12:00:00"), "ww", { locale: ptBR })} (${format(new Date(h.mes_referencia + "T12:00:00"), "dd/MM")})`,
    previsto: h.quantidade_prevista_mensal || 0,
    rdo: h.quantidade_rdo_mensal || 0,
  }));

  if (!selectedProjectId) {
    return <PageEmptyState icon={BarChart3} description="Selecione um projeto para visualizar o histograma de recursos." />;
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="mao-de-obra">
          <TabsList className="mb-4">
            <TabsTrigger value="mao-de-obra">Mão de Obra</TabsTrigger>
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
          </TabsList>
          <TabsContent value="equipamentos">
            <HistogramaEquipamentos />
          </TabsContent>
          <TabsContent value="mao-de-obra">

        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-accent" />
                Histograma de Mobilização
              </CardTitle>
              <Select value={recursoSelecionado} onValueChange={setRecursoSelecionado}>
                <SelectTrigger className="w-60"><SelectValue placeholder="Filtrar por recurso" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos os recursos</SelectItem>
                  {recursos.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome_recurso}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="previsto" fill="#26405d" name="Previsto" />
                <Bar dataKey="rdo" fill="#00a49a" name="Qtd Real" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalhamento de Registros</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" className="border-gray-300">
                  <Upload className="w-4 h-4 mr-2" />Importar
                </Button>
                <Button onClick={() => setShowNewRow(true)} className="bg-green-600 hover:bg-green-700" disabled={showNewRow}>
                  <Plus className="w-4 h-4 mr-2" />Adicionar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Semana/Mês</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead className="text-right">Qtd Prevista</TableHead>
                    <TableHead className="text-right">Qtd Real</TableHead>
                    <TableHead className="text-right">Aderência</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showNewRow && (
                    <TableRow className="bg-green-50">
                      <TableCell>
                        <Input type="month" value={newRow.mes_referencia} onChange={(e) => setNewRow({ ...newRow, mes_referencia: e.target.value })} className="w-36" />
                      </TableCell>
                      <TableCell>
                        <Select value={newRow.recurso_id} onValueChange={(v) => setNewRow({ ...newRow, recurso_id: v })}>
                          <SelectTrigger className="w-44"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>{recursos.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome_recurso}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" value={newRow.quantidade_prevista_mensal} onChange={(e) => setNewRow({ ...newRow, quantidade_prevista_mensal: e.target.value })} className="w-24 text-right" /></TableCell>
                      <TableCell><Input type="number" value={newRow.quantidade_rdo_mensal} onChange={(e) => setNewRow({ ...newRow, quantidade_rdo_mensal: e.target.value })} className="w-24 text-right" /></TableCell>
                      <TableCell />
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700"
                            onClick={() => createMutation.mutate({ ...newRow, mes_referencia: newRow.mes_referencia + "-01" })} disabled={createMutation.isPending}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowNewRow(false)}><X className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {sorted.map((h) => {
                    const isEditing = editingId === h.id;
                    const recurso = recursos.find((r) => r.id === h.recurso_id);
                    const aderencia = h.quantidade_prevista_mensal > 0
                      ? Math.round((h.quantidade_rdo_mensal / h.quantidade_prevista_mensal) * 100) : 0;
                    return (
                      <TableRow key={h.id}>
                        <TableCell>
                          {isEditing
                            ? <Input type="month" value={editData.mes_referencia?.slice(0, 7) || ""} onChange={(e) => setEditData({ ...editData, mes_referencia: e.target.value + "-01" })} className="w-36" />
                            : formatPeriodo(h.mes_referencia)}
                        </TableCell>
                        <TableCell>
                          {isEditing
                            ? <Select value={editData.recurso_id} onValueChange={(v) => setEditData({ ...editData, recurso_id: v })}>
                                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>{recursos.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome_recurso}</SelectItem>)}</SelectContent>
                              </Select>
                            : <div><p className="font-medium">{recurso?.nome_recurso || "N/A"}</p></div>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing
                            ? <Input type="number" value={editData.quantidade_prevista_mensal} onChange={(e) => setEditData({ ...editData, quantidade_prevista_mensal: e.target.value })} className="w-24 text-right" />
                            : Math.round(h.quantidade_prevista_mensal || 0).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing
                            ? <Input type="number" value={editData.quantidade_rdo_mensal} onChange={(e) => setEditData({ ...editData, quantidade_rdo_mensal: e.target.value })} className="w-24 text-right" />
                            : Math.round(h.quantidade_rdo_mensal || 0).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${aderencia >= 90 ? "text-green-600" : aderencia >= 70 ? "text-yellow-600" : "text-red-600"}`}>{aderencia}%</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-1">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateMutation.mutate({ id: h.id, data: editData })} disabled={updateMutation.isPending}>
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="outline" className="text-gray-600" onClick={() => { setEditingId(h.id); setEditData({ mes_referencia: h.mes_referencia, recurso_id: h.recurso_id, quantidade_prevista_mensal: h.quantidade_prevista_mensal, quantidade_realizada_mensal: h.quantidade_realizada_mensal, quantidade_rdo_mensal: h.quantidade_rdo_mensal }); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => deleteMutation.mutate(h.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}