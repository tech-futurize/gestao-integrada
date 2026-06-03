# Documentação dos Módulos — Sistema de Gestão Integrada

> **Atualizado em:** 2026-06-03
> **Esquema de numeração:** sequencial por ordem lógica de navegação (sidebar top→bottom), sem gaps. Arquivos físicos mantêm seu nome original; o índice é a fonte de verdade para a numeração canônica.

---

## Visão Geral do Sistema

O **Sistema de Gestão Integrada** é uma SPA React para gerenciamento integrado de projetos EPC (Engineering, Procurement & Construction). Centraliza cronograma, suprimentos, avanço físico, pleitos contratuais, riscos e mudanças em um único sistema multiempresa, com dados em tempo real via Supabase.

### Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| **Frontend** | React 18.2 + Vite 6.1 | Framework principal |
| **Linguagem** | JavaScript (JSX) | Sem TypeScript |
| **UI Components** | Radix UI + shadcn/ui | Primitivos de interface |
| **Estilização** | Tailwind CSS 3.x | Classes utilitárias |
| **Estado Servidor** | TanStack React Query 5.x | Cache, loading, mutações |
| **Gráficos** | Recharts 2.x | Barras, áreas, radares |
| **Roteamento** | React Router DOM 7.x | SPA com rotas por módulo |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) | BaaS — sem servidor próprio |
| **Data Layer** | `src/api/supabaseEntities.js` | Shim com `list/filter/create/update/delete` |
| **Agentes de IA** | Mastra Framework (Node.js, porta 4111) | 3 agentes SSE em projeto paralelo |

### API das Entidades

```javascript
import { entities } from "@/api/supabaseEntities";

entities.NomeDaEntidade.list({ filtro: valor })   // SELECT com filtros
entities.NomeDaEntidade.filter({ filtro: valor })  // alias de list()
entities.NomeDaEntidade.create(data)               // INSERT
entities.NomeDaEntidade.update(id, data)           // UPDATE
entities.NomeDaEntidade.delete(id)                 // DELETE
```

---

### Padrões Globais de Código

- **Projeto Ativo:** obter via `useProject()` do `@/lib/ProjectContext` — nunca `localStorage.getItem("selectedProjectId")` direto.
- **Data Fetching:** sempre `useQuery`/`useMutation` do React Query — nunca `useEffect + fetch`.
- **Enabled guard:** `enabled: !!selectedProjectId` em toda query que depende de projeto.
- **Filtro de projeto:** `entities.X.filter({ projeto_id: selectedProjectId })`.
- **Estados:** todo componente com query trata `isPending`, `isError` e `data`. Nunca só `isLoading`.
- **Formatação de moeda:** `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)`.
- **Formatação de datas:** `date-fns` com locale `pt-BR`.

---

### Design System (FuturizeNow)

| Cor | Hex | Uso |
|---|---|---|
| Azul Cobalto | `#102A44` | Sidebar, cards primários |
| Deep Navy | `#0A1929` | Background dark mode |
| Ciano Elétrico | `#26FFFF` | Item ativo sidebar, indicadores |
| Cinza Titânio | `#8195A9` | Bordas, labels secundários |
| Ocre | `#a98743` | Status atenção |
| Magenta | `#db4974` | Alertas críticos |

**Botões:**
- Salvar: `bg-emerald-600 hover:bg-emerald-700` (verde esmeralda — padrão em todos os módulos)
- Cancelar: `bg-slate-200 text-slate-700`
- Excluir: `bg-red-600`

**Dual Theme:** claro e escuro em todos os módulos. Toggle com `AnimatedThemeToggler` em `src/components/ui/`.

---

### Comportamento Global

- **Seleção de Projeto:** todos os módulos dependem de `selectedProjectId` via `useProject()`. Sem projeto selecionado, a query não executa (`enabled: false`).
- **Cache:** React Query invalida as queries relevantes após cada mutação (create/update/delete).
- **Paginação server-side:** via `usePaginatedQuery` (hook em `src/hooks/`) + Supabase `.range()`.
- **Import/Export:** `<ImportExportDialog/>` padronizado em 8+ módulos — usa `xlsx` e `papaparse`.
- **Autenticação:** `AuthContext` + `ProtectedRoute`. Rotas protegidas redirecionam para `/login`.

---

## Estrutura de Navegação

Sidebar accordion à esquerda — configurada em `src/lib/navigationConfig.js`:

1. Dashboard
2. Engenharia → Documentos
3. Suprimentos → Mapa de Suprimentos
4. Planejamento → Cronograma / 6WLA / Take-Off / Histogramas / Avanços
5. Adm. Contratual → Contratos / RDOs / Registros / Pleitos / Mapa de Impacto
6. Riscos e Mudanças → Gestão de Riscos / Gestão de Mudanças
7. Agentes de IA → Executor de Dados / Analista de Negócio / Analista Contratual
8. Configurações → Usuários / Gerenciar Projeto / Config. Agentes

