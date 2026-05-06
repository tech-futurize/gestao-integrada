# Módulo: Contratos (Subcontratados e Medições)

## Visão Geral

O módulo de Contratos gerencia os **contratos de terceiros/subcontratados** do projeto — fornecedores de serviços, empreiteiros especializados e prestadores. Inclui o registro completo de cada contrato e o **fluxo de medições de pagamento**, que é o processo pelo qual os serviços são medidos, aprovados e pagos.

**Diferença importante:** este módulo trata dos contratos que a **empresa contratada** (usuária do sistema) firma com seus **subcontratados** — não o contrato principal com o cliente. O contrato principal está em "Gerenciar Projeto".

---

## Acesso

Rota: `/Contratos`  
Menu lateral: **"Contratos"** (ícone `ScrollText`)

---

## Entidades de Dados

### Contrato

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `numero` | string | Sim | Número identificador do contrato (ex: "CONT-2026-001") |
| `objeto` | string | Sim | Objeto e escopo do contrato — o que está sendo contratado |
| `fornecedor` | string | Sim | Razão social do fornecedor/subcontratado |
| `cnpj` | string | Não | CNPJ do fornecedor (formato: "XX.XXX.XXX/XXXX-XX") |
| `tipo` | string | Não | Tipo do contrato (ex: Empreitada, Fornecimento, Serviço, Consultoria) |
| `status` | string (enum) | Sim | Ativo, Em Revisão, Suspenso, Encerrado, Cancelado |
| `valor_total` | number | Sim | Valor total do contrato em R$ |
| `data_inicio` | date | Não | Data de início da vigência do contrato |
| `data_fim` | date | Não | Data de término prevista |
| `gestor` | string | Não | Nome do gestor responsável pelo acompanhamento |
| `projeto_id` | string (FK) | Sim | Projeto ao qual o contrato pertence |

### Medicao (Medição de Pagamento)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `numero` | string | Sim | Número da medição (ex: "MED-001") |
| `contrato_id` | string (FK) | Sim | Contrato ao qual a medição pertence |
| `periodo_inicio` | date | Não | Data de início do período medido |
| `periodo_fim` | date | Não | Data de encerramento do período medido |
| `valor_bruto` | number | Não | Valor total dos serviços medidos antes de retenções |
| `valor_retencao` | number | Não | Retenções aplicadas (ex: garantia, INSS, glosas) em R$ |
| `valor_liquido` | number | Calculado | `valor_bruto - valor_retencao` — valor a ser efetivamente pago |
| `status` | string (enum) | Não | Elaboração, Em Revisão, Em Aprovação, Aprovada, Paga, Rejeitada (padrão: "Elaboração") |
| `elaborador` | string | Não | Nome do responsável pela elaboração da medição |
| `observacoes` | string | Não | Observações sobre a medição, pendências, glosas |
| `itens` | array de objetos | Não | Itens medidos: `{ descricao, unidade, quantidade, preco_unitario, valor_total }` |

**Cálculo do Valor Líquido:**
```
valor_liquido = valor_bruto - valor_retencao
```
Calculado automaticamente ao salvar. Se `valor_retencao` não informado, assume `0`.

**Cálculo do `valor_total` por item:**
```
item.valor_total = item.quantidade × item.preco_unitario
```
Calculado automaticamente ao preencher quantidade e preço unitário.

---

## KPIs do Módulo

Quatro cards no topo da página, calculados sobre os dados do projeto selecionado:

| KPI | Cálculo | Ícone | Cor |
|---|---|---|---|
| **Total Contratado** | Soma de `valor_total` de todos os contratos (todos os status) | `ScrollText` | Azul |
| **Pago em Medições** | Soma de `valor_liquido` onde `status = "Paga"` | `CheckCircle` | Verde |
| **Contratos Ativos** | `COUNT(*)` onde `status = "Ativo"` | `FileCheck` | Terracota |
| **Medições Pendentes** | `COUNT(*)` das medições onde `status IN ["Em Revisão", "Em Aprovação"]` | `Clock` | Amarelo |

---

## Funcionalidades

O módulo é organizado em **2 abas**:

---

### Aba 1: Contratos

#### Lista de Contratos (`ContratosList`)

Exibe os contratos como **cards** (não tabela) para melhor visualização:

