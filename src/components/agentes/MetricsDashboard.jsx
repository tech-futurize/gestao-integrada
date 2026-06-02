import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const AGENT_COLORS = {
  'supabase-analyst-agent': '#26405d',
  'business-analyst-agent': '#c35e1e',
  'contractual-analyst-agent': '#00a49a',
};
const PALETTE = ['#26405d', '#c35e1e', '#00a49a', '#3b82f6', '#f59e0b', '#8b5cf6'];

function getAgentColor(slug, idx) {
  return AGENT_COLORS[slug] ?? PALETTE[idx % PALETTE.length];
}

function getInitials(email = '') {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function formatUSD(val) {
  return `$${Number(val ?? 0).toFixed(4)}`;
}

function aggregateByDay(logs) {
  const acc = {};
  for (const log of logs) {
    const day = (log.created_at ?? '').slice(0, 10);
    if (!day) continue;
    if (!acc[day]) acc[day] = { day, execucoes: 0 };
    acc[day].execucoes += 1;
  }
  return Object.values(acc).sort((a, b) => a.day.localeCompare(b.day));
}

function aggregateByAgent(logs) {
  const acc = {};
  for (const log of logs) {
    const slug = log.agente_slug ?? 'desconhecido';
    if (!acc[slug]) acc[slug] = { slug, execucoes: 0, custo: 0 };
    acc[slug].execucoes += 1;
    acc[slug].custo += Number(log.custo_usd ?? 0);
  }
  return Object.values(acc).sort((a, b) => b.execucoes - a.execucoes);
}

function aggregateByModelo(logs) {
  const acc = {};
  for (const log of logs) {
    const m = log.modelo ?? 'desconhecido';
    if (!acc[m]) acc[m] = { modelo: m, execucoes: 0 };
    acc[m].execucoes += 1;
  }
  const total = logs.length || 1;
  return Object.values(acc)
    .map(r => ({ ...r, pct: Math.round((r.execucoes / total) * 100) }))
    .sort((a, b) => b.execucoes - a.execucoes);
}

function aggregateByUser(logs) {
  const acc = {};
  for (const log of logs) {
    const email = log.usuario_email ?? 'anônimo';
    if (!acc[email]) acc[email] = { email, execucoes: 0, custo: 0 };
    acc[email].execucoes += 1;
    acc[email].custo += Number(log.custo_usd ?? 0);
  }
  return Object.values(acc).sort((a, b) => b.execucoes - a.execucoes).slice(0, 8);
}

function defaultDateFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultDateTo() {
  return new Date().toISOString().slice(0, 10);
}

// Custom label acima das barras do BarChart de modelo
const ModelBarLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="currentColor">
    {value}%
  </text>
);

