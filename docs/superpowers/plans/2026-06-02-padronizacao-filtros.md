# Padronização de Filtros — Todos os Módulos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que todos os módulos com dados filtráveis usem `FilterToolbar` + `Search input` + `FilterBar` + `DateRangePicker` (quando aplicável), seguindo o padrão do Cronograma.

**Architecture:** Cada módulo recebe alterações independentes e autocontidas. Os 4 primeiros são adições a FilterToolbars existentes; os 3 últimos constroem do zero (ou wrapm filtros soltos). Não há shared state entre módulos — cada um tem seus próprios estados locais e chave de localStorage.

**Tech Stack:** React 18, Tailwind CSS, `FilterToolbar` / `FilterBar` / `DateRangePicker` de `@/components/ui/`, `lucide-react` para ícone `Search`.

---

## Task 1 — Gestão de Riscos: adicionar Search

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

- [ ] **Passo 1: Adicionar `Search` ao import lucide-react**

Linha 3, de:
```js
import { ShieldAlert, Plus, Edit, Trash2, Upload, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
```
Para:
```js
import { ShieldAlert, Plus, Edit, Trash2, Upload, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
```

- [ ] **Passo 2: Adicionar estado `busca` após a linha `const [filterKey, setFilterKey] = useState(0);` (~linha 77)**

```js
const [busca, setBusca] = useState("");
```

- [ ] **Passo 3: Atualizar `filtered` useMemo para incluir busca por `descricao` (~linha 125)**

De:
```js
const filtered = useMemo(() => {
  const st = filtros.status || [];
  const cat = filtros.categoria || [];
  let r = riscos;
  if (st.length > 0) r = r.filter(x => st.includes(x.status));
  if (cat.length > 0) r = r.filter(x => cat.includes(x.categoria));
  return r;
}, [riscos, filtros]);
```
Para:
```js
const filtered = useMemo(() => {
  const st = filtros.status || [];
  const cat = filtros.categoria || [];
  let r = riscos;
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(x => x.descricao?.toLowerCase().includes(b) || x.codigo?.toLowerCase().includes(b));
  }
  if (st.length > 0) r = r.filter(x => st.includes(x.status));
  if (cat.length > 0) r = r.filter(x => cat.includes(x.categoria));
  return r;
}, [riscos, busca, filtros]);
```

- [ ] **Passo 4: Atualizar `FilterToolbar` — prop `active` e `onClearAll`, e adicionar search input (~linha 241)**

De:
```jsx
<FilterToolbar
  active={Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status", label: "Status", options: STATUS_OPTIONS },
      { key: "categoria", label: "Categoria", options: CATEGORIAS },
    ]}
    onChange={setFiltros}
  />
</FilterToolbar>
```
Para:
```jsx
<FilterToolbar
  active={!!busca || Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setBusca(""); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
      placeholder="Buscar por descrição..."
      value={busca}
      onChange={e => setBusca(e.target.value)}
    />
  </div>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status", label: "Status", options: STATUS_OPTIONS },
      { key: "categoria", label: "Categoria", options: CATEGORIAS },
    ]}
    onChange={setFiltros}
  />
</FilterToolbar>
```

- [ ] **Passo 5: Verificar build sem erros**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada && npm run build 2>&1 | tail -5
```
Esperado: `✓ built in` sem erros.

- [ ] **Passo 6: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "feat: Gestão de Riscos — adicionar search input ao FilterToolbar"
```

---

