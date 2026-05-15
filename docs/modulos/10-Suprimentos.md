# Suprimentos — Mapa de Suprimentos (MAS)

## Rota e Entidades

- **Rota:** `/suprimentos/mapa`
- **Página:** `src/pages/Suprimentos/MapaSuprimentos.jsx`
- **Entidade:** `ItemMAS` (tabela `itens_mas`)

> **Requisições e Cotações foram removidos da UI** neste milestone. As tabelas `requisicoes_compra` e `cotacoes` existem no banco mas sem interface ativa.

## Visão Geral

Mapa de Acompanhamento de Suprimentos (MAS) — rastreia o status de cada item de compra do projeto desde a emissão da SC/OC até o recebimento, com vínculo ao cronograma.

## Campos

| Campo | Tipo | Notas |
|---|---|---|
| `descricao` | TEXT | Descrição do item |
| `unidade_id` | TEXT FK → `unidades_medida` | kg / t / m3 / m2 / m / l / un / pc / h / mes / vb |
| `quantidade` | NUMERIC | |
| `numero_sc` | TEXT | Label UI: "N SC/OC" |
| `solicitante` | TEXT | Label UI: "Responsável" |
| `fornecedor` | TEXT | |
| `id_cronograma` | UUID FK → `tarefas_cronograma` | SET NULL |
| `data_cronograma` | DATE | Preenchida automaticamente ao vincular tarefa |
| `status` | TEXT | A iniciar / Em andamento / Concluído / Cancelado |
| `etapas` | JSONB | Array `[{nome, data_prevista, data_real}]` |

> `data_necessidade` foi substituída por `data_cronograma` (vinculada ao cronograma via `id_cronograma`).

## Comportamentos Principais

- Tabela com paginação server-side: 25 itens por página via `usePaginatedQuery`
- Modal de criação/edição com todos os campos
- Vínculo com tarefa do cronograma via pop-up de seleção
- Unidade via lookup `unidades_medida` (tabela global)
- Import/Export com pop-up de mapeamento de colunas
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme claro/escuro
- Coluna de status com badge colorido
- Data Cronograma destacada quando próxima do vencimento

## Documentos Relacionados

- [Cronograma](./11-Cronograma.md) | [DATABASE.md — itens_mas, unidades_medida](../architecture/DATABASE.md)
