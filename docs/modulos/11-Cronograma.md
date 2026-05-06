# Módulo: Cronograma (Gráfico de Gantt)

## Visão Geral

O módulo de Cronograma oferece uma visualização completa do **gráfico de Gantt** do projeto, com suporte a hierarquia WBS (Work Breakdown Structure), caminho crítico, baseline e controle de avanço percentual por tarefa. É o módulo central para o planejamento e acompanhamento da execução física do projeto.

O Gantt é implementado **do zero** em React (sem biblioteca externa de Gantt), utilizando cálculos de posicionamento baseados em pixels para renderizar as barras no eixo de tempo.

---

## Acesso

Rota: `/Cronograma`  
Menu lateral: **"Cronograma"** (ícone `CalendarDays`)

---

## Entidade de Dados

**TarefaCronograma** — campos completos:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `codigo_wbs` | string | Não | Código hierárquico WBS (ex: "1", "1.2", "1.2.3") |
| `nome` | string | Sim | Nome da tarefa ou pacote de trabalho |
| `tipo` | string (enum) | Sim | `"Resumo"`, `"Atividade"`, `"Marco"` |
| `nivel` | number (1-5) | Não | Nível hierárquico — define a indentação visual (1=raiz, 5=mais profundo) |
| `pai_id` | string (FK) | Não | ID da tarefa-pai (deve ser do tipo "Resumo") |
| `data_inicio_planejada` | date | Não | Data de início planejada |
| `data_fim_planejada` | date | Não | Data de término planejada |
| `data_inicio_baseline` | date | Não | Data de início da baseline (planejamento original) |
| `data_fim_baseline` | date | Não | Data de término da baseline original |
| `avanco_previsto` | number (%) | Não | Percentual de avanço previsto para esta tarefa |
| `avanco_realizado` | number (%) | Não | Percentual de avanço efetivamente realizado |
| `caminho_critico` | boolean | Não | `true` se a tarefa pertence ao caminho crítico |
| `responsavel` | string | Não | Nome do responsável pela tarefa |
| `predecessoras` | string | Não | Códigos WBS das predecessoras separados por vírgula (ex: "1.1, 1.2") |
| `projeto_id` | string (FK) | Sim | Projeto ao qual a tarefa pertence |

---

## KPIs do Módulo

Quatro cards no topo (calculados excluindo tarefas do tipo "Resumo"):

| KPI | Cálculo | Cor |
|---|---|---|
| **Total de Tarefas** | `COUNT(*)` excluindo tipo "Resumo" | Azul |
| **Em Andamento** | `COUNT(*)` onde `avanco_realizado > 0 AND avanco_realizado < 100` | Amarelo |
| **Concluídas** | `COUNT(*)` onde `avanco_realizado >= 100` | Verde |
| **Atrasadas** | `COUNT(*)` onde `data_fim_planejada < hoje AND avanco_realizado < 100` | Vermelho |

---

## Barra de Ferramentas

Exibida acima do Gantt, contém 3 controles:

| Controle | Tipo | Estado Inicial | Descrição |
|---|---|---|---|
| **Dias / Semanas** | Toggle (2 botões) | Dias | Zoom do eixo X — cada célula representa 1 dia (32px) ou 1 semana (80px) |
| **Caminho Crítico** | Toggle on/off | Desligado | Destaca em vermelho as tarefas com `caminho_critico = true` |
| **Baseline** | Toggle on/off | Desligado | Exibe barras cinzas de referência com as datas originais |

---

## Gráfico de Gantt (`GanttChart`)

### Estrutura Visual

O Gantt é dividido em **2 painéis lado a lado** com divisor fixo:

