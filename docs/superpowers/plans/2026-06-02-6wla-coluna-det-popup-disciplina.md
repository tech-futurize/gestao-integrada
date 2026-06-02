# 6WLA — Coluna Det., Popup Reformulado e Ajuste de Colunas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reformular a coluna DET do 6WLA: renomear para Det., trocar botão por ícone de olho, reformular popup com mini-card de disciplina colorido e datas em grid lado a lado, ajustar larguras de colunas.

**Architecture:** Duas mudanças de arquivo independentes. `SixWLA.jsx` ganha uma query de Disciplinas e constrói um mapa `{ nome_lower → cor }` que é passado como prop para `SixWLATable.jsx`. `SixWLATable.jsx` recebe o prop e aplica todas as mudanças visuais.

**Tech Stack:** React 18, Vite, Tailwind CSS 3, lucide-react, TanStack React Query 5, Radix UI Popover.

---

## Arquivos modificados

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `src/pages/Planejamento/SixWLA.jsx` | Modificar | Query Disciplinas + disciplinaMap + prop |
| `src/components/planejamento/SixWLATable.jsx` | Modificar | Todas as mudanças visuais |

---

## Task 1 — SixWLA.jsx: query Disciplinas + disciplinaMap + prop

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx`

### Contexto do arquivo

`SixWLA.jsx` já importa `{ useQuery, useMutation, useQueryClient }` e `{ entities }`. Possui três queries existentes: `itens_6wla`, `tarefas_cronograma_atividades`. Renderiza `<SixWLATable>` por volta da linha 337.

---

- [ ] **Step 1: Adicionar query de disciplinas após as queries existentes**

No `SixWLA.jsx`, após o bloco da query `tarefas_cronograma_atividades` (por volta da linha 74), adicionar:

```jsx
// Q3 — disciplinas cadastradas (globais, sem filtro de projeto)
const { data: disciplinas = [] } = useQuery({
  queryKey: ["disciplinas"],
  queryFn: () => entities.Disciplina.list(),
});
```

---

- [ ] **Step 2: Construir disciplinaMap com useMemo**

Após o `useMemo` de `areas` (por volta da linha 107), adicionar:

```jsx
const disciplinaMap = useMemo(
  () => Object.fromEntries(
    disciplinas.map(d => [d.nome.toLowerCase(), d.cor || "#6b7280"])
  ),
  [disciplinas]
);
```

---

- [ ] **Step 3: Passar disciplinaMap como prop para SixWLATable**

Localizar o bloco `<SixWLATable` (por volta da linha 337). Substituir:

```jsx
<SixWLATable
  items={filtered}
  restricoes={RESTRICOES}
  isLoading={isPending}
  onUpdate={(id, data) => updateMut.mutate({ id, data })}
  onDelete={(id) => deleteMut.mutate(id)}
/>
```

Por:

```jsx
<SixWLATable
  items={filtered}
  restricoes={RESTRICOES}
  isLoading={isPending}
  disciplinaMap={disciplinaMap}
  onUpdate={(id, data) => updateMut.mutate({ id, data })}
  onDelete={(id) => deleteMut.mutate(id)}
/>
```

---

- [ ] **Step 4: Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "feat(6wla): query disciplinas + disciplinaMap para colorir popup"
```

---

## Task 2 — SixWLATable.jsx: import Eye + prop + larguras de coluna

**Files:**
- Modify: `src/components/planejamento/SixWLATable.jsx`

### Contexto do arquivo

Linha 2: `import { Edit, Info } from "lucide-react";`

Linha 12: `const COL = { atividade: 200, semana: 80, previsto: 72, real: 72, det: 44 };`

Linha 15: `const R = { restricao: 48, obs: 80, remove: 40 };`

Linha 43: `export default function SixWLATable({ items, restricoes = [], isLoading, onUpdate, onDelete })`

---

- [ ] **Step 1: Adicionar Eye ao import de lucide-react**

