# Filtro de Período — Histograma e Avanços — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar filtro de período (DateRangePicker) ao toolbar do Histograma e dos Painéis de Avanço, restrindo as colunas visíveis de tempo; e mover o botão Importar/Exportar dos painéis de Avanço para o header da página.

**Architecture:** O `DateRangePicker` reutilizável já existe em `src/components/ui/DateRangePicker.jsx`. O estado `periodFilter` vive dentro de cada componente de toolbar (`HistogramaTabela`, `AvancoFisicoPanel`, `AvancoFinanceiroPanel`). O controle de `showImportExport` sobe de cada painel para `Avancos.jsx` (via props), mantendo a lógica de import/export dentro de cada painel.

**Tech Stack:** React 18, date-fns, TanStack React Query, Tailwind CSS

---

## File Map

| Arquivo | Tipo de mudança |
|---|---|
| `src/components/histograma/HistogramaTabela.jsx` | Adicionar `periodFilter` state + `mesesFiltrados` useMemo + `DateRangePicker` no toolbar |
| `src/pages/Planejamento/Avancos.jsx` | Adicionar `showImportExport` state + botão Import/Export no `PageHeader` + passar props aos painéis |
| `src/components/planejamento/AvancoFisicoPanel.jsx` | Aceitar `showImportExport`/`setShowImportExport` como props; remover botão do toolbar; adicionar `periodFilter` + `DateRangePicker` |
| `src/components/planejamento/AvancoFinanceiroPanel.jsx` | Idem ao Físico |

---

## Task 1: Filtro de período em HistogramaTabela

**Files:**
- Modify: `src/components/histograma/HistogramaTabela.jsx`

### Contexto
`HistogramaTabela` computa `projectMonths` (array de datas) e usa esse array em 8 lugares: 3 dentro do useMemo `chartData` (linhas 252, 260, 268) e 5 no JSX de renderização (linhas 472, 484, 541, 589, 646). Todos precisam usar `mesesFiltrados` para que gráfico, tabela e rodapé respeitem o filtro.

- [ ] **Passo 1.1 — Adicionar imports**

No import de `date-fns` (linha 4), acrescentar `endOfMonth, isBefore, isAfter`:

```js
import { eachMonthOfInterval, format, parseISO, startOfMonth, endOfMonth, isBefore, isAfter } from "date-fns";
```

Logo após os imports de libs, adicionar o import do DateRangePicker:

```js
import DateRangePicker from "@/components/ui/DateRangePicker";
```

- [ ] **Passo 1.2 — Adicionar estado `periodFilter`**

Dentro de `HistogramaTabela`, após a linha que declara `const [showNovoDialog, setShowNovoDialog] = useState(false);` (linha ~145), adicionar:

```js
const [periodFilter, setPeriodFilter] = useState(null);
```

- [ ] **Passo 1.3 — Adicionar `mesesFiltrados` useMemo**

Logo após o useMemo `projectMonths` (que termina em `[projeto]`), adicionar:

```js
const mesesFiltrados = useMemo(() => {
  if (!periodFilter) return projectMonths;
  const from = startOfMonth(periodFilter.from);
  const to   = endOfMonth(periodFilter.to);
  return projectMonths.filter(m => !isBefore(m, from) && !isAfter(m, to));
}, [projectMonths, periodFilter]);
```

- [ ] **Passo 1.4 — Atualizar `chartData` useMemo para usar `mesesFiltrados`**

No useMemo `chartData`, substituir as 3 ocorrências de `projectMonths` por `mesesFiltrados`:

```js
// linha ~252 — era:
const lastRealIdx = projectMonths.reduce(
// passa a ser:
const lastRealIdx = mesesFiltrados.reduce(

// linha ~260 — era:
const lastProjIdx = projectMonths.reduce(
// passa a ser:
const lastProjIdx = mesesFiltrados.reduce(

// linha ~268 — era:
return projectMonths.map((m, i) => {
// passa a ser:
return mesesFiltrados.map((m, i) => {
```

