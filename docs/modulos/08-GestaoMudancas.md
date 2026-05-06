# Módulo: Gestão de Mudanças Contratuais

## Visão Geral

O módulo de Gestão de Mudanças controla as **alterações contratuais** — formais ou informais — que impactam o escopo, custo ou prazo do contrato. Cada mudança percorre um fluxo de aprovação desde a identificação até a aprovação ou rejeição.

O módulo serve como **registro de impactos sobre o contrato base**. Mudanças aprovadas incrementam (ou reduzem) o valor e o prazo do contrato original, sendo fundamentais para a gestão do Termômetro de Desvio que compara o valor atual do contrato com o valor original.

---

## Acesso

Rota: `/GestaoMudancas`  
Menu lateral: **"Gestão de Mudanças"** (ícone `GitBranch`)

---

## Entidade de Dados

**MudancaContratual** — campos completos:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `titulo` | string | Sim | Título resumido e identificável da mudança (máx. 100 chars) |
| `descricao` | string | Sim | Descrição técnica da mudança e sua justificativa |
| `origem` | string (enum) | Sim | Quem originou: `"Contratada"` ou `"Contratante"` |
| `status` | string (enum) | Sim | Identificada, Em Análise, Em Negociação, Aprovada, Rejeitada |
| `data_ocorrencia` | date | Sim | Data em que a mudança foi identificada ou ocorreu |
| `impacto_custo` | number | Não | Impacto financeiro em R$ — positivo = acréscimo, negativo = dedução |
| `impacto_prazo_dias` | number | Não | Impacto em dias — positivo = atraso, negativo = antecipação |
| `impacto_escopo` | string | Não | Descrição qualitativa do que entra ou sai do escopo |
| `categorias` | array de strings | Não | Tríade de impacto: `["Escopo"]`, `["Custo", "Prazo"]`, etc. |
| `responsavel` | string | Não | Responsável interno pelo acompanhamento da mudança |
| `observacoes` | string | Não | Observações adicionais, histórico de negociação |
| `projeto_id` | string (FK) | Sim | Projeto ao qual a mudança pertence |

---

## Estrutura em Abas

O módulo é organizado em **3 abas**:

| Aba | Componente | Descrição |
|---|---|---|
| **Workflow de Mudanças** | `MudancaKanban` | Board Kanban com o fluxo de aprovação |
| **Termômetro de Desvio** | `MudancaTermometro` | Indicador visual do desvio em relação ao contrato base |
| **Dashboard Executivo** | `DashboardExecutivo` | Gráficos e métricas consolidadas |

---

## Aba 1: Workflow de Mudanças (Kanban)

### Resumo no Topo (3 cards)

Antes do board Kanban, exibe 3 cards de resumo:

| Card | Cálculo | Cor |
|---|---|---|
| **Impacto Custo Aprovado** | Soma de `impacto_custo` onde `status = "Aprovada"` | Terracota (se positivo) / Verde (se negativo) |
| **Impacto Prazo Aprovado** | Soma de `impacto_prazo_dias` onde `status = "Aprovada"` | Vermelho (se positivo/atraso) / Verde (se negativo/antecipação) |
| **Total de Mudanças** | `COUNT(*)` de todas as mudanças | Azul |

### Board Kanban

Grid de **5 colunas** representando os estágios do fluxo:

| Coluna | Status | Cor do Cabeçalho |
|---|---|---|
| Identificada | `"Identificada"` | Cinza (`bg-gray-100`) |
| Em Análise | `"Em Análise"` | Azul (`bg-blue-100`) |
| Em Negociação | `"Em Negociação"` | Amarelo (`bg-yellow-100`) |
| Aprovada | `"Aprovada"` | Verde (`bg-green-100`) |
| Rejeitada | `"Rejeitada"` | Vermelho (`bg-red-100`) |

**Cabeçalho de cada coluna:**
- Nome do status
- Badge com contador: número de mudanças naquele estágio

**Estado vazio de coluna:**
- Borda tracejada cinza
- Texto centralizado: "Nenhuma" com ícone sutil

### Card de Mudança (MudancaCard)

Cada mudança é exibida como um card dentro de sua coluna:

```
┌──────────────────────────────────────┐
│ [Badge: Contratada/Contratante]      │
│ Título da Mudança                    │
│                                      │
│ [Escopo] [Prazo] [Custo]  ← categorias │
│                                      │
│ 💰 R$ +45.000,00  (vermelho/verde)  │
│ 📅 +15 dias        (vermelho/verde)  │
│ 👤 João Silva                        │
│                                      │
│ [→ Em Análise]  [✏️]  [🗑️]          │
└──────────────────────────────────────┘
```

