# Registros — Cards Superiores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os 4 cards planos atuais de Registros por um layout de Card Total + 3 grupos dimensionais (Tipo / Responsabilidade / Status) com barras de proporção relativa.

**Architecture:** Mudança localizada em um único arquivo — `src/pages/AdminContratual/Registros.jsx`. Expande o `useMemo` de KPIs para calcular arrays por dimensão e substitui o bloco de renderização dos cards pelo novo layout responsivo.

**Tech Stack:** React 18, Tailwind CSS 3.x, shadcn/ui Skeleton

**Spec:** `docs/superpowers/specs/2026-05-28-registros-cards-superiores-design.md`

---

## Arquivo Afetado

| Ação | Arquivo | Trecho |
|------|---------|--------|
| Modificar | `src/pages/AdminContratual/Registros.jsx` | `useMemo kpis` (linhas ~102–107) + KPI Bar (linhas ~149–164) |

---

## Task 1: Expandir `kpis` useMemo com as 3 dimensões

**Files:**
- Modify: `src/pages/AdminContratual/Registros.jsx:102-107`

- [ ] **Step 1: Localizar o useMemo atual**

Abra `src/pages/AdminContratual/Registros.jsx` e encontre o bloco `kpis` (por volta da linha 102):

```js
const kpis = useMemo(() => ({
  total: baseList.length,
  registrado: baseList.filter((i) => i.status === "Registrado").length,
  emAnalise: baseList.filter((i) => i.status === "Em Análise").length,
  resolvido: baseList.filter((i) => i.status === "Resolvido").length,
}), [baseList]);
```

- [ ] **Step 2: Substituir pelo useMemo expandido**

Substitua o bloco inteiro por:

```js
const kpis = useMemo(() => {
  const total = baseList.length;
  return {
    total,
    porTipo: [
      { label: "Ata de Reunião", count: baseList.filter((i) => i.tipo_registro === "Ata de Reunião").length },
      { label: "E-mail",         count: baseList.filter((i) => i.tipo_registro === "E-mail").length },
      { label: "Notificação",    count: baseList.filter((i) => i.tipo_registro === "Notificação").length },
    ],
    porResp: [
      { label: "Contratada",  count: baseList.filter((i) => i.responsabilidade === "Contratada").length },
      { label: "Contratante", count: baseList.filter((i) => i.responsabilidade === "Contratante").length },
    ],
    porStatus: [
      { label: "Registrado", count: baseList.filter((i) => i.status === "Registrado").length },
      { label: "Em Análise", count: baseList.filter((i) => i.status === "Em Análise").length },
      { label: "Resolvido",  count: baseList.filter((i) => i.status === "Resolvido").length },
    ],
  };
}, [baseList]);
```

---

## Task 2: Adicionar mapa de cores por dimensão

**Files:**
- Modify: `src/pages/AdminContratual/Registros.jsx` — adicionar constante após `TIPO_COLORS`

- [ ] **Step 1: Adicionar constante `DIMENSION_COLORS` logo após `TIPO_COLORS` (linha ~28)**

Inserir após o bloco `TIPO_COLORS`:

```js
const DIMENSION_COLORS = {
  "Ata de Reunião": { text: "text-purple-400", bar: "#c084fc" },
  "E-mail":         { text: "text-orange-400", bar: "#fb923c" },
  "Notificação":    { text: "text-red-400",    bar: "#f87171" },
  "Contratada":     { text: "text-blue-400",   bar: "#60a5fa" },
  "Contratante":    { text: "text-amber-400",  bar: "#fbbf24" },
  "Registrado":     { text: "text-blue-400",   bar: "#60a5fa" },
  "Em Análise":     { text: "text-amber-400",  bar: "#fbbf24" },
  "Resolvido":      { text: "text-green-400",  bar: "#4ade80" },
};
```

---

## Task 3: Substituir o bloco KPI Bar pelo novo layout

**Files:**
- Modify: `src/pages/AdminContratual/Registros.jsx:149-164`

- [ ] **Step 1: Localizar o bloco `{/* KPI Bar */}` atual (linha ~148)**

O bloco atual tem esta estrutura:

```jsx
{/* KPI Bar */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  {[
    { label: "Total", value: kpis.total, color: "text-foreground" },
    ...
  ].map(...)}
</div>
```

- [ ] **Step 2: Substituir pelo novo layout**

Substitua o bloco inteiro (do comentário `{/* KPI Bar */}` até o fechamento da `</div>`) por:

