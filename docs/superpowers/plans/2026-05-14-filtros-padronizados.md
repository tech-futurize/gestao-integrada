# Filtros Padronizados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o componente `FilterBar` declarativo e integrá-lo em todos os módulos que possuem filtros de campo discreto, padronizando a UX para: dropdown com busca, multiselect com checkboxes, "Selecionar todos", badge numérico e chips de valores ativos persistidos no `localStorage`.

**Architecture:** Hook `usePersistedFilters` gerencia estado + localStorage por chave de módulo. Componente `MultiSelectDropdown` renderiza o dropdown atômico (botão-trigger + popover com busca + checkboxes). Componente `FilterBar` orquestra N dropdowns, renderiza chips abaixo e chama `onChange` com o estado completo. Cada módulo passa um array de config e recebe o objeto de filtros via `onChange` para filtrar com `useMemo`.

**Tech Stack:** React 18, Radix UI Popover + Checkbox (já disponíveis via shadcn/ui), Tailwind CSS, `localStorage` nativo. Sem nova dependência.

> **Nota sobre testes:** O projeto não possui framework de testes configurado. A verificação de cada task é feita executando `npm run dev` e interagindo com a UI no browser.

> **RDO excluído:** `RDOModule.jsx` tem apenas busca por texto + range de data — nenhum campo discreto para converter em multiselect. Mantém filtros atuais sem alteração.

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `src/hooks/usePersistedFilters.js` | Estado de filtros + persistência localStorage |
| Criar | `src/components/ui/MultiSelectDropdown.jsx` | Botão-trigger + popover com busca + checkboxes |
| Criar | `src/components/ui/FilterBar.jsx` | Orquestrador: N dropdowns + chips + "Limpar tudo" |
| Modificar | `src/pages/RiscosMudancas/GestaoRiscos.jsx` | Integração FilterBar (Status, Categoria) |
| Modificar | `src/pages/RiscosMudancas/GestaoMudancas.jsx` | Integração FilterBar (Status, Origem) |
| Modificar | `src/pages/AdminContratual/Registros.jsx` | Integração FilterBar (Tipo, Status) |
| Modificar | `src/components/histograma/HistogramaEquipamentos.jsx` | Integração FilterBar (Tipo de Equipamento) |
| Modificar | `src/components/suprimentos/MapaSuprimentos.jsx` | Integração FilterBar (Status, Etapa) |
| Modificar | `src/pages/Engenharia/Documentos.jsx` | Integração FilterBar (Disciplina, Fornecedor) |
| Modificar | `src/pages/AdminContratual/Medicoes.jsx` | Integração FilterBar (Status) |

---

## Task 1: Hook `usePersistedFilters`

**Files:**
- Create: `src/hooks/usePersistedFilters.js`

- [ ] **Step 1: Criar o hook**

```js
// src/hooks/usePersistedFilters.js
import { useState } from "react";

export default function usePersistedFilters(storageKey, filterKeys) {
  const [selected, setSelected] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const initial = {};
      filterKeys.forEach(key => {
        initial[key] = Array.isArray(saved[key]) ? saved[key] : [];
      });
      return initial;
    } catch {
      return Object.fromEntries(filterKeys.map(k => [k, []]));
    }
  });

  const setFieldValues = (key, values) => {
    setSelected(prev => {
      const next = { ...prev, [key]: values };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const clearAll = () => {
    const empty = Object.fromEntries(filterKeys.map(k => [k, []]));
    setSelected(empty);
    localStorage.removeItem(storageKey);
  };

  return [selected, setFieldValues, clearAll];
}
```

- [ ] **Step 2: Verificar que o arquivo foi criado corretamente**

```bash
cat src/hooks/usePersistedFilters.js
```

