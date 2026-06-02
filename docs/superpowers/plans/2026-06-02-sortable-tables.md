# Sortable Tables — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ordenação de colunas por clique em cabeçalho em todas as tabelas de listagem de dados do sistema, com um hook e componente reutilizáveis como padrão global.

**Architecture:** Hook `useSortTable` centraliza o estado e o algoritmo de sort (client-side, sobre dados já carregados pelo React Query). Componente `SortableTableHead` encapsula o visual do cabeçalho clicável para tabelas shadcn/ui. Tabelas com HTML puro recebem o hook + `<th>` clicável inline com o mesmo padrão visual.

**Tech Stack:** React 18 (useState, useMemo), Lucide React (ArrowUpDown, ArrowUp, ArrowDown), shadcn/ui Table, Vitest (test do comparador puro).

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Criar | `src/hooks/useSortTable.js` | Estado de sort + algoritmo |
| Criar | `src/hooks/useSortTable.test.js` | Testes do comparador |
| Criar | `src/components/ui/SortableTableHead.jsx` | Cabeçalho sortável (shadcn Table) |
| Modificar | `src/components/riscos/PlanoAcao.jsx` | Adotar hook + SortableTableHead |
| Modificar | `src/pages/RiscosMudancas/GestaoRiscos.jsx` | Adotar hook + `<th>` clicável inline |
| Modificar | `src/pages/RiscosMudancas/GestaoMudancas.jsx` | Adotar hook + `<th>` clicável inline |
| Modificar | `src/pages/Engenharia/Documentos.jsx` | Refatorar sort local → useSortTable |
| Modificar | `src/components/rdo/RDOModule.jsx` | Adotar hook + `<th>` clicável inline |

**Tabelas excluídas:** `SixWLATable` (cols expansíveis), `HistogramaTabela` (pivô editável), `TakeOffCommodities` (agregação), `MapaSuprimentos` (pipeline visual), `Usuarios` (cards), `Registros` (cards), `RegistrosList`/`RDOsList` (órfãos).

---

## Task 1: Hook `useSortTable`

**Files:**
- Create: `src/hooks/useSortTable.js`
- Create: `src/hooks/useSortTable.test.js`

- [ ] **Step 1: Criar o arquivo do hook**

Criar `src/hooks/useSortTable.js` com o conteúdo:

```js
import { useState, useMemo } from "react"

export function sortItems(data, sortKey, sortDir) {
  if (!sortKey || !data?.length) return data ?? []
  return [...data].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === "number" && typeof vb === "number")
      return sortDir === "asc" ? va - vb : vb - va
    const sa = String(va).toLowerCase(), sb = String(vb).toLowerCase()
    return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa)
  })
}

export function useSortTable(data, { defaultKey = null, defaultDir = "asc" } = {}) {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedData = useMemo(() => sortItems(data, sortKey, sortDir), [data, sortKey, sortDir])

  return { sortedData, sortKey, sortDir, handleSort }
}
```

- [ ] **Step 2: Escrever os testes do comparador puro**

Criar `src/hooks/useSortTable.test.js`:

