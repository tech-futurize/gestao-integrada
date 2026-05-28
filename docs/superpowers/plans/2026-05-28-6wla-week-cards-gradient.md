# 6WLA Week Cards Gradient — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar gradiente de cor S1→S6 (mais forte → mais fraco) nos mini cards de semana do header do 6WLA e nos badges da coluna "Sem." da tabela, com formato `S1-25/05` nas pills.

**Architecture:** Utilitários compartilhados em `sixWLAUtils.js` + hook `useDarkMode` em `src/hooks/`. O gradiente usa inline styles com `rgba()` calculados por índice de semana (0–5), com paleta diferente para dark (cyan `#26FFFF`) e light (cobalt `#102A44`). Nenhuma alteração de comportamento ou lógica de dados.

**Tech Stack:** React 18, Vite, Tailwind CSS 3, JSX (sem TypeScript). Sem framework de testes unitários — verificação manual via dev server.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/hooks/useDarkMode.js` | Criar | Detectar classe `.dark` via MutationObserver |
| `src/utils/sixWLAUtils.js` | Modificar | Adicionar `formatDataDDMM` e `getWeekBadgeStyle` |
| `src/pages/Planejamento/SixWLA.jsx` | Modificar | Pills: novo texto `S1-25/05` + gradiente ativo |
| `src/components/planejamento/SixWLATable.jsx` | Modificar | Badges coluna "Sem.": gradiente por índice |

---

## Task 1: Hook `useDarkMode`

**Files:**
- Create: `src/hooks/useDarkMode.js`

- [ ] **Step 1: Criar o arquivo do hook**

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

- [ ] **Step 2: Verificar que o arquivo foi criado corretamente**

```bash
cat src/hooks/useDarkMode.js
```

Esperado: conteúdo do hook acima, sem erros de sintaxe.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDarkMode.js
git commit -m "feat(6wla): adicionar hook useDarkMode"
```

---

## Task 2: Utilitários em `sixWLAUtils.js`

**Files:**
- Modify: `src/utils/sixWLAUtils.js`

O arquivo já contém `formatData`, `getSemanas`, `getSemanasBadge` e helpers internos. Vamos **adicionar** duas funções ao final das exports — não alterar as existentes.

- [ ] **Step 1: Adicionar `formatDataDDMM` e `getWeekBadgeStyle` em `src/utils/sixWLAUtils.js`**

Localizar a linha após `export function formatData(date) { ... }` (atualmente linha ~35) e inserir as duas novas funções:

```js
/**
 * Formata uma Date como "DD/MM" em pt-BR.
 * @param {Date} date
 * @returns {string}
 */
export function formatDataDDMM(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const WEEK_ALPHAS = [
  { bg: 0.22, border: 1.00, text: 1.00, glow: true  },
  { bg: 0.17, border: 0.80, text: 0.90, glow: false },
  { bg: 0.12, border: 0.60, text: 0.73, glow: false },
  { bg: 0.08, border: 0.42, text: 0.57, glow: false },
  { bg: 0.05, border: 0.28, text: 0.42, glow: false },
  { bg: 0.02, border: 0.18, text: 0.30, glow: false },
];

/**
 * Retorna inline style para o badge/pill de uma semana.
 * @param {number} weekIndex 0 (S1) a 5 (S6)
 * @param {boolean} isDark
 * @returns {React.CSSProperties}
 */
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

- [ ] **Step 2: Verificar que as funções originais não foram alteradas**

```bash
grep -n "export function" src/utils/sixWLAUtils.js
```

Esperado: 5 linhas — `getSemanas`, `getSemanasBadge`, `formatData`, `formatDataDDMM`, `getWeekBadgeStyle`.

- [ ] **Step 3: Commit**

```bash
git add src/utils/sixWLAUtils.js
git commit -m "feat(6wla): adicionar formatDataDDMM e getWeekBadgeStyle"
```

---

## Task 3: Pills no header (`SixWLA.jsx`)

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx`

O arquivo importa `formatData` de `@/utils/sixWLAUtils`. Precisamos:
1. Adicionar `formatDataDDMM` e `getWeekBadgeStyle` ao import existente
2. Importar `useDarkMode`
3. Chamar o hook dentro do componente
4. Alterar o `semanas.map` para usar índice `(s, i)`, aplicar `getWeekBadgeStyle(i, isDark)` quando ativa, e trocar o texto

- [ ] **Step 1: Atualizar os imports no topo de `SixWLA.jsx`**

Localizar a linha que importa de `sixWLAUtils` (contém `formatData`, `getSemanas`, `getSemanasBadge`) e adicionar as novas funções:

```js
import { getSemanas, getSemanasBadge, formatData, formatDataDDMM, getWeekBadgeStyle } from "@/utils/sixWLAUtils";
import { useDarkMode } from "@/hooks/useDarkMode";
```

- [ ] **Step 2: Chamar `useDarkMode` dentro do componente**

Localizar onde os outros hooks são chamados (ex: `const { selectedProjectId } = useProject();`) e adicionar logo abaixo:

```js
const isDark = useDarkMode();
```

- [ ] **Step 3: Atualizar o `semanas.map` para usar índice e novo estilo**

