# Módulo: Pleitos (Gestão de Pleitos e Anti-Pleitos)

## Visão Geral

O módulo de Pleitos é o **coração jurídico-contratual do sistema**. Um **Pleito** (também chamado de `Caso` no backend) é uma questão formal ou informal que envolve disputa, reivindicação ou necessidade de resolução entre as partes do contrato (contratante e contratada).

O módulo suporta dois tipos de gestão:
- **Pleito:** reivindicação da contratada contra o contratante (ex: solicitação de aditivo por escopo adicional)
- **Anti-Pleito:** defesa da contratante contra uma reivindicação indevida da contratada

Cada pleito possui um **Plano de Ação** associado, que permite criar e rastrear ações específicas para a resolução da questão. Pleitos também podem originar-se automaticamente a partir de **Ruídos** (módulo de Notificações) via promoção.

---

## Acesso

Rota: `/Pleitos`  
Menu lateral: **"Pleitos"** (ícone `FileText`)

---

## Entidades de Dados

### Caso (Pleito)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto ao qual o pleito pertence |
| `titulo` | string | Sim | Título resumido e identificável do pleito |
| `descricao_problema` | string | Sim | Descrição completa do problema, fatos e histórico |
| `contexto` | string | Não | Contexto contratual, base legal, cláusulas relevantes |
| `partes_envolvidas` | array de strings | Não | Lista de stakeholders: contratante, contratada, fiscalizador, etc. |
| `data_abertura` | date | Não | Data em que o pleito foi formalmente aberto |
| `status` | string (enum) | Não | Aberto, Em Análise, Em Andamento, Resolvido, Fechado, Cancelado (padrão: "Aberto") |
| `responsavel` | string | Não | Nome do responsável interno pela gestão do pleito |
| `aspecto_ordem` | string (enum) | Não | Aspecto de ordem: Técnica, Física, Econômica, Todos |
| `classificacao_cone` | string (enum) | Não | Classificação no Cone: Megatendência, Tendências, Riscos, Incertezas, Sinais Fracos, Imponderável |
| `prioridade` | string (enum) | Não | Baixa, Média, Alta, Crítica (padrão: "Média") |

> **Nota:** `categorias` (Escopo/Prazo/Custo) é gerenciado como estado local na UI — **não faz parte do schema JSON** da entidade Caso.

### Ação (do Plano de Ação do Pleito)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `caso_id` | string (FK) | Sim | Pleito ao qual a ação está vinculada |
| `descricao` | string | Sim | O que deve ser feito (ação concreta e mensurável) |
| `formato_tratativa` | string (enum) | Não | Reunião, Documento, Inspeção, Análise Técnica, Negociação, Outros |
| `data_inicio_prevista` | date | Não | Data planejada para início da ação |
| `data_fim_prevista` | date | Não | Prazo máximo para conclusão da ação |
| `data_conclusao_real` | date | Não | Data em que a ação foi efetivamente concluída |
| `responsavel` | string | Não | Pessoa responsável pela execução |
| `status` | string (enum) | Não | Pendente, Em Andamento, Concluída, Atrasada, Cancelada (padrão: "Pendente") |
| `marca_causa` | string (enum) | Não | Camada de causa raiz: Camada 1, Camada 2, Camada 3, Camada 4, Camada 5 |
| `observacoes` | string | Não | Informações adicionais, impedimentos, resultados parciais |

> **Nota:** A entidade `Acao` **não possui** `projeto_id` no schema — o vínculo com o projeto é indireto via `caso_id → Caso.projeto_id`.

---

## KPIs da Página

Quatro ou mais cards no topo da listagem de pleitos:

| KPI | Cálculo | Cor |
|---|---|---|
| **Total de Pleitos** | `COUNT(*)` de todos os casos do projeto | Azul |
| **Abertos** | `COUNT(*)` onde `status IN ["Aberto", "Em Análise", "Em Andamento"]` | Terracota |
| **Resolvidos** | `COUNT(*)` onde `status = "Resolvido"` | Verde |
| **Críticos** | `COUNT(*)` onde `prioridade = "Crítica"` | Vermelho |

