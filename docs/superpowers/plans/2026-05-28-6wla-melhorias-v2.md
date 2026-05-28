# 6WLA Melhorias v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar o módulo 6WLA com auto-import silencioso, ícone de adição manual, colunas de datas (BL/Real/Projetado), separação de Área/Disciplina, filtros no row de semanas, cards KPI clicáveis e renomeação de labels.

**Architecture:** A migration adiciona `adicionado_manualmente BOOLEAN` à `itens_6wla`. `SixWLA.jsx` recebe novos estados de filtro, auto-import sem banner e cards clicáveis. `SixWLATable.jsx` recebe novas colunas de datas, ícone inline na célula Atividade e sticky scroll.

**Tech Stack:** React 18, TanStack Query 5, Supabase JS, Tailwind CSS, Lucide React

---

## Arquivos modificados

| Arquivo | Ação |
|---------|------|
| `docs/database/supabase-migration-m6-6wla-v2.sql` | Criar |
| `src/pages/Planejamento/SixWLA.jsx` | Modificar |
| `src/components/planejamento/SixWLATable.jsx` | Modificar |

---

## Task 1: Migration SQL — adicionar coluna adicionado_manualmente

**Files:**
- Create: `docs/database/supabase-migration-m6-6wla-v2.sql`

- [ ] **Step 1.1: Criar o arquivo de migration**

```sql
-- Migration: M6 6WLA v2 — adicionar flag de adição manual
-- Aplicar via Supabase MCP (execute_sql) ou dashboard SQL Editor

ALTER TABLE itens_6wla ADD COLUMN IF NOT EXISTS adicionado_manualmente BOOLEAN DEFAULT FALSE;
```

- [ ] **Step 1.2: Aplicar a migration no Supabase via MCP**

Usar a ferramenta `mcp__plugin_supabase_supabase__execute_sql` com o SQL acima. Confirmar que retorna sem erro.

- [ ] **Step 1.3: Verificar que a coluna foi criada**

Executar via MCP:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'itens_6wla' AND column_name = 'adicionado_manualmente';
```
Esperado: uma linha com `adicionado_manualmente`, `boolean`, `false`.

- [ ] **Step 1.4: Commit**

```bash
git add docs/database/supabase-migration-m6-6wla-v2.sql
git commit -m "feat(6wla): migration — adicionar coluna adicionado_manualmente"
```

---

## Task 2: Refatorar RESTRICOES array em SixWLA.jsx

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx` (linhas 16–33)

Esta task atualiza o array de constantes para suportar labels separados (card vs tabela) sem tocar na lógica existente ainda.

- [ ] **Step 2.1: Substituir o array RESTRICOES**

Localizar no arquivo:
```js
const RESTRICOES = [
  { key: "restricao_projeto_eng",  label: "Proj/Eng", full: "Projeto/Engenharia" },
  { key: "restricao_material",     label: "Mat",      full: "Material/Suprimentos" },
  { key: "restricao_mao_obra",     label: "MO",       full: "Mão de Obra" },
  { key: "restricao_equipamentos", label: "Eq",       full: "Equipamentos" },
  { key: "restricao_externas",     label: "Ext",      full: "Externas/Regulatórias" },
  { key: "restricao_informacoes",  label: "Info",     full: "Informações/Decisões" },
];
```

Substituir por:
```js
const RESTRICOES = [
  { key: "restricao_projeto_eng",  cardLabel: "Engenharia",  tableLabel: "Eng",  full: "Projeto/Engenharia" },
  { key: "restricao_material",     cardLabel: "Materiais",   tableLabel: "Mat",  full: "Material/Suprimentos" },
  { key: "restricao_mao_obra",     cardLabel: "Mão de Obra", tableLabel: "MO",   full: "Mão de Obra" },
  { key: "restricao_equipamentos", cardLabel: "Equipamento", tableLabel: "Eq",   full: "Equipamentos" },
  { key: "restricao_externas",     cardLabel: "Externo",     tableLabel: "Ext",  full: "Externas/Regulatórias" },
  { key: "restricao_informacoes",  cardLabel: "SSMA",        tableLabel: "SSMA", full: "Informações/Decisões" },
];
```

