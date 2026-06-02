# DESIGN.md — Design System FuturizeNow

> Source of Truth para toda decisão visual do projeto.
> Modificações na UI devem manter ou propagar os padrões aqui definidos.
> Recursos visuais (logos, ícones, referências) ficam em `/docs/design/assets/`.

---

## 1. Cores

### Paleta Principal FuturizeNow

| Nome | Hex | HSL | Token Tailwind | Uso |
|------|-----|-----|----------------|-----|
| Azul Cobalto | `#102A44` | `210 62% 16%` | `cobalt` | Sidebar, cards primários, superfícies escuras |
| Deep Navy | `#0A1929` | `211 61% 10%` | `navy` | Background base no dark mode, cabeçalho de tabela |
| Ciano Elétrico | `#26FFFF` | `180 100% 57%` | `cyan-electric` | Status ativo, item selecionado, CTA principal no dark |
| Cinza Titânio | `#8195A9` | `210 19% 58%` | `titanium` | Bordas, labels secundários, texto auxiliar |
| Ocre | `#a98743` | `40 43% 46%` | `ocre` | Status atenção, prioridade média/alta, gráficos |
| Magenta | `#db4974` | `342 67% 57%` | `magenta` | Alertas críticos, status cancelado, prioridade crítica |

### Tema Claro (`:root`)

- **Background principal:** `hsl(210 20% 98%)` — branco azulado suave
- **Cards e painéis:** `hsl(0 0% 100%)` — branco puro
- **Texto primário:** `hsl(210 50% 10%)` — azul escuro quase preto
- **Texto secundário/muted:** `hsl(210 19% 58%)` — titânio
- **Bordas:** `hsl(210 20% 88%)` — cinza azulado claro

### Tema Escuro (`.dark`)

- **Background principal:** `hsl(211 61% 10%)` — Deep Navy
- **Cards e painéis:** `hsl(210 50% 13%)` — entre Navy e Cobalt
- **Texto primário:** `hsl(210 20% 92%)` — branco azulado
- **Texto secundário/muted:** `hsl(210 19% 58%)` — titânio
- **Bordas:** `hsl(210 40% 20%)` — borda escura azulada

> **Sidebar:** dark mode usa Cobalt `#102A44`. Light mode usa azul claro `hsl(210 58% 93%)` — visualmente mais suave sobre fundo claro. Apenas o item ativo usa `cobalt` via `bg-sidebar-primary` nos dois temas.

### Tokens de Status (Semânticos)

| Token | Light HSL | Dark HSL | Uso |
|-------|-----------|----------|-----|
| `status-positive` | `142 76% 36%` | `142 76% 46%` | Concluído, resolvido, aprovado |
| `status-attention` | `40 43% 46%` | `40 43% 56%` | Em andamento, análise, desvios aceitáveis |
| `status-critical` | `342 67% 57%` | `342 67% 67%` | Cancelado, bloqueado, crítico |
| `status-neutral` | `210 19% 58%` | `210 19% 58%` | Fechado, encerrado, inativo |
| `status-info` | `214 89% 52%` | `214 89% 62%` | Aberto, ativo, novo — substitui `bg-blue-100` hardcoded |

> **Uso:** sempre via `bg-status-*/15 text-status-* border-status-*/30`. Use o componente `StatusBadge` — não declare mapas de cor inline por arquivo.

### Tokens de Ação (Botões — Milestone Refatoração 2026-Q2)

| Contexto | Variante/Classe | Ícone | Size |
|----------|----------------|-------|------|
| **Botão "Novo X"** (CTA de criação no PageHeader) | `className="bg-emerald-600 hover:bg-emerald-700 text-white"` | `<Plus className="w-4 h-4 mr-2" />` | `size="sm"` |
| **Botão Salvar** (em formulários/modais) | `variant="save"` (token `bg-action-save`) | — | `size="default"` |
| **Botão "Importar / Exportar"** (no PageHeader) | `variant="outline"` | `<Upload className="w-4 h-4 mr-2" />` | `size="sm"` |
| **Botão Cancelar** (em modais) | `variant="outline"` | — | `size="default"` |
| **Botão Destrutivo** (Excluir) | `variant="destructive"` | `<Trash2 />` | `size="sm"` ou `size="icon"` |

