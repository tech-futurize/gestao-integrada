import { useState } from "react";
import * as XLSX from "xlsx";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Download, Trash2, Paperclip, Link2 } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RegistroForm from "@/components/pleitos/RegistroForm";
import { useProject } from "@/lib/ProjectContext";

const TIPO_COLORS = {
  "Ata de Reunião": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "E-mail": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Notificação: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function exportarXLS(registro) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Campo: "Tipo",               Valor: registro.tipo_registro },
      { Campo: "Data/Hora",          Valor: registro.data_hora },
      { Campo: "Responsável",        Valor: registro.responsavel_registro },
      { Campo: "Descrição",          Valor: registro.descricao },
      { Campo: "Impacto Preliminar", Valor: registro.impacto_preliminar },
      { Campo: "Probabilidade",      Valor: registro.probabilidade },
      { Campo: "Gravidade",          Valor: registro.gravidade },
      { Campo: "Responsabilidade",   Valor: registro.responsabilidade },
      { Campo: "Status",             Valor: registro.status },
    ]),
    "Detalhes"
  );
  const slug = (registro.tipo_registro ?? "registro")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  XLSX.writeFile(wb, `${slug}-${registro.id.slice(0, 8)}.xlsx`);
}

export default function RegistroDetalhes({ registro, onBack }) {
  const [activeTab, setActiveTab] = useState("detalhes");
  const [showEditForm, setShowEditForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedProjectId } = useProject();

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Registro.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      setShowEditForm(false);
      toast({ title: "Registro atualizado com sucesso!" });
    },
    onError: (e) =>
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Registro.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      toast({ title: "Registro excluído." });
      onBack();
    },
    onError: (e) =>
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const tipoClass =
    TIPO_COLORS[registro.tipo_registro] || "bg-muted text-muted-foreground";
  const anexos = registro.anexos || [];
  const vinculos = registro.atividades_vinculadas || [];

  const abas = [
    { key: "detalhes", label: "Detalhes" },
    { key: "anexos",   label: `Anexos (${anexos.length})` },
    { key: "vinculos", label: `Vínculos (${vinculos.length})` },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="shrink-0 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-foreground">
              {registro.tipo_registro || "Registro"}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={registro.status} />
              <Badge variant="outline" className={`text-xs font-semibold ${tipoClass}`}>
                {registro.tipo_registro}
              </Badge>
              {registro.responsabilidade && (
                <Badge variant="outline">{registro.responsabilidade}</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {formatDate(registro.data_hora)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportarXLS(registro)}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar XLS
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              onClick={() => setShowEditForm(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-status-critical hover:bg-status-critical/10"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Formulário de edição inline */}
        {showEditForm && (
          <RegistroForm
            key={registro.id}
            incidente={registro}
            casos={[]}
            tarefas={tarefas}
            selectedProjectId={selectedProjectId}
            onSubmit={(data) =>
              updateMutation.mutate({ id: registro.id, data })
            }
            onCancel={() => setShowEditForm(false)}
            isSubmitting={updateMutation.isPending}
          />
        )}

        {/* Abas */}
        <div className="flex gap-1 border-b border-border pb-0">
          {abas.map(({ key, label }) => (
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

        {/* Aba Detalhes */}
        {activeTab === "detalhes" && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Informações do Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registro.descricao && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">{registro.descricao}</p>
                  </div>
                )}
                {registro.impacto_preliminar && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Impacto Preliminar
                    </label>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">
                      {registro.impacto_preliminar}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Probabilidade</label>
                  <p className="mt-2 text-foreground">{registro.probabilidade || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gravidade</label>
                  <p className="mt-2 text-foreground">{registro.gravidade || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Responsabilidade</label>
                  <p className="mt-2 text-foreground">{registro.responsabilidade || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                  <p className="mt-2 text-foreground">{registro.responsavel_registro || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="mt-2 text-foreground">{registro.tipo_registro || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data/Hora</label>
                  <p className="mt-2 text-foreground">
                    {formatDateTime(registro.data_hora) || formatDate(registro.data_hora) || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba Anexos */}
        {activeTab === "anexos" && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-blue-600" />
                Anexos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anexos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum anexo neste registro.
                </div>
              ) : (
                <div className="space-y-2">
                  {anexos.map((anexo, i) => (
                    <a
                      key={i}
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">
                        {anexo.nome || `Anexo ${i + 1}`}
                      </span>
                      {anexo.tamanho && (
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          {(anexo.tamanho / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aba Vínculos */}
        {activeTab === "vinculos" && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-green-600" />
                Vínculos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vinculos.length === 0 && !registro.pleito_id ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum vínculo neste registro.
                </div>
              ) : (
                <div className="space-y-2">
                  {registro.pleito_id && (
                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                      <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">Pleito vinculado</span>
                      <span className="text-xs text-muted-foreground ml-auto font-mono">
                        {registro.pleito_id.slice(0, 8)}…
                      </span>
                    </div>
                  )}
                  {vinculos.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{v.nome || v.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* Confirmação de exclusão */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-critical hover:bg-status-critical/90"
              onClick={() => {
                setConfirmDelete(false);
                deleteMutation.mutate(registro.id);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
