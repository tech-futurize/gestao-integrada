# Spec M14 — Sistema de Permissões

**Data:** 2026-05-29  
**Autor:** Architect  
**Status:** Aprovado pelo PO

---

## 1. Objetivo

Introduzir controle de acesso granular por módulo e ação no sistema, substituindo o campo `perfil` simbólico atual (Admin/Gestor/Visualizador) por uma tabela real de permissões por usuário, integrada à sidebar, às rotas protegidas e aos botões de ação das páginas.

---

## 2. Decisões Aprovadas

| Dimensão | Decisão |
|---|---|
| Granularidade | Por módulo (8 grupos top-level de `navigationConfig.js`) |
| Ações | `view / create / edit / delete` (4 booleans em JSONB) |
| Sem permissão | Página `/sem-permissao` + botão auto-fix para Admin |
| Seed de deploy | Migration SQL popula 8 rows para o usuário admin existente |
| Templates | Constante `PERFIL_SEED` aplicada na criação de usuário em `Usuarios.jsx` |
| Perfis disponíveis | Admin, Gestor, Visualizador, Engenharia, Planejamento, Contratual, Suprimentos |

---

## 3. Schema de Banco

### Tabela `permissoes_usuario`

```sql
CREATE TABLE permissoes_usuario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo      TEXT NOT NULL,
  acoes       JSONB NOT NULL DEFAULT '{"view":false,"create":false,"edit":false,"delete":false}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, modulo)
);

CREATE INDEX idx_permissoes_usuario_id ON permissoes_usuario(usuario_id);
```

### Módulos válidos (chave = `title` do grupo em `navigationConfig.js`)

```
Dashboard
Engenharia
Suprimentos
Planejamento
Adm. Contratual
Riscos e Mudanças
Agentes de IA
Configurações
```

### Seed de deploy (admin)

Aplicado via migration SQL — popula 8 rows para o usuário com `perfil = 'Admin'` já cadastrado. Acesso total em todos os módulos.

```sql
INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
SELECT
  u.id,
  m.modulo,
  '{"view":true,"create":true,"edit":true,"delete":true}'::jsonb
FROM usuarios u
CROSS JOIN (VALUES
  ('Dashboard'),
  ('Engenharia'),
  ('Suprimentos'),
  ('Planejamento'),
  ('Adm. Contratual'),
  ('Riscos e Mudanças'),
  ('Agentes de IA'),
  ('Configurações')
) AS m(modulo)
WHERE u.perfil = 'Admin'
ON CONFLICT (usuario_id, modulo) DO NOTHING;
```

---

## 4. Templates de Perfil (`PERFIL_SEED`)

Constante JS em `src/lib/permissionsConfig.js`. Aplicada no `onSuccess` de `createMut` em `Usuarios.jsx` — cria automaticamente 8 rows de `permissoes_usuario` ao cadastrar um novo usuário.

| Perfil | Dashboard | Engenharia | Suprimentos | Planejamento | Adm. Contratual | Riscos e Mudanças | Agentes de IA | Configurações |
|---|---|---|---|---|---|---|---|---|
| Admin | VCED | VCed | VCED | VCED | VCED | VCED | VCED | VCED |
| Gestor | VCED | VCED | VCED | VCED | VCED | VCED | VCED | V--- |
| Visualizador | V--- | V--- | V--- | V--- | V--- | V--- | V--- | ---- |
| Engenharia | V--- | VCED | V--- | V--- | V--- | V--- | V--- | ---- |
| Planejamento | V--- | V--- | V--- | VCED | V--- | V--- | V--- | ---- |
| Contratual | V--- | V--- | V--- | V--- | VCED | V--- | V--- | ---- |
| Suprimentos | V--- | V--- | VCED | V--- | V--- | V--- | V--- | ---- |

**Legenda:** V=view, C=create, E=edit, D=delete, `-`=false

---

## 5. Hook `usePermissions`

Arquivo: `src/hooks/usePermissions.js`

```js
// Retorna objeto { view, create, edit, delete } para o módulo
usePermissions(modulo)

// Retorna boolean — atalho para ação específica
usePermissions(modulo, acao) // acao = 'view' | 'create' | 'edit' | 'delete'
```

**Implementação:**
- `useQuery({ queryKey: ['permissoes', userId], queryFn: ... })` — busca todas as permissões do usuário logado em uma única query
- `staleTime: Infinity` — permissões não mudam durante a sessão; invalidar em logout e ao salvar em `Usuarios.jsx`
- Retorno padrão quando não há row: `{ view: false, create: false, edit: false, delete: false }` — fail-safe, não fail-open
- Admin bypass: se `usuario.perfil === 'Admin'`, retornar tudo `true` sem consultar tabela (para emergências de seed)

