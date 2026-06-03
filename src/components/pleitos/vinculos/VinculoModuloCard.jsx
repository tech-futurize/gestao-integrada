import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useToast } from "@/components/ui/use-toast";
import { friendlyMessage } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import VinculoPickerDialog from "./VinculoPickerDialog";

export default function VinculoModuloCard({ pleito, modulo, vinculos }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.PleitoVinculo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pleito-vinculos", pleito.id] });
    },
    onError: (e) =>
      toast({ title: "Erro ao remover vínculo", description: friendlyMessage(e), variant: "destructive" }),
  });

  return (
    <>
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <modulo.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{modulo.titulo}</span>
              <Badge variant="secondary" className="shrink-0 text-xs">{vinculos.length}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-7 px-2 text-xs"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Vincular
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-0">
          {vinculos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nenhum vínculo</p>
          ) : (
            <ul className="space-y-1.5">
              {vinculos.map((v) => (
                <li
                  key={v.id}
                  className="flex items-start gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug break-words">
                      {v.label_cache ?? "—"}
                    </p>
                    {v.observacao && (
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">
                        {v.observacao}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(v.id)}
                    disabled={deleteMutation.isPending}
                    title="Remover vínculo"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <VinculoPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        pleito={pleito}
        modulo={modulo}
        vinculosExistentes={vinculos}
      />
    </>
  );
}
