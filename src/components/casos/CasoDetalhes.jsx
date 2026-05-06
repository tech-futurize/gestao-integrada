import React from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, FileText, CheckSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PlanoAcao from "./PlanoAcao";

const statusColors = {
  Aberto: "bg-blue-100 text-blue-800",
  "Em Análise": "bg-yellow-100 text-yellow-800",
  "Em Andamento": "bg-orange-100 text-orange-800",
  Resolvido: "bg-green-100 text-green-800",
  Fechado: "bg-gray-100 text-gray-800",
  Cancelado: "bg-red-100 text-red-800",
};

export default function CasoDetalhes({ caso, onBack, onEdit }) {
  const { data: incidentes = [] } = useQuery({
    queryKey: ["incidentes", caso.id],
    queryFn: () => entities.Incidente.filter({ caso_id: caso.id }),
  });

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900">{caso.titulo}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={statusColors[caso.status]}>{caso.status}</Badge>
              {(caso.categorias || []).map((cat) => (
                <Badge key={cat} variant="outline" className="bg-blue-50 text-blue-700">{cat}</Badge>
              ))}
              <span className="text-sm text-gray-500">
                Aberto em{" "}
                {caso.data_abertura && format(new Date(caso.data_abertura), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
          <Button onClick={() => onEdit(caso)} variant="outline" className="text-gray-600">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        <Tabs defaultValue="detalhes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="detalhes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Detalhes</span>
            </TabsTrigger>
            <TabsTrigger value="acoes" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Plano de Ação</span>
            </TabsTrigger>
            <TabsTrigger value="incidentes" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Registros ({incidentes.length})</span>
            </TabsTrigger>

          </TabsList>

          <TabsContent value="detalhes">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Informações do Pleito</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descrição do Problema</label>
                    <p className="mt-2 text-gray-900 whitespace-pre-wrap">{caso.descricao_problema}</p>
                  </div>

                  {caso.contexto && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contexto</label>
                      <p className="mt-2 text-gray-900 whitespace-pre-wrap">{caso.contexto}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Responsável</label>
                    <p className="mt-2 text-gray-900">{caso.responsavel || "-"}</p>
                  </div>

                  {(caso.categorias || []).length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Categorias</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {caso.categorias.map((cat) => (
                          <Badge key={cat} variant="outline" className="bg-blue-50 text-blue-700">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(caso.partes_envolvidas || []).length > 0 && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Partes Envolvidas</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {caso.partes_envolvidas.map((parte, index) => {
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
          </TabsContent>

          <TabsContent value="acoes">
            <PlanoAcao casoId={caso.id} />
          </TabsContent>

          <TabsContent value="incidentes">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Registros Associados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incidentes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum registro associado a este pleito</div>
                ) : (
                  <div className="space-y-3">
                    {incidentes.map((incidente) => (
                      <div key={incidente.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{incidente.descricao}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {incidente.data_hora && format(new Date(incidente.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}