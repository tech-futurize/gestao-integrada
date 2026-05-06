# Módulo: Planos de Ação (por Área)

## Visão Geral

O módulo de Planos de Ação registra e acompanha **ações corretivas e preventivas organizadas por área de gestão do projeto**. Ele oferece uma visão transversal das ações em andamento em cada disciplina, independentemente de estarem vinculadas a pleitos específicos.

**Diferença em relação ao Plano de Ação de Pleitos:**
- O Plano de Ação dentro de um Pleito (`/Pleitos → detalhe → PlanoAcao`) usa a entidade `Acao` e é específico para resolução de uma disputa contratual.
- Este módulo (`/PlanosDeAcao`) usa a entidade `Engenharia` e serve para registrar ações operacionais por área (engenharia, suprimentos, construção, etc.), com foco em gestão interna do projeto.

---

## Acesso

Rota: `/PlanosDeAcao`  
Menu lateral: **"Planos de Ação"** (ícone `Settings`)

---

## Entidade de Dados

**Engenharia** — a entidade é usada para todas as 6 áreas, diferenciadas pelo campo `nome`:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto ao qual a ação pertence |
| `nome` | string (enum) | Sim | Identificador da área: "Mobilização", "Produção", "Qualidade", "Segurança", "Suprimentos", "Planejamento" |
| `descricao_acao` | string | Sim | Descrição detalhada e objetiva da ação a ser executada |
| `responsavel` | string | Não | Nome ou cargo do responsável pela execução |
| `finalidade` | string | Não | Objetivo ou propósito da ação — o "por quê" de ser executada |
| `status` | string (enum) | Não | Funcionando, Não Implementado, Necessário Melhorias, Em Implantação, Com Atrasos (padrão: "Não Implementado") |

---

## Estrutura de Abas

O módulo é dividido em **6 abas**, cada uma representando uma área de gestão do projeto:

| Nº | Aba | Descrição |
|---|---|---|
| 1 | **Mobilização** | Ações de mobilização de pessoal, equipamentos e infraestrutura inicial |
| 2 | **Produção** | Ações de campo, execução e controle de produção |
| 3 | **Qualidade** | Ações de controle e garantia da qualidade executiva |
| 4 | **Segurança** | Ações de segurança do trabalho, saúde e meio ambiente |
| 5 | **Suprimentos** | Ações de compras, follow-up de fornecedores, problemas de entrega |
| 6 | **Planejamento** | Ações de cronograma, desvios de prazo, replanning |

**Comportamento das abas:**
- Ao trocar de aba, a query é refeita filtrando por `nome = [nome_da_area]`
- Cada aba mantém seu próprio estado de formulário (abrir/fechar, dados em edição)
- A aba ativa é destacada com fundo índigo/azul e texto branco

---

## KPIs por Área

Cada aba exibe **3 cards de KPI** no topo, com contagem de ações por status para aquela área específica:

| Card | Filtro | Cor da Borda |
|---|---|---|
| **Funcionando** | `status = "Funcionando"` | Verde (`border-green-500`) |
| **Em Implantação** | `status = "Em Implantação"` | Azul (`border-blue-400`) |
| **Não Implementado** | `status = "Não Implementado"` | Cinza (`border-gray-300`) |
| **Necessário Melhorias** | `status = "Necessário Melhorias"` | Amarelo (`border-yellow-400`) |
| **Com Atrasos** | `status = "Com Atrasos"` | Vermelho (`border-red-400`) |

Cada KPI card exibe:
- Número grande em destaque
- Label do status abaixo
- Ícone representativo à esquerda

---

## Funcionalidades

### Listagem de Ações por Área

**Tabela** com as colunas:
- **Descrição:** texto da ação (truncado em 2 linhas, tooltip completo no hover)
- **Responsável:** nome do responsável
- **Finalidade:** texto resumido (truncado, tooltip completo)
- **Status:** badge colorido
- **Ações:** botões Editar (lápis) e Excluir (lixeira)

**Comportamento:**
- Ordenação padrão: por criação (mais recentes primeiro)
- Quando a área não tem ações: mensagem "Nenhuma ação registrada para [Área]" centralizada

### Formulário de Ação (inline no card da área)

**Comportamento:**
- Aparece **acima da tabela** quando o usuário clica em "Nova Ação"
- Não é modal flutuante — fica embutido na página dentro do card da área
- Fundo levemente destacado (`bg-gray-50`) com borda arredondada e padding interno (`rounded-lg border p-4`)
- Fecha ao clicar em "Cancelar" ou após salvar com sucesso

**Campos do formulário:**

| Campo | Componente | Validação | Notas |
|---|---|---|---|
| Descrição da Ação | Textarea (3 linhas) | Obrigatório | Placeholder: "Descreva a ação a ser executada..." |
| Responsável | Input texto | Obrigatório | Placeholder: "Nome ou cargo do responsável" |
| Status | Select | Obrigatório | Padrão: "Não Implementado" |
| Finalidade | Textarea (2 linhas) | Opcional | Placeholder: "Qual o objetivo desta ação?" |

**Comportamento ao editar:**
- O formulário é preenchido com os dados da ação selecionada
- O botão de salvar muda para "Atualizar"
- A linha editada na tabela fica destacada (por ex: fundo azul claro)

---

## Componente `EngenhariaPanel`

