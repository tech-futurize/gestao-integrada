# Documentação dos Módulos — Sistema de Gestão Integrada

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
5. Adm. Contratual → Contratos / Medições / RDOs / Registros / Pleitos / Mapa de Impacto
6. Riscos e Mudanças → Gestão de Riscos / Gestão de Mudanças
7. Agentes de IA → Executor de Dados / Analista de Negócio / Analista Contratual
8. Configurações → Usuários / Gerenciar Projeto / Config. Agentes

---

## Índice de Módulos

| # | Módulo | Rota | Entidade(s) | Arquivo da página |
|---|---|---|---|---|
| 01 | [Dashboard](./01-Dashboard.md) | `/dashboard` | Múltiplas (read-only) | `src/pages/Dashboard.jsx` |
| 02 | [Engenharia / Documentos](./18a-Engenharia.md) | `/engenharia/documentos` | `DocumentoEngenharia` | `src/pages/Engenharia/Documentos.jsx` |
| 03 | [Suprimentos / Mapa](./10-Suprimentos.md) | `/suprimentos/mapa` | `ItemMAS` | `src/pages/Suprimentos/MapaSuprimentos.jsx` |
| 04 | [Planejamento / Cronograma](./11-Cronograma.md) | `/planejamento/cronograma` | `TarefaCronograma` | `src/pages/Planejamento/Cronograma.jsx` |
| 05 | [Planejamento / 6WLA](./22-SixWLA.md) | `/planejamento/6wla` | `Item6WLA` + `TarefaCronograma` | `src/pages/Planejamento/SixWLA.jsx` |
| 06 | [Planejamento / Take-Off](./23-TakeOff.md) | `/planejamento/take-off` | `Commodity` + `LancamentoCommodity` | `src/pages/Planejamento/TakeOff.jsx` |
| 07 | [Planejamento / Histogramas](./06-Histograma.md) | `/planejamento/histograma` | `Histograma` + `Recurso` | `src/pages/Planejamento/Histograma.jsx` |
| 08 | [Planejamento / Avanços](./07-AvancoFisico.md) | `/planejamento/avancos` | `AvancoFisico` | `src/pages/Planejamento/Avancos.jsx` |
| 09 | [Adm. Contratual / Contratos](./09-Contratos.md) | `/admin-contratual/contratos` | `Contrato` + `Aditivo` | `src/pages/Contratos.jsx` |
| 10 | [Adm. Contratual / Medições](./24-Medicoes.md) | `/admin-contratual/medicoes` | `Medicao` | `src/pages/AdminContratual/Medicoes.jsx` |
| 11 | [Adm. Contratual / RDOs](./20-RDO.md) | `/admin-contratual/rdos` | `RDO` | `src/pages/AdminContratual/RDOs.jsx` |
| 12 | [Adm. Contratual / Registros](./02-Registros.md) | `/admin-contratual/registros` | `Incidente` | `src/pages/AdminContratual/Registros.jsx` |
| 13 | [Adm. Contratual / Pleitos](./03-Pleitos.md) | `/admin-contratual/pleitos` | `Caso` + `PlanoAcao` | `src/pages/AdminContratual/Pleitos.jsx` |
| 14 | [Adm. Contratual / Mapa de Impacto](./21-MapaImpacto.md) | `/admin-contratual/mapa-impacto` | `Incidente` (read) | `src/pages/AdminContratual/MapaImpacto.jsx` |
| 15 | [Riscos e Mudanças / Gestão de Riscos](./13-GestaoRiscos.md) | `/riscos-mudancas/gestao-riscos` | `Risco` + `PlanoAcao` | `src/pages/RiscosMudancas/GestaoRiscos.jsx` |
| 16 | [Riscos e Mudanças / Gestão de Mudanças](./08-GestaoMudancas.md) | `/riscos-mudancas/gestao-mudancas` | `MudancaContratual` | `src/pages/RiscosMudancas/GestaoMudancas.jsx` |
| 17 | [Agentes / Executor de Dados](./19-Agentes.md) | `/agentes/executor` | — (Mastra SSE) | `src/pages/Agentes/ExecutorDados.jsx` |
| 18 | [Agentes / Analista de Negócio](./19-Agentes.md) | `/agentes/analista-negocio` | — (Mastra SSE) | `src/pages/Agentes/AnalistaNegocio.jsx` |
| 19 | [Agentes / Analista Contratual](./19-Agentes.md) | `/agentes/analista-contratual` | — (Mastra SSE) | `src/pages/Agentes/AnalistaContratual.jsx` |
| 20 | [Configurações / Usuários](./25-Usuarios.md) | `/configuracoes/usuarios` | `Usuario` | `src/pages/Configuracoes/Usuarios.jsx` |
| 21 | [Configurações / Gerenciar Projeto](./14-GerenciarProjeto.md) | `/configuracoes/gerenciar-projeto` | `Projeto` | `src/pages/Configuracoes/GerenciarProjeto.jsx` |
| 22 | [Configurações / Config. Agentes](./19-Agentes.md) | `/configuracoes/agente-config` | — | `src/pages/Configuracoes/AgenteConfig.jsx` |

### Módulos removidos

| Módulo | Rota anterior | Status |
|---|---|---|
| Qualidade (RNCs, Lições) | `/qualidade/*` | **Removido** — Milestone Refatoração 2026-Q2 |
| Suprimentos / Requisições | `/suprimentos/requisicoes` | **Removido** — UI dropada (tabela mantida no BD) |
| Suprimentos / Cotações | `/suprimentos/cotacoes` | **Removido** — UI dropada (tabela mantida no BD) |
| Financeiro | `/Financeiro` | **Removido** — redirect para `/planejamento/avancos` |
| Relacionamentos | `/Relacionamentos` | **Removido da sidebar** — rota legada sem UI ativa |
| Rotinas | `/Rotinas` | **Removido da sidebar** — rota legada sem UI ativa |
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
| `Medicao` | `medicoes` | Adm. Contratual / Medições |
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
        ├── Contratos → Medições (subcontratados e pagamentos)
        │       └── Aditivos (prazo e valor)
        │
        ├── Registros → Pleitos (ocorrências → pleitos formais)
        │       └── Plano de Ação (por pleito)
        │
        ├── Mapa de Impacto (heatmap Contratada × Contratante)
        │
        ├── Gestão de Mudanças (tabela + cards de desvio)
        │       └── Plano de Ação (por mudança)
        │
        ├── Gestão de Riscos (impacto múltiplo + plano de ação)
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
| **Modal flutuante** | Formulários complexos com muitos campos | Contratos, Medições, Cronograma, Riscos, Mudanças |
| **Card embutido** | Formulários que contextualizam com a lista | Pleitos, Planos de Ação |
| **Edição inline** | Tabelas com poucos campos editáveis | Histograma, Avanço, Take-Off |
| **Toggle leitura/edição** | Tela única com um registro principal | Gerenciar Projeto |

### Padrão de Estado Vazio

Sem projeto selecionado: ícone + "Selecione um projeto na barra lateral".
Sem dados: ícone + "Nenhum [entidade] cadastrado" + botão para criar.

### Import/Export

Módulos com `<ImportExportDialog/>`: Cronograma, Take-Off, Histograma, Avanços, Engenharia, Suprimentos, Medições e Contratos.
