# Header Button Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar todos os botões de ação (Novo, Importar/Exportar) na prop `actions` do `PageHeader` em 11 arquivos de página para usar `size="sm"`, verde esmeralda nos botões "Novo", e `variant="outline"` + ícone `Upload` + label `"Importar / Exportar"` nos botões de importação.

**Architecture:** Edições diretas nos arquivos de página — sem novo componente. O `PageHeader` já aceita a prop `actions`; apenas os botões passados a ela são alterados. Todos os 11 arquivos seguem o mesmo padrão canônico definido na spec.

**Tech Stack:** React 18, Tailwind CSS 3, shadcn/ui `Button`, lucide-react (`Plus`, `Upload`)

**Spec:** `docs/superpowers/specs/2026-05-28-header-buttons-standardization-design.md`

---

## Padrão canônico (referência rápida)

```jsx
// Botão "Novo X"
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handler}>
  <Plus className="w-4 h-4 mr-2" /> Novo [Nome]
</Button>

// Botão "Importar / Exportar"
<Button size="sm" variant="outline" onClick={() => setShowImportExport(true)}>
  <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
</Button>

// Wrapper quando há 2+ botões
<div className="flex items-center gap-2">
  {/* botões aqui */}
</div>
```

---

## Mapa de arquivos

| Arquivo | O que muda |
|---|---|
| `src/pages/Contratos.jsx` | `size="sm"` + emerald no "Novo Contrato" |
| `src/pages/AdminContratual/Pleitos.jsx` | `size="sm"` + emerald no "Novo Pleito" |
| `src/pages/RiscosMudancas/GestaoMudancas.jsx` | `size="sm"` + emerald no "Nova Mudança" |
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | `size="sm"` + emerald no "Novo Risco" |
| `src/pages/AdminContratual/Medicoes.jsx` | emerald + `size="sm"` no "Nova Medição"; wrapper `flex gap-2` → `flex items-center gap-2` |
| `src/pages/Engenharia/Documentos.jsx` | `size="sm"` em ambos; emerald no "Novo Documento"; `<>` → `<div className="flex items-center gap-2">` |
| `src/pages/Suprimentos/MapaSuprimentos.jsx` | emerald no "Novo Item"; `<>` → `<div className="flex items-center gap-2">` na var `headerActions` |
| `src/pages/Planejamento/SixWLA.jsx` | `size="sm"` + emerald no "Adicionar do Cronograma" |
| `src/pages/Planejamento/Avancos.jsx` | Adicionar `import { Upload } from "lucide-react"`; adicionar ícone + corrigir label |
| `src/pages/Planejamento/TakeOff.jsx` | Trocar `FileSpreadsheet` → `Upload` no JSX e no import |
| `src/pages/Planejamento/Cronograma.jsx` | Adicionar `size="sm"` no botão "Importar / Exportar" |
| `docs/design/DESIGN.md` | Documentar padrão do botão "Novo" no header (seção Tokens de Ação) |

---

## Task 1: Módulos com somente botão "Novo" — Contratos, Pleitos, Mudanças, Riscos

**Files:**
- Modify: `src/pages/Contratos.jsx`
- Modify: `src/pages/AdminContratual/Pleitos.jsx`
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx`
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

As quatro páginas têm exatamente o mesmo problema: botão "Novo" sem `size` e sem cor esmeralda.

- [ ] **Step 1: Editar `src/pages/Contratos.jsx`**

Localizar (em torno da linha 143):
```jsx
<Button onClick={() => { setEditContrato(null); setShowContratoForm(true); }}>
  <Plus className="w-4 h-4 mr-2" />
  Novo Contrato
</Button>
```
Substituir por:
```jsx
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditContrato(null); setShowContratoForm(true); }}>
  <Plus className="w-4 h-4 mr-2" />
  Novo Contrato
