# Spec: PageHeader — Padronização de Layout (Módulo 0)

**Data:** 2026-05-27
**Status:** Aprovado pelo PO
**Milestone:** Backlog 2026-Q2 — Onda 2 / Módulo 0

---

## Contexto

Cada página do sistema tem um cabeçalho local próprio (`flex justify-between` com `<h1>`, subtítulo e botões de ação), duplicando estrutura em ~18 páginas. O objetivo é centralizar esse padrão em um único componente reutilizável que sirva de base para todos os módulos.

---

## Decisões de Design

| Questão | Decisão |
|---------|---------|
| Layout visual | Barra única escura: breadcrumb + filtros + ações + logo em uma linha |
| Breadcrumb do Dashboard | Apenas "Dashboard" (sem `›` de segundo nível) |
| Viewport mínimo | Tablet-friendly: abaixo de 1024px, filtros colapsam em botão "Filtros ▾" |
| Abordagem arquitetural | PageHeader sticky dentro do conteúdo de cada página (sem context) |
| Prop `children` | Descartada — ambígua com `actions`/`filters` |

---

## API do Componente

```jsx
// src/components/ui/PageHeader.jsx
<PageHeader
  actions={<JSX />}   // botões de ação (Novo, Importar…) — opcional
  filters={<JSX />}   // inputs/selects de filtro — opcional
/>
```

- `module` e `submodule` são derivados **automaticamente** via `useLocation()` + `navigationConfig.js` — a página não passa.
- Todos os props são opcionais. Barra sem `actions` e sem `filters` exibe apenas breadcrumb + logo.

### Renderização visual

**≥ 1024px:**
```
[ Módulo › Submódulo ]  [ filtro 1 ] [ filtro 2 ] …  [ Ação 2 ] [ Ação 1 ] [ ◐ ] [ logo ]
```

**< 1024px (tablet):**
```
[ Módulo › Submódulo ]  [ ⚙ Filtros ▾ ]  [ Ação 2 ] [ Ação 1 ] [ ◐ ] [ logo ]
```

**Dashboard (sem submódulo, sem filtros):**
```
[ Dashboard ]                                                    [ ◐ ] [ logo ]
```

---

## Mudanças Estruturais

### `Layout.jsx` (linhas 211–228)

O `<header>` atual é **removido**. Logo (`LOGO_URL`) e `AnimatedThemeToggler` migram para dentro do `PageHeader`. O wrapper de conteúdo muda de `overflow-auto` para `flex flex-col overflow-hidden`:

```jsx
// antes
<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
  <header className="bg-background border-b sticky top-0 z-10 …">
    <h1>{currentPageName}</h1>
    <AnimatedThemeToggler … />
    <img src={LOGO_URL} … />
  </header>
  <div className="flex-1 overflow-auto bg-background">
    {children}
  </div>
</main>

// depois
<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
  <div className="flex-1 flex flex-col overflow-hidden bg-background">
    {children}
  </div>
</main>
```

### `App.jsx` — `getCurrentPageName` (linhas 54–64)

Renomeado para `getCurrentPage`, passa a retornar `{ module, submodule }`:

```js
function getCurrentPage(pathname) {
  if (pathname === '/dashboard') return { module: 'Dashboard', submodule: null };
  for (const group of navigationGroups) {
    if (group.path === pathname) return { module: group.title, submodule: null };
    const child = group.children?.find(c => c.path === pathname);
    if (child) return { module: group.title, submodule: child.title };
  }
  return { module: '', submodule: null };
}
```

O `LayoutWrapper` deve remover a passagem de `currentPageName` como prop — ela deixa de existir no Layout, pois o PageHeader lê a rota diretamente.

---

## Páginas-Piloto

Regra geral de migração: cada página envolve seu conteúdo em `<div className="flex flex-col h-full">`, abre com `<PageHeader … />` e coloca o restante em `<div className="flex-1 overflow-auto p-6">`.

### Dashboard.jsx

- Remove `<h2>Resumo por Módulo</h2>` e `<p>Visão consolidada…</p>` de `ModulosResumo.jsx:887-888`
- `<PageHeader />` sem props (nenhuma ação nem filtro)

### Engenharia/Documentos.jsx (linhas 294–309)

- Remove `<div flex justify-between>` com `<h1>`, `<p>` e botões
- `<PageHeader actions={…} filters={…} />` recebe os botões e filtros existentes

### Suprimentos/MapaSuprimentos.jsx (linhas 72–86)

- Remove `<div flex justify-between mb-6>` com `<h1>`, `<p>` e botões
- `<PageHeader actions={…} filters={…} />` recebe os botões existentes; filtros vindos do `MapaSuprimentosComponent`

---

## Padrão para Módulos 1–15

Ao aplicar o PageHeader em qualquer módulo futuro:

1. Remover o bloco `<div flex justify-between>` / `<h1>` / `<p>` local da página
2. Adicionar `<PageHeader actions={…} filters={…} />` como primeiro filho
3. Envolver conteúdo restante em `<div className="flex-1 overflow-auto p-6">`
4. Nunca passar `module`/`submodule` manualmente — o componente deriva automaticamente

---

## O que está fora do escopo desta spec

- Redesign de KPI cards ou conteúdo abaixo do header
- Permissões por botão de ação (Módulo 14)
- Animações de transição entre páginas
