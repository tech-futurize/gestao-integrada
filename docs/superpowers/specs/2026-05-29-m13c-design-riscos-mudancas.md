# Spec: M13-C — Design Riscos e Mudanças

**Data:** 2026-05-29
**Milestone:** M13
**Agente:** Designer
**Status:** Aprovado

---

## Escopo

Quatro entregas visuais independentes nos módulos Gestão de Riscos e Gestão de Mudanças:

1. Cards quantitativos por categoria — Gestão de Riscos
2. Títulos de seção no formulário modal — Gestão de Riscos
3. Cards KPI com breakdown +/− — Gestão de Mudanças (DashboardExecutivo)
4. Padronização dos botões Salvar/Criar como verde

Nenhuma alteração de lógica de negócio, queries ou schema.

---

## 1. Cards por Categoria — Gestão de Riscos

**Arquivo:** `src/pages/RiscosMudancas/GestaoRiscos.jsx`

**Posição:** Nova linha entre os 4 KPI cards existentes e a Matriz 5×5.

### Layout

```
[Título "Por Categoria"]
┌────────────┐ ┌────────────┐ ┌────────────┐  ... (7 cards)
│▌ Técnico   │ │▌ Financeiro│ │▌ Prazo     │
│   3        │ │   1        │ │   0        │
└────────────┘ └────────────┘ └────────────┘
```

### Especificações

- Grid: `grid-cols-4 md:grid-cols-7 gap-3`
- Card base: `bg-card rounded-xl border border-border p-3`
- Borda colorida esquerda: `border-l-4` usando `CAT_COLORS[categoria]` de `riscosUtils.js`
- Valor: `text-2xl font-bold` com cor de `CAT_COLORS[categoria]`
- Label: `text-xs text-muted-foreground`
- Título de seção acima: `text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3` com texto "Por Categoria"
- Mostra **todas as 7 categorias** sempre, inclusive com valor `0`

### Dados

```js
// Adicionado ao objeto kpi existente
porCategoria: CATEGORIAS.map(cat => ({
  cat,
  count: riscos.filter(r => r.categoria === cat).length,
}))
```

### Categorias e cores (de riscosUtils.js)

| Categoria   | Cor hex   |
|-------------|-----------|
| Técnico     | `#3b82f6` |
| Financeiro  | `#f59e0b` |
| Prazo       | `#c35e1e` |
| Segurança   | `#ef4444` |
| Regulatório | `#8b5cf6` |
| Ambiental   | `#10b981` |
| Outros      | `#6b7280` |

---

## 2. Títulos de Seção no Formulário Modal — Gestão de Riscos

**Arquivo:** `src/pages/RiscosMudancas/GestaoRiscos.jsx`

### Estrutura do Dialog após a mudança

```
┌─── Dialog: Novo Risco / Editar Risco ────────────────┐
│                                                        │
│  ── IDENTIFICAÇÃO ─────────────────────────────────  │
│  [Código]         [Categoria]                          │
│  [Descrição *]                                         │
│                                                        │
│  ── AVALIAÇÃO ──────────────────────────────────────  │
│  [Probabilidade]  [Impacto]                            │
│  [Score calculado: N]                                  │
│  [Status]         [Responsável]                        │
│  [Plano de Resposta]                                   │
│                                                        │
│  ── IMPACTOS NO PROJETO ────────────────────────────  │
│  [Dimensões: ☑ Escopo  ☑ Prazo  ☑ Valor]             │
│  [Campos condicionais: Escopo texto / Prazo / Valor]   │
│                                                        │
│  [Excluir]   [Cancelar]   [Salvar / Criar]             │
└────────────────────────────────────────────────────────┘
```

### Implementação dos separadores

Inserir elemento `col-span-2` antes de cada grupo:

```jsx
<div className="col-span-2 border-t border-border pt-3 mt-1">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
    Identificação
  </p>
</div>
```

### Três separadores