</Button>
```

- [ ] **Step 2: Editar `src/pages/AdminContratual/Pleitos.jsx`**

Localizar (em torno da linha 80):
```jsx
<Button onClick={() => { setEditingPleito(null); setShowForm(true); }}>
  <Plus className="w-4 h-4 mr-2" />
  Novo Pleito
</Button>
```
Substituir por:
```jsx
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditingPleito(null); setShowForm(true); }}>
  <Plus className="w-4 h-4 mr-2" />
  Novo Pleito
</Button>
```

- [ ] **Step 3: Editar `src/pages/RiscosMudancas/GestaoMudancas.jsx`**

Localizar (em torno da linha 108):
```jsx
<Button onClick={() => { setEditing(null); setShowForm(true); }}>
  <Plus className="w-4 h-4 mr-2" /> Nova Mudança
</Button>
```
Substituir por:
```jsx
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditing(null); setShowForm(true); }}>
  <Plus className="w-4 h-4 mr-2" /> Nova Mudança
</Button>
```

- [ ] **Step 4: Editar `src/pages/RiscosMudancas/GestaoRiscos.jsx`**

Localizar (em torno da linha 171):
```jsx
<Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
  <Plus className="w-4 h-4 mr-2" /> Novo Risco
</Button>
```
Substituir por:
```jsx
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
  <Plus className="w-4 h-4 mr-2" /> Novo Risco
</Button>
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Contratos.jsx src/pages/AdminContratual/Pleitos.jsx src/pages/RiscosMudancas/GestaoMudancas.jsx src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "style(headers): padronizar botão Novo em Contratos, Pleitos, Mudanças e Riscos"
```

---

## Task 2: Medições — wrapper + emerald no "Nova Medição"

**Files:**
- Modify: `src/pages/AdminContratual/Medicoes.jsx`

- [ ] **Step 1: Editar `src/pages/AdminContratual/Medicoes.jsx`**

Localizar (em torno da linha 118):
```jsx
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
    <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
  </Button>
  <Button onClick={() => { setEditMedicao(null); setShowForm(true); }}>
    <Plus className="w-4 h-4 mr-2" /> Nova Medição
  </Button>
</div>
```
Substituir por:
```jsx
<div className="flex items-center gap-2">
  <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
    <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
  </Button>
  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditMedicao(null); setShowForm(true); }}>
    <Plus className="w-4 h-4 mr-2" /> Nova Medição
  </Button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminContratual/Medicoes.jsx
git commit -m "style(headers): padronizar botões em Medições"
```

---

## Task 3: Documentos — wrapper + size nos dois botões + emerald

**Files:**
- Modify: `src/pages/Engenharia/Documentos.jsx`

- [ ] **Step 1: Editar `src/pages/Engenharia/Documentos.jsx`**

Localizar (em torno da linha 306):
```jsx
<>
  <Button variant="outline" onClick={() => setShowImportExport(true)} disabled={importing}>
    <Upload className="w-4 h-4 mr-2" />{importing ? "Importando..." : "Importar / Exportar"}
  </Button>
  <Button onClick={handleOpenNew}>
    <Plus className="w-4 h-4 mr-2" />Novo Documento
  </Button>
</>
```
Substituir por:
```jsx
<div className="flex items-center gap-2">
  <Button size="sm" variant="outline" onClick={() => setShowImportExport(true)} disabled={importing}>
    <Upload className="w-4 h-4 mr-2" />{importing ? "Importando..." : "Importar / Exportar"}
  </Button>
  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleOpenNew}>
    <Plus className="w-4 h-4 mr-2" />Novo Documento
  </Button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Engenharia/Documentos.jsx
