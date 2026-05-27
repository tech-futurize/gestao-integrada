# 6WLA Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o módulo 6WLA em um lookahead real: atividades vêm do cronograma, restrições são 6 checkboxes booleanos inline, pills S1–S6 multi-select filtram por semana.

**Architecture:** Duplo `useQuery` (itens_6wla + tarefas_cronograma) com merge por `tarefa_cronograma_id` no front, sem view adicional no banco. SixWLA.jsx orquestra estado; dois sub-componentes isolados (tabela e modal) recebem props e callbacks.

**Tech Stack:** React 18, React Query 5, Supabase PostgreSQL, Tailwind CSS, shadcn/ui (Checkbox, Popover, Textarea já instalados), date-fns (implementado manualmente — sem dependência nova).

**Spec:** `docs/superpowers/specs/2026-05-27-6wla-redesign.md`

---

## File Map

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `docs/database/supabase-migration-m5-6wla.sql` | Migration destrutiva da tabela `itens_6wla` |
| Criar | `src/utils/sixWLAUtils.js` | Funções puras: cálculo de semanas e sobreposição de datas |
| Criar | `src/components/planejamento/SixWLATable.jsx` | Tabela com checkboxes inline + popover de observação |
| Criar | `src/components/planejamento/AdicionarCronogramaModal.jsx` | Modal de seleção de atividades do cronograma |
| Reescrever | `src/pages/Planejamento/SixWLA.jsx` | Página principal: queries, estado, pills, KPIs, banner |

---

## Task 1: Migration SQL

**Files:**
- Criar: `docs/database/supabase-migration-m5-6wla.sql`

- [ ] **Step 1.1 — Criar arquivo de migration**

Conteúdo completo do arquivo:

```sql
-- Migration M5: 6WLA Redesign
-- Remove colunas do modelo manual e adiciona FK + 6 booleanos de restrição

-- 1. Remover colunas antigas
ALTER TABLE itens_6wla
  DROP COLUMN IF EXISTS semana_ano,
  DROP COLUMN IF EXISTS atividade,
  DROP COLUMN IF EXISTS responsavel,
  DROP COLUMN IF EXISTS restricoes,
  DROP COLUMN IF EXISTS categoria_restricao,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS ppc;

-- 2. Adicionar novas colunas (nullable primeiro para não quebrar registros existentes)
ALTER TABLE itens_6wla
  ADD COLUMN IF NOT EXISTS tarefa_cronograma_id UUID REFERENCES tarefas_cronograma(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS restricao_projeto_eng  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_material      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_mao_obra      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_equipamentos  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_externas      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_informacoes   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observacao              TEXT;

-- 3. Apagar registros órfãos (sem tarefa_cronograma_id = dados do modelo antigo)
DELETE FROM itens_6wla WHERE tarefa_cronograma_id IS NULL;

-- 4. Tornar tarefa_cronograma_id obrigatório
ALTER TABLE itens_6wla ALTER COLUMN tarefa_cronograma_id SET NOT NULL;

-- 5. Índice único: cada tarefa aparece no máximo 1x por projeto no 6WLA
CREATE UNIQUE INDEX IF NOT EXISTS itens_6wla_tarefa_projeto_uniq
  ON itens_6wla (tarefa_cronograma_id, projeto_id);
```

- [ ] **Step 1.2 — Aplicar via Supabase MCP**

Usar a ferramenta `mcp__plugin_supabase_supabase__apply_migration` com o conteúdo acima no projeto ativo.

- [ ] **Step 1.3 — Verificar no Supabase**

Usar `mcp__plugin_supabase_supabase__list_tables` e confirmar que `itens_6wla` não tem mais as colunas antigas e tem as 6 novas booleanas + `tarefa_cronograma_id`.

- [ ] **Step 1.4 — Commit**

```bash
git add docs/database/supabase-migration-m5-6wla.sql
git commit -m "feat(6wla): migration M5 — schema redesign com FK cronograma e 6 booleanos de restrição"
```

---

## Task 2: Utility Functions

**Files:**
- Criar: `src/utils/sixWLAUtils.js`

- [ ] **Step 2.1 — Criar `src/utils/sixWLAUtils.js`**