| Título             | Posição no grid (antes de)             |
|--------------------|----------------------------------------|
| Identificação      | Antes do campo Código (primeiro campo) |
| Avaliação          | Antes do campo Probabilidade           |
| Impactos no Projeto| Antes das Dimensões de Impacto         |

Nenhum campo é movido ou removido — apenas os separadores são inseridos.

---

## 3. Cards KPI com Breakdown +/− — DashboardExecutivo

**Arquivo:** `src/components/mudancas/DashboardExecutivo.jsx`

Os 3 KPI cards existentes são reformulados para exibir total líquido + breakdown positivo/negativo.

### Estrutura visual de cada card

```
┌─────────────────────────────────────────────────┐
│  🕐  DESVIO DE PRAZO                            │
│                                                   │
│      +12 dias  (total líquido)                    │
│      Mudanças em andamento                        │
│                                                   │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  +18d atrasos        −6d antecipações             │
└─────────────────────────────────────────────────┘
```

### Card 1 — Desvio de Prazo

| Elemento    | Valor / Cálculo |
|-------------|-----------------|
| Total líquido | `Σ impacto_prazo_dias` (todos os registros) |
| Sub-positivo  | `Σ impacto_prazo_dias onde > 0` → `"+Xd atrasos"` em `text-red-500` |
| Sub-negativo  | `Σ impacto_prazo_dias onde < 0` → `"−Xd antecipações"` em `text-green-600` |

### Card 2 — Adição/Redução de Valor

| Elemento    | Valor / Cálculo |
|-------------|-----------------|
| Total líquido | `Σ impacto_custo` formatado em R$ |
| Sub-positivo  | `Σ impacto_custo onde > 0` → `"+R$X adições"` em `text-red-500` |
| Sub-negativo  | `Σ impacto_custo onde < 0` → `"−R$X reduções"` em `text-green-600` |

### Card 3 — Adição/Redução de Escopo

| Elemento    | Valor / Cálculo |
|-------------|-----------------|
| Total        | `count de mudancas com categorias.includes("Escopo")` |
| Sub-adições  | `count onde impacto_escopo_tipo === "Adição"` → `"X adições"` em `text-blue-600` |
| Sub-reduções | `count onde impacto_escopo_tipo === "Redução"` → `"X reduções"` em `text-amber-600` |

### Sub-row markup

```jsx
<div className="flex gap-3 mt-2 pt-2 border-t border-border/50">
  <span className="text-xs font-semibold text-red-500">+18d atrasos</span>
  <span className="text-xs font-semibold text-green-600">−6d antecipações</span>
</div>
```

---

## 4. Padronização dos Botões Salvar/Criar

### Arquivos afetados

| Arquivo | Localização | Texto do botão | Antes | Depois |
|---|---|---|---|---|
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | `DialogFooter` | "Salvar" / "Criar" | `variant="save"` | `className="bg-green-600 hover:bg-green-700 text-white"` |
| `src/components/mudancas/MudancaForm.jsx` | `div justify-end` | "Salvar Mudança" | `variant="save"` | `className="bg-green-600 hover:bg-green-700 text-white"` |

`variant="save"` é removido desses dois botões; os demais atributos (`onClick`, `disabled`, `type`) permanecem inalterados.

---

## Arquivos Modificados

| Arquivo | Tipo de mudança |
|---|---|
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | Cards categoria + títulos modal + botão verde |
| `src/components/mudancas/DashboardExecutivo.jsx` | Cards KPI com breakdown +/− |
| `src/components/mudancas/MudancaForm.jsx` | Botão verde |

---

## Restrições

- Sem alteração de tipos, queries, mutations ou schema
- Sem novos componentes — toda implementação em JSX inline nos arquivos existentes
- `CAT_COLORS` e `CATEGORIAS_RISCO` de `riscosUtils.js` não são importados em `GestaoRiscos.jsx` (já redefinidos localmente) — usar as constantes locais já existentes
- Sem TypeScript, sem imports novos de libs externas
