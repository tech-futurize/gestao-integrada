# Histograma MO + Equipamentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar o módulo Histograma para suportar MO e Equipamentos numa tabela unificada com scroll horizontal por mês, toggle de visibilidade de colunas, edição inline, regras de bloqueio e gráfico combinado.

**Architecture:** Tabela `histogramas` recebe 3 novas colunas (`tipo`, `nome_recurso`, `qtd_projetado`) e perde `tipo_equipamento`. `HistogramaEquipamentos.jsx` é substituído por `HistogramaTabela.jsx` reutilizável. `Histograma.jsx` passa a ter tabs MO/Equipamentos e PageHeader com Import/Export.

**Tech Stack:** React 18, Vite, Supabase, TanStack React Query 5, Recharts, date-fns 3, Tailwind CSS, shadcn/ui.

---

## File Map

| Ação | Arquivo |
|------|---------|
| **Modificar** | `src/api/supabaseEntities.js` — atualizar campos de `Histograma` |
| **Criar** | `src/components/histograma/HistogramaTabela.jsx` — componente principal reutilizável |
| **Modificar** | `src/pages/Planejamento/Histograma.jsx` — tabs + PageHeader + import/export |
| **Remover** | `src/components/histograma/HistogramaEquipamentos.jsx` |

---

## Task 1: Schema Migration (Supabase)

**Files:**
- Criar: `supabase/migrations/20260527_histograma_redesign.sql` *(ou aplicar direto no Supabase Dashboard SQL Editor)*

- [ ] **Step 1: Abrir o Supabase Dashboard → SQL Editor e executar:**

```sql
-- 1. Adiciona discriminador de tipo
ALTER TABLE histogramas
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'Equipamento';

-- 2. Campo unificado para nome do recurso
ALTER TABLE histogramas
  ADD COLUMN IF NOT EXISTS nome_recurso TEXT;

-- 3. Migra dados existentes de tipo_equipamento → nome_recurso
UPDATE histogramas
  SET nome_recurso = tipo_equipamento
  WHERE tipo_equipamento IS NOT NULL AND nome_recurso IS NULL;

-- 4. Campo de quantidade projetada
ALTER TABLE histogramas
  ADD COLUMN IF NOT EXISTS qtd_projetado NUMERIC DEFAULT 0;

-- 5. Remove coluna antiga (só executar após confirmar que nome_recurso está populado)
ALTER TABLE histogramas DROP COLUMN IF EXISTS tipo_equipamento;
```

- [ ] **Step 2: Verificar que a migration rodou sem erros:**

```sql
SELECT id, tipo, nome_recurso, mes_referencia,
       quantidade_prevista_mensal, quantidade_realizada_mensal, qtd_projetado
FROM histogramas
LIMIT 5;
```

Esperado: colunas `tipo`, `nome_recurso`, `qtd_projetado` presentes; `tipo_equipamento` ausente; registros existentes com `nome_recurso` preenchido.

- [ ] **Step 3: Commit da migration**

```bash
git add .
git commit -m "feat(M7): migration histogramas — tipo, nome_recurso, qtd_projetado"
```

---

## Task 2: Atualizar supabaseEntities.js

**Files:**
- Modify: `src/api/supabaseEntities.js`

- [ ] **Step 1: Localizar onde `Histograma` é definido no TABLE_MAP**

```bash
grep -n "Histograma" src/api/supabaseEntities.js
```

Esperado: uma linha como `Histograma: 'histogramas',`

- [ ] **Step 2: Verificar se o shim usa um campo `tipo_equipamento` hardcoded em algum select/filter**

```bash
grep -n "tipo_equipamento" src/api/supabaseEntities.js
```

Se aparecer, remover as referências. O shim genérico de `filter/list/create/update/delete` não precisa listar colunas — ele usa `select('*')` por padrão, então basta garantir que `tipo_equipamento` não apareça em nenhum campo hardcoded.

- [ ] **Step 3: Confirmar que o mapeamento está correto**

