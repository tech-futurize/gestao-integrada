import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { FormDialog } from "@/components/ui/FormDialog";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function MedicaoForm({ medicao, contratos, defaultContratoId, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", contrato_id: defaultContratoId || "", periodo_inicio: "", periodo_fim: "",
    status: "Elaboração", observacoes: "", itens: [],
    ...medicao,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addItem = () => set("itens", [...(form.itens || []), { descricao: "", unidade: "m²", quantidade: "", preco_unitario: "", valor_total: "" }]);
  const removeItem = (i) => set("itens", form.itens.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => {
    const items = [...(form.itens || [])];
    items[i] = { ...items[i], [k]: v };
    if (k === "quantidade" || k === "preco_unitario") {
      const q = parseFloat(k === "quantidade" ? v : items[i].quantidade) || 0;
      const p = parseFloat(k === "preco_unitario" ? v : items[i].preco_unitario) || 0;
      items[i].valor_total = (q * p).toFixed(2);
    }
    set("itens", items);
  };

  const valorCalculado = useMemo(() =>
    (form.itens || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0),
    [form.itens]
  );

  const handleSubmit = () => {
    const valor = (form.itens || []).length > 0 ? valorCalculado : (medicao?.valor ?? valorCalculado);
    onSave({ ...form, valor });
  };

  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={ClipboardList}
      title={medicao ? "Editar Medição" : "Nova Medição"}
      subtitle={medicao ? `Medição nº ${medicao.numero}` : "Administração Contratual"}
      maxWidth="max-w-2xl"
      onClose={onClose}
      onSave={handleSubmit}
      saveLabel={medicao ? "Salvar" : "Criar Medição"}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Contrato *</Label>
          <Select value={form.contrato_id} onValueChange={v => set("contrato_id", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {contratos.map(c => <SelectItem key={c.id} value={c.id}>{c.numero ? `${c.numero} - ` : ""}{c.objeto?.substring(0, 40)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Número da Medição *</Label>
          <Input required value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="001" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Período Início</Label><Input type="date" value={form.periodo_inicio} onChange={e => set("periodo_inicio", e.target.value)} /></div>
        <div><Label>Período Fim</Label><Input type="date" value={form.periodo_fim} onChange={e => set("periodo_fim", e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valor (R$)</Label>
          <Input value={fmt(valorCalculado)} readOnly disabled className="bg-muted cursor-not-allowed" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Itens da Medição</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Item</Button>
        </div>
        <div className="space-y-2">
          {(form.itens || []).map((item, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-center p-2 bg-muted/50 rounded-lg">
              <Input className="col-span-2 text-xs" placeholder="Descrição" value={item.descricao} onChange={e => updateItem(i, "descricao", e.target.value)} />
              <Input className="text-xs" placeholder="Un." value={item.unidade} onChange={e => updateItem(i, "unidade", e.target.value)} />
              <Input className="text-xs" type="number" placeholder="Qtd" value={item.quantidade} onChange={e => updateItem(i, "quantidade", e.target.value)} />
              <div className="flex gap-1">
                <Input className="text-xs" type="number" placeholder="R$ unit." value={item.preco_unitario} onChange={e => updateItem(i, "preco_unitario", e.target.value)} />
                <Button type="button" size="sm" variant="ghost" className="text-red-400 px-1" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Observações</Label>
        <textarea rows={2} className="w-full border border-border rounded-lg p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Observações..." />
      </div>
    </FormDialog>
  );
}
