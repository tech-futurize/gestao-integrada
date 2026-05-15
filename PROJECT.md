# PROJECT.md — Identidade do Projeto

> Este é o primeiro documento que qualquer pessoa deve ler ao acessar este repositório.
> Descreve **O QUE** está sendo construído e **POR QUÊ**.

---

## Visão

O **Sistema de Gestão Integrada** é uma plataforma web centralizada para gerenciamento de projetos de engenharia e construção industrial (EPC). Quando maduro, será o sistema único que gestores de obra e engenheiros usam para controlar cronograma, suprimentos, avanço físico, qualidade, pleitos contratuais e riscos — eliminando planilhas dispersas e relatórios manuais.

## Problema

Projetos de construção industrial são gerenciados com ferramentas fragmentadas: planilhas Excel para cronograma, e-mail para pleitos, sistemas separados para suprimentos e qualidade. Isso gera retrabalho, informação desatualizada, dificuldade em rastrear impactos cruzados entre módulos (ex: um atraso de suprimento que vira um pleito) e tomada de decisão lenta.

## Proposta de Valor

Plataforma integrada onde todos os módulos do projeto (Engenharia, Suprimentos, Planejamento, Avanço Físico, Pleitos, Riscos e Mudanças) estão conectados em um único sistema multiempresa, com dados em tempo real via Supabase, filtráveis por projeto ativo.

---

## Público-Alvo

- **Primário:** Gerentes de projeto e coordenadores de obras em empresas de engenharia/EPC (10–200 funcionários)
- **Secundário:** Diretores e clientes que consomem dashboards executivos e relatórios
- **Persona:** "Carlos, 42 anos, gerente de projeto sênior em empresa EPC, gerencia 2–4 obras simultâneas, hoje usa 6 planilhas diferentes e perde horas toda semana consolidando dados para relatórios para o cliente"

---

## Módulos do Sistema

| Domínio | Módulo | Rota | Descrição |
|---------|--------|------|-----------|
| — | Dashboard | `/dashboard` | Visão consolidada de todos os módulos com KPIs por área |
| Engenharia | Documentos | `/engenharia/documentos` | Gestão documental — emissão, revisão, aprovação, histórico |
| Suprimentos | Mapa de Suprimentos | `/suprimentos/mapa` | Mapa de acompanhamento de suprimentos (MAS) com paginação |
| Planejamento | Cronograma | `/planejamento/cronograma` | Gantt WBS 9 níveis, baseline, filtro status |
| Planejamento | 6WLA | `/planejamento/6wla` | Look-ahead 6 semanas vinculado ao cronograma |
| Planejamento | Take-Off | `/planejamento/take-off` | Quantitativos por disciplina, gráficos, import/export |
| Planejamento | Histogramas | `/planejamento/histograma` | MO e Equipamentos por mês, acumulados, bloqueio Real |
| Planejamento | Avanços | `/planejamento/avancos` | Avanço físico previsto × real × projetado por semana/mês |
| Adm. Contratual | Contratos | `/admin-contratual/contratos` | Contratos + aditivos + datas atuais calculadas |
| Adm. Contratual | Medições | `/admin-contratual/medicoes` | Medições vinculadas a contratos com itens (soma auto) |
| Adm. Contratual | RDOs | `/admin-contratual/rdos` | Relatório Diário de Obra — disciplinas, MO, equipamentos |
| Adm. Contratual | Registros | `/admin-contratual/registros` | Ocorrências e notificações com cards KPI e filtros |
| Adm. Contratual | Pleitos | `/admin-contratual/pleitos` | Pleitos contratuais com plano de ação integrado |
| Adm. Contratual | Mapa de Impacto | `/admin-contratual/mapa-impacto` | Heatmap de impacto 6 níveis (Contratada × Contratante) |
| Riscos e Mudanças | Gestão de Riscos | `/riscos-mudancas/gestao-riscos` | Riscos com impacto múltiplo e plano de ação |
| Riscos e Mudanças | Gestão de Mudanças | `/riscos-mudancas/gestao-mudancas` | Mudanças em tabela com cards de desvio |
| Agentes de IA | Executor de Dados | `/agentes/executor` | Agente Mastra para consultas ao banco em linguagem natural |
| Agentes de IA | Analista de Negócio | `/agentes/analista-negocio` | Análise integrada de dados reais (Mastra AI) |
| Agentes de IA | Analista Contratual | `/agentes/analista-contratual` | Análise jurídico-contratual com workflow inter-agente |
| Configurações | Usuários | `/configuracoes/usuarios` | CRUD básico de usuários — listar, criar, editar, desativar |
| Configurações | Gerenciar Projeto | `/configuracoes/gerenciar-projeto` | Ficha técnica do projeto, documentos contratuais |
| Configurações | Config. Agentes | `/configuracoes/agente-config` | Configuração de perfis e parâmetros dos agentes de IA |

---

## Escopo — MVP

### Incluso no MVP

- Autenticação via Supabase Auth (email/senha)
- Multi-projeto: seletor de projeto ativo na sidebar
- 22 módulos/submódulos ativos com dados reais do Supabase
- 3 Agentes de IA via Mastra Framework (SSE, porta 4111)
- Dual theme claro/escuro com AnimatedThemeToggler
- Import/Export (XLSX/CSV) em 8+ módulos
- Cadastro básico de usuários (CRUD)
- Build Docker para deploy

### Fora do MVP (backlog futuro)

- Notificações em tempo real (Supabase Realtime)
- Exportação de relatórios PDF
- RBAC granular por usuário/projeto/módulo
- App mobile
- Integração com ERP/SAP
- Importação de RDO via PDF

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
