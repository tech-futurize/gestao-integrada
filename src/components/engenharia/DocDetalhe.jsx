import React, { useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { ETAPAS, DISC_COLORS, ETAPA_COLORS } from "@/lib/engenharia-constants";

export default function DocDetalhe({ doc, tarefas = [], onClose, onUpdate }) {
  const tarefaLabel = (id) => {
    if (!id) return "—";
    const t = tarefas.find(t => t.id === id);
    if (!t) return id;
    return t.codigo_wbs ? `${t.codigo_wbs} — ${t.nome}` : t.nome;
  };
  const [novaRevisao, setNovaRevisao] = useState({ revisao: "", data: "", observacao: "" });
  const [showRevModal, setShowRevModal] = useState(false);

  const discColor = DISC_COLORS[doc.disciplina] || "#374151";
  const etapaCfg = ETAPA_COLORS[doc.etapa] || {};

  const handleAddRevisao = () => {
    const hist = [...(doc.historico_revisoes || []), { ...novaRevisao, etapa: doc.etapa }];
    onUpdate(doc.id, { historico_revisoes: hist });
    setShowRevModal(false);
    setNovaRevisao({ revisao: "", data: "", observacao: "" });
  };

  const formatDate = (d) => d ? d.split("-").reverse().join("/").slice(0, 10) : "—";

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-base">Histórico — {doc.tag_id}</DialogTitle>
      </DialogHeader>

      {/* Cabeçalho do documento */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="h-2" style={{ backgroundColor: discColor }} />
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-bold" style={{ color: discColor }}>{doc.tag_id}</div>
              <h2 className="text-lg font-bold mt-1 text-foreground">{doc.titulo}</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-bold rounded px-2 py-0.5 text-white" style={{ backgroundColor: discColor }}>{doc.disciplina}</span>
              {doc.revisao_atual && (
                <span className="text-xs font-semibold bg-muted text-muted-foreground rounded px-2 py-0.5">{doc.revisao_atual}</span>
              )}
              <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: etapaCfg.bg, color: etapaCfg.text }}>{doc.etapa}</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Fornecedor", value: doc.fornecedor || "—" },
              { label: "Nº de Folhas", value: doc.num_folhas ? `A4 (${doc.num_folhas})` : "—" },
              { label: "Dt. Projetada", value: formatDate(doc.data_projetada) },
              { label: "Dt. Real", value: formatDate(doc.data_real) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
                <div className="font-medium mt-0.5 text-foreground">{value}</div>
              </div>
            ))}
          </div>

          {/* Cronograma */}
          {doc.id_cronograma && (
            <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-border">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">ID Cronograma</div>
                <div className="font-medium mt-0.5 text-foreground text-xs">{tarefaLabel(doc.id_cronograma)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Dt. Cronograma</div>
                <div className="font-medium mt-0.5 text-foreground">{formatDate(doc.data_cronograma)}</div>
              </div>
            </div>
          )}

          {/* Progresso */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span className="font-bold">{doc.progresso || 0}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(doc.progresso || 0, 100)}%`,
                  backgroundColor: (doc.progresso || 0) >= 70 ? "#16a34a" : (doc.progresso || 0) >= 40 ? "#d97706" : "#dc2626",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline de etapas */}
      {doc.historico_etapas && doc.historico_etapas.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-sm text-foreground">Timeline de Movimentações</h3>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {doc.historico_etapas.map((ev, i) => {
              const cfg = ETAPA_COLORS[ev.etapa] || {};
              return (
                <div key={i} className="flex items-start">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: cfg.text || "#374151" }}>{i + 1}</div>
                  </div>
                  <div className="ml-1 mr-4 min-w-32 flex-shrink-0">
                    <div className="text-xs font-semibold" style={{ color: cfg.text }}>{ev.etapa}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{ev.data}</div>
                    {ev.usuario && <div className="text-xs text-muted-foreground">{ev.usuario}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico de Revisões */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-foreground">Histórico de Revisões</h3>
          <Button size="sm" variant="outline" onClick={() => setShowRevModal(true)}>+ Nova Revisão</Button>
        </div>
        {(!doc.historico_revisoes || doc.historico_revisoes.length === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma revisão registrada</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["Revisão", "Data", "Etapa", "Observação"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.historico_revisoes.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-3 py-2 font-bold text-xs" style={{ color: "#c35e1e" }}>{r.revisao}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.data}</td>
                  <td className="px-3 py-2 text-xs text-foreground">{r.etapa}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.observacao || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nova revisão */}
      {showRevModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-foreground">Nova Revisão</h3>
              <button onClick={() => setShowRevModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase block mb-1">Revisão</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                  value={novaRevisao.revisao}
                  onChange={e => setNovaRevisao(f => ({ ...f, revisao: e.target.value }))}
                  placeholder="Rev.04" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase block mb-1">Data</label>
                <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                  value={novaRevisao.data}
                  onChange={e => setNovaRevisao(f => ({ ...f, data: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase block mb-1">Observação</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={novaRevisao.observacao}
                onChange={e => setNovaRevisao(f => ({ ...f, observacao: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRevModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddRevisao} variant="save">
                <Save className="w-3.5 h-3.5 mr-1" />Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
