# Diagrama de Relacionamentos — Entidades do Sistema

## Fonte de Verdade

Este documento é gerado a partir dos arquivos JSON em `src/entities/` e dos forms dos componentes React. É a referência oficial para todos os campos e relacionamentos entre entidades.

---

## Diagrama ER (Entidade-Relacionamento)

```
┌──────────────────────────────────────────┐
│                 PROJETO                  │
│ PK  id                                   │
│     nome (REQUIRED)                      │
│     cliente (REQUIRED)                   │
│     descricao                            │
│     responsavel_geral                    │
│     data_inicio                          │
│     data_prevista_termino                │
│     valor_contrato                       │
│     status                               │
│       [Planejamento | Em Andamento |     │
│        Pausado | Concluído | Cancelado]  │
└──────────────────────────────────────────┘
         │ projeto_id (FK em todas as entidades abaixo)
         │
    ┌────┴──────────────────────────────────────────────────────────────────┐
    │                                                                        │
    ▼                                                                        ▼
┌──────────────────────┐                                         ┌──────────────────────┐
│   DOCUMENTOCONTRATUAL│                                         │        CASO          │
│ PK  id               │                                         │ PK  id               │
│ FK  projeto_id       │                                         │ FK  projeto_id       │
│     nome_documento   │◄── REQUIRED                             │     titulo  ◄─ REQ   │
│     tipo_documento   │◄── REQUIRED                             │     descricao_problema◄REQ│
│       [Contrato |    │                                         │     contexto         │
│        Aditivo |     │                                         │     partes_envolvidas│
│        Ordem Serviço |│                                        │       (array string) │
│        Anexo |       │                                         │     data_abertura    │
│        Proposta Téc. |│                                        │     status           │
│        Outros]       │                                         │       [Aberto |      │
│     url_arquivo      │                                         │        Em Análise |  │
│     data_referencia  │                                         │        Em Andamento |│
└──────────────────────┘                                         │        Resolvido |   │
                                                                 │        Fechado |     │
                                                                 │        Cancelado]    │
                                                                 │     responsavel      │
                                                                 │     prioridade       │
                                                                 │       [Baixa | Média │
                                                                 │        Alta | Crítica│
                                                                 │        default:Média]│
                                                                 │     aspecto_ordem    │
                                                                 │       [Técnica |     │
                                                                 │        Física |      │
                                                                 │        Econômica |   │
                                                                 │        Todos]        │
                                                                 │     classificacao_cone│
                                                                 │       [Megatendência|│
                                                                 │        Tendências |  │
                                                                 │        Riscos |      │
                                                                 │        Incertezas |  │
                                                                 │        Sinais Fracos|│
                                                                 │        Imponderável] │
                                                                 │  ┌── categorias ──┐  │
                                                                 │  │ (estado local  │  │
                                                                 │  │  UI, não schema│  │
                                                                 │  │  Escopo/Prazo/ │  │
                                                                 │  │  Custo)        │  │
                                                                 │  └────────────────┘  │
                                                                 └──────────────────────┘
                                                                          │
                                                                          │ caso_id (FK)
                                                                          ▼
                                                                 ┌──────────────────────┐
                                                                 │        ACAO          │
                                                                 │ PK  id               │
                                                                 │ FK  caso_id ◄─ REQ   │
                                                                 │     descricao ◄─ REQ │
                                                                 │     formato_tratativa│
                                                                 │       [Reunião |     │
                                                                 │        Documento |   │
                                                                 │        Inspeção |    │
                                                                 │        Análise Téc. |│
                                                                 │        Negociação |  │
                                                                 │        Outros]       │
                                                                 │     data_inicio_prev.│
                                                                 │     data_fim_prevista│
                                                                 │     data_conclusao_  │
                                                                 │       real           │
                                                                 │     responsavel      │
                                                                 │     status           │
                                                                 │       [Pendente |    │
                                                                 │        Em Andamento |│
                                                                 │        Concluída |   │
                                                                 │        Atrasada |    │
                                                                 │        Cancelada]    │
                                                                 │     marca_causa      │
                                                                 │       [Camada 1..5]  │
                                                                 │     observacoes      │
                                                                 └──────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│      INCIDENTE       │          │       RUIDO          │
│ PK  id               │          │ PK  id               │
│ FK  projeto_id       │          │ FK  projeto_id       │
│ FK  caso_id (opt.)   │──────────│ FK  caso_id (opt.)   │
│     descricao ◄─ REQ │          │     descricao ◄─ REQ │
│     data_hora        │          │     categoria ◄─ REQ │
│     impacto_prelim.  │          │       [Técnica |     │
│     probabilidade    │          │        Financeira |  │
│       [Baixa|Média|  │          │        Ambiental |   │
│        Alta]         │          │        Jurídica |    │
│     gravidade        │          │        Outros]       │
│       [Baixa|Média|  │          │     causas_potenciais│
│        Alta]         │          │     impacto_potencial│
│     status           │          │     probabilidade    │
│       [Registrado |  │          │       [Baixa|Média|  │
│        Em Análise |  │          │        Alta]         │
│        Resolvido |   │          │     data_identificacao│
│        Fechado]      │          │     responsavel      │
│     responsavel_reg. │          │     status           │
│                      │          │       [Identificado |│
│  ┌─ CAMPOS UI RDO ─┐ │          │        Em Análise |  │
│  │ tipo_registro    │ │          │        Descartado |  │
│  │ numero_rdo       │ │          │        Promovido]    │
│  │ area / disciplina│ │          └──────────────────────┘
│  │ cond. climaticas │ │
│  │ atividades       │ │
│  │ ocorrencias      │ │
│  │ mao_de_obra[]    │ │
│  │ equipamentos[]   │ │
│  │ impacto_ocorrencia│ │
│  └──────────────────┘ │
└──────────────────────┘
```

