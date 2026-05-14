# PLAN.md — Sistema de Gestão Integrada

## Milestones Concluídos ✅

- **AI Agent Integration** — Mastra Framework integrado, 3 agentes com chat SSE, AgenteConfig
- **Design System & Dual Theme** — Temas claro/escuro em todas as telas, AnimatedThemeToggler, sidebar temática, paleta FuturizeNow
- **Nomenclatura (Casos → Pleitos)** — Arquivos, rotas e componentes renomeados; legado de `incidentes/` removido
- **Arquitetura de Navegação** — Sidebar accordion, rotas `/modulo/submodulo`, tabs migradas para páginas independentes, GestaoMudancas unificada
- **QA Fixes Pós-Audit** — Links do Dashboard corrigidos, 8 componentes dead code removidos, `utils/index.ts` → `.js`, GestaoMudancas fetch otimizado, Skeletons adicionados em GestaoRiscos e ResumoGestaoRiscos
- **Refatoração Geral 2026-Q2** — Todos os módulos refatorados, nova estrutura de páginas por domínio, migration SQL, import/export, agentes Mastra refinados

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
| Configurações | Usuários | `/configuracoes/usuarios` |
| Configurações | Gerenciar Projeto | `/configuracoes/gerenciar-projeto` |
| Configurações | Config. Agentes | `/configuracoes/agente-config` |

> **Removidos neste milestone:** `/suprimentos/requisicoes`, `/suprimentos/cotacoes`, `/qualidade/*` (módulo completo dropado).

---

## Milestone Atual: Pendências + QA + Documentação

**Status:** 🟡 Pendências fechadas — próximo: QA & Segurança

**Objetivo:** Fechar as 2 pendências reais identificadas na conferência de 2026-05-14, executar QA completo e atualizar toda a documentação do projeto.

---

### Fase Pendentes — Itens não concluídos da Refatoração 2026-Q2

- [x] Builder: Criar `src/pages/Configuracoes/Usuarios.jsx` com CRUD básico (listar, criar, editar, desativar usuários) + adicionar rota `/configuracoes/usuarios` em `App.jsx`
- [x] Builder: Remover entities legadas de Qualidade de `src/api/supabaseEntities.js` — linhas com `RNC`, `LicaoAprendida`, `AtaReuniao`

---

### Fase QA & Segurança

- [ ] Tester: `/audit` por módulo — cobrir todos os 21 módulos/submódulos ativos
- [ ] Tester: regressão do fluxo principal: cronograma → 6WLA → histograma → avanço
- [ ] Builder: fix findings de audit
- [ ] Security: `/security-scan` — validação RLS nas novas tabelas da migration 2026-Q2 + Storage policies (RDO evidências)
- [ ] Builder: fix findings Critical/High do security-scan
- [ ] Tester: `/audit` final — confirmar scores ≥ 9

---

### Fase Documentação — Executada por último, após QA aprovado

Atualizar toda a documentação do projeto para refletir o estado pós-Refatoração 2026-Q2.

**Architect:**
- [ ] Atualizar `PROJECT.md` — tabela de módulos (remover Qualidade, corrigir rotas, refletir estrutura atual)
- [ ] Atualizar `README.md` — tabela de módulos e seções desatualizadas
- [ ] Atualizar `docs/architecture/ARCHITECTURE.md` — adicionar `ProjectContext` no diagrama de camadas; substituir referências a `localStorage` direto por `useProject()`; documentar nova estrutura `src/pages/<dominio>/`
- [ ] Atualizar `docs/architecture/DATABASE.md` — refletir schema da `supabase-migration-2026-q2.sql` (novas tabelas, drops, FKs, RLS)
- [ ] Atualizar `docs/design/DESIGN.md` — tokens atuais (botões verdes, paleta Mapa de Impacto, dual theme)
- [ ] Reescrever `docs/modulos/00-Indice.md` — substituir Base44 por Supabase, atualizar rotas e entidades

**Builder (por módulo — reescrever docs/modulos/):**
- [ ] `01-Dashboard.md` — widgets por módulo, rotas corretas
- [ ] `02-Registros.md` — novo layout cards + filtros, rota `/admin-contratual/registros`
- [ ] `03-Pleitos.md` — rota `/admin-contratual/pleitos`, PlanoAcao dentro
- [ ] `04-PlanosDeAcao.md` — módulo removido ou redefinido → atualizar conforme estado atual
- [ ] `05-Financeiro.md` — módulo removido (redirecionado para Avanços) → marcar como Removido ou deletar
- [ ] `06-Histograma.md` — nova estrutura MO/Eq separados, rota `/planejamento/histograma`
- [ ] `07-AvancoFisico.md` — transposição de tabela, rota `/planejamento/avancos`
- [ ] `08-GestaoMudancas.md` — formato tabela (não Kanban), rota `/riscos-mudancas/gestao-mudancas`
- [ ] `09-Contratos.md` — aditivos, formatação BR, rota `/admin-contratual/contratos`
- [ ] `10-Suprimentos.md` — Requisições/Cotações removidos, rota `/suprimentos/mapa`
- [ ] `11-Cronograma.md` — colunas WBS, status calculado, rota `/planejamento/cronograma`
- [ ] `12-Planejamento.md` — renomear/subdividir conforme novos submódulos (6WLA, Take-Off)
- [ ] `13-GestaoRiscos.md` — impacto múltiplo, PlanoAcao integrado, rota `/riscos-mudancas/gestao-riscos`
- [ ] `14-GerenciarProjeto.md` — rota `/configuracoes/gerenciar-projeto`
- [ ] `15-Relacionamentos.md` → Verificar se módulo ainda existe; marcar como Removido se aplicável
- [ ] `16-Rotinas.md` → Verificar se módulo ainda existe; marcar como Removido se aplicável
- [ ] `17-Notificacoes.md` → Verificar se módulo ainda existe; marcar como Removido se aplicável
- [ ] Criar `18a-Engenharia.md` — rota `/engenharia/documentos`, modal edição, histórico revisões
- [ ] Criar `19-Agentes.md` — 3 agentes Mastra, rotas, perfis e workflows
- [ ] Criar `20-RDO.md` — disciplinas múltiplas, vínculo cronograma, evidências, rota `/admin-contratual/rdos`
- [ ] Criar `21-MapaImpacto.md` — nova paleta 6 níveis, rota `/admin-contratual/mapa-impacto`
- [ ] Criar `22-SixWLA.md` — vínculo cronograma, 6 categorias restrição, rota `/planejamento/6wla`
- [ ] Criar `23-TakeOff.md` — subtotal, gráficos, import/export, rota `/planejamento/take-off`
- [ ] Criar `24-Medicoes.md` — Valor auto-soma, import/export, rota `/admin-contratual/medicoes`
- [ ] Criar `25-Usuarios.md` — CRUD básico, rota `/configuracoes/usuarios` (após Fase Pendentes)

