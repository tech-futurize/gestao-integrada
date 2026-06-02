# Spec: Padronização de Filtros — Todos os Módulos

**Data:** 2026-06-02  
**Autor:** Agent_Designer (brainstorming session)  
**Status:** Aprovado pelo PO

---

## 1. Objetivo

Garantir que todas as páginas do sistema com dados filtráveis usem o mesmo padrão visual e estrutural de filtragem adotado na seção de Cronograma — `FilterToolbar` + `Search input` + `FilterBar` + `DateRangePicker` (quando aplicável).

---

## 2. Padrão de Referência (Cronograma)

```jsx
<FilterToolbar
  active={isFilterActive}   // boolean: true se qualquer filtro ativo
  onClearAll={handleClearAll}  // limpa busca + filtros + período + localStorage
>
  {/* 1. Search input */}
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <input
      className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
      placeholder="Buscar..."
      value={busca}
      onChange={e => setBusca(e.target.value)}
    />
  </div>

  {/* 2. FilterBar — multi-select por categoria */}
  <FilterBar
    key={filterKey}
    storageKey={FILTROS_KEY}
    filters={[
      { key: "status", label: "Status", options: [...] },
      { key: "tipo",   label: "Tipo",   options: [...] },
    ]}
    onChange={setFiltros}
  />

  {/* 3. DateRangePicker — quando datas são relevantes */}
  <DateRangePicker
    label="Período"
    value={periodo}
    onChange={setPeriodo}
    onClear={() => setPeriodo(null)}
  />

  {/* 4. Controles domain-specific (opcional) */}
</FilterToolbar>
```

**Receita de `isFilterActive`:**
```js
const isFilterActive =
  !!busca ||
  !!periodo?.from ||
  Object.values(filtros).some(a => a?.length > 0);
```

**Receita de `handleClearAll`:**
```js
const handleClearAll = () => {
  setBusca("");
  setPeriodo(null);
  setFiltros({});
  localStorage.removeItem(FILTROS_KEY);
  setFilterKey(k => k + 1);
};
```

---

## 3. Estado Atual e Mudanças por Módulo

### 3.1 Grupo 1 — Parciais (faltam peças)

#### Gestão de Riscos (`src/pages/RiscosMudancas/GestaoRiscos.jsx`)
- **Estado atual:** FilterToolbar + FilterBar (status, categoria)
- **Adicionar:** Search input — busca por `descricao`
- **DateRangePicker:** ❌ Não se aplica — o registro de risco não possui campo de data no schema atual
- **Placeholder:** `"Buscar por descrição..."`
- **`isFilterActive`:** adicionar `!!busca` à condição atual

#### Gestão de Mudanças (`src/pages/RiscosMudancas/GestaoMudancas.jsx`)
- **Estado atual:** FilterToolbar + FilterBar (status, origem)
- **Adicionar:** Search input (busca por `titulo`) + DateRangePicker em `data_ocorrencia`
- **Placeholder:** `"Buscar por título..."`
- **`isFilterActive`:** adicionar `!!busca || !!periodo?.from`
- **Lógica de filtro de data:**
  ```js
  if (periodo?.from) result = result.filter(m => m.data_ocorrencia >= fromStr);
  if (periodo?.to)   result = result.filter(m => m.data_ocorrencia <= toStr);
  ```

#### Medições (`src/pages/AdminContratual/Medicoes.jsx`)
- **Estado atual:** FilterToolbar + FilterBar (status)
- **Adicionar:** Search input (busca por `numero`) + DateRangePicker em `periodo_inicio`
- **Placeholder:** `"Buscar por número..."`
- **`isFilterActive`:** adicionar `!!busca || !!periodo?.from`
- **Lógica de filtro de data:**
  ```js
  if (periodo?.from) result = result.filter(m => m.periodo_inicio >= fromStr);
  if (periodo?.to)   result = result.filter(m => m.periodo_inicio <= toStr);
  ```
  > **Nota:** A filtragem ocorre em `Medicoes.jsx`, que atualmente passa `filteredMedicoes` para `MedicoesList`. Search + período seguem o mesmo padrão de filtro client-side.

#### RDO (`src/components/rdo/RDOModule.jsx`)
- **Estado atual:** FilterToolbar + Search + DateRangePicker
- **Adicionar:** FilterBar com filtro por `area` (opções dinâmicas derivadas dos RDOs do projeto)
- **Lógica de filtro:**
  ```js
  const areaOptions = useMemo(() => [...new Set(rdos.map(r => r.area).filter(Boolean))].sort(), [rdos]);
  // filtros.area = array de areas selecionadas
  if (filtros.area?.length > 0) result = result.filter(r => filtros.area.includes(r.area));
  ```
- **`isFilterActive`:** adicionar `Object.values(filtros).some(a => a?.length > 0)`
- **Storage key:** `"rdo-filtros"`

---

### 3.2 Grupo 2 — Construção do zero / wrapping

