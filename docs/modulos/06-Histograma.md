# Histograma — MO e Equipamentos

## Rota e Entidades

- **Rota:** `/planejamento/histograma`
- **Página:** `src/pages/Planejamento/Histograma.jsx`
- **Entidades:** `Histograma` (tabela `histogramas`) + `Recurso` (tabela `recursos`)

## Visão Geral

Controle de mobilização de Mão de Obra (MOD/MOI) e Equipamentos por mês. MO e Equipamentos são gerenciados em seções separadas (não misturados). Cada linha é um recurso; cada coluna é um mês.

## Campos — Recurso

| Campo | Tipo | Notas |
|---|---|---|
| `tipo_recurso` | TEXT | MOD / MOI / EQUIPAMENTO |
| `nome_recurso` | TEXT | |
| `unidade_medida` | TEXT | HH / HM / UND / HORA / DIA / MÊS |
| `preco_unitario` | NUMERIC | |

## Campos — Histograma (por recurso × mês)

| Campo | Tipo | Notas |
|---|---|---|
| `recurso_id` | UUID FK | |
| `mes_referencia` | DATE | Primeiro dia do mês |
| `quantidade_prevista_mensal` | NUMERIC | Planejamento original |
| `quantidade_realizada_mensal` | NUMERIC | Real — bloqueado para meses futuros |
| `quantidade_projetada_mensal` | NUMERIC | Projeção — bloqueado quando Real preenchido |

## Colunas Calculadas no Front (não persistidas)

| Coluna | Fórmula |
|---|---|
| Qtd. Real Acumulado | `Σ quantidade_realizada_mensal` até o mês atual |
| Qtd. Prev. Acumulado | `Σ quantidade_prevista_mensal` até o mês atual |
| Qtd. Proj. Acumulado | `Σ quantidade_projetada_mensal` até o mês atual |
| % Total Real | `Real Acumulado / Previsto Acumulado` |
| % Total Projetado | `Projetado Acumulado / Previsto Acumulado` |

## Regras de Preenchimento

- **Bloqueio Real:** dado Real só pode ser digitado para o mês atual ou anterior (meses futuros: read-only)
- **Bloqueio Projetado:** quando Real é preenchido para um mês, o campo Projetado daquele mês é limpo e bloqueado
- **Salvamento:** ao salvar Real, sistema limpa o Projetado correspondente

## Comportamentos Principais

- Tabela horizontal com barra de rolagem (escala temporal: 3 meses antes do início do projeto até 1 ano após o término)
- Colunas fixas: Recurso, Totais, % Total
- Colunas dinâmicas por mês: Previsto / Real / Projetado / Prev. Acumulado / Real Acumulado / Proj. Acumulado
- Gráfico com linhas de valores acumulados
- Import/Export com mapeamento de colunas e escala temporal automática
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme; células bloqueadas: estilo desabilitado visual
- Colunas de meses agrupadas por trimestre para facilitar leitura

## Documentos Relacionados

- [Avanços](./07-AvancoFisico.md) | [Cronograma](./11-Cronograma.md)
- [DATABASE.md — histogramas](../architecture/DATABASE.md)
