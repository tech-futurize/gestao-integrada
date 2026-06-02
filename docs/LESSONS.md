# LESSONS.md — Lições Aprendidas

> Arquivo VIVO de lições aprendidas com **erros relevantes** cometidos durante o projeto.
> O objetivo é dobrar o valor de cada erro: primeiro ele é corrigido, depois ele educa todos os próximos projetos.
>
> **Ownership:** Architect (curadoria) · **Autores:** qualquer agente · **Tipo:** VIVO

---

## 1. Quando registrar uma lição

Registre **apenas erros relevantes** — aqueles que, em retrospecto, você gostaria que alguém tivesse documentado antes. Um erro é relevante quando pelo menos um destes for verdade:

- Levou mais de 30 minutos para diagnosticar.
- Causou retrabalho em código já aprovado (review/QA).
- Derivou de um pressuposto que se mostrou errado.
- Resultou em bug em staging ou produção.
- Foi detectado pelo `/security-scan`, `/audit`, `/review` ou `/debug`.
- Seria evitável se o projeto tivesse uma regra explícita em CLAUDE.md / AGENTS.md / SKILLS.md.

**Não registre:**

- Typos e lapsos triviais.
- Erros de sintaxe pegos pelo linter na primeira rodada.
- Decisões que foram conscientemente escolhidas e depois revisitadas (isso é ADR).
- Qualquer coisa que contenha PII, segredo ou dado sensível.

---

## 2. Como registrar

1. Abra este arquivo e adicione uma entrada ao final da seção **5. Registro de lições**, usando o formato da seção **4. Template de entrada**.
2. Numere sequencialmente (`L001`, `L002`, ...). Nunca renumere entradas antigas.
3. Se a lição gerar uma regra nova, abra um PR também em CLAUDE.md (ou no doc apropriado) e cite o ID da lição no commit.
4. Se a lição apontar para uma skill (disponível globalmente via Skill tool) que deveria ter sido invocada e não foi, registre o nome da skill na entrada da lição para referência futura.

Tempo esperado por lição: **5 minutos**. Se está levando mais, o formato está errado — seja mais seco.

---

## 3. Como usar este arquivo (consulta)

- **No início de todo milestone:** o Architect lê LESSONS.md durante `/milestone-start` e cita explicitamente as lições que se aplicam ao escopo. Não basta existir — precisa ser consultado.
- **No `/review`:** quem revisa compara o diff contra lições de categoria equivalente (ex: mudança em auth → lições de categoria `Auth`).
- **No `/security-scan`:** lições de categoria `Security` entram no checklist do scan.
- **Em novo projeto:** copie este arquivo para o novo repo e adapte. Lições genéricas (ex: "não use `any` em TypeScript") ficam; lições específicas (ex: "webhook do Stripe precisa de raw body") só ficam se o stack for o mesmo.

---

## 4. Template de entrada

Copie o bloco abaixo para cada nova lição.

```markdown
### L00X — <!-- Título curto (≤ 80 caracteres, imperativo: "Evitar X em Y") -->

- **Data:** YYYY-MM-DD
- **Agente:** Architect | Designer | Builder | Tester | DevOps | Security
- **Milestone:** <!-- Número e nome do milestone -->
- **Categoria:** Arquitetura | Auth | Banco | Integrações | Performance | Security | UI/UX | DX | CI/CD | Testes | Outro
- **Gravidade:** Baixa | Média | Alta | Crítica
- **Contexto em 1 frase:** <!-- O que você estava tentando fazer? -->
- **Erro observado:** <!-- Sintoma. Sem stack trace longo. -->
- **Causa raiz:** <!-- Por que aconteceu, não o que aconteceu. -->
- **Correção aplicada:** <!-- Como foi resolvido desta vez. -->
- **Como evitar em projetos futuros:** <!-- Regra acionável. Se virar linha no CLAUDE.md ou AGENTS.md, cite aqui. -->
- **Referências:** <!-- Links para ADR, PR, issue, research — sem PII -->
```

