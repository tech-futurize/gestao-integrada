import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TakeOffCommodities from "../components/planejamento/TakeOffCommodities";
import RDOModule from "../components/rdo/RDOModule";
import {
  ClipboardList, BookOpen, CalendarRange, Ruler, FileText,
  Plus, CheckCircle, AlertCircle, Pencil, Trash2, X, Save
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Cronograma from "./Cronograma";
import Contratos from "./Contratos";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

const TABS = [
  { id: "cronograma", label: "Cronograma", icon: CalendarRange, color: "#26405d" },
  { id: "6wla", label: "6WLA", icon: CalendarRange, color: "#3b82f6" },
  { id: "takeof", label: "Take-Off / Mapa de Controle", icon: Ruler, color: "#c35e1e" },
  { id: "contratos", label: "Contratos", icon: BookOpen, color: "#26405d" },
  { id: "medicoes", label: "Medições", icon: Ruler, color: "#00a49a" },
  { id: "rdo", label: "RDO", icon: FileText, color: "#c35e1e" },
];

const SEMANAS = ["S1 (31/mar)", "S2 (07/abr)", "S3 (14/abr)", "S4 (21/abr)", "S5 (28/abr)", "S6 (05/mai)"];

// ── GENERIC MODAL ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, accentColor }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold" style={{ color: accentColor }}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white";

// ── 6WLA ───────────────────────────────────────────────────────────────────────
const WLA_DEFAULTS = { atividade: "", responsavel: "", liberadas: [false, false, false, false, false, false], semanas: [false, false, false, false, false, false], ppc: 0 };
const RESTRICOES_LABELS = ["Mão de obra", "Material", "Equipamento", "Método", "Medição", "Segurança"];

function WlaModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { ...item } : WLA_DEFAULTS);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (key, i) => {
    const arr = [...form[key]];
    arr[i] = !arr[i];
    setForm(f => ({ ...f, [key]: arr }));
  };

  return (
    <Modal title={item ? "Editar Atividade 6WLA" : "Nova Atividade 6WLA"} onClose={onClose} accentColor="#3b82f6">
      <div className="space-y-4">
        <Field label="Atividade"><input className={inputCls} value={form.atividade} onChange={e => set("atividade", e.target.value)} placeholder="Descrição da atividade" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsável"><input className={inputCls} value={form.responsavel} onChange={e => set("responsavel", e.target.value)} /></Field>
          <Field label="PPC (%)"><input type="number" min={0} max={100} className={inputCls} value={form.ppc} onChange={e => set("ppc", Number(e.target.value))} /></Field>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Restrições (marque as liberadas)</label>
          <div className="grid grid-cols-2 gap-2">
            {RESTRICOES_LABELS.map((r, i) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" checked={form.liberadas[i]} onChange={() => toggleArr("liberadas", i)} className="w-4 h-4 accent-blue-500" />
                <span className="text-sm text-gray-700">{r}</span>
                {form.liberadas[i]
                  ? <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                  : <AlertCircle className="w-4 h-4 ml-auto text-red-400" />}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Semanas Ativas</label>
          <div className="grid grid-cols-3 gap-2">
            {SEMANAS.map((s, i) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                <input type="checkbox" checked={form.semanas[i]} onChange={() => toggleArr("semanas", i)} className="w-4 h-4 accent-blue-500" />
                <span className="text-xs text-gray-700">{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(form)} style={{ backgroundColor: "#3b82f6" }}><Save className="w-4 h-4 mr-1" />Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}

function SixWLA({ projetoId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [modal, setModal] = useState(null);

  const { data: items = [], isPending, isError } = useQuery({
    queryKey: ["itens_6wla", projetoId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Item6WLA.create({ ...data, projeto_id: projetoId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }); setModal(null); },
    onError: onErr,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Item6WLA.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }); setModal(null); },
    onError: onErr,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Item6WLA.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itens_6wla"] }),
    onError: onErr,
  });

  const save = (form) => {
    if (modal === "new") createMutation.mutate(form);
    else updateMutation.mutate({ id: modal.item.id, data: form });
  };
  const remove = (id) => deleteMutation.mutate(id);

  const avgPPC = items.filter(a => a.ppc > 0).length
    ? Math.round(items.filter(a => a.ppc > 0).reduce((s, a) => s + a.ppc, 0) / items.filter(a => a.ppc > 0).length)
    : 0;

  if (isPending) return <div className="py-8 text-center text-gray-400 text-sm">Carregando...</div>;
  if (isError) return (
    <div className="py-12 text-center space-y-2">
      <p className="text-sm font-medium text-gray-500">Não foi possível carregar o 6WLA.</p>
      <p className="text-xs text-gray-400">Verifique se a tabela <code className="bg-gray-100 px-1 rounded">itens_6wla</code> existe no banco de dados.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4">
          <div className="text-center"><div className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{avgPPC}%</div><div className="text-xs text-gray-500">PPC Médio</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-green-600">{items.filter(a => (a.liberadas || []).every(Boolean)).length}</div><div className="text-xs text-gray-500">Ativ. liberadas</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-yellow-600">{items.filter(a => !(a.liberadas || []).every(Boolean)).length}</div><div className="text-xs text-gray-500">Com restrição</div></div>
        </div>
        <Button size="sm" onClick={() => setModal("new")} style={{ backgroundColor: "#3b82f6" }}><Plus className="w-3 h-3 mr-1" />Nova Atividade</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 min-w-44">Atividade</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 min-w-24">Responsável</th>
              {RESTRICOES_LABELS.map(r => <th key={r} className="px-2 py-3 text-center font-semibold text-gray-600 w-10" title={r}>{r.slice(0, 3)}</th>)}
              {SEMANAS.map(s => <th key={s} className="px-2 py-3 text-center font-semibold text-gray-600 min-w-16">{s}</th>)}
              <th className="px-3 py-3 text-center font-semibold text-gray-600">PPC</th>
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a, i) => (
              <tr key={a.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="px-4 py-3 font-medium text-gray-700">{a.atividade}</td>
                <td className="px-3 py-3 text-gray-500">{a.responsavel}</td>
                {(a.liberadas || [false,false,false,false,false,false]).map((lib, j) => (
                  <td key={j} className="px-2 py-3 text-center">
                    {lib ? <CheckCircle className="w-4 h-4 mx-auto text-green-500" /> : <AlertCircle className="w-4 h-4 mx-auto text-red-400" />}
                  </td>
                ))}
                {(a.semanas || [false,false,false,false,false,false]).map((ativo, j) => (
                  <td key={j} className="px-2 py-3 text-center">
                    <span className="inline-block w-5 h-5 rounded" style={{ backgroundColor: ativo ? "#3b82f6" : "#f3f4f6" }} />
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  {a.ppc > 0
                    ? <span className="font-bold text-sm" style={{ color: a.ppc >= 80 ? "#16a34a" : a.ppc >= 60 ? "#d97706" : "#dc2626" }}>{a.ppc}%</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setModal({ item: a })} className="text-gray-400 hover:text-blue-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(a.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <WlaModal item={modal === "new" ? null : modal.item} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function Planejamento() {
  const [activeTab, setActiveTab] = useState("cronograma");
  const { selectedProjectId } = useProject();
  const tab = TABS.find(t => t.id === activeTab);

  if (!selectedProjectId) {
    return <PageEmptyState icon={ClipboardList} description="Selecione um projeto no menu lateral para acessar o planejamento." />;
  }

  return (
    <div className="p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2">
              <t.icon className="w-4 h-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="cronograma">
          <Cronograma />
        </TabsContent>
        <TabsContent value="6wla">
          <Card className="bg-white shadow-sm"><CardContent className="p-6"><SixWLA projetoId={selectedProjectId} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="takeof">
          <TakeOffCommodities />
        </TabsContent>
        <TabsContent value="contratos">
          <Contratos initialTab="contratos" />
        </TabsContent>
        <TabsContent value="medicoes">
          <Contratos initialTab="medicoes" />
        </TabsContent>
        <TabsContent value="rdo">
          <RDOModule selectedProjectId={selectedProjectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}