import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { UNIDADES_MEDIDA } from "@/lib/unidadesMedida";

const STATUS_BADGE = {
  "A iniciar":   { bg: "#f3f4f6", text: "#6b7280" },
  "Em andamento":{ bg: "#fff7ed", text: "#c35e1e" },
  "Concluído":   { bg: "#dcfce7", text: "#16a34a" },
  "Cancelado":   { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_BAR = {
  "A iniciar":   "#64748b",
  "Em andamento":"#c35e1e",
  "Concluído":   "#15803d",
  "Cancelado":   "#dc2626",
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

function SectionDivider({ color, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function ItemMASForm({ item, selectedProjectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    descricao: item?.descricao || "",
    unidade: item?.unidade || "",
    quantidade: item?.quantidade || "",
    numero_sc: item?.numero_sc || "",
    responsavel: item?.responsavel || "",
    fornecedor: item?.fornecedor || "",
    data_prevista: item?.data_prevista || "",
    id_cronograma: item?.id_cronograma || "",
    data_cronograma: item?.data_cronograma || "",
    status: item?.status || "A iniciar",
    etapas: item?.etapas?.length === 7 ? item.etapas : DEFAULT_ETAPAS,
  });
  const [loading, setLoading] = useState(false);

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
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
    setLoading(true);
    const data = { ...form, projeto_id: selectedProjectId, quantidade: parseFloat(form.quantidade) || 0 };
    if (item) await entities.ItemMAS.update(item.id, data);
    else await entities.ItemMAS.create(data);
    setLoading(false);
    onSaved();
  };

  const barColor = STATUS_BAR[form.status] || "#64748b";
  const badgeCfg = STATUS_BADGE[form.status] || STATUS_BADGE["A iniciar"];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-6 px-4">
      <div className="w-full max-w-lg bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col my-auto">

        {/* Header */}
        <div className="pb-3 px-6 pt-6 border-b border-border bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: barColor, minHeight: "40px" }}
              />
              <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-tight">
                  {item ? "Editar Item MAS" : "Novo Item MAS"}
                </p>
                {item ? (
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-xs mt-0.5">
                    {item.numero_sc} — {item.descricao}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Mapa de Suprimentos</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Identificação */}
          <div>
            <SectionDivider color="#0ea5e9" label="Identificação" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nº SC/OC <span className="text-red-500">*</span></Label>
                <Input
                  value={form.numero_sc}
                  onChange={e => set("numero_sc", e.target.value)}
                  placeholder="SC/OC-0001"
                  className="font-mono"
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
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <SectionDivider color="#8b5cf6" label="Quantidade" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unidade</Label>
                <Select value={form.unidade || "__none__"} onValueChange={v => set("unidade", v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sem unidade —</SelectItem>
                    {UNIDADES_MEDIDA.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
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

          {/* Prazo & Status */}
          <div>
            <SectionDivider color="#f59e0b" label="Prazo & Status" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data Prevista</Label>
                <Input
                  type="date"
                  value={form.data_prevista}
                  onChange={e => set("data_prevista", e.target.value)}
                />
              </div>
              <div className="space-y-1">
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

          {/* Cronograma */}
          <div>
            <SectionDivider color="#10b981" label="Cronograma" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Vincular ao Cronograma</Label>
                <Select value={form.id_cronograma || "__none__"} onValueChange={handleSelectCronograma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular tarefa..." />
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

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4 bg-muted/30">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="save"
            disabled={loading || !form.descricao || !form.numero_sc}
            onClick={handleSave}
          >
            {loading ? "Salvando..." : item ? "Salvar alterações" : "Criar item"}
          </Button>
        </div>

      </div>
    </div>
  );
}
