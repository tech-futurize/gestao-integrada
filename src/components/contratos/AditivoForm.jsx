import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CloseButton from "@/components/ui/CloseButton";

const TIPOS = ["Prazo", "Valor", "Prazo e Valor"];
const STATUS_ADITIVO = ["Pendente", "Assinado", "Cancelado"];

const formatBR = (v) => {
  if (v === "" || v == null) return "";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  if (isNaN(n)) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const parseBRFloat = (s) => {
  if (!s) return 0;
  const str = String(s).trim();
  if (str.includes(",")) {
    return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return parseFloat(str) || 0;
};

export default function AditivoForm({ aditivo, contratoId, projetoId, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", tipo: "Prazo", escopo_texto: "",
    prazo_dias: "", justificativa: "", data_assinatura: "",
    status: "Pendente",
    ...aditivo,
    valor: aditivo?.valor != null ? formatBR(aditivo.valor) : "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      contrato_id: contratoId,
      projeto_id: projetoId,
      prazo_dias: parseInt(form.prazo_dias) || 0,
      valor: parseBRFloat(form.valor),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {aditivo ? "Editar Aditivo" : "Novo Aditivo"}
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número</Label>
              <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="AD-001" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Escopo Alterado</Label>
            <textarea
              value={form.escopo_texto}
              onChange={e => set("escopo_texto", e.target.value)}
              rows={3}
              className="w-full border border-border rounded-lg p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Descreva o escopo alterado..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prazo Adicional (dias)</Label>
              <Input
                type="number"
                value={form.prazo_dias}
                onChange={e => set("prazo_dias", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                value={form.valor}
                onChange={e => set("valor", e.target.value)}
                onBlur={e => {
                  const f = formatBR(e.target.value);
                  if (f) set("valor", f);
                }}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label>Justificativa</Label>
            <textarea
              value={form.justificativa}
              onChange={e => set("justificativa", e.target.value)}
              rows={2}
              className="w-full border border-border rounded-lg p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Justificativa do aditivo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Assinatura</Label>
              <Input type="date" value={form.data_assinatura} onChange={e => set("data_assinatura", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ADITIVO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-brand-accent hover:opacity-90 text-white">
              {aditivo ? "Atualizar" : "Adicionar Aditivo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
