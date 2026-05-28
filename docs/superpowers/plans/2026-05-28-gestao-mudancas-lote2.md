# GestaoMudancas Lote 2 (M1–M4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover MudancaKanban.jsx, renomear label "Data Ocorrência" → "Data Registro", adicionar campo Pleito FK opcional e checkbox Adição no módulo GestaoMudancas.

**Architecture:** Alterações sequenciais no módulo Mudanças Contratuais — remoção de componente inativo, ajuste de labels, duas migrations Supabase (ADD COLUMN) e dois novos campos no formulário MudancaForm.

**Tech Stack:** React 18 + Vite, Supabase JS, TanStack React Query 5, Radix UI / shadcn Select, Tailwind CSS 3

---

## Arquivo Map

| Arquivo | Operação |
|---------|----------|
| `src/components/mudancas/MudancaKanban.jsx` | DELETE |
| `src/components/mudancas/MudancaForm.jsx` | EDIT — labels, 2 novos campos (pleito_id, impacto_escopo_tipo) |
| `src/pages/RiscosMudancas/GestaoMudancas.jsx` | EDIT — query pleitos, MUDANCA_COLUMNS label, prop para MudancaForm |
| `docs/architecture/DATABASE.md` | EDIT — tabela mudancas_contratuais: + pleito_id, impacto_escopo_tipo |

---

## Task 1: Remover MudancaKanban.jsx

**Files:**
- Delete: `src/components/mudancas/MudancaKanban.jsx`

- [ ] **Step 1.1: Confirmar ausência de importações**

```bash
grep -rn "MudancaKanban" src/
```

Resultado esperado: zero linhas (o arquivo não é importado em nenhum outro lugar).

- [ ] **Step 1.2: Deletar o arquivo**

```bash
rm src/components/mudancas/MudancaKanban.jsx
```

- [ ] **Step 1.3: Confirmar remoção**

```bash
ls src/components/mudancas/
```

Resultado esperado: apenas `DashboardExecutivo.jsx` e `MudancaForm.jsx`.

- [ ] **Step 1.4: Commit**

```bash
git add -A
git commit -m "refactor(mudancas): remover MudancaKanban.jsx inativo"
```

---

## Task 2: Renomear label "Data Ocorrência" → "Data Registro"

**Files:**
- Modify: `src/components/mudancas/MudancaForm.jsx` (linha ~65)
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx` (MUDANCA_COLUMNS, linha ~35)

> Nota: a chave JS `data_ocorrencia` e a coluna do DB permanecem inalteradas — apenas os labels de UI são alterados.

- [ ] **Step 2.1: Atualizar label no MudancaForm.jsx**

Em `src/components/mudancas/MudancaForm.jsx`, localizar e substituir:

```jsx
// ANTES (linha ~65)
<Label>Data da Ocorrência</Label>

// DEPOIS
<Label>Data do Registro</Label>
```

- [ ] **Step 2.2: Atualizar label em MUDANCA_COLUMNS no GestaoMudancas.jsx**

Em `src/pages/RiscosMudancas/GestaoMudancas.jsx`, localizar:

```js
// ANTES (linha ~35)
{ key: "data_ocorrencia",    label: "Data Ocorrência",     type: "date" },

// DEPOIS
{ key: "data_ocorrencia",    label: "Data Registro",       type: "date" },
```

- [ ] **Step 2.3: Commit**

```bash
git add src/components/mudancas/MudancaForm.jsx src/pages/RiscosMudancas/GestaoMudancas.jsx
git commit -m "fix(mudancas): renomear label Data Ocorrência para Data Registro"
```

---

## Task 3: Adicionar campo Pleito FK opcional (pleito_id)

**Files:**
- Supabase migration (via MCP)
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx`
- Modify: `src/components/mudancas/MudancaForm.jsx`
- Modify: `docs/architecture/DATABASE.md`

### 3.1 — Migration Supabase

- [ ] **Step 3.1: Aplicar migration no Supabase**

Usar `mcp__plugin_supabase_supabase__execute_sql` com a query:

```sql
ALTER TABLE mudancas_contratuais
  ADD COLUMN IF NOT EXISTS pleito_id UUID REFERENCES pleitos(id) ON DELETE SET NULL;
```

Verificar: sem erros, coluna adicionada.

### 3.2 — GestaoMudancas.jsx: query de pleitos + prop

- [ ] **Step 3.2: Adicionar useQuery para pleitos em GestaoMudancas.jsx**

Logo após a query `mudancas`, adicionar:

