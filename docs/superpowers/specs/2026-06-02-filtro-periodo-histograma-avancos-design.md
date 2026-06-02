# Design: Filtro de Período em Histograma e Avanços

**Data:** 2026-06-02  
**Status:** Aprovado  
**Escopo:** Adicionar DateRangePicker ao toolbar do Histograma e dos Painéis de Avanço; mover botão Importar/Exportar de Avanços para o header da página.

---

## Contexto

Histograma e Avanços exibem tabelas com colunas de tempo (meses ou semanas). Sem filtro de período, o usuário precisa fazer scroll horizontal por todo o projeto para focar em um intervalo específico. O cronograma já possui um `DateRangePicker` reutilizável (`/src/components/ui/DateRangePicker.jsx`) que será aproveitado.

---

## Comportamento do Filtro

- **O que filtra:** colunas de tempo visíveis na tabela e no gráfico (meses no Histograma; semanas ou meses nos Painéis de Avanço).
- **Quando vazio:** exibe todas as colunas do projeto (comportamento atual inalterado).
- **Quando preenchido:** exibe apenas colunas cujo período está dentro do intervalo `from`–`to` selecionado.
- **Granularidade:** inclusão por `startOfMonth` / `endOfMonth` no Histograma; por `startOfWeek` no Físico semanal.

---

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/components/histograma/HistogramaTabela.jsx` | Adiciona `periodFilter` state + `DateRangePicker` no toolbar; filtra array `meses` |
| `src/components/planejamento/AvancoFisicoPanel.jsx` | Remove `showImportExport` state/botão do toolbar; aceita `showImportExport`/`setShowImportExport` como props; adiciona `periodFilter` + `DateRangePicker` com `ml-auto` |
| `src/components/planejamento/AvancoFinanceiroPanel.jsx` | Idem ao Físico |
| `src/pages/Planejamento/Avancos.jsx` | Adiciona `showImportExport` state; Import/Export button em `PageHeader`; passa props a ambos os painéis |

---

## Layout dos Toolbars

### Histograma (`HistogramaTabela.jsx`)

```
Exibir: [Prev] [Real] [Proj] | [MOD] [MOI]    [📅 Período ▾] [+ Novo Função]
```

- `DateRangePicker` inserido imediatamente **antes** do botão "Novo Função/Equipamento".
- O botão "Novo" já tem `ml-auto`, empurrando ambos para a direita.

### Avanço Físico / Financeiro (cada Panel)

```
Exibir: [Prev] [Real] [Proj] | [Semanal] [Mensal]    [📅 Período ▾]
```

- `DateRangePicker` substitui a posição do antigo botão Import/Export, mantendo `ml-auto`.

### Header de Avanços (`Avancos.jsx`)

```
PageHeader                                   [↑ Importar / Exportar]
```

- Botão Import/Export passa para `PageHeader actions`, igual ao padrão de Histograma e TakeOff.

---

## Lógica de Filtragem

### Histograma

```js
const mesesFiltrados = useMemo(() => {
  if (!periodFilter) return meses;
  const from = startOfMonth(periodFilter.from);
  const to   = endOfMonth(periodFilter.to);
  return meses.filter(m => !isBefore(m, from) && !isAfter(m, to));
}, [meses, periodFilter]);
```

`mesesFiltrados` substitui `meses` em todos os usos de renderização (colunas da tabela e dados do gráfico).

### Avanços (Físico — modo semanal)

```js
const weeksFiltradas = useMemo(() => {
  if (!periodFilter) return projectWeeks;
  const from = startOfWeek(periodFilter.from, { weekStartsOn: 1 });
  const to   = periodFilter.to;
  return projectWeeks.filter(w => !isBefore(w, from) && !isAfter(w, to));
}, [projectWeeks, periodFilter]);
```

### Avanços (Físico/Financeiro — modo mensal)

```js
const monthsFiltrados = useMemo(() => {
  if (!periodFilter) return monthPeriods;
  const from = startOfMonth(periodFilter.from);
  const to   = endOfMonth(periodFilter.to);
  return monthPeriods.filter(m => !isBefore(m, from) && !isAfter(m, to));
}, [monthPeriods, periodFilter]);
```

`chartData` e os cards KPI são derivados dos períodos via `computeAvancoSeries(periods, ...)`, portanto o filtro afeta automaticamente o gráfico Curva S e os cards de KPI (os acumulados passam a refletir apenas o intervalo visível).

---

## Import/Export em Avanços — Estratégia de Props

O `ImportExportDialog` e toda a lógica (queries, `handleImport`, `EXPORT_COLUMNS`) **permanecem em cada panel** — evitando mover queries para a página. A página passa apenas o controle de abertura:

```jsx
// Avancos.jsx
const [showImportExport, setShowImportExport] = useState(false);

<PageHeader
  actions={
    <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
      <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
    </Button>
  }
/>

{activeTab === "fisico"
  ? <AvancoFisicoPanel showImportExport={showImportExport} setShowImportExport={setShowImportExport} />
  : <AvancoFinanceiroPanel showImportExport={showImportExport} setShowImportExport={setShowImportExport} />}
```

Cada panel usa `showImportExport` e `setShowImportExport` vindos das props no lugar do estado local.

---

## Componentes Não Alterados

- `DateRangePicker.jsx` — reutilizado sem modificações.
- `AvancoTabela.jsx` — recebe `periods` já filtrado; sem mudança interna.
- `CurvaSChart.jsx` — recebe `data` já filtrado; sem mudança interna.
- `Histograma.jsx` (página) — sem mudança (Import/Export já está no header).

---

## Fora de Escopo

- Persistência do filtro de período em localStorage (pode ser adicionado em task futura).
- Filtro de período na aba SixWLA ou TakeOff.
- Filtrar linhas/recursos com base no período (comportamento explicitamente descartado).
