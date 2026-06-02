# Reestruturação Módulo Contratos + Faturamento — Implementation Plan

> **For agentic workers:** Executado no **fluxo de agentes do projeto** (Architect dispatcha `/builder`, `/designer`, `/tester`, `/security` em chats separados, conforme a Sequência de Execução), **não** via subagent-driven-development. Steps usam checkbox (`- [ ]`). Cada agente committa ao concluir (CLAUDE.md).

**Goal:** Reestruturar o módulo de Contratos (Detalhe em 4 abas: Visão Geral · PQP · Medições · Aditivos) com um componente PQP hierárquico reutilizável, e criar o módulo **Faturamento** em Planejamento que alimenta o Avanço Financeiro real.

**Architecture:** PQP/EAP em **JSONB**; cálculos puros e testáveis em `src/utils/pqpUtils.js`; componente `PqpEditor` reusado em 3 contextos (PQP-definição, Medição-subcontrato, Faturamento). Avanço Financeiro Real **derivado** dos faturamentos (single source). Detalhe do Contrato decomposto em uma aba por arquivo.

**Tech Stack:** React 18 + Vite, Tailwind/shadcn, Radix Tabs, Supabase (entities shim), React Query, vitest (utils puros).

**Spec:** [../specs/2026-06-02-faturamento-projeto-reestruturacao-design.md](../specs/2026-06-02-faturamento-projeto-reestruturacao-design.md) · **ADR:** [../../adrs/ADR-0001-medicao-subcontrato-vs-faturamento-projeto.md](../../adrs/ADR-0001-medicao-subcontrato-vs-faturamento-projeto.md)

---

## File Structure

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `src/utils/pqpUtils.js` (+`.test.js`) | Cálculos puros da PQP | Criar |
| `src/components/planejamento/PqpEditor.jsx` | Tabela PQP/EAP hierárquica (modos definição/medição) + import | Criar |
| `src/api/supabaseEntities.js` | `Faturamento` no TABLE_MAP | Modificar |
| `src/pages/Planejamento/Faturamento.jsx` | Página Faturamento (lista + form) | Criar |
| `src/components/planejamento/FaturamentoForm.jsx` / `FaturamentoList.jsx` | Form/lista de faturamentos | Criar |
| `src/components/planejamento/AvancoFinanceiroPanel.jsx` | Real derivado (read-only) | Modificar |
| `src/components/contratos/ContratoDetalhes.jsx` | Container com 4 abas (Radix Tabs) | Reescrever |
| `src/components/contratos/abas/ContratoVisaoGeral.jsx` | Aba Visão Geral (seções empilhadas + campos novos) | Criar |
| `src/components/contratos/abas/ContratoPQP.jsx` | Aba PQP (PqpEditor modo definição) | Criar |
| `src/components/contratos/abas/ContratoMedicoes.jsx` | Aba Medições (histórico → editor) | Criar |
| `src/components/contratos/abas/ContratoAditivos.jsx` | Aba Aditivos (tabela com impactos) | Criar (a partir do `AditivosList.jsx`) |
| `src/components/contratos/MedicaoForm.jsx` | Itens flat → PqpEditor | Modificar |
| `src/lib/navigationConfig.js` / `src/App.jsx` | +Faturamento, −Medições | Modificar |
| `src/pages/AdminContratual/Medicoes.jsx` | Página standalone | **Deletar** |

> **Regra L016:** a `supabase-migration.sql` está desatualizada. Antes de qualquer escrita, confirmar colunas reais via `mcp__supabase-integrada__list_tables`/`execute_sql`.

---

## Task 1 — Schema (Builder · Lote 2)

**Files:** Migration MCP `m16_contratos_faturamento` · Modify `src/api/supabaseEntities.js` · Create `docs/database/supabase-migration-m16-contratos-faturamento.sql`

- [ ] **Step 1: Verificar schema real**

`mcp__supabase-integrada__execute_sql`:
```sql
select table_name, column_name, data_type from information_schema.columns
where table_name in ('contratos','medicoes','financeiro','projetos')
order by table_name, ordinal_position;
```
Expected: confirmar colunas de `contratos` (objeto, fornecedor, valor_total, centro_custo, observacoes…), `financeiro` (faturamento_realizado_mensal, mes_referencia), nome real da tabela de projetos.

