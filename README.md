# Sistema de Gestão Integrada

Plataforma web para gerenciamento integrado de projetos de engenharia e construção industrial (EPC). Centraliza cronograma, suprimentos, avanço físico, qualidade, pleitos contratuais e riscos em um único sistema multiempresa.

---

## Pré-requisitos

- Node.js 22.13.0+
- npm 9+ (ou pnpm)
- Conta no [Supabase](https://supabase.com) com projeto criado

## Setup Rápido

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/tech-futurize/gestao-de-contratos
   cd gestao-integrada
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```
   > O `postinstall` instala automaticamente as dependências de `Agents Mastra/` — nenhum `cd` necessário.

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   Abra `.env.local` e preencha os valores. Veja a seção "Variáveis de Ambiente" abaixo.

4. **Configure o banco de dados:**
   - No painel do Supabase, vá em SQL Editor
   - Execute o conteúdo de `supabase-migration.sql` (schema inicial — cria as tabelas base + RLS)
   - Execute o conteúdo de `supabase-migration-2026-q2.sql` (Refatoração Q2 — novas tabelas, drops, alters)
   - Execute o conteúdo de `supabase-seed.sql` (dados de exemplo para todos os projetos)

5. **Rode o projeto:**
   ```bash
   npm run dev
   ```
   Sobe simultaneamente o app React em `:5173` e o servidor Mastra (agentes IA) em `:4111`.
   O output é prefixado por `[VITE]` e `[MASTRA]`. `Ctrl+C` encerra os dois.

6. **Acesse:** [http://localhost:5173](http://localhost:5173)

---

## Variáveis de Ambiente

| Variável | Descrição | Onde conseguir |
|----------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima JWT | Supabase → Project Settings → API |
| `GITHUB_TOKEN` | Token de acesso ao repositório | GitHub → Settings → Developer settings → PAT |
| `OPENAI_API_KEY` | API key OpenAI (usada pelos agentes Mastra) | platform.openai.com → API keys |

> ⚠️ O arquivo `.env.local` nunca deve ser commitado. Use `.env.example` como template.
> Variáveis com prefixo `VITE_` são expostas ao browser — nunca coloque secrets nelas.
> `GITHUB_TOKEN` não deve ter prefixo `VITE_` e deve ser migrado para CI/CD secrets.

---

## Scripts Disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe Vite (:5173) **e** Mastra (:4111) simultaneamente |
| `npm run dev:vite` | Só o app React (sem Mastra) |
| `npm run dev:mastra` | Só o servidor Mastra (sem Vite) |
| `npm run build` | Build de produção em `/dist/` |
| `npm run build:mastra` | Build de produção do servidor Mastra |
| `npm run preview` | Roda o build de produção localmente |
| `npm run lint` | Verifica erros de lint com ESLint |

---

## Módulos do Sistema

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | KPIs consolidados de todos os módulos |
| Engenharia / Documentos | `/engenharia/documentos` | Gestão documental — emissão, revisão, aprovação, histórico |
| Suprimentos / Mapa | `/suprimentos/mapa` | Mapa de acompanhamento de suprimentos (MAS) |
| Planejamento / Cronograma | `/planejamento/cronograma` | Gantt WBS 9 níveis, baseline, filtro status |
| Planejamento / 6WLA | `/planejamento/6wla` | Look-ahead 6 semanas vinculado ao cronograma |
| Planejamento / Take-Off | `/planejamento/take-off` | Quantitativos por disciplina, import/export |
| Planejamento / Histogramas | `/planejamento/histograma` | MO e equipamentos por mês com acumulados |
| Planejamento / Avanços | `/planejamento/avancos` | Avanço físico previsto × real × projetado |
| Adm. Contratual / Contratos | `/admin-contratual/contratos` | Contratos + aditivos com datas calculadas |
| Adm. Contratual / Medições | `/admin-contratual/medicoes` | Medições com itens e soma automática |
| Adm. Contratual / RDOs | `/admin-contratual/rdos` | Relatório Diário de Obra |
| Adm. Contratual / Registros | `/admin-contratual/registros` | Ocorrências e notificações |
| Adm. Contratual / Pleitos | `/admin-contratual/pleitos` | Pleitos contratuais com plano de ação |
| Adm. Contratual / Mapa de Impacto | `/admin-contratual/mapa-impacto` | Heatmap 6 níveis Contratada × Contratante |
| Riscos e Mudanças / Gestão de Riscos | `/riscos-mudancas/gestao-riscos` | Riscos com impacto múltiplo e plano de ação |
| Riscos e Mudanças / Gestão de Mudanças | `/riscos-mudancas/gestao-mudancas` | Mudanças contratuais em tabela |
| Agentes de IA (3 agentes Mastra) | `/agentes/*` | Executor, Analista de Negócio, Analista Contratual |
| Configurações | `/configuracoes/*` | Usuários, Gerenciar Projeto, Config. Agentes |

> **Mastra (agentes de IA):** sobe automaticamente com `npm run dev` junto com o app React. Para rodar só o Mastra: `npm run dev:mastra`.

---

## Documentos do Projeto

| Precisa saber... | Leia |
|-------------------|------|
| O que é o projeto | [PROJECT.md](./PROJECT.md) |
| Como construir | [CLAUDE.md](./CLAUDE.md) |
| O que fazer agora | [PLAN.md](./PLAN.md) |
| Como contribuir | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Agentes e responsabilidades | [/docs/AGENTS.md](./docs/AGENTS.md) |
| Arquitetura técnica | [/docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) |
| Schema do banco | [/docs/architecture/DATABASE.md](./docs/architecture/DATABASE.md) |
| Serviços externos | [/docs/architecture/INTEGRATIONS.md](./docs/architecture/INTEGRATIONS.md) |
| Documentação dos módulos | [/docs/modulos/00-Indice.md](./docs/modulos/00-Indice.md) |

> Índice canônico completo: [CLAUDE.md §7](./CLAUDE.md#7-documentos-do-projeto).
