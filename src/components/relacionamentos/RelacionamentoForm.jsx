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
import { X } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";

export default function RelacionamentoForm({
  relacionamento,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const [formData, setFormData] = useState(
    relacionamento || {
      data_interacao: new Date().toISOString().split("T")[0],
      descricao: "",
      partes_envolvidas: [],
      objetivo: "",
      resultado: "",
      classificacao: "Neutro",
    }
  );

  const [parteInput, setParteInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const adicionarParte = () => {
    if (parteInput.trim()) {
      setFormData({
        ...formData,
        partes_envolvidas: [...formData.partes_envolvidas, parteInput.trim()],
      });
      setParteInput("");
    }
  };

  const removerParte = (index) => {
    setFormData({
      ...formData,
      partes_envolvidas: formData.partes_envolvidas.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            {relacionamento ? "Editar Tratativa" : "Nova Tratativa"}
          </CardTitle>
          <CloseButton onClick={onCancel} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="data">Data da Interação *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_interacao}
                onChange={(e) =>
                  setFormData({ ...formData, data_interacao: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classificacao">Classificação</Label>
              <Select
                value={formData.classificacao}
                onValueChange={(value) =>
                  setFormData({ ...formData, classificacao: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excelente">Excelente</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Neutro">Neutro</SelectItem>
                  <SelectItem value="Tenso">Tenso</SelectItem>
                  <SelectItem value="Crítico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição da Tratativa *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva a interação..."
                rows={4}
                required
                className="resize-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Partes Envolvidas</Label>
              <div className="flex gap-2">
                <Input
                  value={parteInput}
                  onChange={(e) => setParteInput(e.target.value)}
                  placeholder="Nome do stakeholder"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarParte();
                    }
                  }}
                />
                <Button type="button" onClick={adicionarParte} variant="outline">
                  Adicionar
                </Button>
              </div>
              {formData.partes_envolvidas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.partes_envolvidas.map((parte, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {parte}
                      <button
                        type="button"
                        onClick={() => removerParte(index)}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Textarea
                id="objetivo"
                value={formData.objetivo}
                onChange={(e) =>
                  setFormData({ ...formData, objetivo: e.target.value })
                }
                placeholder="Qual era o objetivo desta interação?"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado</Label>
              <Textarea
                id="resultado"
                value={formData.resultado}
                onChange={(e) =>
                  setFormData({ ...formData, resultado: e.target.value })
                }
                placeholder="Qual foi o resultado obtido?"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="save" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Tratativa"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}