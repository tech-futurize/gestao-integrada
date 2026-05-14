# PLAN.md — Sistema de Gestão Integrada

## Milestones Concluídos ✅

- **AI Agent Integration** — Mastra Framework integrado, 3 agentes com chat SSE, AgenteConfig
- **Design System & Dual Theme** — Temas claro/escuro em todas as telas, AnimatedThemeToggler, sidebar temática, paleta FuturizeNow
- **Nomenclatura (Casos → Pleitos)** — Arquivos, rotas e componentes renomeados; legado de `incidentes/` removido
- **Arquitetura de Navegação** — Sidebar accordion, 26 rotas `/modulo/submodulo`, tabs migradas para páginas independentes, GestaoMudancas unificada
- **QA Fixes Pós-Audit** — Links do Dashboard corrigidos, 8 componentes dead code removidos, `utils/index.ts` → `.js`, GestaoMudancas fetch otimizado, Skeletons adicionados em GestaoRiscos e ResumoGestaoRiscos

---

## Referência: Mapa de Rotas Ativo

| Módulo | Submódulo | URL |
|--------|-----------|-----|
| Dashboard | — | `/dashboard` |
| Engenharia | Documentos | `/engenharia/documentos` |
| Suprimentos | Mapa de Suprimentos | `/suprimentos/mapa` |
| Planejamento | Cronograma | `/planejamento/cronograma` |
| Planejamento | 6WLA | `/planejamento/6wla` |
| Planejamento | Take-Off | `/planejamento/take-off` |
| Planejamento | Histogramas | `/planejamento/histograma` |
| Planejamento | Avanços | `/planejamento/avancos` |
| Adm. Contratual | Contratos | `/admin-contratual/contratos` |
| Adm. Contratual | Medições | `/admin-contratual/medicoes` |
| Adm. Contratual | RDOs | `/admin-contratual/rdos` |
| Adm. Contratual | Registros | `/admin-contratual/registros` |
| Adm. Contratual | Pleitos | `/admin-contratual/pleitos` |
| Adm. Contratual | Mapa de Impacto | `/admin-contratual/mapa-impacto` |
| Riscos e Mudanças | Gestão de Riscos | `/riscos-mudancas/gestao-riscos` |
| Riscos e Mudanças | Gestão de Mudanças | `/riscos-mudancas/gestao-mudancas` |
| Agentes de IA | Executor de Dados | `/agentes/executor` |
| Agentes de IA | Analista de Negócio | `/agentes/analista-negocio` |
| Agentes de IA | Analista Contratual | `/agentes/analista-contratual` |
| Configurações | Gerenciar Projeto | `/configuracoes/gerenciar-projeto` |
| Configurações | Usuários | `/configuracoes/usuarios` |
| Configurações | Config. Agentes | `/configuracoes/agente-config` |

> **Removidos neste milestone:** `/suprimentos/requisicoes`, `/suprimentos/cotacoes`, `/qualidade/*` (módulo completo dropado).

---

## Milestone Atual: Refatoração Geral 2026-Q2

**Status:** 🟡 Em andamento — Fases 2–5 parcialmente completas (ver checkboxes)

**Objetivo:** Corrigir e evoluir todos os módulos do sistema com base no backlog aprovado pelo stakeholder: UI consistente, fluxo cronograma-centric, import/export universal, módulo Qualidade removido, cadastro Projetos/Usuários e agentes Mastra refinados.

**Decisões de arquitetura:**
- RBAC: Projetos + CRUD básico Usuários agora; permissões granulares em milestone futuro.
- Qualidade: DROP TABLE rncs, licoes_aprendidas, atas_reuniao + remoção total UI.
- Import/Export: componente genérico `<ImportExportDialog/>` + libs `xlsx` + `papaparse`.
- Agentes Mastra: milestone paralelo (Fase 5) dentro de `Agents Mastra/`.
- Unidades: tabela `unidades_medida` + FK em recursos/itens_takeof/commodities/itens_mas.
- Paginação: hook `usePaginatedQuery` server-side aplicado a todas as listas grandes.
- Histórico Engenharia e datas Aditivos: JSONB nos registros pai.

---

### Fase 0 — Preparação (Architect → Builder → Designer)

