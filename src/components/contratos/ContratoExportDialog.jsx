import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { flattenLeaves } from "@/utils/pqpUtils";
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

export default function ContratoExportDialog({ open, onOpenChange, contrato, medicoes = [], aditivos = [] }) {
  const [busy, setBusy] = useState(false);
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
              <p className="text-base font-bold text-foreground leading-tight">Exportar Contrato</p>
              <p className="text-xs text-muted-foreground mt-0.5">4 abas: Visão Geral · PQP · Medições · Aditivos</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Formato</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={exportCSV} disabled={busy} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-emerald-300 transition-all text-left disabled:opacity-50">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">CSV</p>
                <p className="text-xs text-muted-foreground">4 seções no arquivo</p>
              </div>
            </button>
            <button onClick={exportXLSX} disabled={busy} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-emerald-300 transition-all text-left disabled:opacity-50">
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

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4 bg-muted/30">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
