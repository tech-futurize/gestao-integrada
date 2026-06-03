import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import PqpEditor from "@/components/planejamento/PqpEditor";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

export default function ContratoPQP({ contrato }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [itens, setItens] = useState(contrato.itens || []);
  const [dirty, setDirty] = useState(false);

  const mut = useMutation({
    mutationFn: (novos) => entities.Contrato.update(contrato.id, { itens: novos }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
      setDirty(false);
      toast({ title: "PQP salva", duration: 2000 });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="save" disabled={!dirty || mut.isPending} onClick={() => mut.mutate(itens)}>
          <Save className="w-4 h-4 mr-1.5" /> Salvar PQP
        </Button>
      </div>
      <PqpEditor
        mode="definicao"
        itens={itens}
        onChange={(n) => { setItens(n); setDirty(true); }}
      />
    </div>
  );
}
