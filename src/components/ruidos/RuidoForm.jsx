import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CloseButton from "@/components/ui/CloseButton";
import { entities } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";

export default function RuidoForm({ ruido, onSubmit, onCancel, isSubmitting, projetoId }) {
  const [formData, setFormData] = useState(
    ruido || {
      descricao: "",
      causas_potenciais: "",
      impacto_potencial: "",
      probabilidade: "Média",
      impacto: "Prazo",
      categoria: "Contratos",
      data_identificacao: new Date().toISOString().split("T")[0],
      responsavel: "",
      status: "Identificado",
      caso_id: null,
    }
  );

  const { data: casos = [] } = useQuery({
    queryKey: ["casos", projetoId],
    queryFn: () => entities.Caso.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, caso_id: formData.caso_id || null });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b" style={{ background: "linear-gradient(to right, #f0f4f8, #e8f0f8)" }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            {ruido ? "Editar Notificação" : "Nova Notificação"}
          </CardTitle>
          <CloseButton onClick={onCancel} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva a notificação identificada..."
                rows={4}
                required
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="causas">Causas Potenciais</Label>
              <Textarea
                id="causas"
                value={formData.causas_potenciais}
                onChange={(e) => setFormData({ ...formData, causas_potenciais: e.target.value })}
                placeholder="Possíveis causas..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impacto_pot">Impacto Potencial</Label>
              <Textarea
                id="impacto_pot"
                value={formData.impacto_potencial}
                onChange={(e) => setFormData({ ...formData, impacto_potencial: e.target.value })}
                placeholder="Impacto esperado..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engenharia">Engenharia</SelectItem>
                  <SelectItem value="Suprimentos">Suprimentos</SelectItem>
                  <SelectItem value="Planejamento">Planejamento</SelectItem>
                  <SelectItem value="Construção">Construção</SelectItem>
                  <SelectItem value="Contratos">Contratos</SelectItem>
                  <SelectItem value="Qualidade/SSMA">Qualidade/SSMA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Impacto</Label>
              <Select value={formData.impacto} onValueChange={(v) => setFormData({ ...formData, impacto: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Escopo">Escopo</SelectItem>
                  <SelectItem value="Custo">Custo</SelectItem>
                  <SelectItem value="Prazo">Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Probabilidade</Label>
              <Select value={formData.probabilidade} onValueChange={(v) => setFormData({ ...formData, probabilidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Identificado">Identificado</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Descartado">Descartado</SelectItem>
                  <SelectItem value="Promovido">Promovido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Identificação</Label>
              <Input
                type="date"
                value={formData.data_identificacao}
                onChange={(e) => setFormData({ ...formData, data_identificacao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Associar a Pleito (Opcional)</Label>
              <Select value={formData.caso_id || "__none__"} onValueChange={(v) => setFormData({ ...formData, caso_id: v === "__none__" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um pleito" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {casos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="save" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Notificação"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}