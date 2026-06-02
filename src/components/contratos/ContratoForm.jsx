import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { FormDialog } from "@/components/ui/FormDialog";

const TIPOS = ["Serviços", "Fornecimento", "Fornecimento + Serviço"];
const STATUS = ["A iniciar", "Em andamento", "Concluído", "Paralisado"];
const MODALIDADES = ["Preço unitário", "Global"];

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

export default function ContratoForm({ contrato, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", objeto: "", fornecedor: "", cnpj: "",
    data_inicio: "", data_fim: "", status: "A iniciar", tipo: "Serviços",
    modalidade: "", origem: "",
    centro_custo: "", gestor: "", observacoes: "",
    ...contrato,
    valor_total: contrato?.valor_total != null ? formatBR(contrato.valor_total) : "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    onSave({
      ...form,
      valor_total: parseBRFloat(form.valor_total),
      modalidade: form.modalidade || null,
      origem: form.origem || null,
    });
  };

  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={FileText}
      title={contrato ? "Editar Contrato" : "Novo Contrato"}
      subtitle={contrato ? contrato.numero || contrato.objeto?.substring(0, 40) : "Administração Contratual"}
      maxWidth="max-w-2xl"
      onClose={onClose}
      onSave={handleSubmit}
      saveLabel={contrato ? "Salvar" : "Criar Contrato"}
    >
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
              {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valor Total (R$)</Label>
          <Input
            value={form.valor_total}
            onChange={e => set("valor_total", e.target.value)}
            onBlur={e => {
              const f = formatBR(e.target.value);
              if (f) set("valor_total", f);
            }}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Modalidade</Label>
          <Select value={form.modalidade || undefined} onValueChange={v => set("modalidade", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {MODALIDADES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Origem (orçamento/proposta)</Label>
          <Input value={form.origem} onChange={e => set("origem", e.target.value)} placeholder="Ex: ORC-0042" />
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
          className="w-full border border-border rounded-lg p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Observações gerais..."
        />
      </div>
    </FormDialog>
  );
}
