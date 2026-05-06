import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function MapaAnalise({ cotacoes }) {
  const cotacoesComPropostas = cotacoes.filter(c => c.propostas?.length > 0);

  if (!cotacoesComPropostas.length) return (
    <Card className="text-center p-12">
      <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 font-medium">Nenhuma cotação com propostas</p>
      <p className="text-gray-400 text-sm mt-1">Cadastre cotações e adicione propostas de fornecedores para visualizar o mapa de análise.</p>
    </Card>
  );

  return (
    <div className="space-y-6">
      {cotacoesComPropostas.map(cot => {
        const propostas = cot.propostas || [];
        const valores = propostas.map(p => parseFloat(p.valor_total) || 0);
        const menorValor = Math.min(...valores);
        const maiorValor = Math.max(...valores);

        return (
          <Card key={cot.id} className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base" style={{ color: "#26405d" }}>{cot.titulo}</CardTitle>
                  {cot.numero && <p className="text-xs text-gray-400 mt-0.5">{cot.numero}</p>}
                </div>
                <Badge className={cot.status === "Aprovada" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                  {cot.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Fornecedor</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Valor Total</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Prazo</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Pagamento</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Comparativo</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propostas.map((p, i) => {
                      const val = parseFloat(p.valor_total) || 0;
                      const isMenor = val === menorValor && val > 0;
                      const isMaior = val === maiorValor && propostas.length > 1;
                      const pct = maiorValor > 0 ? (val / maiorValor) * 100 : 0;
                      const isSelecionado = cot.fornecedor_selecionado === p.fornecedor;

                      return (
                        <tr key={i} className={`border-b border-gray-50 ${isSelecionado ? "bg-emerald-50" : isMenor ? "bg-green-50" : ""}`}>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{p.fornecedor || "—"}</span>
                              {isSelecionado && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Selecionado</span>}
                              {isMenor && !isSelecionado && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">⭐ Menor</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold" style={{ color: isMenor ? "#00a49a" : isMaior && propostas.length > 1 ? "#ef4444" : "#26405d" }}>
                            {fmt(val)}
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-600 text-xs">{p.prazo_entrega || "—"}</td>
                          <td className="py-2.5 px-3 text-center text-gray-600 text-xs">{p.condicao_pagamento || "—"}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isMenor ? "#00a49a" : "#c35e1e" }} />
                              </div>
                              <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-gray-400">{p.observacoes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {cot.parecer && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Parecer Comercial</p>
                  <p className="text-sm text-amber-800">{cot.parecer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}