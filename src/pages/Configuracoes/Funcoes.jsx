import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/FormDialog";
import PageHeader from "@/components/ui/PageHeader";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { entities } from "@/api/supabaseEntities";

const EMPTY = { nome: "", subtipo_mo: "MOD" };

export default function Funcoes({ asTab = false }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showInativos, setShowInativos] = useState(false);

  const { data: all = [], isPending, isError } = useQuery({
    queryKey: ["funcoes"],
    queryFn: () => entities.Funcao.list(),
  });

  const funcoes = showInativos ? all : all.filter((f) => f.ativo !== false);

  const saveMut = useMutation({
    mutationFn: async (values) => {
      if (dialog?.item?.id) return entities.Funcao.update(dialog.item.id, values);
      return entities.Funcao.create(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcoes"] });
      setDialog(null);
      toast({ variant: "success", description: "Função salva." });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }) => entities.Funcao.update(id, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funcoes"] }),
    onError: (e) => toast({ title: "Erro", description: friendlyMessage(e), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Funcao.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcoes"] });
      setDeleting(null);
      toast({ variant: "success", description: "Função excluída." });
    },
    onError: (e) => toast({ title: "Erro ao excluir", description: friendlyMessage(e), variant: "destructive" }),
  });

  const openCreate = () => { setForm(EMPTY); setDialog({ mode: "create" }); };
  const openEdit = (item) => {
    setForm({ nome: item.nome, subtipo_mo: item.subtipo_mo || "MOD" });
    setDialog({ mode: "edit", item });
  };
  const handleSave = () => {
    if (!form.nome.trim()) return;
    saveMut.mutate({ nome: form.nome.trim(), subtipo_mo: form.subtipo_mo });
  };

  const inativos = all.filter((f) => f.ativo === false).length;

  const tabContent = (
    <>
      <div className={asTab ? "space-y-5" : "flex-1 overflow-auto p-6 space-y-5"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Funções</p>
              <p className="text-xs text-muted-foreground">
                {all.filter((f) => f.ativo !== false).length} ativa{all.filter((f) => f.ativo !== false).length !== 1 ? "s" : ""}
                {inativos > 0 && ` · ${inativos} inativa${inativos !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inativos > 0 && (
              <button
                onClick={() => setShowInativos((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                {showInativos ? "Ocultar inativas" : "Mostrar inativas"}
              </button>
            )}
            <Button size="sm" variant="save" onClick={openCreate} className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" /> Nova Função
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isPending && (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {isError && (
            <div className="p-8 text-center text-sm text-destructive">Erro ao carregar funções.</div>
          )}
          {!isPending && !isError && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Tipo</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Status</th>
                  <th className="px-5 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {funcoes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma função cadastrada.
                    </td>
                  </tr>
                )}
                {funcoes.map((f, i) => {
                  const inativo = f.ativo === false;
                  return (
                    <tr
                      key={f.id}
                      className={`border-b border-border/50 transition-colors ${
                        inativo ? "opacity-50" : i % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className={`px-5 py-3 text-sm ${inativo ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {f.nome}
                      </td>
                      <td className="px-5 py-3">
                        {f.subtipo_mo === "MOI" ? (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700">
                            MOI
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">
                            MOD
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleMut.mutate({ id: f.id, ativo: f.ativo === false })}
                          disabled={toggleMut.isPending}
                          className="flex items-center gap-2 group"
                          title={inativo ? "Ativar" : "Desativar"}
                        >
                          <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                            inativo ? "bg-muted" : "bg-status-positive"
                          }`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                              inativo ? "translate-x-0" : "translate-x-4"
                            }`} />
                          </span>
                          <span className={`text-xs font-medium ${inativo ? "text-muted-foreground" : "text-status-positive"}`}>
                            {inativo ? "Inativa" : "Ativa"}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(f)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(f)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {dialog && (
        <FormDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          icon={Users}
          title={dialog.mode === "create" ? "Nova Função" : "Editar Função"}
          subtitle={dialog.mode === "edit" ? `Editando: ${dialog.item.nome}` : "Preencha nome e tipo"}
          maxWidth="max-w-sm"
          mode="edit"
          onClose={() => setDialog(null)}
          onSave={handleSave}
          saving={saveMut.isPending}
          saveDisabled={!form.nome.trim()}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Nome <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="ex: Soldador, Eletricista, Encarregado"
                maxLength={80}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Tipo de Mão de Obra
              </label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, subtipo_mo: "MOD" }))}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                    form.subtipo_mo === "MOD"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  MOD
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, subtipo_mo: "MOI" }))}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors border-l border-border ${
                    form.subtipo_mo === "MOI"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  MOI
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                MOD = Mão de Obra Direta · MOI = Mão de Obra Indireta
              </p>
            </div>
          </div>
        </FormDialog>
      )}

      {deleting && (
        <FormDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          icon={Trash2}
          title="Excluir Função"
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
            Esta ação não pode ser desfeita. A função será removida permanentemente.
            Considere <strong>desativar</strong> em vez de excluir para preservar o histórico.
          </p>
        </FormDialog>
      )}
    </>
  );

  if (asTab) return tabContent;

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6">
        {tabContent}
      </div>
    </div>
  );
}
