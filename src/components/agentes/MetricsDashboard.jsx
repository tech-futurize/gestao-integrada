import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Bot, CalendarDays, Cpu, User } from 'lucide-react';
import DateRangePicker from '@/components/ui/DateRangePicker';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

async function fetchUsdBrl() {
  // Fonte primária: ExchangeRate-API (cotação comercial atualizada)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const json = await res.json();
      const rate = Number(json.rates?.BRL);
      if (rate > 1) return rate;
    }
  } catch { /* fallback abaixo */ }

  // Fallback: AwesomeAPI
  const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
  if (!res.ok) throw new Error('cotação indisponível');
  const json = await res.json();
  const rate = Number(json.USDBRL?.ask ?? json.USDBRL?.bid);
  if (!rate || rate < 1) throw new Error('cotação indisponível');
  return rate;
}

const PALETTE = ['#26405d', '#c35e1e', '#00a49a', '#3b82f6', '#f59e0b', '#8b5cf6'];
const ACTIVE_COLOR = '#ef4444';

const FILTER_LABELS = { agent: 'Agente', modelo: 'Modelo', user: 'Usuário', day: 'Dia' };
const FILTER_ICONS  = { agent: Bot, modelo: Cpu, user: User, day: CalendarDays };

function getInitials(email = '') {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function formatUSD(val) {
  return `$${Number(val ?? 0).toFixed(4)}`;
}

function formatBRL(usd, rate) {
  if (!rate) return null;
  const brl = Number(usd ?? 0) * rate;
  return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });
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

