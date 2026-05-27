# A6 — Tabela Transposta de Avanço Físico

**Data:** 2026-05-27
**Módulo:** Planejamento › Avanços (Módulo 8)
**Arquivo alvo:** `src/pages/Planejamento/Avancos.jsx` + novo `src/components/planejamento/AvancoTabela.jsx`
**Tarefa paralela:** Builder A1 (schema migration `semana_iso` + `avanco_projetado`)

---

## Contexto

O módulo de Avanços atualmente usa uma tabela mensal com entrada via dialog. A decisão do PO (PLAN.md M8) é migrar completamente para granularidade **semanal (ISO week)**, com uma tabela transposta de edição inline — análoga ao `HistogramaTabela.jsx` mas com orientação invertida.

---

## Decisões de Design (aprovadas pelo PO)

| Decisão | Escolha |
|---------|---------|
| Estrutura de página | KPI cards + tabela transposta + gráfico |
| Coluna esquerda sticky | Pill colorido + total acum. + barra de progresso % |
| Sub-header das semanas | `dd/mm` (data da segunda-feira da semana ISO) |
| Indicador de semana atual | Nenhum — tabela neutra |

---

## Estrutura da Página

```
PageHeader (breadcrumb "Planejamento › Avanços" + ações Import/Export)
│
├── 4 cards KPI
│
├── AvancoTabela (tabela transposta)
│
└── ComposedChart (Curva S semanal)
```

---

## 1. PageHeader

- Componente `<PageHeader />` padrão do sistema — breadcrumb automático via `useLocation()`
- Slot de ações: botão **Importar** + botão **Exportar** (`ImportExportDialog` existente)
- Nenhum `<h1>` extra ou subtítulo descritivo na página

---

## 2. KPI Cards (4)

Calculados via `useMemo` a partir dos dados já carregados — sem query extra.

| Card | Valor | Cor |
|------|-------|-----|
| **Previsto Acumulado** | Soma de `avanco_previsto_semanal` até a semana atual | Azul (`#2563eb`) |
| **Real Acumulado** | Soma de `avanco_realizado_semanal` até a última semana com dado | Verde (`#16a34a`) |
| **Projetado Acumulado** | Soma de `avanco_projetado` em todas as semanas | Âmbar (`#d97706`) |
| **Desvio** | Real Acum − Previsto Acum | Verde se ≥ 0, Vermelho se < 0 |

Cada card exibe: label (uppercase xs) + valor grande + subtexto contextual + mini progress bar de 3px.

---

## 3. Tabela Transposta (`AvancoTabela.jsx`)

### Estrutura do header (2 linhas)

```
┌────────────────┬────────────────────────┬────────────────────────┐
│       —        │        Jan/26          │        Fev/26          │
│  (rowspan=2)   │  (colspan = N semanas) │  (colspan = N semanas) │
├────────────────┼────┬────┬────┬────────┼────┬────┬────┬─────────┤
│                │05/1│12/1│19/1│  26/1  │02/2│09/2│16/2│  23/2   │
└────────────────┴────┴────┴────┴────────┴────┴────┴────┴─────────┘
```

- **Linha 1:** mês agrupado (`MMM/yy` em pt-BR) com `colspan` igual ao número de semanas ISO cujo início (segunda-feira) cai dentro do mês. Regra: a semana pertence ao mês da sua segunda-feira.
- **Linha 2:** data da segunda-feira (`dd/MM`) de cada semana ISO.
- Ambas as linhas do header são `position: sticky; top: 0` para permanecerem visíveis ao rolar a página verticalmente.

### Colunas

Escala: da semana ISO que contém `projeto.data_inicio − 3 meses` até a semana que contém `projeto.data_fim_prevista + 1 ano`.

Geração: `eachWeekOfInterval({ start: subMonths(dataInicio, 3), end: addYears(dataFim, 1) }, { weekStartsOn: 1 })` — lista de segundas-feiras.

### 3 linhas de dados

| Linha | Cor fundo | Campo BD | Editável |
|-------|-----------|----------|----------|
| **Previsto** | `bg-blue-50` | `avanco_previsto_semanal` | Sempre |
| **Real** | `bg-green-50` | `avanco_realizado_semanal` | Só semanas ≤ semana atual |
| **Projetado** | `bg-yellow-50` | `avanco_projetado` | Sempre; limpa ao salvar Real na mesma semana |

