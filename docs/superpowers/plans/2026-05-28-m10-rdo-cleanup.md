# M10 RDO — Cleanup e Padronização — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir emojis por ícones Lucide no RDOForm, mover botões de ação para o slot do PageHeader em RDOs.jsx, e marcar todas as tarefas do Módulo 10 como concluídas no PLAN.md.

**Architecture:** Estado de `showForm`, `editRDO` e `showImport` é elevado de `RDOModule` para `RDOs.jsx`, que passa os botões Novo RDO e Importar como prop `actions` para `<PageHeader />`. `RDOModule` recebe essas variáveis como props e para de gerenciar localmente. `RDOForm.jsx` tem `PanelHeader` atualizado para aceitar prop `icon` (componente Lucide) ao invés de emoji no texto do label.

**Tech Stack:** React 18, JSX, Lucide React, Tailwind CSS

---

## Mapa de Arquivos

| Arquivo | Tipo | O que muda |
|---------|------|-----------|
| `src/components/rdo/RDOForm.jsx` | Modify | PanelHeader aceita `icon` prop; emojis removidos |
| `src/pages/AdminContratual/RDOs.jsx` | Modify | Eleva `showForm/editRDO/showImport`; passa actions ao PageHeader |
| `src/components/rdo/RDOModule.jsx` | Modify | Recebe estado elevado como props; remove botões do Card |
| `PLAN.md` | Modify | Checkboxes M10 marcados como `[x]` |

---

## Task 1: Substituir emojis por ícones Lucide no RDOForm

**Files:**
- Modify: `src/components/rdo/RDOForm.jsx`

- [ ] **Step 1: Atualizar os imports de Lucide em RDOForm.jsx**

Linha 8 atual:
```jsx
import {
  X, Plus, ChevronDown, ChevronUp, Sun, Cloud, CloudRain,
  CheckCircle, XCircle, Upload, Link2,
} from "lucide-react";
```

Substituir por:
```jsx
import {
  X, Plus, ChevronDown, ChevronUp, Sun, Cloud, CloudRain,
  CheckCircle, XCircle, Upload, Link2,
  Users, Truck, ClipboardList, AlertTriangle, Camera,
} from "lucide-react";
```

- [ ] **Step 2: Adicionar prop `icon` ao PanelHeader e renderizar o ícone**

Substituir a função `PanelHeader` atual (linhas 175–181) por:
```jsx
const PanelHeader = ({ label, panelKey, icon: Icon }) => (
  <button type="button" onClick={() => togglePanel(panelKey)}
    className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      {label}
    </span>
    {openPanels[panelKey] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
  </button>
);
```

- [ ] **Step 3: Atualizar as chamadas de PanelHeader removendo emojis e passando icon**

Encontre e substitua cada `<PanelHeader` no JSX:

```jsx
{/* Era: <PanelHeader label="👥 Mão de Obra" panelKey="mdo" /> */}
<PanelHeader label="Mão de Obra" panelKey="mdo" icon={Users} />
```

```jsx
{/* Era: <PanelHeader label="🚜 Equipamentos" panelKey="equip" /> */}
<PanelHeader label="Equipamentos" panelKey="equip" icon={Truck} />
```

```jsx
{/* Era: <PanelHeader label="📋 Atividades Produzidas" panelKey="ativ" /> */}
<PanelHeader label="Atividades Produzidas" panelKey="ativ" icon={ClipboardList} />
```

```jsx
{/* Era: <PanelHeader label="⚠️ Ocorrências e Impactos" panelKey="ocorr" /> */}
<PanelHeader label="Ocorrências e Impactos" panelKey="ocorr" icon={AlertTriangle} />
```

```jsx
{/* Era: <PanelHeader label="📷 Evidências" panelKey="evid" /> */}
<PanelHeader label="Evidências" panelKey="evid" icon={Camera} />
```

- [ ] **Step 4: Verificar visualmente no browser**

Abrir o formulário de Novo RDO em `/admin-contratual/rdos` e confirmar que todos os 5 painéis exibem ícone Lucide + texto sem emoji.

- [ ] **Step 5: Commit**

```bash
git add src/components/rdo/RDOForm.jsx
git commit -m "fix(rdo): substituir emojis por ícones Lucide nos painéis do RDOForm"
```

---

## Task 2: Elevar estado e mover ações para o PageHeader

**Files:**
- Modify: `src/pages/AdminContratual/RDOs.jsx`
- Modify: `src/components/rdo/RDOModule.jsx`

### 2a — Atualizar RDOs.jsx

- [ ] **Step 1: Reescrever RDOs.jsx com estado elevado e ações no PageHeader**

Conteúdo completo do novo `src/pages/AdminContratual/RDOs.jsx`:

```jsx
import { useState } from "react";
import { FileText, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import RDOModule from "@/components/rdo/RDOModule";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";

export default function RDOs() {
  const { selectedProjectId } = useProject();
  const [showForm, setShowForm]     = useState(false);
  const [editRDO, setEditRDO]       = useState(null);
  const [showImport, setShowImport] = useState(false);

  const handleNew = () => { setEditRDO(null); setShowForm(true); };

  const actions = selectedProjectId ? (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1.5">
        <Upload className="w-4 h-4" />Importar
      </Button>
      <Button size="sm" onClick={handleNew} className="gap-1.5">
        <Plus className="w-4 h-4" />Novo RDO
      </Button>
    </>
  ) : null;

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={FileText}
            description="Selecione um projeto na barra lateral para acessar os RDOs."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader actions={actions} />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <RDOModule
          selectedProjectId={selectedProjectId}
          showForm={showForm}
          setShowForm={setShowForm}
          editRDO={editRDO}
          setEditRDO={setEditRDO}
          showImport={showImport}
          setShowImport={setShowImport}
        />
      </div>
    </div>
  );
}
```