---

## 5. Registro de lições

> Adicione novas entradas ao final. Não renumere nem apague entradas antigas.
> Se uma lição ficar obsoleta, marque com `**Status:** Obsoleta — substituída por L0YZ` sem remover o texto.

### L001 — Dashboard: campos de entidade referenciados sem verificar o schema real

- **Data:** 2026-05-06
- **Agente:** Builder
- **Milestone:** 1 — UI/UX e correção de dados no Dashboard
- **Categoria:** Banco
- **Gravidade:** Alta
- **Contexto em 1 frase:** Implementação do painel "Planejamento" no Dashboard principal (ModulosResumo.jsx).
- **Erro observado:** Barra de avanço e gráfico por disciplina exibiam 0% para todos os itens, mesmo com dados cadastrados no Take-Off.
- **Causa raiz:** O código acessava `c.quantidade_prevista` e `c.quantidade_realizada` na entidade `Commodity`, mas os campos reais são `qtd_contrato` (previsto) e o realizado é calculado somando `lancamentos_commodity.quantidade` via join manual. Nenhum dos dois campos inexistentes aparece no banco, então todas as somas ficam em zero.
- **Correção aplicada:** Substituir `c.quantidade_prevista` por `c.qtd_contrato`; adicionar query de `LancamentoCommodity` e calcular o realizado por commodity antes de agrupar por disciplina.
- **Como evitar em projetos futuros:** Antes de referenciar qualquer campo de entidade em um novo componente, ler o componente de origem (ex: `TakeOffCommodities.jsx`) ou a migration SQL para confirmar os nomes exatos. Campos computados (somados de outra tabela) nunca existem como colunas — exigem query adicional.
- **Referências:** `src/components/dashboard/ModulosResumo.jsx` linha 758–766 (antes), `src/components/planejamento/TakeOffCommodities.jsx` linha 339–346 (fonte da verdade).

---

### L002 — Dashboard: link de seção apontando para rota removida

- **Data:** 2026-05-06
- **Agente:** Builder
- **Milestone:** 1 — UI/UX e correção de dados no Dashboard
- **Categoria:** Arquitetura
- **Gravidade:** Média
- **Contexto em 1 frase:** Remoção do módulo "Registros" (página duplicada que foi absorvida por "Pleitos").
- **Erro observado:** O botão "Ver módulo" na seção "Registros" do Dashboard gerava 404 porque ainda apontava para `link="Registros"`, rota deletada do App.jsx e do sidebar.
- **Causa raiz:** A remoção de uma rota não foi acompanhada de busca em todos os componentes que faziam referência a esse path. ModulosResumo.jsx é um arquivo de ~850 linhas que não foi auditado no momento da remoção.
- **Correção aplicada:** Alterar `link="Registros"` para `link="Pleitos"` em `ResumoRegistros` dentro de ModulosResumo.jsx.
- **Como evitar em projetos futuros:** Ao remover ou renomear uma rota, executar grep por todo o projeto antes de fechar a tarefa: `grep -r "Registros" src/`. Tratar links de navegação como referências que exigem refactor, não apenas exclusão pontual.
- **Referências:** `src/components/dashboard/ModulosResumo.jsx` linha 581, `src/App.jsx`.

---

### L003 — React Query v5: `isLoading` não sinaliza erro após retries esgotados

