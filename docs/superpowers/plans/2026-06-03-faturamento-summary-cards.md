# Faturamento Summary Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um painel de 7 cards de resumo na tela de Faturamento, abaixo dos filtros, cujos valores refletem os dados filtrados.

**Architecture:** A lógica de cálculo é extraída em uma função pura (`calcFaturamentoSummary`) testável em Vitest (ambiente node). O componente visual `FaturamentoSummary` consome essa função. `Faturamento.jsx` passa `filtrados` e `valorContrato` como props.

**Tech Stack:** React 18, JavaScript (JSX), Tailwind CSS, shadcn/ui (Card/CardContent), lucide-react, Vitest.

---

## Mapa de arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/utils/faturamentoSummary.js` — função pura de cálculo |
| Criar | `src/utils/faturamentoSummary.test.js` — testes Vitest |
| Criar | `src/components/planejamento/FaturamentoSummary.jsx` — componente visual |
| Modificar | `src/pages/Planejamento/Faturamento.jsx` — importar e renderizar o componente |

---

## Task 1: Função pura de cálculo

**Files:**
- Create: `src/utils/faturamentoSummary.js`
- Test: `src/utils/faturamentoSummary.test.js`

### Contexto
O ambiente Vitest está configurado com `environment: 'node'` (sem jsdom), portanto os testes cobrem **apenas lógica pura**, não renderização. A função recebe o array de faturamentos filtrados e o valor do contrato, e retorna um objeto com todas as métricas prontas para exibição.

---

- [ ] **Step 1: Escrever o teste (arquivo de teste)**

Crie `src/utils/faturamentoSummary.test.js` com o conteúdo abaixo:

```js
import { describe, it, expect } from "vitest";
import { calcFaturamentoSummary } from "./faturamentoSummary";

const fat = (status, valor) => ({ status, valor_medido: valor });

describe("calcFaturamentoSummary", () => {
  it("conta total, concluídos e em elaboração", () => {
    const fats = [
      fat("Concluído", 100000),
      fat("Concluído", 200000),
      fat("Elaboração", 50000),
    ];
    const r = calcFaturamentoSummary(fats, 1000000);
    expect(r.totalCount).toBe(3);
    expect(r.concluidosCount).toBe(2);
    expect(r.concluidosValor).toBe(300000);
    expect(r.elaboracaoCount).toBe(1);
    expect(r.elaboracaoValor).toBe(50000);
  });

  it("calcula totalMedido, percentual e saldo", () => {
    const fats = [fat("Concluído", 200000), fat("Elaboração", 100000)];
    const r = calcFaturamentoSummary(fats, 1000000);
    expect(r.totalMedido).toBe(300000);
    expect(r.percentual).toBeCloseTo(30);
    expect(r.saldo).toBe(700000);
  });

  it("retorna percentual e saldo null quando valorContrato <= 0", () => {
    const r = calcFaturamentoSummary([fat("Concluído", 100000)], 0);
    expect(r.percentual).toBeNull();
    expect(r.saldo).toBeNull();
  });

  it("retorna percentual e saldo null quando valorContrato é null", () => {
    const r = calcFaturamentoSummary([fat("Concluído", 100000)], null);
    expect(r.percentual).toBeNull();
    expect(r.saldo).toBeNull();
  });

  it("lida com array vazio", () => {
    const r = calcFaturamentoSummary([], 1000000);
    expect(r.totalCount).toBe(0);
    expect(r.totalMedido).toBe(0);
    expect(r.percentual).toBeCloseTo(0);
    expect(r.saldo).toBe(1000000);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada
npx vitest run src/utils/faturamentoSummary.test.js
```

Resultado esperado: **FAIL** com `Cannot find module './faturamentoSummary'`.

- [ ] **Step 3: Implementar a função pura**

Crie `src/utils/faturamentoSummary.js`:

```js
export function calcFaturamentoSummary(faturamentos, valorContrato) {
  const concluidos = faturamentos.filter((f) => f.status === "Concluído");
  const elaboracao = faturamentos.filter((f) => f.status === "Elaboração");
  const totalMedido = faturamentos.reduce((acc, f) => acc + (Number(f.valor_medido) || 0), 0);
  const concluidosValor = concluidos.reduce((acc, f) => acc + (Number(f.valor_medido) || 0), 0);
  const elaboracaoValor = elaboracao.reduce((acc, f) => acc + (Number(f.valor_medido) || 0), 0);
  const contrato = Number(valorContrato) || 0;
  const hasContrato = contrato > 0;

  return {
    totalCount: faturamentos.length,
    concluidosCount: concluidos.length,
    concluidosValor,
    elaboracaoCount: elaboracao.length,
    elaboracaoValor,
    totalMedido,
    percentual: hasContrato ? (totalMedido / contrato) * 100 : null,
    saldo: hasContrato ? contrato - totalMedido : null,
  };
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/utils/faturamentoSummary.test.js
```

Resultado esperado: **5 testes PASS**.

- [ ] **Step 5: Commit**

```bash
git add src/utils/faturamentoSummary.js src/utils/faturamentoSummary.test.js
git commit -m "feat(faturamento): função pura calcFaturamentoSummary + testes"
```

---

## Task 2: Componente visual FaturamentoSummary

**Files:**
- Create: `src/components/planejamento/FaturamentoSummary.jsx`

### Contexto
Segue o padrão visual de `AvancoCards.jsx` (mesmo domínio): `bg-card border border-border rounded-xl px-3 py-2`, label em uppercase pequeno, valor em bold colorido, subtexto muted. Duas linhas de grid: 3 cards de contagem + 4 cards financeiros. Formata moeda com `Intl.NumberFormat` pt-BR.

---

- [ ] **Step 1: Criar o componente**

