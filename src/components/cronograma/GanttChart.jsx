import React, { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Eye, AlertTriangle, Calendar, Diamond } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  if (real >= prev)  return { label: "Em Dia",   color: "#2563eb" };
  return               { label: "Atrasado",      color: "#ef4444" };
}

const INDENT = { 1: 0, 2: 12, 3: 24, 4: 36, 5: 48, 6: 60, 7: 72, 8: 84, 9: 96 };
const TIPO_COLORS = { Resumo: "#26405d", Atividade: "#3b82f6", Marco: "#c35e1e" };

const W_ID   = 60;
const W_NOME = 437;
const W_ACT  = 43;

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

const ROW_H = 36;
const HDR_H = 40;

const BG_MUTED    = "var(--muted, #f4f4f5)";
const BG_CARD     = "var(--card, #ffffff)";
const BG_CRITICAL = "#fef2f2";

function ExtraCell({ col, t, isCritical }) {
  const bg = isCritical ? BG_CRITICAL : BG_CARD;
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

export default function GanttChart({ tarefas, isLoading, zoom, showBaseline, showCritical, onView }) {
  const [collapsed, setCollapsed]       = useState(new Set());
  const [colsExpanded, setColsExpanded] = useState(false);

  const sortedTarefas = useMemo(() => [...tarefas].sort(compareWbs), [tarefas]);

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isAncestorCollapsed = (tarefa) =>
    sortedTarefas.some(t => {
      if (!tarefa.codigo_wbs || !t.codigo_wbs) return false;
      return collapsed.has(t.id) &&
        tarefa.codigo_wbs !== t.codigo_wbs &&
        tarefa.codigo_wbs.startsWith(t.codigo_wbs + ".");
    });

  const hasChildren = (tarefa) => {
    if (!tarefa.codigo_wbs) return false;
    return sortedTarefas.some(t =>
      t.codigo_wbs &&
      t.codigo_wbs !== tarefa.codigo_wbs &&
      t.codigo_wbs.startsWith(tarefa.codigo_wbs + ".") &&
      t.codigo_wbs.replace(tarefa.codigo_wbs + ".", "").split(".").length === 1
    );
  };

  const visibleTarefas = sortedTarefas.filter(t => !isAncestorCollapsed(t));

  const { minDate, headers } = useMemo(() => {
    const dates = visibleTarefas.flatMap(t => [
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

  const CELL_W = zoom === "dias" ? 32 : 80;
  const scale  = CELL_W / (zoom === "dias" ? 1 : 7);

  function getBar(t) {
    const s = parseDate(t.data_inicio_planejada);
    const e = parseDate(t.data_fim_planejada);
    if (!s || !e) return null;
    return { left: diffDays(minDate, s) * scale, width: Math.max(diffDays(s, e), 1) * scale };
  }

  function getBaselineBar(t) {
    const s = parseDate(t.data_inicio_baseline);
    const e = parseDate(t.data_fim_baseline);
    if (!s || !e) return null;
    return { left: diffDays(minDate, s) * scale, width: Math.max(diffDays(s, e), 1) * scale };
  }

  const todayLeft  = diffDays(minDate, today) * scale;
  const isAtrasada = (t) => {
    if (t.tipo === "Resumo") return false;
    const e = parseDate(t.data_fim_planejada);
    return e && e < today && (t.avanco_realizado || 0) < 100;
  };

  if (isLoading) return (
    <div className="space-y-2">
      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}
    </div>
  );

  if (!tarefas.length) return (
    <Card className="text-center p-12">
      <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Nenhuma tarefa cadastrada</p>
      <p className="text-muted-foreground/60 text-sm mt-1">Clique em "Nova Tarefa" para começar o cronograma.</p>
    </Card>
  );

  const ganttWidth = headers.length * CELL_W;

  return (
    <Card className="bg-card shadow-sm" style={{ overflow: "hidden" }}>
      <div className="flex" style={{ minHeight: 400 }}>

        {/* ── Painel esquerdo ─────────────────────────────────────────────
            Estrutura: [colunas fixas | colunas extras (scroll)]
            Colunas fixas (ID, Atividade, Ações) NUNCA rolam.
            Colunas extras têm scroll horizontal próprio e independente.
        ────────────────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 border-r border-border" style={{ boxShadow: colsExpanded ? "2px 0 6px -2px rgba(0,0,0,0.08)" : undefined }}>

          {/* ── Colunas fixas (sem scroll) ── */}
          <div style={{ width: W_ID + W_NOME + W_ACT, flexShrink: 0 }}>

            {/* Header fixo */}
            <div className="flex border-b border-border" style={{ height: HDR_H, background: BG_MUTED }}>
              <div className="flex items-center justify-center border-r border-border shrink-0"
                   style={{ width: W_ID }}>
                <span className="text-xs font-semibold text-muted-foreground">ID</span>
              </div>
              <div className="flex items-center justify-between px-2 border-r border-border shrink-0"
                   style={{ width: W_NOME }}>
                <span className="text-xs font-semibold text-muted-foreground">Atividade</span>
                <button
                  onClick={() => setColsExpanded(v => !v)}
                  title={colsExpanded ? "Recolher colunas" : "Expandir colunas"}
                  className="flex items-center justify-center w-5 h-5 rounded text-xs font-bold border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors leading-none"
                >
                  {colsExpanded ? "−" : "+"}
                </button>
              </div>
              <div className="flex items-center justify-center shrink-0"
                   style={{ width: W_ACT, background: BG_MUTED }} />
            </div>

            {/* Linhas fixas */}
            {visibleTarefas.map(t => {
              const atrasada   = isAtrasada(t);
              const isCritical = showCritical && t.caminho_critico;
              const rowBg      = isCritical ? BG_CRITICAL : BG_CARD;

              return (
                <div key={t.id} className="flex border-b border-border" style={{ height: ROW_H }}>
                  <div className="flex items-center justify-center border-r border-border shrink-0"
                       style={{ width: W_ID, background: rowBg }}>
                    <span className="text-xs text-muted-foreground font-mono truncate px-1">
                      {t.codigo_wbs || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 border-r border-border shrink-0 overflow-hidden"
                       style={{ width: W_NOME, background: rowBg, paddingLeft: 4 + (INDENT[t.nivel] || 0) }}>
                    {hasChildren(t) ? (
                      <button onClick={() => toggleCollapse(t.id)}
                              className="shrink-0 text-muted-foreground hover:text-foreground">
                        {collapsed.has(t.id)
                          ? <ChevronRight className="w-3.5 h-3.5" />
                          : <ChevronDown  className="w-3.5 h-3.5" />}
                      </button>
                    ) : <span className="w-3.5 shrink-0" />}
                    {atrasada    && <AlertTriangle className="w-3 h-3 text-status-critical shrink-0" />}
                    {t.tipo === "Marco" && <Diamond className="w-3 h-3 text-ocre shrink-0" />}
                    <span className={`text-xs truncate ${t.tipo === "Resumo" ? "font-bold" : ""} ${isCritical ? "text-status-critical" : "text-foreground"}`}>
                      {t.nome}
                    </span>
                  </div>
                  <div className="flex items-center justify-center shrink-0"
                       style={{ width: W_ACT, background: rowBg }}>
                    <button onClick={() => onView(t)} className="p-0.5 hover:bg-muted rounded">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Colunas extras com scroll próprio (só quando expandido) ── */}
          {colsExpanded && (
            <div className="overflow-x-auto border-l border-border" style={{ maxWidth: "35vw" }}>
              <div style={{ width: EXTRA_W, minWidth: EXTRA_W }}>

                {/* Header extras */}
                <div className="flex border-b border-border" style={{ height: HDR_H, background: BG_MUTED }}>
                  {EXTRA_COLS.map(col => (
                    <div key={col.key}
                         className="flex items-center justify-center border-r border-border shrink-0"
                         style={{ width: col.w, minWidth: col.w, background: BG_MUTED }}>
                      <span className="text-xs font-semibold text-muted-foreground truncate px-1">
                        {col.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Linhas extras */}
                {visibleTarefas.map(t => {
                  const isCritical = showCritical && t.caminho_critico;
                  return (
                    <div key={t.id} className="flex border-b border-border" style={{ height: ROW_H }}>
                      {EXTRA_COLS.map(col => (
                        <ExtraCell key={col.key} col={col} t={t} isCritical={isCritical} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Gantt ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ width: Math.max(ganttWidth, 400) }}>
            <div className="flex border-b border-border bg-muted" style={{ height: HDR_H }}>
              {headers.map((h, i) => (
                <div key={i}
                     className="border-r border-border flex items-center justify-center text-xs text-muted-foreground shrink-0"
                     style={{ width: CELL_W }}>
                  {h.label}
                </div>
              ))}
            </div>

            {visibleTarefas.map(t => {
              const bar        = getBar(t);
              const baseBar    = showBaseline ? getBaselineBar(t) : null;
              const isCritical = showCritical && t.caminho_critico;

              return (
                <div key={t.id}
                     className={`border-b border-border relative ${isCritical ? "bg-status-critical/5" : ""}`}
                     style={{ height: ROW_H }}>
                  <div className="absolute inset-0 flex">
                    {headers.map((_, i) => (
                      <div key={i} className="border-r border-border shrink-0" style={{ width: CELL_W }} />
                    ))}
                  </div>
                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 opacity-70"
                       style={{ left: todayLeft }} />
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

      {/* Legend */}
      <div className="border-t border-border px-4 py-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#26405d" }} /> Resumo
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }} /> Atividade
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rotate-45" style={{ backgroundColor: "#c35e1e" }} /> Marco
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3 bg-red-400" /> Hoje
        </div>
        {showBaseline && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded" style={{ backgroundColor: "#94a3b8" }} /> Baseline
          </div>
        )}
        {showCritical && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} /> Caminho Crítico
          </div>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#16a34a" }} /> Concluído
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#2563eb" }} /> Em Dia
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#ef4444" }} /> Atrasado
          </span>
        </div>
      </div>
    </Card>
  );
}
