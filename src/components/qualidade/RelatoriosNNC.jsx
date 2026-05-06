import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Plus, X, Save, ArrowLeft, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Filter
} from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import InfoTooltip from "@/components/ui/InfoTooltip";
import ConfirmDeleteButton from "@/components/ui/ConfirmDeleteButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DISCIPLINAS = ["Mecânica", "Elétrica", "Estrutura Metálica", "Tubulação", "Civil", "Instrumentação", "Pintura", "Segurança", "Outros"];
const TIPOS = ["Material", "Execução", "Projeto", "Procedimento"];
const STATUS_LIST = ["Aberta", "Em Tratamento", "Verificação", "Encerrada", "Reaberta"];

const SEV_CONFIG = {
  "Menor":   { bg: "#dcfce7", text: "#16a34a", dot: "🟢" },
  "Maior":   { bg: "#fef3c7", text: "#d97706", dot: "🟡" },
  "Crítica": { bg: "#fee2e2", text: "#dc2626", dot: "🔴" },
};

const STATUS_CONFIG = {
  "Aberta":        { bg: "#fee2e2", text: "#dc2626" },
  "Em Tratamento": { bg: "#fef3c7", text: "#d97706" },
  "Verificação":   { bg: "#dbeafe", text: "#2563eb" },
  "Encerrada":     { bg: "#dcfce7", text: "#16a34a" },
  "Reaberta":      { bg: "#fae8ff", text: "#9333ea" },
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function RNCForm({ rnc, onSave, onClose }) {
  const { selectedProjectId } = useProject();
  const totalRncs = 0;
  const [form, setForm] = useState(rnc || {
    titulo: "", data_abertura: new Date().toISOString().split("T")[0], disciplina: "Mecânica",
    area_local: "", fornecedor: "", tipo: "Execução", severidade: "Menor", descricao: "",
    norma_violada: "", responsavel_tratamento: "", prazo_resolucao: "", acao_corretiva: "",
    acao_preventiva: "", verificador: "", parecer_verificacao: "", comentarios_verificacao: "",
    data_encerramento: "", status: "Aberta"
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold" style={{ color: "#26405d" }}>{rnc ? `Editar RNC — ${rnc.numero}` : "Nova Não Conformidade"}</h3>
          <CloseButton onClick={onClose} />
        </div>
        <div className="p-6 space-y-6">
          {/* Seção 1: Identificação */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color: "#c35e1e" }}>1. Identificação</div>
            <div className="space-y-3">
              <Field label="Título *"><input className={inputCls} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Descrição curta da não conformidade" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data de Abertura"><input type="date" className={inputCls} value={form.data_abertura} onChange={e => set("data_abertura", e.target.value)} /></Field>
                <Field label="Disciplina">
                  <select className={selectCls} value={form.disciplina} onChange={e => set("disciplina", e.target.value)}>
                    {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Área / Local"><input className={inputCls} value={form.area_local} onChange={e => set("area_local", e.target.value)} placeholder="Ex: Bloco A - 3º Pavimento" /></Field>
                <Field label="Fornecedor"><input className={inputCls} value={form.fornecedor} onChange={e => set("fornecedor", e.target.value)} placeholder="Empresa responsável" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select className={selectCls} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label={<span className="flex items-center">Severidade<InfoTooltip text="Menor: desvio cosmético sem impacto funcional. Maior: desvio com impacto operacional. Crítica: risco de segurança ou falha sistêmica." /></span>}>
                  <select className={selectCls} value={form.severidade} onChange={e => set("severidade", e.target.value)}>
                    {["Menor", "Maior", "Crítica"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Status">
                <select className={selectCls} value={form.status} onChange={e => set("status", e.target.value)}>
                  {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Seção 2: Descrição */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color: "#c35e1e" }}>2. Descrição e Evidências</div>
            <div className="space-y-3">
              <Field label="Descrição detalhada">
                <textarea className={inputCls} rows={4} value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Descreva a não conformidade em detalhes..." />
              </Field>
              <Field label={<span className="flex items-center">Norma / Especificação violada<InfoTooltip text="Cite a norma, procedimento ou especificação técnica que foi descumprida. Ex: ABNT NBR 6118, ISO 9001:2015, PRC-ENG-001." /></span>}>
                <input className={inputCls} value={form.norma_violada} onChange={e => set("norma_violada", e.target.value)} placeholder="Ex: NBR 6118, ISO 9001..." />
              </Field>
            </div>
          </div>

          {/* Seção 3: Tratamento */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color: "#c35e1e" }}>3. Tratamento</div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Responsável pelo Tratamento"><input className={inputCls} value={form.responsavel_tratamento} onChange={e => set("responsavel_tratamento", e.target.value)} /></Field>
                <Field label="Prazo para Resolução"><input type="date" className={inputCls} value={form.prazo_resolucao} onChange={e => set("prazo_resolucao", e.target.value)} /></Field>
              </div>
              <Field label="Ação Corretiva Proposta">
                <textarea className={inputCls} rows={3} value={form.acao_corretiva} onChange={e => set("acao_corretiva", e.target.value)} placeholder="Descreva a ação corretiva..." />
              </Field>
              <Field label="Ação Preventiva (opcional)">
                <textarea className={inputCls} rows={2} value={form.acao_preventiva} onChange={e => set("acao_preventiva", e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Seção 4: Verificação */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color: "#c35e1e" }}>4. Verificação e Encerramento</div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Verificador"><input className={inputCls} value={form.verificador} onChange={e => set("verificador", e.target.value)} /></Field>
                <Field label="Parecer">
                  <select className={selectCls} value={form.parecer_verificacao} onChange={e => set("parecer_verificacao", e.target.value)}>
                    <option value="">Selecione...</option>
                    <option>Aprovado</option>
                    <option>Reprovado</option>
                  </select>
                </Field>
              </div>
              <Field label="Comentários de Verificação">
                <textarea className={inputCls} rows={2} value={form.comentarios_verificacao} onChange={e => set("comentarios_verificacao", e.target.value)} />
              </Field>
              <Field label="Data de Encerramento"><input type="date" className={inputCls} value={form.data_encerramento} onChange={e => set("data_encerramento", e.target.value)} /></Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave(form)} className="bg-brand-accent hover:opacity-90 text-white">
              <Save className="w-4 h-4 mr-1" />Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RNCDetalhe({ rnc, onBack, onEdit }) {
  const sev = SEV_CONFIG[rnc.severidade] || {};
  const st = STATUS_CONFIG[rnc.status] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />Voltar
        </button>
        <div className="flex-1" />
        <Button size="sm" onClick={onEdit} variant="outline">Editar</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-bold" style={{ color: "#c35e1e" }}>{rnc.numero}</div>
            <h2 className="text-xl font-bold mt-1" style={{ color: "#26405d" }}>{rnc.titulo}</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-semibold rounded-full px-3 py-1" style={{ backgroundColor: sev.bg, color: sev.text }}>{sev.dot} {rnc.severidade}</span>
            <span className="text-sm font-semibold rounded-full px-3 py-1" style={{ backgroundColor: st.bg, color: st.text }}>{rnc.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: "Disciplina", value: rnc.disciplina },
            { label: "Tipo", value: rnc.tipo },
            { label: "Fornecedor", value: rnc.fornecedor || "—" },
            { label: "Área / Local", value: rnc.area_local || "—" },
            { label: "Data Abertura", value: rnc.data_abertura || "—" },
            { label: "Prazo Resolução", value: rnc.prazo_resolucao || "—" },
            { label: "Responsável", value: rnc.responsavel_tratamento || "—" },
            { label: "Verificador", value: rnc.verificador || "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
              <div className="font-medium text-gray-700 mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {rnc.descricao && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#26405d" }}>Descrição</div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{rnc.descricao}</p>
          </div>
        )}
        {rnc.norma_violada && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#26405d" }}>Norma / Especificação Violada</div>
            <p className="text-sm text-gray-700">{rnc.norma_violada}</p>
          </div>
        )}
        {rnc.acao_corretiva && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#26405d" }}>Ação Corretiva</div>
            <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">{rnc.acao_corretiva}</p>
          </div>
        )}
        {rnc.comentarios_verificacao && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#26405d" }}>Comentários de Verificação</div>
            <p className="text-sm text-gray-700">{rnc.comentarios_verificacao}</p>
          </div>
        )}

        {/* Timeline */}
        {rnc.timeline && rnc.timeline.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#26405d" }}>Timeline</div>
            <div className="space-y-3">
              {rnc.timeline.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: "#c35e1e" }} />
                    {i < rnc.timeline.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: "#e5e7eb" }} />}
                  </div>
                  <div className="pb-3">
                    <div className="text-xs text-gray-400">{ev.data}</div>
                    <div className="text-sm font-medium text-gray-700">{ev.acao}</div>
                    {ev.autor && <div className="text-xs text-gray-500">por {ev.autor}</div>}
                    {ev.comentario && <div className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">{ev.comentario}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RelatoriosNNC() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRnc, setEditingRnc] = useState(null);
  const [selectedRnc, setSelectedRnc] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroSev, setFiltroSev] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("");

  const { data: rncs = [], isLoading } = useQuery({
    queryKey: ["rncs", selectedProjectId],
    queryFn: () => entities.RNC.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const num = `RNC-${new Date().getFullYear()}-${String(rncs.length + 1).padStart(3, "0")}`;
      return entities.RNC.create({ ...data, projeto_id: selectedProjectId, numero: num, timeline: [{ data: data.data_abertura, autor: "Sistema", acao: "RNC aberta" }] });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rncs"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.RNC.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rncs"] }); setShowForm(false); setEditingRnc(null); if (selectedRnc) { setSelectedRnc(null); } },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.RNC.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rncs"] }),
  });

  const handleSave = (data) => {
    if (editingRnc) updateMutation.mutate({ id: editingRnc.id, data });
    else createMutation.mutate(data);
  };

  const effectiveRncs = rncs;
  const today = new Date().toISOString().split("T")[0];
  const vencidas = effectiveRncs.filter(r => r.prazo_resolucao && r.prazo_resolucao < today && !["Encerrada"].includes(r.status));

  const filtered = effectiveRncs
    .filter(r => !filtroStatus || r.status === filtroStatus)
    .filter(r => !filtroSev || r.severidade === filtroSev)
    .filter(r => !filtroDisciplina || r.disciplina === filtroDisciplina);

  if (selectedRnc) {
    return (
      <RNCDetalhe
        rnc={selectedRnc}
        onBack={() => setSelectedRnc(null)}
        onEdit={() => { setEditingRnc(selectedRnc); setShowForm(true); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de RNCs", value: effectiveRncs.length, color: "#26405d", icon: AlertTriangle },
            { label: "Abertas", value: effectiveRncs.filter(r => r.status === "Aberta").length, color: "#dc2626", icon: XCircle },
            { label: "Em Tratamento", value: effectiveRncs.filter(r => r.status === "Em Tratamento").length, color: "#d97706", icon: Clock },
            { label: "Vencidas", value: vencidas.length, color: "#9333ea", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="bg-white shadow-sm border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros + Botão */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroSev} onChange={e => setFiltroSev(e.target.value)}>
            <option value="">Todas Severidades</option>
            {["Menor", "Maior", "Crítica"].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroDisciplina} onChange={e => setFiltroDisciplina(e.target.value)}>
            <option value="">Todas Disciplinas</option>
            {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <Button onClick={() => { setEditingRnc(null); setShowForm(true); }} style={{ backgroundColor: "#c35e1e" }}>
          <Plus className="w-4 h-4 mr-2" />Nova RNC
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nº RNC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Disciplina</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Severidade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prazo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Responsável</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Nenhuma RNC registrada</td></tr>
              )}
              {filtered.map((r, i) => {
                const sev = SEV_CONFIG[r.severidade] || {};
                const st = STATUS_CONFIG[r.status] || {};
                const vencida = r.prazo_resolucao && r.prazo_resolucao < today && !["Encerrada"].includes(r.status);
                return (
                  <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`} onClick={() => setSelectedRnc(r)}>
                    <td className="px-4 py-3 font-bold text-xs" style={{ color: "#c35e1e" }}>{r.numero || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-700 max-w-48 truncate">{r.titulo}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">{r.disciplina}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.fornecedor || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: sev.bg, color: sev.text }}>{sev.dot} {r.severidade}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: st.bg, color: st.text }}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: vencida ? "#dc2626" : "#374151", fontWeight: vencida ? "bold" : "normal" }}>
                      {r.prazo_resolucao || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.responsavel_tratamento || "—"}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <ConfirmDeleteButton size="sm" onConfirm={() => deleteMutation.mutate(r.id)} description="A RNC será excluída permanentemente." />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <RNCForm
          rnc={editingRnc}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRnc(null); }}
        />
      )}
    </div>
  );
}