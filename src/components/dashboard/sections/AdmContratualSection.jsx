// AdmContratualSection.jsx — Seção Adm. Contratual do dashboard
// Sub-blocos: Contratos | Pleitos & Mudanças | Registros & Impacto
// Todos dentro de um único Card com bordas internas entre sub-blocos.

import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ScrollText,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  SectionHeader,
  KpiCard,
  SubSectionBand,
} from "@/components/dashboard/DashboardPrimitives";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMilhoes(value) {
  if (!value && value !== 0) return "—";
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(0)}k`;
  return `R$ ${value.toFixed(0)}`;
}

// ── Donut genérico com legenda lateral ───────────────────────────────────────

function DonutComLegenda({ data, innerRadius = 50, outerRadius = 80 }) {
  const pieData = data.filter((e) => e.count > 0);
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0">
        <ResponsiveContainer width={170} height={170}>
          <PieChart>
            <Pie
              data={pieData.length > 0 ? pieData : [{ count: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="count"
              stroke="none"
            >
              {pieData.length > 0 ? (
                pieData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))
              ) : (
                <Cell fill="#e2e8f0" />
              )}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.map((e) => (
          <div key={e.label} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: e.color }}
            />
            <span className="text-muted-foreground truncate">
              {e.label}
              <span className="font-semibold text-foreground ml-1">· {e.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-BLOCO 1: CONTRATOS
// ══════════════════════════════════════════════════════════════════════════════

const CONTRATO_STATUS_COLORS = {
  "A iniciar": "#94a3b8",
  "Em andamento": "#3b82f6",
  Concluído: "#00a49a",
  Paralisado: "#ef4444",
};

const CONTRATO_STATUS_ORDER = ["A iniciar", "Em andamento", "Concluído", "Paralisado"];

function ContratosBloco({ contratos, aditivos, medicoes, isLoading, isError }) {
  if (isLoading)
    return (
      <div className="p-5">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (isError)
    return (
      <div className="p-5 flex items-center gap-2 text-destructive justify-center py-8">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Erro ao carregar dados de contratos.</span>
      </div>
    );

  // KPIs
  const total = contratos.length;
  const ativos = contratos.filter((c) => c.status === "Em andamento").length;
  const valorContratado = contratos.reduce((acc, c) => acc + (c.valor_total || 0), 0);
  const valorAditivado = aditivos.reduce((acc, a) => acc + (a.valor || 0), 0);
  const medicoesMedidas = medicoes
    .filter((m) => ["Aprovada", "Paga"].includes(m.status))
    .reduce((acc, m) => acc + (m.valor || 0), 0);

  // Donut por status
  const donutData = CONTRATO_STATUS_ORDER.map((s) => ({
    label: s,
    count: contratos.filter((c) => c.status === s).length,
    color: CONTRATO_STATUS_COLORS[s],
  }));

  // Barras horizontais: top 5 contratos por valor
  const topContratos = [...contratos]
    .sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0))
    .slice(0, 5)
    .map((c) => ({
      nome: c.objeto && c.objeto.trim() ? c.objeto : c.numero || "—",
      valor: c.valor_total || 0,
    }));

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Contratos" value={total} icon={ScrollText} color="#8b5cf6" />
        <KpiCard label="Ativos" value={ativos} icon={CheckCircle} color="#7c3aed" />
        <KpiCard
          label="Valor contratado"
          value={formatMilhoes(valorContratado)}
          icon={DollarSign}
          color="#26405d"
        />
        <KpiCard
          label="Aditivado"
          value={formatMilhoes(valorAditivado)}
          icon={TrendingUp}
          color="#f59e0b"
        />
        <KpiCard
          label="Medido acumulado"
          value={formatMilhoes(medicoesMedidas)}
          icon={CheckCircle}
          color="#16a34a"
        />
      </div>

      {/* Gráficos */}
      <div className="flex gap-5">
        {/* Donut por status */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Contratos por status
          </p>
          {contratos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum contrato registrado.
            </p>
          ) : (
            <DonutComLegenda data={donutData} innerRadius={55} outerRadius={85} />
          )}
        </div>

        {/* Barras horizontais: top contratos por valor */}
        <div style={{ flex: 1.4 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Top contratos por valor
          </p>
          {topContratos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum contrato com valor registrado.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                layout="vertical"
                data={topContratos}
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
                  dataKey="nome"
                  width={110}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [formatMilhoes(v), "Valor"]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="valor" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-BLOCO 2: PLEITOS & MUDANÇAS
// ══════════════════════════════════════════════════════════════════════════════

const PLEITO_PRIORIDADE_COLORS = {
  Crítica: "#ef4444",
  Alta: "#f59e0b",
  Média: "#3b82f6",
  Baixa: "#94a3b8",
};
const PLEITO_PRIORIDADE_ORDER = ["Crítica", "Alta", "Média", "Baixa"];

const MUDANCA_STATUS_COLORS = {
  Identificada: "#94a3b8",
  "Em análise": "#f59e0b",
  Aprovada: "#16a34a",
  Rejeitada: "#ef4444",
  Implementada: "#7c3aed",
};
const MUDANCA_STATUS_ORDER = ["Identificada", "Em análise", "Aprovada", "Rejeitada", "Implementada"];

function PleitosMudancasBloco({ pleitos, mudancas, isLoading, isError }) {
  if (isLoading)
    return (
      <div className="p-5">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (isError)
    return (
      <div className="p-5 flex items-center gap-2 text-destructive justify-center py-8">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Erro ao carregar pleitos e mudanças.</span>
      </div>
    );

  // KPIs
  const totalPleitos = pleitos.length;
  const criticos = pleitos.filter((p) => p.prioridade === "Crítica").length;
  const emAberto = pleitos.filter((p) =>
    ["Aberto", "Em Análise", "Em Andamento"].includes(p.status)
  ).length;
  const totalMudancas = mudancas.length;
  const impactoCusto = mudancas.reduce((acc, m) => acc + (m.impacto_custo || 0), 0);
  const impactoPrazo = mudancas.reduce((acc, m) => acc + (m.impacto_prazo || 0), 0);

  // Donut: pleitos por prioridade
  const donutData = PLEITO_PRIORIDADE_ORDER.map((p) => ({
    label: p,
    count: pleitos.filter((pl) => pl.prioridade === p).length,
    color: PLEITO_PRIORIDADE_COLORS[p],
  }));

  // Barras horizontais: mudanças por status
  const mudancaStatusData = MUDANCA_STATUS_ORDER
    .map((s) => ({
      status: s,
      count: mudancas.filter((m) => m.status === s).length,
      color: MUDANCA_STATUS_COLORS[s],
    }))
    .filter((s) => s.count > 0);

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Pleitos" value={totalPleitos} icon={FileText} color="#be123c" />
        <KpiCard label="Críticos" value={criticos} icon={AlertCircle} color="#ef4444" />
        <KpiCard label="Em aberto" value={emAberto} icon={Clock} color="#f59e0b" />
        <KpiCard label="Mudanças" value={totalMudancas} icon={TrendingUp} color="#8b5cf6" />
        <KpiCard
          label="Impacto custo"
          value={formatMilhoes(impactoCusto)}
          icon={AlertCircle}
          color="#ef4444"
          sub={impactoPrazo ? `+${impactoPrazo}d prazo` : undefined}
        />
      </div>

      {/* Gráficos */}
      <div className="flex gap-5">
        {/* Donut: pleitos por prioridade */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Pleitos por prioridade
          </p>
          {pleitos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum pleito registrado.
            </p>
          ) : (
            <DonutComLegenda data={donutData} innerRadius={50} outerRadius={80} />
          )}
        </div>

        {/* Barras: mudanças por status */}
        <div style={{ flex: 1.4 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Mudanças por status
          </p>
          {mudancaStatusData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhuma mudança registrada.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                layout="vertical"
                data={mudancaStatusData}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
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
                  formatter={(v) => [v, "Mudanças"]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {mudancaStatusData.map((entry) => (
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

// ══════════════════════════════════════════════════════════════════════════════
// SUB-BLOCO 3: REGISTROS & IMPACTO
// ══════════════════════════════════════════════════════════════════════════════

const REGISTRO_GRAVIDADE_COLORS = {
  Alta: "#ef4444",
  Média: "#f59e0b",
  Baixa: "#16a34a",
};
const REGISTRO_GRAVIDADE_ORDER = ["Alta", "Média", "Baixa"];

function calcAreasImpacto(registros, categorias) {
  // Tenta usar areas_impacto (array JSONB de nomes de categoria)
  const hasAreasImpacto = registros.some(
    (r) => r.areas_impacto && r.areas_impacto.length > 0
  );

  if (hasAreasImpacto && categorias.length > 0) {
    return categorias
      .map((cat) => ({
        nome: cat.nome,
        count: registros.filter((r) => {
          if (!r.areas_impacto) return false;
          const raw = JSON.stringify(r.areas_impacto);
          return raw.includes(cat.nome);
        }).length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Fallback: agrupar por gravidade
  return REGISTRO_GRAVIDADE_ORDER.map((g) => ({
    nome: g,
    count: registros.filter((r) => r.gravidade === g).length,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

function RegistrosImpactoBloco({ rdos, registros, categorias, isLoading, isError }) {
  if (isLoading)
    return (
      <div className="p-5">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (isError)
    return (
      <div className="p-5 flex items-center gap-2 text-destructive justify-center py-8">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Erro ao carregar registros e impacto.</span>
      </div>
    );

  // KPIs
  const totalRdos = rdos.length;
  const totalRegistros = registros.length;
  const gravidadeAlta = registros.filter((r) => r.gravidade === "Alta").length;
  const vinculadosPleito = registros.filter((r) => r.pleito_id).length;
  const emAnalise = registros.filter((r) => r.status === "Em Análise").length;

  // Donut: registros por gravidade
  const donutData = REGISTRO_GRAVIDADE_ORDER.map((g) => ({
    label: g,
    count: registros.filter((r) => r.gravidade === g).length,
    color: REGISTRO_GRAVIDADE_COLORS[g],
  }));

  // Barras: mapa de impacto — top categorias (ou fallback por gravidade)
  const areasData = calcAreasImpacto(registros, categorias);

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="RDOs" value={totalRdos} icon={FileText} color="#b45309" />
        <KpiCard label="Registros" value={totalRegistros} icon={AlertTriangle} color="#26405d" />
        <KpiCard label="Gravidade Alta" value={gravidadeAlta} icon={AlertCircle} color="#ef4444" />
        <KpiCard
          label="Vinculados a pleito"
          value={vinculadosPleito}
          icon={ScrollText}
          color="#8b5cf6"
        />
        <KpiCard label="Em análise" value={emAnalise} icon={Clock} color="#f59e0b" />
      </div>

      {/* Gráficos */}
      <div className="flex gap-5">
        {/* Donut: registros por gravidade */}
        <div style={{ flex: 1 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Registros por gravidade
          </p>
          {registros.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum registro encontrado.
            </p>
          ) : (
            <DonutComLegenda data={donutData} innerRadius={50} outerRadius={80} />
          )}
        </div>

        {/* Barras horizontais: mapa de impacto */}
        <div style={{ flex: 1.4 }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Mapa de impacto — por categoria
          </p>
          {areasData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhuma categoria de impacto registrada.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                layout="vertical"
                data={areasData}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={110}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [v, "Registros"]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#b45309" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function AdmContratualSection({ projetoId }) {
  // Contratos
  const { data: contratos = [], isPending: isLoadingCtr, isError: isErrorCtr } = useQuery({
    queryKey: ["contratos_adm_dash", projetoId],
    queryFn: () => entities.Contrato.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: aditivos = [], isError: isErrorAdit } = useQuery({
    queryKey: ["aditivos_adm_dash", projetoId],
    queryFn: () => entities.Aditivo.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: medicoes = [], isError: isErrorMed } = useQuery({
    queryKey: ["medicoes_adm_dash", projetoId],
    queryFn: () => entities.Medicao.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  // Pleitos & Mudanças
  const { data: pleitos = [], isPending: isLoadingPle, isError: isErrorPle } = useQuery({
    queryKey: ["pleitos_adm_dash", projetoId],
    queryFn: () => entities.Pleito.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: mudancas = [], isError: isErrorMud } = useQuery({
    queryKey: ["mudancas_adm_dash", projetoId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  // Registros & Impacto
  const { data: rdos = [], isPending: isLoadingRdo, isError: isErrorRdo } = useQuery({
    queryKey: ["rdos_adm_dash", projetoId],
    queryFn: () => entities.Rdo.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: registros = [], isError: isErrorReg } = useQuery({
    queryKey: ["registros_adm_dash", projetoId],
    queryFn: () => entities.Registro.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });
  const { data: categorias = [], isError: isErrorCat } = useQuery({
    queryKey: ["categorias_adm_dash", projetoId],
    queryFn: () => entities.CategoriaImpacto.filter({ projeto_id: projetoId }),
    enabled: !!projetoId,
  });

  return (
    <Card className="border-0 shadow-md">
      <SectionHeader
        title="Adm. Contratual"
        icon={ScrollText}
        color="#8b5cf6"
        subtitle="Contratos · Pleitos & Mudanças · Registros & Impacto"
      />

      <CardContent className="p-0">
        {/* Sub-bloco Contratos */}
        <div>
          <SubSectionBand
            title="📑 Contratos"
            tagline="Contratos · Aditivos · Medições"
            bg="#f5f3ff"
            color="#6d28d9"
            borderColor="#e4dcff"
          />
          <ContratosBloco
            contratos={contratos}
            aditivos={aditivos}
            medicoes={medicoes}
            isLoading={isLoadingCtr}
            isError={isErrorCtr || isErrorAdit || isErrorMed}
          />
        </div>

        {/* Sub-bloco Pleitos & Mudanças */}
        <div className="border-t border-border">
          <SubSectionBand
            title="⚖️ Pleitos & Mudanças"
            tagline="Pleitos · Gestão de Mudanças"
            bg="#fff1f2"
            color="#be123c"
            borderColor="#fecdd3"
          />
          <PleitosMudancasBloco
            pleitos={pleitos}
            mudancas={mudancas}
            isLoading={isLoadingPle}
            isError={isErrorPle || isErrorMud}
          />
        </div>

        {/* Sub-bloco Registros & Impacto */}
        <div className="border-t border-border">
          <SubSectionBand
            title="🗂️ Registros & Impacto"
            tagline="RDOs · Registros · Mapa de Impacto"
            bg="#fffbeb"
            color="#b45309"
            borderColor="#fde68a"
          />
          <RegistrosImpactoBloco
            rdos={rdos}
            registros={registros}
            categorias={categorias}
            isLoading={isLoadingRdo}
            isError={isErrorRdo || isErrorReg || isErrorCat}
          />
        </div>
      </CardContent>
    </Card>
  );
}
