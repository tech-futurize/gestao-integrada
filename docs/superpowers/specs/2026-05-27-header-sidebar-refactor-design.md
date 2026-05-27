# Spec: Refatoração Header + Sidebar — User Menu e Filtros

**Data:** 2026-05-27
**Status:** Aprovado pelo PO
**Milestone:** Backlog 2026-Q2

---

## Contexto

O `PageHeader` acumula responsabilidades que não são suas: exibe filtros de cada seção, o botão de tema e o logo. A sidebar não tem área de usuário. O objetivo é simplificar o header (breadcrumb + ações), mover filtros para dentro de cada seção e centralizar tema/perfil no rodapé da sidebar.

---

## Decisões de Design

| Questão | Decisão |
|---------|---------|
| Filtros no header | Removidos do `PageHeader`; cada página gerencia seus próprios filtros dentro do conteúdo |
| Logo no header | Removido do `PageHeader`; o logo já existe no topo da sidebar — não duplicar |
| Theme toggle | Sai do `PageHeader` e entra no popover do menu de usuário na sidebar |
| Componente do menu de usuário | `Popover` do Radix/shadcn (`side="right"`) — já instalado, sem dependência nova |
| Sidebar colapsada | Avatar visível no rodapé; clique abre popover para a direita |
| Avatar | Iniciais do nome (ou email) — sem foto de perfil por enquanto |

---

## 1. `PageHeader.jsx` — simplificado

**Localização:** `src/components/ui/PageHeader.jsx`

Remove:
- Prop `filters` e toda a lógica de expansão mobile (`filtersOpen`, botão "Filtros ▾", segunda linha)
- `AnimatedThemeToggler`
- Imagem do logo (`LOGO_URL`, `<img>`)
- Import de `useState` (não há mais estado local)

Mantém:
- Breadcrumb automático via `useLocation()` + `navigationConfig.js`
- Prop `actions` (opcional)

**API resultante:**
```jsx
<PageHeader
  actions={<JSX />}   // opcional — botões de ação (Novo, Importar…)
/>
```

**Renderização:**
```
┌───────────────────────────────────────────┐
│ bg-sidebar border-b border-sidebar-border │
│ [Módulo › Submódulo]           [+ Ação]   │
└───────────────────────────────────────────┘
```

Altura: `px-4 py-2` — igual ao atual.

---

## 2. Filtros → dentro de cada seção

A prop `filters` é **removida do componente**. Cada página é responsável por renderizar seus filtros no início da área de conteúdo, acima do conteúdo principal.

### Páginas afetadas

Hoje apenas **`src/pages/Engenharia/Documentos.jsx`** passa `filters=` ao `PageHeader`. Ela precisa de migração:

**Antes:**
```jsx
<PageHeader actions={...} filters={<FilterBar ... />} />
<div className="flex-1 overflow-auto p-6">
  {/* conteúdo */}
</div>
```

**Depois:**
```jsx
<PageHeader actions={...} />
<div className="flex-1 overflow-auto p-6">
  <div className="mb-4">
    <FilterBar ... />
  </div>
  {/* conteúdo */}
</div>
```

As demais páginas (`Dashboard.jsx`, `Suprimentos/MapaSuprimentos.jsx`) não passam `filters=` — nenhuma alteração necessária além de remover a prop do componente.

---

## 3. `SidebarUserMenu` — novo componente

**Localização:** `src/components/ui/SidebarUserMenu.jsx`

Bloco fixo no rodapé da sidebar, separado por `border-t border-sidebar-border`.

### Comportamento

**Sidebar expandida (> 16px / `w-60`):**
```
┌────────────────────────────────────┐
│ [VG]  Vinicius Groth           [›] │
│       vinicius@futurizenow.com.br  │
└────────────────────────────────────┘
```
- Avatar: círculo 32px com iniciais, `bg-sidebar-primary text-sidebar-primary-foreground`
- Nome: `user.user_metadata?.full_name` ou parte antes do `@` do email como fallback
- Email: truncado com `truncate`
- Seta `ChevronRight` indica que é clicável

**Sidebar colapsada (`w-16`):**
```
┌──────┐
│ [VG] │
└──────┘
```
- Apenas o avatar, centralizado

**Popover (`side="right"`, `align="end"`):**
```
┌──────────────────────────────────┐
│ Vinicius Groth                   │
│ vinicius@futurizenow.com.br      │
│ ──────────────────────────────── │
│ ◐  Tema          [toggle claro]  │
│ ──────────────────────────────── │
│ 🚪 Sair                          │
└──────────────────────────────────┘
```

### Props

```jsx
<SidebarUserMenu collapsed={boolean} />
```

### Dados

- `user` via `useAuth()` — já disponível no `AuthContext`
- `logout` via `useAuth()`
- Theme toggle: reutiliza `AnimatedThemeToggler` existente em `src/components/ui/AnimatedThemeToggler.jsx`

### Geração das iniciais

```js
function getInitials(user) {
  const name = user?.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts[parts.length - 1][0] ?? "")).toUpperCase();
  }
  return (user?.email?.[0] ?? "?").toUpperCase();
}
```

---

## 4. `Layout.jsx` — ajustes

1. Adicionar `SidebarUserMenu` no rodapé da `<aside>`, após o `<nav>`:
```jsx
<aside className="...">
  {/* Logo */}
  {/* Projeto Ativo */}
  {/* nav flex-1 overflow-y-auto */}
  <SidebarUserMenu collapsed={collapsed} />
</aside>
```

2. Nenhuma outra mudança no Layout — o `<main>` já não tem header próprio desde o milestone anterior.

---

## 5. `docs/design/DESIGN.md` — atualizar seção 9

Atualizar a seção "Layout de Página (PageHeader)" para refletir:
- `filters` removido da API
- Logo e `AnimatedThemeToggler` não fazem mais parte do `PageHeader`
- Novo bloco "Sidebar — Menu de Usuário" documentando o `SidebarUserMenu`

---

## Escopo completo de arquivos

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/components/ui/PageHeader.jsx` | Simplificar — remover `filters`, toggler, logo |
| `src/components/ui/SidebarUserMenu.jsx` | **Criar** |
| `src/Layout.jsx` | Importar e renderizar `SidebarUserMenu` no rodapé |
| `src/pages/Engenharia/Documentos.jsx` | Mover filtros para dentro do conteúdo |
| `docs/design/DESIGN.md` | Atualizar seção 9 |

---

## Fora do escopo

- Foto de perfil / upload de avatar
- Edição de dados do usuário (nome, senha)
- Notificações no menu de usuário
- Trocar de conta / multi-tenant
