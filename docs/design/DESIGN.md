# DESIGN.md — Design System & Diretrizes Visuais

> Source of Truth para toda decisão visual do projeto.
> Modificações na UI devem manter ou propagar os padrões aqui definidos.
> Recursos visuais (logos, ícones, referências) ficam em `/docs/design/assets/`.
>
> **Nota:** Cores, fontes e variáveis exatas abaixo são **exemplos de um projeto real** — substitua pelos valores da sua marca/identidade visual no início do projeto. O que importa é manter a **estrutura**, os **princípios** (paleta principal + status + superfícies, hierarquia tipográfica, sombras azuladas em vez de pretas, tags "soft" em vez de chapadas, etc.) e a **organização das tabelas**.

---

## 1. Cores

### Paleta Principal

<!-- Substitua pelos hexadecimais da marca do projeto. Exemplo abaixo. -->

| Nome | Hex | Uso |
|------|-----|-----|
| Primária escura | `#002B5C` (exemplo: Deep Blue) | Textos de alto contraste, headers, ícones neutros, linhas de gráfico |
| Primária quente | `#E05236` (exemplo: Terracota) | Botões primários, alertas, indicadores ativos, gráficos secundários |
| Destaque | `#D4AF37` (exemplo: Gold) | Ícones premium, ações especiais, status neutro/importante |

### Status

| Status | Hex principal | Alternativa |
|--------|--------------|-------------|
| Sucesso | `#10b981` | `#059669` |
| Aviso | `#f59e0b` | `#ea580c` |
| Erro/Crítico | `#ef4444` | `#dc2626` |
| Neutro/Inativo | `#94a3b8` | `#64748b` |

### Superfícies

<!-- Ajuste aos tons neutros da marca. Exemplo abaixo. -->

- **App Background:** `#F5F6FA` (exemplo: Branco Gelo)
- **Cards e Modais:** `#FFFFFF` (Branco Puro)

---

## 2. Tipografia

<!-- Substitua pelas fontes definidas pela marca. Exemplo abaixo com um par serifada-ish display + sans neutra. -->

| Contexto | Fonte | Pesos |
|----------|-------|-------|
| Títulos e numerais (KPIs) | `Montserrat` (exemplo) | 600, 700, 800 |
| Corpo de texto, menus, formulários | `Outfit` (exemplo) | 400, 500, 600 |

---

## 3. Bordas e Espaçamento

### Border Radius (CSS Variables)

| Elemento | Valor | Variável |
|----------|-------|----------|
| Cards, painéis, layouts maiores | `16px` | `--radius-card` |
| Inputs, selects, dropdowns | `12px` | `--radius-input` |
| Botões e tags padrão | `8px` | `--radius-button` |
| Modais | `24px` | `--radius-modal` |
| Tags pill (status) | `20px` | — |

### Sombras

> Todas as sombras usam tonalidade azulada (`rgba(0,43,92, x)`) — nunca preto puro.

- **Cards padrão:** `box-shadow: 0 2px 12px rgba(0,43,92,0.06)`
- **Hover de cards:** `box-shadow: 0 8px 24px rgba(0,43,92,0.1)` + `transform: translateY(-2px)`

### Glassmorphism

Usado para tooltips, cartões premium ou elementos flutuantes.

```css
.glass-card {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.8);
}
```

---

## 4. Componentes

### Botões

- **Primário (CTA):** Fundo Terracota `#E05236`, texto branco, sem bordas adicionais
- **Secundário:** Fundo transparente ou branco, borda `#e2e8f0`, texto `#334155`
- **Icon-only:** Fundo branco, quadrado com radius `12px` ou circular `50%`, sombra leve, ícone centralizado

### Ícones e Wrappers

- Biblioteca: `@ant-design/icons` ou `Lucide React`
- Em painéis (KPIs, insights): ícones nunca ficam soltos — sempre dentro de wrapper circular
  - Tamanho do wrapper: `40x40` (ou `32x32` para itens menores)
  - Border-radius: `50%`
  - Background: cor do ícone com 8% de opacidade (ex: `rgba(0,43,92,0.08)`)
  - Display: `flex`, `align-items: center`, `justify-content: center`

### Tags e Badges de Status

Estilo "Soft" — nunca cor sólida chapada.

- **Background:** Cor principal com 10% de opacidade (ex: `rgba(16,185,129,0.1)`)
- **Texto:** Cor principal baseada no status (ex: `#059669`)
- **Border-radius:** `6px` para tags descritivas, `20px` (pill) para tags financeiras
- **Fonte:** Peso `600`, tamanho `12px`

---

## 5. Data Visualization (Gráficos)

### Regras Gerais (Recharts ou similar)

