import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X } from "lucide-react";

const ETAPAS = ["A Emitir", "Em Elaboração", "Em Verificação Técnica", "Comentários do Cliente", "Aprovado"];
const DISC_COLORS = {
  MEC: "#3b82f6", CIV: "#8b5cf6", ELE: "#f59e0b", TUB: "#06b6d4",
  INS: "#10b981", AUT: "#ef4444", EST: "#6366f1", PRC: "#ec4899", HSE: "#84cc16",
};
const ETAPA_COLORS = {
  "A Emitir": { bg: "#f3f4f6", text: "#6b7280" },
  "Em Elaboração": { bg: "#dbeafe", text: "#2563eb" },
  "Em Verificação Técnica": { bg: "#fef3c7", text: "#d97706" },
  "Comentários do Cliente": { bg: "#fae8ff", text: "#9333ea" },
  "Aprovado": { bg: "#dcfce7", text: "#16a34a" },
};

export default function DocDetalhe({ doc, onBack, onUpdate }) {
  const today = new Date();
  const dl = doc.deadline ? new Date(doc.deadline) : null;
  const daysLeft = dl ? Math.ceil((dl - today) / 86400000) : null;
  const vencido = daysLeft !== null && daysLeft < 0;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ etapa: doc.etapa, progresso: doc.progresso || 0, observacoes: doc.observacoes || "" });
  const [novaRevisao, setNovaRevisao] = useState({ revisao: "", data: "", observacao: "" });
  const [showRevModal, setShowRevModal] = useState(false);

  const discColor = DISC_COLORS[doc.disciplina] || "#374151";
  const etapaCfg = ETAPA_COLORS[doc.etapa] || {};

  const handleSave = () => {
    onUpdate(doc.id, form);
    setEditing(false);
  };

  const handleAddRevisao = () => {
    const hist = [...(doc.historico_revisoes || []), { ...novaRevisao, etapa: form.etapa }];
    onUpdate(doc.id, { historico_revisoes: hist });
    setShowRevModal(false);
    setNovaRevisao({ revisao: "", data: "", observacao: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />Voltar
        </button>
        <div className="flex gap-2">
          {editing
            ? <>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5 mr-1" />Cancelar</Button>
                <Button size="sm" onClick={handleSave} style={{ backgroundColor: "#26405d" }}><Save className="w-3.5 h-3.5 mr-1" />Salvar</Button>
              </>
            : <Button size="sm" onClick={() => setEditing(true)} style={{ backgroundColor: "#c35e1e" }}>Editar</Button>
          }
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-2" style={{ backgroundColor: discColor }} />
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-bold" style={{ color: discColor }}>{doc.tag_id}</div>
              <h2 className="text-xl font-bold mt-1" style={{ color: "#26405d" }}>{doc.titulo}</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-bold rounded px-2 py-0.5 text-white" style={{ backgroundColor: discColor }}>{doc.disciplina}</span>
              {doc.revisao_atual && <span className="text-xs font-semibold bg-gray-100 text-gray-600 rounded px-2 py-0.5">{doc.revisao_atual}</span>}
              <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: etapaCfg.bg, color: etapaCfg.text }}>{doc.etapa}</span>
              <span className="text-xs font-semibold bg-orange-50 text-orange-700 rounded-full px-2 py-0.5">{doc.prioridade}</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Fornecedor", value: doc.fornecedor || "—" },
              { label: "Nº de Folhas", value: doc.num_folhas || "—" },
              { label: "Peso A4", value: doc.peso_a4 ? `${doc.peso_a4} A4` : "—" },
              { label: "Deadline", value: doc.deadline ? `${doc.deadline}${daysLeft !== null ? ` (${vencido ? `${Math.abs(daysLeft)} dias vencido` : `${daysLeft} dias`})` : ""}` : "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
                <div className={`font-medium mt-0.5 ${label === "Deadline" && vencido ? "text-red-600" : "text-gray-700"}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Progresso */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progresso</span>
              {editing
                ? <input type="number" min={0} max={100} value={form.progresso} onChange={e => setForm(f => ({ ...f, progresso: Number(e.target.value) }))}
                    className="w-20 border border-gray-200 rounded px-2 py-0.5 text-xs text-right" />
                : <span className="font-bold">{doc.progresso || 0}%</span>}
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(doc.progresso || 0, 100)}%`, backgroundColor: (doc.progresso || 0) >= 70 ? "#16a34a" : (doc.progresso || 0) >= 40 ? "#d97706" : "#dc2626" }} />
            </div>
          </div>

          {/* Etapa (edit) */}
          {editing && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Etapa</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))}>
                  {ETAPAS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Observação</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Observação..." />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline de etapas */}
      {doc.historico_etapas && doc.historico_etapas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: "#26405d" }}>Timeline de Movimentações</h3>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {doc.historico_etapas.map((ev, i) => {
              const cfg = ETAPA_COLORS[ev.etapa] || {};
              return (
                <div key={i} className="flex items-start">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: cfg.text || "#374151" }}>{i + 1}</div>
                    {i < doc.historico_etapas.length - 1 && <div className="w-12 h-0.5 mt-4" style={{ backgroundColor: "#e5e7eb" }} />}
                  </div>
                  {i < doc.historico_etapas.length - 1 && <div className="w-12 h-0.5 mt-4 flex-shrink-0" />}
                  <div className="ml-1 mr-4 min-w-32 flex-shrink-0">
                    <div className="text-xs font-semibold" style={{ color: cfg.text }}>{ev.etapa}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ev.data}</div>
                    {ev.usuario && <div className="text-xs text-gray-400">{ev.usuario}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico de Revisões */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: "#26405d" }}>Histórico de Revisões</h3>
          <Button size="sm" variant="outline" onClick={() => setShowRevModal(true)}>+ Nova Revisão</Button>
        </div>
        {(!doc.historico_revisoes || doc.historico_revisoes.length === 0)
          ? <p className="text-xs text-gray-400 text-center py-4">Nenhuma revisão registrada</p>
          : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">
                {["Revisão", "Data", "Etapa", "Observação"].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {doc.historico_revisoes.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-3 py-2 font-bold text-xs" style={{ color: "#c35e1e" }}>{r.revisao}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{r.data}</td>
                    <td className="px-3 py-2 text-xs">{r.etapa}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{r.observacao || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Modal nova revisão */}
      {showRevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold" style={{ color: "#26405d" }}>Nova Revisão</h3>
              <button onClick={() => setShowRevModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 uppercase block mb-1">Revisão</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={novaRevisao.revisao}
                  onChange={e => setNovaRevisao(f => ({ ...f, revisao: e.target.value }))} placeholder="Rev.04" /></div>
              <div><label className="text-xs text-gray-500 uppercase block mb-1">Data</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={novaRevisao.data}
                  onChange={e => setNovaRevisao(f => ({ ...f, data: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs text-gray-500 uppercase block mb-1">Observação</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={novaRevisao.observacao}
                onChange={e => setNovaRevisao(f => ({ ...f, observacao: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRevModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddRevisao} style={{ backgroundColor: "#26405d" }}><Save className="w-3.5 h-3.5 mr-1" />Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}