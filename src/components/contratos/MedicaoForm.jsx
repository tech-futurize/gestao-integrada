import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";

export default function MedicaoForm({ medicao, contratos, defaultContratoId, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", contrato_id: defaultContratoId || "", periodo_inicio: "", periodo_fim: "",
    valor_bruto: "", valor_retencao: "", valor_liquido: "", status: "Elaboração",
    elaborador: "", observacoes: "", itens: [],
    ...medicao,
    valor_bruto: medicao?.valor_bruto ?? "",
    valor_retencao: medicao?.valor_retencao ?? "",
    valor_liquido: medicao?.valor_liquido ?? "",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      valor_bruto: parseFloat(form.valor_bruto) || 0,
      valor_retencao: parseFloat(form.valor_retencao) || 0,
      valor_liquido: parseFloat(form.valor_liquido) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold" style={{ color: "#26405d" }}>{medicao ? "Editar Medição" : "Nova Medição"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="grid grid-cols-3 gap-4">
            <div><Label>Valor Bruto (R$)</Label><Input type="number" step="0.01" value={form.valor_bruto} onChange={e => set("valor_bruto", e.target.value)} /></div>
            <div><Label>Retenção (R$)</Label><Input type="number" step="0.01" value={form.valor_retencao} onChange={e => set("valor_retencao", e.target.value)} /></div>
            <div><Label>Valor Líquido (R$)</Label><Input type="number" step="0.01" value={form.valor_liquido} onChange={e => set("valor_liquido", e.target.value)} /></div>
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
            <div><Label>Elaborador</Label><Input value={form.elaborador} onChange={e => set("elaborador", e.target.value)} placeholder="Nome do elaborador" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Itens da Medição</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Item</Button>
            </div>
            <div className="space-y-2">
              {(form.itens || []).map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center p-2 bg-gray-50 rounded-lg">
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
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none" value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Observações..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="text-white" style={{ backgroundColor: "#c35e1e" }}>
              {medicao ? "Atualizar" : "Criar Medição"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}