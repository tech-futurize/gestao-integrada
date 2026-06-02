# 6WLA: Coluna DET + Filtros em Linha — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o toggle expandir/recolher e o botão Visualizar da tabela 6WLA por uma coluna "DET" com popover de detalhes, e consolidar todos os filtros (disciplina, área, semanas) em uma única linha.

**Architecture:** As mudanças são isoladas em dois arquivos: `SixWLATable.jsx` recebe a coluna DET (Popover) e perde o toggle + seção expansível + DetailDialog; `SixWLA.jsx` ganha extração de `areas`, filtro de área no FilterBar e move as pills S1–S6 para dentro do FilterToolbar.

**Tech Stack:** React 18 + JSX, Radix UI Popover (já importado), Tailwind CSS, Lucide icons

---

## Task 1: Refatorar SixWLATable.jsx

**Files:**
- Modify: `src/components/planejamento/SixWLATable.jsx`

### Passo a passo

- [ ] **Step 1: Remover imports desnecessários**

Alterar linha 2 de:
```jsx
import { Edit, Info, ChevronRight, ChevronLeft } from "lucide-react";
```
Para:
```jsx
import { Edit, Info } from "lucide-react";
```

Remover linha 4 inteira:
```jsx
import DetailDialog from "@/components/ui/DetailDialog";
```

- [ ] **Step 2: Atualizar constante COL — renomear toggle → det com largura 44**

Alterar linha 13 de:
```js
const COL = { atividade: 200, semana: 80, previsto: 72, real: 72, toggle: 24 };
```
Para:
```js
const COL = { atividade: 200, semana: 80, previsto: 72, real: 72, det: 44 };
```

- [ ] **Step 3: Remover estados showDetails e viewItem**

No corpo do componente (linhas 45–48), remover:
```js
const [showDetails, setShowDetails] = useState(false);
const [viewItem, setViewItem] = useState(null);
```
Manter apenas:
```js
const [editingObs, setEditingObs] = useState(null);
```

- [ ] **Step 4: Atualizar cálculo de L e totalCols**

Substituir o bloco (linhas 57–66):
```js
const detailColCount = showDetails ? 8 : 0;
const totalCols = 5 + detailColCount + restricoes.length + 2;

// Offsets left acumulados para cada coluna sticky esquerda
const L = {
  sem:    COL.atividade,
  prev:   COL.atividade + COL.semana,
  real:   COL.atividade + COL.semana + COL.previsto,
  toggle: COL.atividade + COL.semana + COL.previsto + COL.real,
};
```
Por:
```js
const totalCols = 5 + restricoes.length + 2;

// Offsets left acumulados para cada coluna sticky esquerda
const L = {
  sem:  COL.atividade,
  prev: COL.atividade + COL.semana,
  real: COL.atividade + COL.semana + COL.previsto,
  det:  COL.atividade + COL.semana + COL.previsto + COL.real,
};
```

- [ ] **Step 5: Substituir cabeçalho toggle pelo cabeçalho DET**

Substituir o bloco do header (linhas 104–117):
```jsx
<th
  className="px-1 py-3 text-center sticky bg-muted z-20"
  style={{ left: L.toggle, width: COL.toggle, minWidth: COL.toggle }}
>
  <button
    onClick={() => setShowDetails(v => !v)}
    className="p-0.5 rounded hover:bg-border text-muted-foreground hover:text-foreground transition-colors"
    title={showDetails ? "Recolher: Área, Disciplina, Datas" : "Expandir: Área, Disciplina, Datas BL/Real/Proj"}
  >
    {showDetails
      ? <ChevronLeft className="w-3.5 h-3.5" />
      : <ChevronRight className="w-3.5 h-3.5" />}
  </button>
</th>
```
Por:
```jsx
<th
  className="px-1 py-3 text-center text-xs font-semibold text-muted-foreground sticky bg-muted z-20"
  style={{ left: L.det, width: COL.det, minWidth: COL.det }}
>
  DET
</th>
```

- [ ] **Step 6: Remover seção de cabeçalhos expansíveis**

Remover o bloco inteiro (linhas 119–131):
```jsx
{/* ── EXPANSÍVEL (rolagem horizontal) ─────────────────── */}
{showDetails && (
  <>
    <th className={cn("px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap", sepStart)}>Área</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Disciplina</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">BL Ini</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">BL Fim</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Real Ini</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Real Fim</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Proj Ini</th>
    <th className={cn("px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap", sepEnd)}>Proj Fim</th>
  </>
)}
```

- [ ] **Step 7: Substituir placeholder do toggle pela célula DET com Popover**