function aggregateByAgent(logs, agentNames = {}) {
  const acc = {};
  for (const log of logs) {
    const slug = log.agente_slug ?? 'desconhecido';
    if (!acc[slug]) acc[slug] = { slug, nome: agentNames[slug] ?? slug, execucoes: 0, custo: 0 };
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

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

const ModelBarLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="currentColor">
    {value}%
  </text>
);

export default function MetricsDashboard() {
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [activeFilter, setActiveFilter] = useState(null);

  const dateFrom = dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : '';
  const dateTo   = dateRange?.to   ? dateRange.to.toISOString().slice(0, 10)   : new Date().toISOString().slice(0, 10);

  const toggleFilter = (type, value) => {
    setActiveFilter(prev => prev?.type === type && prev.value === value ? null : { type, value });
  };

  const { data: usdBrl, isError: rateError } = useQuery({
    queryKey: ['usd-brl-rate'],
    queryFn: fetchUsdBrl,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: agentes = [] } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => entities.Agente.list({}, { pageSize: 100 }),
  });
  const agentNames = Object.fromEntries(agentes.map(a => [a.slug, a.nome]));

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

  const { data: prevLogs = [] } = useQuery({
    queryKey: ['agente-uso-logs-prev', dateFrom, dateTo],
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

  // Cross-filter: aplica o filtro ativo em cima dos logs do período
  const filteredLogs = useMemo(() => {
    if (!activeFilter) return logs;
    switch (activeFilter.type) {
      case 'agent':  return logs.filter(l => (l.agente_slug    ?? 'desconhecido') === activeFilter.value);
      case 'modelo': return logs.filter(l => (l.modelo         ?? 'desconhecido') === activeFilter.value);
      case 'user':   return logs.filter(l => (l.usuario_email  ?? 'anônimo')      === activeFilter.value);
      case 'day':    return logs.filter(l => (l.created_at     ?? '').slice(0, 10) === activeFilter.value);
      default:       return logs;
    }
  }, [logs, activeFilter]);

  // O gráfico que é a fonte do filtro exibe seus dados completos (apenas destaca o item).
  // Os demais exibem filteredLogs para refletir a seleção.
  const byDay    = useMemo(() => aggregateByDay(activeFilter?.type === 'day'    ? logs : filteredLogs), [logs, filteredLogs, activeFilter]);
  const byAgent  = useMemo(() => aggregateByAgent(activeFilter?.type === 'agent' ? logs : filteredLogs, agentNames), [logs, filteredLogs, activeFilter, agentNames]);
  const byModelo = useMemo(() => aggregateByModelo(activeFilter?.type === 'modelo' ? logs : filteredLogs), [logs, filteredLogs, activeFilter]);
  const byUser   = useMemo(() => aggregateByUser(activeFilter?.type === 'user'   ? logs : filteredLogs), [logs, filteredLogs, activeFilter]);

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
        <DateRangePicker
          label="Período"
          value={dateRange}
          onChange={range => { setDateRange(range); setActiveFilter(null); }}
          onClear={() => { setDateRange(defaultDateRange()); setActiveFilter(null); }}
        />
        {activeFilter && (() => {
          const Icon = FILTER_ICONS[activeFilter.type];
          return (
            <button
              onClick={() => setActiveFilter(null)}
              className="flex items-center gap-1.5 h-8 text-sm font-normal text-primary bg-primary/5 border border-primary rounded-md px-2.5 hover:bg-primary/10 transition-colors"
            >
              {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
              <span className="font-medium">{FILTER_LABELS[activeFilter.type]}:</span>
              <span className="font-bold truncate max-w-[160px]">{activeFilter.value}</span>
              <X className="w-3 h-3 flex-shrink-0 opacity-60" />
            </button>
          );
        })()}
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
          {usdBrl ? (
            <>
              <p className="text-3xl font-extrabold leading-tight">{formatBRL(totalCusto, usdBrl)}</p>
              <p className="text-xs opacity-55 mt-0.5 mb-1">{formatUSD(totalCusto)} · cotação atual ~R$ {Number(usdBrl).toFixed(2)}/USD</p>
            </>
          ) : (
            <p className="text-3xl font-extrabold leading-tight mb-1">{formatUSD(totalCusto)}</p>
          )}
          <p className="text-xs opacity-70">
            {totalExecucoes.toLocaleString('pt-BR')} execuções · {totalTokens.toLocaleString('pt-BR')} tokens no período
            {!rateError && !usdBrl && <span className="opacity-50"> · carregando cotação…</span>}
            {rateError && <span className="opacity-50"> · cotação indisponível</span>}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/10 rounded-lg px-4 py-3">
            <p className="text-xs opacity-65 mb-1">vs mês anterior</p>
            {custoVariacao !== null ? (
              <p className="text-base font-extrabold" style={{ color: '#26ffff' }}>
                {custoVariacao >= 0 ? '↑' : '↓'} {Math.abs(custoVariacao).toFixed(0)}%
              </p>
            ) : (
              <p className="text-base font-extrabold opacity-50">—</p>
            )}
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-3">
            <p className="text-xs opacity-65 mb-1">custo médio / execução</p>
            <p className="text-sm font-extrabold">
              {usdBrl ? formatBRL(custoMedio, usdBrl) : formatUSD(custoMedio)}
            </p>
          </div>
        </div>
      </div>

      {/* ③ Execuções por dia — BarChart clicável */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Execuções por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {byDay.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhuma execução no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Execuções']}
                  labelFormatter={l => new Date(l).toLocaleDateString('pt-BR')}
                />
                <Bar
                  dataKey="execucoes"
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => toggleFilter('day', data.day)}
                >
                  {byDay.map((item, i) => (
                    <Cell
                      key={i}
                      fill={activeFilter?.type === 'day' && activeFilter.value === item.day ? ACTIVE_COLOR : '#26405d'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ④ Grid 3 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Por agente — clicável */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por agente</CardTitle>
          </CardHeader>
          <CardContent>
            {byAgent.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {byAgent.map((item, idx) => {
                  const isActive = activeFilter?.type === 'agent' && activeFilter.value === item.slug;
                  const color = isActive ? ACTIVE_COLOR : PALETTE[idx % PALETTE.length];
                  const pct = byAgent[0].execucoes > 0 ? (item.execucoes / byAgent[0].execucoes) * 100 : 0;
                  return (
                    <div
                      key={item.slug}
                      onClick={() => toggleFilter('agent', item.slug)}
                      className={`rounded-lg p-2 -mx-2 cursor-pointer transition-colors ${isActive ? 'bg-red-500/8' : 'hover:bg-muted/40'}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-tight">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.execucoes} exec ·{' '}
                            <span className="font-semibold" style={{ color }}>
                              {usdBrl ? formatBRL(item.custo, usdBrl) : formatUSD(item.custo)}
                            </span>
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

        {/* Por modelo — BarChart clicável */}
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
                  <Bar
                    dataKey="pct"
                    radius={[3, 3, 0, 0]}
                    label={<ModelBarLabel />}
                    cursor="pointer"
                    onClick={(data) => toggleFilter('modelo', data.modelo)}
                  >
                    {byModelo.map((m, i) => (
                      <Cell
                        key={i}
                        fill={activeFilter?.type === 'modelo' && activeFilter.value === m.modelo ? ACTIVE_COLOR : PALETTE[i % PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top usuários — clicável */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {byUser.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {byUser.map((user, idx) => {
                  const isActive = activeFilter?.type === 'user' && activeFilter.value === user.email;
                  return (
                    <div
                      key={user.email}
                      onClick={() => toggleFilter('user', user.email)}
                      className={`flex items-center gap-3 rounded-lg p-1.5 -mx-1.5 cursor-pointer transition-colors ${isActive ? 'bg-red-500/8' : 'hover:bg-muted/40'}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                        style={{ background: isActive ? ACTIVE_COLOR : PALETTE[idx % PALETTE.length] }}
                      >
                        {getInitials(user.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.execucoes} exec · {usdBrl ? formatBRL(user.custo, usdBrl) : formatUSD(user.custo)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {filteredLogs.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">
          Nenhuma execução registrada no período selecionado.
        </p>
      )}
    </div>
  );
}
