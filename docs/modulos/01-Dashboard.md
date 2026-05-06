# Módulo: Dashboard

## Visão Geral

O Dashboard é a **tela inicial do sistema após o login**. Ele apresenta um painel consolidado com resumo visual de todos os módulos do projeto selecionado. O objetivo é dar ao gestor uma visão rápida e integrada do estado atual do contrato em um único olhar — destacando pontos críticos, desvios e o status geral de cada área sem precisar navegar módulo a módulo.

A filosofia do Dashboard é **somente leitura**: não há formulários, modais ou ações de criação/edição nessa tela. Toda a interação é de navegação.

---

## Acesso

Rota: `/Dashboard`  
Menu lateral: item de topo (ícone `LayoutDashboard` ou equivalente)  
Após login bem-sucedido, o sistema redireciona automaticamente para esta rota.

---

## Pré-requisito Obrigatório

Para que o Dashboard funcione, o usuário **deve ter selecionado um projeto ativo** na barra lateral (dropdown de projetos). O identificador é armazenado em `localStorage` sob a chave `selectedProjectId`.

**Comportamento quando não há projeto selecionado:**
- O componente `ModulosResumo` não é renderizado
- Exibe um card de aviso com:
  - Ícone: `AlertCircle` em cor terracota (`#c35e1e`)
  - Título: "Nenhum Projeto Selecionado"
  - Mensagem: "Por favor, selecione um projeto na barra lateral para visualizar o dashboard."
  - Fundo: azul claro com borda azul (`bg-blue-50 border border-blue-200`)

---

## Componente Principal: `ModulosResumo`

O `ModulosResumo` é responsável por carregar e consolidar dados de **todas as entidades** do sistema para o projeto selecionado. Ele faz múltiplas chamadas simultâneas via React Query (queries paralelas), cada uma buscando dados de um módulo diferente.

### Estratégia de Carregamento

- Todas as queries rodam em paralelo com `useQuery` do React Query
- Enquanto os dados carregam, o componente exibe **skeletons de loading** nos cards
- Se uma query falhar, o card correspondente exibe um estado de erro sem bloquear os demais

---

## Conteúdo Exibido por Área

Cada área do sistema aparece como um **card de resumo** com métricas-chave. Abaixo o detalhamento de cada card:

### 1. Registros (Incidentes e RDOs)
- Total de registros do projeto
- Quantidade de RDOs registrados
- Quantidade "Em Análise"
- Quantidade "Associados a Pleito"
- Indicador visual: badge de alerta se houver itens em análise há mais de 7 dias

### 2. Pleitos
- Total de pleitos do projeto
- Por status: Aberto / Em Análise / Em Andamento / Resolvido / Fechado / Cancelado
- Destaque visual: contagem de pleitos com prioridade "Crítica"
- Link para navegar ao módulo de Pleitos

### 3. Planos de Ação (por Área)
- Resumo consolidado das ações de todas as 6 áreas (Engenharia, Suprimentos, Construção, Planejamento, Contratos, Qualidade/SSMA)
- Contagem por status: Iniciado / Em Andamento / Concluído
- Barra de progresso geral (% concluído do total)

### 4. Financeiro
- Último mês com dado registrado
- Faturamento Previsto Acumulado vs. Realizado Acumulado
- Índice de aderência financeira (%)
- Mini gráfico de linha (sparkline) se disponível

### 5. Histograma de Recursos
- Total de recursos cadastrados
- Mês de referência mais recente
- Aderência média de mobilização (Qtd Realizada / Qtd Prevista)

### 6. Avanço Físico
- Avanço Previsto Acumulado (%) vs. Realizado Acumulado (%)
- Desvio em pontos percentuais (positivo = adiantado, negativo = atrasado)
- Coloração do desvio: verde (adiantado ou em dia), vermelho (atrasado)

### 7. Gestão de Mudanças
- Total de mudanças registradas
- Mudanças aprovadas: impacto financeiro total (R$) e de prazo (dias)
- Mudanças pendentes (Em Análise + Em Negociação)
- Alertas: se houver mudanças com impacto financeiro > X% do contrato

### 8. Contratos (Subcontratados)
- Total contratado em R$ (soma de todos os contratos ativos)
- Total pago em medições (soma das medições com status "Paga")
- Medições pendentes de aprovação
- Contratos encerrados/cancelados

### 9. Suprimentos
- Requisições aprovadas vs. total
- Cotações abertas (aguardando análise)
- Total aprovado em compras (R$)
- Alertas de data de necessidade vencida

### 10. Cronograma
- Total de tarefas (excluindo tipo Resumo)
- Em Andamento / Concluídas / Atrasadas
- Percentual de conclusão geral
- Próxima tarefa crítica a vencer

