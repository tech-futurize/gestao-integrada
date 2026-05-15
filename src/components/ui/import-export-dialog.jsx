import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, X } from "lucide-react";
import { ColumnMappingDialog } from "@/components/ui/column-mapping-dialog";
import { ImportProgressDialog } from "@/components/ui/import-progress-dialog";
import { validateAndConvert } from "@/utils/importTypeValidator";

function parseFileToRows(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => resolve(results.data),
        error: reject,
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(rows);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Formato não suportado. Use CSV, XLSX ou XLS."));
    }
  });
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

  function handleExport(format) {
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
      const csv = Papa.unparse(exportData);
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          {/* Exportar */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Exportar</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleExport("xlsx")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          <hr />

          {/* Importar */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Importar</p>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
              {isParsing ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Lendo arquivo...</p>
                </div>
              ) : selectedFile && rawRows.length > 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <FileSpreadsheet className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rawRows.length} linha(s) · {fileHeaders.length} coluna(s)
                  </p>
                  <p className="text-xs text-muted-foreground">Clique para trocar o arquivo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">Arraste ou clique para selecionar</p>
                  <p className="text-xs">CSV, XLSX ou XLS</p>
                </div>
              )}
            </div>

            {parseError && <p className="text-sm text-destructive">{parseError}</p>}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files[0])}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              disabled={!hasFileReady}
              onClick={() => setPhase("mapping")}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              Próximo: Mapear Colunas →
            </Button>
          </DialogFooter>
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
      />
    </>
  );
}