> **Regras:**
> - Botão "Salvar" **sempre** usa `variant="save"` — nunca `bg-emerald-600`, `bg-green-600` ou `bg-brand-accent` em formulários.
> - Ordem no rodapé de modais: `Cancelar` (esquerda) → `Salvar/Criar` (direita).
> - Rótulo: modo criação → "Criar"; modo edição → "Salvar".
> - O ciano (`#26FFFF`) NÃO é usado em botões de ação — é reservado para itens ativos da sidebar.

### Paleta do Mapa de Impacto (Heatmap)

Escala de intensidade (baixa → alta):

| Step | Cor | Hex | Classe Tailwind (bg) |
|------|-----|-----|--------------------|
| 0 — Nenhum | Branco/Transparente | `#ffffff` | `bg-white` |
| 1 — Muito Baixo | Verde claro | `#dcfce7` | `bg-green-100` |
| 2 — Baixo | Verde médio | `#86efac` | `bg-green-300` |
| 3 — Médio | Amarelo | `#fde047` | `bg-yellow-300` |
| 4 — Alto | Laranja | `#f97316` | `bg-orange-500` |
| 5 — Crítico | Vermelho | `#dc2626` | `bg-red-600 text-white` |

> Substituí a paleta verde-claro uniforme anterior que não diferenciava intensidades.

---

## 2. Tipografia

| Contexto | Fonte | Pesos | Uso |
|----------|-------|-------|-----|
| Corpo, menus, formulários, KPIs | `Montserrat` | 400, 600, 700 | **`font-sans` do Tailwind** — fonte padrão de toda a UI |
| Títulos de destaque | `Inter` | 600, 700 | Carregada via Google Fonts; não é token Tailwind — aplicar com `style={{ fontFamily: "Inter" }}` quando necessário |
| Dados técnicos densos | `Roboto` | 400, 500 | Idem Inter — carregada via Google Fonts, não é token Tailwind |

> **Fonte de verdade:** `tailwind.config.js` define `fontFamily.sans = ['Montserrat', 'sans-serif']`. Inter e Roboto são carregadas via Google Fonts no `index.html` mas NÃO são tokens Tailwind — usar `font-sans` resolve Montserrat em todo o sistema.

---

## 3. Bordas e Espaçamento

### Border Radius

| Elemento | Valor | Classe |
|----------|-------|--------|
| Cards, painéis | `12px` | `rounded-xl` — padrão do componente `Card` |
| Modais (`DialogContent`) | `8px` | `rounded-lg` — padrão shadcn |
| Inputs, selects, dropdowns | `8px` | `rounded-md` |
| Botões | `6px` | `rounded-md` — padrão do componente `Button` |
| Tags pill (status/prioridade) | `full` | `rounded-full` |

> **Nota:** O `--radius` base do tema é `0.5rem` (8px). `card.jsx` usa `rounded-xl` (12px) explicitamente. Não usar `rounded-2xl` (16px) — diverge do componente oficial.

### Sombras

- **Cards padrão:** `box-shadow: 0 2px 12px rgba(10,25,41,0.08)` (tonalidade navy)
- **Glow neon — Ciano:** `box-shadow: 0 0 8px rgba(38,255,255,0.45)`
- **Glow neon — Ocre:** `box-shadow: 0 0 8px rgba(169,135,67,0.45)`
- **Glow neon — Magenta:** `box-shadow: 0 0 8px rgba(219,73,116,0.45)`
- **Item ativo sidebar:** `box-shadow: 0 0 12px rgba(38,255,255,0.4)`

---

## 4. Componentes

### Badges de Status (`StatusBadge`)

