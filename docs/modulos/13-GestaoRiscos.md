# Módulo: Gestão de Riscos

## Visão Geral

O módulo de Gestão de Riscos oferece uma **matriz de riscos** visual (heat map) e uma lista gerenciável de riscos do projeto. Cada risco é avaliado por probabilidade e impacto, gerando um score de criticidade, e possui um plano de mitigação associado.

> **Nota sobre persistência:** o módulo atual usa uma lista de riscos **pré-carregada como mock data** no estado local do componente React. Não há integração com backend — as alterações se perdem ao recarregar a página. Para versão com persistência, seria necessário criar uma entidade no backend.

---

## Acesso

Rota: `/GestaoRiscos`  
Menu lateral: **"Gestão de Riscos"** (ícone `ShieldAlert`)

---

## Estrutura de Dados de um Risco

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | Sim | Identificador único (gerado localmente) |
| `codigo` | string | Sim | Código identificador (ex: "R-001", "R-007") |
| `descricao` | string | Sim | Descrição detalhada do risco e seu cenário |
| `categoria` | string (enum) | Não | Área de origem do risco |
| `probabilidade` | string (enum) | Sim | Baixa, Média, Alta |
| `impacto` | string (enum) | Sim | Baixo, Médio, Alto |
| `score` | number | Calculado | Pontuação de criticidade = Valor(probabilidade) × Valor(impacto) |
| `status` | string (enum) | Sim | Ativo, Em Monitoramento, Mitigado, Encerrado |
| `responsavel` | string | Não | Nome do responsável pelo monitoramento do risco |
| `mitigacao` | string | Não | Plano de ação para mitigar ou transferir o risco |
| `residual` | string (enum) | Não | Nível de risco após aplicação das mitigações: Baixo, Médio, Alto |

### Categorias de Risco

- Suprimentos
- Financeiro
- Construção
- Engenharia
- RH (Recursos Humanos)
- Regulatório
- Ambiental

---

## Cálculo de Score (Criticidade)

```
Score = Valor(Probabilidade) × Valor(Impacto)

Mapeamento de valores:
  Baixa / Baixo  = 1
  Média / Médio  = 3
  Alta  / Alto   = 3

Scores possíveis:
  1 × 1 = 1  → Baixo
  1 × 3 = 3  → Médio/Baixo
  3 × 1 = 3  → Médio/Baixo
  3 × 3 = 9  → Crítico

Classificação:
  Score = 9  → Crítico  (vermelho)
  Score 3-6  → Médio    (amarelo/laranja)
  Score = 1  → Baixo    (verde)
```

**Nota:** o mapeamento `Média = 3` e `Alta = 3` resulta em apenas 3 scores possíveis (1, 3, 9). Para granularidade maior, seria possível usar `Média = 2, Alta = 3` gerando scores de 1, 2, 3, 4, 6, 9.

---

## KPIs do Módulo

Quatro cards no topo da página, calculados sobre a lista de riscos:

| KPI | Cálculo | Cor do Fundo |
|---|---|---|
| **Riscos Críticos** | `COUNT(*)` onde `score = 9` | Vermelho (`bg-red-50 border-red-200`) |
| **Riscos Médios** | `COUNT(*)` onde `score >= 3 AND score < 9` | Laranja (`bg-orange-50 border-orange-200`) |
| **Riscos Baixos** | `COUNT(*)` onde `score = 1` | Verde (`bg-green-50 border-green-200`) |
| **Em Monitoramento** | `COUNT(*)` onde `status = "Em Monitoramento"` | Azul (`bg-blue-50 border-blue-200`) |

---

## Matriz de Riscos (Heat Map 3×3)

### Layout

Grade 3×3 onde:
- **Eixo Y (vertical):** Probabilidade (Alta → Média → Baixa, de cima para baixo)
- **Eixo X (horizontal):** Impacto (Baixo → Médio → Alto, da esquerda para direita)

### Mapeamento de Células

