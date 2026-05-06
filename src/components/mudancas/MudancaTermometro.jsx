import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp, DollarSign, Calendar, AlertTriangle } from "lucide-react";

export default function MudancaTermometro({ mudancas, projeto }) {
  const orcamentoInicial = projeto?.valor_contrato || 0;

  const { aprovadas, emNegociacao, emAnalise, identificadas } = useMemo(() => ({
    aprovadas: mudancas.filter(m => m.status === "Aprovada"),
    emNegociacao: mudancas.filter(m => m.status === "Em Negociação"),
    emAnalise: mudancas.filter(m => m.status === "Em Análise"),
    identificadas: mudancas.filter(m => m.status === "Identificada"),
  }), [mudancas]);

  const custoAprovado = aprovadas.reduce((acc, m) => acc + (m.impacto_custo || 0), 0);
  const custoNegociacao = emNegociacao.reduce((acc, m) => acc + (m.impacto_custo || 0), 0);
  const custoAnalise = emAnalise.reduce((acc, m) => acc + (m.impacto_custo || 0), 0);

  const prazoAprovado = aprovadas.reduce((acc, m) => acc + (m.impacto_prazo_dias || 0), 0);
  const prazoNegociacao = emNegociacao.reduce((acc, m) => acc + (m.impacto_prazo_dias || 0), 0);

  const eacAprovado = orcamentoInicial + custoAprovado;
  const eacNegociacao = eacAprovado + custoNegociacao;
  const eacPessimista = eacNegociacao + custoAnalise;

  const barData = [
    { name: "Orçamento\nInicial", valor: orcamentoInicial, fill: "#26405d" },
    { name: "Com Mudanças\nAprovadas", valor: eacAprovado, fill: "#22c55e" },
    { name: "Com Em\nNegociação", valor: eacNegociacao, fill: "#f59e0b" },
    { name: "Cenário\nPessimista", valor: eacPessimista, fill: "#ef4444" },
  ];

  const formatCurrency = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const formatMillions = (v) => `R$ ${(v / 1000000).toFixed(2)}M`;

  const desvioPerc = orcamentoInicial > 0 ? ((eacAprovado - orcamentoInicial) / orcamentoInicial * 100).toFixed(1) : 0;

  // Detail table
  const detailRows = [
    { label: "Aprovadas", items: aprovadas, color: "text-green-700", bgColor: "bg-green-50" },
    { label: "Em Negociação", items: emNegociacao, color: "text-amber-700", bgColor: "bg-amber-50" },
    { label: "Em Análise", items: emAnalise, color: "text-blue-700", bgColor: "bg-blue-50" },
    { label: "Identificadas", items: identificadas, color: "text-gray-600", bgColor: "bg-gray-50" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-500 font-medium">Orçamento Inicial</p>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatMillions(orcamentoInicial)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-500 font-medium">EAC (Aprovadas)</p>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatMillions(eacAprovado)}</p>
            <p className={`text-xs font-medium mt-0.5 ${parseFloat(desvioPerc) >= 0 ? "text-red-600" : "text-green-600"}`}>
              {desvioPerc >= 0 ? "+" : ""}{desvioPerc}% desvio
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-gray-500 font-medium">EAC (+ Negociação)</p>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatMillions(eacNegociacao)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-orange-500" />
              <p className="text-xs text-gray-500 font-medium">Desvio Prazo Aprovado</p>
            </div>
            <p className={`text-lg font-bold ${prazoAprovado > 0 ? "text-red-600" : "text-green-600"}`}>
              {prazoAprovado >= 0 ? "+" : ""}{prazoAprovado} dias
            </p>
            {prazoNegociacao !== 0 && (
              <p className="text-xs text-amber-600 mt-0.5">+{prazoNegociacao}d em negociação</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detailRows.map(({ label, items, color, bgColor }) => (
              <div key={label}>
                <div className={`flex items-center justify-between p-3 rounded-lg ${bgColor} mb-2`}>
                  <span className={`font-semibold text-sm ${color}`}>{label} ({items.length})</span>
                  <div className="flex gap-4 text-sm">
                    <span className={`font-bold ${color}`}>
                      {items.reduce((a, m) => a + (m.impacto_custo || 0), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                    </span>
                    <span className={`font-bold ${color}`}>
                      {items.reduce((a, m) => a + (m.impacto_prazo_dias || 0), 0)} dias
                    </span>
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="pl-3 space-y-1">
                    {items.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">
                        <span className="flex-1 truncate mr-4">{m.titulo}</span>
                        <div className="flex gap-3 shrink-0">
                          {m.categorias?.map(c => (
                            <Badge key={c} variant="outline" className="text-xs py-0 h-4">{c}</Badge>
                          ))}
                          {m.impacto_custo != null && (
                            <span className={m.impacto_custo >= 0 ? "text-red-600" : "text-green-600"}>
                              {m.impacto_custo >= 0 ? "+" : ""}{m.impacto_custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}