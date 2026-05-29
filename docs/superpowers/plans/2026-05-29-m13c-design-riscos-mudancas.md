# M13-C Design Riscos e Mudanças — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar cards quantitativos por categoria na Gestão de Riscos, títulos de seção no modal de risco, reformular os KPI cards da Gestão de Mudanças com breakdown +/− e padronizar botões Salvar/Criar como verde (`bg-green-600`).

**Architecture:** Três arquivos modificados, zero mudanças de lógica de negócio. As alterações são puramente visuais/markup: novos elementos JSX inseridos em posições precisas dos arquivos existentes. Nenhum novo componente, nenhuma nova query, nenhum novo hook.

**Tech Stack:** React 18 + JSX, Tailwind CSS 3.x, constantes locais existentes (`CAT_COLORS`, `CATEGORIAS`), `useMemo` já em uso nos dois módulos.

---

## Mapa de Arquivos

| Arquivo | O que muda |
|---|---|
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | 1) Nova seção de cards por categoria. 2) 3 separadores de seção no Dialog. 3) Botão Salvar/Criar verde. |
| `src/components/mudancas/DashboardExecutivo.jsx` | KpiCard recebe prop `breakdown`; novos `useMemo` para +/−; 3 chamadas KpiCard atualizadas. |
| `src/components/mudancas/MudancaForm.jsx` | Botão "Salvar Mudança": `variant="save"` → `className="bg-green-600 ..."`. |

---

## Task 1 — Cards por Categoria (GestaoRiscos.jsx)

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

### Contexto

O arquivo já tem as constantes locais `CATEGORIAS` (array de 7 strings) e `CAT_COLORS` (objeto com cor hex por categoria). O objeto `kpi` já é calculado com `useMemo`. A seção de KPIs está em torno das linhas 243–255 e a Matriz 5×5 começa com `<Card className="border-0 shadow-sm">` logo depois.

- [ ] **Step 1: Localizar o ponto de inserção no JSX**

No `GestaoRiscos.jsx`, encontrar a linha que abre o Card da Matriz 5×5:
```jsx
{/* Matriz 5×5 */}
<Card className="border-0 shadow-sm">
```
Os cards de categoria serão inseridos **entre** o bloco de KPIs e este Card.

- [ ] **Step 2: Inserir a seção de cards por categoria**

Adicionar imediatamente antes de `{/* Matriz 5×5 */}`:

```jsx
{/* Cards por Categoria */}
<div>
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Categoria</p>
  <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
    {CATEGORIAS.map(cat => {
      const count = riscos.filter(r => r.categoria === cat).length;
      const color = CAT_COLORS[cat];
      return (
        <div
          key={cat}
          className="bg-card rounded-xl border border-border border-l-4 p-3"
          style={{ borderLeftColor: color }}
        >
          <p className="text-xs text-muted-foreground">{cat}</p>
          <p className="text-2xl font-bold" style={{ color }}>{count}</p>
        </div>
      );
    })}
  </div>
</div>
```

- [ ] **Step 3: Verificar visualmente**

Rodar o dev server (`npm run dev`) e navegar para Gestão de Riscos. Checar:
- 7 cards aparecem em linha após os 4 KPIs
- Cada card tem borda esquerda colorida correspondente à categoria
- Todos mostram contagem (inclusive `0` para categorias sem riscos)
- Em mobile (≤768px) os cards ficam em 4 colunas; em desktop ficam em 7

---

## Task 2 — Títulos de Seção no Modal de Risco (GestaoRiscos.jsx)

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

### Contexto

O Dialog de criação/edição de risco tem um `<div className="grid grid-cols-2 gap-4 py-2">` com todos os campos sem separação visual. Os campos, na ordem atual:
1. Código (col-1) + Categoria (col-2)
2. Descrição * (col-span-2)
3. Probabilidade (col-1) + Impacto (col-2)
4. Score preview (col-span-2)
5. Status (col-1) + Responsável (col-2)
6. Plano de Resposta (col-span-2)
7. Dimensões de Impacto (col-span-2)
8. Campos condicionais de Escopo/Prazo/Valor

- [ ] **Step 1: Adicionar separador "IDENTIFICAÇÃO" como primeiro filho do grid**

Inserir como **primeiro elemento** dentro de `<div className="grid grid-cols-2 gap-4 py-2">`, antes do campo Código:

```jsx
<div className="col-span-2 pb-1">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identificação</p>
</div>
```

- [ ] **Step 2: Adicionar separador "AVALIAÇÃO" antes do campo Probabilidade**

Inserir antes de `<div className="space-y-1"><Label>Probabilidade (1-5)</Label>`:

