# Sidebar Collapsed Flyout — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao clicar em um ícone de módulo na sidebar recolhida, abrir um painel flyout fixo à direita da sidebar com os sub-itens daquele módulo.

**Architecture:** Toda a mudança fica em `src/Layout.jsx`. Dois novos estados (`flyoutGroup`, `flyoutY`) controlam qual flyout está aberto e sua posição vertical. A posição é calculada via `getBoundingClientRect()` no clique. Um overlay transparente em `z-40` fecha o painel ao clicar fora; o painel fica em `z-50`.

**Tech Stack:** React 18, React Router DOM 7, Tailwind CSS 3, Lucide React.

---

## Mapa de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/Layout.jsx` | Modificar — único arquivo alterado |

---

### Task 1: Adicionar estados e handler `openFlyout`

**Files:**
- Modify: `src/Layout.jsx:27-29` (após os estados existentes)
- Modify: `src/Layout.jsx:63-66` (após `handleSelectAll`, antes de `sidebarW`)

- [ ] **Step 1: Adicionar os dois novos estados logo após `openModule`**

Localizar o bloco (linhas 27–29):
```js
const [collapsed, setCollapsed] = useState(false);
const [dialogOpen, setDialogOpen] = useState(false);
const [openModule, setOpenModule] = useState(null);
```

Substituir por:
```js
const [collapsed, setCollapsed] = useState(false);
const [dialogOpen, setDialogOpen] = useState(false);
const [openModule, setOpenModule] = useState(null);
const [flyoutGroup, setFlyoutGroup] = useState(null);
const [flyoutY, setFlyoutY] = useState(0);
```

- [ ] **Step 2: Adicionar a função `openFlyout` antes de `sidebarW`**

Localizar (linha 68):
```js
const sidebarW = collapsed ? "w-16" : "w-60";
```

Inserir antes dela:
```js
function openFlyout(e, group) {
  const rect = e.currentTarget.getBoundingClientRect();
  const PANEL_ESTIMATED_HEIGHT = group.children.length * 36 + 40;
  const maxTop = window.innerHeight - PANEL_ESTIMATED_HEIGHT - 8;
  setFlyoutY(Math.min(rect.top, maxTop));
  setFlyoutGroup(flyoutGroup?.title === group.title ? null : group);
}

const sidebarW = collapsed ? "w-16" : "w-60";
```

- [ ] **Step 3: Salvar o arquivo e verificar que não há erros de sintaxe**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada
npm run build 2>&1 | tail -20
```

Esperado: sem erros de build (warnings de lint são aceitáveis).

---

### Task 2: Atualizar `useEffect` de navegação para fechar o flyout

**Files:**
- Modify: `src/Layout.jsx:54-59`

- [ ] **Step 1: Localizar o `useEffect` que rastreia `location.pathname`**

Linhas 54–59 atuais:
```js
useEffect(() => {
  const activeGroup = navigationGroups.find(
    (g) => g.children?.some((c) => c.path === location.pathname)
  );
  if (activeGroup) setOpenModule(activeGroup.title);
}, [location.pathname]);
```

- [ ] **Step 2: Adicionar `setFlyoutGroup(null)` no início do effect**

```js
useEffect(() => {
  setFlyoutGroup(null);
  const activeGroup = navigationGroups.find(
    (g) => g.children?.some((c) => c.path === location.pathname)
  );
  if (activeGroup) setOpenModule(activeGroup.title);
}, [location.pathname]);
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

---

### Task 3: Atualizar o botão dos módulos no estado recolhido

**Files:**
- Modify: `src/Layout.jsx:170-191` (o `<button>` dentro do map de grupos com children)

- [ ] **Step 1: Localizar o botão de módulo**

Trecho atual (dentro do `return` do map, ao redor da linha 170):
```jsx
<button
  onClick={() => {
    if (!collapsed) setOpenModule(isOpen ? null : group.title);
  }}
  title={collapsed ? group.title : undefined}
  className={`w-full flex items-center rounded-lg transition-all duration-200 ${
    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-2.5 py-2"
  } ${isParentActive
    ? "bg-sidebar-accent/30 text-sidebar-foreground"
    : "text-sidebar-foreground hover:bg-sidebar-accent"
  }`}
>
```

- [ ] **Step 2: Substituir pelo botão atualizado**

