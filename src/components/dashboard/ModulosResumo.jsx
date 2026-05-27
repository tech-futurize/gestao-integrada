import React from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import {
  CalendarDays, ScrollText, ShoppingCart, DollarSign,
  ShieldAlert, ClipboardList, TrendingUp, ArrowRight,
  FileText, AlertTriangle, CheckCircle, Clock, XCircle, AlertCircle,
} from "lucide-react";

const COLORS = ["#26405d", "#c35e1e", "#00a49a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const MODULE_ROUTE_MAP = {
  Cronograma: "/planejamento/cronograma",
  Contratos: "/admin-contratual/contratos",
  Suprimentos: "/suprimentos/mapa",
  Financeiro: "/planejamento/avancos",
  AvancoFisico: "/planejamento/avancos",
  Pleitos: "/admin-contratual/pleitos",
  GestaoRiscos: "/riscos-mudancas/gestao-riscos",
  Planejamento: "/planejamento/cronograma",
};


// ── COMPONENTES BASE ──────────────────────────────────────────────────────────
function SectionHeader({ title, icon: Icon, color, link, subtitle }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <Link
        to={MODULE_ROUTE_MAP[link] || "/dashboard"}
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
        style={{ color, borderColor: color + "40", backgroundColor: color + "10" }}
      >
        Ver módulo <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, bg, sub }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: bg || color + "0d" }}>
      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      )}
      <div>
        <div className="text-2xl font-bold leading-tight" style={{ color }}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && <div className="text-xs font-medium mt-0.5" style={{ color }}>{sub}</div>}
      </div>
    </div>
  );
}

// variant: "critical" | "attention" | "positive" | "blue" | "neutral"
const STATUS_BADGE_CLASSES = {
  critical: "bg-status-critical/15 text-status-critical",
  attention: "bg-status-attention/15 text-status-attention",
  positive: "bg-status-positive/15 text-status-positive",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  neutral: "bg-muted text-muted-foreground",
};