- **Data:** 2026-05-06
- **Agente:** Builder
- **Milestone:** 1 — UI/UX e correção de dados no Dashboard
- **Categoria:** DX
- **Gravidade:** Média
- **Contexto em 1 frase:** Aba 6WLA no módulo Planejamento exibia tela em branco sem mensagem de erro.
- **Erro observado:** Quando a query falhava (tabela inexistente ou policy bloqueando), `isLoading` retornava `false` e nenhum estado de erro era renderizado — tela simplesmente ficava vazia.
- **Causa raiz:** No React Query v5, `isLoading = isPending && isFetching`. Após os retries, `isPending` vira `false` e `isLoading` também, mesmo sem dados. Usar `isLoading` como guard de loading state é insuficiente — `isError` precisa ser tratado separadamente.
- **Correção aplicada:** Substituir `isLoading` por `isPending` (v5 canônico) + adicionar branch `if (isError)` com mensagem explicativa.
- **Como evitar em projetos futuros:** Em todo componente com `useQuery`, SEMPRE desestruturar e tratar os três estados: `isPending`, `isError`, `data`. Nunca renderizar apenas com `if (isLoading) return ...` sem um `if (isError) return ...` subsequente. Padrão: `const { data, isPending, isError } = useQuery(...)`.
- **Referências:** `src/pages/Planejamento.jsx` componente `SixWLA`, [React Query v5 migration guide](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5).

---

### L004 — Módulo duplicado: auditar sobreposição de responsabilidades antes de criar nova página

- **Data:** 2026-05-06
- **Agente:** Architect
- **Milestone:** 1 — UI/UX e correção de dados no Dashboard
- **Categoria:** Arquitetura
- **Gravidade:** Baixa
- **Contexto em 1 frase:** O módulo "Registros" foi criado com as abas "Lista de Registros" e "Mapa de Registro × Impacto", que já existiam dentro do módulo "Pleitos".
- **Erro observado:** Duplicação de UI e de queries — dois módulos renderizavam os mesmos dados de `incidentes`, gerando confusão para o usuário e aumentando o número de rotas sem necessidade.
- **Causa raiz:** A aba "RDOs" estava ausente em "Pleitos", e em vez de adicioná-la ao módulo existente, um novo módulo "Registros" foi criado englobando as abas que já existiam.
- **Correção aplicada:** Mover a aba RDOs para "Pleitos" e remover o módulo "Registros" do sidebar e do roteamento.
- **Como evitar em projetos futuros:** Antes de criar uma nova página/módulo, verificar se o conteúdo pretendido já existe (mesmo que parcialmente) em alguma página existente. Preferir adicionar uma aba a uma página existente do que criar nova rota para conteúdo parcialmente sobreposto.
- **Referências:** `src/pages/Casos.jsx`, `src/Layout.jsx`, `src/App.jsx`.

---

### L005 — Subagente atinge rate limit no meio da tarefa: trabalho parcial não documentado

- **Data:** 2026-05-14
- **Agente:** Builder (subagente)
- **Milestone:** Refatoração Geral 2026-Q2
- **Categoria:** Processo / DX
- **Gravidade:** Média
- **Contexto em 1 frase:** Subagente implementando Mapa de Impacto atingiu limite de taxa e reportou falha sem indicar quais edições já havia aplicado.
- **Erro observado:** O subagente executou parte das edições em `MapaRegistroImpacto.jsx` (funções de cor e texto já atualizadas) antes de atingir o limite — mas reportou apenas "BLOCKED". O coordenador precisou reler o arquivo para descobrir o que havia sido feito e o que faltava.
- **Causa raiz:** Subagentes não deixam estado parcial visível; quando encerrados abruptamente, o trabalho já commitado fica no repositório mas o que ainda estava em memória se perde sem rastreio.
- **Correção aplicada:** Coordenador releu o arquivo e aplicou diretamente as 4 edições restantes com Edit tool.
- **Como evitar em projetos futuros:** Quando um subagente falha antes de completar, SEMPRE reler o arquivo alvo antes de redispatchar ou editar manualmente — não assumir que nada foi feito. Para tarefas com muitos arquivos, solicitar ao subagente que comite a cada arquivo concluído, não só ao final.
- **Referências:** `src/components/pleitos/MapaRegistroImpacto.jsx`.

---

