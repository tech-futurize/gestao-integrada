# M14 — Sistema de Permissões Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduzir controle de acesso granular por módulo/ação com tabela `permissoes_usuario`, hook `usePermissions`, enforcement em sidebar + rotas + botões-piloto (Engenharia e Suprimentos).

**Architecture:** Tabela `permissoes_usuario (usuario_id UUID FK → usuarios.id, modulo TEXT, acoes JSONB)` com UNIQUE (usuario_id, modulo). Hook `usePermissions` usa `useAuth()` para obter email do usuário logado, cruza com `usuarios` para obter o ID customizado, carrega permissões com staleTime: Infinity. Admin bypass dispensa consulta à tabela. ProtectedRoute e sidebar filtram baseados no mapa. Auto-seed de 8 rows na criação de usuário via `PERFIL_SEED`.

**Tech Stack:** React 18, Vite, Supabase JS SDK v2, TanStack React Query 5, Tailwind CSS, shadcn/ui, React Router DOM 7

---

## Contexto crítico (ler antes de qualquer task)

- **AuthContext:** Use `useAuth()` de `@/lib/AuthContext` — expõe `{ user, isAuthenticated, isLoadingAuth }`. `user.email` = email do usuário Supabase Auth.
- **ProtectedRoute:** Definido DENTRO de `src/App.jsx` (linha 69). Não é arquivo separado.
- **`wrap()`:** Helper em `App.jsx` que envolve `<ProtectedRoute><LayoutWrapper><Suspense>`. Atualizar para aceitar `modulo`.
- **`entities.create(data)`:** Retorna o objeto criado (`.select().single()`). Logo `newUser = await entities.Usuario.create(data)` → `newUser.id` existe.
- **TABLE_MAP em `supabaseEntities.js`:** Adicionar `PermissaoUsuario: 'permissoes_usuario'` no objeto existente.

---

## Mapa de Arquivos

| Op | Arquivo |
|---|---|
| CREATE | `docs/database/supabase-migration-m14-permissoes.sql` |
| CREATE | `src/lib/permissionsConfig.js` |
| CREATE | `src/hooks/usePermissions.js` |
| CREATE | `src/pages/SemPermissao.jsx` |
| MODIFY | `src/api/supabaseEntities.js` — adicionar `PermissaoUsuario` no TABLE_MAP |
| MODIFY | `src/App.jsx` — atualizar `ProtectedRoute`, `wrap()` e rotas; importar `SemPermissao` |
| MODIFY | `src/Layout.jsx` — filtrar sidebar com `usePermissionsMap` |
| MODIFY | `src/pages/Configuracoes/Usuarios.jsx` — PERFIL_OPTIONS, matriz UI, auto-seed |
| MODIFY | `src/pages/Engenharia/Documentos.jsx` — camada 3 piloto |
| MODIFY | `src/pages/Suprimentos/MapaSuprimentos.jsx` — camada 3 piloto |

---

## Task 1 — Migration SQL

**Files:**
- Create: `docs/database/supabase-migration-m14-permissoes.sql`

- [ ] **Step 1.1: Criar o arquivo de migration**

