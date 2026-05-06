import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, FileText, Plus, Trash2, Cloud, Sun } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const disciplinaColors = {
  "Mecânica": "bg-blue-100 text-blue-800",
  "Elétrica": "bg-yellow-100 text-yellow-800",
  "Estrutura Metálica": "bg-slate-100 text-slate-800",
  "Tubulação": "bg-teal-100 text-teal-800",
};

export default function RDOsList({ rdos, casos, isLoading, onEdit, onDelete, onCriarCaso, isCriandoCaso }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Carregando RDOs...</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (rdos.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum RDO</h3>
          <p className="text-gray-600">Nenhum Relatório Diário de Obras registrado</p>
        </CardContent>
      </Card>
    );
  }

  const climaIcon = (valor) => {
    if (!valor) return <span className="text-gray-300 text-xs">—</span>;
    return valor === "Praticável"
      ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><Sun className="w-3 h-3" />Prat.</span>
      : <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium"><Cloud className="w-3 h-3" />Imprat.</span>;
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Relatórios Diários de Obra — RDOs ({rdos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Data</TableHead>
                <TableHead>Nº RDO</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Clima M/T/N</TableHead>
                <TableHead>Ocorrência</TableHead>
                <TableHead>Responsabilidade</TableHead>
                <TableHead>Pleito</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rdos.map((rdo) => {
                const casoAssociado = casos?.find((c) => c.id === rdo.caso_id);
                return (
                  <TableRow key={rdo.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {rdo.data_hora && format(new Date(rdo.data_hora), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-800 text-sm">
                      {rdo.numero_rdo || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{rdo.area || "—"}</TableCell>
                    <TableCell>
                      {rdo.disciplina ? (
                        <Badge variant="outline" className={disciplinaColors[rdo.disciplina] || "bg-gray-100 text-gray-800"}>
                          {rdo.disciplina}
                        </Badge>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {climaIcon(rdo.condicoes_climaticas_manha)}
                        <span className="text-gray-300">/</span>
                        {climaIcon(rdo.condicoes_climaticas_tarde)}
                        <span className="text-gray-300">/</span>
                        {climaIcon(rdo.condicoes_climaticas_noite)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {rdo.ocorrencias ? (
                        <p className="text-sm text-gray-700 line-clamp-2">{rdo.ocorrencias}</p>
                      ) : (
                        <span className="text-gray-400 text-sm">Sem ocorrência</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rdo.responsabilidade ? (
                        <Badge variant="outline" className={rdo.responsabilidade === "Contratada" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}>
                          {rdo.responsabilidade}
                        </Badge>
                      ) : <span className="text-gray-400 text-sm">—</span>}
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
                        <Button size="sm" variant="outline" onClick={() => onEdit(rdo)} className="text-gray-600 border-gray-300">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!rdo.caso_id && onCriarCaso && (
                          <Button size="sm" onClick={() => onCriarCaso(rdo)} disabled={isCriandoCaso}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2">
                            <Plus className="w-3 h-3 mr-1" />Pleito
                          </Button>
                        )}
                        {onDelete && (
                          <Button size="sm" variant="outline" onClick={() => onDelete(rdo.id)} className="text-red-600 border-red-300 hover:bg-red-50">
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