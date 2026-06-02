# Redesign Matriz de Riscos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o layout atual da seção principal de riscos por um split 72/28 com a matriz dinâmica (chips por risco com popup rico ao hover) à esquerda e cards de distribuição por categoria à direita.

**Architecture:** O componente `RiscoHoverCard` é extraído para `src/components/riscos/RiscoHoverCard.jsx` e renderizado via `ReactDOM.createPortal` para escapar do `overflow: hidden` das células. O `GestaoRiscos.jsx` mantém o estado do popup (`hoveredRisco`) e coordena o hover-bridge via `useRef` com `setTimeout`. Toda a lógica de dados existente (queries, mutations, filtros) permanece inalterada.

**Tech Stack:** React 18, Tailwind CSS 3 (JIT), `ReactDOM.createPortal`, `useState`, `useRef`, `useMemo`

**Spec:** `docs/superpowers/specs/2026-06-02-gestao-riscos-matriz-redesign.md`

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/components/riscos/RiscoHoverCard.jsx` | **Criar** | Popup rico renderizado via portal, posicionamento automático esq/dir |
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | **Modificar** | Layout 72/28, chips na matriz, distribuição por categoria, estado hover |

---

## Task 1: Criar `RiscoHoverCard.jsx`

**Files:**
- Create: `src/components/riscos/RiscoHoverCard.jsx`

Este componente recebe o risco em foco e a `DOMRect` do chip que disparou o hover. Renderiza via `createPortal` no `document.body` e calcula se o popup deve aparecer à direita ou à esquerda com base no espaço disponível na viewport.

- [ ] **Step 1: Criar o arquivo com o componente completo**

```jsx
// src/components/riscos/RiscoHoverCard.jsx
import { createPortal } from "react-dom";
import { calcScoreRisco, pesoProbabilidade, pesoImpacto, STATUS_RISCO_COLORS } from "@/utils/riscosUtils";

const POPUP_WIDTH = 240;
const POPUP_OFFSET = 8;

function getSeverityInfo(score) {
  if (score >= 12) return { label: "CRÍTICO",  color: "#ef4444", headerBg: "rgba(239,68,68,0.08)"  };
  if (score >= 6)  return { label: "ALTO",     color: "#f59e0b", headerBg: "rgba(245,158,11,0.08)" };
  if (score >= 4)  return { label: "MODERADO", color: "#eab308", headerBg: "rgba(234,179,8,0.08)"  };
  return            { label: "BAIXO",    color: "#22c55e", headerBg: "rgba(34,197,94,0.08)"  };
}