git commit -m "style(headers): padronizar botões em Documentos"
```

---

## Task 4: Mapa de Suprimentos — wrapper + emerald no "Novo Item"

**Files:**
- Modify: `src/pages/Suprimentos/MapaSuprimentos.jsx`

A variável `headerActions` usa `<>...</>` como wrapper. Trocar pelo wrapper padrão e adicionar emerald.

- [ ] **Step 1: Editar `src/pages/Suprimentos/MapaSuprimentos.jsx`**

Localizar a definição da variável `headerActions` (em torno da linha 77):
```jsx
const headerActions = (
  <>
    <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
      <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
    </Button>
    <Button size="sm" onClick={() => setTriggerNew(t => t + 1)}>
      <Plus className="w-4 h-4 mr-1" /> Novo Item
    </Button>
  </>
);
```
Substituir por:
```jsx
const headerActions = (
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
      <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
    </Button>
    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setTriggerNew(t => t + 1)}>
      <Plus className="w-4 h-4 mr-2" /> Novo Item
    </Button>
  </div>
);
```
Nota: também corrigir `mr-1` → `mr-2` no ícone Plus para consistência.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Suprimentos/MapaSuprimentos.jsx
git commit -m "style(headers): padronizar botões em Mapa de Suprimentos"
```

---

