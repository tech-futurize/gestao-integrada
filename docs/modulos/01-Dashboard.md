# Módulo: Dashboard

## Visão Geral

O Dashboard é a **tela inicial após o login**. Exibe um painel consolidado de KPIs de todos os módulos ativos do projeto selecionado. A filosofia é **somente leitura** — não há formulários nem criação de dados nesta tela.

---

## Acesso

Rota: `/dashboard`
Menu lateral: item de topo (ícone `LayoutDashboard`)
Após login bem-sucedido, o sistema redireciona automaticamente para `/dashboard`.

---

## Pré-requisito

O usuário deve ter selecionado um projeto ativo. O ID é armazenado em `localStorage` sob a chave `selectedProjectId`, fornecido pelo `useProject()` de `src/lib/ProjectContext.jsx`.

**Sem projeto selecionado:** exibe card de aviso com ícone `AlertCircle`, mensagem orientando a selecionar um projeto na sidebar.

---

## Componente Principal: `ModulosResumo`

Localizado em `src/components/dashboard/ModulosResumo.jsx`. Executa múltiplas queries paralelas via React Query e renderiza os cards de resumo de cada módulo.

### Estratégia de Carregamento

- Queries paralelas com `useQuery` — `enabled: !!selectedProjectId`
- Skeletons animados enquanto carregam
- Falha em uma query não bloqueia os demais cards

---

## Cards de Resumo (por Módulo)

Cada card exibe métricas calculadas a partir dos dados reais do Supabase. Sem mock data.

### 1. Registros (Incidente)
- Total de registros do projeto
- RDOs registrados
- Em Análise (count)
- Associados a Pleito (count via `caso_id IS NOT NULL`)

### 2. Pleitos (Caso)
- Total de pleitos
- Abertos / Em Análise / Em Andamento
- Resolvidos

### 3. Gestão de Mudanças (MudancaContratual)
- Total de mudanças
- Impacto financeiro aprovado (Σ `impacto_custo` onde `status = "Aprovada"`)
- Adição vs. Redução de escopo (por `impacto_escopo_tipo`)
- Desvio de prazo aprovado (Σ `impacto_prazo_dias`)

### 4. Contratos + Medições
- Total contratado (Σ `valor_total` dos contratos)
- Pago em medições (Σ `valor_liquido` onde status = "Paga")
- Contratos ativos (count)
- Medições pendentes (Em Revisão + Em Aprovação)

### 5. Histograma (MO e Equipamentos)
- Total de recursos cadastrados
- Mês de referência mais recente
- Aderência média (Qtd Real / Qtd Prevista)

### 6. Avanço Físico (AvancoFisico)
- Avanço previsto acumulado (%) mais recente
- Avanço realizado acumulado (%)
- Desvio em pontos percentuais — verde se adiantado, vermelho se atrasado

### 7. Cronograma (TarefaCronograma)
- Total de tarefas (excluindo tipo "Resumo")
- Em Andamento / Concluídas / Atrasadas
- % conclusão geral

### 8. Suprimentos (ItemMAS)
- Total de itens no MAS
- Itens com data prevista vencida e sem entrega real

### 9. Gestão de Riscos (Risco)
- Riscos críticos (score ≥ 9)
- Riscos médios
- Em monitoramento

### 10. Planejamento / 6WLA (Item6WLA)
- Itens planejados vs. concluídos
- PPC médio (se disponível)

---

## Design e Layout

### Grid de Cards
- Desktop (≥ 1280px): 3 colunas
- Tablet (768–1279px): 2 colunas
- Mobile (< 768px): 1 coluna
- Gap: `gap-6`

### Anatomia de um Card

```
┌──────────────────────────────────┐
│ [Ícone] Título do Módulo         │  ← cabeçalho com cor da área
├──────────────────────────────────┤
│  Métrica 1     │  Métrica 2      │
│  Métrica 3     │  Métrica 4      │
├──────────────────────────────────┤
│  [Ver detalhes →]                │
└──────────────────────────────────┘
```

Cada card tem link "Ver detalhes →" que navega para a rota do módulo correspondente.

### Paleta de Cores

| Cor | Hex | Uso |
|---|---|---|
| Azul Escuro (Primary) | `#26405d` | Títulos, headers de cards |
| Terracota (Accent) | `#c35e1e` | Destaques negativos, alertas |
| Verde-Água (Success) | `#00a49a` | Indicadores positivos |
| Vermelho (Error) | `#F44C41` | Alertas críticos |
| Cinza (Background) | `#f2f2f2` | Fundo geral |
| Branco | `#ffffff` | Fundo de cards |

### Cards
- `rounded-lg`, `shadow-sm`, fundo branco, `p-6`
- Hover: `hover:shadow-md` com transição suave

---

## Comportamento e Estado

### Ciclo de Vida
1. Componente monta → lê `selectedProjectId` do `ProjectContext`
2. Se nulo → exibe aviso, não executa queries
3. Se presente → dispara todas as queries em paralelo
4. Troca de projeto → queries são invalidadas e refeitas automaticamente

### Atualização
- Sem polling automático
- Refetch on window focus ativado por padrão no React Query
- `staleTime` de 30s nas queries do dashboard

### Estado Vazio por Card
- Card exibe ícone cinza + "Nenhum dado cadastrado"
- Link para adicionar o primeiro registro no módulo correspondente

---

## Entidades Consultadas

| Entidade | Módulo |
|---|---|
| `Incidente` | Registros |
| `Caso` | Pleitos |
| `MudancaContratual` | Gestão de Mudanças |
| `Contrato` + `Medicao` | Contratos |
| `Histograma` | Histograma |
| `AvancoFisico` | Avanço Físico |
| `TarefaCronograma` | Cronograma |
| `ItemMAS` | Suprimentos |
| `Risco` | Gestão de Riscos |
| `Item6WLA` | Planejamento 6WLA |

O Dashboard **não escreve dados** em nenhuma entidade.