#### Take-Off (`src/components/planejamento/TakeOffCommodities.jsx`)
- **Estado atual:** search `<input>` solto + dois `<select>` nativos (Disciplina, Unidade) sem FilterToolbar
- **Mudanças:**
  1. Envolver os filtros em `FilterToolbar` (active + onClearAll)
  2. Converter `<select>` Disciplina → `FilterBar` com `{ key: "disciplina", label: "Disciplina", options: discOptions }`
  3. Converter `<select>` Unidade → `FilterBar` com `{ key: "unidade", label: "Unidade", options: unidadeOptions }`
  4. Adaptar lógica de filtro: `filtroDisciplina`/`filtroUnidade` (single) → arrays de seleção múltipla do FilterBar
- **DateRangePicker:** ❌ Não se aplica — Take-Off usa `semana_iso`, não datas livres
- **Storage key:** `"takeoff-filtros"`
- **`isFilterActive`:** `!!busca || Object.values(filtros).some(a => a?.length > 0)`

#### Contratos (`src/pages/Contratos.jsx` + `src/components/contratos/ContratosList.jsx`)
- **Estado atual:** sem filtros
- **Onde implementar:** o estado de filtros fica em `Contratos.jsx` (já tem todos os dados); `ContratosList` recebe `contratos` já filtrados como prop (sem alteração de interface)
- **Adicionar em `Contratos.jsx`:**
  - `FilterToolbar` + Search (busca por `objeto` e `fornecedor`) + FilterBar (status, tipo) + DateRangePicker em `data_inicio`
- **Status options:** `["A iniciar", "Em andamento", "Concluído", "Paralisado"]`
- **Tipo options:** derivado dinamicamente dos contratos (`[...new Set(contratos.map(c => c.tipo).filter(Boolean))]`)
- **Placeholder:** `"Buscar por objeto ou fornecedor..."`
- **Storage key:** `"contratos-filtros"`
- **Lógica de filtro:**
  ```js
  const filteredContratos = useMemo(() => {
    let result = contratos;
    if (busca) result = result.filter(c =>
      c.objeto?.toLowerCase().includes(b) || c.fornecedor?.toLowerCase().includes(b)
    );
    if (filtros.status?.length) result = result.filter(c => filtros.status.includes(c.status));
    if (filtros.tipo?.length)   result = result.filter(c => filtros.tipo.includes(c.tipo));
    if (periodo?.from) result = result.filter(c => c.data_inicio >= fromStr);
    if (periodo?.to)   result = result.filter(c => c.data_inicio <= toStr);
    return result;
  }, [contratos, busca, filtros, periodo]);
  ```

#### Pleitos (`src/components/pleitos/PleitosList.jsx`)
- **Estado atual:** sem filtros
- **Onde implementar:** dentro de `PleitosList.jsx` (componente autônomo que recebe todos os dados via query interna)
- **Adicionar:**
  - `FilterToolbar` + Search (busca por `titulo`) + FilterBar (status, prioridade) + DateRangePicker em `data_abertura`
- **Status options:** derivado dinamicamente dos pleitos
- **Prioridade options:** `["Baixa", "Média", "Alta", "Crítica"]`
- **Placeholder:** `"Buscar por título..."`
- **Storage key:** `"pleitos-filtros"`
- **Lógica de filtro:**
  ```js
  if (busca) result = result.filter(p => p.titulo?.toLowerCase().includes(b));
  if (filtros.status?.length)    result = result.filter(p => filtros.status.includes(p.status));
  if (filtros.prioridade?.length) result = result.filter(p => filtros.prioridade.includes(p.prioridade));
  if (periodo?.from) result = result.filter(p => p.data_abertura >= fromStr);
  if (periodo?.to)   result = result.filter(p => p.data_abertura <= toStr);
  ```

---

## 4. Módulos Sem Alteração

| Módulo | Motivo |
|--------|--------|
| Cronograma | Referência — já conforme |
| Registros | Já conforme (FilterToolbar + Search + FilterBar + DateRangePicker) |
| Mapa de Suprimentos | Já conforme (padrão estendido com 3 searches) |
| Documentos (Engenharia) | Já conforme (FilterToolbar + Search + FilterBar) |
| SixWLA | Já conforme — controles customizados de semana são domain-specific |
| Dashboard, Login, Agentes, Configurações | Não possuem listagem filtrável |

---

## 5. Ordem de Execução (Abordagem A — Sequencial)

1. Gestão de Riscos — só adicionar Search (mudança mínima)
2. Gestão de Mudanças — Search + DateRangePicker
3. Medições — Search + DateRangePicker
4. RDO — adicionar FilterBar
5. Take-Off — wrap + converter selects
6. Contratos — novo FilterToolbar completo
7. Pleitos — novo FilterToolbar completo

---

## 6. Imports necessários (todos os novos usos)

```js
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { Search } from "lucide-react";
```

---

## 7. Critérios de Aceite

- [ ] Todos os 7 módulos listados usam `FilterToolbar` como wrapper
- [ ] Nenhum `<select>` nativo ou `<input>` solto fora de `FilterToolbar` para filtros
- [ ] Botão "X" de limpar tudo funciona em todos os módulos
- [ ] `active` reflete corretamente o estado de filtro em todos os módulos
- [ ] `localStorage` persiste e restaura filtros em todos os módulos com `FilterBar`
- [ ] `npm run build` sem erros após todas as alterações
