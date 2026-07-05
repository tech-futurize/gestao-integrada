import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/FormDialog";
import PageHeader from "@/components/ui/PageHeader";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { entities } from "@/api/supabaseEntities";

const EMPTY = { nome: "" };

export default function Equipamentos({ asTab = false }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showInativos, setShowInativos] = useState(false);

  const { data: all = [], isPending, isError } = useQuery({
    queryKey: ["tipos_equipamento"],
    queryFn: () => entities.TipoEquipamento.list(),
  });

  const tipos = showInativos ? all : all.filter((t) => t.ativo !== false);

  const saveMut = useMutation({
    mutationFn: async (values) => {
      if (dialog?.item?.id) return entities.TipoEquipamento.update(dialog.item.id, values);
      return entities.TipoEquipamento.create(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_equipamento"] });
      setDialog(null);
      toast({ variant: "success", description: "Tipo de equipamento salvo." });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }) => entities.TipoEquipamento.update(id, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipos_equipamento"] }),
    onError: (e) => toast({ title: "Erro", description: friendlyMessage(e), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.TipoEquipamento.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_equipamento"] });
      setDeleting(null);
      toast({ variant: "success", description: "Tipo de equipamento excluído." });
    },
    onError: (e) => toast({ title: "Erro ao excluir", description: friendlyMessage(e), variant: "destructive" }),
  });

  const openCreate = () => { setForm(EMPTY); setDialog({ mode: "create" }); };
  const openEdit = (item) => {
    setForm({ nome: item.nome });
    setDialog({ mode: "edit", item });
  };
  const handleSave = () => {
    if (!form.nome.trim()) return;
    saveMut.mutate({ nome: form.nome.trim() });
  };

  const inativos = all.filter((t) => t.ativo === false).length;

  const tabContent = (
    <>
      <div className={asTab ? "space-y-5" : "flex-1 overflow-auto p-6 space-y-5"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Tipos de Equipamento</p>
              <p className="text-xs text-muted-foreground">
                {all.filter((t) => t.ativo !== false).length} ativo{all.filter((t) => t.ativo !== false).length !== 1 ? "s" : ""}
                {inativos > 0 && ` · ${inativos} inativo${inativos !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inativos > 0 && (
              <button
                onClick={() => setShowInativos((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                {showInativos ? "Ocultar inativos" : "Mostrar inativos"}
              </button>
            )}
            <Button size="sm" variant="save" onClick={openCreate} className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" /> Novo Tipo
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isPending && (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {isError && (
            <div className="p-8 text-center text-sm text-destructive">Erro ao carregar tipos de equipamento.</div>
          )}
          {!isPending && !isError && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Status</th>
                  <th className="px-5 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {tipos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Nenhum tipo de equipamento cadastrado.
                    </td>
                  </tr>
                )}
                {tipos.map((t, i) => {
                  const inativo = t.ativo === false;
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-border/50 transition-colors ${
                        inativo ? "opacity-50" : i % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className={`px-5 py-3 text-sm ${inativo ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {t.nome}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleMut.mutate({ id: t.id, ativo: t.ativo === false })}
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
                            {inativo ? "Inativo" : "Ativo"}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(t)}
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
          icon={Wrench}
          title={dialog.mode === "create" ? "Novo Tipo de Equipamento" : "Editar Tipo de Equipamento"}
          subtitle={dialog.mode === "edit" ? `Editando: ${dialog.item.nome}` : "Preencha o nome do tipo"}
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
                placeholder="ex: Guindaste, Compressor, Andaime"
                maxLength={80}
                autoFocus
              />
            </div>
          </div>
        </FormDialog>
      )}

      {deleting && (
        <FormDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          icon={Trash2}
          title="Excluir Tipo de Equipamento"
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
            Esta ação não pode ser desfeita. O tipo será removido permanentemente.
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