Abrir `src/api/supabaseEntities.js` e garantir que existe:
```js
Histograma: 'histogramas',
```
Nenhuma outra alteração é necessária se o shim usa `select('*')`.

- [ ] **Step 4: Commit**

```bash
git add src/api/supabaseEntities.js
git commit -m "feat(M7): supabaseEntities — remover tipo_equipamento de Histograma"
```

---

## Task 3: Criar HistogramaTabela.jsx — Data Layer + Helpers

**Files:**
- Create: `src/components/histograma/HistogramaTabela.jsx`

- [ ] **Step 1: Criar o arquivo com imports, helpers e hooks de dados**

```jsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eachMonthOfInterval, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getProjectMonths(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return [];
  try {
    return eachMonthOfInterval({
      start: parseISO(dataInicio),
      end: parseISO(dataFim),
    });
  } catch {
    return [];
  }
}

function isFutureMonth(mesReferencia) {
  if (!mesReferencia) return false;
  const hojeInicio = startOfMonth(new Date());
  return parseISO(mesReferencia) > hojeInicio;
}

function mesKey(date) {
  return format(date, "yyyy-MM");
}

function mesLabel(date) {
  return format(date, "MMM/yy", { locale: ptBR });
}
```

- [ ] **Step 2: Adicionar o hook de dados e lógica derivada**

Ainda no mesmo arquivo, após os helpers:

```jsx
// ── Componente principal ──────────────────────────────────────────────────────
export default function HistogramaTabela({ tipo }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) =>
    toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  // Estado local
  const [showPrev, setShowPrev] = useState(true);
  const [showReal, setShowReal] = useState(true);
  const [showProj, setShowProj] = useState(true);
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [novoNome, setNovoNome] = useState("");

  // Queries
  const { data: histogramas = [], isPending, isError } = useQuery({
    queryKey: ["histogramas", selectedProjectId, tipo],
    queryFn: () => entities.Histograma.filter({ projeto_id: selectedProjectId, tipo }),
    enabled: !!selectedProjectId,
  });

  const { data: projetoArr = [] } = useQuery({
    queryKey: ["projeto-datas", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const projeto = projetoArr[0] ?? null;

  const projectMonths = useMemo(
    () => getProjectMonths(projeto?.data_inicio, projeto?.data_fim_prevista),
    [projeto]
  );
```

- [ ] **Step 3: Adicionar mutations**

Continuando dentro do componente:

```jsx
  // Mutations
  const updateCelula = useMutation({
    mutationFn: async ({ id, campo, valor, mesRef, nomeRecurso }) => {
      await entities.Histograma.update(id, { [campo]: valor });
      // Ao salvar Real, zera Projetado do mesmo mês/recurso
      if (campo === "quantidade_realizada_mensal") {
        const par = histogramas.find(
          (h) => h.nome_recurso === nomeRecurso && h.mes_referencia?.startsWith(mesRef)
        );
        if (par) {
          await entities.Histograma.update(par.id, { qtd_projetado: 0 });
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["histogramas"] }),
    onError: onErr,
  });

  const deleteRecurso = useMutation({
    mutationFn: async (nomeRecurso) => {
      const registros = histogramas.filter((h) => h.nome_recurso === nomeRecurso);
      for (const r of registros) {
        await entities.Histograma.delete(r.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["histogramas"] }),
    onError: onErr,
  });

  const createRecurso = useMutation({
    mutationFn: async (nome_recurso) => {
      for (const m of projectMonths) {
        await entities.Histograma.create({
          projeto_id: selectedProjectId,
          tipo,
          nome_recurso,
          mes_referencia: format(m, "yyyy-MM-dd"),
          quantidade_prevista_mensal: 0,
          quantidade_realizada_mensal: 0,
          qtd_projetado: 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["histogramas"] });
      setShowNovoDialog(false);
      setNovoNome("");
    },
    onError: onErr,
  });
```

- [ ] **Step 4: Adicionar dados derivados (recursos agrupados e dados do gráfico)**

