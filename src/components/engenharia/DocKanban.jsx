import React, { useState } from "react";
import { AlertTriangle, FileText, LayoutGrid, Kanban } from "lucide-react";

const ETAPAS = ["A Emitir", "Em Elaboração", "Em Verificação Técnica", "Comentários do Cliente", "Aprovado"];

const DISC_COLORS = {
  MEC: "#3b82f6", CIV: "#8b5cf6", ELE: "#f59e0b", TUB: "#06b6d4",
  INS: "#10b981", AUT: "#ef4444", EST: "#6366f1", PRC: "#ec4899", HSE: "#84cc16",
};

const ETAPA_HEADER_COLORS = {
  "A Emitir": "#6b7280",
  "Em Elaboração": "#2563eb",
  "Em Verificação Técnica": "#d97706",
  "Comentários do Cliente": "#9333ea",
  "Aprovado": "#16a34a",
};

function DocCard({ doc, onSelect, onDragStart }) {
  const today = new Date().toISOString().split("T")[0];
  const vencido = doc.deadline && doc.deadline < today && doc.etapa !== "Aprovado";
  const discColor = DISC_COLORS[doc.disciplina] || "#374151";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(doc)}
      onClick={() => onSelect(doc)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Color bar top */}
      <div className="h-1.5" style={{ backgroundColor: discColor }} />
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-bold" style={{ color: discColor }}>{doc.tag_id}</span>
          <span className="text-xs font-bold rounded px-1.5 py-0.5 text-white flex-shrink-0" style={{ backgroundColor: discColor }}>{doc.disciplina}</span>
        </div>
        <p className="text-xs font-medium text-gray-700 leading-tight line-clamp-2">{doc.titulo}</p>
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(doc.progresso || 0, 100)}%`, backgroundColor: (doc.progresso || 0) >= 70 ? "#16a34a" : (doc.progresso || 0) >= 40 ? "#d97706" : "#dc2626" }} />
          </div>
          <span className="text-xs text-gray-500 w-8 text-right">{doc.progresso || 0}%</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{doc.num_folhas || 0}</span>
          <span className="truncate max-w-24 text-right">{doc.fornecedor || "—"}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span />
          <span className={`flex items-center gap-0.5 font-medium ${vencido ? "text-red-600" : "text-gray-500"}`}>
            {vencido && <AlertTriangle className="w-3 h-3" />}{doc.deadline || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DocKanban({ docs, onSelectDoc, onSwitchView, onMoveDoc }) {
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [dragDoc, setDragDoc] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const disciplinas = [...new Set(docs.map(d => d.disciplina).filter(Boolean))];
  const fornecedores = [...new Set(docs.map(d => d.fornecedor).filter(Boolean))];

  const filtered = docs
    .filter(d => !filtroDisciplina || d.disciplina === filtroDisciplina)
    .filter(d => !filtroFornecedor || d.fornecedor === filtroFornecedor);

  const handleDrop = (etapa) => {
    if (dragDoc && dragDoc.etapa !== etapa) {
      onMoveDoc(dragDoc.id, etapa);
    }
    setDragDoc(null);
    setDragOver(null);
  };

  return (
    <div className="space-y-4">
      {/* Filtros + toggle */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroDisciplina} onChange={e => setFiltroDisciplina(e.target.value)}>
            <option value="">Todas Disciplinas</option>
            {disciplinas.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroFornecedor} onChange={e => setFiltroFornecedor(e.target.value)}>
            <option value="">Todos Fornecedores</option>
            {fornecedores.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => onSwitchView("grid")} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4" />Grid
          </button>
          <button className="px-3 py-1.5 text-sm font-medium bg-gray-800 text-white flex items-center gap-1.5">
            <Kanban className="w-4 h-4" />Kanban
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ETAPAS.map(etapa => {
          const colDocs = filtered.filter(d => d.etapa === etapa);
          const totalSheets = colDocs.reduce((s, d) => s + (d.num_folhas || 0), 0);
          const headerColor = ETAPA_HEADER_COLORS[etapa];
          const isOver = dragOver === etapa;

          return (
            <div key={etapa}
              className="flex-shrink-0 w-64 flex flex-col"
              onDragOver={e => { e.preventDefault(); setDragOver(etapa); }}
              onDrop={() => handleDrop(etapa)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Column header */}
              <div className="rounded-t-xl p-3 mb-2" style={{ backgroundColor: headerColor + "15", borderLeft: `3px solid ${headerColor}` }}>
                <div className="font-semibold text-sm" style={{ color: headerColor }}>{etapa}</div>
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-bold">{colDocs.length} docs</span>
                  <span>|</span>
                  <span>{totalSheets} A4</span>
                </div>
              </div>

              {/* Cards */}
              <div className={`flex-1 min-h-24 space-y-2 p-2 rounded-xl transition-colors ${isOver ? "bg-blue-50 border-2 border-dashed border-blue-300" : "bg-gray-100/50"}`}>
                {colDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} onSelect={onSelectDoc} onDragStart={setDragDoc} />
                ))}
                {colDocs.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-6">Sem documentos</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}