**Localização:** [src/components/ui/StatusBadge.jsx](../../src/components/ui/StatusBadge.jsx)

Use sempre o `StatusBadge` — **não declare mapas de cor de status inline por arquivo**.

```jsx
import { StatusBadge } from "@/components/ui/StatusBadge";

// Resolução automática pelo label:
<StatusBadge status="Aberto" />
<StatusBadge status="Em Andamento" />
<StatusBadge status="Concluído" />

// Tom forçado (para labels fora do mapa padrão):
<StatusBadge status="Aguardando Aprovação" tone="attention" />
```

| Estado | Tom | Classes aplicadas |
|--------|-----|-------------------|
| Aberto / Ativo / Novo / Pendente | `info` | `bg-status-info/15 text-status-info border-status-info/30` |
| Em Análise / Em Andamento / Planejado | `attention` | `bg-status-attention/15 text-status-attention border-status-attention/30` |
| Cancelado / Crítico / Atrasado / Rejeitado | `critical` | `bg-status-critical/15 text-status-critical border-status-critical/30` |
| Concluído / Resolvido / Aprovado / Pago | `positive` | `bg-status-positive/15 text-status-positive border-status-positive/30` |
| Fechado / Encerrado / Inativo / Arquivado | `neutral` | `bg-status-neutral/15 text-status-neutral border-status-neutral/30` |

### AnimatedThemeToggler

Componente de alternância de tema com animação circular de transição (View Transition API).

- **Localização:** `src/components/ui/AnimatedThemeToggler.jsx`
- **Usa:** `document.startViewTransition` + clip-path animation
- **Fallback:** aplica o tema diretamente sem animação se a API não estiver disponível
- **Persiste:** `localStorage.setItem("theme", "dark" | "light")`
- **Anti-flash:** script inline em `index.html` antes do primeiro render

```jsx
import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";

<AnimatedThemeToggler
  variant="circle"   // circle | square | diamond | triangle | hexagon | star
  duration={400}
  className="w-9 h-9 flex items-center justify-center rounded-lg
             border border-border bg-muted text-foreground hover:bg-accent"
/>
```

### Botões

- **Primário:** `bg-primary text-primary-foreground` — Cobalt + branco (light) / Ciano + navy (dark)
- **Outline:** `border border-border text-foreground hover:bg-accent`
- **Ghost:** `text-foreground hover:bg-muted`

### Sidebar

A sidebar usa as variáveis `--sidebar-*`. O fundo varia por tema:

- **Fundo dark:** `bg-sidebar` → Cobalt `#102A44`
- **Fundo light:** `bg-sidebar` → azul claro `hsl(210 58% 93%)`
- **Item ativo (ambos):** `bg-sidebar-primary text-sidebar-primary-foreground` — Cobalt (light) / Ciano (dark)
- **Item inativo:** `text-sidebar-foreground hover:bg-sidebar-accent`
- **Bordas internas:** `border-sidebar-border`

### KPI Cards (`KPICard`)

**Localização:** [src/components/ui/KPICard.jsx](../../src/components/ui/KPICard.jsx)

Use sempre o `KPICard` — **não reconstrua divs manuais com sombra e padding ad-hoc**.

```jsx
import { KPICard } from "@/components/ui/KPICard";
import { AlertCircle } from "lucide-react";

<KPICard label="Total" value={42} />
<KPICard label="Críticos" value={7} accent="text-status-critical" icon={<AlertCircle />} />
<KPICard label="Concluídos" value="R$ 1.2M" accent="text-status-positive" />
```

| Prop | Tipo | Descrição |
|------|------|-----------|
| `label` | `string` | Rótulo da métrica (texto superior) |
| `value` | `string \| number` | Valor principal (texto `text-2xl font-bold`) |
| `icon` | `ReactNode` | Ícone opcional à direita do label |
| `accent` | `string` | Classe Tailwind de cor para o valor (padrão: `text-foreground`) |

### Título de Seção (`SectionTitle`)

