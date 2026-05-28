import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DISCIPLINAS = ["Mecânica", "Elétrica", "Estrutura Metálica", "Tubulação", "Instrumentação", "Civil", "Pintura"];

export function VincularAtividadesDialog({ open, onClose, onConfirm, tarefas = [], selectedIds = [] }) {
  const [search, setSearch] = useState("");
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("");
  const [checked, setChecked] = useState(new Set());

  useEffect(() => {
    if (open) {
      setSearch("");
      setDisciplinaFiltro("");
      setChecked(new Set(selectedIds));
    }
  }, [open]);

  const filtered = useMemo(() =>
    tarefas.filter(t => {
      const nome = t.nome || t.titulo || t.descricao || "";
      const matchSearch = !search || nome.toLowerCase().includes(search.toLowerCase());
      const matchDisc = !disciplinaFiltro || (t.disciplina || "") === disciplinaFiltro;
      return matchSearch && matchDisc;
    }),
    [tarefas, search, disciplinaFiltro]
  );

  const toggle = (id) => setChecked(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleConfirm = () => {
    onConfirm([...checked]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-foreground">Vincular Atividades ao Cronograma</h2>
        </div>
        <div className="px-6 py-3 border-b border-border shrink-0 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Buscar tarefa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
            value={disciplinaFiltro}
            onChange={e => setDisciplinaFiltro(e.target.value)}
          >
            <option value="">Todas as disciplinas</option>
            {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1 min-h-0">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma tarefa encontrada</p>
          )}
          {filtered.map(t => {
            const nome = t.nome || t.titulo || t.descricao || t.id;
            const isChecked = checked.has(t.id);
            const inicio = t.data_inicio_planejada;
            const fim = t.data_fim_planejada;
            return (
              <label
                key={t.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-muted"}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
                  checked={isChecked}
                  onChange={() => toggle(t.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.disciplina && <span className="mr-2">{t.disciplina}</span>}
                    {inicio && fim && (
                      <span>
                        {format(new Date(inicio + "T00:00:00"), "dd/MM/yy", { locale: ptBR })}
                        {" → "}
                        {format(new Date(fim + "T00:00:00"), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    )}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{checked.size} selecionada(s)</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleConfirm}>Confirmar Vínculo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