### L006 — `localStorage.getItem` direto em cada página: dificulta refactor e testes

- **Data:** 2026-05-14
- **Agente:** Architect
- **Milestone:** Refatoração Geral 2026-Q2
- **Categoria:** Arquitetura
- **Gravidade:** Média
- **Contexto em 1 frase:** Cada página chamava `localStorage.getItem("selectedProjectId")` diretamente, acoplando todas as páginas ao `localStorage`.
- **Erro observado:** Durante a Refatoração Q2, quando foi necessário centralizar a lógica de projeto ativo (para futura migração para estado global ou para testes), foi preciso varrer e atualizar ~15 arquivos diferentes.
- **Causa raiz:** Sem abstração, o "como ler o projeto ativo" estava duplicado em cada página — violando o princípio DRY.
- **Correção aplicada:** Criar `src/lib/ProjectContext.jsx` com `useProject()` hook — ponto único de leitura e escrita do `selectedProjectId`.
- **Como evitar em projetos futuros:** Qualquer dado de estado global (sessão, projeto ativo, tema) deve ser exposto via hook/context — nunca lido diretamente do `localStorage` em componentes. Regra em CLAUDE.md: "Usar `useProject()` de `@/lib/ProjectContext` — nunca `localStorage.getItem("selectedProjectId")` direto".
- **Referências:** `src/lib/ProjectContext.jsx`, `CLAUDE.md §3 — Projeto Ativo`.

---

### L007 — Drop de módulo da UI sem remover entidade do shim data layer

- **Data:** 2026-05-14
- **Agente:** Builder
- **Milestone:** Refatoração Geral 2026-Q2
- **Categoria:** Arquitetura / DX
- **Gravidade:** Baixa
- **Contexto em 1 frase:** O módulo Qualidade foi dropado da UI e das rotas, mas as entidades `RNC`, `LicaoAprendida` e `AtaReuniao` permaneceram em `supabaseEntities.js`.
- **Erro observado:** Código morto no data layer — 3 entidades sem uso referenciadas no TABLE_MAP. Detectado na conferência de verificação do milestone.
- **Causa raiz:** O checklist de drop do módulo cobria UI (componentes, páginas) e rotas, mas não incluía explicitamente o `supabaseEntities.js`.
- **Correção aplicada:** Remover as 3 linhas do TABLE_MAP em `src/api/supabaseEntities.js`.
- **Como evitar em projetos futuros:** Ao dropar qualquer módulo, verificar obrigatoriamente: (1) componentes, (2) páginas, (3) rotas em App.jsx, (4) sidebar/navigationConfig, (5) `supabaseEntities.js`, (6) referências no Dashboard e outros módulos via grep.
- **Referências:** `src/api/supabaseEntities.js`, `src/App.jsx`.

---

### L008 — Documentação não atualizada junto com o código acumula dívida crítica

- **Data:** 2026-05-14
- **Agente:** Architect
- **Milestone:** Refatoração Geral 2026-Q2
- **Categoria:** Processo / DX
- **Gravidade:** Média
- **Contexto em 1 frase:** Ao final da Refatoração Q2, todos os docs de módulos (`docs/modulos/`) ainda referenciavam Base44 (backend antigo), rotas legadas e entidades inexistentes.
- **Erro observado:** Um novo desenvolvedor lendo `docs/modulos/00-Indice.md` encontraria `base44.entities.NomeDaEntidade` — código que nunca funcionaria, pois o backend foi migrado para Supabase há meses.
- **Causa raiz:** A documentação foi desacoplada do ciclo de desenvolvimento — nenhuma task do milestone incluía "atualizar doc do módulo X ao refatorá-lo".
- **Correção aplicada:** Fase Documentação dedicada ao final do milestone, com reescrita completa de todos os docs de módulos.
- **Como evitar em projetos futuros:** Incluir "atualizar doc do módulo em `docs/modulos/`" como subtarefa de TODA task de refatoração de módulo. Doc desatualizado é dívida técnica tão real quanto código morto.
- **Referências:** `docs/modulos/`, `PLAN.md — Fase Documentação`.