**Detalhamento do card:**

- **Badge de origem:**
  - Contratada: `bg-blue-100 text-blue-700`
  - Contratante: `bg-amber-100 text-amber-700`

- **Badges de categoria:**
  - Escopo: `bg-blue-100 text-blue-700`
  - Prazo: `bg-orange-100 text-orange-700`
  - Custo: `bg-green-100 text-green-700`

- **Impacto Financeiro:**
  - Positivo (acréscimo): texto vermelho, prefixo "+"
  - Negativo (redução): texto verde, sinal "-"
  - Zero: não exibido ou "sem impacto"

- **Impacto de Prazo:**
  - Positivo (atraso): texto vermelho + ícone de calendário com alerta
  - Negativo (antecipação): texto verde
  - Zero: não exibido

- **Botão de avanço de status:**
  - Exibido apenas se houver próximo status na sequência
  - Texto: "→ [Próximo Status]" (ex: "→ Em Análise")
  - Cor: outline cinza
  - Colunas "Aprovada" e "Rejeitada": sem botão de avanço (status final)

- **Hover do card:** sombra aumentada (`hover:shadow-md`), transição suave

### Sequência de Avanço de Status

```
Identificada → Em Análise → Em Negociação → Aprovada
                                          ↘ Rejeitada (de qualquer etapa)
```

**Botão de avanço:** ao clicar, chama `update(id, { status: proximoStatus })` e invalida a query. A mudança sai de uma coluna e aparece na próxima imediatamente.

**Rejeição:** não há botão de rejeição no card (o usuário deve editar o formulário e mudar para "Rejeitada" manualmente).

### Responsividade do Kanban

- **Desktop (≥1280px):** 5 colunas em linha
- **Tablet (768px-1279px):** scroll horizontal habilitado
- **Mobile:** scroll horizontal habilitado

---

## Aba 2: Termômetro de Desvio (`MudancaTermometro`)

O Termômetro de Desvio é um componente visual que mostra o **quanto o contrato desviou do valor e prazo originais** em função das mudanças aprovadas.

### Dados Utilizados

- **Valor original do contrato:** `Projeto.valor_contrato` (buscado da entidade Projeto)
- **Mudanças aprovadas:** todas as `MudancaContratual` com `status = "Aprovada"`

### Métricas Calculadas

| Métrica | Fórmula |
|---|---|
| Impacto de custo aprovado | Σ `impacto_custo` das mudanças aprovadas |
| Valor atual do contrato | `valor_contrato + impacto_custo_aprovado` |
| % de desvio de custo | `(impacto_custo_aprovado / valor_contrato) × 100` |
| Impacto de prazo aprovado | Σ `impacto_prazo_dias` das mudanças aprovadas |
| % mudanças aprovadas | `COUNT(Aprovadas) / COUNT(Total) × 100` |

### Componente Visual

- **Termômetro de custo:** barra vertical ou indicador colorido mostrando o % de desvio
  - Verde: desvio ≤ 5%
  - Amarelo: desvio entre 5% e 15%
  - Vermelho: desvio > 15%
- **Cards de resumo:** valor original, valor atual, diferença em R$ e %
- **Separação por categoria:** desvio de Custo, Prazo e Escopo em cards individuais

---

## Aba 3: Dashboard Executivo (`DashboardExecutivo`)

Visão gerencial consolidada com:

- **Gráfico de barras:** mudanças por status (quantidades)
- **Gráfico de pizza:** distribuição por origem (Contratada vs. Contratante)
- **Gráfico de barras empilhadas:** evolução temporal (mudanças por mês de ocorrência)
- **Tabela resumo:** total de impacto por categoria (Custo, Prazo, Escopo) separado por status
- **Comparativo origem:** Contratada vs. Contratante em volume e impacto financeiro

---

## Formulário de Criação/Edição (`MudancaForm`)

**Comportamento:**
- Exibido como **card embutido na página** (não modal)
- Aparece acima do board Kanban ao clicar em "Nova Mudança"
- Cabeçalho com gradiente suave (cinza-azulado ou verde claro)

**Campos do formulário — layout em 2 colunas:**

**Linha 1:**
| Campo | Largura | Componente |
|---|---|---|
| Título da Mudança | 2/3 | Input texto (obrigatório) |
| Data da Ocorrência | 1/3 | Input date (obrigatório) |

**Linha 2 — Origem (toggle visual):**
- Dois botões lado a lado cobrindo largura total
- **"Contratada"** — quando selecionado: `bg-blue-600 text-white border-blue-600`
- **"Contratante"** — quando selecionado: `bg-amber-500 text-white border-amber-500`
- Estado desativado: `bg-white text-gray-500 border-gray-300`

