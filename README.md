# Sistema de Gestão Integrada

Plataforma web para gerenciamento integrado de projetos de engenharia e construção industrial (EPC). Centraliza cronograma, suprimentos, avanço físico, qualidade, pleitos contratuais e riscos em um único sistema multiempresa.

---

## Pré-requisitos

- Node.js 18+
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

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   Abra `.env.local` e preencha os valores. Veja a seção "Variáveis de Ambiente" abaixo.

4. **Configure o banco de dados:**
   - No painel do Supabase, vá em SQL Editor
   - Execute o conteúdo de `supabase-migration.sql` (cria as 25 tabelas + RLS)
   - Execute o conteúdo de `supabase-seed.sql` (dados de exemplo para todos os projetos)

5. **Rode o projeto:**
   ```bash
   npm run dev
   ```

6. **Acesse:** [http://localhost:5173](http://localhost:5173)

---

## Variáveis de Ambiente

| Variável | Descrição | Onde conseguir |
|----------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima JWT | Supabase → Project Settings → API |
| `GITHUB_TOKEN` | Token de acesso ao repositório | GitHub → Settings → Developer settings → PAT |

> ⚠️ O arquivo `.env.local` nunca deve ser commitado. Use `.env.example` como template.
> Variáveis com prefixo `VITE_` são expostas ao browser — nunca coloque secrets nelas.
> `GITHUB_TOKEN` não deve ter prefixo `VITE_` e deve ser migrado para CI/CD secrets.

---

## Scripts Disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Roda em desenvolvimento (localhost:5173) |
| `npm run build` | Build de produção em `/dist/` |
| `npm run preview` | Roda o build de produção localmente |
| `npm run lint` | Verifica erros de lint com ESLint |

---

## Módulos do Sistema

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/Dashboard` | KPIs consolidados de todos os módulos |
| Engenharia | `/Engenharia` | Gestão documental — emissão, revisão e aprovação |
| Suprimentos | `/Suprimentos` | Requisições, cotações e mapa de suprimentos (MAS) |
| Planejamento | `/Planejamento` | Cronograma, 6WLA, Take-Off, Contratos, Medições, RDO |
| Histograma | `/Histograma` | Controle de mão de obra e equipamentos |
| Avanço | `/AvancoFisico` | Avanço físico e financeiro previsto vs. realizado |
| Pleitos | `/Pleitos` | Pleitos contratuais, registros e mapa de impacto |
| Qualidade | `/PlanosDeAcao` | RNCs, planos de ação corretiva e lições aprendidas |
| Gestão de Mudanças | `/GestaoMudancas` | Workflow de mudanças contratuais e termômetro |
| Gestão de Riscos | `/GestaoRiscos` | Identificação e monitoramento de riscos |

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