---

## Funcionalidades

### Listagem de Pleitos

**Tabela principal** com as colunas:
- **Título:** texto do pleito (truncado se muito longo)
- **Categorias:** badges de Escopo / Prazo / Custo (azul / laranja / verde) para cada categoria selecionada
- **Prioridade:** badge colorido (ver seção Cores de Prioridade)
- **Status:** badge colorido (ver seção Cores de Status)
- **Responsável:** nome do responsável
- **Data Abertura:** formato `dd/MM/yyyy`
- **Ações:** botão de acesso ao detalhe (ícone olho), botão editar (lápis), botão excluir (lixeira)

**Comportamento:**
- Linha inteira é clicável → navega para `CasoDetalhes`
- Ordenação padrão: por `data_abertura` decrescente
- Loading skeleton durante carregamento

### Formulário de Criação/Edição (`CasoForm`)

**Comportamento:**
- Exibido como **card embutido na página** (não é modal flutuante — aparece acima da listagem)
- Cabeçalho com gradiente azul claro (`from-blue-50 to-indigo-50`)
- Título: "Novo Pleito" ou "Editar Pleito"
- Ícone: `FileText` azul

**Campos do formulário:**

| Campo | Componente | Validação | Layout |
|---|---|---|---|
| Título | Input texto | Obrigatório, mín. 10 chars | Largura total |
| Descrição do Problema | Textarea (4 linhas) | Obrigatório | Largura total |
| Contexto | Textarea (3 linhas) | Opcional | Largura total |
| Partes Envolvidas | Input + botão "Adicionar" | Opcional | Largura total |
| Prioridade | Select | Obrigatório | 1/2 largura |
| Status | Select | Obrigatório | 1/2 largura |
| Categorias | Botões toggle (multi-seleção) | Opcional | Largura total |
| Data de Abertura | Input date | Obrigatório | 1/2 largura |
| Responsável | Input texto | Obrigatório | 1/2 largura |

**Campo "Partes Envolvidas" — comportamento detalhado:**
- Campo de texto livre onde o usuário digita um nome
- Botão "Adicionar" ao lado (ou pressionar Enter) insere o nome como tag/chip na lista
- Tags exibidas abaixo do input como chips azuis com ícone X para remover
- Chips: `bg-blue-100 text-blue-800`, fonte pequena, padding `px-2 py-1`, border-radius arredondado
- Clicar no X remove a tag do array `partes_envolvidas`

**Campo "Categorias" — comportamento detalhado:**
- 3 botões: "Escopo", "Prazo", "Custo"
- Clicável: toggle on/off
- Estado desativado: fundo branco, borda cinza, texto cinza
- Estado ativado por categoria:
  - Escopo: `bg-blue-600 text-white border-blue-600`
  - Prazo: `bg-orange-500 text-white border-orange-500`
  - Custo: `bg-green-600 text-white border-green-600`

### Tela de Detalhe do Pleito (`CasoDetalhes`)

Ao clicar em um pleito na listagem, navega para uma tela dedicada com todas as informações do pleito:

**Seções da tela de detalhe:**
1. **Cabeçalho:** título + badges de prioridade, status e categorias + botões Editar e Voltar
2. **Informações Básicas:** card com Data de Abertura, Responsável, Partes Envolvidas
3. **Descrição do Problema:** card com o texto completo (sem truncamento)
4. **Contexto:** card com o texto do contexto (se preenchido)
5. **Plano de Ação:** componente `PlanoAcao` embutido abaixo das informações do pleito

---

## Plano de Ação (`PlanoAcao`)

Componente exibido **dentro da tela de detalhe** do pleito. Gerencia as ações vinculadas ao caso.

### KPIs do Plano

3 mini-cards no topo da seção:

| KPI | Cor |
|---|---|
| Pendentes (status = "Pendente") | Azul |
| Concluídas (status = "Concluída") | Verde |
| Atrasadas (status = "Atrasada" ou `data_fim_prevista < hoje && status != "Concluída"`) | Vermelho |

### Tabela de Ações

Colunas:
- **Descrição:** texto (truncado em 2 linhas)
- **Formato da Tratativa:** badge simples (Reunião, Documento, etc.)
- **Responsável:** texto
- **Início Previsto:** data formatada `dd/MM/yyyy`
- **Prazo (Fim Previsto):** data formatada `dd/MM/yyyy` — destaque vermelho se atrasado
- **Status:** badge colorido
- **Ações:** ícone lápis (editar) e ícone lixeira (excluir)

### Formulário de Ação (inline)

Aparece **acima da tabela de ações** ao clicar em "Nova Ação". Não é modal — fica embutido na página com fundo levemente destacado.

**Campos:**

| Campo | Componente | Validação |
|---|---|---|
| Descrição da Ação | Textarea (3 linhas) | Obrigatório |
| Formato da Tratativa | Select | Opcional |
| Status | Select | Obrigatório (padrão: "Pendente") |
| Data Início Prevista | Input date | Opcional |
| Data Fim Prevista | Input date | Opcional |
| Responsável | Input texto | Opcional |
| Observações | Input texto | Opcional |

**Validação de datas:** se `data_fim_prevista < data_inicio_prevista`, exibe erro inline.

---

## Fluxo de Status de um Pleito

```
Aberto
  ↓
Em Análise
  ↓
Em Andamento
  ↓           ↓
Resolvido   Cancelado
  ↓
Fechado
```

**Regras:**
- Um pleito "Fechado" não pode ser reaberto
- Um pleito "Cancelado" permanece visível na lista mas com badge cinza
- Ao mudar para "Resolvido", o sistema pode (opcionalmente) atualizar as ações pendentes para "Cancelada"

---

## Fluxo de Status de uma Ação

```
Pendente → Em Andamento → Concluída
                       ↓
                    Cancelada
```

**Regra de atraso automático:** se `data_fim_prevista < hoje` e `status = "Em Andamento"`, o sistema pode exibir a ação com badge "Atrasada" (calculado na exibição, não alterado no banco).

---

## Cores de Prioridade

| Prioridade | Cor do Badge |
|---|---|
| Baixa | Verde (`bg-green-100 text-green-800`) |
| Média | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Alta | Laranja (`bg-orange-100 text-orange-800`) |
| Crítica | Vermelho (`bg-red-100 text-red-800`) |

## Cores de Status (Pleito)

| Status | Cor do Badge |
|---|---|
| Aberto | Azul (`bg-blue-100 text-blue-800`) |
| Em Análise | Índigo (`bg-indigo-100 text-indigo-800`) |
| Em Andamento | Laranja (`bg-orange-100 text-orange-800`) |
| Resolvido | Verde (`bg-green-100 text-green-800`) |
| Fechado | Cinza (`bg-gray-100 text-gray-600`) |
| Cancelado | Cinza escuro (`bg-gray-200 text-gray-500`) |

## Cores de Status (Ação)

| Status | Cor |
|---|---|
| Pendente | Azul |
| Em Andamento | Amarelo |
| Concluída | Verde |
| Atrasada | Vermelho |
| Cancelada | Cinza |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Novo Pleito** | Cabeçalho da página | Verde | Exibe o formulário de criação acima da lista |
| **Linha da tabela** | Tabela de pleitos | — | Navega para `CasoDetalhes` |
| **Ver Detalhes** (ícone olho) | Coluna ações | Outline | Abre a tela de detalhe |
| **Editar** | Coluna ações / tela detalhe | Outline lápis | Preenche o formulário com dados existentes |
| **Excluir** | Coluna ações | Vermelho lixeira | Remove permanentemente com confirmação |
| **Salvar Pleito** | Rodapé do formulário | Verde | Persiste criação ou edição |
| **Cancelar** | Rodapé do formulário | Outline | Fecha o formulário sem salvar |
| **Voltar** | Tela de detalhe | Outline | Retorna à listagem de pleitos |
| **Nova Ação** | Seção Plano de Ação | Verde | Exibe o formulário inline de nova ação |
| **Salvar Ação** | Formulário de ação | Verde | Persiste a ação |
| **Editar ação** (lápis) | Tabela de ações | Outline | Edita a ação inline |
| **Excluir ação** (lixeira) | Tabela de ações | Vermelho | Remove a ação permanentemente |

