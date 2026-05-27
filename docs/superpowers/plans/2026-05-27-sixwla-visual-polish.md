# D5.1 SixWLA Visual Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar o visual do módulo 6WLA — KPI cards com hierarquia Cobalt/Ciano, pills S1–S6 alinhadas ao design system, banner sem cores hardcoded e `%Real` com classes Tailwind.

**Architecture:** Mudanças puramente visuais em dois arquivos JSX. Sem alteração de lógica, queries ou estrutura de dados. Sem novos componentes.

**Tech Stack:** React 18, Tailwind CSS 3.x, Lucide React

---

## Mapa de Arquivos

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/Planejamento/SixWLA.jsx` | KPI cards (Total + restrição), pills rótulo/cor, banner tokens semânticos |
| `src/components/planejamento/SixWLATable.jsx` | `%Real` classes Tailwind, padding checkboxes, add import `cn` |

---

## Task 1: KPI Cards — SixWLA.jsx

**Arquivos:**
- Modify: `src/pages/Planejamento/SixWLA.jsx` (bloco KPIs, ~linhas 222–234)

- [ ] **Passo 1: Abrir o arquivo e localizar o bloco de KPIs**

  Linha ~222 em `src/pages/Planejamento/SixWLA.jsx`:
  ```jsx
  {/* KPIs — Total + 6 categorias de restrição */}
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
  ```

- [ ] **Passo 2: Substituir pelo novo bloco**

  ```jsx
  {/* KPIs — Total + 6 categorias de restrição */}
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
    <div className="rounded-xl border p-3 bg-[#102A44] border-[#1e4a6e]">
      <p className="text-xs font-medium text-[#8195A9]">Total Atividades</p>
      <p className="text-2xl font-bold text-[#26FFFF]">{kpis.total}</p>
      <p className="text-[10px] text-[#8195A9]/70 mt-0.5">no 6WLA</p>
    </div>
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
  </div>
  ```

- [ ] **Passo 3: Verificar visualmente**

  Executar `npm run dev` (se não estiver rodando) e abrir o módulo 6WLA.
  - Card Total: fundo escuro azul marinho, número em ciano elétrico, subtexto "no 6WLA"
  - 6 cards de restrição: fundo amarelo claro, número âmbar escuro
  - Em dark mode: cards de restrição em âmbar muito escuro/sutil

- [ ] **Passo 4: Commit**

  ```bash
  git add src/pages/Planejamento/SixWLA.jsx
  git commit -m "style(6wla): KPI cards — Total em Cobalt/Ciano, restrições em amber"
  ```

---

## Task 2: Pills S1–S6 — SixWLA.jsx

**Arquivos:**
- Modify: `src/pages/Planejamento/SixWLA.jsx` (bloco pills, ~linhas 237–256)

- [ ] **Passo 1: Localizar o bloco de pills**

  Linha ~237:
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
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
          )}
        >
          {s.label} · Sem.{s.weekNumber}
        </button>
      );
    })}
  </div>
  ```

- [ ] **Passo 2: Aplicar as duas mudanças — cor ativa e rótulo**

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

  **O que muda:**
  - Ativa: `bg-primary text-primary-foreground border-primary` → `bg-[#102A44] text-[#26FFFF] border-[#102A44]`
  - Rótulo: `{s.label} · Sem.{s.weekNumber}` → `{s.label} · {formatData(s.start)}`
    - `formatData` já está importada no topo do arquivo (linha 11)
    - Retorna `"26 mai"` (dia + mês abreviado em pt-BR)

- [ ] **Passo 3: Verificar visualmente**

  - Pills ativas: mesma identidade visual do card Total (fundo escuro, texto ciano)
  - Rótulo: "S1 · 26 mai", "S2 · 02 jun" etc. (sem "Sem.XX")
  - Toggle de ativa/inativa funciona normalmente

- [ ] **Passo 4: Commit**

  ```bash
  git add src/pages/Planejamento/SixWLA.jsx
  git commit -m "style(6wla): pills S1-S6 — cor Cobalt/Ciano e rótulo com data"
  ```

---

## Task 3: Banner Auto-Sync — SixWLA.jsx

**Arquivos:**
- Modify: `src/pages/Planejamento/SixWLA.jsx` (banner, ~linhas 198–220)

- [ ] **Passo 1: Localizar o banner**

  Linha ~198:
  ```jsx
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
  ```