**Localização:** [src/components/ui/SectionTitle.jsx](../../src/components/ui/SectionTitle.jsx)

```jsx
import { SectionTitle } from "@/components/ui/SectionTitle";

<SectionTitle>Detalhes do Contrato</SectionTitle>
<SectionTitle as="h2" className="mb-4">Histórico</SectionTitle>
```

Aplica: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`.

---

## 5. Data Visualization (Gráficos)

### Regras Gerais (Recharts)

- **Grid:** apenas linhas horizontais — desativar verticais (`vertical={false}`)
- **Eixos:** ocultar `axisLine` e `tickLine`; texto `fontSize: 11`, cor `text-muted-foreground`
- **Paleta dark:** usar `cyan-electric` como cor primária nos gráficos do dark mode

### Barras

- Topo sempre arredondado: `radius={[6, 6, 0, 0]}`
- Dark mode: `fill="hsl(var(--cyan-electric))"`

### Áreas

- Sempre gradiente SVG vertical (`<defs>` + `<linearGradient>`)
- Opacidade no topo → 0 embaixo

### Tooltips

- Nunca usar tooltip padrão
- Customizado com `bg-card border border-border rounded-xl shadow-lg`

---

## 6. Animações e Micro-Interações

### Entrada

- Cards: `animate-fade-in` ou `animate-in fade-in duration-300`
- Estagiamento: `animationDelay` incremental (100ms, 200ms, 300ms…)

### Hover

- Transição: `transition-colors duration-150` ou `transition-all duration-200 ease-out`
- Rows de tabela: `hover:bg-muted/50`

### Tema

- Transição circular via View Transition API (vide `AnimatedThemeToggler`)
- Respeitar `prefers-reduced-motion` — nada pisca mais de 3× por segundo

---

## 7. Assets

Recursos visuais em `/docs/design/assets/`:

| Pasta | Conteúdo |
|-------|----------|
| `/logos/` | Logo principal, variações (dark, light, mono), favicon |
| `/icons/` | Ícones customizados SVG do projeto |
| `/references/` | Manual de Identidade Visual FuturizeNow, Theme_Toggler.md, moodboards |

---

## 8. Acessibilidade

> Nível-alvo: **WCAG 2.1 AA**.

- **Contraste mínimo:** 4.5:1 para texto corrido, 3:1 para texto grande e elementos de UI
- **Foco visível:** todo elemento interativo tem indicador de foco — nunca `outline: none` sem substituto
- **Tamanho de alvo:** mínimo `44×44px` mobile, `24×24px` desktop com padding implícito
- **Ordem de foco:** segue a ordem de leitura. Evite `tabindex > 0`
- **Texto alternativo:** toda imagem significativa tem `alt`; decorativas usam `alt=""`
- **Semântica primeiro:** `<button>`, `<a>`, `<nav>`, `<main>` em vez de `<div onClick>`
- **Movimento:** respeitar `prefers-reduced-motion`

### Formulários

- Todo `<input>` tem `<label>` associado
- Erros de validação via `aria-live="polite"`
- Nunca use só cor para indicar erro — combine ícone + texto

---

## 9. Layout de Página (PageHeader)

### Hierarquia obrigatória

Toda página do sistema deve seguir esta estrutura, nesta ordem:

1. `<PageHeader />` — breadcrumb automático + slot de ações
2. **`<FilterToolbar>`** — barra de filtros (quando houver), **antes dos KPI cards**
3. Cards de KPIs / totalizadores (quando houver)
4. Tabela ou visualização principal

**Proibido:** `<h1>` duplicando o breadcrumb · subtítulos descritivos abaixo do header · mini-headers locais com `flex justify-between` · filtros dentro de `<Card>` · filtros depois dos KPI cards.

### Componente

**Localização:** [src/components/ui/PageHeader.jsx](../../src/components/ui/PageHeader.jsx)

```jsx
<PageHeader
  actions={<JSX />}   // botões de ação (Novo, Importar…) — opcional
