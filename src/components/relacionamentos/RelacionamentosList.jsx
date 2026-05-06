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
import { Edit, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const classificacaoColors = {
  Excelente: "bg-green-100 text-green-800 border-green-200",
  Bom: "bg-blue-100 text-blue-800 border-blue-200",
  Neutro: "bg-gray-100 text-gray-800 border-gray-200",
  Tenso: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Crítico: "bg-red-100 text-red-800 border-red-200",
};

export default function RelacionamentosList({
  relacionamentos,
  isLoading,
  onEdit,
}) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Carregando tratativas...</CardTitle>
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

  if (relacionamentos.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma Tratativa Registrada
          </h3>
          <p className="text-gray-600">
            Comece registrando interações com stakeholders
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Log de Tratativas ({relacionamentos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Partes Envolvidas</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relacionamentos.map((rel) => (
                <TableRow key={rel.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-sm text-gray-600">
                    {rel.data_interacao &&
                      format(new Date(rel.data_interacao), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {rel.descricao}
                    </p>
                    {rel.objetivo && (
                      <p className="text-sm text-gray-500 mt-1">
                        Objetivo: {rel.objetivo}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {rel.partes_envolvidas && rel.partes_envolvidas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {rel.partes_envolvidas.slice(0, 3).map((parte, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {parte}
                          </Badge>
                        ))}
                        {rel.partes_envolvidas.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{rel.partes_envolvidas.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={classificacaoColors[rel.classificacao]}
                    >
                      {rel.classificacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(rel)}
                      className="hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
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