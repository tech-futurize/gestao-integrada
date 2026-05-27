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

**Status:** 🔴 Aguardando execução
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

- [ ] Builder: Migrar `unidade` (string livre) → `unidade_id` (FK) com `<Select>` consumindo `unidades_medida`
- [ ] Builder: Remover `src/components/suprimentos/MapaAnalise.jsx` (legado Cotações, não usado)

---

### Módulo 4 — PLANEJAMENTO: CRONOGRAMA

- [ ] Builder: Atualizar fórmula de status (A Iniciar / Em Andamento / Atrasada / Concluído) — `Cronograma.jsx:56-62`, `GanttChart.jsx:28-34`
- [ ] Builder: Adicionar botão "6WLA" no header — filtra atividades das próximas 6 semanas
- [ ] Builder: Limpar lógica morta `zoom === "dias"` em `GanttChart.jsx:227,232`
- [ ] Builder: Adicionar colunas `area` e `disciplina` ao schema `tarefas_cronograma` (migration SQL)
- [ ] Designer: Aumentar proporção do Gantt vs coluna de tarefas

---

### Módulo 5 — PLANEJAMENTO: 6WLA

- [x] Architect: `/brainstorming` — spec das pills S1–S6 + checkboxes inline de restrição aprovada pelo PO *(2026-05-27)*
- [ ] Builder: Schema — adicionar 6 booleanos de restrição + `observacao TEXT` + índice único `(tarefa_cronograma_id, projeto_id)` em `itens_6wla`
- [ ] Builder: Remover campo "Responsável" da UI (`SixWLA.jsx:46,257,278,337-340`)
- [ ] Builder: Implementar vínculo bidirecional com cronograma — atividades via `tarefa_cronograma_id`, dados read-only
- [ ] Designer: Pills S1–S6 calculadas por sobreposição de datas + 6 checkboxes de restrição inline + campo `observacao`
- [ ] Designer: Dashboard superior — 7 cards (Total Atividades + 1 por categoria de restrição)
- [ ] Builder: Remover modal/formulário manual de criação (`SixWLA.jsx:175-178, 318-378`)

---

### Módulo 6 — PLANEJAMENTO: TAKE-OFF

- [ ] Designer: Remover cards superiores, campo Status, campo Responsável, Curva de Previsto do gráfico
- [ ] Designer: Trocar cor de Realizado para verde; manter Saldo como vermelho
- [ ] Builder: Adicionar subtotal na parte inferior da tabela
- [ ] Builder: Adicionar gráficos por Unidade de Medida e por Disciplina
- [ ] Builder: Trocar Data de Lançamento para Semana ISO do ano com sugestão automática
- [ ] Builder: Adicionar filtro por Unidade de Medida
- [ ] Builder: Integrar `ImportExportDialog` com mapeamento de colunas

---

### Módulo 7 — HISTOGRAMA (MO + EQUIPAMENTOS)

- [ ] Architect: `/brainstorming` — decidir estrutura do schema antes de qualquer código: 1 tabela unificada com coluna `tipo` (MO vs Equipamento) ou 2 tabelas separadas? Avaliar impacto na migração dos dados existentes.
- [ ] Builder: Schema — separar MO e Equipamentos; adicionar `qtd_projetado`, `qtd_prev_acumulado`, `qtd_real_acumulado`, `qtd_proj_acumulado`
- [ ] Designer: UI tabela com scroll horizontal por mês; colunas fixas (MO/Eq, Totais, %Total)
- [ ] Builder: Regra de bloqueio — Real só editável para mês ≤ atual; ao salvar Real, limpar e bloquear Projetado
- [ ] Builder: Fórmulas `%Total Real = Real Acum / Prev Acum` e `%Total Projetado = Proj Acum / Prev Acum`
- [ ] Builder: Adicionar linhas acumuladas nos gráficos
- [ ] Builder: Import/Export com escala -3m / +1ano e mapeamento de colunas

---

### Módulo 8 — AVANÇO

