# Engenharia — Gestão de Documentos Técnicos

Módulo responsável pelo controle e rastreamento do ciclo de vida de documentos de engenharia vinculados ao projeto ativo. Suporta múltiplas disciplinas, revisões e etapas de aprovação, com histórico auditável de cada transição.

---

## Rota e Entidades

| Item | Valor |
|------|-------|
| Rota principal | `/engenharia/documentos` |
| Entidade principal | `DocumentoEngenharia` |
| Tabela Supabase | `documentos_engenharia` |
| Filtro de projeto | `projeto_id = selectedProjectId` |
| Acesso ao shim | `entities.DocumentoEngenharia.list/filter/create/update/delete` |

---

## Campos e Schema

### Tabela `documentos_engenharia`

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | PK | Gerado pelo Supabase |
| `projeto_id` | UUID | Sim | FK → `projetos.id` |
| `tag_id` | TEXT | Sim, único por projeto | Código único de identificação (ex: `MEC-001`) |
| `titulo` | TEXT | Sim | Nome/descrição do documento |
| `disciplina` | TEXT | Sim | `MEC`, `CIV`, `ELE`, `TUB`, `INS`, `AUT`, `EST`, `PRC`, `HSE` |
| `fornecedor` | TEXT | Não | Empresa/projetista responsável pela emissão |
| `num_folhas` | INTEGER | Não | Quantidade total de folhas do documento |
| `revisao_atual` | TEXT | Não | Código da revisão em vigor (ex: `Rev.0`, `Rev.A`) |
| `etapa` | TEXT | Sim | Status no fluxo de aprovação (ver valores abaixo) |
| `progresso` | INTEGER | Não | Percentual de conclusão: 0–100 |
| `prioridade` | TEXT | Não | `Alta`, `Média`, `Baixa` |
| `id_cronograma` | UUID | Não | FK → `tarefas_cronograma.id` (vincula ao cronograma mestre) |
| `data_cronograma` | DATE | Calculado | Auto-preenchida com `termino_previsto` da tarefa vinculada |
| `data_projetada` | DATE | Não | Previsão interna de entrega (era `deadline`) |
| `data_real` | DATE | Não | Data de entrega efetiva |
| `historico_revisoes` | JSONB | Não | Array de `{revisao, data, etapa, observacao}` |
| `historico_etapas` | JSONB | Não | Array de `{etapa, data, usuario}` |
| `created_at` | TIMESTAMPTZ | Auto | Gerado pelo Supabase |
| `updated_at` | TIMESTAMPTZ | Auto | Atualizado pelo Supabase |

> **Migration:** `supabase-migration-engenharia-2026.sql` — renomeia `deadline → data_projetada` e adiciona `id_cronograma`, `data_cronograma`, `data_real`.

### Valores válidos — `etapa`

| Valor | Label exibido |
|-------|---------------|
| `A Emitir` | A Emitir |
| `Em Elaboração` | Em Elaboração |
| `Em Verificação Técnica` | Em Verificação Técnica |
| `Comentários do Cliente` | Comentários do Cliente |
| `Aprovado` | Aprovado |

---

## Comportamentos Principais

### Listagem

- A visualização é uma **tabela paginada** (10 itens/página), sem alternância para Grid ou Kanban.
- Colunas: `TAG/ID`, `Título`, `Disc.`, `Revisão`, `Prioridade`, `ID Cron.`, `Dt. Prev.`, `Dt. Real`, `Progresso`, `Etapa`, `Ações`.
- Todas as colunas (exceto Ações) são clicáveis para ordenação (asc/desc).
- Filtros disponíveis: busca textual por `tag_id`/`titulo`, filtro de disciplina, filtro de fornecedor.
- KPIs no topo: Total Docs, Total Sheets (A4), Progresso Geral, Overdue.
- `Dt. Prev.` aparece em vermelho quando `data_projetada < hoje` e `etapa ≠ Aprovado`.

### Coluna de Ações

Cada linha da tabela possui 3 botões na coluna fixa **Ações**:

| Botão | Ícone | Comportamento |
|-------|-------|---------------|
| Editar | `Pencil` | Abre modal de edição com todos os campos preenchidos |
| Excluir | `Trash2` | Abre `AlertDialog` de confirmação; ao confirmar, executa `deleteMut` |
| Histórico | `History` | Abre `DocDetalhe` dentro de um `<Dialog max-w-4xl>` |

### Modal de Criação / Edição

Abre via botão **Novo Documento** ou botão **Editar** na coluna Ações. Campos:

- TAG/ID, Título, Disciplina, Fornecedor/Responsável
- Etapa, Prioridade, Progresso (%), Nº Folhas A4
- Revisão Atual, Data Projetada, Data Real
- **ID Cronograma** — `<Select>` com lookup em `tarefas_cronograma` filtrado por `selectedProjectId`; ao selecionar, preenche automaticamente `Data Cronograma` com `termino_previsto` da tarefa (ou `termino_baseline` como fallback)
- **Data Cronograma** — campo read-only, auto-preenchido pelo vínculo com cronograma

O modal **não contém** botão Excluir — exclusão ocorre apenas pela coluna Ações.

### Histórico (DocDetalhe)

- `DocDetalhe.jsx` é renderizado dentro de um `<Dialog max-w-4xl>` e recebe `doc`, `onClose` e `onUpdate`.
- Exibe: cabeçalho com metadados do documento, timeline de movimentações (`historico_etapas`), tabela de revisões (`historico_revisoes`).
- Permite adicionar nova revisão via modal interno (z-index 60).
- Não há edição inline de etapa/progresso — toda edição passa pelo modal dedicado.

### Import / Export

- Usa `<ImportExportDialog />` com `xlsx` e `papaparse`.
- Colunas exportadas: `TAG/ID`, `Título`, `Disciplina`, `Fornecedor`, `Nº Folhas`, `Progresso (%)`, `Etapa`, `Prioridade`, `Revisão Atual`, `ID Cronograma`, `Data Cronograma`, `Data Projetada`, `Data Real`.
- Import mapeia colunas pelos labels acima e cria registros via `entities.DocumentoEngenharia.create`.

---

## UX / Design

- **Tema dual:** compatível com modo claro e escuro via variáveis Tailwind CSS.
- **Badge de disciplina:** cor sólida por categoria (MEC → azul, CIV → roxo, ELE → amarelo, TUB → ciano, HSE → verde-limão, etc.).
- **Badge de etapa:** cor semântica (A Emitir → cinza, Em Elaboração → azul, Em Verificação Técnica → amarelo, Comentários do Cliente → roxo, Aprovado → verde).
- **Barra de progresso:** verde ≥ 70%, laranja ≥ 40%, vermelho < 40%.
- **Botão Salvar:** `variant="save"` (emerald/verde do design system).

---

## Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/pages/Engenharia/Documentos.jsx` | Página principal — tabela, KPIs, filtros, modais |
| `src/components/engenharia/DocDetalhe.jsx` | Histórico de revisões e etapas (usado como Dialog) |
| `src/components/engenharia/DocDashboard.jsx` | Dashboard de métricas (uso separado) |
| `supabase-migration-engenharia-2026.sql` | Migration de schema 2026 |

---

## Documentos Relacionados

- [`../architecture/DATABASE.md`](../architecture/DATABASE.md) — Schema completo das tabelas Supabase
- [`00-Indice.md`](00-Indice.md) — Índice geral dos módulos
- [`11-Cronograma.md`](11-Cronograma.md) — Módulo de Cronograma (FK `id_cronograma`)
