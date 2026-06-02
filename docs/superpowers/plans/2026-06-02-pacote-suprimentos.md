# Campo Pacote + Ajustes Mapa de Suprimentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar campo "Pacote" (select de lista global) na tabela e formulário do MAS, compactar coluna Status, exibir Qtd/Und inline e remover botão Visualizar.

**Architecture:** Entidade `PacoteSuprimento` global (sem projeto_id), igual ao padrão de UnidadeMedida/Disciplina. A tabela `itens_mas` recebe FK `pacote_id`. O MAS carrega a lista de pacotes por query separada e resolve id→nome via lookup em memória (`pacoteMap`).

**Tech Stack:** React 18.2, Supabase MCP (`mcp__supabase-integrada__execute_sql`), TanStack React Query 5.x, shadcn/ui Select, Tailwind CSS

---

## File Map

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/Configuracoes/Pacotes.jsx` |
| Modificar | `src/api/supabaseEntities.js` linha 28 |
| Modificar | `src/pages/Configuracoes/Cadastros.jsx` |
| Modificar | `src/components/suprimentos/MapaSuprimentos.jsx` |
| Modificar | `src/components/suprimentos/ItemMASForm.jsx` |

---

### Task 1: Migration SQL via Supabase MCP

**Files:** nenhum arquivo local — executado via MCP tool `mcp__supabase-integrada__execute_sql`

- [ ] **Step 1: Executar migration**

Chamar `mcp__supabase-integrada__execute_sql` com:
```sql
CREATE TABLE IF NOT EXISTS pacotes_suprimento (
  id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome  TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE itens_mas
  ADD COLUMN IF NOT EXISTS pacote_id UUID REFERENCES pacotes_suprimento(id) ON DELETE SET NULL;

ALTER TABLE pacotes_suprimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pacotes_suprimento_auth"
  ON pacotes_suprimento FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

- [ ] **Step 2: Verificar tabela criada**

Chamar `mcp__supabase-integrada__list_tables` e confirmar que `pacotes_suprimento` aparece na lista e que `itens_mas` continua presente.

---

### Task 2: Data Layer — entidade PacoteSuprimento

**Files:**
- Modify: `src/api/supabaseEntities.js` — linha 28, após `TipoEquipamento`

- [ ] **Step 1: Adicionar entidade**

No `TABLE_MAP` em `src/api/supabaseEntities.js`, após a linha `TipoEquipamento: 'tipos_equipamento',` adicionar:
```js
  PacoteSuprimento: 'pacotes_suprimento',
```

- [ ] **Step 2: Verificar**

```bash
grep "PacoteSuprimento" src/api/supabaseEntities.js
```
Saída esperada: `  PacoteSuprimento: 'pacotes_suprimento',`

- [ ] **Step 3: Commit**

```bash
git add src/api/supabaseEntities.js
git commit -m "feat(api): entidade PacoteSuprimento"
```

---

### Task 3: Cadastros — Pacotes.jsx (novo componente)

**Files:**
- Create: `src/pages/Configuracoes/Pacotes.jsx`

- [ ] **Step 1: Criar o arquivo**

Criar `src/pages/Configuracoes/Pacotes.jsx` com o seguinte conteúdo completo:

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Boxes, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/FormDialog";
import PageHeader from "@/components/ui/PageHeader";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { entities } from "@/api/supabaseEntities";

const EMPTY = { nome: "" };

export default function Pacotes({ asTab = false }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showInativos, setShowInativos] = useState(false);

  const { data: all = [], isPending, isError } = useQuery({
    queryKey: ["pacotes_suprimento"],
    queryFn: () => entities.PacoteSuprimento.list(),
  });

  const pacotes = showInativos ? all : all.filter((p) => p.ativo !== false);

  const saveMut = useMutation({
    mutationFn: async (values) => {
      if (dialog?.item?.id) return entities.PacoteSuprimento.update(dialog.item.id, values);
      return entities.PacoteSuprimento.create(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacotes_suprimento"] });
      setDialog(null);
      toast({ variant: "success", description: "Pacote salvo." });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }) => entities.PacoteSuprimento.update(id, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pacotes_suprimento"] }),
    onError: (e) => toast({ title: "Erro", description: friendlyMessage(e), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.PacoteSuprimento.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacotes_suprimento"] });
      setDeleting(null);
      toast({ variant: "success", description: "Pacote excluído." });
    },
    onError: (e) => toast({ title: "Erro ao excluir", description: friendlyMessage(e), variant: "destructive" }),
  });

  const openCreate = () => { setForm(EMPTY); setDialog({ mode: "create" }); };
  const openEdit = (item) => { setForm({ nome: item.nome }); setDialog({ mode: "edit", item }); };
  const handleSave = () => {
    if (!form.nome.trim()) return;
    saveMut.mutate({ nome: form.nome.trim() });
  };

  const inativos = all.filter((p) => p.ativo === false).length;
  const ativos = all.filter((p) => p.ativo !== false).length;

  const tabContent = (
    <>
      <div className={asTab ? "space-y-5" : "flex-1 overflow-auto p-6 space-y-5"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Pacotes de Suprimentos</p>
              <p className="text-xs text-muted-foreground">
                {ativos} ativo{ativos !== 1 ? "s" : ""}
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
            <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" /> Novo Pacote
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isPending && <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>}
          {isError && <div className="p-8 text-center text-sm text-destructive">Erro ao carregar pacotes.</div>}
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
                {pacotes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Nenhum pacote cadastrado.
                    </td>
                  </tr>
                )}
                {pacotes.map((p, i) => {
                  const inativo = p.ativo === false;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-border/50 transition-colors ${
                        inativo ? "opacity-50" : i % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className={`px-5 py-3 text-sm ${inativo ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {p.nome}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleMut.mutate({ id: p.id, ativo: !p.ativo })}
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
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(p)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Excluir"
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
          icon={Boxes}
          title={dialog.mode === "create" ? "Novo Pacote" : "Editar Pacote"}
          subtitle={dialog.mode === "edit" ? `Editando: ${dialog.item.nome}` : "Informe o nome do pacote"}
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
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="ex: Estrutura Metálica"
              maxLength={80}
              autoFocus
            />
          </div>
        </FormDialog>
      )}

      {deleting && (
        <FormDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          icon={Trash2}
          title="Excluir Pacote"
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
            Esta ação não pode ser desfeita. Considere <strong>desativar</strong> em vez de excluir para preservar o histórico.
          </p>
        </FormDialog>
      )}
    </>
  );

  if (asTab) return tabContent;

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6">{tabContent}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar arquivo criado**

```bash
ls src/pages/Configuracoes/Pacotes.jsx
```
Saída esperada: o caminho do arquivo sem erro.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Configuracoes/Pacotes.jsx
git commit -m "feat(cadastros): componente Pacotes de Suprimentos"
```

---

### Task 4: Cadastros.jsx — adicionar aba Pacotes

**Files:**
- Modify: `src/pages/Configuracoes/Cadastros.jsx`

- [ ] **Step 1: Adicionar import**

No topo de `src/pages/Configuracoes/Cadastros.jsx`, após o import de `Equipamentos`, adicionar:
```jsx
import Pacotes from "./Pacotes";
```

- [ ] **Step 2: Adicionar aba no array TABS**

No array `TABS`, após `{ key: "equipamentos", label: "Equipamentos" }`, adicionar:
```js
  { key: "pacotes", label: "Pacotes" },
```

- [ ] **Step 3: Adicionar render condicional**

No bloco de conteúdo da aba ativa, após `{activeTab === "equipamentos" && <Equipamentos asTab />}`, adicionar:
```jsx
          {activeTab === "pacotes"      && <Pacotes asTab />}
```

- [ ] **Step 4: Verificar visualmente**

Abrir a aplicação (`npm run dev`) e navegar para Configurações → Cadastros. Confirmar que a aba "Pacotes" aparece e exibe a lista (inicialmente vazia). Criar um pacote de teste para confirmar o CRUD.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Configuracoes/Cadastros.jsx
git commit -m "feat(cadastros): aba Pacotes em Configurações"
```

---

### Task 5: MapaSuprimentos.jsx — ajustes de tabela

**Files:**
- Modify: `src/components/suprimentos/MapaSuprimentos.jsx`

- [ ] **Step 1: Remover import DetailDialog e estado viewItem**

Remover da linha de imports:
```jsx
import DetailDialog from "@/components/ui/DetailDialog";
```

Remover do estado do componente a linha:
```jsx
const [viewItem, setViewItem] = useState(null);
```

- [ ] **Step 2: Adicionar query de pacotes e pacoteMap**

Logo após a declaração de `updateItem` (por volta da linha 191), adicionar:
```jsx
  const { data: pacotes = [] } = useQuery({
    queryKey: ["pacotes_suprimento"],
    queryFn: () => entities.PacoteSuprimento.list(),
  });

  const pacoteMap = useMemo(
    () => Object.fromEntries(pacotes.map((p) => [p.id, p.nome])),
    [pacotes]
  );
```

- [ ] **Step 3: Atualizar cabeçalho da tabela**

Substituir o `<thead>` completo pelo seguinte (coluna Pacote após Descrição, Status compactado para `min-w-16`):
```jsx
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground min-w-40">Descrição</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground min-w-24">Pacote</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground min-w-20">Fornecedor</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">Qtd / Und</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-24">Nº SC/OC</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground">Linha do Tempo do Processo</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">Data Crono.</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground min-w-24 whitespace-normal leading-tight">ID Cronograma</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground min-w-16">Status</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
```

- [ ] **Step 4: Atualizar colSpan nos estados de loading/error/empty**

Os três `colSpan` dentro do `<tbody>` (loading skeletons, erro e empty state) estavam em `9`. Atualizar todos para `10`:

Linha dos skeletons de loading — alterar `{Array.from({ length: 9 })` para `{Array.from({ length: 10 })`.

Na linha do erro: `<td colSpan={9}` → `<td colSpan={10}`.

Na linha do empty state: `<td colSpan={9}` → `<td colSpan={10}`.

- [ ] **Step 5: Adicionar célula Pacote e ajustar Qtd/Und**

Dentro do `paginated.map(item => ...)`, na `<tr>` de dados:

Após a `<td>` de Descrição (que exibe `item.descricao` e `item.responsavel`), adicionar nova célula de Pacote:
```jsx
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {item.pacote_id ? pacoteMap[item.pacote_id] || "—" : "—"}
                    </td>
```

Substituir a `<td>` de Qtd/Und (que usa `flex-col`) pela versão inline:
```jsx
                    <td className="py-3 px-2 text-center">
                      {item.quantidade ? (
                        <span className="text-xs text-foreground">
                          {item.quantidade}{item.unidade ? <span className="text-muted-foreground/70 ml-0.5">{item.unidade}</span> : null}
                        </span>
                      ) : "—"}
                    </td>
```

- [ ] **Step 6: Remover onView do RowActions**

Na `<td>` de ações, substituir:
```jsx
                      <RowActions
                        onView={() => setViewItem(item)}
                        onEdit={() => { setEditItem(item); setShowForm(true); }}
                        onDelete={() => deleteItem.mutate(item.id)}
                        deleteDescription={`${item.descricao || "Este item"} será removido permanentemente.`}
                      />
```
por:
```jsx
                      <RowActions
                        onEdit={() => { setEditItem(item); setShowForm(true); }}
                        onDelete={() => deleteItem.mutate(item.id)}
                        deleteDescription={`${item.descricao || "Este item"} será removido permanentemente.`}
                      />
```

- [ ] **Step 7: Remover bloco DetailDialog**

Remover o bloco completo do `DetailDialog` (ao final do JSX, logo antes do `showForm`):
```jsx
      {viewItem && (
        <DetailDialog
          open={!!viewItem}
          onOpenChange={(o) => !o && setViewItem(null)}
          title={viewItem.descricao || "Item de suprimento"}
          sections={[
            { label: "Descrição", value: viewItem.descricao, full: true },
            { label: "Fornecedor", value: viewItem.fornecedor },
            { label: "Responsável", value: viewItem.responsavel },
            { label: "Status", value: viewItem.status },
            { label: "Nº SC", value: viewItem.numero_sc },
            { label: "Quantidade", value: viewItem.quantidade },
          ]}
        />
      )}
```

- [ ] **Step 8: Verificar visualmente**

Abrir o Mapa de Suprimentos na aplicação. Confirmar:
- Coluna "Pacote" aparece após "Descrição"
- Quantidade e unidade exibidas na mesma linha
- Botão Visualizar ausente nas ações de linha
- Coluna Status mais estreita

- [ ] **Step 9: Commit**

```bash
git add src/components/suprimentos/MapaSuprimentos.jsx
git commit -m "feat(suprimentos): coluna Pacote, Qtd/Und inline, status compacto, sem botão visualizar"
```

---

### Task 6: ItemMASForm.jsx — campo pacote_id

**Files:**
- Modify: `src/components/suprimentos/ItemMASForm.jsx`

- [ ] **Step 1: Adicionar pacote_id ao estado inicial**

No `useState` do `form`, após `status: item?.status || "A iniciar",` adicionar:
```js
    pacote_id: item?.pacote_id || "",
```

- [ ] **Step 2: Adicionar query de pacotes**

Após a query de `unidades`, adicionar:
```jsx
  const { data: pacotes = [], isLoading: isLoadingPacotes } = useQuery({
    queryKey: ["pacotes_suprimento"],
    queryFn: () => entities.PacoteSuprimento.list(),
    staleTime: 1000 * 60 * 10,
  });

  const pacotesAtivos = pacotes.filter((p) => p.ativo !== false);
```

- [ ] **Step 3: Adicionar campo Pacote no formulário**

No bloco de Identificação, após a `<div>` do textarea de Descrição (que tem `col-span-2` e `rows={2}`), inserir o campo Pacote:
```jsx
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Pacote</Label>
            <Select
              value={form.pacote_id || "__none__"}
              onValueChange={v => set("pacote_id", v === "__none__" ? "" : v)}
              disabled={isLoadingPacotes}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPacotes ? "Carregando..." : "Selecionar pacote..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sem pacote —</SelectItem>
                {pacotesAtivos.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
```

- [ ] **Step 4: Incluir pacote_id no payload de save**

No `handleSave`, dentro do objeto `data`, adicionar:
```js
        pacote_id: form.pacote_id || null,
```

- [ ] **Step 5: Verificar visualmente**

Abrir o formulário de Novo Item MAS. Confirmar que o campo "Pacote" aparece logo após "Descrição do Material", lista os pacotes ativos cadastrados e salva corretamente.

- [ ] **Step 6: Commit**

```bash
git add src/components/suprimentos/ItemMASForm.jsx
git commit -m "feat(suprimentos): campo pacote_id no formulário ItemMAS"
```

---

### Task 7: Commit final e verificação geral

- [ ] **Step 1: Verificar status do git**

```bash
git status
```
Saída esperada: `nothing to commit, working tree clean`

- [ ] **Step 2: Verificação funcional completa**

Com a aplicação rodando, verificar o fluxo ponta-a-ponta:
1. Configurações → Cadastros → aba "Pacotes": criar 2 pacotes (ex: "Estrutura Metálica", "Elétrica")
2. Suprimentos → Mapa de Suprimentos: abrir formulário de Novo Item
3. Confirmar que o campo Pacote aparece após Descrição e lista os pacotes criados
4. Salvar item com pacote selecionado
5. Confirmar que a tabela exibe o nome do pacote na coluna correta
6. Confirmar Qtd/Und inline, Status compacto e ausência do botão Visualizar
