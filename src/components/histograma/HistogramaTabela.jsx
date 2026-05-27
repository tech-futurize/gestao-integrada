import { useState, useMemo } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eachMonthOfInterval, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
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

// ── CelulaEditavel — defined OUTSIDE main component to prevent remount ────────
function CelulaEditavel({ registro, campo, onSave }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const cancelRef = React.useRef(false);

  const disabled =
    campo === "quantidade_realizada_mensal" &&
    isFutureMonth(registro.mes_referencia);

  if (disabled)
    return (
      <td className="px-2 py-1 text-center bg-muted text-muted-foreground text-xs w-12">
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
              handleBlur();
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
    () => getProjectMonths(projeto?.data_inicio, projeto?.data_fim_prevista),
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

  // ... (rendering will be added in Task 4)
  return null;
}
