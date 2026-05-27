# PageHeader — Padronização de Layout (Módulo 0) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o componente `PageHeader` (barra escura única com breadcrumb, filtros e ações) e aplicá-lo nas 3 páginas-piloto, eliminando os headers locais duplicados.

**Architecture:** `PageHeader.jsx` é um componente sticky que auto-deriva `module`/`submodule` via `useLocation()` + `navigationConfig.js`. Recebe `actions` e `filters` como props JSX da página. `Layout.jsx` perde seu `<header>` atual; logo e `AnimatedThemeToggler` migram para dentro do `PageHeader`.

**Tech Stack:** React 18.2 / JSX, Tailwind CSS 3.x, React Router DOM 7.x (`useLocation`), Lucide React (ícones), shadcn/ui `Button`.

**Spec:** `docs/superpowers/specs/2026-05-27-page-header-design.md`

---

## Mapa de Arquivos

| Ação | Arquivo | O que muda |
|------|---------|------------|
| Criar | `src/components/ui/PageHeader.jsx` | Novo componente |
| Modificar | `src/App.jsx` | Remover `getCurrentPageName` e prop `currentPageName` do `LayoutWrapper` |
| Modificar | `src/Layout.jsx` | Remover `<header>` (linhas 212–228), ajustar wrapper de conteúdo, remover prop `currentPageName` |
| Modificar | `src/components/dashboard/ModulosResumo.jsx` | Remover `<h2>` + `<p>` do título (linhas 886–889) |
| Modificar | `src/pages/Dashboard.jsx` | Adicionar `PageHeader`, restructurar layout |
| Modificar | `src/pages/Engenharia/Documentos.jsx` | Remover header local (linhas 296–309), adicionar `PageHeader` |
| Modificar | `src/pages/Suprimentos/MapaSuprimentos.jsx` | Remover header local (linhas 73–86), adicionar `PageHeader` |

---

## Task 1: Criar `PageHeader.jsx`

**Files:**
- Create: `src/components/ui/PageHeader.jsx`

- [ ] **Step 1.1: Criar o componente**

Crie o arquivo `src/components/ui/PageHeader.jsx` com o conteúdo abaixo. O componente:
- Deriva breadcrumb automaticamente via `useLocation()` + `navigationConfig.js`
- Exibe filtros inline em `≥ 1024px`; abaixo disso, botão "Filtros ▾" que revela uma segunda linha
- Migra `AnimatedThemeToggler` e logo para dentro do header

```jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";
import { Button } from "@/components/ui/button";
import { navigationGroups } from "@/lib/navigationConfig";

const LOGO_URL = "/logo.png";

function getCurrentPage(pathname) {
  if (pathname === "/dashboard") return { module: "Dashboard", submodule: null };
  for (const group of navigationGroups) {
    if (group.path === pathname) return { module: group.title, submodule: null };
    const child = group.children?.find((c) => c.path === pathname);
    if (child) return { module: group.title, submodule: child.title };
  }
  return { module: "", submodule: null };
}

export default function PageHeader({ actions, filters }) {
  const { pathname } = useLocation();
  const { module, submodule } = getCurrentPage(pathname);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 shadow-sm">
      {/* Barra principal */}
      <header className="bg-[#1e293b] border-b border-[#334155] px-4 py-2 flex items-center gap-3">
        {/* Breadcrumb */}
        <span className="text-sm font-bold text-slate-100 whitespace-nowrap shrink-0">
          {module}
          {submodule && (
            <>
              <span className="text-slate-500 mx-1.5">›</span>
              {submodule}
            </>
          )}
        </span>

        {/* Filtros inline — apenas desktop (≥ 1024px) */}
        {filters && (
          <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0">
            {filters}
          </div>
        )}

        {/* Espaçador quando sem filtros ou em mobile */}
        {!filters && <div className="flex-1" />}

        {/* Botão Filtros — apenas tablet/mobile (< 1024px) */}
        {filters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((o) => !o)}
            className="lg:hidden border-slate-600 bg-transparent text-slate-300 hover:bg-slate-700 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filtros
          </Button>
        )}

        {/* Ações */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}

        {/* Theme toggler */}
        <AnimatedThemeToggler
          variant="circle"
          duration={400}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#334155] bg-[#1e293b] text-slate-100 hover:bg-[#334155] transition-colors shrink-0"
        />

        {/* Logo */}
        <img src={LOGO_URL} alt="Futurize" className="h-9 object-contain shrink-0" />
      </header>

      {/* Segunda linha de filtros — apenas mobile, quando aberta */}
      {filters && filtersOpen && (
        <div className="lg:hidden bg-[#1e293b] border-b border-[#334155] px-4 py-2 flex items-center gap-2 flex-wrap">
          {filters}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 1.2: Verificar que o arquivo foi criado corretamente**

```bash
ls src/components/ui/PageHeader.jsx
```
Expected: o arquivo existe.

- [ ] **Step 1.3: Commit**

```bash
git add src/components/ui/PageHeader.jsx
git commit -m "feat(ui): criar componente PageHeader com breadcrumb automático e slot de filtros/ações"
```

---

## Task 2: Remover header de `Layout.jsx` e simplificar `App.jsx`

**Files:**
- Modify: `src/Layout.jsx:24,211-228,230`
- Modify: `src/App.jsx:54-69`

- [ ] **Step 2.1: Atualizar assinatura de `Layout.jsx`**

Em `src/Layout.jsx` linha 24, remova a prop `currentPageName`:

```jsx
// antes
export default function Layout({ children, currentPageName }) {

// depois
export default function Layout({ children }) {
```

- [ ] **Step 2.2: Remover o `<header>` do Layout e ajustar o wrapper de conteúdo**

Em `src/Layout.jsx`, localize o bloco `{/* ── MAIN ── */}` (em torno da linha 210). Substitua as linhas 211–233 pelo código abaixo (remove o `<header>` inteiro e muda o div wrapper para `flex flex-col overflow-hidden`):

```jsx
{/* ── MAIN ── */}
<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
  <div className="flex-1 flex flex-col overflow-hidden bg-background">
    {children}
  </div>
</main>
```

> Atenção: `AnimatedThemeToggler` e `img src={LOGO_URL}` que estavam no header foram removidos daqui — agora vivem dentro do `PageHeader.jsx`. Verifique que o import de `AnimatedThemeToggler` em `Layout.jsx` pode ser removido se não houver outro uso no arquivo. Da mesma forma, remova `const LOGO_URL = "/logo.png"` do topo de `Layout.jsx` se não houver outro uso.

- [ ] **Step 2.3: Simplificar `LayoutWrapper` e remover `getCurrentPageName` de `App.jsx`**

Em `src/App.jsx`, remova a função `getCurrentPageName` (linhas 54–64) e simplifique o `LayoutWrapper` (linhas 66–70):

```jsx
// remover completamente:
// function getCurrentPageName(pathname) { … }

// antes
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const currentPageName = getCurrentPageName(location.pathname);
  return <Layout currentPageName={currentPageName}>{children}</Layout>;
};

// depois
const LayoutWrapper = ({ children }) => {
  return <Layout>{children}</Layout>;
};
```

Se `useLocation` não for mais usado em outro lugar em `App.jsx`, remova o import `useLocation` de `"react-router-dom"` neste arquivo.

- [ ] **Step 2.4: Verificar build sem erros**

```bash
npm run build
```
Expected: saída sem erros. Se houver erro de prop `currentPageName` não encontrada, significa que ainda há alguma referência — procure com `grep -r "currentPageName" src/`.

- [ ] **Step 2.5: Commit**

```bash
git add src/Layout.jsx src/App.jsx
git commit -m "refactor(layout): remover header global — PageHeader assume o topo de cada página"
```

---

## Task 3: Aplicar PageHeader no Dashboard

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/components/dashboard/ModulosResumo.jsx:883-889`

- [ ] **Step 3.1: Remover título duplicado de `ModulosResumo.jsx`**

Em `src/components/dashboard/ModulosResumo.jsx`, localize o componente `ModulosResumo` (próximo da linha 883). Remova o bloco de título:

```jsx
// remover este bloco:
<div className="pb-1">
  <h2 className="text-xl font-bold text-foreground">Resumo por Módulo</h2>
  <p className="text-sm text-muted-foreground">Visão consolidada de todos os módulos do projeto</p>
</div>
```

O `export default function ModulosResumo` deve ficar:

```jsx
export default function ModulosResumo({ projetoId }) {
  return (
    <div className="space-y-5">
      <ResumoCronograma projetoId={projetoId} />
      <ResumoContratos projetoId={projetoId} />
      <ResumoSuprimentos projetoId={projetoId} />
      <ResumoFinanceiro projetoId={projetoId} />
      <ResumoAvancoFisico projetoId={projetoId} />
      <ResumoPleitos projetoId={projetoId} />
      <ResumoRegistros projetoId={projetoId} />
      <ResumoGestaoRiscos projetoId={projetoId} />
      <ResumoPlanejamento projetoId={projetoId} />
    </div>
  );
}
```

- [ ] **Step 3.2: Atualizar `Dashboard.jsx`**

Substitua o conteúdo de `src/pages/Dashboard.jsx`:

```jsx
import React from "react";
import { AlertCircle } from "lucide-react";
import ModulosResumo from "../components/dashboard/ModulosResumo";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";

export default function Dashboard() {
  const { selectedProjectId } = useProject();

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <PageEmptyState
          icon={AlertCircle}
          description="Selecione um projeto na barra lateral para visualizar o dashboard."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <ModulosResumo projetoId={selectedProjectId} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.3: Verificar visualmente**

```bash
npm run dev
```

Abra `http://localhost:5173/dashboard`. Verifique:
- Barra escura no topo com "Dashboard" à esquerda, toggler e logo à direita
- Nenhum subtítulo "Visão consolidada…" no conteúdo
- Scroll do conteúdo funciona (barra fica fixada no topo)

- [ ] **Step 3.4: Commit**

```bash
git add src/pages/Dashboard.jsx src/components/dashboard/ModulosResumo.jsx
git commit -m "feat(dashboard): aplicar PageHeader e remover cabeçalho local duplicado"
```

---

## Task 4: Aplicar PageHeader em Engenharia/Documentos

**Files:**
- Modify: `src/pages/Engenharia/Documentos.jsx:293-310`

- [ ] **Step 4.1: Adicionar import do PageHeader**

No topo de `src/pages/Engenharia/Documentos.jsx`, adicione o import:

```jsx
import PageHeader from "@/components/ui/PageHeader";
```

- [ ] **Step 4.2: Substituir o header local pelo PageHeader**

Localize o bloco de retorno da página (próximo da linha 293). Substitua a estrutura atual pelo padrão `flex flex-col h-full` com `PageHeader`:

O trecho atual (linhas 293–310) é:
```jsx
return (
  <div className="p-6 space-y-5">
    {/* Cabeçalho */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documentos de Engenharia</h1>
        <p className="text-sm text-muted-foreground">Gestão de documentos técnicos por disciplina</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowImportExport(true)} disabled={importing}>
          <Upload className="w-4 h-4 mr-2" />{importing ? "Importando..." : "Importar / Exportar"}
        </Button>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />Novo Documento
        </Button>
      </div>
    </div>
    {/* KPIs e restante… */}
```

Substitua pelo padrão:
```jsx
return (
  <div className="flex flex-col h-full">
    <PageHeader
      actions={
        <>
          <Button variant="outline" onClick={() => setShowImportExport(true)} disabled={importing}>
            <Upload className="w-4 h-4 mr-2" />
            {importing ? "Importando..." : "Importar / Exportar"}
          </Button>
          <Button onClick={handleOpenNew}>
            <Plus className="w-4 h-4 mr-2" />Novo Documento
          </Button>
        </>
      }
      filters={
        <>
          <input
            className="border border-border rounded-lg px-3 py-1.5 text-sm w-56 bg-background text-foreground"
            placeholder="Buscar TAG/ID ou título..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPage(1); }}
          />
          <FilterBar
            storageKey="documentos-filtros"
            filters={[
              { key: "disciplina", label: "Disciplina", options: ["MEC", "CIV", "ELE", "TUB", "INS", "AUT", "EST", "PRC", "HSE"] },
              { key: "fornecedor", label: "Fornecedor", options: fornecedorOptions },
            ]}
            onChange={setFiltros}
          />
        </>
      }
    />
    <div className="flex-1 overflow-auto p-6 space-y-5">
      {/* KPIs, tabela e restante do conteúdo original */}
```

> **Atenção:** O bloco `{/* Filtros */}` original (lines ~334–350 com o `<div className="flex flex-wrap items-start gap-2">`) deve ser **removido** da área de conteúdo — esses controles foram movidos para a prop `filters` acima. Mantenha apenas os KPIs e a tabela dentro do `<div className="flex-1 overflow-auto p-6 space-y-5">`.

- [ ] **Step 4.3: Verificar visualmente**

Com o servidor rodando, abra `http://localhost:5173/engenharia/documentos`. Verifique:
- Barra escura com "Engenharia › Documentos" + botões Importar/Novo à direita
- Filtros de busca/disciplina/etapa na barra (desktop) ou atrás do botão Filtros (< 1024px)
- Sem `<h1>` ou subtítulo no conteúdo da página
- Scroll funciona corretamente

- [ ] **Step 4.4: Commit**

```bash
git add src/pages/Engenharia/Documentos.jsx
git commit -m "feat(engenharia): aplicar PageHeader e remover cabeçalho local duplicado"
```

---

## Task 5: Aplicar PageHeader em Suprimentos/MapaSuprimentos

**Files:**
- Modify: `src/pages/Suprimentos/MapaSuprimentos.jsx:72-89`

- [ ] **Step 5.1: Adicionar import do PageHeader**

No topo de `src/pages/Suprimentos/MapaSuprimentos.jsx`, adicione:

```jsx
import PageHeader from "@/components/ui/PageHeader";
```

- [ ] **Step 5.2: Substituir o header local pelo PageHeader**

Localize o trecho atual (linhas 72–86):
```jsx
return (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mapa de Suprimentos</h1>
        <p className="text-sm text-muted-foreground">Pipeline de aquisição — Requisição até Fornecimento</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowImportExport(true)}>
          <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
        </Button>
        <Button onClick={() => setTriggerNew(t => t + 1)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Item
        </Button>
      </div>
    </div>
    <MapaSuprimentosComponent selectedProjectId={selectedProjectId} triggerNew={triggerNew} />
```

Substitua por:
```jsx
return (
  <div className="flex flex-col h-full">
    <PageHeader
      actions={
        <>
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
          <Button onClick={() => setTriggerNew((t) => t + 1)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Item
          </Button>
        </>
      }
    />
    <div className="flex-1 overflow-auto p-6">
      <MapaSuprimentosComponent selectedProjectId={selectedProjectId} triggerNew={triggerNew} />
```

> Nota: `MapaSuprimentos.jsx` não tem filtros próprios no header — a busca/filtro está dentro do `MapaSuprimentosComponent`. Por isso a prop `filters` não é passada.

- [ ] **Step 5.3: Verificar visualmente**

Abra `http://localhost:5173/suprimentos/mapa`. Verifique:
- Barra escura com "Suprimentos › Mapa de Suprimentos" + botões Importar/Novo Item
- Sem `<h1>` ou subtítulo "Pipeline de aquisição…"
- Scroll funciona

- [ ] **Step 5.4: Commit**

```bash
git add src/pages/Suprimentos/MapaSuprimentos.jsx
git commit -m "feat(suprimentos): aplicar PageHeader e remover cabeçalho local duplicado"
```

---

## Task 6: Verificação final e build

**Files:** (nenhum arquivo novo — apenas verificação)

- [ ] **Step 6.1: Build de produção sem erros**

```bash
npm run build
```
Expected: build completo sem erros. Warnings de `unused import` são aceitáveis — erros não.

- [ ] **Step 6.2: Verificar as 3 páginas-piloto no browser**

Com `npm run dev`, navegar sequencialmente e checar em cada página:
1. `http://localhost:5173/dashboard` — breadcrumb "Dashboard", sem subtítulo no conteúdo
2. `http://localhost:5173/engenharia/documentos` — breadcrumb "Engenharia › Documentos", filtros na barra, botões de ação
3. `http://localhost:5173/suprimentos/mapa` — breadcrumb "Suprimentos › Mapa de Suprimentos", botões de ação

Para cada página verificar também:
- Tema claro/escuro: clicar no toggler e confirmar que a barra escura do header permanece escura em ambos os temas (não herda o fundo claro do tema)
- Redimensionar a janela abaixo de 1024px de largura: botão "Filtros ▾" deve aparecer nas páginas com filtros

- [ ] **Step 6.3: Commit final de cleanup**

Se houver imports mortos identificados nas tasks anteriores (ex: `AnimatedThemeToggler` em Layout.jsx, `useLocation` em App.jsx):

```bash
git add src/Layout.jsx src/App.jsx
git commit -m "chore: remover imports não utilizados após migração do PageHeader"
```

---

## Handoff para próximos módulos

Ao aplicar o PageHeader nos Módulos 1–15, o padrão é sempre:

```jsx
// Estrutura padrão de toda página
return (
  <div className="flex flex-col h-full">
    <PageHeader
      actions={/* botões específicos da página */}
      filters={/* controles de filtro, ou omitir se não houver */}
    />
    <div className="flex-1 overflow-auto p-6">
      {/* conteúdo: KPIs, tabela, etc. */}
    </div>
  </div>
);
```

E remover sempre: `<div flex justify-between>`, `<h1>`, `<p>` (subtítulo descritivo).
