# Design — 6WLA: Coluna DET + Filtros em Linha

**Data:** 2026-06-02  
**Arquivos afetados:**  
- `src/components/planejamento/SixWLATable.jsx`  
- `src/pages/Planejamento/SixWLA.jsx`

---

## Problema

A tabela 6WLA usa um botão toggle (expandir/recolher) para revelar colunas de Área, Disciplina e datas. O botão "Visualizar" fica no menu de ações à direita. O layout é verboso e o fluxo para ver detalhes de uma linha é lento. Os filtros de Disciplina e as pills de semana ficam em linhas separadas.

## Solução

### 1. Coluna DET em `SixWLATable.jsx`

**Remove:**
- Estado `showDetails` e botão toggle (ChevronRight/ChevronLeft) na 5ª coluna sticky esquerda
- Seção expansível com 8 colunas (Área, Disciplina, BL Ini, BL Fim, Real Ini, Real Fim, Proj Ini, Proj Fim)
- Estado `viewItem`, `DetailDialog` e prop `onView` no `RowActions`

**Adiciona:**
- Coluna sticky esquerda **"DET"** (44 px de largura), posicionada imediatamente após %Real
- Cada célula da coluna DET contém um `<Popover>` (Radix UI — já importado):
  - Trigger: botão com label "DET" (texto, 11 px, `text-muted-foreground hover:text-foreground`)
  - Conteúdo (`PopoverContent`, `side="right"`, `w-52`):
    - **Área:** valor ou "—"
    - **Disciplina:** valor ou "—"
    - Separador visual
    - **Datas** em grid de 2 colunas (label + valor):
      - BL Ini / BL Fim
      - Real Ini / Real Fim
      - Proj Ini / Proj Fim

**Ajustes colaterais:**
- `COL` object: remover `toggle: 24`, adicionar `det: 44`
- `L` object: renomear `toggle` → `det` (offset acumulado não muda, só o nome)
- `totalCols`: remover `detailColCount`; novo valor fixo `= 5 + restricoes.length + 2`
- Imports: remover `ChevronRight`, `ChevronLeft`, `DetailDialog`

### 2. Filtros em linha em `SixWLA.jsx`

**Remove:**
- `<div className="flex flex-wrap gap-2">` separado com as pills S1–S6 (bloco entre KPIs e FilterToolbar)

**Adiciona:**
- `areas` via `useMemo`: `[...new Set(merged.map(i => i.tarefa?.area).filter(Boolean))].sort()`
- Filtro de área na lógica `filtered`: `const areasFilter = filtros.area || []; if (areasFilter.length > 0) items = items.filter(i => areasFilter.includes(i.tarefa?.area))`
- `FilterBar` recebe 2 filtros: `[{ key: "disciplina", ... }, { key: "area", label: "Área", options: areas }]`
- Pills S1–S6 movidas para dentro de `<FilterToolbar>` como filhos adicionais (após o `<FilterBar>`)

**Layout resultante da linha de filtros:**
```
[🔍 Buscar...] [Disciplina ▾] [Área ▾] [S1] [S2] [S3] [S4] [S5] [S6]  [✕ Limpar]
```

O `active` e `onClearAll` do FilterToolbar já contemplam `semanasAtivas` — sem mudança necessária.

---

## Invariantes preservadas

- Sticky esquerda e direita: offsets calculados da mesma forma
- Checkbox de restrições (sticky direita): sem alteração
- Campo Obs com popover de edição: sem alteração
- Botão "Remover" no RowActions: sem alteração (apenas `onView` é removido)
- Auto-import silencioso, queries, mutations: sem alteração
- `FilterBar` com `storageKey` e `onChange`: sem alteração de interface

---

## Fora do escopo

- Filtro de área não persiste no `localStorage` (FilterBar usa `storageKey` para disciplina; área seguirá o mesmo padrão automaticamente via FilterBar)
- Nenhuma mudança de schema de banco
- Nenhuma mudança no export CSV
