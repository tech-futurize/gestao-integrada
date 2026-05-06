# ARCHITECTURE.md — Arquitetura do Sistema

> Descreve as camadas, comunicação entre componentes, fluxos principais e decisões arquiteturais do Sistema de Gestão Integrada.

## Visão Geral

O sistema é uma **SPA (Single Page Application)** React que se comunica diretamente com o Supabase como backend-as-a-service. Não há servidor intermediário próprio — toda a lógica de negócio que requer persistência é feita via Supabase (PostgreSQL + Auth + RLS).

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                        │
│  React 18 + Vite 6                                       │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Pages   │→ │  Components  │→ │  supabaseEntities │  │
│  └──────────┘  └──────────────┘  └────────┬──────────┘  │
│                                    React Query           │
│                                           │              │
│            ┌──────────────────────────────┴───────┐      │
│            │        supabaseClient.js              │      │
│            └──────────────┬───────────────────────┘      │
└───────────────────────────┼─────────────────────────────┘
                            │ HTTPS
                            ▼
              ┌─────────────────────────────┐
              │         Supabase             │
              │  ┌──────────┐ ┌───────────┐ │
              │  │ Auth     │ │PostgreSQL │ │
              │  └──────────┘ └───────────┘ │
              │  Row Level Security (RLS)    │
              └─────────────────────────────┘
```

## Camadas da Aplicação

### 1. Pages (`/src/pages/`)
Cada arquivo = uma rota. As páginas lêem `selectedProjectId` do `localStorage`, usam `useQuery`/`useMutation` e chamam `entities.X.*()`.

### 2. Components (`/src/components/<dominio>/`)
Componentes de UI por domínio. Recebem dados via props — não fazem queries diretas (exceto components de dashboard que recebem `projetoId`).

### 3. Data Layer (`/src/api/supabaseEntities.js`)
Shim que expõe API uniforme para as 25 entidades:
```js
entities.X.list(filters)    // SELECT * WHERE filters
entities.X.filter(filters)  // alias de list()
entities.X.create(data)     // INSERT
entities.X.update(id, data) // UPDATE WHERE id
entities.X.delete(id)       // DELETE WHERE id
```

### 4. Supabase Client (`/src/lib/supabaseClient.js`)
Instância única do Supabase JS SDK v2, inicializada com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Fluxo de Autenticação

```
Acesso → AuthContext (getSession()) → ProtectedRoute
  autenticado → Layout + Página
  não autenticado → redirect /login