### 2b — Atualizar RDOModule.jsx

- [ ] **Step 2: Atualizar assinatura da função RDOModule para aceitar estado elevado**

Linha 20 atual:
```jsx
export default function RDOModule({ selectedProjectId }) {
```

Substituir por:
```jsx
export default function RDOModule({
  selectedProjectId,
  showForm, setShowForm,
  editRDO, setEditRDO,
  showImport, setShowImport,
}) {
```

- [ ] **Step 3: Remover declarações de estado locais que foram elevadas**

Remover as 3 linhas abaixo (linhas 23–25 aproximadamente):
```jsx
const [showForm, setShowForm]     = useState(false);
const [editRDO, setEditRDO]       = useState(null);
const [showImport, setShowImport] = useState(false);
```

- [ ] **Step 4: Remover os dois botões do Card de filtros**

No Card de filtros (dentro do `<div className="flex flex-wrap gap-3 items-end">`), remover os dois botões:
```jsx
{/* REMOVER estes dois botões — agora estão no PageHeader */}
<Button variant="outline" onClick={() => setShowImport(true)} className="gap-1.5">
  <Upload className="w-4 h-4" />Importar
</Button>
<Button onClick={() => { setEditRDO(null); setShowForm(true); }}>
  <Plus className="w-4 h-4 mr-1" />Novo RDO
</Button>
```

- [ ] **Step 5: Remover Upload do import de lucide-react em RDOModule.jsx**

O ícone `Upload` não é mais usado em `RDOModule.jsx`. Remover da linha de imports:
```jsx
// Antes:
import { FileText, Plus, Search, Eye, Trash2, Edit, Sun, CloudRain, Upload } from "lucide-react";
// Depois:
import { FileText, Search, Eye, Trash2, Edit, Sun, CloudRain } from "lucide-react";
```

Também remover `Plus` se não for mais usado no RDOModule.

- [ ] **Step 6: Verificar no browser**

1. Abrir `/admin-contratual/rdos`
2. Confirmar que os botões "Importar" e "Novo RDO" aparecem no header sticky no topo da página (ao lado do breadcrumb "Adm. Contratual › RDOs")
3. Clicar "Novo RDO" — modal de criação deve abrir
4. Clicar "Importar" — dialog de importação deve abrir
5. Clicar o ícone de editar em um RDO da tabela — modal deve abrir em modo edição

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminContratual/RDOs.jsx src/components/rdo/RDOModule.jsx
git commit -m "feat(rdo): mover ações Novo/Importar para slot actions do PageHeader"
```

---

## Task 3: Atualizar PLAN.md — marcar M10 como concluído

**Files:**
- Modify: `PLAN.md`

- [ ] **Step 1: Marcar todas as tarefas do Módulo 10 como concluídas**

Substituir o bloco inteiro do Módulo 10 em `PLAN.md`:

```markdown
### Módulo 10 — RDO

> ✅ **Concluído — Audit score ≥ 9** *(2026-05-28)*

- [x] Builder: Remover botão "Anexar à Medição" (`RDOModule.jsx:425`)
- [x] Builder: Remover "KM" do campo Área; remover campo Hora (manter apenas Data)
- [x] Builder: Desvincular Condição × Praticabilidade — permitir qualquer combinação
- [x] Builder: Padronizar MO e Equipamentos — botões "Adicionar" gerando Nome / Função-Identificação / Quantidade
- [x] Builder: Botão "Vincular Atividades" — pop-up de cronograma com filtros e checkbox múltiplo
- [x] Builder: Replicar vínculo na seção "Ocorrências e Impactos"
- [x] Builder: Campo de Evidências (upload de arquivo / captura de foto)
- [x] Builder: Importação em massa com `ColumnMappingDialog`
- [x] Builder: Emojis → ícones Lucide nos painéis do RDOForm *(2026-05-28)*
- [x] Builder: Ações Novo RDO / Importar movidas para slot actions do PageHeader *(2026-05-28)*
```

- [ ] **Step 2: Commit**

```bash
git add PLAN.md
git commit -m "docs(plan): marcar Módulo 10 RDO como concluído"
```

---

## Self-Review

**Spec coverage:**
- ✅ Emojis → Lucide (Task 1)
- ✅ Ações no PageHeader (Task 2)
- ✅ PLAN.md atualizado (Task 3)

**Placeholder scan:** Nenhum TBD/TODO encontrado. Todos os passos têm código completo.

**Type consistency:**
- `showForm/setShowForm`, `editRDO/setEditRDO`, `showImport/setShowImport` — mesmos nomes em todas as tasks
- `icon` prop adicionada ao `PanelHeader` — usada consistentemente nas 5 chamadas
- `onSaved` callback em `RDOForm` permanece inalterado — não é afetado pela elevação de estado
