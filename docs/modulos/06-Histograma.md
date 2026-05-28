# Histograma — MO e Equipamentos

## Rota e Entidades

- **Rota:** `/planejamento/histograma`
- **Página:** `src/pages/Planejamento/Histograma.jsx`
- **Componente principal:** `src/components/histograma/HistogramaTabela.jsx`
- **Entidade:** `Histograma` (tabela `histogramas`)

## Visão Geral

Controle de mobilização de Mão de Obra e Equipamentos por mês. O tipo de recurso (`MO` ou `Equipamento`) é uma coluna da própria tabela `histogramas` — não há tabela separada de recursos. As tabs MO / Equipamentos na UI filtram por esse campo.

## Campos — histogramas

| Campo | Tipo | Notas |
|---|---|---|
| `projeto_id` | UUID FK | |
| `tipo` | TEXT | `'MO'` ou `'Equipamento'` |
| `nome_recurso` | TEXT | Identifica o recurso; recursos são agrupados por este campo no front |
| `mes_referencia` | DATE | Formato `YYYY-MM-DD` (primeiro dia do mês) |
| `quantidade_prevista_mensal` | NUMERIC | Planejamento original |
| `quantidade_realizada_mensal` | NUMERIC | Real — bloqueado para meses futuros |
| `qtd_projetado` | NUMERIC | Projeção — zerado automaticamente quando Real é salvo |

## Colunas Calculadas no Front (não persistidas)

| Coluna | Fórmula |
|---|---|
| T.Prev (Total Previsto) | `Σ quantidade_prevista_mensal` de todos os meses do recurso |
| T.Real (Total Real) | `Σ quantidade_realizada_mensal` de todos os meses do recurso |
| T.Proj (Total Projetado) | `Σ qtd_projetado` de todos os meses do recurso |
| %Real | `T.Real / T.Prev × 100` (por recurso e no rodapé TOTAL) |
| %Proj | `T.Proj / T.Prev × 100` (por recurso e no rodapé TOTAL) |
| Acum. Prev / Acum. Real | Acumulados mensais para linhas do gráfico (eixo Y direito) |

## Regras de Preenchimento

- **Bloqueio Real:** campo Real só pode ser editado no mês atual ou anterior; meses futuros exibem `—` com fundo muted e `cursor-not-allowed` + tooltip explicativo
- **Limpeza de Projetado:** ao salvar Real, `qtd_projetado` do mesmo registro é zerado automaticamente (`updateCelula` em `HistogramaTabela.jsx`)
- **Enter na célula:** salva via `blur` (sem duplo-save)
- **Escape na célula:** cancela edição sem persistir

## Comportamentos Principais

- Tabs MO / Equipamentos filtram via `tipo` na query; cada tab tem estado independente
- Tabela horizontal com scroll; primeira coluna (recurso) sticky
- Header duplo por mês: linha 1 = rótulo do mês, linha 2 = sub-colunas Prev/Real/Proj
- Chips de toggle Previsto/Real/Projetado controlam visibilidade de colunas e barras do gráfico
- Meses exibidos: entre `projeto.data_inicio` e `projeto.data_fim_prevista`
- Rodapé TOTAL com somas mensais e totalizadores globais
- Gráfico ComposedChart: barras mensais (Prev/Real/Proj) + linhas acumuladas (Acum. Prev, Acum. Real) em eixo Y secundário
- Botão "Novo Função/Equipamento" cria registros mensais para todos os meses do projeto, com valores zerados
- Import/Export com mapeamento de colunas; upsert por `(nome_recurso × mes_referencia × tipo)`

## UX / Design

- Dual theme: `dark:` variants + CSS variables em todo o componente
- Células bloqueadas (Real futuro): `bg-muted`, `text-muted-foreground`, `cursor-not-allowed`, `title` tooltip
- Skeleton de carregamento com 5 linhas simulando a tabela
- Confirmação nativa (`window.confirm`) antes de excluir recurso

## Import/Export — Colunas

| Chave CSV | Campo destino | Notas |
|---|---|---|
| `nome_recurso` | `nome_recurso` | obrigatório |
| `tipo` | `tipo` | `MO` ou `Equipamento` |
| `mes_referencia` | `mes_referencia` | formato `YYYY-MM` → convertido para `YYYY-MM-01` |
| `qtd_prevista` | `quantidade_prevista_mensal` | |
| `qtd_real` | `quantidade_realizada_mensal` | |
| `qtd_projetado` | `qtd_projetado` | |

## Documentos Relacionados

- [Avanços](./07-AvancoFisico.md) | [Cronograma](./11-Cronograma.md)
- [DATABASE.md — histogramas](../architecture/DATABASE.md)
