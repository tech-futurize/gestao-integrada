# Módulo 8 — Avanço Físico (migração semana_iso) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `avanco_fisico` de granularidade mensal para semanal (semana_iso), com tabela transposta de edição inline, gráfico ComposedChart com toggle Semana/Mês e import/export com escala -3m/+1 ano.

**Architecture:** (1) SQL migration adiciona `semana_iso TEXT` + `avanco_projetado NUMERIC` à tabela existente, convertendo histórico mensal para 1ª semana ISO do mês. (2) Utilitários ISO week em `src/utils/isoWeek.js` (date-fns, TDD). (3) `AvancoTabela.jsx` com edição inline seguindo padrão de `HistogramaTabela.jsx`. (4) `Avancos.jsx` reescrito com KPIs, ComposedChart e ImportExportDialog.

**Tech Stack:** Supabase PostgreSQL, React 18.2, date-fns 3.x, TanStack React Query 5.x, Recharts 2.x, Tailwind CSS 3.x, Vitest (utilitários)

---

## File Map

| Ação | Arquivo |
|------|---------|
| CREATE | `docs/database/supabase-migration-m8-avanco.sql` |
| CREATE | `src/utils/isoWeek.js` |
| CREATE | `src/utils/isoWeek.test.js` |
| CREATE | `src/components/avanco/AvancoTabela.jsx` |
| REWRITE | `src/pages/Planejamento/Avancos.jsx` |
| UPDATE | `docs/architecture/DATABASE.md` (seção avanco_fisico) |

---

## Task 1: SQL Migration File

**Files:**
- Create: `docs/database/supabase-migration-m8-avanco.sql`

- [ ] **Step 1.1: Criar o arquivo de migration**

Conteúdo exato de `docs/database/supabase-migration-m8-avanco.sql`:

```sql
-- Migration M8: avanco_fisico → granularidade semanal (semana_iso)
-- Aprovado pelo PO em 2026-05-27 — Opção A

-- 1. Adicionar colunas novas
ALTER TABLE avanco_fisico ADD COLUMN IF NOT EXISTS semana_iso TEXT;
ALTER TABLE avanco_fisico ADD COLUMN IF NOT EXISTS avanco_projetado NUMERIC DEFAULT 0;

-- 2. Popular semana_iso a partir de mes_referencia existente
--    to_char com 'IYYY-"W"IW' gera formato ISO 8601 ex: "2025-W01"
UPDATE avanco_fisico
SET semana_iso = to_char(mes_referencia, 'IYYY-"W"IW')
WHERE mes_referencia IS NOT NULL
  AND semana_iso IS NULL;

-- 3. Tornar semana_iso NOT NULL (após população)
ALTER TABLE avanco_fisico ALTER COLUMN semana_iso SET NOT NULL;

-- 4. Unique constraint projeto × semana (chave de negócio)
ALTER TABLE avanco_fisico
  ADD CONSTRAINT uq_avanco_fisico_projeto_semana
  UNIQUE (projeto_id, semana_iso);

-- 5. Deprecar mes_referencia: tornar nullable
--    (novos registros não precisam preencher mes_referencia)
ALTER TABLE avanco_fisico ALTER COLUMN mes_referencia DROP NOT NULL;

-- Verificação pós-migration
-- SELECT projeto_id, semana_iso, mes_referencia FROM avanco_fisico ORDER BY projeto_id, semana_iso LIMIT 20;
```

- [ ] **Step 1.2: Aplicar migration no Supabase via MCP**

Use a ferramenta `mcp__plugin_supabase_supabase__apply_migration` com:
- `name`: `m8_avanco_semana_iso`
- `query`: conteúdo do arquivo acima (sem os comentários de verificação)

Resultado esperado: sucesso sem erros. Se a tabela já tiver registros, a coluna `semana_iso` será preenchida. Se não houver registros, a migration ainda funcionará.

- [ ] **Step 1.3: Verificar com SQL**