- [ ] **Step 2: Aplicar migration**

```sql
-- Faturamento do projeto
create table if not exists public.faturamentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  numero text,
  mes_referencia date not null,
  itens jsonb not null default '[]'::jsonb,
  valor_medido numeric not null default 0,
  status text not null default 'Elaboração' check (status in ('Elaboração','Concluído')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.faturamentos enable row level security;
create policy "faturamentos_authenticated_all" on public.faturamentos
  for all to authenticated using (true) with check (true);
create index if not exists idx_faturamentos_projeto on public.faturamentos(projeto_id);
create index if not exists idx_faturamentos_mes on public.faturamentos(mes_referencia);

-- Campos novos da Visão Geral do contrato
alter table public.contratos add column if not exists modalidade text
  check (modalidade in ('Preço unitário','Global'));
alter table public.contratos add column if not exists origem text;
-- PQP-base do contrato (árvore EAP)
alter table public.contratos add column if not exists itens jsonb not null default '[]'::jsonb;
```
(Ajustar `projetos` ao nome real do Step 1.)

- [ ] **Step 3: Entidade + espelho versionado**

`supabaseEntities.js` TABLE_MAP: adicionar `Faturamento: 'faturamentos',`.
Criar `docs/database/supabase-migration-m16-contratos-faturamento.sql` com o SQL do Step 2.

- [ ] **Step 4: Verificar e commitar**

`mcp__supabase-integrada__list_tables` → confirmar `faturamentos` + colunas novas em `contratos`.
```bash
git add src/api/supabaseEntities.js docs/database/supabase-migration-m16-contratos-faturamento.sql
git commit -m "feat(schema): faturamentos + modalidade/origem em contratos (M16)"
```

---

## Task 2 — `pqpUtils` com TDD (Builder · Lote 3)

**Files:** Create `src/utils/pqpUtils.js` · Test `src/utils/pqpUtils.test.js`

Estrutura do item JSONB: `{ item, descricao, unidade, qtd_contratual, preco_unitario, qtd_acumulada, qtd_medida, children? }`. Folha = sem `children`.

- [ ] **Step 1: Teste que falha**

```js
// src/utils/pqpUtils.test.js
import { describe, it, expect } from "vitest";
import { computeItemValues, flattenLeaves, computeTotais } from "./pqpUtils";

const folha = { item: "1.1", descricao: "X", unidade: "m³",
  qtd_contratual: 100, preco_unitario: 10, qtd_acumulada: 30, qtd_medida: 20 };

describe("computeItemValues", () => {
  it("medido, acumulado e saldo de uma folha", () => {
    expect(computeItemValues(folha)).toEqual({ valor_medido: 200, valor_acumulado: 500, saldo: 50 });
  });
});
describe("computeTotais", () => {
  it("soma só folhas e calcula % avanço", () => {
    const arvore = [{ item: "1", descricao: "Grupo", children: [
      folha,
      { item: "1.2", descricao: "Y", unidade: "un", qtd_contratual: 10, preco_unitario: 100, qtd_acumulada: 0, qtd_medida: 1 },
    ]}];
    const t = computeTotais(arvore);
    expect(t.valorTotalMedido).toBe(300);
    expect(t.valorTotalAcumulado).toBe(600);
    expect(t.valorTotalContrato).toBe(2000);
    expect(t.progressoFinanceiro).toBe(30);
  });
});
describe("flattenLeaves", () => {
  it("retorna só folhas", () => {
    expect(flattenLeaves([{ item: "1", children: [folha] }])).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/utils/pqpUtils.test.js` → FAIL.

- [ ] **Step 3: Implementar**