```jsx
<div className="col-span-2 border-t border-border pt-3 mt-1">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avaliação</p>
</div>
```

- [ ] **Step 3: Adicionar separador "IMPACTOS NO PROJETO" antes das Dimensões**

Inserir antes de `<div className="space-y-2 col-span-2"><Label>Dimensões de Impacto</Label>`:

```jsx
<div className="col-span-2 border-t border-border pt-3 mt-1">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Impactos no Projeto</p>
</div>
```

- [ ] **Step 4: Verificar visualmente**

Abrir o modal "Novo Risco" e checar:
- Título "Identificação" aparece no topo do formulário, sem borda acima
- Linha divisória + título "Avaliação" antes dos campos Probabilidade/Impacto
- Linha divisória + título "Impactos no Projeto" antes dos checkboxes de dimensão
- Nenhum campo foi movido ou removido

---

## Task 3 — Botão Verde (GestaoRiscos.jsx)

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

### Contexto

No `DialogFooter`, o botão de submit usa `variant="save"` que mapeia para o token CSS `--action-save` (verde teal customizado). A tarefa exige `bg-green-600`.

- [ ] **Step 1: Substituir variant="save" no botão do DialogFooter**

Localizar (aproximadamente linha 481):
```jsx
<Button variant="save" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
  {editing ? "Salvar" : "Criar"}
</Button>
```

Substituir por:
```jsx
<Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
  {editing ? "Salvar" : "Criar"}
</Button>
```

- [ ] **Step 2: Verificar visualmente**

Abrir o modal de Novo Risco e checar:
- Botão "Criar" é verde (`#16a34a`)
- Ao editar um risco, botão exibe "Salvar" com a mesma cor
- Estado `disabled` (durante submit) reduz opacidade normalmente

