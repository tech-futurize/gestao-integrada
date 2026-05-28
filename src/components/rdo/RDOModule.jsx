import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, Eye, Trash2, Edit, Sun, CloudRain } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { RDOForm } from "./RDOForm";
import { RDODetail } from "./RDODetail";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const RDO_COLUMNS = [
  { key: "numero", label: "Nº RDO", type: "string", required: true },
  { key: "data",   label: "Data",    type: "date",   required: true },
  { key: "area",   label: "Área",    type: "string", required: false },
];

export default function RDOModule({
  selectedProjectId,
  showForm, setShowForm,
  editRDO, setEditRDO,
  showImport, setShowImport,
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewRDO, setViewRDO]       = useState(null);
  const [search, setSearch]         = useState("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  const { data: rdos = [], isLoading } = useQuery({
    queryKey: ["rdos", selectedProjectId],
    queryFn: () => entities.Rdo.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: casos = [] } = useQuery({
    queryKey: ["pleitos", selectedProjectId],
    queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const deleteMut = useMutation({
    mutationFn: id => entities.Rdo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rdos"] }),
    onError: e => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const handleImport = async row => {
    await entities.Rdo.create({ ...row, projeto_id: selectedProjectId });
    queryClient.invalidateQueries({ queryKey: ["rdos"] });
  };

  const onSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["rdos"] });
    setShowForm(false);
    setEditRDO(null);
  };

  const filtered = useMemo(() => {
    let result = rdos;
    if (search) result = result.filter(r =>
      (r.numero || r.area || "").toLowerCase().includes(search.toLowerCase())
    );
    if (dateFrom) result = result.filter(r => r.data && r.data >= dateFrom);
    if (dateTo)   result = result.filter(r => r.data && r.data <= dateTo);
    return result;
  }, [rdos, search, dateFrom, dateTo]);

  const climaCell = turno => {
    if (!turno?.ativo) return <span className="text-muted-foreground/40 text-xs">—</span>;
    const ok = turno.praticabilidade !== "Impraticável";
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${ok ? "text-status-positive" : "text-blue-700 dark:text-blue-400"}`}>
        {ok ? <Sun className="w-3 h-3" /> : <CloudRain className="w-3 h-3" />}
        {ok ? "Prat." : "Imprat."}
      </span>
    );
  };

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-muted-foreground mb-1 block">Busca</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  className="w-full border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm bg-background text-foreground"
                  placeholder="Nº RDO, área..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">De</label>
              <input type="date" className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
                value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Até</label>
              <input type="date" className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
                value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["Data", "Nº RDO", "Área", "Disciplinas", "Clima M/T/N", "MO", "Equip.", "Ocorrências", "Evidências", "Ações"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Nenhum RDO registrado</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Clique em &quot;Novo RDO&quot; para começar</p>
                </td>
              </tr>
            )}
            {filtered.map(rdo => {
              const nMdo   = (rdo.mao_de_obra  || []).reduce((s, m) => s + (parseInt(m.quantidade) || 0), 0);
              const nEquip = (rdo.equipamentos || []).reduce((s, e) => s + (parseInt(e.quantidade) || 0), 0);
              const nOcorr = (rdo.ocorrencias  || []).length;
              const nEvid  = (rdo.evidencias   || []).length;
              return (
                <tr key={rdo.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {rdo.data ? format(new Date(rdo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-bold">{rdo.numero || "—"}</td>
                  <td className="px-4 py-3 text-xs max-w-24 truncate">{rdo.area || "—"}</td>
                  <td className="px-4 py-3">
                    {(rdo.disciplinas || []).length > 0
                      ? <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{rdo.disciplinas.join(", ")}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {climaCell(rdo.clima?.manha)}
                      <span className="text-border text-xs">/</span>
                      {climaCell(rdo.clima?.tarde)}
                      <span className="text-border text-xs">/</span>
                      {climaCell(rdo.clima?.noite)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold">{nMdo > 0 ? nMdo : "—"}</td>
                  <td className="px-4 py-3 text-center text-xs font-bold">{nEquip > 0 ? nEquip : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {nOcorr > 0
                      ? <span className="text-xs bg-status-attention/15 text-status-attention px-2 py-0.5 rounded-full font-medium">{nOcorr}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {nEvid > 0
                      ? <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">{nEvid}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setViewRDO(rdo)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditRDO(rdo); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:bg-muted rounded">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(rdo.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
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

      {showForm && (
        <RDOForm
          rdo={editRDO}
          selectedProjectId={selectedProjectId}
          casos={casos}
          tarefas={tarefas}
          onClose={() => { setShowForm(false); setEditRDO(null); }}
          onSaved={onSaved}
        />
      )}

      {viewRDO && (
        <RDODetail rdo={viewRDO} casos={casos} tarefas={tarefas} onClose={() => setViewRDO(null)} />
      )}

      <ImportExportDialog
        open={showImport}
        onOpenChange={setShowImport}
        title="Importar / Exportar RDOs"
        exportFileName="rdos-export"
        columns={RDO_COLUMNS}
        onImport={handleImport}
        onExport={() => filtered}
      />
    </div>
  );
}
