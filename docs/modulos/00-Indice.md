# Documentação dos Módulos — Sistema de Gestão Integrada

## Visão Geral do Sistema

O **Sistema de Gestão Integrada** é uma plataforma web desenvolvida em React para gerenciamento integrado de projetos de engenharia/construção. O sistema concentra todas as informações contratuais, operacionais e de gestão de um projeto em um único lugar, com foco em contratos de empreitada e administração contratual.

### Tecnologias Utilizadas

| Tecnologia | Versão / Lib | Uso |
|---|---|---|
| **Frontend** | React + Vite | Framework principal |
| **UI Components** | Shadcn/UI | Componentes de interface (Button, Card, Select, etc.) |
| **Estilização** | TailwindCSS | Classes utilitárias de CSS |
| **Estado Servidor** | React Query (TanStack) | Cache, loading states, mutações e invalidação |
| **Gráficos** | Recharts | LineChart (Financeiro, Avanço Físico) e BarChart (Histograma) |
| **Roteamento** | React Router | SPA com rotas por módulo |
| **Backend** | Base44 (BaaS) | Entidades de dados via `base44.entities.[Entidade].[método]` |
| **Tipografia** | Montserrat (Google Fonts) | Fonte principal — aplicada globalmente via CSS |

### Métodos disponíveis nas entidades Base44

```javascript
base44.entities.NomeDaEntidade.list({ filtro: valor })  // Buscar registros
base44.entities.NomeDaEntidade.create(data)              // Criar registro
base44.entities.NomeDaEntidade.update(id, data)          // Atualizar registro
base44.entities.NomeDaEntidade.delete(id)                // Excluir registro
```

---

### Paleta de Cores Global

| Cor | Hex | Uso |
|---|---|---|
| Azul Escuro (Primary) | `#26405d` | Títulos, sidebar, destaque principal, gráficos |
| Terracota (Accent) | `#c35e1e` | Botões de ação, destaques, alertas de custo |
| Verde-Água (Success) | `#00a49a` | Indicadores positivos, conclusão, gráfico histograma |
| Vermelho (Error) | `#F44C41` / `#ef4444` | Alertas críticos, exclusão, atraso |
| Cinza (Background) | `#f2f2f2` | Fundo geral da aplicação |
| Branco | `#ffffff` | Fundo de cards e painéis |
| Azul Recharts | `#3b82f6` | Barras de atividade no Gantt |

---

### Comportamento Global

- **Seleção de Projeto:** todos os módulos dependem do `selectedProjectId` armazenado em `localStorage`. Cada módulo verifica se há projeto selecionado antes de executar queries e exibe uma tela de aviso caso contrário.
- **Cache e Estado:** React Query gerencia o cache dos dados. Após cada mutação (create/update/delete), as queries relevantes são invalidadas via `queryClient.invalidateQueries(queryKey)`.
- **Responsividade:** todos os módulos são responsivos — layouts adaptam para mobile (1 coluna), tablet (2 colunas) e desktop (3+ colunas).
- **Autenticação:** gerenciada pelo `AuthContext`. Rotas protegidas redirecionam para login quando necessário.
- **Formatação de moeda:** padrão BRL — `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)`
- **Formatação de datas:** biblioteca `date-fns` com locale pt-BR para formatos como `dd/MM/yyyy`, `MMMM/yyyy`, `MMM/yy`

---

## Estrutura de Navegação

A sidebar fixa à esquerda contém:
1. Logo FuturizeNow
2. Selector de Projeto Ativo — dropdown com todos os projetos do usuário (entidade `Projeto`)
3. Menu de navegação com os módulos principais

**Nota:** 3 módulos (Relacionamentos, Rotinas e Notificações/Ruídos) são implementados como páginas independentes mas **não aparecem no menu lateral** — são acessados via rota direta.

---

## Índice de Módulos