```
- Login: `supabase.auth.signInWithPassword()`
- Logout: `supabase.auth.signOut()`
- Listener: `supabase.auth.onAuthStateChange()`

## Seleção de Projeto Ativo

1. `Layout.jsx` carrega projetos da tabela `projetos`
2. Usuário seleciona projeto no dialog da sidebar
3. `selectedProjectId` (UUID) salvo em `localStorage`
4. Cada página filtra: `entities.X.filter({ projeto_id: selectedProjectId })`
5. `enabled: !!selectedProjectId` garante que queries não rodam sem projeto

## Estado Global

| Mecanismo | Uso |
|-----------|-----|
| React Query cache | Dados do servidor (Supabase) |
| `localStorage` | `selectedProjectId` — persiste entre sessões |
| `AuthContext` | Sessão do usuário |
| `useState` local | UI: modais, formulários, tabs |

## Build e Deploy

- `npm run build` → Vite gera `/dist/` (SPA estática)
- `Dockerfile` presente para containerização
- Variáveis `VITE_*` são embutidas no bundle — nunca colocar secrets com prefixo `VITE_`

## Decisões Arquiteturais

| # | Decisão | Motivação |
|---|---------|-----------|
| 001 | Migrar Base44 → Supabase | Base44 descontinuado |
| 002 | Shim `supabaseEntities.js` compatível com API Base44 | Migração incremental sem reescrever todas as páginas |
| 003 | `localStorage` para selectedProjectId | Persiste entre sessões; sem hook adicional |
| 004 | JavaScript, não TypeScript | Projeto migrado de plataforma no-code; overhead de TS injustificado no curto prazo |

> **Ownership:** Architect | **Consultado por:** Todos os agentes

---

## 1. Visão Geral

<!-- Descreva em 2-3 parágrafos a arquitetura geral do sistema. Inclua um diagrama de alto nível se possível (pode ser Mermaid ou imagem em /docs/design/assets/references/) -->



## 2. Camadas do Sistema

<!-- Para cada camada, descreva: o que ela faz, quais tecnologias usa, e seus limites -->

### Frontend

- **Responsabilidade:** <!-- Ex: Renderização de UI, gerenciamento de estado local, interações do usuário -->
- **Tecnologias:** <!-- Ex: Next.js 16 App Router, React, Tailwind CSS, Framer Motion -->
- **Limites:** <!-- Ex: Não acessa banco diretamente. Toda comunicação com dados via API Routes -->

### API Layer

- **Responsabilidade:** <!-- Ex: Receber requests do frontend, validar inputs, orquestrar lógica de negócio -->
- **Tecnologias:** <!-- Ex: Next.js API Routes, Zod para validação -->
- **Limites:** <!-- Ex: Não contém lógica de UI. Não acessa serviços externos diretamente — usa camada de serviços -->

### Serviços / Business Logic

- **Responsabilidade:** <!-- Ex: Lógica de negócio pura, regras de domínio, processamento de dados -->
- **Tecnologias:** <!-- Ex: TypeScript modules em /lib -->
- **Limites:** <!-- Ex: Não conhece HTTP, requests ou responses. Recebe dados tipados e retorna dados tipados -->

### Database

- **Responsabilidade:** <!-- Ex: Persistência de dados, queries, migrations -->
- **Tecnologias:** <!-- Ex: Supabase PostgreSQL, Prisma ORM, Row Level Security -->
- **Limites:** <!-- Ex: Acesso apenas via camada de serviços. Nunca exposto diretamente ao frontend -->

### Serverless / Background Jobs

- **Responsabilidade:** <!-- Ex: Tarefas pesadas, processamento assíncrono, chamadas a APIs externas -->
- **Tecnologias:** <!-- Ex: Modal -->
- **Limites:** <!-- Ex: Não acessa UI. Comunicação via webhooks ou polling -->

### Serviços Externos

- **Responsabilidade:** <!-- Ex: IA, pagamentos, emails, autenticação -->
- **Detalhes:** Veja [INTEGRATIONS.md](./INTEGRATIONS.md) para lista completa

---

## 3. Comunicação entre Camadas

<!-- Descreva como as camadas se comunicam. Ex: REST, WebSocket, eventos, filas -->

| De | Para | Protocolo | Exemplo |
|----|------|-----------|---------|
| Frontend | API Layer | REST (fetch) | `GET /api/projects` |
| API Layer | Serviços | Import direto | `import { getProjects } from '@/lib/projects'` |
| Serviços | Database | Prisma ORM | `prisma.project.findMany()` |
| API Layer | Serverless | HTTP / Webhook | `POST modal-endpoint/generate` |
| Serverless | API Layer | Webhook callback | `POST /api/webhooks/modal` |

---

## 4. Padrões Arquiteturais

<!-- Quais padrões o projeto segue? Justifique cada escolha. -->

- **Padrão:** <!-- Ex: Clean Architecture simplificado — separação em camadas com dependências unidirecionais -->
- **Justificativa:** <!-- Ex: Permite testar lógica de negócio sem dependência de framework -->

---

## 5. Fluxo de uma Requisição Típica

<!-- Descreva o caminho de uma request do click do usuário até a resposta renderizada -->

1. Usuário clica em <!-- ação -->
2. Frontend faz `fetch` para <!-- endpoint -->
3. API Route valida input com Zod
4. Chama serviço em `/lib/`
5. Serviço consulta banco via Prisma
6. Resposta volta tipada para o frontend
7. React renderiza o resultado com <!-- estado de loading/success -->

---

## 6. Ambientes

<!-- Liste todos os ambientes, suas URLs e suas diferenças de paridade -->

| Ambiente | URL | Propósito | Paridade com produção | Notas |
|----------|-----|-----------|-----------------------|-------|
| Local | `http://localhost:3000` | Desenvolvimento na máquina do dev | Dados de teste, serviços em sandbox | Usa `.env.local` |
| Staging | <!-- URL de staging --> | Homologação e smoke tests pré-deploy | 100% — mesma stack, dados mascarados | Deploy automático em merge para `main` |
| Produção | <!-- URL de produção --> | Usuários reais | — | Deploy manual autorizado pelo Architect |

### Regras de paridade

- **Mesma versão de runtime e mesmas flags de feature** em staging e produção.
- **Secrets segregados:** chaves de staging NUNCA são reutilizadas em produção.
- **Dados de staging são mascarados** quando derivados de produção (nomes, emails, CPFs, cartões — nunca dados reais).
- **Rollback plan:** versão anterior sempre disponível para revert imediato (ver [WORKFLOWS.md §3](../WORKFLOWS.md#3-deploy--pipeline-completo-de-deploy)).

---

## 7. Autenticação e Autorização

<!-- Descreva como a auth funciona no sistema. Ajuste conforme a stack escolhida. -->

### Fluxo de autenticação

1. Usuário inicia login via <!-- método: Magic Link, OAuth, senha -->
2. Provedor (<!-- ex: Supabase Auth -->) emite token de sessão
3. Frontend armazena o token em <!-- cookies HttpOnly / memória -->
4. API valida o token em cada request via middleware em `/middleware/auth.ts`
5. Renovação / refresh: <!-- descreva política -->

### Autorização

- **Modelo:** <!-- RBAC simples | RBAC + atributos | RLS no banco -->
- **Papéis:** <!-- Ex: `admin`, `member`, `viewer` -->
- **Onde as regras vivem:** 
  - No banco, via Row Level Security (ver [DATABASE.md](./DATABASE.md))
  - Na API, via middleware de permissões
  - No frontend, apenas para UI (esconder botões) — nunca como única barreira

### Requisitos do Agent_Security

- Tokens expiram em <!-- X minutos/horas -->
- Refresh tokens armazenados <!-- onde e como --> com rotação
- Rate limiting em `/api/auth/*` (ver [CLAUDE.md §4](../../CLAUDE.md#4-padrões-de-segurança))
- Todos os endpoints exigem auth, **exceto** lista pública documentada aqui:
  - 

---

## Documentos Relacionados

- Schema do banco → [DATABASE.md](./DATABASE.md)
- Serviços externos → [INTEGRATIONS.md](./INTEGRATIONS.md)
- Decisões arquiteturais → [/docs/adrs/](../adrs/)