export default function RiscoHoverCard({ risco, anchorRect, onMouseEnter, onMouseLeave }) {
  const score = risco.score || calcScoreRisco(risco.probabilidade, risco.impacto);
  const sev = getSeverityInfo(score);
  const pPeso = pesoProbabilidade(risco.probabilidade);
  const iPeso = pesoImpacto(risco.impacto);
  const statusColorClass = STATUS_RISCO_COLORS[risco.status] || "text-muted-foreground";

  const spaceOnRight = window.innerWidth - anchorRect.right - POPUP_OFFSET;
  const left = spaceOnRight >= POPUP_WIDTH
    ? anchorRect.right + POPUP_OFFSET
    : anchorRect.left - POPUP_WIDTH - POPUP_OFFSET;
  const top = Math.max(8, anchorRect.top + anchorRect.height / 2 - 100);

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: "fixed", left, top, width: POPUP_WIDTH, zIndex: 9999 }}
      className="bg-card border border-border rounded-xl shadow-xl p-3 pointer-events-auto"
    >
      {/* Header colorido pela severidade */}
      <div
        className="rounded-lg px-3 py-2 mb-3"
        style={{ background: sev.headerBg, borderLeft: `3px solid ${sev.color}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-extrabold text-sm text-foreground">
            {risco.codigo || "—"}
          </span>
          <span className="text-[10px] font-bold tracking-wide" style={{ color: sev.color }}>
            {sev.label} · {score}
          </span>
        </div>
        {risco.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {risco.descricao}
          </p>
        )}
      </div>

      {/* Grid 2×2 */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Categoria</div>
          <div className="text-xs font-semibold text-foreground">{risco.categoria || "—"}</div>
        </div>
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Status</div>
          <div className={`text-xs font-semibold ${statusColorClass}`}>{risco.status || "—"}</div>
        </div>
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Probabilidade</div>
          <div className="text-xs font-semibold text-foreground">
            {risco.probabilidade || "—"}{pPeso ? ` (${pPeso})` : ""}
          </div>
        </div>
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Impacto</div>
          <div className="text-xs font-semibold text-foreground">
            {risco.impacto || "—"}{iPeso ? ` (${iPeso})` : ""}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="border-t border-border pt-2 space-y-1">
        {risco.responsavel && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground/60">Responsável</span>
            <span className="text-xs font-semibold text-foreground">{risco.responsavel}</span>
          </div>
        )}
        {risco.plano_resposta && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-2 leading-relaxed">
            Plano: {risco.plano_resposta}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Verificar que o arquivo foi salvo sem erros de sintaxe**

```bash
node --input-type=module <<'EOF'
import { readFileSync } from 'fs'
readFileSync('src/components/riscos/RiscoHoverCard.jsx', 'utf8')
console.log('OK')
EOF
```

Esperado: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/components/riscos/RiscoHoverCard.jsx
git commit -m "feat(riscos): criar RiscoHoverCard com portal e hover-bridge"
```

---

## Task 2: Atualizar imports e funções auxiliares em `GestaoRiscos.jsx`

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

Adiciona `useRef` ao import do React, importa `RiscoHoverCard`, substitui a função `matrixColor` pelas novas `getCellStyle` e `getCellChipStyle`, e adiciona o componente interno `RiscoChip`.

- [ ] **Step 1: Atualizar import do React para incluir `useRef`**

Localizar a linha 1:
```js
import { useState, useMemo } from "react";
```

Substituir por:
```js
import { useState, useMemo, useRef } from "react";
```

- [ ] **Step 2: Adicionar import do `RiscoHoverCard` após o import de `PlanoAcao` (linha ~25)**

Localizar:
```js
import PlanoAcao from "@/components/riscos/PlanoAcao";
```

Substituir por:
```js
import PlanoAcao from "@/components/riscos/PlanoAcao";
import RiscoHoverCard from "@/components/riscos/RiscoHoverCard";
```

- [ ] **Step 3: Substituir a função `matrixColor` pelas novas auxiliares**

Localizar (linhas 62–68):
```js
// 5×5 matrix cell colors — recebe pesos numéricos (1-5) já derivados do texto
function matrixColor(p, i) {
  const score = p * i;
  if (score >= 12) return "bg-red-500/80";
  if (score >= 6) return "bg-amber-400/80";
  if (score >= 4) return "bg-yellow-300/80";
  return "bg-green-300/80";
}
```

Substituir por:
```js
function getCellStyle(score) {
  if (score >= 12) return { bg: "bg-red-500/15",    border: "border-red-500/30"    };
  if (score >= 6)  return { bg: "bg-amber-500/15",  border: "border-amber-500/30"  };
  if (score >= 4)  return { bg: "bg-yellow-400/15", border: "border-yellow-400/30" };
  return            { bg: "bg-green-500/15",  border: "border-green-500/30"  };
}

function getCellChipStyle(score) {
  if (score >= 12) return { activeColor: "#ef4444", normalBg: "rgba(239,68,68,0.4)",   textColor: "#fca5a5" };
  if (score >= 6)  return { activeColor: "#f59e0b", normalBg: "rgba(245,158,11,0.4)",  textColor: "#fcd34d" };
  if (score >= 4)  return { activeColor: "#eab308", normalBg: "rgba(234,179,8,0.4)",   textColor: "#fef08a" };
  return            { activeColor: "#22c55e", normalBg: "rgba(34,197,94,0.4)",    textColor: "#86efac" };
}
```

- [ ] **Step 4: Adicionar o componente interno `RiscoChip` imediatamente após o `ScoreBadge` (linha ~52)**

Localizar:
```js
const EMPTY_FORM = {
```

Inserir **antes** dessa linha:
```js
function RiscoChip({ risco, cellScore, isActive, isDimmed, onMouseEnter, onMouseLeave }) {
  const chipStyle = getCellChipStyle(cellScore);
  return (
    <span
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: "block",
        width: "100%",
        fontSize: "8px",
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: "4px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.1s",
        background: isActive ? chipStyle.activeColor : chipStyle.normalBg,
        color: isActive ? "#fff" : chipStyle.textColor,
        opacity: isDimmed ? 0.35 : 1,
        outline: isActive ? "1.5px solid rgba(255,255,255,0.5)" : "none",
        boxShadow: isActive ? `0 2px 8px ${chipStyle.activeColor}88` : "none",
      }}
    >
      {risco.codigo || "—"}
    </span>
  );
}

```

- [ ] **Step 5: Verificar que o app ainda compila**

```bash
npx vite build --mode development 2>&1 | tail -20
```

Esperado: sem erros de importação ou sintaxe.

- [ ] **Step 6: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "refactor(riscos): substituir matrixColor por getCellStyle/getCellChipStyle + RiscoChip"
```

---

## Task 3: Atualizar estado e `matrixCells` em `GestaoRiscos.jsx`

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

Substitui `matrixData` (que guardava apenas contagens) por `matrixCells` (que guarda os riscos completos agrupados por célula), adiciona o estado `hoveredRisco` e o ref do timeout de hover-bridge.

- [ ] **Step 1: Substituir o `useMemo` de `matrixData` pelo novo `matrixCells`**

Localizar (linhas 144–152):
```js
  // Matriz 5×5 — conta riscos por célula (chave por peso numérico derivado do texto)
  const matrixData = useMemo(() => {
    const grid = {};
    riscos.forEach(r => {
      const key = `${pesoProbabilidade(r.probabilidade)}-${pesoImpacto(r.impacto)}`;
      grid[key] = (grid[key] || 0) + 1;
    });
    return grid;
  }, [riscos]);
```

Substituir por:
```js
  const matrixCells = useMemo(() => {
    const grid = {};
    riscos.forEach(r => {
      const key = `${pesoProbabilidade(r.probabilidade)}-${pesoImpacto(r.impacto)}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(r);
    });
    return grid;
  }, [riscos]);
```

- [ ] **Step 2: Adicionar estado `hoveredRisco` e `hoverTimeoutRef` logo após os outros `useState` (linha ~83)**

Localizar:
```js
  const [viewItem, setViewItem] = useState(null);
  const FILTROS_KEY = "riscos-filtros";
```

Substituir por:
```js
  const [viewItem, setViewItem] = useState(null);
  const [hoveredRisco, setHoveredRisco] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const FILTROS_KEY = "riscos-filtros";
```

- [ ] **Step 3: Verificar que o app compila sem referências a `matrixData`**

```bash
grep -n "matrixData" src/pages/RiscosMudancas/GestaoRiscos.jsx
```

Esperado: sem output (zero ocorrências).

- [ ] **Step 4: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "refactor(riscos): matrixData→matrixCells com riscos completos + estado hoveredRisco"
```

---

## Task 4: Substituir blocos de layout pelo split 72/28

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx`

Remove os dois blocos antigos (`/* Cards por Categoria */` e `/* Matriz 5×5 */`) e insere o novo bloco `/* Seção principal */` com o layout flex 72/28.

- [ ] **Step 1: Localizar o bloco `/* Cards por Categoria */` e o bloco `/* Matriz 5×5 */`**

Os dois blocos ficam entre os KPIs e a tabela:

```jsx
      {/* Cards por Categoria */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Categoria</p>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {CATEGORIAS.map(cat => {
            const count = riscos.filter(r => r.categoria === cat).length;
            const color = CAT_COLORS[cat];
            return (
              <div
                key={cat}
                className="bg-card rounded-xl border border-border border-l-4 p-3"
                style={{ borderLeftColor: color }}
              >
                <p className="text-xs text-muted-foreground">{cat}</p>
                <p className="text-2xl font-bold text-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matriz 5×5 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Matriz de Riscos (Probabilidade × Impacto)</p>
          <div className="flex gap-4 items-start">
            <div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-xs text-muted-foreground w-16 text-right">Prob.</span>
                {[1,2,3,4,5].map(i => <span key={i} className="text-xs text-center w-10 text-muted-foreground">{i}</span>)}
              </div>
              {[5,4,3,2,1].map(p => (
                <div key={p} className="flex items-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground w-16 text-right">{p}</span>
                  {[1,2,3,4,5].map(i => {
                    const count = matrixData[`${p}-${i}`] || 0;
                    return (
                      <div key={i} className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold text-white ${matrixColor(p, i)}`}>
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex items-center gap-1 mt-1">
                <span className="w-16" />
                <span className="text-xs text-muted-foreground flex-1 text-center">Impacto →</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {[
                { color: "bg-red-500/80", label: "Crítico (≥12)" },
                { color: "bg-amber-400/80", label: "Alto (6-11)" },
                { color: "bg-yellow-300/80", label: "Moderado (4-5)" },
                { color: "bg-green-300/80", label: "Baixo (1-3)" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${l.color}`} />
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
```

- [ ] **Step 2: Substituir ambos os blocos pelo novo bloco `/* Seção principal */`**

Substituir o trecho identificado no Step 1 pelo seguinte:

```jsx
      {/* Seção principal: Matriz 72% + Distribuição 28% */}
      <div className="flex gap-4 items-start">

        {/* Coluna esquerda — Matriz 5×5 interativa */}
        <Card className="border shadow-sm" style={{ flex: "0 0 72%" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Matriz de Riscos — Probabilidade × Impacto
            </p>
            <div className="flex gap-3 items-start">
              {/* Eixo Y */}
              <div className="flex flex-col items-end shrink-0" style={{ paddingTop: "20px" }}>
                {[5,4,3,2,1].map(p => (
                  <div key={p} className="flex items-center justify-end" style={{ height: "72px", marginBottom: "6px" }}>
                    <span className="text-xs text-muted-foreground w-4 text-right">{p}</span>
                  </div>
                ))}
              </div>

              {/* Grade */}
              <div className="flex-1 min-w-0">
                {/* Header impacto */}
                <div className="flex gap-1.5 mb-1.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-xs text-muted-foreground">{i}</span>
                    </div>
                  ))}
                </div>

                {/* Linhas P=5 até P=1 */}
                {[5,4,3,2,1].map(p => (
                  <div key={p} className="flex gap-1.5 mb-1.5">
                    {[1,2,3,4,5].map(i => {
                      const score = p * i;
                      const cellStyle = getCellStyle(score);
                      const chips = matrixCells[`${p}-${i}`] || [];
                      const hasHoveredInCell = chips.some(c => c.id === hoveredRisco?.risco?.id);
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-lg border overflow-y-auto flex flex-col gap-1 p-1 ${cellStyle.bg} ${cellStyle.border}`}
                          style={{ height: "72px" }}
                        >
                          {chips.map(r => (
                            <RiscoChip
                              key={r.id}
                              risco={r}
                              cellScore={score}
                              isActive={hoveredRisco?.risco?.id === r.id}
                              isDimmed={hasHoveredInCell && hoveredRisco?.risco?.id !== r.id}
                              onMouseEnter={(e) => {
                                clearTimeout(hoverTimeoutRef.current);
                                setHoveredRisco({ risco: r, anchorRect: e.currentTarget.getBoundingClientRect() });
                              }}
                              onMouseLeave={() => {
                                hoverTimeoutRef.current = setTimeout(() => setHoveredRisco(null), 80);
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Eixo X label */}
                <div className="text-center mt-1">
                  <span className="text-xs text-muted-foreground">Impacto →</span>
                </div>
              </div>
            </div>

            {/* Legenda na base */}
            <div className="flex gap-4 mt-4 pt-3 border-t border-border flex-wrap">
              {[
                { label: "Crítico (≥12)",  bg: "bg-red-500/80"    },
                { label: "Alto (6–11)",    bg: "bg-amber-500/80"  },
                { label: "Moderado (4–5)", bg: "bg-yellow-400/80" },
                { label: "Baixo (1–3)",   bg: "bg-green-500/80"  },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${l.bg}`} />
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coluna direita — Distribuição por categoria */}
        <div className="flex-1 bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Distribuição</p>
          {CATEGORIAS.map(cat => {
            const count = riscos.filter(r => r.categoria === cat).length;
            const color = CAT_COLORS[cat];
            const pct = riscos.length > 0 ? (count / riscos.length) * 100 : 0;
            return (
              <div
                key={cat}
                className="bg-background rounded-lg p-2.5 border-l-4"
                style={{ borderLeftColor: color }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground">{cat}</span>
                  <span className="text-sm font-extrabold" style={{ color }}>{count}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup de hover — renderizado via portal em RiscoHoverCard */}
      {hoveredRisco && (
        <RiscoHoverCard
          risco={hoveredRisco.risco}
          anchorRect={hoveredRisco.anchorRect}
          onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
          onMouseLeave={() => {
            hoverTimeoutRef.current = setTimeout(() => setHoveredRisco(null), 80);
          }}
        />
      )}
```

- [ ] **Step 3: Verificar que não há mais referência a `matrixData` ou `matrixColor` no arquivo**

```bash
grep -n "matrixData\|matrixColor" src/pages/RiscosMudancas/GestaoRiscos.jsx
```

Esperado: sem output.

- [ ] **Step 4: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "feat(riscos): layout 72/28 com chips interativos na matriz e distribuição por categoria"
```

---

## Task 5: Verificação visual e ajustes

**Files:**
- Nenhum arquivo novo — apenas confirmar comportamentos na UI

- [ ] **Step 1: Iniciar o dev server**

```bash
npm run dev
```

Abrir `http://localhost:5173` (ou porta configurada) e navegar até Riscos e Mudanças → aba Riscos.

- [ ] **Step 2: Verificar o layout geral**

Checar visualmente:
- [ ] Matriz ocupa ~72% da largura da seção principal
- [ ] Cards de distribuição ocupam ~28% à direita, empilhados verticalmente
- [ ] Todos os 7 cards de categoria aparecem com borda colorida e barra de progresso
- [ ] Barra de progresso é proporcional ao total de riscos (categoria maior tem barra mais longa)
- [ ] Legenda de severidade aparece na base da matriz

- [ ] **Step 3: Verificar chips na matriz**

- [ ] Células com riscos mostram os chips com o código (ex: `R01`)
- [ ] Células sem riscos aparecem coloridas e vazias
- [ ] Células com 4+ riscos têm scroll interno (testar criando riscos temporários com mesma P × I)
- [ ] O chip exibe `"—"` se o risco não tiver `codigo`

- [ ] **Step 4: Verificar hover e popup**

- [ ] Ao passar o mouse sobre um chip, o popup rico aparece ao lado
- [ ] O popup exibe: código, nível de severidade + score, descrição, categoria, status, probabilidade (com número), impacto (com número), responsável, plano de resposta
- [ ] Outros chips da mesma célula ficam translúcidos (opacity ~0.35)
- [ ] Mover o mouse do chip para o popup mantém o popup aberto (hover-bridge OK)
- [ ] Mover o mouse para fora de ambos fecha o popup
- [ ] Popup aparece à esquerda quando não há espaço à direita (testar com chips nas colunas I=4 e I=5)

- [ ] **Step 5: Verificar estados de borda**

- [ ] Sem riscos cadastrados: todas as células aparecem coloridas e vazias, cards de categoria mostram 0 com barra zerada
- [ ] Filtro ativo: os cards de distribuição continuam mostrando os totais do projeto inteiro (não dos filtrados — `riscos`, não `filtered`)

- [ ] **Step 6: Commit final se necessário**

Se houver ajustes visuais finos (padding, tamanho de fonte, etc.):

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx src/components/riscos/RiscoHoverCard.jsx
git commit -m "fix(riscos): ajustes visuais pós-verificação na matriz e popup"
```

---

## Notas de Implementação

**Tailwind JIT e classes dinâmicas:** As classes `bg-red-500/15`, `border-red-500/30`, etc. usam o operador de opacidade do Tailwind 3 JIT. Se aparecerem sem estilo, adicionar ao `safelist` em `tailwind.config.js` ou usar `style` inline.

**Portal e scroll:** O `createPortal` resolve o clipping pelo `overflow-y: auto` das células. O popup é renderizado direto no `document.body` e usa `position: fixed`, portanto não é afetado por transforms ou overflow de ancestrais.

**Cards de distribuição vs filtro:** Os cards de distribuição por categoria usam `riscos` (todos do projeto), não `filtered` (resultado do filtro ativo). Isso é intencional — mostrar a distribuição real do portfólio, não do subconjunto filtrado.