### 11. Planejamento
- Número de atas registradas e aprovadas
- Lições aprendidas registradas
- PPC médio do 6WLA (se disponível)
- Itens do Take-Off em atraso

### 12. Gestão de Riscos
- Riscos ativos por nível: Críticos / Médios / Baixos
- Riscos em monitoramento
- Último risco identificado

### 13. Notificações (Ruídos)
- Total de ruídos identificados
- Em Análise / Promovidos a Pleito / Descartados
- Alertas: ruídos com probabilidade Alta ainda não promovidos ou descartados

---

## Design e Layout

### Grid de Cards
- **Desktop (≥ 1280px):** 3 colunas
- **Tablet (768px - 1279px):** 2 colunas
- **Mobile (< 768px):** 1 coluna
- Gap entre cards: `gap-6`

### Anatomia de um Card de Resumo
```
┌─────────────────────────────────┐
│ [Ícone] Título do Módulo        │  ← cabeçalho com cor da área
├─────────────────────────────────┤
│  Métrica 1    │  Métrica 2      │  ← valores principais
│  Métrica 3    │  Métrica 4      │
├─────────────────────────────────┤
│  [Link "Ver detalhes →"]        │  ← navegação
└─────────────────────────────────┘
```

### Paleta de Cores
| Cor | Hex | Uso |
|---|---|---|
| Azul Escuro (Primary) | `#26405d` | Títulos, cabeçalhos de cards |
| Terracota (Accent) | `#c35e1e` | Destaques negativos, alertas de custo |
| Verde-Água (Success) | `#00a49a` | Indicadores positivos |
| Vermelho (Error) | `#F44C41` | Alertas críticos |
| Cinza (Background) | `#f2f2f2` | Fundo geral |
| Branco | `#ffffff` | Fundo de cards |

### Tipografia
- **Fonte:** Montserrat (Google Fonts), aplicada globalmente via CSS
- **Títulos de módulo:** Montserrat 600 (Semi-Bold)
- **Valores numéricos:** Montserrat 700 (Bold), tamanho maior
- **Labels:** Montserrat 400 (Regular), tamanho menor, cor cinza

### Cards
- `border-radius: 8px` (arredondamento)
- `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` (sombra suave — `shadow-sm`)
- Fundo branco (`#ffffff`)
- Padding interno: `p-6`
- Hover: leve elevação de sombra

---

## Comportamento e Estado

### Ciclo de Vida
1. Componente monta → verifica `localStorage.getItem('selectedProjectId')`
2. Se `null` → renderiza card de aviso, não executa queries
3. Se presente → executa todas as queries paralelas
4. React Query gerencia cache com `staleTime` de 30 segundos
5. Ao trocar de projeto no dropdown da sidebar → `selectedProjectId` muda → queries são refeitas automaticamente

### Atualização Automática
- Não há polling automático (refresh em intervalo)
- Dados são atualizados quando o usuário navega de outro módulo de volta ao Dashboard (refetch on window focus ativado por padrão no React Query)

### Loading Skeleton
- Enquanto qualquer query está carregando, o card correspondente exibe um skeleton animado (pulsando) no lugar dos valores
- O skeleton tem o mesmo shape do card para evitar layout shift

### Navegação a partir do Dashboard
- Cada card possui um link "Ver detalhes →" que redireciona para a rota do módulo correspondente
- Exemplos: card de Pleitos → `/Pleitos`, card de Cronograma → `/Cronograma`

---

## Integração com Outros Módulos

O Dashboard não escreve dados em nenhuma entidade. Ele **apenas lê**. As entidades consultadas são:

| Entidade Backend | Módulo |
|---|---|
| `Incidente` | Registros |
| `Caso` | Pleitos |
| `Engenharia` (6 áreas) | Planos de Ação |
| `Financeiro` | Financeiro |
| `Histograma` | Histograma |
| `AvancoFisico` | Avanço Físico |
| `MudancaContratual` | Gestão de Mudanças |
| `Contrato` + `Medicao` | Contratos |
| `RequisicaoCompra` + `Cotacao` | Suprimentos |
| `TarefaCronograma` | Cronograma |
| `Ruido` | Notificações |

---

## Estado Vazio por Card

Quando o projeto está selecionado mas um módulo não possui dados cadastrados:
- O card exibe ícone cinza + texto "Nenhum dado cadastrado"
- Um botão "Adicionar primeiro registro" pode ser exibido com link para a rota do módulo
- O card não exibe erro — apenas estado vazio

---

## Considerações de Performance

- Usar `select` no `useQuery` para extrair apenas os campos necessários de cada entidade (evitar trazer todos os campos desnecessários para o Dashboard)
- Priorizar a renderização dos cards mais importantes (Pleitos, Financeiro, Avanço Físico) com maior staleTime para evitar refetches frequentes
- Cards de dados mais voláteis (Registros, Notificações) podem ter staleTime menor
