import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useToast } from "@/components/ui/use-toast";
import { friendlyMessage } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";

export default function VinculoPickerDialog({
  open,
  onOpenChange,
  pleito,
  modulo,
  vinculosExistentes,
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState(new Set());
  const [observacao, setObservacao] = useState("");

  const vinculadosIds = useMemo(
    () => new Set(vinculosExistentes.map((v) => v.registro_id)),
    [vinculosExistentes]
  );

  const { data: candidatos = [], isPending } = useQuery({
    queryKey: ["vinculo-candidatos", modulo.entidade, pleito.projeto_id],
    queryFn: () => entities[modulo.entidade].filter({ projeto_id: pleito.projeto_id }),
    enabled: open && !!pleito.projeto_id,
  });

  const filtrados = useMemo(() => {
    if (!busca.trim()) return candidatos;
    const termo = busca.toLowerCase();
    return candidatos.filter((rec) =>
      modulo.searchFields.some((campo) =>
        String(rec[campo] ?? "").toLowerCase().includes(termo)
      )
    );
  }, [candidatos, busca, modulo.searchFields]);

  const createMutation = useMutation({
    mutationFn: (registros) =>
      Promise.all(
        registros.map((rec) =>
          entities.PleitoVinculo.create({
            pleito_id: pleito.id,
            projeto_id: pleito.projeto_id,
            entidade: modulo.entidade,
            registro_id: rec.id,
            label_cache: modulo.getLabel(rec),
            observacao: observacao.trim() || null,
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pleito-vinculos", pleito.id] });
      handleClose();
      toast({ title: "Vínculos criados com sucesso" });
    },
    onError: (e) =>
      toast({ title: "Erro ao vincular", description: friendlyMessage(e), variant: "destructive" }),
  });

  const handleClose = () => {
    setBusca("");
    setSelecionados(new Set());
    setObservacao("");
    onOpenChange(false);
  };

  const toggleSelecionado = (id) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleVincular = () => {
    const registros = filtrados.filter((r) => selecionados.has(r.id));
    if (registros.length === 0) return;
    createMutation.mutate(registros);
  };

  const novosCount = [...selecionados].filter((id) => !vinculadosIds.has(id)).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <modulo.icon className="w-4 h-4" />
            Vincular {modulo.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {isPending ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {candidatos.length === 0
                ? "Nenhum registro encontrado neste projeto."
                : "Nenhum resultado para a busca."}
            </div>
          ) : (
            <ScrollArea className="h-60 rounded-md border border-border">
              <div className="p-2 space-y-1">
                {filtrados.map((rec) => {
                  const jaVinculado = vinculadosIds.has(rec.id);
                  const marcado = selecionados.has(rec.id) || jaVinculado;
                  return (
                    <label
                      key={rec.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors
                        ${jaVinculado
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-muted/60"}`}
                    >
                      <Checkbox
                        checked={marcado}
                        disabled={jaVinculado}
                        onCheckedChange={() => !jaVinculado && toggleSelecionado(rec.id)}
                      />
                      <span className="text-sm text-foreground flex-1 leading-tight">
                        {modulo.getLabel(rec)}
                        {jaVinculado && (
                          <span className="ml-2 text-xs text-muted-foreground">(já vinculado)</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {novosCount > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Observação (opcional)
              </label>
              <Textarea
                placeholder="Ex: este documento embasou o pleito por atraso..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleVincular}
            disabled={novosCount === 0 || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Vincular{novosCount > 0 ? ` (${novosCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
