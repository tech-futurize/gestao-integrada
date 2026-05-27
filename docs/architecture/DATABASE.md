# DATABASE.md — Schema do Banco de Dados

> Documenta todas as tabelas, campos e relacionamentos do banco.
> **Consulta obrigatória** para o Builder antes de criar ou alterar qualquer tabela.
> Schema completo em: `supabase-migration.sql`

---

## Visão Geral

- **Banco:** Supabase PostgreSQL
- **Total de tabelas:** ~25 (após Milestone Refatoração Geral 2026-Q2)
- **Auth:** Supabase Auth (tabela `auth.users` gerenciada pelo Supabase)
- **RLS:** Habilitado em todas as tabelas com policy aberta para `authenticated`
- **UUID:** `gen_random_uuid()` como PK padrão
- **Timestamps:** `created_at` e `updated_at` em todas as tabelas
- **Migration ativa:** `supabase-migration-2026-q2.sql` (aplicar antes de rodar o app)

### Tabelas removidas
- ~~`rncs`~~ — módulo Qualidade dropado
- ~~`licoes_aprendidas`~~ — módulo Qualidade dropado
- ~~`atas_reuniao`~~ — módulo Qualidade dropado
- ~~`requisicoes_compra`~~ — submódulo Suprimentos dropado da UI
- ~~`cotacoes`~~ — submódulo Suprimentos dropado da UI

### Tabelas adicionadas (Q2)
- `unidades_medida` — tabela de lookup global de unidades de medida
- `plano_acao` — plano de ação para riscos e mudanças contratuais
- `rdo` — RDO desacoplado de `registros`
- `usuarios` — cadastro básico de usuários

> **Nota:** `acoes` **NÃO foi removida**. Continua ativa para Pleitos (`pleitos`). A tabela `plano_acao` é distinta — serve exclusivamente a Riscos e Mudanças.
> **Migration pendente (se não aplicada):** `ALTER TABLE incidentes RENAME TO registros; ALTER TABLE casos RENAME TO pleitos;`

### Tabelas no banco sem acesso via TABLE_MAP (sem UI ativa)
As tabelas abaixo existem no Supabase mas não estão mapeadas em `supabaseEntities.js` — não são acessadas pelo código atual:
- `documentos_contratuais`, `engenharias`, `recursos`, `relacionamentos`, `rotinas`, `ruidos`, `plano_acao`, `unidades_medida`

---

## Diagrama de Relacionamentos (simplificado)

```
projetos (1)
  ├── registros (N)                          ← Registros de ocorrências
  ├── rdo (N)                                ← RDO próprio (desacoplado de registros)
  ├── pleitos (N)                            ← Pleitos contratuais
  │   └── acoes (N)                          ← Plano de ação dos pleitos
  ├── financeiros (N)
  ├── avanco_fisico (N)
  ├── mudancas_contratuais (N)
  ├── riscos (N)
  ├── contratos (N) → medicoes (N)
  │              └── aditivos (N)
  ├── tarefas_cronograma (N, self-ref pai_id)
  │   └── itens_6wla (N) via tarefa_cronograma_id
  ├── commodities (N) → lancamentos_commodity (N)
  ├── itens_mas (N)
  ├── documentos_engenharia (N) → tarefas_cronograma (FK opcional)
  ├── histogramas (N) via recurso_id
  └── usuarios (N)
```

> **Removidos (UI + DB):** `requisicoes_compra`, `cotacoes`, `rncs`, `licoes_aprendidas`, `atas_reuniao`
> **Existem no DB sem UI ativa:** `documentos_contratuais`, `engenharias`, `recursos`, `relacionamentos`, `rotinas`, `ruidos`, `plano_acao`, `unidades_medida`

---

## Tabelas

### projetos
Entidade raiz. Todos os dados são filtrados por `projeto_id`.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | UUID PK | |
| nome | TEXT NOT NULL | |
| descricao | TEXT | |
| cliente | TEXT NOT NULL | |
| data_inicio | DATE | |
| data_prevista_termino | DATE | |
| status | TEXT | Planejamento / Em Andamento / Pausado / Concluído / Cancelado |
| responsavel_geral | TEXT | |
| valor_contrato | NUMERIC | |

---

### documentos_contratuais
Documentos formais do contrato (Contrato, Aditivos, OS, etc).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| nome_documento | TEXT NOT NULL | |
| tipo_documento | TEXT | Contrato / Aditivo / Ordem de Serviço / Anexo / Proposta Técnica / Outros |
| url_arquivo | TEXT | |
| data_referencia | DATE | |

