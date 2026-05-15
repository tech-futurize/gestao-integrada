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

> **Sidebar:** sempre Cobalt `#102A44` em ambos os modos — definida em `--sidebar-background` fixo no `:root` e `.dark`.

### Tokens de Status (Semânticos)

| Token | Light HSL | Dark HSL | Uso |
|-------|-----------|----------|-----|
| `status-positive` | `142 76% 36%` | `142 76% 46%` | Genérico para sucesso em badges shadcn |
| `status-attention` | `40 43% 46%` | `40 43% 56%` | Em andamento, desvios aceitáveis |
| `status-critical` | `342 67% 57%` | `342 67% 67%` | Alertas, atrasos críticos |
| `status-neutral` | `210 19% 58%` | `210 19% 58%` | Inativo, fechado, neutro |

> **Nota:** Badges da tela de Pleitos usam os tokens diretos da paleta (`cyan-electric`, `ocre`, `magenta`) para manter o efeito neon do manual de identidade visual.

### Tokens de Ação (Botões — Milestone Refatoração 2026-Q2)

| Contexto | Cor | Classe Tailwind | Hex |
|----------|-----|-----------------|-----|
| **Botão Salvar** (padrão em todos os módulos) | Verde Esmeralda | `bg-emerald-600 hover:bg-emerald-700` | `#059669` |
| Botão Cancelar / Secundário | Cinza | `bg-slate-200 hover:bg-slate-300 text-slate-700` | — |
| Botão Destrutivo (Excluir) | Vermelho | `bg-red-600 hover:bg-red-700` | `#dc2626` |

> **Regra:** O ciano (`#26FFFF`) NÃO é usado em botões de ação primária; é reservado para items ativos na sidebar e indicadores de presença.

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
| Títulos, KPIs, interface | `Inter` | 400, 600, 700 | Headings, valores numéricos grandes, labels de KPI |
| Corpo, menus, formulários | `Montserrat` | 400, 600, 700 | Padrão do sistema (font-sans) |
| Tabelas, dados técnicos | `Roboto` | 400, 500 | Blocos de informação técnica densa |

> Fontes carregadas via Google Fonts em `index.html`. Ordem de fallback: Inter → Montserrat → sans-serif.

---

## 3. Bordas e Espaçamento

### Border Radius

| Elemento | Valor | Classe |
|----------|-------|--------|
| Cards, painéis, modais grandes | `16px` | `rounded-2xl` |
| Inputs, selects, dropdowns | `12px` | `rounded-xl` |
| Botões e tags padrão | `8px` | `rounded-lg` |
| Tags pill (status/prioridade) | `20px` | `rounded-full` |

### Sombras

- **Cards padrão:** `box-shadow: 0 2px 12px rgba(10,25,41,0.08)` (tonalidade navy)
- **Glow neon — Ciano:** `box-shadow: 0 0 8px rgba(38,255,255,0.45)`
- **Glow neon — Ocre:** `box-shadow: 0 0 8px rgba(169,135,67,0.45)`
- **Glow neon — Magenta:** `box-shadow: 0 0 8px rgba(219,73,116,0.45)`
- **Item ativo sidebar:** `box-shadow: 0 0 12px rgba(38,255,255,0.4)`

---

## 4. Componentes

### Badges de Status e Prioridade (Neon Pill)

Padrão visual: fundo semi-transparente (~10–15% de opacidade) + borda 1px sólida + texto colorido + glow neon nos estados ativos.

```jsx
// Status Aberto — exemplo de uso
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                 bg-cyan-electric/10 border border-cyan-electric text-cyan-electric"
      style={{ boxShadow: "0 0 8px rgba(38,255,255,0.45)" }}>
  Aberto
</span>
```

| Estado | Classes Tailwind | Glow |
|--------|-----------------|------|
| Aberto / Ativo | `bg-cyan-electric/10 border-cyan-electric text-cyan-electric` | `rgba(38,255,255,0.45)` |
| Em Análise / Em Andamento | `bg-ocre/10 border-ocre text-ocre` | `rgba(169,135,67,0.45)` |
| Cancelado / Crítico | `bg-magenta/10 border-magenta text-magenta` | `rgba(219,73,116,0.45)` |
| Resolvido | `bg-cyan-electric/[0.07] border-cyan-electric/40 text-cyan-electric` | — |
| Fechado / Neutro | `bg-titanium/10 border-titanium/40 text-titanium` | — |

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

### Sidebar (sempre dark)

A sidebar usa as variáveis `--sidebar-*` que mantêm Cobalt em ambos os modos:

- **Fundo:** `bg-sidebar` (`#102A44` Cobalt)
- **Item ativo:** `bg-sidebar-primary text-sidebar-primary-foreground` + glow ciano
- **Item inativo:** `text-sidebar-foreground hover:bg-sidebar-accent`
- **Bordas internas:** `border-sidebar-border`

### KPI Cards

```jsx
<div className="flex-1 bg-card border border-border rounded-xl p-4">
  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Label</span>
  <span className="text-3xl font-bold text-cyan-electric" style={{ textShadow: "0 0 14px rgba(38,255,255,0.6)" }}>
    42
  </span>
</div>
```

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

## Documentos Relacionados

| Precisa saber... | Leia |
|---|---|
| Regras gerais e performance | [/CLAUDE.md](../../CLAUDE.md) |
| Limites de sistema | [/docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) |
| Workflow /audit | [/docs/WORKFLOWS.md](../WORKFLOWS.md) |
| RNFs de acessibilidade | [/PROJECT.md](../../PROJECT.md) |

> Índice canônico completo: [CLAUDE.md §7](../../CLAUDE.md#7-documentos-do-projeto).
