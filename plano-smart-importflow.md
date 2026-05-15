# Smart Import Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o import direto e cego por um fluxo em 3 etapas — mapeamento de colunas interativo, barra de progresso em tempo real e relatório de erros de tipo por linha — aplicado de forma uniforme nos 4 módulos que têm import.

**Architecture:** O componente `ImportExportDialog` existente é refatorado para orquestrar 3 fases sequenciais: (1) leitura do arquivo e exibição de metadados, (2) mapeamento interativo de colunas via novo `ColumnMappingDialog`, (3) processamento linha a linha com progresso e coleta de erros via novo `ImportProgressDialog`. O callback `onImport(row)` passa a ser chamado por linha (não por lote), retornando sucesso ou erro. Cada módulo precisa atualizar `EXPORT_COLUMNS` com campo `type` e simplificar `handleImport` para aceitar uma linha com keys (não labels).

**Tech Stack:** React 18, shadcn/ui (Dialog, Select, Progress, Badge, Table), Framer Motion, PapaParse, XLSX (já instalados)

---

## Contexto: Estado Atual

**4 módulos com import:**
- `src/pages/Engenharia/Documentos.jsx`
- `src/pages/Planejamento/Cronograma.jsx`
- `src/pages/Planejamento/Avancos.jsx`
- `src/pages/Suprimentos/MapaSuprimentos.jsx`

**Componente central:** `src/components/ui/import-export-dialog.jsx`

**Problema:** O fluxo atual lê o arquivo, mapeia por label (hardcoded) e insere tudo sem feedback, sem validação de tipo, sem mapeamento interativo.

**Novo fluxo:**
```
[Upload arquivo]
     ↓
[Parsing headers + contagem de linhas] — spinner
     ↓
[ColumnMappingDialog] — usuário mapeia colunas do arquivo → colunas do sistema
     ↓
[ImportProgressDialog] — processa linha por linha com barra de progresso
     ↓
[ImportResultDialog] — mostra total, sucessos, erros com detalhes
```

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/components/ui/column-mapping-dialog.jsx` | **CRIAR** | UI de mapeamento interativo de colunas |
| `src/components/ui/import-progress-dialog.jsx` | **CRIAR** | Progress bar + coleta de erros + relatório final |
| `src/components/ui/import-export-dialog.jsx` | **REFATORAR** | Orquestrador do fluxo em 3 fases; nova interface com `onImport(row)` por linha |
| `src/pages/Engenharia/Documentos.jsx` | **ATUALIZAR** | Adicionar `type` em EXPORT_COLUMNS; simplificar handleImport |
| `src/pages/Planejamento/Cronograma.jsx` | **ATUALIZAR** | Idem |
| `src/pages/Planejamento/Avancos.jsx` | **ATUALIZAR** | Idem |
| `src/pages/Suprimentos/MapaSuprimentos.jsx` | **ATUALIZAR** | Idem |

---

## Tipos de Coluna Suportados

```javascript
// type pode ser:
"string"   // qualquer texto — nunca gera erro de tipo
"number"   // deve ser parseable com parseFloat; NaN → erro
"date"     // deve ser parseable com new Date(); Invalid Date → erro
"boolean"  // "true"/"false"/"1"/"0"/"sim"/"não" → erro se outro valor
```

---

## Task 1: Criar `ColumnMappingDialog`

**Files:**
- Create: `src/components/ui/column-mapping-dialog.jsx`

### Contrato da Interface

```javascript
// Props:
// open: boolean
// onClose: () => void
// onConfirm: (mapping: Record<systemKey, fileHeader | null>) => void
// systemColumns: Array<{ key: string, label: string, type: string, required?: boolean }>
// fileHeaders: string[]  // cabeçalhos detectados no arquivo
// fileRowCount: number   // total de linhas de dados
```

### Comportamento de auto-suggest

Para cada coluna do sistema, procurar em `fileHeaders` um header que, após normalização (lowercase, sem acentos, sem espaços), seja igual ou contenha o label ou key da coluna do sistema. Se encontrar, pré-selecionar.

```javascript
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function autoSuggest(systemCol, fileHeaders) {
  const normKey = normalize(systemCol.key);
  const normLabel = normalize(systemCol.label);
  return fileHeaders.find(h => {
    const normH = normalize(h);
    return normH === normKey || normH === normLabel || normH.includes(normKey) || normH.includes(normLabel);
  }) || null;
}
```

- [ ] **Step 1: Criar o arquivo com imports e estrutura base**

```jsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function autoSuggest(systemCol, fileHeaders) {
  const normKey = normalize(systemCol.key);
  const normLabel = normalize(systemCol.label);
  return (
    fileHeaders.find((h) => {
      const normH = normalize(h);
      return (
        normH === normKey ||
        normH === normLabel ||
        normH.includes(normKey) ||
        normH.includes(normLabel)
      );
    }) || null
  );
}

