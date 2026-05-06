# DATABASE.md — Schema do Banco de Dados

> Documenta todas as tabelas, campos e relacionamentos do banco.
> **Consulta obrigatória** para o Builder antes de criar ou alterar qualquer tabela.
> Schema completo em: `supabase-migration.sql`

---

## Visão Geral

- **Banco:** Supabase PostgreSQL
- **Total de tabelas:** 25
- **Auth:** Supabase Auth (tabela `auth.users` gerenciada pelo Supabase)
- **RLS:** Habilitado em todas as tabelas
- **UUID:** `gen_random_uuid()` como PK padrão
- **Timestamps:** `created_at` e `updated_at` em todas as tabelas

---

## Diagrama de Relacionamentos (simplificado)

```
projetos (1)
  ├── documentos_contratuais (N)
  ├── incidentes (N) → casos (N)
  ├── casos (1) → acoes (N)
  ├── engenharias (N)
  ├── financeiros (N)
  ├── recursos (N) → histogramas (N)
  ├── avanco_fisico (N)
  ├── mudancas_contratuais (N)
  ├── contratos (N) → medicoes (N)
  │              └── aditivos (N)
  ├── requisicoes_compra (N) → cotacoes (N)
  ├── tarefas_cronograma (N, self-ref pai_id)
  ├── relacionamentos (N)
  ├── rotinas (N)
  ├── ruidos (N) → casos (N)
  ├── commodities (N) → lancamentos_commodity (N)
  ├── rncs (N)
  ├── itens_mas (N)
  └── documentos_engenharia (N)
```

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

### incidentes
Registros diários de ocorrências (RDO, notificações, etc.).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| data_hora | TIMESTAMPTZ | |
| descricao | TEXT NOT NULL | |
| impacto_preliminar | TEXT | |
| probabilidade | TEXT | Baixa / Média / Alta |
| gravidade | TEXT | Baixa / Média / Alta |
| status | TEXT | Registrado / Em Análise / Resolvido / Fechado |
| responsavel_registro | TEXT | |
| caso_id | UUID FK → casos | SET NULL — FK diferida |
| rdo_data | JSONB | Campos extras do RDO |

---

### casos
Pleitos contratuais — o core do módulo de Pleitos.

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

### acoes
Ações do plano de resolução de um pleito (caso).

| Coluna | Tipo | Notas |
|--------|------|-------|
| caso_id | UUID FK → casos | CASCADE |
| descricao | TEXT NOT NULL | |
| formato_tratativa | TEXT | Reunião / Documento / Inspeção / Análise Técnica / Negociação / Outros |
| data_inicio_prevista | DATE | |
| data_fim_prevista | DATE | |
| data_conclusao_real | DATE | |
| responsavel | TEXT | |
| status | TEXT | Pendente / Em Andamento / Concluída / Atrasada / Cancelada |
| marca_causa | TEXT | Camada 1..5 |
| observacoes | TEXT | |

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
| data_ocorrencia | DATE | |
| responsavel | TEXT | |
| categorias | JSONB | |

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
| valor_total | NUMERIC | |
| data_inicio | DATE | |
| data_fim | DATE | |
| status | TEXT | Ativo / Em Revisão / Suspenso / Encerrado / Cancelado |
| tipo | TEXT | Serviços / Fornecimento / Misto |
| centro_custo | TEXT | |
| gestor | TEXT | |

---

### medicoes
Medições de serviços executados vinculadas a contratos.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| contrato_id | UUID FK → contratos | CASCADE |
| numero | TEXT NOT NULL | |
| periodo_inicio / fim | DATE | |
| valor_bruto / retencao / liquido | NUMERIC | |
| status | TEXT | Elaboração / Em Revisão / Em Aprovação / Aprovada / Paga / Rejeitada |
| elaborador / aprovador | TEXT | |
| itens | JSONB | |

---

### aditivos
Aditivos de prazo e/ou valor de contratos.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| contrato_id | UUID FK → contratos | CASCADE |
| numero | TEXT | |
| tipo | TEXT NOT NULL | Prazo / Valor / Prazo e Valor |
| valor_adicional | NUMERIC | |
| dias_adicionais | NUMERIC | |
| justificativa | TEXT | |
| data_assinatura | DATE | |
| status | TEXT | Pendente / Assinado / Cancelado |

---

### requisicoes_compra
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

### cotacoes
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
Estrutura WBS do cronograma com hierarquia pai/filho.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| pai_id | UUID FK → tarefas_cronograma | SET NULL (self-ref) |
| codigo_wbs | TEXT | |
| nome | TEXT NOT NULL | |
| tipo | TEXT | Resumo / Atividade / Marco |
| nivel | INTEGER | |
| data_inicio/fim_planejada | DATE | |
| data_inicio/fim_real | DATE | |
| data_inicio/fim_baseline | DATE | |
| avanco_previsto / realizado | NUMERIC | |
| caminho_critico | BOOLEAN | |
| predecessoras | TEXT | |

---

### relacionamentos
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

### rotinas
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

