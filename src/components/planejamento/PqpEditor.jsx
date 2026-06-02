// src/components/planejamento/PqpEditor.jsx
// Editor de PQP/EAP hierárquica reutilizável.
//   mode="definicao" → planilha contratual (Item·Descrição·Un·Qtd·Preço unit·Preço total)
//   mode="medicao"   → lançamento (…·Contratual·Acum·Saldo·Qtd medida[input]·Valor medido·Valor acum)
// Níveis-pai exibem subtotal; o input destacado é o único campo editável conforme o modo.
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronDown, Upload, Plus } from "lucide-react";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";
import {
  computeItemValues, computeTotais, buildTreeFromFlat, flattenLeaves,
} from "@/utils/pqpUtils";

const fmtBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(v || 0);
const fmtNum = (v) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(v || 0);

const PQP_IMPORT_COLUMNS = [
  { key: "item", label: "Item (EAP)", type: "string", required: true },
  { key: "descricao", label: "Descrição", type: "string" },
  { key: "unidade", label: "Unidade", type: "string" },
  { key: "qtd_contratual", label: "Quantidade", type: "number" },
  { key: "preco_unitario", label: "Preço unitário", type: "number" },
];

const isLeaf = (n) => !n.children || n.children.length === 0;

/** Atualiza imutavelmente o nó de código `code` com `patch`. */
function updateNode(itens, code, patch) {
  return itens.map((n) => {
    if (n.item === code) return { ...n, ...patch };
    if (n.children?.length) return { ...n, children: updateNode(n.children, code, patch) };
    return n;
  });
}

/** Linhas visíveis (achatadas) respeitando profundidade máxima `maxLevel`. */
function visibleRows(itens, maxLevel, level = 1) {
  return itens.flatMap((node) => {
    const row = { node, level };
    if (level >= maxLevel || isLeaf(node)) return [row];
    return [row, ...visibleRows(node.children, maxLevel, level + 1)];
  });
}

/** Profundidade máxima da árvore (para o seletor de nível). */
function maxDepth(itens, level = 1) {
  return itens.reduce(
    (mx, n) => Math.max(mx, isLeaf(n) ? level : maxDepth(n.children, level + 1)),
    level
  );
}