---

### L010 — Criar componentes-base antes de escalar padrão por módulo

- **Data:** 2026-05-29
- **Agente:** Designer
- **Milestone:** M13-C — Padronização de Design (Auditoria Completa)
- **Categoria:** UI/UX
- **Gravidade:** Alta
- **Contexto em 1 frase:** Auditoria identificou 30 divergências visuais entre 23 páginas porque cada módulo reimplementou cabeçalhos, badges, KPIs e modais à mão.
- **Erro observado:** 8+ mapas `STATUS_COLORS` redeclarados por arquivo; 3 variantes de botão "Salvar"; 4 variações de título de seção; 10 overlays de modal manuais — tudo paralelo, tudo divergente.
- **Causa raiz:** Nenhum componente-base compartilhado foi criado antes de escalar o sistema. Cada módulo foi desenvolvido isoladamente e copiou o padrão do anterior com pequenas variações não documentadas.
- **Correção aplicada:** Criados `StatusBadge`, `KPICard` e `SectionTitle`; token `status-info` adicionado; todos os mapas de status migrados para o componente central; convenção de botões codificada em DESIGN.md.
- **Como evitar em projetos futuros:** Antes de criar o segundo módulo, definir e documentar: (1) o componente de badge de status; (2) o card de KPI; (3) o título de seção; (4) a convenção de botões (CTA/Salvar/Cancelar). Esses 4 itens eliminam ~80% das divergências de design. Adicionar checklist no `/milestone-start`.
- **Referências:** `docs/design/DESIGN.md`, `src/components/ui/StatusBadge.jsx`, `src/components/ui/KPICard.jsx`, `src/components/ui/SectionTitle.jsx`.

---

### L011 — Auto-heal de audit exige commit imediato para não perder trabalho validado

- **Data:** 2026-05-29
- **Agente:** Tester
- **Milestone:** M13 — Riscos e Mudanças
- **Categoria:** Processo / DX
- **Gravidade:** Baixa
- **Contexto em 1 frase:** O processo auto-healed corrigiu `isError`, `AlertDialog` e `KPICard` no audit de M13, mas os ~20 arquivos ficaram sem commit por uma sessão inteira.
- **Erro observado:** Audit declarado "Verified & Polished 9/10" com trabalho não commitado — em caso de reversão acidental ou crash, todas as correções do auto-heal seriam perdidas silenciosamente.
- **Causa raiz:** O ciclo audit → auto-heal → "Verified" não inclui explicitamente um passo de commit. O agente considerou o trabalho concluído ao atingir o score, sem fechar o loop com git.
- **Correção aplicada:** Commit postergado para a sessão seguinte no `/milestone-close`.
- **Como evitar em projetos futuros:** Incluir `git commit` como etapa obrigatória **no mesmo ciclo** em que `/audit` declara "Verified". Regra: não fechar o ciclo de audit sem o hash do commit no registro.
- **Referências:** `PLAN.md — M13`, `src/components/riscos/PlanoAcao.jsx`, `src/pages/RiscosMudancas/`.

### L012 — Stash órfão acumulado: commitar working tree ANTES de git stash pop para evitar conflitos em cascata