---

### registros
Registros de ocorrências / notificações (módulo Registros na UI).
> Tabela renomeada de `incidentes` para `registros`. RDO foi desacoplado para a tabela `rdo`.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| data_hora | TIMESTAMPTZ | Campo `hora` removido |
| descricao | TEXT NOT NULL | |
| impacto_preliminar | TEXT | |
| probabilidade | TEXT | Baixa / Média / Alta |
| gravidade | TEXT | Baixa / Média / Alta |
| status | TEXT | Registrado / Em Análise / Resolvido (status "Fechado" removido) |
| responsavel_registro | TEXT | |
| pleito_id | UUID FK → pleitos | SET NULL |
| atividades_vinculadas | JSONB | IDs de tarefas_cronograma vinculadas |
| anexos | JSONB | URLs do Supabase Storage (bucket `registros-anexos`) |

> Colunas RDO removidas: `rdo_data`, `numero_rdo`, `area`, `disciplina`, `condicoes_climaticas_*`, `turnos_*`, `horarios_*`, `mao_de_obra`, `equipamentos_rdo`, `atividades`, `ocorrencias`, `responsabilidade`, `impacto_ocorrencia`.

---

### rdo
Relatórios Diários de Obra — desacoplado de `registros`.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| numero | TEXT | |
| data | DATE NOT NULL | |
| area | TEXT | |
| disciplinas | JSONB | Array de strings (seleção múltipla) |
| clima | JSONB | `{manha, tarde, noite}` com condicao/praticabilidade independentes |
| mao_de_obra | JSONB | Array `[{nome, funcao, quantidade}]` |
| equipamentos | JSONB | Array `[{nome, identificacao, quantidade}]` |
| atividades_vinculadas | JSONB | Array de IDs de tarefas_cronograma |
| ocorrencias | JSONB | Array de ocorrências com atividades_vinculadas próprias |
| impactos | JSONB | |
| evidencias | JSONB | URLs do Supabase Storage (bucket `rdo-evidencias`) |

---

### pleitos
Pleitos contratuais — o core do módulo de Pleitos.
> Tabela renomeada de `casos` para `pleitos`.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| titulo | TEXT NOT NULL | |
| descricao_problema | TEXT NOT NULL | |
| contexto | TEXT | |
| partes_envolvidas | JSONB | Array de strings |
| data_abertura | DATE | |
| status | TEXT | Aberto / Em Análise / Em Andamento / Resolvido / Fechado / Cancelado |
| responsavel | TEXT | |
| aspecto_ordem | TEXT | Técnica / Física / Econômica / Todos |
| classificacao_cone | TEXT | Megatendência / Tendências / Riscos / ... |
| prioridade | TEXT | Baixa / Média / Alta / Crítica |
| categorias | JSONB | Array de categorias |

---

### plano_acao *(sem UI ativa — existe no DB)*
Plano de ação para Riscos e Mudanças Contratuais. Distinto de `acoes` (que continua ativo para Pleitos).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| descricao | TEXT NOT NULL | |
| formato_tratativa | TEXT | Reunião / Documento / Inspeção / Análise Técnica / Negociação / Outros |
| data_prevista | DATE | |
| data_real | DATE | |
| responsavel | TEXT | |
| status | TEXT | Pendente / Em Andamento / Concluída / Atrasada / Cancelada |
| registro_risco_id | UUID FK → riscos | SET NULL |
| registro_mudanca_id | UUID FK → mudancas_contratuais | SET NULL |

> CHECK: `registro_risco_id IS NOT NULL OR registro_mudanca_id IS NOT NULL` (obrigatório vincular a risco ou mudança).

---

### engenharias
Planos de ação por área de engenharia (Mobilização, Produção, etc.).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| nome | TEXT | Mobilização / Produção / Qualidade / Segurança / Suprimentos / Planejamento |
| descricao_acao | TEXT NOT NULL | |
| responsavel | TEXT | |
| finalidade | TEXT | |
| status | TEXT | Funcionando / Não Implementado / Necessário Melhorias / Em Implantação / Com Atrasos |

---

### financeiros
Faturamento previsto vs. realizado por mês.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| mes_referencia | DATE NOT NULL | Primeiro dia do mês |
| faturamento_previsto_mensal | NUMERIC | |
| faturamento_realizado_mensal | NUMERIC | |
| faturamento_previsto_acumulado | NUMERIC | |
| faturamento_realizado_acumulado | NUMERIC | |

---