```js
// src/utils/pqpUtils.js
const isLeaf = (i) => !i.children || i.children.length === 0;
export function computeItemValues(item) {
  const acum = item.qtd_acumulada ?? 0, med = item.qtd_medida ?? 0, pu = item.preco_unitario ?? 0;
  return { valor_medido: med * pu, valor_acumulado: (acum + med) * pu, saldo: (item.qtd_contratual ?? 0) - (acum + med) };
}
export function flattenLeaves(itens = []) {
  return itens.flatMap((i) => (isLeaf(i) ? [i] : flattenLeaves(i.children)));
}
export function computeTotais(itens = []) {
  let valorTotalMedido = 0, valorTotalAcumulado = 0, valorTotalContrato = 0;
  for (const f of flattenLeaves(itens)) {
    const v = computeItemValues(f);
    valorTotalMedido += v.valor_medido; valorTotalAcumulado += v.valor_acumulado;
    valorTotalContrato += (f.qtd_contratual ?? 0) * (f.preco_unitario ?? 0);
  }
  const progressoFinanceiro = valorTotalContrato ? (valorTotalAcumulado / valorTotalContrato) * 100 : 0;
  return { valorTotalMedido, valorTotalAcumulado, valorTotalContrato, progressoFinanceiro };
}
```

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/utils/pqpUtils.test.js` → PASS (3).

- [ ] **Step 5: Commit**
```bash
git add src/utils/pqpUtils.js src/utils/pqpUtils.test.js
git commit -m "feat(pqp): funções puras de cálculo da PQP com testes"
```

---

## Task 3 — `PqpEditor` (Designer UI + Builder lógica · Lote 3)

**Files:** Create `src/components/planejamento/PqpEditor.jsx`

**Contrato de props (acordar ANTES de paralelizar):**
```js
/**
 * @param {Array}    itens     – árvore JSONB
 * @param {Function} onChange  – (novosItens) => void
 * @param {"definicao"|"medicao"} mode – colunas exibidas
 * @param {boolean}  readOnly  – desabilita edição
 * @param {Function} onImport  – () => void (abre importação)
 */
