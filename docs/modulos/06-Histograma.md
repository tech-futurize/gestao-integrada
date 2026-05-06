# Módulo: Histograma de Recursos

## Visão Geral

O módulo de Histograma permite o **acompanhamento da mobilização de recursos humanos e de equipamentos** ao longo do tempo. Para cada recurso cadastrado, é possível registrar mensalmente:

1. **Quantidade Prevista:** planejamento original
2. **Quantidade Folha:** realizado conforme folha de pagamento
3. **Quantidade RDO:** realizado conforme registros diários de obra

A comparação entre as três fontes permite identificar inconsistências (ex: o RDO registra mais pessoas do que a folha pagou) e desvios em relação ao planejamento.

---

## Acesso

Rota: `/Histograma`  
Menu lateral: **"Histograma"** (ícone `BarChart3`)

---

## Entidades de Dados

### Recurso (entidade de referência)

Cadastro dos recursos que podem ser mobilizados no projeto:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto ao qual o recurso pertence |
| `tipo_recurso` | string (enum) | Sim | Tipo: MOD, MOI, EQUIPAMENTO |
| `nome_recurso` | string | Sim | Nome do recurso (ex: "Soldador", "Eletricista", "Guindaste 30t") |
| `unidade_medida` | string (enum) | Não | HH, HM, UND, HORA, DIA, MÊS |
| `preco_unitario` | number | Sim | Preço unitário do recurso em R$ |
| `referencia_custo` | string (enum) | Não | Origem da referência de custo: Contrato, SINAPI, SEOP, RDO, Outros |

**Nota:** os recursos são criados no sistema para que possam ser selecionados nos registros mensais. Pode haver uma tela separada de cadastro de recursos ou um campo de criação rápida no formulário.

### Histograma (registro mensal por recurso)

Cada registro representa um mês de referência para um recurso específico:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto vinculado |
| `recurso_id` | string (FK) | Sim | Referência ao Recurso cadastrado |
| `mes_referencia` | date (YYYY-MM-01) | Sim | Mês de referência — sempre o dia 1 do mês |
| `quantidade_prevista_mensal` | number | Não | Quantidade planejada para o mês |
| `quantidade_realizada_mensal` | number | Não | Quantidade realizada no mês |
| `valor_previsto_mensal` | number | Não | Valor financeiro previsto para o mês |
| `valor_realizado_mensal` | number | Não | Valor financeiro realizado no mês |

> **Nota:** o campo `quantidade_rdo_mensal` **não existe** no schema da entidade — era incorreto na versão anterior desta documentação.

---

## Filtro por Recurso

No cabeçalho do card do gráfico, há um **Select dropdown** com as opções:
- "Todos os recursos" (padrão)
- [Nome de cada recurso cadastrado no projeto]

**Comportamento:**
- Ao selecionar "Todos os recursos": gráfico e tabela mostram dados de todos os recursos somados por mês
- Ao selecionar um recurso específico: gráfico e tabela são filtrados para mostrar apenas aquele recurso
- O filtro é aplicado localmente (client-side) sobre os dados carregados

**Agregação no modo "Todos":**
- Por mês: soma de `quantidade_prevista_mensal`, `quantidade_realizada_mensal` e `quantidade_rdo_mensal` de todos os recursos

---

## Gráfico de Barras — Histograma de Mobilização

### Especificações

- **Biblioteca:** Recharts (`BarChart`)
- **Tipo:** barras agrupadas (grouped bar chart) — 3 barras por mês
- **Eixo X:** meses de referência, formato `MMM/yy` (ex: "Jan/26", "Fev/26")
- **Eixo Y:** quantidade numérica (inteiro, sem casas decimais)

### Séries de Dados

| Série | Cor | Campo |
|---|---|---|
| Quantidade Prevista | `#26405d` (azul escuro) | `quantidade_prevista_mensal` |
| Quantidade Folha | `#c35e1e` (terracota) | `quantidade_realizada_mensal` |
| Quantidade RDO | `#00a49a` (verde-água) | `quantidade_rdo_mensal` |

- **Tooltip:** ao passar o mouse em qualquer barra, exibe mês + valores das 3 séries
- **Legenda:** exibida abaixo do gráfico identificando cada cor
- **Dimensões:** altura 350px, largura 100% (ResponsiveContainer)
- **Gap entre barras:** `barGap={4}` para espaçamento visual

### Container do Gráfico

- Card branco com sombra
- Cabeçalho: ícone `BarChart3` + título "Histograma de Mobilização de Recursos" + Select de filtro à direita
- Padding: `p-6`

---

## Tabela de Detalhamento de Registros

### Colunas

| Coluna | Formato | Descrição |
|---|---|---|
| **Semana/Mês** | `dd/MM/yy - dd/MM/yy` | Período do início ao fim do mês |
| **Recurso** | texto | Nome do recurso |
| **Qtd Prevista** | número inteiro | Planejamento |
| **Qtd Folha** | número inteiro | Realizado pela folha |
| **Qtd RDO** | número inteiro | Realizado pelo RDO |
| **Aderência (%)** | `XX.X%` colorido | (Qtd Folha / Qtd Prevista) × 100 |
| **Ações** | ícones | Editar / Excluir |