**Architect — fechamento:**
- [ ] Atualizar `docs/LESSONS.md` — registrar lições do milestone Refatoração 2026-Q2
- [ ] Executar `/milestone-close` — promover lições recorrentes a regras em `CLAUDE.md`

---

## Referência: Histórico de Refatoração 2026-Q2

### Fases concluídas (conferência 2026-05-14)

**Fase 0 — Preparação**
- [x] Architect: atualizar PLAN.md
- [x] Architect: remover páginas legadas de `src/pages/` raiz (Casos, Cronograma, Histograma, AvancoFisico, Planejamento, Suprimentos, GestaoMudancas, GestaoRiscos, GerenciarProjeto, Financeiro, Incidentes, Qualidade, Agente, AgenteConfig)
- [x] Builder: atualizar `src/api/supabaseEntities.js` (novas entities)
- [x] Builder: criar `src/hooks/usePaginatedQuery.js`
- [x] Builder: instalar `xlsx` + `papaparse`; criar `src/components/ui/import-export-dialog.jsx`

**Fase 1 — Schema**
- [x] Builder: criar `supabase-migration-2026-q2.sql`

**Fase 2 — Backend / Lógica**
- [x] Builder: Dashboard (widgets por módulo)
- [x] Builder: Engenharia (modal edição, histórico revisões, deadline, import/export)
- [x] Builder: Suprimentos (Requisições/Cotações removidos, paginação, novos campos)
- [x] Builder: Cronograma (colunas WBS, status calculado, hierarquia 9 níveis, filtro, import)
- [x] Builder: 6WLA (vínculo cronograma, restrições 6 cat., semanas ativas, cards)
- [x] Builder: Take-Off (limpeza, subtotal, semana ano, gráficos, import/export)
- [x] Builder: Histograma (MO/Eq separados, colunas acumulado, bloqueio Real, import/export)
- [x] Builder: Avanço (transposição, bloqueio, barras mensais, import/export)
- [x] Builder: Contratos & Aditivos (tipo enum, formatação BR, aditivos 3 campos, datas dinâmicas)
- [x] Builder: Medições (campos removidos, Valor auto-soma, import/export)
- [x] Builder: RDO (disciplinas múltiplas via chips, vínculo tarefa_cronograma_id)
- [x] Builder: Registros (cards KPIs, filtros text/tipo/status, excluir +Pleito e status Fechado)
- [x] Builder: Mapa de Impacto (nova paleta 6 níveis, corte texto categoria, radar tick)
- [x] Builder: Drop Qualidade — rotas + componentes UI + páginas removidos *(entities em supabaseEntities.js pendentes — ver Fase Pendentes)*
- [x] Builder: Riscos (impacto múltiplo, campos novos, cards, Plano de Ação integrado)
- [x] Builder: Mudanças (tabela em vez de Kanban, campos, cards desvio)
- [x] Builder: Configurações — CRUD Projetos / GerenciarProjeto *(CRUD Usuários pendente — ver Fase Pendentes)*

**Fase 3 — Design / UI**
- [x] Designer: tokens (botões verdes, paleta Mapa Impacto, cards Dashboard)
- [x] Designer: Gantt (largura, baseline, escala sem Dias, botão 6WLA, filtro Status)
- [x] Designer: `<ImportExportDialog/>` padronizado nos módulos
- [x] Designer: Take-Off, Histograma, Avanço (cores, layout)
- [x] Designer: Mapa de Impacto (nova paleta 6 níveis, truncate categoria)
- [x] Designer: Mudanças (tabela, cards desvio)
- [x] Designer: Riscos/Mudanças (botões Salvar verdes)

**Fase 5 — Agentes Mastra**
- [x] Builder: Analista de Negócio — seção Integridade de Dados inviolável + estrutura 4-blocos
- [x] Builder: Executor — formato 3-blocos (Consulta / Resultados / Resumo)
- [x] Builder: Analista Contratual — perfil jurídico + Workflow inter-agente

---

## Como Rodar

```bash
# Terminal 1 — Mastra (porta 4111)
cd "Agents Mastra"
npm run dev

# Terminal 2 — React App (porta 5173)
npm run dev
```
