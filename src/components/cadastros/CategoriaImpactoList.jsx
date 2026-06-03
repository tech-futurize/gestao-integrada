import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/FormDialog";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";

const EMPTY = { nome: "" };

export default function CategoriaImpactoList() {
  const { selectedProjectId } = useProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: categorias = [], isPending, isError } = useQuery({
    queryKey: ["categorias_impacto", selectedProjectId],
    queryFn: () => entities.CategoriaImpacto.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const saveMut = useMutation({
    mutationFn: async (values) => {
      if (dialog?.item?.id)
        return entities.CategoriaImpacto.update(dialog.item.id, { nome: values.nome });
      return entities.CategoriaImpacto.create({ nome: values.nome, projeto_id: selectedProjectId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      setDialog(null);
      toast({ variant: "success", description: dialog?.item?.id ? "Categoria atualizada." : "Categoria adicionada." });
    },
    onError: (e) =>
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.CategoriaImpacto.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      setDeleting(null);
      toast({ variant: "success", description: "Categoria removida." });
    },
    onError: (e) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setForm(EMPTY); setDialog({ mode: "create" }); };
  const openEdit = (cat) => { setForm({ nome: cat.nome }); setDialog({ mode: "edit", item: cat }); };
  const handleSave = () => {
    if (!form.nome.trim()) return;
    saveMut.mutate({ nome: form.nome.trim() });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Categorias de Impacto</p>
            <p className="text-xs text-muted-foreground">
              {categorias.length} categoria{categorias.length !== 1 ? "s" : ""} cadastrada{categorias.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button size="sm" variant="save" onClick={openCreate} className="gap-1.5 text-xs">
          <Plus className="w-4 h-4" /> Nova Categoria
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isPending && (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        )}
        {isError && (
          <div className="p-8 text-center text-sm text-destructive">
            Erro ao carregar categorias.
          </div>
        )}
        {!isPending && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nome
                </th>
                <th className="px-5 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma categoria de impacto cadastrada para este projeto.
                  </td>
                </tr>
              )}
              {categorias.map((cat, i) => (
                <tr
                  key={cat.id}
                  className={`border-b border-border/50 transition-colors ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/20"
                  }`}
                >
                  <td className="px-5 py-3">
                    <span className="text-sm text-foreground">{cat.nome}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(cat)}
                        disabled={deleteMut.isPending}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialog criar/editar */}
      {dialog && (
        <FormDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          icon={Target}
          title={dialog.mode === "create" ? "Nova Categoria de Impacto" : "Editar Categoria de Impacto"}
          subtitle={dialog.mode === "edit" ? `Editando: ${dialog.item.nome}` : "Preencha o nome da categoria"}
          maxWidth="max-w-sm"
          mode="edit"
          onClose={() => setDialog(null)}
          onSave={handleSave}
          saving={saveMut.isPending}
          saveDisabled={!form.nome.trim()}
        >
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Nome <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.nome}
              onChange={(e) => setForm({ nome: e.target.value })}
              placeholder="ex: Prazo, Custo, Qualidade"
              maxLength={80}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </FormDialog>
      )}

      {/* Dialog confirmar exclusão */}
      {deleting && (
        <FormDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          icon={Trash2}
          title="Excluir Categoria de Impacto"
          subtitle={`"${deleting.nome}"`}
          maxWidth="max-w-sm"
          mode="edit"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)} className="text-xs">Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMut.mutate(deleting.id)}
                disabled={deleteMut.isPending}
                className="text-xs"
              >
                {deleteMut.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. A categoria será removida permanentemente.
          </p>
        </FormDialog>
      )}
    </div>
  );
}
