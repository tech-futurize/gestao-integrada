# Medições — Medições de Contratos

## Rota e Entidades

- **Rota:** `/admin-contratual/medicoes`
- **Página:** `src/pages/AdminContratual/Medicoes.jsx`
- **Entidade:** `Medicao` (tabela `medicoes`)

## Visão Geral

Medições de serviços executados vinculadas a contratos de subcontratados. Cada medição lista itens com descrição, quantidade e valor unitário; o valor total é calculado automaticamente pela soma dos itens.

## Campos

| Campo | Tipo | Notas |
|---|---|---|
| `contrato_id` | UUID FK → contratos | |
| `numero` | TEXT | Número sequencial da medição |
| `periodo_inicio` | DATE | Início do período medido |
| `periodo_fim` | DATE | Fim do período medido |
| `valor` | NUMERIC | **Soma automática dos itens** — read-only no front (ex-`valor_liquido`) |
| `status` | TEXT | Elaboração / Em Revisão / Em Aprovação / Aprovada / Paga / Rejeitada |
| `aprovador` | TEXT | |
| `itens` | JSONB | Array `[{descricao, quantidade, valor_unitario}]` |

**Campos removidos:** `elaborador`, `valor_bruto`, `retencao`.

## Comportamentos Principais

- Lista de medições filtrada por `contrato_id` e `projeto_id`
- Modal de criação/edição com gerenciamento de itens (adicionar/remover linhas)
- `valor` calculado no front como `Σ(item.quantidade × item.valor_unitario)` — não editável diretamente
- Import/Export com mapeamento de colunas (para dados de medições em massa)
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme claro/escuro
- Valor formatado em BRL (`R$ 1.234,56`)
- Botão Salvar: `bg-emerald-600`

## Documentos Relacionados

- [Contratos](./09-Contratos.md) — medições são filhas de contratos
- [DATABASE.md — medicoes](../architecture/DATABASE.md)
