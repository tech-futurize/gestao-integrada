# Avanços — Avanço Físico

## Rota e Entidades

- **Rota:** `/planejamento/avancos`
- **Página:** `src/pages/Planejamento/Avancos.jsx`
- **Entidade:** `AvancoFisico` (tabela `avanco_fisico`)

## Visão Geral

Controle de avanço físico previsto × real × projetado. A tabela é **transposta** — as linhas representam as três curvas (Previsto, Real, Projetado) e as colunas representam semanas, agrupadas por mês.

## Estrutura da Tabela

```
Linha 1: Avanço Previsto   | Sem1 | Sem2 | ... | SemN
Linha 2: Avanço Real       | Sem1 | Sem2 | ... | SemN
Linha 3: Avanço Projetado  | Sem1 | Sem2 | ... | SemN
```

- Colunas agrupadas por mês (baseado na data de início da semana)
- Aderência Real = % Total Real: `Real Acumulado / Previsto Acumulado`
- Aderência Projetado = % Total Projetado: `Projetado Acumulado / Previsto Acumulado`

## Campos

| Campo | Tipo | Notas |
|---|---|---|
| `projeto_id` | UUID FK | |
| `mes_referencia` | DATE | Primeiro dia do mês |
| `avanco_previsto_mensal` | NUMERIC | |
| `avanco_realizado_mensal` | NUMERIC | |
| `avanco_previsto_acumulado` | NUMERIC | |
| `avanco_realizado_acumulado` | NUMERIC | |

> Avanço Projetado e acumulados mensais são calculados no front com base nos dados de semana.

## Regras de Preenchimento

- **Mesma lógica do Histograma:** Real bloqueado para semanas/meses futuros; Projetado bloqueado quando Real preenchido
- Escala temporal: início do projeto −3 meses até término +1 ano

## Comportamentos Principais

- Gráfico com barras mensais e linhas de acumulado; eixo X: Semana/Mês
- Aderência exibida como percentual destacado
- Import/Export com pop-up de mapeamento de colunas
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme; células futuras com estilo desabilitado
- Botão de edição sem erro visual (bug corrigido na Refatoração 2026-Q2)

## Documentos Relacionados

- [Histograma](./06-Histograma.md) | [Cronograma](./11-Cronograma.md)
- [DATABASE.md — avanco_fisico](../architecture/DATABASE.md)
