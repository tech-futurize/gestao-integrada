# Módulo: Suprimentos (Requisições e Cotações)

## Visão Geral

O módulo de Suprimentos gerencia o **processo de compras do projeto**, desde a solicitação formal de materiais e serviços até a análise comparativa de propostas e aprovação do fornecedor vencedor.

**Fluxo do processo de compras:**
```
Necessidade identificada
    ↓
Requisição de Compra (RC) criada e aprovada
    ↓
Cotação aberta com múltiplas propostas de fornecedores
    ↓
Análise comparativa (Mapa de Análise)
    ↓
Fornecedor selecionado + Cotação aprovada
```

---

## Acesso

Rota: `/Suprimentos`  
Menu lateral: **"Suprimentos"** (ícone `ShoppingCart`)

---

## Entidades de Dados

### RequisicaoCompra (Requisição de Compra)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `numero` | string | Sim | Número da requisição (ex: "RC-001", "RC-042") |
| `solicitante` | string | Sim | Nome de quem solicitou a compra |
| `data_necessidade` | date | Não | Data limite em que o item é necessário no projeto |
| `centro_custo` | string | Não | Centro de custo, local ou área de destino |
| `justificativa` | string | Não | Motivo e contexto da solicitação |
| `status` | string (enum) | Sim | Rascunho, Aprovada, Em Cotação, Pedido Emitido, Recebido, Cancelada |
| `itens` | array de objetos | Não | Lista de itens: `{ descricao: string, quantidade: number, unidade: string }` |
| `projeto_id` | string (FK) | Sim | Projeto vinculado |

### Cotacao (Cotação)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `numero` | string | Sim | Número da cotação (ex: "COT-001") |
| `titulo` | string | Sim | Título descritivo do que está sendo cotado |
| `requisicao_id` | string (FK) | Não | Requisição vinculada (opcional — nem toda cotação tem RC) |
| `data_limite` | date | Não | Prazo máximo para recebimento de propostas dos fornecedores |
| `status` | string (enum) | Sim | Aberta, Em Análise, Aprovada, Cancelada |
| `propostas` | array de objetos | Não | Lista de propostas (ver estrutura abaixo) |
| `fornecedor_selecionado` | string | Não | Nome do fornecedor escolhido |
| `valor_aprovado` | number | Não | Valor final aprovado para compra (R$) |
| `parecer` | string | Não | Justificativa técnica/comercial da escolha |
| `aprovador` | string | Não | Nome do aprovador da cotação |
| `projeto_id` | string (FK) | Sim | Projeto vinculado |

**Estrutura de uma proposta (dentro do array `propostas`):**

```json
{
  "fornecedor": "string",
  "valor_total": number,
  "prazo_entrega": "string",
  "condicao_pagamento": "string",
  "observacoes": "string"
}
```

---

## KPIs do Módulo

Quatro cards no topo da página:

| KPI | Cálculo | Ícone |
|---|---|---|
| **Requisições Aprovadas** | `COUNT(*)` das RCs com `status = "Aprovada"` | `CheckSquare` |
| **Em Cotação** | `COUNT(*)` das RCs com `status = "Em Cotação"` | `Search` |
| **Cotações Abertas** | `COUNT(*)` das cotações com `status IN ["Aberta", "Em Análise"]` | `FileSearch` |
| **Total Aprovado** | Soma de `valor_aprovado` das cotações com `status = "Aprovada"` | `DollarSign` |

---

## Funcionalidades

O módulo é organizado em **3 abas**:

---

### Aba 1: Requisições

#### Lista de Requisições (`RequisicoesList`)

Pode ser exibida como tabela ou cards. Informações por requisição:
- Número (fonte mono)
- Solicitante
- Data de necessidade (destaque visual se data já passou e status não é "Recebido")
- Centro de custo
- Número de itens (ex: "3 itens")
- Status (badge colorido)
- Ações

#### Formulário de Requisição (`RequisicaoForm`)

**Tipo:** modal flutuante com overlay escuro, máximo `90vh`, scroll interno.

**Campos do cabeçalho:**

| Campo | Componente | Validação |
|---|---|---|
| Número | Input texto | Obrigatório (ex: "RC-001") |
| Status | Select | Obrigatório (padrão: "Rascunho") |
| Solicitante | Input texto | Obrigatório |
| Data de Necessidade | Input date | Opcional |
| Centro de Custo / Local | Input texto | Opcional |
| Justificativa | Textarea (3 linhas) | Opcional |

