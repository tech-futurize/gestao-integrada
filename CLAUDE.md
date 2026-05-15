# CLAUDE.md — Regras e Diretrizes do Projeto

> Este documento define **COMO** o projeto deve ser construído.
> Padrões de código, convenções, stack tecnológica, estrutura de pastas e regras de segurança.
> Todos os agentes e desenvolvedores devem seguir estas diretrizes sem exceção.

---

## 1. Identidade

- **Nome do Projeto:** Sistema de Gestão Integrada
- **Descrição curta:** Dashboard web para gestão integrada de projetos de engenharia e construção industrial (EPC)
- **Tipo:** SaaS B2B — Plataforma de gestão de obras
- **Repositório:** https://github.com/tech-futurize/gestao-de-contratos
- **Produção:** A definir
- **Staging:** A definir

---

## 2. Stack Tecnológica

> Nenhuma tecnologia fora desta lista deve ser introduzida sem aprovação do Architect.

- **Framework:** React 18.2 + Vite 6.1
- **Linguagem:** JavaScript (JSX) — o projeto NÃO usa TypeScript
- **Styling:** Tailwind CSS 3.x + tailwindcss-animate
- **UI Components:** Radix UI (primitivos) + shadcn/ui (components.json)
- **Animações:** Framer Motion 12.x
- **Backend/API:** Supabase (PostgreSQL + Auth + Storage)
- **Data Layer:** `src/api/supabaseEntities.js` — shim de compatibilidade que expõe `list/filter/create/update/delete` para cada entidade
- **Requisições:** TanStack React Query 5.x — `useQuery` / `useMutation`
- **Roteamento:** React Router DOM 7.x
- **Charts:** Recharts 2.x
- **Auth:** Supabase Auth (email/senha) via `AuthContext` + `ProtectedRoute`
- **Hosting:** A definir (Dockerfile presente — imagem Docker pronta)
- **Path alias:** `@` → `./src`

---

## 3. Convenções de Código

### Naming

- Componentes: `PascalCase` (ex: `UserProfile.jsx`)
- Funções e variáveis: `camelCase` (ex: `getUserData`)
- Constantes de configuração: `UPPER_SNAKE_CASE` (ex: `TABLE_MAP`)
- Arquivos de página: `PascalCase` (ex: `Dashboard.jsx`)
- Arquivos de componente: `PascalCase` por domínio (ex: `CasosList.jsx`)

### Estrutura de Arquivos

- Um componente por arquivo
- Hooks customizados em `/src/hooks/` com prefixo `use`
- Utils em `/src/utils/` e `/src/lib/`
- Entidades (queries Supabase) em `/src/api/supabaseEntities.js`
- Componentes por domínio em `/src/components/<dominio>/`

### JavaScript

- Sem TypeScript — usar JSDoc para documentar tipos quando necessário
- Preferir funções arrow para componentes e handlers
- Sem `console.log` em produção

### Imports

- Ordem: 1) React → 2) Libs externas → 3) Componentes → 4) Utils/lib → 5) Assets
- Usar path alias `@/` para todos os imports internos (nunca `../../..`)
- Exemplo: `import { entities } from "@/api/supabaseEntities"`

### Data Fetching

- **SEMPRE** usar `useQuery` / `useMutation` do React Query — nunca `useEffect` + `fetch` direto
- `queryKey` deve incluir `selectedProjectId` quando a query é por projeto
- `enabled: !!selectedProjectId` para queries que dependem de projeto selecionado
- Filtro de projeto via `entities.X.filter({ projeto_id: selectedProjectId })`

### Projeto Ativo

- **SEMPRE** usar `useProject()` de `@/lib/ProjectContext` para obter `selectedProjectId`
- **NUNCA** chamar `localStorage.getItem("selectedProjectId")` diretamente em componentes — viola DRY e dificulta testes (L006)
- Nunca hardcode de project ID
- Padrão: `const { selectedProjectId } = useProject()`

### Qualidade