---

## Entidades de Controle Operacional

```
PROJETO
  │
  ├──► ENGENHARIA (Planos de Ação por Área)
  │     PK  id
  │     FK  projeto_id (REQUIRED)
  │         nome (REQUIRED)
  │           [Mobilização | Produção | Qualidade |
  │            Segurança | Suprimentos | Planejamento]
  │         descricao_acao (REQUIRED)
  │         responsavel
  │         finalidade
  │         status
  │           [Funcionando | Não Implementado |
  │            Necessário Melhorias | Em Implantação | Com Atrasos]
  │           default: "Não Implementado"
  │
  ├──► HISTORICOSTATUSENGENHARIA
  │     PK  id
  │     FK  engenharia_id (REQUIRED) ──► ENGENHARIA
  │         data_mudanca (datetime)
  │         status_anterior
  │         status_novo (REQUIRED)
  │         responsavel_mudanca
  │         observacao
  │
  ├──► ROTINA
  │     PK  id
  │     FK  projeto_id (REQUIRED)
  │         descricao (REQUIRED)
  │         periodicidade (REQUIRED)
  │           [Diária | Semanal | Quinzenal | Mensal |
  │            Trimestral | Semestral | Anual]
  │         responsavel
  │         data_ultima_execucao
  │         proxima_data_execucao
  │         status
  │           [Em Dia | Atrasada | Concluída]
  │           default: "Em Dia"
  │
  └──► RELACIONAMENTO
        PK  id
        FK  projeto_id (REQUIRED)
            data_interacao (REQUIRED)
            descricao (REQUIRED)
            partes_envolvidas (array string)
            objetivo
            resultado
            classificacao
              [Excelente | Bom | Neutro | Tenso | Crítico]
              default: "Neutro"
```

---

## Entidades Financeiras e de Controle

```
PROJETO
  │
  ├──► FINANCEIRO
  │     PK  id
  │     FK  projeto_id (REQUIRED)
  │         mes_referencia (REQUIRED)  — YYYY-MM-01
  │         faturamento_previsto_mensal
  │         faturamento_realizado_mensal
  │         faturamento_previsto_acumulado  — calculado
  │         faturamento_realizado_acumulado — calculado
  │
  ├──► AVANCOFISICO
  │     PK  id
  │     FK  projeto_id (REQUIRED)
  │         mes_referencia (REQUIRED)
  │         avanco_previsto_mensal    (%)
  │         avanco_realizado_mensal   (%)
  │         avanco_previsto_acumulado    — calculado
  │         avanco_realizado_acumulado   — calculado
  │
  ├──► RECURSO ◄──────────────────────────────┐
  │     PK  id                                │
  │     FK  projeto_id (REQUIRED)             │
  │         tipo_recurso (REQUIRED)           │
  │           [MOD | MOI | EQUIPAMENTO]       │
  │         nome_recurso (REQUIRED)           │
  │         unidade_medida                    │
  │           [HH | HM | UND | HORA | DIA | MÊS] │
  │         preco_unitario (REQUIRED)         │
  │         referencia_custo                  │
  │           [Contrato | SINAPI | SEOP | RDO | Outros] │
  │                                           │
  └──► HISTOGRAMA                             │
        PK  id                                │
        FK  projeto_id (REQUIRED)             │
        FK  recurso_id (REQUIRED) ────────────┘
            mes_referencia (REQUIRED)
            quantidade_prevista_mensal
            quantidade_realizada_mensal
            valor_previsto_mensal    — calculado
            valor_realizado_mensal   — calculado
```

