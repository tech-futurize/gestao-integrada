# Padronização Botões + Novo / + Adicionar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar todos os botões de criação de registro para verde (`bg-emerald-600 hover:bg-emerald-700 text-white`), e links-texto de adição inline para (`text-emerald-600 hover:text-emerald-700`).

**Architecture:** Correção direta de classes Tailwind em 7 arquivos. Nenhuma lógica de negócio ou estado é alterada — apenas atributos `className`/`variant` dos elementos `<Button>` e `<button>`. Segue o padrão dominante já existente no sistema.

**Tech Stack:** React JSX, Tailwind CSS 3.x, shadcn Button component (`src/components/ui/button.jsx`).

---

## Arquivos modificados

- Modify: `src/components/planejamento/TakeOffCommodities.jsx` linha 654
- Modify: `src/components/riscos/PlanoAcao.jsx` linhas 156-159
- Modify: `src/components/planejamento/PqpEditor.jsx` linha 126
- Modify: `src/components/histograma/HistogramaTabela.jsx` linha 408
- Modify: `src/components/engenharia/DocDetalhe.jsx` linha 132
- Modify: `src/components/agentes/ToolEditor.jsx` linha 159
- Modify: `src/components/rdo/RDOForm.jsx` linhas 394, 433, 521

---

## Task 1: TakeOffCommodities — Botão "Novo Item"

**Files:**
- Modify: `src/components/planejamento/TakeOffCommodities.jsx` linha 654

- [ ] **Step 1: Verificar estado atual**

```bash
grep -n "Novo Item\|setShowItemModal" src/components/planejamento/TakeOffCommodities.jsx | grep Button
```
Esperado: linha 654 com `<Button onClick=...>` sem className verde.

- [ ] **Step 2: Aplicar mudança**

Em `src/components/planejamento/TakeOffCommodities.jsx`, linha 654, trocar:
```jsx
<Button onClick={() => { setEditingItem(null); setShowItemModal(true); }}>
```
por:
```jsx
<Button onClick={() => { setEditingItem(null); setShowItemModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
```

- [ ] **Step 3: Verificar mudança**

```bash
grep -n "Novo Item" src/components/planejamento/TakeOffCommodities.jsx
```
Esperado: linha 654/655 contendo `bg-emerald-600`.

- [ ] **Step 4: Commit**

```bash
git add src/components/planejamento/TakeOffCommodities.jsx
git commit -m "fix(design): botão Novo Item verde em TakeOffCommodities"
```

---

## Task 2: PlanoAcao — Botão "Nova Ação"

**Files:**
- Modify: `src/components/riscos/PlanoAcao.jsx` linhas 156-159

- [ ] **Step 1: Verificar estado atual**

```bash
grep -n "Nova Ação\|size=\"sm\"" src/components/riscos/PlanoAcao.jsx | head -5
```
Esperado: `<Button` sem className verde nas linhas 156-159.

- [ ] **Step 2: Aplicar mudança**

Em `src/components/riscos/PlanoAcao.jsx`, linhas 156-159, trocar:
```jsx
<Button
  onClick={() => { setEditingAcao(null); setFormData(emptyForm); setVinculoTipo("risco"); setShowForm(true); }}
  size="sm"
>
```
por:
```jsx
<Button
  onClick={() => { setEditingAcao(null); setFormData(emptyForm); setVinculoTipo("risco"); setShowForm(true); }}
  size="sm"
  className="bg-emerald-600 hover:bg-emerald-700 text-white"
>
```

- [ ] **Step 3: Verificar mudança**

```bash
grep -n "bg-emerald-600" src/components/riscos/PlanoAcao.jsx
```
Esperado: linha ~158 com `bg-emerald-600`.

- [ ] **Step 4: Commit**

```bash
git add src/components/riscos/PlanoAcao.jsx
git commit -m "fix(design): botão Nova Ação verde em PlanoAcao"
```

---

## Task 3: PqpEditor — Botão "Adicionar item"

**Files:**
- Modify: `src/components/planejamento/PqpEditor.jsx` linha 126

- [ ] **Step 1: Verificar estado atual**

```bash
grep -n "Adicionar item\|variant=\"outline\"" src/components/planejamento/PqpEditor.jsx | head -5
```
Esperado: linha 126 com `variant="outline"`.

- [ ] **Step 2: Aplicar mudança**

Em `src/components/planejamento/PqpEditor.jsx`, linha 126, trocar:
```jsx
<Button type="button" size="sm" variant="outline" onClick={addItemRaiz}>
```
por:
```jsx
<Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={addItemRaiz}>
```

- [ ] **Step 3: Verificar mudança**

```bash
grep -n "addItemRaiz" src/components/planejamento/PqpEditor.jsx
```
Esperado: linha com `bg-emerald-600` e sem `variant="outline"`.

- [ ] **Step 4: Commit**

```bash
git add src/components/planejamento/PqpEditor.jsx
git commit -m "fix(design): botão Adicionar item verde em PqpEditor"
```

---

## Task 4: HistogramaTabela — Botão add função/equipamento