export default function PqpEditor({ itens = [], onChange, mode = "definicao", readOnly = false, contratoLabel }) {
  const [showImport, setShowImport] = useState(false);
  const depth = useMemo(() => maxDepth(itens, 1), [itens]);
  const [maxLevel, setMaxLevel] = useState(99);
  const importBuffer = useRef([]);

  const rows = useMemo(() => visibleRows(itens, maxLevel), [itens, maxLevel]);
  const totais = useMemo(() => computeTotais(itens), [itens]);
  const isMedicao = mode === "medicao";
  const colCount = isMedicao ? 9 : 6;

  const editLeaf = (code, key, raw) => {
    const value = raw === "" ? 0 : Number(raw);
    onChange?.(updateNode(itens, code, { [key]: value }));
  };

  const addItemRaiz = () => {
    const nextNum = String(itens.length + 1);
    onChange?.([
      ...itens,
      { item: nextNum, descricao: "", unidade: "", qtd_contratual: 0, preco_unitario: 0, qtd_acumulada: 0, qtd_medida: 0 },
    ]);
  };

  // Importação: acumula linhas flat e reconstrói a árvore a cada inserção.
  const handleImportRow = async (row) => {
    importBuffer.current.push(row);
    onChange?.(buildTreeFromFlat(importBuffer.current));
  };
  const openImport = () => { importBuffer.current = []; setShowImport(true); };

  return (
    <div className="space-y-3">
      {/* Barra de ações */}
      <div className="flex items-center gap-2 flex-wrap">
        {!readOnly && (
          <>
            <Button type="button" size="sm" variant="outline" onClick={openImport}>
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Importar Excel/CSV
            </Button>
            {!isMedicao && (
              <Button type="button" size="sm" variant="outline" onClick={addItemRaiz}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar item
              </Button>
            )}
          </>
        )}
        {depth > 1 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-muted-foreground">Expandir até nível</span>
            <Select value={String(maxLevel)} onValueChange={(v) => setMaxLevel(Number(v))}>
              <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: depth }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
                <SelectItem value="99">Tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tabela */}
      {rows.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <span className="text-sm">Nenhum item na planilha ainda</span>
          {!readOnly && (
            <Button type="button" size="sm" variant="outline" onClick={openImport}>
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Importar Excel/CSV
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-left">
                <th className="px-3 py-2 font-semibold">Item</th>
                <th className="px-3 py-2 font-semibold">Descrição</th>
                {isMedicao ? (
                  <>
                    <th className="px-2 py-2 font-semibold text-right">Contratual</th>
                    <th className="px-2 py-2 font-semibold text-right">Acum.</th>
                    <th className="px-2 py-2 font-semibold text-right">Saldo</th>
                    <th className="px-2 py-2 font-semibold text-right bg-amber-100/60 dark:bg-amber-900/20">Qtd. medida</th>
                    <th className="px-2 py-2 font-semibold text-right">Preço unit.</th>
                    <th className="px-2 py-2 font-semibold text-right">V. medido</th>
                    <th className="px-2 py-2 font-semibold text-right">V. acum.</th>
                  </>
                ) : (
                  <>
                    <th className="px-2 py-2 font-semibold">Un.</th>
                    <th className="px-2 py-2 font-semibold text-right">Qtd</th>
                    <th className="px-2 py-2 font-semibold text-right">Preço unit.</th>
                    <th className="px-2 py-2 font-semibold text-right">Preço total</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ node, level }) => {
                const leaf = isLeaf(node);
                const v = computeItemValues(node);
                const sub = leaf ? null : computeTotais([node]);
                return (
                  <tr key={node.item} className={`border-t border-border ${leaf ? "" : "bg-muted/30 font-semibold"}`}>
                    <td className="px-3 py-1.5 whitespace-nowrap" style={{ paddingLeft: `${12 + (level - 1) * 16}px` }}>
                      <span className="inline-flex items-center gap-1">
                        {!leaf && (level >= maxLevel ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        {node.item}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">{node.descricao}</td>

                    {isMedicao ? (
                      <>
                        <td className="px-2 py-1.5 text-right">{leaf ? fmtNum(node.qtd_contratual) : "—"}</td>
                        <td className="px-2 py-1.5 text-right">{leaf ? fmtNum(node.qtd_acumulada) : "—"}</td>
                        <td className="px-2 py-1.5 text-right">{leaf ? fmtNum(v.saldo) : "—"}</td>
                        <td className="px-2 py-1.5 text-right bg-amber-50 dark:bg-amber-900/10">
                          {leaf ? (
                            readOnly ? (
                              <span className="font-semibold">{fmtNum(node.qtd_medida)}</span>
                            ) : (
                              <Input
                                type="number"
                                value={node.qtd_medida ?? ""}
                                onChange={(e) => editLeaf(node.item, "qtd_medida", e.target.value)}
                                className="h-7 w-24 text-right text-xs ml-auto"
                              />
                            )
                          ) : "—"}
                        </td>
                        <td className="px-2 py-1.5 text-right">{leaf ? fmtBRL(node.preco_unitario) : "—"}</td>
                        <td className="px-2 py-1.5 text-right">{leaf ? fmtBRL(v.valor_medido) : <span className="text-emerald-700 dark:text-emerald-400">{fmtBRL(sub.valorTotalMedido)}</span>}</td>
                        <td className="px-2 py-1.5 text-right">{leaf ? fmtBRL(v.valor_acumulado) : <span className="text-emerald-700 dark:text-emerald-400">{fmtBRL(sub.valorTotalAcumulado)}</span>}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-1.5">{leaf ? node.unidade : "—"}</td>
                        <td className="px-2 py-1.5 text-right">
                          {leaf ? (
                            readOnly ? fmtNum(node.qtd_contratual) : (
                              <Input type="number" value={node.qtd_contratual ?? ""} onChange={(e) => editLeaf(node.item, "qtd_contratual", e.target.value)} className="h-7 w-20 text-right text-xs ml-auto" />
                            )
                          ) : "—"}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {leaf ? (
                            readOnly ? fmtBRL(node.preco_unitario) : (
                              <Input type="number" value={node.preco_unitario ?? ""} onChange={(e) => editLeaf(node.item, "preco_unitario", e.target.value)} className="h-7 w-24 text-right text-xs ml-auto" />
                            )
                          ) : "—"}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {leaf
                            ? fmtBRL((node.qtd_contratual ?? 0) * (node.preco_unitario ?? 0))
                            : <span className="text-emerald-700 dark:text-emerald-400">{fmtBRL(sub.valorTotalContrato)}</span>}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-bold bg-muted/40">
                <td className="px-3 py-2" colSpan={isMedicao ? 7 : 5}>
                  {isMedicao ? "MEDIDO NO PERÍODO" : "TOTAL DO CONTRATO"}
                </td>
                <td className="px-2 py-2 text-right" colSpan={isMedicao ? 2 : 1}>
                  {isMedicao ? fmtBRL(totais.valorTotalMedido) : fmtBRL(totais.valorTotalContrato)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showImport && (
        <ImportExportDialog
          open={showImport}
          onOpenChange={setShowImport}
          title="Importar PQP"
          exportOnly={false}
          exportFileName="pqp"
          columns={PQP_IMPORT_COLUMNS}
          onExport={() =>
            flattenLeaves(itens).map((f) => ({
              item: f.item, descricao: f.descricao, unidade: f.unidade,
              qtd_contratual: f.qtd_contratual, preco_unitario: f.preco_unitario,
            }))
          }
          onImport={handleImportRow}
        />
      )}
    </div>
  );
}