```
┌───────────────────────────────────────┬──────────────────────────────────────────────────────┐
│         PAINEL ESQUERDO (760px)       │              PAINEL DIREITO (scroll horizontal)       │
│         Tabela WBS                    │              Barras de Gantt                          │
│                                       │                                                        │
│ WBS | Tarefa      | Iní | Tér | % | Ações │ Jan/26          Fev/26          Mar/26          │
│ 1   | Fase 1      | ... | ... | - |       │ [============================================] │
│   1.1| Engenharia | ... | ... |75%|       │         [================]                      │
│     1.1.1| Projeto| ... | ... |100|       │         [========]                              │
│   1.2| Construção | ... | ... |40%|       │                  [================]             │
│─────│            ─│─   │─    │─  │       │         ↑ hoje (linha vermelha)                │
└───────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

---

### Painel Esquerdo — Tabela WBS (760px fixo)

**Colunas:**

| Coluna | Largura | Conteúdo |
|---|---|---|
| **Tarefa** | flex | Código WBS + nome com indentação |
| **Início** | 90px | `data_inicio_planejada` formato `dd/MM/yy` |
| **Término** | 90px | `data_fim_planejada` formato `dd/MM/yy` |
| **%** | 50px | `avanco_realizado` com sinal `%` |
| **Ações** | 80px | Botão editar (ícone olho) |

**Regras de indentação:**

| Nível | Indentação (padding-left) |
|---|---|
| N1 | 0px |
| N2 | 16px |
| N3 | 32px |
| N4 | 48px |
| N5 | 64px |

**Botões de colapsar/expandir:**
- Apenas tarefas do tipo "Resumo" com filhos têm o botão
- Ícone `ChevronDown` (expandido) ou `ChevronRight` (colapsado)
- Ao colapsar: todas as tarefas descendentes ficam ocultas no painel esquerdo E no painel direito simultaneamente
- Estado de colapso: armazenado em state local do componente (não persiste entre sessões)

**Elementos visuais por tipo:**

| Tipo | Visual |
|---|---|
| Resumo | Nome em **negrito**, sem ícone de tipo |
| Atividade | Nome em fonte normal |
| Marco | Ícone de diamante (quadrado 8px rotacionado 45°) antes do nome |

**Indicadores especiais:**
- **Tarefa atrasada:** ícone `AlertTriangle` laranja à direita do nome
- **Tarefa crítica (quando toggle ativo):** fundo da linha rosado (`bg-red-50`), texto vermelho (`text-red-700`)
- **Código WBS:** exibido em cinza (`text-gray-400`) antes do nome da tarefa

---

### Painel Direito — Barras de Gantt (scroll horizontal)

**Cabeçalho do eixo de tempo:**

- **Modo Dias:** cada célula = 1 dia (32px de largura), exibe o número do dia e o mês abreviado
- **Modo Semanas:** cada célula = 1 semana (80px de largura), exibe "Sem X / DD MMM"

**Linha "Hoje":**
- Linha vertical vermelha semitransparente (opacity 0.7)
- Largura de 2px
- Traversa todo o painel do Gantt de cima a baixo
- Posição calculada: `(hoje - dataInicial) × pixelsPerDay`

**Renderização de barras por tipo:**

| Tipo | Barra | Cor | Especificações |
|---|---|---|---|
| Resumo | Barra horizontal cheia | `#26405d` (azul escuro) | Altura 12px, sem preenchimento de progresso |
| Atividade | Barra com preenchimento | `#3b82f6` (azul) | Altura 16px, preenchimento proporcional ao `avanco_realizado` |
| Marco | Diamante | `#c35e1e` (terracota) | Quadrado 14px rotacionado 45° posicionado na data de início |

**Barra de atividade detalhada:**
```
Barra de fundo (cinza claro): largura total da duração
Barra de preenchimento (azul): largura = total × (avanco_realizado/100)
Borda: colorida conforme tipo
```

**Barra de Baseline** (quando toggle ativo):
- Barra cinza escuro (`#9ca3af`)
- Altura: 6px (fina, abaixo da barra principal)
- Posicionada nas datas de `data_inicio_baseline` a `data_fim_baseline`
- Aparece apenas se a tarefa tiver dados de baseline

**Tarefa Crítica** (quando toggle Caminho Crítico ativo):
- Barra principal muda para vermelho (`#ef4444`)
- Fundo da barra muda para vermelho claro
- Linha inteira no painel esquerdo também recebe destaque vermelho

---

## Cálculo de Posicionamento das Barras

```javascript
// Data mais antiga entre todas as tarefas define o início do eixo
const dataInicial = min(tarefas.map(t => t.data_inicio_planejada));

// Posição X da barra
const posicaoX = (tarefa.data_inicio_planejada - dataInicial) × pixelsPerDay;

// Largura da barra
const largura = (tarefa.data_fim_planejada - tarefa.data_inicio_planejada) × pixelsPerDay;

// pixelsPerDay:
// Modo Dias: 32px
// Modo Semanas: 80 / 7 ≈ 11.43px
```

---

## Formulário de Tarefa (`TarefaForm`)

**Tipo:** modal flutuante centralizado, `max-w-xl`, `max-h-[90vh]`, scroll interno.

**Campos:**

