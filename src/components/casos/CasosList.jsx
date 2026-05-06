import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  Aberto: "bg-blue-100 text-blue-800",
  "Em Análise": "bg-yellow-100 text-yellow-800",
  "Em Andamento": "bg-orange-100 text-orange-800",
  Resolvido: "bg-green-100 text-green-800",
  Fechado: "bg-gray-100 text-gray-800",
  Cancelado: "bg-red-100 text-red-800",
};

const prioridadeColors = {
  Baixa: "bg-green-100 text-green-800",
  Média: "bg-yellow-100 text-yellow-800",
  Alta: "bg-orange-100 text-orange-800",
  Crítica: "bg-red-100 text-red-800",
};

export default function CasosList({ casos, isLoading, onSelect }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Carregando pleitos...</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (casos.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum Pleito Registrado</h3>
          <p className="text-gray-600">Crie pleitos para gerenciar questões contratuais</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" style={{ color: "#26405d" }} />
          Lista de Pleitos ({casos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data Abertura</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {casos.map((caso) => (
                <TableRow key={caso.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelect(caso)}>
                  <TableCell className="max-w-xs">
                    <p className="font-medium text-gray-900">{caso.titulo}</p>
                    {caso.descricao_problema && (
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">{caso.descricao_problema}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(caso.categorias || []).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs bg-blue-50 text-blue-700">{cat}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={prioridadeColors[caso.prioridade]}>{caso.prioridade}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[caso.status]}>{caso.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{caso.responsavel || "-"}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {caso.data_abertura && format(new Date(caso.data_abertura), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><ChevronRight className="w-5 h-5" /></Button>
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