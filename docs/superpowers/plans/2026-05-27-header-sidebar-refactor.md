# Header Simplificado + SidebarUserMenu — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplificar o PageHeader para breadcrumb + ações apenas, remover filtros para dentro de cada seção, e adicionar menu de usuário (avatar, tema, logout) no rodapé da sidebar.

**Architecture:** O `PageHeader` perde `filters`, `AnimatedThemeToggler` e logo. O novo componente `SidebarUserMenu` usa `Popover` do Radix/shadcn já instalado, lê dados de `useAuth()` e renderiza no rodapé da `<aside>`. A única página com `filters=` no header (Engenharia/Documentos) tem o FilterBar movido para o topo da área de conteúdo.

**Tech Stack:** React 18.2 + JSX, Radix UI Popover (`src/components/ui/popover.jsx`), lucide-react, `useAuth` de `src/lib/AuthContext.jsx`, `AnimatedThemeToggler` de `src/components/ui/AnimatedThemeToggler.jsx`

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/ui/PageHeader.jsx` | Modificar — remover `filters`, toggler, logo |
| `src/components/ui/SidebarUserMenu.jsx` | **Criar** |
| `src/Layout.jsx` | Modificar — importar e renderizar `SidebarUserMenu` |
| `src/pages/Engenharia/Documentos.jsx` | Modificar — migrar filtros para dentro do conteúdo |
| `docs/design/DESIGN.md` | Modificar — atualizar seção 9 |

---

## Task 1: Simplificar PageHeader

**Files:**
- Modify: `src/components/ui/PageHeader.jsx`

- [ ] **Step 1: Substituir o arquivo inteiro pelo conteúdo simplificado**

  O novo `PageHeader` remove `filters`, `AnimatedThemeToggler`, logo e o estado `filtersOpen`. Mantém apenas breadcrumb automático + `actions`.

  Conteúdo completo do arquivo após a mudança:

  ```jsx
  import { useLocation } from "react-router-dom";
  import { navigationGroups } from "@/lib/navigationConfig";

  function getCurrentPage(pathname) {
    if (pathname === "/dashboard") return { moduleName: "Dashboard", submodule: null };
    for (const group of navigationGroups) {
      if (group.path === pathname) return { moduleName: group.title, submodule: null };
      const child = group.children?.find((c) => c.path === pathname);
      if (child) return { moduleName: group.title, submodule: child.title };
    }
    return { moduleName: "", submodule: null };
  }

  export default function PageHeader({ actions }) {
    const { pathname } = useLocation();
    const { moduleName, submodule } = getCurrentPage(pathname);

    return (
      <header className="sticky top-0 z-10 bg-sidebar border-b border-sidebar-border px-4 py-2 flex items-center gap-3 shadow-sm">
        <span className="text-sm font-bold text-sidebar-foreground whitespace-nowrap shrink-0">
          {moduleName}
          {submodule && (
            <>
              <span className="text-sidebar-foreground/50 mx-1.5">›</span>
              {submodule}
            </>
          )}
        </span>

        <div className="flex-1" />

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </header>
    );
  }
  ```

- [ ] **Step 2: Verificar que o build não tem erros de import**

  ```bash
  cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada && npm run build 2>&1 | tail -20
  ```

  Esperado: sem erros de import relacionados a `PageHeader`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/ui/PageHeader.jsx
  git commit -m "refactor(PageHeader): remover filters, toggler e logo — apenas breadcrumb + actions"
  ```

---

## Task 2: Criar SidebarUserMenu

**Files:**
- Create: `src/components/ui/SidebarUserMenu.jsx`

