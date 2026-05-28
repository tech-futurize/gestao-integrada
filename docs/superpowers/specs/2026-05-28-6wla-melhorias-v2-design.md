---
name: 6wla-melhorias-v2
description: Melhorias ao módulo 6WLA — auto-import silencioso, ícone de adição manual, colunas de datas BL/Real/Projetado, separação Área/Disciplina, filtros no row de semanas, cards KPI clicáveis e renomeação de labels
metadata:
  type: project
  status: approved
  date: 2026-05-28
---

# 6WLA — Melhorias v2

## Escopo

Oito melhorias ao módulo `SixWLA` (`SixWLA.jsx` + `SixWLATable.jsx`) mais uma migration de banco.

---

## 1. Migration SQL

Arquivo: `docs/database/supabase-migration-m6-6wla-v2.sql`

```sql
ALTER TABLE itens_6wla ADD COLUMN IF NOT EXISTS adicionado_manualmente BOOLEAN DEFAULT FALSE;
```

Sem impacto em registros existentes (default `false`).

---

## 2. Auto-import silencioso

**Comportamento atual:** Um banner aparece com botão "Importar automaticamente" quando há novas atividades na janela de 6 semanas.

**Novo comportamento:** Ao resolver os dois queries (itens_6wla + tarefas_cronograma), o sistema detecta automaticamente tarefas na janela sem registro e chama `bulkCreateMut` sem exibir nenhuma notificação (nem banner, nem toast). O banner e seu estado associado são removidos completamente.

**Proteção contra double-execution:** `useRef(false)` flag `autoImported` — assim que o efeito dispara uma vez, nunca roda de novo na mesma sessão.

**Dados criados:** `adicionado_manualmente: false` para todos os registros auto-importados.

---

## 3. Ícone de adição manual

**Campo:** `adicionado_manualmente BOOLEAN` em `itens_6wla`.

**Quando `true`:** Exibe `<Info className="w-3.5 h-3.5 text-blue-400" />` (Lucide) no lado esquerdo da célula de Atividade, com `title="Adicionado manualmente"`.

**Quando `false` ou `null`:** Nenhum ícone exibido.

**Mutation `bulkCreateMut`:** Aceita parâmetro `{ tarefaIds, manualmente }`:
- Auto-import → `manualmente: false`
- Modal "Adicionar do Cronograma" → `manualmente: true`

---

## 4. Novas colunas da tabela

### Separação de Área e Disciplina

A coluna combinada **"Área / Disc."** é substituída por duas colunas independentes:
- **Área** → `tarefa.area`
- **Disciplina** → `tarefa.disciplina`

### Grupos de datas

Três novos grupos de colunas de data (lidas de `item.tarefa`), formatadas com `formatData()` (ex: "23 jun"):

| Header | Campo |
|--------|-------|
| BL Ini | `tarefa.data_inicio_baseline` |
| BL Fim | `tarefa.data_fim_baseline` |
| Real Ini | `tarefa.data_inicio_real` |
| Real Fim | `tarefa.data_fim_real` |
| Proj Ini | `tarefa.inicio_previsto` |
| Proj Fim | `tarefa.termino_previsto` |

Campos nulos exibem "—".

### Coluna ícone (manual flag)

Coluna estreita (sem header) antes da coluna Atividade — exibe o ícone `Info` quando `adicionado_manualmente = true`.

### Scroll horizontal + sticky

A tabela já tem `overflow-x-auto`. A coluna Atividade recebe `sticky left-0 bg-card z-10` para permanecer visível durante o scroll horizontal.

### Renomeação de headers na tabela

| De | Para |
|----|------|
| `Proj/Eng` | `Eng` |
| `Info` | `SSMA` |

---

## 5. Filtros no row das semanas

### Layout

```
[S1 · 28 mai] [S2 · 04 jun] ... [S6 · 02 jul]     [🔍 input]  [Hoje]  [Disciplina ▼]
```

