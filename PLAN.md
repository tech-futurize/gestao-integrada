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
- **DX: dev unificado** *(2026-05-15)* — `npm run dev` na raiz sobe Vite + Mastra via `concurrently`; `postinstall` propaga deps; `agents-mastra/` ignorado no ESLint; README atualizado
- **Smart Import Flow** *(2026-05)* — `column-mapping-dialog`, `import-progress-dialog`, `importTypeValidator`, `ImportExportDialog` refatorado; integrado em Engenharia, Cronograma, Avanços e Suprimentos
- **QA Engenharia & Suprimentos** *(2026-05-15)* — 13 findings corrigidos (datas, try-catch, loading states, constantes extraídas, filtros unificados); scores ≥ 9/10 em ambos os módulos
- **Gantt Virtualização** *(2026-05-18)* — `useVirtualizer`, WBS sort numérico, `LEVEL_BG` hierárquico, scroll-sync 3 painéis, coluna "Nív" com badge colorido; favicon local substituído
- **Auditoria de Organização** *(2026-05-27)* — Limpeza geral do repositório: 4 SQLs aplicados removidos da raiz, componentes órfãos dropados (rotinas/relacionamentos/ruídos), `Agents Mastra/` renomeado para `agents-mastra/` (sem espaço), `docs/skills/` removido, `.gitignore` corrigido (`.env.example` agora versionado), links quebrados de CONTRIBUTING.md corrigidos, `docs/temp/` removida, artefatos brainstorm ignorados.
- **Login Page Redesign** *(2026-05-27)* — `Login.jsx` reescrito com split-screen (hero slideshow de obras industriais + painel de formulário); slideshow automático de 6 imagens com transição suave; branding FuturizeNow (logo mark + nome); cards de módulos do sistema; CSS animations em `index.css`; responsivo (hero oculto em `< 980px`).

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

## Como Rodar

```bash
# Sobe Vite (porta 5173) + Mastra (porta 4111) simultaneamente
npm run dev
```

---

## Milestone Atual: Backlog 2026-Q2 — Onda 2

**Status:** 🟡 Em progresso — M0–M12 concluídos · M13 Ativo
**Progresso:** ████████████░░░ 12/15 módulos fechados

> **Atenção:** 5 arquivos com mudanças não commitadas (`package.json`, `package-lock.json`, `supabaseEntities.js`, `GanttChart.jsx`, `Cronograma.jsx`). Commitar antes de iniciar M13.

**Objetivo:** Completar os módulos remanescentes do backlog consolidado pelo PO, fechando um módulo de cada vez com QA ≥ 9 antes de avançar.

> Cada módulo abaixo é uma fase autônoma — fechar e validar com `/audit` antes de iniciar o próximo.

---

## Padrão Visual do Sistema (vigora a partir do Módulo 0)

Toda página deve seguir esta hierarquia, nesta ordem:

1. **Header global** — breadcrumb `Módulo › Submódulo` + slot de ações (Novo/Importar/Exportar) + slot de filtros
2. **Cards de indicadores** (KPIs / totalizadores)
3. **Tabela** ou visualização principal

**Proibido:** `<h1>` duplicando o header global · subtítulos descritivos ("Visão consolidada…") · mini-headers próprios com `flex justify-between`

---

### Módulo 0 — PADRONIZAÇÃO DE LAYOUT (pré-onda obrigatória)

> Trava a execução de todos os módulos seguintes. Resolver agora em 2 arquivos centrais transforma ~18 refatorações em deleções simples.

- [x] Architect: `/brainstorming` curto — spec aprovada pelo PO *(2026-05-27)*
- [x] Builder: Criar `src/components/ui/PageHeader.jsx` com props `{ actions, filters }` — breadcrumb automático via `useLocation()` + `navigationConfig.js` *(2026-05-27)*
- [x] Builder: `getCurrentPage(pathname)` implementado dentro do próprio `PageHeader.jsx` — retorna `{ moduleName, submodule }` *(2026-05-27)*
- [x] Builder: Refatorar `Layout.jsx` — header antigo removido; `<main>` entrega apenas `{children}` *(2026-05-27)*
- [x] Builder: Aplicar nas 3 páginas-piloto *(2026-05-27)*:
  - `src/pages/Dashboard.jsx` — `<PageHeader />` importado e aplicado ✅
  - `src/pages/Engenharia/Documentos.jsx` — `<PageHeader filters actions>` aplicado, header local removido ✅
  - `src/pages/Suprimentos/MapaSuprimentos.jsx` — `<PageHeader actions>` aplicado, header local removido ✅
