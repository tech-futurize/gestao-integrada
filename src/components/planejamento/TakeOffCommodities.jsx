import React, { useState, useMemo } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart2, Plus, ArrowLeft, ChevronUp, ChevronDown, ChevronsUpDown,
  Save, X, Edit, Trash2, TrendingUp, AlertTriangle, CheckCircle, XCircle
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";

const DISCIPLINAS = ["Civil", "Mecânica", "Tubulação", "Elétrica", "Estrutura Metálica", "Instrumentação", "Pintura", "Outros"];
const UNIDADES = ["m³", "kg", "m", "un", "m²", "ton", "l", "hr"];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200";

function calcStatus(realizado, contrato) {
  if (!contrato) return "Normal";
  const pct = (realizado / contrato) * 100;
  if (pct > 100) return "Excedido";
  if (pct >= 95) return "Crítico";
  if (pct >= 80) return "Atenção";
  return "Normal";
}

const STATUS_CFG = {
  "Normal":   { bg: "#dcfce7", text: "#16a34a", bar: "#16a34a" },
  "Atenção":  { bg: "#fef3c7", text: "#d97706", bar: "#d97706" },
  "Crítico":  { bg: "#fee2e2", text: "#dc2626", bar: "#dc2626" },
  "Excedido": { bg: "#f3e8ff", text: "#9333ea", bar: "#9333ea" },
};

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ── MODAL ITEM ─────────────────────────────────────────────────────────────────
function ItemModal({ item, onSave, onClose, totalItems }) {
  const [form, setForm] = useState(item || {
    codigo: `COM-${String(totalItems + 1).padStart(3, "0")}`,
    descricao: "", disciplina: "Civil", unidade: "m³", qtd_contrato: "", qtd_takeoff: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold" style={{ color: "#26405d" }}>{item ? "Editar Item" : "Novo Item"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código"><input className={inputCls} value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="COM-001" /></Field>
            <Field label="Disciplina">
              <select className={selectCls} value={form.disciplina} onChange={e => set("disciplina", e.target.value)}>
                {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Descrição *"><input className={inputCls} value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Concreto Estrutural FCK 30" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Unidade">
              <select className={selectCls} value={form.unidade} onChange={e => set("unidade", e.target.value)}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Qtd. Contrato *"><input type="number" className={inputCls} value={form.qtd_contrato} onChange={e => set("qtd_contrato", e.target.value)} /></Field>
            <Field label="Qtd. Take-Off"><input type="number" className={inputCls} value={form.qtd_takeoff} onChange={e => set("qtd_takeoff", e.target.value)} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave({ ...form, qtd_contrato: Number(form.qtd_contrato), qtd_takeoff: Number(form.qtd_takeoff) || null })}
              style={{ backgroundColor: "#c35e1e" }}>
              <Save className="w-4 h-4 mr-1" />Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODAL LANÇAMENTO ───────────────────────────────────────────────────────────
function LancamentoModal({ commodityId, projetoId, lancamento, onSave, onClose, lancamentos }) {
  const nextSemana = `S${String(lancamentos.length + 1).padStart(2, "0")}`;
  const [form, setForm] = useState(lancamento || {
    semana: nextSemana, data_inicio: "", data_fim: "", quantidade: "", responsavel: "", observacao: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold" style={{ color: "#26405d" }}>{lancamento ? "Editar Lançamento" : "Lançar Realizado"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Semana"><input className={inputCls} value={form.semana} onChange={e => set("semana", e.target.value)} placeholder="S01" /></Field>
            <Field label="Data Início"><input type="date" className={inputCls} value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} /></Field>
            <Field label="Data Fim"><input type="date" className={inputCls} value={form.data_fim} onChange={e => set("data_fim", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade *"><input type="number" className={inputCls} value={form.quantidade} onChange={e => set("quantidade", e.target.value)} /></Field>
            <Field label="Responsável"><input className={inputCls} value={form.responsavel} onChange={e => set("responsavel", e.target.value)} /></Field>
          </div>
          <Field label="Observação"><input className={inputCls} value={form.observacao} onChange={e => set("observacao", e.target.value)} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave({ ...form, quantidade: Number(form.quantidade), commodity_id: commodityId, projeto_id: projetoId })}
              style={{ backgroundColor: "#26405d" }}>
              <Save className="w-4 h-4 mr-1" />Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DETALHE ITEM ───────────────────────────────────────────────────────────────
function ItemDetalhe({ item, lancamentos, projetoId, onBack, onAddLancamento, onEditLancamento, onDeleteLancamento }) {
  const sorted = [...lancamentos].sort((a, b) => a.semana.localeCompare(b.semana));
  let acumulado = 0;
  const lancSorted = sorted.map(l => {
    acumulado += l.quantidade;
    return { ...l, acumulado };
  });

  const realizado = lancamentos.reduce((s, l) => s + l.quantidade, 0);
  const saldo = item.qtd_contrato - realizado;
  const pct = item.qtd_contrato > 0 ? ((realizado / item.qtd_contrato) * 100).toFixed(1) : 0;
  const status = calcStatus(realizado, item.qtd_contrato);
  const stCfg = STATUS_CFG[status];

  // Chart data: previsto linear vs realizado acumulado
  const totalSemanas = Math.max(lancSorted.length + 2, 6);
  const chartData = Array.from({ length: totalSemanas }, (_, i) => {
    const semIdx = i + 1;
    const semLabel = `S${String(semIdx).padStart(2, "0")}`;
    const previsto = (item.qtd_contrato / totalSemanas) * semIdx;
    const lanc = lancSorted.find(l => l.semana === semLabel);
    return { semana: semLabel, previsto: Math.round(previsto * 10) / 10, realizado: lanc ? lanc.acumulado : null };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />Voltar à lista
        </button>
      </div>

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-bold" style={{ color: "#c35e1e" }}>{item.codigo}</div>
            <h2 className="text-xl font-bold mt-1" style={{ color: "#26405d" }}>{item.descricao}</h2>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">{item.disciplina}</span>
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{item.unidade}</span>
            </div>
          </div>
          <span className="text-sm font-semibold rounded-full px-3 py-1" style={{ backgroundColor: stCfg.bg, color: stCfg.text }}>{status}</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {[
            { label: "Qtd. Contrato", value: item.qtd_contrato?.toLocaleString("pt-BR"), color: "#26405d" },
            { label: "Qtd. Take-Off", value: item.qtd_takeoff ? item.qtd_takeoff.toLocaleString("pt-BR") : "—", color: "#6b7280" },
            { label: "Qtd. Realizado", value: realizado.toLocaleString("pt-BR"), color: "#c35e1e" },
            { label: "Saldo", value: saldo.toLocaleString("pt-BR"), color: saldo >= 0 ? "#16a34a" : "#dc2626" },
            { label: "% Avanço", value: `${pct}%`, color: stCfg.text },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className="text-lg font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progresso</span><span>{pct}%</span></div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: stCfg.bar }} />
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold mb-4" style={{ color: "#26405d" }}>Curva de Evolução</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#26405d" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#26405d" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c35e1e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#c35e1e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="previsto" stroke="#26405d" fill="url(#gradPrev)" strokeWidth={2} name="Previsto" dot={false} />
            <Area type="monotone" dataKey="realizado" stroke="#c35e1e" fill="url(#gradReal)" strokeWidth={2} name="Realizado" connectNulls dot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lançamentos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: "#26405d" }}>Lançamentos Semanais</h3>
          <Button size="sm" onClick={onAddLancamento} style={{ backgroundColor: "#26405d" }}>
            <Plus className="w-4 h-4 mr-1" />Lançar Realizado
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {["Semana", "Data Início", "Data Fim", "Qtd. Lançada", "Acumulado", "Responsável", ""].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lancSorted.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">Nenhum lançamento ainda</td></tr>
              )}
              {lancSorted.map((l, i) => (
                <tr key={l.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-4 py-2 font-bold text-xs" style={{ color: "#c35e1e" }}>{l.semana}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{l.data_inicio || "—"}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{l.data_fim || "—"}</td>
                  <td className="px-4 py-2 font-semibold">{l.quantidade.toLocaleString("pt-BR")} <span className="text-xs text-gray-400">{item.unidade}</span></td>
                  <td className="px-4 py-2 font-semibold text-gray-700">{l.acumulado.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{l.responsavel || "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => onEditLancamento(l)} className="text-gray-400 hover:text-blue-600 p-1"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDeleteLancamento(l.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── LISTA PRINCIPAL ────────────────────────────────────────────────────────────
export default function TakeOffCommodities() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showLancModal, setShowLancModal] = useState(false);
  const [editingLanc, setEditingLanc] = useState(null);
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [sortCol, setSortCol] = useState("codigo");
  const [sortDir, setSortDir] = useState("asc");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["commodities", selectedProjectId],
    queryFn: () => entities.Commodity.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: todosLancamentos = [] } = useQuery({
    queryKey: ["lancamentos-commodity", selectedProjectId],
    queryFn: () => entities.LancamentoCommodity.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createItem = useMutation({
    mutationFn: (d) => entities.Commodity.create({ ...d, projeto_id: selectedProjectId }),
    onSuccess: () => { queryClient.invalidateQueries(["commodities"]); setShowItemModal(false); },
  });
  const updateItem = useMutation({
    mutationFn: ({ id, data }) => entities.Commodity.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["commodities"]); setShowItemModal(false); setEditingItem(null); },
  });
  const deleteItem = useMutation({
    mutationFn: (id) => entities.Commodity.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["commodities"]),
  });
  const createLanc = useMutation({
    mutationFn: (d) => entities.LancamentoCommodity.create(d),
    onSuccess: () => { queryClient.invalidateQueries(["lancamentos-commodity"]); setShowLancModal(false); setEditingLanc(null); },
  });
  const updateLanc = useMutation({
    mutationFn: ({ id, data }) => entities.LancamentoCommodity.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["lancamentos-commodity"]); setShowLancModal(false); setEditingLanc(null); },
  });
  const deleteLanc = useMutation({
    mutationFn: (id) => entities.LancamentoCommodity.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["lancamentos-commodity"]),
  });

  // Enrich items with computed fields
  const enriched = useMemo(() => items.map(item => {
    const lncs = todosLancamentos.filter(l => l.commodity_id === item.id);
    const realizado = lncs.reduce((s, l) => s + l.quantidade, 0);
    const saldo = item.qtd_contrato - realizado;
    const pct = item.qtd_contrato > 0 ? (realizado / item.qtd_contrato) * 100 : 0;
    const status = calcStatus(realizado, item.qtd_contrato);
    return { ...item, realizado, saldo, pct, status };
  }), [items, todosLancamentos]);

  const filtered = useMemo(() => {
    let r = enriched;
    if (filtroDisciplina) r = r.filter(i => i.disciplina === filtroDisciplina);
    if (filtroStatus) r = r.filter(i => i.status === filtroStatus);
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(i => i.codigo?.toLowerCase().includes(b) || i.descricao?.toLowerCase().includes(b));
    }
    return [...r].sort((a, b) => {
      const av = a[sortCol] ?? ""; const bv = b[sortCol] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [enriched, filtroDisciplina, filtroStatus, busca, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  // Detalhe
  if (selectedItem) {
    const itemEnriched = enriched.find(i => i.id === selectedItem.id) || selectedItem;
    const lncs = todosLancamentos.filter(l => l.commodity_id === selectedItem.id);
    return (
      <>
        <ItemDetalhe
          item={itemEnriched}
          lancamentos={lncs}
          projetoId={selectedProjectId}
          onBack={() => setSelectedItem(null)}
          onAddLancamento={() => { setEditingLanc(null); setShowLancModal(true); }}
          onEditLancamento={(l) => { setEditingLanc(l); setShowLancModal(true); }}
          onDeleteLancamento={(id) => deleteLanc.mutate(id)}
        />
        {showLancModal && (
          <LancamentoModal
            commodityId={selectedItem.id}
            projetoId={selectedProjectId}
            lancamento={editingLanc}
            lancamentos={lncs}
            onSave={(d) => editingLanc ? updateLanc.mutate({ id: editingLanc.id, data: d }) : createLanc.mutate(d)}
            onClose={() => { setShowLancModal(false); setEditingLanc(null); }}
          />
        )}
      </>
    );
  }

  // KPIs
  const kpis = [
    { label: "Total de Itens", value: enriched.length, color: "#26405d", icon: BarChart2 },
    { label: "Itens em Dia", value: enriched.filter(i => i.status === "Normal").length, color: "#16a34a", icon: CheckCircle },
    { label: "Em Atenção", value: enriched.filter(i => i.status === "Atenção" || i.status === "Crítico").length, color: "#d97706", icon: AlertTriangle },
    { label: "Excedidos", value: enriched.filter(i => i.status === "Excedido").length, color: "#9333ea", icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="bg-white shadow-sm border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <input
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52"
            placeholder="Buscar código ou descrição..."
            value={busca} onChange={e => setBusca(e.target.value)}
          />
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroDisciplina} onChange={e => setFiltroDisciplina(e.target.value)}>
            <option value="">Todas as Disciplinas</option>
            {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            {["Normal", "Atenção", "Crítico", "Excedido"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowItemModal(true); }} style={{ backgroundColor: "#c35e1e" }}>
          <Plus className="w-4 h-4 mr-2" />Novo Item
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {[
                  { key: "codigo", label: "Código" },
                  { key: "descricao", label: "Descrição" },
                  { key: "disciplina", label: "Disciplina" },
                  { key: "unidade", label: "Un." },
                  { key: "qtd_contrato", label: "Contrato" },
                  { key: "qtd_takeoff", label: "Take-Off" },
                  { key: "realizado", label: "Realizado" },
                  { key: "saldo", label: "Saldo" },
                  { key: "pct", label: "% Avanço" },
                  { key: "status", label: "Status" },
                  { key: "_actions", label: "" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap ${key !== "_actions" ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                    onClick={() => key !== "_actions" && handleSort(key)}
                  >
                    {label}{key !== "_actions" && <SortIcon col={key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">Nenhum item cadastrado</td></tr>}
              {filtered.map((item, i) => {
                const stCfg = STATUS_CFG[item.status];
                return (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                    onClick={() => setSelectedItem(item)}>
                    <td className="px-4 py-3 font-bold text-xs" style={{ color: "#c35e1e" }}>{item.codigo}</td>
                    <td className="px-4 py-3 font-medium text-gray-700 max-w-xs truncate">{item.descricao}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">{item.disciplina}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.unidade}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.qtd_contrato?.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.qtd_takeoff ? item.qtd_takeoff.toLocaleString("pt-BR") : "—"}</td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: "#c35e1e" }}>{item.realizado.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: item.saldo >= 0 ? "#16a34a" : "#dc2626" }}>{item.saldo.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 min-w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: stCfg.bar }} />
                        </div>
                        <span className="text-xs font-bold w-12 text-right" style={{ color: stCfg.text }}>{item.pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: stCfg.bg, color: stCfg.text }}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingItem(item); setShowItemModal(true); }} className="text-gray-400 hover:text-blue-600 p-1"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem.mutate(item.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showItemModal && (
        <ItemModal
          item={editingItem}
          totalItems={items.length}
          onSave={(d) => editingItem ? updateItem.mutate({ id: editingItem.id, data: d }) : createItem.mutate(d)}
          onClose={() => { setShowItemModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}