Substituir a linha 2:

```jsx
import { Edit, Info } from "lucide-react";
```

Por:

```jsx
import { Edit, Eye, Info } from "lucide-react";
```

---

- [ ] **Step 2: Adicionar disciplinaMap ao destructuring de props**

Substituir a linha 43:

```jsx
export default function SixWLATable({ items, restricoes = [], isLoading, onUpdate, onDelete }) {
```

Por:

```jsx
export default function SixWLATable({ items, restricoes = [], isLoading, disciplinaMap = {}, onUpdate, onDelete }) {
```

---

- [ ] **Step 3: Atualizar constante COL**

Substituir a linha 12:

```js
const COL = { atividade: 200, semana: 80, previsto: 72, real: 72, det: 44 };
```

Por:

```js
const COL = { atividade: 200, semana: 176, previsto: 72, real: 72, det: 40 };
```

---

- [ ] **Step 4: Atualizar constante R**

Substituir a linha 15:

```js
const R = { restricao: 48, obs: 80, remove: 40 };
```

Por:

```js
const R = { restricao: 36, obs: 64, remove: 32 };
```

---

- [ ] **Step 5: Commit parcial**

```bash
git add src/components/planejamento/SixWLATable.jsx
git commit -m "feat(6wla): Eye import, disciplinaMap prop, larguras COL e R atualizadas"
```

---

## Task 3 — SixWLATable.jsx: cabeçalho Det. + ícone olho + flex-nowrap

**Files:**
- Modify: `src/components/planejamento/SixWLATable.jsx`

---

- [ ] **Step 1: Renomear cabeçalho DET → Det.**

Localizar o `<th>` da coluna det (por volta da linha 97–101). Substituir o conteúdo do `<th>`:

```jsx
<th
  className="px-1 py-3 text-center text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
  style={{ left: L.det, width: COL.det, minWidth: COL.det }}
>
  DET
</th>
```

Por:

```jsx
<th
  className="px-1 py-3 text-center text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
  style={{ left: L.det, width: COL.det, minWidth: COL.det }}
>
  Det.
</th>
```

---

- [ ] **Step 2: Substituir botão de texto DET por ícone Eye**

Localizar o `<PopoverTrigger asChild>` dentro da célula det (por volta das linhas 211–218). Substituir:

```jsx
<PopoverTrigger asChild>
  <button
    aria-label="Ver detalhes da atividade"
    title="Ver detalhes (área, disciplina, datas)"
    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
  >
    DET
  </button>
</PopoverTrigger>
```

Por:

```jsx
<PopoverTrigger asChild>
  <button
    aria-label="Ver detalhes da atividade"
    title="Ver detalhes (área, disciplina, datas)"
    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
  >
    <Eye className="w-4 h-4" />
  </button>
</PopoverTrigger>
```

---

- [ ] **Step 3: Trocar flex-wrap por flex-nowrap na célula de semana**

Localizar a célula de semana (por volta da linha 172). Substituir:

```jsx
<div className="flex flex-wrap gap-1 justify-center">
```

Por:

```jsx
<div className="flex flex-nowrap gap-1 justify-center">
```

---

- [ ] **Step 4: Commit**

```bash
git add src/components/planejamento/SixWLATable.jsx
git commit -m "feat(6wla): cabeçalho Det., ícone olho no trigger, semana flex-nowrap"
```

---

## Task 4 — SixWLATable.jsx: popup reformulado

**Files:**
- Modify: `src/components/planejamento/SixWLATable.jsx`

### Contexto

No `.map()` dos itens (por volta da linha 141), adicionar o cálculo de `discCor` no início do callback, antes do `return`. O `PopoverContent` atual (linhas 220–258) será substituído.

---

- [ ] **Step 1: Calcular discCor no início do map callback**

No início do bloco `.map((item, i) => {`, após `const stickyBg = "bg-card";`, adicionar:

