# Spec: Redesign da Seção Principal — Gestão de Riscos

**Data:** 2026-06-02
**Módulo:** `src/pages/RiscosMudancas/GestaoRiscos.jsx`
**Status:** Aprovado

---

## 1. Contexto

A seção principal da aba "Riscos" hoje exibe os cards de categoria em grid horizontal acima da matriz 5×5. A matriz mostra apenas contagens numéricas por célula, sem identificação dos riscos individuais. O objetivo deste redesign é:

1. Reorganizar o layout para dar mais protagonismo à matriz.
2. Tornar a matriz interativa: cada risco aparece como um chip individual na célula correspondente, com um popup detalhado ao hover.

---

## 2. Layout

### 2.1 Estrutura geral

A seção principal (abaixo dos KPIs e do FilterToolbar, dentro da aba "Riscos") passa a ter **um único bloco flex horizontal** composto por:

| Coluna | Largura flex | Conteúdo |
|--------|-------------|----------|
| Esquerda | `flex: 0 0 72%` | Matriz 5×5 interativa |
| Direita | `flex: 1` | Cards de distribuição por categoria |

As duas colunas têm altura mínima consistente (`min-h-[360px]` ou equivalente) e ficam alinhadas pelo topo.

### 2.2 O que sai

- O bloco `/* Cards por Categoria */` (grid horizontal com 7 cards) que existia acima da matriz é **removido**.
- Sua informação migra para os cards da coluna direita.

---

## 3. Coluna Esquerda — Matriz 5×5 Interativa

### 3.1 Estrutura da célula

Cada célula da grade deixa de exibir um número e passa a exibir **chips individuais**, um por risco posicionado naquela combinação de Probabilidade × Impacto.

- **Dimensões:** `height: ~64px` (fixo), `width: flex 1/5` da linha.
- **Overflow:** `overflow-y: auto` — scroll interno quando há mais chips do que cabem.
- **Cor de fundo:** mantém o esquema atual de severidade (vermelho/âmbar/amarelo/verde) em versão translúcida (`/15` opacity) com borda colorida (`/30`).

### 3.2 Chip individual

```
┌───────────┐
│   R07     │   ← código do risco
└───────────┘
```

- **Aparência normal:** `background: <cor-severidade>/40`, texto na cor clara do nível.
- **Aparência em hover:** `background: <cor-severidade>` sólida, `color: white`, `box-shadow` suave, `outline: 1.5px solid rgba(255,255,255,0.5)`.
- **Demais chips na mesma célula** durante hover: opacidade reduzida para `0.35` para destacar o chip ativo.
- **Tamanho:** `font-size: 8–9px`, `padding: 2px 6px`, `border-radius: 4px`, `text-align: center`.
- **Cursor:** `cursor: pointer`.

### 3.3 Posicionamento do popup

O popup aparece **ao lado direito do chip** (ou ao lado esquerdo se não houver espaço — fallback via JS de posição). Usa `position: fixed` no DOM para não ser cortado pelo `overflow: hidden` das células.

**Ciclo de vida:**
- Abre em `onMouseEnter` no chip.
- **Permanece aberto** enquanto o mouse está sobre o chip OU sobre o próprio popup (para que o usuário possa ler o conteúdo sem o popup fechar ao mover o cursor).
- Fecha quando o mouse sai de ambos (chip e popup). Implementar com `setTimeout` curto (~80ms) no `onMouseLeave` do chip, cancelado pelo `onMouseEnter` do popup — padrão "hover bridge".