**Files:**
- Modify: `src/components/histograma/HistogramaTabela.jsx` linha 408

- [ ] **Step 1: Verificar estado atual**

```bash
grep -n "setShowNovoDialog\|variant=\"outline\"" src/components/histograma/HistogramaTabela.jsx | head -5
```
Esperado: linha 408 com `variant="outline"`.

- [ ] **Step 2: Aplicar mudança**

Em `src/components/histograma/HistogramaTabela.jsx`, linha 408, trocar:
```jsx
<Button size="sm" variant="outline" onClick={() => setShowNovoDialog(true)}>
```
por:
```jsx
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowNovoDialog(true)}>
```

- [ ] **Step 3: Verificar mudança**

```bash
grep -n "setShowNovoDialog" src/components/histograma/HistogramaTabela.jsx | head -3
```
Esperado: linha 408 com `bg-emerald-600` e sem `variant="outline"`.

- [ ] **Step 4: Commit**

```bash
git add src/components/histograma/HistogramaTabela.jsx
git commit -m "fix(design): botão add função/equipamento verde em HistogramaTabela"
```

---

## Task 5: DocDetalhe — Botão "+ Nova Revisão"

**Files:**
- Modify: `src/components/engenharia/DocDetalhe.jsx` linha 132

- [ ] **Step 1: Verificar estado atual**

```bash
grep -n "Nova Revisão\|setShowRevModal" src/components/engenharia/DocDetalhe.jsx | head -5
```
Esperado: linha 132 com `variant="outline"`.

- [ ] **Step 2: Aplicar mudança**

Em `src/components/engenharia/DocDetalhe.jsx`, linha 132, trocar:
```jsx
<Button size="sm" variant="outline" onClick={() => setShowRevModal(true)}>+ Nova Revisão</Button>
```
por:
```jsx
<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowRevModal(true)}>+ Nova Revisão</Button>
```

- [ ] **Step 3: Verificar mudança**

```bash
grep -n "Nova Revisão" src/components/engenharia/DocDetalhe.jsx
```
Esperado: linha 132 com `bg-emerald-600` e sem `variant="outline"`.

- [ ] **Step 4: Commit**

```bash
git add src/components/engenharia/DocDetalhe.jsx
git commit -m "fix(design): botão Nova Revisão verde em DocDetalhe"
```

---

## Task 6: ToolEditor — Botão "Adicionar" parâmetro

**Files:**
- Modify: `src/components/agentes/ToolEditor.jsx` linha 159

- [ ] **Step 1: Verificar estado atual**

```bash
grep -n "addParam\|variant=\"outline\"" src/components/agentes/ToolEditor.jsx | head -5
```
Esperado: linha 159 com `variant="outline"`.

- [ ] **Step 2: Aplicar mudança**

Em `src/components/agentes/ToolEditor.jsx`, linha 159, trocar:
```jsx
<Button type="button" variant="outline" size="sm" onClick={addParam}>
```
por:
```jsx
<Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={addParam}>
```

- [ ] **Step 3: Verificar mudança**

```bash
grep -n "addParam" src/components/agentes/ToolEditor.jsx
```
Esperado: linha com `bg-emerald-600` e sem `variant="outline"`.

- [ ] **Step 4: Commit**

```bash
git add src/components/agentes/ToolEditor.jsx
git commit -m "fix(design): botão Adicionar parâmetro verde em ToolEditor"
```

---

## Task 7: RDOForm — Links-texto inline de adição

**Files:**
- Modify: `src/components/rdo/RDOForm.jsx` linhas 394, 433, 521

- [ ] **Step 1: Verificar estado atual**

```bash
grep -n "text-blue-600" src/components/rdo/RDOForm.jsx
```
Esperado: 3 linhas (394, 433, 521) com `text-blue-600 hover:underline`.

- [ ] **Step 2: Aplicar mudança na linha 394**

Em `src/components/rdo/RDOForm.jsx`, linha 394, trocar:
```jsx
<button type="button" onClick={addMdo} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
```
por:
```jsx
<button type="button" onClick={addMdo} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1">
```

- [ ] **Step 3: Aplicar mudança na linha 433**

Em `src/components/rdo/RDOForm.jsx`, linha 433, trocar:
```jsx
<button type="button" onClick={addEquip} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
```
por:
```jsx
<button type="button" onClick={addEquip} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1">
```

- [ ] **Step 4: Aplicar mudança na linha 521**

Em `src/components/rdo/RDOForm.jsx`, linhas 521-522, trocar:
```jsx
<button onClick={addOcorrencia}
  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
```
por:
```jsx
<button onClick={addOcorrencia}
  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
```

- [ ] **Step 5: Verificar mudanças**

```bash
grep -n "text-blue-600\|text-emerald-600" src/components/rdo/RDOForm.jsx
```
Esperado: 0 linhas com `text-blue-600`, 3 linhas com `text-emerald-600`.

- [ ] **Step 6: Commit**

```bash
git add src/components/rdo/RDOForm.jsx
git commit -m "fix(design): links Adicionar função/equipamento/Ocorrência verdes em RDOForm"
```
