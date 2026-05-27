# Módulo 6 — Take-Off: Quantitativos por Disciplina

> **Status:** ✅ Implementado e validado (Lote 11/12 — 2026-05-27)
> **Audit:** Visual 9 · Functional 9 · Trust 9

## Rota e Arquivos

| Item | Caminho |
|------|---------|
| Rota | `/planejamento/take-off` |
| Página | `src/pages/Planejamento/TakeOff.jsx` |
| Componente principal | `src/components/planejamento/TakeOffCommodities.jsx` |
| Entidade commodities | `src/api/supabaseEntities.js` → `Commodity` (`commodities`) |
| Entidade lançamentos | `src/api/supabaseEntities.js` → `LancamentoCommodity` (`lancamentos_commodity`) |

## Visão Geral

Controle de quantitativos (take-off) por disciplina. Cada commodity tem uma quantidade contratada e uma quantidade medida no take-off. O lançamento de produção é semanal (Semana ISO). O módulo calcula Realizado, Saldo e % Avanço dinamicamente no front a partir dos lançamentos.

## Schema — `commodities`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | UUID PK | |
| `projeto_id` | UUID FK | |
| `codigo` | TEXT | Ex: `COM-001` — sugerido automaticamente |
| `descricao` | TEXT | Obrigatório |
| `disciplina` | TEXT | Civil / Mecânica / Tubulação / Elétrica / Estrutura Metálica / Instrumentação / Pintura / Outros |
| `unidade` | TEXT | m³ / kg / m / un / m² / ton / l / hr |
| `qtd_contrato` | NUMERIC | Quantidade prevista em contrato (obrigatório) |
| `qtd_takeoff` | NUMERIC | Quantidade medida no take-off (opcional) |

## Schema — `lancamentos_commodity`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | UUID PK | |
| `commodity_id` | UUID FK | FK para `commodities.id` |
| `projeto_id` | UUID FK | |
| `semana_iso` | TEXT | Formato `YYYY-Wxx` — ex: `2026-W22` |
| `quantidade` | NUMERIC | Produção real da semana |
| `observacao` | TEXT | Campo livre |

## Comportamentos Principais

### Lista de Commodities
- **Filtros:** busca livre por código/descrição + select Disciplina + select Unidade de Medida
- **Ordenação:** clique no cabeçalho de qualquer coluna (asc/desc toggle com ícone)
- **Colunas:** Código · Descrição · Disciplina · Un. · Contrato · Take-Off · Realizado · Saldo · % Avanço (barra + %)
- **Subtotal:** linha de totais no `<tfoot>` da tabela (Contrato / Take-Off / Realizado / Saldo)
- **Linha de detalhe:** clique em qualquer linha abre a view de detalhe do item
- **Estados:** `isPending` (loading row), `isError` (mensagem de erro), empty state se sem dados

### View de Detalhe (por item)
- KPIs: Qtd. Contrato · Qtd. Take-Off · Qtd. Realizado · Saldo · % Avanço
- Barra de progresso
- Gráfico de evolução acumulada (AreaChart com série "Realizado" em verde)
- Tabela de lançamentos semanais com acumulado por semana
- Botão "Lançar Realizado" abre `LancamentoModal` com sugestão automática de semana ISO

### Semana ISO
- A semana atual é calculada via `currentIsoWeek()` (ISO 8601) e pré-preenchida no modal de lançamento
- Formato: `YYYY-Wxx` (ex: `2026-W22`)

### Gráficos (lista)
- **Realizado vs Contrato — por Unidade de Medida:** BarChart (Contrato = azul, Realizado = verde)
- **Realizado vs Contrato — por Disciplina:** BarChart (mesma paleta)
- Exibidos somente quando há itens na lista filtrada

### Import/Export
- Botão no `PageHeader` aciona `<ImportExportDialog />`
- Colunas mapeáveis: Código, Descrição, Disciplina, Unidade, Qtd. Contrato, Qtd. Take-Off
- Export exporta os itens do filtro atual

## UX / Design

- **Sem cards superiores** — lista direta com filtros no topo
- **Sem campo Status** na tabela nem no formulário
- **Sem campo Responsável** no formulário
- **Sem "Curva de Previsto"** no gráfico de detalhe — apenas Realizado acumulado
- Cor Realizado: `#16a34a` (verde) / `text-status-positive`
- Cor Saldo: `text-status-positive` se ≥ 0, `text-status-critical` se negativo (vermelho)
- Status calculado dinamicamente: Normal / Atenção / Crítico / Excedido (sem coluna — usado internamente para badge no detalhe)
- Dual theme claro/escuro com tokens semânticos (`bg-card`, `text-foreground`, `border-border`)
- `enabled: !!selectedProjectId` — queries não executam sem projeto selecionado

## Documentos Relacionados

- [Módulo 5 — 6WLA](./05-6WLA.md)
- [Cronograma](./11-Cronograma.md)
- [DATABASE.md — commodities, lancamentos_commodity](../architecture/DATABASE.md)
