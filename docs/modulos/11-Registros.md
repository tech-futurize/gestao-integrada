# Módulo: Registros (M11)

> Documentação gerada após `/audit` — score ≥ 9 em todas as categorias.
> Referência técnica para futuras manutenções do módulo.

---

## Visão Geral

O módulo **Registros** centraliza o **registro e acompanhamento de ocorrências documentais do contrato**. Engloba documentos contratuais formais (Atas de Reunião, E-mails, Notificações) e alimenta o [Mapa de Impacto](./21-MapaImpacto.md) via campo `impacto_ocorrencia`. Registros podem ser vinculados a Pleitos e a tarefas do cronograma.

**Posição no fluxo contratual:**
```
Contrato → Registros (ocorrência documentada) → Pleitos (reivindicação formal) → Mapa de Impacto
```

---

## Acesso

| Item | Valor |
|------|-------|
| Rota | `/admin-contratual/registros` |
| Menu lateral | "Registros" no grupo **Adm. Contratual** |
| Arquivo da página | `src/pages/AdminContratual/Registros.jsx` |
| Lazy-loaded | Sim (`React.lazy`) |

---

## Entidade de Dados

**`Registro`** → tabela `registros` (via `entities.Registro` em `src/api/supabaseEntities.js`)

| Campo | Tipo | Obrigatório | Valores / Descrição |
|-------|------|-------------|---------------------|
| `projeto_id` | string (FK) | Sim | Projeto ativo |
| `tipo_registro` | string (enum) | Sim | `Ata de Reunião`, `RDO`, `E-mail`, `Notificação` |
| `data_hora` | ISO timestamp | Sim | Data da ocorrência (exibida como `dd/MM/yyyy`) |
| `responsavel_registro` | string | Não | Nome do responsável |
| `descricao` | string | Não¹ | Texto principal (não-RDO) |
| `impacto_preliminar` | string | Não | Avaliação de impacto (não-RDO) |
| `status` | string (enum) | Não | `Registrado` (padrão), `Em Análise`, `Resolvido` |
| `responsabilidade` | string (enum) | Não | `Contratada`, `Contratante` |
| `pleito_id` | string (FK) | Não | Vinculação opcional a Caso/Pleito |
| `impacto_ocorrencia` | string[] | Não | Categorias de impacto selecionadas (ver abaixo) |
| `atividades_vinculadas` | object[] | Não | `[{ id, nome }]` — tarefas do cronograma vinculadas |
| `anexos` | object[] | Não | `[{ nome, url, path, tipo, tamanho }]` — Supabase Storage |
| `ocorrencias` | string | Não | Texto livre de ocorrências (compartilhado entre tipos) |

**Campos exclusivos RDO:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `numero_rdo` | string | Número sequencial do RDO |
| `area` | string | Área de obra |
| `disciplina` | string | `Mecânica`, `Elétrica`, `Estrutura Metálica`, `Tubulação` |
| `atividades` | string | Atividades realizadas no dia |
| `condicoes_climaticas_manha/tarde/noite` | string | `Praticável` / `Impraticável` |
| `mao_de_obra` | object[] | `[{ quantidade, funcao }]` |
| `equipamentos_rdo` | object[] | `[{ quantidade, equipamento }]` |

¹ Obrigatório para tipos não-RDO (validação via `required` no input).

**Categorias de impacto disponíveis:**
`Engenharia`, `Suprimentos`, `Escopo`, `Planejamento`, `Recursos`, `Produtividade`, `Liberação de Área`, `Segurança`, `Qualidade`, `Gestão & Comunicação`

---

## Arquitetura de Componentes

```
src/pages/AdminContratual/Registros.jsx          ← Página principal (CRUD + KPIs)
src/components/pleitos/RegistroForm.jsx           ← Formulário inline create/edit
src/components/pleitos/RegistrosList.jsx          ← Componente tabular legado (não usado pela página atual)
src/components/pleitos/MapaRegistroImpacto.jsx    ← Heatmap temporal (usado em MapaImpacto.jsx)
src/components/pleitos/HeatmapDrilldown.jsx       ← Modal de drill-down do heatmap
```

> `RegistrosList.jsx` é código legado — a página atual usa cards grid, não tabela.
> `MapaRegistroImpacto.jsx` é renderizado em `/admin-contratual/mapa-impacto`, não nesta página.

---

## Estrutura Visual da Página