**Seção "Itens da Requisição" (tabela dinâmica):**

- Cabeçalho da seção com título "Itens" + botão "+ Item" (outline)
- Tabela com colunas: Descrição (2 cols), Quantidade, Unidade, Ação
- Por linha:
  - **Descrição:** input texto (placeholder: "Descreva o item...")
  - **Quantidade:** input número (min: 0.01)
  - **Unidade:** input texto (placeholder: "un", sugestões: un, m, m², m³, kg, ton, l)
  - **Excluir:** ícone lixeira vermelho
- **Estado vazio da tabela:** texto centralizado "Nenhum item. Clique em '+ Item' para adicionar."
- **Nota:** os itens são salvos como array JSON no campo `itens` da entidade

---

### Aba 2: Cotações

#### Lista de Cotações (`CotacoesList`)

Tabela ou cards com: Número, Título, Requisição vinculada, Data limite, Fornecedor selecionado, Valor aprovado, Status, Ações.

**Destaque:** cotações com `data_limite` vencida e `status = "Aberta"` recebem um indicador visual de urgência.

#### Formulário de Cotação (`CotacaoForm`)

**Tipo:** modal flutuante, **largura maior** (`max-w-2xl`) para acomodar a tabela de propostas.

**Campos do cabeçalho:**

| Campo | Componente | Validação |
|---|---|---|
| Número | Input texto | Obrigatório (ex: "COT-001") |
| Status | Select | Obrigatório (padrão: "Aberta") |
| Título | Input texto | Obrigatório |
| Requisição Vinculada | Select (lista de RCs do projeto) | Opcional |
| Data Limite | Input date | Opcional |

**Seção "Propostas dos Fornecedores" (tabela dinâmica):**

- Botão "+ Proposta" para adicionar nova proposta
- Por proposta (linha expandida ou card):
  - **Fornecedor:** input texto (obrigatório por proposta)
  - **Valor Total (R$):** input número
  - **Prazo de Entrega:** input texto (ex: "15 dias úteis")
  - **Condição de Pagamento:** input texto (ex: "30/60/90 dias")
  - **Observações:** input texto
  - **Excluir proposta:** botão X ou lixeira
- **Destaque automático de menor preço:**
  - A proposta com menor `valor_total` recebe badge "⭐ Menor preço" com fundo verde e borda verde
  - O destaque é atualizado em tempo real conforme os valores são digitados
  - Se duas propostas têm o mesmo valor mínimo, ambas recebem o badge

**Seção "Aprovação":**

| Campo | Componente | Descrição |
|---|---|---|
| Fornecedor Selecionado | Input texto | Nome do fornecedor escolhido |
| Valor Aprovado (R$) | Input número | Valor final negociado (pode diferir do proposto) |
| Parecer Comercial | Textarea (3 linhas) | Justificativa técnica e comercial da escolha |
| Aprovador | Input texto | Quem aprovou a compra |

---

### Aba 3: Mapa de Análise (`MapaAnalise`)

O Mapa de Análise é uma **visualização somente leitura** que exibe uma tabela comparativa para cada cotação que possui propostas cadastradas.

**Comportamento:**
- Não exibe cotações sem propostas
- Não tem formulários — apenas visualização
- Atualizado automaticamente quando as cotações são editadas nas abas anteriores

**Por cotação exibida:**

**Cabeçalho da cotação:**
- Número + Título + Badge de status

**Tabela comparativa de propostas:**

| Coluna | Descrição |
|---|---|
| **Fornecedor** | Nome + badge "Selecionado" se for o escolhido |
| **Valor Total** | R$ formatado |
| **Prazo** | Texto do prazo de entrega |
| **Condição de Pagamento** | Texto |
| **Comparativo** | Barra de progresso visual |
| **Observações** | Texto |

**Lógica da barra de comparativo:**
- Cálculo: `(valor_total / max(valor_total)) × 100`
- A proposta mais cara ocupa 100% da barra
- As demais são proporcionais
- Cor da barra:
  - Menor preço: verde (`bg-emerald-500`)
  - Demais: terracota (`bg-[#c35e1e]`)
