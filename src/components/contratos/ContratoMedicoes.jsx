import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import RowActions from "@/components/ui/RowActions";
import MedicaoForm from "@/components/contratos/MedicaoForm";
import { formatDate } from "@/lib/dateUtils";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const CONCLUIDAS = ["Concluído", "Aprovada", "Paga"];

export default function ContratoMedicoes({ contrato }) {
  const { selectedProjectId } = useProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState(null);

  const { data: medicoes = [], isPending } = useQuery({
    queryKey: ["medicoes", "contrato", contrato.id],
    queryFn: () => entities.Medicao.filter({ contrato_id: contrato.id }),
    enabled: !!contrato.id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["medicoes", "contrato", contrato.id] });
  const createMut = useMutation({ mutationFn: (d) => entities.Medicao.create(d), onSuccess: () => { invalidate(); setShowForm(false); }, onError: onErr });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => entities.Medicao.update(id, data), onSuccess: () => { invalidate(); setShowForm(false); setEdit(null); }, onError: onErr });
  const deleteMut = useMutation({ mutationFn: (id) => entities.Medicao.delete(id), onSuccess: invalidate, onError: onErr });

  const handleSave = (data) => {
    if (edit) updateMut.mutate({ id: edit.id, data });
    else createMut.mutate({ ...data, contrato_id: contrato.id, projeto_id: selectedProjectId });
  };

  const acumulado = medicoes.filter((m) => CONCLUIDAS.includes(m.status)).reduce((s, m) => s + (m.valor || 0), 0);
  const pct = contrato.valor_total ? (acumulado / contrato.valor_total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-xs text-muted-foreground">Acumulado medido </span>
          <span className="font-bold text-foreground">{fmt(acumulado)} · {pct.toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground"> de {fmt(contrato.valor_total)}</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => { setEdit(null); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Medição
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : medicoes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma medição registrada.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-left">
                <th className="px-3 py-2 font-semibold">Nº</th>
                <th className="px-3 py-2 font-semibold">Período</th>
                <th className="px-3 py-2 font-semibold text-right">Valor medido</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {medicoes.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{m.numero}</td>
                  <td className="px-3 py-2">{formatDate(m.periodo_inicio) || "—"} → {formatDate(m.periodo_fim) || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold text-ocre">{fmt(m.valor)}</td>
                  <td className="px-3 py-2"><StatusBadge status={m.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <RowActions onEdit={() => { setEdit(m); setShowForm(true); }} onDelete={() => deleteMut.mutate(m.id)} deleteDescription="A medição será excluída permanentemente." size="sm" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MedicaoForm
          key={edit?.id || "new-medicao"}
          medicao={edit}
          contrato={contrato}
          medicoesAnteriores={medicoes.filter((m) => m.id !== edit?.id)}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEdit(null); }}
        />
      )}
    </div>
  );
}