A div existente das pills `flex flex-wrap gap-2` passa a ter `justify-between` (ou `flex items-center` com grupo à esquerda e filtros à direita).

### Filtro de busca

- `<input type="text" placeholder="Buscar por ID ou atividade..." />`
- Filtra em `tarefa.codigo_wbs` (contém) OU `tarefa.nome` (contém, case-insensitive)
- State: `searchText` (string)

### Filtro Hoje

- `<Button variant="outline" size="sm">Hoje</Button>` (toggle)
- Quando ativo: exibe apenas itens onde `hoje >= inicio_previsto AND hoje <= termino_previsto`
- State: `filterHoje` (boolean)
- Destaque visual quando ativo: `bg-primary text-primary-foreground`

### Filtro Disciplina

- `<select>` com opções "Todas" + valores únicos de `tarefa.disciplina` presentes nos `merged` items
- State: `filterDisciplina` (string | "")
- Filtra em `tarefa.disciplina === filterDisciplina` (quando não-vazio)

### Combinação de filtros

Todos os filtros operam em conjunto (AND) sobre `merged`, após o merge com tarefa/semanasBadge e antes do filtro de semanas ativas:

```
merged → filterHoje → searchText → filterDisciplina → filtro semanas ativas → filtroRestricao → filtered
```

`filtroRestricao` é aplicado por último para que o usuário veja apenas os itens com aquela restrição dentro da janela de semanas selecionada.

---

## 6. Cards KPI clicáveis

### Estado

Novo state `filtroRestricao: string | null` em `SixWLA.jsx`.

### Comportamento

- Clicar em um card de restrição → seta `filtroRestricao = r.key`
- Clicar no mesmo card ativo → limpa `filtroRestricao = null`
- Card ativo: `ring-2 ring-amber-500` + cursor-pointer em todos os cards

### Impacto na tabela

Quando `filtroRestricao !== null`, a pipeline de filtros inclui: `.filter(i => i[filtroRestricao] === true)`

### Contagem

Mantida como está: `merged.filter(i => i[r.key]).length` — mostra quantas atividades têm aquela restrição ativa.

---

## 7. Renomear labels (cards topo)

| De | Para |
|----|------|
| Proj/Eng | Engenharia |
| Mat | Materiais |
| Mo | Mão de Obra |
| Eq | Equipamento |
| Ext | Externo |
| Info | SSMA |

Array `RESTRICOES` em `SixWLA.jsx` atualizado com três propriedades:
- `key` — chave do campo (inalterado)
- `cardLabel` — nome exibido nos cards do topo (ex: "Engenharia", "SSMA")
- `tableLabel` — nome exibido no header da tabela (ex: "Eng", "SSMA")
- `full` — nome completo usado em `title` tooltip

A `SixWLATable` recebe `restricoes` com `tableLabel` e usa esse campo para o `<th>` header.

---

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `docs/database/supabase-migration-m6-6wla-v2.sql` | Novo — migration |
| `src/pages/Planejamento/SixWLA.jsx` | Modificação — auto-import, filtros, cards clicáveis, labels |
| `src/components/planejamento/SixWLATable.jsx` | Modificação — ícone, novas colunas, sticky, renomear headers |

---

## Checklist de Verificação

- [ ] Migration aplicada no Supabase
- [ ] Auto-import executa silenciosamente ao carregar dados
- [ ] Atividades adicionadas via modal mostram ícone Info
- [ ] Atividades auto-importadas não mostram ícone
- [ ] Colunas BL/Real/Proj exibem datas formatadas ou "—"
- [ ] Área e Disciplina em colunas separadas
- [ ] Coluna Atividade fixada no scroll horizontal
- [ ] Busca por ID e texto funcionando
- [ ] Filtro Hoje filtra por `inicio_previsto <= hoje <= termino_previsto`
- [ ] Filtro Disciplina popula dinamicamente e filtra corretamente
- [ ] Cards clicáveis filtram a tabela (AND com outros filtros)
- [ ] Labels dos cards topo renomeados
- [ ] Headers Eng e SSMA na tabela
