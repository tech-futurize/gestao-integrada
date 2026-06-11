import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";

export default function MudancaForm({ open, onOpenChange, mudanca, onSubmit, onCancel, isSubmitting, pleitos = [] }) {
  const { data: categoriasNomes = [], isPending: categoriasPending } = useCategoriasImpacto();

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

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!formData.titulo.trim()) return;
    onSubmit({
      ...formData,
      categorias,
      impacto_custo: formData.impacto_custo !== "" ? parseFloat(formData.impacto_custo) : null,
      impacto_prazo_dias: formData.impacto_prazo_dias !== "" ? parseFloat(formData.impacto_prazo_dias) : null,
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={ArrowRightLeft}
      title={mudanca ? "Editar Mudança" : "Nova Mudança"}
      maxWidth="max-w-3xl"
      onClose={onCancel}
      onSave={handleSave}
      saving={isSubmitting}
      saveLabel={mudanca ? "Salvar" : "Criar Mudança"}
      saveDisabled={!formData.titulo.trim()}
    >
      {/* Identificação */}
      <SectionDivider label="Identificação" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Título *</Label>
          <Input
            value={formData.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            placeholder="Título resumido da mudança..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Data do Registro</Label>
          <Input type="date" value={formData.data_ocorrencia} onChange={(e) => set("data_ocorrencia", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origem */}
        <div className="space-y-1.5">
          <Label>Origem</Label>
          <div className="flex gap-2">
            {["Contratada", "Contratante"].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => set("origem", op)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                  formData.origem === op
                    ? op === "Contratada"
                      ? "border-status-info bg-status-info/10 text-status-info"
                      : "border-status-attention bg-status-attention/10 text-status-attention"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Identificada", "Em Análise", "Aprovada", "Rejeitada", "Implementada"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {pleitos.length > 0 && (
        <div className="space-y-1.5">
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
                <SelectItem key={p.id} value={p.id}>{p.titulo || "(sem título)"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Responsável */}
      <div className="space-y-1.5">
        <Label>Responsável</Label>
        <Input value={formData.responsavel} onChange={(e) => set("responsavel", e.target.value)} placeholder="Nome" />
      </div>

      {/* Categorias */}
      <SectionDivider label="Categorias" />

      <div className="space-y-1.5">
        <Label>Categorias de Impacto</Label>
        {categoriasPending ? (
          <p className="text-xs text-muted-foreground">Carregando categorias...</p>
        ) : categoriasNomes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma categoria cadastrada para este projeto.</p>
        ) : (
          <MultiSelectDropdown
            label="Selecionar categorias"
            options={categoriasNomes}
            selected={categorias}
            onChange={setCategorias}
            onClear={() => setCategorias([])}
          />
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <Label>Descrição Técnica *</Label>
        <Textarea
          value={formData.descricao}
          onChange={(e) => set("descricao", e.target.value)}
          placeholder="Justificativa técnica e contexto da mudança..."
          rows={3}
        />
      </div>

      {/* Impactos */}
      <SectionDivider label="Impactos" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Financeiro (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.impacto_custo}
            onChange={(e) => set("impacto_custo", e.target.value)}
            placeholder="+150000 ou -50000"
          />
          <p className="text-xs text-muted-foreground">+ acréscimo · − redução</p>
        </div>
        <div className="space-y-1.5">
          <Label>Prazo (dias)</Label>
          <Input
            type="number"
            value={formData.impacto_prazo_dias}
            onChange={(e) => set("impacto_prazo_dias", e.target.value)}
            placeholder="+15 ou -5"
          />
          <p className="text-xs text-muted-foreground">+ atraso · − antecipação</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Impacto no Escopo</Label>
          <div className="flex items-center gap-4">
            {["Adição", "Redução"].map((tipo) => (
              <label key={tipo} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.impacto_escopo_tipo === tipo}
                  onChange={(e) => set("impacto_escopo_tipo", e.target.checked ? tipo : null)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-foreground">{tipo}</span>
              </label>
            ))}
          </div>
        </div>
        <Textarea
          value={formData.impacto_escopo}
          onChange={(e) => set("impacto_escopo", e.target.value)}
          placeholder="O que entra ou sai do escopo..."
          rows={2}
        />
      </div>

      {formData.observacoes !== undefined && (
        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Input
            value={formData.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Observações adicionais"
          />
        </div>
      )}
    </FormDialog>
  );
}
