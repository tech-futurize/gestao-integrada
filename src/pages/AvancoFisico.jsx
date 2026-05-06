import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Financeiro from "./Financeiro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, DollarSign, Plus, Save, X, Upload, Edit, Trash2 } from "lucide-react";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

export default function AvancoFisico() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({ mes_referencia: "", avanco_previsto_mensal: "", avanco_realizado_mensal: "" });

  const { data: avancos = [], isLoading } = useQuery({
    queryKey: ["avancos", selectedProjectId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const sorted = [...avancos].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));

  const calcAcumulado = (list, index) => {
    let previsto = 0, realizado = 0;
    for (let i = 0; i <= index; i++) {
      previsto += parseFloat(list[i].avanco_previsto_mensal || 0);
      realizado += parseFloat(list[i].avanco_realizado_mensal || 0);
    }
    return { previsto, realizado };
  };

  const createMutation = useMutation({
    mutationFn: (data) => {
      const acc = calcAcumulado([...sorted, data], sorted.length);
      return entities.AvancoFisico.create({ ...data, projeto_id: selectedProjectId, avanco_previsto_acumulado: acc.previsto, avanco_realizado_acumulado: acc.realizado });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["avancos"] }); setShowNewRow(false); setNewRow({ mes_referencia: "", avanco_previsto_mensal: "", avanco_realizado_mensal: "" }); },
    onError: onErr,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const idx = sorted.findIndex((a) => a.id === id);
      const updated = sorted.map((a, i) => (a.id === id ? { ...a, ...data } : a));
      const acc = calcAcumulado(updated, idx);
      return entities.AvancoFisico.update(id, { ...data, avanco_previsto_acumulado: acc.previsto, avanco_realizado_acumulado: acc.realizado });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["avancos"] }); setEditingId(null); },
    onError: onErr,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.AvancoFisico.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avancos"] }),
    onError: onErr,
  });

  const dadosGrafico = sorted.map((a) => ({
    mes: format(new Date(a.mes_referencia), "MMM/yy", { locale: ptBR }),
    previsto: a.avanco_previsto_acumulado || 0,
    realizado: a.avanco_realizado_acumulado || 0,
  }));

  if (!selectedProjectId) {
    return <PageEmptyState icon={TrendingUp} description="Selecione um projeto para visualizar o avanço físico." />;
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="fisico">
          <TabsList className="mb-4">
            <TabsTrigger value="fisico" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Físico
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fisico">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">Acompanhamento de avanço físico previsto vs realizado</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-gray-300">
                    <Upload className="w-4 h-4 mr-2" />Importar
                  </Button>
                  <Button onClick={() => setShowNewRow(true)} className="bg-green-600 hover:bg-green-700" disabled={showNewRow}>
                    <Plus className="w-4 h-4 mr-2" />Adicionar
                  </Button>
                </div>
              </div>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-accent" />
                    Curva de Avanço Físico Acumulado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="mes" />
                      <YAxis unit="%" domain={[0, 100]} />
                      <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="previsto" stroke="#26405d" strokeWidth={2} name="Previsto" dot={{ fill: "#26405d", r: 4 }} />
                      <Line type="monotone" dataKey="realizado" stroke="#c35e1e" strokeWidth={2} name="Realizado" dot={{ fill: "#c35e1e", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle>Histórico de Avanço Físico</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Mês</TableHead>
                          <TableHead className="text-right">Previsto Mensal (%)</TableHead>
                          <TableHead className="text-right">Realizado Mensal (%)</TableHead>
                          <TableHead className="text-right">Previsto Acumulado (%)</TableHead>
                          <TableHead className="text-right">Realizado Acumulado (%)</TableHead>
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
                              <Input type="number" step="0.01" min="0" max="100" value={newRow.avanco_previsto_mensal} onChange={(e) => setNewRow({ ...newRow, avanco_previsto_mensal: e.target.value })} className="w-28 text-right" placeholder="0.00" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" min="0" max="100" value={newRow.avanco_realizado_mensal} onChange={(e) => setNewRow({ ...newRow, avanco_realizado_mensal: e.target.value })} className="w-28 text-right" placeholder="0.00" />
                            </TableCell>
                            <TableCell colSpan={3} />
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
                        {sorted.map((a) => {
                          const isEditing = editingId === a.id;
                          const aderencia = a.avanco_previsto_acumulado > 0
                            ? ((a.avanco_realizado_acumulado / a.avanco_previsto_acumulado) * 100).toFixed(1) : 0;
                          return (
                            <TableRow key={a.id}>
                              <TableCell>
                                {isEditing
                                  ? <Input type="month" value={editData.mes_referencia?.slice(0, 7) || ""} onChange={(e) => setEditData({ ...editData, mes_referencia: e.target.value + "-01" })} className="w-36" />
                                  : format(new Date(a.mes_referencia), "MMMM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing
                                  ? <Input type="number" step="0.01" value={editData.avanco_previsto_mensal} onChange={(e) => setEditData({ ...editData, avanco_previsto_mensal: e.target.value })} className="w-28 text-right" />
                                  : `${(a.avanco_previsto_mensal || 0).toFixed(2)}%`}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditing
                                  ? <Input type="number" step="0.01" value={editData.avanco_realizado_mensal} onChange={(e) => setEditData({ ...editData, avanco_realizado_mensal: e.target.value })} className="w-28 text-right" />
                                  : `${(a.avanco_realizado_mensal || 0).toFixed(2)}%`}
                              </TableCell>
                              <TableCell className="text-right font-medium">{(a.avanco_previsto_acumulado || 0).toFixed(2)}%</TableCell>
                              <TableCell className="text-right font-medium">{(a.avanco_realizado_acumulado || 0).toFixed(2)}%</TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${aderencia >= 90 ? "text-green-600" : aderencia >= 70 ? "text-yellow-600" : "text-red-600"}`}>{aderencia}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                {isEditing ? (
                                  <div className="flex justify-center gap-1">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateMutation.mutate({ id: a.id, data: editData })} disabled={updateMutation.isPending}>
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center gap-1">
                                    <Button size="sm" variant="outline" className="text-gray-600" onClick={() => { setEditingId(a.id); setEditData({ mes_referencia: a.mes_referencia, avanco_previsto_mensal: a.avanco_previsto_mensal, avanco_realizado_mensal: a.avanco_realizado_mensal }); }}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => deleteMutation.mutate(a.id)}>
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
            </div>
          </TabsContent>

          <TabsContent value="financeiro">
            <Financeiro />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}