---

## Entidades de Contratos e Compras

```
PROJETO
  │
  ├──► CONTRATO (sem JSON schema — campos do form)
  │     PK  id
  │     FK  projeto_id
  │         numero
  │         objeto
  │         fornecedor
  │         cnpj
  │         tipo              default: "Serviços"
  │         status
  │           [Ativo | Em Revisão | Suspenso | Encerrado | Cancelado]
  │           default: "Ativo"
  │         valor_total
  │         data_inicio
  │         data_fim
  │         centro_custo
  │         gestor
  │         observacoes
  │
  └──► MEDICAO (sem JSON schema — campos do form)
        PK  id
        FK  projeto_id
        FK  contrato_id ──────────────────────────► CONTRATO
            numero
            periodo_inicio
            periodo_fim
            valor_bruto
            valor_retencao        ← NÃO é "descontos"
            valor_liquido         ← calculado: bruto - retencao
            status
              [Elaboração | Em Revisão | Em Aprovação |
               Aprovada | Paga | Rejeitada]
              default: "Elaboração"
            elaborador            ← NÃO é "aprovador"
            observacoes
            itens[]               ← array com:
              { descricao, unidade, quantidade,
                preco_unitario, valor_total }
              valor_total calculado: quantidade × preco_unitario

PROJETO
  │
  ├──► REQUISICAOCOMPRA (sem JSON schema — campos do form)
  │     PK  id
  │     FK  projeto_id
  │         numero
  │         solicitante
  │         data_necessidade
  │         centro_custo
  │         justificativa
  │         status
  │           [Rascunho | Aprovada | Em Cotação |
  │            Pedido Emitido | Recebido | Cancelada]
  │           default: "Rascunho"
  │         itens[]   ← array com:
  │           { descricao, quantidade, unidade }
  │
  └──► COTACAO (sem JSON schema — campos do form)
        PK  id
        FK  projeto_id
        FK  requisicao_id (opt.) ──────────────────► REQUISICAOCOMPRA
            numero
            titulo
            data_limite
            status
              [Aberta | Em Análise | Aprovada | Cancelada]
              default: "Aberta"
            propostas[]   ← array com:
              { fornecedor, valor_total, prazo_entrega,
                condicao_pagamento, observacoes }
            fornecedor_selecionado
            valor_aprovado
            parecer
            aprovador
```

---

## Entidades de Gestão de Mudanças e Cronograma

```
PROJETO
  │
  ├──► MUDANCACONTRATUAL (sem JSON schema — campos do form)
  │     PK  id
  │     FK  projeto_id
  │         titulo
  │         descricao
  │         origem
  │           [Contratada | Contratante]
  │           default: "Contratante"
  │         status
  │           [Identificada | Em Análise | Em Negociação |
  │            Aprovada | Rejeitada]
  │           default: "Identificada"
  │         data_ocorrencia
  │         impacto_custo        (+acréscimo / -dedução em R$)
  │         impacto_prazo_dias   (+atraso / -antecipação em dias)
  │         impacto_escopo       (texto descritivo)
  │         responsavel
  │         observacoes
  │         categorias[]  ← estado local da UI (Escopo/Prazo/Custo)
  │                          NÃO é campo do schema
  │
  └──► TAREFACRONOGRAMA (sem JSON schema — campos do form)
        PK  id
        FK  projeto_id
        FK  pai_id (opt.) ───────────────────────► TAREFACRONOGRAMA (self-ref)
            codigo_wbs
            nome
            tipo
              [Resumo | Atividade | Marco]
              default: "Atividade"
            nivel    (1-5)
            data_inicio_planejada
            data_fim_planejada
            data_inicio_baseline
            data_fim_baseline
            avanco_previsto    (%)  default: 0
            avanco_realizado   (%)  default: 0
            caminho_critico    (boolean) default: false
            responsavel
            predecessoras      (string, ex: "1.1, 1.2")
```