- [ ] **Step 1: Criar o componente**

  ```jsx
  import { LogOut, ChevronRight } from "lucide-react";
  import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
  import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";
  import { useAuth } from "@/lib/AuthContext";

  function getInitials(user) {
    const name = user?.user_metadata?.full_name;
    if (name) {
      const parts = name.trim().split(" ");
      return (parts[0][0] + (parts[parts.length - 1][0] ?? "")).toUpperCase();
    }
    return (user?.email?.[0] ?? "?").toUpperCase();
  }

  export default function SidebarUserMenu({ collapsed }) {
    const { user, logout } = useAuth();

    const initials = getInitials(user);
    const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
    const email = user?.email || "";

    return (
      <div className="border-t border-sidebar-border p-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`w-full flex items-center rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent text-sidebar-foreground ${
                collapsed ? "justify-center" : "gap-3"
              }`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground">
                {initials}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate leading-tight">{name}</p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">{email}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                </>
              )}
            </button>
          </PopoverTrigger>

          <PopoverContent
            side="right"
            align="end"
            sideOffset={8}
            className="w-64 p-0 bg-sidebar border-sidebar-border text-sidebar-foreground"
          >
            {/* Cabeçalho com dados do usuário */}
            <div className="px-4 py-3 border-b border-sidebar-border">
              <p className="text-sm font-semibold truncate">{name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{email}</p>
            </div>

            {/* Toggle de tema */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-sidebar-border">
              <span className="text-sm text-sidebar-foreground/80">Tema</span>
              <AnimatedThemeToggler
                variant="circle"
                duration={400}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
              />
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors rounded-b-md"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  ```