E atualizar o array de dependências do useMemo:

```js
// era:
}, [histogramas, projectMonths, activeSubtipos, tipo]);
// passa a ser:
}, [histogramas, mesesFiltrados, activeSubtipos, tipo]);
```

- [ ] **Passo 1.5 — Atualizar JSX para usar `mesesFiltrados`**

Substituir as 5 ocorrências de `projectMonths` no JSX de renderização:

```jsx
// linha ~472 — era:
{projectMonths.map((m) => {
// passa a ser:
{mesesFiltrados.map((m) => {

// linha ~484 — era:
{projectMonths.flatMap((m) => {
// passa a ser:
{mesesFiltrados.flatMap((m) => {

// linha ~541 (dentro do group header row) — era:
{projectMonths.flatMap((m) => {
// passa a ser:
{mesesFiltrados.flatMap((m) => {

// linha ~589 (dentro do body row) — era:
{projectMonths.flatMap((m) => {
// passa a ser:
{mesesFiltrados.flatMap((m) => {

// linha ~646 (dentro do tfoot) — era:
{projectMonths.flatMap((m) => {
// passa a ser:
{mesesFiltrados.flatMap((m) => {
```

- [ ] **Passo 1.6 — Adicionar `DateRangePicker` no toolbar**

No bloco do toolbar (div com `flex items-center gap-3 flex-wrap`), imediatamente **antes** do `<Button ... onClick={() => setShowNovoDialog(true)}>`, adicionar:

```jsx
<DateRangePicker
  label="Período"
  value={periodFilter}
  onChange={setPeriodFilter}
  onClear={() => setPeriodFilter(null)}
/>
```

O resultado visual da linha do toolbar fica:
```
Exibir: [Prev] [Real] [Proj] | [MOD] [MOI]    [📅 Período] [+ Novo Função]
```

O botão "Novo" já tem `ml-auto`, que empurra ambos para a direita.

- [ ] **Passo 1.7 — Verificar no browser**

Inicie o dev server (`npm run dev`) e acesse a tela Histograma.
- Sem filtro: exibe todos os meses do projeto.
- Com filtro de 2 meses: somente as colunas daquele intervalo aparecem no gráfico, na tabela e no rodapé TOTAL.
- Botão X do DateRangePicker limpa o filtro e restaura todos os meses.

- [ ] **Passo 1.8 — Commit**

```bash
git add src/components/histograma/HistogramaTabela.jsx
git commit -m "feat(histograma): filtro de período restringe colunas visíveis"
```

---

## Task 2: Mover Import/Export para o header de Avanços + migrar props

**Files:**
- Modify: `src/pages/Planejamento/Avancos.jsx`
- Modify: `src/components/planejamento/AvancoFisicoPanel.jsx`
- Modify: `src/components/planejamento/AvancoFinanceiroPanel.jsx`

> Os três arquivos são commitados juntos — a mudança de assinatura dos painéis é inseparável da mudança em `Avancos.jsx`.

### Contexto
`AvancoFisicoPanel` e `AvancoFinanceiroPanel` gerenciam `showImportExport` internamente e renderizam o botão no toolbar. A nova estrutura: o botão vai para `PageHeader` em `Avancos.jsx`; o estado passa como props para o painel ativo.

- [ ] **Passo 2.1 — Atualizar `Avancos.jsx`**

Substituir o conteúdo completo do arquivo:

