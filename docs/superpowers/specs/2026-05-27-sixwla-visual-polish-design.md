# D5.1 — Polish Visual SixWLA

**Data:** 2026-05-27  
**Escopo:** `src/pages/Planejamento/SixWLA.jsx` + `src/components/planejamento/SixWLATable.jsx`  
**Agente:** Designer  
**Status:** Aprovado

---

## Contexto

O módulo 6WLA (Six Week Look Ahead) apresenta 7 KPI cards, pills de filtro S1–S6, banner de auto-sync e uma tabela densa com checkboxes inline. A tarefa é refinar o visual sem alterar lógica de negócio.

Problemas identificados antes do redesign:
- KPI cards sem hierarquia visual entre Total e restrições
- Pills S1–S6 com rótulo confuso ("S1 · Sem.22") e cor genérica
- Banner usa classes `blue-*` hardcoded (quebra no dark mode)
- Valor `%Real` na tabela usa `style={{ color }}` inline em vez de classes Tailwind

---

## Decisões de Design

### 1. KPI Cards

**Layout:** 7 colunas iguais (`grid-cols-2 sm:grid-cols-4 lg:grid-cols-7`) — sem alteração estrutural.

**Card Total:**
- Light: `bg-[#102A44] border-[#1e4a6e]`, label em `#8195A9`, valor em `#26FFFF`
- Dark: mesmas cores (Cobalt é fixo em ambos os modos conforme DESIGN.md)
- Label: "Total Atividades" com subtexto "no 6WLA"

**Cards de Restrição (6x):**
- Light: `bg-amber-50 border-amber-200`, label `text-amber-900/70`, valor `text-amber-700`
- Dark: `dark:bg-amber-950/20 dark:border-amber-800/40`, valor `dark:text-amber-400`
- Label: nome abreviado existente (Proj/Eng, Mat, MO, Eq, Ext, Info) com `title` para nome completo

### 2. Pills S1–S6

**Ativa:** `bg-[#102A44] text-[#26FFFF] border-[#102A44]` — mesma identidade visual do card Total  
**Inativa:** `bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground`  
**Rótulo:** `S1 · 26 mai` (data de início da semana via `formatData(s.start)` já existente — retorna `"dd mmm"` em pt-BR)

### 3. Checkboxes na Tabela

Mantêm `data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500` — consistência com KPI cards de restrição.

Padding das colunas de checkbox: `px-2 py-2` (reduzido de `py-3`) para maior densidade.

### 4. Banner Auto-Sync

Substituir classes hardcoded por tokens semânticos:
- `bg-blue-50 dark:bg-blue-900/20` → `bg-primary/5`
- `border-blue-200 dark:border-blue-700` → `border-primary/20`
- `text-blue-700 dark:text-blue-300` → `text-primary`
- Botão "Importar": `variant="outline"` com `className="border-primary/30 text-primary hover:bg-primary/10"`
- Ícone: `text-primary`

### 5. %Real na Tabela

Substituir `style={{ color: avColor }}` por classes Tailwind condicionais:

```js
const avRealClass =
  avReal >= 100 ? "text-green-600 dark:text-green-400" :
  avReal >= 50  ? "text-amber-600 dark:text-amber-400" :
  avReal > 0    ? "text-red-500 dark:text-red-400" :
                  "text-muted-foreground";
```

### 6. Responsividade

Sem alterações — os breakpoints existentes (`grid-cols-2 sm:grid-cols-4 lg:grid-cols-7` e `flex-wrap` nas pills) já cobrem mobile adequadamente.

---

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Planejamento/SixWLA.jsx` | KPI cards (cor + label), pills (cor + rótulo), banner (tokens semânticos) |
| `src/components/planejamento/SixWLATable.jsx` | `%Real` classes Tailwind, padding checkboxes |

---

## Fora de Escopo

- Lógica de negócio, queries Supabase, mutations
- Estrutura de colunas da tabela
- Componente `AdicionarCronogramaModal`
- Animações (Framer Motion não é usado neste módulo)
