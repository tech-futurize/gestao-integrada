import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Upload } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import HistogramaTabela from "@/components/histograma/HistogramaTabela";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const EXPORT_COLUMNS = [
  { key: "nome_recurso",                label: "Recurso",       type: "string", required: true },
  { key: "tipo",                        label: "Tipo",          type: "string", required: true },
  { key: "mes_referencia",              label: "Mês (YYYY-MM)", type: "string", required: true },
  { key: "quantidade_prevista_mensal",  label: "Qtd Prevista",  type: "number" },
  { key: "quantidade_realizada_mensal", label: "Qtd Real",      type: "number" },
  { key: "qtd_projetado",               label: "Qtd Projetado", type: "number" },
];

export default function Histograma() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("MO");
  const [showImportExport, setShowImportExport] = useState(false);
  const [_importing, setImporting] = useState(false);

  const { data: histogramas = [] } = useQuery({
    queryKey: ["histogramas-all", selectedProjectId],
    queryFn: () => entities.Histograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const handleImport = async (row) => {
    setImporting(true);
    try {
      const mesRef = row.mes_referencia?.length === 7
        ? `${row.mes_referencia}-01`
        : row.mes_referencia;
      const payload = {
        projeto_id: selectedProjectId,
        nome_recurso: row.nome_recurso || "",
        tipo: row.tipo === "MO" ? "MO" : "Equipamento",
        mes_referencia: mesRef,
        quantidade_prevista_mensal: Number(row.quantidade_prevista_mensal) || 0,
        quantidade_realizada_mensal: Number(row.quantidade_realizada_mensal) || 0,
        qtd_projetado: Number(row.qtd_projetado) || 0,
      };
      const existing = await entities.Histograma.filter({
        projeto_id: selectedProjectId,
        nome_recurso: payload.nome_recurso,
        mes_referencia: payload.mes_referencia,
        tipo: payload.tipo,
      });
      if (existing.length > 0) {
        await entities.Histograma.update(existing[0].id, payload);
      } else {
        await entities.Histograma.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["histogramas"] });
    } catch (e) {
      toast({ title: "Erro ao importar", description: friendlyMessage(e), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const headerActions = (
    <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
      <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
    </Button>
  );

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={BarChart3}
            description="Selecione um projeto na barra lateral para ver o histograma."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader actions={headerActions} />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Tabs MO / Equipamentos */}
        <div className="flex gap-1 border-b border-border pb-0">
          {[
            { key: "MO", label: "Mão de Obra" },
            { key: "Equipamento", label: "Equipamentos" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === key
                  ? "bg-card border border-b-card border-border text-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <HistogramaTabela tipo={activeTab} />
      </div>

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Histograma"
        exportFileName="histograma"
        columns={EXPORT_COLUMNS}
        onExport={() => histogramas.map((h) => ({
          ...h,
          mes_referencia: h.mes_referencia?.slice(0, 7),
        }))}
        onImport={handleImport}
      />
    </div>
  );
}