**Linha 3 — Categorias (tríade, multi-seleção):**
- Três botões de toggle (podem ser todos, nenhum ou qualquer combinação)
- **"Custo"** ativo: `bg-green-600 text-white`
- **"Prazo"** ativo: `bg-orange-500 text-white`
- **"Escopo"** ativo: `bg-blue-600 text-white`

**Linha 4:**
| Campo | Largura | Componente |
|---|---|---|
| Descrição Técnica | Largura total | Textarea (4 linhas, obrigatório) |

**Linha 5 — Seção "Métricas de Impacto"** (bloco com `bg-gray-50 border rounded-lg p-4`):
| Campo | Largura | Componente | Nota |
|---|---|---|---|
| Impacto Financeiro (R$) | 1/2 | Input número | Positivo = acréscimo, negativo = redução |
| Impacto em Prazo (dias) | 1/2 | Input número | Positivo = atraso, negativo = antecipação |
| Status | 1/2 | Select | Identificada, Em Análise, Em Negociação, Aprovada, Rejeitada |
| Impacto no Escopo | 1/2 | Textarea (2 linhas) | Descrição qualitativa |

**Linha 6:**
| Campo | Largura | Componente |
|---|---|---|
| Responsável | 1/2 | Input texto |
| Observações | 1/2 | Input texto |

---

## Fluxo Completo de Status

```
Identificada
     ↓
Em Análise
     ↓
Em Negociação
     ↓             ↓
  Aprovada      Rejeitada
```

**Notas:**
- Rejeitada pode ser aplicada a partir de qualquer estágio anterior
- Mudanças rejeitadas **não entram** no cálculo do Termômetro de Desvio
- Mudanças aprovadas **impactam permanentemente** o cálculo do valor atual do contrato

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Nova Mudança** | Cabeçalho (aba Kanban) | Verde | Exibe o formulário de criação |
| **Salvar Mudança** | Rodapé do formulário | Verde | Persiste criação ou edição |
| **Cancelar** | Rodapé do formulário | Outline | Fecha o formulário |
| **→ [Próximo Status]** | Card no Kanban | Outline | Avança a mudança para o próximo estágio |
| **Editar** (lápis) | Card no Kanban | Outline | Abre o formulário preenchido |
| **Excluir** (lixeira) | Card no Kanban | Vermelho | Remove a mudança com confirmação |

---

## Lógica de React Query

### Queries

```javascript
// Todas as mudanças do projeto
useQuery({
  queryKey: ['mudancas', selectedProjectId],
  queryFn: () => base44.entities.MudancaContratual.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Dados do projeto (para o valor_contrato no Termômetro)
useQuery({
  queryKey: ['projeto', selectedProjectId],
  queryFn: () => base44.entities.Projeto.list({ id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

### Mutações

- **Criar:** `base44.entities.MudancaContratual.create(data)` → invalida `['mudancas', selectedProjectId]`
- **Avançar Status:** `base44.entities.MudancaContratual.update(id, { status: proximoStatus })` → invalida a query
- **Editar:** `base44.entities.MudancaContratual.update(id, data)` → invalida a query
- **Excluir:** `base44.entities.MudancaContratual.delete(id)` → invalida a query

---

## Cores e Design

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [GitBranch] Gestão de Mudanças Contratuais            │
│ Alterações de escopo, custo e prazo                  │
│                              [Nova Mudança]          │
└──────────────────────────────────────────────────────┘

[Workflow] [Termômetro] [Dashboard]  ← abas
```

### Cards de Resumo (acima do Kanban)
- Layout: 3 cards em linha horizontal
- Destaque nos valores com fonte bold e tamanho grande
- Coloração dinâmica do valor conforme positivo/negativo

### Kanban
- Colunas com header colorido por status
- Cards com bordas suaves, padding `p-4`, `rounded-lg`
- Hover nos cards: `hover:shadow-md` com transição `transition-shadow duration-200`
- Scroll vertical dentro de cada coluna (se muitos cards)

---

## Integração com Outros Módulos

- **Gerenciar Projeto:** o `valor_contrato` cadastrado no projeto é a base do Termômetro de Desvio
- **Dashboard:** o impacto financeiro e de prazo das mudanças aprovadas é exibido no card de resumo
- **Pleitos:** uma mudança não aprovada pode originar um pleito caso haja disputa sobre ela

---

## Estado Vazio

**Sem projeto:**
- Ícone `GitBranch` em cinza
- Título: "Nenhum Projeto Selecionado"

**Com projeto sem mudanças:**
- Todas as 5 colunas do Kanban com estado vazio (borda tracejada + texto "Nenhuma")
- Cards de resumo zerados
