import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Download, Trash2, Paperclip, Link2, X as XIcon } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import RegistroForm from "@/components/pleitos/RegistroForm";
import { useProject } from "@/lib/ProjectContext";
import { supabase } from "@/lib/supabaseClient";

const TIPO_COLORS = {
  "Ata de Reunião": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "E-mail":         "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Notificação:      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const RESP_COLORS = {
  "Contratada":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Contratante": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function exportarXLS(registro) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Campo: "Tipo",               Valor: registro.tipo_registro },
      { Campo: "Data",               Valor: registro.data_hora },
      { Campo: "Responsável",        Valor: registro.responsavel_registro },
      { Campo: "Descrição",          Valor: registro.descricao },
      { Campo: "Impacto Preliminar", Valor: registro.impacto_preliminar },
      { Campo: "Responsabilidade",   Valor: registro.responsabilidade },
      { Campo: "Status",             Valor: registro.status },
    ]),
    "Detalhes"
  );
  const slug = (registro.tipo_registro ?? "registro").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  XLSX.writeFile(wb, `${slug}-${registro.id.slice(0, 8)}.xlsx`);
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function RegistroDetalhes({ registro, onBack }) {
  const [activeTab, setActiveTab] = useState("detalhes");
  const [showEditForm, setShowEditForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAtivModal, setShowAtivModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSelected, setModalSelected] = useState(new Set());
  const fileInputRef = useRef(null);
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

  const handleAddFile = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${selectedProjectId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("registros-anexos")
          .upload(path, file, { upsert: false });
        if (error) throw new Error(`Erro ao enviar ${file.name}: ${error.message}`);
        const { data: urlData } = supabase.storage.from("registros-anexos").getPublicUrl(path);
        uploaded.push({ nome: file.name, url: urlData.publicUrl, path, tipo: file.type, tamanho: file.size });
      }
      updateMutation.mutate({ id: registro.id, data: { anexos: [...(registro.anexos || []), ...uploaded] } });
    } catch (err) {
      toast({ title: "Erro ao enviar arquivo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAnexo = async (anexo) => {
    const storagePath = anexo.path || anexo.url.split("/registros-anexos/")[1];
    if (storagePath) await supabase.storage.from("registros-anexos").remove([storagePath]);
    updateMutation.mutate({
      id: registro.id,
      data: { anexos: (registro.anexos || []).filter(a => a.url !== anexo.url) },
    });
  };

  const toggleModalTarefa = (id) => {
    setModalSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirmAtividades = () => {
    const selecionadas = tarefas
      .filter(t => modalSelected.has(t.id))
      .map(t => ({ id: t.id, nome: t.nome || t.titulo || t.descricao || t.id }));
    updateMutation.mutate({ id: registro.id, data: { atividades_vinculadas: selecionadas } });
    setShowAtivModal(false);
    setModalSearch("");
  };

  const tarefasFiltradas = tarefas.filter(t =>
    (t.nome || t.titulo || t.descricao || "").toLowerCase().includes(modalSearch.toLowerCase())
  );

  const tipoClass = TIPO_COLORS[registro.tipo_registro] || "bg-muted text-muted-foreground";
  const anexos = registro.anexos || [];
  const vinculos = registro.atividades_vinculadas || [];

  const abas = [
    { key: "detalhes", label: "Detalhes" },
    { key: "anexos",   label: `Anexos (${anexos.length})` },
    { key: "vinculos", label: `Vínculos (${vinculos.length})` },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="shrink-0 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-foreground">
              {registro.tipo_registro || "Registro"}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={registro.status} />
              <span className="text-sm text-muted-foreground">{formatDate(registro.data_hora)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={() => exportarXLS(registro)}>
              <Download className="w-4 h-4 mr-2" />
              Exportar XLS
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

        {/* Abas */}
        <div className="flex gap-1 border-b border-border pb-0">
          {abas.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setShowEditForm(false); }}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === key
                  ? "bg-card border border-b-card border-border text-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Aba Detalhes ── */}
        {activeTab === "detalhes" && (
          showEditForm ? (
            <RegistroForm
              key={registro.id}
              incidente={registro}
              casos={[]}
              tarefas={tarefas}
              selectedProjectId={selectedProjectId}
              onSubmit={(data) => updateMutation.mutate({ id: registro.id, data })}
              onCancel={() => setShowEditForm(false)}
              isSubmitting={updateMutation.isPending}
            />
          ) : (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Informações do Registro</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-foreground"
                    onClick={() => setShowEditForm(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">

                {/* Seção — Identificação */}
                <div className="space-y-4">
                  <SectionDivider label="Identificação" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Tipo de Registro
                      </p>
                      <Badge variant="outline" className={`text-xs font-semibold ${tipoClass}`}>
                        {registro.tipo_registro || "—"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Data
                      </p>
                      <p className="text-sm text-foreground font-medium">
                        {formatDate(registro.data_hora) || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Responsável
                      </p>
                      <p className="text-sm text-foreground font-medium">
                        {registro.responsavel_registro || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seção — Conteúdo */}
                <div className="space-y-4">
                  <SectionDivider label="Conteúdo" />
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Descrição
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {registro.descricao || (
                          <span className="italic text-muted-foreground">Sem descrição</span>
                        )}
                      </p>
                    </div>
                    {registro.impacto_preliminar && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Avaliação de Impacto
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {registro.impacto_preliminar}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção — Classificação */}
                <div className="space-y-4">
                  <SectionDivider label="Classificação" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Responsabilidade
                      </p>
                      {registro.responsabilidade ? (
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${RESP_COLORS[registro.responsabilidade] || "bg-muted text-muted-foreground"}`}
                        >
                          {registro.responsabilidade}
                        </Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Status
                      </p>
                      <StatusBadge status={registro.status} />
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          )
        )}

        {/* ── Aba Anexos ── */}
        {activeTab === "anexos" && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-blue-500" />
                  Anexos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                  {uploading ? "Enviando..." : "Adicionar arquivo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={handleAddFile}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {anexos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Paperclip className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Nenhum anexo neste registro.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {anexos.map((anexo, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">
                          {anexo.nome || `Anexo ${i + 1}`}
                        </span>
                        {anexo.tamanho && (
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {formatBytes(anexo.tamanho)}
                          </span>
                        )}
                      </a>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAnexo(anexo)}
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Aba Vínculos ── */}
        {activeTab === "vinculos" && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-green-500" />
                  Vínculos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalSelected(new Set((registro.atividades_vinculadas || []).map(v => v.id).filter(Boolean)));
                    setShowAtivModal(true);
                  }}
                >
                  <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  Vincular Atividades
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {vinculos.length === 0 && !registro.pleito_id ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Link2 className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Nenhum vínculo neste registro.</p>
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
                      <span className="text-sm text-foreground truncate flex-1">{v.nome || v.id}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const updated = vinculos.filter((_, idx) => idx !== i);
                          updateMutation.mutate({ id: registro.id, data: { atividades_vinculadas: updated } });
                        }}
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* Dialog — Vincular Atividades */}
      <Dialog open={showAtivModal} onOpenChange={(open) => { setShowAtivModal(open); if (!open) setModalSearch(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Atividades ao Cronograma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Buscar tarefa..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto space-y-1 border rounded-md p-2">
              {tarefasFiltradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {tarefas.length === 0 ? "Nenhuma tarefa no cronograma" : "Nenhuma tarefa encontrada"}
                </p>
              ) : (
                tarefasFiltradas.map(t => {
                  const nome = t.nome || t.titulo || t.descricao || t.id;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleModalTarefa(t.id)}
                    >
                      <Checkbox
                        checked={modalSelected.has(t.id)}
                        onCheckedChange={() => toggleModalTarefa(t.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm">{nome}</span>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {modalSelected.size} {modalSelected.size === 1 ? "atividade selecionada" : "atividades selecionadas"}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { setShowAtivModal(false); setModalSearch(""); }}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmAtividades}>
              Confirmar seleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