```jsx
{/* KPI Cards */}
{isLoading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} className="h-20 rounded-xl flex-1" />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">

    {/* Card Total */}
    <div
      className="rounded-xl px-4 py-4 flex flex-col justify-center gap-1 lg:min-w-[110px]"
      style={{
        background: "rgba(38,255,255,0.06)",
        border: "1px solid rgba(38,255,255,0.2)",
        boxShadow: "0 0 14px rgba(38,255,255,0.12)",
      }}
    >
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Total</span>
      <span
        className="text-3xl font-bold leading-none"
        style={{ color: "#26ffff", textShadow: "0 0 14px rgba(38,255,255,0.6)" }}
      >
        {kpis.total}
      </span>
      <span className="text-[10px] text-muted-foreground">registros</span>
    </div>

    {/* Por Tipo */}
    <div className="flex-1 rounded-xl px-4 py-3 bg-card border border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">Por Tipo</p>
      <div className="flex flex-col gap-2">
        {kpis.porTipo.map(({ label, count }) => {
          const colors = DIMENSION_COLORS[label] || { text: "text-foreground", bar: "#8195A9" };
          const pct = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
          return (
            <div key={label} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
                <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-muted/40">
                <div
                  className="h-[3px] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: colors.bar }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Por Responsabilidade */}
    <div className="flex-1 rounded-xl px-4 py-3 bg-card border border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">Por Responsabilidade</p>
      <div className="flex flex-col gap-2">
        {kpis.porResp.map(({ label, count }) => {
          const colors = DIMENSION_COLORS[label] || { text: "text-foreground", bar: "#8195A9" };
          const pct = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
          return (
            <div key={label} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
                <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-muted/40">
                <div
                  className="h-[3px] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: colors.bar }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Por Status */}
    <div className="flex-1 rounded-xl px-4 py-3 bg-card border border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">Por Status</p>
      <div className="flex flex-col gap-2">
        {kpis.porStatus.map(({ label, count }) => {
          const colors = DIMENSION_COLORS[label] || { text: "text-foreground", bar: "#8195A9" };
          const pct = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
          return (
            <div key={label} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
                <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-muted/40">
                <div
                  className="h-[3px] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: colors.bar }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>

  </div>
)}
```

---

## Task 4: Verificar e commitar

- [ ] **Step 1: Checar que o build não tem erros**

```bash
npm run build 2>&1 | tail -20
```

Esperado: `✓ built in` sem erros.

- [ ] **Step 2: Verificar visualmente em desenvolvimento**

```bash
npm run dev
```

Abrir `http://localhost:5173/admin-contratual/registros` e confirmar:
- Card Total com glow ciano visível
- 3 grupos exibindo contagens corretas
- Barras proporcionais presentes
- Tema claro e escuro funcionando
- Layout responsivo: 1 col em viewport estreito, 4 painéis em desktop

- [ ] **Step 3: Commitar**

```bash
git add src/pages/AdminContratual/Registros.jsx
git commit -m "feat(M11): cards superiores de Registros — Total + 3 grupos dimensionais com barras de proporção"
```

- [ ] **Step 4: Marcar task como concluída no PLAN.md**

Em `PLAN.md`, na seção Módulo 11 — REGISTROS, trocar:

```
- [ ] Designer: Cards superiores: Qtd por Tipo, Qtd por Responsabilidade, Qtd por Status
```

por:

```
- [x] Designer: Cards superiores: Qtd por Tipo, Qtd por Responsabilidade, Qtd por Status *(2026-05-28)*
```

---

## Self-Review

| Req. da Spec | Coberto? | Tarefa |
|---|---|---|
| Card Total com glow ciano | ✅ | Task 3 |
| Grupo Por Tipo (3 itens + barras) | ✅ | Task 3 |
| Grupo Por Responsabilidade (2 itens + barras) | ✅ | Task 3 |
| Grupo Por Status (3 itens + barras) | ✅ | Task 3 |
| Barras com denominador = total geral | ✅ | Task 3 (`kpis.total`) |
| Responsabilidade nula: sem categoria extra | ✅ | Task 1 (array fixo de 2 itens) |
| Skeleton no loading state | ✅ | Task 3 |
| Responsivo grid-cols-1 → sm:grid-cols-2 → lg:flex | ✅ | Task 3 |
| Tema claro e escuro | ✅ | Task 3 (tokens `bg-card`, `border-border`) |
| PLAN.md atualizado | ✅ | Task 4 |
