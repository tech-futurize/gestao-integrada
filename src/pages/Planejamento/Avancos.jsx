import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Plus, Upload, Pencil, Trash2 } from "lucide-react";

const EXPORT_COLUMNS = [
  { key: "mes_referencia",             label: "Mês Referência",                type: "string",  required: true },
  { key: "avanco_previsto_mensal",     label: "Avanço Previsto Mensal (%)",    type: "number" },
  { key: "avanco_realizado_mensal",    label: "Avanço Realizado Mensal (%)",   type: "number" },
  { key: "avanco_previsto_acumulado",  label: "Avanço Previsto Acumulado (%)", type: "number" },
  { key: "avanco_realizado_acumulado", label: "Avanço Realizado Acumulado (%)",type: "number" },
];

const EMPTY_FORM = {
  mes_referencia: "",
  avanco_previsto_mensal: "",
  avanco_realizado_mensal: "",
  avanco_previsto_acumulado: "",
  avanco_realizado_acumulado: "",
};

function fmtMes(mesRef) {
  if (!mesRef) return "—";
  const [year, month] = mesRef.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[parseInt(month, 10) - 1]}/${year?.slice(2)}`;
}

export default function Avancos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showImportExport, setShowImportExport] = useState(false);

  const { data: avancos = [], isLoading } = useQuery({
    queryKey: ["avanco_fisico", selectedProjectId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const sorted = useMemo(
    () => [...avancos].sort((a, b) => (a.mes_referencia || "").localeCompare(b.mes_referencia || "")),
    [avancos]
  );

  const createMut = useMutation({
    mutationFn: (data) => entities.AvancoFisico.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avanco_fisico"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Registro criado com sucesso." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.AvancoFisico.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avanco_fisico"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Registro atualizado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.AvancoFisico.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avanco_fisico"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const ultimo = sorted[sorted.length - 1];
  const prevAcum = ultimo?.avanco_previsto_acumulado || 0;
  const realAcum = ultimo?.avanco_realizado_acumulado || 0;
  const desvio = realAcum - prevAcum;

  const chartData = sorted.map((a) => ({
    name: fmtMes(a.mes_referencia),
    "Prev. Acum.": a.avanco_previsto_acumulado || 0,
    "Real. Acum.": a.avanco_realizado_acumulado || 0,
    "Prev. Mensal": a.avanco_previsto_mensal || 0,
    "Real. Mensal": a.avanco_realizado_mensal || 0,
  }));

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      mes_referencia: item.mes_referencia || "",
      avanco_previsto_mensal: item.avanco_previsto_mensal ?? "",
      avanco_realizado_mensal: item.avanco_realizado_mensal ?? "",
      avanco_previsto_acumulado: item.avanco_previsto_acumulado ?? "",
      avanco_realizado_acumulado: item.avanco_realizado_acumulado ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      projeto_id: selectedProjectId,
      avanco_previsto_mensal: parseFloat(form.avanco_previsto_mensal) || 0,
      avanco_realizado_mensal: parseFloat(form.avanco_realizado_mensal) || 0,
      avanco_previsto_acumulado: parseFloat(form.avanco_previsto_acumulado) || 0,
      avanco_realizado_acumulado: parseFloat(form.avanco_realizado_acumulado) || 0,
    };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const handleImport = async (row) => {
    const payload = {
      projeto_id:                  selectedProjectId,
      mes_referencia:              row.mes_referencia              || "",
      avanco_previsto_mensal:      row.avanco_previsto_mensal      ?? 0,
      avanco_realizado_mensal:     row.avanco_realizado_mensal     ?? 0,
      avanco_previsto_acumulado:   row.avanco_previsto_acumulado   ?? 0,
      avanco_realizado_acumulado:  row.avanco_realizado_acumulado  ?? 0,
    };
    const existing = await entities.AvancoFisico.filter({ projeto_id: selectedProjectId, mes_referencia: payload.mes_referencia });
    if (existing.length > 0) {
      await entities.AvancoFisico.update(existing[0].id, payload);
    } else {
      await entities.AvancoFisico.create(payload);
    }
    queryClient.invalidateQueries({ queryKey: ["avanco_fisico"] });
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={TrendingUp} description="Selecione um projeto na barra lateral para ver o avanço físico." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avanço Físico</h1>
          <p className="text-sm text-muted-foreground">Curva S — previsto vs. realizado acumulado</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
          <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Registro
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Previsto Acumulado", value: `${prevAcum.toFixed(1)}%`, color: "#9ca3af" },
          { label: "Realizado Acumulado", value: `${realAcum.toFixed(1)}%`, color: "#3b82f6" },
          { label: "Desvio", value: `${desvio >= 0 ? "+" : ""}${desvio.toFixed(1)}%`, color: desvio >= 0 ? "#16a34a" : "#ef4444" },
          { label: "Meses Registrados", value: avancos.length, color: "#26405d" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Curva S — Acumulado</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Legend />
                <Area type="monotone" dataKey="Prev. Acum." stroke="#9ca3af" fill="url(#prevGrad)" strokeWidth={2} strokeDasharray="5 3" />
                <Area type="monotone" dataKey="Real. Acum." stroke="#3b82f6" fill="url(#realGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Avanço Mensal</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Legend />
                <Bar dataKey="Prev. Mensal" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Real. Mensal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Mês / Ano</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Prev. Mensal</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Real. Mensal</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Prev. Acum.</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Real. Acum.</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Desvio</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Carregando...</td></tr>}
            {!isLoading && sorted.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum registro cadastrado</td></tr>}
            {sorted.map((item, i) => {
              const dev = (item.avanco_realizado_acumulado || 0) - (item.avanco_previsto_acumulado || 0);
              return (
                <tr key={item.id} className={`border-b border-border hover:bg-muted/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{fmtMes(item.mes_referencia)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{(item.avanco_previsto_mensal || 0).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{(item.avanco_realizado_mensal || 0).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-medium text-muted-foreground">{(item.avanco_previsto_acumulado || 0).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">{(item.avanco_realizado_acumulado || 0).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: dev >= 0 ? "#16a34a" : "#ef4444" }}>
                    {dev >= 0 ? "+" : ""}{dev.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(item)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(item.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Registro" : "Novo Registro de Avanço"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1 col-span-2">
              <Label>Mês / Ano (YYYY-MM)</Label>
              <Input type="month" value={form.mes_referencia} onChange={e => setForm(f => ({ ...f, mes_referencia: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Avanço Previsto Mensal (%)</Label>
              <Input type="number" step="0.01" min={0} max={100} value={form.avanco_previsto_mensal} onChange={e => setForm(f => ({ ...f, avanco_previsto_mensal: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Avanço Realizado Mensal (%)</Label>
              <Input type="number" step="0.01" min={0} max={100} value={form.avanco_realizado_mensal} onChange={e => setForm(f => ({ ...f, avanco_realizado_mensal: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Avanço Previsto Acumulado (%)</Label>
              <Input type="number" step="0.01" min={0} max={100} value={form.avanco_previsto_acumulado} onChange={e => setForm(f => ({ ...f, avanco_previsto_acumulado: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Avanço Realizado Acumulado (%)</Label>
              <Input type="number" step="0.01" min={0} max={100} value={form.avanco_realizado_acumulado} onChange={e => setForm(f => ({ ...f, avanco_realizado_acumulado: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMut.mutate(editing.id); setShowForm(false); }}>Excluir</Button>}
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="save" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Avanço Físico"
        exportFileName="avanco_fisico"
        columns={EXPORT_COLUMNS}
        onExport={() => sorted}
        onImport={handleImport}
      />
    </div>
  );
}