- Todo componente interativo deve ter loading state (`isPending`), empty state e error state — desestruturar `{ data, isPending, isError }` de `useQuery`; nunca apenas `isLoading` sem tratar `isError` (L003)
- Nenhum mock data em produção — usar dados reais do Supabase
- Sem `// TODO`, `// FIXME` ou comentários temporários commitados
- Commits seguem Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`

### Drop de Módulo

Ao remover qualquer módulo da UI, verificar obrigatoriamente estes 6 pontos antes de fechar a task (L007):
1. Componentes (`src/components/<dominio>/`)
2. Página (`src/pages/`)
3. Rota em `App.jsx`
4. Item em `src/lib/navigationConfig.js`
5. Entidade em `src/api/supabaseEntities.js` (TABLE_MAP)
6. Referências no Dashboard e outros módulos (`grep -r "NomeModulo" src/`)

### Documentação

Ao refatorar qualquer módulo, incluir como subtarefa: "atualizar `docs/modulos/<X>.md`". Doc desatualizado é dívida técnica tão real quanto código morto (L008).

### Lições Aprendidas (obrigatório)

- Todo agente que encontrar um **erro relevante** registra uma entrada em `/docs/LESSONS.md` antes de fechar a task.
- O Architect relê `LESSONS.md` no início de cada `/milestone-start`.
- Lições recorrentes viram **regra explícita** aqui no CLAUDE.md no `/milestone-close`.

---

## 4. Padrões de Segurança

- Nunca hardcode secrets no código (Supabase URL/key, tokens)
- Todas as env vars sensíveis via `.env` (nunca commitado) — usar `.env.example` como template
- `VITE_` prefix apenas para vars que o browser precisa — DB_URL e GITHUB_TOKEN não devem ter `VITE_`
- RLS (Row Level Security) habilitado em todas as tabelas do Supabase
- Policies: usuários autenticados têm acesso total às tabelas do projeto
- Cookies de sessão gerenciados pelo Supabase Auth (HttpOnly, Secure)
- Logs nunca contêm tokens, senhas ou dados sensíveis

---

## 5. Performance

- React Query com stale-while-revalidate para cache de dados
- `enabled: false` em queries que não devem rodar sem projeto selecionado
- Componentes pesados (gráficos, tabelas grandes) com Suspense/lazy quando necessário
- Imagens: usar URLs do Supabase Storage com lazy loading

---

## 6. Estrutura de Pastas

```
/ (raiz)
├── CLAUDE.md             ← este arquivo
├── PROJECT.md            ← O QUE é o projeto
├── PLAN.md               ← O QUE fazer AGORA (VIVO)
├── README.md             ← Setup operacional
├── CONTRIBUTING.md       ← Guia de contribuição
├── .env.example          ← template de variáveis (commitado)
├── .env                  ← variáveis reais — NUNCA commitado
├── .gitignore
├── Dockerfile
├── package.json
├── vite.config.js
├── tailwind.config.js
├── components.json       ← shadcn/ui config
├── supabase-migration.sql ← schema completo do banco
├── supabase-seed.sql     ← dados de exemplo
│
├── /docs/
│   ├── AGENTS.md         ← agentes, prompts, responsabilidades
│   ├── WORKFLOWS.md      ← workflows detalhados
│   ├── LESSONS.md        ← lições aprendidas (VIVO)
│   ├── /modulos/         ← documentação dos módulos da aplicação
│   ├── /architecture/
│   │   ├── ARCHITECTURE.md
│   │   ├── DATABASE.md
│   │   └── INTEGRATIONS.md
│   ├── /design/
│   │   └── DESIGN.md
│   ├── /testing/
│   │   └── TESTING.md
│   ├── /adrs/
│   ├── /skills/
│   ├── /research/
│   └── /security/
│
├── /src/
│   ├── App.jsx           ← rotas e providers
│   ├── Layout.jsx        ← sidebar, header, seletor de projeto
│   ├── main.jsx
│   ├── /pages/           ← uma página por rota (Dashboard, Engenharia, etc.)
│   ├── /components/      ← componentes por domínio
│   │   ├── /casos/
│   │   ├── /contratos/
│   │   ├── /dashboard/
│   │   ├── /engenharia/
│   │   ├── /histograma/
│   │   ├── /mudancas/
│   │   ├── /planejamento/
│   │   ├── /qualidade/
│   │   ├── /rdo/
│   │   ├── /suprimentos/
│   │   └── /ui/          ← shadcn/ui components
│   ├── /api/
│   │   └── supabaseEntities.js ← data layer central
│   ├── /lib/
│   │   ├── supabaseClient.js
│   │   ├── AuthContext.jsx
│   │   └── ...
│   ├── /hooks/
│   └── /utils/
│
└── /Template/            ← templates de documentação (referência)
```

---

## 7. Documentos do Projeto

| Documento | Local | Tipo | Função |
|-----------|-------|------|--------|
| PROJECT.md | / (raiz) | Estático | O QUE é o projeto |
| CLAUDE.md | / (raiz) | Semi-estático | COMO construir |
| PLAN.md | / (raiz) | VIVO | O QUE fazer AGORA |
| README.md | / (raiz) | Estático | Setup operacional |
| DESIGN.md | /docs/design/ | Semi-estático | Design system e visual |
| ARCHITECTURE.md | /docs/architecture/ | Semi-estático | Camadas e comunicação |
| DATABASE.md | /docs/architecture/ | VIVO | Schema do banco |
| INTEGRATIONS.md | /docs/architecture/ | VIVO | Serviços externos |
| AGENTS.md | /docs/ | Semi-estático | Agentes, prompts e regras |
| WORKFLOWS.md | /docs/ | Semi-estático | Workflows detalhados |
| LESSONS.md | /docs/ | VIVO | Lições aprendidas |
| TESTING.md | /docs/testing/ | Semi-estático | Estratégia de testes |
| /docs/modulos/ | /docs/ | Semi-estático | Documentação dos módulos |
