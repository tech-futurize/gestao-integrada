# Spec — Redesign Módulo 5: 6WLA (6-Week Lookahead)

**Data:** 2026-05-27  
**Status:** Aprovado pelo PO  
**Milestone:** Backlog 2026-Q2 — Onda 2, Módulo 5

---

## Contexto

O módulo 6WLA atual é uma tabela de entrada manual desconectada do cronograma. O redesign transforma o módulo em uma ferramenta de lookahead real: atividades vêm diretamente de `tarefas_cronograma`, restrições são registradas inline por categoria, e pills S1–S6 permitem navegar pelas próximas 6 semanas.

---

## Decisões de Design (validadas com PO)

| Tópico | Decisão |
|--------|---------|
| Pills S1–S6 | Multi-select toggle; todas ativas = sem filtro |
| Escopo de atividades | Auto-import próximas 6 semanas + ajuste manual via modal |
| Restrições | 6 checkboxes inline = mesmas 6 categorias da UI atual |
| Vínculo cronograma | Read-only: nome, datas, área, disciplina, % prev, % real |
| PPC | Removido; substituído por `avanco_previsto` + `avanco_realizado` do cronograma |

---

## Schema — `itens_6wla`

### Colunas removidas
`semana_ano`, `atividade`, `responsavel`, `restricoes` (TEXT), `categoria_restricao`, `status`, `ppc`

### Colunas adicionadas

| Coluna | Tipo | Notas |
|--------|------|-------|
| `tarefa_cronograma_id` | UUID FK → tarefas_cronograma | NOT NULL |
| `restricao_projeto_eng` | BOOLEAN | default false |
| `restricao_material` | BOOLEAN | default false |
| `restricao_mao_obra` | BOOLEAN | default false |
| `restricao_equipamentos` | BOOLEAN | default false |
| `restricao_externas` | BOOLEAN | default false |
| `restricao_informacoes` | BOOLEAN | default false |
| `observacao` | TEXT | |

### Índice único
```sql
CREATE UNIQUE INDEX itens_6wla_tarefa_projeto_uniq
  ON itens_6wla (tarefa_cronograma_id, projeto_id);
```

### Dados read-only via JOIN (não persistidos em itens_6wla)
`tarefas_cronograma`: `nome`, `area`, `disciplina`, `inicio_previsto`, `termino_previsto`, `avanco_previsto`, `avanco_realizado`, `status`

---

## Layout da UI

```
┌─────────────────────────────────────────────────────────────────┐
│ PageHeader                      [+ Adicionar do Cronograma]     │
├─────────────────────────────────────────────────────────────────┤
│  KPIs (7 cards)                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ...       │
│  │ Total    │ │ Proj/Eng │ │ Material │ │  MO      │           │
│  │    18    │ │    5     │ │    3     │ │    7     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  Pills S1–S6 (multi-select)                                     │
│  [●S1 Sem.23] [●S2 Sem.24] [S3 Sem.25] [S4 Sem.26] [S5][S6]   │
├────────────────┬──────┬──────┬──────┬──────────────┬──────┬────┤
│ Atividade      │ Sem. │%Prev │%Real │ Restrições   │ Obs. │ ✕  │
├────────────────┼──────┼──────┼──────┼──────────────┼──────┼────┤
│ Fundação Bl.1  │[S1]  │  40% │  35% │☑ □ ☑ □ □ □  │  …   │ 🗑 │
│ Estrutura Bl.2 │[S2][S3]│20% │  18% │□ ☑ □ □ □ □  │  …   │ 🗑 │
└────────────────┴──────┴──────┴──────┴──────────────┴──────┴────┘
```

### Pills S1–S6

- S1 = semana atual, S2 = +1 semana, …, S6 = +5 semanas
- Tooltip mostra período (ex: "23/jun – 29/jun")
- Estado inicial: todas ativas
- Visual: fundo colorido = ativa; outline = inativa
- Filtro: tabela exibe apenas atividades que sobrepõem alguma semana ativa

### KPIs (7 cards)

