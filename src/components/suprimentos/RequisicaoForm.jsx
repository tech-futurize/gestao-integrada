import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";

export default function RequisicaoForm({ requisicao, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", solicitante: "", data_necessidade: "", centro_custo: "",
    justificativa: "", status: "Rascunho", itens: [],
    ...requisicao,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addItem = () => set("itens", [...(form.itens || []), { descricao: "", quantidade: "", unidade: "un" }]);
  const removeItem = (i) => set("itens", form.itens.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => {
    const items = [...(form.itens || [])];
    items[i] = { ...items[i], [k]: v };
    set("itens", items);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold" style={{ color: "#26405d" }}>{requisicao ? "Editar Requisição" : "Nova Requisição de Compra"}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Número</Label><Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="RC-001" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Rascunho", "Aprovada", "Em Cotação", "Pedido Emitido", "Recebido", "Cancelada"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Solicitante *</Label><Input required value={form.solicitante} onChange={e => set("solicitante", e.target.value)} placeholder="Nome do solicitante" /></div>
            <div><Label>Data de Necessidade</Label><Input type="date" value={form.data_necessidade} onChange={e => set("data_necessidade", e.target.value)} /></div>
          </div>

          <div><Label>Centro de Custo / Local</Label><Input value={form.centro_custo} onChange={e => set("centro_custo", e.target.value)} placeholder="Ex: CC-001 / Área Norte" /></div>
          <div>
            <Label>Justificativa</Label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none" value={form.justificativa} onChange={e => set("justificativa", e.target.value)} placeholder="Motivo da solicitação..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Itens *</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Item</Button>
            </div>
            <div className="space-y-2">
              {(form.itens || []).map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                  <Input className="col-span-2 text-xs" placeholder="Descrição do item" value={item.descricao} onChange={e => updateItem(i, "descricao", e.target.value)} />
                  <Input className="text-xs" type="number" placeholder="Qtd" value={item.quantidade} onChange={e => updateItem(i, "quantidade", e.target.value)} />
                  <Input className="text-xs" placeholder="Un." value={item.unidade} onChange={e => updateItem(i, "unidade", e.target.value)} />
                  <Button type="button" size="sm" variant="ghost" className="text-red-400 px-1" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              {!(form.itens || []).length && (
                <p className="text-xs text-gray-400 text-center py-3">Nenhum item. Clique em "+ Item" para adicionar.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="text-white" style={{ backgroundColor: "#c35e1e" }}>
              {requisicao ? "Atualizar" : "Criar Requisição"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}