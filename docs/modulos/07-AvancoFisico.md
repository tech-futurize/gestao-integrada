# Módulo: Avanço Físico

## Visão Geral

O módulo de Avanço Físico registra e acompanha o **progresso percentual da execução do projeto ao longo do tempo**. Assim como o módulo Financeiro, funciona com dados mensais de **avanço previsto vs. realizado**, calculando automaticamente os valores acumulados e o índice de aderência ao planejamento.

O avanço físico representa o percentual de conclusão das obras/serviços do contrato — quando o acumulado realizado atinge 100%, o escopo contratual está concluído. A comparação com o previsto permite visualizar se o projeto está adiantado, em dia ou atrasado.

---

## Acesso

Rota: `/AvancoFisico`  
Menu lateral: **"Avanço Físico"** (ícone `TrendingUp`)

---

## Entidade de Dados

**AvancoFisico** — cada registro representa um mês de referência:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `mes_referencia` | date (YYYY-MM-01) | Sim | Mês de referência — sempre o dia 1 do mês |
| `avanco_previsto_mensal` | number (%) | Sim | Percentual de avanço físico previsto para o mês |
| `avanco_realizado_mensal` | number (%) | Sim | Percentual de avanço físico realizado no mês |
| `avanco_previsto_acumulado` | number (%) | Calculado | Soma acumulada dos previstos até este mês |
| `avanco_realizado_acumulado` | number (%) | Calculado | Soma acumulada dos realizados até este mês |
| `projeto_id` | string (FK) | Sim | Projeto ao qual o registro pertence |

### Regras de Validação dos Dados

- Todos os valores são percentuais: entre `0.00` e `100.00`
- A soma dos valores mensais previstos ao longo do projeto deve ser próxima de 100% (representando a conclusão total)
- O acumulado nunca deve ultrapassar 100% — se ultrapassar, indica erro de planejamento
- Valores com até 2 casas decimais (ex: `8.35`, `12.50`)

### Regra de Cálculo dos Acumulados

Idêntica ao módulo Financeiro — os acumulados são calculados somando todos os valores mensais anteriores:

```
avanco_previsto_acumulado[mês N] = Σ avanco_previsto_mensal[mês 1 até N]
avanco_realizado_acumulado[mês N] = Σ avanco_realizado_mensal[mês 1 até N]
```

**Recálculo em cascata:** ao criar, editar ou excluir qualquer registro, o sistema deve recalcular os acumulados de todos os meses do projeto.

---

## Gráfico de Linha — Curva S de Avanço Físico

### Especificações

- **Biblioteca:** Recharts (`LineChart`)
- **Tipo de dados:** valores acumulados (curva S), não os valores mensais
- **Eixo X:** meses de referência, formato `MMM/yy` (ex: "Jan/26")
- **Eixo Y:** percentual de `0%` a `100%`, com sufixo `%`
  - Domínio fixo: `[0, 100]`
  - Ticks: 0, 20, 40, 60, 80, 100
  - Formatador do eixo: `(valor) => ${valor}%`
- **Linhas plotadas:**

| Linha | Cor | Campo |
|---|---|---|
| Avanço Previsto Acumulado | `#26405d` (azul escuro) | `avanco_previsto_acumulado` |
| Avanço Realizado Acumulado | `#c35e1e` (terracota) | `avanco_realizado_acumulado` |

- **Tooltip:** `X.XX%` ao passar o mouse (ex: "Previsto: 45,30% | Realizado: 42,10%")
- **Legenda:** abaixo do gráfico
- **Dimensões:** altura 350px, largura 100% (ResponsiveContainer)
- **Curvas:** `type="monotone"` para suavização

### Container do Gráfico

- Card branco com sombra
- Cabeçalho: ícone `TrendingUp` em terracota + título "Curva de Avanço Físico Acumulado"
- Padding: `p-6`

---

## Tabela de Histórico de Avanço Físico

### Colunas

| Coluna | Formato | Alinhamento |
|---|---|---|
| **Mês** | `MMMM/yyyy` (ex: "janeiro/2026") | Esquerda |
| **Previsto Mensal (%)** | `X.XX%` | Direita |
| **Realizado Mensal (%)** | `X.XX%` | Direita |
| **Previsto Acumulado (%)** | `X.XX%` | Direita |
| **Realizado Acumulado (%)** | `X.XX%` | Direita |
| **Aderência (%)** | Colorida semanticamente | Centro |
| **Ações** | Ícones | Centro |

### Cálculo e Coloração da Aderência

```
Aderência = (Realizado Acumulado / Previsto Acumulado) × 100
```

| Faixa | Cor |
|---|---|
| ≥ 90% | Verde (`text-green-600`) |
| 70% a 89,9% | Amarelo (`text-yellow-600`) |
| < 70% | Vermelho (`text-red-600`) |