- A largura da barra é proporcional ao valor

**Linha do fornecedor selecionado:**
- Fundo verde claro: `bg-emerald-50`
- Badge "Selecionado" na coluna do fornecedor
- Badge "⭐ Menor" se também for o menor preço

**Seção "Parecer Comercial"** (ao final de cada cotação):
- Fundo âmbar: `bg-amber-50 border border-amber-200`
- Exibe: Aprovador + Valor Aprovado + texto do Parecer

---

## Fluxo de Status de Requisições

```
Rascunho → Aprovada → Em Cotação → Pedido Emitido → Recebido
                                                    ↓
                                                 Cancelada
```

## Fluxo de Status de Cotações

```
Aberta → Em Análise → Aprovada
                    ↓
                 Cancelada
```

---

## Cores de Status

### Requisições

| Status | Cor |
|---|---|
| Rascunho | Cinza |
| Aprovada | Verde |
| Em Cotação | Azul |
| Pedido Emitido | Índigo |
| Recebido | Verde escuro |
| Cancelada | Vermelho |

### Cotações

| Status | Cor |
|---|---|
| Aberta | Azul |
| Em Análise | Amarelo |
| Aprovada | Verde |
| Cancelada | Vermelho |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Nova Requisição** | Cabeçalho (aba RCs) | Terracota | Abre modal de requisição vazio |
| **Nova Cotação** | Cabeçalho (aba Cotações) | Terracota | Abre modal de cotação vazio |
| **+ Item** | Modal de requisição | Outline | Adiciona linha na tabela de itens |
| **+ Proposta** | Modal de cotação | Outline | Adiciona proposta na seção de propostas |
| **Criar Requisição** | Rodapé do modal | Terracota | Salva nova requisição |
| **Atualizar** | Rodapé do modal (edição) | Terracota | Salva edição |
| **Cancelar** | Rodapé do modal | Outline | Fecha o modal sem salvar |
| **Editar** (lápis) | Lista | Outline | Abre modal preenchido |
| **Excluir** (lixeira) | Lista | Vermelho | Remove com confirmação |

---

## Lógica de React Query

### Queries

```javascript
// Requisições do projeto
useQuery({
  queryKey: ['requisicoes', selectedProjectId],
  queryFn: () => base44.entities.RequisicaoCompra.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Cotações do projeto
useQuery({
  queryKey: ['cotacoes', selectedProjectId],
  queryFn: () => base44.entities.Cotacao.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

### Mutações

- **Criar RC:** `base44.entities.RequisicaoCompra.create(data)` → invalida `['requisicoes']`
- **Criar Cotação:** `base44.entities.Cotacao.create(data)` → invalida `['cotacoes']`
- **Editar:** `.update(id, data)` → invalida a query correspondente
- **Excluir:** `.delete(id)` → invalida a query correspondente

---

## Design e Layout

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [ShoppingCart] Suprimentos                            │
│ Requisições de compra e análise de cotações          │
├──────────────────────────────────────────────────────┤
│ [KPI 1]    [KPI 2]    [KPI 3]    [KPI 4]             │
└──────────────────────────────────────────────────────┘

[Requisições] [Cotações] [Mapa de Análise]  ← abas
```

### Modal de Cotação (mais largo)
- `max-w-2xl` (768px)
- Seção de propostas com scroll horizontal se necessário
- Propostas com card individual para melhor legibilidade

---

## Integração com Outros Módulos

- **Contratos:** uma cotação aprovada pode originar a criação de um contrato de subcontratado
- **Dashboard:** KPIs de suprimentos aparecem no card de resumo
- **Financeiro:** o total aprovado em cotações pode ser mapeado contra o orçamento de compras do projeto

---

## Estado Vazio

**Sem projeto:**
- Ícone `ShoppingCart` em cinza
- Título: "Nenhum Projeto Selecionado"

**Aba Requisições sem dados:**
- Mensagem "Nenhuma requisição de compra cadastrada"

**Aba Cotações sem dados:**
- Mensagem "Nenhuma cotação cadastrada"

**Mapa de Análise sem cotações com propostas:**
- Ícone `BarChart2` em cinza
- Mensagem: "Nenhuma cotação com propostas encontrada. Adicione propostas nas cotações para visualizar o mapa comparativo."