```jsx
const discCor = item.tarefa?.disciplina
  ? (disciplinaMap[item.tarefa.disciplina.toLowerCase()] ?? "#6b7280")
  : null;
```

O bloco ficará assim:

```jsx
{items.map((item, i) => {
  const avReal = item.tarefa?.avanco_realizado;
  const isOdd = i % 2 !== 0;
  const stickyBg = "bg-card";
  const discCor = item.tarefa?.disciplina
    ? (disciplinaMap[item.tarefa.disciplina.toLowerCase()] ?? "#6b7280")
    : null;
  return (
```

---

- [ ] **Step 2: Substituir o conteúdo do PopoverContent da coluna det**

Localizar o `<PopoverContent className="w-52 p-3" side="right" align="start">` dentro da célula det (por volta das linhas 220–258). Substituir todo o bloco `<PopoverContent>...</PopoverContent>` por:

```jsx
<PopoverContent className="w-60 p-3" side="right" align="start">
  <div className="space-y-2 text-xs">
    {/* Área */}
    <div className="flex gap-2">
      <span className="text-muted-foreground w-10 shrink-0">Área</span>
      <span className="font-medium text-foreground">{item.tarefa?.area || "—"}</span>
    </div>
    {/* Disciplina mini-card */}
    {discCor ? (
      <div
        className="rounded px-2.5 py-1.5 text-xs font-semibold"
        style={{
          borderLeft: `3px solid ${discCor}`,
          background: `${discCor}18`,
          color: discCor,
        }}
      >
        {item.tarefa.disciplina}
      </div>
    ) : (
      <div className="flex gap-2">
        <span className="text-muted-foreground w-10 shrink-0">Disc.</span>
        <span className="font-medium text-foreground">—</span>
      </div>
    )}
    {/* Datas em grid 3×3: label | Início | Fim */}
    <div className="grid grid-cols-3 gap-x-3 gap-y-1 border-t border-border pt-2 mt-1">
      <div />
      <span className="text-muted-foreground font-medium">Início</span>
      <span className="text-muted-foreground font-medium">Fim</span>
      <span className="text-muted-foreground">BL</span>
      <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_inicio_baseline)}</span>
      <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_fim_baseline)}</span>
      <span className="text-muted-foreground">Real</span>
      <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_inicio_real)}</span>
      <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_fim_real)}</span>
      <span className="text-muted-foreground">Proj</span>
      <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.inicio_previsto)}</span>
      <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.termino_previsto)}</span>
    </div>
  </div>
</PopoverContent>
```

---

- [ ] **Step 3: Commit**

```bash
git add src/components/planejamento/SixWLATable.jsx
git commit -m "feat(6wla): popup reformulado — mini-card disciplina colorido + datas em grid"
```

---

## Self-review checklist

- [x] **Spec coverage:**
  - [x] `DET` → `Det.` no cabeçalho — Task 3 Step 1
  - [x] Ícone de olho no trigger — Task 3 Step 2
  - [x] Mini-card disciplina colorido — Task 4 Steps 1–2
  - [x] Datas lado a lado em grid — Task 4 Step 2
  - [x] `semana` 80→176px — Task 2 Step 3
  - [x] `restricao` 48→36px — Task 2 Step 4
  - [x] `obs` 80→64px — Task 2 Step 4
  - [x] `remove` 40→32px — Task 2 Step 4
  - [x] `flex-nowrap` semana — Task 3 Step 3
  - [x] Query disciplinas em SixWLA.jsx — Task 1 Steps 1–2
  - [x] Prop `disciplinaMap` passado — Task 1 Step 3
- [x] **Sem placeholders:** todos os passos têm código completo
- [x] **Consistência de nomes:** `disciplinaMap` usado consistentemente em Task 1 e Task 2; `discCor` calculado antes do `return` e usado dentro do JSX; `fmtDateStr` já importado no arquivo
