---
name: gestao-mudancas-lote2
description: M1–M4 no módulo GestaoMudancas — remoção do Kanban, renomeação de label, campo Pleito FK e checkbox Adição
metadata:
  type: project
---

# GestaoMudancas — Lote 2 (M1–M4)

## Escopo

Quatro micro-tarefas sequenciais no módulo Mudanças Contratuais.

---

## M1 — Remover MudancaKanban.jsx

Deletar `/src/components/mudancas/MudancaKanban.jsx`.

**Por quê:** Kanban foi descontinuado em favor da tabela. O arquivo não é importado em nenhum outro lugar (verificado via grep).

**Ação:** `rm src/components/mudancas/MudancaKanban.jsx`

---

## M2 — Renomear label "Data Ocorrência" → "Data Registro"

Apenas alteração de label na UI. A coluna no DB permanece `data_ocorrencia` (renomeação de coluna é migration separada).

**Arquivos:**
- `src/components/mudancas/MudancaForm.jsx` linha ~65: `"Data da Ocorrência"` → `"Data do Registro"`
- `src/pages/RiscosMudancas/GestaoMudancas.jsx` MUDANCA_COLUMNS: `label: "Data Ocorrência"` → `label: "Data Registro"`

---

## M3 — Campo Pleito (pleito_id FK opcional)

### DB

```sql
ALTER TABLE mudancas_contratuais
  ADD COLUMN IF NOT EXISTS pleito_id UUID REFERENCES pleitos(id) ON DELETE SET NULL;
```

### UI — GestaoMudancas.jsx

Adicionar query para pleitos do projeto:

```js
const { data: pleitos = [] } = useQuery({
  queryKey: ["pleitos", selectedProjectId],
  queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

Passar como prop: `<MudancaForm ... pleitos={pleitos} />`

### UI — MudancaForm.jsx

Adicionar `pleito_id: mudanca?.pleito_id || null` ao `formData`.

Novo campo no formulário (após Título/Data):

```jsx
<div className="space-y-2">
  <Label>Pleito Vinculado</Label>
  <Select value={formData.pleito_id || ""} onValueChange={(v) => set("pleito_id", v || null)}>
    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="">Nenhum</SelectItem>
      {pleitos.map(p => (
        <SelectItem key={p.id} value={p.id}>{p.titulo || p.numero || p.id}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

`handleSubmit` já inclui `pleito_id` via spread de `formData`.

---

## M4 — Checkbox Adição (impacto_escopo_tipo)

### DB

```sql
ALTER TABLE mudancas_contratuais
  ADD COLUMN IF NOT EXISTS impacto_escopo_tipo TEXT;
```

### UI — MudancaForm.jsx

Adicionar `impacto_escopo_tipo: mudanca?.impacto_escopo_tipo || null` ao `formData`.

Checkbox posicionado acima ou ao lado do textarea "Impacto no Escopo":

```jsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={formData.impacto_escopo_tipo === "Adição"}
    onChange={(e) => set("impacto_escopo_tipo", e.target.checked ? "Adição" : null)}
    className="w-4 h-4 rounded border-gray-300"
  />
  <span className="text-sm font-medium text-gray-700">Adição</span>
</label>
```

---

## DATABASE.md

Atualizar tabela `mudancas_contratuais` para incluir:
- `pleito_id | UUID FK → pleitos | SET NULL`
- `impacto_escopo_tipo | TEXT | **Adição** ou null`

---

## Arquivos alterados

| Arquivo | Operação |
|---------|----------|
| `src/components/mudancas/MudancaKanban.jsx` | DELETE |
| `src/components/mudancas/MudancaForm.jsx` | EDIT (labels, novos campos) |
| `src/pages/RiscosMudancas/GestaoMudancas.jsx` | EDIT (query pleitos, MUDANCA_COLUMNS label) |
| `docs/architecture/DATABASE.md` | EDIT (atualizar tabela mudancas_contratuais) |
| Supabase migration | ALTER TABLE (pleito_id, impacto_escopo_tipo) |
