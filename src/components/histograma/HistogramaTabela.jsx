import { useState, useMemo } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eachMonthOfInterval, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";
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
import { Skeleton } from "@/components/ui/skeleton";

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

// ── CelulaEditavel — defined OUTSIDE main component to prevent remount ────────
function CelulaEditavel({ registro, campo, onSave }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const cancelRef = React.useRef(false);

  if (!registro) {
    return (
      <td className="px-2 py-1 text-center text-muted-foreground text-xs w-12">—</td>
    );
  }

  const disabled =
    campo === "quantidade_realizada_mensal" &&
    isFutureMonth(registro.mes_referencia);

  if (disabled)
    return (
      <td
        className="px-2 py-1 text-center bg-muted text-muted-foreground text-xs w-12 cursor-not-allowed"
        title="Mês futuro — edição de Real bloqueada"
      >
        —
      </td>
    );

  const valor = registro[campo] ?? 0;

  const handleBlur = () => {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    onSave(registro, campo, Number(inputVal));
    setEditing(false);
  };

  return (
    <td
      className="px-2 py-1 text-center cursor-pointer hover:bg-accent w-12"
      onClick={() => {
        if (!editing) {
          setInputVal(String(valor));
          setEditing(true);
        }
      }}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          step="1"
          min="0"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              cancelRef.current = false;
              e.target.blur(); // triggers onBlur naturally, which calls handleBlur once
            }
            if (e.key === "Escape") {
              cancelRef.current = true;
              setEditing(false);
            }
          }}
          className="w-10 text-center border rounded text-xs p-0"
        />
      ) : (
        <span className="text-xs">{valor}</span>
      )}
    </td>
  );
}

// ── HistogramaTabela ──────────────────────────────────────────────────────────

