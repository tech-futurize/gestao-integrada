// PlanejamentoSection.jsx — Seção Planejamento do dashboard
// Sub-blocos: Cronograma | Financeiro | Escopo
// Todos dentro de um único Card com bordas internas entre sub-blocos.

import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ClipboardList,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  SectionHeader,
  KpiCard,
  SubSectionBand,
  formatMilhoes,
} from "@/components/dashboard/DashboardPrimitives";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatMes(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function formatHH(value) {
  if (!value && value !== 0) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

function formatMesLabel(mesStr) {
  // mesStr pode ser "2024-01" ou "2025-03"
  if (!mesStr) return "";
  const parts = mesStr.split("-");
  if (parts.length < 2) return mesStr;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

// ── Derivações Cronograma ─────────────────────────────────────────────────────

function calcAcumulados(avancos) {
  const sorted = [...avancos]
    .filter((r) => r.semana_iso)
    .sort((a, b) => (a.semana_iso || "").localeCompare(b.semana_iso || ""));
  let _prevAc = 0;
  let _realAc = 0;
  const withAcum = sorted.map((r) => {
    _prevAc += r.avanco_previsto_mensal || 0;
    _realAc += r.avanco_realizado_mensal || 0;
    return { ...r, _prevAcum: _prevAc, _realAcum: _realAc };
  });
  return withAcum;
}

function calcPPC(itens6wla) {
  if (!itens6wla || itens6wla.length === 0) return null;
  const livres = itens6wla.filter(
    (i) =>
      !i.restricao_projeto_eng &&
      !i.restricao_material &&
      !i.restricao_mao_obra &&
      !i.restricao_equipamentos &&
      !i.restricao_externas &&
      !i.restricao_informacoes
  );
  return Math.round((livres.length / itens6wla.length) * 100);
}

const RESTRICOES_6WLA = [
  { key: "restricao_projeto_eng", label: "Projeto/Eng." },
  { key: "restricao_material", label: "Material" },
  { key: "restricao_mao_obra", label: "Mão de obra" },
  { key: "restricao_equipamentos", label: "Equipamentos" },
  { key: "restricao_externas", label: "Externas" },
  { key: "restricao_informacoes", label: "Informações" },
];

function calcRestricoesData(itens6wla) {
  const counts = RESTRICOES_6WLA.map(({ key, label }) => ({
    label,
    count: itens6wla.filter((i) => !!i[key]).length,
  }));
  return counts.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
}

function isTarefaAtrasada(t) {
  return (
    (t.avanco_previsto || 0) > (t.avanco_realizado || 0) &&
    (t.avanco_realizado || 0) < 100
  );
}

// ── Derivações Financeiro ─────────────────────────────────────────────────────

function calcFinanceiroKpis(financeiros, faturamentos, medicoes) {
  const sorted = [...financeiros].sort((a, b) =>
    (a.mes_referencia || "").localeCompare(b.mes_referencia || "")
  );
  const ultimo = sorted[sorted.length - 1];
  const realAcum = ultimo?.faturamento_realizado_acumulado || 0;
  const prevAcum = ultimo?.faturamento_previsto_acumulado || 0;
  const avancoFin =
    prevAcum > 0 ? Math.round((realAcum / prevAcum) * 100) : null;
  const desvioAcum = realAcum - prevAcum;
  const medicaoEmitidas = faturamentos.length;
  const aprovadas = medicoes.filter((m) =>
    ["Aprovada", "Paga"].includes(m.status)
  ).length;
  return { realAcum, prevAcum, avancoFin, desvioAcum, medicaoEmitidas, aprovadas };
}

function calcMedicoesPorStatus(medicoes) {
  const STATUS_COLORS = {
    Aprovada: "#16a34a",
    Paga: "#16a34a",
    "Em Aprovação": "#f59e0b",
    "Em Revisão": "#3b82f6",
    Elaboração: "#94a3b8",
  };
  const map = {};
  for (const m of medicoes) {
    const s = m.status || "Elaboração";
    if (!map[s]) map[s] = { status: s, valor: 0, color: STATUS_COLORS[s] || "#94a3b8" };
    map[s].valor += m.valor || 0;
  }
  return Object.values(map).sort((a, b) => b.valor - a.valor);
}

// ── Derivações Escopo ─────────────────────────────────────────────────────────

function isHistMO(h) {
  const tipo = (h.tipo || "").toLowerCase();
  const subtipo = (h.subtipo_mo || "").toLowerCase();
  if (tipo.includes("equipamento")) return false;
  if (tipo) return true; // qualquer tipo não-equipamento é MO
  if (subtipo) return true;
  return false;
}

function isHistEquip(h) {
  const tipo = (h.tipo || "").toLowerCase();
  if (tipo.includes("equipamento")) return true;
  if (!tipo && !h.subtipo_mo) return true; // fallback: sem tipo e sem subtipo_mo → equipamento
  return false;
}

function groupHistByMes(histogramas) {
  const map = {};
  for (const h of histogramas) {
    const mes = h.mes_referencia || "—";
    if (!map[mes]) map[mes] = { mes, prev: 0, real: 0 };
    map[mes].prev += h.quantidade_prevista_mensal || 0;
    map[mes].real += h.quantidade_realizada_mensal || 0;
  }
  return Object.values(map).sort((a, b) => a.mes.localeCompare(b.mes));
}

function calcTakeOff(commodities, lancamentos) {
  if (!commodities.length || !lancamentos.length) return null;
  const totalContrato = commodities.reduce((acc, c) => acc + (c.qtd_contrato || 0), 0);
  const totalLancado = lancamentos.reduce((acc, l) => acc + (l.quantidade || 0), 0);
  if (totalContrato === 0) return null;
  return Math.round((totalLancado / totalContrato) * 100);
}

function calcTakeOffPorDisciplina(commodities, lancamentos) {
  // Agrupa lancamentos por commodity_id
  const lancMap = {};
  for (const l of lancamentos) {
    const cid = l.commodity_id;
    if (!cid) continue;
    if (!lancMap[cid]) lancMap[cid] = 0;
    lancMap[cid] += l.quantidade || 0;
  }

  // Agrupa por disciplina
  const discMap = {};
  for (const c of commodities) {
    const disc = c.disciplina || "Sem disciplina";
    if (!discMap[disc]) discMap[disc] = { totalContrato: 0, totalLancado: 0 };
    discMap[disc].totalContrato += c.qtd_contrato || 0;
    discMap[disc].totalLancado += lancMap[c.id] || 0;
  }

  return Object.entries(discMap)
    .map(([disciplina, { totalContrato, totalLancado }]) => ({
      disciplina,
      pct: totalContrato > 0 ? Math.round((totalLancado / totalContrato) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);
}

// ── Tooltip formatters ────────────────────────────────────────────────────────

function tooltipCurvaFisica({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

function tooltipCurvaFin({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatMilhoes(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Sub-bloco Cronograma ──────────────────────────────────────────────────────

function CronogramaBloco({ avancos, tarefas, itens6wla, projeto, isLoading, isError }) {
  if (isLoading) return <div className="p-5"><Skeleton className="h-64 w-full" /></div>;
  if (isError)
    return (
      <div className="p-5 flex items-center gap-2 text-destructive justify-center py-8">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Erro ao carregar cronograma.</span>
      </div>
    );

  const withAcum = calcAcumulados(avancos);
  const ultimo = withAcum[withAcum.length - 1];
  const prevAcum = ultimo?._prevAcum || 0;
  const realAcum = ultimo?._realAcum || 0;
  const desvio = realAcum - prevAcum;

  const caminhoCritico = tarefas.filter((t) => t.caminho_critico).length;
  const atrasadas = tarefas.filter(isTarefaAtrasada).length;
  const ppc = calcPPC(itens6wla);

  const curvaData = withAcum.slice(-8).map((r) => ({
    label: r.semana_iso,
    Previsto: parseFloat(r._prevAcum.toFixed(1)),
    Realizado: parseFloat(r._realAcum.toFixed(1)),
    ...(r.avanco_projetado != null ? { Projetado: r.avanco_projetado } : {}),
  }));

  const restricoesData = calcRestricoesData(itens6wla);

  // dias decorridos
  let diasDecorridos = null;
  let prazoTotal = null;
  let dataProjetada = null;
  if (projeto) {
    prazoTotal = projeto.prazo_contratual_dias || null;
    if (projeto.data_inicio) {
      const inicio = new Date(projeto.data_inicio + "T00:00:00");
      const hoje = new Date();
      diasDecorridos = Math.max(0, Math.round((hoje - inicio) / 86400000));
    }
    if (projeto.data_prevista_termino && atrasadas > 0) {
      // Estimativa simples: adicionar dias proporcionais ao atraso (sem cálculo real de caminho crítico)
      const baseDate = new Date(projeto.data_prevista_termino + "T00:00:00");
      baseDate.setDate(baseDate.getDate() + atrasadas);
      dataProjetada = baseDate.toISOString().slice(0, 10);
    }
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard
          label="Avanço real %"
          value={`${realAcum.toFixed(1)}%`}
          icon={TrendingUp}
          color="#26405d"
        />
        <KpiCard
          label="Previsto %"
          value={`${prevAcum.toFixed(1)}%`}
          icon={Clock}
          color="#94a3b8"
        />
        <KpiCard
          label="Desvio %"
          value={`${desvio >= 0 ? "+" : ""}${desvio.toFixed(1)}%`}
          icon={TrendingUp}
          color={desvio >= 0 ? "#16a34a" : "#ef4444"}
        />
        <KpiCard
          label="Caminho crítico"
          value={caminhoCritico}
          icon={AlertCircle}
          color="#f59e0b"
        />
        <KpiCard
          label="PPC (6WLA)"
          value={ppc !== null ? `${ppc}%` : "—"}
          icon={CheckCircle}
          color="#26405d"
        />
      </div>

      {/* Gráficos */}
      <div className="flex gap-5">
        {/* Curva S Física */}
        <div style={{ flex: 1.3 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Curva S — Avanço Físico
          </p>
          {curvaData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados de avanço.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={curvaData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#26405d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#26405d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={tooltipCurvaFisica} />
                <Area
                  type="monotone"
                  dataKey="Previsto"
                  stroke="#94a3b8"
                  strokeDasharray="4 2"
                  strokeWidth={1.5}
                  fill="url(#gradPrev)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Realizado"
                  stroke="#26405d"
                  strokeWidth={2}
                  fill="url(#gradReal)"
                  dot={false}
                />
                {curvaData.some((d) => d.Projetado != null) && (
                  <Area
                    type="monotone"
                    dataKey="Projetado"
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                    fill="none"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 6WLA Restrições */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            6WLA — Restrições por tipo
          </p>
          {restricoesData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Sem restrições registradas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                layout="vertical"
                data={restricoesData}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [v, "Restrições"]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#26405d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Faixa de datas */}
      {projeto && (
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: "#eef2f8" }}>
            <p className="text-xs text-muted-foreground">Início</p>
            <p className="text-sm font-bold text-[#26405d] mt-0.5">
              {formatDate(projeto.data_inicio)}
            </p>
          </div>
          <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: "#eef2f8" }}>
            <p className="text-xs text-muted-foreground">Prazo decorrido</p>
            <p className="text-sm font-bold text-[#26405d] mt-0.5">
              {diasDecorridos !== null && prazoTotal
                ? `${diasDecorridos}/${prazoTotal} dias`
                : diasDecorridos !== null
                ? `${diasDecorridos} dias`
                : "—"}
            </p>
          </div>
          <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: "#eef2f8" }}>
            <p className="text-xs text-muted-foreground">Término previsto</p>
            <p className="text-sm font-bold text-[#26405d] mt-0.5">
              {formatDate(projeto.data_prevista_termino)}
            </p>
          </div>
          <div
            className="flex-1 rounded-lg p-3 text-center"
            style={{
              backgroundColor: dataProjetada ? "#fef3c7" : "#eef2f8",
            }}
          >
            <p className="text-xs text-muted-foreground">Projetado</p>
            <p
              className="text-sm font-bold mt-0.5"
              style={{ color: dataProjetada ? "#92400e" : "#26405d" }}
            >
              {dataProjetada ? formatDate(dataProjetada) : formatDate(projeto.data_prevista_termino)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-bloco Financeiro ──────────────────────────────────────────────────────

function FinanceiroBloco({ financeiros, faturamentos, medicoes, isLoading, isError }) {
  if (isLoading) return <div className="p-5"><Skeleton className="h-64 w-full" /></div>;
  if (isError)
    return (
      <div className="p-5 flex items-center gap-2 text-destructive justify-center py-8">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Erro ao carregar dados financeiros.</span>
      </div>
    );

  const { realAcum, prevAcum, avancoFin, desvioAcum, medicaoEmitidas, aprovadas } =
    calcFinanceiroKpis(financeiros, faturamentos, medicoes);

  const avancoColor =
    avancoFin === null ? "#26405d" : avancoFin >= 90 ? "#16a34a" : avancoFin >= 70 ? "#f59e0b" : "#ef4444";

  const sortedFin = [...financeiros].sort((a, b) =>
    (a.mes_referencia || "").localeCompare(b.mes_referencia || "")
  );
  const curvaFinData = sortedFin.map((r) => ({
    label: formatMes(r.mes_referencia),
    Previsto: r.faturamento_previsto_acumulado || 0,
    Realizado: r.faturamento_realizado_acumulado || 0,
    ...(r.faturamento_projetado != null ? { Projetado: r.faturamento_projetado } : {}),
  }));

  const medicoesPorStatus = calcMedicoesPorStatus(medicoes);

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard
          label="Faturado acumulado"
          value={formatMilhoes(realAcum)}
          icon={DollarSign}
          color="#16a34a"
        />
        <KpiCard
          label="Avanço financeiro %"
          value={avancoFin !== null ? `${avancoFin}%` : "—"}
          icon={TrendingUp}
          color={avancoColor}
        />
        <KpiCard
          label="Desvio acumulado"
          value={formatMilhoes(Math.abs(desvioAcum))}
          icon={TrendingUp}
          color={desvioAcum >= 0 ? "#16a34a" : "#ef4444"}
          sub={desvioAcum >= 0 ? "Acima do previsto" : "Abaixo do previsto"}
        />
        <KpiCard
          label="Medições emitidas"
          value={medicaoEmitidas}
          icon={Clock}
          color="#3b82f6"
        />
        <KpiCard
          label="Aprovadas / Pagas"
          value={aprovadas}
          icon={CheckCircle}
          color="#16a34a"
        />
      </div>

      {/* Gráficos */}
      <div className="flex gap-5">
        {/* Curva S Financeira */}
        <div style={{ flex: 1.3 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Curva S — Avanço Financeiro
          </p>
          {curvaFinData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados financeiros.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={curvaFinData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFinPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFinReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => formatMilhoes(v)}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={tooltipCurvaFin} />
                <Area
                  type="monotone"
                  dataKey="Previsto"
                  stroke="#94a3b8"
                  strokeDasharray="4 2"
                  strokeWidth={1.5}
                  fill="url(#gradFinPrev)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Realizado"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#gradFinReal)"
                  dot={false}
                />
                {curvaFinData.some((d) => d.Projetado != null) && (
                  <Area
                    type="monotone"
                    dataKey="Projetado"
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                    fill="none"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Medições por status */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Medições por status (R$)
          </p>
          {medicoesPorStatus.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem medições.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                layout="vertical"
                data={medicoesPorStatus}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatMilhoes(v)}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={90}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [formatMilhoes(v), "Valor"]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {medicoesPorStatus.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-bloco Escopo ──────────────────────────────────────────────────────────

function EscopoBloco({ histogramas, commodities, lancamentos, isLoading, isError }) {
  if (isLoading) return <div className="p-5"><Skeleton className="h-64 w-full" /></div>;
  if (isError)
    return (
      <div className="p-5 flex items-center gap-2 text-destructive justify-center py-8">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Erro ao carregar dados de escopo.</span>
      </div>
    );

  const histMO = histogramas.filter(isHistMO);
  const histEquip = histogramas.filter(isHistEquip);

  const moData = groupHistByMes(histMO);
  const equipData = groupHistByMes(histEquip);

  const totalMOPrev = histMO.reduce((acc, h) => acc + (h.quantidade_prevista_mensal || 0), 0);
  const totalMOReal = histMO.reduce((acc, h) => acc + (h.quantidade_realizada_mensal || 0), 0);
  const totalEquipPrev = histEquip.reduce((acc, h) => acc + (h.quantidade_prevista_mensal || 0), 0);
  const totalEquipReal = histEquip.reduce((acc, h) => acc + (h.quantidade_realizada_mensal || 0), 0);

  // Pico MO: máx realizado
  let picoMO = 0;
  let picoMOMes = "—";
  for (const h of histMO) {
    const v = h.quantidade_realizada_mensal || 0;
    if (v > picoMO) {
      picoMO = v;
      picoMOMes = formatMesLabel(h.mes_referencia);
    }
  }

  const takeOffPct = calcTakeOff(commodities, lancamentos);
  const takeOffDisc = calcTakeOffPorDisciplina(commodities, lancamentos);

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="HH Mão de obra"
          value={`${formatHH(totalMOReal)}/${formatHH(totalMOPrev)} HH`}
          icon={Clock}
          color="#26405d"
        />
        <KpiCard
          label="Horas equipamentos"
          value={`${formatHH(totalEquipReal)}/${formatHH(totalEquipPrev)} h`}
          icon={TrendingUp}
          color="#0891b2"
        />
        <KpiCard
          label="Take-Off produzido"
          value={takeOffPct !== null ? `${takeOffPct}%` : "—"}
          icon={CheckCircle}
          color="#6d28d9"
        />
        <KpiCard
          label="Pico de efetivo"
          value={picoMO > 0 ? `${formatHH(picoMO)} HH` : "—"}
          icon={TrendingUp}
          color="#26405d"
          sub={picoMO > 0 ? picoMOMes : undefined}
        />
      </div>

      {/* Gráficos */}
      <div className="flex gap-5">
        {/* Histograma MO */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Histograma — Mão de Obra
          </p>
          {moData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados de MO.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={moData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMesLabel}
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} width={32} />
                  <Tooltip
                    formatter={(v, name) => [formatHH(v) + " HH", name === "prev" ? "Previsto" : "Realizado"]}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="prev" fill="#cbd5e1" radius={[2, 2, 0, 0]} name="Previsto" />
                  <Bar dataKey="real" fill="#26405d" radius={[2, 2, 0, 0]} name="Realizado" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Total prev: {formatHH(totalMOPrev)} HH · Total real: {formatHH(totalMOReal)} HH
              </p>
            </>
          )}
        </div>

        {/* Histograma Equipamentos */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Histograma — Equipamentos
          </p>
          {equipData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados de equipamentos.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={equipData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMesLabel}
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} width={32} />
                  <Tooltip
                    formatter={(v, name) => [formatHH(v) + " h", name === "prev" ? "Previsto" : "Realizado"]}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="prev" fill="#cbd5e1" radius={[2, 2, 0, 0]} name="Previsto" />
                  <Bar dataKey="real" fill="#0891b2" radius={[2, 2, 0, 0]} name="Realizado" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Total prev: {formatHH(totalEquipPrev)} h · Total real: {formatHH(totalEquipReal)} h
              </p>
            </>
          )}
        </div>

        {/* Take-Off por disciplina */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Take-Off por disciplina
          </p>
          {takeOffDisc.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados de Take-Off.</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                layout="vertical"
                data={takeOffDisc}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="disciplina"
                  width={80}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, "Take-Off"]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="pct" fill="#6d28d9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PlanejamentoSection({ projetoId }) {
  // Cronograma
  const { data: avancos = [], isPending: isLoadingAvancos, isError: isErrorAvancos } = useQuery({
    queryKey: ["avanco_fisico_dash", projetoId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: tarefas = [], isPending: isLoadingTarefas, isError: isErrorTarefas } = useQuery({
    queryKey: ["tarefas_cron_dash", projetoId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: itens6wla = [], isError: isErrorWLA } = useQuery({
    queryKey: ["6wla_cron_dash", projetoId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: projetos = [], isError: isErrorProjeto } = useQuery({
    queryKey: ["projeto_dash", projetoId],
    queryFn: () => entities.Projeto.filter({ id: projetoId }),
    enabled: !!projetoId,
  });
  const projeto = projetos[0] || null;

  // Financeiro
  const { data: financeiros = [], isPending: isLoadingFin, isError: isErrorFin } = useQuery({
    queryKey: ["financeiros_dash", projetoId],
    queryFn: () => entities.Financeiro.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: faturamentos = [], isError: isErrorFat } = useQuery({
    queryKey: ["faturamentos_dash", projetoId],
    queryFn: () => entities.Faturamento.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: medicoes = [], isError: isErrorMed } = useQuery({
    queryKey: ["medicoes_dash", projetoId],
    queryFn: () => entities.Medicao.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  // Escopo
  const { data: histogramas = [], isPending: isLoadingHist, isError: isErrorHist } = useQuery({
    queryKey: ["histogramas_dash", projetoId],
    queryFn: () => entities.Histograma.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: commodities = [], isError: isErrorComm } = useQuery({
    queryKey: ["commodities_dash", projetoId],
    queryFn: () => entities.Commodity.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: lancamentos = [], isError: isErrorLanc } = useQuery({
    queryKey: ["lancamentos_dash", projetoId],
    queryFn: () => entities.LancamentoCommodity.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  return (
    <Card className="border-0 shadow-md">
      <SectionHeader
        title="Planejamento"
        icon={ClipboardList}
        color="#26405d"
        subtitle="Cronograma · Financeiro · Escopo"
      />

      <CardContent className="p-0">
        {/* Sub-bloco Cronograma */}
        <div>
          <SubSectionBand
            title="📅 Cronograma"
            tagline="Avanço Físico · 6WLA · Datas"
            bg="#eef2f8"
            color="#26405d"
            borderColor="#d7e0ec"
          />
          <CronogramaBloco
            avancos={avancos}
            tarefas={tarefas}
            itens6wla={itens6wla}
            projeto={projeto}
            isLoading={isLoadingAvancos || isLoadingTarefas}
            isError={isErrorAvancos || isErrorTarefas || isErrorWLA || isErrorProjeto}
          />
        </div>

        {/* Sub-bloco Financeiro */}
        <div className="border-t border-border">
          <SubSectionBand
            title="💰 Financeiro"
            tagline="Avanço Financeiro · Faturamento · Medições"
            bg="#ecfdf3"
            color="#15803d"
            borderColor="#c6f0d4"
          />
          <FinanceiroBloco
            financeiros={financeiros}
            faturamentos={faturamentos}
            medicoes={medicoes}
            isLoading={isLoadingFin}
            isError={isErrorFin || isErrorFat || isErrorMed}
          />
        </div>

        {/* Sub-bloco Escopo */}
        <div className="border-t border-border">
          <SubSectionBand
            title="📦 Escopo"
            tagline="Histogramas (MO + Equipamentos) · Take-Off"
            bg="#f5f3ff"
            color="#6d28d9"
            borderColor="#e4dcff"
          />
          <EscopoBloco
            histogramas={histogramas}
            commodities={commodities}
            lancamentos={lancamentos}
            isLoading={isLoadingHist}
            isError={isErrorHist || isErrorComm || isErrorLanc}
          />
        </div>
      </CardContent>
    </Card>
  );
}