- [ ] **Step 2: Verificar que o build não tem erros**

  ```bash
  cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada && npm run build 2>&1 | tail -20
  ```

  Esperado: sem erros.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/ui/SidebarUserMenu.jsx
  git commit -m "feat(SidebarUserMenu): novo componente — avatar, tema e logout no rodapé da sidebar"
  ```

---

## Task 3: Integrar SidebarUserMenu no Layout

**Files:**
- Modify: `src/Layout.jsx`

- [ ] **Step 1: Adicionar import do SidebarUserMenu**

  No topo de `src/Layout.jsx`, após os imports existentes, adicionar:

  ```jsx
  import SidebarUserMenu from "@/components/ui/SidebarUserMenu";
  ```

- [ ] **Step 2: Renderizar SidebarUserMenu no rodapé da aside**

  Localizar o fechamento `</aside>` (linha ~207 do arquivo original). O `SidebarUserMenu` deve ser adicionado **depois** do `<nav>` e **antes** de `</aside>`.

  Substituir:
  ```jsx
          </nav>
        </aside>
  ```

  Por:
  ```jsx
          </nav>

          <SidebarUserMenu collapsed={collapsed} />
        </aside>
  ```

- [ ] **Step 3: Iniciar o dev server e verificar visualmente**

  ```bash
  cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada && npm run dev
  ```

  Verificar:
  - Bloco de usuário aparece no rodapé da sidebar (nome + email + seta quando expandida)
  - Apenas avatar visível quando sidebar colapsada
  - Clique no avatar/bloco abre popover à direita com: nome, email, toggle de tema, botão Sair
  - Toggle de tema no popover funciona (animação circular)
  - Botão Sair executa `logout()` e redireciona para `/login`
  - Header não mostra mais logo nem toggle de tema

- [ ] **Step 4: Commit**

  ```bash
  git add src/Layout.jsx
  git commit -m "feat(Layout): integrar SidebarUserMenu no rodapé da sidebar"
  ```

---

## Task 4: Migrar filtros de Engenharia/Documentos

**Files:**
- Modify: `src/pages/Engenharia/Documentos.jsx`

- [ ] **Step 1: Remover a prop `filters` do PageHeader e mover o JSX para dentro do conteúdo**

  Localizar o bloco `<PageHeader actions={...} filters={...} />` (linhas ~304–333 do arquivo).

  Substituir:
  ```jsx
        <PageHeader
          actions={
            <>
              <Button variant="outline" onClick={() => setShowImportExport(true)} disabled={importing}>
                <Upload className="w-4 h-4 mr-2" />{importing ? "Importando..." : "Importar / Exportar"}
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
  ```

  Por:
  ```jsx
        <PageHeader
          actions={
            <>
              <Button variant="outline" onClick={() => setShowImportExport(true)} disabled={importing}>
                <Upload className="w-4 h-4 mr-2" />{importing ? "Importando..." : "Importar / Exportar"}
              </Button>
              <Button onClick={handleOpenNew}>
                <Plus className="w-4 h-4 mr-2" />Novo Documento
              </Button>
            </>
          }
        />
        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
  ```

  > **Atenção:** a tag `<div className="flex-1 overflow-auto p-6 space-y-5">` que fecha o conteúdo (no final do return, na linha ~714) **permanece inalterada** — apenas o novo `<div>` dos filtros precisa ser fechado antes dos KPIs.

- [ ] **Step 2: Fechar corretamente o novo div de filtros**

  Após o `<div>` de filtros e antes do bloco de KPIs (`{/* KPIs */}`), verificar que há um `</div>` fechando o wrapper dos filtros. O conteúdo do `<div className="flex-1 overflow-auto p-6 space-y-5">` deve ficar assim:

  ```jsx
  <div className="flex-1 overflow-auto p-6 space-y-5">
    {/* Filtros */}
    <div className="flex flex-wrap items-center gap-2">
      <input ... />
      <FilterBar ... />
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      ...
    </div>

    {/* Tabela */}
    ...
  </div>
  ```

- [ ] **Step 3: Verificar visualmente a página de Engenharia**

  Com o dev server rodando, navegar para Engenharia > Documentos.

  Verificar:
  - Filtros aparecem dentro da área de conteúdo (branco/card), abaixo do header
  - Header mostra apenas "Engenharia › Documentos" + botões "Importar / Exportar" e "Novo Documento"
  - Filtrar por disciplina e buscar por TAG continua funcionando normalmente

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/Engenharia/Documentos.jsx
  git commit -m "refactor(Documentos): migrar filtros do PageHeader para dentro da seção de conteúdo"
  ```

---

## Task 5: Atualizar DESIGN.md

**Files:**
- Modify: `docs/design/DESIGN.md`

- [ ] **Step 1: Atualizar a seção 9 — Layout de Página**

  Na seção 9 de `docs/design/DESIGN.md`, atualizar:

  **a) Tabela de props** — remover `filters`:

  ```markdown
  | Prop | Tipo | Padrão | Descrição |
  |------|------|--------|-----------|
  | `actions` | `ReactNode` | `undefined` | Botões à direita (Novo, Importar, Exportar…) |
  ```

  **b) Exemplos de uso** — remover o exemplo "Filtros + ações" e o exemplo sem props que menciona filtros. Manter apenas:

  - "Apenas ações" (já correto)
  - "Sem props (ex: Dashboard)" (já correto)

  **c) Atualizar os diagramas visuais** — remover a variante "com filtros" do desktop:

  ```markdown
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
  ```

  **d) Migração para novos módulos** — atualizar passo 1 para refletir que não há `filters`:

  ```markdown
  1. Remover o bloco local de cabeçalho: `<div className="flex justify-between …">` com `<h1>`, `<p>` e botões
  2. Adicionar `<PageHeader actions={…} />` como **primeiro filho** do wrapper da página
  3. Envolver o conteúdo restante em `<div className="flex-1 overflow-auto p-6">`
  4. Colocar filtros (se houver) dentro do `<div className="flex-1 overflow-auto p-6">`, antes do conteúdo principal
  ```

- [ ] **Step 2: Adicionar nova seção "Sidebar — Menu de Usuário" após a seção 9**

  Adicionar antes de `## Documentos Relacionados`:

  ```markdown
  ## 10. Sidebar — Menu de Usuário (SidebarUserMenu)

  **Localização:** `src/components/ui/SidebarUserMenu.jsx`

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
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add docs/design/DESIGN.md
  git commit -m "docs(DESIGN): atualizar seção 9 (sem filters no PageHeader) e adicionar seção SidebarUserMenu"
  ```

---

## Verificação final

- [ ] Rodar o dev server (`npm run dev`) e percorrer as páginas principais
- [ ] Confirmar que **nenhuma página** ainda passa `filters=` ao `PageHeader` (`grep -r "filters=" src/pages src/components --include="*.jsx"` — deve retornar apenas usos não relacionados ao PageHeader)
- [ ] Confirmar que o toggle de tema no popover funciona em ambos os modos (claro → escuro → claro)
- [ ] Confirmar que o botão Sair redireciona para `/login`
- [ ] Confirmar que a sidebar colapsada mostra o avatar e o popover abre corretamente