### Coluna esquerda sticky (`position: sticky; left: 0; z-index: 2; min-width: 160px`)

Conteúdo por linha:

```
● Previsto   56.8%          ← pill: dot + nome + total acumulado
                            ← (sem barra — é a referência)

● Real       52.4%
███████████░░░ 52.4 / 56.8  ← barra de progresso 3px + label "%Real / %Prev"

● Projetado  54.1%
██████████████ 54.1 / 56.8  ← barra de progresso 3px + label "%Proj / %Prev"
```

- **Previsto** não tem barra (é a baseline).
- **Real** e **Projetado** mostram barra preenchida com `(acum / prevAcum) * 100%`, clamped a 100%.

### Células de dados (`CelulaEditavelAvanco`)

Componente análogo ao `CelulaEditavel` de `HistogramaTabela.jsx`, adaptado para valores decimais (avanço %):

- Clique → `<input type="number" step="0.1" min="0" max="100">` com `autoFocus`
- `Enter` ou `blur` → chama prop `onSave(campo, valor)`; `Escape` → cancela sem salvar
- Células de **Real** em semanas futuras: fundo `bg-muted`, texto `—`, `cursor-not-allowed`, não clicáveis (prop `blocked`)
- Componente puramente visual — sem lógica de negócio; o handler `onSave` em `AvancoTabela` implementa a regra de "zerar projetado ao salvar Real" (escopo Builder A3)
- Definida **fora** do componente principal para evitar remount no re-render (lição de M7)

### Rodapé

Sem linha de TOTAL — o total já está na coluna sticky. Sem acumulados na tabela (o gráfico e os KPI cards cumprem esse papel).

---

## 4. Gráfico (Recharts `ComposedChart`)

- **Barras:** `avanco_previsto_semanal` (azul) + `avanco_realizado_semanal` (verde) + `avanco_projetado` (âmbar) no eixo Y esquerdo
- **Linhas:** `prevAcum` (azul tracejada) + `realAcum` (verde sólida) no eixo Y direito — Curva S
- Eixo X: `dd/MM` da semana
- `<Tooltip />` + `<Legend />` padrão Recharts
- Chips de toggle Previsto/Real/Projetado (mesma pattern de M7) controlam visibilidade de barras e linhas

---

## 5. Estados

| Estado | Trigger | Renderização |
|--------|---------|--------------|
| **Loading** | `isPending === true` | Skeletons: 4 retângulos KPI + 4 linhas de tabela |
| **Sem projeto** | `!selectedProjectId` | `"Selecione um projeto para ver o avanço."` |
| **Sem datas** | `!projeto?.data_inicio \|\| !projeto?.data_fim_prevista` | `"Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto."` |
| **Error** | `isError === true` | `"Erro ao carregar dados de avanço."` vermelho |

---

## 6. Queries e Mutations

```js
// query principal
useQuery({
  queryKey: ["avanco_fisico", selectedProjectId],
  queryFn: () => entities.AvancoFisico.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
})

// query do projeto (para datas)
useQuery({
  queryKey: ["projetos", selectedProjectId],
  queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
  enabled: !!selectedProjectId,
})

// mutation de update (único campo)
useMutation({
  mutationFn: ({ id, updates }) => entities.AvancoFisico.update(id, updates),
  onSuccess: () => queryClient.invalidateQueries(["avanco_fisico", selectedProjectId]),
})
```

Dados indexados por `semana_iso` (ex: `"2026-W05"`) em um `Map` para lookup O(1) nas células.

---

## 7. Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/Planejamento/Avancos.jsx` | Reescrever — remover tabela mensal e dialog antigo; montar nova estrutura |
| `src/components/planejamento/AvancoTabela.jsx` | Criar — componente da tabela transposta + `CelulaEditavelAvanco` |

---

## 8. Fora de Escopo (A6)

- Schema migration (`semana_iso`, `avanco_projetado`) → Builder A1
- Lógica de bloqueio Real ≤ semana atual (regra de negócio) → Builder A3
- Import/Export com escala -3m/+1ano → Builder A5
- Correção do bug visual no botão Editar (`Avancos.jsx:258-260`) → Builder A2
