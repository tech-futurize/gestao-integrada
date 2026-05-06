import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";

export default function CotacaoForm({ cotacao, requisicoes, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", titulo: "", requisicao_id: "", data_limite: "", status: "Aberta",
    fornecedor_selecionado: "", valor_aprovado: "", parecer: "", aprovador: "",
    propostas: [],
    ...cotacao,
    valor_aprovado: cotacao?.valor_aprovado ?? "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addProposta = () => set("propostas", [...(form.propostas || []), { fornecedor: "", valor_total: "", prazo_entrega: "", condicao_pagamento: "", observacoes: "" }]);
  const removeProposta = (i) => set("propostas", form.propostas.filter((_, idx) => idx !== i));
  const updateProposta = (i, k, v) => {
    const ps = [...(form.propostas || [])];
    ps[i] = { ...ps[i], [k]: v };
    set("propostas", ps);
  };

  const menorValor = form.propostas?.length ? Math.min(...form.propostas.map(p => parseFloat(p.valor_total) || Infinity)) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, valor_aprovado: parseFloat(form.valor_aprovado) || 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold" style={{ color: "#26405d" }}>{cotacao ? "Editar Cotação" : "Nova Cotação"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Número</Label><Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="COT-001" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Aberta", "Em Análise", "Aprovada", "Cancelada"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div><Label>Título *</Label><Input required value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Descrição do que está sendo cotado" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Requisição vinculada</Label>
              <Select value={form.requisicao_id} onValueChange={v => set("requisicao_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {requisicoes.map(r => <SelectItem key={r.id} value={r.id}>{r.numero || r.id.substring(0, 8)} - {r.solicitante}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data Limite</Label><Input type="date" value={form.data_limite} onChange={e => set("data_limite", e.target.value)} /></div>
          </div>

          {/* Propostas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Propostas dos Fornecedores</Label>
              <Button type="button" size="sm" variant="outline" onClick={addProposta}><Plus className="w-3 h-3 mr-1" /> Proposta</Button>
            </div>
            <div className="space-y-2">
              {(form.propostas || []).map((p, i) => {
                const isMenor = menorValor !== null && parseFloat(p.valor_total) === menorValor && p.valor_total !== "";
                return (
                  <div key={i} className={`p-3 rounded-lg border ${isMenor ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                    {isMenor && <span className="text-xs font-bold text-green-600 mb-1 block">⭐ Menor preço</span>}
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="text-xs" placeholder="Fornecedor" value={p.fornecedor} onChange={e => updateProposta(i, "fornecedor", e.target.value)} />
                      <Input className="text-xs" type="number" placeholder="Valor Total (R$)" value={p.valor_total} onChange={e => updateProposta(i, "valor_total", e.target.value)} />
                      <Input className="text-xs" placeholder="Prazo de entrega" value={p.prazo_entrega} onChange={e => updateProposta(i, "prazo_entrega", e.target.value)} />
                      <Input className="text-xs" placeholder="Cond. de pagamento" value={p.condicao_pagamento} onChange={e => updateProposta(i, "condicao_pagamento", e.target.value)} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input className="text-xs flex-1" placeholder="Observações" value={p.observacoes} onChange={e => updateProposta(i, "observacoes", e.target.value)} />
                      <Button type="button" size="sm" variant="ghost" className="text-red-400 px-1" onClick={() => removeProposta(i)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                );
              })}
              {!(form.propostas || []).length && <p className="text-xs text-gray-400 text-center py-3">Nenhuma proposta. Clique em "+ Proposta".</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Fornecedor Selecionado</Label><Input value={form.fornecedor_selecionado} onChange={e => set("fornecedor_selecionado", e.target.value)} placeholder="Fornecedor escolhido" /></div>
            <div><Label>Valor Aprovado (R$)</Label><Input type="number" step="0.01" value={form.valor_aprovado} onChange={e => set("valor_aprovado", e.target.value)} /></div>
          </div>

          <div>
            <Label>Parecer Comercial</Label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none" value={form.parecer} onChange={e => set("parecer", e.target.value)} placeholder="Racional da escolha..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="text-white" style={{ backgroundColor: "#c35e1e" }}>
              {cotacao ? "Atualizar" : "Criar Cotação"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}