### 1. KPI Superior (bento grid)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Total]  │  [Por Tipo]          │ [Por Resp.]  │ [Por Status]  │
│  N (glow) │  Ata ── N  ████      │ Contratada   │ Registrado    │
│           │  E-mail ── N ███     │ Contratante  │ Em Análise    │
│           │  Notif. ── N ██      │              │ Resolvido     │
└─────────────────────────────────────────────────────────────────┘
```

- **Card Total**: glassmorphism ciano elétrico com `text-shadow glow` no número.
- **Cards Dimensionais**: glassmorphism neutro (`rgba(255,255,255,0.03)` + `backdrop-filter: blur(8px)`) + barras de proporção por item.
- Responsivo: `grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row`.
- Durante `isLoading`: 4 `<Skeleton>` no mesmo grid.

### 2. Filtros

- **Busca por texto**: pesquisa em `descricao`, `tipo_registro` e `responsavel_registro`.
- **FilterBar**: chips multi-seleção para Tipo, Status e Responsabilidade (persistidos em `localStorage` pela key `"registros-filtros"`).
- **Date range**: dois inputs `type="date"` com `CalendarRange` icon.

### 3. Cards Grid

```
┌────────────────────────────────────────────────────────┐
│  [Badge Tipo]                              [Data]       │
│                                                        │
│  Descrição (line-clamp-3)                              │
│                                                        │
│  ─────────────────────────────────────────────────     │
│  [Status] [Responsável] [📎N] [🔗N]   [Editar][🗑️]   │
└────────────────────────────────────────────────────────┘
```

- Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`.
- Empty state diferenciado: "Nenhum registro cadastrado" vs "Nenhum registro corresponde aos filtros".
- Durante `isLoading`: 6 skeleton cards.

---

## Data Fetching

