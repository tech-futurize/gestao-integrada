import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle, TrendingUp, Clock, ChevronUp, ChevronDown, ChevronsUpDown, LayoutGrid, Kanban } from "lucide-react";

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

const PRIO_ICONS = { Alta: "↑", Média: "→", Baixa: "↓" };
const PRIO_COLORS = { Alta: "#dc2626", Média: "#d97706", Baixa: "#16a34a" };

function RiskDot({ deadline, progresso }) {
  const today = new Date();
  const dl = deadline ? new Date(deadline) : null;
  if (!dl) return <span>⚪</span>;
  const daysLeft = Math.ceil((dl - today) / 86400000);
  if (daysLeft < 0) return <span title="Vencido">🔴</span>;
  if (daysLeft < 30 && progresso < 80) return <span title="Atenção">🟡</span>;
  return <span title="OK">🟢</span>;
}

function ProgressBar({ pct }) {
  const color = "#16a34a"; // always green
  return (
    <div className="flex items-center gap-2 min-w-28">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-9 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 text-gray-300" />;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
}

export default function DocGrid({ docs, onSelectDoc, onSwitchView }) {
  const [busca, setBusca] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [sortCol, setSortCol] = useState("tag_id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const today = new Date().toISOString().split("T")[0];
  const overdue = docs.filter(d => d.deadline && d.deadline < today && d.etapa !== "Aprovado");
  const totalSheets = docs.reduce((s, d) => s + (d.num_folhas || 0), 0);
  const progGeral = docs.length ? Math.round(docs.reduce((s, d) => s + (d.progresso || 0), 0) / docs.length) : 0;

  const fornecedores = [...new Set(docs.map(d => d.fornecedor).filter(Boolean))];
  const disciplinas = [...new Set(docs.map(d => d.disciplina).filter(Boolean))];

  const filtered = useMemo(() => {
    let r = docs;
    if (busca) { const b = busca.toLowerCase(); r = r.filter(d => d.tag_id?.toLowerCase().includes(b) || d.titulo?.toLowerCase().includes(b)); }
    if (filtroDisciplina) r = r.filter(d => d.disciplina === filtroDisciplina);
    if (filtroFornecedor) r = r.filter(d => d.fornecedor === filtroFornecedor);
    return [...r].sort((a, b) => {
      const av = a[sortCol] ?? ""; const bv = b[sortCol] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [docs, busca, filtroDisciplina, filtroFornecedor, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Docs", value: docs.length, sub: `${docs.filter(d => d.etapa === "Aprovado").length} aprovados`, color: "#26405d", icon: FileText },
          { label: "Total Sheets", value: `${totalSheets >= 1000 ? (totalSheets/1000).toFixed(1)+"k" : totalSheets} A4`, sub: "folhas equivalentes", color: "#2563eb", icon: FileText },
          { label: "Progresso Geral", value: `${progGeral}%`, sub: <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{width:`${progGeral}%`}}/></div>, color: "#16a34a", icon: TrendingUp },
          { label: "Overdue", value: overdue.length, sub: overdue.length > 0 ? "⚠ documentos vencidos" : "Nenhum vencido", color: overdue.length > 0 ? "#dc2626" : "#16a34a", icon: AlertTriangle },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <Card key={label} className="bg-white shadow-sm border-0">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "18" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
                <div className="text-xs text-gray-400">{sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros + Toggle */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56" placeholder="Buscar TAG/ID ou título..."
            value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} />
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroDisciplina} onChange={e => { setFiltroDisciplina(e.target.value); setPage(1); }}>
            <option value="">Todas Disciplinas</option>
            {disciplinas.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroFornecedor} onChange={e => { setFiltroFornecedor(e.target.value); setPage(1); }}>
            <option value="">Todos Fornecedores</option>
            {fornecedores.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button className="px-3 py-1.5 text-sm font-medium bg-gray-800 text-white flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4" />Grid
            </button>
            <button onClick={() => onSwitchView("kanban")} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              <Kanban className="w-4 h-4" />Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {[
                 { key: "tag_id", label: "TAG / ID" },
                 { key: "titulo", label: "Título" },
                 { key: "disciplina", label: "Disc." },
                 { key: "fornecedor", label: "Fornecedor" },
                 { key: "num_folhas", label: "A4" },
                 { key: "progresso", label: "Progresso" },
                 { key: "etapa", label: "Etapa" },
                 { key: "deadline", label: "Deadline" },
                ].map(({ key, label }) => (
                 <th key={key} onClick={() => handleSort(key)}
                   className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap cursor-pointer hover:text-gray-700">
                   {label}<SortIcon col={key} sortCol={sortCol} sortDir={sortDir} />
                 </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Nenhum documento encontrado</td></tr>}
              {paginated.map((doc, i) => {
                const stEtapa = ETAPA_COLORS[doc.etapa] || {};
                const vencido = doc.deadline && doc.deadline < today && doc.etapa !== "Aprovado";
                return (
                  <tr key={doc.id} onClick={() => onSelectDoc(doc)}
                    className={`border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                    <td className="px-3 py-2.5 font-bold text-xs whitespace-nowrap" style={{ color: "#111827" }}>{doc.tag_id}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-700 max-w-xs">
                      <span className="line-clamp-1">{doc.titulo}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-bold rounded px-1.5 py-0.5 text-white" style={{ backgroundColor: DISC_COLORS[doc.disciplina] || "#374151" }}>{doc.disciplina}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{doc.fornecedor || "—"}</td>
                    <td className="px-3 py-2.5 text-center text-xs font-medium">{doc.num_folhas || "—"}</td>
                    <td className="px-3 py-2.5"><ProgressBar pct={doc.progresso || 0} /></td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: stEtapa.bg, color: stEtapa.text }}>{doc.etapa}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: vencido ? "#dc2626" : "#374151", fontWeight: vencido ? "bold" : "normal" }}>
                      {vencido && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {doc.deadline ? doc.deadline.split("-").reverse().join("/").slice(0,8) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          <span>Mostrando {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} itens</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-white">‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-2 py-1 rounded border ${p === page ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:bg-white"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-white">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}