# Admin de Agentes — Visual Design Spec

> Decisões visuais aprovadas pelo PO em brainstorm com o Visual Companion (2026-06-02).
> Este documento é a referência de layout para a implementação frontend (Tasks 4–8 do plano).

---

## 1. Estrutura Global da Página

Página única `/configuracoes/agentes-admin` com **4 abas horizontais** no padrão de `Cadastros.jsx`:

```
[ Agentes ]  [ Tools ]  [ Métricas & Custos ]  [ Provedores ]
```

- Barra de abas sticky no topo, abaixo do `PageHeader`
- Conteúdo de cada aba em `<div className="p-6 md:p-8"><div className="max-w-7xl mx-auto">`

---

## 2. Aba — Agentes (listagem)

**Layout aprovado: Lista vertical** (opção A)

- Cards em coluna, cada card com:
  - Ícone colorido (lucide-react, cor do agente com `bg-[cor]/10`)
  - Nome em `font-semibold`
  - Subtítulo: `provider / modelo · N tools ativas`
  - Badge de status (Ativo / Inativo)
  - `RowActions` (editar)
- Botão "Novo agente" (`bg-emerald-600`) no canto superior direito
- Empty state com texto centralizado quando lista vazia

---

## 3. Editor de Agente (página dedicada)

**Layout aprovado: Página dedicada com stepper horizontal no topo**

Rota: `/configuracoes/agentes-admin/[slug]` (ou modal full-screen se rota separada for complexa demais)

### Estrutura da página

```
┌─────────────────────────────────────────────────────────────┐
│  ← Admin de Agentes / Analista de Dados    [Cancelar] [Salvar] │
├─────────────────────────────────────────────────────────────┤
│  ①─────②─────③─────④                                        │
│  Identidade  Modelo  Prompt  Tools                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Conteúdo do passo (largura total)                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [← Anterior]                          [Próximo →]          │
└─────────────────────────────────────────────────────────────┘
```

### Stepper

- Círculo numerado: **azul escuro** (`hsl(210 62% 16%)`) = passo ativo
- Círculo com ✓: **verde** (`hsl(142 76% 36%)`) = passo concluído
- Círculo cinza = passo pendente
- Conector entre passos: verde quando concluído, cinza quando pendente
- Clicável para navegar entre passos já visitados

### Passo 1 — Identidade

Campos em grid 2 colunas:
- `Nome` (Input)
- `Slug / endpoint` (Input read-only, fundo cinza, font-mono) — editável só na criação
- `Descrição` (Input, col-span-2)
- `Ícone` (Input com nome do ícone lucide) + `Cor` (color picker + Input hex) em grid 2
- `Ativo` (Switch) com label "Agente ativo" em verde quando ligado
- `Sugestões de prompt` — chips com `×` para remover + botão "+ Adicionar" tracejado

### Passo 2 — Modelo

- `Provider` (Select) → `Modelo` (Select dependente do provider)
- Card de status da chave API: badge **verde "✓ Configurada"** ou **vermelho "Ausente"** — read-only, sem campo de token
- `Temperatura` — slider 0–2 com valor numérico ao lado
- `Max Tokens` — Input numérico (vazio = sem limite)

### Passo 3 — Prompt

- `instructions` — Textarea grande, `font-mono`, `text-xs`, ~10 linhas
- Box de "Injeção automática" (fundo cinza suave, borda) com 3 Switches:
  - Injetar schema do banco
  - Injetar data atual
  - Forçar filtro por projeto
- Hint de variáveis disponíveis: `{schema}` `{hoje}` `{projeto_id}`

### Passo 4 — Tools

- 4 tool chips em **grid 4 colunas** (largura total aproveitada):
  - `get-schema` · `execute-sql` · `analyze-table` · `query-database`
  - Cada chip: Switch + nome em `font-mono` + descrição curta
- Seção "Tools SQL Customizadas": lista das tools vinculadas ou empty state com link para a aba Tools
- Botão final: **"✓ Concluir e Salvar"** (`bg-emerald-600`)

