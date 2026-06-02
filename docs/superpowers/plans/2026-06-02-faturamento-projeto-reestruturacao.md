# Reestruturação Faturamento × Medição de Subcontrato — Implementation Plan

> **For agentic workers:** Este plano é executado no **fluxo de agentes do projeto** (Architect dispatcha `/builder`, `/designer`, `/tester`, `/security` em chats separados, conforme a Sequência de Execução), **não** via subagent-driven-development. Steps usam checkbox (`- [ ]`) para tracking. Cada agente committa ao concluir sua task (CLAUDE.md).

**Goal:** Separar a medição do projeto (novo módulo **Faturamento** em Planejamento, que alimenta o Avanço Financeiro real) da medição de subcontrato (que vira aba dentro do Contrato), com um componente PQP/EAP hierárquico reutilizável.

**Architecture:** PQP/EAP em **JSONB** (caminho simples). Funções de cálculo puras e testáveis em `src/utils/pqpUtils.js`. Componente `PqpEditor` reusado em Faturamento e Medição de subcontrato. Avanço Financeiro **Real** derivado (single source = faturamentos), sem escrita manual.

**Tech Stack:** React 18 + Vite, Tailwind/shadcn, Supabase (entities shim), React Query, vitest (utils puros), Recharts (curva S existente).

**Spec:** [../specs/2026-06-02-faturamento-projeto-reestruturacao-design.md](../specs/2026-06-02-faturamento-projeto-reestruturacao-design.md) · **ADR:** [../../adrs/ADR-0001-medicao-subcontrato-vs-faturamento-projeto.md](../../adrs/ADR-0001-medicao-subcontrato-vs-faturamento-projeto.md)

---

## File Structure (decisões de decomposição)

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `src/utils/pqpUtils.js` | Cálculos puros da PQP (medido/acumulado/saldo/totais/folhas) | Criar |
| `src/utils/pqpUtils.test.js` | Testes vitest dos cálculos | Criar |
| `src/components/planejamento/PqpEditor.jsx` | Tabela PQP/EAP hierárquica editável + import (UI + estado) | Criar |
| `src/pages/Planejamento/Faturamento.jsx` | Página do módulo Faturamento (lista + form) | Criar |
| `src/components/planejamento/FaturamentoForm.jsx` | Form de um faturamento (usa PqpEditor) | Criar |
| `src/components/planejamento/FaturamentoList.jsx` | Lista de faturamentos (cards) | Criar |
| `src/api/supabaseEntities.js` | `Faturamento` no TABLE_MAP | Modificar |
| `src/components/planejamento/AvancoFinanceiroPanel.jsx` | Real derivado dos faturamentos (read-only) | Modificar |
| `src/lib/navigationConfig.js` | +Faturamento (Planejamento), −Medições (Adm. Contratual) | Modificar |
| `src/App.jsx` | +rota faturamento, −rota/redirect medicoes | Modificar |
| `src/components/contratos/ContratoDetalhes.jsx` | Aba "Medições" do subcontrato com PqpEditor | Modificar |
| `src/components/contratos/MedicaoForm.jsx` | Itens flat → PqpEditor | Modificar |
| `src/pages/AdminContratual/Medicoes.jsx` | Página standalone | **Deletar** |

> **Regra L016 (banco):** a `supabase-migration.sql` está desatualizada — **não** é fonte da verdade. Antes de qualquer escrita, confirmar nomes de coluna no banco real via `mcp__supabase-integrada__list_tables` / `execute_sql` em `information_schema`.

---

## Task 1 — Schema `faturamentos` + entidade (Builder, Lote 2)

**Files:**
- Migration via `mcp__supabase-integrada__apply_migration` (name: `m16_faturamentos`)
- Modify: `src/api/supabaseEntities.js`
- Create: `docs/database/supabase-migration-m16-faturamentos.sql` (espelho versionado da migration)

- [ ] **Step 1: Verificar schema real de `financeiro` e `medicoes`**

Run (MCP): `mcp__supabase-integrada__execute_sql` com:
```sql
select table_name, column_name, data_type
from information_schema.columns
where table_name in ('financeiro','medicoes')
order by table_name, ordinal_position;
```
Expected: confirmar que `financeiro` tem `faturamento_realizado_mensal`, `mes_referencia`; `medicoes` tem `itens` (jsonb), `contrato_id`, `numero`, `valor`, `status`.

- [ ] **Step 2: Aplicar migration `faturamentos`**

```sql
create table if not exists public.faturamentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  numero text,
  mes_referencia date not null,
  itens jsonb not null default '[]'::jsonb,
  valor_medido numeric not null default 0,
  status text not null default 'Elaboração'
    check (status in ('Elaboração','Concluído')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.faturamentos enable row level security;
create policy "faturamentos_authenticated_all" on public.faturamentos
  for all to authenticated using (true) with check (true);
create index if not exists idx_faturamentos_projeto on public.faturamentos(projeto_id);
create index if not exists idx_faturamentos_mes on public.faturamentos(mes_referencia);
```
(Confirmar nome real da tabela de projetos no Step 1 — ajustar `projetos` se divergir.)

