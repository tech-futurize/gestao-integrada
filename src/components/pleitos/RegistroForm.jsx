import { useState, useRef } from "react";
import { toDateInput, toUtcIso } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, X as XIcon } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { openAnexo } from "@/lib/storageUtils";
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";

const TIPOS_REGISTRO = [
  "Ata de Reunião",
  "Notificação",
  "Carta",
  "E-mail",
  "Memória de Cálculo",
  "Liberações/Autorizações",
  "Solicitações/Requisições",
  "Registros de Qualidade",
  "Registros de Segurança",
  "Registros de Meio Ambiente",
  "Outros",
];

export default function RegistroForm({ incidente, onSubmit, onCancel, isSubmitting, selectedProjectId = "", noChrome = false }) {
  const [formData, setFormData] = useState({
    tipo_registro:        incidente?.tipo_registro || "Ata de Reunião",
    data_hora:            toDateInput(incidente?.data_hora) || toDateInput(new Date()),
    responsavel_registro: incidente?.responsavel_registro || "",
    descricao:            incidente?.descricao || "",
    impacto_preliminar:   incidente?.impacto_preliminar || "",
    impacto_ocorrencia:   Array.isArray(incidente?.impacto_ocorrencia) ? incidente.impacto_ocorrencia : [],
    status:               incidente?.status || "Registrado",
    pleito_id:            incidente?.pleito_id || null,
    responsabilidade:     incidente?.responsabilidade || "",
  });

  const [newFiles, setNewFiles] = useState([]);
  const [existingAnexos, setExistingAnexos] = useState(incidente?.anexos || []);
  const [removedPaths, setRemovedPaths] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const { data: categoriasNomes = [], isPending: categoriasPending } = useCategoriasImpacto();

  const { data: pleitos = [], isPending: pleitosPending } = useQuery({
    queryKey: ["pleitos", selectedProjectId],
    queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const toggleImpactoOcorrencia = (cat) =>
    setFormData(f => ({
      ...f,
      impacto_ocorrencia: f.impacto_ocorrencia.includes(cat)
        ? f.impacto_ocorrencia.filter(c => c !== cat)
        : [...f.impacto_ocorrencia, cat],
    }));

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
        const { data: urlData } = supabase.storage.from("registros-anexos").getPublicUrl(path);
        uploaded.push({ nome: file.name, url: urlData.publicUrl, path, tipo: file.type, tamanho: file.size });
      }
      // Salva primeiro; remove do storage só depois do banco confirmar — remover
      // antes deixava o registro apontando para arquivos inexistentes se o save falhasse
      const result = onSubmit({
        ...formData,
        data_hora:  toUtcIso(formData.data_hora),
        pleito_id:  formData.pleito_id || null,
        anexos:     [...existingAnexos, ...uploaded],
      });
      if (result?.then) await result;
      if (removedPaths.length > 0) {
        // limpeza best-effort: falha aqui não pode quebrar o fluxo de save
        supabase.storage.from("registros-anexos").remove(removedPaths).catch(() => {});
      }
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

  const handleRemoveNewFile = (idx) => setNewFiles(prev => prev.filter((_, i) => i !== idx));

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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Tipo + Data + Responsável */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Registro *</Label>
          <Select value={formData.tipo_registro} onValueChange={(v) => set("tipo_registro", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS_REGISTRO.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
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

      {/* Descrição + Impacto + Categorias */}
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
        <div className="space-y-2">
          <Label>Categorias de Impacto</Label>
          {categoriasPending ? (
            <p className="text-xs text-muted-foreground">Carregando categorias...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categoriasNomes.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleImpactoOcorrencia(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    formData.impacto_ocorrencia.includes(cat)
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground bg-background hover:border-primary/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsabilidade + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Anexos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Anexos</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
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
            <button type="button"
              onClick={() =>
                openAnexo("registros-anexos", anexo).catch((err) =>
                  toast({ title: "Erro ao abrir anexo", description: err.message, variant: "destructive" })
                )
              }
              className="flex items-center gap-2 min-w-0 text-sm text-blue-600 hover:underline text-left">
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{anexo.nome}</span>
              <span className="text-muted-foreground text-xs shrink-0">{formatBytes(anexo.tamanho)}</span>
            </button>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 shrink-0"
              onClick={() => handleRemoveExisting(anexo)}>
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
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 shrink-0"
              onClick={() => handleRemoveNewFile(idx)}>
              <XIcon className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      {/* Associar Pleito */}
      <div className="space-y-2">
        <Label>Associar a Pleito (Opcional)</Label>
        <Select
          value={formData.pleito_id || "__none__"}
          onValueChange={(v) => set("pleito_id", v === "__none__" ? null : v)}
          disabled={pleitosPending}
        >
          <SelectTrigger>
            <SelectValue placeholder={pleitosPending ? "Carregando pleitos..." : "Selecione um pleito"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Nenhum</SelectItem>
            {pleitos.map((pleito) => (
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
  );

  if (noChrome) return formContent;

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
        {formContent}
      </CardContent>
    </Card>
  );
}