```sql
-- docs/database/supabase-migration-m14-permissoes.sql
-- M14 — Sistema de Permissões
-- Aplicar via Supabase Dashboard → SQL Editor (Task 10)

-- Tabela principal
CREATE TABLE IF NOT EXISTS permissoes_usuario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo      TEXT NOT NULL,
  acoes       JSONB NOT NULL DEFAULT '{"view":false,"create":false,"edit":false,"delete":false}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, modulo)
);

CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_id ON permissoes_usuario(usuario_id);

-- RLS
ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados têm acesso total" ON permissoes_usuario
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Seed: Admin → tudo
INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
SELECT u.id, m.modulo, '{"view":true,"create":true,"edit":true,"delete":true}'::jsonb
FROM usuarios u
CROSS JOIN (VALUES
  ('Dashboard'), ('Engenharia'), ('Suprimentos'), ('Planejamento'),
  ('Adm. Contratual'), ('Riscos e Mudanças'), ('Agentes de IA'), ('Configurações')
) AS m(modulo)
WHERE u.perfil = 'Admin'
ON CONFLICT (usuario_id, modulo) DO NOTHING;

-- Seed: Gestor → tudo, exceto Configurações (só view)
INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
SELECT u.id, m.modulo,
  CASE WHEN m.modulo = 'Configurações'
    THEN '{"view":true,"create":false,"edit":false,"delete":false}'::jsonb
    ELSE '{"view":true,"create":true,"edit":true,"delete":true}'::jsonb
  END
FROM usuarios u
CROSS JOIN (VALUES
  ('Dashboard'), ('Engenharia'), ('Suprimentos'), ('Planejamento'),
  ('Adm. Contratual'), ('Riscos e Mudanças'), ('Agentes de IA'), ('Configurações')
) AS m(modulo)
WHERE u.perfil = 'Gestor'
ON CONFLICT (usuario_id, modulo) DO NOTHING;

-- Seed: demais perfis → view em tudo, sem Configurações
INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
SELECT u.id, m.modulo,
  CASE WHEN m.modulo = 'Configurações'
    THEN '{"view":false,"create":false,"edit":false,"delete":false}'::jsonb
    ELSE '{"view":true,"create":false,"edit":false,"delete":false}'::jsonb
  END
FROM usuarios u
CROSS JOIN (VALUES
  ('Dashboard'), ('Engenharia'), ('Suprimentos'), ('Planejamento'),
  ('Adm. Contratual'), ('Riscos e Mudanças'), ('Agentes de IA'), ('Configurações')
) AS m(modulo)
WHERE u.perfil NOT IN ('Admin', 'Gestor')
ON CONFLICT (usuario_id, modulo) DO NOTHING;
```

- [ ] **Step 1.2: Commit**

```bash
git add docs/database/supabase-migration-m14-permissoes.sql
git commit -m "feat(m14): migration SQL — permissoes_usuario + RLS + seed por perfil"
```

> **NOTA:** A migration será aplicada na Task 10. Não aplicar agora.

---

## Task 2 — `src/lib/permissionsConfig.js`

**Files:**
- Create: `src/lib/permissionsConfig.js`

- [ ] **Step 2.1: Criar o arquivo**

```js
// src/lib/permissionsConfig.js

export const MODULES = [
  'Dashboard',
  'Engenharia',
  'Suprimentos',
  'Planejamento',
  'Adm. Contratual',
  'Riscos e Mudanças',
  'Agentes de IA',
  'Configurações',
];

export const ACTIONS = ['view', 'create', 'edit', 'delete'];

export const ACTION_LABELS = {
  view: 'Ver',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
};

export const DENY_ALL  = { view: false, create: false, edit: false, delete: false };
export const ALLOW_ALL = { view: true,  create: true,  edit: true,  delete: true  };

const ALL  = ALLOW_ALL;
const VIEW = { view: true,  create: false, edit: false, delete: false };
const NONE = DENY_ALL;

export const PERFIL_SEED = {
  Admin: {
    'Dashboard': ALL, 'Engenharia': ALL, 'Suprimentos': ALL, 'Planejamento': ALL,
    'Adm. Contratual': ALL, 'Riscos e Mudanças': ALL, 'Agentes de IA': ALL, 'Configurações': ALL,
  },
  Gestor: {
    'Dashboard': ALL, 'Engenharia': ALL, 'Suprimentos': ALL, 'Planejamento': ALL,
    'Adm. Contratual': ALL, 'Riscos e Mudanças': ALL, 'Agentes de IA': ALL,
    'Configurações': VIEW,
  },
  Visualizador: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': VIEW, 'Planejamento': VIEW,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Engenharia: {
    'Dashboard': VIEW, 'Engenharia': ALL, 'Suprimentos': VIEW, 'Planejamento': VIEW,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Planejamento: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': VIEW, 'Planejamento': ALL,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Contratual: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': VIEW, 'Planejamento': VIEW,
    'Adm. Contratual': ALL, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Suprimentos: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': ALL, 'Planejamento': VIEW,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
};

// Array dos perfis disponíveis (ordem de exibição no Select)
export const PERFIL_OPTIONS = Object.keys(PERFIL_SEED);
```

- [ ] **Step 2.2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `built in X.XXs` sem erros.

- [ ] **Step 2.3: Commit**

