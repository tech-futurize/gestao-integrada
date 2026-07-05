import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UNIDADE_SIGLAS } from "@/lib/unidadesMedida";
import { ShoppingCart, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import MapaSuprimentosComponent from "@/components/suprimentos/MapaSuprimentos";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

const EXPORT_COLUMNS = [
  { key: "numero_sc",       label: "Nº SC/OC",          type: "string",  required: true },
  { key: "descricao",       label: "Descrição",          type: "string",  required: true },
  { key: "fornecedor",      label: "Fornecedor",         type: "string" },
  { key: "unidade",         label: "Und",                type: "string" },
  { key: "quantidade",      label: "Quantidade",         type: "number" },
  { key: "responsavel",     label: "Responsável",        type: "string" },
  { key: "status",          label: "Status",             type: "string" },
  { key: "data_prevista",   label: "Data Prevista",      type: "date" },
  { key: "data_cronograma", label: "Data Cronograma",    type: "date" },
];

export default function MapaSuprimentos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { create: canCreate } = usePermissions('Suprimentos');
  const { toast } = useToast();
  const [showImportExport, setShowImportExport] = useState(false);
  const [_importing, setImporting] = useState(false);
  const [triggerNew, setTriggerNew] = useState(0);

  const { data: itens = [] } = useQuery({
    queryKey: ["itemMAS", selectedProjectId],
    queryFn: () => entities.ItemMAS.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades_medida"],
    queryFn: () => entities.UnidadeMedida.list(),
    staleTime: 1000 * 60 * 5,
  });

  const handleImport = async (row) => {
    setImporting(true);
    try {
      // Normaliza a sigla importada: aceita qualquer sigla da lista ou string livre
      const siglaImportada = (row.unidade || "").trim();
      const unidadeNormalizada = UNIDADE_SIGLAS.find(
        s => s.toLowerCase() === siglaImportada.toLowerCase()
      ) || siglaImportada || null;
      const unidadeCadastrada = unidadeNormalizada
        ? unidades.find(u => u.sigla.toLowerCase() === unidadeNormalizada.toLowerCase())
        : null;
      const numeroSc = row.numero_sc || "";
      if (!numeroSc) throw new Error("Número da SC é obrigatório.");
      // Patch apenas com as colunas mapeadas — reimportar planilha parcial não
      // deve apagar fornecedor/responsável/datas dos itens existentes
      const patch = {};
      if ("descricao" in row)       patch.descricao       = row.descricao       || "";
      if ("fornecedor" in row)      patch.fornecedor      = row.fornecedor      || "";
      if ("quantidade" in row)      patch.quantidade      = row.quantidade      ?? 0;
      if ("responsavel" in row)     patch.responsavel     = row.responsavel     || "";
      if ("status" in row)          patch.status          = row.status          || "A iniciar";
      if ("data_cronograma" in row) patch.data_cronograma = row.data_cronograma || null;
      if ("unidade" in row) {
        patch.unidade = unidadeNormalizada;
        // Só grava a FK quando a lista de unidades já carregou — evita zerar vínculo em update
        if (unidades.length > 0) patch.unidade_id = unidadeCadastrada?.id || null;
      }
      const existing = await entities.ItemMAS.filter({ projeto_id: selectedProjectId, numero_sc: numeroSc });
      if (existing.length > 0) {
        await entities.ItemMAS.update(existing[0].id, patch);
      } else {
        await entities.ItemMAS.create({ projeto_id: selectedProjectId, numero_sc: numeroSc, ...patch });
      }
      queryClient.invalidateQueries({ queryKey: ["itemMAS"] });
    } catch (e) {
      toast({ title: "Erro ao importar item", description: friendlyMessage(e), variant: "destructive" });
      throw e; // repassa para o dialog contabilizar o erro na linha
    } finally {
      setImporting(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      {canCreate && (
        <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
          <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
        </Button>
      )}
      {canCreate && (
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setTriggerNew(t => t + 1)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Item
        </Button>
      )}
    </div>
  );

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={ShoppingCart} description="Selecione um projeto no menu lateral para ver o mapa de suprimentos." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader actions={headerActions} />
      <div className="flex-1 overflow-auto p-6">
        <MapaSuprimentosComponent selectedProjectId={selectedProjectId} triggerNew={triggerNew} />
      </div>

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