- [ ] **Step 3: Registrar entidade no TABLE_MAP**

Em `src/api/supabaseEntities.js`, adicionar na constante `TABLE_MAP` (perto da linha 10-13):
```js
  Faturamento: 'faturamentos',
```

- [ ] **Step 4: Espelhar a migration versionada**

Criar `docs/database/supabase-migration-m16-faturamentos.sql` com o mesmo SQL do Step 2 (registro auditável).

- [ ] **Step 5: Verificar e commitar**

Run: `mcp__supabase-integrada__list_tables` → confirmar `faturamentos`.
```bash
git add src/api/supabaseEntities.js docs/database/supabase-migration-m16-faturamentos.sql
git commit -m "feat(faturamento): tabela faturamentos + entidade no TABLE_MAP"
```

---

## Task 2 — Cálculos puros da PQP com TDD (Builder, Lote 3 / Chat 02)

**Files:**
- Create: `src/utils/pqpUtils.js`
- Test: `src/utils/pqpUtils.test.js`

Estrutura do item (JSONB): `{ item, descricao, unidade, qtd_contratual, preco_unitario, qtd_acumulada, qtd_medida, children? }`. Folha = sem `children` (ou `children` vazio).

- [ ] **Step 1: Escrever o teste que falha**

```js
// src/utils/pqpUtils.test.js
import { describe, it, expect } from "vitest";
import { computeItemValues, flattenLeaves, computeTotais } from "./pqpUtils";

const folha = { item: "1.1", descricao: "X", unidade: "m³",
  qtd_contratual: 100, preco_unitario: 10, qtd_acumulada: 30, qtd_medida: 20 };

describe("computeItemValues", () => {
  it("calcula medido, acumulado e saldo de uma folha", () => {
    expect(computeItemValues(folha)).toEqual({
      valor_medido: 200,        // 20 * 10
      valor_acumulado: 500,     // (30+20) * 10
      saldo: 50,                // 100 - (30+20)
    });
  });
});

describe("computeTotais", () => {
  it("soma apenas folhas, recursivamente, e calcula % avanço", () => {
    const arvore = [{ item: "1", descricao: "Grupo", children: [
      folha,
      { item: "1.2", descricao: "Y", unidade: "un", qtd_contratual: 10,
        preco_unitario: 100, qtd_acumulada: 0, qtd_medida: 1 },
    ]}];
    const t = computeTotais(arvore);
    expect(t.valorTotalMedido).toBe(300);       // 200 + 100
    expect(t.valorTotalAcumulado).toBe(600);    // 500 + 100
    expect(t.valorTotalContrato).toBe(2000);    // 100*10 + 10*100
    expect(t.progressoFinanceiro).toBe(30);     // 600/2000 * 100
  });
});

describe("flattenLeaves", () => {
  it("retorna só folhas", () => {
    expect(flattenLeaves([{ item: "1", children: [folha] }])).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/utils/pqpUtils.test.js`
Expected: FAIL (`pqpUtils` não existe).

- [ ] **Step 3: Implementar**

```js
// src/utils/pqpUtils.js
const isLeaf = (i) => !i.children || i.children.length === 0;

export function computeItemValues(item) {
  const acum = (item.qtd_acumulada ?? 0);
  const med = (item.qtd_medida ?? 0);
  const pu = (item.preco_unitario ?? 0);
  return {
    valor_medido: med * pu,
    valor_acumulado: (acum + med) * pu,
    saldo: (item.qtd_contratual ?? 0) - (acum + med),
  };
}

export function flattenLeaves(itens = []) {
  return itens.flatMap((i) => (isLeaf(i) ? [i] : flattenLeaves(i.children)));
}

export function computeTotais(itens = []) {
  const folhas = flattenLeaves(itens);
  let valorTotalMedido = 0, valorTotalAcumulado = 0, valorTotalContrato = 0;
  for (const f of folhas) {
    const v = computeItemValues(f);
    valorTotalMedido += v.valor_medido;
    valorTotalAcumulado += v.valor_acumulado;
    valorTotalContrato += (f.qtd_contratual ?? 0) * (f.preco_unitario ?? 0);
  }
  const progressoFinanceiro = valorTotalContrato
    ? (valorTotalAcumulado / valorTotalContrato) * 100 : 0;
  return { valorTotalMedido, valorTotalAcumulado, valorTotalContrato, progressoFinanceiro };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/utils/pqpUtils.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/utils/pqpUtils.js src/utils/pqpUtils.test.js
git commit -m "feat(pqp): funções puras de cálculo da PQP com testes"
```

