import React, { useRef, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, ChevronDown, Eye, AlertTriangle, Calendar, Diamond } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ── Date utilities ────────────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d) ? null : d;
}

function diffDays(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T00:00:00");
  return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function calcStatus(t) {
  const real = t.avanco_realizado ?? 0;
  const prev = t.avanco_previsto ?? 0;
  if (real >= 100) return { label: "Concluído", color: "#16a34a" };
  if (real >= prev) return { label: "Em Dia",   color: "#2563eb" };
  return                  { label: "Atrasado",  color: "#ef4444" };
}

// ── WBS sort ──────────────────────────────────────────────────────────────────

function wbsKey(wbs) {
  if (!wbs) return [];
  return wbs.split(".").map(seg => parseInt(seg, 10) || 0);
}

function compareWbs(a, b) {
  const ak = wbsKey(a.codigo_wbs);
  const bk = wbsKey(b.codigo_wbs);
  for (let i = 0; i < Math.max(ak.length, bk.length); i++) {
    const diff = (ak[i] ?? -1) - (bk[i] ?? -1);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INDENT = { 1: 0, 2: 12, 3: 24, 4: 36, 5: 48, 6: 60, 7: 72, 8: 84, 9: 96 };
const TIPO_COLORS = { Resumo: "#26405d", Atividade: "#3b82f6", Marco: "#c35e1e" };

const W_ID   = 96;
const W_NIV  = 40;
const W_NOME = 500;
const W_ACT  = 43;

const LEVEL_BG = {
  1: "color-mix(in srgb, hsl(210 40% 40%) 28%,   transparent)",
  2: "color-mix(in srgb, hsl(210 40% 40%) 21%,   transparent)",
  3: "color-mix(in srgb, hsl(210 40% 40%) 15%,   transparent)",
  4: "color-mix(in srgb, hsl(210 40% 40%) 11%,   transparent)",
  5: "color-mix(in srgb, hsl(210 40% 40%)  8%,   transparent)",
  6: "color-mix(in srgb, hsl(210 40% 40%)  5.5%, transparent)",
  7: "color-mix(in srgb, hsl(210 40% 40%)  3.5%, transparent)",
  8: "color-mix(in srgb, hsl(210 40% 40%)  2%,   transparent)",
  9: "color-mix(in srgb, hsl(210 40% 40%)  1.2%, transparent)",
};
const LEVEL_BADGE_BG = {
  1: "color-mix(in srgb, hsl(210 40% 40%) 52%, transparent)",
  2: "color-mix(in srgb, hsl(210 40% 40%) 40%, transparent)",
  3: "color-mix(in srgb, hsl(210 40% 40%) 30%, transparent)",
  4: "color-mix(in srgb, hsl(210 40% 40%) 22%, transparent)",
  5: "color-mix(in srgb, hsl(210 40% 40%) 16%, transparent)",
  6: "color-mix(in srgb, hsl(210 40% 40%) 11%, transparent)",
  7: "color-mix(in srgb, hsl(210 40% 40%)  7%, transparent)",
  8: "color-mix(in srgb, hsl(210 40% 40%)  4.5%, transparent)",
  9: "color-mix(in srgb, hsl(210 40% 40%)  3%, transparent)",
};
const BG_MUTED    = "var(--muted)";
const BG_CRITICAL = "color-mix(in srgb, hsl(var(--destructive)) 8%, transparent)";

const EXTRA_COLS = [
  { key: "data_inicio_baseline",  label: "Início BL",    w: 92  },
  { key: "data_fim_baseline",     label: "Término BL",   w: 92  },
  { key: "data_inicio_real",      label: "Início Real",  w: 92  },
  { key: "data_fim_real",         label: "Término Real", w: 92  },
  { key: "data_inicio_planejada", label: "Início Prev",  w: 92  },
  { key: "data_fim_planejada",    label: "Término Prev", w: 92  },
  { key: "avanco_previsto",       label: "%Prev",        w: 52  },
  { key: "avanco_realizado",      label: "%Real",        w: 52  },
  { key: "area",                  label: "Área",         w: 86  },
  { key: "disciplina",            label: "Disciplina",   w: 101 },
  { key: "_status",               label: "Status",       w: 96  },
];

const EXTRA_W = EXTRA_COLS.reduce((s, c) => s + c.w, 0);
const ROW_H   = 36;
const HDR_H   = 40;

// ── ExtraCell ─────────────────────────────────────────────────────────────────

function ExtraCell({ col, t, bg }) {
  const baseClass = "flex items-center border-r border-border shrink-0";
  const baseStyle = { width: col.w, minWidth: col.w, background: bg };

  if (col.key === "_status") {
    const s = calcStatus(t);
    return (
      <div className={`${baseClass} justify-center`} style={baseStyle}>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: s.color, backgroundColor: s.color + "18" }}>
          {s.label}
        </span>
      </div>
    );
  }
  if (col.key === "avanco_previsto" || col.key === "avanco_realizado") {
    const val    = t[col.key] ?? 0;
    const isReal = col.key === "avanco_realizado";
    return (
      <div className={`${baseClass} justify-center`} style={baseStyle}>
        <span className={`text-xs font-medium ${isReal && val >= 100 ? "text-status-positive" : "text-foreground"}`}>
          {val}%
        </span>
      </div>
    );
  }
  if (col.key.startsWith("data_")) {
    return (
      <div className={`${baseClass} justify-center`} style={baseStyle}>
        <span className="text-xs text-muted-foreground">{fmtDate(t[col.key])}</span>
      </div>
    );
  }
  return (
    <div className={`${baseClass} overflow-hidden px-1`} style={baseStyle}>
      <span className="text-xs text-muted-foreground truncate">{t[col.key] || "—"}</span>
    </div>
  );
}

// ── GanttChart ────────────────────────────────────────────────────────────────

export default function GanttChart({ tarefas, isLoading, zoom, showBaseline, showCritical, onView }) {
  const [collapsed, setCollapsed]       = useState(new Set());
  const [colsExpanded, setColsExpanded] = useState(false);

  // parentRef: único container de scroll vertical (usado pelo virtualizador)
  const parentRef     = useRef(null);
  // Refs dos divs internos — recebem transform: translateX para scroll horizontal sem overflow independente
  const ganttInnerRef = useRef(null);
  const ganttHdrInner = useRef(null);
  const extraInnerRef = useRef(null);
  const extraHdrInner = useRef(null);

  // ── Ordenação WBS hierárquica ──
  const sortedTarefas = useMemo(() => [...tarefas].sort(compareWbs), [tarefas]);

  // ── childrenSet: O(n) build, O(1) lookup — substitui hasChildren O(n²) ──
  const childrenSet = useMemo(() => {
    const set = new Set();
    for (const t of sortedTarefas) {
      const wbs = t.codigo_wbs;
      if (!wbs) continue;
      const idx = wbs.lastIndexOf(".");
      if (idx > 0) set.add(wbs.slice(0, idx));
    }
    return set;
  }, [sortedTarefas]);

  const hasChildren = (t) => t.codigo_wbs ? childrenSet.has(t.codigo_wbs) : false;
  const isLeaf      = (t) => !hasChildren(t);

  // ── collapsedWbsSet: O(1) ancestor check por profundidade ──
  const collapsedWbsSet = useMemo(() => {
    const set = new Set();
    for (const t of sortedTarefas) {
      if (collapsed.has(t.id) && t.codigo_wbs) set.add(t.codigo_wbs);
    }
    return set;
  }, [sortedTarefas, collapsed]);

  // ── Linhas visíveis (respeitando colapsos) ──
  const visibleTarefas = useMemo(() => {
    return sortedTarefas.filter(t => {
      if (!t.codigo_wbs) return true;
      const parts = t.codigo_wbs.split(".");
      for (let i = 1; i < parts.length; i++) {
        if (collapsedWbsSet.has(parts.slice(0, i).join("."))) return false;
      }
      return true;
    });
  }, [sortedTarefas, collapsedWbsSet]);

  // ── Cor de fundo por nível + folhas transparentes ──
  const getRowBg = (t, isCritical) => {
    if (isCritical) return BG_CRITICAL;
    return LEVEL_BG[t.nivel] || "transparent";
  };

  // ── Timeline headers ──
  const { minDate, headers } = useMemo(() => {
    const dates = sortedTarefas.flatMap(t => [
      parseDate(t.data_inicio_planejada), parseDate(t.data_fim_planejada),
      parseDate(t.data_inicio_baseline),  parseDate(t.data_fim_baseline),
    ]).filter(Boolean);
    if (!dates.length) {
      const s = new Date(today); s.setDate(s.getDate() - 14);
      const e = new Date(today); e.setDate(e.getDate() + 60);
      dates.push(s, e);
    }
    let minD = new Date(Math.min(...dates));
    let maxD = new Date(Math.max(...dates));
    minD.setDate(minD.getDate() - 7);
    maxD.setDate(maxD.getDate() + 14);

    const hdrs = [];
    let cur = new Date(minD);
    while (cur <= maxD) {
      hdrs.push({ label: cur.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), date: new Date(cur) });
      cur.setDate(cur.getDate() + (zoom === "dias" ? 1 : 7));
    }
    return { minDate: minD, headers: hdrs };
  }, [sortedTarefas, zoom]);

  const CELL_W     = zoom === "dias" ? 32 : 80;
  const scale      = CELL_W / (zoom === "dias" ? 1 : 7);
  const ganttWidth = Math.max(headers.length * CELL_W, 400);

  const getBar = (t) => {
    const s = parseDate(t.data_inicio_planejada);
    const e = parseDate(t.data_fim_planejada);
    if (!s || !e) return null;
    return { left: diffDays(minDate, s) * scale, width: Math.max(diffDays(s, e), 1) * scale };
  };

  const getBaselineBar = (t) => {
    const s = parseDate(t.data_inicio_baseline);
    const e = parseDate(t.data_fim_baseline);
    if (!s || !e) return null;
    return { left: diffDays(minDate, s) * scale, width: Math.max(diffDays(s, e), 1) * scale };
  };

  const todayLeft  = diffDays(minDate, today) * scale;
  const isAtrasada = (t) => {
    if (t.tipo === "Resumo") return false;
    const e = parseDate(t.data_fim_planejada);
    return e && e < today && (t.avanco_realizado || 0) < 100;
  };

  // ── Virtualizer: único container vertical (parentRef) ──
  const rowVirtualizer = useVirtualizer({
    count:            visibleTarefas.length,
    getScrollElement: () => parentRef.current,
    estimateSize:     () => ROW_H,
    overscan:         8,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalH      = rowVirtualizer.getTotalSize();

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Handlers de scroll horizontal (via transform, sem criar scroll container) ──
  const handleGanttScroll = (e) => {
    const sl = e.currentTarget.scrollLeft;
    if (ganttInnerRef.current) ganttInnerRef.current.style.transform = `translateX(-${sl}px)`;
    if (ganttHdrInner.current) ganttHdrInner.current.style.transform = `translateX(-${sl}px)`;
  };

  const handleExtraScroll = (e) => {
    const sl = e.currentTarget.scrollLeft;
    if (extraInnerRef.current) extraInnerRef.current.style.transform = `translateX(-${sl}px)`;
    if (extraHdrInner.current) extraHdrInner.current.style.transform = `translateX(-${sl}px)`;
  };

  // ── Estados especiais ──
  if (isLoading) return (
    <div className="space-y-2">
      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}
    </div>
  );

  if (!tarefas.length) return (
    <Card className="text-center p-12">
      <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Nenhuma tarefa cadastrada</p>
      <p className="text-muted-foreground/60 text-sm mt-1">Clique em "Importar / Exportar" para começar o cronograma.</p>
    </Card>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Card className="bg-card shadow-sm flex flex-col overflow-hidden" style={{ height: "100%" }}>

      {/* ── Header fixo (não rola verticalmente) ──────────────────────────── */}
      <div className="flex shrink-0 border-b border-border" style={{ height: HDR_H, background: BG_MUTED }}>

        {/* Cabeçalhos fixos: ID + Nív + Atividade + Ações */}
        <div className="flex shrink-0 border-r border-border" style={{ width: W_ID + W_NIV + W_NOME + W_ACT }}>
          <div className="flex items-center pl-2 border-r border-border shrink-0" style={{ width: W_ID }}>
            <span className="text-xs font-semibold text-muted-foreground">ID</span>
          </div>
          {/* Nível */}
          <div className="flex items-center justify-center border-r border-border shrink-0"
               style={{ width: W_NIV }}>
            <span className="text-xs font-semibold text-muted-foreground">Nív</span>
          </div>
          <div className="flex items-center justify-between px-2 border-r border-border shrink-0" style={{ width: W_NOME }}>
            <span className="text-xs font-semibold text-muted-foreground">Atividade</span>
            <button
              onClick={() => setColsExpanded(v => !v)}
              title={colsExpanded ? "Recolher colunas" : "Expandir colunas"}
              className="flex items-center justify-center w-5 h-5 rounded text-xs font-bold border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors leading-none"
            >
              {colsExpanded ? "−" : "+"}
            </button>
          </div>
          <div className="flex items-center justify-center shrink-0" style={{ width: W_ACT }} />
        </div>

        {/* Cabeçalho das colunas extras — overflow-x: clip sem criar scroll container */}
        {colsExpanded && (
          <div className="shrink-0 border-r border-border" style={{ maxWidth: "35vw", overflowX: "clip" }}>
            <div ref={extraHdrInner} className="flex" style={{ width: EXTRA_W }}>
              {EXTRA_COLS.map(col => (
                <div key={col.key}
                     className="flex items-center justify-center border-r border-border shrink-0"
                     style={{ width: col.w, minWidth: col.w }}>
                  <span className="text-xs font-semibold text-muted-foreground truncate px-1">{col.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cabeçalho da timeline Gantt — overflow-x: clip sem criar scroll container */}
        <div className="flex-1" style={{ overflowX: "clip" }}>
          <div ref={ganttHdrInner} className="flex" style={{ width: ganttWidth }}>
            {headers.map((h, i) => (
              <div key={i}
                   className="border-r border-border flex items-center justify-center text-xs text-muted-foreground shrink-0"
                   style={{ width: CELL_W }}>
                {h.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Corpo: único container de scroll vertical ─────────────────────── */}
      {/*
          Todos os painéis têm height: totalH.
          overflow-x: clip (não overflow: hidden) — a diferença é que `clip` não força
          overflow-y: auto, então overflow-y: visible permanece e parentRef controla o
          scroll vertical de todos os painéis de forma unificada.
      */}
      <div
        ref={parentRef}
        className="flex flex-1 min-h-0"
        style={{ overflowY: "auto", overflowX: "hidden" }}
      >
        {/* Painel 1: colunas fixas (ID, Atividade, Ações)
            height: totalH — garante que parentRef tenha a altura de rolagem correta */}
        <div className="shrink-0 border-r border-border relative"
             style={{ width: W_ID + W_NIV + W_NOME + W_ACT, height: totalH }}>
          {virtualRows.map(vr => {
            const t          = visibleTarefas[vr.index];
            const atrasada   = isAtrasada(t);
            const isCritical = showCritical && t.caminho_critico;
            const bg         = getRowBg(t, isCritical);
            return (
              <div key={t.id}
                   className="flex absolute border-b border-border"
                   style={{ top: vr.start, width: "100%", height: ROW_H }}>
                {/* ID */}
                <div className="flex items-center border-r border-border shrink-0 pl-2"
                     style={{ width: W_ID, background: bg }}>
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {t.codigo_wbs || "—"}
                  </span>
                </div>
                {/* Nível */}
                <div className="flex items-center justify-center border-r border-border shrink-0"
                     style={{ width: W_NIV, background: bg }}>
                  <span className="text-xs font-bold rounded px-1 py-0.5"
                        style={{ background: LEVEL_BADGE_BG[t.nivel], color: "white" }}>
                    {t.nivel ?? "—"}
                  </span>
                </div>
                {/* Atividade */}
                <div className="flex items-center gap-1 border-r border-border shrink-0 overflow-hidden"
                     style={{ width: W_NOME, background: bg, paddingLeft: 4 + (INDENT[t.nivel] || 0) }}>
                  {hasChildren(t) ? (
                    <button onClick={() => toggleCollapse(t.id)}
                            className="shrink-0 text-muted-foreground hover:text-foreground">
                      {collapsed.has(t.id)
                        ? <ChevronRight className="w-3.5 h-3.5" />
                        : <ChevronDown  className="w-3.5 h-3.5" />}
                    </button>
                  ) : <span className="w-3.5 shrink-0" />}
                  {atrasada        && <AlertTriangle className="w-3 h-3 text-status-critical shrink-0" />}
                  {t.tipo === "Marco" && <Diamond className="w-3 h-3 text-ocre shrink-0" />}
                  <span className={`text-xs truncate ${t.tipo === "Resumo" ? "font-bold" : ""} ${isCritical ? "text-status-critical" : "text-foreground"}`}>
                    {t.nome}
                  </span>
                </div>
                {/* Ações */}
                <div className="flex items-center justify-center shrink-0"
                     style={{ width: W_ACT, background: bg }}>
                  <button onClick={() => onView(t)} className="p-0.5 hover:bg-muted rounded">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Painel 2: colunas extras
            overflow-x: clip — clipa sem criar scroll container independente.
            overflow-y: visible — parentRef controla o scroll vertical.
            O inner div recebe transform: translateX via ref para simular scroll horizontal. */}
        {colsExpanded && (
          <div className="shrink-0 border-r border-border"
               style={{ overflowX: "clip", overflowY: "visible", maxWidth: "35vw", height: totalH }}>
            <div ref={extraInnerRef} className="relative" style={{ width: EXTRA_W, height: totalH }}>
              {virtualRows.map(vr => {
                const t          = visibleTarefas[vr.index];
                const isCritical = showCritical && t.caminho_critico;
                const bg         = getRowBg(t, isCritical);
                return (
                  <div key={t.id}
                       className="flex absolute border-b border-border"
                       style={{ top: vr.start, width: "100%", height: ROW_H }}>
                    {EXTRA_COLS.map(col => (
                      <ExtraCell key={col.key} col={col} t={t} bg={bg} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Painel 3: timeline Gantt
            Mesma estratégia: overflow-x: clip + overflow-y: visible.
            inner div (ganttInnerRef) recebe transform horizontal via handleGanttScroll. */}
        <div className="flex-1 min-w-0"
             style={{ overflowX: "clip", overflowY: "visible", height: totalH }}>
          <div ref={ganttInnerRef} className="relative" style={{ width: ganttWidth, height: totalH }}>

            {/* Linhas verticais de grade (span total height — renderizadas 1x, não por linha) */}
            <div className="absolute inset-0 flex pointer-events-none">
              {headers.map((_, i) => (
                <div key={i} className="border-r border-border shrink-0" style={{ width: CELL_W, height: "100%" }} />
              ))}
            </div>

            {/* Linha "Hoje" (span total height) */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-70 pointer-events-none z-10"
                 style={{ left: todayLeft }} />

            {/* Linhas virtuais: backgrounds e barras */}
            {virtualRows.map(vr => {
              const t          = visibleTarefas[vr.index];
              const bar        = getBar(t);
              const baseBar    = showBaseline ? getBaselineBar(t) : null;
              const isCritical = showCritical && t.caminho_critico;
              const bg         = getRowBg(t, isCritical);
              return (
                <div key={t.id}
                     className="absolute border-b border-border"
                     style={{ top: vr.start, left: 0, width: "100%", height: ROW_H, background: bg }}>
                  {baseBar && (
                    <div className="absolute rounded"
                         style={{ left: baseBar.left, width: baseBar.width, height: 6, top: 22, backgroundColor: "#94a3b8", opacity: 0.5 }} />
                  )}
                  {bar && t.tipo !== "Marco" && (
                    <div className="absolute rounded"
                         style={{ left: bar.left, width: bar.width, height: 16, top: 10,
                                  backgroundColor: isCritical ? "#ef444440" : TIPO_COLORS[t.tipo] + "30",
                                  border: `1.5px solid ${isCritical ? "#ef4444" : TIPO_COLORS[t.tipo]}` }}>
                      <div className="h-full rounded"
                           style={{ width: `${Math.min(t.avanco_realizado || 0, 100)}%`,
                                    backgroundColor: isCritical ? "#ef4444" : TIPO_COLORS[t.tipo],
                                    opacity: 0.7 }} />
                    </div>
                  )}
                  {bar && t.tipo === "Marco" && (
                    <div className="absolute"
                         style={{ left: bar.left - 7, top: 10, width: 14, height: 14,
                                  backgroundColor: "#c35e1e", transform: "rotate(45deg)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Barra de rolagem horizontal — fora do scroll vertical ─────────── */}
      {/* Alinhada por painel: spacer + extras (opcional) + gantt */}
      <div className="flex shrink-0 border-t border-border">
        <div className="shrink-0" style={{ width: W_ID + W_NIV + W_NOME + W_ACT }} />
        {colsExpanded && (
          <div
            className="shrink-0 border-r border-border"
            style={{ maxWidth: "35vw", overflowX: "auto" }}
            onScroll={handleExtraScroll}
          >
            <div style={{ width: EXTRA_W, height: 1 }} />
          </div>
        )}
        <div
          className="flex-1"
          style={{ overflowX: "auto" }}
          onScroll={handleGanttScroll}
        >
          <div style={{ width: ganttWidth, height: 1 }} />
        </div>
      </div>
    </Card>
  );
}