Nas linhas de body, substituir o placeholder (linhas 236–240):
```jsx
{/* placeholder do toggle — mantém alinhamento */}
<td
  className={cn("px-1 py-3 sticky z-10", stickyBg)}
  style={{ left: L.toggle, width: COL.toggle, minWidth: COL.toggle }}
/>
```
Por:
```jsx
<td
  className={cn("px-1 py-2 text-center sticky z-10", stickyBg)}
  style={{ left: L.det, width: COL.det, minWidth: COL.det }}
>
  <Popover>
    <PopoverTrigger asChild>
      <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors">
        DET
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-52 p-3" side="right" align="start">
      <div className="space-y-1 text-xs">
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Área</span>
          <span className="font-medium text-foreground">{item.tarefa?.area || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Disciplina</span>
          <span className="font-medium text-foreground">{item.tarefa?.disciplina || "—"}</span>
        </div>
        <div className="border-t border-border pt-2 mt-2 space-y-1">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">BL Ini</span>
            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_inicio_baseline)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">BL Fim</span>
            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_fim_baseline)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Real Ini</span>
            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_inicio_real)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Real Fim</span>
            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.data_fim_real)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Proj Ini</span>
            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.inicio_previsto)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Proj Fim</span>
            <span className="font-medium text-foreground">{fmtDateStr(item.tarefa?.termino_previsto)}</span>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</td>
```

- [ ] **Step 8: Remover seção expansível do body**

Remover o bloco inteiro (linhas 242–270):
```jsx
{/* ── EXPANSÍVEL ──────────────────────────────────── */}
{showDetails && (
  <>
    <td className={cn("px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", sepStart)}>
      {item.tarefa?.area || "—"}
    </td>
    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
      {item.tarefa?.disciplina || "—"}
    </td>
    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
      {fmtDateStr(item.tarefa?.data_inicio_baseline)}
    </td>
    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
      {fmtDateStr(item.tarefa?.data_fim_baseline)}
    </td>
    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
      {fmtDateStr(item.tarefa?.data_inicio_real)}
    </td>
    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
      {fmtDateStr(item.tarefa?.data_fim_real)}
    </td>
    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
      {fmtDateStr(item.tarefa?.inicio_previsto)}
    </td>
    <td className={cn("px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap", sepEnd)}>
      {fmtDateStr(item.tarefa?.termino_previsto)}
    </td>
  </>
)}
```

- [ ] **Step 9: Remover onView do RowActions**

Substituir (linhas 322–327):
```jsx
<RowActions
  onView={() => setViewItem(item)}
  onDelete={() => onDelete(item.id)}
  deleteTitle="Remover do 6WLA"
  deleteDescription="Esta atividade será removida da seleção de semanas. A tarefa no cronograma não será excluída."
/>
```
Por:
```jsx
<RowActions
  onDelete={() => onDelete(item.id)}
  deleteTitle="Remover do 6WLA"
  deleteDescription="Esta atividade será removida da seleção de semanas. A tarefa no cronograma não será excluída."
/>
```

- [ ] **Step 10: Remover DetailDialog do final do arquivo**

Remover o bloco inteiro (linhas 337–354):
```jsx
{viewItem && (
  <DetailDialog
    open={!!viewItem}
    onOpenChange={(o) => !o && setViewItem(null)}
    title={viewItem.tarefa?.nome || "Atividade"}
    sections={[
      { label: "Status", value: viewItem.tarefa?.status },
      { label: "Área", value: viewItem.tarefa?.area },
      { label: "Disciplina", value: viewItem.tarefa?.disciplina },
      { label: "Responsável", value: viewItem.tarefa?.responsavel },
      { label: "Avanço previsto", value: viewItem.tarefa?.avanco_previsto != null ? `${viewItem.tarefa.avanco_previsto}%` : null },
      { label: "Avanço realizado", value: viewItem.tarefa?.avanco_realizado != null ? `${viewItem.tarefa.avanco_realizado}%` : null },
      { label: "Início planejado", value: fmtDateStr(viewItem.tarefa?.data_inicio_planejada) },
      { label: "Fim planejado", value: fmtDateStr(viewItem.tarefa?.data_fim_planejada) },
      { label: "Observação", value: viewItem.observacao, full: true },
    ]}
  />
)}
```

- [ ] **Step 11: Remover constantes sepStart/sepEnd não mais usadas**

Remover as linhas 69–70:
```js
const sepStart = "border-l-2 border-slate-300 dark:border-slate-600";
const sepEnd   = "border-r-2 border-slate-300 dark:border-slate-600";
```

- [ ] **Step 12: Verificar compilação**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada
npm run build 2>&1 | tail -20
```
Esperado: sem erros de compilação.

- [ ] **Step 13: Commit Task 1**

```bash
git add src/components/planejamento/SixWLATable.jsx
git commit -m "feat(6wla): substituir toggle+visualizar por coluna DET com popover de detalhes"
```

---

## Task 2: Atualizar SixWLA.jsx — Filtro de Área + Semanas em Linha

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx`

### Passo a passo

- [ ] **Step 1: Extrair lista de áreas disponíveis**

Após a linha `const disciplinas = useMemo(...)` (linha 100–103), adicionar:
```js
const areas = useMemo(
  () => [...new Set(merged.map(i => i.tarefa?.area).filter(Boolean))].sort(),
  [merged]
);
```

