# Módulo: Planejamento

## Visão Geral

O módulo de Planejamento reúne ferramentas de **gestão operacional e documentação** do projeto, organizadas em 4 abas que cobrem diferentes aspectos do planejamento:

1. **Ata de Reunião:** documentação formal de reuniões do projeto
2. **Lições Aprendidas:** registro de conhecimentos para reutilização em projetos futuros
3. **6WLA (6 Week Look Ahead):** planejamento de curto prazo com gestão de restrições
4. **Take-Off / Mapa de Controle:** controle de quantitativos por disciplina

> **Nota importante sobre persistência:** as abas "Atas de Reunião" e "Lições Aprendidas" usam estado local React (sem persistência backend — dados se perdem ao recarregar a página). As abas "6WLA" e "Take-Off" usam dados mock pré-carregados. Para versão com persistência completa, seria necessário criar entidades no backend para cada tipo.

---

## Acesso

Rota: `/Planejamento`  
Menu lateral: **"Planejamento"** (ícone `ClipboardList`)

---

## Aba 1: Ata de Reunião

### Finalidade

Registrar e acompanhar atas de reuniões do projeto, com rastreabilidade de diagnósticos, problemas identificados e encaminhamentos.

### Estrutura de Dados (Estado Local)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string (gerado) | Sim | UUID gerado localmente |
| `numero` | string | Sim | Número sequencial (ex: "ATA-001") |
| `data` | date | Sim | Data da reunião |
| `assunto` | string | Sim | Assunto e pauta principal |
| `autor` | string | Não | Quem elaborou a ata |
| `aprovador` | string | Não | Responsável pela aprovação |
| `status` | string (enum) | Sim | Rascunho, Aguardando Aprovação, Aprovada |
| `revisao` | string | Não | Número da revisão (ex: "00", "01", "02") |
| `diagnostico` | string | Não | Análise geral, contexto e observações da reunião |
| `problemas` | array | Não | Lista de problemas identificados (ver estrutura) |
| `comentarios` | string | Não | Comentários gerais e encaminhamentos |

**Estrutura de um Problema:**
```json
{
  "id": "uuid",
  "problema": "Descrição do problema",
  "qtde_p": "Quantidade/severidade do problema",
  "resolucao": "Ação de resolução acordada",
  "qtde_r": "Quantidade/status da resolução"
}
```

### Funcionalidades

**Lista de Atas:**
- Cards colapsáveis (accordion) — cada ata exibe apenas o número, data, assunto e status por padrão
- Clicar no cabeçalho expande para mostrar diagnóstico, problemas e comentários
- Animação de colapso/expansão suave (transição CSS)
- Botões: Editar (lápis) e Excluir (lixeira) no cabeçalho de cada card

**Formulário Modal:**
- Componente `Modal` genérico do módulo
- Título: "Nova Ata" ou "Editar Ata"
- Cor de destaque: azul escuro (`#26405d`)

**Campos do formulário:**

| Campo | Componente | Largura |
|---|---|---|
| Número | Input texto | 1/2 |
| Data | Input date | 1/2 |
| Assunto | Input texto | Largura total |
| Autor | Input texto | 1/2 |
| Aprovador | Input texto | 1/2 |
| Status | Select | 1/2 |
| Revisão | Input texto | 1/2 |
| Diagnóstico | Textarea (4 linhas) | Largura total |
| Problemas | Tabela dinâmica | Largura total |
| Comentários | Textarea (3 linhas) | Largura total |

**Tabela de Problemas (dinâmica):**
- Botão "+ Linha" para adicionar nova linha
- Por linha: campo Problema (texto), Qtde/Severidade (texto), Resolução (texto), Qtde Resolução (texto), botão excluir linha
- Linhas com fundo alternado

### Cores de Status

| Status | Cor |
|---|---|
| Aprovada | Verde (`bg-green-100 text-green-800`) |
| Aguardando Aprovação | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Rascunho | Cinza (`bg-gray-100 text-gray-600`) |

---

## Aba 2: Lições Aprendidas

### Finalidade

Documentar conhecimentos, erros e acertos do projeto para compartilhamento com outros projetos e times.

### Estrutura de Dados (Estado Local)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string (gerado) | Sim | UUID gerado localmente |
| `titulo` | string | Sim | Título descritivo da lição |
| `categoria` | string | Não | Área: Suprimentos, Engenharia, Construção, Planejamento, etc. |
| `impacto` | string (enum) | Não | Alto, Médio, Baixo |
| `autor` | string | Não | Quem registrou a lição |
| `data` | date | Não | Data do registro |
| `status` | string (enum) | Sim | Rascunho, Aprovada |
| `diagnostico` | string | Não | Análise do evento — o que aconteceu e por quê |
| `problemas` | array | Não | Problemas identificados (mesma estrutura das atas) |
| `comentarios` | string | Não | Recomendações para projetos futuros |

