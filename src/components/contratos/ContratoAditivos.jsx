import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import RowActions from "@/components/ui/RowActions";
import AditivoForm from "@/components/contratos/AditivoForm";
import { formatDate } from "@/lib/dateUtils";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

const fmt = (v) => (v ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : "—");

const TIPO_COLORS = {
  Prazo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Valor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Prazo e Valor": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function ContratoAditivos({ contrato }) {
  const { selectedProjectId } = useProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState(null);

  const { data: aditivos = [], isPending } = useQuery({
    queryKey: ["aditivos", contrato.id],
    queryFn: () => entities.Aditivo.filter({ contrato_id: contrato.id }),
    enabled: !!contrato.id,
  });

  // Prefixo "aditivos" cobre também ["aditivos","projeto",id] usada na lista de
  // contratos — sem isso o valor ajustado ficava stale ao voltar para a listagem
  const invalidate = () => qc.invalidateQueries({ queryKey: ["aditivos"] });
  const createMut = useMutation({ mutationFn: (d) => entities.Aditivo.create(d), onSuccess: () => { invalidate(); setShowForm(false); }, onError: onErr });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => entities.Aditivo.update(id, data), onSuccess: () => { invalidate(); setShowForm(false); setEdit(null); }, onError: onErr });
  const deleteMut = useMutation({ mutationFn: (id) => entities.Aditivo.delete(id), onSuccess: invalidate, onError: onErr });

  const handleSave = (data) => {
    if (edit) updateMut.mutate({ id: edit.id, data });
    else createMut.mutate({ ...data, contrato_id: contrato.id, projeto_id: selectedProjectId });
  };

  const assinados = aditivos.filter((a) => a.status === "Assinado");
  const somaValor = assinados.reduce((s, a) => s + (a.valor || 0), 0);
  const somaPrazo = assinados.reduce((s, a) => s + (a.prazo_dias || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Aditivos</span>
        <Button size="sm" variant="save" onClick={() => { setEdit(null); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Aditivo
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : aditivos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Nenhum aditivo registrado.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-left">
                <th className="px-3 py-2 font-semibold">Nº</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Assinatura</th>
                <th className="px-3 py-2 font-semibold text-right">Δ Valor</th>
                <th className="px-3 py-2 font-semibold text-right">Δ Prazo</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {aditivos.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{a.numero || "—"}</td>
                  <td className="px-3 py-2"><Badge className={TIPO_COLORS[a.tipo] || "bg-muted text-muted-foreground"}>{a.tipo}</Badge></td>
                  <td className="px-3 py-2">{formatDate(a.data_assinatura) || "—"}</td>
                  <td className="px-3 py-2 text-right text-ocre">{a.valor ? fmt(a.valor) : "—"}</td>
                  <td className="px-3 py-2 text-right">{a.prazo_dias ? `+${a.prazo_dias}d` : "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <RowActions onEdit={() => { setEdit(a); setShowForm(true); }} onDelete={() => deleteMut.mutate(a.id)} deleteDescription="O aditivo será excluído permanentemente." size="sm" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-bold bg-muted/40">
                <td className="px-3 py-2" colSpan={3}>Impacto assinado</td>
                <td className="px-3 py-2 text-right text-status-positive">{somaValor ? `+${fmt(somaValor)}` : "—"}</td>
                <td className="px-3 py-2 text-right">{somaPrazo ? `+${somaPrazo}d` : "—"}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showForm && (
        <AditivoForm
          key={edit?.id || "new-aditivo"}
          aditivo={edit}
          contratoId={contrato.id}
          projetoId={selectedProjectId}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEdit(null); }}
        />
      )}
    </div>
  );
}