- [ ] **Step 2: Adicionar filtro de área na lógica filtered**

No `useMemo` de `filtered` (linhas 159–184), após o bloco do filtro `discs`:
```js
const discs = filtros.disciplina || [];
```
Adicionar logo abaixo:
```js
const areasFilter = filtros.area || [];
```

Após o bloco:
```js
if (discs.length > 0) {
  items = items.filter(i => discs.includes(i.tarefa?.disciplina));
}
```
Adicionar:
```js
if (areasFilter.length > 0) {
  items = items.filter(i => areasFilter.includes(i.tarefa?.area));
}
```

- [ ] **Step 3: Atualizar a prop active do FilterToolbar para incluir área**

O `active` já cobre `Object.values(filtros).some(a => a?.length > 0)` — como `filtros.area` é parte do mesmo objeto `filtros`, não precisa de mudança. Apenas confirmar que está assim:
```jsx
active={!!searchText || semanasAtivas.length > 0 || Object.values(filtros).some(a => a?.length > 0)}
```

- [ ] **Step 4: Adicionar área ao FilterBar**

Substituir o bloco `<FilterBar ... />` (linhas 319–326):
```jsx
<FilterBar
  key={filterKey}
  storageKey={FILTROS_KEY}
  filters={[
    { key: "disciplina", label: "Disciplina", options: disciplinas },
  ]}
  onChange={setFiltros}
/>
```
Por:
```jsx
<FilterBar
  key={filterKey}
  storageKey={FILTROS_KEY}
  filters={[
    { key: "disciplina", label: "Disciplina", options: disciplinas },
    { key: "area", label: "Área", options: areas },
  ]}
  onChange={setFiltros}
/>
```

- [ ] **Step 5: Mover pills de semanas para dentro do FilterToolbar**

Remover o bloco separado de semanas (linhas 281–302):
```jsx
{/* Semanas — mini-cards filtrantes */}
<div className="flex flex-wrap gap-2">
  {semanas.map((s, i) => {
    const ativa = semanasAtivas.includes(s.label);
    return (
      <button
        key={s.label}
        onClick={() => toggleSemana(s.label)}
        title={`${formatData(s.start)} – ${formatData(s.end)}`}
        style={ativa ? getWeekBadgeStyle(i, isDark) : undefined}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
          ativa
            ? ""
            : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
        )}
      >
        {s.label}-{formatDataDDMM(s.start)}
      </button>
    );
  })}
</div>
```

Adicionar as pills como filhos do `<FilterToolbar>`, após o `<FilterBar>` e antes do fechamento do componente:
```jsx
<FilterToolbar
  active={!!searchText || semanasAtivas.length > 0 || Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setSearchText(""); setSemanasAtivas([]); setFiltros({}); setFilterKey(k => k + 1); }}
>
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      placeholder="Buscar por ID ou atividade..."
      aria-label="Buscar atividade"
      value={searchText}
      onChange={e => setSearchText(e.target.value)}
    />
  </div>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "disciplina", label: "Disciplina", options: disciplinas },
      { key: "area", label: "Área", options: areas },
    ]}
    onChange={setFiltros}
  />
  {semanas.map((s, i) => {
    const ativa = semanasAtivas.includes(s.label);
    return (
      <button
        key={s.label}
        onClick={() => toggleSemana(s.label)}
        title={`${formatData(s.start)} – ${formatData(s.end)}`}
        style={ativa ? getWeekBadgeStyle(i, isDark) : undefined}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
          ativa
            ? ""
            : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
        )}
      >
        {s.label}-{formatDataDDMM(s.start)}
      </button>
    );
  })}
</FilterToolbar>
```

- [ ] **Step 6: Remover o comentário `{/* Semanas — mini-cards filtrantes */}` residual**

Verificar que não ficaram comentários ou `<div>` vazios após a remoção do bloco das semanas.

- [ ] **Step 7: Verificar compilação**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada
npm run build 2>&1 | tail -20
```
Esperado: sem erros de compilação.

- [ ] **Step 8: Verificação visual**

```bash
npm run dev
```

Abrir http://localhost:5173/planejamento/6wla e verificar:
1. Linha de filtros mostra: `[🔍 Buscar] [Disciplina ▾] [Área ▾] [S1] [S2] [S3] [S4] [S5] [S6] [✕]`
2. Coluna "DET" aparece após %Real na tabela
3. Clicar em "DET" abre popover com Área, Disciplina e as 6 datas
4. Não existe mais botão expandir/recolher na tabela
5. Não existe mais botão "Visualizar" no menu de ações
6. Filtro de Disciplina ainda funciona
7. Filtro de Área filtra corretamente
8. Pills S1–S6 ainda filtram por semana
9. Botão "Limpar" limpa todos os filtros

- [ ] **Step 9: Commit Task 2**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "feat(6wla): adicionar filtro de área e consolidar semanas na linha de filtros"
```