- [ ] **Step 2.2: Verificar que o app compila sem erros**

```bash
npm run dev
```

Esperado: servidor inicia sem erros de compilação. O app pode mostrar erros de runtime nos cards (label undefined) — normal, serão corrigidos na Task 5.

- [ ] **Step 2.3: Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "refactor(6wla): atualizar RESTRICOES com cardLabel e tableLabel"
```

---

## Task 3: Auto-import silencioso + bulkCreateMut com flag manual

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx`

Remove o banner de auto-sync e os estados associados. O import passa a ser silencioso e automático. A mutation aceita flag `manualmente` para distinguir origem.

- [ ] **Step 3.1: Remover imports desnecessários e atualizar imports**

Localizar linha:
```js
import { CalendarRange, Plus, Info, X, AlertCircle, FileSpreadsheet } from "lucide-react";
```

Substituir por (remove `X` que era usado só no banner):
```js
import { CalendarRange, Plus, Info, AlertCircle, FileSpreadsheet } from "lucide-react";
```

- [ ] **Step 3.2: Remover os estados do banner e substituir o ref**

Localizar e remover os três states/ref do banner:
```js
  const [showBanner, setShowBanner] = useState(false);
  const [novasAtividades, setNovasAtividades] = useState([]);
  const bannerChecked = useRef(false);
```

Substituir por (apenas o ref renomeado):
```js
  const autoImported = useRef(false);
```

- [ ] **Step 3.3: Atualizar bulkCreateMut para aceitar flag manualmente**

Localizar:
```js
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
```

Substituir por:
```js
  const bulkCreateMut = useMutation({
    mutationFn: ({ tarefaIds, manualmente = false }) =>
      Promise.all(
        tarefaIds.map(tarefa_cronograma_id =>
          entities.Item6WLA.create({
            projeto_id: selectedProjectId,
            tarefa_cronograma_id,
            adicionado_manualmente: manualmente,
            restricao_projeto_eng:  false,
            restricao_material:     false,
            restricao_mao_obra:     false,
            restricao_equipamentos: false,
            restricao_externas:     false,
            restricao_informacoes:  false,
          })
        )
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itens_6wla"] });
      if (variables.manualmente) {
        toast({ variant: "success", description: "Atividades adicionadas ao 6WLA." });
      }
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
```

- [ ] **Step 3.4: Substituir o useEffect de detecção por auto-import silencioso**

Localizar:
```js
  useEffect(() => {
    if (pendingItens || pendingTarefas || bannerChecked.current) return;
    bannerChecked.current = true;
    const novas = tarefasNaJanela.filter(t => !existingTarefaIds.has(t.id));
    if (novas.length > 0) {
      setNovasAtividades(novas);
      setShowBanner(true);
    }
  }, [pendingItens, pendingTarefas, tarefasNaJanela, existingTarefaIds]);
```

Substituir por:
```js
  useEffect(() => {
    if (pendingItens || pendingTarefas || autoImported.current) return;
    autoImported.current = true;
    const novas = tarefasNaJanela.filter(t => !existingTarefaIds.has(t.id));
    if (novas.length > 0) {
      bulkCreateMut.mutate({ tarefaIds: novas.map(t => t.id), manualmente: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingItens, pendingTarefas, tarefasNaJanela, existingTarefaIds]);
```

- [ ] **Step 3.5: Atualizar onConfirm do modal para passar flag manual**

Localizar:
```js
        onConfirm={(ids) => { bulkCreateMut.mutate(ids); setShowModal(false); }}
```

Substituir por:
```js
        onConfirm={(ids) => { bulkCreateMut.mutate({ tarefaIds: ids, manualmente: true }); setShowModal(false); }}
```

- [ ] **Step 3.6: Remover o bloco JSX do banner**

