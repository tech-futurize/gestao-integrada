import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { FormDialog, SectionDivider } from "@/components/ui/FormDialog";

const STATUS_BADGE = {
  "A iniciar":   { bg: "#f3f4f6", text: "#6b7280" },
  "Em andamento":{ bg: "#fff7ed", text: "#c35e1e" },
  "Concluído":   { bg: "#dcfce7", text: "#16a34a" },
  "Cancelado":   { bg: "#fee2e2", text: "#dc2626" },
};

const DEFAULT_ETAPAS = [
  { nome: "Requisição",   status: "pendente", data: "" },
  { nome: "Cotação",      status: "pendente", data: "" },
  { nome: "PATEC",        status: "pendente", data: "" },
  { nome: "Aquisição",    status: "pendente", data: "" },
  { nome: "Fabricação",   status: "pendente", data: "" },
  { nome: "Transporte",   status: "pendente", data: "" },
  { nome: "Fornecimento", status: "pendente", data: "" },
];

export default function ItemMASForm({ item, selectedProjectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    descricao: item?.descricao || "",
    unidade_id: item?.unidade_id || "",
    quantidade: item?.quantidade || "",
    numero_sc: item?.numero_sc || "",
    responsavel: item?.responsavel || "",
    fornecedor: item?.fornecedor || "",
    id_cronograma: item?.id_cronograma || "",
    data_cronograma: item?.data_cronograma || "",
    status: item?.status || "A iniciar",
    etapas: item?.etapas?.length === 7 ? item.etapas : DEFAULT_ETAPAS,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { data: tarefas = [], isLoading: isLoadingTarefas } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: unidades = [], isLoading: isLoadingUnidades } = useQuery({
    queryKey: ["unidades_medida"],
    queryFn: () => entities.UnidadeMedida.list(),
    staleTime: 1000 * 60 * 10,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSelectCronograma = (tarefaId) => {
    if (tarefaId === "__none__") {
      setForm(f => ({ ...f, id_cronograma: "", data_cronograma: "" }));
      return;
    }
    const tarefa = tarefas.find(t => t.id === tarefaId);
    setForm(f => ({
      ...f,
      id_cronograma: tarefaId,
      data_cronograma: tarefa?.data_inicio_planejada || tarefa?.data_inicio_baseline || "",
    }));
  };

  const handleSave = async () => {
    if (!form.quantidade || parseFloat(form.quantidade) <= 0) {
      toast({ title: "Campo obrigatório", description: "Informe uma quantidade válida.", variant: "destructive" });
      return;
    }
    if (!form.responsavel?.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o responsável.", variant: "destructive" });
      return;
    }
    if (!form.fornecedor?.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o fornecedor.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        projeto_id: selectedProjectId,
        quantidade: parseFloat(form.quantidade) || 0,
        id_cronograma: form.id_cronograma || null,
        data_cronograma: form.data_cronograma || null,
        unidade_id: form.unidade_id || null,
      };
      if (item) await entities.ItemMAS.update(item.id, data);
      else await entities.ItemMAS.create(data);
      toast({ title: item ? "Item atualizado" : "Item criado", description: form.descricao });
      onSaved();
    } catch (e) {
      toast({ title: "Erro ao salvar item", description: friendlyMessage(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={Package}
      title={item ? "Editar Item MAS" : "Novo Item MAS"}
      subtitle={item ? `${item.numero_sc} — ${item.descricao}` : "Mapa de Suprimentos"}
      maxWidth="max-w-lg"
      onClose={onClose}
      onSave={handleSave}
      saving={loading}
      saveDisabled={!form.descricao || !form.numero_sc}
      saveLabel={item ? "Salvar alterações" : "Criar item"}
    >
      {/* Identificação */}
      <div>
        <SectionDivider label="Identificação" className="mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nº SC/OC <span className="text-red-500">*</span></Label>
            <Input
              value={form.numero_sc}
              onChange={e => set("numero_sc", e.target.value)}
              placeholder="SC/OC-0001"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Responsável</Label>
            <Input
              value={form.responsavel}
              onChange={e => set("responsavel", e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Descrição do Material <span className="text-red-500">*</span></Label>
            <textarea
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              value={form.descricao}
              onChange={e => set("descricao", e.target.value)}
              placeholder="Descreva o material ou serviço..."
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Fornecedor</Label>
            <Input
              value={form.fornecedor}
              onChange={e => set("fornecedor", e.target.value)}
              placeholder="Nome do fornecedor"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger
                style={
                  form.status && STATUS_BADGE[form.status]
                    ? { backgroundColor: STATUS_BADGE[form.status].bg, color: STATUS_BADGE[form.status].text, borderColor: "transparent" }
                    : {}
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A iniciar", "Em andamento", "Concluído", "Cancelado"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quantidade */}
      <div>
        <SectionDivider label="Quantidade" className="mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Unidade</Label>
            <Select value={form.unidade_id || "__none__"} onValueChange={v => set("unidade_id", v === "__none__" ? "" : v)} disabled={isLoadingUnidades}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingUnidades ? "Carregando..." : "Selecionar unidade..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sem unidade —</SelectItem>
                {unidades.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.sigla} — {u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quantidade</Label>
            <Input
              type="number"
              value={form.quantidade}
              onChange={e => set("quantidade", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cronograma */}
      <div>
        <SectionDivider label="Cronograma" className="mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Vincular ao Cronograma</Label>
            <Select value={form.id_cronograma || "__none__"} onValueChange={handleSelectCronograma} disabled={isLoadingTarefas}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTarefas ? "Carregando tarefas..." : "Vincular tarefa..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sem vínculo —</SelectItem>
                {tarefas.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.codigo_wbs ? `${t.codigo_wbs} — ` : ""}{t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">
              Data Cronograma{" "}
              <span className="text-xs text-muted-foreground">(automática)</span>
            </Label>
            <Input
              type="date"
              value={form.data_cronograma}
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