Cada aba renderiza o componente `EngenhariaPanel` passando como prop o nome da área. O componente:

1. Recebe `areaName` (string): "Engenharia", "Suprimentos", etc.
2. Executa query filtrando por `{ nome: areaName, projeto_id: selectedProjectId }`
3. Calcula os KPIs localmente a partir dos dados retornados
4. Exibe KPIs + formulário (se aberto) + tabela de ações

### Props do EngenhariaPanel

```typescript
interface EngenhariaPanelProps {
  areaName: string;           // "Engenharia" | "Suprimentos" | etc.
  selectedProjectId: string;  // ID do projeto ativo
}
```

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Nova Ação** | Cabeçalho do card da área | Verde (`bg-green-600`) | Exibe o formulário inline acima da tabela |
| **Salvar** | Rodapé do formulário inline | Verde | Persiste criação ou edição |
| **Cancelar** | Rodapé do formulário inline | Outline | Fecha o formulário sem salvar |
| **Editar** (lápis) | Coluna de ações na tabela | Cinza/outline | Preenche o formulário com dados da ação |
| **Excluir** (lixeira) | Coluna de ações na tabela | Vermelho | Remove permanentemente com confirmação |

---

## Cores de Status

| Status | Cor do Badge |
|---|---|
| Funcionando | Verde (`bg-green-100 text-green-700`) |
| Não Implementado | Cinza (`bg-gray-100 text-gray-700`) |
| Necessário Melhorias | Amarelo (`bg-yellow-100 text-yellow-700`) |
| Em Implantação | Azul (`bg-blue-100 text-blue-700`) |
| Com Atrasos | Vermelho (`bg-red-100 text-red-700`) |

---

## Lógica de React Query

### Query por Área

```javascript
// Ações de uma área específica
useQuery({
  queryKey: ['engenharia', areaName, selectedProjectId],
  queryFn: () => base44.entities.Engenharia.list({
    nome: areaName,
    projeto_id: selectedProjectId
  }),
  enabled: !!selectedProjectId
})
```

### Mutações

- **Criar Ação:** `base44.entities.Engenharia.create({ ...formData, nome: areaName, projeto_id: selectedProjectId })` → invalida `['engenharia', areaName, selectedProjectId]`
- **Atualizar:** `base44.entities.Engenharia.update(id, formData)` → invalida query da área
- **Excluir:** `base44.entities.Engenharia.delete(id)` → invalida query da área

**Nota importante:** ao criar, o campo `nome` é preenchido automaticamente com o nome da área ativa — o usuário não seleciona manualmente.

---

## Design e Layout

### Layout Geral da Página

```
┌──────────────────────────────────────────────────────┐
│ [Settings] Planos de Ação                             │
│ Ações por área de gestão do projeto                  │
└──────────────────────────────────────────────────────┘

[Mobilização] [Produção] [Qualidade] [Segurança] [Suprimentos] [Planejamento]

┌──────────────────────────────────────────────────────┐
│ Mobilização                       [Nova Ação]         │
├──────────────────────────────────────────────────────┤
│ [KPIs]  Funcionando=2 | Em Implantação=1 | ...       │
├──────────────────────────────────────────────────────┤
│ (formulário inline se aberto)                        │
├──────────────────────────────────────────────────────┤
│ Tabela de Ações                                      │
│ Descrição | Responsável | Finalidade | Status | Ações│
└──────────────────────────────────────────────────────┘
```

### Abas
- **Desktop:** todas as 6 abas em linha horizontal (grid de 6 colunas)
- **Tablet:** 3 colunas
- **Mobile:** 2 colunas

### Card Principal (por aba)
- Fundo branco com sombra (`shadow-md`)
- Cabeçalho com gradiente azul/índigo suave: `from-indigo-50 to-indigo-100`
- Padding: `p-6`
- Border-radius: `rounded-xl`

### KPI Cards (dentro do painel)
- Layout: 3 cards em linha
- Cada KPI card: fundo branco, borda colorida na esquerda (4px), padding `p-4`
- Número grande: `text-3xl font-bold` na cor correspondente

### Tabela
- Header: fundo cinza claro (`bg-gray-50`)
- Hover nas linhas: `hover:bg-gray-50`
- Borda inferior por linha: `border-b border-gray-100`
- Texto da coluna Status: badge centralizado

### Formulário Inline
- Fundo: `bg-gray-50`
- Borda: `border border-gray-200`
- Border-radius: `rounded-lg`
- Padding: `p-4`
- Margem inferior em relação à tabela: `mb-4`

---

## Integração com Outros Módulos

- **Dashboard:** os KPIs consolidados de todas as 6 áreas aparecem no card "Planos de Ação" do Dashboard
- **Pleitos:** módulo independente — os planos de ação aqui **não são** os planos de ação dos pleitos
- **Relatórios:** as ações concluídas por área podem ser usadas como insumo para relatórios de progresso

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `Settings` em índigo/roxo
- Título: "Nenhum Projeto Selecionado"
- Mensagem: "Selecione um projeto no menu lateral para visualizar os planos de ação."

**Com projeto mas sem ações na área:**
- Mensagem centralizada na área da tabela: "Nenhuma ação registrada para [Nome da Área]"
- Botão sutil "Nova Ação" ou orientação para clicar no botão do cabeçalho