- [ ] **Passo 2: Substituir classes `blue-*` por tokens semânticos**

  ```jsx
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

  **O que muda:**
  - `bg-blue-50 dark:bg-blue-900/20` → `bg-primary/5`
  - `border-blue-200 dark:border-blue-700` → `border-primary/20`
  - `text-blue-600 dark:text-blue-400` (ícone) → `text-primary`
  - `text-blue-700 dark:text-blue-300` (texto) → `text-primary`
  - `text-blue-700 border-blue-300 hover:bg-blue-100` (botão) → `border-primary/30 text-primary hover:bg-primary/10`

- [ ] **Passo 3: Verificar visualmente**

  Para testar o banner é necessário haver atividades no cronograma não vinculadas ao 6WLA. Se não houver dados, confirmar que o componente compila sem erros (`npm run dev` sem erros no console).
  - Light e dark: banner usa a cor primária do tema em vez de azul fixo

- [ ] **Passo 4: Commit**

  ```bash
  git add src/pages/Planejamento/SixWLA.jsx
  git commit -m "style(6wla): banner auto-sync — substituir blue-* por tokens primary"
  ```

---

## Task 4: %Real e Checkbox Padding — SixWLATable.jsx

**Arquivos:**
- Modify: `src/components/planejamento/SixWLATable.jsx`

- [ ] **Passo 1: Adicionar import de `cn`**

  No topo do arquivo, após os imports existentes (linha ~5), adicionar:
  ```jsx
  import { cn } from "@/lib/utils";
  ```

  O arquivo deve ficar:
  ```jsx
  import { useState } from "react";
  import { Trash2, Pencil } from "lucide-react";
  import { cn } from "@/lib/utils";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
  import { Textarea } from "@/components/ui/textarea";
  ```

- [ ] **Passo 2: Remover a variável `avColor` e atualizar o `%Real`**

  Localizar (~linha 79):
  ```jsx
  const avReal = item.tarefa?.avanco_realizado;
  const avColor = avReal >= 100 ? "#16a34a" : avReal >= 50 ? "#d97706" : avReal > 0 ? "#ef4444" : "#9ca3af";
  ```

  Substituir por (remover `avColor`, manter só `avReal`):
  ```jsx
  const avReal = item.tarefa?.avanco_realizado;
  ```

  Localizar (~linha 109):
  ```jsx
  <td className="px-4 py-3 text-center">
    <span className="text-xs font-bold" style={{ color: avColor }}>
      {avReal != null ? `${avReal}%` : "—"}
    </span>
  </td>
  ```

  Substituir por:
  ```jsx
  <td className="px-4 py-3 text-center">
    <span className={cn(
      "text-xs font-bold",
      avReal >= 100 ? "text-green-600 dark:text-green-400" :
      avReal >= 50  ? "text-amber-600 dark:text-amber-400" :
      avReal > 0    ? "text-red-500 dark:text-red-400" :
                      "text-muted-foreground"
    )}>
      {avReal != null ? `${avReal}%` : "—"}
    </span>
  </td>
  ```

- [ ] **Passo 3: Reduzir padding das células de checkbox**

  Localizar (~linha 114):
  ```jsx
  {restricoes.map(r => (
    <td key={r.key} className="px-2 py-3 text-center">
  ```

  Substituir `py-3` por `py-2`:
  ```jsx
  {restricoes.map(r => (
    <td key={r.key} className="px-2 py-2 text-center">
  ```

- [ ] **Passo 4: Verificar visualmente**

  - Coluna `%Real`: valor colorido por classes Tailwind (verde ≥100%, âmbar ≥50%, vermelho >0%, cinza se null)
  - Dark mode: cores mais claras (`dark:text-*-400`)
  - Checkboxes levemente mais compactos (padding vertical reduzido)
  - Nenhum erro de compilação no terminal

- [ ] **Passo 5: Commit**

  ```bash
  git add src/components/planejamento/SixWLATable.jsx
  git commit -m "style(6wla): %Real com classes Tailwind, padding checkbox reduzido"
  ```

---

## Verificação Final

- [ ] Conferir o módulo completo em light e dark mode
- [ ] Conferir em viewport mobile (≤640px): grid 2 colunas, pills com wrap
- [ ] Conferir em viewport tablet (641–1024px): grid 4 colunas
- [ ] Confirmar que não há erros no console do navegador
