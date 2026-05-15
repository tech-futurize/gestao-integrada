import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FilterBar from "@/components/ui/FilterBar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Plus, Save, X, Upload, Edit, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPOS_EQUIPAMENTO = [
  "Guindaste", "Munck", "Plataforma Elevatória", "Escavadeira", "Retroescavadeira",
  "Pá Carregadeira", "Compactador", "Caminhão Basculante", "Betoneira", "Andaime",
  "Gerador", "Compressor", "Bomba de Concreto", "Guincho", "Outros"
];

const formatPeriodo = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  return `${format(startOfMonth(d), "dd/MM/yy")} - ${format(endOfMonth(d), "dd/MM/yy")}`;
};

export default function HistogramaEquipamentos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRow, setNewRow] = useState({ tipo_equipamento: "", mes_referencia: "", quantidade_prevista_mensal: "", quantidade_rdo_mensal: "" });
  const [filtros, setFiltros] = useState({});

  const { data: histogramas = [] } = useQuery({
    queryKey: ["histogramas-equip", selectedProjectId],
    queryFn: () => entities.Histograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const tp = filtros.tipo || [];
  const sorted = [...histogramas]
    .filter(h => h.tipo_equipamento)
    .filter(h => tp.length === 0 || tp.includes(h.tipo_equipamento))
    .sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));

  const createMutation = useMutation({
    mutationFn: (data) => entities.Histograma.create({ ...data, projeto_id: selectedProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["histogramas-equip"] });
      setShowNewRow(false);
      setNewRow({ tipo_equipamento: "", mes_referencia: "", quantidade_prevista_mensal: "", quantidade_rdo_mensal: "" });
    },
    onError: onErr,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Histograma.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["histogramas-equip"] }); setEditingId(null); },
    onError: onErr,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Histograma.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["histogramas-equip"] }),
    onError: onErr,
  });

  const dadosGrafico = sorted.map((h) => ({
    semana: `S${format(new Date(h.mes_referencia + "T12:00:00"), "ww", { locale: ptBR })} (${format(new Date(h.mes_referencia + "T12:00:00"), "dd/MM")})`,
    previsto: h.quantidade_prevista_mensal || 0,
    rdo: h.quantidade_rdo_mensal || 0,
  }));

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-ocre" />
              Histograma de Equipamentos
            </CardTitle>
            <FilterBar
              storageKey="histograma-filtros"
              filters={[
                { key: "tipo", label: "Equipamento", options: TIPOS_EQUIPAMENTO },
              ]}
              onChange={setFiltros}
            />
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
            <CardTitle>Detalhamento de Equipamentos</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Importar</Button>
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
                <TableRow className="bg-muted">
                  <TableHead>Semana/Mês</TableHead>
                  <TableHead>Tipo de Equipamento</TableHead>
                  <TableHead className="text-right">Qtd Prevista</TableHead>
                  <TableHead className="text-right">Qtd Real</TableHead>
                  <TableHead className="text-right">Aderência</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showNewRow && (
                  <TableRow className="bg-status-positive/10">
                    <TableCell>
                      <Input type="month" value={newRow.mes_referencia} onChange={(e) => setNewRow({ ...newRow, mes_referencia: e.target.value })} className="w-36" />
                    </TableCell>
                    <TableCell>
                      <Select value={newRow.tipo_equipamento} onValueChange={(v) => setNewRow({ ...newRow, tipo_equipamento: v })}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{TIPOS_EQUIPAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input type="number" value={newRow.quantidade_prevista_mensal} onChange={(e) => setNewRow({ ...newRow, quantidade_prevista_mensal: e.target.value })} className="w-24 text-right" /></TableCell>
                    <TableCell><Input type="number" value={newRow.quantidade_rdo_mensal} onChange={(e) => setNewRow({ ...newRow, quantidade_rdo_mensal: e.target.value })} className="w-24 text-right" /></TableCell>
                    <TableCell />
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700"
                          onClick={() => createMutation.mutate({ ...newRow, mes_referencia: newRow.mes_referencia + "-01" })}
                          disabled={createMutation.isPending}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowNewRow(false)}><X className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {sorted.map((h) => {
                  const isEditing = editingId === h.id;
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
                          ? <Select value={editData.tipo_equipamento} onValueChange={(v) => setEditData({ ...editData, tipo_equipamento: v })}>
                              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                              <SelectContent>{TIPOS_EQUIPAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          : <p className="font-medium">{h.tipo_equipamento}</p>}
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
                        <span className={`font-semibold ${aderencia >= 90 ? "text-status-positive" : aderencia >= 70 ? "text-status-attention" : "text-status-critical"}`}>{aderencia}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateMutation.mutate({ id: h.id, data: editData })}
                              disabled={updateMutation.isPending}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="outline" className="text-foreground"
                              onClick={() => { setEditingId(h.id); setEditData({ mes_referencia: h.mes_referencia, tipo_equipamento: h.tipo_equipamento, quantidade_prevista_mensal: h.quantidade_prevista_mensal, quantidade_rdo_mensal: h.quantidade_rdo_mensal }); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-status-critical border-status-critical/40 hover:bg-status-critical/10" onClick={() => deleteMutation.mutate(h.id)}>
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
  );
}
