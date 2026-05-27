import { useState, useMemo } from "react";
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
  const [local, setLocal] = useState(registro?.[campo] ?? 0);
  const disabled = campo === "quantidade_realizada_mensal"
    && isFutureMonth(registro?.mes_referencia);
  const valor = registro?.[campo] ?? 0;

  if (!registro) return <span className="text-muted-foreground text-xs">—</span>;

  if (!editing || disabled) {
    return (
      <span
        onClick={() => !disabled && setEditing(true)}
        className={`block text-center min-w-[32px] rounded px-1 py-0.5 text-sm font-medium
          ${disabled ? "text-muted-foreground/40 cursor-not-allowed" : "cursor-pointer hover:bg-muted/60"}`}
      >
        {valor || "·"}
      </span>
    );
  }
  return (
    <input
      autoFocus
      type="number"
      step="1"
      min="0"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { onSave(Number(local)); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") { setLocal(valor); setEditing(false); }
      }}
      className="w-14 text-center text-sm border border-blue-400 rounded px-1 py-0 focus:outline-none bg-background"
    />
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
    queryKey: ["projeto-datas", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const projeto = projetoArr[0] ?? null;

  const projectMonths = useMemo(
    () => getProjectMonths(projeto?.data_inicio, projeto?.data_fim_prevista),
    [projeto]
  );

  // Mutations
  const updateCelula = useMutation({
    mutationFn: async ({ id, campo, valor, mesRef, nomeRecurso }) => {
      await entities.Histograma.update(id, { [campo]: valor });
      // When saving Real, clear Projetado for same month/resource
      if (campo === "quantidade_realizada_mensal") {
        const par = histogramas.find(
          (h) => h.nome_recurso === nomeRecurso && h.mes_referencia?.startsWith(mesRef)
        );
        if (par) {
          await entities.Histograma.update(par.id, { qtd_projetado: 0 });
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["histogramas"] }),
    onError: onErr,
  });

  const deleteRecurso = useMutation({
    mutationFn: async (nomeRecurso) => {
      const registros = histogramas.filter((h) => h.nome_recurso === nomeRecurso);
      for (const r of registros) {
        await entities.Histograma.delete(r.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["histogramas"] }),
    onError: onErr,
  });

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
      queryClient.invalidateQueries({ queryKey: ["histogramas"] });
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