Execute via `mcp__plugin_supabase_supabase__execute_sql`:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'avanco_fisico'
ORDER BY ordinal_position;
```

Esperado: colunas `semana_iso` (text, NO) e `avanco_projetado` (numeric, YES) presentes. Coluna `mes_referencia` deve aparecer como `is_nullable = YES`.

- [ ] **Step 1.4: Commit**

```bash
git add docs/database/supabase-migration-m8-avanco.sql
git commit -m "feat(M8): migration avanco_fisico — semana_iso + avanco_projetado"
```

---

## Task 2: isoWeek.js Utilities (TDD com date-fns)

**Files:**
- Create: `src/utils/isoWeek.js`
- Create: `src/utils/isoWeek.test.js`
- Modify: `vite.config.js` (adicionar bloco `test`)
- Modify: `package.json` (adicionar script `test`)

- [ ] **Step 2.1: Instalar Vitest**

```bash
npm install -D vitest
```

Saída esperada: `added N packages` sem erros.

- [ ] **Step 2.2: Adicionar configuração de test no vite.config.js**

Localizar o objeto retornado em `defineConfig` e adicionar a chave `test` ao final do objeto de configuração (APÓS o fechamento de `server`, `resolve`, etc.):

```js
// Dentro do objeto retornado por defineConfig, adicionar:
test: {
  globals: true,
  environment: 'node',
},
```

O bloco `return { ... }` já existente deve ficar:
```js
return {
  plugins: [...],
  server: {...},
  resolve: {...},
  optimizeDeps: {...},
  test: {
    globals: true,
    environment: 'node',
  },
};
```

- [ ] **Step 2.3: Adicionar script test no package.json**

No objeto `"scripts"` de `package.json`, adicionar:
```json
"test": "vitest run"
```

- [ ] **Step 2.4: Escrever os testes (arquivo de teste primeiro)**

Criar `src/utils/isoWeek.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  dateToISOWeek,
  isoWeekToDate,
  isFutureWeek,
  getCurrentISOWeek,
  generateWeeksScale,
  formatWeekLabel,
  groupWeeksByMonth,
} from './isoWeek';

describe('dateToISOWeek', () => {
  it('converte 2025-01-01 (quarta) para 2025-W01', () => {
    expect(dateToISOWeek(new Date(2025, 0, 1))).toBe('2025-W01');
  });
  it('converte 2024-12-30 (segunda) para 2025-W01 (virada de ano ISO)', () => {
    expect(dateToISOWeek(new Date(2024, 11, 30))).toBe('2025-W01');
  });
  it('converte 2025-12-28 (domingo) para 2025-W52', () => {
    expect(dateToISOWeek(new Date(2025, 11, 28))).toBe('2025-W52');
  });
  it('retorna string no formato YYYY-Www', () => {
    const result = dateToISOWeek(new Date(2025, 5, 15));
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('isoWeekToDate', () => {
  it('2025-W01 → segunda-feira 2024-12-30', () => {
    const d = isoWeekToDate('2025-W01');
    expect(d.getDay()).toBe(1); // Monday
    expect(d.toISOString().slice(0, 10)).toBe('2024-12-30');
  });
  it('2025-W02 → segunda-feira 2025-01-06', () => {
    const d = isoWeekToDate('2025-W02');
    expect(d.toISOString().slice(0, 10)).toBe('2025-01-06');
  });
  it('roundtrip: dateToISOWeek(isoWeekToDate(w)) === w', () => {
    const weeks = ['2025-W01', '2025-W15', '2025-W52', '2026-W01'];
    weeks.forEach(w => {
      expect(dateToISOWeek(isoWeekToDate(w))).toBe(w);
    });
  });
});

describe('isFutureWeek', () => {
  it('semana claramente passada retorna false', () => {
    expect(isFutureWeek('2020-W01')).toBe(false);
  });
  it('semana claramente futura retorna true', () => {
    expect(isFutureWeek('2099-W52')).toBe(true);
  });
  it('semana atual retorna false', () => {
    const current = getCurrentISOWeek();
    expect(isFutureWeek(current)).toBe(false);
  });
});

describe('generateWeeksScale', () => {
  it('gera pelo menos 1 semana para intervalo de 7 dias', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 6), new Date(2025, 0, 12));
    expect(weeks.length).toBeGreaterThanOrEqual(1);
  });
  it('não tem semanas duplicadas', () => {
    const weeks = generateWeeksScale(new Date(2024, 11, 1), new Date(2025, 2, 31));
    expect(new Set(weeks).size).toBe(weeks.length);
  });
  it('todas as semanas estão em ordem crescente', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 1), new Date(2025, 5, 30));
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i] > weeks[i - 1]).toBe(true);
    }
  });
  it('a primeira semana contém ou é anterior à data de início', () => {
    const start = new Date(2025, 0, 15);
    const weeks = generateWeeksScale(start, new Date(2025, 1, 15));
    expect(weeks[0] <= dateToISOWeek(start)).toBe(true);
  });
});

