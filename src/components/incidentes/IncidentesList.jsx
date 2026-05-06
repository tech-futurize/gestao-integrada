import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  Registrado: "bg-blue-100 text-blue-800",
  "Em Análise": "bg-yellow-100 text-yellow-800",
  Resolvido: "bg-green-100 text-green-800",
  Fechado: "bg-gray-100 text-gray-800",
};

const tipoColors = {
  "Ata de Reunião": "bg-purple-100 text-purple-800",
  "RDO": "bg-blue-100 text-blue-800",
  "E-mail": "bg-orange-100 text-orange-800",
  "Notificação": "bg-red-100 text-red-800",
};

export default function IncidentesList({ incidentes, casos, isLoading, onEdit, onDelete, onCriarCaso, isCriandoCaso }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Carregando registros...</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (incidentes.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum Registro</h3>
          <p className="text-gray-600">Comece registrando eventos do projeto</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Lista de Registros ({incidentes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição / RDO</TableHead>
                <TableHead>Responsabilidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pleito</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidentes.map((incidente) => {
                const casoAssociado = casos?.find((c) => c.id === incidente.caso_id);
                const isRDO = incidente.tipo_registro === "RDO";
                return (
                  <TableRow key={incidente.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {incidente.data_hora && format(new Date(incidente.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tipoColors[incidente.tipo_registro]}>
                        {incidente.tipo_registro || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {isRDO ? (
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Nº {incidente.numero_rdo || "—"}</p>
                          <p className="text-xs text-gray-500">{incidente.disciplina} {incidente.area ? `· ${incidente.area}` : ""}</p>
                          {incidente.ocorrencias && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{incidente.ocorrencias}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900 text-sm line-clamp-2">{incidente.descricao}</p>
                          {incidente.responsavel_registro && (
                            <p className="text-xs text-gray-500 mt-1">Resp.: {incidente.responsavel_registro}</p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {incidente.responsabilidade ? (
                        <Badge variant="outline" className={incidente.responsabilidade === "Contratada" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}>
                          {incidente.responsabilidade}
                        </Badge>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[incidente.status]}>{incidente.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {casoAssociado ? (
                        <span className="text-xs text-blue-600 font-medium line-clamp-1">{casoAssociado.titulo.substring(0, 25)}…</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => onEdit(incidente)} className="text-gray-600 border-gray-300">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!incidente.caso_id && onCriarCaso && (
                          <Button size="sm" onClick={() => onCriarCaso(incidente)} disabled={isCriandoCaso}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2">
                            <Plus className="w-3 h-3 mr-1" />Pleito
                          </Button>
                        )}
                        {onDelete && (
                          <Button size="sm" variant="outline" onClick={() => onDelete(incidente.id)} className="text-red-600 border-red-300 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}