```jsx
  // Dados agrupados por recurso
  const recursos = useMemo(() => {
    const nomes = [...new Set(histogramas.map((h) => h.nome_recurso))].sort();
    return nomes.map((nome) => {
      const registros = [...histogramas.filter((h) => h.nome_recurso === nome)].sort(
        (a, b) => (a.mes_referencia ?? "").localeCompare(b.mes_referencia ?? "")
      );
      let prevAcum = 0, realAcum = 0, projAcum = 0;
      const byMes = {};
      registros.forEach((r) => {
        prevAcum += r.quantidade_prevista_mensal ?? 0;
        realAcum += r.quantidade_realizada_mensal ?? 0;
        projAcum += r.qtd_projetado ?? 0;
        byMes[r.mes_referencia?.slice(0, 7) ?? ""] = r;
      });
      const pctReal = prevAcum > 0 ? Math.round((realAcum / prevAcum) * 100) : 0;
      const pctProj = prevAcum > 0 ? Math.round((projAcum / prevAcum) * 100) : 0;
      return { nome, byMes, totalPrev: prevAcum, totalReal: realAcum, totalProj: projAcum, pctReal, pctProj };
    });
  }, [histogramas]);

  // Dados do gráfico
  const chartData = useMemo(() => {
    let prevAcum = 0, realAcum = 0;
    return projectMonths.map((m) => {
      const mk = mesKey(m);
      const linhas = histogramas.filter((h) => h.mes_referencia?.startsWith(mk));
      const prev = linhas.reduce((s, h) => s + (h.quantidade_prevista_mensal ?? 0), 0);
      const real = linhas.reduce((s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0);
      const proj = linhas.reduce((s, h) => s + (h.qtd_projetado ?? 0), 0);
      prevAcum += prev;
      realAcum += real;
      return { mes: mesLabel(m), prev, real, proj, prevAcum, realAcum };
    });
  }, [histogramas, projectMonths]);
```

- [ ] **Step 5: Commit parcial**

```bash
git add src/components/histograma/HistogramaTabela.jsx
git commit -m "feat(M7): HistogramaTabela — data layer, helpers e mutations"
```

---

## Task 4: HistogramaTabela.jsx — UI (Chips, Tabela, Inline Edit)

**Files:**
- Modify: `src/components/histograma/HistogramaTabela.jsx`

- [ ] **Step 1: Adicionar o componente de célula editável inline FORA do componente principal**

Adicionar logo após os helpers (antes do `export default function HistogramaTabela`):

```jsx
// ── Célula inline editável — definida FORA do componente para evitar remount ──
function CelulaEditavel({ registro, campo, onSave }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(registro?.[campo] ?? 0);
  const disabled = campo === "quantidade_realizada_mensal"
    && isFutureMonth(registro?.mes_referencia);
  const valor = registro?.[campo] ?? 0;

  if (!registro) return <span className="text-muted-foreground text-xs">—</span>;

  if (!editing || disabled) {
    return (
      <span
        onClick={() => !disabled && setEditing(true)}
        className={`block text-center min-w-[32px] rounded px-1 py-0.5 text-sm font-medium
          ${disabled ? "text-muted-foreground/40 cursor-not-allowed" : "cursor-pointer hover:bg-muted/60"}`}
      >
        {valor || "·"}
      </span>
    );
  }
  return (
    <input
      autoFocus
      type="number"
      step="1"
      min="0"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { onSave(Number(local)); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") { setLocal(valor); setEditing(false); }
      }}
      className="w-14 text-center text-sm border border-blue-400 rounded px-1 py-0 focus:outline-none bg-background"
    />
  );
}
```

- [ ] **Step 2: Adicionar estados de loading/error + guard de projeto**

```jsx
  if (!selectedProjectId) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Selecione um projeto para ver o histograma.
      </div>
    );
  }
  if (isPending) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Carregando...</div>;
  }
  if (isError) {
    return (
      <div className="py-20 text-center text-red-500 text-sm">
        Erro ao carregar dados do histograma.
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
```

- [ ] **Step 3: Renderizar chips de toggle e tabela**

