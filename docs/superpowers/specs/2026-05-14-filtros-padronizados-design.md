# Design Spec — Padronização de Filtros do Sistema

**Data:** 2026-05-14
**Status:** Aprovado
**Autor:** Agent_Builder

---

## Objetivo

Padronizar todos os filtros do sistema para um modelo consistente: botões inline por campo que abrem dropdowns com busca em tempo real, checkboxes de múltipla seleção, opção "Selecionar todos", badge numérico de estado ativo, chips de valores selecionados abaixo da toolbar e persistência via `localStorage`.

---

## Componentes Novos

### `src/components/ui/MultiSelectDropdown.jsx`

Componente atômico que renderiza um único filtro de campo.

**Props:**
```js
{
  label: string,           // rótulo do botão (ex: "Status")
  options: string[],       // lista de opções disponíveis
  selected: string[],      // valores atualmente selecionados
  onChange: (values: string[]) => void,
  placeholder?: string     // placeholder do input de busca (default: "Pesquisar...")
}
```

**Comportamento interno:**
- Botão-trigger: exibe `label` + badge numérico azul quando `selected.length > 0`
- Dropdown flutuante (posicionado abaixo do botão via Radix `Popover`)
- Input de busca filtra `options` em tempo real (case-insensitive, sem debounce)
- Checkbox "Selecionar todos": marca tudo quando nem todos estão selecionados (inclusive estado intermediário); desmarca tudo quando todos já estão selecionados
- Lista de checkboxes das opções filtradas, com toggle individual
- Fecha ao clicar fora (comportamento nativo do Radix `Popover`)

---

### `src/components/ui/FilterBar.jsx`

Componente orquestrador declarativo. Gerencia o estado de múltiplos `MultiSelectDropdown` e renderiza os chips de filtros ativos.

**Props:**
```js
{
  storageKey: string,                          // chave única por módulo no localStorage
  filters: Array<{
    key: string,                               // campo do dado (ex: "status")
    label: string,                             // rótulo exibido (ex: "Status")
    options: string[]                          // opções do dropdown
  }>,
  onChange: (selected: Record<string, string[]>) => void  // callback com estado completo
}
```

**Comportamento:**
- Inicialização: lê `localStorage[storageKey]` e restaura seleções anteriores
- Renderiza uma linha de botões `MultiSelectDropdown` para cada item em `filters`
- Abaixo dos botões: linha de chips (`pill` com ✕) para cada valor selecionado em qualquer campo
- Botão "Limpar tudo" aparece apenas quando há pelo menos um filtro ativo
- Cada alteração (marcar, desmarcar, limpar) atualiza `localStorage` e chama `onChange`
- `onChange` recebe o objeto completo: `{ status: ["Ativo"], etapa: ["Cotação", "PATEC"] }`
- Campos sem seleção têm array vazio `[]` — o módulo interpreta array vazio como "sem filtro" (exibe tudo)

---

## Hook Interno

### `src/hooks/usePersistedFilters.js`

Usado exclusivamente pelo `FilterBar`. Não é consumido diretamente pelos módulos.

```js
const [selected, setFieldValues, clearAll] = usePersistedFilters(storageKey, filterKeys)
```

- `selected`: `Record<string, string[]>` — estado atual
- `setFieldValues(key, values)`: atualiza um campo e grava no `localStorage`
- `clearAll()`: zera todos os campos e limpa a entrada do `localStorage`
- Inicializa lendo `localStorage[storageKey]`; se inválido ou ausente, começa com todos os arrays vazios

---

## Fluxo de Dados

```
localStorage → usePersistedFilters → FilterBar → MultiSelectDropdown (x N)
                                         ↓
                              onChange({ status: [], etapa: ["Cotação"] })
                                         ↓
                                  Módulo (useMemo)
                                         ↓
                               Lista de dados filtrada
```

