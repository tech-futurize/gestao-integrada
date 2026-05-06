import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, X, Edit, Radio, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoriaColors = {
  Engenharia: "bg-blue-100 text-blue-800 border-blue-200",
  Suprimentos: "bg-green-100 text-green-800 border-green-200",
  Planejamento: "bg-purple-100 text-purple-800 border-purple-200",
  Construção: "bg-orange-100 text-orange-800 border-orange-200",
  Contratos: "bg-red-100 text-red-800 border-red-200",
  "Qualidade/SSMA": "bg-teal-100 text-teal-800 border-teal-200",
};

const statusColors = {
  Identificado: "bg-blue-100 text-blue-800",
  "Em Análise": "bg-yellow-100 text-yellow-800",
  Descartado: "bg-gray-100 text-gray-800",
  Promovido: "bg-green-100 text-green-800",
};

const impactoColors = {
  Escopo: "bg-indigo-100 text-indigo-800",
  Custo: "bg-red-100 text-red-800",
  Prazo: "bg-orange-100 text-orange-800",
};

export default function RuidosList({ ruidos, isLoading, onEdit, onPromover, onDescartar, onDelete, isPromovendo, isDescartando }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Carregando notificações...</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (ruidos.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma Notificação Registrada</h3>
          <p className="text-gray-600">Comece registrando notificações contratuais</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5" style={{ color: "#26405d" }} />
          Lista de Notificações ({ruidos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Impacto</TableHead>
                <TableHead>Probabilidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ruidos.map((ruido) => (
                <TableRow key={ruido.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="max-w-sm">
                    <p className="font-medium text-gray-900 line-clamp-2">{ruido.descricao}</p>
                    {ruido.responsavel && <p className="text-xs text-gray-500 mt-1">Resp.: {ruido.responsavel}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoriaColors[ruido.categoria] || "bg-gray-100"}>
                      {ruido.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={impactoColors[ruido.impacto] || "bg-gray-100"}>
                      {ruido.impacto || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline"
                      className={ruido.probabilidade === "Alta" ? "bg-red-100 text-red-800" : ruido.probabilidade === "Média" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                      {ruido.probabilidade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[ruido.status] || "bg-gray-100"}>
                      {ruido.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {ruido.data_identificacao && format(new Date(ruido.data_identificacao), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => onEdit(ruido)} className="text-gray-600 border-gray-300">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {ruido.status === "Identificado" && (
                        <>
                          <Button size="sm" onClick={() => onPromover(ruido)} disabled={isPromovendo}
                            className="bg-green-600 hover:bg-green-700 text-white">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onDescartar(ruido.id)} disabled={isDescartando}
                            className="text-orange-600 border-orange-300">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {onDelete && (
                        <Button size="sm" variant="outline" onClick={() => onDelete(ruido.id)} className="text-red-600 border-red-300 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}