# PLAN.md — Sistema de Gestão Integrada

## Milestones Concluídos ✅

- **AI Agent Integration** — Mastra Framework integrado, 3 agentes com chat SSE, AgenteConfig
- **Design System & Dual Theme** — Temas claro/escuro em todas as telas, AnimatedThemeToggler, sidebar temática, paleta FuturizeNow
- **Nomenclatura (Casos → Pleitos)** — Arquivos, rotas e componentes renomeados; legado de `incidentes/` removido
- **Arquitetura de Navegação** — Sidebar accordion, rotas `/modulo/submodulo`, tabs migradas para páginas independentes, GestaoMudancas unificada
- **QA Fixes Pós-Audit** — Links do Dashboard corrigidos, 8 componentes dead code removidos, `utils/index.ts` → `.js`, GestaoMudancas fetch otimizado, Skeletons adicionados em GestaoRiscos e ResumoGestaoRiscos
- **Refatoração Geral 2026-Q2** — Todos os módulos refatorados, nova estrutura de páginas por domínio, migration SQL, import/export, agentes Mastra refinados
- **Pendências + Documentação 2026-Q2** *(2026-05-14)* — `Usuarios.jsx` + rota criados, entities Qualidade removidas do shim, 25 docs de módulos reescritos, ARCHITECTURE/DATABASE/PROJECT/README/CLAUDE.md atualizados, 3 lições (L006-L008) promovidas a regras em CLAUDE.md
- **Correções Engenharia 2026-Q2** *(2026-05-15)* — Migration SQL, tabela com novas colunas, modal de edição, histórico de versões em Dialog, import/export atualizado, doc atualizado

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

> **Removidos:** `/suprimentos/requisicoes`, `/suprimentos/cotacoes`, `/qualidade/*` (módulo completo dropado).

---

## Milestone Atual: Correções de Módulos 2026-Q2

**Status:** 🟡 Em andamento — prioridade: QA Engenharia (QA & Segurança em espera)

**Objetivo:** Validar o módulo Engenharia pós-refatoração e, quando liberado, executar ciclo QA & Segurança geral.

---

### Fase Smart Import Flow *(nova prioridade — executar antes do QA)*

> **Documento de referência (LEITURA OBRIGATÓRIA antes de executar):** `plano-smart-importflow.md` (raiz do projeto)
>
> O Builder DEVE abrir e seguir o documento detalhado integralmente — código completo, ordem de tasks e commits estão lá. Não improvisar.

- [ ] Builder: Task 1 — criar `src/components/ui/column-mapping-dialog.jsx`
- [ ] Builder: Task 2 — criar `src/components/ui/import-progress-dialog.jsx`
- [ ] Builder: Task 3 — criar `src/utils/importTypeValidator.js`
- [ ] Builder: Task 4 — refatorar `src/components/ui/import-export-dialog.jsx`
- [ ] Builder: Task 5 — atualizar `src/pages/Engenharia/Documentos.jsx`
- [ ] Builder: Task 6 — atualizar `src/pages/Planejamento/Cronograma.jsx`
- [ ] Builder: Task 7 — atualizar `src/pages/Planejamento/Avancos.jsx`
- [ ] Builder: Task 8 — atualizar `src/pages/Suprimentos/MapaSuprimentos.jsx`
- [ ] Builder: Task 9 — verificar módulos adicionais via `grep -r "ImportExportDialog" src/`
- [ ] Tester: Task 10 — smoke test manual conforme roteiro em `plano-smart-importflow.md`

---

### Fase QA Engenharia *(após Smart Import Flow concluído)*

- [ ] Tester: `/audit` no módulo Engenharia — validar tabela, modal de edição, histórico e import/export.
- [ ] Builder: fix findings do audit.

---

### Fase QA & Segurança ⏸ ON HOLD — não executar

> **⚠ BLOQUEADO POR DECISÃO DO PRODUCT OWNER (2026-05-14).**
> Nenhum agente deve iniciar ou continuar estas tasks até liberação explícita.

- [ ] ~~Tester: `/audit` por módulo — cobrir todos os 21 módulos/submódulos ativos~~
- [ ] ~~Tester: regressão do fluxo principal: cronograma → 6WLA → histograma → avanço~~
- [ ] ~~Builder: fix findings de audit~~
- [ ] ~~Builder: fix findings Critical/High do security-scan~~
- [ ] ~~Tester: `/audit` final — confirmar scores ≥ 9~~

#### Findings do /security-scan — 2026-05-14 (registrados, execução suspensa)

**HIGH — Bloqueantes (on hold):**
- [ ] ~~Builder H-01~~: `usuarios` schema ≠ UI — adicionar colunas `cargo TEXT`, `status TEXT DEFAULT 'Ativo'`, `perfil TEXT DEFAULT 'Visualizador'` na tabela `usuarios`. Coluna `papel` atual não é usada pela UI.
- [ ] ~~Builder H-02~~: RLS tabela `usuarios` — substituir policy `USING (true)` por policy granular que impeça usuário de escalar o próprio `perfil`.
- [ ] ~~Architect H-03 (decisão)~~: `xlsx` — aceitar risco documentado (uso exclusivo de export, sem parse de input externo). Ver ADR pendente.
- [ ] ~~Builder H-03 (execução)~~: `npm audit fix` para fixes automáticos (Vite HIGH + yaml MODERATE).

**MEDIUM (on hold):**
- [ ] ~~Builder M-01~~: bucket `rdo-evidencias` sem policy de Storage definida — documentar no DATABASE.md o procedimento de criação manual (bucket PRIVATE + policies autenticado) e adicionar comentário na migration.
- [ ] ~~Builder M-02~~: tabela `unidades_medida` sem RLS — adicionar `ENABLE ROW LEVEL SECURITY` + policy SELECT aberta + escrita restrita a `service_role`.

**LOW (on hold):**
- [ ] ~~Builder L-01~~: `LOGO_URL` hardcoded em `src/Layout.jsx:22` expõe o project ref do Supabase — mover para variável de ambiente ou construir URL a partir de `VITE_SUPABASE_URL`.
- [ ] ~~Builder L-02~~: documentar em `.env.example` que `VITE_MASTRA_URL` **deve usar HTTPS em produção** (atualmente `http://localhost:4111`).

**Validação pós-fix (on hold):**
- [ ] ~~Security~~: validar correções H-01, H-02 e H-03 antes de liberar deploy.

---

## Como Rodar

```bash
# Terminal 1 — Mastra (porta 4111)
cd "Agents Mastra"
npm run dev

# Terminal 2 — React App (porta 5173)
npm run dev
```