```js
/**
 * Retorna as próximas 6 semanas a partir de `hoje` (início na segunda-feira).
 * @param {Date} hoje
 * @returns {{ label: string, weekNumber: number, start: Date, end: Date }[]}
 */
export function getSemanas(hoje) {
  return Array.from({ length: 6 }, (_, i) => {
    const start = _startOfWeek(_addDays(hoje, i * 7));
    const end = _addDays(start, 6);
    return { label: `S${i + 1}`, weekNumber: _getISOWeek(start), start, end };
  });
}

/**
 * Retorna quais labels de semana uma tarefa sobrepõe.
 * Considera null/undefined em datas como "sem sobreposição".
 * @param {{ inicio_previsto: string|null, termino_previsto: string|null }} tarefa
 * @param {{ label: string, start: Date, end: Date }[]} semanas
 * @returns {string[]}
 */
export function getSemanasBadge(tarefa, semanas) {
  if (!tarefa.inicio_previsto || !tarefa.termino_previsto) return [];
  const inicio = new Date(tarefa.inicio_previsto);
  const termino = new Date(tarefa.termino_previsto);
  return semanas
    .filter(s => inicio <= s.end && termino >= s.start)
    .map(s => s.label);
}

/**
 * Formata uma Date como "23 jun" em pt-BR.
 * @param {Date} date
 * @returns {string}
 */
export function formatData(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ── helpers internos ──────────────────────────────────────────────

function _startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Recua para segunda-feira (weekStartsOn = 1)
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function _addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function _getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
```

- [ ] **Step 2.2 — Verificação manual das funções**

Abrir o console do browser (após rodar `npm run dev`) e colar:

```js
// Colar no console após importar manualmente ou testar inline no componente
const hoje = new Date();
const semanas = getSemanas(hoje);
console.log("Semanas:", semanas.map(s => `${s.label} Sem.${s.weekNumber} ${s.start.toLocaleDateString("pt-BR")}–${s.end.toLocaleDateString("pt-BR")}`));

const tarefaTeste = { inicio_previsto: semanas[1].start.toISOString(), termino_previsto: semanas[3].end.toISOString() };
console.log("Badges:", getSemanasBadge(tarefaTeste, semanas)); // esperado: ["S2","S3","S4"]
```

Resultado esperado: S2, S3, S4 no array.

- [ ] **Step 2.3 — Commit**

```bash
git add src/utils/sixWLAUtils.js
git commit -m "feat(6wla): utilitários de cálculo de semanas e sobreposição de datas"
```

---

## Task 3: Modal de Adicionar do Cronograma

**Files:**
- Criar: `src/components/planejamento/AdicionarCronogramaModal.jsx`

- [ ] **Step 3.1 — Criar `src/components/planejamento/AdicionarCronogramaModal.jsx`**