```bash
git add src/lib/permissionsConfig.js
git commit -m "feat(m14): permissionsConfig — MODULES, ACTIONS, PERFIL_SEED, PERFIL_OPTIONS"
```

---

## Task 3 — Entidade `PermissaoUsuario` no data layer

**Files:**
- Modify: `src/api/supabaseEntities.js`

- [ ] **Step 3.1: Adicionar ao TABLE_MAP**

Ler `src/api/supabaseEntities.js`. Localizar o objeto `TABLE_MAP`. Adicionar a linha abaixo de `Usuario`:

```js
// Antes:
  Usuario: 'usuarios',
  Rdo: 'rdo',

// Depois:
  Usuario: 'usuarios',
  PermissaoUsuario: 'permissoes_usuario',
  Rdo: 'rdo',
```

- [ ] **Step 3.2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: sem erros.

- [ ] **Step 3.3: Commit**

```bash
git add src/api/supabaseEntities.js
git commit -m "feat(m14): adicionar PermissaoUsuario no TABLE_MAP do data layer"
```

---

## Task 4 — Hook `usePermissions`

**Files:**
- Create: `src/hooks/usePermissions.js`

- [ ] **Step 4.1: Criar o hook**

```js
// src/hooks/usePermissions.js
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/supabaseEntities';
import { DENY_ALL, ALLOW_ALL } from '@/lib/permissionsConfig';

// Busca o registro da tabela 'usuarios' que corresponde ao usuário Auth logado
function useCurrentUsuario() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['current-usuario', user?.email],
    queryFn: async () => {
      const rows = await entities.Usuario.filter({ email: user.email });
      return rows[0] ?? null;
    },
    enabled: !!user?.email,
    staleTime: Infinity,
  });
}

// Busca todas as permissões do usuário como mapa { modulo: acoes }
function usePermissionsQuery(usuarioId) {
  return useQuery({
    queryKey: ['permissoes', usuarioId],
    queryFn: async () => {
      const rows = await entities.PermissaoUsuario.filter({ usuario_id: usuarioId });
      return rows.reduce((acc, row) => {
        acc[row.modulo] = row.acoes;
        return acc;
      }, {});
    },
    enabled: !!usuarioId,
    staleTime: Infinity,
    placeholderData: {},
  });
}

// Retorna true enquanto as queries ainda carregam — usar em ProtectedRoute
export function usePermissionsLoading() {
  const { isLoading: l1, data: currentUsuario } = useCurrentUsuario();
  const { isLoading: l2 } = usePermissionsQuery(currentUsuario?.id);
  return l1 || l2;
}

// Retorna { permissoes, isAdmin } — usar na sidebar para filtrar navegação
export function usePermissionsMap() {
  const { data: currentUsuario } = useCurrentUsuario();
  const { data: permissoes = {} } = usePermissionsQuery(currentUsuario?.id);
  const isAdmin = currentUsuario?.perfil === 'Admin';
  return { permissoes, isAdmin };
}

// API principal:
//   usePermissions('Engenharia')            → { view, create, edit, delete }
//   usePermissions('Engenharia', 'create')  → boolean
export function usePermissions(modulo, acao) {
  const { data: currentUsuario } = useCurrentUsuario();
  const { data: permissoes = {} } = usePermissionsQuery(currentUsuario?.id);

  // Admin bypass: perfil Admin tem acesso total sem consultar a tabela
  if (currentUsuario?.perfil === 'Admin') {
    return acao !== undefined ? true : { ...ALLOW_ALL };
  }

  const modulePerms = permissoes[modulo] ?? { ...DENY_ALL };

  if (acao !== undefined) return modulePerms[acao] === true;
  return { ...DENY_ALL, ...modulePerms };
}
```

- [ ] **Step 4.2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: sem erros.

- [ ] **Step 4.3: Commit**

```bash
git add src/hooks/usePermissions.js
git commit -m "feat(m14): hook usePermissions — cache React Query, Admin bypass, usePermissionsMap, usePermissionsLoading"
```

---

## Task 5 — Página `SemPermissao.jsx` + rota

**Files:**
- Create: `src/pages/SemPermissao.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 5.1: Criar a página**

```jsx
// src/pages/SemPermissao.jsx
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