Esperado: conteúdo do hook sem erros de sintaxe.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePersistedFilters.js
git commit -m "feat: criar hook usePersistedFilters para estado de filtros com localStorage"
```

---

## Task 2: Componente `MultiSelectDropdown`

**Files:**
- Create: `src/components/ui/MultiSelectDropdown.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
// src/components/ui/MultiSelectDropdown.jsx
import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiSelectDropdown({ label, options = [], selected = [], onChange, placeholder = "Pesquisar..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const allSelected = filteredOptions.length > 0 && filteredOptions.every(o => selected.includes(o));

  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter(s => !filteredOptions.includes(s)));
    } else {
      onChange([...new Set([...selected, ...filteredOptions])]);
    }
  };

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={v => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-sm font-normal",
            selected.length > 0 && "border-primary text-primary bg-primary/5"
          )}
        >
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-primary text-primary-foreground px-1.5 text-xs font-bold leading-4">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder={placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-7 text-sm mb-2"
        />
        <div
          className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted cursor-pointer"
          onClick={toggleAll}
        >
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            id={`${label}-all`}
          />
          <label htmlFor={`${label}-all`} className="text-sm cursor-pointer select-none font-medium">
            Selecionar todos
          </label>
        </div>
        <div className="my-1 border-t border-border" />
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filteredOptions.map(option => (
            <div
              key={option}
              className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted cursor-pointer"
              onClick={() => toggle(option)}
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => toggle(option)}
                id={`${label}-${option}`}
              />
              <label htmlFor={`${label}-${option}`} className="text-sm cursor-pointer select-none">
                {option}
              </label>
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2 text-center">Nenhum resultado</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Iniciar o servidor de desenvolvimento e verificar que não há erros de compilação**

```bash
npm run dev
```

Esperado: servidor sobe sem erros. Nenhum módulo pode ser verificado ainda (componente não está integrado).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/MultiSelectDropdown.jsx
git commit -m "feat: criar componente MultiSelectDropdown com busca e checkboxes"
```

---

## Task 3: Componente `FilterBar`

**Files:**
- Create: `src/components/ui/FilterBar.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
// src/components/ui/FilterBar.jsx
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import usePersistedFilters from "@/hooks/usePersistedFilters";

export default function FilterBar({ storageKey, filters = [], onChange }) {
  const filterKeys = filters.map(f => f.key);
  const [selected, setFieldValues, clearAll] = usePersistedFilters(storageKey, filterKeys);

  // Reporta estado inicial persistido ao pai na primeira montagem
  useEffect(() => {
    onChange(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key, values) => {
    setFieldValues(key, values);
    onChange({ ...selected, [key]: values });
  };

  const handleClearAll = () => {
    clearAll();
    onChange(Object.fromEntries(filterKeys.map(k => [k, []])));
  };

  const removeChip = (key, value) => {
    const next = (selected[key] || []).filter(v => v !== value);
    setFieldValues(key, next);
    onChange({ ...selected, [key]: next });
  };

  const hasActive = filterKeys.some(k => (selected[k] || []).length > 0);

  const chips = filterKeys.flatMap(key =>
    (selected[key] || []).map(value => ({
      key,
      value,
      filterLabel: filters.find(f => f.key === key)?.label || key,
    }))
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <MultiSelectDropdown
            key={f.key}
            label={f.label}
            options={f.options}
            selected={selected[f.key] || []}
            onChange={values => handleChange(f.key, values)}
          />
        ))}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground gap-1 hover:text-foreground"
            onClick={handleClearAll}
          >
            <X className="w-3 h-3" /> Limpar tudo
          </Button>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {chips.map(({ key, value }) => (
            <span
              key={`${key}-${value}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
            >
              {value}
              <button
                onClick={() => removeChip(key, value)}
                className="hover:text-primary/60 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npm run dev
```

Esperado: servidor sobe sem erros de importação.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/FilterBar.jsx
git commit -m "feat: criar componente FilterBar declarativo com chips e persistência"
```

---

## Task 4: Integração — GestaoRiscos

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

Contexto: O arquivo tem `filtroStatus` e `filtroCategoria` como `useState("")` e usa `<Select>` do shadcn. O `filtered` useMemo usa `filtroStatus` e `filtroCategoria` diretamente.

- [ ] **Step 1: Adicionar import do FilterBar e remover imports não mais necessários**

No topo do arquivo, localizar a linha de imports. Adicionar:
```jsx
import FilterBar from "@/components/ui/FilterBar";
```

Remover da linha de imports do shadcn/ui os itens `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` **somente se não forem usados em mais nenhum outro lugar do arquivo** (verificar: o formulário de criação/edição usa Select? Sim, usa para `categoria`, `probabilidade`, `impacto`, `status`). Portanto, **manter** o import de Select — ele ainda é usado no formulário.

- [ ] **Step 2: Substituir os dois `useState` de filtro por um único estado e inicialização do localStorage**

Localizar (linhas ~68-69):
```jsx
const [filtroStatus, setFiltroStatus] = useState("");
const [filtroCategoria, setFiltroCategoria] = useState("");
```

Substituir por:
```jsx
const [filtros, setFiltros] = useState({});
```

- [ ] **Step 3: Atualizar o `filtered` useMemo**

Localizar (linhas ~103-108):
```jsx
const filtered = useMemo(() => {
  let r = riscos;
  if (filtroStatus) r = r.filter(x => x.status === filtroStatus);
  if (filtroCategoria) r = r.filter(x => x.categoria === filtroCategoria);
  return r.sort((a, b) => (b.score || b.probabilidade * b.impacto || 0) - (a.score || a.probabilidade * a.impacto || 0));
}, [riscos, filtroStatus, filtroCategoria]);
```

Substituir por:
```jsx
const filtered = useMemo(() => {
  const st = filtros.status || [];
  const cat = filtros.categoria || [];
  let r = riscos;
  if (st.length > 0) r = r.filter(x => st.includes(x.status));
  if (cat.length > 0) r = r.filter(x => cat.includes(x.categoria));
  return r.sort((a, b) => (b.score || b.probabilidade * b.impacto || 0) - (a.score || a.probabilidade * a.impacto || 0));
}, [riscos, filtros]);
```

- [ ] **Step 4: Substituir os `<Select>` de filtro no JSX pelo `<FilterBar>`**

Procurar no JSX a seção de filtros. Atualmente há dois `<Select>` para Status e Categoria na toolbar. Substituir toda essa seção por:

```jsx
<FilterBar
  storageKey="riscos-filtros"
  filters={[
    { key: "status", label: "Status", options: STATUS_OPTIONS },
    { key: "categoria", label: "Categoria", options: CATEGORIAS },
  ]}
  onChange={setFiltros}
/>
```

> `STATUS_OPTIONS = ["Ativo", "Mitigado", "Encerrado"]` e `CATEGORIAS = [...]` já estão definidas como constantes no topo do arquivo.

- [ ] **Step 5: Verificar no browser**

```bash
npm run dev
```

Abrir `/riscos-mudancas/gestao-riscos`. Verificar:
- Botões "Status" e "Categoria" aparecem na toolbar
- Clicar em "Status" abre dropdown com busca e checkboxes
- "Selecionar todos" marca/desmarca todas as opções
- Badge numérico aparece no botão ao selecionar
- Chips aparecem abaixo com ✕ funcional
- "Limpar tudo" remove todos os chips
- Recarregar a página preserva os filtros selecionados

- [ ] **Step 6: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "feat: padronizar filtros de GestaoRiscos com FilterBar"
```

---

## Task 5: Integração — GestaoMudancas

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx`

Contexto: O arquivo usa `filtroStatus` e `filtroOrigem` como `useState("")`. Os filtros são renderizados como `<select>` HTML nativo (não shadcn). O `filtered` useMemo usa esses dois estados.

- [ ] **Step 1: Adicionar import do FilterBar**

```jsx
import FilterBar from "@/components/ui/FilterBar";
```

- [ ] **Step 2: Substituir os dois `useState` de filtro**

Localizar (linhas ~39-40):
```jsx
const [filtroStatus, setFiltroStatus] = useState("");
const [filtroOrigem, setFiltroOrigem] = useState("");
```

Substituir por:
```jsx
const [filtros, setFiltros] = useState({});
```

- [ ] **Step 3: Atualizar o `filtered` useMemo**

Localizar (linhas ~74-79):
```jsx
const filtered = useMemo(() => {
  let r = mudancas;
  if (filtroStatus) r = r.filter(m => m.status === filtroStatus);
  if (filtroOrigem) r = r.filter(m => m.origem === filtroOrigem);
  return r;
}, [mudancas, filtroStatus, filtroOrigem]);
```

Substituir por:
```jsx
const filtered = useMemo(() => {
  const st = filtros.status || [];
  const or = filtros.origem || [];
  let r = mudancas;
  if (st.length > 0) r = r.filter(m => st.includes(m.status));
  if (or.length > 0) r = r.filter(m => or.includes(m.origem));
  return r;
}, [mudancas, filtros]);
```

- [ ] **Step 4: Substituir os `<select>` HTML pelo `<FilterBar>` no JSX**

Localizar a seção de filtros (linhas ~113-128):
```jsx
<div className="flex flex-wrap gap-3">
  <select className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
    ...
  </select>
  <select className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground" value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)}>
    ...
  </select>
  {(filtroStatus || filtroOrigem) && (
    <button ... onClick={() => { setFiltroStatus(""); setFiltroOrigem(""); }}>
      <X className="w-3 h-3" /> Limpar
    </button>
  )}
</div>
```

Substituir por:
```jsx
<FilterBar
  storageKey="mudancas-filtros"
  filters={[
    { key: "status", label: "Status", options: STATUS_OPTIONS },
    { key: "origem", label: "Origem", options: ["Contratada", "Contratante"] },
  ]}
  onChange={setFiltros}
/>
```

> `STATUS_OPTIONS` já está definida no arquivo. Verificar o nome exato da constante.

- [ ] **Step 5: Remover import do `X` de lucide-react se não for mais usado em outro lugar do arquivo**

Verificar se `X` é usado em outro ponto do JSX. Se não, remover do import.

- [ ] **Step 6: Verificar no browser**

Abrir `/riscos-mudancas/gestao-mudancas`. Verificar comportamento completo do FilterBar (mesma checklist da Task 4 Step 5).

- [ ] **Step 7: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoMudancas.jsx
git commit -m "feat: padronizar filtros de GestaoMudancas com FilterBar"
```

---

## Task 6: Integração — Registros

**Files:**
- Modify: `src/pages/AdminContratual/Registros.jsx`

Contexto: Tem `filterTipo` e `filterStatus` como `useState("Todos")`. Os filtros usam `<Select>` do shadcn. O `filtered` useMemo compara com string `"Todos"` ou valor exato. O `searchText` (busca de texto) deve ser mantido como `<Input>` separado.

- [ ] **Step 1: Adicionar import do FilterBar**

```jsx
import FilterBar from "@/components/ui/FilterBar";
```

- [ ] **Step 2: Substituir os dois `useState` de filtro categórico**

Localizar (linhas ~38-39):
```jsx
const [filterTipo, setFilterTipo] = useState("Todos");
const [filterStatus, setFilterStatus] = useState("Todos");
```

Substituir por:
```jsx
const [filtros, setFiltros] = useState({});
```

Manter `searchText` e `setSearchText` intactos.

- [ ] **Step 3: Atualizar o `filtered` useMemo**

Localizar (linhas ~84-96):
```jsx
const filtered = useMemo(() => {
  return baseList.filter((inc) => {
    const matchTipo = filterTipo === "Todos" || inc.tipo_registro === filterTipo;
    const matchStatus = filterStatus === "Todos" || inc.status === filterStatus;
    const needle = searchText.toLowerCase();
    const matchText =
      !needle ||
      (inc.descricao || "").toLowerCase().includes(needle) ||
      (inc.tipo_registro || "").toLowerCase().includes(needle) ||
      (inc.responsavel_registro || "").toLowerCase().includes(needle);
    return matchTipo && matchStatus && matchText;
  });
}, [baseList, filterTipo, filterStatus, searchText]);
```

Substituir por:
```jsx
const filtered = useMemo(() => {
  const tp = filtros.tipo || [];
  const st = filtros.status || [];
  return baseList.filter((inc) => {
    if (tp.length > 0 && !tp.includes(inc.tipo_registro)) return false;
    if (st.length > 0 && !st.includes(inc.status)) return false;
    const needle = searchText.toLowerCase();
    if (needle) {
      const matchText =
        (inc.descricao || "").toLowerCase().includes(needle) ||
        (inc.tipo_registro || "").toLowerCase().includes(needle) ||
        (inc.responsavel_registro || "").toLowerCase().includes(needle);
      if (!matchText) return false;
    }
    return true;
  });
}, [baseList, filtros, searchText]);
```

- [ ] **Step 4: Substituir os `<Select>` de filtro no JSX pelo `<FilterBar>`**

Localizar a seção de filtros (linhas ~159-192). A estrutura atual é:
```jsx
<div className="flex flex-col sm:flex-row gap-3">
  <div className="relative flex-1">
    <Search ... />
    <Input ... value={searchText} onChange={...} />
  </div>
  <Select value={filterTipo} onValueChange={setFilterTipo}>...</Select>
  <Select value={filterStatus} onValueChange={setFilterStatus}>...</Select>
</div>
```

Substituir por (mantendo o Input de busca):
```jsx
<div className="flex flex-col gap-3">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      className="pl-9"
      placeholder="Buscar por descrição, tipo ou responsável..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />
  </div>
  <FilterBar
    storageKey="registros-filtros"
    filters={[
      { key: "tipo", label: "Tipo", options: ["Ata de Reunião", "E-mail", "Notificação"] },
      { key: "status", label: "Status", options: ["Registrado", "Em Análise", "Resolvido"] },
    ]}
    onChange={setFiltros}
  />
</div>
```

- [ ] **Step 5: Verificar se `Select` ainda é usado no formulário de criação/edição**

Fazer `grep -n "SelectTrigger\|SelectContent\|SelectItem" src/pages/AdminContratual/Registros.jsx`. Se o formulário de incidente usar esses componentes, manter o import. Se não, remover.

- [ ] **Step 6: Verificar no browser**

Abrir `/admin-contratual/registros`. Verificar FilterBar funcionando + busca por texto mantida + filtros combinados funcionam.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminContratual/Registros.jsx
git commit -m "feat: padronizar filtros de Registros com FilterBar"
```

---

## Task 7: Integração — HistogramaEquipamentos

**Files:**
- Modify: `src/components/histograma/HistogramaEquipamentos.jsx`

Contexto: Tem `filtroTipo` como `useState("__none__")` e usa `<Select>` do shadcn posicionado dentro do `<CardHeader>`. O filtro usa `===` contra string. O chart abaixo usa `sorted` que depende de `filtroTipo`.

- [ ] **Step 1: Adicionar import do FilterBar**

```jsx
import FilterBar from "@/components/ui/FilterBar";
```

- [ ] **Step 2: Substituir o `useState` de filtro**

Localizar (linha ~36):
```jsx
const [filtroTipo, setFiltroTipo] = useState("__none__");
```

Substituir por:
```jsx
const [filtros, setFiltros] = useState({});
```

- [ ] **Step 3: Atualizar a lógica de filtragem no `sorted`**

Localizar (linhas ~44-47):
```jsx
const sorted = [...histogramas]
  .filter(h => h.tipo_equipamento)
  .filter(h => filtroTipo === "__none__" || h.tipo_equipamento === filtroTipo)
  .sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
```

Substituir por:
```jsx
const tp = filtros.tipo || [];
const sorted = [...histogramas]
  .filter(h => h.tipo_equipamento)
  .filter(h => tp.length === 0 || tp.includes(h.tipo_equipamento))
  .sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
```

- [ ] **Step 4: Substituir o `<Select>` no JSX pelo `<FilterBar>`**

Localizar no JSX dentro do `<CardHeader>` (linhas ~82-93):
```jsx
<div className="flex items-center justify-between">
  <CardTitle ...>...</CardTitle>
  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
    <SelectTrigger className="w-60"><SelectValue placeholder="Filtrar por equipamento" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">Todos os equipamentos</SelectItem>
      {TIPOS_EQUIPAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
    </SelectContent>
  </Select>
</div>
```

Substituir por:
```jsx
<div className="flex items-center justify-between flex-wrap gap-2">
  <CardTitle className="flex items-center gap-2">
    <BarChart3 className="w-5 h-5 text-ocre" />
    Histograma de Equipamentos
  </CardTitle>
  <FilterBar
    storageKey="histograma-filtros"
    filters={[
      { key: "tipo", label: "Equipamento", options: TIPOS_EQUIPAMENTO },
    ]}
    onChange={setFiltros}
  />
</div>
```

- [ ] **Step 5: Remover imports de Select não mais usados**

Verificar se `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` são usados em outro lugar no arquivo. Se não, remover do import.

- [ ] **Step 6: Verificar no browser**

Navegar até o módulo Histograma. Verificar que o FilterBar aparece no cabeçalho do card, o dropdown lista os tipos de equipamento, o gráfico filtra ao selecionar.

- [ ] **Step 7: Commit**

```bash
git add src/components/histograma/HistogramaEquipamentos.jsx
git commit -m "feat: padronizar filtros de HistogramaEquipamentos com FilterBar"
```

---

## Task 8: Integração — MapaSuprimentos

**Files:**
- Modify: `src/components/suprimentos/MapaSuprimentos.jsx`

Contexto: Tem `filtroSC` (texto), `filtroStatus`, `filtroEtapa`, `filtroSolicitante` (texto), `filtroAlerta` (lógica customizada). Apenas `filtroStatus` e `filtroEtapa` viram FilterBar. Os demais (texto e alerta) permanecem como estão.

- [ ] **Step 1: Adicionar import do FilterBar**

```jsx
import FilterBar from "@/components/ui/FilterBar";
```

- [ ] **Step 2: Substituir os `useState` de filtro categórico**

Localizar (linhas ~139-140):
```jsx
const [filtroStatus, setFiltroStatus] = useState("");
const [filtroEtapa, setFiltroEtapa] = useState("");
```

Substituir por:
```jsx
const [filtros, setFiltros] = useState({});
```

Manter intactos: `filtroSC`, `setFiltroSC`, `filtroSolicitante`, `setFiltroSolicitante`, `filtroAlerta`, `setFiltroAlerta`.

- [ ] **Step 3: Atualizar a lógica de filtragem**

Localizar o bloco (linhas ~177-194):
```js
let filtered = [...itens];
if (filtroSC) filtered = filtered.filter(i => i.numero_sc?.toLowerCase().includes(filtroSC.toLowerCase()));
if (filtroStatus) filtered = filtered.filter(i => i.status === filtroStatus);
if (filtroEtapa) filtered = filtered.filter(i => {
  const idx = ETAPAS.findIndex(e => e.label === filtroEtapa);
  if (idx < 0) return true;
  return (i.etapas?.[idx]?.status === "em_andamento" || i.etapas?.[idx]?.status === "concluida");
});
if (filtroSolicitante) filtered = filtered.filter(i => i.solicitante?.toLowerCase().includes(filtroSolicitante.toLowerCase()));
if (filtroAlerta === "atrasado") { ... }
if (filtroAlerta === "cancelado_aquisicao") { ... }
```

Substituir as linhas de `filtroStatus` e `filtroEtapa` mantendo as demais:
```js
let filtered = [...itens];
if (filtroSC) filtered = filtered.filter(i => i.numero_sc?.toLowerCase().includes(filtroSC.toLowerCase()));
const st = filtros.status || [];
if (st.length > 0) filtered = filtered.filter(i => st.includes(i.status));
const etps = filtros.etapa || [];
if (etps.length > 0) {
  filtered = filtered.filter(i =>
    etps.some(label => {
      const idx = ETAPAS.findIndex(e => e.label === label);
      if (idx < 0) return false;
      return (i.etapas?.[idx]?.status === "em_andamento" || i.etapas?.[idx]?.status === "concluida");
    })
  );
}
if (filtroSolicitante) filtered = filtered.filter(i => i.solicitante?.toLowerCase().includes(filtroSolicitante.toLowerCase()));
if (filtroAlerta === "atrasado") {
  filtered = filtered.filter(i => {
    const fornData = i.etapas?.[6]?.data;
    return fornData && fornData > (i.data_necessidade || "9999") && i.status !== "Concluído";
  });
}
if (filtroAlerta === "cancelado_aquisicao") {
  filtered = filtered.filter(i =>
    i.status === "Cancelado" &&
    (i.etapas?.[3]?.status === "em_andamento" || i.etapas?.[3]?.status === "concluida")
  );
}
```

- [ ] **Step 4: Substituir os selects de Status e Etapa no JSX pelo `<FilterBar>`**

Localizar no JSX a seção de filtros onde aparecem os selects de Status e Etapa. Manter os inputs de `filtroSC`, `filtroSolicitante` e o select de `filtroAlerta`. Inserir o `<FilterBar>` ao lado deles:

```jsx
<FilterBar
  storageKey="suprimentos-filtros"
  filters={[
    { key: "status", label: "Status", options: ["A iniciar", "Em andamento", "Concluído", "Cancelado"] },
    { key: "etapa", label: "Etapa", options: ETAPAS.map(e => e.label) },
  ]}
  onChange={setFiltros}
/>
```

- [ ] **Step 5: Verificar no browser**

Navegar até Suprimentos / Mapa. Verificar que os filtros Status e Etapa funcionam como FilterBar, os inputs de texto SC e Solicitante continuam funcionando, e o filtro de alerta customizado também permanece.

- [ ] **Step 6: Commit**

```bash
git add src/components/suprimentos/MapaSuprimentos.jsx
git commit -m "feat: padronizar filtros de MapaSuprimentos com FilterBar"
```

---

## Task 9: Integração — Documentos (Engenharia)

**Files:**
- Modify: `src/pages/Engenharia/Documentos.jsx`

Contexto: Tem `filtroDisciplina` e `filtroFornecedor` como `useState("")`. O `filtroFornecedor` é dinâmico — derivado dos dados carregados. O `busca` (texto) permanece como `<Input>`. O `sortCol` e `sortDir` são controles de ordenação, não filtros — permanecem intactos.

- [ ] **Step 1: Adicionar import do FilterBar**

```jsx
import FilterBar from "@/components/ui/FilterBar";
```

- [ ] **Step 2: Substituir os dois `useState` de filtro**

Localizar (linhas ~108-110):
```jsx
const [filtroDisciplina, setFiltroDisciplina] = useState("");
const [filtroFornecedor, setFiltroFornecedor] = useState("");
```

Substituir por:
```jsx
const [filtros, setFiltros] = useState({});
```

- [ ] **Step 3: Derivar opções de fornecedor dos dados**

Após o `useQuery` de `docs`, adicionar:
```jsx
const fornecedorOptions = useMemo(
  () => [...new Set(docs.map(d => d.fornecedor).filter(Boolean))].sort(),
  [docs]
);
```

- [ ] **Step 4: Atualizar o `useMemo` de filtragem/paginação**

Localizar o `useMemo` que usa `filtroDisciplina` e `filtroFornecedor`. Atualizar para usar `filtros`:

```jsx
// Dentro do useMemo de filtragem existente, substituir:
// if (filtroDisciplina) docs filtrados
// if (filtroFornecedor) docs filtrados
// Por:
const disc = filtros.disciplina || [];
const forn = filtros.fornecedor || [];
// ...no filter chain:
if (disc.length > 0 && !disc.includes(d.disciplina)) return false;
if (forn.length > 0 && !forn.includes(d.fornecedor)) return false;
```

> Localizar exatamente o `useMemo` que filtra os docs e substituir as condições de `filtroDisciplina`/`filtroFornecedor` por `disc.length`/`forn.length` com `includes`.

- [ ] **Step 5: Substituir os renders de filtro no JSX pelo `<FilterBar>`**

Localizar no JSX os `<Select>` de Disciplina e Fornecedor (linhas ~347-354). Substituir por:

```jsx
<FilterBar
  storageKey="documentos-filtros"
  filters={[
    { key: "disciplina", label: "Disciplina", options: ["MEC", "CIV", "ELE", "TUB", "INS", "AUT", "EST", "PRC", "HSE"] },
    { key: "fornecedor", label: "Fornecedor", options: fornecedorOptions },
  ]}
  onChange={setFiltros}
/>
```

Manter o `<Input>` de `busca` separado.

- [ ] **Step 6: Remover imports de Select não mais usados**

Verificar se `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` ainda são usados em algum outro lugar do arquivo (ex: formulário de criação). Se não, remover do import.

- [ ] **Step 7: Verificar no browser**

Navegar até Engenharia / Documentos. Verificar FilterBar com Disciplina e Fornecedor, busca por texto ainda funciona, ordenação por coluna mantida, paginação mantida.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Engenharia/Documentos.jsx
git commit -m "feat: padronizar filtros de Documentos com FilterBar"
```

---

## Task 10: Integração — Medições

**Files:**
- Modify: `src/pages/AdminContratual/Medicoes.jsx`

Contexto: A página `Medicoes.jsx` não tem filtros hoje — passa todas as `medicoes` para `<MedicoesList>`. O componente `MedicoesList` tem um `<Select>` **inline em cada card** para atualizar status individualmente (isso NÃO é um filtro — deve ser mantido intacto). A tarefa é adicionar um `<FilterBar>` na página `Medicoes.jsx` para filtrar a lista antes de passar para `MedicoesList`.

- [ ] **Step 1: Adicionar imports em `Medicoes.jsx`**

```jsx
import { useState, useMemo } from "react";
import FilterBar from "@/components/ui/FilterBar";
```

> Verificar se `useState` e `useMemo` já estão importados. Se sim, não duplicar.

- [ ] **Step 2: Adicionar estado de filtros e lógica de filtragem**

Após a declaração de `useQuery` de medicoes, adicionar:

```jsx
const [filtros, setFiltros] = useState({});

const medicoesFiltradas = useMemo(() => {
  const st = filtros.status || [];
  if (st.length === 0) return medicoes;
  return medicoes.filter(m => st.includes(m.status));
}, [medicoes, filtros]);
```

- [ ] **Step 3: Adicionar `<FilterBar>` no JSX antes do `<MedicoesList>`**

Localizar no JSX o ponto antes de `<MedicoesList medicoes={medicoes} ...>`. Inserir acima:

```jsx
<FilterBar
  storageKey="medicoes-filtros"
  filters={[
    { key: "status", label: "Status", options: ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"] },
  ]}
  onChange={setFiltros}
/>
```

E atualizar o prop de `medicoes` para usar `medicoesFiltradas`:

```jsx
<MedicoesList medicoes={medicoesFiltradas} ... />
```

- [ ] **Step 4: Verificar no browser**

Navegar até AdminContratual / Medições. Verificar que o FilterBar aparece acima da lista, filtra corretamente por status, e o Select inline de atualização de status em cada card continua funcionando normalmente.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminContratual/Medicoes.jsx
git commit -m "feat: adicionar FilterBar de Status em Medicoes"
```

---

## Task 11: Verificação Final

- [ ] **Step 1: Iniciar o servidor e percorrer todos os módulos integrados**

```bash
npm run dev
```

Verificar cada módulo na ordem:
1. `/riscos-mudancas/gestao-riscos` — Status, Categoria
2. `/riscos-mudancas/gestao-mudancas` — Status, Origem
3. `/admin-contratual/registros` — Tipo, Status + busca de texto
4. Histograma de Equipamentos — Tipo de Equipamento
5. Suprimentos / Mapa — Status, Etapa + inputs de texto mantidos
6. Engenharia / Documentos — Disciplina, Fornecedor + busca de texto
7. Admin Contratual / Medições — Status

- [ ] **Step 2: Verificar persistência cross-navegação**

Em qualquer módulo: selecionar filtros → navegar para outro módulo → voltar → confirmar que os filtros foram restaurados.

- [ ] **Step 3: Verificar que não há `console.log` introduzido**

```bash
grep -rn "console.log" src/hooks/usePersistedFilters.js src/components/ui/MultiSelectDropdown.jsx src/components/ui/FilterBar.jsx
```

Esperado: nenhuma linha encontrada.

- [ ] **Step 4: Commit final de verificação**

```bash
git commit --allow-empty -m "chore: verificação final — padronização de filtros concluída"
```

---

## Critérios de Aceitação

- [ ] `MultiSelectDropdown` exibe busca em tempo real (case-insensitive)
- [ ] "Selecionar todos" marca tudo quando nem todos estão selecionados; desmarca tudo quando todos estão
- [ ] Badge numérico reflete número exato de seleções ativas
- [ ] Chips aparecem abaixo da toolbar com ✕ por item
- [ ] "Limpar tudo" aparece apenas quando há filtros ativos e zera corretamente
- [ ] Estado persiste no localStorage e é restaurado ao recarregar
- [ ] Inputs de texto livre (busca, SC, Solicitante) foram mantidos como `<Input>` separado
- [ ] Select inline de atualização de status em MedicoesList não foi alterado
- [ ] Controles de visualização do Cronograma não foram alterados
- [ ] Nenhum `console.log` nos arquivos novos