function StatusBadge({ label, variant = "neutral" }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_CLASSES[variant] || STATUS_BADGE_CLASSES.neutral}`}>
      {label}
    </span>
  );
}

// ── CRONOGRAMA ────────────────────────────────────────────────────────────────
function ResumoCronograma({ projetoId }) {
  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ["tarefas_dash", projetoId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const total = tarefas.length;
  const concluidas = tarefas.filter(t => (t.avanco_realizado || 0) === 100).length;
  const atrasadas = tarefas.filter(t => t.data_fim_planejada && new Date(t.data_fim_planejada) < new Date() && (t.avanco_realizado || 0) < 100).length;
  const criticas = tarefas.filter(t => t.caminho_critico).length;
  const emAndamento = total - concluidas - atrasadas;
  const avgAvanco = total ? Math.round(tarefas.reduce((s, t) => s + (t.avanco_realizado || 0), 0) / total) : 0;
  const spi = total ? (concluidas / Math.max(total * 0.5, 1)).toFixed(2) : "—";

  const barData = [
    { name: "Concluídas", v: concluidas, fill: "#16a34a" },
    { name: "Em Andamento", v: emAndamento > 0 ? emAndamento : 0, fill: "#3b82f6" },
    { name: "Atrasadas", v: atrasadas, fill: "#ef4444" },
    { name: "Caminho Crítico", v: criticas, fill: "#c35e1e" },
  ];

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
        <>
          <SectionHeader title="Cronograma" icon={CalendarDays} color="#26405d" link="Cronograma" subtitle="Controle de tarefas e marcos do projeto" />
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total de Tarefas" value={total} icon={CalendarDays} color="#26405d" />
              <KpiCard label="Concluídas" value={concluidas} icon={CheckCircle} color="#16a34a" />
              <KpiCard label="Atrasadas" value={atrasadas} icon={XCircle} color="#ef4444" />
              <KpiCard label="Avanço Médio" value={`${avgAvanco}%`} icon={TrendingUp} color={avgAvanco >= 70 ? "#16a34a" : "#d97706"} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Distribuição por Status</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={v => [v, "Tarefas"]} />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                      {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Indicadores</p>
                <div className="space-y-2">
                  {[
                    { label: "Caminho crítico", value: criticas, color: "#c35e1e", bg: "#fef2f2" },
                    { label: "% Concluído", value: total ? `${Math.round((concluidas / total) * 100)}%` : "0%", color: "#16a34a", bg: "#f0fdf4" },
                    { label: "SPI estimado", value: spi, color: "#3b82f6", bg: "#eff6ff" },
                    { label: "Em andamento", value: emAndamento, color: "#3b82f6", bg: "#eff6ff" },
                  ].map(k => (
                    <div key={k.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-xs text-muted-foreground">{k.label}</span>
                      <span className="text-sm font-bold" style={{ color: k.color }}>{k.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// ── CONTRATOS ─────────────────────────────────────────────────────────────────
function ResumoContratos({ projetoId }) {
  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ["contratos_dash", projetoId],
    queryFn: () => entities.Contrato.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: aditivos = [] } = useQuery({
    queryKey: ["aditivos_dash", projetoId],
    queryFn: () => entities.Aditivo.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const valorTotal = contratos.reduce((s, c) => s + (c.valor_total || 0), 0);
  const ativos = contratos.filter(c => c.status === "Ativo").length;
  const pieData = [
    { name: "Ativo", value: contratos.filter(c => c.status === "Ativo").length },
    { name: "Em Revisão", value: contratos.filter(c => c.status === "Em Revisão").length },
    { name: "Encerrado", value: contratos.filter(c => c.status === "Encerrado").length },
    { name: "Suspenso", value: contratos.filter(c => c.status === "Suspenso").length },
  ].filter(d => d.value > 0);

  const statusVariant = {
    "Ativo": "positive",
    "Em Revisão": "attention",
    "Encerrado": "neutral",
    "Suspenso": "critical",
  };

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
        <>
          <SectionHeader title="Contratos" icon={ScrollText} color="#c35e1e" link="Contratos" subtitle="Gestão de contratos e aditivos" />
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total de Contratos" value={contratos.length} icon={ScrollText} color="#26405d" />
              <KpiCard label="Ativos" value={ativos} icon={CheckCircle} color="#16a34a" />
              <KpiCard label="Valor Total" value={`R$${(valorTotal / 1e6).toFixed(1)}M`} icon={DollarSign} color="#c35e1e" />
              <KpiCard label="Aditivos" value={aditivos.length} icon={FileText} color="#8b5cf6" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Distribuição por Status</p>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground py-4">Nenhum contrato</p>}
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Últimos Contratos</p>
                {contratos.length > 0 ? (
                  <div className="space-y-2">
                    {contratos.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">{c.objeto || c.numero}</div>
                          <div className="text-xs text-muted-foreground">{c.fornecedor} · R${((c.valor_total || 0) / 1e3).toFixed(0)}k</div>
                        </div>
                        <StatusBadge label={c.status} variant={statusVariant[c.status] || "neutral"} />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Nenhum contrato cadastrado</p>}
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// ── SUPRIMENTOS ───────────────────────────────────────────────────────────────
function ResumoSuprimentos({ projetoId }) {
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens_mas_dash", projetoId],
    queryFn: () => entities.ItemMAS.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const pendentes = itens.filter(i => i.status === "Pendente").length;
  const parciais = itens.filter(i => i.status === "Parcial").length;
  const entregues = itens.filter(i => i.status === "Entregue").length;
  const cancelados = itens.filter(i => i.status === "Cancelado").length;

  const barData = [
    { name: "Pendente", v: pendentes, fill: "#f59e0b" },
    { name: "Parcial", v: parciais, fill: "#3b82f6" },
    { name: "Entregue", v: entregues, fill: "#16a34a" },
    { name: "Cancelado", v: cancelados, fill: "#ef4444" },
  ];

  const tipoData = Object.values(
    itens.reduce((acc, i) => {
      const t = i.tipo_item || "Outros";
      if (!acc[t]) acc[t] = { name: t, value: 0 };
      acc[t].value += 1;
      return acc;
    }, {})
  );

  const statusVariant = {
    Pendente: "attention",
    Parcial: "blue",
    Entregue: "positive",
    Cancelado: "critical",
  };

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
        <>
          <SectionHeader title="Suprimentos" icon={ShoppingCart} color="#00a49a" link="Suprimentos" subtitle="Mapa de suprimentos e itens do projeto" />
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total de Itens" value={itens.length} icon={ShoppingCart} color="#26405d" />
              <KpiCard label="Pendentes" value={pendentes} icon={Clock} color="#d97706" />
              <KpiCard label="Entregues" value={entregues} icon={CheckCircle} color="#16a34a" />
              <KpiCard label="Parciais" value={parciais} icon={AlertTriangle} color="#3b82f6" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Status</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={v => [v, "Itens"]} />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                      {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Tipo</p>
                {tipoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={tipoData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {tipoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground py-4">Sem dados</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Últimos Itens</p>
                {itens.length > 0 ? (
                  <div className="space-y-2">
                    {itens.slice(0, 5).map(i => (
                      <div key={i.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground truncate">{i.item}</div>
                          <div className="text-xs text-muted-foreground">{i.fornecedor} · {i.tipo_item}</div>
                        </div>
                        <StatusBadge label={i.status} variant={statusVariant[i.status] || "neutral"} />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Nenhum item cadastrado</p>}
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// ── FINANCEIRO ────────────────────────────────────────────────────────────────
function ResumoFinanceiro({ projetoId }) {
  const { data: financeiro = [], isLoading } = useQuery({
    queryKey: ["financeiro_dash", projetoId],
    queryFn: () => entities.Financeiro.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const sorted = [...financeiro].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia)).slice(-8);
  const areaData = sorted.map(f => ({
    name: new Date(f.mes_referencia).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    Previsto: f.faturamento_previsto_mensal || 0,
    Realizado: f.faturamento_realizado_mensal || 0,
    "Acum. Prev.": f.faturamento_previsto_acumulado || 0,
    "Acum. Real.": f.faturamento_realizado_acumulado || 0,
  }));

  const ultimo = [...financeiro].sort((a, b) => new Date(b.mes_referencia) - new Date(a.mes_referencia))[0];
  const prevAcum = ultimo?.faturamento_previsto_acumulado || 0;
  const realAcum = ultimo?.faturamento_realizado_acumulado || 0;
  const pct = prevAcum > 0 ? Math.round((realAcum / prevAcum) * 100) : 0;
  const desvio = realAcum - prevAcum;

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
        <>
          <SectionHeader title="Financeiro" icon={DollarSign} color="#16a34a" link="Financeiro" subtitle="Faturamento previsto vs. realizado" />
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard label="Meses Registrados" value={financeiro.length} icon={CalendarDays} color="#26405d" />
              <KpiCard label="Faturado Acum." value={`R$${(realAcum / 1e6).toFixed(2)}M`} icon={DollarSign} color="#16a34a" />
              <KpiCard label="% Realizado" value={`${pct}%`} icon={TrendingUp} color={pct >= 90 ? "#16a34a" : pct >= 70 ? "#d97706" : "#ef4444"} />
              <KpiCard label="Desvio Acum." value={`${desvio >= 0 ? "+" : ""}R$${(Math.abs(desvio) / 1e3).toFixed(0)}k`} icon={desvio >= 0 ? CheckCircle : AlertCircle} color={desvio >= 0 ? "#16a34a" : "#ef4444"} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Faturamento Mensal — Previsto vs. Realizado</p>
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={areaData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e3).toFixed(0)}k`} />
                      <Tooltip formatter={v => `R$ ${v.toLocaleString("pt-BR")}`} />
                      <Legend />
                      <Area type="monotone" dataKey="Previsto" stroke="#9ca3af" fill="url(#prevGrad)" strokeWidth={2} strokeDasharray="5 3" />
                      <Area type="monotone" dataKey="Realizado" stroke="#16a34a" fill="url(#realGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground py-4">Nenhum dado financeiro registrado</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Acumulado</p>
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={areaData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
                      <Tooltip formatter={v => `R$ ${v.toLocaleString("pt-BR")}`} />
                      <Line type="monotone" dataKey="Acum. Prev." stroke="#9ca3af" strokeDasharray="5 3" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Acum. Real." stroke="#16a34a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// ── AVANÇO FÍSICO ─────────────────────────────────────────────────────────────
function ResumoAvancoFisico({ projetoId }) {
  const { data: avancos = [], isLoading } = useQuery({
    queryKey: ["avanco_dash", projetoId],
    queryFn: () => entities.AvancoFisico.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const sorted = [...avancos].sort((a, b) => new Date(a.mes_referencia) - new Date(b.mes_referencia)).slice(-8);
  const areaData = sorted.map(f => ({
    name: new Date(f.mes_referencia).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    Previsto: f.avanco_previsto_acumulado || 0,
    Realizado: f.avanco_realizado_acumulado || 0,
    "Prev. Mensal": f.avanco_previsto_mensal || 0,
    "Real. Mensal": f.avanco_realizado_mensal || 0,
  }));

  const ultimo = sorted[sorted.length - 1];
  const prevAcum = ultimo?.avanco_previsto_acumulado || 0;
  const realAcum = ultimo?.avanco_realizado_acumulado || 0;
  const desvio = realAcum - prevAcum;
  const penultimo = sorted[sorted.length - 2];
  const tendencia = penultimo ? realAcum - (penultimo.avanco_realizado_acumulado || 0) : 0;

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
        <>
          <SectionHeader title="Avanço Físico" icon={TrendingUp} color="#3b82f6" link="AvancoFisico" subtitle="Curva S — previsto vs. realizado" />
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard label="Previsto Acum." value={`${prevAcum.toFixed(1)}%`} icon={Clock} color="#9ca3af" />
              <KpiCard label="Realizado Acum." value={`${realAcum.toFixed(1)}%`} icon={TrendingUp} color="#3b82f6" />
              <KpiCard label="Desvio" value={`${desvio >= 0 ? "+" : ""}${desvio.toFixed(1)}%`} icon={desvio >= 0 ? CheckCircle : AlertCircle} color={desvio >= 0 ? "#16a34a" : "#ef4444"} />
              <KpiCard label="Tendência Mensal" value={`+${tendencia.toFixed(1)}%`} icon={TrendingUp} color="#8b5cf6" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Curva S — Avanço Acumulado</p>
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={areaData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="prevPhys" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="realPhys" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                      <Tooltip formatter={v => `${v}%`} />
                      <Legend />
                      <Area type="monotone" dataKey="Previsto" stroke="#9ca3af" fill="url(#prevPhys)" strokeWidth={2} strokeDasharray="5 3" />
                      <Area type="monotone" dataKey="Realizado" stroke="#3b82f6" fill="url(#realPhys)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground py-4">Nenhum dado de avanço registrado</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Avanço Mensal</p>
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={areaData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip formatter={v => `${v}%`} />
                      <Bar dataKey="Prev. Mensal" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Real. Mensal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// ── PLEITOS ───────────────────────────────────────────────────────────────────
function ResumoPleitos({ projetoId }) {
  const { data: casos = [], isLoading } = useQuery({
    queryKey: ["pleitos_dash2", projetoId],
    queryFn: () => entities.Pleito.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const barData = [
    { name: "Aberto", v: casos.filter(c => c.status === "Aberto").length, fill: "#ef4444" },
    { name: "Em Análise", v: casos.filter(c => c.status === "Em Análise").length, fill: "#f59e0b" },
    { name: "Andamento", v: casos.filter(c => c.status === "Em Andamento").length, fill: "#3b82f6" },
    { name: "Resolvido", v: casos.filter(c => c.status === "Resolvido").length, fill: "#16a34a" },
    { name: "Fechado", v: casos.filter(c => c.status === "Fechado").length, fill: "#9ca3af" },
  ];

  const prioCritica = casos.filter(c => c.prioridade === "Crítica").length;
  const prioAlta = casos.filter(c => c.prioridade === "Alta").length;
  const abertos = casos.filter(c => c.status === "Aberto").length;

  const prioData = [
    { name: "Crítica", value: prioCritica, fill: "#ef4444" },
    { name: "Alta", value: prioAlta, fill: "#f59e0b" },
    { name: "Média", value: casos.filter(c => c.prioridade === "Média").length, fill: "#3b82f6" },
    { name: "Baixa", value: casos.filter(c => c.prioridade === "Baixa").length, fill: "#9ca3af" },
  ].filter(d => d.value > 0);

  const statusVariant = {
    "Aberto": "critical",
    "Em Análise": "attention",
    "Em Andamento": "blue",
    "Resolvido": "positive",
    "Fechado": "neutral",
  };

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
        <>
          <SectionHeader title="Pleitos" icon={FileText} color="#c35e1e" link="Pleitos" subtitle="Casos e pleitos contratuais ativos" />
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total de Pleitos" value={casos.length} icon={FileText} color="#26405d" />
              <KpiCard label="Críticos" value={prioCritica} icon={AlertCircle} color="#ef4444" />
              <KpiCard label="Alta Prioridade" value={prioAlta} icon={AlertTriangle} color="#d97706" />
              <KpiCard label="Em Aberto" value={abertos} icon={Clock} color="#c35e1e" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Status</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 8, left: 20, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={65} />
                    <Tooltip formatter={v => [v, "Pleitos"]} />
                    <Bar dataKey="v" radius={4}>
                      {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Prioridade</p>
                {prioData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={prioData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {prioData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground py-4">Sem dados</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Últimos Pleitos</p>
                {casos.length > 0 ? (
                  <div className="space-y-2">
                    {casos.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground truncate">{c.titulo}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.data_abertura || "—"}</div>
                        </div>
                        <StatusBadge label={c.status} variant={statusVariant[c.status] || "neutral"} />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Nenhum pleito cadastrado</p>}
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// ── REGISTROS ─────────────────────────────────────────────────────────────────
function ResumoRegistros({ projetoId }) {
  const { data: incidentes = [], isLoading } = useQuery({
    queryKey: ["registros_dash2", projetoId],
    queryFn: () => entities.Registro.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const rdos = incidentes.filter(i => i.tipo_registro === "RDO");
  const atas = incidentes.filter(i => i.tipo_registro === "Ata de Reunião");
  const notifs = incidentes.filter(i => i.tipo_registro === "Notificação");
  const alta = incidentes.filter(i => i.gravidade === "Alta").length;

  const tipoData = [
    { name: "RDO", v: rdos.length, fill: "#3b82f6" },
    { name: "Ata", v: atas.length, fill: "#26405d" },
    { name: "E-mail", v: incidentes.filter(i => i.tipo_registro === "E-mail").length, fill: "#8b5cf6" },
    { name: "Notificação", v: notifs.length, fill: "#f59e0b" },
  ];

  const gravData = [
    { name: "Alta", value: incidentes.filter(i => i.gravidade === "Alta").length, fill: "#ef4444" },
    { name: "Média", value: incidentes.filter(i => i.gravidade === "Média").length, fill: "#f59e0b" },
    { name: "Baixa", value: incidentes.filter(i => i.gravidade === "Baixa").length, fill: "#16a34a" },
  ].filter(d => d.value > 0);

  const statusVariant = {
    "Registrado": "critical",
    "Em Análise": "attention",
    "Resolvido": "blue",
    "Fechado": "positive",
  };

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
        <>
          <SectionHeader title="Registros" icon={AlertTriangle} color="#f59e0b" link="Pleitos" subtitle="RDOs, atas, e-mails e notificações" />
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total de Registros" value={incidentes.length} icon={AlertTriangle} color="#26405d" />
              <KpiCard label="RDOs" value={rdos.length} icon={FileText} color="#3b82f6" />
              <KpiCard label="Gravidade Alta" value={alta} icon={AlertCircle} color="#ef4444" />
              <KpiCard label="Em Análise" value={incidentes.filter(i => i.status === "Em Análise").length} icon={Clock} color="#f59e0b" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Tipo</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tipoData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={v => [v, "Registros"]} />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                      {tipoData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por Gravidade</p>
                {gravData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={gravData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                        {gravData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground py-4">Sem dados</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Últimos Registros</p>
                {incidentes.length > 0 ? (
                  <div className="space-y-2">
                    {incidentes.slice(0, 5).map(inc => (
                      <div key={inc.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground">{inc.tipo_registro}</div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">{inc.descricao?.slice(0, 50) || "—"}</div>
                        </div>
                        <StatusBadge label={inc.status} variant={statusVariant[inc.status] || "neutral"} />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Nenhum registro cadastrado</p>}
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// ── GESTÃO DE RISCOS ──────────────────────────────────────────────────────────
const nivelFromScore = (score) => {
  if (score >= 7) return { label: "Crítico", variant: "critical" };
  if (score >= 4) return { label: "Alto", variant: "attention" };
  return { label: "Baixo", variant: "positive" };
};

function ResumoGestaoRiscos({ projetoId }) {
  const { data: riscos = [], isLoading } = useQuery({
    queryKey: ["riscos_dash", projetoId],
    queryFn: () => entities.Risco.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const kpi = {
    total: riscos.length,
    criticos: riscos.filter(r => (r.score || 0) >= 7).length,
    ativos: riscos.filter(r => r.status === "Ativo").length,
    encerrados: riscos.filter(r => r.status === "Encerrado").length,
  };

  const riscosCAT = Object.values(
    riscos.reduce((acc, r) => {
      const cat = r.categoria || "Outros";
      if (!acc[cat]) acc[cat] = { name: cat, value: 0 };
      acc[cat].value += 1;
      return acc;
    }, {})
  );

  const riscosAltos = riscos
    .filter(r => (r.score || 0) >= 4)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 6);

  return (
    <Card className="border-0 shadow-md">
      {isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> : (
      <>
      <SectionHeader title="Gestão de Riscos" icon={ShieldAlert} color="#ef4444" link="GestaoRiscos" subtitle="Riscos identificados, avaliados e monitorados" />
      <CardContent className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total de Riscos" value={kpi.total} icon={ShieldAlert} color="#26405d" />
          <KpiCard label="Críticos (score ≥7)" value={kpi.criticos} icon={AlertCircle} color="#ef4444" />
          <KpiCard label="Ativos" value={kpi.ativos} icon={Clock} color="#d97706" />
          <KpiCard label="Encerrados" value={kpi.encerrados} icon={CheckCircle} color="#16a34a" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Distribuição por Categoria</p>
            {riscosCAT.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riscosCAT} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {riscosCAT.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground py-4">Sem dados</p>}
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Riscos Críticos e Altos</p>
            {riscosAltos.length > 0 ? (
              <div className="space-y-2">
                {riscosAltos.map((r) => {
                  const nivel = nivelFromScore(r.score || 0);
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{r.descricao || r.codigo}</div>
                        <div className="text-xs text-muted-foreground">Impacto: {r.impacto} · Prob.: {r.probabilidade}</div>
                      </div>
                      <StatusBadge label={nivel.label} variant={nivel.variant} />
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-xs text-muted-foreground">Nenhum risco crítico ou alto</p>}
          </div>
        </div>
      </CardContent>
      </>
      )}
    </Card>
  );
}

// ── PLANEJAMENTO ──────────────────────────────────────────────────────────────
function ResumoPlanejamento({ projetoId }) {
  const { data: commodities = [] } = useQuery({
    queryKey: ["comm_dash", projetoId],
    queryFn: () => entities.Commodity.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ["lanc_comm_dash", projetoId],
    queryFn: () => entities.LancamentoCommodity.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const { data: itens6wla = [] } = useQuery({
    queryKey: ["6wla_dash", projetoId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  const ppcMedio = itens6wla.filter(a => a.ppc > 0).length
    ? Math.round(itens6wla.filter(a => a.ppc > 0).reduce((s, a) => s + a.ppc, 0) / itens6wla.filter(a => a.ppc > 0).length)
    : null;

  const takeofProgresso = Object.values(
    commodities.reduce((acc, c) => {
      const disc = c.disciplina || "Outros";
      if (!acc[disc]) acc[disc] = { name: disc, previsto: 0, realizado: 0, unidade: c.unidade || "" };
      acc[disc].previsto += c.qtd_contrato || 0;
      const realizadoItem = lancamentos
        .filter(l => l.commodity_id === c.id)
        .reduce((s, l) => s + (l.quantidade || 0), 0);
      acc[disc].realizado += realizadoItem;
      return acc;
    }, {})
  ).map(d => ({ ...d, pct: d.previsto > 0 ? Math.round((d.realizado / d.previsto) * 100) : 0 }));

  return (
    <Card className="border-0 shadow-md">
      <SectionHeader title="Planejamento" icon={ClipboardList} color="#8b5cf6" link="Planejamento" subtitle="6WLA, take-off e avanço por disciplina" />
      <CardContent className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard label="Itens 6WLA" value={itens6wla.length} icon={ClipboardList} color="#26405d" />
          <KpiCard label="PPC Médio" value={ppcMedio !== null ? `${ppcMedio}%` : "—"} icon={TrendingUp} color={ppcMedio !== null ? (ppcMedio >= 80 ? "#16a34a" : ppcMedio >= 60 ? "#d97706" : "#ef4444") : "#9ca3af"} />
          <KpiCard label="Itens Take-Off" value={commodities.length} icon={FileText} color="#8b5cf6" />
          <KpiCard label="Disciplinas" value={takeofProgresso.length} icon={CheckCircle} color="#00a49a" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Take-Off — Avanço por Disciplina</p>
            {takeofProgresso.length > 0 ? (
              <div className="space-y-3 mt-1">
                {takeofProgresso.map(t => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{t.name}</span>
                      <span className="text-xs font-bold" style={{ color: t.pct === 100 ? "#16a34a" : t.pct < 40 ? "#ef4444" : "#8b5cf6" }}>{t.pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${t.pct}%`, backgroundColor: t.pct === 100 ? "#16a34a" : t.pct < 40 ? "#ef4444" : "#8b5cf6" }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{(t.realizado || 0).toLocaleString("pt-BR")} / {(t.previsto || 0).toLocaleString("pt-BR")} {t.unidade}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground py-4">Sem dados de take-off</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Avanço por Disciplina</p>
            {takeofProgresso.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={takeofProgresso} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={v => [`${v}%`, "Avanço"]} />
                  <Bar dataKey="pct" radius={4}>
                    {takeofProgresso.map((t, i) => (
                      <Cell key={i} fill={t.pct === 100 ? "#16a34a" : t.pct < 40 ? "#ef4444" : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground py-4">Sem dados</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
export default function ModulosResumo({ projetoId }) {
  return (
    <div className="space-y-5">
      <ResumoCronograma projetoId={projetoId} />
      <ResumoContratos projetoId={projetoId} />
      <ResumoSuprimentos projetoId={projetoId} />
      <ResumoFinanceiro projetoId={projetoId} />
      <ResumoAvancoFisico projetoId={projetoId} />
      <ResumoPleitos projetoId={projetoId} />
      <ResumoRegistros projetoId={projetoId} />
      <ResumoGestaoRiscos projetoId={projetoId} />
      <ResumoPlanejamento projetoId={projetoId} />
    </div>
  );
}