export default function SemPermissao() {
  const navigate = useNavigate();
  const canManageUsers = usePermissions('Configurações', 'edit');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
        <Lock className="w-12 h-12 text-slate-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Acesso restrito
        </h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          Você não tem permissão para acessar este módulo.
          Entre em contato com o administrador do sistema.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        {canManageUsers && (
          <Button onClick={() => navigate('/configuracoes/usuarios')}>
            Ir para Usuários
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Adicionar import e rota em `App.jsx`**

Ler `src/App.jsx`. Localizar o bloco de imports `lazy`. Adicionar após o bloco de Configurações:

```jsx
const SemPermissao = lazy(() => import('./pages/SemPermissao'));
```

Localizar o bloco de `<Route>` dentro de `AuthenticatedApp`. Adicionar a rota antes de `<Route path="*" ...>`:

```jsx
{/* Sem Permissão */}
<Route path="/sem-permissao" element={wrap(SemPermissao)} />
```

- [ ] **Step 5.3: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: sem erros.

- [ ] **Step 5.4: Commit**

```bash
git add src/pages/SemPermissao.jsx src/App.jsx
git commit -m "feat(m14): página /sem-permissao + rota no App.jsx"
```

---

## Task 6 — `ProtectedRoute` + `wrap()` + rotas com `modulo`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 6.1: Atualizar `ProtectedRoute` dentro de `App.jsx`**

Localizar o componente `ProtectedRoute` (linha ~69). Substituí-lo por:

```jsx
const ProtectedRoute = ({ children, modulo, acao = 'view' }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const permsLoading = usePermissionsLoading();
  const canAccess = usePermissions(modulo, acao);

  if (isLoadingAuth || (modulo && permsLoading)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (modulo && !canAccess) return <Navigate to="/sem-permissao" replace />;

  return children;
};
```

Adicionar os imports necessários no topo do arquivo (junto aos imports existentes):

```jsx
import { usePermissions, usePermissionsLoading } from '@/hooks/usePermissions';
```

- [ ] **Step 6.2: Atualizar o helper `wrap()` para aceitar `modulo`**

Localizar a função `wrap` (linha ~83). Substituir por:

```jsx
const wrap = (Component, modulo) => (
  <ProtectedRoute modulo={modulo}>
    <LayoutWrapper>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </LayoutWrapper>
  </ProtectedRoute>
);
```

- [ ] **Step 6.3: Atualizar as chamadas de `wrap()` com o segundo argumento `modulo`**

Localizar cada rota no `AuthenticatedApp`. Adicionar o segundo argumento (string do módulo). Seguir o mapeamento abaixo:

```jsx
{/* Dashboard */}
<Route path="/dashboard" element={wrap(Dashboard, 'Dashboard')} />

{/* Engenharia */}
<Route path="/engenharia/documentos" element={wrap(Documentos, 'Engenharia')} />

{/* Suprimentos */}
<Route path="/suprimentos/mapa" element={wrap(MapaSuprimentos, 'Suprimentos')} />

{/* Planejamento */}
<Route path="/planejamento/cronograma" element={wrap(PlanejamentoCronograma, 'Planejamento')} />
<Route path="/planejamento/6wla" element={wrap(SixWLAPage, 'Planejamento')} />
<Route path="/planejamento/take-off" element={wrap(TakeOff, 'Planejamento')} />
<Route path="/planejamento/histograma" element={wrap(PlanejamentoHistograma, 'Planejamento')} />
<Route path="/planejamento/avancos" element={wrap(Avancos, 'Planejamento')} />

{/* Adm. Contratual */}
<Route path="/admin-contratual/contratos" element={wrap(Contratos, 'Adm. Contratual')} />
<Route path="/admin-contratual/medicoes" element={wrap(Medicoes, 'Adm. Contratual')} />
<Route path="/admin-contratual/rdos" element={wrap(RDOs, 'Adm. Contratual')} />
<Route path="/admin-contratual/registros" element={wrap(Registros, 'Adm. Contratual')} />
<Route path="/admin-contratual/pleitos" element={wrap(AdminPleitos, 'Adm. Contratual')} />
<Route path="/admin-contratual/mapa-impacto" element={wrap(MapaImpacto, 'Adm. Contratual')} />

{/* Riscos e Mudanças */}
<Route path="/riscos-mudancas/gestao-riscos" element={wrap(GestaoRiscos, 'Riscos e Mudanças')} />
<Route path="/riscos-mudancas/gestao-mudancas" element={wrap(GestaoMudancas, 'Riscos e Mudanças')} />

{/* Agentes de IA */}
<Route path="/agentes/executor" element={wrap(ExecutorDados, 'Agentes de IA')} />
<Route path="/agentes/analista-negocio" element={wrap(AnalistaNegocio, 'Agentes de IA')} />
<Route path="/agentes/analista-contratual" element={wrap(AnalistaContratual, 'Agentes de IA')} />

{/* Configurações */}
<Route path="/configuracoes/gerenciar-projeto" element={wrap(GerenciarProjeto, 'Configurações')} />
<Route path="/configuracoes/agente-config" element={wrap(AgenteConfig, 'Configurações')} />
<Route path="/configuracoes/usuarios" element={wrap(Usuarios, 'Configurações')} />

{/* Sem permissão — sem modulo, acessível a qualquer autenticado */}
<Route path="/sem-permissao" element={wrap(SemPermissao)} />
```

Rotas de redirect legado (ex: `<Navigate to="...">`) não precisam de alteração.

- [ ] **Step 6.4: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: sem erros.

- [ ] **Step 6.5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(m14): ProtectedRoute aceita modulo+acao, wrap() propagado, rotas com módulo"
```

---

## Task 7 — Sidebar filtering em `Layout.jsx`

**Files:**
- Modify: `src/Layout.jsx`

- [ ] **Step 7.1: Ler `src/Layout.jsx` e localizar onde `navigationGroups` é iterado**

Buscar por `navigationGroups` no arquivo. Identificar o ponto onde os grupos são mapeados para renderizar os links da sidebar.

- [ ] **Step 7.2: Adicionar imports**

No topo do `Layout.jsx`, adicionar:

```jsx
import { useMemo } from 'react';
import { usePermissionsMap } from '@/hooks/usePermissions';
```

- [ ] **Step 7.3: Adicionar lógica de filtragem dentro do componente `Layout`**

Dentro do componente (antes do `return`), adicionar:

```jsx
const { permissoes, isAdmin } = usePermissionsMap();

const visibleNavigation = useMemo(() => {
  if (isAdmin) return navigationGroups;
  return navigationGroups.filter(group =>
    permissoes[group.title]?.view === true
  );
}, [permissoes, isAdmin]);
```

- [ ] **Step 7.4: Substituir `navigationGroups` por `visibleNavigation` no render da sidebar**

Localizar todas as referências a `navigationGroups` dentro do JSX de renderização da sidebar (tipicamente dentro do `map()`). Substituir por `visibleNavigation`.

Exemplo:
```jsx
// Antes:
{navigationGroups.map((group) => (...))}

// Depois:
{visibleNavigation.map((group) => (...))}
```

- [ ] **Step 7.5: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: sem erros.

- [ ] **Step 7.6: Commit**

```bash
git add src/Layout.jsx
git commit -m "feat(m14): sidebar filtra grupos sem permissão view via usePermissionsMap"
```

---

## Task 8 — `Usuarios.jsx` — Matriz, auto-seed e PERFIL_OPTIONS

**Files:**
- Modify: `src/pages/Configuracoes/Usuarios.jsx`

- [ ] **Step 8.1: Atualizar imports**

O arquivo já tem `import { useState } from "react"`. Adicionar `useEffect` a esse import existente (não criar novo import de react):

```jsx
// Alterar a linha existente de:
import { useState } from "react";
// Para:
import { useState, useEffect } from "react";
```

Adicionar os novos imports logo abaixo:

```jsx
import { PERFIL_OPTIONS, PERFIL_SEED, MODULES, ACTIONS, ACTION_LABELS, DENY_ALL } from '@/lib/permissionsConfig';
import { Checkbox } from '@/components/ui/checkbox';
```

- [ ] **Step 8.2: Remover a constante local `PERFIL_OPTIONS`**

Localizar e deletar esta linha:

```jsx
const PERFIL_OPTIONS = ["Admin", "Gestor", "Visualizador"];
```

A versão importada de `permissionsConfig.js` a substitui com 7 perfis.

- [ ] **Step 8.3: Adicionar state local da matriz de permissões**

Dentro do componente `Usuarios`, junto aos demais `useState`:

```jsx
const [permsMatrix, setPermsMatrix] = useState({});
```

- [ ] **Step 8.4: Adicionar query para permissões do usuário em edição**

Após as queries existentes, adicionar:

```jsx
const { data: userPermsRows = [] } = useQuery({
  queryKey: ['permissoes-editor', editing?.id],
  queryFn: () => entities.PermissaoUsuario.filter({ usuario_id: editing.id }),
  enabled: !!editing?.id,
});

useEffect(() => {
  if (!editing?.id) return;
  const map = userPermsRows.reduce((acc, row) => {
    acc[row.modulo] = { ...row.acoes };
    return acc;
  }, {});
  const full = MODULES.reduce((acc, mod) => {
    acc[mod] = map[mod] ?? { ...DENY_ALL };
    return acc;
  }, {});
  setPermsMatrix(full);
}, [editing?.id, userPermsRows]);
```

- [ ] **Step 8.5: Adicionar mutation de auto-seed de permissões**

Após as mutations existentes:

```jsx
const createPermsMut = useMutation({
  mutationFn: async ({ usuarioId, perfil }) => {
    const seed = PERFIL_SEED[perfil] ?? PERFIL_SEED['Visualizador'];
    await Promise.all(
      MODULES.map(modulo =>
        entities.PermissaoUsuario.create({ usuario_id: usuarioId, modulo, acoes: seed[modulo] })
      )
    );
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['permissoes'] });
  },
  onError: (e) => toast({ title: "Erro ao criar permissões", description: e.message, variant: "destructive" }),
});
```

- [ ] **Step 8.6: Atualizar `createMut.onSuccess` para disparar o auto-seed**

Localizar o `createMut` existente. Atualizar o `onSuccess`:

```jsx
// ANTES:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  setShowForm(false);
  setEditing(null);
  setForm(EMPTY_FORM);
  toast({ variant: "success", description: "Usuário criado com sucesso." });
},

