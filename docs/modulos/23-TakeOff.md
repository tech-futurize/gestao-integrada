# Take-Off — Quantitativos por Disciplina

## Rota e Entidades

- **Rota:** `/planejamento/take-off`
- **Página:** `src/pages/Planejamento/TakeOff.jsx`
- **Entidades:** `Commodity` (tabela `commodities`) + `LancamentoCommodity` (tabela `lancamentos_commodity`)

## Visão Geral

Controle de quantitativos (take-off) do projeto por disciplina. Cada commodity tem um quantitativo contratado e lançamentos semanais de produção. Gráficos por Unidade de Medida e por Disciplina mostram Realizado (verde) e Saldo (vermelho).

## Campos — Commodity

| Campo | Tipo | Notas |
|---|---|---|
| `codigo` | TEXT | Código do item |
| `descricao` | TEXT | |
| `disciplina` | TEXT | Civil / Mecânica / Tubulação / Elétrica / Estrutura Metálica / Instrumentação / Pintura / Outros |
| `unidade` | TEXT | Código de `unidades_medida` |
| `qtd_contrato` | NUMERIC | Quantidade prevista em contrato |
| `qtd_takeoff` | NUMERIC | Quantidade medida no take-off |

## Campos — Lançamento de Commodity

| Campo | Tipo | Notas |
|---|---|---|
| `commodity_id` | UUID FK | |
| `projeto_id` | UUID FK | |
| `semana` | TEXT | Ex: "S01/2025" |
| `data_inicio` / `data_fim` | DATE | Período da semana |
| `quantidade` | NUMERIC | Produção real da semana |
| `responsavel` | TEXT | |

## Comportamentos Principais

- **Data de Lançamento:** por Semana do Ano; sistema sugere a semana automaticamente com base na data corrente
- **Subtotal:** linha de subtotal na parte inferior da tabela de lançamentos
- **Gráficos:**
  - Por Unidade de Medida: barra Realizado (verde) + barra Saldo (vermelho)
  - Por Disciplina: mesma paleta
- **Filtro:** por Unidade de Medida
- **Import/Export:** pop-up de mapeamento de colunas para ambos (Commodities e Lançamentos)
- Sem cards superiores; sem campo Status; sem campo Responsável em Commodity; sem "Curva de Previsto" no gráfico
- `enabled: !!selectedProjectId`

## UX / Design

- Realizado: `fill="green"` / `bg-green-500`; Saldo: `fill="red"` / `bg-red-500`
- Dual theme claro/escuro

## Documentos Relacionados

- [Histograma](./06-Histograma.md) | [Cronograma](./11-Cronograma.md)
- [DATABASE.md — commodities, lancamentos_commodity](../architecture/DATABASE.md)
