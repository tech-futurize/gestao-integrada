import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import InfoTooltip from "@/components/ui/InfoTooltip";

const CATEGORIAS = ["Escopo", "Prazo", "Custo"];

export default function PleitoForm({ caso, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState(
    caso || {
      titulo: "",
      descricao_problema: "",
      contexto: "",
      partes_envolvidas: [],
      data_abertura: new Date().toISOString().split("T")[0],
      status: "Aberto",
      responsavel: "",
      categorias: [],
      prioridade: "Média",
    }
  );

  const [parteInput, setParteInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const adicionarParte = () => {
    if (parteInput.trim()) {
      setFormData({ ...formData, partes_envolvidas: [...(formData.partes_envolvidas || []), parteInput.trim()] });
      setParteInput("");
    }
  };

  const removerParte = (index) => {
    setFormData({ ...formData, partes_envolvidas: formData.partes_envolvidas.filter((_, i) => i !== index) });
  };

  const toggleCategoria = (cat) => {
    const cats = formData.categorias || [];
    if (cats.includes(cat)) {
      setFormData({ ...formData, categorias: cats.filter((c) => c !== cat) });
    } else {
      setFormData({ ...formData, categorias: [...cats, cat] });
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-muted">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">
            {caso ? "Editar Pleito" : "Novo Pleito"}
          </CardTitle>
          <CloseButton onClick={onCancel} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Título *</Label>
              <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título do pleito" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descrição do Problema *</Label>
              <Textarea value={formData.descricao_problema}
                onChange={(e) => setFormData({ ...formData, descricao_problema: e.target.value })}
                placeholder="Descreva detalhadamente o problema..." rows={4} required className="resize-none" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Contexto</Label>
              <Textarea value={formData.contexto}
                onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
                placeholder="Contexto do pleito..." rows={3} className="resize-none" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Partes Envolvidas</Label>
              <div className="flex gap-2">
                <Input value={parteInput} onChange={(e) => setParteInput(e.target.value)}
                  placeholder="Nome da parte envolvida"
                  onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarParte(); } }} />
                <Button type="button" onClick={adicionarParte} variant="secondary">
                  Adicionar
                </Button>
              </div>
              {(formData.partes_envolvidas || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.partes_envolvidas.map((parte, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {parte}
                      <button type="button" onClick={() => removerParte(index)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(v) => setFormData({ ...formData, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                  <SelectItem value="Fechado">Fechado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center">Categoria (múltipla seleção)<InfoTooltip text="Classifica a tríade de impacto do pleito: Escopo (mudança no que será entregue), Prazo (impacto nas datas) ou Custo (impacto financeiro)." /></Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIAS.map((cat) => (
                  <button key={cat} type="button" onClick={() => toggleCategoria(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${(formData.categorias || []).includes(cat) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data de Abertura</Label>
              <Input type="date" value={formData.data_abertura}
                onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                placeholder="Nome do responsável" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="save" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Pleito"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