---

## Mapa Completo de Foreign Keys

| Entidade | Campo FK | Referencia | Cardinalidade |
|---|---|---|---|
| `Acao` | `caso_id` | `Caso.id` | N:1 (muitas ações por caso) |
| `AvancoFisico` | `projeto_id` | `Projeto.id` | N:1 |
| `Caso` | `projeto_id` | `Projeto.id` | N:1 |
| `Cotacao` | `projeto_id` | `Projeto.id` | N:1 |
| `Cotacao` | `requisicao_id` (opt.) | `RequisicaoCompra.id` | N:1 (opt.) |
| `DocumentoContratual` | `projeto_id` | `Projeto.id` | N:1 |
| `Engenharia` | `projeto_id` | `Projeto.id` | N:1 |
| `Financeiro` | `projeto_id` | `Projeto.id` | N:1 |
| `Histograma` | `projeto_id` | `Projeto.id` | N:1 |
| `Histograma` | `recurso_id` | `Recurso.id` | N:1 |
| `HistoricoStatusEngenharia` | `engenharia_id` | `Engenharia.id` | N:1 |
| `Incidente` | `projeto_id` | `Projeto.id` | N:1 |
| `Incidente` | `caso_id` (opt.) | `Caso.id` | N:1 (opt.) |
| `Medicao` | `projeto_id` | `Projeto.id` | N:1 |
| `Medicao` | `contrato_id` | `Contrato.id` | N:1 |
| `MudancaContratual` | `projeto_id` | `Projeto.id` | N:1 |
| `RequisicaoCompra` | `projeto_id` | `Projeto.id` | N:1 |
| `Recurso` | `projeto_id` | `Projeto.id` | N:1 |
| `Relacionamento` | `projeto_id` | `Projeto.id` | N:1 |
| `Rotina` | `projeto_id` | `Projeto.id` | N:1 |
| `Ruido` | `projeto_id` | `Projeto.id` | N:1 |
| `Ruido` | `caso_id` (opt.) | `Caso.id` | N:1 (opt.) — preenchido ao promover |
| `TarefaCronograma` | `projeto_id` | `Projeto.id` | N:1 |
| `TarefaCronograma` | `pai_id` (opt.) | `TarefaCronograma.id` | N:1 (auto-ref) |
| `Contrato` | `projeto_id` | `Projeto.id` | N:1 |

---

## Entidades SEM JSON Schema (definidas apenas na UI)

As seguintes entidades não possuem arquivo `.json` em `src/entities/` — são acessadas via `base44.entities.[Nome]` mas seus schemas são definidos diretamente no backend (Base44):

| Entidade | Módulo | Status do Schema |
|---|---|---|
| `Contrato` | Contratos | Inferido do form `ContratoForm.jsx` |
| `Medicao` | Contratos | Inferido do form `MedicaoForm.jsx` |
| `MudancaContratual` | Gestão de Mudanças | Inferido do form `MudancaForm.jsx` |
| `TarefaCronograma` | Cronograma | Inferido do form `TarefaForm.jsx` |
| `RequisicaoCompra` | Suprimentos | Inferido do form `RequisicaoForm.jsx` |
| `Cotacao` | Suprimentos | Inferido do form `CotacaoForm.jsx` |

---

## Entidades com JSON Schema em `src/entities/`

| Arquivo JSON | Entidade | Campos REQUIRED |
|---|---|---|
| `Acao.json` | Acao | `caso_id`, `descricao` |
| `AvancoFisico.json` | AvancoFisico | `projeto_id`, `mes_referencia` |
| `Caso.json` | Caso | `projeto_id`, `titulo`, `descricao_problema` |
| `DocumentoContratual.json` | DocumentoContratual | `projeto_id`, `nome_documento`, `tipo_documento` |
| `Engenharia.json` | Engenharia | `projeto_id`, `nome`, `descricao_acao` |
| `Financeiro.json` | Financeiro | `projeto_id`, `mes_referencia` |
| `Histograma.json` | Histograma | `projeto_id`, `recurso_id`, `mes_referencia` |
| `HistoricoStatusEngenharia.json` | HistoricoStatusEngenharia | `engenharia_id`, `status_novo` |
| `Incidente.json` | Incidente | `projeto_id`, `descricao` |
| `Projeto.json` | Projeto | `nome`, `cliente` |
| `Recurso.json` | Recurso | `projeto_id`, `tipo_recurso`, `nome_recurso`, `preco_unitario` |
| `Relacionamento.json` | Relacionamento | `projeto_id`, `descricao`, `data_interacao` |
| `Rotina.json` | Rotina | `projeto_id`, `descricao`, `periodicidade` |
| `Ruido.json` | Ruido | `projeto_id`, `descricao`, `categoria` |

