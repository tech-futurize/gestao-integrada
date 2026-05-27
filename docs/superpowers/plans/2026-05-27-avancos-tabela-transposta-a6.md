# A6 — Tabela Transposta de Avanço Físico

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a tabela mensal de Avanços por uma tabela transposta semanal (3 linhas × N semanas), com 4 KPI cards, coluna sticky com barra de progresso e gráfico Curva S.

**Architecture:** `Avancos.jsx` (página) gerencia todas as queries, mutations e cálculos de KPI; passa `weekMap`, `projectWeeks` e `onSave` como props para `AvancoTabela.jsx` (componente visual puro). `CelulaEditavelAvanco` é definido fora do componente principal para evitar remount.

**Tech Stack:** React 18, Vite, TanStack React Query 5, date-fns v2, Recharts 2, Tailwind CSS 3, Supabase via `entities.AvancoFisico`.

> ⚠️ **Dependência:** Requer Builder A1 ter aplicado a migration que adiciona `semana_iso TEXT` e `avanco_projetado NUMERIC DEFAULT 0` na tabela `avanco_fisico`. Os campos existentes `avanco_previsto_mensal` e `avanco_realizado_mensal` continuam com seus nomes (agora representam valores semanais). O formato de `semana_iso` é `"YYYY-Www"` (ex: `"2026-W05"`).

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/components/planejamento/AvancoTabela.jsx` | **Criar** | Tabela transposta visual pura + `CelulaEditavelAvanco` |
| `src/pages/Planejamento/Avancos.jsx` | **Reescrever** | Queries, mutations, KPI cards, composição da página, gráfico |

---

## Task 1: Helpers de semana + scaffold de `AvancoTabela.jsx`

**Files:**
- Create: `src/components/planejamento/AvancoTabela.jsx`

> **Nota sobre helpers duplicados:** `getProjectWeeks` é definido também em `Avancos.jsx` (Task 5) para calcular `projectWeeks` antes de passar como prop. Os helpers `weekKey`, `weekLabel`, `monthLabel`, `groupWeeksByMonth`, `isCurrentOrPastWeek` são exclusivos de `AvancoTabela.jsx`. Esta duplicação segue o padrão de `HistogramaTabela.jsx` e é intencional.

- [ ] **Criar o arquivo com imports e todos os helpers de data:**

```jsx
// src/components/planejamento/AvancoTabela.jsx
import { useMemo } from "react";
import {
  eachWeekOfInterval, format, parseISO,
  subMonths, addYears, getISOWeek, getISOWeekYear, startOfISOWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getProjectWeeks(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return [];
  try {
    return eachWeekOfInterval(
      { start: subMonths(parseISO(dataInicio), 3), end: addYears(parseISO(dataFim), 1) },
      { weekStartsOn: 1 }
    );
  } catch {
    return [];
  }
}

function weekKey(monday) {
  // ISO week key: "2026-W05" — must match Builder A1 migration format
  return `${getISOWeekYear(monday)}-W${String(getISOWeek(monday)).padStart(2, "0")}`;
}

function weekLabel(monday) {
  return format(monday, "dd/MM");
}

function monthLabel(monday) {
  return format(monday, "MMM/yy", { locale: ptBR });
}

// Groups weeks by the month of their Monday (Monday determines the month)
function groupWeeksByMonth(weeks) {
  const groups = [];
  let current = null;
  weeks.forEach((w) => {
    const label = monthLabel(w);
    if (!current || current.label !== label) {
      current = { label, weeks: [w] };
      groups.push(current);
    } else {
      current.weeks.push(w);
    }
  });
  return groups;
}

function isCurrentOrPastWeek(monday) {
  return monday <= startOfISOWeek(new Date());
}

// ── AvancoTabela ──────────────────────────────────────────────────────────────

export default function AvancoTabela({ projectWeeks, weekMap, prevAcum, realAcum, projAcum, onSave }) {
  return <div>placeholder</div>;
}
```

- [ ] **Verificar que o arquivo foi criado sem erros de parse:**

```bash
node --input-type=module < /dev/null  # não roda JSX, mas confirme que o arquivo existe
ls src/components/planejamento/AvancoTabela.jsx
```

Expected: arquivo existe.

- [ ] **Commit:**

```bash
git add src/components/planejamento/AvancoTabela.jsx
git commit -m "feat(M8-A6): scaffold AvancoTabela + helpers de semana ISO"
```

---

## Task 2: `CelulaEditavelAvanco` — componente de célula inline

**Files:**
- Modify: `src/components/planejamento/AvancoTabela.jsx` (adicionar antes do export default)

- [ ] **Adicionar o componente `CelulaEditavelAvanco` acima do `AvancoTabela` (depois dos helpers, antes do export):**

```jsx
// ── CelulaEditavelAvanco — defined OUTSIDE main component to prevent remount ──

function CelulaEditavelAvanco({ registro, campo, blocked, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("");
  const cancelRef = React.useRef(false);

  if (blocked) {
    return (
      <td
        className="px-2 py-1 text-center bg-muted text-muted-foreground text-xs w-10 cursor-not-allowed"
        title="Semana futura — edição de Real bloqueada"
      >
        —
      </td>
    );
  }

  if (!registro) {
    // No record yet — show editable zero
    const handleClick = () => {
      setInputVal("0");
      setEditing(true);
    };
    return editing ? (
      <td className="px-1 py-1 text-center w-10">
        <input
          autoFocus
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={() => {
            if (!cancelRef.current) onSave(campo, Number(inputVal));
            cancelRef.current = false;
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { cancelRef.current = false; e.target.blur(); }
            if (e.key === "Escape") { cancelRef.current = true; setEditing(false); }
          }}
          className="w-10 text-center border rounded text-xs p-0"
        />
      </td>
    ) : (
      <td
        className="px-2 py-1 text-center cursor-pointer hover:bg-accent text-muted-foreground text-xs w-10"
        onClick={handleClick}
      >
        0
      </td>
    );
  }

  const valor = registro[campo] ?? 0;

  const handleBlur = () => {
    if (cancelRef.current) { cancelRef.current = false; return; }
    onSave(campo, Number(inputVal));
    setEditing(false);
  };

  return (
    <td
      className="px-2 py-1 text-center cursor-pointer hover:bg-accent w-10"
      onClick={() => { if (!editing) { setInputVal(String(valor)); setEditing(true); } }}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") { cancelRef.current = false; e.target.blur(); }
            if (e.key === "Escape") { cancelRef.current = true; setEditing(false); }
          }}
          className="w-10 text-center border rounded text-xs p-0"
        />
      ) : (
        <span className="text-xs">{valor || "0"}</span>
      )}
    </td>
  );
}
```

Adicionar `import React from "react";` no topo do arquivo (já deve estar via `import { useMemo } from "react"` — adicionar React se necessário para `React.useState`/`React.useRef`).

Alterar o import existente de:
```js
import { useMemo } from "react";
```
para:
```js
import React, { useMemo } from "react";
```

- [ ] **Rodar o dev e verificar que não há erros de compilação:**

```bash
npm run dev
```

Esperado: Vite compila sem erros. Nenhuma mudança visual ainda.

- [ ] **Commit:**

```bash
git add src/components/planejamento/AvancoTabela.jsx
git commit -m "feat(M8-A6): CelulaEditavelAvanco — inline edit com step 0.1, blocked state"
```

---

## Task 3: `AvancoTabela` — header duplo (meses + semanas)

**Files:**
- Modify: `src/components/planejamento/AvancoTabela.jsx` (substituir o `export default`)

- [ ] **Substituir o `export default function AvancoTabela` pelo seguinte (ainda sem linhas de dados — só header):**

```jsx
export default function AvancoTabela({ projectWeeks, weekMap, prevAcum, realAcum, projAcum, onSave }) {
  const monthGroups = useMemo(() => groupWeeksByMonth(projectWeeks), [projectWeeks]);

  if (projectWeeks.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-max min-w-full">
          <thead className="sticky top-0 z-20">
            {/* Linha 1: coluna label (rowspan=2) + meses (colspan=N semanas) */}
            <tr className="bg-muted border-b border-border">
              <th
                rowSpan={2}
                className="sticky left-0 z-30 bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[160px]"
              >
                —
              </th>
              {monthGroups.map(({ label, weeks }) => (
                <th
                  key={label}
                  colSpan={weeks.length}
                  className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l-2 border-border whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
            {/* Linha 2: dd/MM de cada segunda-feira */}
            <tr className="bg-muted/60 border-b border-border">
              {projectWeeks.map((w) => (
                <th
                  key={weekKey(w)}
                  className="px-2 py-1 text-center text-[10px] font-medium text-muted-foreground border-l border-border whitespace-nowrap"
                >
                  {weekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Tasks 4–5 adicionarão as linhas aqui */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Importar `AvancoTabela` temporariamente em `Avancos.jsx` para testar o header:**

No topo de `src/pages/Planejamento/Avancos.jsx`, adicionar:
```jsx
import AvancoTabela from "@/components/planejamento/AvancoTabela";
```

Dentro do JSX existente (pode ser temporário, abaixo de qualquer elemento):
```jsx
<AvancoTabela
  projectWeeks={[]} // stub vazio — só para confirmar que importa
  weekMap={new Map()}
  prevAcum={0}
  realAcum={0}
  projAcum={0}
  onSave={() => {}}
/>
```

- [ ] **Verificar no browser (http://localhost:5173/planejamento/avancos):**

Esperado: a página carrega sem erros no console. O componente renderiza `null` (projectWeeks=[]) — sem erro de JS.

- [ ] **Commit:**

```bash
git add src/components/planejamento/AvancoTabela.jsx src/pages/Planejamento/Avancos.jsx
git commit -m "feat(M8-A6): AvancoTabela header duplo mês/semana + sticky left"
```

---

## Task 4: `AvancoTabela` — 3 linhas de dados + coluna sticky com progress bar

**Files:**
- Modify: `src/components/planejamento/AvancoTabela.jsx` (adicionar `<tbody>`)

- [ ] **Substituir `<tbody>{/* Tasks 4–5... */}</tbody>` pelas 3 linhas de dados:**

```jsx
<tbody>
  {/* ── Linha Previsto ─────────────────────────────── */}
  <tr className="border-b border-border bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors">
    <td className="sticky left-0 z-10 bg-blue-50 dark:bg-blue-950/20 px-4 py-2 min-w-[160px] border-r border-border">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Previsto</span>
        <span className="text-[10px] text-muted-foreground ml-1">{prevAcum.toFixed(1)}%</span>
      </div>
    </td>
    {projectWeeks.map((w) => {
      const wk = weekKey(w);
      return (
        <CelulaEditavelAvanco
          key={wk + "-prev"}
          registro={weekMap.get(wk) ?? null}
          campo="avanco_previsto_mensal"
          blocked={false}
          onSave={(campo, valor) => onSave(wk, campo, valor)}
        />
      );
    })}
  </tr>

  {/* ── Linha Real ──────────────────────────────────── */}
  <tr className="border-b border-border bg-green-50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors">
    <td className="sticky left-0 z-10 bg-green-50 dark:bg-green-950/20 px-4 py-2 min-w-[160px] border-r border-border">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        <span className="text-xs font-bold text-green-700 dark:text-green-300">Real</span>
        <span className="text-[10px] text-muted-foreground ml-1">{realAcum.toFixed(1)}%</span>
      </div>
      {prevAcum > 0 && (
        <>
          <div className="h-[3px] bg-muted rounded-full mt-1.5">
            <div
              className="h-[3px] bg-green-500 rounded-full"
              style={{ width: `${Math.min((realAcum / prevAcum) * 100, 100)}%` }}
            />
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {realAcum.toFixed(1)} / {prevAcum.toFixed(1)} prev
          </div>
        </>
      )}
    </td>
    {projectWeeks.map((w) => {
      const wk = weekKey(w);
      return (
        <CelulaEditavelAvanco
          key={wk + "-real"}
          registro={weekMap.get(wk) ?? null}
          campo="avanco_realizado_mensal"
          blocked={!isCurrentOrPastWeek(w)}
          onSave={(campo, valor) => onSave(wk, campo, valor)}
        />
      );
    })}
  </tr>

  {/* ── Linha Projetado ─────────────────────────────── */}
  <tr className="border-b border-border bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20 transition-colors">
    <td className="sticky left-0 z-10 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-2 min-w-[160px] border-r border-border">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Projetado</span>
        <span className="text-[10px] text-muted-foreground ml-1">{projAcum.toFixed(1)}%</span>
      </div>
      {prevAcum > 0 && (
        <>
          <div className="h-[3px] bg-muted rounded-full mt-1.5">
            <div
              className="h-[3px] bg-amber-500 rounded-full"
              style={{ width: `${Math.min((projAcum / prevAcum) * 100, 100)}%` }}
            />
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {projAcum.toFixed(1)} / {prevAcum.toFixed(1)} prev
          </div>
        </>
      )}
    </td>
    {projectWeeks.map((w) => {
      const wk = weekKey(w);
      return (
        <CelulaEditavelAvanco
          key={wk + "-proj"}
          registro={weekMap.get(wk) ?? null}
          campo="avanco_projetado"
          blocked={false}
          onSave={(campo, valor) => onSave(wk, campo, valor)}
        />
      );
    })}
  </tr>
</tbody>
```

- [ ] **Rodar o dev e navegar para `/planejamento/avancos`:**

Esperado: 3 linhas coloridas (azul/verde/amarelo) aparecem abaixo do header. Scroll horizontal funciona. Coluna esquerda permanece fixa. Células de Real em semanas futuras mostram "—" cinza. Clicar em célula editável abre input numérico.

- [ ] **Commit:**

```bash
git add src/components/planejamento/AvancoTabela.jsx
git commit -m "feat(M8-A6): AvancoTabela 3 linhas — Previsto/Real/Projetado + sticky progress bar"
```

---

## Task 5: `Avancos.jsx` — reescrita completa (queries + mutations + KPI cards + composição)

**Files:**
- Modify: `src/pages/Planejamento/Avancos.jsx` (reescrever completamente)

- [ ] **Substituir todo o conteúdo de `src/pages/Planejamento/Avancos.jsx` por:**

```jsx
import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getISOWeek, getISOWeekYear, startOfISOWeek,
  subMonths, addYears, parseISO,
  eachWeekOfInterval,
} from "date-fns";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/ui/PageHeader";
import AvancoTabela from "@/components/planejamento/AvancoTabela";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── Helpers locais (duplicados do AvancoTabela para cálculos de KPI/chart) ──

function weekKey(monday) {
  return `${getISOWeekYear(monday)}-W${String(getISOWeek(monday)).padStart(2, "0")}`;
}

function weekLabel(monday) {
  const { format } = require("date-fns"); // inline para evitar import duplicado
  return format(monday, "dd/MM");
}

function getProjectWeeks(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return [];
  try {
    return eachWeekOfInterval(
      { start: subMonths(parseISO(dataInicio), 3), end: addYears(parseISO(dataFim), 1) },
      { weekStartsOn: 1 }
    );
  } catch {
    return [];
  }
}

const EXPORT_COLUMNS = [
  { key: "semana_iso",                label: "Semana ISO",              type: "string", required: true },
  { key: "avanco_previsto_mensal",    label: "Previsto (%)",            type: "number" },
  { key: "avanco_realizado_mensal",   label: "Real (%)",                type: "number" },
  { key: "avanco_projetado",          label: "Projetado (%)",           type: "number" },
];

// ── Avancos ────────────────────────────────────────────────────────────────────

export default function Avancos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = React.useState(false);

  // ── Queries ──

  const { data: avancos = [], isPending, isError } = useQuery({
    queryKey: ["avanco_fisico", selectedProjectId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: projetoArr = [] } = useQuery({
    queryKey: ["projetos", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const projeto = projetoArr[0] ?? null;

  // ── Mutations ──

  const onErr = (e) =>
    toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }) => entities.AvancoFisico.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avanco_fisico", selectedProjectId] }),
    onError: onErr,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.AvancoFisico.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avanco_fisico", selectedProjectId] }),
    onError: onErr,
  });

  // ── Derived data ──

  const projectWeeks = useMemo(
    () => getProjectWeeks(projeto?.data_inicio, projeto?.data_fim_prevista),
    [projeto]
  );

  const weekMap = useMemo(() => {
    const m = new Map();
    avancos.forEach((r) => r.semana_iso && m.set(r.semana_iso, r));
    return m;
  }, [avancos]);

  const { prevAcum, realAcum, projAcum, desvio } = useMemo(() => {
    const currentWK = weekKey(startOfISOWeek(new Date()));
    let prev = 0, real = 0, proj = 0;
    avancos.forEach((r) => {
      if (r.semana_iso <= currentWK) {
        prev += r.avanco_previsto_mensal ?? 0;
        real += r.avanco_realizado_mensal ?? 0;
      }
      proj += r.avanco_projetado ?? 0;
    });
    return { prevAcum: prev, realAcum: real, projAcum: proj, desvio: real - prev };
  }, [avancos]);

  const chartData = useMemo(() => {
    let pAcum = 0, rAcum = 0;
    return projectWeeks.map((w) => {
      const wk = weekKey(w);
      const r = weekMap.get(wk);
      const prev = r?.avanco_previsto_mensal ?? 0;
      const real = r?.avanco_realizado_mensal ?? 0;
      const proj = r?.avanco_projetado ?? 0;
      pAcum += prev;
      rAcum += real;
      const { format } = require("date-fns");
      return { week: format(w, "dd/MM"), prev, real, proj, prevAcum: pAcum, realAcum: rAcum };
    });
  }, [projectWeeks, weekMap]);

  // ── Save handler ──

  const handleSave = (semanaIso, campo, valor) => {
    const existing = weekMap.get(semanaIso);
    if (existing) {
      updateMut.mutate({ id: existing.id, updates: { [campo]: valor } });
    } else {
      createMut.mutate({
        projeto_id: selectedProjectId,
        semana_iso: semanaIso,
        [campo]: valor,
      });
    }
  };

  // ── Early returns ──

  if (!selectedProjectId) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Selecione um projeto para ver o avanço físico.
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-32" />
              {[...Array(8)].map((_, j) => <Skeleton key={j} className="h-4 w-10" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-red-500 text-sm">
        Erro ao carregar dados de avanço físico.
      </div>
    );
  }

  if (!projeto?.data_inicio || !projeto?.data_fim_prevista) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto.
      </div>
    );
  }

  // ── Render ──

  const desvioPositive = desvio >= 0;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowImportExport(true)}>
            Import/Export
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Previsto Acumulado",
            value: `${prevAcum.toFixed(1)}%`,
            sub: "até semana atual",
            color: "text-blue-700 dark:text-blue-300",
            fill: "#3b82f6",
            pct: Math.min(prevAcum, 100),
          },
          {
            label: "Real Acumulado",
            value: `${realAcum.toFixed(1)}%`,
            sub: "até última semana lançada",
            color: "text-green-700 dark:text-green-300",
            fill: "#16a34a",
            pct: Math.min(realAcum, 100),
          },
          {
            label: "Projetado Acumulado",
            value: `${projAcum.toFixed(1)}%`,
            sub: "até fim do projeto",
            color: "text-amber-700 dark:text-amber-300",
            fill: "#f59e0b",
            pct: Math.min(projAcum, 100),
          },
          {
            label: "Desvio (Real − Previsto)",
            value: `${desvio >= 0 ? "+" : ""}${desvio.toFixed(1)}%`,
            sub: desvioPositive ? "adiantado" : "atraso em relação ao previsto",
            color: desvioPositive ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400",
            fill: desvioPositive ? "#16a34a" : "#dc2626",
            pct: Math.min(Math.abs(desvio), 100),
          },
        ].map(({ label, value, sub, color, fill, pct }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {label}
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
            <div className="h-[3px] bg-muted rounded-full mt-3">
              <div className="h-[3px] rounded-full" style={{ background: fill, width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabela Transposta */}
      <AvancoTabela
        projectWeeks={projectWeeks}
        weekMap={weekMap}
        prevAcum={prevAcum}
        realAcum={realAcum}
        projAcum={projAcum}
        onSave={handleSave}
      />

      {/* Gráfico Curva S */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-foreground text-sm">
            Evolução Semanal de Avanço Físico
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} interval={3} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              <Legend />
              <Bar yAxisId="left" dataKey="prev" name="Previsto sem." fill="#3b82f6" opacity={0.7} />
              <Bar yAxisId="left" dataKey="real" name="Real sem." fill="#16a34a" opacity={0.7} />
              <Bar yAxisId="left" dataKey="proj" name="Projetado sem." fill="#f59e0b" opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="prevAcum" name="Acum. Prev"
                stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="realAcum" name="Acum. Real"
                stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Import/Export */}
      {showImportExport && (
        <ImportExportDialog
          open={showImportExport}
          onOpenChange={setShowImportExport}
          data={avancos}
          columns={EXPORT_COLUMNS}
          entityName="AvancoFisico"
          projectId={selectedProjectId}
        />
      )}
    </div>
  );
}
```

> ⚠️ **Nota sobre `require("date-fns")` inline:** Substituir pelos imports no topo do arquivo — o `require()` inline foi usado apenas para clareza no diff; o arquivo final deve ter todos os imports no topo (incluindo `format` de date-fns).

- [ ] **Corrigir os imports: remover `require()` inline, garantir que `format` está importado no topo:**

Garantir que a linha de imports de date-fns inclua `format`:
```js
import {
  getISOWeek, getISOWeekYear, startOfISOWeek,
  subMonths, addYears, parseISO, format,
  eachWeekOfInterval,
} from "date-fns";
```

E substituir as 2 ocorrências de:
```js
const { format } = require("date-fns");
```
por simplesmente usar `format` (já importado no topo).

- [ ] **Verificar no browser:**

1. Navegar para `/planejamento/avancos` com um projeto selecionado que tenha datas configuradas
2. Esperado: PageHeader + 4 cards KPI + tabela transposta com 3 linhas + gráfico
3. Clicar em célula de Previsto → input numérico → digitar valor → Enter → valor salvo
4. Semanas futuras na linha Real → não clicáveis (cursor não-permitido)
5. KPI cards atualizam após salvar valores

- [ ] **Verificar dark mode** (toggle tema no topo):

Esperado: linhas da tabela com fundos coloridos corretos no modo escuro.

- [ ] **Commit:**

```bash
git add src/pages/Planejamento/Avancos.jsx
git commit -m "feat(M8-A6): Avancos.jsx — KPI cards + AvancoTabela + gráfico Curva S"
```

---

## Task 6: Limpeza — remover código legado de `Avancos.jsx`

**Files:**
- Modify: `src/pages/Planejamento/Avancos.jsx`

A reescrita da Task 5 já remove todo o código legado (dialog de formulário, estado `editing`, `showForm`, `EMPTY_FORM`, `fmtMes`, `sorted`, etc.). Esta task valida que nenhum resíduo permaneceu.

- [ ] **Verificar que não há referências ao código antigo:**

```bash
grep -n "showForm\|editing\|EMPTY_FORM\|fmtMes\|sorted\|avanco_previsto_acumulado\|avanco_realizado_acumulado" src/pages/Planejamento/Avancos.jsx
```

Esperado: nenhuma saída (zero linhas).

- [ ] **Verificar que não há console.log:**

```bash
grep -n "console\.log" src/pages/Planejamento/Avancos.jsx src/components/planejamento/AvancoTabela.jsx
```

Esperado: nenhuma saída.

- [ ] **Verificar que o componente importado em App.jsx ainda funciona (rota não quebrou):**

```bash
grep -n "Avancos\|avancos" src/App.jsx
```

Esperado: a rota `/planejamento/avancos` ainda aponta para `Avancos.jsx` — sem alteração necessária.

- [ ] **Verificar no browser — estado sem projeto selecionado:**

Trocar o projeto selecionado para nenhum → Esperado: "Selecione um projeto para ver o avanço físico."

- [ ] **Verificar estado de projeto sem datas:**

Usar um projeto sem `data_inicio`/`data_fim_prevista` → Esperado: "Configure as datas de início e fim do projeto..."

- [ ] **Commit final:**

```bash
git add src/pages/Planejamento/Avancos.jsx src/components/planejamento/AvancoTabela.jsx
git commit -m "feat(M8-A6): cleanup legado Avancos.jsx — tabela mensal e dialog removidos"
```

---

## Checklist de Self-Review

- [ ] **Spec coverage:**
  - ✅ PageHeader com Import/Export — Task 5
  - ✅ 4 KPI cards (Previsto Acum, Real Acum, Projetado Acum, Desvio) — Task 5
  - ✅ Tabela transposta 3 linhas × N semanas — Tasks 3 + 4
  - ✅ Header duplo (mês colspan + dd/MM) — Task 3
  - ✅ Escala −3m/+1ano — Task 1 (`getProjectWeeks`)
  - ✅ Coluna sticky com pill + progress bar — Task 4
  - ✅ Real bloqueado em semanas futuras — Task 4 (`isCurrentOrPastWeek`)
  - ✅ Inline edit click→input→Enter/blur salva — Task 2 (`CelulaEditavelAvanco`)
  - ✅ Gráfico ComposedChart Curva S — Task 5
  - ✅ Estados loading/empty/error — Task 5
  - ✅ Semana pertence ao mês da sua segunda-feira — Task 1 (`groupWeeksByMonth`)

- [ ] **Verificação de tipos:** `onSave(semanaIso, campo, valor)` é chamado em Task 4 e recebido em Task 5 — assinaturas consistentes.

- [ ] **`weekKey` format:** confirmar com Builder A1 que o formato `"YYYY-Www"` (ex: `"2026-W05"`) é o mesmo usado na migration SQL.
