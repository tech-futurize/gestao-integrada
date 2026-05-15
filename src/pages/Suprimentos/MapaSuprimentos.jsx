import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import MapaSuprimentosComponent from "@/components/suprimentos/MapaSuprimentos";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";

const EXPORT_COLUMNS = [
  { key: "numero_sc", label: "Nº SC" },
  { key: "descricao", label: "Descrição" },
  { key: "unidade", label: "Unidade" },
  { key: "quantidade", label: "Quantidade" },
  { key: "solicitante", label: "Solicitante" },
  { key: "status", label: "Status" },
  { key: "data_necessidade", label: "Data Necessidade" },
  { key: "observacao", label: "Observação" },
];

export default function MapaSuprimentos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [showImportExport, setShowImportExport] = useState(false);

  const { data: itens = [] } = useQuery({
    queryKey: ["itemMAS", selectedProjectId],
    queryFn: () => entities.ItemMAS.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const handleImport = async (rows) => {
    for (const row of rows) {
      await entities.ItemMAS.create({ ...row, projeto_id: selectedProjectId });
    }
    queryClient.invalidateQueries({ queryKey: ["itemMAS"] });
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
        <Button variant="outline" onClick={() => setShowImportExport(true)}>
          <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
        </Button>
      </div>

      <MapaSuprimentosComponent selectedProjectId={selectedProjectId} />

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