### recursos
Recursos do projeto (MOD, MOI, Equipamentos) com preço unitário.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| tipo_recurso | TEXT | MOD / MOI / EQUIPAMENTO |
| nome_recurso | TEXT NOT NULL | |
| unidade_medida | TEXT | HH / HM / UND / HORA / DIA / MÊS |
| preco_unitario | NUMERIC NOT NULL | |
| referencia_custo | TEXT | Contrato / SINAPI / SEOP / RDO / Outros |

---

### histogramas
Quantidade e valor de recursos por mês (histograma de MOD/equipamentos).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| recurso_id | UUID FK → recursos | CASCADE |
| mes_referencia | DATE NOT NULL | |
| quantidade_prevista_mensal | NUMERIC | |
| quantidade_realizada_mensal | NUMERIC | |
| valor_previsto_mensal | NUMERIC | |
| valor_realizado_mensal | NUMERIC | |

---

### avanco_fisico
Avanço físico previsto vs. realizado por mês.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| mes_referencia | DATE NOT NULL | |
| avanco_previsto_mensal | NUMERIC | |
| avanco_realizado_mensal | NUMERIC | |
| avanco_previsto_acumulado | NUMERIC | |
| avanco_realizado_acumulado | NUMERIC | |

---

### contratos
Contratos com fornecedores e prestadores de serviço.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| numero | TEXT | |
| objeto | TEXT NOT NULL | |
| fornecedor | TEXT NOT NULL | |
| cnpj | TEXT | |
| valor_total | NUMERIC | Formatação BR (ponto milhar, vírgula decimal) no front |
| data_inicio | DATE | Data de início original |
| data_fim | DATE | Data de término original |
| status | TEXT | **A iniciar / Em andamento / Concluído / Paralisado** |
| tipo | TEXT | **Fornecimento / Serviço / Fornecimento + Serviço** (ex-"Misto" migrado) |
| centro_custo | TEXT | |
| gestor | TEXT | |

> Datas "Início Atual" e "Término Atual" são **calculadas no front** somando `Σ(dias_adicionais)` dos aditivos ao `data_fim` original. Não são persistidas.

---

### medicoes
Medições de serviços executados vinculadas a contratos.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| contrato_id | UUID FK → contratos | CASCADE |
| numero | TEXT NOT NULL | |
| periodo_inicio / fim | DATE | |
| valor | NUMERIC | Soma automática dos `itens` (read-only no front). Ex-"valor_liquido" |
| status | TEXT | Elaboração / Em Revisão / Em Aprovação / Aprovada / Paga / Rejeitada |
| aprovador | TEXT | |
| itens | JSONB | Array `[{descricao, quantidade, valor_unitario}]` |

> Campos removidos: `elaborador`, `valor_bruto`, `retencao`.

---

### aditivos
Aditivos de prazo e/ou valor de contratos.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| contrato_id | UUID FK → contratos | CASCADE |
| numero | TEXT | |
| tipo | TEXT NOT NULL | Prazo / Valor / Prazo e Valor |
| escopo_texto | TEXT | Descrição do escopo alterado |
| prazo_dias | INTEGER | Dias adicionados ao contrato |
| valor | NUMERIC | Valor em R$ do aditivo |
| justificativa | TEXT | |
| data_assinatura | DATE | |
| status | TEXT | Pendente / Assinado / Cancelado |

---

### ~~requisicoes_compra~~ *(REMOVIDA da UI — submódulo Suprimentos dropado)*
Solicitações de compra de materiais e serviços.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| numero | TEXT | |
| solicitante | TEXT NOT NULL | |
| data_necessidade | DATE | |
| centro_custo | TEXT | |
| justificativa | TEXT | |
| status | TEXT | Rascunho / Aprovada / Em Cotação / Pedido Emitido / Recebido / Cancelada |
| itens | JSONB | |

---

### ~~cotacoes~~ *(REMOVIDA da UI — submódulo Suprimentos dropado)*
Cotações vinculadas a requisições de compra.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| requisicao_id | UUID FK → requisicoes_compra | SET NULL |
| numero / titulo | TEXT | |
| status | TEXT | Aberta / Em Análise / Aprovada / Cancelada |
| data_limite | DATE | |
| fornecedor_selecionado | TEXT | |
| valor_aprovado | NUMERIC | |
| propostas | JSONB | Array de propostas |

---

