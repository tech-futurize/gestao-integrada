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

## Task 6: Wrappers simples — páginas sem header local

**Files:**
- Modify: `src/pages/Planejamento/Histograma.jsx`
- Modify: `src/pages/Planejamento/TakeOff.jsx`
- Modify: `src/pages/AdminContratual/RDOs.jsx`
- Modify: `src/pages/AdminContratual/MapaImpacto.jsx`

Todas têm o mesmo padrão: apenas um componente filho dentro de `<div className="p-6 ...">`. Transformação idêntica para as 4.

- [ ] **Step 1: Atualizar `src/pages/Planejamento/Histograma.jsx`**

  Substituir:
  ```jsx
  import HistogramaEquipamentos from "@/components/histograma/HistogramaEquipamentos";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import { useProject } from "@/lib/ProjectContext";
  import { BarChart3 } from "lucide-react";

  export default function Histograma() {
    const { selectedProjectId } = useProject();

    if (!selectedProjectId) {
      return <PageEmptyState icon={BarChart3} description="Selecione um projeto na barra lateral para ver o histograma de equipamentos." />;
    }

    return (
      <div className="p-6">
        <HistogramaEquipamentos />
      </div>
    );
  }
  ```

  Por:
  ```jsx
  import HistogramaEquipamentos from "@/components/histograma/HistogramaEquipamentos";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import PageHeader from "@/components/ui/PageHeader";
  import { useProject } from "@/lib/ProjectContext";
  import { BarChart3 } from "lucide-react";

  export default function Histograma() {
    const { selectedProjectId } = useProject();

    if (!selectedProjectId) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader />
          <div className="flex-1"><PageEmptyState icon={BarChart3} description="Selecione um projeto na barra lateral para ver o histograma de equipamentos." /></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-auto p-6">
          <HistogramaEquipamentos />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Atualizar `src/pages/Planejamento/TakeOff.jsx`**

  Substituir:
  ```jsx
  import { Ruler } from "lucide-react";
  import TakeOffCommodities from "@/components/planejamento/TakeOffCommodities";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import { useProject } from "@/lib/ProjectContext";

  export default function TakeOff() {
    const { selectedProjectId } = useProject();

    if (!selectedProjectId) {
      return <PageEmptyState icon={Ruler} description="Selecione um projeto no menu lateral para acessar o Take-Off." />;
    }

    return (
      <div className="p-6">
        <TakeOffCommodities />
      </div>
    );
  }
  ```

  Por:
  ```jsx
  import { Ruler } from "lucide-react";
  import TakeOffCommodities from "@/components/planejamento/TakeOffCommodities";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import PageHeader from "@/components/ui/PageHeader";
  import { useProject } from "@/lib/ProjectContext";

  export default function TakeOff() {
    const { selectedProjectId } = useProject();

    if (!selectedProjectId) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader />
          <div className="flex-1"><PageEmptyState icon={Ruler} description="Selecione um projeto no menu lateral para acessar o Take-Off." /></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-auto p-6">
          <TakeOffCommodities />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Atualizar `src/pages/AdminContratual/RDOs.jsx`**

  Substituir:
  ```jsx
  import { FileText } from "lucide-react";
  import RDOModule from "@/components/rdo/RDOModule";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import { useProject } from "@/lib/ProjectContext";

  export default function RDOs() {
    const { selectedProjectId } = useProject();

    if (!selectedProjectId) {
      return <PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para acessar os RDOs." />;
    }

    return (
      <div className="p-6 md:p-8">
        <RDOModule selectedProjectId={selectedProjectId} />
      </div>
    );
  }
  ```

  Por:
  ```jsx
  import { FileText } from "lucide-react";
  import RDOModule from "@/components/rdo/RDOModule";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import PageHeader from "@/components/ui/PageHeader";
  import { useProject } from "@/lib/ProjectContext";

  export default function RDOs() {
    const { selectedProjectId } = useProject();

    if (!selectedProjectId) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader />
          <div className="flex-1"><PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para acessar os RDOs." /></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <RDOModule selectedProjectId={selectedProjectId} />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 4: Atualizar `src/pages/AdminContratual/MapaImpacto.jsx`**

  Substituir:
  ```jsx
  import { entities } from "@/api/supabaseEntities";
  import { useQuery } from "@tanstack/react-query";
  import { MapPin } from "lucide-react";
  import MapaRegistroImpacto from "@/components/pleitos/MapaRegistroImpacto";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import { useProject } from "@/lib/ProjectContext";

  export default function MapaImpacto() {
    const { selectedProjectId } = useProject();

    const { data: incidentes = [] } = useQuery({
      queryKey: ["registros", selectedProjectId],
      queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
      enabled: !!selectedProjectId,
    });

    if (!selectedProjectId) {
      return <PageEmptyState icon={MapPin} description="Selecione um projeto na barra lateral para ver o mapa de impacto." />;
    }

    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <MapaRegistroImpacto incidentes={incidentes} />
        </div>
      </div>
    );
  }
  ```

  Por:
  ```jsx
  import { entities } from "@/api/supabaseEntities";
  import { useQuery } from "@tanstack/react-query";
  import { MapPin } from "lucide-react";
  import MapaRegistroImpacto from "@/components/pleitos/MapaRegistroImpacto";
  import PageEmptyState from "@/components/ui/PageEmptyState";
  import PageHeader from "@/components/ui/PageHeader";
  import { useProject } from "@/lib/ProjectContext";

  export default function MapaImpacto() {
    const { selectedProjectId } = useProject();

    const { data: incidentes = [] } = useQuery({
      queryKey: ["registros", selectedProjectId],
      queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
      enabled: !!selectedProjectId,
    });

    if (!selectedProjectId) {
      return (
        <div className="flex flex-col h-full">
          <PageHeader />
          <div className="flex-1"><PageEmptyState icon={MapPin} description="Selecione um projeto na barra lateral para ver o mapa de impacto." /></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <MapaRegistroImpacto incidentes={incidentes} />
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add \
    src/pages/Planejamento/Histograma.jsx \
    src/pages/Planejamento/TakeOff.jsx \
    src/pages/AdminContratual/RDOs.jsx \
    src/pages/AdminContratual/MapaImpacto.jsx
  git commit -m "refactor: aplicar PageHeader em Histograma, TakeOff, RDOs e MapaImpacto"
  ```

---

## Task 7: AdminContratual — Medicoes, Pleitos, Registros

**Files:**
- Modify: `src/pages/AdminContratual/Medicoes.jsx`
- Modify: `src/pages/AdminContratual/Pleitos.jsx`
- Modify: `src/pages/AdminContratual/Registros.jsx`

- [ ] **Step 1: Atualizar `src/pages/AdminContratual/Medicoes.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o early return `!selectedProjectId`:
  ```jsx
  // de:
  if (!selectedProjectId) {
    return <PageEmptyState icon={ClipboardList} description="Selecione um projeto no menu lateral para acessar as medições." />;
  }

  // para:
  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1"><PageEmptyState icon={ClipboardList} description="Selecione um projeto no menu lateral para acessar as medições." /></div>
      </div>
    );
  }
  ```

  Substituir o return principal:
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Medições</h2>
        <Button onClick={() => { setEditMedicao(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Medição
        </Button>
      </div>

      <FilterBar

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditMedicao(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Medição
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <FilterBar
  ```

  E fechar corretamente — adicionar `</div>` antes do `);` final do return.

- [ ] **Step 2: Atualizar `src/pages/AdminContratual/Pleitos.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o branch `if (selectedPleito)`:
  ```jsx
  // de:
  if (selectedPleito) {
    return (
      <PleitoDetalhes
        pleito={selectedPleito}
        onBack={() => setSelectedPleito(null)}
        onEdit={(pleito) => { setEditingPleito(pleito); setShowForm(true); setSelectedPleito(null); }}
      />
    );
  }

  // para:
  if (selectedPleito) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-auto">
          <PleitoDetalhes
            pleito={selectedPleito}
            onBack={() => setSelectedPleito(null)}
            onEdit={(pleito) => { setEditingPleito(pleito); setShowForm(true); setSelectedPleito(null); }}
          />
        </div>
      </div>
    );
  }
  ```

  Substituir o return principal:
  ```jsx
  // de:
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pleitos</h2>
          <Button onClick={() => { setEditingPleito(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pleito
          </Button>
        </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditingPleito(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pleito
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4">
  ```

  Fechar o novo wrapper `</div>` antes do `);` final.

- [ ] **Step 3: Atualizar `src/pages/AdminContratual/Registros.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o early return `!selectedProjectId`:
  ```jsx
  // de:
  if (!selectedProjectId) {
    return (
      <PageEmptyState
        icon={AlertTriangle}
        description="Selecione um projeto na barra lateral para ver os registros."
      />
    );
  }

  // para:
  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={AlertTriangle}
            description="Selecione um projeto na barra lateral para ver os registros."
          />
        </div>
      </div>
    );
  }
  ```

  Substituir o return principal:
  ```jsx
  // de:
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Registros</h2>
          <Button
            onClick={() => { setEditingRegistro(null); setShowForm(true); }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Registro
          </Button>
        </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditingRegistro(null); setShowForm(true); }}>
            <Plus className="w-5 h-5 mr-2" />
            Novo Registro
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
  ```

  Fechar o novo wrapper antes do `);` final.

- [ ] **Step 4: Commit**

  ```bash
  git add \
    src/pages/AdminContratual/Medicoes.jsx \
    src/pages/AdminContratual/Pleitos.jsx \
    src/pages/AdminContratual/Registros.jsx
  git commit -m "refactor(AdminContratual): aplicar PageHeader em Medicoes, Pleitos e Registros"
  ```

---

## Task 8: Planejamento — Avancos e SixWLA

**Files:**
- Modify: `src/pages/Planejamento/Avancos.jsx`
- Modify: `src/pages/Planejamento/SixWLA.jsx`

- [ ] **Step 1: Atualizar `src/pages/Planejamento/Avancos.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o return principal (a `div` raiz e o bloco `{/* Cabeçalho */}`):
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avanço Físico</h1>
          <p className="text-sm text-muted-foreground">Curva S — previsto vs. realizado acumulado</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
          <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Registro
          </Button>
        </div>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportExport(true)}>
              <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
            </Button>
            <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Registro
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return (fechando o `flex-1 overflow-auto`).

- [ ] **Step 2: Atualizar `src/pages/Planejamento/SixWLA.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o return principal (a `div` raiz e o bloco `{/* Controles de topo */}`):
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      {/* Controles de topo */}
      <div className="flex items-center justify-end">
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Atividade
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={handleOpenNew}>
            <Plus className="w-4 h-4 mr-2" /> Nova Atividade
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return.

- [ ] **Step 3: Commit**

  ```bash
  git add \
    src/pages/Planejamento/Avancos.jsx \
    src/pages/Planejamento/SixWLA.jsx
  git commit -m "refactor(Planejamento): aplicar PageHeader em Avancos e SixWLA"
  ```

---

## Task 9: RiscosMudancas — GestaoMudancas e GestaoRiscos

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx`
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

- [ ] **Step 1: Atualizar `src/pages/RiscosMudancas/GestaoMudancas.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o return principal (a `div` raiz e o bloco `{/* Cabeçalho */}`):
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Mudanças</h1>
          <p className="text-sm text-muted-foreground">Controle de mudanças contratuais e seus impactos</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Mudança
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Mudança
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return.

- [ ] **Step 2: Atualizar `src/pages/RiscosMudancas/GestaoRiscos.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o return principal (a `div` raiz e o bloco `{/* Cabeçalho */}`):
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Riscos</h1>
          <p className="text-sm text-muted-foreground">Identificação, avaliação e monitoramento de riscos</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Risco
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Risco
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return.

- [ ] **Step 3: Commit**

  ```bash
  git add \
    src/pages/RiscosMudancas/GestaoMudancas.jsx \
    src/pages/RiscosMudancas/GestaoRiscos.jsx
  git commit -m "refactor(RiscosMudancas): aplicar PageHeader em GestaoMudancas e GestaoRiscos"
  ```

---

## Task 10: Configuracoes — AgenteConfig, GerenciarProjeto, Usuarios

**Files:**
- Modify: `src/pages/Configuracoes/AgenteConfig.jsx`
- Modify: `src/pages/Configuracoes/GerenciarProjeto.jsx`
- Modify: `src/pages/Configuracoes/Usuarios.jsx`

- [ ] **Step 1: Atualizar `src/pages/Configuracoes/AgenteConfig.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o return principal (a `div` raiz e o bloco `flex justify-between`):
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuração dos Agentes</h1>
          <p className="text-sm text-muted-foreground">Status e informações dos agentes de IA (Mastra Framework)</p>
        </div>
        <Button variant="outline" onClick={checkMastra} disabled={checking}>
          <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
          Verificar Conectividade
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button variant="outline" onClick={checkMastra} disabled={checking}>
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Verificar Conectividade
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return.

- [ ] **Step 2: Atualizar `src/pages/Configuracoes/GerenciarProjeto.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o return principal:
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Projetos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e gestão de projetos do sistema</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Projeto
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Projeto
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return.

- [ ] **Step 3: Atualizar `src/pages/Configuracoes/Usuarios.jsx`**

  Adicionar import do PageHeader após os imports existentes:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

  Substituir o return principal:
  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">Cadastro e gestão de usuários do sistema</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return.

- [ ] **Step 4: Commit**

  ```bash
  git add \
    src/pages/Configuracoes/AgenteConfig.jsx \
    src/pages/Configuracoes/GerenciarProjeto.jsx \
    src/pages/Configuracoes/Usuarios.jsx
  git commit -m "refactor(Configuracoes): aplicar PageHeader em AgenteConfig, GerenciarProjeto e Usuarios"
  ```

---

## Task 11: Contratos

**Files:**
- Modify: `src/pages/Contratos.jsx`

A página `Contratos.jsx` não tem `<h1>` mas mistura KPIs e botão "Novo Contrato" no mesmo bloco `flex justify-between`. O botão vai para `actions`; os KPIs descem para o conteúdo.

- [ ] **Step 1: Adicionar import do PageHeader**

  Nos imports do arquivo `src/pages/Contratos.jsx`, adicionar:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

- [ ] **Step 2: Substituir o return principal**

  ```jsx
  // de:
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Contratado", value: fmt(totalContratado), icon: DollarSign, color: "#26405d" },
            { label: "Contratos Ativos", value: contratosAtivos, icon: FileText, color: "#c35e1e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button onClick={() => { setEditContrato(null); setShowContratoForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditContrato(null); setShowContratoForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Contratado", value: fmt(totalContratado), icon: DollarSign, color: "#26405d" },
            { label: "Contratos Ativos", value: contratosAtivos, icon: FileText, color: "#c35e1e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
  ```

  Adicionar `</div>` de fechamento antes do `);` final do return (fechando o `flex-1 overflow-auto`).

- [ ] **Step 3: Commit**

  ```bash
  git add src/pages/Contratos.jsx
  git commit -m "refactor(Contratos): aplicar PageHeader e mover KPIs para conteúdo"
  ```

---

## Task 12: Agentes — AgenteChat (h-full) + 3 páginas

**Files:**
- Modify: `src/components/agentes/AgenteChat.jsx`
- Modify: `src/pages/Agentes/AnalistaContratual.jsx`
- Modify: `src/pages/Agentes/AnalistaNegocio.jsx`
- Modify: `src/pages/Agentes/ExecutorDados.jsx`

`AgenteChat` usa `h-[calc(100vh-64px)]` calibrado para o header global que foi removido. Como o componente agora vive dentro de `flex-1 overflow-hidden`, trocar para `h-full`.

- [ ] **Step 1: Atualizar `src/components/agentes/AgenteChat.jsx`**

  Localizar a linha (aprox. 135):
  ```jsx
  <div className="flex flex-col h-[calc(100vh-64px)]">
  ```

  Substituir por:
  ```jsx
  <div className="flex flex-col h-full">
  ```

- [ ] **Step 2: Atualizar `src/pages/Agentes/AnalistaContratual.jsx`**

  Substituir o arquivo inteiro:
  ```jsx
  import { Scale } from "lucide-react";
  import AgenteChat from "@/components/agentes/AgenteChat";
  import PageHeader from "@/components/ui/PageHeader";

  const AGENT = {
    id: "contractual-analyst-agent",
    name: "Analista Contratual",
    icon: Scale,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    description: "Elabora respostas formais a cartas de notificação, emails e atas de reunião com base nos registros de pleitos do projeto.",
    color: "bg-emerald-600",
    ring: "focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
    suggestions: [
      "Quero elaborar uma resposta a uma carta de notificação sobre atraso.",
      "Preciso redigir um email formal sobre o pleito de variação de quantitativos.",
      "Me ajude a responder a ata de reunião mais recente.",
      "Liste os pleitos abertos para eu escolher qual responder.",
    ],
  };

  export default function AnalistaContratual() {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-hidden">
          <AgenteChat agent={AGENT} />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Atualizar `src/pages/Agentes/AnalistaNegocio.jsx`**

  Substituir o arquivo inteiro:
  ```jsx
  import { BrainCircuit } from "lucide-react";
  import AgenteChat from "@/components/agentes/AgenteChat";
  import PageHeader from "@/components/ui/PageHeader";

  const AGENT = {
    id: "business-analyst-agent",
    name: "Analista de Negócio",
    icon: BrainCircuit,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    description: "Análises comparativas e históricas. Refina os parâmetros da solicitação antes de executar para entregar análises direcionadas e objetivas.",
    color: "bg-indigo-600",
    ring: "focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400",
    btnColor: "bg-indigo-600 hover:bg-indigo-700",
    suggestions: [
      "Como está o desempenho do histograma de mão de obra no último mês?",
      "Quais contratos estão com prazo vencido ou próximo do vencimento?",
      "Compare o avanço físico planejado vs realizado nas últimas 4 semanas.",
      "Quais são os riscos críticos abertos há mais tempo?",
    ],
  };

  export default function AnalistaNegocio() {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-hidden">
          <AgenteChat agent={AGENT} />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 4: Atualizar `src/pages/Agentes/ExecutorDados.jsx`**

  Substituir o arquivo inteiro:
  ```jsx
  import { Bot } from "lucide-react";
  import AgenteChat from "@/components/agentes/AgenteChat";
  import PageHeader from "@/components/ui/PageHeader";

  const AGENT = {
    id: "supabase-analyst-agent",
    name: "Executor de Dados",
    icon: Bot,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    description: "Consultas diretas à base de dados. Busca e retorna informações específicas do projeto.",
    color: "bg-blue-600",
    ring: "focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500",
    btnColor: "bg-blue-600 hover:bg-blue-700",
    suggestions: [
      "Quantos projetos existem no sistema?",
      "Liste os contratos ativos com seus valores.",
      "Qual é o histórico de mão de obra do mês passado?",
      "Quais são os riscos mais críticos cadastrados?",
    ],
  };

  export default function ExecutorDados() {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 overflow-hidden">
          <AgenteChat agent={AGENT} />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add \
    src/components/agentes/AgenteChat.jsx \
    src/pages/Agentes/AnalistaContratual.jsx \
    src/pages/Agentes/AnalistaNegocio.jsx \
    src/pages/Agentes/ExecutorDados.jsx
  git commit -m "refactor(Agentes): aplicar PageHeader e corrigir altura do AgenteChat (h-full)"
  ```

---

## Task 13: Planejamento/Cronograma — altura especial

**Files:**
- Modify: `src/pages/Planejamento/Cronograma.jsx`

O Cronograma usa `h-[calc(100vh-64px)]` para o Gantt de tela cheia. Com o PageHeader dentro da página, o wrapper muda para `flex flex-col h-full` e o conteúdo usa `flex-1 overflow-hidden`.

- [ ] **Step 1: Adicionar import do PageHeader**

  Nos imports do arquivo `src/pages/Planejamento/Cronograma.jsx`, adicionar:
  ```jsx
  import PageHeader from "@/components/ui/PageHeader";
  ```

- [ ] **Step 2: Substituir o return principal**

  ```jsx
  // de:
  return (
    <div className="p-6 flex flex-col gap-4 h-[calc(100vh-64px)]">
      {/* Controles de topo */}
      <div className="flex items-center justify-end shrink-0">
        <Button variant="outline" onClick={() => setShowImportExport(true)}>
          <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
        </Button>
      </div>

  // para:
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
        }
      />
      <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
  ```

  O restante do conteúdo (KPIs, filtros, controles de zoom, `<div className="flex-1 min-h-0">` com GanttChart, modals) permanece intacto dentro do novo wrapper. Adicionar `</div>` de fechamento antes do `);` final do return.

- [ ] **Step 3: Verificar o Gantt visualmente**

  Com o dev server rodando, navegar para Planejamento > Cronograma.

  Verificar:
  - Gantt ocupa o espaço restante abaixo dos filtros/controles sem barra de scroll desnecessária
  - Header mostra "Planejamento › Cronograma" + botão "Importar / Exportar"

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/Planejamento/Cronograma.jsx
  git commit -m "refactor(Cronograma): aplicar PageHeader e corrigir altura do Gantt (h-full)"
  ```

---

## Verificação final

- [ ] Rodar o dev server (`npm run dev`) e percorrer todas as páginas
- [ ] Confirmar que **nenhuma página** ainda usa `h-[calc(100vh-64px)]`: `grep -r "calc(100vh-64px)" src/ --include="*.jsx"`
- [ ] Confirmar que **nenhuma página** ainda tem `<h1>` ou `<h2>` de cabeçalho local: `grep -rn "flex.*justify-between" src/pages --include="*.jsx"` — revisar resultados para garantir que são apenas cabeçalhos internos de cards/listas
- [ ] Confirmar que o toggle de tema no popover funciona em ambos os modos (claro → escuro → claro)
- [ ] Confirmar que o botão Sair redireciona para `/login`
- [ ] Confirmar que a sidebar colapsada mostra o avatar e o popover abre corretamente