---

## Lógica de React Query

### Queries

```javascript
// Lista de pleitos do projeto
useQuery({
  queryKey: ['casos', selectedProjectId],
  queryFn: () => base44.entities.Caso.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Ações de um pleito específico
useQuery({
  queryKey: ['acoes', casoId],
  queryFn: () => base44.entities.Acao.list({ caso_id: casoId }),
  enabled: !!casoId
})
```

### Mutações

- **Criar Pleito:** `base44.entities.Caso.create(data)` → invalida `['casos', selectedProjectId]`
- **Atualizar Pleito:** `base44.entities.Caso.update(id, data)` → invalida `['casos', selectedProjectId]`
- **Excluir Pleito:** `base44.entities.Caso.delete(id)` → invalida `['casos', selectedProjectId]`
- **Criar Ação:** `base44.entities.Acao.create(data)` → invalida `['acoes', casoId]`
- **Atualizar Ação:** `base44.entities.Acao.update(id, data)` → invalida `['acoes', casoId]`
- **Excluir Ação:** `base44.entities.Acao.delete(id)` → invalida `['acoes', casoId]`

---

## Integração com Outros Módulos

- **Registros:** registros do tipo Incidente podem ser vinculados a um pleito via `caso_id`. O pleito pode exibir esses registros como evidências.
- **Notificações (Ruídos):** um Ruído promovido a Pleito cria automaticamente um `Caso` com dados herdados do ruído e define `ruido.caso_id = novo_caso.id`.
- **Planos de Ação (módulo separado):** diferente do plano de ação dentro de um pleito — o módulo `/PlanosDeAcao` usa a entidade `Engenharia` por área. O plano de ação dos pleitos usa a entidade `Acao`.
- **Dashboard:** os KPIs de pleitos aparecem no card de resumo do Dashboard.

---

## Design Detalhado

### Cabeçalho da Página
```
┌──────────────────────────────────────────┐
│ [FileText] Pleitos                        │
│ Gestão de pleitos e anti-pleitos         │
│                          [Novo Pleito]   │
└──────────────────────────────────────────┘
```

### Anatomia do CasoForm (card embutido)
```
┌──────────────────────────────────────────┐
│ [FileText] Novo Pleito             [X]   │  ← gradiente azul
├──────────────────────────────────────────┤
│ Título: _________________________        │
│ Descrição do Problema:                   │
│ ┌──────────────────────────────────┐    │
│ │                                  │    │
│ └──────────────────────────────────┘    │
│                                          │
│ [Escopo] [Prazo] [Custo]  ← categorias  │
│                                          │
│ Prioridade: [▼]   Status: [▼]           │
│ Data: [__/__/__]  Resp.: [__________]   │
│                                          │
│ Partes: [_________] [Adicionar]          │
│ [João Silva ×] [Maria Costa ×]          │
│                                          │
│            [Cancelar] [Salvar Pleito]    │
└──────────────────────────────────────────┘
```

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `FileText` em cinza
- Título: "Nenhum Projeto Selecionado"

**Com projeto mas sem pleitos:**
- Ícone `FileText` em azul claro
- Título: "Nenhum Pleito Registrado"
- Subtítulo: "Registre as disputas e reivindicações contratuais do projeto."
- Botão: "Criar Primeiro Pleito"
