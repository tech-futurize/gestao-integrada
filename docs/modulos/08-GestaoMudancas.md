# Gestão de Mudanças — Mudanças Contratuais

## Rota e Entidades

- **Rota:** `/riscos-mudancas/gestao-mudancas`
- **Página:** `src/pages/RiscosMudancas/GestaoMudancas.jsx`
- **Entidade:** `MudancaContratual` (tabela `mudancas_contratuais`)

## Visão Geral

Controle de mudanças contratuais — alterações de escopo, prazo e valor. A UI usa formato de **tabela com editar/excluir** (não Kanban). Cards no topo mostram o balanço de desvios do projeto.

## Cards de Resumo (topo da página)

| Card | Cálculo |
|---|---|
| Total Desvio Prazo (+/-) | `Σ impacto_prazo_dias` de todas as mudanças |
| Adição de Valor | `Σ impacto_custo` onde `impacto_escopo_tipo = 'Adição'` |
| Redução de Valor | `Σ impacto_custo` onde `impacto_escopo_tipo = 'Redução'` |
| Adição de Escopo | Contagem de mudanças com `impacto_escopo_tipo = 'Adição'` |
| Redução de Escopo | Contagem de mudanças com `impacto_escopo_tipo = 'Redução'` |

## Campos

| Campo | Tipo | Notas |
|---|---|---|
| `titulo` | TEXT | |
| `descricao` | TEXT | |
| `origem` | TEXT | Contratante / Contratado / Regulatório / Técnico |
| `status` | TEXT | Identificada / Em Análise / Aprovada / Rejeitada / Implementada |
| `impacto_custo` | NUMERIC | Valor em R$ |
| `impacto_prazo_dias` | NUMERIC | Dias de desvio (positivo = atraso) |
| `impacto_escopo` | TEXT | Descrição textual do escopo |
| `impacto_escopo_tipo` | TEXT | **Adição** ou **Redução** (radio único — não checkbox) |
| `data_registro` | DATE | Data do registro (ex-`data_ocorrencia`) |
| `pleito_texto` | TEXT | Texto de referência do pleito associado |
| `responsavel` | TEXT | |
| `categorias` | JSONB | Sincronizado com categorias do Mapa de Impacto |

## Comportamentos Principais

- Tabela com paginação; botões Editar e Excluir por linha
- Modal de criação/edição com todos os campos
- Cards de resumo recalculados automaticamente ao mudar dados
- Filtros por status e origem
- `enabled: !!selectedProjectId`

## UX / Design

- Botões Salvar: `bg-emerald-600 hover:bg-emerald-700` (verde esmeralda)
- Cards de desvio com destaque visual para positivo/negativo
- Dual theme claro/escuro

## Documentos Relacionados

- [Gestão de Riscos](./13-GestaoRiscos.md) | [Pleitos](./03-Pleitos.md)
- [DATABASE.md — mudancas_contratuais](../architecture/DATABASE.md)