```
┌─────────────────────────────────────────────────────┐
│ CONT-2026-001                [Ativo ▸]  [Empreitada] │
│ Montagem estrutural do Módulo A                      │
├─────────────────────────────────────────────────────┤
│ Construtora XYZ Ltda                                │
│ CNPJ: 12.345.678/0001-99                            │
│                                 R$ 2.450.000,00     │
│ Início: 01/01/2026  →  Fim: 30/06/2026              │
│ Gestor: Carlos Mendes                               │
├─────────────────────────────────────────────────────┤
│              [👁 Ver Detalhes]  [✏️]  [🗑️]          │
└─────────────────────────────────────────────────────┘
```

**Elementos de cada card:**
- **Número do contrato:** fonte mono (`font-mono`), destaque
- **Badge de status:** colorido (ver seção Cores de Status)
- **Badge de tipo:** borda outline sem fill
- **Objeto:** texto do escopo (sem truncamento ou truncado em 2 linhas)
- **Fornecedor e CNPJ:** em linha menor
- **Valor total:** destaque em terracota (`text-[#c35e1e] font-bold text-xl`)
- **Período:** início → fim formatados como `dd/MM/yyyy`
- **Gestor:** nome do responsável
- **Botões:** Ver Detalhes (ícone olho), Editar (ícone lápis), Excluir (ícone lixeira)
- **Hover:** `hover:shadow-lg` com transição suave

#### Tela de Detalhe do Contrato (`ContratoDetalhes`)

Ao clicar em "Ver Detalhes", navega para uma tela dedicada:

**Conteúdo:**
1. **Cabeçalho:** número do contrato + badges + botões Editar / Voltar
2. **Card de informações:** todos os campos do contrato em layout 2 colunas
3. **Seção de Medições:** lista de medições vinculadas ao contrato
4. **Botão "Nova Medição":** cria medição já pré-associada ao contrato corrente

**Tabela de medições na tela de detalhe:**
- Número, Período, Valor Bruto, Retenção, Valor Líquido, Status, Ações

#### Formulário de Contrato (`ContratoForm`)

**Tipo:** modal flutuante com overlay escuro.

**Campos:**

| Campo | Componente | Validação |
|---|---|---|
| Número | Input texto | Obrigatório |
| Objeto/Escopo | Textarea (3 linhas) | Obrigatório |
| Fornecedor | Input texto | Obrigatório |
| CNPJ | Input texto | Opcional, máscara `XX.XXX.XXX/XXXX-XX` |
| Tipo | Input texto | Opcional (sem enum fixo) |
| Status | Select | Obrigatório (padrão: "Ativo") |
| Valor Total (R$) | Input número | Obrigatório |
| Data Início | Input date | Opcional |
| Data Fim | Input date | Opcional |
| Gestor | Input texto | Opcional |

---

### Aba 2: Medições

#### Lista de Medições (`MedicoesList`)

**Tabela** com as colunas:

| Coluna | Formato | Descrição |
|---|---|---|
| **Número** | texto | Identificador da medição |
| **Contrato** | texto | Número do contrato vinculado |
| **Período** | `dd/MM/yy – dd/MM/yy` | Período medido |
| **Valor Bruto** | `R$ X.XXX.XXX,XX` | Valor total medido |
| **Retenção** | `R$ X.XXX,XX` | Retenções aplicadas |
| **Valor Líquido** | `R$ X.XXX.XXX,XX` (destaque) | Valor a pagar |
| **Status** | Badge colorido | Status atual |
| **Ações** | Ícones | Editar, Excluir, Avançar Status |

**Botão de avanço de status:** ícone de seta na coluna de ações. Ao clicar, avança para o próximo status da sequência com um clique direto.

#### Formulário de Medição (`MedicaoForm`)

**Tipo:** modal flutuante.

**Campos:**

| Campo | Componente | Validação |
|---|---|---|
| Número | Input texto | Obrigatório (ex: "MED-003") |
| Contrato | Select (lista de contratos do projeto) | Obrigatório — pré-selecionado se criado via detalhe |
| Período Início | Input date | Opcional |
| Período Fim | Input date | Opcional |
| Valor Bruto (R$) | Input número | Opcional |
| Retenção (R$) | Input número | Opcional (padrão: 0) |
| Valor Líquido (R$) | Input número | Calculado automaticamente, mas editável |
| Status | Select | Obrigatório (padrão: "Elaboração") |
| Elaborador | Input texto | Opcional |
| Observações | Textarea (3 linhas) | Opcional |

**Cálculo automático do Valor Líquido:**
- Ao alterar Valor Bruto ou Retenção, o Valor Líquido é recalculado em tempo real
- O campo Valor Líquido fica editável mas com label "Calculado automaticamente"

---

## Fluxo de Status de Medições

