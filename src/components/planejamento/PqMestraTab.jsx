import { useMemo, useState, useRef } from "react";
import { ChevronDown, TableProperties, Search, Layers, Plus, Download } from "lucide-react";
import { recalcAcumulado, flattenLeaves, buildTreeFromFlat } from "@/utils/pqpUtils";
import FilterToolbar from "@/components/ui/FilterToolbar";
import FilterBar from "@/components/ui/FilterBar";
import { FormDialog } from "@/components/ui/FormDialog";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PQP_COLUMNS = [
  { key: "item",           label: "Item (EAP)",     type: "string", required: true },
  { key: "descricao",      label: "Descrição",      type: "string" },
  { key: "unidade",        label: "Unidade",        type: "string" },
  { key: "qtd_contratual", label: "Quantidade",     type: "number" },
  { key: "preco_unitario", label: "Preço unitário", type: "number" },
];

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

function flattenAllNodes(itens) {
  return itens.flatMap(n => [
    { item: n.item, descricao: n.descricao },
    ...(n.children?.length ? flattenAllNodes(n.children) : []),
  ]);
}

function findNode(tree, itemCode) {
  for (const n of tree) {
    if (n.item === itemCode) return n;
    if (n.children?.length) {
      const found = findNode(n.children, itemCode);
      if (found) return found;
    }
  }
  return null;
}

function suggestNextCode(tree, parentItem) {
  const siblings = parentItem ? (findNode(tree, parentItem)?.children || []) : tree;
  if (siblings.length === 0) return parentItem ? `${parentItem}.1` : "1";
  const sorted = [...siblings].sort((a, b) =>
    a.item.localeCompare(b.item, undefined, { numeric: true })
  );
  const last = sorted[sorted.length - 1].item;
  const parts = last.split(".");
  parts[parts.length - 1] = String((parseInt(parts[parts.length - 1]) || 0) + 1);
  return parts.join(".");
}

function insertIntoTree(tree, parentItem, newNode) {
  if (!parentItem) {
    return [...tree, newNode].sort((a, b) =>
      a.item.localeCompare(b.item, undefined, { numeric: true })
    );
  }
  return tree.map(n => {
    if (n.item === parentItem) {
      const children = [...(n.children || []), newNode].sort((a, b) =>
        a.item.localeCompare(b.item, undefined, { numeric: true })
      );
      return { ...n, children };
    }
    if (n.children?.length) {
      return { ...n, children: insertIntoTree(n.children, parentItem, newNode) };
    }
    return n;
  });
}

function flattenForExport(itens) {
  return itens.flatMap(n => {
    const row = {
      item: n.item,
      descricao: n.descricao ?? "",
      unidade: n.unidade ?? "",
      qtd_contratual: n.qtd_contratual ?? 0,
      preco_unitario: n.preco_unitario ?? 0,
    };
    return isLeaf(n) ? [row] : [row, ...flattenForExport(n.children)];
  });
}