---

## Task 3 — `PqpEditor` UI + importação (Designer + Builder, Lote 3)

**Files:**
- Create: `src/components/planejamento/PqpEditor.jsx`

**Contrato de props (acordar ANTES de paralelizar Designer/Builder):**
```js
/**
 * @param {Array}    itens        – árvore JSONB de itens da PQP
 * @param {Function} onChange     – (novosItens) => void  (chamado ao editar qtd_medida)
 * @param {boolean}  readOnly     – desabilita edição (ex.: medição já Concluída)
 * @param {Function} onImport     – () => void  (abre fluxo de importação de PQP)
 */
```

- [ ] **Step 1: UI da tabela hierárquica (Designer)**

Tabela em árvore com colunas: Item (EAP, indentado por nível) · Descrição · Un. · Contrato (qtd) · Qtd. Acum. · Saldo · **Qtd. Medida (input)** · Preço Unit. · Valor Medido · Valor Acum. Controle "Expandir até nível N". Padrão visual Tailwind/shadcn já usado em `AvancoTabela.jsx` (cores, borda `border-border`, dark mode). Rodapé com totais de `computeTotais`.

- [ ] **Step 2: Lógica de edição + cálculo (Builder)**

Ao editar `qtd_medida` de uma folha, atualizar a árvore imutavelmente e chamar `onChange`. Derivar células com `computeItemValues`/`computeTotais` de `@/utils/pqpUtils`. `readOnly` esconde o input (mostra valor estático).

- [ ] **Step 3: Importação de PQP**

Reusar `ImportExportDialog` (`@/components/ui/import-export-dialog`) + `column-mapping-dialog` já existentes (padrão "Smart Import Flow"). Mapear colunas Excel → `{ item, descricao, unidade, qtd_contratual, preco_unitario }` e montar a árvore por prefixo de código EAP (ex.: `1`, `1.1`, `1.1.2`). `onImport` dispara o dialog.

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/planejamento/PqpEditor.jsx
git commit -m "feat(pqp): componente PqpEditor (árvore hierárquica + importação)"
```

---

## Task 4 — Módulo Faturamento (Builder, Lote 4 / Chat 01)

**Files:**
- Create: `src/pages/Planejamento/Faturamento.jsx`, `src/components/planejamento/FaturamentoForm.jsx`, `src/components/planejamento/FaturamentoList.jsx`
- Modify: `src/lib/navigationConfig.js`, `src/App.jsx`

- [ ] **Step 1: Nav + rota**

`navigationConfig.js` — no grupo Planejamento (children ~linha 30-34), adicionar:
```js
      { title: "Faturamento", path: "/planejamento/faturamento" },
```
`App.jsx` — adicionar import lazy + `<Route path="/planejamento/faturamento" element={<Faturamento />} />` seguindo o padrão das outras rotas de Planejamento.

- [ ] **Step 2: Página + lista + form**

`Faturamento.jsx`: React Query `["faturamentos", selectedProjectId]` → `entities.Faturamento.filter({ projeto_id: selectedProjectId })`, `enabled: !!selectedProjectId`. Desestruturar `{ data, isPending, isError }` (L003); loading (Skeleton), empty (`PageEmptyState`), error. Toolbar (nº, status, período). `FaturamentoForm` usa `PqpEditor`; ao salvar, `valor_medido = computeTotais(itens).valorTotalMedido` (read-only no form). Mutations create/update/delete invalidam a query.

- [ ] **Step 3: Verificar build + fluxo**

Run: `npm run build` → sem erros. Subir `npm run dev`, criar um faturamento, lançar qtd, salvar.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Planejamento/Faturamento.jsx src/components/planejamento/FaturamentoForm.jsx src/components/planejamento/FaturamentoList.jsx src/lib/navigationConfig.js src/App.jsx
git commit -m "feat(faturamento): módulo Faturamento em Planejamento"
```

---

## Task 5 — Integração Avanço Financeiro Real derivado (Builder, Lote 4 / Chat 01)

**Files:**
- Modify: `src/components/planejamento/AvancoFinanceiroPanel.jsx`

- [ ] **Step 1: Query dos faturamentos**

Adicionar query `["faturamentos", selectedProjectId]` (mesma de Task 4). Construir `realPorMes`: `Map<yyyy-MM, Σ valor_medido>` agrupando por `mes_referencia.slice(0,7)`.

- [ ] **Step 2: Sobrepor o Real no dataMap**

No `dataMap` (linhas 189-195), ao montar cada registro, **sobrescrever** `faturamento_realizado_mensal` com `realPorMes.get(pk) ?? 0`. Para meses com faturamento mas sem linha em `financeiro`, injetar um registro sintético no map (apenas para leitura/cálculo da série).