- **Data:** 2026-06-02
- **Agente:** Builder
- **Milestone:** M14 — Padronização de Filtros / FilterToolbar
- **Categoria:** Processo / Git
- **Gravidade:** Média
- **Contexto em 1 frase:** Um stash criado em 8be1d05 acumulou 25 arquivos de correções sem commit; quando o stash foi popado, o working tree dirty gerou conflitos em 5 arquivos simultâneos.
- **Erro observado:** `git stash pop` produziu conflitos em `MedicaoForm.jsx`, `SixWLATable.jsx`, `TakeOffCommodities.jsx`, `ItemMASForm.jsx` e `MapaSuprimentos.jsx`. Dois deles (`TakeOffCommodities`) ficaram com referências a variáveis indefinidas (`filtroUnidade`, `filtroDisciplina`) que precisaram ser corrigidas manualmente.
- **Causa raiz:** O stash foi criado em um commit anterior (8be1d05) e o branch acumulou 5 commits com mudanças sobrepostas. Fazer `git stash pop` sem commitar o working tree atual primeiro gerou conflitos tri-laterais (stash base + stash changes + working tree changes).
- **Correção aplicada:** R1: commit do working tree atual; R2: `git stash pop` + resolução manual dos 5 conflitos; R3: verificação das features críticas; R4: commit de recuperação `521cc1c`.
- **Como evitar em projetos futuros:** **Nunca criar um stash quando há intenção de continuar trabalhando naqueles arquivos.** Regra: antes de cada `git stash pop`, sempre commitar (ou pelo menos stagear) o working tree atual para que o merge seja binário (HEAD vs stash), não tri-lateral.
- **Referências:** commits `f7821b6` (R1), `521cc1c` (R4); `src/components/planejamento/SixWLATable.jsx`, `src/components/planejamento/TakeOffCommodities.jsx`.

### L013 — GerenciarProjeto: STATUS_OPTIONS do frontend divergia 100% da constraint do banco

- **Data:** 2026-06-02
- **Agente:** Builder
- **Milestone:** Em andamento
- **Categoria:** Banco
- **Gravidade:** Alta
- **Contexto em 1 frase:** Ao tentar criar ou editar um projeto na tela Gerenciar Projeto, o banco retornava erro de constraint violation.
- **Erro observado:** `new row for relation "projetos" violates check constraint "projetos_status_check"` — qualquer salvar falhava.
- **Causa raiz:** O array `STATUS_OPTIONS` no componente usava `["Ativo", "Em Pausa", "Encerrado"]`, mas a constraint do banco aceita apenas `['Planejamento','Em Andamento','Pausado','Concluído','Cancelado']`. Nenhum dos valores do frontend era válido no banco.
- **Correção aplicada:** Atualizar `STATUS_OPTIONS`, `STATUS_CFG` (chaves e ícones) e o valor padrão `EMPTY_FORM.status` para coincidir com os valores da constraint. Fallback no `handleEdit` alterado de `"Ativo"` para `"Planejamento"`.
- **Como evitar em projetos futuros:** Ao criar ou revisar qualquer `<Select>` de campo de status, verificar primeiro a constraint correspondente em `docs/database/supabase-migration.sql`. Os valores do componente devem ser cópia literal dos valores da constraint — não paráfrases nem traduções.
- **Referências:** `src/pages/Configuracoes/GerenciarProjeto.jsx`; `docs/database/supabase-migration.sql` linha 19.

### L014 — Histograma/Avanços: campo `data_fim_prevista` não existe na tabela `projetos`

- **Data:** 2026-06-02
- **Agente:** Builder
- **Milestone:** Em andamento
- **Categoria:** Banco
- **Gravidade:** Alta
- **Contexto em 1 frase:** Histograma de MO/Equipamentos e página de Avanços Físicos exibiam "Configure as datas de início e fim" mesmo com datas configuradas no projeto.
- **Erro observado:** Guard `if (!projeto?.data_inicio || !projeto?.data_fim_prevista)` sempre disparava porque `data_fim_prevista` é `undefined` — o campo não existe no retorno do Supabase.
- **Causa raiz:** A tabela `projetos` tem `data_prevista_termino` (nome real da coluna). O `GerenciarProjeto.jsx` usa `data_fim_prevista` como **alias de estado local** do formulário (mapeando corretamente para o banco ao salvar), mas `HistogramaTabela.jsx` e `Avancos.jsx` liam o alias do formulário diretamente da entidade, onde nunca existe.
- **Correção aplicada:** Substituir `projeto?.data_fim_prevista` por `projeto?.data_prevista_termino` nas linhas de guard e de `useMemo` nos dois arquivos afetados.
- **Como evitar em projetos futuros:** Ao referenciar campos de projeto em novos componentes, verificar sempre o nome real da coluna em `docs/database/supabase-migration.sql` — não copiar de outros componentes sem confirmar se aquele campo é DB ou estado local de formulário.
- **Referências:** `src/components/histograma/HistogramaTabela.jsx` linhas 159/279; `src/pages/Planejamento/Avancos.jsx` linhas 101/225; `docs/database/supabase-migration.sql` linha 18.