/>
```

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `actions` | `ReactNode` | `undefined` | Botões à direita (Novo, Importar, Exportar…) |

**Não existe prop `module` nem `submodule`** — o componente deriva automaticamente o breadcrumb via `useLocation()` + `navigationConfig.js`. A página não precisa (nem deve) passar o próprio título.

### Renderização visual por viewport

**Desktop e Mobile — com ações:**
```
┌───────────────────────────────────────┐
│ Contratos › Medições        [+ Nova]  │
└───────────────────────────────────────┘
```

**Sem ações (ex: Dashboard):**
```
┌───────────────────────────────────────┐
│ Dashboard                             │
└───────────────────────────────────────┘
```

### Comportamento responsivo

| Viewport | Comportamento |
|----------|---------------|
| `≥ 1024px` | Breadcrumb + ações alinhados na mesma linha, espaçador `flex-1` no meio |
| `< 1024px` | Mesmo layout — sem diferença pois não há filtros |

### Tokens utilizados

| Token | Light | Dark | Papel |
|-------|-------|------|-------|
| `bg-sidebar` | azul claro `hsl(210 58% 93%)` | Cobalt `#102A44` | Fundo da barra |
| `border-sidebar-border` | borda azulada suave | borda escura | Linha inferior separadora |
| `text-sidebar-foreground` | cobalt escuro | branco azulado | Texto do breadcrumb e ícones |
| `text-sidebar-foreground/50` | 50% opacidade | 50% opacidade | Separador `›` do breadcrumb |

### Exemplos de uso

**Apenas ações (sem filtros):**
```jsx
<PageHeader
  actions={
    <Button onClick={openForm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
      <Plus className="w-4 h-4 mr-2" /> Novo Contrato
    </Button>
  }
/>
```

**Sem props (ex: Dashboard):**
```jsx
<PageHeader />
```

### Wrapping padrão das páginas

```jsx
export default function MinhaPagina() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader actions={…} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
          {/* controles de filtro */}
        </FilterToolbar>
        {/* KPI cards */}
        {/* tabela / conteúdo */}
      </div>
    </div>
  );
}
```

### Migração para novos módulos

Ao aplicar o `PageHeader` em qualquer módulo novo ou existente:

1. Remover o bloco local de cabeçalho: `<div className="flex justify-between …">` com `<h1>`, `<p>` e botões
2. Adicionar `<PageHeader actions={…} />` como **primeiro filho** do wrapper da página
3. Envolver o conteúdo restante em `<div className="flex-1 overflow-auto p-6 space-y-6">`
4. Colocar `<FilterToolbar>` como **primeiro elemento** dentro do wrapper, antes dos KPI cards

---

## 10. Componentes de Filtro (FilterToolbar + DateRangePicker)

### FilterToolbar

**Localização:** [src/components/ui/FilterToolbar.jsx](../../src/components/ui/FilterToolbar.jsx)

Wrapper padrão de toda barra de filtros do sistema. Renderiza o ícone + texto "Filtros" à esquerda, com um "X" overlay sobre o ícone quando há filtro ativo (mesmo padrão do `MultiSelectDropdown`). Recebe os controles de filtro como `children`.

```jsx
<FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
  <SearchInput … />
  <FilterBar … />
  <DateRangePicker … />
</FilterToolbar>
```

| Prop | Tipo | Descrição |
|------|------|-----------|
| `active` | `boolean` | `true` quando qualquer filtro está aplicado. Mostra o "X" sobre o ícone. |
| `onClearAll` | `() => void` | Limpa todos os filtros (busca, multiselect, período). |
| `children` | `ReactNode` | Controles de filtro da página (qualquer combinação). |

**Receita de `active` e `onClearAll`:**
```js
const isFilterActive =
  !!searchText ||
  !!periodo?.from ||
  Object.values(filtros).some(a => a?.length > 0);

const handleClearAll = () => {
  setSearchText("");
  setPeriodo(null);
  setFiltros({});
  localStorage.removeItem(FILTROS_KEY);
  setFilterKey(k => k + 1); // remonta o FilterBar, limpando persistência
};
```