| # | Módulo | Rota | Entidade(s) Backend | Tipo de Exibição |
|---|---|---|---|---|
| 01 | [Dashboard](./01-Dashboard.md) | `/Dashboard` | Múltiplas (somente leitura) | Painel de KPIs e resumos |
| 02 | [Registros](./02-Registros.md) | `/Registros` | `Incidente` | Tabela + Modal |
| 03 | [Pleitos](./03-Pleitos.md) | `/Pleitos` | `Caso` + `Acao` | Tabela + Card embutido + Detalhe |
| 04 | [Planos de Ação](./04-PlanosDeAcao.md) | `/PlanosDeAcao` | `Engenharia` (6 áreas) | Abas + Card embutido |
| 05 | [Financeiro](./05-Financeiro.md) | `/Financeiro` | `Financeiro` | Gráfico + Tabela inline |
| 06 | [Histograma](./06-Histograma.md) | `/Histograma` | `Histograma` + `Recurso` | Gráfico + Tabela inline |
| 07 | [Avanço Físico](./07-AvancoFisico.md) | `/AvancoFisico` | `AvancoFisico` | Gráfico + Tabela inline |
| 08 | [Gestão de Mudanças](./08-GestaoMudancas.md) | `/GestaoMudancas` | `MudancaContratual` | Kanban + Termômetro + Dashboard |
| 09 | [Contratos](./09-Contratos.md) | `/Contratos` | `Contrato` + `Medicao` | Cards + Tabela + Modal |
| 10 | [Suprimentos](./10-Suprimentos.md) | `/Suprimentos` | `RequisicaoCompra` + `Cotacao` | Abas + Modal + Mapa |
| 11 | [Cronograma](./11-Cronograma.md) | `/Cronograma` | `TarefaCronograma` | Gantt customizado + Modal |
| 12 | [Planejamento](./12-Planejamento.md) | `/Planejamento` | Estado local (sem backend) | Abas + Accordion + Modal |
| 13 | [Gestão de Riscos](./13-GestaoRiscos.md) | `/GestaoRiscos` | Estado local (mock) | Heat Map + Tabela + Modal |
| 14 | [Gerenciar Projeto](./14-GerenciarProjeto.md) | `/GerenciarProjeto` | `Projeto` + `DocumentoContratual` | Formulário toggle leitura/edição |
| 15 | [Relacionamentos](./15-Relacionamentos.md) | `/Relacionamentos` | `Relacionamento` | Tabela + Card embutido |
| 16 | [Rotinas/Processos](./16-Rotinas.md) | `/Rotinas` | `Rotina` | Tabela + Card embutido |
| 17 | [Notificações](./17-Notificacoes.md) | `/Ruidos` | `Ruido` + `Caso` | Tabela + Card embutido |
| 18 | [Diagrama Relacional](./18-DiagramaRelacional.md) | — | Todas as entidades | Referência ER + FKs + campos calculados |

---

## Entidades Backend (Referência Completa)

| Entidade | Módulo Principal | Campos Chave |
|---|---|---|
| `Projeto` | Gerenciar Projeto | `nome`, `valor_contrato`, `status`, `projeto_id` |
| `DocumentoContratual` | Gerenciar Projeto | `titulo`, `tipo`, `arquivo_url`, `projeto_id` |
| `Incidente` | Registros | `tipo_registro`, `status`, `caso_id`, `projeto_id` |
| `Caso` | Pleitos | `titulo`, `status`, `prioridade`, `categorias`, `projeto_id` |
| `Acao` | Pleitos (Plano de Ação) | `descricao`, `status`, `caso_id`, `projeto_id` |
| `Engenharia` | Planos de Ação | `nome` (área), `descricao_acao`, `status`, `projeto_id` |
| `Financeiro` | Financeiro | `mes_referencia`, `faturamento_*`, `projeto_id` |
| `Recurso` | Histograma | `nome_recurso`, `projeto_id` |
| `Histograma` | Histograma | `recurso_id`, `mes_referencia`, `quantidade_*`, `projeto_id` |
| `AvancoFisico` | Avanço Físico | `mes_referencia`, `avanco_*`, `projeto_id` |
| `MudancaContratual` | Gestão de Mudanças | `status`, `origem`, `impacto_custo`, `impacto_prazo_dias`, `projeto_id` |
| `Contrato` | Contratos | `numero`, `fornecedor`, `valor_total`, `status`, `projeto_id` |
| `Medicao` | Contratos | `contrato_id`, `valor_bruto`, `valor_liquido`, `status`, `projeto_id` |
| `RequisicaoCompra` | Suprimentos | `numero`, `itens`, `status`, `projeto_id` |
| `Cotacao` | Suprimentos | `numero`, `propostas`, `fornecedor_selecionado`, `projeto_id` |
| `TarefaCronograma` | Cronograma | `codigo_wbs`, `tipo`, `pai_id`, `caminho_critico`, `projeto_id` |
| `Relacionamento` | Relacionamentos | `data_interacao`, `classificacao`, `partes_envolvidas`, `projeto_id` |
| `Rotina` | Rotinas | `periodicidade`, `proxima_data_execucao`, `status`, `projeto_id` |
| `Ruido` | Notificações | `descricao`, `status`, `caso_id`, `projeto_id` |

