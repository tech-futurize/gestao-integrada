import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import DashboardExecutivo from "@/components/mudancas/DashboardExecutivo";
import MudancaForm from "@/components/mudancas/MudancaForm";
import { Button } from "@/components/ui/button";
import FilterBar from "@/components/ui/FilterBar";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  "Identificada": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "Em Análise": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Em Negociação": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Aprovada": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Rejeitada": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ORIGEM_COLORS = {
  "Contratada": "bg-blue-50 text-blue-700 border border-blue-200",
  "Contratante": "bg-amber-50 text-amber-700 border border-amber-200",
};

const STATUS_OPTIONS = ["Identificada", "Em Análise", "Em Negociação", "Aprovada", "Rejeitada"];

const MUDANCA_COLUMNS = [
  { key: "titulo",             label: "Título",              type: "string", required: true },
  { key: "descricao",          label: "Descrição",           type: "string" },
  { key: "origem",             label: "Origem",              type: "string" },
  { key: "status",             label: "Status",              type: "string" },
  { key: "data_ocorrencia",    label: "Data Ocorrência",     type: "date" },
  { key: "impacto_custo",      label: "Impacto Custo (R$)",  type: "number" },
  { key: "impacto_prazo_dias", label: "Impacto Prazo (dias)", type: "number" },
  { key: "impacto_escopo",     label: "Impacto Escopo",      type: "string" },
  { key: "responsavel",        label: "Responsável",         type: "string" },
  { key: "observacoes",        label: "Observações",         type: "string" },
];

function fmtCurrency(val) {
  if (val === null || val === undefined || val === "") return "—";
  const abs = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return val >= 0 ? `+${abs}` : `-${abs.replace("-", "")}`;
}

export default function GestaoMudancas() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtros, setFiltros] = useState({});

  const { data: mudancas = [], isLoading } = useQuery({
    queryKey: ["mudancas_contratuais", selectedProjectId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.MudancaContratual.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mudancas_contratuais"] });
      setShowForm(false); setEditing(null);
      toast({ variant: "success", description: "Mudança registrada." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.MudancaContratual.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mudancas_contratuais"] });
      setShowForm(false); setEditing(null);
      toast({ variant: "success", description: "Mudança atualizada." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.MudancaContratual.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mudancas_contratuais"] }),
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const st = filtros.status || [];
    const or = filtros.origem || [];
    let r = mudancas;
    if (st.length > 0) r = r.filter(m => st.includes(m.status));
    if (or.length > 0) r = r.filter(m => or.includes(m.origem));
    return r;
  }, [mudancas, filtros]);

  const handleSubmit = (data) => {
    const payload = { ...data, projeto_id: selectedProjectId };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const handleEdit = (mudanca) => {
    setEditing(mudanca);
    setShowForm(true);
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1"><PageEmptyState icon={ArrowRightLeft} description="Selecione um projeto para ver as mudanças contratuais." /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Importar / Exportar
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Mudança
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Dashboard Executivo (KPIs) */}
      {mudancas.length > 0 && <DashboardExecutivo mudancas={mudancas} />}

      {/* Filtros */}
      <FilterBar
        storageKey="mudancas-filtros"
        filters={[
          { key: "status", label: "Status", options: STATUS_OPTIONS },
          { key: "origem", label: "Origem", options: ["Contratada", "Contratante"] },
        ]}
        onChange={setFiltros}
      />

      {/* Formulário */}
      {showForm && (
        <MudancaForm
          mudanca={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          isSubmitting={createMut.isPending || updateMut.isPending}
        />
      )}

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Origem</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Categorias</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Impacto Custo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Impacto Prazo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Responsável</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Carregando...</td></tr>}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Nenhuma mudança encontrada</td></tr>
              )}
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-border hover:bg-muted/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-foreground line-clamp-1">{m.titulo}</div>
                    {m.data_ocorrencia && <div className="text-xs text-muted-foreground">{m.data_ocorrencia}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {m.origem && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ORIGEM_COLORS[m.origem] || "bg-muted text-muted-foreground"}`}>
                        {m.origem}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(m.categorias || []).map(cat => (
                        <span key={cat} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{cat}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: m.impacto_custo > 0 ? "#ef4444" : m.impacto_custo < 0 ? "#16a34a" : undefined }}>
                    {fmtCurrency(m.impacto_custo)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {m.impacto_prazo_dias != null && m.impacto_prazo_dias !== "" ? `${m.impacto_prazo_dias > 0 ? "+" : ""}${m.impacto_prazo_dias}d` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.responsavel || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(m)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMut.mutate(m.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        columns={MUDANCA_COLUMNS}
        exportFileName="mudancas-contratuais"
        title="Mudanças — Importar / Exportar"
        onExport={() => filtered}
        onImport={(row) => createMut.mutateAsync({ ...row, projeto_id: selectedProjectId })}
      />
    </div>
  );
}
