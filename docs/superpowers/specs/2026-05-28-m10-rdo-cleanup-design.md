# M10 RDO — Limpeza e Padronização

**Data:** 2026-05-28  
**Status:** Aprovado pelo PO

## Contexto

Toda a funcionalidade do Módulo 10 (RDO) foi implementada em commits anteriores (`c406b51`, `fa720c9`, `0e5d4ee`, `61e3b43`). O PLAN.md permaneceu com checkboxes desmarcados. Resta apenas limpeza de conformidade.

## Escopo

### 1. Emojis → Ícones Lucide (`RDOForm.jsx`)

Os `PanelHeader` usam emojis nos labels, violando CLAUDE.md ("Only use emojis if the user explicitly requests it").

| Emoji | Substituto Lucide |
|-------|-------------------|
| 👥 Mão de Obra | `Users` |
| 🚜 Equipamentos | `Truck` |
| 📋 Atividades Produzidas | `ClipboardList` |
| ⚠️ Ocorrências e Impactos | `AlertTriangle` |
| 📷 Evidências | `Camera` |

Abordagem: passar `icon` como prop para `PanelHeader` e renderizar o ícone Lucide ao lado do label.

### 2. Ações no slot do PageHeader (`RDOs.jsx` + `RDOModule.jsx`)

O padrão visual (Módulo 0) exige que ações primárias (Novo / Importar) fiquem no slot `actions` do `<PageHeader />`.

- `RDOs.jsx`: recebe callbacks `onNew` e `onImport` via state ou ref; passa para `<PageHeader actions={...} />`
- `RDOModule.jsx`: remove os botões "Novo RDO" e "Importar" do Card de filtros; expõe via props ou renderiza via contexto de estado local elevado

Abordagem mais simples: elevar `showForm` e `showImport` para `RDOs.jsx`, passar como props de controle para `RDOModule`. PageHeader recebe os dois botões como `actions`.

### 3. PLAN.md — marcar M10 como concluído

Marcar todas as 8 tarefas do Módulo 10 com `[x]` e adicionar linha de status `> ✅ Concluído`.

## Arquivos impactados

- `src/components/rdo/RDOForm.jsx` — substituir emojis
- `src/pages/AdminContratual/RDOs.jsx` — elevar estado + PageHeader actions
- `src/components/rdo/RDOModule.jsx` — receber props de controle, remover botões do Card
- `PLAN.md` — atualizar checkboxes