Localizar e remover todo o bloco (aproximadamente linhas 216–238):
```jsx
        {/* Banner auto-sync */}
        {showBanner && novasAtividades.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-primary flex-1">
              {novasAtividades.length} atividade{novasAtividades.length > 1 ? "s novas" : " nova"} encontrada{novasAtividades.length > 1 ? "s" : ""} no cronograma.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
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
```

- [ ] **Step 3.7: Verificar que o app compila sem erros de referência**

```bash
npm run dev
```

Esperado: sem erros de `showBanner`, `novasAtividades`, `bannerChecked` ou `X`.

- [ ] **Step 3.8: Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "feat(6wla): auto-import silencioso, remover banner, flag adicionado_manualmente"
```

---

## Task 4: Adicionar estados de filtro e refatorar pipeline filtered

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx`

- [ ] **Step 4.1: Adicionar os novos states de filtro**

Após a linha com `const [showModal, setShowModal] = useState(false);`, adicionar:
```js
  const [searchText, setSearchText] = useState("");
  const [filterHoje, setFilterHoje] = useState(false);
  const [filterDisciplina, setFilterDisciplina] = useState("");
  const [filtroRestricao, setFiltroRestricao] = useState(null);
```

- [ ] **Step 4.2: Adicionar memo de disciplinas disponíveis**

Após o bloco `const merged = useMemo(...)`, adicionar:
```js
  const disciplinas = useMemo(
    () => [...new Set(merged.map(i => i.tarefa?.disciplina).filter(Boolean))].sort(),
    [merged]
  );
```

- [ ] **Step 4.3: Substituir o useMemo filtered pela pipeline completa**

Localizar:
```js
  // Filtrar tabela pelas semanas ativas (pills S1–S6)
  const filtered = useMemo(() => {
    if (semanasAtivas.length === semanas.length) return merged;
    return merged.filter(item =>
      item.semanasBadge.some(s => semanasAtivas.includes(s))
    );
  }, [merged, semanasAtivas, semanas.length]);
```

Substituir por:
```js
  const filtered = useMemo(() => {
    const hojeDateStr = new Date().toISOString().split("T")[0];
    let items = merged;

    if (filterHoje) {
      items = items.filter(i => {
        const ini = i.tarefa?.inicio_previsto;
        const fim = i.tarefa?.termino_previsto;
        if (!ini || !fim) return false;
        return ini <= hojeDateStr && fim >= hojeDateStr;
      });
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter(i =>
        (i.tarefa?.nome || "").toLowerCase().includes(q) ||
        (i.tarefa?.codigo_wbs || "").toLowerCase().includes(q)
      );
    }

    if (filterDisciplina) {
      items = items.filter(i => i.tarefa?.disciplina === filterDisciplina);
    }

    if (semanasAtivas.length < semanas.length) {
      items = items.filter(i => i.semanasBadge.some(s => semanasAtivas.includes(s)));
    }

    if (filtroRestricao) {
      items = items.filter(i => i[filtroRestricao] === true);
    }

    return items;
  }, [merged, filterHoje, searchText, filterDisciplina, semanasAtivas, semanas.length, filtroRestricao]);
```

- [ ] **Step 4.4: Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "feat(6wla): pipeline de filtros completa (busca, hoje, disciplina, restrição)"
```

---

## Task 5: UI — filtros no row de semanas + cards KPI clicáveis

**Files:**
- Modify: `src/pages/Planejamento/SixWLA.jsx`

- [ ] **Step 5.1: Refatorar o row das pills para incluir controles de filtro à direita**

Localizar o bloco das pills S1–S6:
```jsx
        {/* Pills S1–S6 — filtro multi-select da tabela */}
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
                    ? "bg-[#102A44] text-[#26FFFF] border-[#102A44]"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                )}
              >
                {s.label} · {formatData(s.start)}
              </button>
            );
          })}
        </div>