---

## Índice de Módulos

| # | Módulo | Arquivo | Descrição |
|---|--------|---------|-----------|
| 01 | Dashboard | [01-Dashboard.md](01-Dashboard.md) | Tela inicial pós-login com KPIs consolidados de todos os módulos ativos; somente leitura |
| 02 | Engenharia / Documentos | [18a-Engenharia.md](18a-Engenharia.md) | Ciclo de vida de documentos técnicos: emissão, revisão e aprovação por disciplina |
| 03 | Suprimentos / Mapa | [10-Suprimentos.md](10-Suprimentos.md) | Mapa de Acompanhamento de Suprimentos (MAS) com rastreamento por etapas de compra |
| 04 | Planejamento / Cronograma | [11-Cronograma.md](11-Cronograma.md) | Cronograma Gantt WBS com hierarquia de até 9 níveis, baseline e status automático |
| 05 | Planejamento / 6WLA | [05-6WLA.md](05-6WLA.md) | Look-Ahead de 6 semanas vinculado ao cronograma, com restrições por categoria e dashboard de cards |
| 06 | Planejamento / Take-Off | [06-TakeOff.md](06-TakeOff.md) | Controle de quantitativos por disciplina/unidade com lançamentos semanais e curva de avanço |
| 07 | Planejamento / Histogramas | [06-Histograma.md](06-Histograma.md) | Histograma mensal de Mão de Obra e Equipamentos com controle de previsto, real e projetado |
| 08 | Planejamento / Avanços | [07-AvancoFisico.md](07-AvancoFisico.md) | Avanço físico semanal (previsto × real × projetado) com curva S e aderência |
| 09 | Adm. Contratual / Contratos | [09-Contratos.md](09-Contratos.md) | Gestão de contratos e aditivos de prazo/valor com datas dinâmicas e histórico |
| 10 | Adm. Contratual / RDOs | [20-RDO.md](20-RDO.md) | Relatório Diário de Obra com registro de MO, equipamentos, atividades e ocorrências |
| 11 | Adm. Contratual / Registros | [11-Registros.md](11-Registros.md) | Registro de ocorrências de campo (11 tipos) com pop-up FormDialog e cards de resumo |
| 12 | Adm. Contratual / Pleitos | [03-Pleitos.md](03-Pleitos.md) | Gestão de pleitos contratuais formais com vínculo a registros e planos de ação |
| 13 | Adm. Contratual / Mapa de Impacto | [21-MapaImpacto.md](21-MapaImpacto.md) | Heatmap cruzado Contratada × Contratante derivado dos registros de ocorrências |
| 14 | Riscos e Mudanças | [13-RiscosMudancas.md](13-RiscosMudancas.md) | Módulo consolidado: Gestão de Riscos (impacto múltiplo + plano de ação) e Gestão de Mudanças (tabela + cards de desvio) |
| 15 | Agentes de IA | [19-Agentes.md](19-Agentes.md) | Três agentes Mastra SSE: Executor de Dados, Analista de Negócio e Analista Contratual |
| 16 | Configurações / Usuários | [25-Usuarios.md](25-Usuarios.md) | Cadastro e gerenciamento de usuários com permissões por módulo |
| 17 | Configurações / Gerenciar Projeto | [14-GerenciarProjeto.md](14-GerenciarProjeto.md) | Ficha técnica do projeto ativo com campos editáveis de dados gerais e metadados |

---

## Documentos de Status (tombstones e subdivisões)

| Arquivo | Descrição |
|---------|-----------|
| [04-PlanosDeAcao.md](04-PlanosDeAcao.md) | Tombstone: módulo standalone removido; funcionalidade absorvida por Riscos e Pleitos |
| [05-Financeiro.md](05-Financeiro.md) | Tombstone: módulo Financeiro removido; funcionalidade absorvida por Planejamento / Avanços |
| [08-GestaoMudancas.md](08-GestaoMudancas.md) | Referência legada: Gestão de Mudanças agora documentada em 13-RiscosMudancas.md |
| [12-Planejamento.md](12-Planejamento.md) | Tombstone: módulo Planejamento subdividido em páginas independentes (Cronograma, 6WLA, etc.) |
| [17-Notificacoes.md](17-Notificacoes.md) | Tombstone: Notificações removidas da sidebar; tabela `ruidos` existe sem UI ativa |

---

## Módulos Removidos (protocolo drop executado)