### Funcionalidades

- Lista colapsável idêntica às atas
- Formulário modal com campos acima
- Cor de destaque da aba: verde-água (`#00a49a`)

**Campos de destaque diferente das atas:**

| Campo | Componente | Opções |
|---|---|---|
| Categoria | Input texto ou Select | Suprimentos, Engenharia, Construção, Planejamento, Qualidade/SSMA, Contratos |
| Impacto | Select | Alto (vermelho), Médio (amarelo), Baixo (verde) |

**Badges de impacto na lista:**
- Alto: `bg-red-100 text-red-700`
- Médio: `bg-yellow-100 text-yellow-700`
- Baixo: `bg-green-100 text-green-700`

---

## Aba 3: 6WLA (6 Week Look Ahead)

### Finalidade

Ferramenta de planejamento de curto prazo que verifica **restrições e comprometimentos semanais** de cada atividade para as próximas 6 semanas. O objetivo é antecipar impedimentos antes que eles afetem a execução.

### Conceito de PPC (Percentual do Planejamento Concluído)

PPC é o indicador de aderência ao planejamento de curto prazo:
```
PPC = (Atividades concluídas conforme planejado / Total de atividades planejadas) × 100
```

### Estrutura de Dados (Mock Pré-carregado)

O 6WLA usa dados **mock fixos** carregados no estado local (`useState`) do componente. Não há persistência backend.

**Estrutura de um item:**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `atividade` | string | Descrição da atividade planejada |
| `responsavel` | string | Responsável pela execução |
| `liberadas` | array[6] de boolean | Para cada semana: `true` = restrição liberada, `false` = restrição pendente |
| `semanas` | array[6] de boolean | Para cada semana: `true` = atividade planejada para esta semana |
| `ppc` | number (%) | PPC calculado ou informado manualmente |

**Semanas exibidas (datas fixas no mock):**

| Semana | Data inicial |
|---|---|
| S1 | 31/mar |
| S2 | 07/abr |
| S3 | 14/abr |
| S4 | 21/abr |
| S5 | 28/abr |
| S6 | 05/mai |

### Visualização da Tabela

**Colunas:**
- **Atividade** — texto descritivo
- **Responsável** — nome
- **Liberadas S1 a S6** — 6 colunas com checkbox (marcado = liberado)
- **Semanas S1 a S6** — 6 colunas com checkbox (marcado = planejado para esta semana)
- **PPC (%)** — valor numérico colorido

**Comportamento dos checkboxes:**
- Clicáveis diretamente na tabela (edição inline)
- Alteram o estado local imediatamente
- Não há botão "Salvar" — as alterações são instantâneas (state local)

**Coloração do PPC:**
- ≥ 90%: verde (`text-green-600 font-bold`)
- ≥ 70%: amarelo (`text-yellow-600`)
- < 70%: vermelho (`text-red-600`)

### Cor de destaque da aba: azul (`#3b82f6`)

---

## Aba 4: Take-Off / Mapa de Controle

### Finalidade

Controle de quantitativos físicos por disciplina — comparando o que foi previsto com o que foi efetivamente executado.

### Estrutura de Dados (Mock Pré-carregado)

Dados mock fixos no estado local. Estrutura de um item:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `codigo` | string | Código identificador (ex: "EST-001", "TUB-003") |
| `descricao` | string | Descrição do item, serviço ou material |
| `unidade` | string | Unidade de medida (kg, m, m², m³, un, peça) |
| `disciplina` | string | Área: Estrutura Metálica, Tubulação, Elétrica, Civil, Instrumentação |
| `previsto` | number | Quantidade total prevista no contrato |
| `realizado` | number | Quantidade efetivamente executada |
| `percentual` | number (%) | `(realizado / previsto) × 100` |
| `status` | string (enum) | Concluído, Em Andamento, Atrasado |

### Visualização da Tabela

**Colunas:**

| Coluna | Formato | Descrição |
|---|---|---|
| **Código** | texto mono | Ex: "EST-001" |
| **Descrição** | texto | Nome do item |
| **Unidade** | texto pequeno | kg, m, m², etc. |
| **Disciplina** | badge | Área de trabalho |
| **Previsto** | número | Quantidade planejada |
| **Realizado** | número | Quantidade executada |
| **% Realizado** | barra + texto | Progresso visual |
| **Status** | badge colorido | Concluído / Em Andamento / Atrasado |