## Task 2 — Gestão de Mudanças: adicionar Search + DateRangePicker

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx`

- [ ] **Passo 1: Adicionar `Search` ao import lucide-react e `DateRangePicker` aos imports de UI**

Linha com lucide-react (contém `ArrowRightLeft, Plus, Edit...`), adicionar `Search`:
```js
import { ArrowRightLeft, Plus, Edit, Trash2, Upload, ArrowUpDown, ArrowUp, ArrowDown, Check, Search } from "lucide-react";
```

Após os imports de FilterBar/FilterToolbar existentes, adicionar:
```js
import DateRangePicker from "@/components/ui/DateRangePicker";
```

- [ ] **Passo 2: Adicionar estados `busca` e `periodo` após `const [deleteId, setDeleteId] = useState(null);` (~linha 55)**

```js
const [busca, setBusca] = useState("");
const [periodo, setPeriodo] = useState(null);
```

- [ ] **Passo 3: Atualizar `filtered` useMemo para incluir busca por `titulo` e filtro de `data_ocorrencia` (~linha 96)**

De:
```js
const filtered = useMemo(() => {
  const st = filtros.status || [];
  const or = filtros.origem || [];
  let r = mudancas;
  if (st.length > 0) r = r.filter(m => st.includes(m.status));
  if (or.length > 0) r = r.filter(m => or.includes(m.origem));
  return r;
}, [mudancas, filtros]);
```
Para:
```js
const filtered = useMemo(() => {
  const st = filtros.status || [];
  const or = filtros.origem || [];
  let r = mudancas;
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(m => m.titulo?.toLowerCase().includes(b) || m.descricao?.toLowerCase().includes(b));
  }
  if (st.length > 0) r = r.filter(m => st.includes(m.status));
  if (or.length > 0) r = r.filter(m => or.includes(m.origem));
  if (periodo?.from) {
    const fromStr = periodo.from.toISOString().split("T")[0];
    r = r.filter(m => m.data_ocorrencia && m.data_ocorrencia >= fromStr);
  }
  if (periodo?.to) {
    const toStr = periodo.to.toISOString().split("T")[0];
    r = r.filter(m => m.data_ocorrencia && m.data_ocorrencia <= toStr);
  }
  return r;
}, [mudancas, busca, filtros, periodo]);
```

- [ ] **Passo 4: Atualizar `FilterToolbar` — prop `active`, `onClearAll` e adicionar search + DateRangePicker (~linha 152)**

De:
```jsx
<FilterToolbar
  active={Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status", label: "Status", options: STATUS_OPTIONS },
      { key: "origem", label: "Origem", options: ["Contratada", "Contratante"] },
    ]}
    onChange={setFiltros}
  />
</FilterToolbar>
```
Para:
```jsx
<FilterToolbar
  active={!!busca || !!periodo?.from || Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setBusca(""); setPeriodo(null); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
      placeholder="Buscar por título..."
      value={busca}
      onChange={e => setBusca(e.target.value)}
    />
  </div>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status", label: "Status", options: STATUS_OPTIONS },
      { key: "origem", label: "Origem", options: ["Contratada", "Contratante"] },
    ]}
    onChange={setFiltros}
  />
  <DateRangePicker
    label="Data Registro"
    value={periodo}
    onChange={setPeriodo}
    onClear={() => setPeriodo(null)}
  />
</FilterToolbar>
```

- [ ] **Passo 5: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Passo 6: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoMudancas.jsx
git commit -m "feat: Gestão de Mudanças — adicionar search input e DateRangePicker ao FilterToolbar"
```

---

## Task 3 — Medições: adicionar Search + DateRangePicker

**Files:**
- Modify: `src/pages/AdminContratual/Medicoes.jsx`

- [ ] **Passo 1: Adicionar `Search` ao import lucide-react e `DateRangePicker` aos imports de UI**

Linha 5 (contém `Plus, ClipboardList, Upload`), adicionar `Search`:
```js
import { Plus, ClipboardList, Upload, Search } from "lucide-react";
```

Após o import de `FilterToolbar` existente (linha ~13), adicionar:
```js
import DateRangePicker from "@/components/ui/DateRangePicker";
```

- [ ] **Passo 2: Adicionar estados `busca` e `periodo` após `const FILTROS_KEY = "medicoes-filtros";` (~linha 43)**

```js
const [busca, setBusca] = useState("");
const [periodo, setPeriodo] = useState(null);
```

