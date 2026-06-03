import { useMemo, useState } from "react";
import { ChevronDown, TableProperties, Search, Layers } from "lucide-react";
import { recalcAcumulado, flattenLeaves } from "@/utils/pqpUtils";
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";

const fmtBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const fmtNum = (v) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(v || 0);
const fmtPct = (v) =>
  `${Math.min(100, Math.max(0, v || 0)).toFixed(1)}%`;

const isLeaf = (n) => !n.children || n.children.length === 0;

function maxDepth(itens, level = 1) {
  return itens.reduce(
    (mx, n) => Math.max(mx, isLeaf(n) ? level : maxDepth(n.children, level + 1)),
    level
  );
}

function visibleRows(itens, level = 1) {
  return itens.flatMap((node) => {
    const row = { node, level };
    if (isLeaf(node)) return [row];
    return [row, ...visibleRows(node.children, level + 1)];
  });
}

function computeSubtotais(node) {
  const leaves = flattenLeaves([node]);
  let valContratual = 0, valMedido = 0;
  for (const l of leaves) {
    const pu = l.preco_unitario ?? 0;
    valContratual += (l.qtd_contratual ?? 0) * pu;
    valMedido += (l.qtd_acumulada ?? 0) * pu;
  }
  return { valContratual, valMedido, saldo: valContratual - valMedido };
}

function computeTotaisGerais(pqp) {
  const leaves = flattenLeaves(pqp);
  let valContratual = 0, valMedido = 0;
  for (const l of leaves) {
    const pu = l.preco_unitario ?? 0;
    valContratual += (l.qtd_contratual ?? 0) * pu;
    valMedido += (l.qtd_acumulada ?? 0) * pu;
  }
  return { valContratual, valMedido, saldo: valContratual - valMedido };
}