- [ ] **Step 3: Commit das Tasks 1, 2 e 3**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "feat(riscos): cards por categoria, títulos no modal e botão verde"
```

---

## Task 4 — Cards KPI com Breakdown +/− (DashboardExecutivo.jsx)

**Files:**
- Modify: `src/components/mudancas/DashboardExecutivo.jsx`

### Contexto

O componente já tem:
- `totalPrazo` = `Σ impacto_prazo_dias`
- `totalCusto` = `Σ impacto_custo`
- `totalEscopo` = count de mudanças com `categorias.includes("Escopo")`
- `KpiCard` — componente local com props `{ icon, label, value, sub, color }`

A tarefa exige adicionar uma sub-row de +/− em cada card. A abordagem é: adicionar prop `breakdown` ao `KpiCard` (opcional — não quebra chamadas existentes), adicionar 6 novos `useMemo` para os subtotais, e atualizar as 3 chamadas de `KpiCard`.

- [ ] **Step 1: Adicionar prop `breakdown` ao KpiCard**

Substituir a definição atual de `KpiCard`:

```jsx
function KpiCard({ icon: Icon, label, value, sub, color, breakdown }) {
  return (
    <Card className="flex-1">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          {breakdown && (
            <div className="flex gap-3 mt-2 pt-2 border-t border-border/50">
              <span className={`text-xs font-semibold ${breakdown.posColor}`}>{breakdown.posLabel}</span>
              <span className={`text-xs font-semibold ${breakdown.negColor}`}>{breakdown.negLabel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

A única diferença em relação ao original: `<div className="flex-1">` envolvendo o conteúdo textual, e o bloco `{breakdown && ...}` no final.

- [ ] **Step 2: Adicionar os 6 useMemo de subtotais**

Adicionar após os `useMemo` já existentes (`totalPrazo`, `totalCusto`, `totalEscopo`, `pctPrazo`, `pctCusto`):

```jsx
const totalPrazoPos = useMemo(() =>
  mudancas.reduce((s, m) => (m.impacto_prazo_dias || 0) > 0 ? s + (m.impacto_prazo_dias || 0) : s, 0),
[mudancas]);

const totalPrazoNeg = useMemo(() =>
  mudancas.reduce((s, m) => (m.impacto_prazo_dias || 0) < 0 ? s + (m.impacto_prazo_dias || 0) : s, 0),
[mudancas]);

const totalCustoPos = useMemo(() =>
  mudancas.reduce((s, m) => (m.impacto_custo || 0) > 0 ? s + (m.impacto_custo || 0) : s, 0),
[mudancas]);

const totalCustoNeg = useMemo(() =>
  mudancas.reduce((s, m) => (m.impacto_custo || 0) < 0 ? s + (m.impacto_custo || 0) : s, 0),
[mudancas]);

const escopoAdicoes = useMemo(() =>
  mudancas.filter(m => m.impacto_escopo_tipo === "Adição").length,
[mudancas]);

const escopoReducoes = useMemo(() =>
  mudancas.filter(m => m.impacto_escopo_tipo === "Redução").length,
[mudancas]);
```

- [ ] **Step 3: Atualizar as 3 chamadas de KpiCard no JSX**

Substituir o bloco `<div className="flex flex-col md:flex-row gap-4">` inteiro por:

```jsx
<div className="flex flex-col md:flex-row gap-4">
  <KpiCard
    icon={Clock}
    label="Desvio de Prazo"
    value={`${totalPrazo > 0 ? "+" : ""}${totalPrazo} dias`}
    sub={pctPrazo ? `${pctPrazo}% do prazo do projeto` : "Projeto sem datas definidas"}
    color="#c35e1e"
    breakdown={{
      posLabel: `+${totalPrazoPos}d atrasos`,
      posColor: "text-red-500",
      negLabel: `${totalPrazoNeg}d antecipações`,
      negColor: "text-green-600",
    }}
  />
  <KpiCard
    icon={DollarSign}
    label="Adição/Redução de Valor"
    value={`R$ ${totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
    sub={pctCusto ? `${pctCusto}% do valor do contrato` : "Projeto sem valor definido"}
    color="#26405d"
    breakdown={{
      posLabel: `+R$${totalCustoPos.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} adições`,
      posColor: "text-red-500",
      negLabel: `-R$${Math.abs(totalCustoNeg).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} reduções`,
      negColor: "text-green-600",
    }}
  />
  <KpiCard
    icon={Layers}
    label="Adição/Redução de Escopo"
    value={totalEscopo}
    sub={`de ${mudancas.length} mudança(s) total`}
    color="#00a49a"
    breakdown={{
      posLabel: `${escopoAdicoes} adições`,
      posColor: "text-blue-600",
      negLabel: `${escopoReducoes} reduções`,
      negColor: "text-amber-600",
    }}
  />
</div>
```

- [ ] **Step 4: Verificar visualmente**

Navegar para Gestão de Mudanças com ao menos 2 mudanças registradas (uma com prazo/custo positivo, outra negativo). Checar:
- Cada card exibe o total líquido no topo
- Sub-row aparece abaixo com linha divisória sutil
- Valores positivos em vermelho (`text-red-500`), negativos em verde (`text-green-600`)
- Card de Escopo mostra adições em azul (`text-blue-600`) e reduções em âmbar (`text-amber-600`)
- Se não há dados: `0d atrasos` e `0d antecipações` aparecem sem erro

- [ ] **Step 5: Commit**

```bash
git add src/components/mudancas/DashboardExecutivo.jsx
git commit -m "feat(mudancas): cards KPI com breakdown positivo/negativo"
```

---

## Task 5 — Botão Verde (MudancaForm.jsx)

**Files:**
- Modify: `src/components/mudancas/MudancaForm.jsx`

### Contexto

O botão de submit está na linha ~214 dentro de `<div className="flex justify-end gap-3 pt-4 border-t">`.

- [ ] **Step 1: Substituir variant="save" no botão de submit**

Localizar:
```jsx
<Button type="submit" variant="save" disabled={isSubmitting}>
  {isSubmitting ? "Salvando..." : "Salvar Mudança"}
</Button>
```

Substituir por:
```jsx
<Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>
  {isSubmitting ? "Salvando..." : "Salvar Mudança"}
</Button>
```

- [ ] **Step 2: Verificar visualmente**

Abrir o formulário de Nova Mudança e checar:
- Botão "Salvar Mudança" é verde (`#16a34a`)
- Ao submeter, exibe "Salvando..." com a mesma cor e opacidade reduzida

- [ ] **Step 3: Commit**

```bash
git add src/components/mudancas/MudancaForm.jsx
git commit -m "feat(mudancas): padronizar botão salvar como verde bg-green-600"
```

---

## Checklist de Verificação Final

Antes de considerar M13-C concluído:

- [ ] Gestão de Riscos: 7 cards por categoria visíveis, com borda esquerda colorida
- [ ] Gestão de Riscos: Modal com 3 títulos de seção (Identificação / Avaliação / Impactos no Projeto)
- [ ] Gestão de Riscos: Botão "Criar"/"Salvar" é `bg-green-600`
- [ ] Gestão de Mudanças: Cards KPI mostram breakdown +/− com cores corretas
- [ ] Gestão de Mudanças: Botão "Salvar Mudança" é `bg-green-600`
- [ ] Nenhum erro de console
- [ ] Nenhuma alteração em queries, mutations ou schema