### tarefas_cronograma
Estrutura WBS do cronograma com hierarquia pai/filho (até 9 níveis).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| pai_id | UUID FK → tarefas_cronograma | SET NULL (self-ref) |
| codigo_wbs | TEXT | |
| nome | TEXT NOT NULL | |
| tipo | TEXT | Resumo / Atividade / Marco |
| nivel | INTEGER | CHECK (nivel BETWEEN 1 AND 9) |
| data_inicio_planejada / data_fim_planejada | DATE | Datas planejadas originais |
| data_inicio_real / data_fim_real | DATE | Datas efetivas |
| inicio_baseline / termino_baseline | DATE | Linha de base |
| inicio_previsto / termino_previsto | DATE | Previsão de conclusão (atualizada) |
| avanco_previsto | NUMERIC | 0–100 |
| avanco_realizado | NUMERIC | 0–100 |
| area | TEXT | |
| disciplina | TEXT | |
| caminho_critico | BOOLEAN | default false |
| predecessoras | TEXT | |
| status | TEXT | Calculado: A Iniciar / Em Andamento / Atrasada / Concluído |

> **Fórmula de status:** `Se prev=0 e real=0 → "A Iniciar"; Se real=100 → "Concluído"; Se prev > real → "Atrasada"; Se real >= prev → "Em Andamento"`

---

### relacionamentos *(sem UI ativa — existe no DB)*
Registro de interações com stakeholders.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| data_interacao | DATE NOT NULL | |
| descricao | TEXT NOT NULL | |
| partes_envolvidas | JSONB | |
| objetivo / resultado | TEXT | |
| classificacao | TEXT | Excelente / Bom / Neutro / Tenso / Crítico |

---

### rotinas *(sem UI ativa — existe no DB)*
Rotinas de gestão com periodicidade e controle de execução.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| descricao | TEXT NOT NULL | |
| responsavel | TEXT | |
| periodicidade | TEXT | Diária / Semanal / Quinzenal / Mensal / Trimestral / Semestral / Anual |
| data_ultima_execucao | DATE | |
| proxima_data_execucao | DATE | |
| status | TEXT | Em Dia / Atrasada / Concluída |

---

### ruidos *(sem UI ativa — existe no DB)*
Riscos/sinais fracos identificados no projeto.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| pleito_id | UUID FK → pleitos | SET NULL |
| descricao | TEXT NOT NULL | |
| causas_potenciais | TEXT | |
| impacto_potencial | TEXT | |
| probabilidade | TEXT | Baixa / Média / Alta |
| categoria | TEXT | Técnica / Financeira / Ambiental / Jurídica / Outros |
| data_identificacao | DATE | |
| responsavel | TEXT | |
| status | TEXT | Identificado / Em Análise / Descartado / Promovido |

---

### commodities
Take-off de quantitativos por disciplina.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| codigo | TEXT | |
| descricao | TEXT NOT NULL | |
| disciplina | TEXT | Civil / Mecânica / Tubulação / Elétrica / Estrutura Metálica / Instrumentação / Pintura / Outros |
| unidade | TEXT NOT NULL | |
| qtd_contrato | NUMERIC | |
| qtd_takeoff | NUMERIC | |

---

### lancamentos_commodity
Produção semanal por commodity.

| Coluna | Tipo | Notas |
|--------|------|-------|
| commodity_id | UUID FK → commodities | CASCADE |
| projeto_id | UUID FK → projetos | CASCADE |
| semana | TEXT NOT NULL | Ex: "S01/2025" |
| data_inicio / fim | DATE | |
| quantidade | NUMERIC NOT NULL | |
| responsavel | TEXT | |

---

### ~~rncs~~ (REMOVIDA)
> Tabela dropada no Milestone Refatoração Geral 2026-Q2 (DROP TABLE rncs CASCADE). Módulo Qualidade removido.

---

### itens_mas
Itens do Mapa de Acompanhamento de Suprimentos (MAS). Submódulos "Requisições" e "Cotações" removidos da UI.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| descricao | TEXT NOT NULL | |
| unidade_id | TEXT FK → unidades_medida | Substituí `unidade` text |
| quantidade | NUMERIC | |
| numero_sc | TEXT NOT NULL | Label UI: "N SC/OC" |
| solicitante | TEXT | Label UI: "Responsável" |
| fornecedor | TEXT | |
| id_cronograma | UUID FK → tarefas_cronograma | SET NULL |
| data_cronograma | DATE | Preenchida ao vincular a tarefa |
| status | TEXT | A iniciar / Em andamento / Concluído / Cancelado |
| etapas | JSONB | Array `[{nome, data_prevista, data_real}]` |

> `data_necessidade` foi substituída por `data_cronograma` (vínculo via `id_cronograma`).

---

### unidades_medida
Tabela de lookup global de unidades de medida. Sem `projeto_id`.

