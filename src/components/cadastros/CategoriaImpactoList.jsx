import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";

export default function CategoriaImpactoList() {
  const { selectedProjectId } = useProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newNome, setNewNome] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState("");

  const { data: categorias = [], isPending, isError } = useQuery({
    queryKey: ["categorias_impacto", selectedProjectId],
    queryFn: () => entities.CategoriaImpacto.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMut = useMutation({
    mutationFn: (nome) =>
      entities.CategoriaImpacto.create({ nome: nome.trim(), projeto_id: selectedProjectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      setNewNome("");
      toast({ variant: "success", description: "Categoria adicionada." });
    },
    onError: (e) =>
      toast({ title: "Erro ao adicionar", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, nome }) =>
      entities.CategoriaImpacto.update(id, { nome: nome.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      setEditingId(null);
      toast({ variant: "success", description: "Categoria atualizada." });
    },
    onError: (e) =>
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.CategoriaImpacto.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      toast({ variant: "success", description: "Categoria removida." });
    },
    onError: (e) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const handleAdd = () => {
    if (!newNome.trim()) return;
    createMut.mutate(newNome);
  };

  const startEdit = (cat) => { setEditingId(cat.id); setEditNome(cat.nome); };
  const cancelEdit = () => { setEditingId(null); setEditNome(""); };
  const handleUpdate = () => {
    if (!editNome.trim()) return;
    updateMut.mutate({ id: editingId, nome: editNome });
  };

  return (
    <div className="space-y-5">
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

      <div className="flex gap-2">
        <Input
          placeholder="Nome da categoria..."
          value={newNome}
          onChange={(e) => setNewNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="max-w-sm text-sm"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newNome.trim() || createMut.isPending}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

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
                    {editingId === cat.id ? (
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="max-w-xs text-sm h-8"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-foreground">{cat.nome}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === cat.id ? (
                        <>
                          <button
                            onClick={handleUpdate}
                            disabled={!editNome.trim() || updateMut.isPending}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMut.mutate(cat.id)}
                            disabled={deleteMut.isPending}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
