# Módulo: Financeiro (Controle de Faturamento)

## Visão Geral

O módulo Financeiro é responsável pelo **acompanhamento do faturamento do contrato ao longo do tempo**. Ele permite inserir e comparar os valores de faturamento **previsto vs. realizado** em base mensal, calculando automaticamente os valores acumulados (curva S) e o índice de aderência financeira.

Este módulo é fundamental para a gestão do fluxo de caixa do projeto, permitindo identificar desvios de faturamento antes que se tornem problemas críticos.

---

## Acesso

Rota: `/Financeiro`  
Menu lateral: **"Financeiro"** (ícone `DollarSign`)

---

## Entidade de Dados

**Financeiro** — cada registro representa um mês de referência:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `mes_referencia` | date (YYYY-MM-01) | Sim | Mês de referência — sempre o dia 1 do mês |
| `faturamento_previsto_mensal` | number | Sim | Valor previsto para faturamento no mês (R$) |
| `faturamento_realizado_mensal` | number | Sim | Valor efetivamente faturado no mês (R$) |
| `faturamento_previsto_acumulado` | number | Calculado | Soma acumulada dos valores previstos até este mês |
| `faturamento_realizado_acumulado` | number | Calculado | Soma acumulada dos valores realizados até este mês |
| `projeto_id` | string (FK) | Sim | Projeto ao qual o registro pertence |

### Regra de Cálculo dos Acumulados

Os campos acumulados **são calculados automaticamente** no momento da criação ou atualização de qualquer registro. O algoritmo:

1. Busca todos os registros do projeto ordenados por `mes_referencia` crescente
2. Para cada registro, soma todos os valores mensais anteriores (inclusive o atual)
3. Salva os valores acumulados calculados junto com o registro

```
faturamento_previsto_acumulado[mês N] = Σ faturamento_previsto_mensal[mês 1 até N]
faturamento_realizado_acumulado[mês N] = Σ faturamento_realizado_mensal[mês 1 até N]
```

**Consequência:** ao editar um mês anterior, todos os acumulados dos meses posteriores ficam desatualizados. Para contornar isso, o sistema deve recalcular todos os acumulados sempre que um registro é criado ou editado.

---

## Gráfico de Linha — Curva S de Faturamento

### Especificações

- **Biblioteca:** Recharts (`LineChart`)
- **Tipo de dados plotados:** valores acumulados (curva S), não os valores mensais
- **Eixo X:** meses de referência, formato `MMM/yy` (ex: "Jan/26", "Fev/26")
- **Eixo Y:** valor em R$, formatado como `R$ X.XM` para milhões (ex: `R$ 1.5M`) ou `R$ X.XXXk` para milhares
- **Linhas plotadas:**

| Linha | Cor | Campo |
|---|---|---|
| Faturamento Previsto Acumulado | `#26405d` (azul escuro) | `faturamento_previsto_acumulado` |
| Faturamento Realizado Acumulado | `#c35e1e` (terracota) | `faturamento_realizado_acumulado` |

- **Tooltip:** ao passar o mouse, exibe nome da série + valor formatado em R$ (`R$ X.XXX.XXX,XX`)
- **Legenda:** exibida abaixo ou acima do gráfico com os nomes e cores das séries
- **Dimensões:** altura 350px, largura 100% (responsivo com `ResponsiveContainer`)
- **Pontos:** `dot={false}` — sem marcadores nos pontos para manter o visual limpo
- **Smooth curves:** `type="monotone"` para suavizar as curvas

### Container do Gráfico

- Card branco com sombra (`shadow-md`)
- Cabeçalho do card: ícone `DollarSign` em terracota + título "Curva de Faturamento Acumulado"
- Padding: `p-6`
- Margem inferior separando do card da tabela

---

## Tabela de Histórico de Faturamento

### Colunas

| Coluna | Formato | Alinhamento |
|---|---|---|
| **Mês** | `MMMM/yyyy` (ex: "janeiro/2026") | Esquerda |
| **Previsto Mensal (R$)** | `R$ X.XXX.XXX,XX` | Direita |
| **Realizado Mensal (R$)** | `R$ X.XXX.XXX,XX` | Direita |
| **Previsto Acumulado (R$)** | `R$ X.XXX.XXX,XX` | Direita |
| **Realizado Acumulado (R$)** | `R$ X.XXX.XXX,XX` | Direita |
| **Aderência (%)** | `XX.X%` (colorido semanticamente) | Centro |
| **Ações** | Botões ícone | Centro |

### Cálculo e Coloração da Aderência

```
Aderência = (Realizado Acumulado / Previsto Acumulado) × 100
```

| Faixa | Cor do Texto |
|---|---|
| ≥ 90% | Verde (`text-green-600`) |
| 70% a 89,9% | Amarelo (`text-yellow-600`) |
| < 70% | Vermelho (`text-red-600`) |

**Caso especial:** se `Previsto Acumulado = 0`, não divide por zero — exibe `—` ou `N/A`.

### Ordenação

- Padrão: por `mes_referencia` crescente (cronológica)
- Última linha (mês mais recente) não precisa de destaque especial

---

## Edição Inline de Registros

**Comportamento ao clicar em "Editar":**
1. A linha inteira da tabela transforma-se em modo de edição
2. Os campos de texto aparecem como `<input>` dentro das células
3. Colunas editáveis: Mês (`type="month"`), Previsto Mensal, Realizado Mensal
4. Colunas não editáveis (só leitura): Previsto Acumulado, Realizado Acumulado, Aderência — estas são recalculadas ao salvar
5. Botões inline na coluna de ações: **Salvar** (ícone disquete verde) e **Cancelar** (ícone X outline)

