import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CloseButton from "@/components/ui/CloseButton";

export default function RotinaForm({ rotina, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState(
    rotina || {
      descricao: "",
      responsavel: "",
      periodicidade: "Mensal",
      data_ultima_execucao: "",
      proxima_data_execucao: "",
      status: "Em Dia",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            {rotina ? "Editar Rotina" : "Nova Rotina"}
          </CardTitle>
          <CloseButton onClick={onCancel} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição da Rotina *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva a atividade recorrente..."
                rows={3}
                required
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) =>
                  setFormData({ ...formData, responsavel: e.target.value })
                }
                placeholder="Nome do responsável"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodicidade">Periodicidade *</Label>
              <Select
                value={formData.periodicidade}
                onValueChange={(value) =>
                  setFormData({ ...formData, periodicidade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diária">Diária</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ultima">Data Última Execução</Label>
              <Input
                id="ultima"
                type="date"
                value={formData.data_ultima_execucao}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    data_ultima_execucao: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proxima">Próxima Data Prevista</Label>
              <Input
                id="proxima"
                type="date"
                value={formData.proxima_data_execucao}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proxima_data_execucao: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em Dia">Em Dia</SelectItem>
                  <SelectItem value="Atrasada">Atrasada</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="bg-brand-accent hover:opacity-90 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Rotina"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}