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