- [ ] Architect: `/brainstorming` — mudar de mensal para semanal tem impacto nos dados existentes. Decidir: migrar registros históricos ou manter mensal para histórico e semanal apenas para novos lançamentos?
- [ ] Builder: Schema — adicionar `avanco_projetado`; mudar granularidade para semanal (`semana_iso`) com agrupamento por mês
- [ ] Designer: Tabela transposta (linhas: Previsto, Real, Projetado; colunas por semana agrupadas por mês)
- [ ] Builder: Bloqueio Real ≤ semana atual; ao salvar Real, limpar Projetado da mesma semana
- [ ] Builder: Substituir Aderência por `%Total Real` e `%Total Projetado`
- [ ] Builder: Corrigir bug visual no botão Editar (`Avancos.jsx:258-260`)
- [ ] Builder: Gráfico com barras mensais + eixo X toggle Semana/Mês
- [ ] Builder: Import/Export com escala -3m/+1ano e mapeamento

---

### Módulo 9 — ADM. CONTRATUAL

#### Contratos
- [ ] Builder: Renomear tipo "Misto" → "Fornecimento + Serviço" (UI + CHECK no schema)
- [ ] Builder: Formatação BR (ponto milhar / vírgula decimal) em campos de valor
- [ ] Builder: UI de Aditivos (Escopo texto, Prazo dias, Valor R$) usando tabela `aditivos` já existente
- [ ] Builder: Calcular `inicio_atual` e `termino_atual` dinamicamente a partir de aditivos
- [ ] Builder: Trocar opções de Status para: A iniciar / Em andamento / Concluído / Paralisado
- [ ] Builder: Botão de Medições abrindo histórico + pop-up para nova medição

#### Medições
- [ ] Builder: Remover campos "Elaborador", "Valor Bruto", "Retenção" (`MedicaoForm.jsx:12,75-77,92`)
- [ ] Builder: Renomear "Valor Líquido" → "Valor" (read-only, soma automática dos itens)
- [ ] Builder: Integrar `ImportExportDialog` + `ColumnMappingDialog` em `Medicoes.jsx`

---

### Módulo 10 — RDO

- [ ] Builder: Remover botão "Anexar à Medição" (`RDOModule.jsx:425`)
- [ ] Builder: Remover "KM" do campo Área; remover campo Hora (manter apenas Data)
- [ ] Builder: Desvincular Condição × Praticabilidade — permitir qualquer combinação
- [ ] Builder: Padronizar MO e Equipamentos — botões "Adicionar" gerando Nome / Função-Identificação / Quantidade
- [ ] Builder: Botão "Vincular Atividades" — pop-up de cronograma com filtros e checkbox múltiplo
- [ ] Builder: Replicar vínculo na seção "Ocorrências e Impactos"
- [ ] Builder: Campo de Evidências (upload de arquivo / captura de foto)
- [ ] Builder: Importação em massa com `ColumnMappingDialog`

---

### Módulo 11 — REGISTROS

- [ ] Designer: Cards superiores: Qtd por Tipo, Qtd por Responsabilidade, Qtd por Status
- [ ] Builder: Adicionar filtros: Responsabilidade e Período (Início/Término)
- [ ] Builder: Remover campo Hora (`IncidenteForm.jsx:115`)
- [ ] Builder: Suporte a anexo de arquivos
- [ ] Builder: Botão "Vincular Atividades" do cronograma (mesma pattern do RDO)

---

### Módulo 12 — MAPA DE IMPACTO

- [ ] Designer: Gradiente Verde Claro → Vermelho (`MapaRegistroImpacto.jsx:21-28` + legenda `:139-144`)
- [ ] Designer: Corrigir corte de texto no gráfico radar Contratada/Contratante
- [ ] Builder: Remover botão "Export" (`:145-148`)
- [ ] Builder: Remover textos descritivos ("Distribuição por Categoria", "Clique em uma célula…")

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

- [ ] Architect: `/brainstorming` — definir granularidade antes de codificar: permissões por módulo ou por submódulo? Quais ações por recurso (view / create / edit / delete ou simplificado)? Como tratar usuário sem projeto atribuído?
- [ ] Builder: Schema — tabela `permissoes_usuario (usuario_id UUID FK, modulo TEXT, acoes JSONB)` com índice único
- [ ] Designer: UI matriz módulo × ação (view / create / edit / delete) por usuário em `Usuarios.jsx`
- [ ] Builder: Hook `usePermissions(modulo, acao)` com cache React Query
- [ ] Builder: `ProtectedRoute` aceitar props `modulo` e `acao`; redirecionar para `/sem-permissao`
- [ ] Builder: Sidebar — esconder itens sem permissão `view`
- [ ] Builder: Páginas — esconder botões de ação conforme permissão
- [ ] Builder: Seed — perfil Admin (tudo) + perfis por área (Engenharia, Suprimentos, Planejamento)

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
