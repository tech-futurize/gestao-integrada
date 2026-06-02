import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardList } from "lucide-react";
import { FormDialog } from "@/components/ui/FormDialog";
import PqpEditor from "@/components/planejamento/PqpEditor";
import { computeTotais, recalcAcumulado } from "@/utils/pqpUtils";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

/** Zera qtd_medida das folhas (novo período parte do zero). */
function zerarMedida(itens = []) {
  return itens.map((n) =>
    n.children?.length ? { ...n, children: zerarMedida(n.children) } : { ...n, qtd_medida: 0 }
  );
}

export default function MedicaoForm({ medicao, contrato, medicoesAnteriores = [], onSave, onClose }) {
  // Itens iniciais: edição usa os próprios; nova herda a PQP do contrato + acumulado das concluídas.
  const initialItens = useMemo(() => {
    if (medicao) return medicao.itens || [];
    const base = contrato?.itens || [];
    if (!base.length) return [];
    const concluidas = medicoesAnteriores.filter((m) => ["Concluído", "Aprovada", "Paga"].includes(m.status));
    return zerarMedida(recalcAcumulado(base, concluidas));
  }, [medicao, contrato, medicoesAnteriores]);

  const proximoNumero = useMemo(() => {
    if (medicao) return medicao.numero || "";
    const nums = medicoesAnteriores.map((m) => parseInt(String(m.numero).replace(/\D/g, ""), 10)).filter(Boolean);
    return String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
  }, [medicao, medicoesAnteriores]);

  const [form, setForm] = useState({
    numero: proximoNumero, periodo_inicio: "", periodo_fim: "", status: "Elaboração", observacoes: "",
    ...medicao,
    itens: initialItens,
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const totais = useMemo(() => computeTotais(form.itens || []), [form.itens]);

  const handleSubmit = () => {
    onSave({ ...form, valor: totais.valorTotalMedido });
  };

  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={ClipboardList}
      title={medicao ? "Editar Medição" : "Nova Medição"}
      subtitle={contrato ? `${contrato.numero || ""} · ${contrato.fornecedor || ""}` : "Medição de subcontrato"}
      maxWidth="max-w-5xl"
      onClose={onClose}
      onSave={handleSubmit}
      saveLabel={medicao ? "Salvar" : "Criar Medição"}
    >
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label>Número *</Label>
          <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="001" />
        </div>
        <div>
          <Label>Período início</Label>
          <Input type="date" value={form.periodo_inicio || ""} onChange={(e) => set("periodo_inicio", e.target.value)} />
        </div>
        <div>
          <Label>Período fim</Label>
          <Input type="date" value={form.periodo_fim || ""} onChange={(e) => set("periodo_fim", e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Elaboração", "Concluído"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Acumulado</p>
          <p className="font-bold">{fmt(totais.valorTotalAcumulado)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Medido no período</p>
          <p className="font-bold text-emerald-600">{fmt(totais.valorTotalMedido)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Avanço financeiro</p>
          <p className="font-bold">{totais.progressoFinanceiro.toFixed(1)}%</p>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Planilha (PQP) — lançamento por item</Label>
        {(form.itens || []).length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4 text-center">
            Defina a PQP do contrato na aba <strong>PQP</strong> antes de medir, ou importe na tabela abaixo.
          </p>
        ) : null}
        <PqpEditor mode="medicao" itens={form.itens || []} onChange={(itens) => set("itens", itens)} />
      </div>

      <div>
        <Label>Observações</Label>
        <textarea
          rows={2}
          className="w-full border border-border rounded-lg p-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.observacoes || ""}
          onChange={(e) => set("observacoes", e.target.value)}
          placeholder="Observações..."
        />
      </div>
    </FormDialog>
  );
}
