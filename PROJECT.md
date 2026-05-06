# PROJECT.md — Identidade do Projeto

> Este é o primeiro documento que qualquer pessoa deve ler ao acessar este repositório.
> Descreve **O QUE** está sendo construído e **POR QUÊ**.

---

## Visão

O **Sistema de Gestão Integrada** é uma plataforma web centralizada para gerenciamento de projetos de engenharia e construção industrial (EPC). Quando maduro, será o sistema único que gestores de obra e engenheiros usam para controlar cronograma, suprimentos, avanço físico, qualidade, pleitos contratuais e riscos — eliminando planilhas dispersas e relatórios manuais.

## Problema

Projetos de construção industrial são gerenciados com ferramentas fragmentadas: planilhas Excel para cronograma, e-mail para pleitos, sistemas separados para suprimentos e qualidade. Isso gera retrabalho, informação desatualizada, dificuldade em rastrear impactos cruzados entre módulos (ex: um atraso de suprimento que vira um pleito) e tomada de decisão lenta.

## Proposta de Valor

Plataforma integrada onde todos os módulos do projeto (Engenharia, Suprimentos, Planejamento, Avanço, Qualidade, Pleitos, Riscos) estão conectados em um único sistema multiempresa, com dados em tempo real via Supabase, filtráveis por projeto ativo.

---

## Público-Alvo

- **Primário:** Gerentes de projeto e coordenadores de obras em empresas de engenharia/EPC (10–200 funcionários)
- **Secundário:** Diretores e clientes que consomem dashboards executivos e relatórios
- **Persona:** "Carlos, 42 anos, gerente de projeto sênior em empresa EPC, gerencia 2–4 obras simultâneas, hoje usa 6 planilhas diferentes e perde horas toda semana consolidando dados para relatórios para o cliente"

---

## Módulos do Sistema

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/Dashboard` | Visão consolidada de todos os módulos com KPIs |
| Engenharia | `/Engenharia` | Gestão documental — emissão, revisão e aprovação de documentos |
| Suprimentos | `/Suprimentos` | Requisições de compra, cotações e mapa de suprimentos (MAS) |
| Planejamento | `/Planejamento` | Cronograma, 6WLA, Take-Off, Contratos, Medições, RDO |
| Histograma | `/Histograma` | Controle de mão de obra e equipamentos por período |
| Avanço | `/AvancoFisico` | Avanço físico e financeiro previsto vs. realizado |
| Pleitos | `/Pleitos` | Gestão de pleitos contratuais, registros e mapa de impacto |
| Qualidade | `/PlanosDeAcao` | RNCs, planos de ação corretiva e lições aprendidas |
| Gestão de Mudanças | `/GestaoMudancas` | Workflow de mudanças contratuais, termômetro e dashboard |
| Gestão de Riscos | `/GestaoRiscos` | Identificação e monitoramento de riscos do projeto |

---

## Escopo — MVP

### Incluso no MVP

- Autenticação via Supabase Auth (email/senha)
- Multi-projeto: seletor de projeto ativo na sidebar
- Todos os 10 módulos listados acima funcionais com dados reais do Supabase
- Seed de dados de exemplo para demonstração
- Build Docker para deploy

### Fora do MVP (backlog futuro)

- Notificações em tempo real (Supabase Realtime)
- Exportação de relatórios PDF
- Controle de permissões por usuário/projeto
- App mobile
- Integração com ERP/SAP

---

## Requisitos Funcionais

- **RF01:** Usuário autenticado pode selecionar projeto ativo na sidebar; todos os dados são filtrados pelo projeto selecionado
- **RF02:** Cada módulo exibe dados do Supabase filtrados por `projeto_id` via React Query
- **RF03:** Dados criados/editados em qualquer módulo persistem imediatamente no Supabase (sem mock data)
- **RF04:** Sistema funciona em múltiplos projetos simultâneos sem conflito de dados
- **RF05:** Build de produção (`npm run build`) deve passar sem erros

## Requisitos Não-Funcionais

- **RNF01: Performance** — React Query com cache; queries paginadas para tabelas grandes
- **RNF02: Segurança** — RLS habilitado em todas as tabelas; secrets nunca no código
- **RNF03: Disponibilidade** — Supabase SLA (99.9% uptime)
- **RNF04: Escalabilidade** — Multi-tenant por projeto; sem limite de projetos por instância

---

## Modelo de Negócio

- **Tipo:** SaaS B2B — ferramenta interna da Futurize para seus projetos de engenharia
- **Monetização:** Uso interno (não comercializado externamente no MVP)

---

## Documentos Relacionados

| Precisa saber... | Leia |
|-------------------|------|
| Como construir | [CLAUDE.md](./CLAUDE.md) |
| O que fazer agora | [PLAN.md](./PLAN.md) |
| Como rodar o projeto | [README.md](./README.md) |
| Agentes e responsabilidades | [/docs/AGENTS.md](./docs/AGENTS.md) |
| Arquitetura técnica | [/docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) |
| Schema do banco | [/docs/architecture/DATABASE.md](./docs/architecture/DATABASE.md) |
| Documentação dos módulos | [/docs/modulos/00-Indice.md](./docs/modulos/00-Indice.md) |
