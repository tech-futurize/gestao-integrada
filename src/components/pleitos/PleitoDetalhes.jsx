import { useState } from "react";
import * as XLSX from "xlsx";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, AlertTriangle, Download } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import VinculosTab from "@/components/pleitos/vinculos/VinculosTab";
import PleitoForm from "@/components/pleitos/PleitoForm";

function exportarXLS(pleito, registros, vinculos) {
  const wb = XLSX.utils.book_new();

  // Aba 1 — Detalhes
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    { Campo: "Título",            Valor: pleito.titulo },
    { Campo: "Status",            Valor: pleito.status },
    { Campo: "Prioridade",        Valor: pleito.prioridade },
    { Campo: "Responsável",       Valor: pleito.responsavel },
    { Campo: "Data Abertura",     Valor: pleito.data_abertura },
    { Campo: "Categorias",        Valor: (pleito.categorias || []).join(", ") },
    { Campo: "Descrição",         Valor: pleito.descricao_problema },
    { Campo: "Contexto",          Valor: pleito.contexto },
    { Campo: "Partes Envolvidas", Valor: (pleito.partes_envolvidas || [])
        .map(p => (typeof p === "object" && p !== null ? p.nome : String(p)))
        .join(", ") },
  ]), "Detalhes");

  // Aba 2 — Registros
  const regRows = registros.map(r => ({
    ID:            r.id,
    "Descrição":   r.descricao,
    "Data/Hora":   r.data_hora,
    Probabilidade: r.probabilidade,
    Gravidade:     r.gravidade,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regRows.length ? regRows : [{}]), "Registros");

  // Aba 3 — Vínculos
  const vinRows = vinculos.map(v => ({
    Módulo:          v.entidade,
    "ID Entidade":   v.entidade_id,
    "Descrição":     v.descricao ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vinRows.length ? vinRows : [{}]), "Vínculos");

  const slug = (pleito.titulo ?? "pleito").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  XLSX.writeFile(wb, `${slug}.xlsx`);
}

export default function PleitoDetalhes({ pleito, onBack }) {
  const [activeTab, setActiveTab] = useState("detalhes");
  const [showEditForm, setShowEditForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: registros = [], isPending: registrosPending, isError: registrosError } = useQuery({
    queryKey: ["registros-por-pleito", pleito.id],
    queryFn: () => entities.Registro.filter({ pleito_id: pleito.id }),
    enabled: !!pleito.id,
  });

  const { data: vinculos = [] } = useQuery({
    queryKey: ["pleito-vinculos", pleito.id],
    queryFn: () => entities.PleitoVinculo.filter({ pleito_id: pleito.id }),
    enabled: !!pleito.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Pleito.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pleitos"] });
      queryClient.invalidateQueries({ queryKey: ["pleito", pleito.id] });
      setShowEditForm(false);
      toast({ title: "Pleito atualizado com sucesso!" });
    },
    onError: (e) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const abas = [
    { key: "detalhes",  label: "Detalhes" },
    { key: "registros", label: `Registros (${registros.length})` },
    { key: "vinculos",  label: "Vínculos" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">{pleito.titulo}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={pleito.status} />
              {(pleito.categorias || []).map((cat) => (
                <Badge key={cat} variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{cat}</Badge>
              ))}
              <span className="text-sm text-muted-foreground">
                Aberto em {formatDate(pleito.data_abertura)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportarXLS(pleito, registros, vinculos)}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar XLS
            </Button>
            <Button
              variant="outline"
              className="text-foreground"
              onClick={() => setShowEditForm(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Formulário de edição inline */}
        {showEditForm && (
          <PleitoForm
            pleito={pleito}
            onSubmit={(data) => updateMutation.mutate({ id: pleito.id, data })}
            onCancel={() => setShowEditForm(false)}
            isSubmitting={updateMutation.isPending}
          />
        )}

        {/* Abas */}
        <div className="flex gap-1 border-b border-border pb-0">
          {abas.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === key
                  ? "bg-card border border-b-card border-border text-foreground -mb-px"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "detalhes" && (
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Informações do Pleito</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição do Problema</label>
                  <p className="mt-2 text-foreground whitespace-pre-wrap">{pleito.descricao_problema}</p>
                </div>

                {pleito.contexto && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contexto</label>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">{pleito.contexto}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                  <p className="mt-2 text-foreground">{pleito.responsavel || "—"}</p>
                </div>

                {(pleito.categorias || []).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categorias</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pleito.categorias.map((cat) => (
                        <Badge key={cat} variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(pleito.partes_envolvidas || []).length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Partes Envolvidas</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pleito.partes_envolvidas.map((parte, index) => {
                        const label = typeof parte === "object" && parte !== null
                          ? `${parte.nome}${parte.papel ? ` (${parte.papel})` : ""}`
                          : String(parte);
                        return <Badge key={index} variant="outline">{label}</Badge>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "registros" && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Registros Associados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrosPending ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Carregando registros...</div>
              ) : registrosError ? (
                <div className="text-center py-8 text-destructive text-sm">Erro ao carregar registros associados.</div>
              ) : registros.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum registro associado a este pleito.</div>
              ) : (
                <div className="space-y-3">
                  {registros.map((registro) => (
                    <div key={registro.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{registro.descricao}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDateTime(registro.data_hora)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">P: {registro.probabilidade}</Badge>
                          <Badge variant="outline">I: {registro.gravidade}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "vinculos" && <VinculosTab pleito={pleito} />}
      </div>
    </div>
  );
}