- [ ] **Passo 3: Atualizar `medicoesFiltradas` useMemo para incluir busca por `numero` e filtro de `periodo_inicio` (~linha 45)**

De:
```js
const medicoesFiltradas = useMemo(() => {
  const st = filtros.status || [];
  if (st.length === 0) return medicoes;
  return medicoes.filter(m => st.includes(m.status));
}, [medicoes, filtros]);
```
Para:
```js
const medicoesFiltradas = useMemo(() => {
  const st = filtros.status || [];
  let r = medicoes;
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(m => m.numero?.toLowerCase().includes(b));
  }
  if (st.length > 0) r = r.filter(m => st.includes(m.status));
  if (periodo?.from) {
    const fromStr = periodo.from.toISOString().split("T")[0];
    r = r.filter(m => m.periodo_inicio && m.periodo_inicio >= fromStr);
  }
  if (periodo?.to) {
    const toStr = periodo.to.toISOString().split("T")[0];
    r = r.filter(m => m.periodo_inicio && m.periodo_inicio <= toStr);
  }
  return r;
}, [medicoes, busca, filtros, periodo]);
```

- [ ] **Passo 4: Atualizar `FilterToolbar` no render (~linha 132)**

De:
```jsx
<FilterToolbar
  active={Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status", label: "Status", options: ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"] },
    ]}
    onChange={setFiltros}
  />
</FilterToolbar>
```
Para:
```jsx
<FilterToolbar
  active={!!busca || !!periodo?.from || Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setBusca(""); setPeriodo(null); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
      placeholder="Buscar por número..."
      value={busca}
      onChange={e => setBusca(e.target.value)}
    />
  </div>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status", label: "Status", options: ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"] },
    ]}
    onChange={setFiltros}
  />
  <DateRangePicker
    label="Período Início"
    value={periodo}
    onChange={setPeriodo}
    onClear={() => setPeriodo(null)}
  />
</FilterToolbar>
```

- [ ] **Passo 5: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Passo 6: Commit**

```bash
git add src/pages/AdminContratual/Medicoes.jsx
git commit -m "feat: Medições — adicionar search input e DateRangePicker ao FilterToolbar"
```

---

## Task 4 — RDO: adicionar FilterBar por Área

**Files:**
- Modify: `src/components/rdo/RDOModule.jsx`

- [ ] **Passo 1: Adicionar import de `FilterBar`**

Após `import FilterToolbar from "@/components/ui/FilterToolbar";` (linha 7), adicionar:
```js
import FilterBar from "@/components/ui/FilterBar";
```

- [ ] **Passo 2: Adicionar estados `filtros` e `filterKey`, e constante `FILTROS_KEY` após `const [periodo, setPeriodo] = useState(null);` (~linha 32)**

```js
const [filtros, setFiltros] = useState({});
const [filterKey, setFilterKey] = useState(0);
const FILTROS_KEY = "rdo-filtros";
```

- [ ] **Passo 3: Adicionar `areaOptions` useMemo após a query de `rdos` (~linha 38)**

```js
const areaOptions = useMemo(
  () => [...new Set(rdos.map(r => r.area).filter(Boolean))].sort(),
  [rdos]
);
```

- [ ] **Passo 4: Atualizar `filtered` useMemo para incluir filtro por area (~linha 69)**

