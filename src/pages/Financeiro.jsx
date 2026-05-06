import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, Save, X, Upload, Edit, Trash2 } from "lucide-react";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProject } from "@/lib/ProjectContext";

export default function Financeiro() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({ mes_referencia: "", faturamento_previsto_mensal: "", faturamento_realizado_mensal: "" });

  const { data: financeiros = [], isLoading } = useQuery({
    queryKey: ["financeiros", selectedProjectId],
    queryFn: () => entities.Financeiro.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const sorted = [...financeiros].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));

  const calcAcumulado = (list, index) => {
    let previsto = 0, realizado = 0;
    for (let i = 0; i <= index; i++) {
      previsto += parseFloat(list[i].faturamento_previsto_mensal || 0);
      realizado += parseFloat(list[i].faturamento_realizado_mensal || 0);
    }
    return { previsto, realizado };
  };

  const createMutation = useMutation({
    mutationFn: (data) => {
      const prevAcc = calcAcumulado([...sorted, data], sorted.length);
      return entities.Financeiro.create({
        ...data,
        projeto_id: selectedProjectId,
        faturamento_previsto_acumulado: prevAcc.previsto,
        faturamento_realizado_acumulado: prevAcc.realizado,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financeiros"] }); setShowNewRow(false); setNewRow({ mes_referencia: "", faturamento_previsto_mensal: "", faturamento_realizado_mensal: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const idx = sorted.findIndex((f) => f.id === id);
      const updated = sorted.map((f, i) => (f.id === id ? { ...f, ...data } : f));
      const acc = calcAcumulado(updated, idx);
      return entities.Financeiro.update(id, {
        ...data,
        faturamento_previsto_acumulado: acc.previsto,
        faturamento_realizado_acumulado: acc.realizado,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financeiros"] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Financeiro.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financeiros"] }),
  });

  const dadosGrafico = sorted.map((f) => ({
    mes: format(new Date(f.mes_referencia), "MMM/yy", { locale: ptBR }),
    previsto: f.faturamento_previsto_acumulado || 0,
    realizado: f.faturamento_realizado_acumulado || 0,
  }));

  if (!selectedProjectId) {
    return <PageEmptyState icon={DollarSign} description="Selecione um projeto para visualizar o controle financeiro." />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-primary">Controle Financeiro</h2>
            <p className="text-gray-600">Acompanhamento de faturamento previsto vs realizado</p>
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
              <DollarSign className="w-5 h-5 text-brand-accent" />
              Curva de Faturamento Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `R$ ${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Line type="monotone" dataKey="previsto" stroke="#26405d" strokeWidth={2} name="Previsto" dot={{ fill: "#26405d", r: 4 }} />
                <Line type="monotone" dataKey="realizado" stroke="#c35e1e" strokeWidth={2} name="Realizado" dot={{ fill: "#c35e1e", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle>Histórico de Faturamento</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Previsto Mensal</TableHead>
                    <TableHead className="text-right">Realizado Mensal</TableHead>
                    <TableHead className="text-right">Previsto Acumulado</TableHead>
                    <TableHead className="text-right">Realizado Acumulado</TableHead>
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
                        <Input type="number" step="0.01" value={newRow.faturamento_previsto_mensal} onChange={(e) => setNewRow({ ...newRow, faturamento_previsto_mensal: e.target.value })} className="w-32 text-right" placeholder="0,00" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" value={newRow.faturamento_realizado_mensal} onChange={(e) => setNewRow({ ...newRow, faturamento_realizado_mensal: e.target.value })} className="w-32 text-right" placeholder="0,00" />
                      </TableCell>
                      <TableCell colSpan={3} />
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700"
                            onClick={() => createMutation.mutate({ ...newRow, mes_referencia: newRow.mes_referencia + "-01" })} disabled={createMutation.isPending}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowNewRow(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {sorted.map((f) => {
                    const isEditing = editingId === f.id;
                    const aderencia = f.faturamento_previsto_acumulado > 0
                      ? ((f.faturamento_realizado_acumulado / f.faturamento_previsto_acumulado) * 100).toFixed(1) : 0;
                    return (
                      <TableRow key={f.id}>
                        <TableCell>
                          {isEditing
                            ? <Input type="month" value={editData.mes_referencia?.slice(0, 7) || ""} onChange={(e) => setEditData({ ...editData, mes_referencia: e.target.value + "-01" })} className="w-36" />
                            : format(new Date(f.mes_referencia), "MMMM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing
                            ? <Input type="number" step="0.01" value={editData.faturamento_previsto_mensal} onChange={(e) => setEditData({ ...editData, faturamento_previsto_mensal: e.target.value })} className="w-32 text-right" />
                            : `R$ ${(f.faturamento_previsto_mensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing
                            ? <Input type="number" step="0.01" value={editData.faturamento_realizado_mensal} onChange={(e) => setEditData({ ...editData, faturamento_realizado_mensal: e.target.value })} className="w-32 text-right" />
                            : `R$ ${(f.faturamento_realizado_mensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        </TableCell>
                        <TableCell className="text-right font-medium">R$ {(f.faturamento_previsto_acumulado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-medium">R$ {(f.faturamento_realizado_acumulado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${aderencia >= 90 ? "text-green-600" : aderencia >= 70 ? "text-yellow-600" : "text-red-600"}`}>{aderencia}%</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-1">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateMutation.mutate({ id: f.id, data: editData })} disabled={updateMutation.isPending}>
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="outline" className="text-gray-600" onClick={() => { setEditingId(f.id); setEditData({ mes_referencia: f.mes_referencia, faturamento_previsto_mensal: f.faturamento_previsto_mensal, faturamento_realizado_mensal: f.faturamento_realizado_mensal }); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => deleteMutation.mutate(f.id)}>
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
    </div>
  );
}