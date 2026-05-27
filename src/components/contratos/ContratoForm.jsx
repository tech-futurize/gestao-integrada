import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CloseButton from "@/components/ui/CloseButton";

export default function ContratoForm({ contrato, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", objeto: "", fornecedor: "", cnpj: "",
    data_inicio: "", data_fim: "", status: "Ativo", tipo: "Serviços",
    centro_custo: "", gestor: "", observacoes: "",
    ...contrato,
    valor_total: contrato?.valor_total ?? "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, valor_total: parseFloat(form.valor_total) || 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-lg font-bold" style={{ color: "#26405d" }}>
            {contrato ? "Editar Contrato" : "Novo Contrato"}
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número do Contrato</Label>
              <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="CT-001" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Ativo", "Em Revisão", "Suspenso", "Encerrado", "Cancelado"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Objeto do Contrato *</Label>
            <Input required value={form.objeto} onChange={e => set("objeto", e.target.value)} placeholder="Descrição do objeto contratado" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fornecedor *</Label>
              <Input required value={form.fornecedor} onChange={e => set("fornecedor", e.target.value)} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Serviços", "Fornecimento", "Misto"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Total (R$)</Label>
              <Input type="number" step="0.01" value={form.valor_total} onChange={e => set("valor_total", e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} />
            </div>
            <div>
              <Label>Data de Fim</Label>
              <Input type="date" value={form.data_fim} onChange={e => set("data_fim", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Centro de Custo</Label>
              <Input value={form.centro_custo} onChange={e => set("centro_custo", e.target.value)} placeholder="Ex: CC-001" />
            </div>
            <div>
              <Label>Gestor do Contrato</Label>
              <Input value={form.gestor} onChange={e => set("gestor", e.target.value)} placeholder="Nome do gestor" />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <textarea
              value={form.observacoes}
              onChange={e => set("observacoes", e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2"
              style={{ focusRingColor: "#c35e1e" }}
              placeholder="Observações gerais..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-brand-accent hover:opacity-90 text-white">
              {contrato ? "Atualizar" : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}