import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";
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

const STATUS_CFG = {
  Ativo:   { bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50" },
  Inativo: { bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" },
};

const EMPTY_FORM = {
  nome: "",
  email: "",
  perfil: "Visualizador",
  status: "Ativo",
};

export default function Usuarios() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewItem, setViewItem] = useState(null);
  const [permsMatrix, setPermsMatrix] = useState({});
  const [search, setSearch] = useState("");
  const [filterPerfil, setFilterPerfil] = useState("Todos");

  const { data: usuarios = [], isLoading, isError } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => entities.Usuario.list(),
  });

  const usuariosFiltrados = useMemo(() => {
    const q = search.toLowerCase();
    return usuarios.filter((u) => {
      const matchSearch = !q ||
        u.nome?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchPerfil = filterPerfil === "Todos" || u.perfil === filterPerfil;
      return matchSearch && matchPerfil;
    });
  }, [usuarios, search, filterPerfil]);

  const hasFilters = search || filterPerfil !== "Todos";

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

  // Toggle de status (Ativo ↔ Inativo)
  const toggleStatusMut = useMutation({
    mutationFn: ({ id, status }) =>
      entities.Usuario.update(id, { status: status === "Ativo" ? "Inativo" : "Ativo" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
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

  const clearFilters = () => {
    setSearch("");
    setFilterPerfil("Todos");
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
      <div className="flex-1 overflow-auto p-6 space-y-4">

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="relative pr-1">
              Filtros
              {hasFilters && (
                <button
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 z-10 transition-colors"
                  onClick={clearFilters}
                  aria-label="Limpar filtros"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          </span>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou e-mail..."
              className="pl-8 h-8 text-sm w-64"
            />
          </div>

          <Select value={filterPerfil} onValueChange={setFilterPerfil}>
            <SelectTrigger className="h-8 text-sm w-40">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os perfis</SelectItem>
              {PERFIL_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conteúdo */}
        {isError ? (
          <div className="rounded-xl border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
            Erro ao carregar usuários. Tente recarregar a página.
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : usuarios.length === 0 ? (
          <PageEmptyState icon={Users} description="Nenhum usuário cadastrado. Crie o primeiro usuário." />
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome / E-mail</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-36">Perfil</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground w-28">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                      Nenhum usuário encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const status = u.status || "Ativo";
                    const cfg = STATUS_CFG[status] || STATUS_CFG.Ativo;
                    return (
                      <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground leading-tight">{u.nome}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{u.perfil || "Visualizador"}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleStatusMut.mutate({ id: u.id, status })}
                            disabled={toggleStatusMut.isPending}
                            title={status === "Ativo" ? "Clique para desativar" : "Clique para ativar"}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${cfg.bg}`}
                          >
                            {status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <RowActions
                            onView={() => setViewItem(u)}
                            onEdit={() => handleEdit(u)}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: f.status === "Ativo" ? "Inativo" : "Ativo" }))}
                className={`w-full h-9 px-3 rounded-md border text-sm font-medium transition-colors flex items-center justify-between ${
                  form.status === "Ativo"
                    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span>{form.status}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  form.status === "Ativo"
                    ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {form.status === "Ativo" ? "Ativo" : "Inativo"}
                </span>
              </button>
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

        {viewItem && (
          <DetailDialog
            open={!!viewItem}
            onOpenChange={(o) => !o && setViewItem(null)}
            title={viewItem.nome || viewItem.email}
            sections={[
              { label: "Nome", value: viewItem.nome },
              { label: "E-mail", value: viewItem.email },
              { label: "Perfil", value: viewItem.perfil },
              { label: "Status", value: viewItem.status },
            ]}
          />
        )}
      </div>
    </div>
  );
}