- [x] Designer: revisão visual das 3 piloto (densidade, alinhamento, tema claro/escuro) *(2026-05-27)*
- [x] Tester: `/audit` nas 3 piloto — score ≥ 9 *(2026-05-27)* — Visual 9 · Functional 9 · Trust 9
- [x] Documentar padrão em `docs/design/DESIGN.md` (seção "Layout de Página") *(2026-05-27)*

> **Sub-task implícita em todos os módulos 1-15:** aplicar `PageHeader`, remover `h1`/subtítulos duplicados, posicionar ações e filtros no slot do header.

---

### Módulo 1 — DASHBOARD

> ⏸ **Adiado por decisão do PO (2026-05-27)** — widgets e reorganização do Dashboard serão revisados apenas após todos os demais módulos estarem prontos e numa revisão final dedicada. Nenhuma alteração de conteúdo ou widgets deve ser feita aqui até essa revisão.
>
> O único item que se aplica ao Dashboard agora é a sub-task implícita de padronização de layout (PageHeader, remoção de títulos duplicados), que será feita no **Módulo 0 piloto**.

---

### Módulo 2 — ENGENHARIA

- [x] ~~Builder: Remover arquivo morto `src/components/engenharia/DocDashboard.jsx` (não importado)~~ *(removido na auditoria 2026-05-27)*

---

### Módulo 3 — SUPRIMENTOS

> ✅ **Concluído — Audit score ≥ 9** *(2026-05-27)*

- [x] Builder: Migrar `unidade` (string livre) → `unidade_id` (FK) com `<Select>` consumindo `unidades_medida` *(2026-05-27)*
- [x] Builder: Remover `src/components/suprimentos/MapaAnalise.jsx` (legado Cotações, não usado) — já havia sido removido anteriormente *(2026-05-27)*

---

### Módulo 4 — PLANEJAMENTO: CRONOGRAMA

> ✅ **Concluído — Audit score ≥ 9 — Visual 9 · Functional 9 · Trust 9** *(2026-05-27)*

- [x] Builder: Atualizar fórmula de status (A Iniciar / Em Andamento / Atrasada / Concluído) — `Cronograma.jsx:59-65`, `GanttChart.jsx:25-32` *(2026-05-27)*
- [x] Builder: Adicionar botão "6WLA" no slot de ações do PageHeader — filtra atividades das próximas 6 semanas *(2026-05-27)*
- [x] Builder: Limpar lógica morta `zoom === "dias"` — já removida em refactor anterior *(2026-05-27)*
- [x] Builder: Adicionar colunas `area` e `disciplina` ao schema `tarefas_cronograma` (migration SQL) — `docs/database/supabase-migration-m4-cronograma.sql` *(2026-05-27)*
- [x] Designer: Aumentar proporção do Gantt vs coluna de tarefas — `W_ID` 96→64px · `W_NOME` 320→220px · Gantt +132px *(2026-05-27)*

---

### Módulo 5 — PLANEJAMENTO: 6WLA

> ✅ **Concluído — Audit score ≥ 9 — Visual 9 · Functional 9 · Trust 9** *(2026-05-27)*

- [x] Architect: `/brainstorming` — spec das pills S1–S6 + checkboxes inline de restrição aprovada pelo PO *(2026-05-27)*
- [x] Builder: Schema M5 — 6 booleanos de restrição + `observacao TEXT` + índice único `(tarefa_cronograma_id, projeto_id)` em `itens_6wla` *(2026-05-27)*
- [x] Builder: Remover campo "Responsável" da UI *(2026-05-27)*
- [x] Builder: Implementar vínculo bidirecional com cronograma — atividades via `tarefa_cronograma_id`, dados read-only *(2026-05-27)*
- [x] Designer: Pills S1–S6 calculadas por sobreposição de datas + 6 checkboxes de restrição inline + campo `observacao` *(2026-05-27)*
- [x] Designer: Dashboard superior — 7 cards (Total Atividades + 1 por categoria de restrição) *(2026-05-27)*
- [x] Builder: Remover modal/formulário manual de criação; substituído por `AdicionarCronogramaModal` + banner auto-sync *(2026-05-27)*
- [x] Tester: Bug fix `ModulosResumo.jsx` — `ppc` (campo removido) → `pctSemRestricao` (% atividades sem restrição) *(2026-05-27)*
- [x] Tester: Documentação criada em `docs/modulos/05-6WLA.md` *(2026-05-27)*