export default function HistogramaTabela({ tipo }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) =>
    toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  // Column visibility state
  const [showPrev, setShowPrev] = useState(true);
  const [showReal, setShowReal] = useState(true);
  const [showProj, setShowProj] = useState(true);
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [viewRecurso, setViewRecurso] = useState(null);

  // Data queries
  const { data: histogramas = [], isPending, isError } = useQuery({
    queryKey: ["histogramas", selectedProjectId, tipo],
    queryFn: () => entities.Histograma.filter({ projeto_id: selectedProjectId, tipo }),
    enabled: !!selectedProjectId,
  });

  const { data: projetoArr = [] } = useQuery({
    queryKey: ["projetos", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const projeto = projetoArr[0] ?? null;

  const projectMonths = useMemo(
    () => getProjectMonths(projeto?.data_inicio, projeto?.data_prevista_termino),
    [projeto]
  );

  // Mutations
  const updateMut = useMutation({
    mutationFn: ({ id, updates }) => entities.Histograma.update(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["histogramas", selectedProjectId, tipo] }),
    onError: onErr,
  });

  const updateCelula = (registro, campo, valor) => {
    const updates = { [campo]: valor };
    if (campo === "quantidade_realizada_mensal") updates.qtd_projetado = 0;
    updateMut.mutate({ id: registro.id, updates });
  };

  const deleteRecurso = (nome_recurso) => {
    const toDelete = histogramas.filter((r) => r.nome_recurso === nome_recurso);
    Promise.all(toDelete.map((r) => entities.Histograma.delete(r.id)))
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["histogramas", selectedProjectId, tipo] })
      )
      .catch(onErr);
  };

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
      queryClient.invalidateQueries({ queryKey: ["histogramas", selectedProjectId, tipo] });
      setShowNovoDialog(false);
      setNovoNome("");
    },
    onError: onErr,
  });

  // Derived data: resources grouped by name with totals and running sums
  const recursos = useMemo(() => {
    const nomes = [...new Set(histogramas.map((h) => h.nome_recurso))].filter(Boolean).sort();
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

  // Chart data: monthly totals + running accumulation
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

  if (!selectedProjectId) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Selecione um projeto para ver o histograma.
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-4 w-32" />
              {[...Array(6)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-10" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-20 text-center text-red-500 text-sm">
        Erro ao carregar dados do histograma.
      </div>
    );
  }
  if (!projeto?.data_inicio || !projeto?.data_prevista_termino) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Configure as datas de início e fim do projeto em Configurações → Gerenciar Projeto.
      </div>
    );
  }

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
              {/* Linha 1: recurso + meses agrupados + totais (rowSpan=2) */}
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
              {/* Linha 2: sub-colunas Prev/Real/Proj */}
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
                  </td>
                </tr>
              )}
              {recursos.map((recurso, idx) => (
                <tr key={recurso.nome}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                  <td className="sticky left-0 z-10 bg-card px-4 py-2 font-medium text-foreground whitespace-nowrap min-w-[140px]">
                    {recurso.nome}
                  </td>
                  {projectMonths.flatMap((m) => {
                    const mk = mesKey(m);
                    const reg = recurso.byMes[mk];
                    const cells = [];
                    // NOTE: CelulaEditavel returns <td> directly — no wrapper needed
                    if (showPrev) cells.push(
                      <CelulaEditavel
                        key={`${mk}-prev`}
                        registro={reg}
                        campo="quantidade_prevista_mensal"
                        onSave={updateCelula}
                      />
                    );
                    if (showReal) cells.push(
                      <CelulaEditavel
                        key={`${mk}-real`}
                        registro={reg}
                        campo="quantidade_realizada_mensal"
                        onSave={updateCelula}
                      />
                    );
                    if (showProj) cells.push(
                      <CelulaEditavel
                        key={`${mk}-proj`}
                        registro={reg}
                        campo="qtd_projetado"
                        onSave={updateCelula}
                      />
                    );
                    if (cells.length === 0) {
                      cells.push(
                        <td key={`${mk}-empty`} className="px-2 py-2 border-l border-border w-12" />
                      );
                    }
                    return cells;
                  })}
                  <td className="px-3 py-2 text-center font-semibold text-blue-700 dark:text-blue-300 border-l-2 border-border">{recurso.totalPrev}</td>
                  <td className="px-3 py-2 text-center font-semibold text-green-700 dark:text-green-300">{recurso.totalReal}</td>
                  <td className="px-3 py-2 text-center font-semibold text-yellow-700 dark:text-yellow-300">{recurso.totalProj}</td>
                  <td className="px-3 py-2 text-center font-semibold" style={{ color: recurso.pctReal >= 100 ? "#16a34a" : recurso.pctReal >= 80 ? "#d97706" : "#dc2626" }}>
                    {recurso.pctReal}%
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-muted-foreground">{recurso.pctProj}%</td>
                  <td className="px-2 py-2">
                    <RowActions
                      onView={() => setViewRecurso(recurso)}
                      onDelete={() => deleteRecurso(recurso.nome)}
                      deleteTitle={`Excluir "${recurso.nome}"?`}
                      deleteDescription="Esta ação removerá todos os registros mensais e não pode ser desfeita."
                    />
                  </td>
                </tr>
              ))}
            </tbody>

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
                    if (cells.length === 0) {
                      cells.push(
                        <td key={`${mk}-empty`} className="px-2 py-2 border-l border-border w-12" />
                      );
                    }
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
              {showPrev && (
                <Line yAxisId="right" type="monotone" dataKey="prevAcum" name="Acum. Prev"
                  stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              )}
              {showReal && (
                <Line yAxisId="right" type="monotone" dataKey="realAcum" name="Acum. Real"
                  stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dialog novo recurso */}
      <Dialog open={showNovoDialog} onOpenChange={(open) => { setShowNovoDialog(open); if (!open) setNovoNome(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo {tipo === "MO" ? "Função (MO)" : "Equipamento"}</DialogTitle>
          </DialogHeader>
          {(() => {
            const isDuplicate = recursos.some(
              (r) => r.nome.toLowerCase() === novoNome.trim().toLowerCase()
            );
            return (
              <>
                <div className="py-2 space-y-3">
                  <div className="space-y-1">
                    <Label>{tipo === "MO" ? "Nome da função" : "Tipo de equipamento"} *</Label>
                    <Input
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder={tipo === "MO" ? "Ex: Soldador, Montador" : "Ex: Guindaste, Munck"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && novoNome.trim() && !isDuplicate) {
                          createRecurso.mutate(novoNome.trim());
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Serão criados {projectMonths.length} registros mensais com valores zerados.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowNovoDialog(false); setNovoNome(""); }}>Cancelar</Button>
                  <Button
                    variant="save"
                    disabled={!novoNome.trim() || createRecurso.isPending || isDuplicate}
                    onClick={() => {
                      if (!isDuplicate) createRecurso.mutate(novoNome.trim());
                    }}
                  >
                    {createRecurso.isPending ? "Criando..." : isDuplicate ? "Já existe" : "Criar"}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {viewRecurso && (
        <DetailDialog
          open={!!viewRecurso}
          onOpenChange={(o) => !o && setViewRecurso(null)}
          title={viewRecurso.nome}
          sections={[
            { label: "Nome", value: viewRecurso.nome },
            { label: "Total Previsto", value: viewRecurso.totalPrev },
            { label: "Total Real", value: viewRecurso.totalReal },
            { label: "Total Projetado", value: viewRecurso.totalProj },
            { label: "% Realizado", value: `${viewRecurso.pctReal}%` },
            { label: "% Projetado", value: `${viewRecurso.pctProj}%` },
          ]}
        />
      )}
    </div>
  );
}
