# Design Spec — Flyout de Navegação na Sidebar Recolhida

**Data:** 2026-06-02
**Autor:** Agent_Designer
**Arquivo afetado:** `src/Layout.jsx`

---

## Problema

Quando a sidebar está no estado recolhido (`collapsed = true`), clicar nos ícones de módulos com sub-itens não faz nada. O guard `if (!collapsed) setOpenModule(...)` suprime qualquer ação, deixando o usuário sem acesso à navegação secundária.

---

## Solução

Ao clicar em um ícone de módulo com sub-itens no modo recolhido, abrir um painel flyout posicionado com `position: fixed` à direita da sidebar, alinhado verticalmente ao ícone clicado, exibindo o título do módulo e todos os seus sub-itens.

---

## Comportamento

| Ação | Resultado |
|------|-----------|
| Clicar no ícone do módulo (collapsed) | Abre o flyout daquele módulo |
| Clicar no mesmo ícone novamente | Fecha o flyout (toggle) |
| Clicar em um sub-item | Navega e fecha o flyout imediatamente |
| Clicar fora do flyout (overlay) | Fecha o flyout |
| Navegar via outro mecanismo | `useEffect` em `location.pathname` fecha o flyout |
| Dashboard (sem children) | Navega diretamente, sem flyout |
| Sidebar expandida | Comportamento atual preservado (accordion) |

---

## Estado

Dois novos estados adicionados ao componente `Layout`:

```js
const [flyoutGroup, setFlyoutGroup] = useState(null); // { title, children } | null
const [flyoutY, setFlyoutY]         = useState(0);    // posição top em px
```

---

## Posicionamento

```js
function openFlyout(e, group) {
  const rect = e.currentTarget.getBoundingClientRect();
  const PANEL_ESTIMATED_HEIGHT = group.children.length * 36 + 40;
  const maxTop = window.innerHeight - PANEL_ESTIMATED_HEIGHT - 8;
  setFlyoutY(Math.min(rect.top, maxTop));
  setFlyoutGroup(flyoutGroup?.title === group.title ? null : group);
}
```

- `left: 64px` — imediatamente à direita do aside recolhido (`w-16`)
- `top: flyoutY` — alinhado ao ícone clicado, com ajuste para não sair da viewport

---

## Estrutura do Painel

```
position: fixed
left: 64px
top: flyoutY
z-index: 50
min-width: 180px
```

**Header:** título do módulo em `text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50`, padding `px-3 py-2`, separado por `border-b border-sidebar-border`.

**Sub-itens:** `<Link>` com `px-3 py-1.5 text-sm rounded-md`. Estado ativo: `bg-sidebar-primary text-sidebar-primary-foreground font-bold` + `box-shadow: 0 0 8px rgba(38,255,255,0.3)`.

**Fundo/Borda:** `bg-sidebar border border-sidebar-border rounded-lg shadow-xl`.

---

## Overlay de Fechamento

Quando `flyoutGroup !== null`, renderizar antes do painel:

```jsx
<div
  className="fixed inset-0 z-40"
  onClick={() => setFlyoutGroup(null)}
/>
```

Overlay transparente (`z-40`), o painel fica em `z-50`.

---

## Ícone Ativo no Estado Recolhido

Quando `isParentActive && collapsed`, o botão do ícone recebe destaque:

```
bg-sidebar-accent/30 text-sidebar-primary
```

Hoje esse estado é suprimido pelo comportamento de accordion. Com o flyout, passa a ser exibido corretamente.

---

## Fechamento via Navegação

```js
useEffect(() => {
  setFlyoutGroup(null);
  const activeGroup = navigationGroups.find(
    (g) => g.children?.some((c) => c.path === location.pathname)
  );
  if (activeGroup) setOpenModule(activeGroup.title);
}, [location.pathname]);
```

---

## Escopo

- **Apenas `src/Layout.jsx`** — nenhum arquivo novo
- Nenhuma dependência nova
- Sidebar expandida: comportamento 100% preservado
- Dashboard: comportamento 100% preservado

---

## Fora de Escopo

- Hover trigger
- Animações com Framer Motion
- Sub-sub-menus aninhados
- Responsividade mobile (sidebar mobile é tratada separadamente)