```jsx
<button
  onClick={(e) => {
    if (collapsed) {
      openFlyout(e, group);
    } else {
      setOpenModule(isOpen ? null : group.title);
    }
  }}
  title={collapsed ? group.title : undefined}
  className={`w-full flex items-center rounded-lg transition-all duration-200 ${
    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-2.5 py-2"
  } ${isParentActive
    ? collapsed
      ? "bg-sidebar-accent/30 text-sidebar-primary"
      : "bg-sidebar-accent/30 text-sidebar-foreground"
    : "text-sidebar-foreground hover:bg-sidebar-accent"
  }`}
>
```

Diferenças:
- `onClick` agora chama `openFlyout(e, group)` quando `collapsed`
- `isParentActive` no modo recolhido usa `text-sidebar-primary` para destacar o ícone ativo

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

---

### Task 4: Adicionar overlay e painel flyout no JSX

**Files:**
- Modify: `src/Layout.jsx` — dentro do `return`, antes do último `</>`

- [ ] **Step 1: Localizar o fechamento do `return` do componente**

No final do JSX, após o `</Dialog>` (ao redor da linha 281) e antes do `</div>` e `</>` finais:

```jsx
        </Dialog>
      </div>
    </>
```

- [ ] **Step 2: Inserir overlay + painel flyout entre `</Dialog>` e `</div>`**

```jsx
        </Dialog>

        {/* Flyout navegação (sidebar recolhida) */}
        {flyoutGroup && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setFlyoutGroup(null)}
            />
            <div
              className="fixed z-50 bg-sidebar border border-sidebar-border rounded-lg shadow-xl min-w-[180px] py-1"
              style={{ left: 64, top: flyoutY }}
            >
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 border-b border-sidebar-border">
                {flyoutGroup.title}
              </p>
              {flyoutGroup.children.map((child) => {
                const isActive = location.pathname === child.path;
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    onClick={() => setFlyoutGroup(null)}
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md mx-1 my-0.5 transition-all duration-200 ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                    style={isActive ? { boxShadow: "0 0 8px rgba(38,255,255,0.3)" } : undefined}
                  >
                    {child.title}
                  </Link>
                );
              })}
            </div>
          </>
        )}

      </div>
    </>
```

- [ ] **Step 3: Verificar build final**

```bash
npm run build 2>&1 | tail -15
```

Esperado: `✓ built in Xs` — sem erros.

---

### Task 5: Verificação manual e commit

- [ ] **Step 1: Iniciar o servidor de dev**

```bash
npm run dev
```

Abrir `http://localhost:5173` no navegador.

- [ ] **Step 2: Verificar comportamento do flyout**

Checklist manual:
1. Recolher a sidebar (clicar no botão `<` no topo)
2. Clicar no ícone de **Planejamento** → flyout deve aparecer à direita com título "PLANEJAMENTO" e os sub-itens (Cronograma, 6WLA, Take-Off, Histogramas, Avanços)
3. Clicar no ícone de **Planejamento** novamente → flyout deve fechar (toggle)
4. Abrir flyout de **Adm. Contratual** → deve mostrar Contratos, Medições, RDOs, Registros, Pleitos, Mapa de Impacto
5. Clicar em um sub-item → flyout fecha e navega para a página correta
6. Abrir um flyout e clicar fora dele → deve fechar
7. O ícone do módulo onde você está navegando deve ter destaque (cor primária) quando a sidebar está recolhida
8. Expandir a sidebar → accordion funciona normalmente como antes
9. Clicar em **Dashboard** (sem children) → navega direto, sem flyout

- [ ] **Step 3: Commit**

```bash
git add src/Layout.jsx
git commit -m "feat(sidebar): flyout de navegação ao clicar em ícone no estado recolhido

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review do Plano

**Spec coverage:**
- ✅ Clicar abre flyout → Task 3 (openFlyout no onClick)
- ✅ Toggle (clicar no mesmo fecha) → Task 1 (lógica `flyoutGroup?.title === group.title ? null : group`)
- ✅ Clicar em sub-item fecha e navega → Task 4 (onClick no Link)
- ✅ Clicar fora fecha → Task 4 (overlay)
- ✅ Navegar fecha → Task 2 (useEffect)
- ✅ Dashboard sem flyout → Task 3 não afeta o branch `!group.children` (Dashboard)
- ✅ Ícone ativo com destaque no collapsed → Task 3 (text-sidebar-primary quando isParentActive && collapsed)
- ✅ Sidebar expandida preservada → Task 3 (else branch preserva accordion)

**Placeholder scan:** Nenhum TBD, TODO ou passo vago encontrado.

**Type consistency:** `flyoutGroup` é `{ title, children }` em todos os usos — Task 1 (definição), Task 3 (passagem para `openFlyout`), Task 4 (acesso a `.title` e `.children`). Consistente.