### 3.4 Conteúdo do popup

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ R07                  CRÍTICO · 20   │ │  ← header com borda-esquerda colorida
│ │ Descrição curta do risco em 2 linhas│ │     pela severidade
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌──────────┐ ┌──────────┐               │
│ │Categoria │ │ Status   │               │  ← grid 2×2
│ │ Segurança│ │  Ativo   │               │
│ └──────────┘ └──────────┘               │
│ ┌──────────┐ ┌──────────┐               │
│ │  Prob.   │ │ Impacto  │               │
│ │MuitoAlta │ │MuitoAlto │               │
│ └──────────┘ └──────────┘               │
│─────────────────────────────────────────│
│ Responsável              Carlos Mendes  │
│ Plano: Inspeção semanal e reforço...    │
└─────────────────────────────────────────┘
```

Campos exibidos:
- **Header (com borda colorida pela severidade):** `codigo`, label de severidade + score numérico, `descricao` (truncada em 2 linhas).
- **Grid 2×2:** `categoria`, `status` (colorido pelo `STATUS_RISCO_COLORS`), `probabilidade` com peso numérico entre parênteses, `impacto` com peso numérico entre parênteses.
- **Rodapé:** `responsavel`, `plano_resposta` (em itálico, truncado em 2 linhas).

Largura do popup: `240px`. Aplica `z-index: 9999`.

### 3.5 Eixos e legenda

- **Eixo Y (Prob. ↑):** label vertical à esquerda da grade, valores 5→1 de cima para baixo.
- **Eixo X (→ Impacto):** valores 1→5 acima da grade, label centralizado abaixo.
- **Legenda de severidade:** linha horizontal na base do card da matriz, com 4 swatches coloridos (Crítico ≥12, Alto 6–11, Moderado 4–5, Baixo 1–3).

---

## 4. Coluna Direita — Cards de Distribuição

### 4.1 Título

`"DISTRIBUIÇÃO"` — mesma tipografia de seção (`text-xs font-semibold uppercase tracking-wide text-muted-foreground`).

### 4.2 Card por categoria

Um card para cada uma das 7 categorias (`CATEGORIAS_RISCO`), empilhados verticalmente com `gap-2`.

```
┌────────────────────────────────────┐
│ Técnico                         3  │  ← nome + contagem
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░  │  ← barra de progresso
└────────────────────────────────────┘
```

- **Borda esquerda:** `border-l-4` na cor da categoria (`CAT_COLORS[cat]`).
- **Barra de progresso:** largura proporcional a `count / totalRiscos * 100%`. Cor idêntica à borda esquerda.
- **Altura da barra:** `4px`, `border-radius: 2px`.
- **Contagem:** `font-size: 14px`, `font-weight: 800`, cor da categoria.
- Categorias com `count === 0` são exibidas normalmente (barra zerada), para manter consistência visual.

---

## 5. Dados e Lógica

### 5.1 Dado existente reutilizado

| Dado atual | Uso no redesign |
|-----------|----------------|
| `matrixData` (`{ "p-i": count }`) | Substituído — a matriz agora precisa dos riscos completos por célula |
| `riscos` (array completo) | Base para calcular chips por célula e contagens por categoria |

### 5.2 Novo `matrixCells`

Substituir `matrixData` por:

```js
const matrixCells = useMemo(() => {
  const grid = {};
  riscos.forEach(r => {
    const key = `${pesoProbabilidade(r.probabilidade)}-${pesoImpacto(r.impacto)}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(r);
  });
  return grid;
}, [riscos]);
```

Cada valor é um array de objetos risco completos.

### 5.3 Estado do popup

```js
const [hoveredRisco, setHoveredRisco] = useState(null);
// { risco: objeto, anchorRect: DOMRect }
```

O popup é renderizado via `ReactDOM.createPortal` no `document.body` para evitar clipping pelo overflow das células.

---

## 6. Componentes

### 6.1 `RiscoChip`

Componente interno em `GestaoRiscos.jsx`:

```
Props: { risco, severityColor, onMouseEnter, onMouseLeave, isActive, isDimmed }
```

Gerencia a aparência normal/hover/dimmed do chip.

### 6.2 `RiscoHoverCard`

Componente interno (ou arquivo separado `src/components/riscos/RiscoHoverCard.jsx`):

```
Props: { risco, anchorRect, onClose }
```

Renderiza via portal, calcula posição com base no `anchorRect`, fecha no `onMouseLeave`.

---

## 7. Comportamento e Estados

| Estado | Comportamento |
|--------|---------------|
| Sem riscos na célula | Célula exibe fundo colorido vazio (sem chips) |
| 1–3 riscos na célula | Chips visíveis sem scroll |
| 4+ riscos na célula | Scroll interno na célula |
| Hover num chip | Popup aparece, demais chips na célula ficam translúcidos |
| Mouse sai do chip para o popup | Popup permanece aberto |
| Mouse sai do chip (sem entrar no popup) | Popup fecha após ~80ms |
| Mouse sai do popup (sem voltar ao chip) | Popup fecha após ~80ms |
| Risco sem `codigo` | Chip exibe `"—"` |
| Risco sem `descricao` | Popup omite o campo |

---

## 8. O que NÃO muda

- KPICards (4 cards de totais) acima da seção — sem alteração.
- FilterToolbar — sem alteração.
- Tabela abaixo da seção — sem alteração.
- Lógica de dados (queries Supabase, mutations) — sem alteração.
- Componente `PlanoAcao` — sem alteração.
- Schema do banco — sem alteração.

---

## 9. Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | Principal — layout + lógica da matriz |
| `src/components/riscos/RiscoHoverCard.jsx` | Novo componente (opcional extrair) |