| | Baixo | Médio | Alto |
|---|---|---|---|
| **Alta** | Médio (amarelo) | Alto (laranja) | **Crítico (vermelho)** |
| **Média** | Baixo (verde) | Médio (amarelo) | Alto (laranja) |
| **Baixa** | **Mín (verde escuro)** | Baixo (verde) | Médio (amarelo) |

**Cores das células:**

| Nível | Cor de Fundo | Cor do Texto |
|---|---|---|
| Crítico (Alta × Alto) | `bg-red-200` | `text-red-900` |
| Alto | `bg-orange-200` | `text-orange-900` |
| Médio | `bg-yellow-200` | `text-yellow-900` |
| Baixo | `bg-green-200` | `text-green-900` |
| Mínimo (Baixa × Baixo) | `bg-green-300` | `text-green-900` |

### Conteúdo de cada célula

Cada célula exibe os **códigos** dos riscos que estão naquele cruzamento de probabilidade × impacto:
- Ex: célula (Alta × Alto) pode exibir: "R-001, R-005"
- Se vazia: célula mostra apenas a cor sem texto
- Badges com os códigos dos riscos (fonte mono, pequena)

### Dimensões

- Grade: 3×3 com células iguais
- Largura mínima por célula: 100px
- Altura por célula: 80px
- Labels dos eixos: verticalmente para Y, horizontalmente para X

---

## Filtros

Três filtros aplicados client-side sobre a lista de riscos:

### Filtro por Status

Select dropdown:
- Todos (padrão)
- Ativo
- Em Monitoramento
- Mitigado
- Encerrado

### Filtro por Categoria

Select dropdown com todas as categorias disponíveis + "Todas" (padrão).

### Filtro por Criticidade

Select ou botões toggle:
- Todas (padrão)
- Alta (score = 9)
- Média (score 3-6)
- Baixa (score = 1)

**Os filtros são combinados:** um risco deve passar por TODOS os filtros ativos para ser exibido.

**Os filtros também atualizam a Matriz de Riscos** — apenas os riscos filtrados aparecem nos badges das células.

---

## Lista de Riscos

**Tabela** com todas as colunas:

| Coluna | Formato | Descrição |
|---|---|---|
| **Código** | texto mono | Ex: "R-001" |
| **Descrição** | texto truncado (2 linhas) + tooltip completo | Descrição do risco |
| **Categoria** | badge outline | Área |
| **Probabilidade** | badge colorido | Baixa/Média/Alta |
| **Impacto** | badge colorido | Baixo/Médio/Alto |
| **Score** | badge com fundo colorido | Valor numérico |
| **Status** | badge colorido | Status atual |
| **Responsável** | texto | Nome |
| **Mitigação** | texto truncado + tooltip | Plano de mitigação |
| **Risco Residual** | badge colorido | Baixo/Médio/Alto |
| **Ações** | ícones | Editar, Excluir |

**Ordenação padrão:** por score decrescente (críticos primeiro).

---

## Badges de Probabilidade e Impacto

| Valor | Cor |
|---|---|
| Alta / Alto | Vermelho (`bg-red-100 text-red-800`) |
| Média / Médio | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Baixa / Baixo | Verde (`bg-green-100 text-green-800`) |

**Badge de Score:**

| Score | Cor |
|---|---|
| 9 (Crítico) | Vermelho sólido (`bg-red-600 text-white`) |
| 3-6 (Médio) | Amarelo sólido (`bg-yellow-500 text-white`) |
| 1 (Baixo) | Verde sólido (`bg-green-600 text-white`) |

**Badge de Status:**

| Status | Cor |
|---|---|
| Ativo | Vermelho (`bg-red-100 text-red-800`) |
| Em Monitoramento | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Mitigado | Verde (`bg-green-100 text-green-800`) |
| Encerrado | Cinza (`bg-gray-100 text-gray-600`) |

---

## Formulário de Risco

**Tipo:** modal flutuante com overlay escuro.

**Campos:**