```

- [ ] **Step 1 (Designer): UI da árvore.** Tabela hierárquica (indentação por nível, ▾ expandir/recolher), controle "Expandir até nível N", **níveis-pai com subtotal** (`computeTotais` por subárvore), rodapé TOTAL. Visual seguindo `AvancoTabela.jsx` (cores, `border-border`, dark mode).
  - `mode="definicao"`: colunas Item · Descrição · Un. · Qtd · Preço unit. · Preço total.
  - `mode="medicao"`: colunas Item · Descrição · Contratual · Acumulada · Saldo · **Qtd. medida (input destacado bg amber)** · Preço unit. · Valor medido · Valor acum.
- [ ] **Step 2 (Builder): lógica.** Editar célula → atualizar árvore imutavelmente → `onChange`. Derivar com `computeItemValues`/`computeTotais` de `@/utils/pqpUtils`. `readOnly`/`mode` controlam inputs.
- [ ] **Step 3 (Builder): importação.** Reusar `ImportExportDialog` + `column-mapping-dialog`; mapear Excel → `{item,descricao,unidade,qtd_contratual,preco_unitario}`; montar árvore por prefixo EAP (`1`,`1.1`,`1.1.2`).
- [ ] **Step 4: build** — `npm run build` OK.
- [ ] **Step 5: Commit**
```bash
git add src/components/planejamento/PqpEditor.jsx
git commit -m "feat(pqp): PqpEditor (árvore hierárquica, modos definição/medição, importação)"
```

---

## Task 4 — Módulo Faturamento + integração (Builder · Lote 4 / Chat 01)

**Files:** Create `Faturamento.jsx`, `FaturamentoForm.jsx`, `FaturamentoList.jsx` · Modify `AvancoFinanceiroPanel.jsx` · (nav/rota feitas pelo Chat 02 — coordenar)

- [ ] **Step 1: Página + lista + form.** `Faturamento.jsx`: query `["faturamentos", selectedProjectId]` → `entities.Faturamento.filter({projeto_id})`, `enabled:!!selectedProjectId`, `{data,isPending,isError}` (L003), Skeleton/`PageEmptyState`/erro. `FaturamentoForm` usa `<PqpEditor mode="medicao">`; ao salvar, `valor_medido = computeTotais(itens).valorTotalMedido`. Mutations invalidam a query.
- [ ] **Step 2: Integração Real derivado.** Em `AvancoFinanceiroPanel.jsx`: adicionar query de faturamentos; montar `realPorMes = Map<yyyy-MM, Σ valor_medido>`; no `dataMap` (linhas 189-195) **sobrescrever** `faturamento_realizado_mensal` com `realPorMes.get(pk) ?? 0` (injetar registro sintético para meses sem linha em `financeiro`). Em `buildRows`, linha `FIELDS.real` vira **não-editável**; em `handleSave`, bloquear `campo==="faturamento_realizado_mensal"`. Dica "origem: Faturamento" + link. **Não** tocar Previsto/Projetado nem o Físico.
- [ ] **Step 3: Verificar** — `npm run build`; no dev, lançar faturamento e ver o Real do mês refletir a soma (célula read-only); Físico inalterado.
- [ ] **Step 4: Commit**
```bash
git add src/pages/Planejamento/Faturamento.jsx src/components/planejamento/FaturamentoForm.jsx src/components/planejamento/FaturamentoList.jsx src/components/planejamento/AvancoFinanceiroPanel.jsx
git commit -m "feat(faturamento): módulo Faturamento + Real do Avanço Financeiro derivado"
```

---

## Task 5 — Detalhe do Contrato em 4 abas (Builder · Lote 4 / Chat 02)

> Chat 02 é **dono exclusivo** de `ContratoDetalhes.jsx`, `navigationConfig.js`, `App.jsx`. Tasks 5-9 são do mesmo chat, sequenciais.

**Files:** Reescrever `ContratoDetalhes.jsx` · Create `abas/ContratoVisaoGeral.jsx`, `abas/ContratoPQP.jsx`, `abas/ContratoMedicoes.jsx`, `abas/ContratoAditivos.jsx`

- [ ] **Step 1: Container de abas.** `ContratoDetalhes.jsx` vira header (KPIs **do contrato**: valor total, % medido, saldo, fornecedor, vigência — **sem** KPIs gerais da lista) + Radix `Tabs` com 4 triggers. Cada aba renderiza seu componente, recebendo `contrato`/`contratoId`.
- [ ] **Step 2: Aba Visão Geral.** `ContratoVisaoGeral.jsx`: seções empilhadas **Identificação · Valores · Prazo · Gestão**. Exibir/editar campos incluindo novos `modalidade` (select Preço unitário/Global), `origem` (texto), e os antes ocultos `centro_custo` e `observacoes`. "Término com aditivos" = `data_fim + Σ prazo_dias` dos aditivos `Assinado` (lógica já existente em `ContratoDetalhes.jsx:12-17`).
- [ ] **Step 3: build** — `npm run build` OK.
- [ ] **Step 4: Commit**
```bash
git add src/components/contratos/ContratoDetalhes.jsx src/components/contratos/abas/ContratoVisaoGeral.jsx
git commit -m "feat(contratos): detalhe em abas + aba Visão Geral (campos modalidade/origem/centro_custo/observacoes)"
```

---

## Task 6 — Aba PQP (Builder · Lote 4 / Chat 02)

**Files:** Create `abas/ContratoPQP.jsx`

- [ ] **Step 1:** Renderizar `<PqpEditor mode="definicao">` com a PQP-base do contrato, persistida em `contratos.itens` (JSONB — criada na Task 1 Step 2). Salvar via `entities.Contrato.update(id, { itens })`. Importação via `onImport`.
- [ ] **Step 2:** Estado vazio com CTA importar/adicionar. `npm run build` OK.
- [ ] **Step 3: Commit**
```bash
git add src/components/contratos/abas/ContratoPQP.jsx
git commit -m "feat(contratos): aba PQP (PqpEditor modo definição)"
```

---

## Task 7 — Aba Medições: histórico + editor (Builder · Lote 4 / Chat 02)

**Files:** Create `abas/ContratoMedicoes.jsx` · Modify `MedicaoForm.jsx`

- [ ] **Step 1: Histórico.** Lista de medições do contrato (query `["medicoes","contrato",contratoId]`): Nº · Período · Valor medido · % período · Status (`Elaboração`/`Concluído`); topo com Acumulado medido (R$/%) + "Nova Medição". Clicar abre o editor.
- [ ] **Step 2: Editor.** `MedicaoForm.jsx` usa `<PqpEditor mode="medicao">` (herda PQP do contrato como base; `qtd_acumulada` = soma das medições `Concluído` anteriores por item). Cabeçalho 3 KPIs (Acumulado · Medido no período · Avanço %); ações Salvar rascunho / Concluir. Ao salvar, `valor = computeTotais(itens).valorTotalMedido`.
- [ ] **Step 3:** Compatibilidade itens flat antigos = folha sem `children`. `npm run build` OK.
- [ ] **Step 4: Commit**
```bash
git add src/components/contratos/abas/ContratoMedicoes.jsx src/components/contratos/MedicaoForm.jsx
git commit -m "feat(contratos): aba Medições (histórico + editor PqpEditor)"
```

---

## Task 8 — Aba Aditivos (Builder · Lote 4 / Chat 02)

**Files:** Create `abas/ContratoAditivos.jsx` (a partir de `AditivosList.jsx`/`AditivoForm.jsx`)

- [ ] **Step 1:** Tabela: Nº · Tipo (Valor/Prazo/Valor e Prazo/Escopo) · Data assinatura · **Δ Valor** · **Δ Prazo** · Status (Pendente/Assinado/Cancelado) · ações. **Rodapé soma só `Assinado`** (Δ valor e Δ prazo) → consistente com Valor Total/Término da Visão Geral. CRUD via `AditivoForm` (modal).
- [ ] **Step 2:** `npm run build` OK.
- [ ] **Step 3: Commit**
```bash
git add src/components/contratos/abas/ContratoAditivos.jsx
git commit -m "feat(contratos): aba Aditivos (tabela com impactos, soma só assinados)"
```

---

## Task 9 — Drop standalone Medições + nav/rotas (Builder · Lote 4 / Chat 02)

**Files:** Delete `src/pages/AdminContratual/Medicoes.jsx` · Modify `navigationConfig.js`, `App.jsx`

- [ ] **Step 1: Nav.** `navigationConfig.js`: em Planejamento adicionar `{ title: "Faturamento", path: "/planejamento/faturamento" }`; em Adm. Contratual remover `{ title: "Medições", path: "/admin-contratual/medicoes" }`.
- [ ] **Step 2: Rotas.** `App.jsx`: adicionar rota lazy `Faturamento`; remover rota `/admin-contratual/medicoes` e redirects legados.
- [ ] **Step 3: Drop (L007).** Deletar `Medicoes.jsx`; manter entidade `Medicao` no TABLE_MAP; `grep -rn "admin-contratual/medicoes\|AdminContratual/Medicoes" src/` → vazio.
- [ ] **Step 4:** `npm run build` + grep limpo; sidebar sem "Medições" em Adm. Contratual, com "Faturamento" em Planejamento.
- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "refactor(medicoes): remove módulo standalone; +Faturamento -Medições na nav (L007)"
```