describe('formatWeekLabel', () => {
  it('formata 2025-W01 como S01', () => {
    expect(formatWeekLabel('2025-W01')).toBe('S01');
  });
  it('formata 2025-W42 como S42', () => {
    expect(formatWeekLabel('2025-W42')).toBe('S42');
  });
});

describe('groupWeeksByMonth', () => {
  it('2025-W01 (quinta = 2 jan) fica no grupo jan/25', () => {
    const groups = groupWeeksByMonth(['2025-W01', '2025-W02', '2025-W03']);
    expect(groups[0].label.toLowerCase()).toMatch(/jan/);
    expect(groups[0].weeks).toContain('2025-W01');
  });
  it('gera múltiplos grupos para range de 3 meses', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 1), new Date(2025, 2, 31));
    const groups = groupWeeksByMonth(weeks);
    expect(groups.length).toBeGreaterThanOrEqual(3);
  });
  it('cada semana aparece em exatamente um grupo', () => {
    const weeks = generateWeeksScale(new Date(2025, 0, 1), new Date(2025, 2, 31));
    const groups = groupWeeksByMonth(weeks);
    const allWeeks = groups.flatMap(g => g.weeks);
    expect(allWeeks.length).toBe(weeks.length);
    expect(new Set(allWeeks).size).toBe(weeks.length);
  });
});
```

- [ ] **Step 2.5: Rodar testes — verificar que FALHAM**

```bash
npx vitest run src/utils/isoWeek.test.js
```

Esperado: erro `Cannot find module './isoWeek'` ou similar. Os testes devem falhar pois o arquivo ainda não existe.

- [ ] **Step 2.6: Implementar src/utils/isoWeek.js**

```js
import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeekYear,
  addWeeks,
  addDays,
  eachWeekOfInterval,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Converte Date → string "YYYY-Www" (ISO 8601) */