**Barra de progresso visual:**
- Barra horizontal: `width = percentual%`
- Cor da barra:
  - Concluído (≥ 100%): verde
  - Em Andamento: azul
  - Atrasado: vermelho
- Texto do percentual ao lado da barra

**Edição inline:**
- Clicar em "Editar" (ícone lápis) transforma os campos `realizado` e `status` em editáveis
- O percentual é recalculado automaticamente

**Adicionar item:**
- Botão "+ Item" abre linha editável no topo da tabela

### Cores de Status

| Status | Cor |
|---|---|
| Concluído | Verde (`bg-green-100 text-green-800`) |
| Em Andamento | Azul (`bg-blue-100 text-blue-800`) |
| Atrasado | Vermelho (`bg-red-100 text-red-800`) |

### Cor de destaque da aba: terracota (`#c35e1e`)

---

## Componente Modal Genérico

O módulo utiliza um componente `Modal` reutilizável para os formulários de Atas e Lições:

```
┌─────────────────────────────────────────────────────────┐
│  Cabeçalho colorido (cor da aba)                  [X]   │
│  Título do formulário                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  (Conteúdo dinâmico: campos do formulário)              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                          [Cancelar] [Salvar]            │
└─────────────────────────────────────────────────────────┘
```

**Especificações técnicas:**
- Overlay escuro semitransparente (`bg-black bg-opacity-50`)
- Card branco centralizado: `max-w-2xl`, `max-h-[90vh]`, scroll interno (`overflow-y-auto`)
- Cabeçalho: cor de fundo conforme a aba ativa
- Botão X: fecha ao clicar
- Fechar ao clicar no overlay (opcional)

---

## Botões e Ações

| Botão | Ação |
|---|---|
| **+ Nova Ata** | Abre modal de criação de ata |
| **+ Nova Lição** | Abre modal de criação de lição aprendida |
| **+ Nova Atividade (6WLA)** | Adiciona nova linha no 6WLA |
| **+ Item (Take-Off)** | Adiciona linha editável no Take-Off |
| **Salvar** (modal) | Persiste no estado local (sem backend) |
| **Cancelar** | Fecha o modal |
| **Expandir/Colapsar** (chevrons) | Mostra/oculta detalhes de ata ou lição |
| **Editar** (lápis) | Abre modal preenchido ou ativa edição inline |
| **Excluir** (lixeira) | Remove do estado local |

---

## Design e Layout

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [ClipboardList] Planejamento                          │
│ Atas, lições aprendidas e ferramentas de planejamento│
└──────────────────────────────────────────────────────┘

[Ata de Reunião] [Lições Aprendidas] [6WLA] [Take-Off]
```

### Cores por Aba

| Aba | Cor de Destaque |
|---|---|
| Ata de Reunião | Azul escuro `#26405d` |
| Lições Aprendidas | Verde-água `#00a49a` |
| 6WLA | Azul `#3b82f6` |
| Take-Off | Terracota `#c35e1e` |

### Card de Ata/Lição (colapsável)

```
┌──────────────────────────────────────────────────────┐
│ [Chevron] ATA-001 — 15/01/2026                       │  ← cabeçalho
│ Reunião de alinhamento com cliente     [Aprovada]    │
│                              [✏️] [🗑️]               │
├──────────────────────────────────────────────────────┤  ← expandido:
│ Diagnóstico: ....                                    │
│                                                      │
│ Problemas:                                           │
│ P1 | Atraso entrega | 5 dias | Solicitação urgência  │
│                                                      │
│ Comentários: ...                                     │
└──────────────────────────────────────────────────────┘
```

### 6WLA — Cabeçalho das Semanas

As 12 colunas de checkboxes (6 Liberadas + 6 Semanas) são agrupadas visualmente com cabeçalho duplo:
```
| Atividade | Resp | Liberadas              | Semanas Planejadas     | PPC |
|           |      | S1 | S2 | S3 | S4 | S5 | S6 | S1 | S2 | S3 | S4 | S5 | S6 |
```

---

## Integração com Outros Módulos

- **Dashboard:** número de atas aprovadas e lições aprendidas podem aparecer no card de resumo do Planejamento
- **Cronograma:** o 6WLA complementa o Gantt — enquanto o Gantt é o plano mestre de longo prazo, o 6WLA é o planejamento de curto prazo semanal
- **Registros:** atas de reunião documentam decisões que podem originar pleitos ou registros de impacto

---

## Estado Vazio (por aba)

- **Atas:** "Nenhuma ata registrada" + botão "+ Nova Ata"
- **Lições:** "Nenhuma lição aprendida registrada" + botão "+ Nova Lição"
- **6WLA:** lista com dados mock — nunca vazio
- **Take-Off:** lista com dados mock — nunca vazio
