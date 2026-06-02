import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ruler, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/FormDialog";
import PageHeader from "@/components/ui/PageHeader";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { entities } from "@/api/supabaseEntities";

const EMPTY = { sigla: "", nome: "" };

export default function UnidadesMedida() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showInativos, setShowInativos] = useState(false);

  const { data: all = [], isPending, isError } = useQuery({
    queryKey: ["unidades_medida"],
    queryFn: () => entities.UnidadeMedida.list(),
  });

  const unidades = showInativos ? all : all.filter((u) => u.ativo !== false);

  const saveMut = useMutation({
    mutationFn: async (values) => {
      if (dialog?.item?.id) return entities.UnidadeMedida.update(dialog.item.id, values);
      return entities.UnidadeMedida.create(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades_medida"] });
      setDialog(null);
      toast({ variant: "success", description: "Unidade salva." });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }) => entities.UnidadeMedida.update(id, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unidades_medida"] }),
    onError: (e) => toast({ title: "Erro", description: friendlyMessage(e), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.UnidadeMedida.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades_medida"] });
      setDeleting(null);
      toast({ variant: "success", description: "Unidade excluída." });
    },
    onError: (e) => toast({ title: "Erro ao excluir", description: friendlyMessage(e), variant: "destructive" }),
  });

  const openCreate = () => { setForm(EMPTY); setDialog({ mode: "create" }); };
  const openEdit   = (item) => { setForm({ sigla: item.sigla, nome: item.nome }); setDialog({ mode: "edit", item }); };
  const handleSave = () => {
    if (!form.sigla.trim() || !form.nome.trim()) return;
    saveMut.mutate({ sigla: form.sigla.trim(), nome: form.nome.trim() });
  };

  const inativos = all.filter((u) => u.ativo === false).length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader />

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ruler className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Unidades de Medida</p>
              <p className="text-xs text-muted-foreground">
                {all.filter((u) => u.ativo !== false).length} ativa{all.filter((u) => u.ativo !== false).length !== 1 ? "s" : ""}
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
            <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" /> Nova Unidade
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isPending && (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {isError && (
            <div className="p-8 text-center text-sm text-destructive">Erro ao carregar unidades.</div>
          )}
          {!isPending && !isError && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Sigla</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Status</th>
                  <th className="px-5 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {unidades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma unidade cadastrada.
                    </td>
                  </tr>
                )}
                {unidades.map((u, i) => {
                  const inativo = u.ativo === false;
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-border/50 transition-colors ${
                        inativo ? "opacity-50" : i % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span className={`inline-block font-mono text-xs font-bold rounded px-2 py-0.5 ${inativo ? "bg-muted/50 text-muted-foreground line-through" : "bg-muted text-foreground"}`}>
                          {u.sigla}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-sm ${inativo ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {u.nome}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleMut.mutate({ id: u.id, ativo: !u.ativo })}
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
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(u)}
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

      {/* Dialog criar/editar */}
      {dialog && (
        <FormDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          icon={Ruler}
          title={dialog.mode === "create" ? "Nova Unidade de Medida" : "Editar Unidade de Medida"}
          subtitle={dialog.mode === "edit" ? `Editando: ${dialog.item.sigla}` : "Preencha sigla e nome"}
          maxWidth="max-w-sm"
          mode="edit"
          onClose={() => setDialog(null)}
          onSave={handleSave}
          saving={saveMut.isPending}
          saveDisabled={!form.sigla.trim() || !form.nome.trim()}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Sigla <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                value={form.sigla}
                onChange={(e) => setForm((f) => ({ ...f, sigla: e.target.value }))}
                placeholder="ex: m², kg, hr"
                maxLength={10}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Nome <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="ex: Metro quadrado"
                maxLength={60}
              />
            </div>
          </div>
        </FormDialog>
      )}

      {/* Dialog confirmar exclusão */}
      {deleting && (
        <FormDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          icon={Trash2}
          title="Excluir Unidade de Medida"
          subtitle={`"${deleting.sigla} — ${deleting.nome}"`}
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
            Esta ação não pode ser desfeita. A unidade será removida permanentemente.
            Considere <strong>desativar</strong> em vez de excluir para preservar o histórico.
          </p>
        </FormDialog>
      )}
    </div>
  );
}