---

## 6. Enforcement — Três Camadas

### Camada 1 — Sidebar (visibilidade de itens)
`Layout.jsx` / sidebar: filtrar `navigationGroups` removendo grupos onde `!can(grupo.title, 'view')`.  
Submódulos herdam a permissão do grupo pai — se o grupo não tem `view`, nenhum filho aparece.

### Camada 2 — Rotas (`ProtectedRoute`)
`ProtectedRoute` recebe props opcionais `modulo` e `acao` (default `'view'`).  
Se `!can(modulo, acao)` → redirecionar para `/sem-permissao`.

```jsx
<ProtectedRoute modulo="Engenharia" acao="view">
  <Documentos />
</ProtectedRoute>
```

### Camada 3 — Botões de ação nas páginas
Componentes escondem/desabilitam botões com base em `usePermissions`:

```jsx
const { create, edit, delete: del } = usePermissions('Engenharia');
// ...
{create && <Button onClick={handleNew}>Novo</Button>}
{edit && <Button onClick={handleEdit}>Editar</Button>}
{del && <Button onClick={handleDelete}>Excluir</Button>}
```

**Aplicação no M14:** implementar nas camadas 1 e 2 em todos os módulos; camada 3 aplicada como piloto em Engenharia e Suprimentos. Demais módulos recebem camada 3 em milestone futuro ou como sub-tasks do M15.

---

## 7. Página `/sem-permissao`

Rota: `/sem-permissao`  
Arquivo: `src/pages/SemPermissao.jsx`

Conteúdo:
- Ícone Lock + título "Acesso restrito"
- Mensagem explicando que o usuário não tem permissão para este módulo
- Botão "Voltar" (history.back)
- Botão "Ir para Usuários" — visível apenas se `can('Configurações', 'edit')` (Admin auto-fix)

---

## 8. UI de Permissões em `Usuarios.jsx`

### Localização
Dentro do modal de edição de usuário — aba ou seção "Permissões" abaixo dos campos de perfil.

### Layout da matriz
Tabela: linhas = 8 módulos, colunas = view / create / edit / delete.  
Cada célula = checkbox (`<Checkbox />`).

**Controles de atalho:**
- Toggle de linha: marcar/desmarcar todos os checkboxes de um módulo
- Toggle de coluna: marcar/desmarcar todos os módulos para uma ação
- Seletor de template: dropdown "Aplicar perfil…" com os 7 perfis — preenche a matriz sem salvar ainda

**Salvar:** botão único "Salvar Permissões" faz upsert em todas as 8 rows via `useMutation`.

---

## 9. Entidade no Data Layer

Adicionar em `src/api/supabaseEntities.js`:

```js
PermissaoUsuario: createEntity('permissoes_usuario'),
```

---

## 10. Fluxo de criação de usuário (atualizado)

1. Admin preenche formulário (nome, email, cargo, perfil, status)
2. `createMut.onSuccess` → ler `PERFIL_SEED[form.perfil]` → criar 8 rows em `permissoes_usuario` via bulk insert
3. Invalidar `queryKey: ['permissoes']`

---

## 11. O que NÃO está no escopo do M14

- Permissões por projeto (todas as permissões são globais — mesmas em todos os projetos)
- Permissões por submódulo (herdadas do grupo pai)
- Camada 3 em todos os módulos (piloto em Engenharia + Suprimentos)
- RLS no Supabase por permissão (enforcement é front-end; RLS atual por `auth.uid()` permanece)
- Audit log de mudanças de permissão

---

## 12. Critério de Aceite

- [ ] Usuário Admin vê todos os módulos, tem todos os botões disponíveis
- [ ] Usuário Visualizador não vê botões de criar/editar/excluir em nenhum módulo
- [ ] Usuário Engenharia vê apenas Engenharia com escrita; demais apenas view
- [ ] Usuário sem nenhuma permissão `view` é redirecionado para `/sem-permissao`
- [ ] Criar novo usuário com perfil "Contratual" gera automaticamente 8 rows corretas
- [ ] Matriz de permissões em `Usuarios.jsx` salva corretamente e reflete na sidebar imediatamente após invalidação do cache
- [ ] `npm run build` sem erros
- [ ] `/audit` ≥ 9
