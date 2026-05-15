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

const TYPE_LABELS = {
  string:  "texto",
  number:  "número",
  date:    "data",
  boolean: "sim/não",
};

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
                    {TYPE_LABELS[col.type] || col.type}
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
            ← Voltar
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