**Ao salvar:**
1. Valida que os valores são números positivos
2. Chama `base44.entities.Financeiro.update(id, { faturamento_previsto_mensal, faturamento_realizado_mensal, mes_referencia })`
3. Recalcula todos os acumulados do projeto e salva
4. Invalida a query para recarregar

---

## Adição de Novo Registro

**Comportamento ao clicar em "Adicionar":**
1. Insere uma **linha nova editável no topo** da tabela (antes dos dados existentes)
2. A linha tem fundo verde claro (`bg-green-50`) para se destacar
3. Campos editáveis: Mês (`type="month"`), Previsto Mensal, Realizado Mensal
4. Colunas de acumulado e aderência ficam com `—` até salvar
5. Botão "Salvar" confirma, botão X cancela e remove a linha inserida

**Validações:**
- Mês obrigatório
- Valores numéricos positivos (sem R$ — apenas o número)
- Mês não pode ser duplicado para o mesmo projeto

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Importar** | Cabeçalho da página | Outline (cinza) | Placeholder — importação de planilha (não implementado) |
| **Adicionar** | Cabeçalho da página | Verde | Insere linha editável no topo da tabela |
| **Salvar** (disquete) | Coluna de ações (modo edição) | Verde | Confirma criação ou edição e recalcula acumulados |
| **Cancelar** (X) | Coluna de ações (modo edição) | Outline | Descarta as alterações em andamento |
| **Editar** (lápis) | Coluna de ações (modo normal) | Cinza | Ativa modo de edição inline na linha |
| **Excluir** (lixeira) | Coluna de ações (modo normal) | Vermelho | Remove o registro com confirmação — recalcula os demais |

### Comportamento ao Excluir

1. Exibe confirmação: "Excluir o registro de [mês]? Os acumulados serão recalculados."
2. Se confirmado: exclui o registro e recalcula os acumulados de todos os registros posteriores

---

## Lógica de React Query

### Query

```javascript
useQuery({
  queryKey: ['financeiro', selectedProjectId],
  queryFn: () => base44.entities.Financeiro.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
  select: (data) => data.sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia))
})
```

### Mutação com Recálculo de Acumulados

```javascript
// Após criar ou editar um registro, recalcula todos os acumulados
const recalcularAcumulados = async (projectId) => {
  const registros = await base44.entities.Financeiro.list({ projeto_id: projectId });
  const ordenados = registros.sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia));
  
  let prevAcumulado = 0;
  let realAcumulado = 0;
  
  for (const reg of ordenados) {
    prevAcumulado += reg.faturamento_previsto_mensal;
    realAcumulado += reg.faturamento_realizado_mensal;
    await base44.entities.Financeiro.update(reg.id, {
      faturamento_previsto_acumulado: prevAcumulado,
      faturamento_realizado_acumulado: realAcumulado
    });
  }
};
```

---

## Formatação de Valores Monetários

- **Na tabela:** `R$ X.XXX.XXX,XX` (padrão BRL)
  - Usar `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)`
- **No gráfico (eixo Y):** valor compacto `R$ XM` ou `R$ X.XXXk`
  - Acima de 1.000.000: dividir por 1.000.000 e adicionar "M" (ex: `R$ 1.5M`)
  - Entre 1.000 e 999.999: dividir por 1.000 e adicionar "k" (ex: `R$ 250k`)
- **No input de edição:** apenas o número sem formatação (ex: `250000.50`)

---

## Design Detalhado

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [DollarSign] Controle Financeiro                      │
│ Faturamento previsto vs. realizado                   │
│                    [Importar] [Adicionar]             │
└──────────────────────────────────────────────────────┘
```

### Layout dos Cards

1. **Card do Gráfico** (topo)
2. **Card da Tabela** (abaixo)

Ambos: fundo branco, `shadow-md`, `rounded-xl`, `p-6`, margem `mb-6` entre eles.

### Linha de Novo Registro (tabela)

```
┌──────────────┬──────────────┬──────────────┬──────┬──────┬──────┬──────────┐
│ [2026-02] ▼  │ [125000.00]  │ [118500.00]  │  —   │  —   │  —   │ 💾  ✕   │
└──────────────┴──────────────┴──────────────┴──────┴──────┴──────┴──────────┘
  ↑ bg-green-50 (toda a linha)
```

### Linha em Modo de Edição (tabela)

```
┌──────────────┬──────────────┬──────────────┬────────────┬────────────┬──────┬──────────┐
│ [jan/2026] ▼ │ [125000.00]  │ [118500.00]  │ R$ 125k    │ R$ 118.5k  │ 94.8%│ 💾  ✕   │
└──────────────┴──────────────┴──────────────┴────────────┴────────────┴──────┴──────────┘
  ↑ fundo azul claro para indicar edição ativa
```

---

## Integração com Outros Módulos

- **Dashboard:** o último valor acumulado previsto e realizado é exibido no card de resumo financeiro
- **Gestão de Mudanças:** o `valor_contrato` do projeto serve como base para o Termômetro de Desvio. O módulo Financeiro mostra o faturamento realizado em relação ao planejado — não o valor das mudanças aprovadas.
- **Contratos/Medições:** o total pago em medições (contratos de subcontratados) é um dado separado do faturamento do contrato principal.

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `DollarSign` em cinza
- Título: "Nenhum Projeto Selecionado"
- Mensagem: "Selecione um projeto para controlar o faturamento."

**Com projeto mas sem dados:**
- Gráfico vazio (sem linhas)
- Tabela com header visível e mensagem central: "Nenhum dado de faturamento cadastrado"
- Botão "Adicionar Primeiro Registro" em destaque
