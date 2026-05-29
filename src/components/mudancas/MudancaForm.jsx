import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";

const CATEGORIAS = ["Escopo", "Prazo", "Custo"];

export default function MudancaForm({ mudanca, onSubmit, onCancel, isSubmitting, pleitos = [] }) {
  const [formData, setFormData] = useState({
    titulo: mudanca?.titulo || "",
    descricao: mudanca?.descricao || "",
    origem: mudanca?.origem || "Contratante",
    status: mudanca?.status || "Identificada",
    data_ocorrencia: mudanca?.data_ocorrencia || new Date().toISOString().split("T")[0],
    impacto_custo: mudanca?.impacto_custo ?? "",
    impacto_prazo_dias: mudanca?.impacto_prazo_dias ?? "",
    impacto_escopo: mudanca?.impacto_escopo || "",
    impacto_escopo_tipo: mudanca?.impacto_escopo_tipo || null,
    responsavel: mudanca?.responsavel || "",
    observacoes: mudanca?.observacoes || "",
    pleito_id: mudanca?.pleito_id || null,
  });
  const [categorias, setCategorias] = useState(mudanca?.categorias || []);

  const toggleCategoria = (cat) =>
    setCategorias(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      categorias,
      impacto_custo: formData.impacto_custo !== "" ? parseFloat(formData.impacto_custo) : null,
      impacto_prazo_dias: formData.impacto_prazo_dias !== "" ? parseFloat(formData.impacto_prazo_dias) : null,
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-muted/40">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
            {mudanca ? "Editar Mudança" : "Registrar Nova Mudança"}
          </CardTitle>
          <CloseButton onClick={onCancel} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Identificação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Título da Mudança *</Label>
              <Input value={formData.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título resumido..." required />
            </div>
            <div className="space-y-2">
              <Label>Data do Registro</Label>
              <Input type="date" value={formData.data_ocorrencia} onChange={(e) => set("data_ocorrencia", e.target.value)} />
            </div>
          </div>

          {/* Pleito Vinculado */}
          {pleitos.length > 0 && (
            <div className="space-y-2">
              <Label>Pleito Vinculado</Label>
              <Select
                value={formData.pleito_id || "__none__"}
                onValueChange={(v) => set("pleito_id", v === "__none__" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {pleitos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.titulo || "(sem título)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Origem (toggle) */}
          <div className="space-y-2">
            <Label>Origem da Mudança</Label>
            <div className="flex gap-3">
              {["Contratada", "Contratante"].map((op) => (
                <button key={op} type="button"
                  onClick={() => set("origem", op)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                    formData.origem === op
                      ? op === "Contratada"
                        ? "border-status-info bg-status-info text-white"
                        : "border-ocre bg-ocre text-white"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/40"
                  }`}>
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Categorias (tags) */}
          <div className="space-y-2">
            <Label>Categorias de Impacto (Tríade)</Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIAS.map((cat) => (
                <button key={cat} type="button" onClick={() => toggleCategoria(cat)}>
                  <Badge variant="outline" className={`cursor-pointer text-sm px-3 py-1 transition-all ${
                    categorias.includes(cat)
                      ? cat === "Custo" ? "bg-status-positive text-white border-status-positive"
                        : cat === "Prazo" ? "bg-status-attention text-white border-status-attention"
                        : "bg-status-info text-white border-status-info"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                  }`}>
                    {categorias.includes(cat) ? "✓ " : ""}{cat}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição Técnica da Mudança *</Label>
            <Textarea value={formData.descricao} onChange={(e) => set("descricao", e.target.value)}
              placeholder="Justificativa técnica e contexto da mudança..." rows={4} required />
          </div>

          {/* Impactos - Antes vs Depois */}
          <div className="p-4 bg-muted rounded-lg border space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Métricas de Impacto</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Impacto Financeiro (R$)</Label>
                <Input type="number" step="0.01" value={formData.impacto_custo}
                  onChange={(e) => set("impacto_custo", e.target.value)}
                  placeholder="+150000 ou -50000" />
                <p className="text-xs text-muted-foreground">Positivo = acréscimo | Negativo = redução</p>
              </div>
              <div className="space-y-2">
                <Label>Impacto em Prazo (dias)</Label>
                <Input type="number" value={formData.impacto_prazo_dias}
                  onChange={(e) => set("impacto_prazo_dias", e.target.value)}
                  placeholder="+15 ou -5" />
                <p className="text-xs text-muted-foreground">Positivo = atraso | Negativo = antecipação</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Identificada">Identificada</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                    <SelectItem value="Aprovada">Aprovada</SelectItem>
                    <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Impacto no Escopo (o que entra ou sai)</Label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.impacto_escopo_tipo === "Adição"}
                    onChange={(e) => set("impacto_escopo_tipo", e.target.checked ? "Adição" : null)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Adição</span>
                </label>
              </div>
              <Textarea value={formData.impacto_escopo} onChange={(e) => set("impacto_escopo", e.target.value)}
                placeholder="Descreva o que é adicionado ou removido do escopo..." rows={2} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel} onChange={(e) => set("responsavel", e.target.value)} placeholder="Nome" />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={formData.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Observações adicionais" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="save" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : mudanca ? "Salvar" : "Criar Mudança"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}