- **Grid:** Apenas linhas horizontais — desativar verticais (`vertical={false}`)
- **Eixos:** Ocultar `axisLine` e `tickLine`
- **Fontes nos eixos:** `fontSize: 11-12`, cores neutras

### Barras

- Topo sempre arredondado: `radius={[6, 6, 0, 0]}`

### Áreas

- Sempre gradiente SVG vertical (`<defs>` + `<linearGradient>`)
- Opacidade razoável no topo → 0 embaixo
- Nunca preenchimento de cor sólida

### Tooltips

- **Nunca** usar tooltip padrão (fundo preto/branco chapado)
- Sempre customizado com Glassmorphism (ver seção 3)
- Estrutura interna: círculo da cor da legenda + label cinza + valor bold formatado

### Legendas

- Ícones esféricos: `iconType="circle"`
- Moedas abreviadas em espaços pequenos: "K" ou "Mi"
- Formato locale adequado

### Gráficos Combinados (ComposedChart)

- Barra: usar opacidade/gradiente
- Linha: `strokeWidth={3}` — mais forte que a barra

---

## 6. Animações e Micro-Interações

### Entrada

- Cards, gráficos e painéis: `animate-fade-in` ou `animate-scale-in`
- Estagiamento: `animationDelay` incremental (100ms, 200ms, 300ms...)

### Hover

- Transição: `transition-all duration-300 ease-out`
- Cards: `translateY(-2px)` + box-shadow ampliado

### Gráficos

- `animationDuration={800}`
- `animationEasing="ease-out"`

---

## 7. Assets

Recursos visuais organizados em `/docs/design/assets/`:

| Pasta | Conteúdo |
|-------|----------|
| `/logos/` | Logo principal, variações (dark, light, mono), favicon, og-image, app-icon |
| `/icons/` | Ícones customizados do projeto (SVGs exportados). Ícones de biblioteca não ficam aqui |
| `/references/` | Moodboards, screenshots de referência, wireframes aprovados, mockups, benchmarks |

---

## 8. Acessibilidade

> Nível-alvo: **WCAG 2.1 AA** (ver [PROJECT.md — RNF05](../../PROJECT.md#requisitos-não-funcionais)).

### Regras não-negociáveis

- **Contraste mínimo:** 4.5:1 para texto corrido, 3:1 para texto grande (≥ 18px regular ou 14px bold) e elementos gráficos / componentes de UI.
- **Foco visível:** todo elemento interativo tem indicador de foco com contraste ≥ 3:1 — nunca use `outline: none` sem substituto equivalente.
- **Tamanho de alvo:** no mínimo `44×44px` para qualquer controle interativo em mobile (`24×24px` em desktop, com `padding` implícito).
- **Ordem de foco:** segue a ordem de leitura do documento. Evite `tabindex > 0`.
- **Texto alternativo:** toda imagem significativa tem `alt`. Imagens decorativas usam `alt=""`.
- **Semântica primeiro:** use `<button>`, `<a>`, `<nav>`, `<main>` em vez de `<div onClick>`. Evite roles ARIA quando HTML nativo resolve.
- **Tradução e escala:** layout funciona com zoom até 200% e quando textos crescem em 40%.

### Formulários

- Todo `<input>` tem `<label>` associado (não apenas `placeholder`).
- Erros de validação são anunciados via `aria-live="polite"` e apontam para o campo problemático.
- Nunca use só cor para indicar erro — combine ícone + texto.

### Movimento

- Respeitar `prefers-reduced-motion` — animações decorativas são reduzidas ou removidas.
- Nada pisca mais de 3x por segundo (risco de fotossensibilidade).

### Ferramentas de verificação

- Lint automático: `eslint-plugin-jsx-a11y` no pipeline.
- Auditoria manual: Lighthouse (Accessibility ≥ 95), axe DevTools, teste com leitor de tela (VoiceOver / NVDA) antes de cada /deploy.
- O workflow [/audit](../WORKFLOWS.md#1-audit--visual--functional-quality-gate) deve incluir checklist de acessibilidade como Critical Fail quando quebrado.

---

## Documentos Relacionados

| Precisa saber... | Leia |
|---|---|
| Regras gerais e performance | [/CLAUDE.md](../../CLAUDE.md) |
| Limites de sistema (não desenhe UI que requer dado que o backend não entrega) | [/docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) |
| Workflow /audit (onde o design é validado) | [/docs/WORKFLOWS.md](../WORKFLOWS.md) |
| RNFs de acessibilidade e performance | [/PROJECT.md](../../PROJECT.md) |

> Índice canônico completo: [CLAUDE.md §7](../../CLAUDE.md#7-documentos-do-projeto).