De:
```js
const filtered = useMemo(() => {
  let result = rdos;
  if (search) result = result.filter(r =>
    (r.numero || r.area || "").toLowerCase().includes(search.toLowerCase())
  );
  if (periodo?.from) {
    const fromStr = periodo.from.toISOString().split("T")[0];
    result = result.filter(r => r.data && r.data >= fromStr);
  }
  if (periodo?.to) {
    const toStr = periodo.to.toISOString().split("T")[0];
    result = result.filter(r => r.data && r.data <= toStr);
  }
  return result;
}, [rdos, search, periodo]);
```
Para:
```js
const filtered = useMemo(() => {
  let result = rdos;
  if (search) result = result.filter(r =>
    (r.numero || r.area || "").toLowerCase().includes(search.toLowerCase())
  );
  if (filtros.area?.length > 0) result = result.filter(r => filtros.area.includes(r.area));
  if (periodo?.from) {
    const fromStr = periodo.from.toISOString().split("T")[0];
    result = result.filter(r => r.data && r.data >= fromStr);
  }
  if (periodo?.to) {
    const toStr = periodo.to.toISOString().split("T")[0];
    result = result.filter(r => r.data && r.data <= toStr);
  }
  return result;
}, [rdos, search, filtros, periodo]);
```

- [ ] **Passo 5: Atualizar `isFilterActive` e `handleClearAll` (~linha 98)**

De:
```js
const isFilterActive = !!search || !!periodo?.from;
const handleClearAll = () => { setSearch(""); setPeriodo(null); };
```
Para:
```js
const isFilterActive = !!search || !!periodo?.from || Object.values(filtros).some(a => a?.length > 0);
const handleClearAll = () => {
  setSearch("");
  setPeriodo(null);
  setFiltros({});
  localStorage.removeItem(FILTROS_KEY);
  setFilterKey(k => k + 1);
};
```

- [ ] **Passo 6: Adicionar `FilterBar` dentro do `FilterToolbar` no render, entre o search input e o DateRangePicker (~linha 112)**

De:
```jsx
<FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
  <div className="relative">
    <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm bg-background text-foreground"
      placeholder="Nº RDO, área..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
  <DateRangePicker
    label="Período"
    value={periodo}
    onChange={setPeriodo}
    onClear={() => setPeriodo(null)}
  />
</FilterToolbar>
```
Para:
```jsx
<FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
  <div className="relative">
    <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm bg-background text-foreground"
      placeholder="Nº RDO, área..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "area", label: "Área", options: areaOptions },
    ]}
    onChange={setFiltros}
  />
  <DateRangePicker
    label="Período"
    value={periodo}
    onChange={setPeriodo}
    onClear={() => setPeriodo(null)}
  />
</FilterToolbar>
```

- [ ] **Passo 7: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Passo 8: Commit**

```bash
git add src/components/rdo/RDOModule.jsx
git commit -m "feat: RDO — adicionar FilterBar por Área ao FilterToolbar"
```

---

## Task 5 — Take-Off: wrap em FilterToolbar e converter selects

**Files:**
- Modify: `src/components/planejamento/TakeOffCommodities.jsx`

- [ ] **Passo 1: Adicionar imports**

Adicionar 3 imports imediatamente após o bloco de imports de lucide-react (linha 13):
```js
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import { Search } from "lucide-react";
```

- [ ] **Passo 2: Substituir estados `filtroDisciplina` e `filtroUnidade` por `filtros` e `filterKey` (~linha 313)**

De:
```js
const [filtroDisciplina, setFiltroDisciplina] = useState("");
const [filtroUnidade, setFiltroUnidade]       = useState("");
const [busca, setBusca]       = useState("");
```
Para:
```js
const [filtros, setFiltros]   = useState({});
const [filterKey, setFilterKey] = useState(0);
const [busca, setBusca]       = useState("");
const FILTROS_KEY = "takeoff-filtros";
```

- [ ] **Passo 3: Atualizar `filtered` useMemo para usar arrays do FilterBar (~linha 371)**

De:
```js
const filtered = useMemo(() => {
  let r = enriched;
  if (filtroDisciplina) r = r.filter(i => i.disciplina === filtroDisciplina);
  if (filtroUnidade)    r = r.filter(i => i.unidade === filtroUnidade);
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(i => i.codigo?.toLowerCase().includes(b) || i.descricao?.toLowerCase().includes(b));
  }
  return [...r].sort((a, b) => {
```
Para:
```js
const filtered = useMemo(() => {
  let r = enriched;
  if (filtros.disciplina?.length > 0) r = r.filter(i => filtros.disciplina.includes(i.disciplina));
  if (filtros.unidade?.length > 0)    r = r.filter(i => filtros.unidade.includes(i.unidade));
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(i => i.codigo?.toLowerCase().includes(b) || i.descricao?.toLowerCase().includes(b));
  }
  return [...r].sort((a, b) => {
```