```jsx
import { useState } from "react";
import { BarChart3, Upload } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import AvancoFisicoPanel from "@/components/planejamento/AvancoFisicoPanel";
import AvancoFinanceiroPanel from "@/components/planejamento/AvancoFinanceiroPanel";

export default function Avancos() {
  const { selectedProjectId } = useProject();
  const [activeTab, setActiveTab] = useState("fisico");
  const [showImportExport, setShowImportExport] = useState(false);

  const headerActions = (
    <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
      <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
    </Button>
  );

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={BarChart3}
            description="Selecione um projeto na barra lateral para ver os avanços."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader actions={headerActions} />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Abas coladas ao card — mesmo padrão do Histograma */}
        <div className="flex gap-1 border-b border-border pb-0">
          {[
            { key: "fisico",      label: "Avanço Físico" },
            { key: "financeiro",  label: "Avanço Financeiro" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === key
                  ? "bg-card border border-b-card border-border text-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "fisico"
          ? <AvancoFisicoPanel
              showImportExport={showImportExport}
              setShowImportExport={setShowImportExport}
            />
          : <AvancoFinanceiroPanel
              showImportExport={showImportExport}
              setShowImportExport={setShowImportExport}
            />}
      </div>
    </div>
  );
}
```

- [ ] **Passo 2.2 — Atualizar assinatura de `AvancoFisicoPanel`**

Na linha 107, mudar a assinatura do componente de:

```js
export default function AvancoFisicoPanel() {
```

para:

```js
export default function AvancoFisicoPanel({ showImportExport, setShowImportExport }) {
```

- [ ] **Passo 2.3 — Remover estado local de Import/Export em `AvancoFisicoPanel`**

Remover a linha (linha ~112):

```js
const [showImportExport, setShowImportExport] = React.useState(false);
```

- [ ] **Passo 2.4 — Remover botão Import/Export do toolbar de `AvancoFisicoPanel`**

Remover o trecho abaixo do toolbar (linhas ~343-351):

```jsx
<Button
  size="sm"
  variant="outline"
  className="ml-auto"
  onClick={() => setShowImportExport(true)}
>
  <Upload className="w-3.5 h-3.5 mr-1" />
  Importar / Exportar
</Button>
```

- [ ] **Passo 2.5 — Atualizar assinatura de `AvancoFinanceiroPanel`**

Na linha 125, mudar de:

```js
export default function AvancoFinanceiroPanel() {
```

para:

```js
export default function AvancoFinanceiroPanel({ showImportExport, setShowImportExport }) {
```

- [ ] **Passo 2.6 — Remover estado local de Import/Export em `AvancoFinanceiroPanel`**

Remover a linha (linha ~130):

```js
const [showImportExport, setShowImportExport] = React.useState(false);
```

- [ ] **Passo 2.7 — Remover botão Import/Export do toolbar de `AvancoFinanceiroPanel`**

Remover o trecho do toolbar (linhas ~322-330):

```jsx
<Button
  size="sm"
  variant="outline"
  className="ml-auto"
  onClick={() => setShowImportExport(true)}
>
  <Upload className="w-3.5 h-3.5 mr-1" />
  Importar / Exportar
</Button>
```

- [ ] **Passo 2.8 — Verificar no browser**

Acesse a tela Avanços. O botão "Importar / Exportar" deve aparecer no header da página (canto superior direito), idêntico ao padrão de Histograma. O dialog deve abrir tanto na aba Físico quanto na aba Financeiro. Os toolbars dos painéis não devem mais ter o botão.

- [ ] **Passo 2.9 — Commit**

```bash
git add src/pages/Planejamento/Avancos.jsx \
        src/components/planejamento/AvancoFisicoPanel.jsx \
        src/components/planejamento/AvancoFinanceiroPanel.jsx
git commit -m "feat(avancos): botão Importar/Exportar movido para o header da página"
```

---

## Task 3: Filtro de período em AvancoFisicoPanel

**Files:**
- Modify: `src/components/planejamento/AvancoFisicoPanel.jsx`

### Contexto
`AvancoFisicoPanel` trabalha com dois modos: semanal (`projectWeeks`) e mensal (`monthPeriods`). O filtro produz `weeksFiltradas` e `monthsFiltrados`. O `monthDataMap` continua usando `projectWeeks` completo para agregar corretamente; só os períodos de exibição são filtrados.

