import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import MapaSuprimentosComponent from "@/components/suprimentos/MapaSuprimentos";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

const EXPORT_COLUMNS = [
  { key: "numero_sc",       label: "Nº SC/OC",          type: "string",  required: true },
  { key: "descricao",       label: "Descrição",          type: "string",  required: true },
  { key: "fornecedor",      label: "Fornecedor",         type: "string" },
  { key: "unidade",         label: "Unidade",            type: "string" },
  { key: "quantidade",      label: "Quantidade",         type: "number" },
  { key: "responsavel",     label: "Responsável",        type: "string" },
  { key: "status",          label: "Status",             type: "string" },
  { key: "data_prevista",   label: "Data Prevista",      type: "date" },
  { key: "data_cronograma", label: "Data Cronograma",    type: "date" },
];

export default function MapaSuprimentos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [triggerNew, setTriggerNew] = useState(0);

  const { data: itens = [] } = useQuery({
    queryKey: ["itemMAS", selectedProjectId],
    queryFn: () => entities.ItemMAS.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const handleImport = async (row) => {
    setImporting(true);
    try {
      const payload = {
        projeto_id:       selectedProjectId,
        numero_sc:        row.numero_sc        || "",
        descricao:        row.descricao        || "",
        fornecedor:       row.fornecedor       || "",
        unidade:          row.unidade          || "",
        quantidade:       row.quantidade       ?? 0,
        responsavel:      row.responsavel      || "",
        status:           row.status           || "Pendente",
        data_prevista:    row.data_prevista    || null,
        data_cronograma:  row.data_cronograma  || null,
      };
      const existing = await entities.ItemMAS.filter({ projeto_id: selectedProjectId, numero_sc: payload.numero_sc });
      if (existing.length > 0) {
        await entities.ItemMAS.update(existing[0].id, payload);
      } else {
        await entities.ItemMAS.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["itemMAS"] });
    } catch (e) {
      toast({ title: "Erro ao importar item", description: friendlyMessage(e), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={ShoppingCart} description="Selecione um projeto no menu lateral para ver o mapa de suprimentos." />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapa de Suprimentos</h1>
          <p className="text-sm text-muted-foreground">Pipeline de aquisição — Requisição até Fornecimento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
          </Button>
          <Button onClick={() => setTriggerNew(t => t + 1)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Item
          </Button>
        </div>
      </div>

      <MapaSuprimentosComponent selectedProjectId={selectedProjectId} triggerNew={triggerNew} />

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        title="Mapa de Suprimentos"
        exportFileName="mapa_suprimentos"
        columns={EXPORT_COLUMNS}
        onExport={() => itens}
        onImport={handleImport}
      />
    </div>
  );
}