## Task 5: 6WLA — size + emerald no "Adicionar do Cronograma"

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx`

- [ ] **Step 1: Editar `src/pages/Planejamento/SixWLA.jsx`**

Localizar (em torno da linha 188):
```jsx
<Button onClick={() => setShowModal(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Adicionar do Cronograma
</Button>
```
Substituir por:
```jsx
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowModal(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Adicionar do Cronograma
</Button>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "style(headers): padronizar botão em 6WLA"
```

---

## Task 6: Avanços — adicionar import Upload + ícone + corrigir label

**Files:**
- Modify: `src/pages/Planejamento/Avancos.jsx`

Avanços não tem nenhum import de `lucide-react`. É necessário adicionar o import antes de usar o ícone.

- [ ] **Step 1: Adicionar import de `Upload` em `src/pages/Planejamento/Avancos.jsx`**

Localizar o bloco de imports no topo do arquivo. Após o último import existente (em torno da linha 17), adicionar:
```jsx
import { Upload } from "lucide-react";
```

- [ ] **Step 2: Corrigir o botão "Importar / Exportar"**

Localizar (em torno da linha 231):
```jsx
<Button size="sm" variant="outline" onClick={() => setShowImportExport(true)}>
  Import/Export
</Button>
```
Substituir por:
```jsx
<Button size="sm" variant="outline" onClick={() => setShowImportExport(true)}>
  <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
</Button>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Planejamento/Avancos.jsx
git commit -m "style(headers): corrigir label e ícone do botão Importar em Avanços"
```

---

## Task 7: Take-Off — trocar ícone FileSpreadsheet → Upload

**Files:**
- Modify: `src/pages/Planejamento/TakeOff.jsx`

- [ ] **Step 1: Trocar ícone no import de lucide-react em `src/pages/Planejamento/TakeOff.jsx`**

Localizar (linha 2):
```jsx
import { Ruler, FileSpreadsheet } from "lucide-react";
```
Substituir por:
```jsx
import { Ruler, Upload } from "lucide-react";
```

- [ ] **Step 2: Trocar ícone no JSX**

Localizar (em torno da linha 32):
```jsx
<Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
  <FileSpreadsheet className="w-4 h-4 mr-2" />
  Importar / Exportar
</Button>
```
Substituir por:
```jsx
<Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
  <Upload className="w-4 h-4 mr-2" />
  Importar / Exportar
</Button>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Planejamento/TakeOff.jsx
git commit -m "style(headers): trocar ícone FileSpreadsheet → Upload em Take-Off"
```

---

## Task 8: Cronograma — adicionar size="sm" no botão Importar

**Files:**
- Modify: `src/pages/Planejamento/Cronograma.jsx`

Os toggles de 6WLA e Baseline já têm `size="sm"`. Apenas o botão "Importar / Exportar" está sem.

- [ ] **Step 1: Editar `src/pages/Planejamento/Cronograma.jsx`**

Localizar (em torno da linha 157):
```jsx
<Button variant="outline" onClick={() => setShowImportExport(true)}>
  <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
</Button>
```
Substituir por:
```jsx
<Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
  <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
</Button>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Planejamento/Cronograma.jsx
git commit -m "style(headers): adicionar size=sm no botão Importar do Cronograma"
```

---

## Task 9: Atualizar DESIGN.md — documentar padrão do botão "Novo" no header

**Files:**
- Modify: `docs/design/DESIGN.md`

A seção "Tokens de Ação" atual só descreve Salvar/Cancelar/Excluir em formulários. Adicionar a linha do botão "Novo" no header.

- [ ] **Step 1: Editar `docs/design/DESIGN.md`**

Localizar a tabela "Tokens de Ação" (seção 4):
```markdown
| Contexto | Cor | Classe Tailwind | Hex |
|----------|-----|-----------------|-----|
| **Botão Salvar** (padrão em todos os módulos) | Verde Esmeralda | `bg-emerald-600 hover:bg-emerald-700` | `#059669` |
| Botão Cancelar / Secundário | Cinza | `bg-slate-200 hover:bg-slate-300 text-slate-700` | — |
| Botão Destrutivo (Excluir) | Vermelho | `bg-red-600 hover:bg-red-700` | `#dc2626` |
```
Substituir por:
```markdown
| Contexto | Cor | Classe Tailwind | Hex |
|----------|-----|-----------------|-----|
| **Botão "Novo X"** (CTA de criação no PageHeader) | Verde Esmeralda | `bg-emerald-600 hover:bg-emerald-700 text-white` + `size="sm"` | `#059669` |
| **Botão Salvar** (em formulários) | Verde Esmeralda | `bg-emerald-600 hover:bg-emerald-700` | `#059669` |
| **Botão "Importar / Exportar"** (no PageHeader) | Outline | `variant="outline"` + `size="sm"` + ícone `Upload` | — |
| Botão Cancelar / Secundário | Cinza | `bg-slate-200 hover:bg-slate-300 text-slate-700` | — |
| Botão Destrutivo (Excluir) | Vermelho | `bg-red-600 hover:bg-red-700` | `#dc2626` |
```

- [ ] **Step 2: Commit**

```bash
git add docs/design/DESIGN.md
git commit -m "docs(design): documentar padrão dos botões de ação no PageHeader"
```

---

## Task 10: Verificação visual

- [ ] **Step 1: Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```
Servidor deve iniciar em `http://localhost:5173` (ou porta indicada no terminal).

- [ ] **Step 2: Verificar cada módulo no browser**

Para cada rota abaixo, confirmar visualmente:
- Botões "Novo X" estão em **verde esmeralda** e tamanho `sm`
- Botões "Importar / Exportar" estão em **outline** com ícone de seta-para-cima, tamanho `sm`
- Todos os botões têm **a mesma altura** na mesma linha

| Rota | O que verificar |
|---|---|
| `/contratos` | "Novo Contrato" verde, sm |
| `/admin-contratual/pleitos` | "Novo Pleito" verde, sm |
| `/admin-contratual/medicoes` | Ambos sm; "Nova Medição" verde |
| `/riscos-mudancas/gestao-mudancas` | "Nova Mudança" verde, sm |
| `/riscos-mudancas/gestao-riscos` | "Novo Risco" verde, sm |
| `/engenharia/documentos` | Ambos sm; "Novo Documento" verde |
| `/suprimentos/mapa-suprimentos` | Ambos sm; "Novo Item" verde |
| `/planejamento/6wla` | "Adicionar do Cronograma" verde, sm |
| `/planejamento/avanco` | "Importar / Exportar" com ícone Upload, sm |
| `/planejamento/take-off` | "Importar / Exportar" com ícone Upload (não FileSpreadsheet), sm |
| `/planejamento/cronograma` | Todos os botões com mesma altura (toggles + Importar) |

- [ ] **Step 3: Confirmar ausência de erros no console do browser**

Abrir DevTools → Console. Não deve haver nenhum erro de React ou import não resolvido.