---

## Fluxo Principal do Sistema

```
Projeto Selecionado
        │
        ├── Registros (documentar ocorrências → evidências)
        │       └── Vincular a Pleitos como evidência
        │
        ├── Notificações/Ruídos (monitorar sinais)
        │       └── Promover → cria Pleito automaticamente
        │
        ├── Pleitos (gestão formal de disputas)
        │       └── Plano de Ação por Pleito (ações de resolução)
        │
        ├── Planos de Ação por Área (ações operacionais)
        │
        ├── Gestão de Mudanças (alterações ao contrato base)
        │       └── Termômetro de Desvio (vs. valor_contrato do Projeto)
        │
        ├── Contratos + Medições (subcontratados e pagamentos)
        │
        ├── Suprimentos (requisições e cotações de compras)
        │
        ├── Cronograma (Gantt com WBS e caminho crítico)
        │
        ├── Financeiro + Avanço Físico + Histograma (curvas de controle)
        │
        ├── Planejamento (atas, lições, 6WLA, take-off)
        │
        ├── Gestão de Riscos (matriz e planos de mitigação)
        │
        ├── Gerenciar Projeto (ficha técnica do contrato)
        │
        ├── Relacionamentos (log de interações com stakeholders)
        │
        ├── Rotinas (processos administrativos recorrentes)
        │
        └── Dashboard (visão consolidada de todos os módulos)
```

---

## Padrões de Componentes

### Tipos de Formulário

| Tipo | Quando usar | Exemplos |
|---|---|---|
| **Modal flutuante** | Formulários complexos com muitos campos | Contratos, Medições, Suprimentos, Cronograma, Riscos |
| **Card embutido** | Formulários que contextualizam com a lista abaixo | Pleitos, Planos de Ação, Relacionamentos, Rotinas, Ruídos |
| **Edição inline** | Tabelas com poucos campos editáveis | Financeiro, Histograma, Avanço Físico, Take-Off |
| **Toggle leitura/edição** | Tela única com um registro principal | Gerenciar Projeto |

### Padrão de Cores por Ação

| Ação | Cor do Botão |
|---|---|
| Criar / Salvar / Confirmar | Verde (`bg-green-600`) |
| Principal / Editar (destaque) | Terracota (`bg-[#c35e1e]`) |
| Cancelar / Voltar | Outline sem fill |
| Excluir | Vermelho (`bg-red-600`) ou ícone vermelho |
| Navegação | Azul (`bg-blue-600`) |

### Padrão de Estado Vazio

Todos os módulos seguem este padrão quando não há projeto selecionado:
- Ícone representativo do módulo em cinza ou na cor da área
- Título: "Nenhum Projeto Selecionado"
- Mensagem orientativa para selecionar um projeto

Quando há projeto mas sem dados:
- Ícone + título "Nenhum [entidade] cadastrado"
- Botão para criar o primeiro registro