```js
import { describe, it, expect } from "vitest"
import { sortItems } from "./useSortTable"

describe("sortItems", () => {
  it("retorna array vazio quando data é vazia", () => {
    expect(sortItems([], "nome", "asc")).toEqual([])
  })

  it("retorna data sem modificar quando sortKey é null", () => {
    const data = [{ nome: "Z" }, { nome: "A" }]
    expect(sortItems(data, null, "asc")).toBe(data)
  })

  it("ordena strings em ordem ascendente", () => {
    const data = [{ nome: "Carlos" }, { nome: "Ana" }, { nome: "Bruno" }]
    expect(sortItems(data, "nome", "asc").map(d => d.nome)).toEqual(["Ana", "Bruno", "Carlos"])
  })

  it("ordena strings em ordem descendente", () => {
    const data = [{ nome: "Carlos" }, { nome: "Ana" }, { nome: "Bruno" }]
    expect(sortItems(data, "nome", "desc").map(d => d.nome)).toEqual(["Carlos", "Bruno", "Ana"])
  })

  it("ordena números em ordem ascendente", () => {
    const data = [{ score: 15 }, { score: 3 }, { score: 9 }]
    expect(sortItems(data, "score", "asc").map(d => d.score)).toEqual([3, 9, 15])
  })

  it("ordena números em ordem descendente", () => {
    const data = [{ score: 15 }, { score: 3 }, { score: 9 }]
    expect(sortItems(data, "score", "desc").map(d => d.score)).toEqual([15, 9, 3])
  })

  it("coloca null ao final em ordem ascendente", () => {
    const data = [{ nome: null }, { nome: "Ana" }, { nome: null }]
    const result = sortItems(data, "nome", "asc")
    expect(result[0].nome).toBe("Ana")
    expect(result[1].nome).toBeNull()
    expect(result[2].nome).toBeNull()
  })

  it("coloca null ao final em ordem descendente", () => {
    const data = [{ nome: "Ana" }, { nome: null }, { nome: "Bruno" }]
    const result = sortItems(data, "nome", "desc")
    expect(result[2].nome).toBeNull()
  })

  it("ordena datas ISO lexicograficamente", () => {
    const data = [
      { data: "2024-03-15" },
      { data: "2023-12-01" },
      { data: "2024-01-10" },
    ]
    expect(sortItems(data, "data", "asc").map(d => d.data)).toEqual([
      "2023-12-01",
      "2024-01-10",
      "2024-03-15",
    ])
  })
})
```

- [ ] **Step 3: Rodar os testes para ver que falham (sem implementação ainda não — já está implementado no Step 1, então rodar para confirmar que passam)**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada && npx vitest run src/hooks/useSortTable.test.js
```

Esperado: PASS em todos os 9 testes.

- [ ] **Step 4: Commitar**

```bash
git add src/hooks/useSortTable.js src/hooks/useSortTable.test.js
git commit -m "feat: useSortTable hook com sortItems testável"
```

---

## Task 2: Componente `SortableTableHead`

**Files:**
- Create: `src/components/ui/SortableTableHead.jsx`

- [ ] **Step 1: Criar o componente**

Criar `src/components/ui/SortableTableHead.jsx`:

```jsx
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function SortableTableHead({ columnKey, sortKey, sortDir, onSort, children, className }) {
  const isActive = sortKey === columnKey
  const Icon = !isActive ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead
      className={cn("cursor-pointer select-none group", className)}
      onClick={() => onSort(columnKey)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <Icon className={cn(
          "w-3.5 h-3.5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
        )} />
      </span>
    </TableHead>
  )
}
```

- [ ] **Step 2: Commitar**

```bash
git add src/components/ui/SortableTableHead.jsx
git commit -m "feat: SortableTableHead — cabeçalho sortável para tabelas shadcn"
```

---

## Task 3: Aplicar em `PlanoAcao.jsx`

**Files:**
- Modify: `src/components/riscos/PlanoAcao.jsx`

`PlanoAcao` usa shadcn `Table` e `acoes` vem do `useQuery` dentro do próprio componente.

- [ ] **Step 1: Adicionar imports no topo do arquivo**

No bloco de imports de `PlanoAcao.jsx`, adicionar após os imports existentes:

```jsx
import { useSortTable } from "@/hooks/useSortTable"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
```

- [ ] **Step 2: Adicionar o hook após a declaração das queries**

Localizar o trecho onde `acoes` é desestruturada (linha ~55) e adicionar o hook logo após:

```jsx
const { data: acoes = [], isPending: isLoadingAcoes, isError: isErrorAcoes } = useQuery({
  queryKey: ["acoes", projectId],
  queryFn: () => entities.Acao.filter({ projeto_id: projectId }),
  enabled: !!projectId,
})