---

### L015 — Riscos: UI tratava campo TEXT (`probabilidade`/`impacto`) como número, corrompendo dados na edição

- **Data:** 2026-06-02
- **Agente:** Tester
- **Milestone:** Auditoria QA módulo a módulo
- **Categoria:** Banco
- **Gravidade:** Crítica
- **Contexto em 1 frase:** Auditoria do módulo Gestão de Riscos cruzando o código com o schema real do banco.
- **Erro observado:** A matriz 5×5 ficava sempre vazia, `score` dava `NaN`, e **editar um risco existente sobrescrevia `probabilidade`/`impacto` para `3`** — `handleEdit` carregava o texto `"Alta"` num `<input type=number>` e `handleSubmit` gravava `Number("Alta") || 3`.
- **Causa raiz:** As colunas `probabilidade` e `impacto` da tabela `riscos` são `TEXT` (`'Alta'/'Média'/'Baixa'`, `'Alto'/'Médio'`), mas a UI assumia inteiros 1-5 (campos number, `score = p*i`, chave de matriz `${p}-${i}`). O pressuposto de tipo nunca foi validado contra o banco real (a `supabase-migration.sql` local estava desatualizada).
- **Correção aplicada:** Selects qualitativos (`PROBABILIDADE_OPTIONS`/`IMPACTO_OPTIONS`), helpers `pesoProbabilidade`/`pesoImpacto`/`calcScoreRisco` centralizados em `riscosUtils.js` (com tolerância a dados legados numéricos), matriz/score/KPIs derivados do texto, e `STATUS_RISCO` alinhado aos valores reais (`Ativo/Monitoramento/Mitigado/Encerrado`). Teste de regressão em `riscosUtils.test.js`.
- **Como evitar em projetos futuros:** Antes de tratar qualquer campo como número, confirmar o `data_type` real da coluna (`information_schema.columns` no banco, não a migration local). Campo de avaliação qualitativa é quase sempre TEXT — derivar peso por mapa, nunca `Number()` direto.
- **Referências:** `src/utils/riscosUtils.js`, `src/pages/RiscosMudancas/GestaoRiscos.jsx`, `src/utils/riscosUtils.test.js`.

---

### L016 — Persistir coluna inexistente (`semana_iso`) quebra o create; valide nomes de coluna no banco real

- **Data:** 2026-06-02
- **Agente:** Tester
- **Milestone:** Auditoria QA módulo a módulo
- **Categoria:** Banco
- **Gravidade:** Alta
- **Contexto em 1 frase:** Cadastro de lançamentos de commodity no Take-Off.
- **Erro observado:** Criar um lançamento novo pela UI falhava — o código gravava `semana_iso`, mas `lancamentos_commodity` só tem a coluna `semana` (`TEXT NOT NULL`). Registros antigos tinham `semana` (de versão anterior/seed), mascarando a regressão na listagem.
- **Causa raiz:** O nome da chave enviada ao `create`/`update` divergia do nome real da coluna; o INSERT enviava coluna desconhecida e omitia `semana` (NOT NULL). A leitura usava fallback `semana_iso || semana`, escondendo o problema.
- **Correção aplicada:** Helper `toLancPayload` que mapeia o valor para a chave `semana` e remove `semana_iso` antes de `create`/`update`.
- **Como evitar em projetos futuros:** Mesma regra de L013/L015 — os nomes de coluna gravados devem ser cópia literal do schema real. Quando a leitura usa fallback entre dois nomes (`a || b`), é sinal de divergência: padronizar a escrita no nome canônico do banco.
- **Referências:** `src/components/planejamento/TakeOffCommodities.jsx`.