// DEPOIS:
onSuccess: (newUser) => {
  createPermsMut.mutate({ usuarioId: newUser.id, perfil: form.perfil });
  queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  setShowForm(false);
  setEditing(null);
  setForm(EMPTY_FORM);
  toast({ variant: "success", description: "Usuário criado com sucesso." });
},
```

- [ ] **Step 8.7: Adicionar mutation para salvar permissões editadas**

```jsx
const savePermsMut = useMutation({
  mutationFn: async ({ usuarioId, matrix }) => {
    const existing = await entities.PermissaoUsuario.filter({ usuario_id: usuarioId });
    const existingMap = existing.reduce((acc, r) => {
      acc[r.modulo] = r.id;
      return acc;
    }, {});
    await Promise.all(
      MODULES.map(modulo => {
        const acoes = matrix[modulo] ?? { ...DENY_ALL };
        const existingId = existingMap[modulo];
        return existingId
          ? entities.PermissaoUsuario.update(existingId, { acoes })
          : entities.PermissaoUsuario.create({ usuario_id: usuarioId, modulo, acoes });
      })
    );
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['permissoes'] });
    queryClient.invalidateQueries({ queryKey: ['permissoes-editor', editing?.id] });
    toast({ variant: "success", description: "Permissões salvas." });
  },
  onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
});
```

- [ ] **Step 8.8: Adicionar helpers da matriz**

```jsx
const toggleCell = (modulo, acao) => {
  setPermsMatrix(prev => ({
    ...prev,
    [modulo]: { ...prev[modulo], [acao]: !prev[modulo]?.[acao] },
  }));
};

