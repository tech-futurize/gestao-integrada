import { useState, useRef } from "react";
import { toDateInput, toUtcIso } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Paperclip, X as XIcon, Link2 } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

export default function RegistroForm({ incidente, casos, onSubmit, onCancel, isSubmitting, tarefas = [], selectedProjectId = "" }) {
  const [formData, setFormData] = useState({
    tipo_registro: incidente?.tipo_registro || "Ata de Reunião",
    data_hora: toDateInput(incidente?.data_hora) || toDateInput(new Date()),
    responsavel_registro: incidente?.responsavel_registro || "",
    descricao: incidente?.descricao || "",
    impacto_preliminar: incidente?.impacto_preliminar || "",
    probabilidade: incidente?.probabilidade || "Média",
    gravidade: incidente?.gravidade || "Média",
    status: incidente?.status || "Registrado",
    pleito_id: incidente?.pleito_id || null,
    responsabilidade: incidente?.responsabilidade || "",
  });

  const [newFiles, setNewFiles] = useState([]);
  const [existingAnexos, setExistingAnexos] = useState(incidente?.anexos || []);
  const [removedPaths, setRemovedPaths] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [atividadesVinculadas, setAtividadesVinculadas] = useState(incidente?.atividades_vinculadas || []);
  const [showAtivModal, setShowAtivModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSelected, setModalSelected] = useState(
    new Set((incidente?.atividades_vinculadas || []).map(a => a.id))
  );
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newFiles.length > 0 && !selectedProjectId) {
      toast({ title: "Projeto não selecionado", description: "Selecione um projeto antes de anexar arquivos.", variant: "destructive" });
      return;
    }
    setIsUploading(true);

    try {
      const uploaded = [];
      for (const file of newFiles) {
        const ext = file.name.split(".").pop();
        const path = `${selectedProjectId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("registros-anexos")
          .upload(path, file, { upsert: false });
        if (error) throw new Error(`Erro ao enviar ${file.name}: ${error.message}`);
        const { data: urlData } = supabase.storage
          .from("registros-anexos")
          .getPublicUrl(path);
        uploaded.push({
          nome: file.name,
          url: urlData.publicUrl,
          path,
          tipo: file.type,
          tamanho: file.size,
        });
      }

      if (removedPaths.length > 0) {
        await supabase.storage.from("registros-anexos").remove(removedPaths);
      }

      onSubmit({
        ...formData,
        data_hora: toUtcIso(formData.data_hora),
        pleito_id: formData.pleito_id || null,
        anexos: [...existingAnexos, ...uploaded],
        atividades_vinculadas: atividadesVinculadas,
      });
    } catch (err) {
      toast({ title: "Erro ao enviar arquivo", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files || []);
    setNewFiles(prev => [...prev, ...files]);
    e.target.value = "";
  };

  const handleRemoveNewFile = (idx) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveExisting = (anexo) => {
    const storagePath = anexo.path || anexo.url.split("/registros-anexos/")[1];
    if (storagePath) setRemovedPaths(prev => [...prev, storagePath]);
    setExistingAnexos(prev => prev.filter(a => a.url !== anexo.url));
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleConfirmAtividades = () => {
    const selecionadas = tarefas
      .filter(t => modalSelected.has(t.id))
      .map(t => ({ id: t.id, nome: t.nome || t.titulo || t.descricao || t.id }));
    setAtividadesVinculadas(selecionadas);
    setShowAtivModal(false);
    setModalSearch("");
  };

  const toggleModalTarefa = (id) => {
    setModalSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tarefasFiltradas = tarefas.filter(t =>
    (t.nome || t.titulo || t.descricao || "").toLowerCase().includes(modalSearch.toLowerCase())
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-muted">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">
            {incidente ? "Editar Registro" : "Novo Registro"}
          </CardTitle>
          <CloseButton onClick={onCancel} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo + Data + Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Registro *</Label>
              <Select value={formData.tipo_registro} onValueChange={(v) => set("tipo_registro", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ata de Reunião">Ata de Reunião</SelectItem>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                  <SelectItem value="Notificação">Notificação</SelectItem>
                  <SelectItem value="RDO">RDO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={formData.data_hora}
                onChange={(e) => set("data_hora", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel_registro}
                onChange={(e) => set("responsavel_registro", e.target.value)}
                placeholder="Nome do responsável" />
            </div>
          </div>

          {/* Descrição + Impacto */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea value={formData.descricao} onChange={(e) => set("descricao", e.target.value)}
                placeholder="Descreva o registro..." rows={4} required className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>Avaliação de Impacto</Label>
              <Textarea value={formData.impacto_preliminar} onChange={(e) => set("impacto_preliminar", e.target.value)}
                placeholder="Avaliação preliminar do impacto..." rows={2} className="resize-none" />
            </div>
          </div>

          {/* Probabilidade + Gravidade + Responsabilidade + Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Probabilidade</Label>
              <Select value={formData.probabilidade} onValueChange={(v) => set("probabilidade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gravidade</Label>
              <Select value={formData.gravidade} onValueChange={(v) => set("gravidade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsabilidade</Label>
              <Select value={formData.responsabilidade} onValueChange={(v) => set("responsabilidade", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contratada">Contratada</SelectItem>
                  <SelectItem value="Contratante">Contratante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Registrado">Registrado</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vincular Atividades */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalSelected(new Set(atividadesVinculadas.map(a => a.id)));
                setShowAtivModal(true);
              }}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Vincular Atividades
              {atividadesVinculadas.length > 0 && (
                <Badge variant="secondary" className="ml-2">{atividadesVinculadas.length}</Badge>
              )}
            </Button>

            {atividadesVinculadas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {atividadesVinculadas.map(a => (
                  <Badge key={a.id} variant="outline" className="text-xs font-normal">
                    {a.nome}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Modal de seleção de atividades */}
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
                      {tarefas.length === 0
                        ? "Nenhuma tarefa no cronograma"
                        : "Nenhuma tarefa encontrada"}
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

          {/* Anexos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Anexos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-3 h-3 mr-1" />
                Adicionar arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                onChange={handleFileAdd}
              />
            </div>

            {existingAnexos.length === 0 && newFiles.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Nenhum anexo adicionado.</p>
            )}

            {existingAnexos.map((anexo) => (
              <div key={anexo.url} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md">
                <a
                  href={anexo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0 text-sm text-blue-600 hover:underline"
                >
                  <Paperclip className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{anexo.nome}</span>
                  <span className="text-muted-foreground text-xs shrink-0">{formatBytes(anexo.tamanho)}</span>
                </a>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleRemoveExisting(anexo)}
                >
                  <XIcon className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            ))}

            {newFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="flex items-center justify-between gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-muted-foreground text-xs shrink-0">{formatBytes(file.size)}</span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleRemoveNewFile(idx)}
                >
                  <XIcon className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          {/* Associar Pleito */}
          <div className="space-y-2">
            <Label>Associar a Pleito (Opcional)</Label>
            <Select value={formData.pleito_id || "__none__"} onValueChange={(v) => set("pleito_id", v === "__none__" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um pleito" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {casos.map((pleito) => (
                  <SelectItem key={pleito.id} value={pleito.id}>{pleito.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="save" disabled={isSubmitting || isUploading}>
              {isUploading ? "Enviando arquivos..." : isSubmitting ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