- [x] Architect: atualizar PLAN.md (este arquivo)
- [ ] Architect: remover páginas legadas duplicadas em `src/pages/` raiz
- [ ] Architect: atualizar `docs/architecture/DATABASE.md`, `ARCHITECTURE.md`, `docs/design/DESIGN.md`
- [ ] Builder: atualizar `src/api/supabaseEntities.js` (range/limit + novas entities)
- [x] Builder: criar `src/hooks/usePaginatedQuery.js`
- [x] Builder: instalar `xlsx` + `papaparse`; criar `src/components/ui/import-export-dialog.jsx`
- [ ] Designer: atualizar `docs/design/DESIGN.md` com tokens (botões verdes, paleta Mapa de Impacto)

### Fase 1 — Schema / Migration SQL (Builder)

- [ ] Builder: criar `supabase-migration-2026-q2.sql` com todas as alterações de schema (Drop Qualidade, unidades_medida, cronograma colunas, engenharia FK, suprimentos itens_mas, 6WLA FK, RDO tabela própria, registros simplificado, contratos/aditivos/medicoes, riscos, mudancas, plano_acao, usuarios, RLS)

### Fase 2 — Backend / Lógica (Builder, por módulo)

- [ ] Builder: Dashboard (widgets por módulo)
- [ ] Builder: Engenharia (modal edição, histórico revisões, deadline, import/export)
- [ ] Builder: Suprimentos (remover Requisições/Cotações, paginação, novos campos, import/export)
- [ ] Builder: Cronograma (colunas WBS, status calculado, hierarquia 9 níveis, filtro, import)
- [ ] Builder: 6WLA (vínculo cronograma, restrições 6 cat., semanas ativas, cards dashboard)
- [ ] Builder: Take-Off (limpeza, subtotal, semana ano, gráficos, import/export)
- [ ] Builder: Histograma (separar MO/Eq, colunas acumulado, bloqueio Real, import/export)
- [ ] Builder: Avanço (transposição, bloqueio, barras mensais, import/export)
- [ ] Builder: Contratos & Aditivos (tipo enum, formatação BR, aditivos 3 campos, datas dinâmicas)
- [ ] Builder: Medições (remover campos, Valor auto-soma, import/export)
- [x] Builder: RDO (disciplinas múltiplas via chips, vínculo tarefa_cronograma_id)
- [x] Builder: Registros (cards, filtros text/tipo/status, KPIs, excluir +Pleito e status Fechado)
- [x] Builder: Mapa de Impacto (nova paleta 6 níveis, corte texto categoria, radar tick)
- [ ] Builder: Drop Qualidade (rotas + componentes + entities)
- [ ] Builder: Riscos (impacto múltiplo, campos novos, cards, Plano de Ação dentro)
- [ ] Builder: Mudanças (tabela em vez de Kanban, campos, cards desvio)
- [ ] Builder: Configurações — CRUD Projetos + CRUD Usuários básico

### Fase 3 — Design / UI (Designer, por módulo)

- [x] Designer: tokens (botões verdes, paleta Mapa Impacto, cards Dashboard)
- [ ] Designer: Gantt (largura, baseline, escala sem Dias, botão 6WLA, filtro Status)
- [ ] Designer: `<ImportExportDialog/>` padronizado em 8 módulos
- [ ] Designer: Take-Off, Histograma, Avanço (cores, layout)
- [x] Designer: Mapa de Impacto (nova paleta 6 níveis, truncate categoria)
- [ ] Designer: Mudanças (tabela, cards)
- [x] Designer: Riscos/Mudanças (botões Salvar verdes — variant=save em RelacionamentoForm e RuidoForm)

### Fase 5 — Agentes Mastra (Builder, paralelo)

- [x] Builder (Mastra): Analista de Negócio — seção Integridade de Dados inviolável + estrutura 4-blocos
- [x] Builder (Mastra): Executor — formato 3-blocos (Consulta / Resultados / Resumo)
- [x] Builder (Mastra): Analista Contratual — perfil jurídico + Workflow inter-agente + [dado pendente]

### Fase 6 — QA & Segurança

- [ ] Tester: `/audit` por módulo + regressão fluxo cronograma→6WLA→histograma→avanço
- [ ] Builder: fix findings audit
- [ ] Security: `/security-scan` + validação RLS + Storage policies
- [ ] Builder: fix findings Critical/High
- [ ] Tester: `/audit` final

### Fase 7 — Fechamento (Architect)

- [x] Architect: atualizar PLAN.md (checkboxes e status do milestone — 2026-05-14)

---

## Como Rodar

```bash
# Terminal 1 — Mastra (porta 4111)
cd "Agents Mastra"
npm run dev

# Terminal 2 — React App (porta 5173)
npm run dev
```