### DateRangePicker

**Localização:** [src/components/ui/DateRangePicker.jsx](../../src/components/ui/DateRangePicker.jsx)

Campo único de período (início + fim) no padrão visual do `MultiSelectDropdown`. Abre um calendário de 2 meses (react-day-picker v8, locale `ptBR`). Quando preenchido, exibe o intervalo formatado (`dd/MM/yy – dd/MM/yy`) e fica em estado ativo (azul). Tem "X" overlay individual para limpar só o período.

```jsx
const [periodo, setPeriodo] = useState(null); // { from: Date, to: Date } | null

<DateRangePicker
  label="Período de Fornecimento"
  value={periodo}
  onChange={setPeriodo}
  onClear={() => setPeriodo(null)}
/>
```

**Filtragem:**
```js
if (periodo?.from) {
  const fromStr = periodo.from.toISOString().split("T")[0];
  result = result.filter(item => item.data_campo >= fromStr);
}
if (periodo?.to) {
  const toStr = periodo.to.toISOString().split("T")[0];
  result = result.filter(item => item.data_campo <= toStr);
}
```

**Padrão visual:** idêntico ao `MultiSelectDropdown` — `Button variant="outline" size="sm" h-8`, estado ativo `border-primary text-primary bg-primary/5`, "X" overlay em `absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary`.

---

## 11. Sidebar — Menu de Usuário (SidebarUserMenu)

**Localização:** [src/components/ui/SidebarUserMenu.jsx](../../src/components/ui/SidebarUserMenu.jsx)

Bloco fixo no rodapé da sidebar, separado por `border-t border-sidebar-border`. Gerencia avatar, toggle de tema e logout.

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `collapsed` | `boolean` | `true` quando a sidebar está no modo ícone |

### Comportamento

| Estado | Layout |
|--------|--------|
| Expandida | Avatar + nome + email + seta `›` |
| Colapsada | Apenas avatar centralizado |
| Popover (ambos) | Abre `side="right" align="end"` com: nome, email, toggle de tema, botão Sair |

### Tokens

- Avatar: `bg-sidebar-primary text-sidebar-primary-foreground rounded-full`
- Trigger hover: `hover:bg-sidebar-accent`
- Popover: `bg-sidebar border-sidebar-border text-sidebar-foreground`

### Iniciais do avatar

`full_name` de `user.user_metadata` → primeiras letras do primeiro e último nome.
Fallback: primeira letra do email. Fallback final: `"?"`.

---

## 12. Modal / Dialog Padrão (FormDialog)

### Quando usar

- **FormDialog** (`src/components/ui/FormDialog.jsx`): todo modal de edição (form) e de visualização (read-only) centralizado na tela.
- **`Dialog` + `DialogContent` do shadcn** (`src/components/ui/dialog.jsx`): sub-dialogs simples de seleção ou confirmação (sem header com ícone, sem footer estilizado).
- **`Sheet`** (`src/components/ui/sheet.jsx`): painéis laterais (slide-over) — e.g. HeatmapDrilldown.

### Anatomia

```
┌─────────────────────────────────────────┐
│ ▌ [ícone]  Título                   [X] │  ← header
│           subtítulo                      │
├─────────────────────────────────────────┤
│                                         │
│   corpo (overflow-y-auto, flex-1)       │  ← children
│                                         │
├─────────────────────────────────────────┤
│                  [Cancelar]  [Salvar]   │  ← footer
└─────────────────────────────────────────┘
```

