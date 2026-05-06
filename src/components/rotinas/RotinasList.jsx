import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, CheckSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  "Em Dia": "bg-green-100 text-green-800 border-green-200",
  Atrasada: "bg-red-100 text-red-800 border-red-200",
  Concluída: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function RotinasList({ rotinas, isLoading, onEdit, onUpdateStatus }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Carregando rotinas...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rotinas.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma Rotina Registrada
          </h3>
          <p className="text-gray-600">
            Crie rotinas para gerenciar atividades recorrentes
          </p>
        </CardContent>
      </Card>
    );
  }

  const rotinasPorStatus = {
    "Em Dia": rotinas.filter((r) => r.status === "Em Dia").length,
    Atrasada: rotinas.filter((r) => r.status === "Atrasada").length,
    Concluída: rotinas.filter((r) => r.status === "Concluída").length,
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Em Dia</p>
              <p className="text-3xl font-bold text-green-900">
                {rotinasPorStatus["Em Dia"]}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atrasadas</p>
              <p className="text-3xl font-bold text-red-900">
                {rotinasPorStatus["Atrasada"]}
              </p>
            </div>
            <CheckSquare className="w-10 h-10 text-red-600" />
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Concluídas</p>
              <p className="text-3xl font-bold text-gray-900">
                {rotinasPorStatus["Concluída"]}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-gray-600" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-green-600" />
            Lista de Rotinas ({rotinas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Descrição</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotinas.map((rotina) => (
                  <TableRow
                    key={rotina.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="max-w-md">
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {rotina.descricao}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rotina.periodicidade}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {rotina.responsavel || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {rotina.proxima_data_execucao
                        ? format(
                            new Date(rotina.proxima_data_execucao),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[rotina.status]}
                      >
                        {rotina.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(rotina)}
                          className="hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {rotina.status !== "Concluída" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              onUpdateStatus({
                                id: rotina.id,
                                data: {
                                  status: "Concluída",
                                  data_ultima_execucao: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                },
                              })
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Concluir
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
    </>
  );
}