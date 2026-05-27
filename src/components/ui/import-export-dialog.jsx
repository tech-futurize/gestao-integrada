import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, X } from "lucide-react";
import { ColumnMappingDialog } from "@/components/ui/column-mapping-dialog";
import { ImportProgressDialog } from "@/components/ui/import-progress-dialog";
import { validateAndConvert } from "@/utils/importTypeValidator";

async function parseFileToRows(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "csv") {
    const { default: Papa } = await import("papaparse");
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => resolve(results.data),
        error: reject,
      });
    });
  } else if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(rows);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error("Formato não suportado. Use CSV, XLSX ou XLS.");
  }
}

export function ImportExportDialog({
  open,
  onOpenChange,
  onImport,
  onExport,
  exportFileName = "export",
  columns = [],
  title = "Importar / Exportar",
}) {
  const [phase, setPhase] = useState("idle"); // idle | mapping | processing | done
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [progress, setProgress] = useState({ processed: 0, errors: [] });
  const [parseError, setParseError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  function reset() {
    setPhase("idle");
    setSelectedFile(null);
    setRawRows([]);
    setFileHeaders([]);
    setProgress({ processed: 0, errors: [] });
    setParseError(null);
    setIsParsing(false);
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function handleFileSelected(file) {
    if (!file) return;
    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);
    try {
      const rows = await parseFileToRows(file);
      if (rows.length === 0) throw new Error("Arquivo vazio ou sem dados.");
      const headers = Object.keys(rows[0]);
      setRawRows(rows);
      setFileHeaders(headers);
      setIsParsing(false);
    } catch (e) {
      setParseError(e.message);
      setSelectedFile(null);
      setIsParsing(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }

  async function processImport(mapping) {
    setPhase("processing");
    setProgress({ processed: 0, errors: [] });

    const errors = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      const convertedRow = {};
      let rowHasError = false;

      for (const col of columns) {
        const fileHeader = mapping[col.key];
        const rawValue =
          fileHeader !== null && fileHeader !== undefined
            ? rawRow[fileHeader]
            : undefined;
        const { ok, value } = validateAndConvert(rawValue, col.type || "string");

        if (!ok) {
          errors.push({
            row: i + 1,
            field: col.label,
            value: rawValue,
            expected: col.type || "string",
          });
          rowHasError = true;
          break;
        }
        convertedRow[col.key] = value;
      }

      if (!rowHasError) {
        try {
          await onImport(convertedRow);
        } catch (e) {
          errors.push({
            row: i + 1,
            field: "—",
            value: "—",
            expected: `Erro na inserção: ${e.message}`,
          });
        }
      }

      const snapshot = [...errors];
      setProgress({ processed: i + 1, errors: snapshot });
    }

    setPhase("done");
  }

  async function handleExport(format) {
    const data = onExport();
    if (!data || data.length === 0) return;

    const exportData = data.map((item) => {
      const row = {};
      columns.forEach(({ key, label }) => {
        row[label] = item[key] ?? "";
      });
      return row;
    });

    if (format === "csv") {
      const { default: Papa } = await import("papaparse");
      const csv = Papa.unparse(exportData);
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      XLSX.writeFile(wb, `${exportFileName}.xlsx`);
    }
  }

  const hasFileReady = selectedFile && rawRows.length > 0 && !isParsing;

  return (
    <>
      <Dialog open={open && phase === "idle"} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-1 self-stretch rounded-full flex-shrink-0 bg-emerald-500" style={{ minHeight: "40px" }} />
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">CSV, XLSX ou XLS</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Exportar */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Exportar dados</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-emerald-300 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Download className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">CSV</p>
                    <p className="text-xs text-muted-foreground">Planilha de texto</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-emerald-300 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Excel</p>
                    <p className="text-xs text-muted-foreground">Formato .xlsx</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Importar */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-sky-500 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Importar dados</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  selectedFile && rawRows.length > 0
                    ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                    : "border-border hover:border-sky-400 hover:bg-sky-50/40 dark:hover:bg-sky-900/10"
                }`}
              >
                {isParsing ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-7 w-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Lendo arquivo...</p>
                  </div>
                ) : selectedFile && rawRows.length > 0 ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mt-1">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rawRows.length} linha(s) · {fileHeaders.length} coluna(s)
                    </p>
                    <p className="text-xs text-sky-600 font-medium mt-0.5">Clique para trocar o arquivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1">Arraste ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground">CSV, XLSX ou XLS</p>
                  </div>
                )}
              </div>

              {parseError && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 flex-shrink-0" />
                  {parseError}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files[0])}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-6 py-4 bg-muted/30">
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              disabled={!hasFileReady}
              onClick={() => setPhase("mapping")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              Próximo: Mapear Colunas →
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      <ColumnMappingDialog
        open={phase === "mapping"}
        onClose={() => setPhase("idle")}
        onConfirm={processImport}
        systemColumns={columns}
        fileHeaders={fileHeaders}
        fileRowCount={rawRows.length}
      />

      <ImportProgressDialog
        open={phase === "processing" || phase === "done"}
        total={rawRows.length}
        processed={progress.processed}
        errors={progress.errors}
        done={phase === "done"}
        onClose={handleClose}
        onBack={() => setPhase("idle")}
      />
    </>
  );
}