| Campo | Componente | Validação | Observação |
|---|---|---|---|
| Código WBS | Input texto | Opcional | Ex: "1.2.3" — identificador hierárquico |
| Tipo | Select | Obrigatório | Resumo, Atividade, Marco |
| Nome da Tarefa | Input texto | Obrigatório | Nome descritivo |
| Tarefa Pai | Select | Opcional | Lista apenas tarefas do tipo "Resumo" |
| Nível Hierárquico | Input número (1-5) | Opcional | Define a indentação |
| Início Planejado | Input date | Condicional | Não exibido para Marcos |
| Fim Planejado | Input date | Condicional | Para Marco: usa início como fim |
| Início Baseline | Input date | Opcional | Data original antes de replanejamentos |
| Fim Baseline | Input date | Opcional | |
| Avanço Previsto (%) | Input número (0-100) | Opcional | |
| Avanço Realizado (%) | Input número (0-100) | Opcional | |
| Responsável | Input texto | Opcional | |
| Predecessoras | Input texto | Opcional | Códigos WBS separados por vírgula |
| Caminho Crítico | Checkbox | Opcional | Marca a tarefa como pertencente ao caminho crítico |

**Comportamento para Marcos:**
- Apenas uma data (início = fim)
- Campos de fim são ocultados ou preenchidos automaticamente com a data de início

---

## Hierarquia e Colapso/Expansão

**Regras da hierarquia:**
- Uma tarefa do tipo "Resumo" pode ter filhos de qualquer tipo
- Tarefas "Atividade" e "Marco" são folhas — não têm filhos
- O campo `pai_id` define o pai direto na hierarquia
- O campo `nivel` define a indentação mas deve ser consistente com `pai_id`

**Algoritmo de colapso:**
1. Estado local: `collapsed: Set<string>` (IDs de tarefas colapsadas)
2. Ao colapsar uma tarefa: adicionar seu ID ao Set
3. Ao expandir: remover do Set
4. Na renderização: filtrar a lista de tarefas para ocultar todas as que têm um ancestral no Set `collapsed`

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Nova Tarefa** | Cabeçalho | Terracota | Abre modal de criação |
| **Criar Tarefa** | Rodapé do modal | Terracota | Salva nova tarefa |
| **Atualizar** | Rodapé do modal (edição) | Terracota | Salva edição |
| **Cancelar** | Rodapé do modal | Outline | Fecha modal |
| **Editar** (ícone olho) | Coluna de ações na tabela WBS | Outline | Abre modal preenchido |
| **Colapsar** (ChevronDown) | Linha de tarefa Resumo | — | Oculta filhos |
| **Expandir** (ChevronRight) | Linha de tarefa Resumo colapsada | — | Exibe filhos |

---

## Legenda do Gráfico

Exibida abaixo do Gantt ou em tooltip:

| Elemento | Significado |
|---|---|
| Barra azul escura | Tarefa Resumo |
| Barra azul | Tarefa Atividade |
| Diamante terracota | Marco |
| Barra vermelha | Tarefa no Caminho Crítico (toggle ativo) |
| Barra cinza fina | Baseline (toggle ativo) |
| Linha vermelha vertical | Data atual (hoje) |
| Ícone ⚠️ laranja | Tarefa atrasada |

---

## Lógica de React Query

### Query

```javascript
useQuery({
  queryKey: ['tarefas', selectedProjectId],
  queryFn: () => base44.entities.TarefaCronograma.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
  select: (data) => data.sort((a, b) => a.codigo_wbs?.localeCompare(b.codigo_wbs))
})
```

### Mutações

- **Criar:** `base44.entities.TarefaCronograma.create(data)` → invalida `['tarefas', selectedProjectId]`
- **Editar:** `base44.entities.TarefaCronograma.update(id, data)` → invalida `['tarefas', selectedProjectId]`
- **Excluir:** `base44.entities.TarefaCronograma.delete(id)` → invalida `['tarefas', selectedProjectId]` (atenção: excluir uma tarefa Resumo pode deixar filhos órfãos)

---

## Design Detalhado

### Painel Esquerdo

- Header da tabela: `bg-gray-100 font-semibold text-sm`
- Linhas alternadas: `hover:bg-blue-50`
- Linha crítica ativa: `bg-red-50`
- Separador vertical entre painéis: `border-r-2 border-gray-200`

### Painel Direito

- Header do eixo de tempo: `bg-gray-50 text-xs font-medium`
- Barras com bordas coloridas e fill semitransparente (`opacity: 0.8`)
- Linha "Hoje": `border-red-500 border-l-2 opacity-70`

---

## Estado Vazio

**Sem projeto:**
- Ícone `Calendar` em cinza
- Título: "Nenhum Projeto Selecionado"

**Com projeto sem tarefas:**
- Card centralizado com ícone `Calendar` azul
- Título: "Cronograma Vazio"
- Subtítulo: "Adicione tarefas para construir o cronograma do projeto."
- Botão "Nova Tarefa" em destaque