- [ ] **Passo 3.1 — Adicionar imports**

No import de `date-fns` (linha 4), acrescentar `endOfMonth, isBefore, isAfter`:

```js
import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  startOfMonth,
  subMonths,
  addYears,
  parseISO,
  format,
  eachWeekOfInterval,
  endOfMonth,
  isBefore,
  isAfter,
} from "date-fns";
```

Adicionar import do `DateRangePicker` junto aos outros imports de UI:

```js
import DateRangePicker from "@/components/ui/DateRangePicker";
```

- [ ] **Passo 3.2 — Adicionar estado `periodFilter`**

Após `const [viewMode, setViewMode] = React.useState("semanal");` (linha ~116), adicionar:

```js
const [periodFilter, setPeriodFilter] = React.useState(null);
```

- [ ] **Passo 3.3 — Adicionar `weeksFiltradas` useMemo**

Logo após o useMemo `projectWeeks` (que termina em `[projeto]`), adicionar:

```js
const weeksFiltradas = useMemo(() => {
  if (!periodFilter) return projectWeeks;
  const from = periodFilter.from;
  const to   = periodFilter.to;
  return projectWeeks.filter(w => !isBefore(w, from) && !isAfter(w, to));
}, [projectWeeks, periodFilter]);
```

- [ ] **Passo 3.4 — Adicionar `monthsFiltrados` useMemo**

Logo após o useMemo `monthPeriods` (que termina em `[projectWeeks]`), adicionar:

```js
const monthsFiltrados = useMemo(() => {
  if (!periodFilter) return monthPeriods;
  const from = startOfMonth(periodFilter.from);
  const to   = endOfMonth(periodFilter.to);
  return monthPeriods.filter(m => !isBefore(m, from) && !isAfter(m, to));
}, [monthPeriods, periodFilter]);
```

> Nota: `monthDataMap` continua usando `projectWeeks` (não filtrado) para agregar todos os dados — apenas os períodos de exibição são filtrados.

- [ ] **Passo 3.5 — Atualizar `computeAvancoSeries` para usar períodos filtrados**

No useMemo `chartData` (linha ~201), a linha:

```js
const periods = isMensal ? monthPeriods : projectWeeks;
```

passa a ser:

```js
const periods = isMensal ? monthsFiltrados : weeksFiltradas;
```

Atualizar também o array de dependências do useMemo:

```js
// era:
}, [viewMode, isMensal, monthPeriods, monthDataMap, projectWeeks, dataMap]);
// passa a ser:
}, [viewMode, isMensal, monthsFiltrados, monthDataMap, weeksFiltradas, dataMap]);
```

- [ ] **Passo 3.6 — Atualizar `AvancoTabela` para usar períodos filtrados**

No JSX, alterar o prop `periods` de `<AvancoTabela>`:

```jsx
// era:
periods={isMensal ? monthPeriods : projectWeeks}
// passa a ser:
periods={isMensal ? monthsFiltrados : weeksFiltradas}
```

- [ ] **Passo 3.7 — Adicionar `DateRangePicker` no toolbar**

No toolbar de `AvancoFisicoPanel` (div com `flex items-center gap-3 flex-wrap`), após o último chip de toggle (Mensal/Semanal) e antes do fechamento da div, adicionar com `ml-auto` para empurrar à direita:

```jsx
<div className="ml-auto">
  <DateRangePicker
    label="Período"
    value={periodFilter}
    onChange={setPeriodFilter}
    onClear={() => setPeriodFilter(null)}
  />
</div>
```

O resultado visual:
```
Exibir: [Prev] [Real] [Proj] | [Semanal] [Mensal]    [📅 Período]
```

- [ ] **Passo 3.8 — Verificar no browser**