| Coluna | Tipo | Notas |
|--------|------|-------|
| codigo | TEXT PK | kg / t / m3 / m2 / m / l / un / pc / h / mes / vb |
| descricao | TEXT NOT NULL | Ex: "Quilograma", "Metro Cúbico" |

> Referenciada por: `recursos.unidade_id`, `itens_takeof.unidade_id`, `commodities.unidade_id`, `itens_mas.unidade_id`.

---

### documentos_engenharia
Gestão documental de engenharia (emissão, revisões, aprovações).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| tag_id | TEXT NOT NULL | Código único do documento |
| titulo | TEXT NOT NULL | |
| disciplina | TEXT | MEC / CIV / ELE / TUB / INS / AUT / EST / PRC / HSE |
| fornecedor | TEXT | |
| num_folhas | INTEGER | |
| revisao_atual | TEXT | A / B / C / 0 / 1 ... |
| etapa | TEXT | A Emitir / Em Elaboração / Em Verificação Técnica / Comentários do Cliente / Aprovado |
| progresso | INTEGER | 0–100% |
| deadline | DATE | |
| prioridade | TEXT | Alta / Média / Baixa |
| historico_revisoes | JSONB | |
| historico_etapas | JSONB | |

>
---

### mudancas_contratuais
Gestão de mudanças de escopo, prazo e valor do contrato.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| titulo | TEXT | |
| descricao | TEXT | |
| origem | TEXT | Contratante / Contratado / Regulatório / Técnico |
| status | TEXT | Identificada / Em Análise / Aprovada / Rejeitada / Implementada |
| impacto_custo | NUMERIC | |
| impacto_prazo_dias | NUMERIC | |
| impacto_escopo | TEXT | |
| impacto_escopo_tipo | TEXT | **Adição** ou **Redução** (radio único na UI) |
| data_registro | DATE | Ex-`data_ocorrencia` |
| pleito_texto | TEXT | |
| responsavel | TEXT | |
| categorias | JSONB | Sincronizado com categorias do Mapa de Impacto |

---

### riscos (alterada)
Gestão de riscos do projeto.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| codigo | TEXT | |
| descricao | TEXT NOT NULL | |
| categoria | TEXT | Sincronizada com `src/lib/categorias.js` |
| probabilidade | TEXT | Baixa / Média / Alta |
| impacto_nivel | TEXT | Baixa / Média / Alta |
| impactos | JSONB | Array com 0..3 valores: 'Escopo', 'Prazo', 'Valor' |
| escopo_texto | TEXT | |
| prazo_dias | INTEGER | |
| valor_impacto | NUMERIC | |
| score | NUMERIC | |
| status | TEXT | |
| responsavel | TEXT | |
| mitigacao | TEXT | |
| residual | TEXT | |

---

### usuarios
Cadastro básico de usuários (sem RBAC granular neste milestone).

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | UUID PK | |
| email | TEXT UNIQUE NOT NULL | |
| nome | TEXT NOT NULL | |
| papel | TEXT | default 'usuario' (livre neste milestone) |
| projeto_padrao_id | UUID FK → projetos | SET NULL |
| created_at / updated_at | TIMESTAMPTZ | |

---

### itens_6wla (alterada)
Look-ahead de 6 semanas — vínculo obrigatório com o cronograma.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| tarefa_cronograma_id | UUID FK → tarefas_cronograma | NOT NULL |
| observacao | TEXT | |
| restricoes | JSONB | `{documentos, material, equipamentos, mao_obra, seguranca, qualidade}` — cada um array bool[6] |

> `semanas` (array bool[6] de atividade ativa) é calculado no front pela sobreposição de `[inicio_previsto, termino_previsto]` da tarefa com a janela de cada semana. Não persistido.

---

> **Ownership:** Architect | **Atualizado a cada:** migration relevante

---

## Migrations

| Data | Arquivo | Descrição | Impacto |
|------|---------|-----------|---------|
| 2026-Q1 | `supabase-migration.sql` | Criação inicial do schema (~30 tabelas) | Todas as tabelas base |
| 2026-Q2 | `supabase-migration-2026-q2.sql` | Refatoração Geral: Drop Qualidade, criação de `unidades_medida`, `plano_acao`, `rdo`, `usuarios`; ALTER em 10+ tabelas | Ver seção "Tabelas removidas/adicionadas" acima |

---

## Documentos Relacionados

- Arquitetura geral → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Serviços externos que acessam o banco → [INTEGRATIONS.md](./INTEGRATIONS.md)
