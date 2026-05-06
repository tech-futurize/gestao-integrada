import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertTriangle, X, Calendar, Pencil, Trash2 } from "lucide-react";
import ItemMASForm from "./ItemMASForm";

const ETAPAS = [
  { key: "requisicao",  label: "Requisição",  cor: "#64748b" },
  { key: "cotacao",     label: "Cotação",     cor: "#374151" },
  { key: "patec",       label: "PATEC",       cor: "#4b5563" },
  { key: "aquisicao",   label: "Aquisição",   cor: "#92400e" },
  { key: "fabricacao",  label: "Fabricação",  cor: "#c35e1e" },
  { key: "transporte",  label: "Transporte",  cor: "#4d7c0f" },
  { key: "fornecimento",label: "Fornecimento",cor: "#15803d" },
];

const STATUS_COLORS = {
  "A iniciar":   "bg-gray-100 text-gray-700",
  "Em andamento":"bg-orange-100 text-orange-700",
  "Concluído":   "bg-green-100 text-green-700",
  "Cancelado":   "bg-red-100 text-red-700",
};

const DEFAULT_ETAPAS = ETAPAS.map(e => ({ nome: e.label, status: "pendente", data: "" }));

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
}

function getEtapaStatus(item, idx) {
  return item.etapas?.[idx]?.status || "pendente";
}

function NodeColor(status) {
  if (status === "concluida")    return "#15803d";
  if (status === "em_andamento") return "#c35e1e";
  if (status === "nao_aplicavel") return "#d1d5db";
  return "#d1d5db";
}

