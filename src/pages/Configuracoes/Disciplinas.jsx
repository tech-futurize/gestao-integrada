import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/FormDialog";
import PageHeader from "@/components/ui/PageHeader";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { entities } from "@/api/supabaseEntities";

const PALETTE = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4",
  "#10b981", "#ef4444", "#6366f1", "#ec4899",
  "#84cc16", "#f97316", "#14b8a6", "#6b7280",
];

const EMPTY = { codigo: "", nome: "", cor: "#3b82f6" };

export default function Disciplinas() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showInativos, setShowInativos] = useState(false);

  const { data: all = [], isPending, isError } = useQuery({
    queryKey: ["disciplinas"],
    queryFn: () => entities.Disciplina.list(),
  });

  const disciplinas = showInativos ? all : all.filter((d) => d.ativo !== false);

  const saveMut = useMutation({
    mutationFn: async (values) => {
      if (dialog?.item?.id) return entities.Disciplina.update(dialog.item.id, values);
      return entities.Disciplina.create(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      setDialog(null);
      toast({ variant: "success", description: "Disciplina salva." });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }) => entities.Disciplina.update(id, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
    onError: (e) => toast({ title: "Erro", description: friendlyMessage(e), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Disciplina.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      setDeleting(null);
      toast({ variant: "success", description: "Disciplina excluída." });
    },
    onError: (e) => toast({ title: "Erro ao excluir", description: friendlyMessage(e), variant: "destructive" }),
  });

  const openCreate = () => { setForm(EMPTY); setDialog({ mode: "create" }); };
  const openEdit   = (item) => {
    setForm({ codigo: item.codigo, nome: item.nome, cor: item.cor || "#6b7280" });
    setDialog({ mode: "edit", item });
  };
  const handleSave = () => {
    if (!form.codigo.trim() || !form.nome.trim()) return;
    saveMut.mutate({ codigo: form.codigo.trim().toUpperCase(), nome: form.nome.trim(), cor: form.cor });
  };

  const inativos = all.filter((d) => d.ativo === false).length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader />

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Disciplinas</p>
              <p className="text-xs text-muted-foreground">
                {all.filter((d) => d.ativo !== false).length} ativa{all.filter((d) => d.ativo !== false).length !== 1 ? "s" : ""}
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
              <Plus className="w-4 h-4" /> Nova Disciplina
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isPending && (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {isError && (
            <div className="p-8 text-center text-sm text-destructive">Erro ao carregar disciplinas.</div>
          )}
          {!isPending && !isError && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10">Cor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Código</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Status</th>
                  <th className="px-5 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {disciplinas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma disciplina cadastrada.
                    </td>
                  </tr>
                )}
                {disciplinas.map((d, i) => {
                  const inativo = d.ativo === false;
                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-border/50 transition-colors ${
                        inativo ? "opacity-50" : i % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: inativo ? "#9ca3af" : (d.cor || "#6b7280") }}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block font-mono text-xs font-bold rounded px-2 py-0.5 ${inativo ? "bg-muted/50 text-muted-foreground line-through" : "bg-muted text-foreground"}`}>
                          {d.codigo}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-sm ${inativo ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {d.nome}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleMut.mutate({ id: d.id, ativo: !d.ativo })}
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
                            onClick={() => openEdit(d)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(d)}
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
          icon={Layers}
          title={dialog.mode === "create" ? "Nova Disciplina" : "Editar Disciplina"}
          subtitle={dialog.mode === "edit" ? `Editando: ${dialog.item.codigo}` : "Preencha código, nome e cor"}
          maxWidth="max-w-sm"
          mode="edit"
          onClose={() => setDialog(null)}
          onSave={handleSave}
          saving={saveMut.isPending}
          saveDisabled={!form.codigo.trim() || !form.nome.trim()}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Código <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono uppercase"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                placeholder="ex: MEC, CIV, ELE"
                maxLength={8}
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
                placeholder="ex: Mecânica, Civil, Elétrica"
                maxLength={60}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Cor de identificação
              </label>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, cor }))}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: cor,
                      borderColor: form.cor === cor ? "white" : "transparent",
                      boxShadow: form.cor === cor ? `0 0 0 2px ${cor}` : "none",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-7 h-7 rounded-full border border-border shrink-0" style={{ backgroundColor: form.cor }} />
                <input
                  type="text"
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 text-xs font-mono bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={form.cor}
                  onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
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
          title="Excluir Disciplina"
          subtitle={`"${deleting.codigo} — ${deleting.nome}"`}
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
            Esta ação não pode ser desfeita. A disciplina será removida permanentemente.
            Considere <strong>desativar</strong> em vez de excluir para preservar o histórico.
          </p>
        </FormDialog>
      )}
    </div>
  );
}
