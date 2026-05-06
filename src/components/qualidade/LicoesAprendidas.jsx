import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, X, Save } from "lucide-react";

const STATUS_COLORS = {
  "Aprovada": { bg: "#dcfce7", text: "#16a34a" },
  "Aguardando Aprovação": { bg: "#fef3c7", text: "#d97706" },
  "Rascunho": { bg: "#f3f4f6", text: "#6b7280" },
};

const CATEGORIAS = ["Suprimentos", "Engenharia", "Contratos", "Segurança", "Qualidade", "Prazo", "Custo", "Logística"];

const DEFAULTS = { titulo: "", categoria: "Engenharia", impacto: "Médio", autor: "", data: "", status: "Rascunho", diagnostico: "", comentarios: "", problemas: [{ problema: "", qtde_p: 1, resolucao: "", qtde_r: 1 }] };

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200";
const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function LicaoModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || DEFAULTS);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setProb = (i, k, v) => { const ps = [...form.problemas]; ps[i] = { ...ps[i], [k]: v }; setForm(f => ({ ...f, problemas: ps })); };
  const addProb = () => setForm(f => ({ ...f, problemas: [...f.problemas, { problema: "", qtde_p: 1, resolucao: "", qtde_r: 1 }] }));
  const removeProb = (i) => setForm(f => ({ ...f, problemas: f.problemas.filter((_, j) => j !== i) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold" style={{ color: "#00a49a" }}>{item ? "Editar Lição Aprendida" : "Nova Lição Aprendida"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Título"><input className={inputCls} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Título da lição aprendida" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Categoria">
              <select className={selectCls} value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Impacto">
              <select className={selectCls} value={form.impacto} onChange={e => set("impacto", e.target.value)}>
                {["Baixo", "Médio", "Alto", "Crítico"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={selectCls} value={form.status} onChange={e => set("status", e.target.value)}>
                {["Rascunho", "Aguardando Aprovação", "Aprovada"].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Autor"><input className={inputCls} value={form.autor} onChange={e => set("autor", e.target.value)} /></Field>
            <Field label="Data"><input type="date" className={inputCls} value={form.data} onChange={e => set("data", e.target.value)} /></Field>
          </div>
          <Field label="Diagnóstico / Contexto">
            <textarea className={inputCls} rows={3} value={form.diagnostico} onChange={e => set("diagnostico", e.target.value)} placeholder="Descreva o contexto que gerou a lição..." />
          </Field>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Situações / Resoluções</label>
              <button onClick={addProb} className="text-xs text-teal-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Adicionar</button>
            </div>
            {form.problemas.map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-3 p-3 bg-gray-50 rounded-lg relative">
                <button onClick={() => removeProb(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-red-600">Situação</label>
                  <textarea className={inputCls} rows={2} value={p.problema} onChange={e => setProb(i, "problema", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-green-600">Resolução</label>
                  <textarea className={inputCls} rows={2} value={p.resolucao} onChange={e => setProb(i, "resolucao", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <Field label="Comentários / Recomendações">
            <textarea className={inputCls} rows={3} value={form.comentarios} onChange={e => set("comentarios", e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(form)} style={{ backgroundColor: "#00a49a" }}><Save className="w-4 h-4 mr-1" />Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LicoesAprendidas({ projetoId }) {
  const { selectedProjectId: contextProjectId } = useProject();
  const selectedProjectId = projetoId || contextProjectId;
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [filtro, setFiltro] = useState("Todas");
  const [open, setOpen] = useState({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["licoes_aprendidas", selectedProjectId],
    queryFn: () => entities.LicaoAprendida.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.LicaoAprendida.create({ ...data, projeto_id: selectedProjectId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["licoes_aprendidas"] }); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.LicaoAprendida.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["licoes_aprendidas"] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.LicaoAprendida.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["licoes_aprendidas"] }),
  });

  const save = (form) => {
    if (modal === "new") createMutation.mutate(form);
    else updateMutation.mutate({ id: modal.item.id, data: form });
  };

  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }));

  const cats = ["Todas", ...CATEGORIAS.filter(c => items.some(l => l.categoria === c))];
  const filtered = filtro === "Todas" ? items : items.filter(l => l.categoria === filtro);

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400 text-sm">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setFiltro(c)} className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={{ backgroundColor: filtro === c ? "#00a49a" : "white", color: filtro === c ? "white" : "#6b7280", borderColor: filtro === c ? "#00a49a" : "#e5e7eb" }}>
              {c}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setModal("new")} style={{ backgroundColor: "#00a49a" }}><Plus className="w-3 h-3 mr-1" />Nova Lição</Button>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">Nenhuma lição aprendida registrada.</div>
      )}

      {filtered.map(l => {
        const st = STATUS_COLORS[l.status] || {};
        const problemas = l.problemas || [];
        return (
          <div key={l.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggle(l.id)}>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="font-semibold text-sm text-gray-800 truncate">{l.titulo}</span>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{l.categoria}</span>
                <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                  style={{ backgroundColor: l.impacto === "Alto" || l.impacto === "Crítico" ? "#fee2e2" : "#fef3c7", color: l.impacto === "Alto" || l.impacto === "Crítico" ? "#dc2626" : "#d97706" }}>
                  Impacto {l.impacto}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: st.bg, color: st.text }}>{l.status}</span>
                <button onClick={e => { e.stopPropagation(); setModal({ item: l }); }} className="text-gray-400 hover:text-blue-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(l.id); }} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                {open[l.id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
            {open[l.id] && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                {l.diagnostico && <div><div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#00a49a" }}>Diagnóstico</div><p className="text-sm text-gray-700">{l.diagnostico}</p></div>}
                {problemas.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#00a49a" }}>Situações / Resoluções</div>
                    {problemas.map((p, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3 mb-2">
                        <div className="bg-red-50 rounded-lg p-3"><div className="text-xs font-bold text-red-600 mb-1">Situação</div><p className="text-xs text-gray-700">{p.problema}</p></div>
                        <div className="bg-green-50 rounded-lg p-3"><div className="text-xs font-bold text-green-600 mb-1">Resolução</div><p className="text-xs text-gray-700">{p.resolucao}</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {l.comentarios && <div><div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#00a49a" }}>Comentários</div><p className="text-sm text-gray-700">{l.comentarios}</p></div>}
                <div className="text-xs text-gray-400">Autor: {l.autor || "—"} · {l.data || "—"}</div>
              </div>
            )}
          </div>
        );
      })}

      {modal && <LicaoModal item={modal === "new" ? null : modal.item} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}
