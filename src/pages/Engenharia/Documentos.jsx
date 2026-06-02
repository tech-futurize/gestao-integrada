import { useState, useMemo } from "react";
import { useSortTable } from "@/hooks/useSortTable";
import { usePermissions } from "@/hooks/usePermissions";
import PageHeader from "@/components/ui/PageHeader";
import FilterBar from "@/components/ui/FilterBar";
import FilterToolbar from "@/components/ui/FilterToolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageEmptyState from "@/components/ui/PageEmptyState";
import DocDetalhe from "@/components/engenharia/DocDetalhe";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText, Plus, Upload, TrendingUp, AlertTriangle, AlertCircle,
  History, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";

import { ETAPAS, DISCIPLINAS, DISC_COLORS, ETAPA_COLORS } from "@/lib/engenharia-constants";

const EXPORT_COLUMNS = [
  { key: "tag_id",          label: "TAG/ID",            type: "string",  required: true },
  { key: "titulo",          label: "Título",             type: "string",  required: true },
  { key: "disciplina",      label: "Disciplina",         type: "string" },
  { key: "fornecedor",      label: "Fornecedor",         type: "string" },
  { key: "num_folhas",      label: "Nº Folhas",          type: "number" },
  { key: "progresso",       label: "Progresso (%)",      type: "number" },
  { key: "etapa",           label: "Etapa",              type: "string" },
  { key: "revisao_atual",   label: "Revisão Atual",      type: "string" },
  { key: "id_cronograma",   label: "ID Cronograma",      type: "string" },
  { key: "data_cronograma", label: "Data Cronograma",    type: "date" },
  { key: "data_projetada",  label: "Data Projetada",     type: "date" },
  { key: "data_real",       label: "Data Real",          type: "date" },
];

const EMPTY_FORM = {
  tag_id: "",
  titulo: "",
  disciplina: "",
  fornecedor: "",
  num_folhas: "",
  progresso: 0,
  etapa: "A Emitir",
  revisao_atual: "",
  id_cronograma: "",
  data_cronograma: "",
  data_projetada: "",
  data_real: "",
};

const PER_PAGE = 10;

function ProgressBar({ pct }) {
  return (
    <div className="flex items-center gap-2 min-w-24">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: "#16a34a" }} />
      </div>
      <span className="text-xs font-bold w-9 text-right text-emerald-500">{pct}%</span>
    </div>
  );
}

