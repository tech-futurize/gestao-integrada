# 6WLA — Look-Ahead 6 Semanas

## Rota e Entidades

- **Rota:** `/planejamento/6wla`
- **Página:** `src/pages/Planejamento/SixWLA.jsx`
- **Entidades:** `Item6WLA` (tabela `itens_6wla`) + `TarefaCronograma` (leitura via FK)

## Visão Geral

Look-Ahead de 6 semanas — exibe as atividades do cronograma que estão ativas nas próximas 6 semanas, com controle de restrições por 6 categorias. Vínculo bidirecional com o módulo de Cronograma.

## Dashboard Superior (Cards)

Para cada uma das 6 categorias de restrição:
- **Total de Atividades** com restrição naquela categoria
- **Total de Atividades** ativas na semana (geral)

## Campos — Dados do Cronograma (read-only via FK)

| Campo | Fonte | Notas |
|---|---|---|
| ID, Atividade | `TarefaCronograma` | Exibidos, não editáveis |
| Datas BL (início/término) | `TarefaCronograma` | |
| Datas Real (início/término) | `TarefaCronograma` | |
| Datas Previstas (início/término) | `TarefaCronograma` | |
| % Previsto / % Real | `TarefaCronograma` | |
| Área, Disciplina | `TarefaCronograma` | |
| Caminho Crítico | `TarefaCronograma` | |
| Status | `TarefaCronograma` | Calculado (ver Cronograma) |

## Campos — Item6WLA (editáveis)

| Campo | Tipo | Notas |
|---|---|---|
| `tarefa_cronograma_id` | UUID FK | Vínculo obrigatório com o cronograma |
| `observacao` | TEXT | Campo livre de anotações |
| `restricoes` | JSONB | `{documentos, material, equipamentos, mao_obra, seguranca, qualidade}` |

> Sem campo "Responsável" (removido na Refatoração 2026-Q2).

## Semanas Ativas

Calculadas no front — a atividade aparece na semana se houver sobreposição entre `[inicio_previsto, termino_previsto]` da tarefa e o período daquela semana. Não persistido no banco.

## Comportamentos Principais

- Filtros: por Semana (das 6 ativas) e por Status
- Restrições como checklist/toggle por categoria (6 categorias)
- Dados do cronograma: read-only; apenas `observacao` e `restricoes` são editáveis
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme claro/escuro
- Cards de restrição por categoria com contagem destacada
- Botões Salvar: `bg-emerald-600`

## Documentos Relacionados

- [Cronograma](./11-Cronograma.md) — fonte dos dados
- [DATABASE.md — itens_6wla, tarefas_cronograma](../architecture/DATABASE.md)