| Campo | Componente | Validação |
|---|---|---|
| Código | Input texto | Obrigatório (ex: "R-008") |
| Descrição | Textarea (4 linhas) | Obrigatório |
| Categoria | Select | Opcional |
| Probabilidade | Select | Obrigatório |
| Impacto | Select | Obrigatório |
| Status | Select | Obrigatório (padrão: "Ativo") |
| Responsável | Input texto | Opcional |
| Plano de Mitigação | Textarea (3 linhas) | Opcional |
| Risco Residual | Select | Opcional |

**Cálculo automático do Score:**
- Ao alterar Probabilidade ou Impacto, o Score é calculado e exibido no formulário em tempo real (antes de salvar)
- Display: "Score calculado: **9** (Crítico)" com cor correspondente

---

## Dados Mock (Pré-carregados)

O módulo é inicializado com **7 riscos de exemplo** representando cenários típicos de projetos de engenharia/construção:

| Código | Descrição | Categoria | Probabilidade | Impacto | Score |
|---|---|---|---|---|---|
| R-001 | Atraso na entrega de equipamentos críticos | Suprimentos | Alta | Alto | 9 |
| R-002 | Variação cambial em contratos de importação | Financeiro | Alta | Médio | 3 |
| R-003 | Condições climáticas adversas | Construção | Média | Alto | 3 |
| R-004 | Aprovação tardia de documentos de engenharia | Engenharia | Média | Médio | 3 |
| R-005 | Escassez de mão de obra qualificada | Construção | Alta | Alto | 9 |
| R-006 | Mudanças regulatórias inesperadas | Regulatório | Baixa | Alto | 3 |
| R-007 | Conflito de interface entre disciplinas | Engenharia | Média | Alto | 3 |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **+ Novo Risco** | Cabeçalho | Vermelho escuro (`bg-red-900`) | Abre modal de criação |
| **Salvar Risco** | Rodapé do modal | Vermelho escuro | Persiste no estado local |
| **Cancelar** | Rodapé do modal | Outline | Fecha o modal |
| **Editar** (lápis) | Coluna de ações | Outline | Abre modal preenchido |
| **Excluir** (lixeira) | Coluna de ações | Vermelho | Remove do estado local |
| **Filtros** | Barra acima da tabela | — | Atualizam lista e matriz |

---

## Design e Layout

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [ShieldAlert] Gestão de Riscos                        │
│ Identificação, avaliação e mitigação de riscos       │
│                              [+ Novo Risco]          │
└──────────────────────────────────────────────────────┘
```

### Layout Principal
```
┌──────────────────────────────────────────────────────┐
│ [KPI Crítico] [KPI Médio] [KPI Baixo] [KPI Monitor] │
└──────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌─────────────────────────────┐
│  Matriz de Riscos    │  │  Filtros + Tabela de Riscos  │
│  (Heat Map 3×3)      │  │                              │
└──────────────────────┘  └─────────────────────────────┘
```

**Responsividade:**
- Desktop: matriz à esquerda (1/3) + tabela à direita (2/3)
- Mobile: matriz acima + tabela abaixo (empilhado)

### Matriz de Riscos (visual)

```
        │  Baixo  │  Médio  │   Alto  │
────────┼─────────┼─────────┼─────────┤
  Alta  │  🟡     │  🟠     │  🔴 R-001│
────────┼─────────┼─────────┼─────────┤
  Média │  🟢     │  🟡     │  🟠 R-003│
────────┼─────────┼─────────┼─────────┤
  Baixa │  🟢     │  🟢     │  🟡 R-006│
```

---

## Integração com Outros Módulos

- **Dashboard:** KPIs de riscos (críticos, médios, baixos, monitorados) aparecem no card de resumo
- **Planos de Ação:** cada risco ativo pode gerar ações nos Planos de Ação das áreas correspondentes
- **Pleitos:** riscos que se concretizam podem originar pleitos contratuais

---

## Estado Vazio

Como o módulo usa mock data, o estado "sem dados" raramente ocorre. Porém, ao filtrar:

**Com filtros aplicados sem resultados:**
- Tabela: "Nenhum risco encontrado para os filtros aplicados."
- Matriz: células todas vazias (sem badges)
- Botão "Limpar Filtros" disponível
