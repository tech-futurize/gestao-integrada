# C5 — Proporção Gantt vs Coluna de Tarefas

**Data:** 2026-05-27  
**Arquivo:** `src/components/cronograma/GanttChart.jsx`  
**Abordagem aprovada:** Opção A — Redução simples das larguras fixas

## Problema

O painel de colunas fixas (ID + Nív + Atividade + Ações) ocupa 499px, deixando pouco espaço para as barras do Gantt em telas menores.

## Solução

Reduzir duas constantes no topo de `GanttChart.jsx`:

| Constante | Antes | Depois |
|-----------|-------|--------|
| `W_ID`   | 96px  | 64px   |
| `W_NOME` | 320px | 220px  |
| Total fixo | 499px | 367px |

Gantt (`flex-1`) ganha +132px. O `truncate` já está implementado em todas as células de nome — nomes longos continuam legíveis com reticências. O sistema de scroll-sync de 3 painéis não é afetado; a largura do painel fixo apenas diminui, e todas as expressões `W_ID + W_NIV + W_NOME + W_ACT` propagam o novo valor automaticamente.

## Escopo

- 2 linhas alteradas em `GanttChart.jsx` (constantes `W_ID` e `W_NOME`)
- Sem alterações de lógica, estado ou queries
- Sem novos componentes ou dependências
