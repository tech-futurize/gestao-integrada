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
Cada arquivo = uma rota, organizado por domínio: `Planejamento/`, `AdminContratual/`, `RiscosMudancas/`, `Engenharia/`, `Suprimentos/`, `Agentes/`, `Configuracoes/`. As páginas usam `useProject()` do `ProjectContext` para obter `selectedProjectId`, chamam `useQuery`/`useMutation` e chamam `entities.X.*()`.

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
| `ProjectContext` (`useProject()`) | `selectedProjectId` — hook reativo em `src/lib/ProjectContext.jsx`; lê/escreve `localStorage` em um único ponto |
| `localStorage` | Persiste `selectedProjectId` e `theme` entre sessões |
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
| 005 | `usePaginatedQuery` hook server-side via Supabase `.range()` | Evita carregar listas completas; padrão aplicado a todas as listas grandes |
| 006 | `<ImportExportDialog/>` genérico + `xlsx` + `papaparse` | Reutilização em 8 módulos; consistência visual e de mapeamento |
| 007 | RDO desacoplado de `incidentes` em tabela própria | `incidentes` acumulou colunas de dois domínios; desacoplamento simplifica queries e RLS |
| 008 | `plano_acao` genérico (substitui `acoes`) | `acoes` era exclusiva de `casos`; plano de ação deve vincular riscos e mudanças |
| 009 | Datas "Atuais" de contrato calculadas no front | Evita trigger/view; datas derivadas de `Σ(aditivos.prazo_dias)` são simples de computar |
| 010 | `unidades_medida` como tabela lookup global sem `projeto_id` | Consistência entre módulos; permite adicionar unidades sem migration futura |
| 011 | Histórico de revisões via `jsonb` em `documentos_engenharia` | Campo `historico_revisoes` já existia; append simples sem tabela de log extra |
| 012 | Agentes Mastra em projeto paralelo `agents-mastra/` via HTTP | Isolamento de runtime (Node/TS vs Vite/JS); comunicação SSE na porta 4111 |
| 013 | `ProjectContext` + `useProject()` encapsulam `localStorage.getItem("selectedProjectId")` | Leitura direta ao `localStorage` espalhada em cada página dificulta testes e refactoring; hook único é o ponto de verdade |
| 014 | Estrutura `src/pages/<dominio>/` (subpastas por domínio) | Evita crescimento ilimitado do diretório `pages/`; cada domínio tem suas páginas e é fácil localizar e navegar |

> **Ownership:** Architect | **Consultado por:** Todos os agentes

---

## Documentos Relacionados

- Schema do banco → [DATABASE.md](./DATABASE.md)
- Serviços externos → [INTEGRATIONS.md](./INTEGRATIONS.md)
- Decisões arquiteturais → [/docs/adrs/](../adrs/)
