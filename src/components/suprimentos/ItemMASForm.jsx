import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CloseButton from "@/components/ui/CloseButton";

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
    unidade: item?.unidade || "",
    quantidade: item?.quantidade || "",
    numero_sc: item?.numero_sc || "",
    solicitante: item?.solicitante || "",
    data_necessidade: item?.data_necessidade || "",
    status: item?.status || "A iniciar",
    etapas: item?.etapas?.length === 7 ? item.etapas : DEFAULT_ETAPAS,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    const data = { ...form, projeto_id: selectedProjectId, quantidade: parseFloat(form.quantidade) || 0 };
    if (item) await entities.ItemMAS.update(item.id, data);
    else await entities.ItemMAS.create(data);
    setLoading(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg mx-4 shadow-2xl">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base" style={{ color: "#26405d" }}>{item ? "Editar Item" : "Novo Item MAS"}</CardTitle>
          <CloseButton onClick={onClose} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Descrição do Material *</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unidade</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.unidade} onChange={e => set("unidade", e.target.value)} placeholder="un, kg, m..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quantidade</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.quantidade} onChange={e => set("quantidade", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nº SC *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.numero_sc} onChange={e => set("numero_sc", e.target.value)} placeholder="SC-0001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Solicitante</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.solicitante} onChange={e => set("solicitante", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data Necessidade</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.data_necessidade} onChange={e => set("data_necessidade", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button disabled={loading || !form.descricao || !form.numero_sc} onClick={handleSave} className="text-white" style={{ backgroundColor: "#26405d" }}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}