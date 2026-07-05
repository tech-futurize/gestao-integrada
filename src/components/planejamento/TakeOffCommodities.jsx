import { useState, useMemo } from "react";
import { UNIDADE_SIGLAS } from "@/lib/unidadesMedida";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/button";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import {
  Plus, ArrowLeft, ChevronUp, ChevronDown, ChevronsUpDown,
  Save, Package, TrendingUp, X
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, BarChart, Cell
} from "recharts";
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import { Search } from "lucide-react";
import RowActions from "@/components/ui/RowActions";

const DISCIPLINAS = ["Civil", "Mecânica", "Tubulação", "Elétrica", "Estrutura Metálica", "Instrumentação", "Pintura", "Outros"];

const COMMODITY_COLUMNS = [
  { key: "codigo",       label: "Código",        type: "string", required: true },
  { key: "descricao",    label: "Descrição",      type: "string", required: true },
  { key: "disciplina",   label: "Disciplina",     type: "string" },
  { key: "unidade",      label: "Und",            type: "string" },
  { key: "qtd_contrato", label: "Qtd. Contrato",  type: "number", required: true },
  { key: "qtd_takeoff",  label: "Qtd. Take-Off",  type: "number" },
];

const inputCls  = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-background text-foreground";
const selectCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-200";

// ISO 8601 week — e.g. "2026-W22"
function currentIsoWeek() {
  const now  = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getPctColor(pct) {
  const p = Math.min(100, Math.max(0, pct));
  const stops = [
    { at: 0,   r: 239, g: 68,  b: 68  }, // vermelho
    { at: 33,  r: 249, g: 115, b: 22  }, // laranja
    { at: 66,  r: 234, g: 179, b: 8   }, // amarelo
    { at: 100, r: 22,  g: 163, b: 74  }, // verde
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i].at && p <= stops[i + 1].at) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const t = lo.at === hi.at ? 0 : (p - lo.at) / (hi.at - lo.at);
  const r = Math.round(lo.r + (hi.r - lo.r) * t);
  const g = Math.round(lo.g + (hi.g - lo.g) * t);
  const b = Math.round(lo.b + (hi.b - lo.b) * t);
  return `rgb(${r},${g},${b})`;
}

function calcStatus(realizado, contrato) {
  if (!contrato) return "Normal";
  const pct = (realizado / contrato) * 100;
  if (pct > 100) return "Excedido";
  if (pct >= 95)  return "Crítico";
  if (pct >= 80)  return "Atenção";
  return "Normal";
}

