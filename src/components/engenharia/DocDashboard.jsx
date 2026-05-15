import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { ETAPAS, DISC_COLORS, ETAPA_COLORS_PIE } from "@/lib/engenharia-constants";

export default function DocDashboard({ docs }) {
  const today = new Date().toISOString().split("T")[0];

  // Por disciplina
  const disciplinas = [...new Set(docs.map(d => d.disciplina))];
  const byDisc = disciplinas.map(disc => {
    const ds = docs.filter(d => d.disciplina === disc);
    return {
      disciplina: disc,
      progresso: ds.length ? Math.round(ds.reduce((s, d) => s + (d.progresso || 0), 0) / ds.length) : 0,
      total: ds.length,
    };
  });

  // Por etapa (donut)
  const byEtapa = ETAPAS.map((e, i) => ({
    name: e, value: docs.filter(d => d.etapa === e).length, color: ETAPA_COLORS_PIE[i]
  })).filter(e => e.value > 0);

  // Fornecedores ranking
  const fornecedores = [...new Set(docs.map(d => d.fornecedor).filter(Boolean))];
  const byFornecedor = fornecedores.map(f => {
    const ds = docs.filter(d => d.fornecedor === f);
    const vencidos = ds.filter(d => d.data_projetada && d.data_projetada < today && d.etapa !== "Aprovado").length;
    return {
      fornecedor: f.length > 18 ? f.slice(0, 18) + "…" : f,
      total: ds.length,
      progresso: ds.length ? Math.round(ds.reduce((s, d) => s + (d.progresso || 0), 0) / ds.length) : 0,
      vencidos,
    };
  }).sort((a, b) => b.total - a.total);

  // Curva S (simulada por etapa)
  const curvaS = ETAPAS.map((e, i) => {
    const docsAte = docs.filter(d => ETAPAS.indexOf(d.etapa) >= i);
    const previsto = Math.round(((i + 1) / ETAPAS.length) * 100);
    const realizado = docs.length ? Math.round(docs.reduce((s, d) => s + (d.progresso || 0), 0) / docs.length * ((i + 1) / ETAPAS.length)) : 0;
    return { etapa: e.split(" ")[0], previsto, realizado };
  });

  // Docs críticos (vencidos + baixo progresso)
  const criticos = docs.filter(d => d.data_projetada && d.data_projetada < today && d.etapa !== "Aprovado")
    .sort((a, b) => (a.progresso || 0) - (b.progresso || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Avanço por Disciplina */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: "#26405d" }}>Avanço por Disciplina</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDisc} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="disciplina" tick={{ fontSize: 11 }} width={35} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="progresso" name="Progresso %" radius={[0, 4, 4, 0]}>
                {byDisc.map((d, i) => <Cell key={i} fill={DISC_COLORS[d.disciplina] || "#374151"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Documentos por Etapa */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: "#26405d" }}>Documentos por Etapa</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={byEtapa} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {byEtapa.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {byEtapa.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-gray-600 truncate max-w-32">{e.name}</span>
                  </div>
                  <span className="font-bold" style={{ color: e.color }}>{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Curva S */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: "#26405d" }}>Curva S de Avanço</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={curvaS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="etapa" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="previsto" stroke="#26405d" strokeWidth={2} strokeDasharray="5 5" name="Previsto" dot={false} />
              <Line type="monotone" dataKey="realizado" stroke="#c35e1e" strokeWidth={2} name="Realizado" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fornecedores */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: "#26405d" }}>Performance de Fornecedores</h3>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 border-b">
              {["Fornecedor", "Docs", "Avanço Médio", "Vencidos"].map(h => <th key={h} className="px-2 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {byFornecedor.map((f, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-2 py-2 font-medium text-gray-700">{f.fornecedor}</td>
                  <td className="px-2 py-2 text-center font-bold" style={{ color: "#26405d" }}>{f.total}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${f.progresso}%`, backgroundColor: f.progresso >= 70 ? "#16a34a" : f.progresso >= 40 ? "#d97706" : "#dc2626" }} />
                      </div>
                      <span className="font-bold" style={{ color: f.progresso >= 70 ? "#16a34a" : "#d97706" }}>{f.progresso}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center font-bold" style={{ color: f.vencidos > 0 ? "#dc2626" : "#16a34a" }}>{f.vencidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Docs críticos */}
      {criticos.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5">
          <h3 className="font-semibold mb-3 text-sm text-red-600">⚠ Documentos Vencidos — Ação Necessária</h3>
          <div className="space-y-2">
            {criticos.map(doc => {
              const daysLate = Math.abs(Math.ceil((new Date(doc.data_projetada) - new Date()) / 86400000));
              return (
                <div key={doc.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-red-50 text-xs">
                  <span className="font-bold" style={{ color: DISC_COLORS[doc.disciplina] || "#374151" }}>{doc.tag_id}</span>
                  <span className="flex-1 text-gray-700 truncate">{doc.titulo}</span>
                  <span className="text-gray-500">{doc.fornecedor}</span>
                  <span className="font-bold text-red-600">{daysLate}d atraso</span>
                  <span className="font-bold text-gray-600">{doc.progresso}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}