```jsx
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdicionarCronogramaModal({ open, onClose, tarefas, onConfirm }) {
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState([]);

  const filtradas = useMemo(() =>
    tarefas.filter(t =>
      !busca ||
      t.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      t.area?.toLowerCase().includes(busca.toLowerCase()) ||
      t.disciplina?.toLowerCase().includes(busca.toLowerCase())
    ),
    [tarefas, busca]
  );

  const toggle = (id) =>
    setSelecionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleConfirm = () => {
    if (!selecionadas.length) return;
    onConfirm(selecionadas);
    setSelecionadas([]);
    setBusca("");
  };

  const handleClose = () => {
    setSelecionadas([]);
    setBusca("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar do Cronograma</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Buscar por nome, área ou disciplina..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="mb-3"
        />
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filtradas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tarefas.length === 0
                ? "Nenhuma atividade disponível no cronograma."
                : "Nenhuma atividade encontrada para a busca."}
            </p>
          )}
          {filtradas.map(t => (
            <label key={t.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer">
              <Checkbox
                checked={selecionadas.includes(t.id)}
                onCheckedChange={() => toggle(t.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {[t.area, t.disciplina].filter(Boolean).join(" / ") || "Sem área/disciplina"}
                  {t.inicio_previsto && ` · ${new Date(t.inicio_previsto).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
            </label>
          ))}
        </div>
        <DialogFooter className="gap-2 mt-3">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button variant="save" onClick={handleConfirm} disabled={selecionadas.length === 0}>
            {selecionadas.length > 0
              ? `Adicionar ${selecionadas.length} atividade${selecionadas.length > 1 ? "s" : ""}`
              : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3.2 — Commit**

```bash
git add src/components/planejamento/AdicionarCronogramaModal.jsx
git commit -m "feat(6wla): modal de seleção de atividades do cronograma"
```

---

## Task 4: Tabela com Checkboxes Inline

**Files:**
- Criar: `src/components/planejamento/SixWLATable.jsx`

- [ ] **Step 4.1 — Criar `src/components/planejamento/SixWLATable.jsx`**

```jsx
import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

/**
 * @param {{
 *   items: Array<{
 *     id: string,
 *     tarefa: object|null,
 *     semanasBadge: string[],
 *     restricao_projeto_eng: boolean,
 *     restricao_material: boolean,
 *     restricao_mao_obra: boolean,
 *     restricao_equipamentos: boolean,
 *     restricao_externas: boolean,
 *     restricao_informacoes: boolean,
 *     observacao: string|null
 *   }>,
 *   restricoes: { key: string, label: string, full: string }[],
 *   isLoading: boolean,
 *   onUpdate: (id: string, data: object) => void,
 *   onDelete: (id: string) => void
 * }} props
 */
export default function SixWLATable({ items, restricoes, isLoading, onUpdate, onDelete }) {
  const [editingObs, setEditingObs] = useState(null); // { id: string, value: string }

  const handleObsClose = (open, item) => {
    if (!open && editingObs?.id === item.id) {
      onUpdate(item.id, { observacao: editingObs.value });
      setEditingObs(null);
    }
  };

  const totalCols = 5 + restricoes.length + 2; // Atividade, Área, Sem., %Prev, %Real + N restrições + Obs + Remover

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Atividade</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Área / Disc.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Sem.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">%Prev</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">%Real</th>
              {restricoes.map(r => (
                <th
                  key={r.key}
                  className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  title={r.full}
                >
                  {r.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Obs.</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={totalCols} className="py-12 text-center text-muted-foreground text-sm">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="py-12 text-center text-muted-foreground text-sm">
                  Nenhuma atividade no período selecionado
                </td>
              </tr>
            )}
            {items.map((item, i) => {
              const avReal = item.tarefa?.avanco_realizado;
              const avColor = avReal >= 100 ? "#16a34a" : avReal >= 50 ? "#d97706" : avReal > 0 ? "#ef4444" : "#9ca3af";
              return (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-muted/40 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                    <span className="line-clamp-2">{item.tarefa?.nome || "—"}</span>
                    {item.tarefa?.status && (
                      <span className="text-xs text-muted-foreground block">{item.tarefa.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {[item.tarefa?.area, item.tarefa?.disciplina].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {item.semanasBadge.length > 0
                        ? item.semanasBadge.map(s => (
                            <span key={s} className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {s}
                            </span>
                          ))
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                    {item.tarefa?.avanco_previsto != null ? `${item.tarefa.avanco_previsto}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold" style={{ color: avColor }}>
                      {avReal != null ? `${avReal}%` : "—"}
                    </span>
                  </td>
                  {restricoes.map(r => (
                    <td key={r.key} className="px-2 py-3 text-center">
                      <Checkbox
                        checked={!!item[r.key]}
                        onCheckedChange={(checked) => onUpdate(item.id, { [r.key]: !!checked })}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <Popover
                      open={editingObs?.id === item.id}
                      onOpenChange={(open) => handleObsClose(open, item)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={() => setEditingObs({ id: item.id, value: item.observacao || "" })}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title={item.observacao || "Adicionar observação"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" side="left">
                        <p className="text-xs font-semibold mb-2 text-foreground">Observação</p>
                        <Textarea
                          rows={3}
                          value={editingObs?.id === item.id ? editingObs.value : ""}
                          onChange={e =>
                            setEditingObs(prev => prev?.id === item.id ? { ...prev, value: e.target.value } : prev)
                          }
                          placeholder="Descreva a restrição ou observação..."
                          className="text-xs resize-none"
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"
                      title="Remover do 6WLA"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2 — Commit**

```bash
git add src/components/planejamento/SixWLATable.jsx
git commit -m "feat(6wla): tabela com checkboxes inline e popover de observação"
```

---

## Task 5: Reescrever SixWLA.jsx

**Files:**
- Modificar: `src/pages/Planejamento/SixWLA.jsx` (reescrita completa)

- [ ] **Step 5.1 — Reescrever `src/pages/Planejamento/SixWLA.jsx`**

```jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import { getSemanas, getSemanasBadge, formatData } from "@/utils/sixWLAUtils";
import SixWLATable from "@/components/planejamento/SixWLATable";
import AdicionarCronogramaModal from "@/components/planejamento/AdicionarCronogramaModal";

const RESTRICOES = [
  { key: "restricao_projeto_eng",  label: "Proj/Eng", full: "Projeto/Engenharia" },
  { key: "restricao_material",     label: "Mat",      full: "Material/Suprimentos" },
  { key: "restricao_mao_obra",     label: "MO",       full: "Mão de Obra" },
  { key: "restricao_equipamentos", label: "Eq",       full: "Equipamentos" },
  { key: "restricao_externas",     label: "Ext",      full: "Externas/Regulatórias" },
  { key: "restricao_informacoes",  label: "Info",     full: "Informações/Decisões" },
];

export default function SixWLAPage() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const semanas = useMemo(() => getSemanas(new Date()), []);
  const [semanasAtivas, setSemanasAtivas] = useState(() => semanas.map(s => s.label));
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [novasAtividades, setNovasAtividades] = useState([]);
  const bannerChecked = useRef(false);

  // Q1 — registros 6WLA
  const { data: itens = [], isLoading: loadingItens } = useQuery({
    queryKey: ["itens_6wla", selectedProjectId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  // Q2 — atividades do cronograma
  const { data: tarefas = [], isLoading: loadingTarefas } = useQuery({
    queryKey: ["tarefas_cronograma_atividades", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId, tipo: "Atividade" }),
    enabled: !!selectedProjectId,
  });

  const existingTarefaIds = useMemo(
    () => new Set(itens.map(i => i.tarefa_cronograma_id)),
    [itens]
  );

  // Merge + calcular badges de semana
  const merged = useMemo(() => {
    return itens.map(item => {
      const tarefa = tarefas.find(t => t.id === item.tarefa_cronograma_id) || null;
      return {
        ...item,
        tarefa,
        semanasBadge: tarefa ? getSemanasBadge(tarefa, semanas) : [],
      };
    });
  }, [itens, tarefas, semanas]);

  // Auto-sync: detectar atividades novas nas próximas 6 semanas
  useEffect(() => {
    if (loadingItens || loadingTarefas || bannerChecked.current) return;
    bannerChecked.current = true;
    const novas = tarefas.filter(t => {
      if (existingTarefaIds.has(t.id)) return false;
      return getSemanasBadge(t, semanas).length > 0;
    });
    if (novas.length > 0) {
      setNovasAtividades(novas);
      setShowBanner(true);
    }
  }, [loadingItens, loadingTarefas, tarefas, existingTarefaIds, semanas]);

  // Filtrar por semanas ativas
  const filtered = useMemo(() => {
    if (semanasAtivas.length === semanas.length) return merged;
    return merged.filter(item =>
      item.semanasBadge.some(s => semanasAtivas.includes(s))
    );
  }, [merged, semanasAtivas, semanas.length]);

  // KPIs
  const kpis = useMemo(() => ({
    total: merged.length,
    ...Object.fromEntries(RESTRICOES.map(r => [r.key, merged.filter(i => i[r.key]).length])),
  }), [merged]);

  // Mutations
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.Item6WLA.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Item6WLA.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const bulkCreateMut = useMutation({
    mutationFn: (tarefaIds) =>
      Promise.all(
        tarefaIds.map(tarefa_cronograma_id =>
          entities.Item6WLA.create({
            projeto_id: selectedProjectId,
            tarefa_cronograma_id,
            restricao_projeto_eng:  false,
            restricao_material:     false,
            restricao_mao_obra:     false,
            restricao_equipamentos: false,
            restricao_externas:     false,
            restricao_informacoes:  false,
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens_6wla"] });
      setShowBanner(false);
      setNovasAtividades([]);
      toast({ variant: "success", description: "Atividades adicionadas ao 6WLA." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleSemana = (label) =>
    setSemanasAtivas(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );

  const tarefasDisponiveis = useMemo(
    () => tarefas.filter(t => !existingTarefaIds.has(t.id)),
    [tarefas, existingTarefaIds]
  );

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={CalendarRange}
            description="Selecione um projeto para acessar o 6WLA."
          />
        </div>
      </div>
    );
  }

  const isLoading = loadingItens || loadingTarefas;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar do Cronograma
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">

        {/* Banner auto-sync */}
        {showBanner && novasAtividades.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-300 flex-1">
              {novasAtividades.length} atividade{novasAtividades.length > 1 ? "s novas" : " nova"} encontrada{novasAtividades.length > 1 ? "s" : ""} no cronograma.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
              onClick={() => bulkCreateMut.mutate(novasAtividades.map(t => t.id))}
              disabled={bulkCreateMut.isPending}
            >
              Importar automaticamente
            </Button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
          </div>
          {RESTRICOES.map(r => (
            <div key={r.key} className="bg-card rounded-xl border border-border p-3" title={r.full}>
              <p className="text-xs text-muted-foreground truncate">{r.label}</p>
              <p className="text-2xl font-bold text-amber-600">{kpis[r.key]}</p>
            </div>
          ))}
        </div>

        {/* Pills S1–S6 */}
        <div className="flex flex-wrap gap-2">
          {semanas.map(s => {
            const ativa = semanasAtivas.includes(s.label);
            return (
              <button
                key={s.label}
                onClick={() => toggleSemana(s.label)}
                title={`${formatData(s.start)} – ${formatData(s.end)}`}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  ativa
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                )}
              >
                {s.label} · Sem.{s.weekNumber}
              </button>
            );
          })}
        </div>

        {/* Tabela */}
        <SixWLATable
          items={filtered}
          restricoes={RESTRICOES}
          isLoading={isLoading}
          onUpdate={(id, data) => updateMut.mutate({ id, data })}
          onDelete={(id) => deleteMut.mutate(id)}
        />
      </div>

      <AdicionarCronogramaModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tarefas={tarefasDisponiveis}
        onConfirm={(ids) => { bulkCreateMut.mutate(ids); setShowModal(false); }}
      />
    </div>
  );
}
```

- [ ] **Step 5.2 — Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "feat(6wla): reescrever SixWLA com duplo fetch, pills S1–S6, checkboxes e banner auto-sync"
```

---

## Task 6: Verificação e Build

**Files:**
- Nenhum arquivo novo — verificação funcional

- [ ] **Step 6.1 — `npm run build` sem erros**

```bash
npm run build
```

Resultado esperado: build completo sem erros de TypeScript/lint. Avisos de `console.log` são aceitáveis; erros de import ou JSX não são.

- [ ] **Step 6.2 — Verificação visual no browser**

Acessar `/planejamento/6wla` com `npm run dev` e confirmar:

1. **KPIs:** 7 cards visíveis (Total + 6 categorias)
2. **Pills S1–S6:** exibidas, todas ativas por padrão; clicar em uma desativa e filtra a tabela
3. **Tabela:** colunas Atividade, Área/Disc., Sem., %Prev, %Real, 6 checkboxes, Obs., Remover
4. **Checkbox:** marcar/desmarcar persiste (recarregar a página e verificar estado)
5. **Observação:** clicar no lápis abre popover; digitar e fechar persiste o texto
6. **Remover:** clicar no lixo remove a linha (sem confirmação)
7. **Botão "+ Adicionar do Cronograma":** abre modal com lista de atividades
8. **Modal:** busca filtra lista; selecionar e confirmar adiciona ao 6WLA
9. **Banner:** se houver atividades novas nas próximas 6 semanas, banner aparece no topo

- [ ] **Step 6.3 — Verificar tema escuro**

Alternar para tema escuro e confirmar que não há elementos com cores hardcoded fora de paleta.

- [ ] **Step 6.4 — Commit final**

```bash
git add -A
git commit -m "feat(6wla): módulo 5 completo — redesign com vínculo cronograma e restrições inline"
```

---

## Checklist de Cobertura do Spec

| Requisito | Task |
|-----------|------|
| Schema: drop colunas antigas + add 6 booleanos + tarefa_cronograma_id + observacao | Task 1 |
| Índice único (tarefa_cronograma_id, projeto_id) | Task 1 |
| Pills S1–S6 multi-select | Task 5 |
| KPIs: 7 cards (Total + 1 por restrição) | Task 5 |
| 6 checkboxes inline com save imediato | Task 4 |
| Observação via popover | Task 4 |
| Dados read-only do cronograma (nome, datas, área, disc., %prev, %real) | Task 5 |
| Modal "+ Adicionar do Cronograma" com busca e multi-select | Task 3 |
| Banner auto-sync (não importa sem confirmação) | Task 5 |
| Remover campo Responsável, modal manual, PPC, status | Task 5 (reescrita completa) |
| `npm run build` sem erros | Task 6 |