```js
// Query principal
const { data: incidentes, isLoading, isError } = useQuery({
  queryKey: ["registros", selectedProjectId],
  queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});

// Query auxiliar (vínculos de atividades no form)
const { data: tarefas } = useQuery({
  queryKey: ["tarefas_cronograma", selectedProjectId],
  queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

**Filtragem client-side** (aplicada via `useMemo` sobre `incidentes`):
- Exclui `tipo_registro === "RDO"` do array base (RDOs exibidos separadamente em `/admin-contratual/rdos`).
- Aplica filtros de tipo, status, responsabilidade, dateFrom, dateTo e searchText.

---

## Mutações

| Ação | Função | Invalidação | Feedback |
|------|--------|-------------|---------|
| Criar | `entities.Registro.create(payload)` | `["registros"]` | Toast "Registro criado com sucesso." |
| Editar | `entities.Registro.update(id, payload)` | `["registros"]` | Toast "Registro atualizado com sucesso." |
| Excluir | `entities.Registro.delete(id)` | `["registros"]` | Toast "Registro excluído." |
| Erro | — | — | Toast destructive com `e.message` |

**Payload de create/update:**
```js
{
  ...formData,
  projeto_id: selectedProjectId,
  data_hora: toUtcIso(formData.data_hora),        // date-fns → ISO 8601 UTC
  pleito_id: formData.pleito_id || null,
  mao_de_obra: isRDO ? [...] : [],
  equipamentos_rdo: isRDO ? [...] : [],
  impacto_ocorrencia: [...],                       // array de strings
  anexos: [...existingAnexos, ...newUploads],      // merge de existentes + novos
  atividades_vinculadas: [...],                    // [{ id, nome }]
}
```

---

## Formulário (`RegistroForm.jsx`)

Renderizado **inline** (card embutido abaixo do header) — não como modal flutuante.

### Seções do Form

| Seção | Campos | Condição |
|-------|--------|----------|
| Cabeçalho | Tipo, Data, Responsável | Sempre |
| Campos RDO | Nº RDO, Área, Disciplina, Mão de Obra, Equipamentos, Atividades, Clima | `tipo_registro === "RDO"` |
| Campos Gerais | Descrição\*, Avaliação de Impacto | `tipo_registro !== "RDO"` |
| Ocorrências | Textarea livre | Sempre |
| Vincular Atividades | Modal de seleção por checkbox + busca | Sempre |
| Responsabilidade + Status | Select | Sempre |
| Impacto da Ocorrência | 10 checkboxes em grid 2×5 | Sempre |
| Anexos | Upload múltiplo para Supabase Storage `registros-anexos` | Sempre |
| Associar Pleito | Select opcional | Sempre |

### Upload de Anexos

- Storage bucket: `registros-anexos`
- Path: `{projeto_id}/{uuid}.{ext}`
- Tipos aceitos: `.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt`
- Ao salvar: novos arquivos são enviados via `supabase.storage.upload()`, removidos são deletados via `.remove()`.
- Remoção parcial no storage (falha não bloqueia save — `console.warn`).

---

## Estados do Sistema

| Estado | Implementação |
|--------|--------------|
| **Loading** | `<Skeleton>` em KPI row (4 itens) e cards grid (6 itens) |
| **Empty (sem dados)** | `AlertTriangle` + "Nenhum registro cadastrado" + CTA |
| **Empty (filtros)** | `AlertTriangle` + "Nenhum registro corresponde aos filtros" |
| **Error** | Banner vermelho com "Erro ao carregar registros. Tente recarregar a página." |
| **Success Create** | Toast + fecha form |
| **Success Update** | Toast + fecha form |
| **Success Delete** | Toast (após confirmação no AlertDialog) |
| **Error Mutation** | Toast destructive com mensagem do erro |
| **Sem projeto** | `PageEmptyState` com "Selecione um projeto na barra lateral" |
| **Confirmação Delete** | `AlertDialog` com título + descrição + botão destrutivo |

---

## Acessibilidade

- Botões icon-only com `aria-label="Editar registro"` e `aria-label="Excluir registro"`.
- Labels `htmlFor` em todos os campos do formulário.
- `required` nos campos obrigatórios (`data_hora`, `descricao` para não-RDO).

---

## Componentes Externos Usados

| Componente | Origem | Uso |
|------------|--------|-----|
| `PageHeader` | `@/components/ui/PageHeader` | Header com botão "Novo Registro" |
| `PageEmptyState` | `@/components/ui/PageEmptyState` | Estado sem projeto selecionado |
| `FilterBar` | `@/components/ui/FilterBar` | Chips multi-seleção persistidos |
| `AlertDialog` | `@/components/ui/alert-dialog` | Confirmação de exclusão |
| `Badge` | shadcn/ui | Tipo, status, responsabilidade nos cards |
| `Skeleton` | shadcn/ui | Loading states |
| `CloseButton` | `@/components/ui/CloseButton` | Fechar RegistroForm |
| `toDateInput / toUtcIso` | `@/lib/dateUtils` | Conversão de datas sem timezone drift |

---

## Integração com Outros Módulos

| Módulo | Tipo | Descrição |
|--------|------|-----------|
| **Mapa de Impacto** (`/admin-contratual/mapa-impacto`) | Consume dados | Lê `incidentes` com `impacto_ocorrencia` para o heatmap temporal |
| **Pleitos** (`/admin-contratual/pleitos`) | FK opcional | `pleito_id` vincula o registro a um Caso |
| **Cronograma** | FK opcional | `atividades_vinculadas[].id` referencia `TarefaCronograma.id` |
| **RDOs** (`/admin-contratual/rdos`) | Filtro | Registros com `tipo_registro === "RDO"` são excluídos desta view |

---

## Audit QA — M11

| Categoria | Score | Data |
|-----------|-------|------|
| Visual | 9/10 | 2026-05-28 |
| Functional | 9/10 | 2026-05-28 |
| Trust | 9/10 | 2026-05-28 |

**Correções aplicadas neste audit:**
- Delete sem confirmação → `AlertDialog` com título + descrição + ação destrutiva
- Sem success toasts → Toasts em create, update e delete
- Botões icon-only sem aria-label → `aria-label` adicionado
- Dimension KPI cards sem glassmorphism → `backdrop-filter: blur(8px)` + transparência aplicados

---

## Histórico de Evolução

| Milestone | Mudança |
|-----------|---------|
| M11 | Cards KPI superiores (Total + 3 grupos dimensionais com barras de proporção) |
| M11 | Filtro date range (dateFrom/dateTo) |
| M11 | Chips de ícones Lucide substituindo emojis nos cards |
| M11 | AlertDialog de confirmação de exclusão |
| M11 | Success toasts em todas as mutações |
| M11 | Glassmorphism nos cards dimensionais |
| Anterior | Form inline com upload de anexos no Supabase Storage |
| Anterior | Modal de seleção de atividades do cronograma com busca |
| Anterior | Suporte a tipo RDO com campos específicos (mão de obra, equipamentos, clima) |