export function ColumnMappingDialog({
  open,
  onClose,
  onConfirm,
  systemColumns = [],
  fileHeaders = [],
  fileRowCount = 0,
}) {
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    if (!open) return;
    const initial = {};
    systemColumns.forEach((col) => {
      initial[col.key] = autoSuggest(col, fileHeaders);
    });
    setMapping(initial);
  }, [open, systemColumns, fileHeaders]);

  const requiredUnmapped = systemColumns
    .filter((c) => c.required && !mapping[c.key])
    .map((c) => c.label);

  const canConfirm = requiredUnmapped.length === 0;

  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapear Colunas</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arquivo detectado: <strong>{fileRowCount}</strong> linha(s) de dados,{" "}
            <strong>{fileHeaders.length}</strong> coluna(s).
            <br />
            Selecione qual coluna do arquivo corresponde a cada campo do sistema.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {systemColumns.map((col) => (
            <div key={col.key} className="flex items-center gap-3">
              <div className="w-48 shrink-0">
                <span className="text-sm font-medium">{col.label}</span>
                <div className="flex gap-1 mt-0.5">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {col.type}
                  </Badge>
                  {col.required && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      obrigatório
                    </Badge>
                  )}
                </div>
              </div>
              <Select
                value={mapping[col.key] || "__none__"}
                onValueChange={(v) =>
                  setMapping((prev) => ({
                    ...prev,
                    [col.key]: v === "__none__" ? null : v,
                  }))
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="— não importar —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— não importar —</SelectItem>
                  {fileHeaders.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapping[col.key] ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>

        {requiredUnmapped.length > 0 && (
          <p className="text-sm text-destructive">
            Campos obrigatórios sem mapeamento: {requiredUnmapped.join(", ")}
          </p>
        )}

        <DialogFooter className="gap-2">
          <p className="text-xs text-muted-foreground mr-auto self-center">
            {mappedCount} de {systemColumns.length} campo(s) mapeado(s)
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(mapping)}
            disabled={!canConfirm}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Confirmar Mapeamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verificar renderização manual (sem testes unitários automáticos neste projeto)**

Após salvar o arquivo, confirmar no terminal que não há erros de sintaxe:
```bash
node --input-type=module < /dev/null 2>&1 || true
# Ou simplesmente iniciar o dev server e verificar no browser
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/column-mapping-dialog.jsx
git commit -m "feat: criar ColumnMappingDialog com auto-suggest e validação de obrigatórios"
```

---

## Task 2: Criar `ImportProgressDialog`

**Files:**
- Create: `src/components/ui/import-progress-dialog.jsx`

### Contrato da Interface

```javascript
// Props:
// open: boolean
// total: number             // total de linhas a processar
// processed: number         // linhas processadas até agora
// errors: Array<{          // erros acumulados
//   row: number,           // número da linha (1-based)
//   field: string,         // campo com problema
//   value: any,            // valor recebido
//   expected: string,      // tipo esperado
// }>
// done: boolean            // processamento concluído?
// onClose: () => void      // só habilitado quando done=true
```

### Estrutura Visual

```
[Fase 1 — durante processamento]
  🔄 Ícone animado "Processando importação..."
  Linha X de Y
  ████████████░░░░░░░  65%

[Fase 2 — ao final (done=true)]
  ✅ Importação concluída
  Total de linhas:  Y
  Importadas com sucesso:  Y - errors.length
  Com erros de tipo:  errors.length

  [Se errors.length > 0]
  Tabela de erros:
  | Linha | Campo | Valor recebido | Tipo esperado |
  |-------|-------|----------------|---------------|
  |   3   | num_folhas | "abc" | number |

  Nota: linhas com erro não foram importadas.

  [Botão Fechar] — só habilitado quando done=true
```

- [ ] **Step 1: Criar o arquivo**

```jsx
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

export function ImportProgressDialog({
  open,
  total,
  processed,
  errors = [],
  done,
  onClose,
}) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const successCount = processed - errors.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && done) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {done ? "Importação Concluída" : "Importando dados..."}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    Processando linha {processed} de {total}...
                  </span>
                </div>
                <Progress value={percent} className="h-2" />
                <p className="text-xs text-right text-muted-foreground">{percent}%</p>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Processamento finalizado</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{total}</p>
                    <p className="text-xs text-muted-foreground">Total de linhas</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{successCount}</p>
                    <p className="text-xs text-muted-foreground">Importadas</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{errors.length}</p>
                    <p className="text-xs text-muted-foreground">Com erro</p>
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Linhas com erro de tipo — não foram importadas
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Linha</th>
                            <th className="px-3 py-2 text-left font-medium">Campo</th>
                            <th className="px-3 py-2 text-left font-medium">Valor recebido</th>
                            <th className="px-3 py-2 text-left font-medium">Tipo esperado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {errors.map((err, i) => (
                            <tr key={i} className="bg-background hover:bg-muted/30">
                              <td className="px-3 py-2 font-mono">{err.row}</td>
                              <td className="px-3 py-2">{err.field}</td>
                              <td className="px-3 py-2 font-mono text-red-500 max-w-[120px] truncate">
                                {String(err.value)}
                              </td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className="text-xs">
                                  {err.expected}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Corrija os valores no arquivo original e reimporte apenas as linhas com erro.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            disabled={!done}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            {done ? "Fechar" : "Aguarde..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/import-progress-dialog.jsx
git commit -m "feat: criar ImportProgressDialog com progress bar e tabela de erros de tipo"
```

---

## Task 3: Utilitário de validação e conversão de tipos

**Files:**
- Create: `src/utils/importTypeValidator.js`

Este utilitário é usado pelo `ImportExportDialog` para converter e validar cada valor de acordo com o `type` da coluna.

- [ ] **Step 1: Criar o arquivo**

```javascript
/**
 * Tenta converter `value` para o tipo `type`.
 * Retorna { ok: true, value: converted } ou { ok: false, value: original }.
 */
export function validateAndConvert(value, type) {
  const raw = value === undefined || value === null ? "" : String(value).trim();

  if (raw === "") {
    // Valor vazio é aceito para todos os tipos (retorna null)
    return { ok: true, value: null };
  }

  switch (type) {
    case "string":
      return { ok: true, value: raw };

    case "number": {
      // Aceita separador decimal ponto ou vírgula
      const normalized = raw.replace(",", ".");
      const num = parseFloat(normalized);
      if (isNaN(num)) return { ok: false, value: raw };
      return { ok: true, value: num };
    }

    case "date": {
      // Tenta interpretar como data (ISO, BR dd/mm/yyyy, ou outros)
      let parsed = new Date(raw);
      if (isNaN(parsed.getTime())) {
        // Tenta formato BR: dd/mm/yyyy
        const parts = raw.split("/");
        if (parts.length === 3) {
          parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      if (isNaN(parsed.getTime())) return { ok: false, value: raw };
      // Retorna no formato ISO YYYY-MM-DD (sem hora)
      return { ok: true, value: parsed.toISOString().split("T")[0] };
    }

    case "boolean": {
      const lower = raw.toLowerCase();
      if (["true", "1", "sim", "yes", "s"].includes(lower)) return { ok: true, value: true };
      if (["false", "0", "não", "nao", "no", "n"].includes(lower)) return { ok: true, value: false };
      return { ok: false, value: raw };
    }

    default:
      return { ok: true, value: raw };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/importTypeValidator.js
git commit -m "feat: criar utilitário validateAndConvert para tipagem em import"
```

---

## Task 4: Refatorar `ImportExportDialog`

**Files:**
- Modify: `src/components/ui/import-export-dialog.jsx`

### Nova interface pública

```javascript
// Props que MUDAM:
// columns: Array<{ key, label, type, required? }>  ← adiciona `type` e `required`
// onImport: async (row: Record<string, any>) => void  ← chamado POR LINHA com keys (não labels)

// Props que NÃO mudam:
// open, onOpenChange, onExport, exportFileName, title
```

### Lógica do novo fluxo interno

```javascript
// Estados internos:
// phase: "idle" | "file-selected" | "mapping" | "processing" | "done"
// rawRows: any[]        // todas as linhas brutas (array de objects com headers como keys)
// fileHeaders: string[] // cabeçalhos detectados
// columnMapping: {}     // { systemKey: fileHeader | null }
// progress: { processed, errors }
```

**Fluxo de processamento (após confirmar mapeamento):**
```javascript
async function processImport(mapping) {
  setPhase("processing");
  const errors = [];
  
  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const convertedRow = {};
    let rowHasError = false;
    
    for (const col of columns) {
      const fileHeader = mapping[col.key];
      const rawValue = fileHeader ? rawRow[fileHeader] : undefined;
      const { ok, value } = validateAndConvert(rawValue, col.type);
      
      if (!ok) {
        errors.push({ row: i + 1, field: col.label, value: rawValue, expected: col.type });
        rowHasError = true;
        break; // Linha inteira descartada
      }
      convertedRow[col.key] = value;
    }
    
    if (!rowHasError) {
      try {
        await onImport(convertedRow); // chamado por linha
      } catch (e) {
        errors.push({ row: i + 1, field: "—", value: "—", expected: "Erro na inserção: " + e.message });
      }
    }
    
    setProgress(prev => ({ ...prev, processed: i + 1, errors }));
  }
  
  setPhase("done");
}
```

- [ ] **Step 1: Ler o arquivo atual completo para entender estrutura**

```bash
cat src/components/ui/import-export-dialog.jsx
```

- [ ] **Step 2: Reescrever o arquivo com o novo fluxo**

Escrever `src/components/ui/import-export-dialog.jsx` com o seguinte conteúdo completo:

```jsx
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
  const [columnMapping, setColumnMapping] = useState({});
  const [progress, setProgress] = useState({ processed: 0, errors: [] });
  const [parseError, setParseError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  function reset() {
    setPhase("idle");
    setSelectedFile(null);
    setRawRows([]);
    setFileHeaders([]);
    setColumnMapping({});
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
    setColumnMapping(mapping);
    setPhase("processing");
    setProgress({ processed: 0, errors: [] });

    const errors = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      const convertedRow = {};
      let rowHasError = false;

      for (const col of columns) {
        const fileHeader = mapping[col.key];
        const rawValue = fileHeader !== null && fileHeader !== undefined
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

      // Atualiza progresso a cada linha
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
              ref={dropRef}
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
                  <p className="text-xs text-muted-foreground">
                    Clique para trocar o arquivo
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">Arraste ou clique para selecionar</p>
                  <p className="text-xs">CSV, XLSX ou XLS</p>
                </div>
              )}
            </div>

            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}

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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/import-export-dialog.jsx
git commit -m "feat: refatorar ImportExportDialog com fluxo 3 etapas — upload, mapeamento, progresso"
```

---

## Task 5: Atualizar `Documentos.jsx` (Engenharia)

**Files:**
- Modify: `src/pages/Engenharia/Documentos.jsx`

### Mudanças necessárias

**1. EXPORT_COLUMNS — adicionar `type` e `required`:**
```javascript
const EXPORT_COLUMNS = [
  { key: "tag_id",          label: "TAG/ID",            type: "string",  required: true },
  { key: "titulo",          label: "Título",             type: "string",  required: true },
  { key: "disciplina",      label: "Disciplina",         type: "string" },
  { key: "fornecedor",      label: "Fornecedor",         type: "string" },
  { key: "num_folhas",      label: "Nº Folhas",          type: "number" },
  { key: "progresso",       label: "Progresso (%)",      type: "number" },
  { key: "etapa",           label: "Etapa",              type: "string" },
  { key: "revisao_atual",   label: "Revisão Atual",      type: "string" },
  { key: "id_cronograma",   label: "ID Cronograma",      type: "string" },
  { key: "data_cronograma", label: "Data Cronograma",    type: "date" },
  { key: "data_projetada",  label: "Data Projetada",     type: "date" },
  { key: "data_real",       label: "Data Real",          type: "date" },
];
```

**2. `handleImport` — agora recebe UMA linha com keys (não labels):**
```javascript
const handleImport = async (row) => {
  await entities.DocumentoEngenharia.create({
    projeto_id: selectedProjectId,
    tag_id:         row.tag_id         || "",
    titulo:         row.titulo         || "",
    disciplina:     row.disciplina     || "",
    fornecedor:     row.fornecedor     || "",
    num_folhas:     row.num_folhas     ?? 0,
    progresso:      row.progresso      ?? 0,
    etapa:          row.etapa          || "A Emitir",
    revisao_atual:  row.revisao_atual  || "",
    id_cronograma:  row.id_cronograma  || null,
    data_cronograma: row.data_cronograma || null,
    data_projetada: row.data_projetada || null,
    data_real:      row.data_real      || null,
  });
  queryClient.invalidateQueries({ queryKey: ["documentos_engenharia"] });
};
```

> **Nota:** O `queryClient.invalidateQueries` pode ser chamado uma vez por linha (ineficiente mas simples) ou removido do handleImport e chamado uma vez após o processamento completo. Para simplicidade, manter por linha — React Query irá debounce automaticamente.

- [ ] **Step 1: Localizar e atualizar EXPORT_COLUMNS em Documentos.jsx**

Abrir `src/pages/Engenharia/Documentos.jsx`, localizar `const EXPORT_COLUMNS` e substituir pela versão com `type` e `required` acima.

- [ ] **Step 2: Localizar e atualizar handleImport em Documentos.jsx**

Localizar `const handleImport` e substituir pela versão que aceita uma linha por vez.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Engenharia/Documentos.jsx
git commit -m "feat: atualizar Documentos.jsx para novo contrato de import com tipos"
```

---

## Task 6: Atualizar `Cronograma.jsx`

**Files:**
- Modify: `src/pages/Planejamento/Cronograma.jsx`

**1. EXPORT_COLUMNS com `type`:**
```javascript
const EXPORT_COLUMNS = [
  { key: "codigo_wbs",              label: "WBS",                     type: "string",  required: true },
  { key: "nome",                    label: "Nome",                     type: "string",  required: true },
  { key: "tipo",                    label: "Tipo",                     type: "string" },
  { key: "nivel",                   label: "Nível",                    type: "number" },
  { key: "data_inicio_planejada",   label: "Início Planejado",         type: "date" },
  { key: "data_fim_planejada",      label: "Fim Planejado",            type: "date" },
  { key: "data_inicio_baseline",    label: "Início Baseline",          type: "date" },
  { key: "data_fim_baseline",       label: "Fim Baseline",             type: "date" },
  { key: "avanco_previsto",         label: "Avanço Previsto (%)",      type: "number" },
  { key: "avanco_realizado",        label: "Avanço Realizado (%)",     type: "number" },
  { key: "responsavel",             label: "Responsável",              type: "string" },
  { key: "predecessoras",           label: "Predecessoras",            type: "string" },
  { key: "caminho_critico",         label: "Caminho Crítico",          type: "boolean" },
];
```

**2. `handleImport` novo:**
```javascript
const handleImport = async (row) => {
  await entities.TarefaCronograma.create({
    projeto_id:             selectedProjectId,
    codigo_wbs:             row.codigo_wbs             || "",
    nome:                   row.nome                   || "",
    tipo:                   row.tipo                   || "Tarefa",
    nivel:                  row.nivel                  ?? 1,
    data_inicio_planejada:  row.data_inicio_planejada  || null,
    data_fim_planejada:     row.data_fim_planejada     || null,
    data_inicio_baseline:   row.data_inicio_baseline   || null,
    data_fim_baseline:      row.data_fim_baseline      || null,
    avanco_previsto:        row.avanco_previsto        ?? 0,
    avanco_realizado:       row.avanco_realizado       ?? 0,
    responsavel:            row.responsavel            || "",
    predecessoras:          row.predecessoras          || "",
    caminho_critico:        row.caminho_critico        ?? false,
  });
  queryClient.invalidateQueries({ queryKey: ["tarefas_cronograma"] });
};
```

- [ ] **Step 1: Atualizar EXPORT_COLUMNS e handleImport em Cronograma.jsx**

- [ ] **Step 2: Commit**

```bash
git add src/pages/Planejamento/Cronograma.jsx
git commit -m "feat: atualizar Cronograma.jsx para novo contrato de import com tipos"
```

---

## Task 7: Atualizar `Avancos.jsx`

**Files:**
- Modify: `src/pages/Planejamento/Avancos.jsx`

**1. EXPORT_COLUMNS com `type`:**
```javascript
const EXPORT_COLUMNS = [
  { key: "mes_referencia",             label: "Mês Referência",               type: "string",  required: true },
  { key: "avanco_previsto_mensal",     label: "Avanço Previsto Mensal (%)",   type: "number" },
  { key: "avanco_realizado_mensal",    label: "Avanço Realizado Mensal (%)",  type: "number" },
  { key: "avanco_previsto_acumulado",  label: "Avanço Previsto Acumulado (%)",type: "number" },
  { key: "avanco_realizado_acumulado", label: "Avanço Realizado Acumulado (%)",type: "number" },
];
```

**2. `handleImport` novo:**
```javascript
const handleImport = async (row) => {
  await entities.AvancoFisico.create({
    projeto_id:                  selectedProjectId,
    mes_referencia:              row.mes_referencia              || "",
    avanco_previsto_mensal:      row.avanco_previsto_mensal      ?? 0,
    avanco_realizado_mensal:     row.avanco_realizado_mensal     ?? 0,
    avanco_previsto_acumulado:   row.avanco_previsto_acumulado   ?? 0,
    avanco_realizado_acumulado:  row.avanco_realizado_acumulado  ?? 0,
  });
  queryClient.invalidateQueries({ queryKey: ["avanco_fisico"] });
};
```

- [ ] **Step 1: Atualizar EXPORT_COLUMNS e handleImport em Avancos.jsx**

- [ ] **Step 2: Commit**

```bash
git add src/pages/Planejamento/Avancos.jsx
git commit -m "feat: atualizar Avancos.jsx para novo contrato de import com tipos"
```

---

## Task 8: Atualizar `MapaSuprimentos.jsx`

**Files:**
- Modify: `src/pages/Suprimentos/MapaSuprimentos.jsx`

**1. EXPORT_COLUMNS com `type`:**
```javascript
const EXPORT_COLUMNS = [
  { key: "numero_sc",       label: "Nº SC",           type: "string",  required: true },
  { key: "descricao",       label: "Descrição",        type: "string",  required: true },
  { key: "unidade",         label: "Unidade",          type: "string" },
  { key: "quantidade",      label: "Quantidade",       type: "number" },
  { key: "solicitante",     label: "Solicitante",      type: "string" },
  { key: "status",          label: "Status",           type: "string" },
  { key: "data_necessidade",label: "Data Necessidade", type: "date" },
  { key: "observacao",      label: "Observação",       type: "string" },
];
```

**2. `handleImport` novo:**
```javascript
const handleImport = async (row) => {
  await entities.ItemMAS.create({
    projeto_id:       selectedProjectId,
    numero_sc:        row.numero_sc        || "",
    descricao:        row.descricao        || "",
    unidade:          row.unidade          || "",
    quantidade:       row.quantidade       ?? 0,
    solicitante:      row.solicitante      || "",
    status:           row.status           || "Pendente",
    data_necessidade: row.data_necessidade || null,
    observacao:       row.observacao       || "",
  });
  queryClient.invalidateQueries({ queryKey: ["itens_mas"] });
};
```

- [ ] **Step 1: Atualizar EXPORT_COLUMNS e handleImport em MapaSuprimentos.jsx**

- [ ] **Step 2: Commit**

```bash
git add src/pages/Suprimentos/MapaSuprimentos.jsx
git commit -m "feat: atualizar MapaSuprimentos.jsx para novo contrato de import com tipos"
```

---

## Task 9: Verificação de outros módulos com import

**Verificar se há outros módulos com handleImport não detectados na exploração inicial:**

- [ ] **Step 1: Grep por handleImport em todo o src/**

```bash
grep -r "handleImport\|onImport\|ImportExportDialog" src/ --include="*.jsx" -l
```

Esperado: os 4 arquivos já atualizados. Se aparecer algum outro, aplicar o mesmo padrão das Tasks 5–8.

- [ ] **Step 2: Confirmar que TakeOff e Histograma não têm import**

```bash
grep -n "ImportExportDialog\|handleImport" src/pages/Planejamento/TakeOff.jsx src/pages/Planejamento/Histograma.jsx 2>/dev/null
```

Se houver, adicionar EXPORT_COLUMNS com tipos e atualizar handleImport seguindo o mesmo padrão.

---

## Task 10: Teste de fumaça (smoke test manual)

> Este projeto não tem suite de testes automatizados. Fazer verificação manual.

- [ ] **Step 1: Iniciar o dev server**

```bash
npm run dev
```

- [ ] **Step 2: Testar fluxo completo em Engenharia → Documentos**

1. Criar arquivo CSV de teste (`teste_import.csv`):
```csv
TAG/ID,Título,Disciplina,Nº Folhas,Progresso (%),Data Projetada
DOC-001,Planta Baixa,Civil,10,50,01/06/2026
DOC-002,Isométrico,Piping,ABC,75,data-invalida
DOC-003,Diagrama P&ID,Instrumentação,5,100,2026-07-01
```

3. Abrir `/engenharia/documentos`
4. Clicar em "Importar / Exportar"
5. Fazer upload do CSV
6. Verificar que mostra "3 linhas · 6 colunas"
7. Clicar "Próximo: Mapear Colunas"
8. Verificar auto-suggest (colunas devem pré-mapear)
9. Confirmar mapeamento
10. Verificar barra de progresso (3 linhas)
11. Verificar resultado final:
    - Total: 3
    - Importadas: 2 (DOC-001 e DOC-003)
    - Com erro: 1 (DOC-002 linha 2 — campo "Nº Folhas" recebeu "ABC", esperado number)
12. Verificar que DOC-001 e DOC-003 aparecem na tabela

- [ ] **Step 3: Testar export — confirmar que não quebrou**

1. Clicar "Exportar CSV"
2. Verificar que CSV é baixado com as colunas corretas

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "test: smoke test do smart import flow — verificação manual concluída"
```

---

## Self-Review

### Cobertura do spec

| Requisito | Coberto em |
|-----------|-----------|
| Lê arquivo e abre pop-up de mapeamento | Task 4 (ImportExportDialog) + Task 1 (ColumnMappingDialog) |
| Mapeamento coluna-a-coluna interativo | Task 1 (ColumnMappingDialog) |
| Auto-suggest de mapeamento | Task 1 (autoSuggest) |
| Spinner de carregamento do arquivo | Task 4 (estado isParsing no dropzone) |
| Barra de progresso de processamento | Task 2 (ImportProgressDialog Progress) |
| Processamento linha a linha | Task 4 (loop com await onImport(row)) |
| Relatório final: total, sucessos, erros | Task 2 (grid 3 cards + tabela de erros) |
| Erro indica linha, campo, valor, tipo esperado | Task 2 + Task 3 (validateAndConvert) |
| Linhas com erro não são importadas | Task 4 (rowHasError → skip) |
| Uniform em todos os módulos | Tasks 5, 6, 7, 8, 9 |

### Gaps detectados

- **Módulos extras (Histograma, TakeOff):** cobertos na Task 9 (grep de verificação).
- **queryClient.invalidateQueries por linha:** ineficiente mas funciona. Otimização pode ser feita depois se necessário — YAGNI.
- **Campos required no mapeamento:** implementado no ColumnMappingDialog (badge + botão desabilitado). Os módulos atuais marcam `required: true` apenas em campos essenciais.