> **Padrão recorrente (L013 + L014 + L015 + L016):** quatro bugs de integridade no mesmo período por código divergir do schema real. A `docs/database/supabase-migration.sql` está desatualizada e **não deve ser usada como fonte da verdade** — consultar o banco (`information_schema`/`pg_constraint`) ou regenerá-la. Candidato a regra no próximo `/milestone-close`.

---

### L017 — Novas tabelas criadas sem `created_at`/`updated_at` quebram o shim genérico de dados

- **Data:** 2026-06-02
- **Agente:** Tester
- **Milestone:** QA Geral módulo a módulo (Onda 3)
- **Categoria:** Banco / Arquitetura
- **Gravidade:** Alta
- **Contexto em 1 frase:** Módulo Cadastros (Pacotes e Disciplinas) em produção falhava em `list` e `update` silenciosamente.
- **Erro observado:** `entities.PacoteSuprimento.list()` tentava `.order('created_at', { ascending: false })` numa tabela sem a coluna → erro Supabase. `entities.PacoteSuprimento.update()` e `entities.Disciplina.update()` injetavam `updated_at: new Date().toISOString()` em colunas inexistentes → erro no `UPDATE`. A tabela `pacotes_suprimento` não tinha `created_at` nem `updated_at`; `disciplinas` não tinha `updated_at`.
- **Causa raiz:** O shim `createEntityClient` em `supabaseEntities.js` assume que toda tabela tem `created_at` (para ordenação no `list`) e `updated_at` (injetado no `update`). Quando uma nova tabela é criada no banco sem essas colunas, todos os métodos de leitura e escrita falham.
- **Correção aplicada:** Migration `add_timestamps_to_pacotes_suprimento_and_disciplinas` adicionou `created_at TIMESTAMPTZ DEFAULT now()` e `updated_at TIMESTAMPTZ DEFAULT now()` às tabelas faltantes.
- **Como evitar em projetos futuros:** Toda tabela gerenciada pelo shim de `supabaseEntities.js` **deve** ter as colunas `id`, `created_at` e `updated_at`. Ao criar uma nova tabela/entidade no banco, incluir essas três colunas como pré-requisito antes de adicionar ao `TABLE_MAP`. Verificar com `list_tables --verbose` via MCP após cada migration.
- **Referências:** `src/api/supabaseEntities.js`, tabelas `pacotes_suprimento` e `disciplinas`.

---

## 6. Como curar o arquivo

A cada `/milestone-close`, o Architect:

1. Lê as lições adicionadas no milestone que acabou de fechar.
2. Promove lições recorrentes a **regra explícita** em CLAUDE.md / AGENTS.md / SKILLS.md.
3. Marca como `Obsoleta` (sem apagar) lições cobertas por uma regra nova.
4. Se o arquivo passar de ~40 entradas ativas, cria `LESSONS-YYYY.md` arquivando o ano anterior.

---

## Documentos Relacionados

| Precisa saber... | Leia |
|---|---|
| Regras do projeto | [/CLAUDE.md](../CLAUDE.md) |
| Agentes (quem deve registrar) | [./AGENTS.md](./AGENTS.md) |
| Skills (quando registrar) | [./SKILLS.md](./SKILLS.md) |
| Decisões irreversíveis | [./adrs/](./adrs/) |

> Índice canônico completo: [CLAUDE.md §7](../CLAUDE.md#7-documentos-do-projeto).