```
Elaboração
    ↓
Em Revisão
    ↓
Em Aprovação
    ↓           ↓
 Aprovada    Rejeitada
    ↓
  Paga
```

**Comportamento:**
- "Rejeitada" pode ser aplicada a partir de qualquer estágio
- Medição "Paga" contribui para o KPI "Pago em Medições"
- Medições "Rejeitadas" não contam para nenhum KPI de pagamento

---

## Cores de Status

### Contratos

| Status | Cor do Badge |
|---|---|
| Ativo | Verde (`bg-green-100 text-green-800`) |
| Em Revisão | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Suspenso | Laranja (`bg-orange-100 text-orange-800`) |
| Encerrado | Cinza (`bg-gray-100 text-gray-600`) |
| Cancelado | Vermelho (`bg-red-100 text-red-700`) |

### Medições

| Status | Cor do Badge |
|---|---|
| Elaboração | Cinza (`bg-gray-100 text-gray-600`) |
| Em Revisão | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Em Aprovação | Azul (`bg-blue-100 text-blue-800`) |
| Aprovada | Verde claro (`bg-emerald-100 text-emerald-800`) |
| Paga | Verde escuro (`bg-green-200 text-green-900`) |
| Rejeitada | Vermelho (`bg-red-100 text-red-700`) |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Novo Contrato** | Cabeçalho (aba Contratos) | Terracota | Abre modal de criação de contrato |
| **Nova Medição** | Cabeçalho (aba Medições) | Terracota | Abre modal de criação de medição |
| **Ver Detalhes** (olho) | Card de contrato | Outline | Navega para `ContratoDetalhes` |
| **Editar** (lápis) | Card / tabela | Outline | Abre modal preenchido |
| **Excluir** (lixeira) | Card / tabela | Vermelho | Remove com confirmação |
| **Voltar** | Tela de detalhe | Outline | Retorna à lista de contratos |
| **Nova Medição** | Tela de detalhe | Terracota | Cria medição pré-associada ao contrato |
| **Avançar Status** (seta) | Tabela de medições | Outline | Muda para o próximo status |
| **Criar / Atualizar** | Rodapé do modal | Terracota | Salva o contrato ou medição |
| **Cancelar** | Rodapé do modal | Outline | Fecha o modal |

---

## Lógica de React Query

### Queries

```javascript
// Contratos do projeto
useQuery({
  queryKey: ['contratos', selectedProjectId],
  queryFn: () => base44.entities.Contrato.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Medições do projeto
useQuery({
  queryKey: ['medicoes', selectedProjectId],
  queryFn: () => base44.entities.Medicao.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

### Mutações

- **Criar Contrato:** `base44.entities.Contrato.create(data)` → invalida `['contratos']`
- **Atualizar Status de Medição:** `base44.entities.Medicao.update(id, { status: proximoStatus })` → invalida `['medicoes']`
- **Criar Medição:** `base44.entities.Medicao.create(data)` → invalida `['medicoes']`

---

## Design e Layout

### Cabeçalho da Página
```
┌──────────────────────────────────────────────────────┐
│ [ScrollText] Contratos e Medições                     │
│ Gestão de subcontratados e pagamentos                │
├──────────────────────────────────────────────────────┤
│ [KPI 1]    [KPI 2]    [KPI 3]    [KPI 4]             │
└──────────────────────────────────────────────────────┘

[Contratos] [Medições]  ← abas
```

### Grid de Contratos
- **Desktop (≥1280px):** 2 colunas
- **Mobile:** 1 coluna
- Gap entre cards: `gap-6`

### Modal de Formulário
- Overlay escuro semitransparente
- Card branco centralizado
- Máximo de altura: `90vh` com scroll interno
- Largura: `max-w-xl` para contratos, `max-w-xl` para medições

---

## Integração com Outros Módulos

- **Dashboard:** os KPIs de contratos (total contratado, pago, ativos, pendentes) aparecem no card de resumo
- **Financeiro:** o total pago em medições pode ser comparado com o faturamento realizado do projeto principal
- **Suprimentos:** as compras aprovadas podem originar contratos de fornecimento

---

## Estado Vazio

**Sem projeto:**
- Ícone `ScrollText` em cinza
- Título: "Nenhum Projeto Selecionado"

**Com projeto sem contratos:**
- Grid vazio com mensagem "Nenhum contrato cadastrado"
- Botão "Novo Contrato" em destaque

**Com projeto sem medições:**
- Tabela com header e mensagem "Nenhuma medição cadastrada"