### ruidos
Riscos/sinais fracos identificados no projeto.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| caso_id | UUID FK → casos | SET NULL |
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

### rncs
Relatórios de Não Conformidade (RNC).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| numero | TEXT | |
| titulo | TEXT NOT NULL | |
| data_abertura | DATE | |
| disciplina | TEXT | Mecânica / Elétrica / ... |
| tipo | TEXT | Material / Execução / Projeto / Procedimento |
| severidade | TEXT | Menor / Maior / Crítica |
| status | TEXT | Aberta / Em Tratamento / Verificação / Encerrada / Reaberta |
| acao_corretiva / preventiva | TEXT | |
| timeline | JSONB | Histórico de eventos da RNC |

---

### itens_mas
Itens do Mapa de Acompanhamento de Suprimentos (MAS).

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| descricao | TEXT NOT NULL | |
| unidade / quantidade | TEXT / NUMERIC | |
| numero_sc | TEXT NOT NULL | Número da Solicitação de Compra |
| solicitante | TEXT | |
| data_necessidade | DATE | |
| status | TEXT | A iniciar / Em andamento / Concluído / Cancelado |
| etapas | JSONB | Array com etapas do processo de compra |

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
> **Ownership:** Architect | **Atualizado a cada:** migration relevante

---

## 1. Visão Geral

- **Serviço:** <!-- Ex: Supabase PostgreSQL -->
- **ORM:** <!-- Ex: Prisma -->
- **Row Level Security (RLS):** <!-- Habilitado/Desabilitado. Se habilitado, descreva a política geral -->

---

## 2. Tabelas

<!-- Para cada tabela, documente: descrição, campos, tipos, constraints e classificação PII/não-PII. -->

> **Convenção de classificação (vale para toda a seção):**
>
> - `PII` = dado pessoal identificável direto ou indireto (email, nome, CPF, telefone, endereço, IP, localização, foto, dados biométricos).
> - `Sensível` = PII de categoria especial — dados de saúde, orientação sexual, religião, filiação política, dados de crianças, dados financeiros (cartão, conta bancária).
> - `Interno` = dado operacional do sistema sem relação direta com uma pessoa (ids técnicos, timestamps, flags).
>
> **Regras:** todo campo `PII` ou `Sensível` precisa ser listado também na §5 com política de retenção e criptografia. Campos `Sensível` exigem `encrypted at rest` obrigatório.

### <!-- nome_da_tabela -->

**Descrição:** <!-- O que esta tabela armazena -->

| Campo | Tipo | Constraints | Classificação | Descrição |
|-------|------|-------------|---------------|-----------|
| `id` | `uuid` | PK, default gen_random_uuid() | Interno | Identificador único |
| | | | | |
| | | | | |
| `created_at` | `timestamptz` | NOT NULL, default now() | Interno | Data de criação |
| `updated_at` | `timestamptz` | NOT NULL, default now() | Interno | Última atualização |

**RLS Policy:** <!-- Descreva a política de acesso. Ex: "Usuário só acessa seus próprios registros" -->

---

### <!-- próxima_tabela -->

**Descrição:** 

| Campo | Tipo | Constraints | Classificação | Descrição |
|-------|------|-------------|---------------|-----------|
| | | | | |

---

## 3. Relacionamentos

<!-- Descreva os relacionamentos entre tabelas. Use formato: Tabela A → Tabela B (tipo) -->

| Tabela A | Tabela B | Tipo | Chave | Descrição |
|----------|----------|------|-------|-----------|
| | | 1:N | `tabela_b.tabela_a_id → tabela_a.id` | |
| | | N:N | via tabela_intermediária | |

---

## 4. Índices

<!-- Liste índices criados para performance e justifique -->

| Tabela | Campo(s) | Tipo | Justificativa |
|--------|----------|------|---------------|
| | | btree | |

---

## 5. Campos PII e Sensíveis

> ⚠️ Este é o inventário consolidado. **Todo campo classificado `PII` ou `Sensível` em §2 deve aparecer aqui.**
> A auditoria do `/security-scan` cruza §2 × §5 — divergência vira finding.

<!-- Classificação segue a convenção declarada no topo da §2.
     Campos `Sensível` exigem `encrypted at rest` = Sim. -->

| Tabela | Campo | Classificação | Categoria (ex: Email, Nome, CPF, Saúde) | Encrypted at rest? | Política de retenção |
|--------|-------|---------------|-----------------------------------------|--------------------|---------------------|
| | | PII | Email | | |
| | | PII | Nome | | |
| | | Sensível | <!-- Saúde, Financeiro, etc. --> | Sim | |

---

## 6. Migrations

<!-- Registre as migrations mais relevantes. Não precisa listar todas — apenas as que mudaram a estrutura significativamente -->

| Data | Descrição | Impacto |
|------|-----------|---------|
| | Criação inicial do schema | Todas as tabelas base |
| | | |

---

## Documentos Relacionados

- Arquitetura geral → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Serviços externos que acessam o banco → [INTEGRATIONS.md](./INTEGRATIONS.md)