// linha nova ↓
const { sortedData: acoesSorted, sortKey, sortDir, handleSort } = useSortTable(acoes, { defaultKey: "descricao" })
```

- [ ] **Step 3: Substituir `<TableHead>` fixos pelos sortáveis**

Localizar o bloco do `<TableHeader>` (linha ~295) que está assim:

```jsx
<TableHeader>
  <TableRow className="bg-muted">
    <TableHead>Descrição</TableHead>
    <TableHead>Vínculo</TableHead>
    <TableHead>Responsável</TableHead>
    <TableHead>Previsão</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Ações</TableHead>
  </TableRow>
</TableHeader>
```

Substituir por:

```jsx
<TableHeader>
  <TableRow className="bg-muted">
    <SortableTableHead columnKey="descricao" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Descrição</SortableTableHead>
    <TableHead>Vínculo</TableHead>
    <SortableTableHead columnKey="responsavel" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Responsável</SortableTableHead>
    <SortableTableHead columnKey="data_fim_prevista" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Previsão</SortableTableHead>
    <SortableTableHead columnKey="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Status</SortableTableHead>
    <TableHead>Ações</TableHead>
  </TableRow>
</TableHeader>
```

- [ ] **Step 4: Alterar a iteração do corpo da tabela para usar `acoesSorted`**

Localizar a linha `{acoes.map((acao) => (` (linha ~306) e alterar para:

```jsx
{acoesSorted.map((acao) => (
```

- [ ] **Step 5: Verificar visualmente no browser**

Iniciar o servidor de desenvolvimento:
```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada && npm run dev
```

Navegar até Riscos & Mudanças → Plano de Ação. Clicar nos cabeçalhos "Descrição", "Responsável", "Previsão" e "Status". Confirmar que:
- Ícone `ArrowUpDown` cinza aparece em todos os cabeçalhos sortáveis
- Clicar muda para `ArrowUp` (asc) e depois `ArrowDown` (desc)
- As linhas reordenam corretamente
- Coluna "Vínculo" e "Ações" não têm ícone e não são clicáveis

- [ ] **Step 6: Commitar**

```bash
git add src/components/riscos/PlanoAcao.jsx
git commit -m "feat: sort por coluna em Plano de Ação"
```

---

## Task 4: Aplicar em `GestaoRiscos.jsx`

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

Esta tabela usa HTML puro (`<table>/<thead>/<th>`). O `useSortTable` gerencia o estado; os `<th>` recebem `onClick` e ícone inline. A lista `filtered` já existe como `useMemo` — adicionar o sort como etapa após o filter.

- [ ] **Step 1: Adicionar imports**

No bloco de imports de `GestaoRiscos.jsx`, adicionar:

```jsx
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useSortTable } from "@/hooks/useSortTable"
```

- [ ] **Step 2: Adicionar o hook após a declaração de `filtered`**

Localizar onde `filtered` é declarado com `useMemo` (linha ~92) e adicionar o hook logo depois do bloco `filtered`:

```jsx
const { sortedData: riscosSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "codigo" })
```

- [ ] **Step 3: Criar helper inline para o ícone de sort**

Adicionar a função helper **antes do `return`** do componente principal (após os useMemos):

```jsx
function SortIcon({ col }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" />
    : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />
}
```

> **Nota:** esta função usa `sortKey` e `sortDir` via closure — deve estar definida dentro do componente, após o `useSortTable`.

- [ ] **Step 4: Substituir os `<th>` estáticos pelos clicáveis**

Localizar o bloco do `<thead>` (linha ~317) que está assim:

```jsx
<thead>
  <tr className="border-b border-border bg-muted">
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Código</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Descrição</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Categoria</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Impactos</th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">P</th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">I</th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Score</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Responsável</th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
    <th className="px-4 py-3" />
  </tr>
</thead>
```

Substituir por (o `score` é calculado como `probabilidade * impacto`, não é um campo direto — sortear por `score` precisa de um campo calculado; por isso sortamos por `probabilidade` e `impacto` separados):

```jsx
<thead>
  <tr className="border-b border-border bg-muted">
    <th onClick={() => handleSort("codigo")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Código<SortIcon col="codigo" /></th>
    <th onClick={() => handleSort("descricao")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Descrição<SortIcon col="descricao" /></th>
    <th onClick={() => handleSort("categoria")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Categoria<SortIcon col="categoria" /></th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Impactos</th>
    <th onClick={() => handleSort("probabilidade")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">P<SortIcon col="probabilidade" /></th>
    <th onClick={() => handleSort("impacto")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">I<SortIcon col="impacto" /></th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Score</th>
    <th onClick={() => handleSort("responsavel")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Responsável<SortIcon col="responsavel" /></th>
    <th onClick={() => handleSort("status")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Status<SortIcon col="status" /></th>
    <th className="px-4 py-3" />
  </tr>
</thead>
```

- [ ] **Step 5: Alterar a iteração do body para usar `riscosSorted`**

Localizar a linha `{filtered.map((r, i) => {` e alterar para:

```jsx
{riscosSorted.map((r, i) => {
```

- [ ] **Step 6: Verificar no browser**

Navegar para Riscos & Mudanças → Gestão de Riscos. Clicar nos cabeçalhos sortáveis. Confirmar que "P", "I" ordenam numericamente e "Código", "Categoria" ordenam alfabeticamente.

- [ ] **Step 7: Commitar**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "feat: sort por coluna em Gestão de Riscos"
```

---

## Task 5: Aplicar em `GestaoMudancas.jsx`

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx`

Mesmo padrão que GestaoRiscos: raw HTML `<table>`, `filtered` via useMemo.

- [ ] **Step 1: Adicionar imports**

```jsx
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useSortTable } from "@/hooks/useSortTable"
```

- [ ] **Step 2: Adicionar o hook após `filtered`**

Localizar onde `filtered` é declarado (linha ~92) e adicionar depois:

```jsx
const { sortedData: mudancasSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "titulo" })
```

- [ ] **Step 3: Criar helper `SortIcon` dentro do componente**

Adicionar antes do `return`:

```jsx
function SortIcon({ col }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" />
    : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />
}
```

- [ ] **Step 4: Substituir os `<th>` do `<thead>`**

Localizar o bloco do `<thead>` (linha ~168) que está assim:

```jsx
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Título</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Origem</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Categorias</th>
<th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Impacto Custo</th>
<th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Impacto Prazo</th>
<th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Responsável</th>
<th className="px-4 py-3" />
```

Substituir por:

```jsx
<th onClick={() => handleSort("titulo")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Título<SortIcon col="titulo" /></th>
<th onClick={() => handleSort("origem")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Origem<SortIcon col="origem" /></th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Categorias</th>
<th onClick={() => handleSort("impacto_custo")} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Impacto Custo<SortIcon col="impacto_custo" /></th>
<th onClick={() => handleSort("impacto_prazo_dias")} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Impacto Prazo<SortIcon col="impacto_prazo_dias" /></th>
<th onClick={() => handleSort("status")} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Status<SortIcon col="status" /></th>
<th onClick={() => handleSort("responsavel")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none group">Responsável<SortIcon col="responsavel" /></th>
<th className="px-4 py-3" />
```

- [ ] **Step 5: Alterar iteração para `mudancasSorted`**

Localizar `{filtered.map((m, i) => (` e alterar para:

```jsx
{mudancasSorted.map((m, i) => (
```

- [ ] **Step 6: Verificar no browser**

Navegar para Riscos & Mudanças → Gestão de Mudanças. Clicar nos cabeçalhos. Confirmar que "Impacto Custo" e "Impacto Prazo" ordenam numericamente.

- [ ] **Step 7: Commitar**

```bash
git add src/pages/RiscosMudancas/GestaoMudancas.jsx
git commit -m "feat: sort por coluna em Gestão de Mudanças"
```

---

## Task 6: Refatorar `Documentos.jsx` (já tem sort local)

**Files:**
- Modify: `src/pages/Engenharia/Documentos.jsx`

`Documentos.jsx` já tem sort implementado com estado local (`sortCol`, `sortDir`, `handleSort`, `SortIcon`). Refatorar para usar `useSortTable` e `SortIcon` de Lucide (já instalado). Isso remove código duplicado e alinha ao padrão.

- [ ] **Step 1: Adicionar import de `useSortTable`**

Adicionar ao bloco de imports:

```jsx
import { useSortTable } from "@/hooks/useSortTable"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
```

- [ ] **Step 2: Remover a função `SortIcon` local e o estado manual**

Localizar e **remover** a função `SortIcon` definida localmente (linha ~59):

```jsx
// REMOVER este bloco:
function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 text-gray-300" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-1 text-primary" />
    : <ChevronDown className="w-3 h-3 inline ml-1 text-primary" />;
}
```

Localizar e **remover** os dois `useState` de sort dentro do componente principal (linha ~94):

```jsx
// REMOVER estas duas linhas:
const [sortCol, setSortCol] = useState("tag_id");
const [sortDir, setSortDir] = useState("asc");
```

Localizar e **remover** a função `handleSort` (linha ~282):

```jsx
// REMOVER este bloco:
const handleSort = (col) => {
  if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
  else { setSortCol(col); setSortDir("asc"); }
};
```

- [ ] **Step 3: Substituir o `useMemo` de `filtered` e adicionar `useSortTable`**

Localizar o `useMemo` de `filtered` (linha ~264) que está assim:

```jsx
const filtered = useMemo(() => {
  const disc = filtros.disciplina || [];
  const forn = filtros.fornecedor || [];
  let r = docs;
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(d => d.tag_id?.toLowerCase().includes(b) || d.titulo?.toLowerCase().includes(b));
  }
  if (disc.length > 0) r = r.filter(d => disc.includes(d.disciplina));
  if (forn.length > 0) r = r.filter(d => forn.includes(d.fornecedor));
  return [...r].sort((a, b) => {
    const av = a[sortCol] ?? "";
    const bv = b[sortCol] ?? "";
    const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });
}, [docs, busca, filtros, sortCol, sortDir]);
```

Substituir por (remove o `.sort()` interno e o `useSortTable` cuida disso):

```jsx
const filtered = useMemo(() => {
  const disc = filtros.disciplina || [];
  const forn = filtros.fornecedor || [];
  let r = docs;
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(d => d.tag_id?.toLowerCase().includes(b) || d.titulo?.toLowerCase().includes(b));
  }
  if (disc.length > 0) r = r.filter(d => disc.includes(d.disciplina));
  if (forn.length > 0) r = r.filter(d => forn.includes(d.fornecedor));
  return r;
}, [docs, busca, filtros]);

const { sortedData: docsSorted, sortKey: sortCol, sortDir, handleSort } = useSortTable(
  filtered,
  { defaultKey: "tag_id" }
)
```

> **Atenção:** `Documentos.jsx` tem paginação. Após esta mudança, a variável `paginated` deve vir de `docsSorted`, não de `filtered`. Ajustar no step seguinte.

- [ ] **Step 4: Ajustar a paginação para usar `docsSorted`**

Localizar a linha onde `paginated` é calculada (linha ~283):

```jsx
// Antes:
const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

// Depois:
const paginated = docsSorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
```

> O `filtered.length` nos controles de paginação (linha ~482) deve **permanecer** como `filtered.length` — ele representa o total de itens filtrados (não ordenados), que é o número correto para exibir.

- [ ] **Step 5: Ajustar o uso de `SortIcon` no JSX**

O JSX existente usa `<SortIcon col={key} sortCol={sortCol} sortDir={sortDir} />`. Após a refatoração, o `SortIcon` local foi removido. Substituir cada uso por inline com Lucide:

```jsx
// No .map(({ key, label }) => (
<th
  key={key}
  onClick={() => handleSort(key)}
  className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none group hover:text-foreground"
>
  <span className="inline-flex items-center gap-1">
    {label}
    {sortCol !== key
      ? <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      : sortDir === "asc"
        ? <ArrowUp className="w-3 h-3 text-primary" />
        : <ArrowDown className="w-3 h-3 text-primary" />
    }
  </span>
</th>
```

- [ ] **Step 6: Remover imports de ícones locais não mais usados**

Se `ChevronsUpDown`, `ChevronUp`, `ChevronDown` (do lucide-react) eram usados apenas pelo `SortIcon` local removido, remover esses imports.

- [ ] **Step 7: Verificar no browser**

Navegar para Engenharia → Documentos. Clicar nos cabeçalhos de coluna. O comportamento deve ser idêntico ao anterior mas com ícones `ArrowUpDown/ArrowUp/ArrowDown` (Lucide) em vez dos anteriores.

- [ ] **Step 8: Commitar**

```bash
git add src/pages/Engenharia/Documentos.jsx
git commit -m "refactor: Documentos — sort local substituído por useSortTable"
```

---

## Task 7: Aplicar em `RDOModule.jsx`

**Files:**
- Modify: `src/components/rdo/RDOModule.jsx`

`RDOModule.jsx` usa raw HTML `<table>`. Os cabeçalhos são renderizados via `.map(h => ...)` com array de strings — é preciso converter para JSX explícito para as colunas sortáveis.

- [ ] **Step 1: Adicionar imports**

```jsx
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useSortTable } from "@/hooks/useSortTable"
```

- [ ] **Step 2: Adicionar o hook após `filtered`**

Localizar onde `filtered` é definido (linha ~68) e adicionar depois:

```jsx
const { sortedData: rdosSorted, sortKey, sortDir, handleSort } = useSortTable(filtered, { defaultKey: "data", defaultDir: "desc" })
```

- [ ] **Step 3: Criar helper `SortIcon` dentro do componente**

Adicionar antes do `return`:

```jsx
function SortIcon({ col }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary" />
    : <ArrowDown className="w-3 h-3 inline ml-1 text-primary" />
}
```

- [ ] **Step 4: Substituir o array `.map(h => ...)` por `<th>` explícitos**

Localizar o bloco atual (linha ~125):

```jsx
{["Data", "Nº RDO", "Área", "Disciplinas", "Clima M/T/N", "MO", "Equip.", "Ocorrências", "Evidências", "Ações"].map(h => (
  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
))}
```

Substituir por:

```jsx
<th onClick={() => handleSort("data")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none group">Data<SortIcon col="data" /></th>
<th onClick={() => handleSort("numero")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none group">Nº RDO<SortIcon col="numero" /></th>
<th onClick={() => handleSort("area")} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none group">Área<SortIcon col="area" /></th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Disciplinas</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Clima M/T/N</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">MO</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Equip.</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Ocorrências</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Evidências</th>
<th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Ações</th>
```

- [ ] **Step 5: Alterar iteração do body para `rdosSorted`**

Localizar `{filtered.map(rdo => {` e alterar para:

```jsx
{rdosSorted.map(rdo => {
```

- [ ] **Step 6: Verificar no browser**

Navegar para RDOs. Por padrão deve aparecer ordenado por Data descendente (mais recente primeiro). Clicar em "Data", "Nº RDO", "Área" confirmar ordenação.

- [ ] **Step 7: Commitar**

```bash
git add src/components/rdo/RDOModule.jsx
git commit -m "feat: sort por coluna em RDOs"
```

---

## Task 8: Verificação Final

- [ ] **Step 1: Rodar os testes**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada && npx vitest run src/hooks/useSortTable.test.js
```

Esperado: 9/9 PASS.

- [ ] **Step 2: Verificar todas as tabelas no browser**

Checar cada tabela:
1. **Plano de Ação** (Riscos → Plano de Ação): sort em Descrição, Responsável, Previsão, Status ✓
2. **Gestão de Riscos**: sort em Código, Descrição, Categoria, P, I, Responsável, Status ✓
3. **Gestão de Mudanças**: sort em Título, Origem, Impacto Custo, Impacto Prazo, Status, Responsável ✓
4. **Engenharia → Documentos**: sort em TAG/ID, Título, Disciplina, Revisão, datas ✓
5. **RDOs**: sort em Data (desc por padrão), Nº RDO, Área ✓

- [ ] **Step 3: Commit final de documentação**

Atualizar PLAN.md para registrar a feature como concluída (se aplicável ao milestone em andamento).

```bash
git add PLAN.md
git commit -m "docs: sort de colunas em tabelas — implementado e verificado"
```
