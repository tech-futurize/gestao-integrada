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

**Status:** 🟡 Em andamento — QA Engenharia concluído ✅ | Pendente: smoke test Smart Import Flow (Task 10)

**Objetivo:** Validar o módulo Engenharia pós-refatoração e, quando liberado, executar ciclo QA & Segurança geral.

---

### Fase Smart Import Flow *(nova prioridade — executar antes do QA)*

> **Documento de referência (LEITURA OBRIGATÓRIA antes de executar):** `plano-smart-importflow.md` (raiz do projeto)
>
> O Builder DEVE abrir e seguir o documento detalhado integralmente — código completo, ordem de tasks e commits estão lá. Não improvisar.

- [x] Builder: Task 1 — criar `src/components/ui/column-mapping-dialog.jsx`
- [x] Builder: Task 2 — criar `src/components/ui/import-progress-dialog.jsx`
- [x] Builder: Task 3 — criar `src/utils/importTypeValidator.js`
- [x] Builder: Task 4 — refatorar `src/components/ui/import-export-dialog.jsx`
- [x] Builder: Task 5 — atualizar `src/pages/Engenharia/Documentos.jsx`
- [x] Builder: Task 6 — atualizar `src/pages/Planejamento/Cronograma.jsx`
- [x] Builder: Task 7 — atualizar `src/pages/Planejamento/Avancos.jsx`
- [x] Builder: Task 8 — atualizar `src/pages/Suprimentos/MapaSuprimentos.jsx`
- [x] Builder: Task 9 — verificar módulos adicionais via `grep -r "ImportExportDialog" src/`
- [ ] Tester: Task 10 — smoke test manual conforme roteiro em `plano-smart-importflow.md`

---

### Fase QA Engenharia *(após Smart Import Flow concluído)*

- [x] Tester: `/audit` nos módulos Engenharia e Suprimentos — 2026-05-15
- [x] Builder: fix findings do audit — todos os 13 findings corrigidos (2026-05-15).

---

### Findings do /audit — Engenharia & Suprimentos (2026-05-15)

> Scores iniciais: Engenharia **5.5/10** | Suprimentos **5.0/10** — ambos reprovados.
> Scores pós-fix (2026-05-15): Engenharia **≥ 9/10** | Suprimentos **≥ 9/10** — aprovados. Deploy desbloqueado.

#### CRÍTICOS — corrigir antes de qualquer deploy

- [x] Builder **E-1**: `DocDashboard.jsx` linhas 38, 56, 155 — campo `deadline` não existe no schema; substituir por `data_projetada`. Toda lógica de "Vencidos/Críticos" retorna 0 silenciosamente.
- [x] Builder **E-2**: `Documentos.jsx` linha 410 — `fmtDate` usa `.slice(0,8)` truncando o ano para 2 dígitos ("15/05/20"). Corrigir para `.slice(0,10)`.
- [x] Builder **E-3**: `DocDetalhe.jsx` linha 41 — mesma truncagem de data que E-2. Corrigir para `.slice(0,10)`.
- [x] Builder **S-1**: `ItemMASForm.jsx` linhas 81–94 — `handleSave` sem try-catch e sem toast; falhas de criação/edição são silenciosas. Adicionar try-catch + toast de erro/sucesso.
- [x] Builder **S-2**: `MapaSuprimentos.jsx` (page) linhas 35–55 — `handleImport` sem try-catch nem feedback de loading. Adicionar try-catch + toast + loading state.

#### ALTOS

- [x] Builder **E-4**: `Documentos.jsx` linhas 234–257 — `handleImport` sem try-catch e sem toast. Adicionar tratamento de erro e feedback visual.
- [x] Builder **E-5**: `Documentos.jsx` linha 359 — disciplinas `PRC` e `HSE` existem no filtro mas não no formulário de criação. Unificar as duas listas.
- [x] Builder **S-3**: `MapaSuprimentos.jsx` (component) linha 426 — deleção sem dialog de confirmação; 1 clique apaga o item. Adicionar `AlertDialog` antes de `deleteItem.mutate()`.
- [x] Builder **S-4**: `MapaSuprimentos.jsx` (component) linha 160 — query de `tarefas_cronograma` sem `isLoading`. Adicionar estado de loading no dropdown de tarefas.

#### MÉDIOS

- [x] Builder **E-6**: Constantes `ETAPAS`, `DISCIPLINAS`, `DISC_COLORS`, `ETAPA_COLORS` duplicadas em `Documentos.jsx`, `DocDashboard.jsx` e `DocDetalhe.jsx`. Extrair para `src/lib/engenharia-constants.js`.
- [x] Builder **E-7**: `Documentos.jsx` linha 316 — botão de import sem estado de loading/disabled durante a operação.
- [x] Builder **S-5**: `MapaSuprimentos.jsx` (component) linha 207 — `localStorage.removeItem()` direto no componente (viola L006). Usar abstração ou mover para o contexto de filtro.
- [x] Builder **S-6**: `ItemMASForm.jsx` linhas 265–268 — validação de formulário insuficiente; `quantidade`, `responsavel` e `fornecedor` não são validados antes de salvar.
- [x] Builder **S-7**: `MapaSuprimentos.jsx` (component) linhas 216–244 — lógica de filtro inline recalculada a cada render. Migrar para `useMemo`.
- [x] Builder **S-8**: `MapaAnalise.jsx` — quando `cotacoes` está vazio o componente retorna `null` silencioso sem empty state.

#### Validação pós-fix

- [x] Tester: re-executar `/audit` nos módulos Engenharia e Suprimentos após correções. Score mínimo ≥ 9 para liberar deploy. *(2026-05-15 — todos os 13 findings verificados; scores ≥ 9 em ambos os módulos)*

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
