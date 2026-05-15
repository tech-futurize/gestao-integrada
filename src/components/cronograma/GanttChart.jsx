import React, { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertTriangle, Calendar, Diamond } from "lucide-react";

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

const INDENT = { 1: 0, 2: 16, 3: 32, 4: 48, 5: 64 };
const TIPO_COLORS = { Resumo: "#26405d", Atividade: "#3b82f6", Marco: "#c35e1e" };

export default function GanttChart({ tarefas, isLoading, zoom, showBaseline, showCritical, onEdit, onDelete, onUpdateAvanco }) {
  const [tableWidth] = useState(760);
  const [collapsed, setCollapsed] = useState(new Set());

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAncestorCollapsed = (tarefa) => {
    return tarefas.some(t => {
      if (!tarefa.codigo_wbs || !t.codigo_wbs) return false;
      return collapsed.has(t.id) && tarefa.codigo_wbs !== t.codigo_wbs && tarefa.codigo_wbs.startsWith(t.codigo_wbs + ".");
    });
  };

  const hasChildren = (tarefa) => {
    if (!tarefa.codigo_wbs) return false;
    return tarefas.some(t => t.codigo_wbs && t.codigo_wbs !== tarefa.codigo_wbs && t.codigo_wbs.startsWith(tarefa.codigo_wbs + ".") && t.codigo_wbs.replace(tarefa.codigo_wbs + ".", "").split(".").length === 1);
  };

  const visibleTarefas = tarefas.filter(t => !isAncestorCollapsed(t));

  const { minDate, maxDate, totalDays, headers } = useMemo(() => {
    const dates = visibleTarefas.flatMap(t => [
      parseDate(t.data_inicio_planejada), parseDate(t.data_fim_planejada),
      parseDate(t.data_inicio_baseline), parseDate(t.data_fim_baseline),
    ]).filter(Boolean);
    if (!dates.length) {
      const start = new Date(today);
      start.setDate(start.getDate() - 14);
      const end = new Date(today);
      end.setDate(end.getDate() + 60);
      dates.push(start, end);
    }
    let minD = new Date(Math.min(...dates));
    let maxD = new Date(Math.max(...dates));
    minD.setDate(minD.getDate() - 7);
    maxD.setDate(maxD.getDate() + 14);
    const total = diffDays(minD, maxD);

    // Build headers
    const hdrs = [];
    if (zoom === "dias") {
      let cur = new Date(minD);
      while (cur <= maxD) {
        hdrs.push({ label: cur.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), date: new Date(cur), span: 1 });
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      let cur = new Date(minD);
      while (cur <= maxD) {
        const weekStart = new Date(cur);
        hdrs.push({ label: cur.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), date: new Date(cur), span: 7 });
        cur.setDate(cur.getDate() + 7);
      }
    }

    return { minDate: minD, maxDate: maxD, totalDays: total, headers: hdrs };
  }, [tarefas, zoom]);

  const CELL_W = zoom === "dias" ? 32 : 80;

  function getBar(t) {
    const start = parseDate(t.data_inicio_planejada);
    const end = parseDate(t.data_fim_planejada);
    if (!start || !end) return null;
    const left = diffDays(minDate, start) * (CELL_W / (zoom === "dias" ? 1 : 7));
    const width = Math.max(diffDays(start, end), 1) * (CELL_W / (zoom === "dias" ? 1 : 7));
    return { left, width };
  }

  function getBaselineBar(t) {
    const start = parseDate(t.data_inicio_baseline);
    const end = parseDate(t.data_fim_baseline);
    if (!start || !end) return null;
    const left = diffDays(minDate, start) * (CELL_W / (zoom === "dias" ? 1 : 7));
    const width = Math.max(diffDays(start, end), 1) * (CELL_W / (zoom === "dias" ? 1 : 7));
    return { left, width };
  }

  const todayLeft = diffDays(minDate, today) * (CELL_W / (zoom === "dias" ? 1 : 7));

  const isAtrasada = (t) => {
    if (t.tipo === "Resumo") return false;
    const end = parseDate(t.data_fim_planejada);
    return end && end < today && (t.avanco_realizado || 0) < 100;
  };

  if (isLoading) return <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>;

  if (!tarefas.length) return (
    <Card className="text-center p-12">
      <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Nenhuma tarefa cadastrada</p>
      <p className="text-muted-foreground/60 text-sm mt-1">Clique em "Nova Tarefa" para começar o cronograma.</p>
    </Card>
  );

  const ganttWidth = headers.length * CELL_W;

  return (
    <Card className="bg-card shadow-sm overflow-hidden">
      <div className="flex" style={{ minHeight: 400 }}>
        {/* WBS Table */}
        <div style={{ width: tableWidth, minWidth: tableWidth }} className="border-r border-border overflow-hidden">
          {/* Header */}
          <div className="flex border-b border-border bg-muted" style={{ height: 40 }}>
            <div className="px-3 flex items-center text-xs font-semibold text-muted-foreground flex-1">Tarefa</div>
            <div className="w-24 flex items-center justify-center text-xs font-semibold text-muted-foreground">Início</div>
            <div className="w-24 flex items-center justify-center text-xs font-semibold text-muted-foreground border-l border-border">Término</div>
            <div className="w-14 flex items-center justify-center text-xs font-semibold text-muted-foreground border-l border-border">%</div>
            <div className="w-10 flex items-center justify-center text-xs font-semibold text-muted-foreground border-l border-border"></div>
          </div>
          {visibleTarefas.map(t => {
            const atrasada = isAtrasada(t);
            const isCritical = showCritical && t.caminho_critico;
            return (
              <div key={t.id} className={`flex border-b border-border ${isCritical ? "bg-status-critical/5" : ""}`} style={{ height: 36 }}>
                <div className="flex items-center flex-1 px-2 gap-1.5 overflow-hidden" style={{ paddingLeft: 8 + (INDENT[t.nivel] || 0) }}>
                  {hasChildren(t) ? (
                    <button onClick={() => toggleCollapse(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
                      {collapsed.has(t.id) ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  ) : <span className="w-3.5 shrink-0" />}
                  {atrasada && <AlertTriangle className="w-3 h-3 text-status-critical shrink-0" />}
                  {t.tipo === "Marco" && <Diamond className="w-3 h-3 text-ocre shrink-0" />}
                  <span className={`text-xs truncate ${t.tipo === "Resumo" ? "font-bold" : ""} ${isCritical ? "text-status-critical" : "text-foreground"}`}>
                    {t.codigo_wbs && <span className="text-muted-foreground mr-1">{t.codigo_wbs}</span>}
                    {t.nome}
                  </span>
                </div>
                <div className="w-24 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{t.data_inicio_planejada ? new Date(t.data_inicio_planejada + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}</span>
                </div>
                <div className="w-24 flex items-center justify-center border-l border-border">
                  <span className="text-xs text-muted-foreground">{t.data_fim_planejada ? new Date(t.data_fim_planejada + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}</span>
                </div>
                <div className="w-14 flex items-center justify-center border-l border-border">
                  <span className={`text-xs font-medium ${(t.avanco_realizado || 0) >= 100 ? "text-status-positive" : "text-foreground"}`}>{t.avanco_realizado ?? 0}%</span>
                </div>
                <div className="w-10 flex items-center justify-center border-l border-border">
                  <button onClick={() => onEdit(t)} className="p-0.5 hover:bg-muted rounded"><Eye className="w-3 h-3 text-muted-foreground" /></button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gantt */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ width: Math.max(ganttWidth, 400) }}>
            {/* Header */}
            <div className="flex border-b border-border bg-muted" style={{ height: 40 }}>
              {headers.map((h, i) => (
                <div key={i} className="border-r border-border flex items-center justify-center text-xs text-muted-foreground" style={{ width: CELL_W, minWidth: CELL_W }}>
                  {h.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {visibleTarefas.map(t => {
              const bar = getBar(t);
              const baseBar = showBaseline ? getBaselineBar(t) : null;
              const isCritical = showCritical && t.caminho_critico;

              return (
                <div key={t.id} className={`border-b border-border relative ${isCritical ? "bg-status-critical/5" : ""}`} style={{ height: 36 }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {headers.map((_, i) => <div key={i} className="border-r border-border" style={{ width: CELL_W, minWidth: CELL_W }} />)}
                  </div>

                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 opacity-70" style={{ left: todayLeft }} />

                  {/* Baseline bar */}
                  {baseBar && (
                    <div className="absolute rounded" style={{ left: baseBar.left, width: baseBar.width, height: 6, top: 22, backgroundColor: "#94a3b8", opacity: 0.5 }} />
                  )}

                  {/* Main bar */}
                  {bar && t.tipo !== "Marco" && (
                    <div className="absolute rounded" style={{ left: bar.left, width: bar.width, height: 16, top: 10, backgroundColor: isCritical ? "#ef444440" : TIPO_COLORS[t.tipo] + "30", border: `1.5px solid ${isCritical ? "#ef4444" : TIPO_COLORS[t.tipo]}` }}>
                      <div className="h-full rounded" style={{ width: `${Math.min(t.avanco_realizado || 0, 100)}%`, backgroundColor: isCritical ? "#ef4444" : TIPO_COLORS[t.tipo], opacity: 0.7 }} />
                    </div>
                  )}

                  {/* Marco diamond */}
                  {bar && t.tipo === "Marco" && (
                    <div className="absolute" style={{ left: bar.left - 7, top: 10, width: 14, height: 14, backgroundColor: "#c35e1e", transform: "rotate(45deg)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-border px-4 py-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: "#26405d" }} /> Resumo</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }} /> Atividade</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rotate-45" style={{ backgroundColor: "#c35e1e" }} /> Marco</div>
        <div className="flex items-center gap-1.5"><div className="w-0.5 h-3 bg-red-400" /> Hoje</div>
        {showBaseline && <div className="flex items-center gap-1.5"><div className="w-4 h-1.5 rounded" style={{ backgroundColor: "#94a3b8" }} /> Baseline</div>}
        {showCritical && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} /> Caminho Crítico</div>}
      </div>
    </Card>
  );
}