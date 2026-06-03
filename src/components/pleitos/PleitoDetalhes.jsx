import { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, AlertTriangle } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import VinculosTab from "@/components/pleitos/vinculos/VinculosTab";

export default function PleitoDetalhes({ pleito, onBack, onEdit }) {
  const [activeTab, setActiveTab] = useState("detalhes");

  const { data: incidentes = [], isPending: incidentesPending, isError: incidentesError } = useQuery({
    queryKey: ["registros-por-pleito", pleito.id],
    queryFn: () => entities.Registro.filter({ pleito_id: pleito.id }),
    enabled: !!pleito.id,
  });

  const abas = [
    { key: "detalhes",  label: "Detalhes" },
    { key: "registros", label: `Registros (${incidentes.length})` },
    { key: "vinculos",  label: "Vínculos" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground">{pleito.titulo}</h2>
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
          <Button onClick={() => onEdit(pleito)} variant="outline" className="text-foreground">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Abas — mesmo padrão do Histograma e Avanços */}
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
                  <p className="mt-2 text-foreground">{pleito.responsavel || "-"}</p>
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
              {incidentesPending ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Carregando registros...</div>
              ) : incidentesError ? (
                <div className="text-center py-8 text-destructive text-sm">Erro ao carregar registros associados.</div>
              ) : incidentes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum registro associado a este pleito</div>
              ) : (
                <div className="space-y-3">
                  {incidentes.map((incidente) => (
                    <div key={incidente.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{incidente.descricao}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDateTime(incidente.data_hora)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">P: {incidente.probabilidade}</Badge>
                          <Badge variant="outline">I: {incidente.gravidade}</Badge>
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
