import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, Building } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const STATUS_COLORS = {
  Ativo: "bg-green-100 text-green-700",
  "Em Revisão": "bg-yellow-100 text-yellow-700",
  Suspenso: "bg-orange-100 text-orange-700",
  Encerrado: "bg-gray-100 text-gray-600",
  Cancelado: "bg-red-100 text-red-700",
};

const MEDICAO_STATUS_COLORS = {
  Elaboração: "bg-gray-100 text-gray-600",
  "Em Revisão": "bg-yellow-100 text-yellow-700",
  "Em Aprovação": "bg-blue-100 text-blue-700",
  Aprovada: "bg-green-100 text-green-700",
  Paga: "bg-emerald-100 text-emerald-700",
  Rejeitada: "bg-red-100 text-red-700",
};

export default function ContratoDetalhes({ contrato, medicoes, onBack, onEdit, onDelete, onNovaMedicao }) {
  const totalMedido = medicoes.filter(m => ["Aprovada", "Paga"].includes(m.status)).reduce((s, m) => s + (m.valor_liquido || 0), 0);
  const saldo = (contrato.valor_total || 0) - totalMedido;
  const percentMedido = contrato.valor_total ? (totalMedido / contrato.valor_total) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h2 className="text-lg font-bold flex-1" style={{ color: "#26405d" }}>Detalhes do Contrato</h2>
        <Button size="sm" variant="outline" onClick={() => onEdit(contrato)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
        <Button size="sm" variant="outline" className="text-red-500 border-red-200" onClick={() => onDelete(contrato.id)}><Trash2 className="w-4 h-4" /></Button>
      </div>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {contrato.numero && <span className="text-xs font-mono text-gray-400">{contrato.numero}</span>}
                <Badge className={STATUS_COLORS[contrato.status]}>{contrato.status}</Badge>
              </div>
              <h3 className="text-xl font-bold" style={{ color: "#26405d" }}>{contrato.objeto}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#c35e1e" }}>{fmt(contrato.valor_total)}</p>
              <p className="text-sm text-gray-500">Valor Total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Fornecedor</p>
                <p className="text-sm font-semibold text-gray-700">{contrato.fornecedor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Gestor</p>
                <p className="text-sm font-semibold text-gray-700">{contrato.gestor || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Vigência</p>
                <p className="text-sm font-semibold text-gray-700">{fmtDate(contrato.data_inicio)} → {fmtDate(contrato.data_fim)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Saldo</p>
                <p className="text-sm font-semibold" style={{ color: saldo >= 0 ? "#00a49a" : "#ef4444" }}>{fmt(saldo)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Medido</span>
              <span className="text-xs font-semibold" style={{ color: "#26405d" }}>{percentMedido.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(percentMedido, 100)}%`, backgroundColor: "#c35e1e" }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">Pago/Aprovado: {fmt(totalMedido)}</span>
              <span className="text-xs text-gray-400">Total: {fmt(contrato.valor_total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base" style={{ color: "#26405d" }}>Medições</CardTitle>
            <Button size="sm" className="text-white" style={{ backgroundColor: "#c35e1e" }} onClick={onNovaMedicao}>
              + Nova Medição
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {medicoes.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhuma medição registrada.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {medicoes.map(m => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Medição {m.numero}</span>
                    <span className="text-xs text-gray-400 ml-2">{m.periodo_inicio} → {m.periodo_fim}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm" style={{ color: "#26405d" }}>{fmt(m.valor_liquido || m.valor_bruto)}</span>
                    <Badge className={MEDICAO_STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"}>{m.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}