function Popover({ item, etapaIdx, onClose, onSave }) {
  const etapa = item.etapas?.[etapaIdx] || { nome: ETAPAS[etapaIdx].label, status: "pendente", data: "" };
  const [status, setStatus] = useState(etapa.status);
  const [data, setData] = useState(etapa.data || "");

  const handleSave = () => {
    const novasEtapas = [...(item.etapas || DEFAULT_ETAPAS)];
    // Ensure array has 7 slots
    while (novasEtapas.length < 7) novasEtapas.push({ nome: ETAPAS[novasEtapas.length].label, status: "pendente", data: "" });

    // Cascade logic
    if (status === "concluida") {
      for (let i = 0; i <= etapaIdx; i++) {
        novasEtapas[i] = { ...novasEtapas[i], nome: ETAPAS[i].label, status: "concluida" };
      }
      novasEtapas[etapaIdx].data = data;
    } else if (status === "pendente") {
      // Reset forward steps
      for (let i = etapaIdx; i < 7; i++) {
        novasEtapas[i] = { ...novasEtapas[i], status: "pendente", data: "" };
      }
    } else {
      novasEtapas[etapaIdx] = { ...novasEtapas[etapaIdx], nome: ETAPAS[etapaIdx].label, status, data };
    }

    // Fill gaps with projected dates (+7 days each)
    let lastDate = null;
    for (let i = 0; i < 7; i++) {
      if (novasEtapas[i].data) {
        lastDate = new Date(novasEtapas[i].data);
      } else if (lastDate) {
        lastDate = new Date(lastDate.getTime() + 7 * 86400000);
        novasEtapas[i] = { ...novasEtapas[i], data: lastDate.toISOString().split("T")[0] };
      }
    }

    // Determine new item status
    const allDone = novasEtapas.every(e => e.status === "concluida" || e.status === "nao_aplicavel");
    const hasCancelled = item.status === "Cancelado";
    const anyActive = novasEtapas.some(e => e.status === "em_andamento");
    const anyDone = novasEtapas.some(e => e.status === "concluida");
    let novoStatus = item.status;
    if (!hasCancelled) {
      if (allDone) novoStatus = "Concluído";
      else if (anyActive || anyDone) novoStatus = "Em andamento";
      else novoStatus = "A iniciar";
    }

    onSave({ etapas: novasEtapas, status: novoStatus });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-72 p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-800">{ETAPAS[etapaIdx].label}</p>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status da etapa</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="pendente">Não iniciada</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="nao_aplicavel">Não aplicável</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Data referência</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={data}
              onChange={e => setData(e.target.value)}
            />
          </div>
          <Button className="w-full text-white text-sm" style={{ backgroundColor: "#26405d" }} onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MapaSuprimentos({ selectedProjectId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [popover, setPopover] = useState(null); // { itemId, etapaIdx }
  const [filtroSC, setFiltroSC] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroSolicitante, setFiltroSolicitante] = useState("");
  const [filtroAlerta, setFiltroAlerta] = useState("");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itemMAS", selectedProjectId],
    queryFn: () => entities.ItemMAS.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }) => entities.ItemMAS.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itemMAS"] }),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => entities.ItemMAS.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itemMAS"] }),
  });

  // KPIs: count items at each stage (furthest active/in-progress)
  const kpis = ETAPAS.map((etapa, idx) => ({
    ...etapa,
    count: itens.filter(item => {
      const etapas = item.etapas || [];
      const current = etapas.findIndex(e => e.status === "em_andamento");
      if (current === idx) return true;
      if (current === -1) {
        const lastDone = [...(item.etapas || [])].reverse().findIndex(e => e.status === "concluida");
        if (lastDone !== -1) {
          const realIdx = 6 - lastDone;
          return realIdx === idx;
        }
      }
      return false;
    }).length,
  }));

  // Filters
  let filtered = [...itens];
  if (filtroSC) filtered = filtered.filter(i => i.numero_sc?.toLowerCase().includes(filtroSC.toLowerCase()));
  if (filtroStatus) filtered = filtered.filter(i => i.status === filtroStatus);
  if (filtroEtapa) filtered = filtered.filter(i => {
    const idx = ETAPAS.findIndex(e => e.label === filtroEtapa);
    if (idx < 0) return true;
    return (i.etapas?.[idx]?.status === "em_andamento" || i.etapas?.[idx]?.status === "concluida");
  });
  if (filtroSolicitante) filtered = filtered.filter(i => i.solicitante?.toLowerCase().includes(filtroSolicitante.toLowerCase()));
  if (filtroAlerta === "atrasado") {
    const hoje = new Date().toISOString().split("T")[0];
    filtered = filtered.filter(i => {
      const fornData = i.etapas?.[6]?.data;
      return fornData && fornData > (i.data_necessidade || "9999") && i.status !== "Concluído";
    });
  }
  if (filtroAlerta === "cancelado_aquisicao") {
    filtered = filtered.filter(i => i.status === "Cancelado" && (i.etapas?.[3]?.status === "em_andamento" || i.etapas?.[3]?.status === "concluida"));
  }

  const isAtrasado = (item) => {
    const fornData = item.etapas?.[6]?.data;
    return fornData && item.data_necessidade && fornData > item.data_necessidade && item.status !== "Concluído";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map(etapa => (
          <Card key={etapa.key} className="shadow-sm border-0" style={{ backgroundColor: etapa.cor }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-white">{etapa.count}</p>
              <p className="text-xs text-white/80 mt-1 leading-tight">{etapa.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-32">
              <label className="text-xs text-gray-500 mb-1 block">Nº SC</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                <input className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm" placeholder="SC-0001" value={filtroSC} onChange={e => setFiltroSC(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="">Todos</option>
                {["A iniciar", "Em andamento", "Concluído", "Cancelado"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Etapa</label>
              <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
                <option value="">Todas</option>
                {ETAPAS.map(e => <option key={e.key}>{e.label}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-32">
              <label className="text-xs text-gray-500 mb-1 block">Solicitante</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" placeholder="Nome..." value={filtroSolicitante} onChange={e => setFiltroSolicitante(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Alertas</label>
              <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={filtroAlerta} onChange={e => setFiltroAlerta(e.target.value)}>
                <option value="">Nenhum</option>
                <option value="atrasado">Fornecimento Atrasado</option>
                <option value="cancelado_aquisicao">Cancelado em Aquisição</option>
              </select>
            </div>
            <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="text-white" style={{ backgroundColor: "#c35e1e" }}>
              <Plus className="w-4 h-4 mr-1" />Novo Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 min-w-48">Descrição</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Und / Qtd</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Nº SC</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 min-w-96">Linha do Tempo do Processo</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Data Neces.</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="py-3 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">Carregando...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <p className="text-gray-400 font-medium">Nenhum item cadastrado</p>
                  <p className="text-gray-300 text-xs mt-1">Clique em "Novo Item" para começar</p>
                </td>
              </tr>
            )}
            {filtered.map(item => {
              const etapas = item.etapas?.length === 7 ? item.etapas : DEFAULT_ETAPAS;
              const atrasado = isAtrasado(item);

              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800 text-xs leading-snug">{item.descricao}</p>
                    {item.solicitante && <p className="text-gray-400 text-xs mt-0.5">{item.solicitante}</p>}
                  </td>
                  <td className="py-3 px-3 text-center text-xs text-gray-600 whitespace-nowrap">
                    {item.quantidade ? `${item.quantidade} ${item.unidade || ""}` : "—"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{item.numero_sc || "—"}</span>
                  </td>

                  {/* Timeline */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-0">
                      {ETAPAS.map((etapaConf, idx) => {
                        const est = getEtapaStatus(item, idx);
                        const cor = NodeColor(est);
                        const dataEtapa = etapas[idx]?.data;
                        const isLast = idx === ETAPAS.length - 1;

                        return (
                          <React.Fragment key={etapaConf.key}>
                            <div className="flex flex-col items-center">
                              <span className="text-gray-400" style={{ fontSize: 9, marginBottom: 2, whiteSpace: "nowrap" }}>{etapaConf.label}</span>
                              <button
                                onClick={() => setPopover({ itemId: item.id, etapaIdx: idx })}
                                className="w-5 h-5 rounded-full border-2 border-white shadow transition-transform hover:scale-125 focus:outline-none"
                                style={{ backgroundColor: cor, boxShadow: `0 0 0 2px ${cor}40` }}
                                title={`${etapaConf.label}: ${est}`}
                              />
                              <span className="text-gray-400 mt-1" style={{ fontSize: 8, whiteSpace: "nowrap" }}>
                                {fmtDate(dataEtapa)}
                              </span>
                            </div>
                            {!isLast && (
                              <div className="h-0.5 flex-1 mx-1" style={{ backgroundColor: est === "concluida" ? "#15803d" : "#e5e7eb", minWidth: 12 }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {item.data_necessidade ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${atrasado ? "bg-red-100 text-red-700 font-bold" : "text-gray-600"}`}>
                        {atrasado && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                        {fmtDate(item.data_necessidade)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(item); setShowForm(true); }} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem.mutate(item.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Popover */}
      {popover && (() => {
        const item = itens.find(i => i.id === popover.itemId);
        if (!item) return null;
        return (
          <Popover
            item={item}
            etapaIdx={popover.etapaIdx}
            onClose={() => setPopover(null)}
            onSave={(data) => updateItem.mutate({ id: item.id, data })}
          />
        );
      })()}

      {/* Form modal */}
      {showForm && (
        <ItemMASForm
          item={editItem}
          selectedProjectId={selectedProjectId}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ["itemMAS"] }); setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}