Localizar o bloco das pills (buscar por `Pills S1–S6` ou `toggleSemana`). Substituir o bloco `semanas.map(s => {` por `semanas.map((s, i) => {` e atualizar o `<button>`:

**Antes:**
```jsx
{semanas.map(s => {
  const ativa = semanasAtivas.includes(s.label);
  return (
    <button
      key={s.label}
      onClick={() => toggleSemana(s.label)}
      title={`${formatData(s.start)} – ${formatData(s.end)}`}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
        ativa
          ? "bg-[#102A44] text-[#26FFFF] border-[#102A44]"
          : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
      )}
    >
      {s.label} · {formatData(s.start)}
    </button>
  );
})}
```

**Depois:**
```jsx
{semanas.map((s, i) => {
  const ativa = semanasAtivas.includes(s.label);
  return (
    <button
      key={s.label}
      onClick={() => toggleSemana(s.label)}
      title={`${formatData(s.start)} – ${formatData(s.end)}`}
      style={ativa ? getWeekBadgeStyle(i, isDark) : undefined}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
        ativa
          ? ""
          : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
      )}
    >
      {s.label}-{formatDataDDMM(s.start)}
    </button>
  );
})}
```

- [ ] **Step 4: Verificar que não há referência ao formato antigo `· {formatData`**

```bash
grep -n "s\.label} ·" src/pages/Planejamento/SixWLA.jsx
```

Esperado: nenhuma linha encontrada.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "feat(6wla): pills com formato S1-DD/MM e gradiente de cor"
```

---

## Task 4: Badges na tabela (`SixWLATable.jsx`)

**Files:**
- Modify: `src/components/planejamento/SixWLATable.jsx`

O componente atualmente renderiza badges simples `bg-primary/10 text-primary`. Precisamos:
1. Importar `getWeekBadgeStyle` e `useDarkMode`
2. Chamar o hook
3. Substituir o `<span>` do badge para usar `style={getWeekBadgeStyle(...)}` e adicionar a classe `border`

- [ ] **Step 1: Adicionar imports em `SixWLATable.jsx`**

No topo do arquivo, após os imports existentes, adicionar:

```js
import { getWeekBadgeStyle } from "@/utils/sixWLAUtils";
import { useDarkMode } from "@/hooks/useDarkMode";
```

- [ ] **Step 2: Chamar `useDarkMode` no corpo do componente**

Localizar a primeira linha do corpo do componente `SixWLATable` (logo após `export default function SixWLATable(...) {`). Adicionar:

```js
const isDark = useDarkMode();
```

- [ ] **Step 3: Substituir o `<span>` do badge**

Localizar o bloco da coluna "Sem." (buscar por `semanasBadge.map`). Substituir o `<span>` interno:

**Antes:**
```jsx
item.semanasBadge.map(s => (
  <span key={s} className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
    {s}
  </span>
))
```

**Depois:**
```jsx
item.semanasBadge.map(s => (
  <span
    key={s}
    style={getWeekBadgeStyle(parseInt(s.slice(1), 10) - 1, isDark)}
    className="text-xs font-semibold px-1.5 py-0.5 rounded border"
  >
    {s}
  </span>
))
```

- [ ] **Step 4: Verificar que não há referência ao estilo antigo `bg-primary/10 text-primary` no badge**

```bash
grep -n "bg-primary/10 text-primary" src/components/planejamento/SixWLATable.jsx
```

Esperado: nenhuma linha encontrada.

- [ ] **Step 5: Commit**

```bash
git add src/components/planejamento/SixWLATable.jsx
git commit -m "feat(6wla): badges da coluna Sem. com gradiente de cor"
```

---

## Task 5: Verificação visual

- [ ] **Step 1: Iniciar o dev server**

```bash
npm run dev
```

Abrir `http://localhost:5173` no navegador e navegar até **Planejamento → 6WLA**.

- [ ] **Step 2: Verificar pills no header — dark mode**

Ativar o dark mode pelo toggle no rodapé da sidebar. Confirmar:
- Cada pill mostra o formato `S1-DD/MM` (ex: `S1-25/05`)
- S1 tem fundo cyan visível + glow neon
- S6 tem borda e texto quase invisível (muito sutil)
- Pills desativadas (filtro) ficam cinzas como antes

- [ ] **Step 3: Verificar pills no header — light mode**

Alternar para light mode. Confirmar:
- Pills ativas mostram gradiente cobalt (azul escuro) de S1 a S6
- S1 tem fundo levemente azulado + borda forte cobalt
- S6 quase invisível

- [ ] **Step 4: Verificar badges na coluna "Sem." — ambos os temas**

Na tabela de atividades do 6WLA, verificar a coluna "Sem.":
- Badges `S1` aparecem com o estilo mais forte do gradiente
- Badges `S3` ou `S4` aparecem com intensidade intermediária
- Alternando entre dark e light, as cores mudam corretamente (cyan ↔ cobalt)

- [ ] **Step 5: Commit final (se houver ajustes)**

```bash
git add -p  # adicionar apenas o que foi ajustado
git commit -m "fix(6wla): ajustes visuais pós-verificação"
```

Se nenhum ajuste foi necessário, pular este step.