Acesse a aba Avanço Físico.
- Modo semanal sem filtro: exibe todas as semanas do projeto.
- Modo semanal com filtro: somente as semanas dentro do intervalo aparecem no gráfico e na tabela.
- Modo mensal com filtro: somente os meses dentro do intervalo aparecem.
- Trocar de semanal para mensal mantém o filtro aplicado.

- [ ] **Passo 3.9 — Commit**

```bash
git add src/components/planejamento/AvancoFisicoPanel.jsx
git commit -m "feat(avancos): filtro de período em Avanço Físico restringe colunas visíveis"
```

---

## Task 4: Filtro de período em AvancoFinanceiroPanel

**Files:**
- Modify: `src/components/planejamento/AvancoFinanceiroPanel.jsx`

### Contexto
`AvancoFinanceiroPanel` usa apenas modo mensal (`projectMonths`). O filtro é mais simples que o Físico.

- [ ] **Passo 4.1 — Adicionar imports**

No import de `date-fns` (linha 3), acrescentar `endOfMonth, isBefore, isAfter`:

```js
import {
  eachMonthOfInterval,
  startOfMonth,
  parseISO,
  format,
  endOfMonth,
  isBefore,
  isAfter,
} from "date-fns";
```

Adicionar import do `DateRangePicker` junto aos outros imports de UI:

```js
import DateRangePicker from "@/components/ui/DateRangePicker";
```

- [ ] **Passo 4.2 — Adicionar estado `periodFilter`**

Após `const [showProj, setShowProj] = React.useState(true);` (linha ~133), adicionar:

```js
const [periodFilter, setPeriodFilter] = React.useState(null);
```

- [ ] **Passo 4.3 — Adicionar `monthsFiltrados` useMemo**

Logo após o useMemo `projectMonths` (que termina em `[projeto]`), adicionar:

```js
const monthsFiltrados = useMemo(() => {
  if (!periodFilter) return projectMonths;
  const from = startOfMonth(periodFilter.from);
  const to   = endOfMonth(periodFilter.to);
  return projectMonths.filter(m => !isBefore(m, from) && !isAfter(m, to));
}, [projectMonths, periodFilter]);
```

- [ ] **Passo 4.4 — Atualizar `computeAvancoSeries` para usar `monthsFiltrados`**

No useMemo `chartData` (linha ~187), a chamada a `computeAvancoSeries`:

```js
return computeAvancoSeries({
  dataMap,
  periods: projectMonths,
  ...
```

passa a ser:

```js
return computeAvancoSeries({
  dataMap,
  periods: monthsFiltrados,
  ...
```

Atualizar o array de dependências:

```js
// era:
}, [dataMap, projectMonths]);
// passa a ser:
}, [dataMap, monthsFiltrados]);
```

- [ ] **Passo 4.5 — Atualizar `AvancoTabela` para usar `monthsFiltrados`**

No JSX, alterar o prop `periods` de `<AvancoTabela>`:

```jsx
// era:
periods={projectMonths}
// passa a ser:
periods={monthsFiltrados}
```

- [ ] **Passo 4.6 — Adicionar `DateRangePicker` no toolbar**

No toolbar (div com `flex items-center gap-3 flex-wrap`), após os chips de toggle e antes do fechamento da div, adicionar:

```jsx
<div className="ml-auto">
  <DateRangePicker
    label="Período"
    value={periodFilter}
    onChange={setPeriodFilter}
    onClear={() => setPeriodFilter(null)}
  />
</div>
```

- [ ] **Passo 4.7 — Verificar no browser**

Acesse a aba Avanço Financeiro.
- Sem filtro: exibe todos os meses do projeto no gráfico e na tabela.
- Com filtro: somente os meses do intervalo aparecem.
- Botão X limpa o filtro e restaura todos os meses.

- [ ] **Passo 4.8 — Commit**

```bash
git add src/components/planejamento/AvancoFinanceiroPanel.jsx
git commit -m "feat(avancos): filtro de período em Avanço Financeiro restringe colunas visíveis"
```