- [ ] **Passo 4: Atualizar dependências do `filtered` useMemo**

Na linha de dependências do useMemo que continha `[enriched, filtroDisciplina, filtroUnidade, busca, sortCol, sortDir]`, substituir por:
```js
}, [enriched, filtros, busca, sortCol, sortDir]);
```

- [ ] **Passo 5: Substituir o bloco de filtros no render (~linha 465)**

De (o bloco completo de filtros + botão "Novo Item"):
```jsx
{/* Filtros */}
<div className="flex flex-wrap gap-3 items-center justify-between">
  <div className="flex flex-wrap gap-2">
    <input
      className="border border-border rounded-lg px-3 py-1.5 text-sm w-52 bg-background text-foreground"
      placeholder="Buscar código ou descrição..."
      value={busca} onChange={e => setBusca(e.target.value)}
    />
    <select className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground" value={filtroDisciplina} onChange={e => setFiltroDisciplina(e.target.value)}>
      <option value="">Todas as Disciplinas</option>
      {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
    </select>
    <select className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground" value={filtroUnidade} onChange={e => setFiltroUnidade(e.target.value)}>
      <option value="">Todas as Unidades</option>
      {UNIDADE_SIGLAS.map(u => <option key={u}>{u}</option>)}
    </select>
  </div>
  <Button onClick={() => { setEditingItem(null); setShowItemModal(true); }}>
    <Plus className="w-4 h-4 mr-2" />Novo Item
  </Button>
</div>
```
Para:
```jsx
{/* Filtros */}
<FilterToolbar
  active={!!busca || Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setBusca(""); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
      placeholder="Buscar código ou descrição..."
      value={busca}
      onChange={e => setBusca(e.target.value)}
    />
  </div>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "disciplina", label: "Disciplina", options: DISCIPLINAS },
      { key: "unidade",    label: "Unidade",    options: UNIDADE_SIGLAS },
    ]}
    onChange={setFiltros}
  />
</FilterToolbar>
<div className="flex justify-end">
  <Button onClick={() => { setEditingItem(null); setShowItemModal(true); }}>
    <Plus className="w-4 h-4 mr-2" />Novo Item
  </Button>
</div>
```
> **Nota:** O botão "Novo Item" é colocado imediatamente após `</FilterToolbar>`, fora do wrapper — ele controla um modal local ao componente e não vai para o PageHeader. `UNIDADE_SIGLAS` vem de `@/lib/unidadesMedida` (já importado na linha 2). `DISCIPLINAS` é a constante local definida na linha 19.

- [ ] **Passo 6: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Passo 7: Commit**

```bash
git add src/components/planejamento/TakeOffCommodities.jsx
git commit -m "feat: Take-Off — envolver filtros em FilterToolbar e converter selects para FilterBar"
```

---

## Task 6 — Contratos: FilterToolbar completo do zero

**Files:**
- Modify: `src/pages/Contratos.jsx`

- [ ] **Passo 1: Atualizar import do React para incluir `useMemo`**

Linha 1, de:
```js
import { useState } from "react";
```
Para:
```js
import { useState, useMemo } from "react";
```

- [ ] **Passo 2: Adicionar imports de filtros**

Após `import { useToast, friendlyMessage } from "@/components/ui/use-toast";` (linha 16), adicionar:
```js
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { Search } from "lucide-react";
```
> **Nota:** Adicionar `Search` ao import lucide-react existente (linha 6): `import { Plus, FileText, DollarSign, Upload, Search } from "lucide-react";`