- **Faixa de accent**: `bar-left` (padrão) = `w-1 self-stretch rounded-full bg-primary`; `bar-top` = `h-1.5 w-full bg-primary`.
- **Chip de ícone**: `w-9 h-9 rounded-lg bg-primary/10` + ícone `text-primary`.
- **Título**: `text-base font-bold text-foreground` (renderizado como `DialogPrimitive.Title` para ARIA).
- **Subtítulo**: `text-xs text-muted-foreground` (renderizado como `DialogPrimitive.Description` para ARIA).
- **Body**: `overflow-y-auto flex-1 px-6 py-5 space-y-5`.
- **Footer**: `border-t border-border px-6 py-4 flex justify-end gap-2 bg-muted/20`.
- **Container**: `rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh] p-0 overflow-hidden`.

### Accent único

Todos os modais usam **sempre** `bg-primary` como cor de accent (faixa e chip) — nunca cor por módulo. Em dark mode, `--primary` é o ciano elétrico; isso é **permitido** na faixa/chip do header. **Nunca** usar ciano em botões — o botão Salvar usa `variant="save"` (`bg-action-save`).

### Tabela de props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `open` | boolean | — | Controle Radix |
| `onOpenChange` | function | — | Callback (ESC, backdrop) |
| `icon` | LucideIcon | — | Ícone no chip do header |
| `title` | string | — | Título principal (obrigatório p/ ARIA) |
| `subtitle` | string | — | Subtítulo/descrição |
| `badge` | ReactNode | — | Conteúdo à direita do título (e.g. StatusBadge) |
| `variant` | `"bar-left"` \| `"bar-top"` | `"bar-left"` | Estilo da faixa |
| `maxWidth` | string (classe Tailwind) | `"max-w-lg"` | Largura máxima |
| `mode` | `"edit"` \| `"view"` | `"edit"` | Controla footer padrão |
| `onClose` | function | — | Callback dos botões X / Cancelar / Fechar |
| `onSave` | function | — | Callback do botão Salvar |
| `saving` | boolean | `false` | Exibe "Salvando..." e desabilita botões |
| `saveDisabled` | boolean | `false` | Desabilita só o botão Salvar |
| `saveLabel` | string | `"Salvar"` | Rótulo do botão de ação |
| `cancelLabel` | string | `"Cancelar"` | Rótulo cancelar |
| `closeLabel` | string | `"Fechar"` | Rótulo fechar (mode="view") |
| `footer` | ReactNode | — | Footer custom (sobrepõe o padrão) |
| `hideFooter` | boolean | `false` | Oculta o footer |

### VIEW vs EDIT

- `mode="edit"` → footer padrão: Cancelar (esquerda) + Salvar (direita). Criação: label "Criar X". Edição: "Salvar".
- `mode="view"` → footer padrão: só botão Fechar.
- Escape hatch: prop `footer` (ReactNode) para footers com ações especiais (Excluir + Cancelar + Salvar; Imprimir + Fechar).

### SectionDivider

Usar o `SectionDivider` exportado de `FormDialog.jsx` em vez de definir um por arquivo. Usa `bg-primary` / `text-primary` — nunca hex hardcoded.

```jsx
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
// ...
<SectionDivider label="Identificação" />
```

### Regras herdadas

- `rounded-xl` no container (proibido `rounded-2xl`).
- Ordem no footer: Cancelar → Salvar (esquerda para direita).
- `variant="save"` / `variant="outline"` — nunca `bg-emerald-600` em botões de modal.
- Dark mode via tokens semânticos — proibido `orange-50`, `blue-100`, hex `#6366f1` sem `dark:` correspondente.
- Sub-dialogs de seleção simples (busca + lista + confirmar) podem usar `Dialog` + `DialogContent` shadcn direto.

---

## Documentos Relacionados

| Precisa saber... | Leia |
|---|---|
| Regras gerais e performance | [/CLAUDE.md](../../CLAUDE.md) |
| Limites de sistema | [/docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) |
| Skill /audit | [/docs/SKILLS.md](../SKILLS.md) |
| RNFs de acessibilidade | [/PROJECT.md](../../PROJECT.md) |

> Índice canônico completo: [CLAUDE.md §7](../../CLAUDE.md#7-documentos-do-projeto).
