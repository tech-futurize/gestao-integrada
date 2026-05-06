import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { toDatetimeLocal, toUtcIso } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText, Plus, Search, Eye, Trash2, Edit, Sun, Cloud, CloudRain,
  CheckCircle, XCircle, X, ChevronDown, ChevronUp, Upload, Printer, Paperclip
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIAS_OCORRENCIA = [
  "Engenharia", "Suprimentos", "Planejamento", "Construção", "Contratos", "Qualidade/SSMA"
];
const DISCIPLINAS = ["Mecânica", "Elétrica", "Estrutura Metálica", "Tubulação", "Instrumentação", "Civil", "Pintura"];
const CARGOS = ["Encarregado", "Soldador", "Caldeireiro", "Eletricista", "Instrumentista", "Ajudante", "Operador de Máquina", "Pedreiro"];
const EQUIPAMENTOS_LISTA = ["Guindaste", "Retroescavadeira", "Compressor", "Andaime", "Caminhão", "Gerador", "Perfuratriz", "Munck"];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100";
const selectCls = `${inputCls} bg-white`;

const EMPTY_RDO = {
  numero_rdo: "", area: "", disciplina: "", tipo_registro: "RDO",
  data_hora: toDatetimeLocal(new Date()),
  condicoes_climaticas_manha: "", condicoes_climaticas_tarde: "", condicoes_climaticas_noite: "",
  turno_manha: false, turno_tarde: false, turno_noite: false,
  horario_inicio: "", horario_fim: "",
  mao_de_obra: [], equipamentos_rdo: [], atividades: "",
  ocorrencias: "", responsabilidade: "", impacto_ocorrencia: [],
  caso_id: null,
};

