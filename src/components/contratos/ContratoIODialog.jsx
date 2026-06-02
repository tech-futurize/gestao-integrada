import { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, X } from "lucide-react";
import { flattenLeaves, buildTreeFromFlat } from "@/utils/pqpUtils";
import { formatDate } from "@/lib/dateUtils";

const SHEETS = ["Visão Geral", "PQP", "Medições", "Aditivos"];

/** Monta as linhas de cada aba a partir do contrato e suas listas. */
function buildSheetData(contrato, medicoes, aditivos) {
  const visao = [
    { Campo: "Número", Valor: contrato.numero || "" },
    { Campo: "Objeto", Valor: contrato.objeto || "" },
    { Campo: "Fornecedor", Valor: contrato.fornecedor || "" },
    { Campo: "CNPJ", Valor: contrato.cnpj || "" },
    { Campo: "Tipo", Valor: contrato.tipo || "" },
    { Campo: "Modalidade", Valor: contrato.modalidade || "" },
    { Campo: "Origem", Valor: contrato.origem || "" },
    { Campo: "Status", Valor: contrato.status || "" },
    { Campo: "Valor total", Valor: contrato.valor_total ?? 0 },
    { Campo: "Início", Valor: formatDate(contrato.data_inicio) || "" },
    { Campo: "Término", Valor: formatDate(contrato.data_fim) || "" },
    { Campo: "Gestor", Valor: contrato.gestor || "" },
    { Campo: "Centro de custo", Valor: contrato.centro_custo || "" },
    { Campo: "Observações", Valor: contrato.observacoes || "" },
  ];
  const pqp = flattenLeaves(contrato.itens || []).map((f) => ({
    item: f.item,
    descricao: f.descricao,
    unidade: f.unidade,
    qtd_contratual: f.qtd_contratual ?? 0,
    preco_unitario: f.preco_unitario ?? 0,
    preco_total: (f.qtd_contratual ?? 0) * (f.preco_unitario ?? 0),
  }));
  const meds = (medicoes || []).map((m) => ({
    numero: m.numero,
    periodo_inicio: m.periodo_inicio || "",
    periodo_fim: m.periodo_fim || "",
    valor: m.valor ?? 0,
    status: m.status,
  }));
  const adits = (aditivos || []).map((a) => ({
    numero: a.numero,
    tipo: a.tipo,
    data_assinatura: a.data_assinatura || "",
    valor: a.valor ?? 0,
    prazo_dias: a.prazo_dias ?? 0,
    status: a.status,
  }));
  return { visao, pqp, meds, adits };
}

export default function ContratoIODialog({ open, onOpenChange, contrato, medicoes = [], aditivos = [], onImportPQP }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const baseName = `contrato_${contrato.numero || contrato.id}`.replace(/\s+/g, "_");

  async function exportXLSX() {
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const { visao, pqp, meds, adits } = buildSheetData(contrato, medicoes, aditivos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(visao), SHEETS[0]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pqp.length ? pqp : [{ item: "", descricao: "" }]), SHEETS[1]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meds.length ? meds : [{ numero: "" }]), SHEETS[2]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(adits.length ? adits : [{ numero: "" }]), SHEETS[3]);
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  async function exportCSV() {
    setBusy(true);
    try {
      const { default: Papa } = await import("papaparse");
      const { visao, pqp, meds, adits } = buildSheetData(contrato, medicoes, aditivos);
      const parts = [
        `## ${SHEETS[0]}`, Papa.unparse(visao), "",
        `## ${SHEETS[1]}`, pqp.length ? Papa.unparse(pqp) : "(sem itens)", "",
        `## ${SHEETS[2]}`, meds.length ? Papa.unparse(meds) : "(sem medições)", "",
        `## ${SHEETS[3]}`, adits.length ? Papa.unparse(adits) : "(sem aditivos)",
      ];
      const blob = new Blob(["﻿" + parts.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  /** Importa a aba PQP (XLSX) ou um CSV de PQP, atualizando a planilha do contrato. */
  async function handleFile(file) {
    if (!file || !onImportPQP) return;
    setBusy(true);
    setMsg(null);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let rows = [];
      if (ext === "xlsx" || ext === "xls") {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === "pqp") || wb.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
      } else if (ext === "csv") {
        const { default: Papa } = await import("papaparse");
        const text = await file.text();
        rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
      } else {
        throw new Error("Formato não suportado. Use XLSX ou CSV.");
      }
      const itens = buildTreeFromFlat(rows);
      if (!itens.length) throw new Error("Nenhum item de PQP encontrado no arquivo.");
      onImportPQP(itens);
      setMsg({ ok: true, text: `PQP importada: ${flattenLeaves(itens).length} item(ns).` });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-1 self-stretch rounded-full flex-shrink-0 bg-emerald-500" style={{ minHeight: "40px" }} />
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground leading-tight">Contrato — Importar / Exportar</p>
              <p className="text-xs text-muted-foreground mt-0.5">4 abas: Visão Geral · PQP · Medições · Aditivos</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Exportar */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Exportar contrato</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={exportCSV} disabled={busy} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-emerald-300 transition-all group text-left disabled:opacity-50">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">CSV</p>
                  <p className="text-xs text-muted-foreground">4 seções no arquivo</p>
                </div>
              </button>
              <button onClick={exportXLSX} disabled={busy} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-emerald-300 transition-all group text-left disabled:opacity-50">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Excel</p>
                  <p className="text-xs text-muted-foreground">4 abas (.xlsx)</p>
                </div>
              </button>
            </div>
          </div>

          {/* Importar (PQP) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-sm bg-sky-500 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Importar PQP</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/40 dark:hover:bg-sky-900/10 transition-all"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Arraste ou clique — atualiza a PQP do contrato</p>
                <p className="text-xs text-muted-foreground">Aba/colunas: item · descricao · unidade · qtd_contratual · preco_unitario</p>
              </div>
            </div>
            {msg && (
              <p className={`text-sm mt-2 flex items-center gap-1.5 ${msg.ok ? "text-emerald-600" : "text-destructive"}`}>
                {!msg.ok && <X className="w-3.5 h-3.5 flex-shrink-0" />}{msg.text}
              </p>
            )}
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4 bg-muted/30">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