| Módulo | Rota anterior | Status |
|---|---|---|
| Qualidade (RNCs, Lições) | `/qualidade/*` | **Removido** — Milestone Refatoração 2026-Q2 |
| Suprimentos / Requisições | `/suprimentos/requisicoes` | **Removido** — UI dropada (tabela mantida no BD) |
| Suprimentos / Cotações | `/suprimentos/cotacoes` | **Removido** — UI dropada (tabela mantida no BD) |
| Financeiro | `/Financeiro` | **Removido** — redirect para `/planejamento/avancos` |
| Medições | `/admin-contratual/medicoes` | **Removido** — protocolo drop de módulo executado |
| Relacionamentos | `/Relacionamentos` | **Removido da sidebar** — rota legada sem UI ativa |
| Notificações/Ruídos | `/Ruidos` | **Removido da sidebar** — rota legada sem UI ativa |

---

## Entidades Backend (Referência Completa)

| Entidade (código) | Tabela Supabase | Módulo Principal |
|---|---|---|
| `Projeto` | `projetos` | Gerenciar Projeto |
| `Incidente` | `incidentes` | Registros / Mapa de Impacto |
| `Caso` | `casos` | Pleitos |
| `PlanoAcao` | `plano_acao` | Gestão de Riscos / Pleitos |
| `Financeiro` | `financeiros` | (sem UI ativa — legado) |
| `Histograma` | `histogramas` | Planejamento / Histogramas |
| `AvancoFisico` | `avanco_fisico` | Planejamento / Avanços |
| `MudancaContratual` | `mudancas_contratuais` | Riscos e Mudanças / Gestão de Mudanças |
| `Contrato` | `contratos` | Adm. Contratual / Contratos |
| `Aditivo` | `aditivos` | Adm. Contratual / Contratos |
| `TarefaCronograma` | `tarefas_cronograma` | Planejamento / Cronograma / 6WLA |
| `Commodity` | `commodities` | Planejamento / Take-Off |
| `LancamentoCommodity` | `lancamentos_commodity` | Planejamento / Take-Off |
| `ItemMAS` | `itens_mas` | Suprimentos / Mapa |
| `DocumentoEngenharia` | `documentos_engenharia` | Engenharia / Documentos |
| `Item6WLA` | `itens_6wla` | Planejamento / 6WLA |
| `Risco` | `riscos` | Riscos e Mudanças / Gestão de Riscos |
| `Usuario` | `usuarios` | Configurações / Usuários |
| `RDO` *(via supabase direto)* | `rdo` | Adm. Contratual / RDOs |
| `unidades_medida` *(lookup global)* | `unidades_medida` | Suprimentos / Take-Off |

> **Nota:** `RDO` não está no `TABLE_MAP` de `supabaseEntities.js` — o módulo faz chamadas diretas ao `supabase` client. Adicionar ao shim se necessário.

---

## Fluxo Principal do Sistema

```
Projeto Selecionado
        │
        ├── Cronograma (linha de base do projeto)
        │       ├── 6WLA (look-ahead das próximas 6 semanas)
        │       └── RDO (produção diária vinculada a tarefas)
        │
        ├── Take-Off → lançamentos semanais de quantitativos
        │
        ├── Histogramas (MO e Equipamentos por mês)
        │
        ├── Avanços (previsto × real × projetado)
        │
        ├── Engenharia (documentos técnicos — emissão e revisão)
        │
        ├── Suprimentos (mapa de acompanhamento)
        │
        ├── Contratos → Aditivos (prazo e valor)
        │
        ├── Registros → Pleitos (ocorrências → pleitos formais)
        │       └── Plano de Ação (por pleito)
        │
        ├── Mapa de Impacto (heatmap Contratada × Contratante)
        │
        ├── Riscos e Mudanças
        │       ├── Gestão de Riscos (impacto múltiplo + plano de ação)
        │       └── Gestão de Mudanças (tabela + cards de desvio)
        │
        ├── Agentes de IA (Mastra — análise e consulta)
        │
        ├── Configurações (Usuários, Projeto, Config. Agentes)
        │
        └── Dashboard (visão consolidada de todos os módulos)
```

---

## Padrões de Componentes

### Tipos de Formulário

| Tipo | Quando usar | Exemplos |
|---|---|---|
| **Modal flutuante** | Formulários complexos com muitos campos | Contratos, Cronograma, Riscos, Mudanças |
| **Card embutido** | Formulários que contextualizam com a lista | Pleitos, Planos de Ação |
| **Edição inline** | Tabelas com poucos campos editáveis | Histograma, Avanço, Take-Off |
| **Toggle leitura/edição** | Tela única com um registro principal | Gerenciar Projeto |

### Padrão de Estado Vazio

Sem projeto selecionado: ícone + "Selecione um projeto na barra lateral".
Sem dados: ícone + "Nenhum [entidade] cadastrado" + botão para criar.

### Import/Export

Módulos com `<ImportExportDialog/>`: Cronograma, Take-Off, Histograma, Avanços, Engenharia, Suprimentos e Contratos.
