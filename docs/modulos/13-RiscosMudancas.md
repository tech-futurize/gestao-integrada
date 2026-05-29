# M13 — Riscos e Mudanças

> Módulo consolidado com duas sub-rotas: Gestão de Riscos e Gestão de Mudanças.

## Rotas e Entidades

| Sub-módulo | Rota | Página | Entidades |
|---|---|---|---|
| Gestão de Riscos | `/riscos-mudancas/gestao-riscos` | `src/pages/RiscosMudancas/GestaoRiscos.jsx` | `Risco` (tabela `riscos`), `Acao` (tabela `acoes`) |
| Gestão de Mudanças | `/riscos-mudancas/gestao-mudancas` | `src/pages/RiscosMudancas/GestaoMudancas.jsx` | `MudancaContratual` (tabela `mudancas_contratuais`), `Pleito` (tabela `pleitos`) |

---

## Gestão de Riscos

### Visão Geral

Identificação, avaliação e monitoramento de riscos com matriz de probabilidade × impacto (5×5). Inclui aba **Plano de Ação** para ações corretivas vinculadas a riscos ou mudanças.

### KPIs (topo)

- Total de Riscos | Críticos (score ≥ 12) | Ativos | Mitigados
- Cards por categoria (7 categorias com cores individuais)

### Matriz de Risco (5×5)

Exibe quantidade de riscos por célula (probabilidade × impacto). Legenda de cores:
- Vermelho: Crítico (≥ 12) | Âmbar: Alto (6–11) | Amarelo: Moderado (4–5) | Verde: Baixo (1–3)

### Campos — Risco

| Campo | Tipo | Notas |
|---|---|---|
| `codigo` | TEXT | Ex: RSC-001 |
| `descricao` | TEXT | Obrigatório |
| `categoria` | TEXT | Técnico / Financeiro / Prazo / Segurança / Regulatório / Ambiental / Outros |
| `probabilidade` | INTEGER (1–5) | |
| `impacto` | INTEGER (1–5) | |
| `score` | INTEGER | Calculado: `probabilidade × impacto` |
| `status` | TEXT | Ativo / Mitigado / Encerrado |
| `responsavel` | TEXT | |
| `plano_resposta` | TEXT | Ações de mitigação |
| `impactos` | JSONB | Array: `["Escopo", "Prazo", "Valor"]` (múltipla seleção) |
| `escopo_texto` | TEXT | Visível quando "Escopo" marcado |
| `prazo_dias` | INTEGER | Visível quando "Prazo" marcado |
| `valor_impacto` | NUMERIC | Visível quando "Valor" marcado |

### Plano de Ação (aba separada)

Componente: `src/components/riscos/PlanoAcao.jsx`

| Campo | Tipo | Notas |
|---|---|---|
| `descricao` | TEXT | Obrigatório |
| `formato_tratativa` | TEXT | Reunião / Documento / Inspeção / Análise Técnica / Negociação / Outros |
| `status` | TEXT | Pendente / Em Andamento / Concluída / Atrasada / Cancelada |
| `data_inicio_prevista` | DATE | |
| `data_fim_prevista` | DATE | |
| `responsavel` | TEXT | |
| `observacoes` | TEXT | |
| `registro_risco_id` | UUID | FK → `riscos` |
| `registro_mudanca_id` | UUID | FK → `mudancas_contratuais` |

---

## Gestão de Mudanças

### Visão Geral

Controle de mudanças contratuais (escopo, prazo, valor). Dashboard executivo com scatter chart de impacto custo × prazo, KPIs de desvio e tabela com CRUD completo.

### Dashboard Executivo

Componente: `src/components/mudancas/DashboardExecutivo.jsx`

- KPIs: Desvio de Prazo total | Adição/Redução de Valor | Adição/Redução de Escopo
- Breakdown positivo/negativo por KPI
- Scatter chart com encoding: X = Custo, Y = Prazo, Tamanho = Impacto Escopo, Cor = Status

### Campos — MudancaContratual

| Campo | Tipo | Notas |
|---|---|---|
| `titulo` | TEXT | Obrigatório |
| `descricao` | TEXT | Obrigatório |
| `origem` | TEXT | Contratada / Contratante |
| `status` | TEXT | Identificada / Em Análise / Em Negociação / Aprovada / Rejeitada |
| `data_ocorrencia` | DATE | Data do registro |
| `impacto_custo` | NUMERIC | Positivo = acréscimo; negativo = redução |
| `impacto_prazo_dias` | INTEGER | Positivo = atraso; negativo = antecipação |
| `impacto_escopo` | TEXT | Descrição do impacto |
| `impacto_escopo_tipo` | TEXT | Adição ou `null` |
| `responsavel` | TEXT | |
| `observacoes` | TEXT | |
| `categorias` | JSONB | Array: `["Escopo", "Prazo", "Custo"]` |
| `pleito_id` | UUID | FK → `pleitos` (opcional) |

### Formulário (MudancaForm)

Componente: `src/components/mudancas/MudancaForm.jsx`

- Toggle visual para Origem (Contratada / Contratante)
- Badge tags para Categorias de Impacto (tríade)
- Vinculação opcional a Pleito existente
- Usa tokens de design (`bg-muted`, `border-border`, `text-muted-foreground`) — compatível com dark mode

---

## Comportamentos Comuns

- `enabled: !!selectedProjectId` em todas as queries
- `useProject()` para obter `selectedProjectId` (nunca `localStorage` direto)
- Toast de sucesso e erro em todas as mutações
- Delete protegido por `AlertDialog` de confirmação em todas as tabelas
- Filtros via `FilterBar` (status, categoria/origem)
- Importar/Exportar via `ImportExportDialog`

## UX / Design

- Botões salvar: `bg-emerald-600 hover:bg-emerald-700 text-white`
- Score de risco colorido: verde (baixo) → amarelo (moderado) → âmbar (alto) → vermelho (crítico)
- Status das mudanças: slate (Identificada) / blue (Em Análise) / amber (Em Negociação) / green (Aprovada) / red (Rejeitada)
- Dual theme claro/escuro

## Documentos Relacionados

- [Mapa de Impacto](./21-MapaImpacto.md)
- [Pleitos](./03-Pleitos.md)
- [DATABASE.md — riscos, acoes, mudancas_contratuais](../architecture/DATABASE.md)
- [13-GestaoRiscos.md](./13-GestaoRiscos.md) — doc legado (substituído por este)
- [08-GestaoMudancas.md](./08-GestaoMudancas.md) — doc legado (substituído por este)