- [ ] **Passo 3: Adicionar estados e constante de filtros após `const [selectedContrato, setSelectedContrato] = useState(null);` (~linha 41)**

```js
const [busca, setBusca] = useState("");
const [filtros, setFiltros] = useState({});
const [periodo, setPeriodo] = useState(null);
const [filterKey, setFilterKey] = useState(0);
const FILTROS_KEY = "contratos-filtros";
```

- [ ] **Passo 4: Adicionar `tipoOptions` e `filteredContratos` useMemos após a query de contratos (~linha 53)**

Adicionar após o bloco de `useQuery` de contratos:
```js
const tipoOptions = useMemo(
  () => [...new Set(contratos.map(c => c.tipo).filter(Boolean))].sort(),
  [contratos]
);

const filteredContratos = useMemo(() => {
  let r = contratos;
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(c => c.objeto?.toLowerCase().includes(b) || c.fornecedor?.toLowerCase().includes(b));
  }
  if (filtros.status?.length) r = r.filter(c => filtros.status.includes(c.status));
  if (filtros.tipo?.length)   r = r.filter(c => filtros.tipo.includes(c.tipo));
  if (periodo?.from) {
    const fromStr = periodo.from.toISOString().split("T")[0];
    r = r.filter(c => c.data_inicio && c.data_inicio >= fromStr);
  }
  if (periodo?.to) {
    const toStr = periodo.to.toISOString().split("T")[0];
    r = r.filter(c => c.data_inicio && c.data_inicio <= toStr);
  }
  return r;
}, [contratos, busca, filtros, periodo]);
```

- [ ] **Passo 5: Adicionar `FilterToolbar` no render, entre os KPI cards e o `ContratosList` (somente quando `!selectedContrato`)**

Localizar a linha:
```jsx
{selectedContrato ? (
  <ContratoDetalhes ...
```

Adicionar `FilterToolbar` imediatamente antes dessa linha (ainda dentro de `<div className="flex-1 overflow-auto p-6 space-y-6">`):
```jsx
{!selectedContrato && (
  <FilterToolbar
    active={!!busca || !!periodo?.from || Object.values(filtros).some(a => a?.length > 0)}
    onClearAll={() => { setBusca(""); setPeriodo(null); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
  >
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <input
        className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
        placeholder="Buscar por objeto ou fornecedor..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />
    </div>
    <FilterBar
      key={filterKey}
      storageKey={FILTROS_KEY}
      filters={[
        { key: "status", label: "Status", options: ["A iniciar", "Em andamento", "Concluído", "Paralisado"] },
        { key: "tipo",   label: "Tipo",   options: tipoOptions },
      ]}
      onChange={setFiltros}
    />
    <DateRangePicker
      label="Data Início"
      value={periodo}
      onChange={setPeriodo}
      onClear={() => setPeriodo(null)}
    />
  </FilterToolbar>
)}
```

- [ ] **Passo 6: Passar `filteredContratos` em vez de `contratos` para `ContratosList`**

Localizar:
```jsx
<ContratosList
  contratos={contratos}
  isLoading={loadingContratos}
```
Alterar para:
```jsx
<ContratosList
  contratos={filteredContratos}
  isLoading={loadingContratos}
```

- [ ] **Passo 7: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Passo 8: Commit**

```bash
git add src/pages/Contratos.jsx
git commit -m "feat: Contratos — adicionar FilterToolbar completo com search, FilterBar e DateRangePicker"
```

---

## Task 7 — Pleitos: FilterToolbar completo do zero

**Files:**
- Modify: `src/pages/AdminContratual/Pleitos.jsx`

> **Nota arquitetural:** `PleitosList.jsx` recebe `casos` como prop — o filtro vai em `Pleitos.jsx` (a página), que passa `filteredCasos` para `PleitosList`. Não alterar `PleitosList.jsx`.

- [ ] **Passo 1: Atualizar import do React para incluir `useMemo`**

Linha 1, de:
```js
import { useState } from "react";
```
Para:
```js
import { useState, useMemo } from "react";
```