```js
const { data: pleitos = [] } = useQuery({
  queryKey: ["pleitos", selectedProjectId],
  queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

- [ ] **Step 3.3: Passar prop pleitos para MudancaForm**

Localizar o bloco `{showForm && (` e alterar:

```jsx
// ANTES
<MudancaForm
  mudanca={editing}
  onSubmit={handleSubmit}
  onCancel={() => { setShowForm(false); setEditing(null); }}
  isSubmitting={createMut.isPending || updateMut.isPending}
/>

// DEPOIS
<MudancaForm
  mudanca={editing}
  onSubmit={handleSubmit}
  onCancel={() => { setShowForm(false); setEditing(null); }}
  isSubmitting={createMut.isPending || updateMut.isPending}
  pleitos={pleitos}
/>
```

### 3.3 — MudancaForm.jsx: estado + campo Select

- [ ] **Step 3.4: Adicionar pleito_id ao formData inicial**

Na inicialização do `useState`, adicionar `pleito_id`:

```js
// ANTES
const [formData, setFormData] = useState({
  titulo: mudanca?.titulo || "",
  // ... outros campos
  observacoes: mudanca?.observacoes || "",
});

// DEPOIS
const [formData, setFormData] = useState({
  titulo: mudanca?.titulo || "",
  // ... outros campos
  observacoes: mudanca?.observacoes || "",
  pleito_id: mudanca?.pleito_id || null,
});
```

- [ ] **Step 3.5: Adicionar prop pleitos na assinatura do componente**

```jsx
// ANTES
export default function MudancaForm({ mudanca, onSubmit, onCancel, isSubmitting }) {

// DEPOIS
export default function MudancaForm({ mudanca, onSubmit, onCancel, isSubmitting, pleitos = [] }) {
```

- [ ] **Step 3.6: Adicionar campo Select de Pleito no formulário**

Na seção de Identificação (após o grid Título + Data), inserir um novo `<div>` com o Select:

```jsx
{/* Pleito Vinculado */}
<div className="space-y-2">
  <Label>Pleito Vinculado</Label>
  <Select
    value={formData.pleito_id || ""}
    onValueChange={(v) => set("pleito_id", v === "__none__" ? null : v)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Nenhum" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">Nenhum</SelectItem>
      {pleitos.map((p) => (
        <SelectItem key={p.id} value={p.id}>
          {p.titulo || "(sem título)"}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

> Por que `__none__`? O Radix Select não aceita string vazia como value válido, então usa-se um sentinel que é convertido para `null` no `onValueChange`.

- [ ] **Step 3.7: Commit**

```bash
git add src/components/mudancas/MudancaForm.jsx src/pages/RiscosMudancas/GestaoMudancas.jsx docs/architecture/DATABASE.md
git commit -m "feat(mudancas): adicionar campo Pleito FK opcional (pleito_id)"
```

---

## Task 4: Adicionar checkbox Adição (impacto_escopo_tipo)

**Files:**
- Supabase migration (via MCP)
- Modify: `src/components/mudancas/MudancaForm.jsx`
- Modify: `docs/architecture/DATABASE.md`

### 4.1 — Migration Supabase

- [ ] **Step 4.1: Aplicar migration no Supabase**

Usar `mcp__plugin_supabase_supabase__execute_sql` com:

```sql
ALTER TABLE mudancas_contratuais
  ADD COLUMN IF NOT EXISTS impacto_escopo_tipo TEXT;
```

Verificar: sem erros.

### 4.2 — MudancaForm.jsx: estado + checkbox

- [ ] **Step 4.2: Adicionar impacto_escopo_tipo ao formData**

Na inicialização do `useState`:

```js
// ANTES
impacto_escopo: mudanca?.impacto_escopo || "",

// DEPOIS
impacto_escopo: mudanca?.impacto_escopo || "",
impacto_escopo_tipo: mudanca?.impacto_escopo_tipo || null,
```

- [ ] **Step 4.3: Adicionar checkbox no bloco "Impacto no Escopo"**

Localizar o bloco do textarea `impacto_escopo`. Antes do `<Textarea>`, inserir o checkbox:

```jsx
{/* ANTES */}
<div className="space-y-2">
  <Label>Impacto no Escopo (o que entra ou sai)</Label>
  <Textarea value={formData.impacto_escopo} ... />
</div>

{/* DEPOIS */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label>Impacto no Escopo (o que entra ou sai)</Label>
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={formData.impacto_escopo_tipo === "Adição"}
        onChange={(e) => set("impacto_escopo_tipo", e.target.checked ? "Adição" : null)}
        className="w-4 h-4 rounded border-gray-300 accent-blue-600"
      />
      <span className="text-sm font-medium text-gray-700">Adição</span>
    </label>
  </div>
  <Textarea value={formData.impacto_escopo} ... />
</div>
```

- [ ] **Step 4.4: Verificar que handleSubmit inclui impacto_escopo_tipo**

`handleSubmit` faz spread de `formData`, então `impacto_escopo_tipo` é incluído automaticamente. Verificar apenas que o campo está no estado inicial (já foi adicionado no Step 4.2).

### 4.3 — Atualizar DATABASE.md

- [ ] **Step 4.5: Atualizar tabela mudancas_contratuais em DATABASE.md**

Abrir `docs/architecture/DATABASE.md` e na tabela `mudancas_contratuais`, adicionar as duas novas linhas após `categorias`:

```markdown
| pleito_id | UUID FK → pleitos | SET NULL (opcional) |
| impacto_escopo_tipo | TEXT | `"Adição"` ou `null` |
```

- [ ] **Step 4.6: Commit final**

```bash
git add src/components/mudancas/MudancaForm.jsx docs/architecture/DATABASE.md
git commit -m "feat(mudancas): adicionar checkbox Adição (impacto_escopo_tipo)"
```

---

## Checklist de Conclusão

- [ ] `MudancaKanban.jsx` removido, sem referências quebradas
- [ ] Label "Data do Registro" visível no formulário e na coluna de export
- [ ] Select de Pleito aparece no formulário, lista pleitos do projeto, salva `pleito_id`
- [ ] Checkbox "Adição" aparece ao lado do label "Impacto no Escopo"
- [ ] Migrations aplicadas com sucesso no Supabase
- [ ] DATABASE.md atualizado com os dois novos campos
- [ ] Todos os commits feitos