const toggleRow = (modulo) => {
  const current = permsMatrix[modulo] ?? DENY_ALL;
  const allTrue = ACTIONS.every(a => current[a]);
  setPermsMatrix(prev => ({
    ...prev,
    [modulo]: ACTIONS.reduce((acc, a) => ({ ...acc, [a]: !allTrue }), {}),
  }));
};

const toggleCol = (acao) => {
  const allTrue = MODULES.every(m => permsMatrix[m]?.[acao]);
  setPermsMatrix(prev => {
    const next = { ...prev };
    MODULES.forEach(m => {
      next[m] = { ...(next[m] ?? DENY_ALL), [acao]: !allTrue };
    });
    return next;
  });
};

const applyTemplate = (perfil) => {
  const seed = PERFIL_SEED[perfil];
  if (seed) setPermsMatrix({ ...seed });
};
```

- [ ] **Step 8.9: Adicionar seção de permissões dentro do Dialog de edição**

Localizar o `Dialog` / `DialogContent` que renderiza o formulário de edição (visível quando `showForm && editing`). Adicionar a seção abaixo, **após** os campos de formulário existentes e **antes** do `DialogFooter`:

```jsx
{editing && (
  <div className="mt-5 border-t pt-4 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Permissões</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Aplicar perfil:</span>
        <Select onValueChange={applyTemplate}>
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            {PERFIL_OPTIONS.map(p => (
              <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500">
            <th className="text-left py-1 pr-4 font-medium w-40">Módulo</th>
            {ACTIONS.map(acao => (
              <th
                key={acao}
                className="text-center py-1 px-2 font-medium cursor-pointer hover:text-blue-600 select-none"
                title={`Marcar/desmarcar coluna "${ACTION_LABELS[acao]}"`}
                onClick={() => toggleCol(acao)}
              >
                {ACTION_LABELS[acao]}
              </th>
            ))}
            <th className="text-center py-1 px-2 font-medium text-slate-400 select-none">Todos</th>
          </tr>
        </thead>
        <tbody>
          {MODULES.map(modulo => (
            <tr
              key={modulo}
              className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
            >
              <td className="py-1.5 pr-4 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[160px]">
                {modulo}
              </td>
              {ACTIONS.map(acao => (
                <td key={acao} className="text-center py-1.5 px-2">
                  <Checkbox
                    checked={permsMatrix[modulo]?.[acao] === true}
                    onCheckedChange={() => toggleCell(modulo, acao)}
                    className="w-4 h-4"
                  />
                </td>
              ))}
              <td className="text-center py-1.5 px-2">
                <Checkbox
                  checked={ACTIONS.every(a => permsMatrix[modulo]?.[a] === true)}
                  onCheckedChange={() => toggleRow(modulo)}
                  className="w-4 h-4"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="flex justify-end">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => savePermsMut.mutate({ usuarioId: editing.id, matrix: permsMatrix })}
        disabled={savePermsMut.isPending}
      >
        {savePermsMut.isPending ? 'Salvando...' : 'Salvar Permissões'}
      </Button>
    </div>
  </div>
)}
```

- [ ] **Step 8.10: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: sem erros.

- [ ] **Step 8.11: Commit**

```bash
git add src/pages/Configuracoes/Usuarios.jsx
git commit -m "feat(m14): Usuarios.jsx — PERFIL_OPTIONS expandido, matriz de permissões, auto-seed na criação"
```

---

## Task 9 — Camada 3 piloto: Engenharia + Suprimentos

**Files:**
- Modify: `src/pages/Engenharia/Documentos.jsx`
- Modify: `src/pages/Suprimentos/MapaSuprimentos.jsx`

### 9A — Documentos.jsx

- [ ] **Step 9.1: Ler `src/pages/Engenharia/Documentos.jsx`**

Identificar:
1. Botões de ação (Novo, Editar, Excluir, Importar, Exportar)
2. Se estão no slot `actions` do `PageHeader` ou no corpo da página

- [ ] **Step 9.2: Adicionar `usePermissions` e condicionar botões**

No topo do componente (junto aos demais imports):
```jsx
import { usePermissions } from '@/hooks/usePermissions';
```

No início do corpo do componente:
```jsx
const { create: canCreate, edit: canEdit, delete: canDelete } = usePermissions('Engenharia');
```

Para cada botão, aplicar condicional:

| Botão | Condição |
|---|---|
| Novo Documento | `{canCreate && <Button ...>}` |
| Importar | `{canCreate && <Button ...>}` |
| Editar (ícone/botão na linha da tabela) | `{canEdit && <Button ...>}` |
| Excluir / Remover | `{canDelete && <Button ...>}` |
| Exportar | Sem condição — leitura |

Exemplo:
```jsx
// Antes:
<Button onClick={handleNew}>Novo Documento</Button>

// Depois:
{canCreate && <Button onClick={handleNew}>Novo Documento</Button>}
```

- [ ] **Step 9.3: Commit Documentos.jsx**

```bash
git add src/pages/Engenharia/Documentos.jsx
git commit -m "feat(m14): Documentos.jsx — camada 3 botões condicionados por usePermissions"
```

### 9B — MapaSuprimentos.jsx

- [ ] **Step 9.4: Ler `src/pages/Suprimentos/MapaSuprimentos.jsx`**

Identificar botões de ação (Novo, Editar, Excluir, Importar).

- [ ] **Step 9.5: Adicionar `usePermissions` e condicionar botões**

```jsx
import { usePermissions } from '@/hooks/usePermissions';

// No componente:
const { create: canCreate, edit: canEdit, delete: canDelete } = usePermissions('Suprimentos');
```

Aplicar as mesmas condicionais do Step 9.2 para cada botão correspondente.

- [ ] **Step 9.6: Verificar build**

```bash
npm run build 2>&1 | tail -5
```
Expected: sem erros.

- [ ] **Step 9.7: Commit MapaSuprimentos.jsx**

```bash
git add src/pages/Suprimentos/MapaSuprimentos.jsx
git commit -m "feat(m14): MapaSuprimentos.jsx — camada 3 botões condicionados por usePermissions"
```

---

## Task 10 — Aplicar migration + Smoke Test

- [ ] **Step 10.1: Aplicar migration no Supabase Dashboard**

1. Abrir Supabase Dashboard → **SQL Editor**
2. Colar e executar o conteúdo de `docs/database/supabase-migration-m14-permissoes.sql`
3. Confirmar: ir em **Table Editor** → tabela `permissoes_usuario` deve existir com colunas `id, usuario_id, modulo, acoes, created_at, updated_at`
4. Verificar que rows de seed foram criadas para usuários existentes

- [ ] **Step 10.2: Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```
Expected: Vite em porta 5173 + Mastra em 4111, sem erros no console.

- [ ] **Step 10.3: Smoke test — Admin**

Logar com usuário `perfil = 'Admin'`. Verificar:
- Todos os 8 grupos aparecem na sidebar
- Todos os botões de ação aparecem em `/engenharia/documentos` e `/suprimentos/mapa`
- Ir para `/configuracoes/usuarios` → clicar Editar em qualquer usuário → seção "Permissões" com a tabela aparece abaixo dos campos

- [ ] **Step 10.4: Smoke test — criar Visualizador e verificar seed**

Em `/configuracoes/usuarios`:
1. Novo Usuário → perfil "Visualizador" → salvar
2. No Supabase Dashboard → `permissoes_usuario` → confirmar 8 rows criadas para o novo usuário com `view: true` e demais `false`

- [ ] **Step 10.5: Smoke test — teste de bloqueio**

Editar o usuário criado no Step 10.4:
1. Desmarcar `view` do módulo "Engenharia" na matriz
2. Salvar Permissões
3. Invalidar cache manualmente (reload da página)
4. Verificar que "Engenharia" não aparece na sidebar deste usuário
5. Tentar navegar diretamente para `/engenharia/documentos` → deve redirecionar para `/sem-permissao`

- [ ] **Step 10.6: Build final**

```bash
npm run build 2>&1 | tail -5
```
Expected: `built in X.XXs` sem erros.

- [ ] **Step 10.7: Commit final**

```bash
git add -A
git commit -m "feat(m14): sistema de permissões completo — schema, hook, sidebar, ProtectedRoute, matriz UI, piloto camada 3"
```

---

## Critérios de Aceite

- [ ] Usuário Admin vê todos os módulos na sidebar e todos os botões em Engenharia + Suprimentos
- [ ] Usuário Visualizador não vê botões de criar/editar/excluir nos módulos piloto
- [ ] Usuário com `view = false` num módulo: módulo some da sidebar + redirect para `/sem-permissao` ao tentar acessar a rota diretamente
- [ ] Criar usuário com perfil "Contratual" → 8 rows criadas automaticamente em `permissoes_usuario` com acesso write apenas em "Adm. Contratual"
- [ ] Matriz em `Usuarios.jsx`: toggle de célula, linha e coluna funcionam; "Salvar Permissões" persiste corretamente
- [ ] `npm run build` sem erros