// ── Clima Button ───────────────────────────────────────────────────────────────
function ClimaBtn({ label, icon: Icon, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "border-transparent text-white" : "border-gray-200 text-gray-500 bg-white"}`}
      style={active ? { backgroundColor: color } : {}}
    >{Icon && <Icon className="w-3.5 h-3.5" />}{label}</button>
  );
}

// ── RDO Form ───────────────────────────────────────────────────────────────────
function RDOForm({ rdo, selectedProjectId, casos, onClose, onSaved }) {
  const [form, setForm] = useState(rdo ? { ...rdo, data_hora: toDatetimeLocal(rdo.data_hora) } : { ...EMPTY_RDO });
  const [openPanels, setOpenPanels] = useState({ mdo: true, equip: false, ativ: false, evid: false, ocorr: false });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePanel = (k) => setOpenPanels(p => ({ ...p, [k]: !p[k] }));

  // Mão de obra
  const addMdo = () => set("mao_de_obra", [...(form.mao_de_obra || []), { quantidade: "1", funcao: "" }]);
  const setMdo = (i, k, v) => {
    const arr = [...(form.mao_de_obra || [])];
    arr[i] = { ...arr[i], [k]: v };
    set("mao_de_obra", arr);
  };
  const removeMdo = (i) => set("mao_de_obra", (form.mao_de_obra || []).filter((_, j) => j !== i));

  // Equipamentos
  const addEquip = () => set("equipamentos_rdo", [...(form.equipamentos_rdo || []), { quantidade: "1", equipamento: "", horas: "" }]);
  const setEquip = (i, k, v) => {
    const arr = [...(form.equipamentos_rdo || [])];
    arr[i] = { ...arr[i], [k]: v };
    set("equipamentos_rdo", arr);
  };
  const removeEquip = (i) => set("equipamentos_rdo", (form.equipamentos_rdo || []).filter((_, j) => j !== i));

  // Impactos
  const toggleImpacto = (cat) => {
    const arr = form.impacto_ocorrencia || [];
    set("impacto_ocorrencia", arr.includes(cat) ? arr.filter(c => c !== cat) : [...arr, cat]);
  };

  const handleSave = async () => {
    setLoading(true);
    const data = { ...form, projeto_id: selectedProjectId, data_hora: toUtcIso(form.data_hora) };
    if (rdo?.id) await entities.Incidente.update(rdo.id, data);
    else await entities.Incidente.create(data);
    setLoading(false);
    onSaved();
  };

  const PanelHeader = ({ label, panelKey, icon: Icon }) => (
    <button type="button" onClick={() => togglePanel(panelKey)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {Icon && <Icon className="w-4 h-4" style={{ color: "#26405d" }} />}{label}
      </span>
      {openPanels[panelKey] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold" style={{ color: "#26405d" }}>
            {rdo ? "Editar RDO" : "Novo Relatório Diário de Obra"}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Cabeçalho */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nº RDO</label>
              <input className={inputCls} placeholder="RDO-001" value={form.numero_rdo || ""} onChange={e => set("numero_rdo", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data / Hora</label>
              <input type="datetime-local" className={inputCls} value={form.data_hora || ""} onChange={e => set("data_hora", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Área / KM</label>
              <input className={inputCls} placeholder="Área A / KM 12+500" value={form.area || ""} onChange={e => set("area", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Disciplina</label>
              <select className={selectCls} value={form.disciplina || ""} onChange={e => set("disciplina", e.target.value)}>
                <option value="">Selecione...</option>
                {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Controle Climático */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Condições Climáticas por Turno</p>
            <div className="space-y-3">
              {[
                { key: "manha", label: "Manhã", climaKey: "condicoes_climaticas_manha" },
                { key: "tarde", label: "Tarde", climaKey: "condicoes_climaticas_tarde" },
                { key: "noite", label: "Noite", climaKey: "condicoes_climaticas_noite" },
              ].map(turno => (
                <div key={turno.key} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer min-w-20">
                    <input type="checkbox" className="w-4 h-4 accent-blue-500"
                      checked={form[`turno_${turno.key}`] || false}
                      onChange={e => set(`turno_${turno.key}`, e.target.checked)} />
                    <span className="text-sm font-medium text-gray-700">{turno.label}</span>
                  </label>
                  {form[`turno_${turno.key}`] && (
                    <div className="flex gap-2 flex-wrap">
                      <ClimaBtn label="Sol" icon={Sun} active={form[turno.climaKey] === "Praticável"} color="#f59e0b" onClick={() => set(turno.climaKey, "Praticável")} />
                      <ClimaBtn label="Nublado" icon={Cloud} active={form[turno.climaKey] === "Praticável-Nublado"} color="#6b7280" onClick={() => set(turno.climaKey, "Praticável-Nublado")} />
                      <ClimaBtn label="Chuva" icon={CloudRain} active={form[turno.climaKey] === "Impraticável"} color="#3b82f6" onClick={() => set(turno.climaKey, "Impraticável")} />
                      <div className="w-px bg-gray-200 mx-1" />
                      <ClimaBtn label="Praticável" icon={CheckCircle} active={form[turno.climaKey]?.includes("Praticável") && !form[turno.climaKey]?.includes("Impraticável")} color="#16a34a" onClick={() => set(turno.climaKey, "Praticável")} />
                      <ClimaBtn label="Impraticável" icon={XCircle} active={form[turno.climaKey] === "Impraticável"} color="#dc2626" onClick={() => set(turno.climaKey, "Impraticável")} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mão de Obra */}
          <div className="space-y-2">
            <PanelHeader label="👥 Mão de Obra" panelKey="mdo" />
            {openPanels.mdo && (
              <div className="border border-gray-100 rounded-xl p-4 space-y-2">
                {(form.mao_de_obra || []).map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="number" min={1} className={`${inputCls} w-20`} placeholder="Qtd" value={m.quantidade} onChange={e => setMdo(i, "quantidade", e.target.value)} />
                    <select className={`${selectCls} flex-1`} value={m.funcao} onChange={e => setMdo(i, "funcao", e.target.value)}>
                      <option value="">Função...</option>
                      {CARGOS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button onClick={() => removeMdo(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={addMdo} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" />Adicionar função
                </button>
              </div>
            )}
          </div>

          {/* Equipamentos */}
          <div className="space-y-2">
            <PanelHeader label="🚜 Equipamentos" panelKey="equip" />
            {openPanels.equip && (
              <div className="border border-gray-100 rounded-xl p-4 space-y-2">
                {(form.equipamentos_rdo || []).map((eq, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="number" min={1} className={`${inputCls} w-16`} placeholder="Qtd" value={eq.quantidade} onChange={e => setEquip(i, "quantidade", e.target.value)} />
                    <select className={`${selectCls} flex-1`} value={eq.equipamento} onChange={e => setEquip(i, "equipamento", e.target.value)}>
                      <option value="">Equipamento...</option>
                      {EQUIPAMENTOS_LISTA.map(eq => <option key={eq}>{eq}</option>)}
                    </select>
                    <input className={`${inputCls} w-24`} placeholder="HM" value={eq.horas || ""} onChange={e => setEquip(i, "horas", e.target.value)} />
                    <button onClick={() => removeEquip(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={addEquip} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" />Adicionar equipamento
                </button>
              </div>
            )}
          </div>

          {/* Atividades */}
          <div className="space-y-2">
            <PanelHeader label="📋 Atividades Produzidas" panelKey="ativ" />
            {openPanels.ativ && (
              <div className="border border-gray-100 rounded-xl p-4">
                <textarea className={inputCls} rows={4} placeholder="Descreva as atividades realizadas, produção medida, vincule ao EAP quando aplicável..." value={form.atividades || ""} onChange={e => set("atividades", e.target.value)} />
              </div>
            )}
          </div>

          {/* Ocorrências e Impactos */}
          <div className="space-y-2">
            <PanelHeader label="⚠️ Ocorrências e Impactos" panelKey="ocorr" />
            {openPanels.ocorr && (
              <div className="border border-gray-100 rounded-xl p-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Categorias de Impacto</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIAS_OCORRENCIA.map(cat => {
                      const ativo = (form.impacto_ocorrencia || []).includes(cat);
                      return (
                        <button key={cat} type="button" onClick={() => toggleImpacto(cat)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${ativo ? "border-transparent text-white" : "border-gray-200 text-gray-500 bg-white"}`}
                          style={ativo ? { backgroundColor: "#c35e1e" } : {}}>
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Descrição da Ocorrência</label>
                  <textarea className={inputCls} rows={3} placeholder="Descreva o evento, anomalia ou interrupção..." value={form.ocorrencias || ""} onChange={e => set("ocorrencias", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Responsabilidade</label>
                    <select className={selectCls} value={form.responsabilidade || ""} onChange={e => set("responsabilidade", e.target.value)}>
                      <option value="">Selecione...</option>
                      <option>Contratada</option>
                      <option>Contratante</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Vincular a Pleito</label>
                    <select className={selectCls} value={form.caso_id || ""} onChange={e => set("caso_id", e.target.value || null)}>
                      <option value="">Nenhum</option>
                      {(casos || []).map(c => <option key={c.id} value={c.id}>{c.titulo?.substring(0, 40)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Evidências */}
          <div className="space-y-2">
            <PanelHeader label="📷 Evidências" panelKey="evid" />
            {openPanels.evid && (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Clique para anexar fotos ou arraste os arquivos aqui</p>
                <p className="text-xs text-gray-300 mt-1">PNG, JPG, PDF até 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={loading} onClick={handleSave} className="text-white" style={{ backgroundColor: "#26405d" }}>
            {loading ? "Salvando..." : rdo ? "Salvar Alterações" : "Finalizar e Enviar RDO"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── RDO Detail Modal ───────────────────────────────────────────────────────────
function RDODetail({ rdo, casos, onClose }) {
  const caso = (casos || []).find(c => c.id === rdo.caso_id);
  const climaLabel = (v) => {
    if (!v) return <span className="text-gray-300">—</span>;
    const isPrat = !v.includes("Imprat");
    return <span className={`text-xs font-medium ${isPrat ? "text-green-600" : "text-blue-600"}`}>{v}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold" style={{ color: "#26405d" }}>
              {rdo.numero_rdo || "RDO"} — {rdo.data_hora ? format(new Date(rdo.data_hora), "dd/MM/yyyy", { locale: ptBR }) : ""}
            </h2>
            {rdo.area && <p className="text-xs text-gray-400 mt-0.5">Área: {rdo.area}</p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* Clima */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-500">Condições Climáticas</p>
            <div className="grid grid-cols-3 gap-3">
              {[["Manhã", rdo.condicoes_climaticas_manha], ["Tarde", rdo.condicoes_climaticas_tarde], ["Noite", rdo.condicoes_climaticas_noite]].map(([t, v]) => (
                <div key={t} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{t}</p>
                  {climaLabel(v)}
                </div>
              ))}
            </div>
          </div>

          {/* Mão de Obra */}
          {rdo.mao_de_obra?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-500">👥 Mão de Obra</p>
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50"><th className="text-left py-2 px-3">Qtd</th><th className="text-left py-2 px-3">Função</th></tr></thead>
                <tbody>{rdo.mao_de_obra.map((m, i) => <tr key={i} className="border-b border-gray-50"><td className="py-2 px-3 font-bold">{m.quantidade}</td><td className="py-2 px-3">{m.funcao}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* Equipamentos */}
          {rdo.equipamentos_rdo?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-500">🚜 Equipamentos</p>
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50"><th className="text-left py-2 px-3">Qtd</th><th className="text-left py-2 px-3">Equipamento</th><th className="text-left py-2 px-3">HM</th></tr></thead>
                <tbody>{rdo.equipamentos_rdo.map((e, i) => <tr key={i} className="border-b border-gray-50"><td className="py-2 px-3 font-bold">{e.quantidade}</td><td className="py-2 px-3">{e.equipamento}</td><td className="py-2 px-3">{e.horas || "—"}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* Atividades */}
          {rdo.atividades && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-500">📋 Atividades</p>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{rdo.atividades}</p>
            </div>
          )}

          {/* Ocorrências */}
          {rdo.ocorrencias && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-500">⚠️ Ocorrências</p>
              <p className="text-gray-700 bg-amber-50 rounded-lg p-3">{rdo.ocorrencias}</p>
              {rdo.responsabilidade && (
                <p className="text-xs mt-1 text-gray-500">Responsabilidade: <span className="font-semibold">{rdo.responsabilidade}</span></p>
              )}
            </div>
          )}

          {/* Impactos */}
          {rdo.impacto_ocorrencia?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-500">Categorias de Impacto</p>
              <div className="flex flex-wrap gap-2">
                {rdo.impacto_ocorrencia.map(c => (
                  <span key={c} className="text-xs px-2 py-1 rounded-full font-medium text-white" style={{ backgroundColor: "#c35e1e" }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Pleito */}
          {caso && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-bold text-blue-600 mb-1">🔗 Pleito Vinculado</p>
              <p className="text-sm text-blue-800 font-medium">{caso.titulo}</p>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-3 flex gap-3 justify-end">
          <Button variant="outline" className="text-xs gap-1.5" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />Gerar PDF
          </Button>
          <Button variant="outline" className="text-xs gap-1.5">
            <Paperclip className="w-4 h-4" />Anexar à Medição
          </Button>
          <Button onClick={onClose} className="text-white text-xs" style={{ backgroundColor: "#26405d" }}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────────
export default function RDOModule({ selectedProjectId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [editRDO, setEditRDO] = useState(null);
  const [viewRDO, setViewRDO] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: rdos = [], isLoading } = useQuery({
    queryKey: ["rdos_module", selectedProjectId],
    queryFn: () => entities.Incidente.filter({ projeto_id: selectedProjectId, tipo_registro: "RDO" }),
    enabled: !!selectedProjectId,
  });

  const { data: casos = [] } = useQuery({
    queryKey: ["casos", selectedProjectId],
    queryFn: () => entities.Caso.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.Incidente.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rdos_module"] }),
    onError: onErr,
  });

  let filtered = [...rdos];
  if (search) filtered = filtered.filter(r => (r.ocorrencias || r.atividades || r.numero_rdo || "").toLowerCase().includes(search.toLowerCase()));
  if (dateFrom) filtered = filtered.filter(r => r.data_hora && new Date(r.data_hora) >= new Date(dateFrom));
  if (dateTo) filtered = filtered.filter(r => r.data_hora && new Date(r.data_hora) <= new Date(dateTo + "T23:59:59"));

  const climaCell = (v) => {
    if (!v) return <span className="text-gray-300 text-xs">—</span>;
    const ok = !v.includes("Imprat");
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${ok ? "text-green-600" : "text-blue-700"}`}>
        {ok ? <Sun className="w-3 h-3" /> : <CloudRain className="w-3 h-3" />}
        {ok ? "Prat." : "Imprat."}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-gray-500 mb-1 block">Busca</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                <input className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm" placeholder="Descrição, ocorrência, nº RDO..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">De</label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Até</label>
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <Button onClick={() => { setEditRDO(null); setShowForm(true); }} className="text-white" style={{ backgroundColor: "#c35e1e" }}>
              <Plus className="w-4 h-4 mr-1" />Novo RDO
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Data", "Nº RDO", "Área", "Disciplina", "Clima M/T/N", "Mão de Obra", "Equip.", "Ocorrência", "Responsab.", "Pleito", "Ações"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={11} className="py-12 text-center text-gray-400">Carregando...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <FileText className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 font-medium">Nenhum RDO registrado</p>
                  <p className="text-gray-300 text-xs mt-1">Clique em "Novo RDO" para começar</p>
                </td>
              </tr>
            )}
            {filtered.map(rdo => {
              const caso = casos.find(c => c.id === rdo.caso_id);
              const nMdo = (rdo.mao_de_obra || []).reduce((s, m) => s + (parseInt(m.quantidade) || 0), 0);
              const nEquip = (rdo.equipamentos_rdo || []).reduce((s, e) => s + (parseInt(e.quantidade) || 0), 0);
              return (
                <tr key={rdo.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {rdo.data_hora ? format(new Date(rdo.data_hora), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-bold" style={{ color: "#26405d" }}>{rdo.numero_rdo || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-24 truncate">{rdo.area || "—"}</td>
                  <td className="px-4 py-3">
                    {rdo.disciplina ? (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{rdo.disciplina}</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {climaCell(rdo.condicoes_climaticas_manha)}
                      <span className="text-gray-200 text-xs">/</span>
                      {climaCell(rdo.condicoes_climaticas_tarde)}
                      <span className="text-gray-200 text-xs">/</span>
                      {climaCell(rdo.condicoes_climaticas_noite)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-gray-700">{nMdo > 0 ? nMdo : "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-gray-700">{nEquip > 0 ? nEquip : "—"}</span>
                  </td>
                  <td className="px-4 py-3 max-w-48">
                    {rdo.ocorrencias ? (
                      <p className="text-xs text-gray-600 line-clamp-2">{rdo.ocorrencias}</p>
                    ) : <span className="text-gray-300 text-xs">Sem ocorrência</span>}
                  </td>
                  <td className="px-4 py-3">
                    {rdo.responsabilidade ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rdo.responsabilidade === "Contratada" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                        {rdo.responsabilidade}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {caso ? <span className="text-xs text-blue-600 font-medium line-clamp-1 max-w-24">{caso.titulo.substring(0, 20)}…</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setViewRDO(rdo)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditRDO(rdo); setShowForm(true); }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(rdo.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <RDOForm
          rdo={editRDO}
          selectedProjectId={selectedProjectId}
          casos={casos}
          onClose={() => { setShowForm(false); setEditRDO(null); }}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ["rdos_module"] }); setShowForm(false); setEditRDO(null); }}
        />
      )}
      {viewRDO && <RDODetail rdo={viewRDO} casos={casos} onClose={() => setViewRDO(null)} />}
    </div>
  );
}