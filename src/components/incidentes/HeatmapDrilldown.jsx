import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, ArrowLeft, FileText, Calendar, User, AlertTriangle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  Registrado: "bg-blue-100 text-blue-800",
  "Em Análise": "bg-yellow-100 text-yellow-800",
  Resolvido: "bg-green-100 text-green-800",
  Fechado: "bg-gray-100 text-gray-800",
};

const tipoColors = {
  "Ata de Reunião": "bg-purple-100 text-purple-800",
  RDO: "bg-blue-100 text-blue-800",
  "E-mail": "bg-orange-100 text-orange-800",
  Notificação: "bg-red-100 text-red-800",
};

function RegistroDetalhe({ registro, onBack }) {
  const isRDO = registro.tipo_registro === "RDO";
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" />
        Voltar à lista
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={tipoColors[registro.tipo_registro] || "bg-gray-100 text-gray-700"}>
          {registro.tipo_registro}
        </Badge>
        {registro.status && (
          <Badge variant="outline" className={statusColors[registro.status] || "bg-gray-100 text-gray-700"}>
            {registro.status}
          </Badge>
        )}
        {registro.responsabilidade && (
          <Badge variant="outline" className={registro.responsabilidade === "Contratada" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}>
            {registro.responsabilidade}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {registro.data_hora && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Data / Hora</p>
              <p className="text-sm font-medium text-gray-800">
                {format(new Date(registro.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}
        {registro.responsavel_registro && (
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Responsável</p>
              <p className="text-sm font-medium text-gray-800">{registro.responsavel_registro}</p>
            </div>
          </div>
        )}
        {registro.gravidade && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Gravidade</p>
              <p className="text-sm font-medium text-gray-800">{registro.gravidade}</p>
            </div>
          </div>
        )}
      </div>

      {isRDO ? (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">RDO Nº / Disciplina / Área</p>
            <p className="text-sm font-semibold text-gray-800">
              {registro.numero_rdo || "—"} · {registro.disciplina || "—"} {registro.area ? `· ${registro.area}` : ""}
            </p>
          </div>
          {registro.atividades && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Atividades</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{registro.atividades}</p>
            </div>
          )}
          {registro.ocorrencias && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Ocorrências</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{registro.ocorrencias}</p>
            </div>
          )}
          {registro.mao_de_obra?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Mão de Obra</p>
              <div className="space-y-1">
                {registro.mao_de_obra.map((m, i) => (
                  <p key={i} className="text-sm text-gray-700">{m.quantidade}x {m.funcao}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {registro.descricao && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Descrição</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{registro.descricao}</p>
            </div>
          )}
          {registro.impacto_preliminar && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Impacto Preliminar</p>
              <p className="text-sm text-gray-700">{registro.impacto_preliminar}</p>
            </div>
          )}
        </div>
      )}

      {registro.impacto_ocorrencia?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Categorias de Impacto</p>
          <div className="flex flex-wrap gap-1">
            {registro.impacto_ocorrencia.map((cat) => (
              <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#f5ddd2", color: "#7a330a" }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeatmapDrilldown({ open, onClose, category, weekLabel, registros }) {
  const [selected, setSelected] = useState(null);

  if (!open) return null;

  // Real registros only (those with an id from DB)
  const realRegistros = registros.filter(r => r.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => { setSelected(null); onClose(); }}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: "3px solid #c35e1e" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100" style={{ backgroundColor: "#26405d" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
              {weekLabel}
            </p>
            <h3 className="text-base font-bold text-white mt-0.5">{category}</h3>
            {!selected && (
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                {realRegistros.length === 0
                  ? "Nenhum registro real cadastrado nesta célula"
                  : `${realRegistros.length} registro(s) encontrado(s)`}
              </p>
            )}
          </div>
          <button onClick={() => { setSelected(null); onClose(); }}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {selected ? (
            <RegistroDetalhe registro={selected} onBack={() => setSelected(null)} />
          ) : realRegistros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <FileText className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">Nenhum registro cadastrado no sistema para</p>
              <p className="text-gray-700 font-semibold mt-1">{category} · {weekLabel}</p>
              <p className="text-xs text-gray-400 mt-3">Os dados exibidos no heatmap incluem registros de demonstração.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {realRegistros.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${tipoColors[r.tipo_registro] || "bg-gray-100 text-gray-700"}`}>
                          {r.tipo_registro}
                        </Badge>
                        {r.status && (
                          <Badge variant="outline" className={`text-xs ${statusColors[r.status] || ""}`}>
                            {r.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {r.tipo_registro === "RDO"
                          ? `RDO Nº ${r.numero_rdo || "—"} · ${r.disciplina || ""}`
                          : r.descricao}
                      </p>
                      {r.data_hora && (
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(r.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-orange-400 rotate-180 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}