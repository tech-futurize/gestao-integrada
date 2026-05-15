# Cronograma — Gantt WBS

## Rota e Entidades

- **Rota:** `/planejamento/cronograma`
- **Página:** `src/pages/Planejamento/Cronograma.jsx`
- **Componente Gantt:** `src/components/cronograma/GanttChart.jsx`
- **Entidade:** `TarefaCronograma` (tabela `tarefas_cronograma`)

## Visão Geral

Cronograma com Gantt customizado, suporte a hierarquia WBS até 9 níveis, baseline, filtros e vínculo com 6WLA. Status calculado no front com base nos percentuais de progresso.

## Campos

| Campo | Tipo | Notas |
|---|---|---|
| `codigo_wbs` | TEXT | Código da estrutura analítica |
| `nome` | TEXT | Nome da atividade |
| `tipo` | TEXT | Resumo / Atividade / Marco |
| `nivel` | INTEGER | CHECK (1 a 9) — define hierarquia WBS |
| `pai_id` | UUID FK → self | Referência ao nó pai |
| `inicio_baseline` / `termino_baseline` | DATE | Linha de base |
| `data_inicio_planejada` / `data_fim_planejada` | DATE | Planejamento original |
| `data_inicio_real` / `data_fim_real` | DATE | Datas efetivas |
| `inicio_previsto` / `termino_previsto` | DATE | Previsão de conclusão |
| `percentual_previsto` | NUMERIC 0–100 | |
| `percentual_real` | NUMERIC 0–100 | |
| `area` | TEXT | |
| `disciplina` | TEXT | |
| `caminho_critico` | BOOLEAN | |
| `predecessoras` | TEXT | IDs de predecessoras |
| `status` | TEXT | Calculado (ver fórmula abaixo) |

## Fórmula de Status (calculado no front)

```
Se prev = 0 E real = 0  → "A Iniciar"
Se real = 100           → "Concluído"
Se prev > real          → "Atrasada"
Se real >= prev         → "Em Andamento"
```

## Comportamentos Principais

- **Gantt:** barra principal + barra de baseline abaixo; sem escala "Dias" (apenas Semana e Mês)
- **Largura:** Gantt ocupa maior parte da tela; coluna de tarefas mais estreita
- **Botão 6WLA:** filtra e exibe atividades das próximas 6 semanas
- **Filtro por Status:** dropdown com os 4 status possíveis
- **Hierarquia:** colunas WBS com indentação visual por `nivel` (até 9 níveis)
- **Import:** pop-up de mapeamento de colunas do arquivo com as do sistema
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme; barras Gantt coloridas por status
- Caminho crítico destacado
- Botões Salvar: `bg-emerald-600`

## Documentos Relacionados

- [6WLA](./22-SixWLA.md) | [Suprimentos](./10-Suprimentos.md) | [RDO](./20-RDO.md)
- [DATABASE.md — tarefas_cronograma](../architecture/DATABASE.md)
