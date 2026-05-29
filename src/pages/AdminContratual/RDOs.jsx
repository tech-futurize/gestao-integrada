import { useState } from "react";
import { FileText, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import RDOModule from "@/components/rdo/RDOModule";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";

export default function RDOs() {
  const { selectedProjectId } = useProject();
  const [showForm, setShowForm]     = useState(false);
  const [editRDO, setEditRDO]       = useState(null);
  const [showImport, setShowImport] = useState(false);

  const handleNew = () => { setEditRDO(null); setShowForm(true); };

  const actions = selectedProjectId ? (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
        <Upload className="w-4 h-4 mr-2" />Importar / Exportar
      </Button>
      <Button size="sm" onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <Plus className="w-4 h-4 mr-2" />Novo RDO
      </Button>
    </>
  ) : null;

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={FileText}
            description="Selecione um projeto na barra lateral para acessar os RDOs."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader actions={actions} />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <RDOModule
          selectedProjectId={selectedProjectId}
          showForm={showForm}
          setShowForm={setShowForm}
          editRDO={editRDO}
          setEditRDO={setEditRDO}
          showImport={showImport}
          setShowImport={setShowImport}
        />
      </div>
    </div>
  );
}