**Formatação do período:**
- Calcula `startOfMonth(mes_referencia)` e `endOfMonth(mes_referencia)`
- Formata ambos como `dd/MM/yy`
- Exibe como "01/01/26 - 31/01/26"

### Cálculo e Coloração da Aderência

```
Aderência = (Qtd Realizada Folha / Qtd Prevista) × 100
```

| Faixa | Cor do Texto |
|---|---|
| ≥ 90% | Verde (`text-green-600`) |
| 70% a 89,9% | Amarelo (`text-yellow-600`) |
| < 70% | Vermelho (`text-red-600`) |

**Caso especial:** se `Qtd Prevista = 0`, exibe `—`.

**Nota sobre RDO vs. Folha:** são fontes independentes de verificação. A aderência é calculada sobre a folha (pagamento), não sobre o RDO.

### Filtro na Tabela

Quando o usuário seleciona um recurso no dropdown do gráfico, a tabela também é filtrada para mostrar apenas os registros daquele recurso.

---

## Edição Inline

**Comportamento ao clicar em "Editar":**
1. A linha inteira transforma-se em modo de edição
2. Campos editáveis: Recurso (Select), Mês (`type="month"`), Qtd Prevista, Qtd Folha, Qtd RDO
3. Botões inline: Salvar (disquete verde) e Cancelar (X outline)
4. Ao salvar: atualiza via API e invalida a query

---

## Adição de Novo Registro

**Comportamento ao clicar em "Adicionar":**
1. Insere linha nova editável no topo da tabela com fundo verde claro (`bg-green-50`)
2. Campos: Recurso (Select com lista de recursos do projeto), Mês (`type="month"`), Qtd Prevista, Qtd Folha, Qtd RDO
3. Validações: Recurso obrigatório, Mês obrigatório, valores numéricos não-negativos
4. Botão Salvar cria o registro; X cancela e remove a linha

**Combinação única:** cada par `(recurso_id, mes_referencia, projeto_id)` deve ser único. Se já existir, o sistema deve alertar o usuário.

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Importar** | Cabeçalho | Outline | Placeholder — não implementado |
| **Adicionar** | Cabeçalho | Verde | Insere linha editável no topo |
| **Select de recurso** | Card do gráfico | — | Filtra gráfico e tabela |
| **Salvar** (disquete) | Coluna ações (edição) | Verde | Confirma adição ou edição |
| **Cancelar** (X) | Coluna ações (edição) | Outline | Descarta alterações |
| **Editar** (lápis) | Coluna ações (normal) | Cinza | Ativa edição inline |
| **Excluir** (lixeira) | Coluna ações (normal) | Vermelho | Remove com confirmação |

---

## Lógica de React Query

### Queries

```javascript
// Registros do histograma do projeto
useQuery({
  queryKey: ['histograma', selectedProjectId],
  queryFn: () => base44.entities.Histograma.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Recursos do projeto
useQuery({
  queryKey: ['recursos', selectedProjectId],
  queryFn: () => base44.entities.Recurso.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

### Mutações

- **Criar:** `base44.entities.Histograma.create(data)` → invalida `['histograma', selectedProjectId]`
- **Editar:** `base44.entities.Histograma.update(id, data)` → invalida `['histograma', selectedProjectId]`
- **Excluir:** `base44.entities.Histograma.delete(id)` → invalida `['histograma', selectedProjectId]`

---

## Design e Layout

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [BarChart3] Histograma de Recursos                    │
│ Mobilização prevista vs. realizada                   │
│                    [Importar] [Adicionar]             │
└──────────────────────────────────────────────────────┘
```

### Card do Gráfico
```
┌──────────────────────────────────────────────────────┐
│ [BarChart3] Histograma de Mobilização  [Todos ▼]     │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [Gráfico de barras agrupadas - 350px]               │
│                                                       │
│  ■ Previsto  ■ Folha  ■ RDO  (legenda)              │
└──────────────────────────────────────────────────────┘
```

### Linha de Novo Registro
- Fundo `bg-green-50` cobrindo toda a linha
- Select de recurso com largura adequada para nomes longos
- Input de mês tipo "month" (ex: "2026-01")

---

## Integração com Outros Módulos

- **Dashboard:** a aderência média de mobilização é exibida no card de Histograma do Dashboard
- **Registros (RDO):** os valores de `quantidade_rdo_mensal` deveriam ser derivados dos RDOs cadastrados no módulo de Registros — porém, no estado atual, são informados manualmente neste módulo
- **Relatórios:** o histograma pode ser exportado como base para relatórios de eficiência de mão de obra

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `BarChart3` em cinza
- Título: "Nenhum Projeto Selecionado"

**Com projeto mas sem dados:**
- Gráfico exibindo área vazia
- Tabela com header e mensagem "Nenhum dado de mobilização cadastrado"
- Orientação para usar o botão "Adicionar"

**Com dados mas recurso selecionado sem registros:**
- Tabela: mensagem "Nenhum registro para este recurso"
- Gráfico: vazio ou mostrando zero em todas as barras
