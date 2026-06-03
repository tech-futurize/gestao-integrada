import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Receipt } from "lucide-react";
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

export default function FaturamentoForm({ faturamento, faturamentos = [], pqpMestra = [], onSave, onClose }) {
  // Itens iniciais: edição usa os próprios; novo herda do último período (acumulando os concluídos).
  const initialItens = useMemo(() => {
    if (faturamento) return faturamento.itens || [];
    const ordenados = [...faturamentos].sort((a, b) => (b.mes_referencia || "").localeCompare(a.mes_referencia || ""));
    const ultimo = ordenados[0];
    if (ultimo?.itens?.length) {
      const anteriores = faturamentos.filter((f) => f.status === "Concluído");
      return zerarMedida(recalcAcumulado(ultimo.itens, anteriores));
    }
    // Sem período anterior: semeia da PQ-mestra do projeto ativo
    if (pqpMestra?.length) return zerarMedida(pqpMestra);
    return [];
  }, [faturamento, faturamentos, pqpMestra]);

  const proximoNumero = useMemo(() => {
    if (faturamento) return faturamento.numero || "";
    const nums = faturamentos.map((f) => parseInt(String(f.numero).replace(/\D/g, ""), 10)).filter(Boolean);
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    return `FAT-${String(n).padStart(3, "0")}`;
  }, [faturamento, faturamentos]);

  const [form, setForm] = useState({
    numero: proximoNumero,
    mes_referencia: faturamento?.mes_referencia ? faturamento.mes_referencia.slice(0, 7) : "",
    status: "Elaboração",
    observacoes: "",
    ...faturamento,
    itens: initialItens,
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const totais = useMemo(() => computeTotais(form.itens || []), [form.itens]);
  const readOnly = form.status === "Concluído";

  const handleSubmit = () => {
    const mes = /^\d{4}-\d{2}$/.test(form.mes_referencia) ? `${form.mes_referencia}-01` : form.mes_referencia;
    onSave({ ...form, mes_referencia: mes, valor_medido: totais.valorTotalMedido });
  };

  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={Receipt}
      title={faturamento ? "Editar Faturamento" : "Novo Faturamento"}
      subtitle={faturamento ? `Faturamento ${faturamento.numero}` : "Medição do projeto"}
      maxWidth="max-w-5xl"
      onClose={onClose}
      onSave={handleSubmit}
      saveLabel={faturamento ? "Salvar" : "Criar Faturamento"}
    >
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Número</Label>
          <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="FAT-001" />
        </div>
        <div>
          <Label>Mês de referência *</Label>
          <Input type="month" value={form.mes_referencia} onChange={(e) => set("mes_referencia", e.target.value)} />
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
        <Label className="mb-2 block">Planilha (PQP) — lançamento de medição</Label>
        <PqpEditor mode="medicao" itens={form.itens || []} onChange={(itens) => set("itens", itens)} readOnly={readOnly} />
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