export function dateToISOWeek(date) {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Retorna semana ISO atual como "YYYY-Www" */
export function getCurrentISOWeek() {
  return dateToISOWeek(new Date());
}

/** Retorna true se semana_iso é estritamente posterior à semana atual */
export function isFutureWeek(semana_iso) {
  return semana_iso > getCurrentISOWeek();
}

/**
 * Retorna a segunda-feira de uma semana ISO "YYYY-Www".
 * Usa April 1 como âncora (sempre no mesmo ano ISO que o ano calendário).
 */
export function isoWeekToDate(semana_iso) {
  const [yearStr, weekStr] = semana_iso.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  const refDate = new Date(year, 3, 1); // 1º de abril
  const weekYearStart = startOfISOWeekYear(refDate); // segunda-feira da W01
  return addWeeks(weekYearStart, week - 1);
}

/**
 * Gera array de semanas ISO de startDate a endDate (inclusive).
 * Cada semana é representada pela sua segunda-feira (ISO 8601).
 */
export function generateWeeksScale(startDate, endDate) {
  const mondays = eachWeekOfInterval(
    { start: new Date(startDate), end: new Date(endDate) },
    { weekStartsOn: 1 }
  );
  const seen = new Set();
  const result = [];
  for (const d of mondays) {
    const w = dateToISOWeek(d);
    if (!seen.has(w)) {
      seen.add(w);
      result.push(w);
    }
  }
  return result;
}

/** Formata "2025-W03" → "S03" */
export function formatWeekLabel(semana_iso) {
  return 'S' + semana_iso.split('-W')[1];
}

/**
 * Agrupa semanas por mês usando a quinta-feira da semana para atribuição
 * (quinta define o ano ISO, elimina ambiguidade W01/W52 nas bordas).
 * Retorna [{key: "2025-01", label: "jan/25", weeks: ["2025-W01", ...]}]
 */
export function groupWeeksByMonth(weeks) {
  const groups = [];
  for (const w of weeks) {
    const monday   = isoWeekToDate(w);
    const thursday = addDays(monday, 3);
    const key      = format(thursday, 'yyyy-MM');
    const label    = format(thursday, "MMM/yy", { locale: ptBR });
    const last     = groups[groups.length - 1];
    if (last && last.key === key) {
      last.weeks.push(w);
    } else {
      groups.push({ key, label, weeks: [w] });
    }
  }
  return groups;
}
```

- [ ] **Step 2.7: Rodar testes — verificar que PASSAM**

```bash
npx vitest run src/utils/isoWeek.test.js
```

Esperado:
```
✓ src/utils/isoWeek.test.js (17)
  ✓ dateToISOWeek (4)
  ✓ isoWeekToDate (3)
  ✓ isFutureWeek (3)
  ✓ generateWeeksScale (4)
  ✓ formatWeekLabel (2)
  ✓ groupWeeksByMonth (3)

Test Files  1 passed (1)
Tests       17 passed (17)
```

Se algum teste falhar, ajustar a implementação sem modificar os testes.

- [ ] **Step 2.8: Commit**

```bash
git add src/utils/isoWeek.js src/utils/isoWeek.test.js vite.config.js package.json
git commit -m "feat(M8): utilitários isoWeek.js + testes Vitest"
```

---

## Task 3: AvancoTabela Component

**Files:**
- Create: `src/components/avanco/AvancoTabela.jsx`

**Padrão:** Segue `src/components/histograma/HistogramaTabela.jsx` — `CelulaEditavel` definida FORA do componente principal para evitar remount.

- [ ] **Step 3.1: Criar src/components/avanco/AvancoTabela.jsx**

```jsx
import { useState } from "react";
import React from "react";
import { isFutureWeek, formatWeekLabel } from "@/utils/isoWeek";

// Definido fora do componente principal — evita remount ao re-render do pai
function CelulaEditavel({ value, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const cancelRef = React.useRef(false);

  if (disabled) {
    return (
      <td
        className="px-2 py-1 text-center bg-muted text-muted-foreground text-xs w-14 cursor-not-allowed select-none"
        title="Semana futura — edição de Real bloqueada"
      >
        —
      </td>
    );
  }

  const valor = value ?? 0;

  const handleBlur = () => {
    if (cancelRef.current) { cancelRef.current = false; return; }
    const num = parseFloat(inputVal);
    if (!isNaN(num) && num !== valor) onSave(num);
    setEditing(false);
  };

  return (
    <td
      className="px-1 py-1 text-center cursor-pointer hover:bg-accent w-14"
      onClick={() => { if (!editing) { setInputVal(String(valor)); setEditing(true); } }}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => {
            if (e.key === "Enter") { cancelRef.current = false; e.target.blur(); }
            if (e.key === "Escape") { cancelRef.current = true; setEditing(false); }
          }}
          className="w-12 text-center border rounded text-xs p-0"
        />
      ) : (
        <span className="text-xs tabular-nums">{valor.toFixed(2)}</span>
      )}
    </td>
  );
}

/**
 * Tabela transposta de Avanço Físico.
 *
 * Props:
 *   weeks       {string[]}   — todas as semanas ISO da escala ("YYYY-Www")
 *   monthGroups {Array}      — [{key, label, weeks[]}] de groupWeeksByMonth()
 *   dataMap     {Map}        — Map<semana_iso, registro> com dados do banco
 *   onSave      {Function}   — (semana_iso, field, value) => void
 */