Crie `src/components/planejamento/FaturamentoSummary.jsx`:

```jsx
import { useMemo } from "react";
import { FileText, CheckCircle2, Clock, Building2, DollarSign, Percent, TrendingUp } from "lucide-react";
import { calcFaturamentoSummary } from "@/utils/faturamentoSummary";

const brl = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const pct = (v) =>
  v === null ? "—" : `${v.toFixed(1)}%`;

function SummaryCard({ icon: Icon, label, value, sub, iconClass }) {
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 flex items-start gap-3">
      <div className={`mt-0.5 ${iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5 truncate">
          {label}
        </div>
        <div className="text-base font-bold text-foreground leading-tight">{value}</div>
        <div className="text-[9px] text-muted-foreground truncate">{sub}</div>
      </div>
    </div>
  );
}

export default function FaturamentoSummary({ faturamentos, valorContrato }) {
  const s = useMemo(
    () => calcFaturamentoSummary(faturamentos, valorContrato),
    [faturamentos, valorContrato]
  );

  return (
    <div className="space-y-3">
      {/* Linha 1 — Contagens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={FileText}
          label="Total de medições"
          value={s.totalCount}
          sub="faturamentos no período"
          iconClass="text-blue-500"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Total concluído"
          value={s.concluidosCount}
          sub={brl(s.concluidosValor)}
          iconClass="text-emerald-500"
        />
        <SummaryCard
          icon={Clock}
          label="Em elaboração"
          value={s.elaboracaoCount}
          sub={brl(s.elaboracaoValor)}
          iconClass="text-amber-500"
        />
      </div>

      {/* Linha 2 — Financeiro */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={Building2}
          label="Valor do contrato"
          value={brl(valorContrato)}
          sub="valor contratado"
          iconClass="text-blue-500"
        />
        <SummaryCard
          icon={DollarSign}
          label="Valor total medido"
          value={brl(s.totalMedido)}
          sub="medido no período"
          iconClass="text-emerald-500"
        />
        <SummaryCard
          icon={Percent}
          label="Percentual medido"
          value={pct(s.percentual)}
          sub="do contrato medido"
          iconClass="text-violet-500"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Saldo a medir"
          value={s.saldo === null ? "—" : brl(s.saldo)}
          sub="saldo restante"
          iconClass="text-slate-500"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que não há erros de importação**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada
npx vitest run src/utils/faturamentoSummary.test.js
```

Resultado esperado: **5 testes PASS** (confirma que a função ainda funciona após criar o componente).

- [ ] **Step 3: Commit**

```bash
git add src/components/planejamento/FaturamentoSummary.jsx
git commit -m "feat(faturamento): componente FaturamentoSummary com 7 cards de resumo"
```

---

## Task 3: Integrar FaturamentoSummary em Faturamento.jsx

**Files:**
- Modify: `src/pages/Planejamento/Faturamento.jsx`

### Contexto
`Faturamento.jsx` já tem:
- `filtrados` (array filtrado por busca, status e período) — linha ~54
- `projetoAtivo` (query do projeto ativo, tem `valor_contrato`) — linha ~47

O componente deve ser renderizado **entre** `</FilterToolbar>` e `<FaturamentoList>`.

---

- [ ] **Step 1: Adicionar import de FaturamentoSummary**

Em `src/pages/Planejamento/Faturamento.jsx`, adicionar o import após os imports existentes de componentes de planejamento:

```jsx
import FaturamentoSummary from "@/components/planejamento/FaturamentoSummary";
```

Posição correta: após a linha `import FaturamentoForm from "@/components/planejamento/FaturamentoForm";`.

- [ ] **Step 2: Adicionar FaturamentoSummary no JSX**

No bloco de return, localizar a seção:

```jsx
        </FilterToolbar>

        <FaturamentoList
```

E substituir por:

```jsx
        </FilterToolbar>

        <FaturamentoSummary
          faturamentos={filtrados}
          valorContrato={projetoAtivo?.valor_contrato ?? 0}
        />

        <FaturamentoList
```

- [ ] **Step 3: Rodar os testes para confirmar que nada foi quebrado**

```bash
npx vitest run src/utils/faturamentoSummary.test.js
```

Resultado esperado: **5 testes PASS**.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Planejamento/Faturamento.jsx
git commit -m "feat(faturamento): integrar FaturamentoSummary na página de Faturamento"
```

---

## Self-Review

**Cobertura do spec:**
- [x] Cards abaixo dos filtros — Task 3 Step 2
- [x] Valores refletem filtrados — props `faturamentos={filtrados}`
- [x] Total de medições — `SummaryCard` com `totalCount`
- [x] Total concluído (nº + R$) — `SummaryCard` com `concluidosCount` / `concluidosValor`
- [x] Total em elaboração (nº + R$) — `SummaryCard` com `elaboracaoCount` / `elaboracaoValor`
- [x] Valor do contrato (fixo do projeto) — `valorContrato` prop
- [x] Valor total medido — `totalMedido`
- [x] Percentual medido — `percentual`
- [x] Saldo a medir — `saldo`
- [x] Edge case: contrato = 0 → percentual e saldo exibem "—" — testado em Task 1 Step 1, tratado em `pct()` e no JSX
- [x] Edge case: `projetoAtivo` ainda carregando → `?? 0` garante fallback seguro

**Nomes consistentes entre tasks:**
- `calcFaturamentoSummary` — definido em Task 1, importado em Task 2 ✓
- `FaturamentoSummary` — criado em Task 2, importado em Task 3 ✓
- `filtrados` — variável existente em `Faturamento.jsx`, passada em Task 3 ✓
- `projetoAtivo?.valor_contrato` — campo confirmado no banco ✓

**Sem placeholders:** Todos os steps têm código completo. ✓