export default function PqMestraTab({ pqpMestra = [], faturamentos = [] }) {
  const depth = useMemo(() => maxDepth(pqpMestra), [pqpMestra]);

  const [busca, setBusca] = useState("");
  const [selectedLevels, setSelectedLevels] = useState(new Set());
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [filtrosBar, setFiltrosBar] = useState({});

  const pqpComAcumulado = useMemo(() => {
    const concluidos = faturamentos.filter((f) => f.status === "Concluído");
    return recalcAcumulado(pqpMestra, concluidos);
  }, [pqpMestra, faturamentos]);

  const allRows = useMemo(() => visibleRows(pqpComAcumulado), [pqpComAcumulado]);

  const unidades = useMemo(() =>
    [...new Set(allRows.filter(r => isLeaf(r.node)).map(r => r.node.unidade).filter(Boolean))].sort(),
    [allRows]
  );

  const levelOptions = useMemo(() =>
    Array.from({ length: depth }, (_, i) => i + 1),
    [depth]
  );

  const rows = useMemo(() => {
    const unidadesFiltro = filtrosBar.unidade || [];
    const b = busca.toLowerCase();
    return allRows.filter(({ node, level }) => {
      if (selectedLevels.size > 0 && !selectedLevels.has(level)) return false;
      if (b && !node.item?.toLowerCase().includes(b) && !node.descricao?.toLowerCase().includes(b)) return false;
      if (unidadesFiltro.length > 0 && isLeaf(node) && !unidadesFiltro.includes(node.unidade)) return false;
      if (unidadesFiltro.length > 0 && !isLeaf(node)) return false;
      return true;
    });
  }, [allRows, selectedLevels, busca, filtrosBar]);

  const totais = useMemo(() => computeTotaisGerais(pqpComAcumulado), [pqpComAcumulado]);
  const pctAvanco = totais.valContratual ? (totais.valMedido / totais.valContratual) * 100 : 0;

  const isFilterActive =
    !!busca ||
    selectedLevels.size > 0 ||
    (filtrosBar.unidade || []).length > 0;

  const handleClearAll = () => {
    setBusca("");
    setSelectedLevels(new Set());
    setFiltrosBar({});
    setLevelsOpen(false);
  };

  if (!pqpMestra.length) {
    return (
      <div className="border border-dashed border-border rounded-xl py-16 flex flex-col items-center gap-2 text-muted-foreground">
        <TableProperties className="w-8 h-8 opacity-30" />
        <p className="text-sm">Nenhuma PQ Mestra definida para este projeto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
            placeholder="Buscar item ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Unidade */}
        <FilterBar
          filters={[{ key: "unidade", label: "Unidade", options: unidades }]}
          onChange={setFiltrosBar}
        />

        {/* Níveis — mesmo padrão do Cronograma */}
        <div className="relative">
          <button
            onClick={() => setLevelsOpen(v => !v)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-sm font-medium transition-colors
              ${selectedLevels.size > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Nível{selectedLevels.size > 0 ? ` (${selectedLevels.size})` : ""}
          </button>
          {levelsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLevelsOpen(false)} />
              <div className="absolute top-full mt-1 left-0 z-20 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[130px]">
                {levelOptions.map(lvl => (
                  <label key={lvl} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLevels.has(lvl)}
                      onChange={() => setSelectedLevels(prev => {
                        const next = new Set(prev);
                        if (next.has(lvl)) next.delete(lvl); else next.add(lvl);
                        return next;
                      })}
                      className="rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">Nível {lvl}</span>
                  </label>
                ))}
                {selectedLevels.size > 0 && (
                  <button
                    onClick={() => setSelectedLevels(new Set())}
                    className="w-full mt-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </FilterToolbar>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Contratual</p>
          <p className="font-bold text-sm mt-0.5">{fmtBRL(totais.valContratual)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Medido</p>
          <p className="font-bold text-sm mt-0.5 text-emerald-600 dark:text-emerald-400">{fmtBRL(totais.valMedido)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Saldo a Medir</p>
          <p className="font-bold text-sm mt-0.5">{fmtBRL(totais.saldo)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Avanço Financeiro</p>
          <p className="font-bold text-sm mt-0.5">{fmtPct(pctAvanco)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 text-muted-foreground text-left">
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Item</th>
              <th className="px-3 py-2 font-semibold min-w-[220px]">Descrição</th>
              <th className="px-2 py-2 font-semibold w-12">Un.</th>
              <th className="px-2 py-2 font-semibold text-right w-28 whitespace-nowrap">Qtd. Contratual</th>
              <th className="px-2 py-2 font-semibold text-right w-36">Valor Contratual</th>
              <th className="px-2 py-2 font-semibold text-right w-28 whitespace-nowrap bg-amber-50 dark:bg-amber-900/20">Qtd. Medida</th>
              <th className="px-2 py-2 font-semibold text-right w-36">Valor Medido</th>
              <th className="px-2 py-2 font-semibold text-right w-28 whitespace-nowrap">Saldo Qtd.</th>
              <th className="px-2 py-2 font-semibold text-right w-20 whitespace-nowrap">% Avanço</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Nenhum item corresponde aos filtros aplicados.
                </td>
              </tr>
            ) : rows.map(({ node, level }) => {
              const leaf = isLeaf(node);
              const sub = leaf ? null : computeSubtotais(node);
              const qtdMedida = node.qtd_acumulada ?? 0;
              const qtdContratual = node.qtd_contratual ?? 0;
              const pu = node.preco_unitario ?? 0;
              const saldo = qtdContratual - qtdMedida;
              const pct = qtdContratual > 0 ? (qtdMedida / qtdContratual) * 100 : 0;
              const valContratual = qtdContratual * pu;
              const valMedido = qtdMedida * pu;

              return (
                <tr
                  key={node.item}
                  className={`border-t border-border transition-colors ${
                    leaf
                      ? "hover:bg-muted/20"
                      : level === 1
                        ? "bg-muted/50 font-semibold"
                        : "bg-muted/25 font-medium"
                  }`}
                >
                  <td className="px-3 py-1.5 whitespace-nowrap" style={{ paddingLeft: `${12 + (level - 1) * 14}px` }}>
                    <span className="inline-flex items-center gap-1">
                      {!leaf && <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />}
                      <span className={leaf ? "text-muted-foreground" : ""}>{node.item}</span>
                    </span>
                  </td>
                  <td className="px-3 py-1.5">{node.descricao}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{leaf ? node.unidade : ""}</td>

                  <td className="px-2 py-1.5 text-right">
                    {leaf ? fmtNum(qtdContratual) : "—"}
                  </td>

                  <td className="px-2 py-1.5 text-right">
                    {leaf
                      ? fmtBRL(valContratual)
                      : <span className="text-blue-700 dark:text-blue-400">{fmtBRL(sub.valContratual)}</span>}
                  </td>

                  <td className="px-2 py-1.5 text-right bg-amber-50/60 dark:bg-amber-900/10">
                    {leaf
                      ? <span className={qtdMedida > 0 ? "font-semibold text-amber-700 dark:text-amber-400" : "text-muted-foreground"}>
                          {fmtNum(qtdMedida)}
                        </span>
                      : "—"}
                  </td>

                  <td className="px-2 py-1.5 text-right">
                    {leaf
                      ? <span className={valMedido > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
                          {fmtBRL(valMedido)}
                        </span>
                      : <span className="text-emerald-700 dark:text-emerald-400">{fmtBRL(sub.valMedido)}</span>}
                  </td>

                  <td className="px-2 py-1.5 text-right">
                    {leaf
                      ? <span className={saldo < 0 ? "text-red-600 dark:text-red-400" : ""}>{fmtNum(saldo)}</span>
                      : "—"}
                  </td>

                  <td className="px-2 py-1.5 text-right">
                    {leaf
                      ? <span className={
                          pct >= 100 ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : pct >= 50 ? "text-amber-600 dark:text-amber-400"
                          : pct > 0 ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground"
                        }>
                          {fmtPct(pct)}
                        </span>
                      : <span className="text-muted-foreground">
                          {sub.valContratual > 0 ? fmtPct((sub.valMedido / sub.valContratual) * 100) : "—"}
                        </span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-bold bg-muted/50 text-xs">
              <td className="px-3 py-2.5" colSpan={4}>TOTAL GERAL</td>
              <td className="px-2 py-2.5 text-right">{fmtBRL(totais.valContratual)}</td>
              <td className="px-2 py-2.5 bg-amber-50/60 dark:bg-amber-900/10"></td>
              <td className="px-2 py-2.5 text-right text-emerald-700 dark:text-emerald-400">{fmtBRL(totais.valMedido)}</td>
              <td className="px-2 py-2.5 text-right">{fmtBRL(totais.saldo)}</td>
              <td className="px-2 py-2.5 text-right">{fmtPct(pctAvanco)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