---

## Diagrama de Fluxo de Dados entre Módulos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROJETO (raiz)                              │
│                    valor_contrato ─────────────────────────────┐    │
└─────────────────────────────────────────────────────────────────┘    │
         │                              │                              │
         ▼                              ▼                              ▼
    RUIDO ──── promoção ──► CASO     INCIDENTE ──── vinculação ──► CASO
    (status→Promovido)     (Pleito)  (caso_id)                   (evidência)
    (caso_id preenchido)      │
                              │
                              ▼
                            ACAO
                    (plano de resolução)

    ENGENHARIA ──► HISTORICOSTATUSENGENHARIA
    (ação por área)  (auditoria de mudanças)

    MUDANCACONTRATUAL ──── aprovadas ────► cálculo Termômetro de Desvio
                                          (soma impacto_custo vs valor_contrato)

    CONTRATO ──────────────────────────► MEDICAO
    (subcontratado)                      (pagamentos)
                                         valor_liquido = valor_bruto - valor_retencao
                                         itens[]: quantidade × preco_unitario

    REQUISICAOCOMPRA ──► COTACAO
    (solicitação)        propostas[]
                         (menor preço destacado automaticamente)

    RECURSO ──────────────────────────► HISTOGRAMA
    (catálogo: MOD/MOI/EQUIPAMENTO)      (mobilização mensal)
    preco_unitario                        valor = quantidade × preco_unitario

    FINANCEIRO / AVANCOFISICO ──────► Curva S (acumulado calculado)
```

---

## Notas de Implementação

### Campos calculados automaticamente

| Entidade | Campo | Fórmula |
|---|---|---|
| `Financeiro` | `faturamento_previsto_acumulado` | Σ `faturamento_previsto_mensal` do mês 1 até N |
| `Financeiro` | `faturamento_realizado_acumulado` | Σ `faturamento_realizado_mensal` do mês 1 até N |
| `AvancoFisico` | `avanco_previsto_acumulado` | Σ `avanco_previsto_mensal` do mês 1 até N |
| `AvancoFisico` | `avanco_realizado_acumulado` | Σ `avanco_realizado_mensal` do mês 1 até N |
| `Histograma` | `valor_previsto_mensal` | `quantidade_prevista_mensal × Recurso.preco_unitario` |
| `Histograma` | `valor_realizado_mensal` | `quantidade_realizada_mensal × Recurso.preco_unitario` |
| `Medicao` | `valor_liquido` | `valor_bruto - valor_retencao` |
| `Medicao.itens[]` | `valor_total` | `quantidade × preco_unitario` |

### Campos gerenciados como estado local na UI (não persistidos no schema)

| Campo | Entidade afetada | Descrição |
|---|---|---|
| `categorias` | `Caso` / `MudancaContratual` | Array ["Escopo", "Prazo", "Custo"] — toggle multi-select |
| Campos RDO | `Incidente` | `tipo_registro`, `numero_rdo`, `area`, `disciplina`, `condicoes_climaticas_*`, `atividades`, `ocorrencias`, `mao_de_obra[]`, `equipamentos_rdo[]`, `impacto_ocorrencia[]`, `responsabilidade` |

### Entidade especial: HistoricoStatusEngenharia

Registra automaticamente cada vez que o `status` de um registro `Engenharia` é alterado. Serve como log de auditoria. Não é gerenciado diretamente pelo usuário.

### Auto-referência: TarefaCronograma

O campo `pai_id` aponta para outro registro da mesma entidade `TarefaCronograma`, criando a hierarquia WBS. Apenas tarefas do tipo `"Resumo"` podem ser `pai_id` de outras tarefas.
