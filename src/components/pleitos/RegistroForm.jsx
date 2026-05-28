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
import { Plus, Trash2, Paperclip, X as XIcon, Link2 } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

const IMPACTO_CATEGORIES = [
  "Engenharia", "Suprimentos", "Escopo", "Planejamento",
  "Recursos", "Produtividade", "Liberação de Área",
  "Segurança", "Qualidade", "Gestão & Comunicação"
];

export default function RegistroForm({ incidente, casos, onSubmit, onCancel, isSubmitting, tarefas = [], selectedProjectId = "" }) {
  const [formData, setFormData] = useState({
    tipo_registro: incidente?.tipo_registro || "Ata de Reunião",
    data_hora: toDateInput(incidente?.data_hora) || toDateInput(new Date()),
    responsavel_registro: incidente?.responsavel_registro || "",
    descricao: incidente?.descricao || "",
    impacto_preliminar: incidente?.impacto_preliminar || "",
    status: incidente?.status || "Registrado",
    pleito_id: incidente?.pleito_id || null,
    numero_rdo: incidente?.numero_rdo || "",
    area: incidente?.area || "",
    disciplina: incidente?.disciplina || "",
    atividades: incidente?.atividades || "",
    condicoes_climaticas_manha: incidente?.condicoes_climaticas_manha || "",
    condicoes_climaticas_tarde: incidente?.condicoes_climaticas_tarde || "",
    condicoes_climaticas_noite: incidente?.condicoes_climaticas_noite || "",
    ocorrencias: incidente?.ocorrencias || "",
    responsabilidade: incidente?.responsabilidade || "",
  });

  const [maoDeObra, setMaoDeObra] = useState(
    incidente?.mao_de_obra?.length ? incidente.mao_de_obra : [{ quantidade: "", funcao: "" }]
  );
  const [equipamentosRdo, setEquipamentosRdo] = useState(
    incidente?.equipamentos_rdo?.length ? incidente.equipamentos_rdo : [{ quantidade: "", equipamento: "" }]
  );
  const [impactoOcorrencia, setImpactoOcorrencia] = useState(
    incidente?.impacto_ocorrencia || []
  );
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

  const isRDO = formData.tipo_registro === "RDO";

  const toggleImpacto = (cat) => {
    setImpactoOcorrencia(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addMaoDeObra = () => setMaoDeObra(prev => [...prev, { quantidade: "", funcao: "" }]);
  const removeMaoDeObra = (idx) => setMaoDeObra(prev => prev.filter((_, i) => i !== idx));
  const updateMaoDeObra = (idx, field, value) =>
    setMaoDeObra(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const addEquipamento = () => setEquipamentosRdo(prev => [...prev, { quantidade: "", equipamento: "" }]);
  const removeEquipamento = (idx) => setEquipamentosRdo(prev => prev.filter((_, i) => i !== idx));
  const updateEquipamento = (idx, field, value) =>
    setEquipamentosRdo(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newFiles.length > 0 && !selectedProjectId) {
      toast({ title: "Projeto não selecionado", description: "Selecione um projeto antes de anexar arquivos.", variant: "destructive" });
      return;
    }
    setIsUploading(true);

    try {
      // Upload de arquivos novos
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

      // Deletar arquivos removidos do storage
      if (removedPaths.length > 0) {
        const { error: deleteError } = await supabase.storage.from("registros-anexos").remove(removedPaths);
        if (deleteError) console.warn("Storage delete parcial:", deleteError.message);
      }

      onSubmit({
        ...formData,
        data_hora: toUtcIso(formData.data_hora),
        pleito_id: formData.pleito_id || null,
        mao_de_obra: isRDO ? maoDeObra.filter(r => r.quantidade || r.funcao) : [],
        equipamentos_rdo: isRDO ? equipamentosRdo.filter(r => r.quantidade || r.equipamento) : [],
        impacto_ocorrencia: impactoOcorrencia,
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
                  {(formData.tipo_registro === "INCIDENTE" || formData.tipo_registro === "Incidente") && (
                    <SelectItem value={formData.tipo_registro} disabled className="text-muted-foreground italic">
                      Incidente (legado — selecione um tipo)
                    </SelectItem>
                  )}
                  <SelectItem value="Ata de Reunião">Ata de Reunião</SelectItem>
                  <SelectItem value="RDO">RDO</SelectItem>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                  <SelectItem value="Notificação">Notificação</SelectItem>
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

          {/* RDO-specific fields */}
          {isRDO && (
            <div className="space-y-6 p-4 bg-blue-100/40 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Campos do RDO</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nº RDO</Label>
                  <Input value={formData.numero_rdo} onChange={(e) => set("numero_rdo", e.target.value)} placeholder="Ex: 001" />
                </div>
                <div className="space-y-2">
                  <Label>Área</Label>
                  <Input value={formData.area} onChange={(e) => set("area", e.target.value)} placeholder="Ex: Área Norte" />
                </div>
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select value={formData.disciplina} onValueChange={(v) => set("disciplina", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mecânica">Mecânica</SelectItem>
                      <SelectItem value="Elétrica">Elétrica</SelectItem>
                      <SelectItem value="Estrutura Metálica">Estrutura Metálica</SelectItem>
                      <SelectItem value="Tubulação">Tubulação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mão de obra */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mão de Obra</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addMaoDeObra}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {maoDeObra.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input className="w-24" placeholder="Qtd" value={row.quantidade}
                        onChange={(e) => updateMaoDeObra(idx, "quantidade", e.target.value)} />
                      <Input placeholder="Função" value={row.funcao}
                        onChange={(e) => updateMaoDeObra(idx, "funcao", e.target.value)} />
                      {maoDeObra.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeMaoDeObra(idx)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipamentos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Equipamentos</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addEquipamento}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {equipamentosRdo.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input className="w-24" placeholder="Qtd" value={row.quantidade}
                        onChange={(e) => updateEquipamento(idx, "quantidade", e.target.value)} />
                      <Input placeholder="Equipamento" value={row.equipamento}
                        onChange={(e) => updateEquipamento(idx, "equipamento", e.target.value)} />
                      {equipamentosRdo.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeEquipamento(idx)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Atividades */}
              <div className="space-y-2">
                <Label>Atividades</Label>
                <Textarea value={formData.atividades} onChange={(e) => set("atividades", e.target.value)}
                  placeholder="Descreva as atividades realizadas..." rows={3} />
              </div>

              {/* Condições Climáticas */}
              <div className="space-y-2">
                <Label>Condições Climáticas</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Manhã", field: "condicoes_climaticas_manha" },
                    { label: "Tarde", field: "condicoes_climaticas_tarde" },
                    { label: "Noite", field: "condicoes_climaticas_noite" },
                  ].map(({ label, field }) => (
                    <div key={field} className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                      <Select value={formData[field]} onValueChange={(v) => set(field, v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Praticável">Praticável</SelectItem>
                          <SelectItem value="Impraticável">Impraticável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Non-RDO fields */}
          {!isRDO && (
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
          )}

          {/* Ocorrências (shared) */}
          <div className="space-y-2">
            <Label>Ocorrências</Label>
            <Textarea value={formData.ocorrencias} onChange={(e) => set("ocorrencias", e.target.value)}
              placeholder="Registre ocorrências..." rows={3} className="resize-none" />
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
          <Dialog open={showAtivModal} onOpenChange={setShowAtivModal}>
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

          {/* Responsabilidade + Impacto da Ocorrência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Impacto da Ocorrência - checkboxes */}
          <div className="space-y-3">
            <Label>Impacto da Ocorrência</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {IMPACTO_CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center space-x-2 bg-muted rounded p-2">
                  <Checkbox
                    id={`impacto-${cat}`}
                    checked={impactoOcorrencia.includes(cat)}
                    onCheckedChange={() => toggleImpacto(cat)}
                  />
                  <label htmlFor={`impacto-${cat}`} className="text-xs font-medium cursor-pointer leading-tight">
                    {cat}
                  </label>
                </div>
              ))}
            </div>
          </div>

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

            {/* Anexos já salvos */}
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

            {/* Novos arquivos selecionados */}
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
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="save" disabled={isSubmitting || isUploading}>
              {isUploading ? "Enviando arquivos..." : isSubmitting ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}