---

## Task 10 — Audit + Security (Tester + Security · Lote 5)

- [ ] **Step 1 (Tester):** `/audit` ≥ 9 — Lista (cards), 4 abas do Contrato, KPIs gerais ausentes no detalhe, importação PQP, Faturamento, integração Avanço; `npm run build` + `npx vitest run` verdes.
- [ ] **Step 2 (Security):** `/security-scan` — RLS `faturamentos` + colunas novas em `contratos`; exposição na derivação do Real; `get_advisors`.
- [ ] **Step 3:** Lições em `docs/LESSONS.md` se houver erro. Architect fecha via `/milestone-close`.

---

## Self-Review (cobertura da spec)

- §3 navegação (+Faturamento/−Medições) → Task 9 ✅
- §4 PqpEditor reutilizável → Tasks 2-3, usado em 4, 6, 7 ✅
- §5 Faturamento + §6 integração Real derivado → Task 4 ✅
- §7 Medição subcontrato como aba + §7.1 (4 abas, regra KPIs, cards, Visão Geral campos, PQP subtotais, editor completo, Aditivos só assinados) → Tasks 5-9 ✅
- §11 schema modalidade/origem → Task 1 ✅
- Critérios 1-9 → Tasks 1-10 ✅
- Sem placeholders; nomes consistentes (`computeItemValues`/`computeTotais`/`flattenLeaves`; `PqpEditor` props `mode`/`onChange`/`onImport`).
- PQP-base persistida em `contratos.itens` (criada na Task 1, consumida na Task 6) — sem pontos abertos.