| Card | Valor |
|------|-------|
| Total Atividades | `itens_6wla.length` |
| Proj/Engenharia | `count where restricao_projeto_eng = true` |
| Material/Suprimentos | `count where restricao_material = true` |
| Mão de Obra | `count where restricao_mao_obra = true` |
| Equipamentos | `count where restricao_equipamentos = true` |
| Externas/Regulatórias | `count where restricao_externas = true` |
| Informações/Decisões | `count where restricao_informacoes = true` |

### Coluna "Sem."
Badge(s) read-only calculados no front por sobreposição de `inicio_previsto`/`termino_previsto` da tarefa com a janela de cada semana. Não persistidos.

### Checkboxes inline
6 colunas compactas com ícone abreviado (Proj, Mat, MO, Eq, Ext, Info) e tooltip com nome completo. Cada marcação dispara `updateMut` (patch cirúrgico no campo booleano).

### Coluna Observação
Ícone de lápis; clique abre popover inline com `<textarea>`. Salvo ao fechar o popover.

### Banner de auto-sync
Ao carregar, o front detecta atividades do cronograma das próximas 6 semanas sem registro em `itens_6wla` e exibe:
> _"N atividades novas encontradas no cronograma. [Importar automaticamente]"_

Não cria registros sem confirmação do usuário.

### Modal "+ Adicionar do Cronograma"
- Campo de busca por nome, área ou disciplina
- Lista de atividades do cronograma **sem** registro em `itens_6wla`
- Checkbox múltiplo
- Botão "Adicionar N atividades" → `bulkCreateMut`

---

## Dados e Queries

### Query principal
Duplo fetch + merge no front (padrão do projeto, sem view adicional no banco):

```js
// Q1 — registros 6WLA do projeto
useQuery(["itens_6wla", selectedProjectId], () =>
  entities.Item6WLA.filter({ projeto_id: selectedProjectId })
)

// Q2 — atividades do cronograma
useQuery(["tarefas_cronograma", selectedProjectId], () =>
  entities.TarefaCronograma.filter({ projeto_id: selectedProjectId, tipo: "Atividade" })
)

// Merge via useMemo
const merged = useMemo(() =>
  itens6wla.map(item => ({
    ...item,
    tarefa: tarefas.find(t => t.id === item.tarefa_cronograma_id)
  }))
, [itens6wla, tarefas])
```

### Cálculo das semanas S1–S6

```js
function getSemanas(hoje) {
  return Array.from({ length: 6 }, (_, i) => {
    const inicioSemana = startOfWeek(addWeeks(hoje, i), { weekStartsOn: 1 });
    const fimSemana = endOfWeek(inicioSemana, { weekStartsOn: 1 });
    return { label: `S${i + 1}`, start: inicioSemana, end: fimSemana };
  });
}

function getSemanasBadge(tarefa, semanas) {
  return semanas
    .filter(s =>
      tarefa.inicio_previsto <= s.end &&
      tarefa.termino_previsto >= s.start
    )
    .map(s => s.label);
}
```

> Usar `date-fns` se disponível. Fallback: cálculo manual com `Date`.

### Mutations

| Mutation | Operação |
|----------|----------|
| `createMut` | Cria registro em `itens_6wla` com todos booleanos = false |
| `updateMut` | Patch cirúrgico em campo booleano ou `observacao` |
| `deleteMut` | Remove registro de `itens_6wla` (cronograma intocado) |
| `bulkCreateMut` | Criação em lote via modal |

---

## O que é removido do componente atual

| Item | Localização | Ação |
|------|-------------|------|
| Campo Responsável | `SixWLA.jsx:46,257,278,337-340` | Deletar |
| Modal de criação manual | `SixWLA.jsx:175-178, 318-378` | Substituir pelo modal do cronograma |
| Campo PPC | form + tabela | Deletar |
| Campo Status | form + tabela | Deletar |
| Select `semana_ano` | form | Deletar |
| `EMPTY_FORM`, `WEEKS_OF_YEAR` | constantes | Deletar |
| `STATUS_OPTIONS`, `STATUS_COLORS` | constantes | Deletar |
| Filtros de Semana/Status/Categoria | dropdowns | Substituir pelas pills S1–S6 |

---

## Fora de Escopo

- Escrita de volta ao cronograma (nenhum campo de `tarefas_cronograma` é alterado pelo 6WLA)
- Histórico de restrições por semana
- Notificações ou alertas por restrição
- Permissões granulares por categoria de restrição
