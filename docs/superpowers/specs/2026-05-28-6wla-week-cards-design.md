# Spec: 6WLA — Mini Cards de Semana com Gradiente

**Data:** 2026-05-28
**Módulo:** Planejamento / Six Week Lookahead (6WLA)
**Escopo:** Pills de semana no header + badges na coluna "Sem." da tabela

---

## Objetivo

Substituir o visual genérico das pills de semana (header) e dos badges da coluna "Sem." (tabela) por:

1. **Formato de texto:** `S1-25/05` (label + traço + data DD/MM) — somente nas pills do header
2. **Gradiente de cor:** S1 mais intenso → S6 mais fraco, adaptado ao tema claro/escuro

---

## Componentes afetados

| Arquivo | O que muda |
|---------|-----------|
| `src/utils/sixWLAUtils.js` | Adicionar `formatDataDDMM(date)` e `getWeekBadgeStyle(weekIndex, isDark)` |
| `src/hooks/useDarkMode.js` | Novo hook — detecta classe `.dark` no `document.documentElement` |
| `src/pages/Planejamento/SixWLA.jsx` | Pills: novo formato de texto + gradiente por índice |
| `src/components/planejamento/SixWLATable.jsx` | Badges coluna "Sem.": gradiente por índice (sem data) |

---

## Utilitários novos

### `formatDataDDMM(date): string`

Retorna a data no formato `"DD/MM"` (ex: `"25/05"`).

```js
export function formatDataDDMM(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
```

Usado nas pills do header. A função `formatData` existente (`"25 mai"`) continua usada no `title` (tooltip) das pills.

---

### `getWeekBadgeStyle(weekIndex, isDark): object`

Retorna um objeto de estilo inline com `background`, `borderColor`, `color` e opcionalmente `boxShadow`.

O índice `weekIndex` vai de `0` (S1) a `5` (S6). A cor base muda conforme o tema:

- **Dark:** RGB `(38, 255, 255)` — Cyan Elétrico
- **Light:** RGB `(16, 42, 68)` — Cobalt

**Tabela de opacidades:**

| weekIndex | bg alpha | border alpha | text alpha | glow (dark only) |
|-----------|----------|-------------|------------|-----------------|
| 0 (S1) | 0.22 | 1.00 | 1.00 | `0 0 8px rgba(38,255,255,0.5)` |
| 1 (S2) | 0.17 | 0.80 | 0.90 | — |
| 2 (S3) | 0.12 | 0.60 | 0.73 | — |
| 3 (S4) | 0.08 | 0.42 | 0.57 | — |
| 4 (S5) | 0.05 | 0.28 | 0.42 | — |
| 5 (S6) | 0.02 | 0.18 | 0.30 | — |

```js
const WEEK_ALPHAS = [
  { bg: 0.22, border: 1.00, text: 1.00, glow: true  },
  { bg: 0.17, border: 0.80, text: 0.90, glow: false },
  { bg: 0.12, border: 0.60, text: 0.73, glow: false },
  { bg: 0.08, border: 0.42, text: 0.57, glow: false },
  { bg: 0.05, border: 0.28, text: 0.42, glow: false },
  { bg: 0.02, border: 0.18, text: 0.30, glow: false },
];

export function getWeekBadgeStyle(weekIndex, isDark) {
  const a = WEEK_ALPHAS[Math.min(weekIndex, 5)];
  const [r, g, b] = isDark ? [38, 255, 255] : [16, 42, 68];
  return {
    background:  `rgba(${r},${g},${b},${a.bg})`,
    borderColor: `rgba(${r},${g},${b},${a.border})`,
    color:       `rgba(${r},${g},${b},${a.text})`,
    ...(a.glow && isDark
      ? { boxShadow: `0 0 8px rgba(${r},${g},${b},0.5)` }
      : {}),
  };
}
```

---

### `useDarkMode(): boolean` (novo hook)

```js
// src/hooks/useDarkMode.js
import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
```

---

## Pills no header (SixWLA.jsx)

### Antes
```jsx
<button
  className={cn(
    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
    ativa
      ? "bg-[#102A44] text-[#26FFFF] border-[#102A44]"
      : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
  )}
>
  {s.label} · {formatData(s.start)}
</button>
```

### Depois
```jsx
// no componente: const isDark = useDarkMode();
// semanas.map((s, i) => { ... })

<button
  style={ativa ? getWeekBadgeStyle(i, isDark) : undefined}
  className={cn(
    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
    ativa
      ? "" // cores via inline style
      : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
  )}
>
  {s.label}-{formatDataDDMM(s.start)}
</button>
```

**Nota:** O `title` da pill continua usando `formatData` para o tooltip acessível:
`title={\`${formatData(s.start)} – ${formatData(s.end)}\`}`

---

## Badges na tabela — coluna "Sem." (SixWLATable.jsx)

Os badges mostram apenas o label (ex: `"S1"`), sem data. O índice da semana é derivado do label:

```js
const weekIndex = parseInt(s.slice(1), 10) - 1; // "S1" → 0, "S6" → 5
```

### Antes
```jsx
<span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
  {s}
</span>
```

### Depois
```jsx
// no componente: const isDark = useDarkMode();

<span
  style={getWeekBadgeStyle(parseInt(s.slice(1), 10) - 1, isDark)}
  className="text-xs font-semibold px-1.5 py-0.5 rounded border"
>
  {s}
</span>
```

---

## Estado inativo das pills

Quando a semana está desativada no filtro multi-select, mantém o visual atual:
`bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground`

Comunicação clara de "não inclusa na visualização", sem alteração de comportamento.

---

## Acessibilidade

- O `title` das pills mantém `"DD MMM – DD MMM"` (ex: `"25 mai – 31 mai"`) para screen readers
- Contraste da paleta: Cobalt `#102A44` sobre fundo claro passa WCAG AA para S1-S4; S5-S6 são decorativos (texto de apoio)

---

## Fora de escopo

- Comportamento de seleção/filtro das pills: sem alteração
- Lógica de cálculo de semanas (`getSemanas`, `getSemanasBadge`): sem alteração
- Outros componentes que exibem labels de semana (ex: badges inline na tabela de restrições por checkbox)