---

### Módulo 6 — PLANEJAMENTO: TAKE-OFF

> ✅ **Concluído — Audit score ≥ 9 — Visual 9 · Functional 9 · Trust 9** *(2026-05-27)*

- [x] Designer: Remover cards superiores, campo Status, campo Responsável, Curva de Previsto do gráfico *(2026-05-27)*
- [x] Designer: Trocar cor de Realizado para verde; manter Saldo como vermelho *(2026-05-27)*
- [x] Builder: Adicionar subtotal na parte inferior da tabela *(2026-05-27)*
- [x] Builder: Adicionar gráficos por Unidade de Medida e por Disciplina *(2026-05-27)*
- [x] Builder: Trocar Data de Lançamento para Semana ISO do ano com sugestão automática *(2026-05-27)*
- [x] Builder: Adicionar filtro por Unidade de Medida *(2026-05-27)*
- [x] Builder: Integrar `ImportExportDialog` com mapeamento de colunas *(2026-05-27)*
- [x] Tester: Bug fix L003 — `isLoading` → `isPending` + `isError` adicionado *(2026-05-27)*
- [x] Tester: Documentação criada em `docs/modulos/06-TakeOff.md` *(2026-05-27)*

---

### Módulo 7 — HISTOGRAMA (MO + EQUIPAMENTOS)

> ✅ **Concluído — Audit score ≥ 9 — Visual 9 · Functional 9 · Trust 9** *(2026-05-27)*

- [x] Architect: `/brainstorming` — spec aprovada pelo PO: tabela unificada com coluna `tipo` (MO vs Equipamento); acumulados calculados no front *(2026-05-27)*
- [x] Builder: Schema — `qtd_projetado` adicionado; migration aplicada; acumulados calculados no front (não persistidos) *(2026-05-27)*
- [x] Designer: UI tabela com scroll horizontal; colunas fixas (Recurso, T.Prev, T.Real, T.Proj, %Real, %Proj); chips de toggle Prev/Real/Proj; header duplo por mês *(2026-05-27)*
- [x] Builder: Regra de bloqueio — Real bloqueado para meses futuros; ao salvar Real, Projetado daquele mês é limpo e zerado *(2026-05-27)*
- [x] Builder: Fórmulas `%Real = Real Acum / Prev Acum` e `%Proj = Proj Acum / Prev Acum` por recurso e no rodapé TOTAL *(2026-05-27)*
- [x] Builder: Linhas acumuladas no gráfico — Acum. Prev + Acum. Real como linhas sobre barras mensais (eixo Y direito) *(2026-05-27)*
- [x] Builder: Import/Export com mapeamento de colunas; upsert por (recurso × mês × tipo) *(2026-05-27)*
- [x] Tester: `/audit` — score ≥ 9 — Visual 9 · Functional 9 · Trust 9 *(2026-05-27)*
- [x] Tester: `docs/modulos/06-Histograma.md` revisado e alinhado com implementação real *(2026-05-27)*

---

### Módulo 8 — AVANÇO

> ✅ **Concluído — Audit score ≥ 9** *(2026-05-27)*
> Decisão do PO: migração completa para `semana_iso`; dados históricos convertidos; schema unificado.

- [x] Architect: `/brainstorming` — Opção A aprovada: migração completa para `semana_iso`, dados históricos convertidos *(2026-05-27)*
- [x] Builder: Schema migration — `semana_iso TEXT NOT NULL` + `avanco_projetado NUMERIC DEFAULT 0`; dados históricos migrados; `mes_referencia` tornado nullable; constraint unique `(projeto_id, semana_iso)` *(2026-05-27)*
- [x] Designer: Tabela transposta — linhas: Previsto / Real / Projetado; colunas: semanas agrupadas por mês no header duplo; sticky left + sticky top; escala -3m/+1ano *(2026-05-27)*
- [x] Builder: Bloqueio Real ≤ semana atual (`isCurrentOrPastWeek`); ao salvar Real, `avanco_projetado` da mesma semana zerado *(2026-05-27)*
- [x] Builder: KPI cards com `%Total Real = Real Acum / Prev Acum` e `%Total Projetado = Proj Acum / Prev Acum`; linhas acumuladas no gráfico *(2026-05-27)*
- [x] Builder: Botão Editar removido — substituído por edição inline por célula (Enter/Escape/blur) *(2026-05-27)*
- [x] Builder: Gráfico — barras (Prev/Real/Proj) + linhas acumuladas (Prev Acum + Real Acum) + toggle Semana/Mês com agrupamento mensal *(2026-05-27)*
- [x] Builder: Import/Export integrado com `ImportExportDialog` e mapeamento de colunas; escala -3m/+1ano herdada de `getProjectWeeks` *(2026-05-27)*
- [x] Tester: `/audit` — score ≥ 9 *(2026-05-27)*
- [x] Tester: Criar/atualizar `docs/modulos/07-AvancoFisico.md` *(2026-05-27)*