```

Substituir por:
```jsx
        {/* Row semanas + filtros */}
        <div className="flex items-start justify-between gap-4">
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
                      ? "bg-[#102A44] text-[#26FFFF] border-[#102A44]"
                      : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                  )}
                >
                  {s.label} · {formatData(s.start)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Buscar por ID ou atividade..."
              className="h-8 px-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-56"
            />
            <Button
              size="sm"
              variant={filterHoje ? "default" : "outline"}
              onClick={() => setFilterHoje(v => !v)}
              className="h-8 text-xs"
            >
              Hoje
            </Button>
            <select
              value={filterDisciplina}
              onChange={e => setFilterDisciplina(e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todas as disciplinas</option>
              {disciplinas.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
```

- [ ] **Step 5.2: Atualizar os cards KPI para usar cardLabel e ser clicáveis**

Localizar o bloco dos cards KPI de restrição:
```jsx
          {RESTRICOES.map(r => (
            <div
              key={r.key}
              className="rounded-xl border p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
              title={r.full}
            >
              <p className="text-xs font-medium text-amber-900/70 dark:text-amber-500/80 truncate">{r.label}</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{kpis[r.key]}</p>
            </div>
          ))}
```

Substituir por:
```jsx
          {RESTRICOES.map(r => {
            const isActive = filtroRestricao === r.key;
            return (
              <div
                key={r.key}
                onClick={() => setFiltroRestricao(isActive ? null : r.key)}
                className={cn(
                  "rounded-xl border p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 cursor-pointer transition-all select-none",
                  isActive && "ring-2 ring-amber-500"
                )}
                title={isActive ? `Clique para remover filtro: ${r.full}` : r.full}
              >
                <p className="text-xs font-medium text-amber-900/70 dark:text-amber-500/80 truncate">{r.cardLabel}</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{kpis[r.key]}</p>
              </div>
            );
          })}
```

- [ ] **Step 5.3: Verificar comportamento dos filtros no browser**

```bash
npm run dev
```

Verificar:
- Pills S1–S6 ainda funcionam (filtro de semana)
- Input de busca filtra por nome ao digitar
- Botão "Hoje" ativa/desativa com destaque visual
- Select de disciplinas lista valores únicos
- Click em card de restrição filtra tabela e mostra ring ativo
- Segundo click no mesmo card limpa o filtro

- [ ] **Step 5.4: Commit**

```bash
git add src/pages/Planejamento/SixWLA.jsx
git commit -m "feat(6wla): filtros no row semanas e cards KPI clicáveis"
```

---

## Task 6: SixWLATable — novas colunas, ícone inline, sticky e renomear headers

**Files:**
- Modify: `src/components/planejamento/SixWLATable.jsx`

- [ ] **Step 6.1: Atualizar imports — adicionar Info do lucide**

Localizar:
```js
import { Trash2, Pencil } from "lucide-react";
```

Substituir por:
```js
import { Trash2, Pencil, Info } from "lucide-react";
```

- [ ] **Step 6.2: Adicionar helper fmtDate no topo do componente**

Após os imports, antes do JSDoc, adicionar:
```js
const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};
```

- [ ] **Step 6.3: Atualizar totalCols**

Localizar:
```js
  const totalCols = 5 + restricoes.length + 2; // Atividade, Área, Sem., %Prev, %Real + N restrições + Obs + Remover
```

Substituir por:
```js
  // Atividade(sticky), Área, Disciplina, Sem., %Prev, %Real, BL×2, Real×2, Proj×2 = 12 + restricoes + Obs + Remove
  const totalCols = 12 + restricoes.length + 2;
```

- [ ] **Step 6.4: Substituir o header da tabela**

Localizar todo o bloco `<thead>`:
```jsx
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
```

Substituir por:
```jsx
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 bg-muted z-10 min-w-[200px]">Atividade</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Área</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Disciplina</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Sem.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">%Prev</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">%Real</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">BL Ini</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">BL Fim</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Real Ini</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Real Fim</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Proj Ini</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Proj Fim</th>
              {restricoes.map(r => (
                <th
                  key={r.key}
                  className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  title={r.full}
                >
                  {r.tableLabel}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Obs.</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
```

- [ ] **Step 6.5: Substituir as linhas do tbody**

Localizar o bloco `{items.map((item, i) => {` até o fechamento `})}` e substituir o conteúdo interno de cada `<tr>`:

**Bloco a localizar (células da linha):**
```jsx
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                    <span className="line-clamp-2">{item.tarefa?.nome || "—"}</span>
                    {item.tarefa?.status && (
                      <span className="text-xs text-muted-foreground block">{item.tarefa.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {[item.tarefa?.area, item.tarefa?.disciplina].filter(Boolean).join(" / ") || "—"}
                  </td>
```

**Substituir por (Atividade sticky com ícone inline + Área + Disciplina separadas):**
```jsx
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs sticky left-0 bg-card z-10">
                    <div className="flex items-start gap-1.5">
                      {item.adicionado_manualmente && (
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" title="Adicionado manualmente" />
                      )}
                      <div>
                        <span className="line-clamp-2">{item.tarefa?.nome || "—"}</span>
                        {item.tarefa?.status && (
                          <span className="text-xs text-muted-foreground block">{item.tarefa.status}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {item.tarefa?.area || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {item.tarefa?.disciplina || "—"}
                  </td>
```

- [ ] **Step 6.6: Adicionar as colunas de data após %Real**

No tbody, localizar a transição entre o fechamento da célula %Real e o início do map de restrições. O trecho exato a localizar é:
```jsx
                  </td>
                  {restricoes.map(r => (
```

Substituir por (inserindo 6 novas células entre o `</td>` do %Real e o `{restricoes.map(`):
```jsx
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(item.tarefa?.data_inicio_baseline)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(item.tarefa?.data_fim_baseline)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(item.tarefa?.data_inicio_real)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(item.tarefa?.data_fim_real)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(item.tarefa?.inicio_previsto)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(item.tarefa?.termino_previsto)}
                  </td>
                  {restricoes.map(r => (
```

> **Nota:** A célula %Real não muda — apenas insira as 6 novas células entre seu `</td>` e o `{restricoes.map(`. O texto `</td>\n                  {restricoes.map(r => (` é único no arquivo (aparece só uma vez no tbody), então a substituição é segura.

- [ ] **Step 6.7: Verificar no browser a tabela completa**

```bash
npm run dev
```

Navegar para a rota `/planejamento/6wla` e verificar:
- Coluna Atividade fica fixa ao scrollar horizontalmente
- Ícone `ⓘ` azul aparece em atividades com `adicionado_manualmente = true`
- Colunas Área e Disciplina aparecem separadas
- Colunas BL Ini, BL Fim, Real Ini, Real Fim, Proj Ini, Proj Fim aparecem (podem mostrar "—" se sem dados)
- Headers "Eng" e "SSMA" na tabela
- Headers "Engenharia", "Materiais", "Mão de Obra", "Equipamento", "Externo", "SSMA" nos cards do topo

- [ ] **Step 6.8: Commit final**

```bash
git add src/components/planejamento/SixWLATable.jsx
git commit -m "feat(6wla): novas colunas (BL/Real/Proj), ícone manual, área/disciplina separadas, sticky"
```

---

## Checklist de Verificação Final

- [ ] Migration `adicionado_manualmente` aplicada no Supabase
- [ ] Auto-import silencioso ao carregar (sem banner, sem toast)
- [ ] Atividades adicionadas via modal têm ícone ⓘ azul
- [ ] Atividades auto-importadas não mostram ícone
- [ ] Coluna Atividade fica fixa no scroll horizontal
- [ ] Área e Disciplina em colunas separadas
- [ ] Colunas BL Ini/Fim, Real Ini/Fim, Proj Ini/Fim exibem datas formatadas ou "—"
- [ ] Input de busca filtra por ID e nome
- [ ] Botão Hoje filtra atividades em andamento hoje
- [ ] Select de disciplinas filtra corretamente
- [ ] Cards de restrição são clicáveis (ring quando ativo)
- [ ] Click no card ativo desfaz o filtro
- [ ] Cards do topo com labels: Engenharia, Materiais, Mão de Obra, Equipamento, Externo, SSMA
- [ ] Headers da tabela: Eng e SSMA (demais abreviações inalteradas)
