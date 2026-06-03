import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import FilterToolbar from "@/components/ui/FilterToolbar";
import { entities } from "@/api/supabaseEntities";
import { Search, Link2, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

export function VincularAtividadesDialog({ open, onClose, onConfirm, tarefas = [], selectedIds = [], selectedProjectId }) {
  const [search, setSearch]             = useState("");
  const [disciplinas, setDisciplinas]   = useState([]);
  const [areas, setAreas]               = useState([]);
  const [so6wla, setSo6wla]             = useState(false);
  const [checked, setChecked]           = useState(new Set());

  const { data: itens6wla = [] } = useQuery({
    queryKey: ["itens_6wla", selectedProjectId],
    queryFn: () => entities.Item6WLA.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const ids6wla = useMemo(
    () => new Set(itens6wla.map(i => i.tarefa_cronograma_id)),
    [itens6wla]
  );

  useEffect(() => {
    if (open) {
      setSearch("");
      setDisciplinas([]);
      setAreas([]);
      setSo6wla(false);
      setChecked(new Set(selectedIds));
    }
  }, [open]);

  const disciplinaOptions = useMemo(
    () => [...new Set(tarefas.map(t => t.disciplina).filter(Boolean))].sort(),
    [tarefas]
  );

  const areaOptions = useMemo(
    () => [...new Set(tarefas.map(t => t.area).filter(Boolean))].sort(),
    [tarefas]
  );

  const filtered = useMemo(() =>
    tarefas.filter(t => {
      const nome = t.nome || t.titulo || t.descricao || "";
      if (search && !nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (disciplinas.length > 0 && !disciplinas.includes(t.disciplina)) return false;
      if (areas.length > 0 && !areas.includes(t.area)) return false;
      if (so6wla && !ids6wla.has(t.id)) return false;
      return true;
    }),
    [tarefas, search, disciplinas, areas, so6wla, ids6wla]
  );

  const isFilterActive = !!search || disciplinas.length > 0 || areas.length > 0 || so6wla;

  const handleClearAll = () => {
    setSearch("");
    setDisciplinas([]);
    setAreas([]);
    setSo6wla(false);
  };

  const toggle = id => setChecked(prev => {
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

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full shrink-0 min-h-[36px] bg-primary" />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div className="pt-0.5">
              <p className="text-base font-bold text-foreground leading-tight">Vincular Atividades ao Cronograma</p>
              <p className="text-xs text-muted-foreground mt-0.5">Selecione as tarefas para vincular ao RDO</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <FilterToolbar active={isFilterActive} onClearAll={handleClearAll}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="h-8 border border-border rounded-md pl-8 pr-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Buscar tarefa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {disciplinaOptions.length > 0 && (
              <MultiSelectDropdown
                label="Disciplina"
                options={disciplinaOptions}
                selected={disciplinas}
                onChange={setDisciplinas}
                onClear={() => setDisciplinas([])}
              />
            )}
            {areaOptions.length > 0 && (
              <MultiSelectDropdown
                label="Área"
                options={areaOptions}
                selected={areas}
                onChange={setAreas}
                onClear={() => setAreas([])}
              />
            )}
            <button
              type="button"
              onClick={() => setSo6wla(v => !v)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-sm font-medium transition-colors ${
                so6wla
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground bg-background hover:bg-muted"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              6WLA
            </button>
          </FilterToolbar>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1 min-h-0">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma tarefa encontrada</p>
          )}
          {filtered.map(t => {
            const nome     = t.nome || t.titulo || t.descricao || t.id;
            const isChecked = checked.has(t.id);
            const inicio   = t.data_inicio_planejada;
            const fim      = t.data_fim_planejada;
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
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    {t.disciplina && <span>{t.disciplina}</span>}
                    {t.area && <span className="text-muted-foreground/60">· {t.area}</span>}
                    {inicio && fim && (
                      <span className="text-muted-foreground/60">
                        · {formatDate(inicio)} → {formatDate(fim)}
                      </span>
                    )}
                    {ids6wla.has(t.id) && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                        <CalendarDays className="w-3 h-3" />6WLA
                      </span>
                    )}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{checked.size} selecionada(s)</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirmar Vínculo
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