**Exemplo:**
- Previsto Acumulado: 45.00%
- Realizado Acumulado: 42.10%
- Aderência: (42.10 / 45.00) × 100 = **93.6%** → Verde

---

## Edição Inline

Comportamento idêntico ao módulo Financeiro:

1. Clicar em "Editar" transforma a linha em campos editáveis
2. Campos editáveis: Mês (`type="month"`), Previsto Mensal (%), Realizado Mensal (%)
3. Campos não editáveis (calculados): Previsto Acumulado, Realizado Acumulado, Aderência
4. Ao salvar: recalcula todos os acumulados do projeto e recarrega a tabela

**Formatação do input:** aceita decimais com ponto ou vírgula. Internamente armazenado com ponto.

---

## Adição de Novo Registro

1. Botão "Adicionar" insere linha nova no topo da tabela com `bg-green-50`
2. Campos: Mês, Avanço Previsto (%), Avanço Realizado (%)
3. Os acumulados são calculados ao salvar
4. Validação: valores entre 0 e 100

---

## Diferença em Relação ao Módulo Financeiro

| Aspecto | Financeiro | Avanço Físico |
|---|---|---|
| **Unidade** | R$ (reais) | % (percentual) |
| **Eixo Y do gráfico** | Valores monetários compactos (M, k) | Domínio fixo 0-100% |
| **Campos** | `faturamento_previsto/realizado` | `avanco_previsto/realizado` |
| **Tooltip** | `R$ X.XXX.XXX,XX` | `X.XX%` |
| **Formatação no input** | Número decimal grande | Percentual entre 0-100 |
| **Acumulado máximo** | Sem limite superior | Não deve ultrapassar 100% |
| **Entidade backend** | `Financeiro` | `AvancoFisico` |
| **Ícone** | `DollarSign` | `TrendingUp` |

---

## Botões e Ações

| Botão | Cor | Ação |
|---|---|---|
| **Importar** | Outline | Placeholder — não implementado |
| **Adicionar** | Verde | Insere linha editável no topo |
| **Salvar** (disquete) | Verde | Confirma criação/edição e recalcula |
| **Cancelar** (X) | Outline | Descarta alterações |
| **Editar** (lápis) | Cinza | Ativa edição inline |
| **Excluir** (lixeira) | Vermelho | Remove e recalcula acumulados |

---

## Lógica de React Query

### Query

```javascript
useQuery({
  queryKey: ['avancofisico', selectedProjectId],
  queryFn: () => base44.entities.AvancoFisico.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
  select: (data) => data.sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia))
})
```

### Mutação com Recálculo

```javascript
const recalcularAcumulados = async (projectId) => {
  const registros = await base44.entities.AvancoFisico.list({ projeto_id: projectId });
  const ordenados = registros.sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
  
  let prevAcumulado = 0;
  let realAcumulado = 0;
  
  for (const reg of ordenados) {
    prevAcumulado += reg.avanco_previsto_mensal;
    realAcumulado += reg.avanco_realizado_mensal;
    await base44.entities.AvancoFisico.update(reg.id, {
      avanco_previsto_acumulado: Math.min(prevAcumulado, 100),
      avanco_realizado_acumulado: Math.min(realAcumulado, 100)
    });
  }
};
```

---

## Integração com Outros Módulos

- **Dashboard:** os valores de avanço previsto e realizado acumulados mais recentes são exibidos no card de resumo do Dashboard, com o desvio em pontos percentuais
- **Cronograma:** o avanço físico por mês deve correlacionar com o avanço calculado no Gantt (soma ponderada das tarefas concluídas) — porém no estado atual são sistemas independentes
- **Financeiro:** combinando os dois módulos, pode-se analisar o índice de desempenho (faturamento proporcional ao avanço físico)

---

## Design e Layout

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [TrendingUp] Avanço Físico                            │
│ Progresso previsto vs. realizado                     │
│                    [Importar] [Adicionar]             │
└──────────────────────────────────────────────────────┘
```

### Estrutura idêntica ao Financeiro

- **Card 1:** gráfico de linha (curva S acumulada)
- **Card 2:** tabela de histórico com edição inline

Todos os padrões de design (hover, cores de aderência, linha de novo registro, modo de edição) são idênticos ao módulo Financeiro — apenas os dados e unidades diferem.

---

## Estado Vazio

**Sem projeto:**
- Ícone `TrendingUp` em cinza
- Título: "Nenhum Projeto Selecionado"

**Com projeto sem dados:**
- Gráfico vazio
- Tabela com mensagem "Nenhum dado de avanço físico cadastrado"
- Botão "Adicionar Primeiro Registro"
