import React, { useState, useMemo } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import FilterBar from "@/components/ui/FilterBar";
import { Plus, AlertTriangle, Search, Edit, Trash2 } from "lucide-react";
import RegistroForm from "@/components/pleitos/RegistroForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS = {
  Registrado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Em Análise": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Resolvido: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const TIPO_COLORS = {
  "Ata de Reunião": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "E-mail": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Notificação: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function Registros() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (msg) => toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });

  const [showForm, setShowForm] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtros, setFiltros] = useState({});

  const { data: incidentes = [], isLoading } = useQuery({
    queryKey: ["registros", selectedProjectId],
    queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Registro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      setShowForm(false);
      setEditingRegistro(null);
    },
    onError: (e) => onErr(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Registro.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros"] });
      setShowForm(false);
      setEditingRegistro(null);
    },
    onError: (e) => onErr(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Registro.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["registros"] }),
    onError: (e) => onErr(e.message),
  });

  const handleSubmit = (data) => {
    const payload = { ...data, projeto_id: selectedProjectId };
    if (editingRegistro) updateMutation.mutate({ id: editingRegistro.id, data: payload });
    else createMutation.mutate(payload);
  };

  const baseList = useMemo(
    () => incidentes.filter((i) => i.tipo_registro !== "RDO"),
    [incidentes]
  );

  const filtered = useMemo(() => {
    const tp = filtros.tipo || [];
    const st = filtros.status || [];
    return baseList.filter((inc) => {
      if (tp.length > 0 && !tp.includes(inc.tipo_registro)) return false;
      if (st.length > 0 && !st.includes(inc.status)) return false;
      const needle = searchText.toLowerCase();
      if (needle) {
        const matchText =
          (inc.descricao || "").toLowerCase().includes(needle) ||
          (inc.tipo_registro || "").toLowerCase().includes(needle) ||
          (inc.responsavel_registro || "").toLowerCase().includes(needle);
        if (!matchText) return false;
      }
      return true;
    });
  }, [baseList, filtros, searchText]);

  const kpis = useMemo(() => ({
    total: baseList.length,
    registrado: baseList.filter((i) => i.status === "Registrado").length,
    emAnalise: baseList.filter((i) => i.status === "Em Análise").length,
    resolvido: baseList.filter((i) => i.status === "Resolvido").length,
  }), [baseList]);

  if (!selectedProjectId) {
    return (
      <PageEmptyState
        icon={AlertTriangle}
        description="Selecione um projeto na barra lateral para ver os registros."
      />
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Registros</h2>
          <Button
            onClick={() => { setEditingRegistro(null); setShowForm(true); }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Registro
          </Button>
        </div>

        {/* Form inline */}
        {showForm && (
          <RegistroForm
            key={editingRegistro?.id || "new-incidente"}
            incidente={editingRegistro}
            casos={[]}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingRegistro(null); }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {/* KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: kpis.total, color: "text-foreground" },
            { label: "Registrado", value: kpis.registrado, color: "text-blue-600 dark:text-blue-400" },
            { label: "Em Análise", value: kpis.emAnalise, color: "text-amber-600 dark:text-amber-400" },
            { label: "Resolvido", value: kpis.resolvido, color: "text-green-600 dark:text-green-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-card border rounded-lg px-4 py-3 flex flex-col gap-1 shadow-sm"
            >
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por descrição, tipo ou responsável..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <FilterBar
            storageKey="registros-filtros"
            filters={[
              { key: "tipo", label: "Tipo", options: ["Ata de Reunião", "E-mail", "Notificação"] },
              { key: "status", label: "Status", options: ["Registrado", "Em Análise", "Resolvido"] },
            ]}
            onChange={setFiltros}
          />
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border rounded-lg p-4 shadow-sm space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-base font-medium">
              {baseList.length === 0 ? "Nenhum registro cadastrado" : "Nenhum registro corresponde aos filtros"}
            </p>
            {baseList.length === 0 && (
              <p className="text-sm mt-1">Clique em "Novo Registro" para começar.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((inc) => {
              const dataFormatada = inc.data_hora
                ? format(new Date(inc.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })
                : "—";
              const tipoClass = TIPO_COLORS[inc.tipo_registro] || "bg-muted text-muted-foreground";
              const statusClass = STATUS_COLORS[inc.status] || "bg-muted text-muted-foreground";

              return (
                <div
                  key={inc.id}
                  className="bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
                    <Badge variant="outline" className={`text-xs font-semibold ${tipoClass}`}>
                      {inc.tipo_registro || "—"}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{dataFormatada}</span>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-2 flex-1 space-y-1">
                    <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                      {inc.descricao || inc.ocorrencias || <span className="text-muted-foreground italic">Sem descrição</span>}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className={`text-xs ${statusClass} shrink-0`}>
                        {inc.status || "—"}
                      </Badge>
                      {inc.responsavel_registro && (
                        <span className="text-xs text-muted-foreground truncate">
                          {inc.responsavel_registro}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => { setEditingRegistro(inc); setShowForm(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-status-critical hover:bg-status-critical/10"
                        onClick={() => deleteMutation.mutate(inc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
