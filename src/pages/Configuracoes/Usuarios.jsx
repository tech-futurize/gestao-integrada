import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Edit, UserX } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDialog } from "@/components/ui/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  PERFIL_OPTIONS,
  PERFIL_SEED,
  MODULES,
  ACTIONS,
  ACTION_LABELS,
  DENY_ALL,
} from "@/lib/permissionsConfig";

const STATUS_OPTIONS = ["Ativo", "Inativo"];

const STATUS_CFG = {
  Ativo: { bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  Inativo: { bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const EMPTY_FORM = {
  nome: "",
  email: "",
  cargo: "",
  perfil: "Visualizador",
  status: "Ativo",
};

export default function Usuarios() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permsMatrix, setPermsMatrix] = useState({});

  const { data: usuarios = [], isLoading, isError } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => entities.Usuario.list(),
  });

  // Permissões do usuário em edição
  const { data: userPermsRows = [] } = useQuery({
    queryKey: ["permissoes-editor", editing?.id],
    queryFn: () => entities.PermissaoUsuario.filter({ usuario_id: editing.id }),
    enabled: !!editing?.id,
  });

  // Preenche a matriz quando as permissões do usuário em edição carregam
  useEffect(() => {
    if (!editing?.id) return;
    const map = userPermsRows.reduce((acc, row) => {
      acc[row.modulo] = { ...row.acoes };
      return acc;
    }, {});
    const full = MODULES.reduce((acc, mod) => {
      acc[mod] = map[mod] ?? { ...DENY_ALL };
      return acc;
    }, {});
    setPermsMatrix(full);
  }, [editing?.id, userPermsRows]);

  // Criação de usuário
  const createMut = useMutation({
    mutationFn: (data) => entities.Usuario.create(data),
    onSuccess: (newUser) => {
      createPermsMut.mutate({ usuarioId: newUser.id, perfil: form.perfil });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Usuário criado com sucesso." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Seed automático de permissões ao criar usuário
  const createPermsMut = useMutation({
    mutationFn: async ({ usuarioId, perfil }) => {
      const seed = PERFIL_SEED[perfil] ?? PERFIL_SEED["Visualizador"];
      await Promise.all(
        MODULES.map(modulo =>
          entities.PermissaoUsuario.create({ usuario_id: usuarioId, modulo, acoes: seed[modulo] })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissoes"] });
    },
    onError: (e) => toast({ title: "Erro ao criar permissões", description: e.message, variant: "destructive" }),
  });

  // Atualização de usuário
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Usuario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Usuário atualizado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Desativação de usuário
  const deactivateMut = useMutation({
    mutationFn: (id) => entities.Usuario.update(id, { status: "Inativo" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ variant: "success", description: "Usuário desativado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Salvar permissões editadas
  const savePermsMut = useMutation({
    mutationFn: async ({ usuarioId, matrix }) => {
      const existing = await entities.PermissaoUsuario.filter({ usuario_id: usuarioId });
      const existingMap = existing.reduce((acc, r) => {
        acc[r.modulo] = r.id;
        return acc;
      }, {});
      await Promise.all(
        MODULES.map(modulo => {
          const acoes = matrix[modulo] ?? { ...DENY_ALL };
          const existingId = existingMap[modulo];
          return existingId
            ? entities.PermissaoUsuario.update(existingId, { acoes })
            : entities.PermissaoUsuario.create({ usuario_id: usuarioId, modulo, acoes });
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissoes"] });
      queryClient.invalidateQueries({ queryKey: ["permissoes-editor", editing?.id] });
      toast({ variant: "success", description: "Permissões salvas." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Helpers da matriz de permissões
  const toggleCell = (modulo, acao) => {
    setPermsMatrix(prev => ({
      ...prev,
      [modulo]: { ...prev[modulo], [acao]: !prev[modulo]?.[acao] },
    }));
  };

  const toggleRow = (modulo) => {
    const current = permsMatrix[modulo] ?? DENY_ALL;
    const allTrue = ACTIONS.every(a => current[a]);
    setPermsMatrix(prev => ({
      ...prev,
      [modulo]: ACTIONS.reduce((acc, a) => ({ ...acc, [a]: !allTrue }), {}),
    }));
  };

  const toggleCol = (acao) => {
    const allTrue = MODULES.every(m => permsMatrix[m]?.[acao]);
    setPermsMatrix(prev => {
      const next = { ...prev };
      MODULES.forEach(m => {
        next[m] = { ...(next[m] ?? DENY_ALL), [acao]: !allTrue };
      });
      return next;
    });
  };

  const applyTemplate = (perfil) => {
    const seed = PERFIL_SEED[perfil];
    if (seed) setPermsMatrix({ ...seed });
  };

  const handleEdit = (usuario) => {
    setEditing(usuario);
    setPermsMatrix({});
    setForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      cargo: usuario.cargo || "",
      perfil: usuario.perfil || "Visualizador",
      status: usuario.status || "Ativo",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.nome || !form.email) {
      toast({ title: "Campos obrigatórios", description: "Nome e e-mail são obrigatórios.", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Novo Usuário
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {isError ? (
        <div className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
          Erro ao carregar usuários. Tente recarregar a página.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : usuarios.length === 0 ? (
        <PageEmptyState icon={Users} description="Nenhum usuário cadastrado. Crie o primeiro usuário." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {usuarios.map((u) => {
            const cfg = STATUS_CFG[u.status] || STATUS_CFG.Ativo;
            return (
              <div key={u.id} className="bg-card rounded-xl border border-border p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base leading-tight truncate">{u.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg}`}>
                    {u.status || "Ativo"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {u.cargo && (
                    <div className="col-span-2">
                      <span className="font-medium">Cargo:</span> {u.cargo}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Perfil:</span> {u.perfil || "Visualizador"}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleEdit(u)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {u.status !== "Inativo" && (
                    <button
                      onClick={() => deactivateMut.mutate(u.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                      title="Desativar"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); } }}
        icon={Users}
        title={editing ? "Editar Usuário" : "Novo Usuário"}
        subtitle={editing ? editing.email : "Cadastro de usuário"}
        maxWidth="max-w-2xl"
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSave={handleSubmit}
        saving={createMut.isPending || updateMut.isPending}
        saveLabel={editing ? "Salvar" : "Criar Usuário"}
      >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="usuario@empresa.com"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Cargo</Label>
              <Input
                value={form.cargo}
                onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
                placeholder="Ex: Engenheiro de Campo"
              />
            </div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={form.perfil} onValueChange={(v) => setForm((f) => ({ ...f, perfil: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERFIL_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção de permissões — aparece apenas no modo de edição */}
          {editing && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Permissões</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Aplicar perfil:</span>
                  <Select onValueChange={applyTemplate}>
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFIL_OPTIONS.map(p => (
                        <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground w-40">Módulo</th>
                      {ACTIONS.map(acao => (
                        <th
                          key={acao}
                          className="text-center py-2 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                          title={`Marcar/desmarcar coluna "${ACTION_LABELS[acao]}"`}
                          onClick={() => toggleCol(acao)}
                        >
                          {ACTION_LABELS[acao]}
                        </th>
                      ))}
                      <th
                        className="text-center py-2 px-3 font-medium text-muted-foreground/60 cursor-pointer hover:text-foreground select-none"
                        title="Marcar/desmarcar linha inteira"
                      >
                        Tudo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(modulo => (
                      <tr
                        key={modulo}
                        className="border-t border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2 px-3 font-medium text-foreground truncate max-w-[160px]">
                          {modulo}
                        </td>
                        {ACTIONS.map(acao => (
                          <td key={acao} className="text-center py-2 px-3">
                            <Checkbox
                              checked={permsMatrix[modulo]?.[acao] === true}
                              onCheckedChange={() => toggleCell(modulo, acao)}
                            />
                          </td>
                        ))}
                        <td className="text-center py-2 px-3">
                          <Checkbox
                            checked={ACTIONS.every(a => permsMatrix[modulo]?.[a] === true)}
                            onCheckedChange={() => toggleRow(modulo)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="save"
                  onClick={() => savePermsMut.mutate({ usuarioId: editing.id, matrix: permsMatrix })}
                  disabled={savePermsMut.isPending}
                >
                  {savePermsMut.isPending ? "Salvando..." : "Salvar Permissões"}
                </Button>
              </div>
            </div>
          )}

      </FormDialog>
      </div>
    </div>
  );
}