- [ ] **Step 3: Tornar a linha Real read-only**

Em `buildRows`, na linha `FIELDS.real`, marcar como não-editável. No `handleSave`, ignorar/bloquear `campo === "faturamento_realizado_mensal"`. Adicionar dica visual ("origem: Faturamento") + link para `/planejamento/faturamento`. **Não** tocar Previsto/Projetado nem o Avanço Físico.

- [ ] **Step 4: Verificar**

Run: `npm run build`. No dev: lançar um faturamento e confirmar que o Real do mês correspondente reflete a soma e a célula não é editável; Físico inalterado.

- [ ] **Step 5: Commit**

```bash
git add src/components/planejamento/AvancoFinanceiroPanel.jsx
git commit -m "feat(avancos): Real financeiro derivado dos faturamentos (single source)"
```

---

## Task 6 — Medição de subcontrato como aba + drop do standalone (Builder, Lote 4 / Chat 02)

**Files:**
- Modify: `src/components/contratos/ContratoDetalhes.jsx`, `src/components/contratos/MedicaoForm.jsx`, `src/lib/navigationConfig.js`, `src/App.jsx`
- Delete: `src/pages/AdminContratual/Medicoes.jsx`

> Conflito de arquivos com Task 4 em `navigationConfig.js`/`App.jsx`: **Chat 02 é dono exclusivo** desses dois arquivos. Chat 01 (Tasks 4-5) **não** os edita além do que a Task 4 Step 1 já fez — coordenar para a edição da nav acontecer num único chat. (Recomendação: mover as edições de nav/rota da Task 4 Step 1 para cá, deixando Chat 01 sem tocar nav.)

- [ ] **Step 1: MedicaoForm usa PqpEditor**

`MedicaoForm.jsx` — substituir a tabela de itens flat (estrutura `{descricao, unidade, quantidade, preco_unitario, valor_total}`, ~linha 20) por `PqpEditor`. Compatibilidade: item flat existente = folha sem `children`. Ao salvar, `valor = computeTotais(itens).valorTotalMedido`.

- [ ] **Step 2: Aba Medições no ContratoDetalhes**

Converter a seção read-only atual (`ContratoDetalhes.jsx:125-153`) em aba/secção completa com CRUD de medições do subcontrato usando `MedicaoForm`. Manter queries `["medicoes","contrato",contratoId]`.

- [ ] **Step 3: Drop do módulo standalone (checklist L007)**

1. Deletar `src/pages/AdminContratual/Medicoes.jsx`.
2. `App.jsx` — remover `<Route path="/admin-contratual/medicoes" …>` e qualquer redirect legado.
3. `navigationConfig.js` — remover `{ title: "Medições", path: "/admin-contratual/medicoes" }` (Adm. Contratual, ~linha 42).
4. Manter entidade `Medicao` no TABLE_MAP (segue usada no contrato).
5. Conferir refs órfãs: `grep -rn "admin-contratual/medicoes\|AdminContratual/Medicoes" src/` → vazio.

- [ ] **Step 4: Verificar**

Run: `npm run build` + `grep` limpo. No dev: medir subcontrato dentro do contrato; item Medições ausente da sidebar; nenhuma rota órfã.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(medicoes): medição de subcontrato vira aba no Contrato; remove módulo standalone (L007)"
```

---

## Task 7 — Audit + Security (Tester + Security, Lote 5)

- [ ] **Step 1 (Tester):** `/audit` ≥ 9 nos fluxos Faturamento, Medição de subcontrato, importação PQP, integração Avanço Financeiro; estados loading/empty/error; `npm run build` limpo; `npx vitest run` verde.
- [ ] **Step 2 (Security):** `/security-scan` — RLS de `faturamentos`, exposição de dados na derivação do Real; `mcp__supabase-integrada__get_advisors`.
- [ ] **Step 3:** Registrar lições em `docs/LESSONS.md` se houver erro relevante. Architect fecha via `/milestone-close` (commit + push).

---

## Self-Review (cobertura da spec)

- D1 (separação/nomes) → Tasks 4, 6 ✅
- D2 (drop standalone, L007) → Task 6 Step 3 ✅
- D3 (Real derivado, Físico intacto) → Task 5 ✅
- D4 (JSONB simples) → Task 1 schema + Task 2 estrutura ✅
- D5 (escopo SGP; sem evidências/aprovação/IA/retenção) → Tasks 2-4 (nada fora de escopo) ✅
- Reuso `PqpEditor` → Tasks 3, 4, 6 ✅
- Critérios de aceitação 1-7 da spec → Tasks 4-7 ✅
- Sem placeholders; tipos/nomes consistentes (`computeItemValues`/`computeTotais`/`flattenLeaves` usados igual em todas as tasks).