- [ ] **Passo 2: Adicionar imports de filtros após `import { useToast } from "@/components/ui/use-toast";` (~linha 14)**

```js
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { Search } from "lucide-react";
```
> Adicionar `Search` ao import lucide-react existente (linha 3): `import { Plus, FileText, Upload, AlertTriangle, Search } from "lucide-react";`

- [ ] **Passo 3: Adicionar estados e constante após `const [selectedPleito, setSelectedPleito] = useState(null);` (~linha 34)**

```js
const [busca, setBusca] = useState("");
const [filtros, setFiltros] = useState({});
const [periodo, setPeriodo] = useState(null);
const [filterKey, setFilterKey] = useState(0);
const FILTROS_KEY = "pleitos-filtros";
```

- [ ] **Passo 4: Adicionar `statusOptions` e `filteredCasos` useMemos após a query de pleitos (~linha 40)**

```js
const statusOptions = useMemo(
  () => [...new Set(casos.map(c => c.status).filter(Boolean))].sort(),
  [casos]
);

const filteredCasos = useMemo(() => {
  let r = casos;
  if (busca) {
    const b = busca.toLowerCase();
    r = r.filter(p => p.titulo?.toLowerCase().includes(b) || p.descricao_problema?.toLowerCase().includes(b));
  }
  if (filtros.status?.length)    r = r.filter(p => filtros.status.includes(p.status));
  if (filtros.prioridade?.length) r = r.filter(p => filtros.prioridade.includes(p.prioridade));
  if (periodo?.from) {
    const fromStr = periodo.from.toISOString().split("T")[0];
    r = r.filter(p => p.data_abertura && p.data_abertura >= fromStr);
  }
  if (periodo?.to) {
    const toStr = periodo.to.toISOString().split("T")[0];
    r = r.filter(p => p.data_abertura && p.data_abertura <= toStr);
  }
  return r;
}, [casos, busca, filtros, periodo]);
```

- [ ] **Passo 5: Adicionar `FilterToolbar` no render, antes do `PleitosList` (dentro de `<div className="max-w-7xl mx-auto space-y-4">`)**

Localizar a linha com `<PleitosList casos={casos} isLoading={isLoading} onSelect={setSelectedPleito} />` e substituir por:
```jsx
<FilterToolbar
  active={!!busca || !!periodo?.from || Object.values(filtros).some(a => a?.length > 0)}
  onClearAll={() => { setBusca(""); setPeriodo(null); setFiltros({}); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
>
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
      placeholder="Buscar por título..."
      value={busca}
      onChange={e => setBusca(e.target.value)}
    />
  </div>
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status",    label: "Status",    options: statusOptions },
      { key: "prioridade", label: "Prioridade", options: ["Baixa", "Média", "Alta", "Crítica"] },
    ]}
    onChange={setFiltros}
  />
  <DateRangePicker
    label="Data Abertura"
    value={periodo}
    onChange={setPeriodo}
    onClear={() => setPeriodo(null)}
  />
</FilterToolbar>

<PleitosList casos={filteredCasos} isLoading={isLoading} onSelect={setSelectedPleito} />
```

- [ ] **Passo 6: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Passo 7: Commit final**

```bash
git add src/pages/AdminContratual/Pleitos.jsx
git commit -m "feat: Pleitos — adicionar FilterToolbar completo com search, FilterBar e DateRangePicker"
```

---

## Critérios de Aceite

- [ ] Todos os 7 módulos listados usam `FilterToolbar` como wrapper de filtros
- [ ] Nenhum `<select>` nativo ou `<input>` solto fora de `FilterToolbar` para filtros
- [ ] Botão "X" de limpar tudo funciona em todos os módulos
- [ ] `active` reflete corretamente o estado de filtro em todos os módulos
- [ ] `localStorage` persiste filtros em todos os módulos com `FilterBar` (`npm run build` sem erros)