export default function MetricsDashboard() {
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);

  const { data: logs = [], isPending, isError } = useQuery({
    queryKey: ['agente-uso-logs', dateFrom, dateTo],
    queryFn: () => entities.AgenteUsoLog.list(),
    select: (data) => data.filter(log => {
      const d = (log.created_at ?? '').slice(0, 10);
      return d >= dateFrom && d <= dateTo;
    }),
  });

  const totalExecucoes = logs.length;
  const totalTokens    = logs.reduce((s, l) => s + (l.total_tokens ?? 0), 0);
  const totalCusto     = logs.reduce((s, l) => s + Number(l.custo_usd ?? 0), 0);
  const custoMedio     = totalExecucoes > 0 ? totalCusto / totalExecucoes : 0;

  // Comparativo mês anterior
  const { data: prevLogs = [] } = useQuery({
    queryKey: ['agente-uso-logs-prev'],
    queryFn: () => entities.AgenteUsoLog.list(),
    select: (data) => {
      const from = new Date(dateFrom);
      const diff = new Date(dateTo) - from;
      const prevTo   = new Date(from.getTime() - 1).toISOString().slice(0, 10);
      const prevFrom = new Date(from.getTime() - diff - 1).toISOString().slice(0, 10);
      return data.filter(l => {
        const d = (l.created_at ?? '').slice(0, 10);
        return d >= prevFrom && d <= prevTo;
      });
    },
  });

  const prevCusto = prevLogs.reduce((s, l) => s + Number(l.custo_usd ?? 0), 0);
  const custoVariacao = prevCusto > 0
    ? ((totalCusto - prevCusto) / prevCusto) * 100
    : null;

  const byDay    = useMemo(() => aggregateByDay(logs), [logs]);
  const byAgent  = useMemo(() => aggregateByAgent(logs), [logs]);
  const byModelo = useMemo(() => aggregateByModelo(logs), [logs]);
  const byUser   = useMemo(() => aggregateByUser(logs), [logs]);

  const maxModeloPct = Math.max(...byModelo.map(m => m.pct), 1);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive text-sm">Erro ao carregar métricas.</p>;
  }

  return (
    <div className="space-y-5">

      {/* ① Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground font-medium">Período:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
        />
        <span className="text-sm text-muted-foreground">até</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
        />
      </div>

      {/* ② Banner de custo */}
      <div
        className="rounded-xl p-5 text-white flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, hsl(210 62% 14%), hsl(210 62% 22%))' }}
      >
        <div>
          <p className="text-xs opacity-65 font-bold uppercase tracking-widest mb-1">
            Custo Total — {new Date(dateTo).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-3xl font-extrabold leading-tight mb-1">{formatUSD(totalCusto)}</p>
          <p className="text-xs opacity-70">
            {totalExecucoes.toLocaleString('pt-BR')} execuções · {totalTokens.toLocaleString('pt-BR')} tokens no período
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/10 rounded-lg px-4 py-3">
            <p className="text-xs opacity-65 mb-1">vs período anterior</p>
            {custoVariacao !== null ? (
              <p className="text-base font-extrabold" style={{ color: '#26ffff' }}>
                {custoVariacao >= 0 ? '↑' : '↓'} {Math.abs(custoVariacao).toFixed(0)}%
              </p>
            ) : (
              <p className="text-base font-extrabold opacity-50">—</p>
            )}
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-3">
            <p className="text-xs opacity-65 mb-1">custo médio</p>
            <p className="text-sm font-extrabold">{formatUSD(custoMedio)}</p>
          </div>
        </div>
      </div>

      {/* ③ Execuções por dia */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Execuções por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {byDay.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhuma execução no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={byDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="grad-exec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#26405d" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#26405d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Execuções']}
                  labelFormatter={l => new Date(l).toLocaleDateString('pt-BR')}
                />
                <Area
                  type="monotone"
                  dataKey="execucoes"
                  stroke="#26405d"
                  strokeWidth={2}
                  fill="url(#grad-exec)"
                  name="Execuções"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ④ Grid 3 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Por agente */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por agente</CardTitle>
          </CardHeader>
          <CardContent>
            {byAgent.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-4">
                {byAgent.map((item, idx) => {
                  const color = getAgentColor(item.slug, idx);
                  const pct = byAgent[0].execucoes > 0 ? (item.execucoes / byAgent[0].execucoes) * 100 : 0;
                  const label = item.slug.replace('-agent', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={item.slug}>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.execucoes} exec ·{' '}
                            <span className="font-semibold" style={{ color }}>{formatUSD(item.custo)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por modelo — BarChart vertical em % */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por modelo</CardTitle>
          </CardHeader>
          <CardContent>
            {byModelo.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={byModelo}
                  margin={{ top: 18, right: 4, bottom: 4, left: -28 }}
                  barCategoryGap="28%"
                >
                  <XAxis
                    dataKey="modelo"
                    tick={{ fontSize: 9 }}
                    tickFormatter={m => m.split('/').pop().split('-')[0]}
                  />
                  <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Participação']} />
                  <Bar dataKey="pct" radius={[3, 3, 0, 0]} label={<ModelBarLabel />}>
                    {byModelo.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top usuários */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {byUser.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {byUser.map((user, idx) => (
                  <div key={user.email} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: PALETTE[idx % PALETTE.length] }}
                    >
                      {getInitials(user.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.execucoes} exec · {formatUSD(user.custo)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {logs.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">
          Nenhuma execução registrada no período selecionado.
        </p>
      )}
    </div>
  );
}