const STATUS_CFG = {
  "Normal":   { cls: "bg-status-positive/15 text-status-positive" },
  "Atenção":  { cls: "bg-status-attention/15 text-status-attention" },
  "Crítico":  { cls: "bg-status-critical/15 text-status-critical" },
  "Excedido": { cls: "bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
};

const fmtQtd = (v) => (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => `${(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ── MODAL ITEM ─────────────────────────────────────────────────────────────────
function ItemModal({ item, onSave, onClose, totalItems, lancamentos = [], onSaveLancamento, onDeleteLancamento, projetoId }) {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState(item || {
    codigo: `COM-${String(totalItems + 1).padStart(3, "0")}`,
    descricao: "", disciplina: "Civil", unidade: "m³", qtd_contrato: "", qtd_takeoff: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [lancForm, setLancForm] = useState(null);
  const [editingLancId, setEditingLancId] = useState(null);

  const openNewLanc = () => {
    setEditingLancId(null);
    setLancForm({ semana_iso: currentIsoWeek(), quantidade: "", observacao: "" });
  };
  const openEditLanc = (l) => {
    setEditingLancId(l.id);
    setLancForm({ semana_iso: l.semana_iso || l.semana || "", quantidade: String(l.quantidade), observacao: l.observacao || "" });
  };
  const saveLanc = () => {
    if (!lancForm?.quantidade) return;
    onSaveLancamento({ ...lancForm, quantidade: Number(lancForm.quantidade), commodity_id: item.id, projeto_id: projetoId }, editingLancId);
    setLancForm(null);
    setEditingLancId(null);
  };

  let acum = 0;
  const sortedLanc = [...lancamentos]
    .sort((a, b) => (a.semana_iso || a.semana || "").localeCompare(b.semana_iso || b.semana || ""))
    .map(l => { acum += l.quantidade; return { ...l, acumulado: acum }; });

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full shrink-0 min-h-[36px] bg-primary" />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="pt-0.5">
              <p className="text-base font-bold text-foreground leading-tight">{item ? "Editar Item" : "Novo Item"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item ? item.descricao : "Take-Off de Commodities"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors pt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas — só ao editar */}
        {item && (
          <div className="flex border-b border-border shrink-0">
            {[
              { key: "info", label: "Informações" },
              { key: "lancamentos", label: `Lançamentos${lancamentos.length ? ` (${lancamentos.length})` : ""}` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-blue-500 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >{label}</button>
            ))}
          </div>
        )}

        {/* Aba: Informações */}
        {tab === "info" && (
          <div className="p-6 space-y-4 overflow-y-auto">
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
              <Field label="Und">
                <select className={selectCls} value={form.unidade} onChange={e => set("unidade", e.target.value)}>
                  {UNIDADE_SIGLAS.map(u => <option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Qtd. Contrato *"><input type="number" step="0.01" className={inputCls} value={form.qtd_contrato} onChange={e => set("qtd_contrato", e.target.value)} /></Field>
              <Field label="Qtd. Take-Off"><input type="number" step="0.01" className={inputCls} value={form.qtd_takeoff} onChange={e => set("qtd_takeoff", e.target.value)} /></Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button variant="save" onClick={() => onSave({
                // whitelist: form herda campos derivados (realizado/saldo/pct/status)
                // do item enriquecido — enviá-los faria o PostgREST rejeitar o update
                codigo: form.codigo,
                descricao: form.descricao,
                disciplina: form.disciplina,
                unidade: form.unidade,
                qtd_contrato: Number(String(form.qtd_contrato).replace(",", ".")) || 0,
                qtd_takeoff: form.qtd_takeoff === "" || form.qtd_takeoff == null ? null : Number(String(form.qtd_takeoff).replace(",", ".")) || 0,
              })}>
                <Save className="w-4 h-4 mr-1" />Salvar
              </Button>
            </div>
          </div>
        )}

        {/* Aba: Lançamentos */}
        {tab === "lancamentos" && item && (
          <div className="flex flex-col overflow-hidden">
            {lancForm ? (
              <div className="p-4 border-b border-border bg-muted/30 space-y-3 shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {editingLancId ? "Editar Lançamento" : "Novo Lançamento"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Semana ISO (YYYY-Wxx)">
                    <input className={inputCls} value={lancForm.semana_iso} onChange={e => setLancForm(f => ({ ...f, semana_iso: e.target.value }))} placeholder="2026-W22" />
                  </Field>
                  <Field label="Quantidade *">
                    <input type="number" step="0.01" className={inputCls} value={lancForm.quantidade} onChange={e => setLancForm(f => ({ ...f, quantidade: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Observação">
                  <input className={inputCls} value={lancForm.observacao} onChange={e => setLancForm(f => ({ ...f, observacao: e.target.value }))} />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setLancForm(null); setEditingLancId(null); }}>Cancelar</Button>
                  <Button variant="save" size="sm" onClick={saveLanc}><Save className="w-3.5 h-3.5 mr-1" />Salvar</Button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 border-b border-border flex justify-end shrink-0">
                <Button size="sm" onClick={openNewLanc}><Plus className="w-4 h-4 mr-1" />Lançar Realizado</Button>
              </div>
            )}
            <div className="overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    {["Semana ISO", "Qtd. Lançada", "Acumulado", "Observação", ""].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLanc.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum lançamento ainda</td></tr>
                  )}
                  {sortedLanc.map((l, i) => (
                    <tr key={l.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
                      <td className="px-4 py-2 font-bold text-xs text-foreground">{l.semana_iso || l.semana || "—"}</td>
                      <td className="px-4 py-2 font-semibold">{fmtQtd(l.quantidade)}</td>
                      <td className="px-4 py-2 text-foreground">{fmtQtd(l.acumulado)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground max-w-[160px] truncate">{l.observacao || "—"}</td>
                      <td className="px-4 py-2">
                        <RowActions
                          onEdit={() => openEditLanc(l)}
                          onDelete={() => onDeleteLancamento(l.id)}
                          deleteDescription="O lançamento será excluído permanentemente."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
}

// ── MODAL LANÇAMENTO ───────────────────────────────────────────────────────────
function LancamentoModal({ commodityId, projetoId, lancamento, onSave, onClose }) {
  const [form, setForm] = useState(lancamento || {
    semana_iso: currentIsoWeek(), quantidade: "", observacao: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full shrink-0 min-h-[36px] bg-primary" />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="pt-0.5">
              <p className="text-base font-bold text-foreground leading-tight">{lancamento ? "Editar Lançamento" : "Lançar Realizado"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Take-Off de Commodities</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors pt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Semana ISO (YYYY-Wxx)">
            <input
              className={inputCls}
              value={form.semana_iso}
              onChange={e => set("semana_iso", e.target.value)}
              placeholder="ex: 2026-W22"
              pattern="\d{4}-W\d{2}"
            />
          </Field>
          <Field label="Quantidade *"><input type="number" step="0.01" className={inputCls} value={form.quantidade} onChange={e => set("quantidade", e.target.value)} /></Field>
          <Field label="Observação"><input className={inputCls} value={form.observacao} onChange={e => set("observacao", e.target.value)} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button variant="save" onClick={() => onSave({ ...form, quantidade: Number(form.quantidade), commodity_id: commodityId, projeto_id: projetoId })}>
              <Save className="w-4 h-4 mr-1" />Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DETALHE ITEM ───────────────────────────────────────────────────────────────
function ItemDetalhe({ item, lancamentos, projetoId: _projetoId, onBack, onAddLancamento, onEditLancamento, onDeleteLancamento }) {
  const sorted = [...lancamentos].sort((a, b) =>
    (a.semana_iso || a.semana || "").localeCompare(b.semana_iso || b.semana || "")
  );
  let acumulado = 0;
  const lancSorted = sorted.map(l => {
    acumulado += l.quantidade;
    return { ...l, acumulado };
  });

  const realizado = lancamentos.reduce((s, l) => s + l.quantidade, 0);
  const saldo     = item.qtd_contrato - realizado;
  const pct       = item.qtd_contrato > 0 ? (realizado / item.qtd_contrato) * 100 : 0;
  const status    = calcStatus(realizado, item.qtd_contrato);
  const stCfg     = STATUS_CFG[status];

  const chartData = lancSorted.map(l => ({
    semana: l.semana_iso || l.semana || "",
    semanal: l.quantidade,
    acumulado: l.acumulado,
  }));

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />Voltar à lista
        </button>
      </div>

      {/* Cabeçalho */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-bold text-ocre">{item.codigo}</div>
            <h2 className="text-xl font-bold mt-1 text-foreground">{item.descricao}</h2>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 dark:bg-blue-900/30 dark:text-blue-300">{item.disciplina}</span>
              <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">{item.unidade}</span>
            </div>
          </div>
          <span className={`text-sm font-semibold rounded-full px-3 py-1 ${stCfg.cls}`}>{status}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {[
            { label: "Qtd. Contrato", value: fmtQtd(item.qtd_contrato),           colorCls: "text-foreground" },
            { label: "Qtd. Take-Off", value: item.qtd_takeoff != null ? fmtQtd(item.qtd_takeoff) : "—", colorCls: "text-muted-foreground" },
            { label: "Qtd. Realizado", value: fmtQtd(realizado),                   colorCls: "text-status-positive" },
            { label: "Saldo",          value: fmtQtd(saldo),                        colorCls: "text-red-600 dark:text-red-400" },
            { label: "% Avanço",       value: fmtPct(pct),                                            colorCls: stCfg.cls.split(" ").find(c => c.startsWith("text-")) },
          ].map(({ label, value, colorCls }) => (
            <div key={label} className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={`text-lg font-bold ${colorCls}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progresso</span><span>{fmtPct(pct)}</span></div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: "#16a34a" }} />
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold mb-4 text-foreground">Curva de Evolução</h3>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, name) => [fmtQtd(v), name]} />
            <Bar dataKey="semanal" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Qtd. Semanal" />
            <Line type="monotone" dataKey="acumulado" stroke="#16a34a" strokeWidth={2} name="Acumulado" dot={{ r: 4 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Lançamentos */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Lançamentos Semanais</h3>
          <Button size="sm" onClick={onAddLancamento}>
            <Plus className="w-4 h-4 mr-1" />Lançar Realizado
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["Semana ISO", "Qtd. Lançada", "Acumulado", "Observação", ""].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lancSorted.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">Nenhum lançamento ainda</td></tr>
              )}
              {lancSorted.map((l, i) => (
                <tr key={l.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
                  <td className="px-4 py-2 font-bold text-xs text-ocre">{l.semana_iso || l.semana || "—"}</td>
                  <td className="px-4 py-2 font-semibold">{fmtQtd(l.quantidade)} <span className="text-xs text-muted-foreground">{item.unidade}</span></td>
                  <td className="px-4 py-2 font-semibold text-foreground">{fmtQtd(l.acumulado)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{l.observacao || "—"}</td>
                  <td className="px-4 py-2">
                    <RowActions
                      onEdit={() => onEditLancamento(l)}
                      onDelete={() => onDeleteLancamento(l.id)}
                      deleteDescription="O lançamento será excluído permanentemente."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}

// ── LISTA PRINCIPAL ────────────────────────────────────────────────────────────
export default function TakeOffCommodities({ showImportExport, onCloseImportExport }) {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const [selectedItem, setSelectedItem]   = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem]     = useState(null);
  const [showLancModal, setShowLancModal] = useState(false);
  const [editingLanc, setEditingLanc]     = useState(null);
  const [filtros, setFiltros]   = useState({});
  const [filtroUnidade, setFiltroUnidade]       = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filterKey, setFilterKey] = useState(0);
  const [busca, setBusca]       = useState("");
  const FILTROS_KEY = "takeoff-filtros";
  const [sortCol, setSortCol]   = useState("codigo");
  const [sortDir, setSortDir]   = useState("asc");

  const { data: items = [], isPending, isError } = useQuery({
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["commodities"] }); setShowItemModal(false); },
    onError: onErr,
  });
  const updateItem = useMutation({
    mutationFn: ({ id, data }) => entities.Commodity.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["commodities"] }); setShowItemModal(false); setEditingItem(null); },
    onError: onErr,
  });
  const deleteItem = useMutation({
    mutationFn: (id) => entities.Commodity.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["commodities"] }),
    onError: onErr,
  });
  // A coluna persistida é `semana` (NOT NULL); a UI captura o valor ISO em `semana_iso`.
  // Mapeia para `semana` e remove `semana_iso` antes de enviar ao banco.
  const toLancPayload = ({ semana_iso, semana, ...rest }) => ({
    ...rest,
    semana: semana_iso ?? semana,
  });
  const createLanc = useMutation({
    mutationFn: (d) => entities.LancamentoCommodity.create(toLancPayload(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lancamentos-commodity"] }); setShowLancModal(false); setEditingLanc(null); },
    onError: onErr,
  });
  const updateLanc = useMutation({
    mutationFn: ({ id, data }) => entities.LancamentoCommodity.update(id, toLancPayload(data)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lancamentos-commodity"] }); setShowLancModal(false); setEditingLanc(null); },
    onError: onErr,
  });
  const deleteLanc = useMutation({
    mutationFn: (id) => entities.LancamentoCommodity.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lancamentos-commodity"] }),
    onError: onErr,
  });

  const enriched = useMemo(() => items.map(item => {
    const lncs     = todosLancamentos.filter(l => l.commodity_id === item.id);
    const realizado = lncs.reduce((s, l) => s + l.quantidade, 0);
    const saldo     = item.qtd_contrato - realizado;
    const pct       = item.qtd_contrato > 0 ? (realizado / item.qtd_contrato) * 100 : 0;
    const status    = calcStatus(realizado, item.qtd_contrato);
    return { ...item, realizado, saldo, pct, status };
  }), [items, todosLancamentos]);

  // Base filtrada pelos filtros do toolbar (busca + FilterBar) — sem os filtros de clique nos gráficos
  const baseFiltered = useMemo(() => {
    let r = enriched;
    if (filtros.disciplina?.length > 0) r = r.filter(i => filtros.disciplina.includes(i.disciplina));
    if (filtros.unidade?.length > 0)    r = r.filter(i => filtros.unidade.includes(i.unidade));
    if (busca) {
      const b = busca.toLowerCase();
      r = r.filter(i => i.codigo?.toLowerCase().includes(b) || i.descricao?.toLowerCase().includes(b));
    }
    return r;
  }, [enriched, filtros, busca]);

  // Lista completa para a tabela — aplica também os filtros de clique nos gráficos
  const filtered = useMemo(() => {
    let r = baseFiltered;
    if (filtroUnidade)    r = r.filter(i => i.unidade    === filtroUnidade);
    if (filtroDisciplina) r = r.filter(i => i.disciplina === filtroDisciplina);
    return [...r].sort((a, b) => {
      const av = a[sortCol] ?? ""; const bv = b[sortCol] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [baseFiltered, filtroUnidade, filtroDisciplina, sortCol, sortDir]);

  const totals = useMemo(() =>
    filtered.reduce((acc, i) => ({
      qtd_contrato: acc.qtd_contrato + (i.qtd_contrato || 0),
      qtd_takeoff:  acc.qtd_takeoff  + (i.qtd_takeoff  || 0),
      realizado:    acc.realizado    + i.realizado,
      saldo:        acc.saldo        + i.saldo,
    }), { qtd_contrato: 0, qtd_takeoff: 0, realizado: 0, saldo: 0 }),
  [filtered]);

  // Gráfico de unidade: usa baseFiltered + filtro de disciplina (mas NÃO filtroUnidade — cross-filter)
  const chartByUnidade = useMemo(() => {
    const base = filtroDisciplina ? baseFiltered.filter(i => i.disciplina === filtroDisciplina) : baseFiltered;
    return UNIDADE_SIGLAS
      .map(u => {
        const its = base.filter(i => i.unidade === u);
        if (its.length === 0) return null;
        return {
          name:       u,
          Contrato:   its.reduce((s, i) => s + (i.qtd_contrato || 0), 0),
          "Take-Off": its.reduce((s, i) => s + (i.qtd_takeoff  || 0), 0),
          Realizado:  its.reduce((s, i) => s + i.realizado, 0),
        };
      })
      .filter(Boolean);
  }, [baseFiltered, filtroDisciplina]);

  // Gráfico de disciplina: usa baseFiltered + filtro de unidade (mas NÃO filtroDisciplina — cross-filter)
  const chartByDisciplina = useMemo(() => {
    const base = filtroUnidade ? baseFiltered.filter(i => i.unidade === filtroUnidade) : baseFiltered;
    return DISCIPLINAS
      .map(d => {
        const its = base.filter(i => i.disciplina === d);
        if (its.length === 0) return null;
        return {
          name:       d,
          Contrato:   its.reduce((s, i) => s + (i.qtd_contrato || 0), 0),
          "Take-Off": its.reduce((s, i) => s + (i.qtd_takeoff  || 0), 0),
          Realizado:  its.reduce((s, i) => s + i.realizado, 0),
        };
      })
      .filter(Boolean);
  }, [baseFiltered, filtroUnidade]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const formatYAxis = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 text-muted-foreground" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  // ── Detalhe ──────────────────────────────────────────────────────────────────
  if (selectedItem) {
    const itemEnriched = enriched.find(i => i.id === selectedItem.id) || selectedItem;
    const lncs         = todosLancamentos.filter(l => l.commodity_id === selectedItem.id);
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
            onSave={(d) => editingLanc ? updateLanc.mutate({ id: editingLanc.id, data: d }) : createLanc.mutate(d)}
            onClose={() => { setShowLancModal(false); setEditingLanc(null); }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros + ação */}
      <div className="flex items-center justify-between gap-3">
        <FilterToolbar
          active={!!busca || Object.values(filtros).some(a => a?.length > 0)}
          onClearAll={() => { setBusca(""); setFiltros({}); setFiltroUnidade(""); setFiltroDisciplina(""); localStorage.removeItem(FILTROS_KEY); setFilterKey(k => k + 1); }}
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
              placeholder="Buscar código ou descrição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <FilterBar
            key={filterKey}
            storageKey={FILTROS_KEY}
            filters={[
              { key: "disciplina", label: "Disciplina", options: DISCIPLINAS },
              { key: "unidade",    label: "Unidade",    options: UNIDADE_SIGLAS },
            ]}
            onChange={setFiltros}
          />
        </FilterToolbar>
        <Button onClick={() => { setEditingItem(null); setShowItemModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />Novo Item
        </Button>
      </div>

      {/* Gráficos de Barras */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">Take Off por unidade de medida</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartByUnidade}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                style={{ cursor: "pointer" }}
                onClick={(d) => d?.activeLabel && setFiltroUnidade(prev => prev === d.activeLabel ? "" : d.activeLabel)}
              >
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatYAxis} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                <Tooltip formatter={(v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <Bar dataKey="Contrato"  radius={[4, 4, 0, 0]}>
                  {chartByUnidade.map(e => <Cell key={`u-c-${e.name}`} fill={!filtroUnidade || filtroUnidade === e.name ? "#9ca3af" : "#9ca3af44"} />)}
                </Bar>
                <Bar dataKey="Take-Off"  radius={[4, 4, 0, 0]}>
                  {chartByUnidade.map(e => <Cell key={`u-t-${e.name}`} fill={!filtroUnidade || filtroUnidade === e.name ? "#93c5fd" : "#93c5fd44"} />)}
                </Bar>
                <Bar dataKey="Realizado" radius={[4, 4, 0, 0]}>
                  {chartByUnidade.map(e => <Cell key={`u-r-${e.name}`} fill={!filtroUnidade || filtroUnidade === e.name ? "#16a34a" : "#16a34a44"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">Take Off por disciplina</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartByDisciplina}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                style={{ cursor: "pointer" }}
                onClick={(d) => d?.activeLabel && setFiltroDisciplina(prev => prev === d.activeLabel ? "" : d.activeLabel)}
              >
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatYAxis} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                <Tooltip formatter={(v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <Bar dataKey="Contrato"  radius={[4, 4, 0, 0]}>
                  {chartByDisciplina.map(e => <Cell key={`d-c-${e.name}`} fill={!filtroDisciplina || filtroDisciplina === e.name ? "#9ca3af" : "#9ca3af44"} />)}
                </Bar>
                <Bar dataKey="Take-Off"  radius={[4, 4, 0, 0]}>
                  {chartByDisciplina.map(e => <Cell key={`d-t-${e.name}`} fill={!filtroDisciplina || filtroDisciplina === e.name ? "#93c5fd" : "#93c5fd44"} />)}
                </Bar>
                <Bar dataKey="Realizado" radius={[4, 4, 0, 0]}>
                  {chartByDisciplina.map(e => <Cell key={`d-r-${e.name}`} fill={!filtroDisciplina || filtroDisciplina === e.name ? "#16a34a" : "#16a34a44"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {[
                  { key: "codigo",       label: "Código",    cls: "w-20" },
                  { key: "descricao",    label: "Descrição", cls: "w-44" },
                  { key: "disciplina",   label: "Disciplina" },
                  { key: "unidade",      label: "Und" },
                  { key: "qtd_contrato", label: "Contrato" },
                  { key: "qtd_takeoff",  label: "Take-Off" },
                  { key: "realizado",    label: "Realizado" },
                  { key: "saldo",        label: "Saldo" },
                  { key: "pct",          label: "% Avanço" },
                  { key: "_actions",     label: "" },
                ].map(({ key, label, cls }) => (
                  <th
                    key={key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap ${cls || ""} ${key !== "_actions" ? "cursor-pointer select-none hover:text-foreground" : ""}`}
                    onClick={() => key !== "_actions" && handleSort(key)}
                  >
                    {label}{key !== "_actions" && <SortIcon col={key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending && <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>}
              {isError && <tr><td colSpan={10} className="px-4 py-8 text-center text-destructive">Erro ao carregar itens. Tente novamente.</td></tr>}
              {!isPending && !isError && filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Nenhum item cadastrado</td></tr>}
              {filtered.map((item, i) => {
                return (
                  <tr key={item.id} className={`border-b border-border hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                    onClick={() => setSelectedItem(item)}>
                    <td className="px-4 py-3 w-20 font-bold text-xs text-foreground">{item.codigo}</td>
                    <td className="px-4 py-3 w-44 max-w-[176px] font-medium text-foreground truncate">{item.descricao}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.disciplina}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.unidade}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtQtd(item.qtd_contrato)}</td>
                    <td className="px-4 py-3 text-right text-blue-500 dark:text-blue-400 font-medium">{item.qtd_takeoff != null ? fmtQtd(item.qtd_takeoff) : "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-status-positive">{fmtQtd(item.realizado)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-status-critical">{fmtQtd(item.saldo)}</td>
                    <td className="px-4 py-3 min-w-[90px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold leading-none" style={{ color: getPctColor(item.pct) }}>{fmtPct(item.pct)}</span>
                        <div className="bg-muted rounded-full h-1 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: getPctColor(item.pct) }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        onEdit={() => { setEditingItem(item); setShowItemModal(true); }}
                        onDelete={() => deleteItem.mutate(item.id)}
                        deleteDescription={`${item.descricao || "Este item"} será excluído permanentemente.`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {!isPending && !isError && filtered.length > 0 && (
              <tfoot>
                <tr className="bg-muted/60 border-t-2 border-border font-semibold text-sm">
                  <td className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wide" colSpan={4}>Totais ({filtered.length} itens)</td>
                  <td className="px-4 py-3 text-right">{fmtQtd(totals.qtd_contrato)}</td>
                  <td className="px-4 py-3 text-right text-blue-500 dark:text-blue-400">{fmtQtd(totals.qtd_takeoff)}</td>
                  <td className="px-4 py-3 text-right text-status-positive">{fmtQtd(totals.realizado)}</td>
                  <td className="px-4 py-3 text-right text-status-critical">{fmtQtd(totals.saldo)}</td>
                  <td className="px-4 py-3 min-w-[90px]">
                    {(() => {
                      const pct = totals.qtd_contrato > 0 ? (totals.realizado / totals.qtd_contrato) * 100 : 0;
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold leading-none" style={{ color: getPctColor(pct) }}>{fmtPct(pct)}</span>
                          <div className="bg-muted rounded-full h-1 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: getPctColor(pct) }} />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modais */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          totalItems={items.length}
          lancamentos={editingItem ? todosLancamentos.filter(l => l.commodity_id === editingItem.id) : []}
          projetoId={selectedProjectId}
          onSave={(d) => editingItem ? updateItem.mutate({ id: editingItem.id, data: d }) : createItem.mutate(d)}
          onSaveLancamento={(d, editingId) =>
            editingId
              ? updateLanc.mutate({ id: editingId, data: d })
              : createLanc.mutate(d)
          }
          onDeleteLancamento={(id) => deleteLanc.mutate(id)}
          onClose={() => { setShowItemModal(false); setEditingItem(null); }}
        />
      )}

      <ImportExportDialog
        open={!!showImportExport}
        onOpenChange={(v) => !v && onCloseImportExport?.()}
        title="Importar / Exportar — Take-Off"
        exportFileName="takeoff-commodities"
        columns={COMMODITY_COLUMNS}
        onExport={() => filtered}
        onImport={async (row) => {
          const payload = { ...row, projeto_id: selectedProjectId };
          if (!DISCIPLINAS.includes(payload.disciplina)) {
            throw new Error(`Disciplina inválida: "${payload.disciplina ?? ""}" — use uma de: ${DISCIPLINAS.join(", ")}`);
          }
          const existente = items.find((i) => i.codigo === row.codigo);
          if (existente) await updateItem.mutateAsync({ id: existente.id, data: payload });
          else await createItem.mutateAsync(payload);
        }}
      />
    </div>
  );
}