export default function Documentos() {
  const { selectedProjectId } = useProject();
  const { create: canCreate, edit: canEdit, delete: canDelete } = usePermissions('Engenharia');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // Filtros e ordenação
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({});
  const [filterKey, setFilterKey] = useState(0);
  const FILTROS_KEY = "documentos-filtros";
  const [page, setPage] = useState(1);

  const { data: docs = [], isLoading, isError } = useQuery({
    queryKey: ["documentos_engenharia", selectedProjectId],
    queryFn: () => entities.DocumentoEngenharia.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMut = useMutation({
    mutationFn: (data) => entities.DocumentoEngenharia.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos_engenharia"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Documento criado com sucesso." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => entities.DocumentoEngenharia.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos_engenharia"] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ variant: "success", description: "Documento atualizado." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.DocumentoEngenharia.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos_engenharia"] });
      toast({ variant: "success", description: "Documento excluído." });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleOpenEdit = (doc) => {
    setEditing(doc);
    setForm({
      tag_id: doc.tag_id || "",
      titulo: doc.titulo || "",
      disciplina: doc.disciplina || "",
      fornecedor: doc.fornecedor || "",
      num_folhas: doc.num_folhas ?? "",
      progresso: doc.progresso ?? 0,
      etapa: doc.etapa || "A Emitir",
      revisao_atual: doc.revisao_atual || "",
      id_cronograma: doc.id_cronograma || "",
      data_cronograma: doc.data_cronograma || "",
      data_projetada: doc.data_projetada || "",
      data_real: doc.data_real || "",
    });
    setShowForm(true);
  };

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleSelectCronograma = (tarefaId) => {
    if (tarefaId === "__none__") {
      setForm(f => ({ ...f, id_cronograma: "", data_cronograma: "" }));
      return;
    }
    const tarefa = tarefas.find(t => t.id === tarefaId);
    setForm(f => ({
      ...f,
      id_cronograma: tarefaId,
      data_cronograma: tarefa?.data_inicio_planejada || tarefa?.data_inicio_baseline || "",
    }));
  };

  const tarefaLabel = (id) => {
    if (!id) return "—";
    const t = tarefas.find(t => t.id === id);
    if (!t) return "—";
    return t.codigo_wbs ? `${t.codigo_wbs} — ${t.nome}` : t.nome;
  };

  const handleSubmit = () => {
    const hoje = new Date().toISOString().split("T")[0];
    const revisaoMudou = editing && form.revisao_atual && form.revisao_atual !== (editing.revisao_atual || "");
    const historicoRevisoes = revisaoMudou
      ? [...(editing.historico_revisoes || []), { revisao: form.revisao_atual, data: hoje, etapa: form.etapa, observacao: "" }]
      : editing?.historico_revisoes ?? [];

    const payload = {
      projeto_id: selectedProjectId,
      tag_id: form.tag_id,
      titulo: form.titulo,
      disciplina: form.disciplina,
      fornecedor: form.fornecedor || null,
      num_folhas: Number(form.num_folhas) || 0,
      progresso: Number(form.progresso) || 0,
      etapa: form.etapa,
      revisao_atual: form.revisao_atual || null,
      data_projetada: form.data_projetada || null,
      data_real: form.data_real || null,
      historico_revisoes: editing ? historicoRevisoes : [],
    };
    if (form.id_cronograma) {
      payload.id_cronograma = form.id_cronograma;
      payload.data_cronograma = form.data_cronograma || null;
    }
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const handleImport = async (row) => {
    setImporting(true);
    try {
      const payload = {
        projeto_id:      selectedProjectId,
        tag_id:          row.tag_id          || "",
        titulo:          row.titulo          || "",
        disciplina:      row.disciplina      || "",
        fornecedor:      row.fornecedor      || "",
        num_folhas:      row.num_folhas      ?? 0,
        progresso:       row.progresso       ?? 0,
        etapa:           row.etapa           || "A Emitir",
        revisao_atual:   row.revisao_atual   || "",
        id_cronograma:   row.id_cronograma   || null,
        data_cronograma: row.data_cronograma || null,
        data_projetada:  row.data_projetada  || null,
        data_real:       row.data_real       || null,
      };
      const existing = await entities.DocumentoEngenharia.filter({ projeto_id: selectedProjectId, tag_id: payload.tag_id });
      if (existing.length > 0) {
        await entities.DocumentoEngenharia.update(existing[0].id, payload);
      } else {
        await entities.DocumentoEngenharia.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["documentos_engenharia"] });
    } catch (e) {
      toast({ title: "Erro ao importar documento", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMut.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const fornecedorOptions = useMemo(
    () => [...new Set((docs || []).map(d => d.fornecedor).filter(Boolean))].sort(),
    [docs]
  );

  const filtered = useMemo(() => {
    const disc = filtros.disciplina || [];
    const forn = filtros.fornecedor || [];
    let r = docs;
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(d => d.tag_id?.toLowerCase().includes(b) || d.titulo?.toLowerCase().includes(b));
    }
    if (disc.length > 0) r = r.filter(d => disc.includes(d.disciplina));
    if (forn.length > 0) r = r.filter(d => forn.includes(d.fornecedor));
    return r;
  }, [docs, busca, filtros]);

  const { sortedData: docsSorted, sortKey: sortCol, sortDir, handleSort } = useSortTable(
    filtered,
    { defaultKey: "tag_id" }
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = docsSorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // KPIs
  const progGeral = docs.length ? Math.round(docs.reduce((s, d) => s + (d.progresso || 0), 0) / docs.length) : 0;
  const totalSheets = docs.reduce((s, d) => s + (d.num_folhas || 0), 0);
  const overdue = docs.filter(d => d.data_projetada && d.data_projetada < new Date().toISOString().split("T")[0] && d.etapa !== "Aprovado");

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={FileText} description="Selecione um projeto na barra lateral para ver os documentos de engenharia." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button size="sm" variant="outline" onClick={() => setShowImportExport(true)} disabled={importing}>
                <Upload className="w-4 h-4 mr-2" />{importing ? "Importando..." : "Importar / Exportar"}
              </Button>
            )}
            {canCreate && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleOpenNew}>
                <Plus className="w-4 h-4 mr-2" />Novo Documento
              </Button>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <FilterToolbar
          active={!!busca || Object.values(filtros).some(a => a?.length > 0)}
          onClearAll={() => { setBusca(""); setFiltros({}); setPage(1); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
        >
          <div className="relative">
            <input
              className="h-8 border border-border rounded-md px-3 text-sm w-56 bg-background text-foreground"
              placeholder="Buscar TAG/ID ou título..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setPage(1); }}
            />
          </div>
          <FilterBar
            key={filterKey}
            storageKey={FILTROS_KEY}
            filters={[
              { key: "disciplina", label: "Disciplina", options: ["MEC", "CIV", "ELE", "TUB", "INS", "AUT", "EST", "PRC", "HSE"] },
              { key: "fornecedor", label: "Fornecedor", options: fornecedorOptions },
            ]}
            onChange={setFiltros}
          />
        </FilterToolbar>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Docs", value: docs.length, sub: `${docs.filter(d => d.etapa === "Aprovado").length} aprovados`, color: "#26405d", icon: FileText },
          { label: "Total de Folhas", value: totalSheets >= 1000 ? `${(totalSheets / 1000).toFixed(1)}k A4` : `${totalSheets} A4`, sub: "folhas equivalentes", color: "#2563eb", icon: FileText },
          { label: "Progresso Geral", value: `${progGeral}%`, sub: <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width: `${progGeral}%` }} /></div>, color: "#16a34a", icon: TrendingUp },
          { label: "Vencidos", value: overdue.length, sub: overdue.length > 0 ? "⚠ documentos vencidos" : "Nenhum vencido", color: overdue.length > 0 ? "#dc2626" : "#16a34a", icon: AlertTriangle },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <Card key={label} className="bg-card shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "18" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-64 text-destructive">Erro ao carregar documentos.</div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {[
                    { key: "tag_id", label: "TAG / ID" },
                    { key: "titulo", label: "Título" },
                    { key: "disciplina", label: "Disc." },
                    { key: "revisao_atual", label: "Revisão" },
                    { key: "id_cronograma", label: "ID Cron." },
                    { key: "data_cronograma", label: "Dt. Cron." },
                    { key: "data_projetada", label: "Dt. Prev." },
                    { key: "data_real", label: "Dt. Real" },
                    { key: "progresso", label: "Progresso" },
                    { key: "etapa", label: "Etapa" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none group hover:text-foreground"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortCol !== key
                          ? <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                          : sortDir === "asc"
                            ? <ArrowUp className="w-3 h-3 text-primary" />
                            : <ArrowDown className="w-3 h-3 text-primary" />
                        }
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap w-28"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Nenhum documento encontrado</td></tr>
                )}
                {paginated.map((doc, i) => {
                  const stEtapa = ETAPA_COLORS[doc.etapa] || {};
                  const today = new Date().toISOString().split("T")[0];
                  const aprovado = doc.etapa === "Aprovado";
                  const vencido = !aprovado && doc.data_projetada && doc.data_projetada < today;
                  const atrasadoCron = !aprovado && !vencido && doc.data_projetada && doc.data_cronograma && doc.data_projetada > doc.data_cronograma;
                  const fmtDate = (d) => d ? d.split("-").reverse().join("/").slice(0, 10) : "—";
                  return (
                    <tr key={doc.id} className={`border-b border-border transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/20"}`}>
                      <td className="px-3 py-2.5 font-bold text-xs whitespace-nowrap text-foreground">{doc.tag_id}</td>
                      <td className="px-3 py-2.5 font-medium text-foreground max-w-xs">
                        <span className="line-clamp-1">{doc.titulo}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-bold rounded px-1.5 py-0.5 text-white" style={{ backgroundColor: DISC_COLORS[doc.disciplina] || "#374151" }}>{doc.disciplina}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{doc.revisao_atual || "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{tarefaLabel(doc.id_cronograma)}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(doc.data_cronograma)}</td>
                      <td className={`px-3 py-2.5 text-xs whitespace-nowrap font-medium ${vencido ? "text-red-600 font-bold" : atrasadoCron ? "text-yellow-600 font-bold" : "text-muted-foreground"}`}>
                        {vencido && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {atrasadoCron && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {fmtDate(doc.data_projetada)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(doc.data_real)}</td>
                      <td className="px-3 py-2.5"><ProgressBar pct={doc.progresso || 0} /></td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: stEtapa.bg, color: stEtapa.text }}>{doc.etapa}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <RowActions
                          onView={() => setViewItem(doc)}
                          onEdit={canEdit ? () => handleOpenEdit(doc) : undefined}
                          onDelete={canDelete ? () => deleteMut.mutate(doc.id) : undefined}
                          deleteDescription={`${doc.tag_id} — ${doc.titulo} será excluído permanentemente.`}
                          extra={
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setHistoryDoc(doc); }}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Histórico"
                              aria-label="Histórico"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Paginação */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted text-xs text-muted-foreground">
            <span>
              Mostrando {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} itens
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-card">‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded border ${p === page ? "bg-foreground text-background border-foreground" : "border-border hover:bg-card"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-card">›</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criação/Edição */}
      <FormDialog
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); } }}
        icon={FileText}
        title={editing ? "Editar Documento" : "Novo Documento"}
        subtitle={editing ? `${editing.tag_id} — ${editing.titulo}` : "Engenharia de Documentos"}
        maxWidth="max-w-3xl"
        badge={editing && form.etapa && ETAPA_COLORS[form.etapa] ? (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: ETAPA_COLORS[form.etapa].bg, color: ETAPA_COLORS[form.etapa].text }}
          >
            {form.etapa}
          </span>
        ) : undefined}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSave={handleSubmit}
        saving={createMut.isPending || updateMut.isPending}
        saveLabel={editing ? "Salvar alterações" : "Criar documento"}
      >
          {/* Seções */}

            {/* Identificação */}
            <div>
              <SectionDivider label="Identificação" className="mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">TAG / ID <span className="text-red-500">*</span></Label>
                  <Input value={form.tag_id} onChange={e => setForm(f => ({ ...f, tag_id: e.target.value }))} placeholder="Ex: MEC-001" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Título <span className="text-red-500">*</span></Label>
                  <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título do documento" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Disciplina</Label>
                  <Select value={form.disciplina} onValueChange={v => setForm(f => ({ ...f, disciplina: v }))}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {form.disciplina && DISC_COLORS[form.disciplina] && (
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DISC_COLORS[form.disciplina] }} />
                        )}
                        <SelectValue placeholder="Selecione" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>{DISCIPLINAS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fornecedor / Responsável</Label>
                  <Input value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} placeholder="Nome do fornecedor" />
                </div>
              </div>
            </div>

            {/* Detalhes Técnicos */}
            <div>
              <SectionDivider label="Detalhes Técnicos" className="mb-3" />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Etapa</Label>
                  <Select value={form.etapa} onValueChange={v => setForm(f => ({ ...f, etapa: v }))}>
                    <SelectTrigger style={form.etapa && ETAPA_COLORS[form.etapa] ? { backgroundColor: ETAPA_COLORS[form.etapa].bg, color: ETAPA_COLORS[form.etapa].text, borderColor: "transparent" } : {}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>{ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Revisão Atual</Label>
                  <Input value={form.revisao_atual} onChange={e => setForm(f => ({ ...f, revisao_atual: e.target.value }))} placeholder="Ex: Rev.0, Rev.A" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nº Folhas A4</Label>
                  <Input type="number" min={0} value={form.num_folhas} onChange={e => setForm(f => ({ ...f, num_folhas: e.target.value }))} />
                </div>
                <div className="space-y-1 col-span-3">
                  <Label className="text-xs">Progresso (%)</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, Number(form.progresso) || 0))}%` }}
                        />
                      </div>
                    </div>
                    <Input
                      type="number" min={0} max={100}
                      value={form.progresso}
                      onChange={e => setForm(f => ({ ...f, progresso: e.target.value }))}
                      className="w-20 text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div>
              <SectionDivider label="Datas" className="mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data Projetada</Label>
                  <Input type="date" value={form.data_projetada} onChange={e => setForm(f => ({ ...f, data_projetada: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data Real</Label>
                  <Input type="date" value={form.data_real} onChange={e => setForm(f => ({ ...f, data_real: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Vínculo ao Cronograma */}
            <div>
              <SectionDivider label="Vínculo ao Cronograma" className="mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tarefa do Cronograma</Label>
                  <Select value={form.id_cronograma || "__none__"} onValueChange={handleSelectCronograma}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular tarefa..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Sem vínculo —</SelectItem>
                      {tarefas.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.codigo_wbs ? `${t.codigo_wbs} — ` : ""}{t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data Cronograma <span className="text-xs text-muted-foreground">(automática)</span></Label>
                  <Input type="date" value={form.data_cronograma} readOnly className="bg-muted cursor-not-allowed" />
                </div>
              </div>
            </div>

      </FormDialog>

      {/* Dialog Histórico (DocDetalhe) */}
      <Dialog open={!!historyDoc} onOpenChange={(open) => { if (!open) setHistoryDoc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {historyDoc && (
            <DocDetalhe
              doc={historyDoc}
              tarefas={tarefas}
              open={!!historyDoc}
              onClose={() => setHistoryDoc(null)}
              onUpdate={(id, data) => updateMut.mutate({ id, data })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog Excluir */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.tag_id} — {deleteTarget?.titulo}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import/Export */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Documentos de Engenharia"
        exportFileName="documentos_engenharia"
        columns={EXPORT_COLUMNS}
        onExport={() => docs}
        onImport={handleImport}
      />
      </div>
    </div>
  );
}
