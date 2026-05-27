import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdicionarCronogramaModal({ open, onClose, tarefas, onConfirm }) {
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState([]);

  const filtradas = useMemo(() =>
    tarefas.filter(t =>
      !busca ||
      t.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      t.area?.toLowerCase().includes(busca.toLowerCase()) ||
      t.disciplina?.toLowerCase().includes(busca.toLowerCase())
    ),
    [tarefas, busca]
  );

  const toggle = (id) =>
    setSelecionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleConfirm = () => {
    if (!selecionadas.length) return;
    onConfirm(selecionadas);
    setSelecionadas([]);
    setBusca("");
  };

  const handleClose = () => {
    setSelecionadas([]);
    setBusca("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar do Cronograma</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Buscar por nome, área ou disciplina..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="mb-3"
        />
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filtradas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tarefas.length === 0
                ? "Nenhuma atividade disponível no cronograma."
                : "Nenhuma atividade encontrada para a busca."}
            </p>
          )}
          {filtradas.map(t => (
            <label key={t.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer">
              <Checkbox
                checked={selecionadas.includes(t.id)}
                onCheckedChange={() => toggle(t.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {[t.area, t.disciplina].filter(Boolean).join(" / ") || "Sem área/disciplina"}
                  {t.inicio_previsto && ` · ${new Date(t.inicio_previsto).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
            </label>
          ))}
        </div>
        <DialogFooter className="gap-2 mt-3">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button variant="save" onClick={handleConfirm} disabled={selecionadas.length === 0}>
            {selecionadas.length > 0
              ? `Adicionar ${selecionadas.length} atividade${selecionadas.length > 1 ? "s" : ""}`
              : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