export default function PqMestraTab({
  pqpMestra = [],
  faturamentos = [],
  onSavePqp,
  isSavingPqp = false,
}) {
  const depth = useMemo(() => maxDepth(pqpMestra), [pqpMestra]);

  const [busca, setBusca] = useState("");
  const [selectedLevels, setSelectedLevels] = useState(new Set());
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [filtrosBar, setFiltrosBar] = useState({});

  // Import/Export
  const [showImportExport, setShowImportExport] = useState(false);
  const importBuf = useRef([]);
  const didImport = useRef(false);

  // Add Item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [addParent, setAddParent] = useState("");
  const [addItemCode, setAddItemCode] = useState("");
  const [addDescricao, setAddDescricao] = useState("");
  const [addUnidade, setAddUnidade] = useState("");
  const [addQtd, setAddQtd] = useState("");
  const [addPreco, setAddPreco] = useState("");

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

  const allNodes = useMemo(() => flattenAllNodes(pqpMestra), [pqpMestra]);

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

  // Import handlers
  const openImportExport = () => {
    importBuf.current = [];
    didImport.current = false;
    setShowImportExport(true);
  };

  const handleImportRow = async (row) => {
    importBuf.current.push(row);
    didImport.current = true;
  };

  const handleImportExportChange = (open) => {
    if (!open && didImport.current) {
      const newTree = buildTreeFromFlat(importBuf.current);
      onSavePqp?.(newTree);
    }
    if (!open) {
      importBuf.current = [];
      didImport.current = false;
    }
    setShowImportExport(open);
  };

  // Add Item handlers
  const openAddItem = () => {
    setAddParent("");
    setAddItemCode(suggestNextCode(pqpMestra, null));
    setAddDescricao("");
    setAddUnidade("");
    setAddQtd("");
    setAddPreco("");
    setShowAddItem(true);
  };

  const handleAddParentChange = (val) => {
    setAddParent(val);
    setAddItemCode(suggestNextCode(pqpMestra, val || null));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const code = addItemCode.trim();
    if (!code || !addDescricao.trim()) return;
    if (allNodes.some(n => n.item === code)) return;
    const newNode = {
      item: code,
      descricao: addDescricao.trim(),
      unidade: addUnidade.trim(),
      qtd_contratual: Number(addQtd) || 0,
      preco_unitario: Number(addPreco) || 0,
    };
    const newTree = insertIntoTree(pqpMestra, addParent || null, newNode);
    onSavePqp?.(newTree);
    setShowAddItem(false);
  };

  const emptyState = !pqpMestra.length;

  // Dialogs shared between empty-state and full render — always rendered at the bottom.
  const dialogs = (
    <>
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={handleImportExportChange}
        title="PQ Mestra — Importar / Exportar"
        exportFileName="pq-mestra"
        columns={PQP_COLUMNS}
        onExport={() => flattenForExport(pqpMestra)}
        onImport={handleImportRow}
      />
      <FormDialog
        open={showAddItem}
        onOpenChange={(o) => !o && setShowAddItem(false)}
        title="Adicionar Item à PQ Mestra"
        subtitle="O item será inserido na hierarquia conforme o código informado"
        icon={Plus}
        maxWidth="max-w-lg"
        hideFooter
      >
        <AddItemForm
          allNodes={allNodes}
          addParent={addParent}
          addItemCode={addItemCode}
          addDescricao={addDescricao}
          addUnidade={addUnidade}
          addQtd={addQtd}
          addPreco={addPreco}
          onParentChange={handleAddParentChange}
          onItemCodeChange={setAddItemCode}
          onDescricaoChange={setAddDescricao}
          onUnidadeChange={setAddUnidade}
          onQtdChange={setAddQtd}
          onPrecoChange={setAddPreco}
          onSubmit={handleAddSubmit}
          onCancel={() => setShowAddItem(false)}
          isSaving={isSavingPqp}
          existingCodes={allNodes.map(n => n.item)}
        />
      </FormDialog>
    </>
  );

  if (emptyState) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={openImportExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Importar / Exportar
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openAddItem}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Item
          </Button>
        </div>
        <div className="border border-dashed border-border rounded-xl py-16 flex flex-col items-center gap-2 text-muted-foreground">
          <TableProperties className="w-8 h-8 opacity-30" />
          <p className="text-sm">Nenhuma PQ Mestra definida para este projeto.</p>
          <p className="text-xs">Use &quot;Importar / Exportar&quot; ou &quot;Adicionar Item&quot; para começar.</p>
        </div>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Planilha de Quantidades e Preços</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openImportExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Importar / Exportar
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openAddItem}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Item
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className="h-8 border border-border rounded-md pl-8 pr-3 text-sm w-56 bg-background text-foreground"
            placeholder="Buscar item ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <FilterBar
          filters={[{ key: "unidade", label: "Unidade", options: unidades }]}
          onChange={setFiltrosBar}
        />

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

      {dialogs}
    </div>
  );
}

function AddItemForm({
  allNodes,
  addParent, addItemCode, addDescricao, addUnidade, addQtd, addPreco,
  onParentChange, onItemCodeChange, onDescricaoChange, onUnidadeChange, onQtdChange, onPrecoChange,
  onSubmit, onCancel, isSaving, existingCodes = [],
}) {
  const isDuplicate = existingCodes.includes(addItemCode.trim());

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="add-parent">Inserir dentro de</Label>
        <Select value={addParent} onValueChange={onParentChange}>
          <SelectTrigger id="add-parent">
            <SelectValue placeholder="— Raiz (nível superior) —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Raiz (nível superior) —</SelectItem>
            {allNodes.map(({ item, descricao }) => (
              <SelectItem key={item} value={item}>
                {item} — {descricao || "(sem descrição)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="add-item-code">Código do Item *</Label>
          <Input
            id="add-item-code"
            value={addItemCode}
            onChange={e => onItemCodeChange(e.target.value)}
            placeholder="Ex: 1.2.3"
            required
            className={isDuplicate ? "border-red-500" : ""}
          />
          {isDuplicate && (
            <p className="text-xs text-red-500">Esse código já existe na planilha.</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-unidade">Unidade</Label>
          <Input
            id="add-unidade"
            value={addUnidade}
            onChange={e => onUnidadeChange(e.target.value)}
            placeholder="m³, kg, un..."
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="add-descricao">Descrição *</Label>
        <Input
          id="add-descricao"
          value={addDescricao}
          onChange={e => onDescricaoChange(e.target.value)}
          placeholder="Descrição do item"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="add-qtd">Qtd. Contratual</Label>
          <Input
            id="add-qtd"
            type="number"
            value={addQtd}
            onChange={e => onQtdChange(e.target.value)}
            placeholder="0"
            min="0"
            step="any"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-preco">Preço Unitário (R$)</Label>
          <Input
            id="add-preco"
            type="number"
            value={addPreco}
            onChange={e => onPrecoChange(e.target.value)}
            placeholder="0,00"
            min="0"
            step="any"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isSaving || isDuplicate || !addItemCode.trim() || !addDescricao.trim()}
        >
          {isSaving ? "Salvando..." : "Adicionar Item"}
        </Button>
      </div>
    </form>
  );
}