---

## 4. Aba — Tools (listagem + editor)

- Mesma estrutura de lista vertical dos Agentes
- Cada item: ícone `Code2`, nome em `font-mono`, descrição, badges dos parâmetros (`$1: nome`, `$2: tipo`)
- Editor da tool como `FormDialog` (modal, **não** página dedicada — tools são menores)
- Campos do formulário: nome, descrição (para o LLM), SQL template (textarea mono), parâmetros (lista dinâmica nome/tipo/descrição)

---

## 5. Aba — Métricas & Custos

**Layout aprovado (combinação A+B+C):**

### Estrutura vertical (scroll)

```
① Barra de filtros
② Banner de custo (azul escuro gradiente)
③ Gráfico de área — Execuções por dia (largura total)
④ Grid 3 colunas: Por agente | Por modelo | Top usuários
```

### ① Filtros
- Período: dois `<input type="date">` nativos (from / to)
- Dropdown "Todos os agentes" (`MultiSelectDropdown` ou Select)
- Dropdown "Todos os usuários"

### ② Banner de custo (`bg-gradient` azul escuro)
- Lado esquerdo: label "Custo Total — [mês/ano]", valor grande em `font-extrabold`, subtítulo com execuções + tokens
- Lado direito: 2 mini-cards com fundo `rgba(255,255,255,0.1)`:
  - "vs mês anterior" com variação em **ciano `#26FFFF`** (↑ / ↓ %)
  - "custo médio" em branco

### ③ Execuções por dia
- `AreaChart` (Recharts) com gradiente `#26405d` (15% → transparente)
- Linha `stroke="#26405d"` strokeWidth 2
- Eixo X com datas, sem eixo Y numérico (só gradiente)

### ④ Grid 3 colunas

**Por agente** — barras horizontais com progresso:
- Nome do agente em `font-semibold`
- Abaixo do nome: `N exec · $X.XXX` (custo em cor do agente)
- Barra de progresso (`height: 5px`) colorida por agente

**Por modelo** — gráfico de barras verticais com eixos completos:
- Eixo Y em `%` (0% → 100%), linhas de grade
- Barras coloridas (`#26405d` · `#c35e1e` · `#00a49a`)
- Percentual exibido acima de cada barra
- Labels dos modelos no eixo X

**Top usuários** — lista ranqueada:
- Avatar circular com iniciais, cor por posição
- Email + `N exec · $X.XXX`

---

## 6. Aba — Provedores

- Cards por provider (OpenAI, Anthropic, Google, Groq)
- Cada card: nome, `envKey` como badge `font-mono`, instrução de configuração
- Tabela de preços por modelo: `modelo | input/1k | output/1k`
- Sem campo de token — somente leitura e referência

---

## 7. Design System — Referências

| Token | Valor |
|---|---|
| Cor primária (azul) | `hsl(210 62% 16%)` — `#102A44` |
| Verde success | `hsl(142 76% 36%)` |
| Laranja agente 2 | `#c35e1e` |
| Ciano agente 3 | `#00a49a` |
| Ciano destaque (dark) | `#26FFFF` |
| Muted text | `hsl(210 19% 58%)` |
| Border | `hsl(210 20% 88%)` |
| Botão "Novo" | `bg-emerald-600 hover:bg-emerald-700` |
| Botão "Salvar" | `variant="save"` |

**Componentes reutilizados:** `FormDialog`, `KPICard`, `PageHeader`, `RowActions`, `Switch`, `Select`, `Textarea`, `Input`, `Slider`, `Badge`, `Skeleton`.

---

## 8. Mockups Salvos

Arquivos HTML em `.superpowers/brainstorm/` (cobertos pelo `.gitignore`):
- `layout-agentes.html` — opção A aprovada
- `editor-layout.html` — opção C aprovada
- `metrics-combined-v4.html` — layout combinado final aprovado
- `agent-editor-v2.html` — stepper horizontal aprovado