---

### Módulo 9 — ADM. CONTRATUAL

> ✅ **Concluído — Audit score ≥ 9 — Visual 9 · Functional 9 · Trust 9** *(2026-05-27)*

#### Contratos
- [x] Builder: Renomear tipo "Misto" → "Fornecimento + Serviço" (UI + CHECK no schema)
- [x] Builder: Formatação BR (ponto milhar / vírgula decimal) em campos de valor
- [x] Builder: UI de Aditivos (Escopo texto, Prazo dias, Valor R$) usando tabela `aditivos` já existente
- [x] Builder: Calcular `inicio_atual` e `termino_atual` dinamicamente a partir de aditivos
- [x] Builder: Trocar opções de Status para: A iniciar / Em andamento / Concluído / Paralisado
- [x] Builder: Botão de Medições abrindo histórico + pop-up para nova medição

#### Medições
- [x] Builder: Remover campos "Elaborador", "Valor Bruto", "Retenção" (`MedicaoForm.jsx:12,75-77,92`)
- [x] Builder: Renomear "Valor Líquido" → "Valor" (read-only, soma automática dos itens)
- [x] Builder: Integrar `ImportExportDialog` + `ColumnMappingDialog` em `Medicoes.jsx`

---

### Módulo 10 — RDO

> ✅ **Concluído** *(2026-05-28)*

- [x] Builder: Remover botão "Anexar à Medição" (`RDOModule.jsx:425`)
- [x] Builder: Remover "KM" do campo Área; remover campo Hora (manter apenas Data)
- [x] Builder: Desvincular Condição × Praticabilidade — permitir qualquer combinação
- [x] Builder: Padronizar MO e Equipamentos — botões "Adicionar" gerando Nome / Função-Identificação / Quantidade
- [x] Builder: Botão "Vincular Atividades" — pop-up de cronograma com filtros e checkbox múltiplo
- [x] Builder: Replicar vínculo na seção "Ocorrências e Impactos"
- [x] Builder: Campo de Evidências (upload de arquivo / captura de foto)
- [x] Builder: Importação em massa com `ColumnMappingDialog`
- [x] Builder: Emojis → ícones Lucide nos painéis do RDOForm *(2026-05-28)*
- [x] Builder: Ações Novo RDO / Importar movidas para slot actions do PageHeader *(2026-05-28)*

---

### Módulo 11 — REGISTROS

> ✅ **Verified & Polished! — Audit score ≥ 9 — Visual 9 · Functional 9 · Trust 9** *(2026-05-28)*

- [x] Designer: Cards superiores: Qtd por Tipo, Qtd por Responsabilidade, Qtd por Status *(2026-05-28)*
- [x] Builder: Adicionar filtros: Responsabilidade e Período (Início/Término) *(2026-05-28)*
- [x] Builder: Remover campo Hora — `RegistroForm.jsx` usa `type="date"` *(2026-05-28)*
- [x] Builder: Suporte a anexo de arquivos via Supabase Storage *(2026-05-28)*
- [x] Builder: Botão "Vincular Atividades" do cronograma *(2026-05-28)*
- [x] Tester: `/audit` — score ≥ 9 — Visual 9 · Functional 9 · Trust 9 *(2026-05-28)*
- [x] Tester: Criar `docs/modulos/11-Registros.md` *(2026-05-28)*

---

### Módulo 12 — MAPA DE IMPACTO

> ✅ **Concluído — Audit score ≥ 9 — Visual 9 · Functional 9 · Trust 9** *(2026-05-27)*

- [x] Designer: Gradiente Verde Claro → Vermelho (`MapaRegistroImpacto.jsx:21-28` + legenda `:139-144`)
- [x] Designer: Corrigir corte de texto no gráfico radar Contratada/Contratante
- [x] Builder: Remover botão "Export" (`:145-148`)
- [x] Builder: Remover textos descritivos ("Distribuição por Categoria", "Clique em uma célula…")