export default function AvancoTabela({ weeks, monthGroups, dataMap, onSave }) {
  const ROWS = [
    {
      label: "Previsto",
      field: "avanco_previsto_mensal",
      labelClass: "text-blue-600 dark:text-blue-400",
      isDisabled: () => false,
    },
    {
      label: "Real",
      field: "avanco_realizado_mensal",
      labelClass: "text-green-600 dark:text-green-400",
      isDisabled: w => isFutureWeek(w),
    },
    {
      label: "Projetado",
      field: "avanco_projetado",
      labelClass: "text-yellow-600 dark:text-yellow-500",
      isDisabled: w => !isFutureWeek(w), // editável apenas para semanas futuras
    },
  ];

  // Totais do rodapé por row
  const totals = ROWS.map(row => ({
    field: row.field,
    total: weeks.reduce((s, w) => s + (dataMap.get(w)?.[row.field] ?? 0), 0),
  }));

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-max min-w-full">
          <thead>
            {/* Linha 1: meses (colspan = nº semanas) */}
            <tr className="bg-muted border-b border-border">
              <th
                rowSpan={2}
                className="sticky left-0 z-10 bg-muted px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[110px]"
              >
                Tipo
              </th>
              {monthGroups.map(g => (
                <th
                  key={g.key}
                  colSpan={g.weeks.length}
                  className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-l border-border whitespace-nowrap capitalize"
                >
                  {g.label}
                </th>
              ))}
              <th
                rowSpan={2}
                className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground border-l-2 border-border whitespace-nowrap"
              >
                Total
              </th>
            </tr>
            {/* Linha 2: semanas */}
            <tr className="bg-muted/50 border-b border-border">
              {weeks.map(w => (
                <th
                  key={w}
                  className="px-1 py-1 text-center text-[10px] font-medium text-muted-foreground border-l border-border whitespace-nowrap w-14"
                >
                  {formatWeekLabel(w)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row, idx) => (
              <tr
                key={row.field}
                className={`border-b border-border hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
              >
                <td className={`sticky left-0 z-10 bg-card px-4 py-2 font-semibold whitespace-nowrap min-w-[110px] ${row.labelClass}`}>
                  {row.label}
                </td>
                {weeks.map(w => {
                  const rec = dataMap.get(w);
                  return (
                    <CelulaEditavel
                      key={w}
                      value={rec?.[row.field] ?? 0}
                      disabled={row.isDisabled(w)}
                      onSave={num => onSave(w, row.field, num)}
                    />
                  );
                })}
                <td className={`px-3 py-2 text-center font-semibold text-xs border-l-2 border-border tabular-nums ${row.labelClass}`}>
                  {totals.find(t => t.field === row.field)?.total.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>

          {/* Rodapé TOTAL por semana */}
          <tfoot>
            <tr className="border-t-2 border-border bg-muted font-bold text-xs">
              <td className="sticky left-0 z-10 bg-muted px-4 py-2 text-muted-foreground uppercase tracking-wide">
                TOTAL
              </td>
              {weeks.map(w => {
                const rec  = dataMap.get(w);
                const prev = rec?.avanco_previsto_mensal  ?? 0;
                const real = rec?.avanco_realizado_mensal ?? 0;
                const proj = rec?.avanco_projetado        ?? 0;
                const sum  = prev + real + proj;
                return (
                  <td key={w} className="px-1 py-2 text-center border-l border-border tabular-nums">
                    {sum > 0 ? sum.toFixed(1) : "·"}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center border-l-2 border-border tabular-nums">
                {totals.reduce((s, t) => s + t.total, 0).toFixed(2)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.2: Verificar que não há erros de importação**

```bash
npx vite build --mode development 2>&1 | head -30
```

Esperado: sem erros de módulo não encontrado. (Pode ter warnings de outros arquivos — ignorar.)

- [ ] **Step 3.3: Commit**

```bash
git add src/components/avanco/AvancoTabela.jsx
git commit -m "feat(M8): AvancoTabela — tabela transposta com edição inline"
```

---

## Task 4: Avancos.jsx — Reescrita Completa

**Files:**
- Rewrite: `src/pages/Planejamento/Avancos.jsx`

- [ ] **Step 4.1: Reescrever src/pages/Planejamento/Avancos.jsx**

```jsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Upload } from "lucide-react";
import { addMonths, parseISO } from "date-fns";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import AvancoTabela from "@/components/avanco/AvancoTabela";
import {
  generateWeeksScale,
  groupWeeksByMonth,
} from "@/utils/isoWeek";

const EXPORT_COLUMNS = [
  { key: "semana_iso",              label: "Semana ISO",    type: "string", required: true },
  { key: "avanco_previsto_mensal",  label: "Previsto (%)",  type: "number" },
  { key: "avanco_realizado_mensal", label: "Realizado (%)", type: "number" },
  { key: "avanco_projetado",        label: "Projetado (%)", type: "number" },
];

export default function Avancos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = useState(false);
  const [viewMode, setViewMode] = useState("mes"); // "semana" | "mes"

  // ── Queries ──────────────────────────────────────────────────────────────────

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

  // ── Escala de semanas (-3m / +1a) ────────────────────────────────────────────

  const { weeks, monthGroups } = useMemo(() => {
    if (!projeto?.data_inicio || !projeto?.data_fim_prevista) {
      return { weeks: [], monthGroups: [] };
    }
    const start = addMonths(parseISO(projeto.data_inicio), -3);
    const end   = addMonths(parseISO(projeto.data_fim_prevista), 12);
    const ws    = generateWeeksScale(start, end);
    return { weeks: ws, monthGroups: groupWeeksByMonth(ws) };
  }, [projeto]);

  // ── Map semana_iso → registro ─────────────────────────────────────────────────

  const dataMap = useMemo(() => {
    const m = new Map();
    for (const row of avancos) {
      if (row.semana_iso) m.set(row.semana_iso, row);
    }
    return m;
  }, [avancos]);

  // ── Acumulados e KPIs ────────────────────────────────────────────────────────

  const { withAccum, accumByWeek, kpis } = useMemo(() => {
    const sorted = weeks
      .filter(w => dataMap.has(w))
      .map(w => dataMap.get(w));

    let prevAcum = 0, realAcum = 0, projAcum = 0;
    const accumByWeek = new Map();

    const withAccum = sorted.map(row => {
      prevAcum += row.avanco_previsto_mensal  ?? 0;
      realAcum += row.avanco_realizado_mensal ?? 0;
      projAcum += row.avanco_projetado        ?? 0;
      accumByWeek.set(row.semana_iso, { prevAcum, realAcum, projAcum });
      return { ...row, prevAcum, realAcum, projAcum };
    });

    const totalPrev    = prevAcum;
    const pctTotalReal = totalPrev > 0 ? (realAcum / totalPrev) * 100 : 0;
    const pctTotalProj = totalPrev > 0 ? (projAcum / totalPrev) * 100 : 0;
    const desvio       = realAcum - prevAcum;

    return { withAccum, accumByWeek, kpis: { pctTotalReal, pctTotalProj, desvio } };
  }, [weeks, dataMap]);

  // ── Dados do gráfico ──────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    if (viewMode === "semana") {
      return withAccum.map(row => ({
        name:     "S" + row.semana_iso.split("-W")[1],
        previsto:  row.avanco_previsto_mensal  ?? 0,
        realizado: row.avanco_realizado_mensal ?? 0,
        projetado: row.avanco_projetado        ?? 0,
        prevAcum:  row.prevAcum,
        realAcum:  row.realAcum,
      }));
    }
    // Modo mês: agrupa semanas por monthGroups
    return monthGroups.map(g => {
      const prev = g.weeks.reduce((s, w) => s + (dataMap.get(w)?.avanco_previsto_mensal  ?? 0), 0);
      const real = g.weeks.reduce((s, w) => s + (dataMap.get(w)?.avanco_realizado_mensal ?? 0), 0);
      const proj = g.weeks.reduce((s, w) => s + (dataMap.get(w)?.avanco_projetado        ?? 0), 0);
      const lastW = g.weeks[g.weeks.length - 1];
      const acum  = accumByWeek.get(lastW) ?? { prevAcum: 0, realAcum: 0 };
      return { name: g.label, previsto: prev, realizado: real, projetado: proj, prevAcum: acum.prevAcum, realAcum: acum.realAcum };
    });
  }, [viewMode, withAccum, monthGroups, dataMap, accumByWeek]);

  // ── Mutation de save inline ───────────────────────────────────────────────────

  const saveMut = useMutation({
    mutationFn: async ({ semana_iso, field, value }) => {
      const existing = dataMap.get(semana_iso);
      const payload = {
        projeto_id:              selectedProjectId,
        semana_iso,
        avanco_previsto_mensal:  existing?.avanco_previsto_mensal  ?? 0,
        avanco_realizado_mensal: existing?.avanco_realizado_mensal ?? 0,
        avanco_projetado:        existing?.avanco_projetado        ?? 0,
        [field]: value,
      };
      // Regra: ao salvar Real, zerar Projetado da mesma semana
      if (field === "avanco_realizado_mensal") {
        payload.avanco_projetado = 0;
      }
      if (existing?.id) {
        return entities.AvancoFisico.update(existing.id, payload);
      }
      return entities.AvancoFisico.create(payload);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["avanco_fisico", selectedProjectId] }),
    onError: e =>
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const handleSave = (semana_iso, field, value) => {
    saveMut.mutate({ semana_iso, field, value });
  };

  // ── Import / Export ───────────────────────────────────────────────────────────

  const handleExport = () =>
    weeks.map(w => {
      const row = dataMap.get(w) ?? {};
      return {
        semana_iso:              w,
        avanco_previsto_mensal:  row.avanco_previsto_mensal  ?? 0,
        avanco_realizado_mensal: row.avanco_realizado_mensal ?? 0,
        avanco_projetado:        row.avanco_projetado        ?? 0,
      };
    });

  const handleImport = async row => {
    const existing = await entities.AvancoFisico.filter({
      projeto_id: selectedProjectId,
      semana_iso: row.semana_iso,
    });
    const payload = {
      projeto_id:              selectedProjectId,
      semana_iso:              row.semana_iso,
      avanco_previsto_mensal:  parseFloat(row.avanco_previsto_mensal)  || 0,
      avanco_realizado_mensal: parseFloat(row.avanco_realizado_mensal) || 0,
      avanco_projetado:        parseFloat(row.avanco_projetado)        || 0,
    };
    if (existing.length > 0) {
      await entities.AvancoFisico.update(existing[0].id, payload);
    } else {
      await entities.AvancoFisico.create(payload);
    }
    queryClient.invalidateQueries({ queryKey: ["avanco_fisico", selectedProjectId] });
  };

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={TrendingUp}
            description="Selecione um projeto na barra lateral para ver o avanço físico."
          />
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={TrendingUp}
            description="Erro ao carregar dados de avanço físico. Tente recarregar a página."
          />
        </div>
      </div>
    );
  }

  if (!projeto?.data_inicio || !projeto?.data_fim_prevista) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={TrendingUp}
            description="Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto."
          />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "%Total Real",       value: `${kpis.pctTotalReal.toFixed(1)}%`, color: "#3b82f6" },
            { label: "%Total Projetado",  value: `${kpis.pctTotalProj.toFixed(1)}%`, color: "#f59e0b" },
            {
              label: "Desvio Acumulado",
              value: `${kpis.desvio >= 0 ? "+" : ""}${kpis.desvio.toFixed(1)}%`,
              color: kpis.desvio >= 0 ? "#16a34a" : "#ef4444",
            },
            { label: "Semanas c/ Dados", value: avancos.filter(a => a.semana_iso).length, color: "#26405d" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Avanço Físico — {viewMode === "mes" ? "Mensal" : "Semanal"}
              </p>
              <div className="flex gap-1">
                {[
                  { key: "mes",    label: "Mês" },
                  { key: "semana", label: "Semana" },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setViewMode(m.key)}
                    className={`px-2.5 py-0.5 text-xs rounded transition-colors ${
                      viewMode === m.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis yAxisId="left"  tick={{ fontSize: 10 }} unit="%" domain={[0, "auto"]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v, name) => [`${Number(v).toFixed(2)}%`, name]} />
                <Legend />
                <Bar yAxisId="left" dataKey="previsto"  name="Previsto"  fill="#e5e7eb" radius={[3,3,0,0]} />
                <Bar yAxisId="left" dataKey="realizado" name="Realizado" fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar yAxisId="left" dataKey="projetado" name="Projetado" fill="#f59e0b" radius={[3,3,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="prevAcum" name="Prev. Acum." stroke="#9ca3af" strokeDasharray="5 3" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="realAcum" name="Real. Acum." stroke="#2563eb" dot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela transposta */}
        <AvancoTabela
          weeks={weeks}
          monthGroups={monthGroups}
          dataMap={dataMap}
          onSave={handleSave}
          isSaving={saveMut.isPending}
        />

      </div>

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Avanço Físico"
        exportFileName="avanco_fisico"
        columns={EXPORT_COLUMNS}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
}
```

- [ ] **Step 4.2: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -20
```

Esperado: `✓ built in Xs` sem erros. Warnings de `recharts` sobre defaultProps podem ser ignorados.

- [ ] **Step 4.3: Verificar no browser (npm run dev)**

1. Iniciar: `npm run dev:vite`
2. Navegar para `/planejamento/avancos`
3. Verificar:
   - KPIs aparecem com valores `0.0%` (se sem dados) ou valores corretos
   - Tabela com header duplo (meses → semanas) é renderizada
   - Células de Real estão bloqueadas (—) para semanas futuras
   - Editar uma célula Previsto: clicar → input → tab/enter → valor salvo
   - Editar Real em semana passada: valor salvo, célula Projetado da mesma semana zerada
   - Toggle Mês/Semana no gráfico muda a visualização
   - Botão Importar/Exportar abre o dialog
   - Export baixa CSV com todas as semanas da escala

- [ ] **Step 4.4: Commit**

```bash
git add src/pages/Planejamento/Avancos.jsx
git commit -m "feat(M8): Avancos.jsx — reescrita completa semanal com tabela transposta e gráfico"
```

---

## Task 5: DATABASE.md Update

**Files:**
- Modify: `docs/architecture/DATABASE.md` (seção `### avanco_fisico`)

- [ ] **Step 5.1: Atualizar seção avanco_fisico no DATABASE.md**

Localizar a seção `### avanco_fisico` e substituir por:

```markdown
### avanco_fisico
Avanço físico previsto / realizado / projetado por semana ISO.

| Coluna | Tipo | Notas |
|--------|------|-------|
| projeto_id | UUID FK → projetos | CASCADE |
| semana_iso | TEXT NOT NULL | Formato ISO 8601 "YYYY-Www" ex: "2025-W01". Chave de negócio. |
| avanco_previsto_mensal | NUMERIC | % previsto na semana (nome mantido por compatibilidade) |
| avanco_realizado_mensal | NUMERIC | % realizado na semana — bloqueado para semanas futuras na UI |
| avanco_projetado | NUMERIC DEFAULT 0 | % projetado — zerado automaticamente ao salvar Real na mesma semana |
| mes_referencia | DATE | **Deprecada** — preenchida por dados históricos convertidos; novos registros não usam |
| avanco_previsto_acumulado | NUMERIC | **Deprecada** — acumulado calculado no front, não persistido |
| avanco_realizado_acumulado | NUMERIC | **Deprecada** — acumulado calculado no front, não persistido |

> **Constraint:** `UNIQUE (projeto_id, semana_iso)`
> **Acumulados:** calculados no front em `Avancos.jsx` — não persistidos.
> **Migration:** `docs/database/supabase-migration-m8-avanco.sql`
```

- [ ] **Step 5.2: Adicionar entrada na tabela Migrations**

Na seção `## Migrations` do DATABASE.md, adicionar linha:

```markdown
| 2026-05-27 | `supabase-migration-m8-avanco.sql` | M8 — Adiciona `semana_iso TEXT` e `avanco_projetado NUMERIC`; converte histórico; depreca `mes_referencia` | `avanco_fisico` |
```

- [ ] **Step 5.3: Commit**

```bash
git add docs/architecture/DATABASE.md
git commit -m "docs(M8): atualizar DATABASE.md — avanco_fisico migrado para semana_iso"
```

---

## Task 6: Verificação Final e Build

- [ ] **Step 6.1: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: todos os testes passando (isoWeek.test.js + qualquer outro).

- [ ] **Step 6.2: Build de produção limpo**

```bash
npm run build
```

Esperado: `✓ built in Xs` sem erros de compilação.

- [ ] **Step 6.3: Checklist de critérios de aceite (manual)**

Abrir `npm run dev:vite` e verificar `/planejamento/avancos`:

- [ ] Tabela renderiza com header duplo (meses / semanas)
- [ ] Semanas futuras na linha Real mostram `—` (não editáveis)
- [ ] Editar célula Previsto salva via mutation sem reload
- [ ] Editar célula Real em semana passada: célula Projetado da mesma semana vira 0
- [ ] KPIs `%Total Real`, `%Total Projetado`, `Desvio` calculados corretamente
- [ ] Toggle Mês/Semana muda eixo X do gráfico
- [ ] Linhas acumuladas (Prev. Acum. / Real. Acum.) visíveis no gráfico
- [ ] Export gera CSV com todas as semanas da escala (-3m / +1a)
- [ ] Import lê CSV e faz upsert por `semana_iso`

- [ ] **Step 6.4: Commit final**

```bash
git add -A
git commit -m "feat(M8): Módulo Avanço Físico — migração semanal completa

- Schema: semana_iso + avanco_projetado; histórico convertido
- Tabela transposta com edição inline (padrão HistogramaTabela)
- Gráfico ComposedChart com toggle Semana/Mês
- Import/Export com escala -3m/+1a
- Bug botão Editar resolvido pela reescrita"
```