1. `FilterBar` monta → `usePersistedFilters` lê `localStorage` → popula estado inicial
2. Usuário abre dropdown → `MultiSelectDropdown` renderiza opções filtradas pela busca
3. Usuário marca/desmarca → `setFieldValues` atualiza estado + grava `localStorage`
4. `FilterBar` chama `onChange` com estado completo
5. Módulo aplica filtros via `useMemo`:
   ```js
   const filtered = useMemo(() => {
     return data.filter(item =>
       (selected.status.length === 0 || selected.status.includes(item.status)) &&
       (selected.etapa.length === 0  || selected.etapa.includes(item.etapa))
     )
   }, [data, selected])
   ```
6. Chips renderizados abaixo dos botões — ✕ em chip chama `setFieldValues(key, values.filter(v => v !== chip))`; "Limpar tudo" chama `clearAll()`

---

## Opções Estáticas vs. Dinâmicas

**Estáticas** — passadas diretamente no array `filters`:
```js
{ key: "status", label: "Status", options: ["Ativo", "Mitigado", "Encerrado"] }
```

**Dinâmicas** — módulo carrega via `useQuery` e passa como `options` após dados chegarem:
```js
const { data: fornecedores } = useQuery(...)
// ...
filters={[
  { key: "fornecedor", label: "Fornecedor", options: fornecedores?.map(f => f.nome) ?? [] }
]}
```
`FilterBar` atualiza a lista de opções sem perder seleções persistidas (seleções para valores que sumiram são ignoradas silenciosamente no `useMemo`).

---

## Módulos a Atualizar

| Módulo | Arquivo(s) | Filtros convertidos | `storageKey` |
|--------|-----------|--------------------|-|
| Registros | `AdminContratual/Registros.jsx` | Status, Tipo de Registro | `"registros-filtros"` |
| Medições | `components/contratos/MedicoesList.jsx` | Status | `"medicoes-filtros"` |
| RDOs | `components/rdo/RDOModule.jsx` | Status, Etapa | `"rdos-filtros"` |
| Documentos | `Engenharia/Documentos.jsx` | Disciplina, Fornecedor | `"documentos-filtros"` |
| Gestão de Mudanças | `RiscosMudancas/GestaoMudancas.jsx` | Status, Origem | `"mudancas-filtros"` |
| Gestão de Riscos | `RiscosMudancas/GestaoRiscos.jsx` | Status, Categoria | `"riscos-filtros"` |
| Mapa de Suprimentos | `components/suprimentos/MapaSuprimentos.jsx` | Status, Etapa | `"suprimentos-filtros"` |
| Histograma | `components/histograma/HistogramaEquipamentos.jsx` | Tipo de Equipamento | `"histograma-filtros"` |

---

## Fora do Escopo

- **Cronograma** — controles de zoom, baseline e caminho crítico são controles de **visualização**, não filtros de dados. Permanecem como botões toggle.
- **Inputs de busca por texto livre** (Nº SC, título, TAG/ID) — continuam como `<Input>` separados ao lado do `FilterBar`. Não são convertidos para multiselect.
- **Pleitos, MapaImpacto, SixWLA, TakeOff, Avanços** — sem filtros de dados mapeados; sem alteração.

---

## Tecnologia

- Radix UI `Popover` para o dropdown flutuante (já disponível no projeto via shadcn/ui)
- Radix UI `Checkbox` para os checkboxes (já disponível)
- `localStorage` nativo para persistência — sem dependência adicional
- Tailwind CSS para estilização (padrão do projeto)
- Nenhuma biblioteca nova introduzida

---

## Critérios de Aceitação

- [ ] `MultiSelectDropdown` e `FilterBar` funcionam isoladamente (testáveis independentemente)
- [ ] Busca em tempo real funciona com case-insensitive em todos os módulos
- [ ] "Selecionar todos" marca/desmarca corretamente
- [ ] Badge numérico reflete o número exato de opções selecionadas
- [ ] Chips aparecem abaixo da toolbar com ✕ funcional por item
- [ ] "Limpar tudo" aparece somente quando há filtros ativos e zera tudo
- [ ] Estado persiste no `localStorage` e é restaurado ao recarregar ou voltar para a página
- [ ] Opções dinâmicas (Fornecedor) carregam corretamente após query resolver
- [ ] Todos os 8 módulos listados usam `FilterBar` (selects/inputs antigos removidos)
- [ ] Nenhum `console.log` em produção
- [ ] Nenhum mock data introduzido