---

### Módulo 13 — RISCOS E MUDANÇAS

#### Gestão de Riscos
- [ ] Builder: Migrar `impacto` para `impactos JSONB` (seleção múltipla: Escopo, Prazo, Valor) — schema já existe
- [ ] Builder: Adicionar campos `escopo_texto`, `prazo_dias`, `valor_impacto` no formulário
- [ ] Builder: Sincronizar categorias com Mapa de Impacto (constante `CATEGORIES` compartilhada)
- [ ] Designer: Cards quantitativos por categoria + títulos nos filtros
- [ ] Builder: Mover Plano de Ação para dentro de Riscos; refatorar `PlanoAcao.jsx` para `registro_risco_id`/`registro_mudanca_id`
- [ ] Builder: Trocar campo "Finalidade" por seleção de Registro de Risco ou Mudança (ID + Descrição)
- [ ] Designer: Padronizar botões Salvar como verdes

#### Gestão de Mudanças
- [ ] Builder: Remover `MudancaKanban.jsx`; manter apenas tabela com Editar/Excluir
- [ ] Builder: Renomear "Data Ocorrência" → "Data Registro"
- [ ] Builder: Adicionar campo Pleito (FK opcional)
- [ ] Builder: Checkbox Adição | Redução no Impacto no Escopo (`impacto_escopo_tipo` já existe no schema)
- [ ] Designer: Cards: Total Desvio Prazo (+/-), Adição/Redução Valor, Adição/Redução Escopo
- [ ] Designer: Padronizar botões Salvar como verdes

---

### Módulo 14 — CONFIGURAÇÕES: PERMISSÕES

> ✅ **Verified & Polished! — Audit score 9.3/10 — Visual 9 · Functional 9 · Trust 10** *(2026-05-29)*

- [x] Architect: `/brainstorming` — granularidade por módulo (8 grupos), view/create/edit/delete, PERFIL_SEED
- [x] Builder: Schema — `permissoes_usuario (usuario_id UUID FK, modulo TEXT, acoes JSONB)` + RLS + índice único *(migration aplicada)*
- [x] Builder: Colunas `perfil`, `cargo`, `status` adicionadas em `usuarios` + seed admin padrão
- [x] Designer: UI matriz módulo × ação com toggle linha/coluna + dropdown de template em `Usuarios.jsx`
- [x] Builder: Hook `usePermissions(modulo, acao)` + `usePermissionsMap` + `usePermissionsLoading` com React Query staleTime: Infinity
- [x] Builder: `ProtectedRoute` aceita `modulo` + `acao`; `wrap()` atualizado; redireciona para `/sem-permissao`
- [x] Builder: Sidebar filtra módulos sem `view` via `visibleNavigation`
- [x] Builder: Camada 3 piloto — Engenharia (Novo, Importar, Editar, Excluir) + Suprimentos (Novo, Importar)
- [x] Builder: Seed — Admin (tudo) + Gestor + Visualizador + 4 perfis por área; auto-seed ao criar usuário

---

### Módulo 15 — IAs (EXECUTOR E ANALISTAS)

#### Instructions Mastra
- [ ] Builder: Executor + Analista de Negócio — prompt para estrutura padronizada (headings, tabelas, bullets)
- [ ] Builder: Analista de Negócio — reforçar: análises apenas entre dados reais; proibido suposições
- [ ] Builder: Analista Contratual — tom comercial + rigor jurídico; fluxo: pedido → Executor → Analista → análise final
- [ ] Builder: Reforçar em todos — proibido inventar dados; usar apenas evidências do sistema

#### UI do chat
- [ ] Builder: `AgenteChat.jsx` — renderizar Markdown rico via `react-markdown` + `remark-gfm` (headings, tabelas, listas, blockquotes)

---

## Ordem de Execução

1. Dashboard → 2. Engenharia → 3. Suprimentos → 4. Cronograma → 5. 6WLA → 6. Take-Off → 7. Histograma → 8. Avanço → 9. Adm. Contratual → 10. RDO → 11. Registros → 12. Mapa de Impacto → 13. Riscos → 14. Mudanças → 15. Configurações/Permissões → 16. IAs

> **Critério de avanço:** `/audit` ≥ 9 + `npm run build` sem erros + doc do módulo atualizada (`docs/modulos/<X>.md`).
