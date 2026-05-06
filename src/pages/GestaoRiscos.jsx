import React, { useState } from "react";
import { ShieldAlert, Plus, X, AlertTriangle, CheckCircle, Clock, Filter, Pencil, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

const PROB_MAP = { "Alta": 3, "Média": 2, "Baixa": 1 };
const IMP_MAP  = { "Alto": 3, "Médio": 2, "Baixo": 1 };

const SCORE_COLOR = (score) => {
  if (score >= 7) return { bg: "#fee2e2", text: "#dc2626", label: "Crítico" };
  if (score >= 4) return { bg: "#fef3c7", text: "#d97706", label: "Moderado" };
  return { bg: "#dcfce7", text: "#16a34a", label: "Baixo" };
};

const STATUS_STYLE = {
  "Ativo": { bg: "#fee2e2", text: "#dc2626" },
  "Em Monitoramento": { bg: "#fef3c7", text: "#d97706" },
  "Encerrado": { bg: "#dcfce7", text: "#16a34a" },
};

const CATEGORIAS = ["Todas", "Suprimentos", "Financeiro", "Construção", "Engenharia", "Qualidade/SSMA", "Contratos"];

function MatrizRisco({ risks }) {
  const PROBS = ["Alta", "Média", "Baixa"];
  const IMPS  = ["Baixo", "Médio", "Alto"];

  const cellRisks = (prob, imp) =>
    risks.filter(r => r.probabilidade === prob && r.impacto === imp && r.status !== "Encerrado");

  const cellColor = (prob, imp) => {
    const score = PROB_MAP[prob] * IMP_MAP[imp];
    if (score >= 6) return "#fca5a5";
    if (score >= 3) return "#fde68a";
    return "#86efac";
  };

  return (
    <div className="overflow-x-auto">
      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Matriz de Probabilidade × Impacto</div>
      <table className="border-collapse text-xs w-full max-w-lg">
        <thead>
          <tr>
            <th className="p-2 text-gray-500 w-20 text-right pr-3">Prob. ↓ / Imp. →</th>
            {IMPS.map(i => <th key={i} className="p-2 text-center font-semibold text-gray-600 w-28">{i}</th>)}
          </tr>
        </thead>
        <tbody>
          {PROBS.map(prob => (
            <tr key={prob}>
              <td className="p-2 text-right pr-3 font-semibold text-gray-600">{prob}</td>
              {IMPS.map(imp => {
                const cell = cellRisks(prob, imp);
                return (
                  <td key={imp} className="p-2 border border-white rounded-lg" style={{ backgroundColor: cellColor(prob, imp), minWidth: 90 }}>
                    <div className="flex flex-wrap gap-1 justify-center min-h-8 items-center">
                      {cell.map(r => (
                        <span key={r.id} className="bg-white/80 rounded px-1.5 py-0.5 font-bold text-gray-700 text-xs shadow-sm">{r.codigo}</span>
                      ))}
                      {cell.length === 0 && <span className="text-gray-300">—</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const RISK_DEFAULTS = { codigo: "", descricao: "", categoria: "Construção", probabilidade: "Média", impacto: "Médio", status: "Ativo", responsavel: "", mitigacao: "", residual: "Médio" };

function RiskForm({ risk, onSave, onClose }) {
  const [form, setForm] = useState(risk || RISK_DEFAULTS);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const score = (PROB_MAP[form.probabilidade] || 2) * (IMP_MAP[form.impacto] || 2);
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100";
  const selectCls = `${inputCls} bg-white`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-brand-primary">{risk ? "Editar Risco" : "Novo Risco"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Código</label>
              <input className={inputCls} placeholder="R-001" value={form.codigo} onChange={e => set("codigo", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
              <select className={selectCls} value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                {CATEGORIAS.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
            <textarea className={inputCls} rows={3} placeholder="Descreva o risco..." value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Probabilidade</label>
              <select className={selectCls} value={form.probabilidade} onChange={e => set("probabilidade", e.target.value)}>
                {["Alta", "Média", "Baixa"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Impacto</label>
              <select className={selectCls} value={form.impacto} onChange={e => set("impacto", e.target.value)}>
                {["Alto", "Médio", "Baixo"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Score</label>
              <div className="px-3 py-2 rounded-lg text-sm font-bold text-white text-center" style={{ backgroundColor: score >= 7 ? "#dc2626" : score >= 4 ? "#d97706" : "#16a34a" }}>{score}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select className={selectCls} value={form.status} onChange={e => set("status", e.target.value)}>
                {["Ativo", "Em Monitoramento", "Encerrado"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Risco Residual</label>
              <select className={selectCls} value={form.residual} onChange={e => set("residual", e.target.value)}>
                {["Alto", "Médio", "Baixo"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Responsável</label>
            <input className={inputCls} placeholder="Nome do responsável" value={form.responsavel} onChange={e => set("responsavel", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Plano de Mitigação</label>
            <textarea className={inputCls} rows={3} placeholder="Ações para mitigar o risco..." value={form.mitigacao} onChange={e => set("mitigacao", e.target.value)} />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onSave({ ...form, score })} className="px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 bg-brand-primary hover:opacity-90">
            <Save className="w-4 h-4" />Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestaoRiscos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editRisk, setEditRisk] = useState(null);

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ["riscos", selectedProjectId],
    queryFn: () => entities.Risco.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Risco.create({ ...data, projeto_id: selectedProjectId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["riscos"] }); setShowForm(false); setEditRisk(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Risco.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["riscos"] }); setShowForm(false); setEditRisk(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Risco.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["riscos"] }); if (selectedRisk?.id) setSelectedRisk(null); },
  });

  const saveRisk = (form) => {
    if (editRisk) updateMutation.mutate({ id: editRisk.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = risks.filter(r => {
    const cat = filtroCategoria === "Todas" || r.categoria === filtroCategoria;
    const st = filtroStatus === "Todos" || r.status === filtroStatus;
    return cat && st;
  });

  const ativos = risks.filter(r => r.status === "Ativo").length;
  const criticos = risks.filter(r => r.score >= 7 && r.status !== "Encerrado").length;
  const monitoramento = risks.filter(r => r.status === "Em Monitoramento").length;
  const encerrados = risks.filter(r => r.status === "Encerrado").length;

  if (!selectedProjectId) {
    return <PageEmptyState icon={ShieldAlert} description="Selecione um projeto no menu lateral para gerenciar riscos." />;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400 text-sm">Carregando riscos...</div>;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Riscos Ativos", value: ativos, icon: ShieldAlert, color: "#dc2626", bg: "#fee2e2" },
          { label: "Críticos", value: criticos, icon: AlertTriangle, color: "#d97706", bg: "#fef3c7" },
          { label: "Em Monitoramento", value: monitoramento, icon: Clock, color: "#2563eb", bg: "#dbeafe" },
          { label: "Encerrados", value: encerrados, icon: CheckCircle, color: "#16a34a", bg: "#dcfce7" },
        ].map(k => (
          <Card key={k.label} className="bg-white shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: k.bg }}>
                <k.icon className="w-6 h-6" style={{ color: k.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-primary">{k.value}</div>
                <div className="text-xs text-gray-500">{k.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Matriz + Legenda */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <MatrizRisco risks={risks} />
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Legenda de Classificação</div>
              <div className="space-y-2">
                {[
                  { label: "Crítico (score ≥ 7)", color: "#fca5a5", text: "#dc2626" },
                  { label: "Moderado (score 4–6)", color: "#fde68a", text: "#d97706" },
                  { label: "Baixo (score ≤ 3)", color: "#86efac", text: "#16a34a" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: l.color }} />
                    <span className="text-sm font-medium" style={{ color: l.text }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Distribuição por Categoria</div>
              <div className="space-y-1.5">
                {CATEGORIAS.filter(c => c !== "Todas").map(cat => {
                  const count = risks.filter(r => r.categoria === cat && r.status !== "Encerrado").length;
                  if (!count) return null;
                  const total = risks.filter(r => r.status !== "Encerrado").length || 1;
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <div className="flex-1 text-sm text-gray-600">{cat}</div>
                      <div className="h-2 rounded-full bg-gray-100 flex-1 overflow-hidden">
                        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registro de Riscos */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-base font-bold text-brand-primary">Registro de Riscos</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-400" />
              <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                {["Todos", "Ativo", "Em Monitoramento", "Encerrado"].map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => { setEditRisk(null); setShowForm(true); }} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1 bg-brand-primary hover:opacity-90">
                <Plus className="w-3 h-3" /> Novo Risco
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {risks.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              Nenhum risco registrado para este projeto.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Código", "Descrição", "Categoria", "Prob.", "Impacto", "Score", "Responsável", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const sc = SCORE_COLOR(r.score);
                    const st = STATUS_STYLE[r.status] || {};
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        style={{ backgroundColor: selectedRisk?.id === r.id ? "#f0f4f8" : "" }}
                        onClick={() => setSelectedRisk(selectedRisk?.id === r.id ? null : r)}
                      >
                        <td className="px-4 py-3 font-bold text-xs text-brand-primary">{r.codigo}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs">
                          <span className="line-clamp-2">{r.descricao}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap">{r.categoria}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-600">{r.probabilidade}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-600">{r.impacto}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold" style={{ backgroundColor: sc.bg, color: sc.text }}>{r.score}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{r.responsavel}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: st.bg, color: st.text }}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditRisk(r); setShowForm(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteMutation.mutate(r.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Detalhe do risco selecionado */}
          {selectedRisk && (
            <div className="mx-4 mb-4 mt-2 p-4 rounded-xl border border-blue-100 bg-blue-50 relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setSelectedRisk(null)}>
                <X className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold mb-1 text-brand-primary">{selectedRisk.codigo} — Plano de Mitigação</div>
              <p className="text-sm text-gray-700 mb-2"><span className="font-semibold">Ação:</span> {selectedRisk.mitigacao}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Risco Residual:</span>{" "}
                <span className="font-bold" style={{ color: selectedRisk.residual === "Baixo" ? "#16a34a" : "#d97706" }}>{selectedRisk.residual}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && <RiskForm risk={editRisk} onSave={saveRisk} onClose={() => { setShowForm(false); setEditRisk(null); }} />}
      </div>
    </div>
  );
}
