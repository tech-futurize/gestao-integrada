import * as React from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FileDown, FileUp, FileSpreadsheet, FileText, X, CheckCircle2, Loader2, Upload,
} from 'lucide-react';

export function ImportExportDialog({
  open,
  onOpenChange,
  onImport,
  onExport,
  exportFileName,
  columns,
  title,
}) {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const buildExportRows = () => {
    const data = onExport();
    return data.map((row) => {
      const mapped = {};
      columns.forEach(({ key, label }) => {
        mapped[label] = row[key] ?? '';
      });
      return mapped;
    });
  };

  const handleExportCSV = () => {
    const rows = buildExportRows();
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo CSV exportado com sucesso.');
  };

  const handleExportExcel = () => {
    const rows = buildExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
    toast.success('Arquivo Excel exportado com sucesso.');
  };

  const parseRows = (rawRows) => {
    const labelToKey = {};
    columns.forEach(({ key, label }) => {
      labelToKey[label] = key;
    });
    return rawRows.map((row) => {
      const mapped = {};
      Object.entries(row).forEach(([header, value]) => {
        const key = labelToKey[header];
        if (key) mapped[key] = value;
      });
      return mapped;
    });
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    try {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (ext === 'csv') {
        const text = await selectedFile.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        await onImport(parseRows(result.data));
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        await onImport(parseRows(rawRows));
      } else {
        toast.error('Formato não suportado. Use .csv ou .xlsx.');
        setIsImporting(false);
        return;
      }
      toast.success('Importação concluída com sucesso.');
      clearFile();
    } catch {
      toast.error('Erro ao importar arquivo. Verifique o formato e tente novamente.');
    } finally {
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0] ?? null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleClose = () => {
    clearFile();
    onOpenChange(false);
  };

  const fileExt = selectedFile?.name.split('.').pop().toLowerCase();
  const isExcel = fileExt === 'xlsx' || fileExt === 'xls';
  const fileSizeKB = selectedFile ? (selectedFile.size / 1024).toFixed(1) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileDown className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">{title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Exportar dados ou importar de planilha</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-border">
          {/* Seção Exportar */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <FileDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Exportar</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Botão CSV */}
              <button
                onClick={handleExportCSV}
                className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-background p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">CSV</p>
                  <p className="text-xs text-muted-foreground">.csv — texto plano</p>
                </div>
              </button>

              {/* Botão Excel */}
              <button
                onClick={handleExportExcel}
                className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-background p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Excel</p>
                  <p className="text-xs text-muted-foreground">.xlsx — planilha</p>
                </div>
              </button>
            </div>
          </div>

          {/* Seção Importar */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <FileUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Importar</span>
            </div>

            {/* Drop Zone */}
            {!selectedFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-7 text-center cursor-pointer transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
                ].join(" ")}
              >
                <div className={[
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                  isDragging ? "bg-primary/15" : "bg-muted",
                ].join(" ")}>
                  <Upload className={["w-5 h-5 transition-colors", isDragging ? "text-primary" : "text-muted-foreground"].join(" ")} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? "Solte o arquivo aqui" : "Arraste um arquivo ou clique para selecionar"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta <span className="font-medium">.csv</span>, <span className="font-medium">.xlsx</span> e <span className="font-medium">.xls</span>
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            ) : (
              /* Arquivo selecionado */
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className={[
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  isExcel ? "bg-blue-50 dark:bg-blue-900/30" : "bg-emerald-50 dark:bg-emerald-900/20",
                ].join(" ")}>
                  {isExcel
                    ? <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    : <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{fileSizeKB} KB</p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Botão Importar */}
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              variant="save"
              className="w-full mt-3"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Importação
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