```jsx
  return (
    <div className="space-y-6">
      {/* Chips de toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exibir:</span>
        {[
          { key: "prev", label: "Previsto", active: showPrev, setActive: setShowPrev, activeStyle: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300" },
          { key: "real", label: "Real", active: showReal, setActive: setShowReal, activeStyle: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
          { key: "proj", label: "Projetado", active: showProj, setActive: setShowProj, activeStyle: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300" },
        ].map(({ key, label, active, setActive, activeStyle }) => (
          <button
            key={key}
            onClick={() => setActive((v) => !v)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors
              ${active ? activeStyle : "bg-muted text-muted-foreground border-border opacity-50"}`}
          >
            {active ? "●" : "○"} {label}
          </button>
        ))}
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowNovoDialog(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Novo {tipo === "MO" ? "Função" : "Equipamento"}
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-max min-w-full">
            <thead>
              {/* Linha 1: nome do recurso + meses agrupados + totais */}
              <tr className="bg-muted border-b border-border">
                <th rowSpan={2} className="sticky left-0 z-10 bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[140px]">
                  {tipo === "MO" ? "Função" : "Equipamento"}
                </th>
                {projectMonths.map((m) => {
                  const colCount = [showPrev, showReal, showProj].filter(Boolean).length || 1;
                  return (
                    <th key={mesKey(m)} colSpan={colCount}
                      className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l border-border whitespace-nowrap">
                      {mesLabel(m)}
                    </th>
                  );
                })}
                <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground border-l-2 border-border whitespace-nowrap">T.Prev</th>
                <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">T.Real</th>
                <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">T.Proj</th>
                <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">%Real</th>
                <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">%Proj</th>
                <th rowSpan={2} className="px-2 py-3"></th>
              </tr>
              {/* Linha 2: sub-colunas Prev/Real/Proj por mês */}
              <tr className="bg-muted/50 border-b border-border">
                {projectMonths.flatMap((m) => {
                  const mk = mesKey(m);
                  const cols = [];
                  if (showPrev) cols.push(<th key={`${mk}-prev`} className="px-2 py-1 text-center text-[10px] font-medium text-blue-600 border-l border-border whitespace-nowrap">Prev</th>);
                  if (showReal) cols.push(<th key={`${mk}-real`} className="px-2 py-1 text-center text-[10px] font-medium text-green-600 border-l border-border whitespace-nowrap">Real</th>);
                  if (showProj) cols.push(<th key={`${mk}-proj`} className="px-2 py-1 text-center text-[10px] font-medium text-yellow-600 border-l border-border whitespace-nowrap">Proj</th>);
                  if (cols.length === 0) cols.push(<th key={`${mk}-empty`} className="px-2 py-1 border-l border-border" />);
                  return cols;
                })}
              </tr>
            </thead>

            <tbody>
              {recursos.length === 0 && (
                <tr>
                  <td colSpan={99} className="py-12 text-center text-muted-foreground text-sm">
                    Nenhum {tipo === "MO" ? "função" : "equipamento"} cadastrado.
                    Clique em "Novo {tipo === "MO" ? "Função" : "Equipamento"}" para adicionar.
                  </td>
                </tr>
              )}
              {recursos.map((recurso, idx) => (
                <tr key={recurso.nome}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                  {/* Nome do recurso */}
                  <td className="sticky left-0 z-10 bg-card px-4 py-2 font-medium text-foreground whitespace-nowrap min-w-[140px]">
                    {recurso.nome}
                  </td>
                  {/* Células por mês */}
                  {projectMonths.flatMap((m) => {
                    const mk = mesKey(m);
                    const reg = recurso.byMes[mk];
                    const cells = [];
                    if (showPrev) cells.push(
                      <td key={`${mk}-prev`} className="px-1 py-1 border-l border-border text-center">
                        <CelulaEditavel registro={reg} campo="quantidade_prevista_mensal"
                          onSave={(v) => reg && updateCelula.mutate({ id: reg.id, campo: "quantidade_prevista_mensal", valor: v, mesRef: mk, nomeRecurso: recurso.nome })} />
                      </td>
                    );
                    if (showReal) cells.push(
                      <td key={`${mk}-real`} className={`px-1 py-1 border-l border-border text-center ${reg && isFutureMonth(reg.mes_referencia) ? "bg-muted/40" : ""}`}>
                        <CelulaEditavel registro={reg} campo="quantidade_realizada_mensal"
                          onSave={(v) => reg && updateCelula.mutate({ id: reg.id, campo: "quantidade_realizada_mensal", valor: v, mesRef: mk, nomeRecurso: recurso.nome })} />
                      </td>
                    );
                    if (showProj) cells.push(
                      <td key={`${mk}-proj`} className="px-1 py-1 border-l border-border text-center">
                        <CelulaEditavel registro={reg} campo="qtd_projetado"
                          onSave={(v) => reg && updateCelula.mutate({ id: reg.id, campo: "qtd_projetado", valor: v, mesRef: mk, nomeRecurso: recurso.nome })} />
                      </td>
                    );
                    return cells;
                  })}
                  {/* Totais */}
                  <td className="px-3 py-2 text-center font-semibold text-blue-700 dark:text-blue-300 border-l-2 border-border">{recurso.totalPrev}</td>
                  <td className="px-3 py-2 text-center font-semibold text-green-700 dark:text-green-300">{recurso.totalReal}</td>
                  <td className="px-3 py-2 text-center font-semibold text-yellow-700 dark:text-yellow-300">{recurso.totalProj}</td>
                  <td className="px-3 py-2 text-center font-semibold" style={{ color: recurso.pctReal >= 100 ? "#16a34a" : recurso.pctReal >= 80 ? "#d97706" : "#dc2626" }}>
                    {recurso.pctReal}%
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-muted-foreground">{recurso.pctProj}%</td>
                  <td className="px-2 py-2">
                    <button onClick={() => deleteRecurso.mutate(recurso.nome)}
                      className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Rodapé totais */}
            {recursos.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted font-bold text-xs">
                  <td className="sticky left-0 z-10 bg-muted px-4 py-2 text-muted-foreground uppercase tracking-wide">TOTAL</td>
                  {projectMonths.flatMap((m) => {
                    const mk = mesKey(m);
                    const linhas = histogramas.filter((h) => h.mes_referencia?.startsWith(mk));
                    const tPrev = linhas.reduce((s, h) => s + (h.quantidade_prevista_mensal ?? 0), 0);
                    const tReal = linhas.reduce((s, h) => s + (h.quantidade_realizada_mensal ?? 0), 0);
                    const tProj = linhas.reduce((s, h) => s + (h.qtd_projetado ?? 0), 0);
                    const cells = [];
                    if (showPrev) cells.push(<td key={`${mk}-prev`} className="px-2 py-2 text-center text-blue-700 dark:text-blue-300 border-l border-border">{tPrev || "·"}</td>);
                    if (showReal) cells.push(<td key={`${mk}-real`} className="px-2 py-2 text-center text-green-700 dark:text-green-300 border-l border-border">{tReal || "·"}</td>);
                    if (showProj) cells.push(<td key={`${mk}-proj`} className="px-2 py-2 text-center text-yellow-700 dark:text-yellow-300 border-l border-border">{tProj || "·"}</td>);
                    return cells;
                  })}
                  {(() => {
                    const gPrev = recursos.reduce((s, r) => s + r.totalPrev, 0);
                    const gReal = recursos.reduce((s, r) => s + r.totalReal, 0);
                    const gProj = recursos.reduce((s, r) => s + r.totalProj, 0);
                    const gPctReal = gPrev > 0 ? Math.round((gReal / gPrev) * 100) : 0;
                    const gPctProj = gPrev > 0 ? Math.round((gProj / gPrev) * 100) : 0;
                    return (
                      <>
                        <td className="px-3 py-2 text-center text-blue-700 dark:text-blue-300 border-l-2 border-border">{gPrev}</td>
                        <td className="px-3 py-2 text-center text-green-700 dark:text-green-300">{gReal}</td>
                        <td className="px-3 py-2 text-center text-yellow-700 dark:text-yellow-300">{gProj}</td>
                        <td className="px-3 py-2 text-center" style={{ color: gPctReal >= 100 ? "#16a34a" : gPctReal >= 80 ? "#d97706" : "#dc2626" }}>{gPctReal}%</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{gPctProj}%</td>
                        <td />
                      </>
                    );
                  })()}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
```

- [ ] **Step 4: Adicionar gráfico e dialog de novo recurso (fecha o return)**

```jsx
      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-foreground text-sm">
            Evolução Mensal — {tipo === "MO" ? "Mão de Obra" : "Equipamentos"}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {showPrev && <Bar yAxisId="left" dataKey="prev" name="Previsto" fill="#3b82f6" opacity={0.8} />}
              {showReal && <Bar yAxisId="left" dataKey="real" name="Real" fill="#16a34a" opacity={0.8} />}
              {showProj && <Bar yAxisId="left" dataKey="proj" name="Projetado" fill="#f59e0b" opacity={0.8} />}
              <Line yAxisId="right" type="monotone" dataKey="prevAcum" name="Acum. Prev"
                stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="realAcum" name="Acum. Real"
                stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dialog novo recurso */}
      <Dialog open={showNovoDialog} onOpenChange={setShowNovoDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo {tipo === "MO" ? "Função (MO)" : "Equipamento"}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1">
              <Label>{tipo === "MO" ? "Nome da função" : "Tipo de equipamento"} *</Label>
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder={tipo === "MO" ? "Ex: Soldador, Montador" : "Ex: Guindaste, Munck"}
                onKeyDown={(e) => e.key === "Enter" && novoNome.trim() && createRecurso.mutate(novoNome.trim())}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Serão criados {projectMonths.length} registros mensais (de{" "}
              {projeto?.data_inicio} a {projeto?.data_fim_prevista}) com valores zerados.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoDialog(false)}>Cancelar</Button>
            <Button
              variant="save"
              disabled={!novoNome.trim() || createRecurso.isPending}
              onClick={() => createRecurso.mutate(novoNome.trim())}
            >
              {createRecurso.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 5: Verificar build intermediário**

```bash
npm run build 2>&1 | tail -20
```

Esperado: sem erros. Se houver erros de importação ou JSX, corrigir antes de prosseguir.

- [ ] **Step 6: Commit**

```bash
git add src/components/histograma/HistogramaTabela.jsx
git commit -m "feat(M7): HistogramaTabela — tabela inline, chips, gráfico, dialog"
```

---

## Task 5: Atualizar Histograma.jsx (Tabs + PageHeader + Import/Export)

**Files:**
- Modify: `src/pages/Planejamento/Histograma.jsx`

- [ ] **Step 1: Reescrever Histograma.jsx com tabs e import/export**

```jsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Upload } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import HistogramaTabela from "@/components/histograma/HistogramaTabela";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const EXPORT_COLUMNS = [
  { key: "nome_recurso",                label: "Recurso",       type: "string", required: true },
  { key: "tipo",                        label: "Tipo",          type: "string", required: true },
  { key: "mes_referencia",              label: "Mês (YYYY-MM)", type: "string", required: true },
  { key: "quantidade_prevista_mensal",  label: "Qtd Prevista",  type: "number" },
  { key: "quantidade_realizada_mensal", label: "Qtd Real",      type: "number" },
  { key: "qtd_projetado",               label: "Qtd Projetado", type: "number" },
];

export default function Histograma() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("MO");
  const [showImportExport, setShowImportExport] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: histogramas = [] } = useQuery({
    queryKey: ["histogramas-all", selectedProjectId],
    queryFn: () => entities.Histograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const handleImport = async (row) => {
    setImporting(true);
    try {
      const mesRef = row.mes_referencia?.length === 7
        ? `${row.mes_referencia}-01`
        : row.mes_referencia;
      const payload = {
        projeto_id: selectedProjectId,
        nome_recurso: row.nome_recurso || "",
        tipo: row.tipo === "MO" ? "MO" : "Equipamento",
        mes_referencia: mesRef,
        quantidade_prevista_mensal: Number(row.quantidade_prevista_mensal) || 0,
        quantidade_realizada_mensal: Number(row.quantidade_realizada_mensal) || 0,
        qtd_projetado: Number(row.qtd_projetado) || 0,
      };
      const existing = await entities.Histograma.filter({
        projeto_id: selectedProjectId,
        nome_recurso: payload.nome_recurso,
        mes_referencia: payload.mes_referencia,
        tipo: payload.tipo,
      });
      if (existing.length > 0) {
        await entities.Histograma.update(existing[0].id, payload);
      } else {
        await entities.Histograma.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["histogramas"] });
    } catch (e) {
      toast({ title: "Erro ao importar", description: friendlyMessage(e), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const headerActions = (
    <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
      <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
    </Button>
  );

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={BarChart3}
            description="Selecione um projeto na barra lateral para ver o histograma."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader actions={headerActions} />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Tabs MO / Equipamentos */}
        <div className="flex gap-1 border-b border-border pb-0">
          {[
            { key: "MO", label: "Mão de Obra" },
            { key: "Equipamento", label: "Equipamentos" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === key
                  ? "bg-card border border-b-card border-border text-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <HistogramaTabela tipo={activeTab} />
      </div>

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Histograma"
        exportFileName="histograma"
        columns={EXPORT_COLUMNS}
        onExport={() => histogramas.map((h) => ({
          ...h,
          mes_referencia: h.mes_referencia?.slice(0, 7),
        }))}
        onImport={handleImport}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -20
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Planejamento/Histograma.jsx
git commit -m "feat(M7): Histograma.jsx — tabs MO/Equipamentos, PageHeader, ImportExport"
```

---

## Task 6: Remover HistogramaEquipamentos.jsx e Verificar Referências

**Files:**
- Remove: `src/components/histograma/HistogramaEquipamentos.jsx`

- [ ] **Step 1: Verificar que nenhum outro arquivo importa HistogramaEquipamentos**

```bash
grep -r "HistogramaEquipamentos" src/
```

Esperado: nenhum resultado (após a atualização do Histograma.jsx na Task 5).

- [ ] **Step 2: Remover o arquivo**

```bash
rm src/components/histograma/HistogramaEquipamentos.jsx
```

- [ ] **Step 3: Build final e verificação**

```bash
npm run build 2>&1 | tail -30
```

Esperado: `✓ built in Xs` sem erros ou warnings de módulo não encontrado.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat(M7): remover HistogramaEquipamentos.jsx — substituído por HistogramaTabela"
```

---

## Task 7: Verificação Manual

- [ ] **Step 1: Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

Abrir `http://localhost:5173` no browser.

- [ ] **Step 2: Verificar critérios de aceitação**

| Critério | Como testar |
|----------|-------------|
| Tabs MO / Equipamentos | Clicar em cada tab e verificar que os dados são filtrados por `tipo` |
| Chips toggle | Clicar em Previsto/Real/Projetado e verificar que as sub-colunas aparecem/somem na tabela e no gráfico |
| Real bloqueado no futuro | Tentar clicar numa célula Real de um mês futuro — deve estar desabilitada (opaca, sem cursor) |
| Salvar Real limpa Projetado | Editar Real de um mês que tenha Projetado → após salvar, Projetado deve virar 0 |
| Linha de totais | Verificar que o rodapé soma corretamente colunas e exibe %Real / %Proj |
| Gráfico | Verificar barras mensais (Prev/Real/Proj) e 2 linhas acumuladas |
| Import/Export | Clicar "Importar / Exportar", exportar CSV, verificar colunas, reimportar |
| Novo recurso | Clicar "+ Novo Função", preencher nome, verificar que cria registros para todos os meses do projeto |

- [ ] **Step 3: Invocar `/tester` para `/audit` ≥ 9 + documentação**

Abrir novo chat `/tester` com instrução:
> "Executar `/audit` no módulo Histograma (`/planejamento/histograma`). Score ≥ 9 em Visual, Functional e Trust. Após aprovação, criar/atualizar `docs/modulos/07-Histograma.md`."
