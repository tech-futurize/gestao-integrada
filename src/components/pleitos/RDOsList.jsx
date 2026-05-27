import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, FileText, Plus, Trash2, Cloud, Sun } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const disciplinaColors = {
  "Mecânica": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Elétrica": "bg-status-attention/15 text-status-attention",
  "Estrutura Metálica": "bg-muted text-muted-foreground",
  "Tubulação": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
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
          <FileText className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum RDO</h3>
          <p className="text-muted-foreground">Nenhum Relatório Diário de Obras registrado</p>
        </CardContent>
      </Card>
    );
  }

  const climaIcon = (valor) => {
    if (!valor) return <span className="text-muted-foreground/40 text-xs">—</span>;
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
              <TableRow className="bg-muted/50">
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
                const casoAssociado = casos?.find((c) => c.id === rdo.pleito_id);
                return (
                  <TableRow key={rdo.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {rdo.data_hora && format(new Date(rdo.data_hora), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground text-sm">
                      {rdo.numero_rdo || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{rdo.area || "—"}</TableCell>
                    <TableCell>
                      {rdo.disciplina ? (
                        <Badge variant="outline" className={disciplinaColors[rdo.disciplina] || "bg-muted text-muted-foreground"}>
                          {rdo.disciplina}
                        </Badge>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {climaIcon(rdo.condicoes_climaticas_manha)}
                        <span className="text-muted-foreground/40">/</span>
                        {climaIcon(rdo.condicoes_climaticas_tarde)}
                        <span className="text-muted-foreground/40">/</span>
                        {climaIcon(rdo.condicoes_climaticas_noite)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {rdo.ocorrencias ? (
                        <p className="text-sm text-foreground line-clamp-2">{rdo.ocorrencias}</p>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem ocorrência</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rdo.responsabilidade ? (
                        <Badge variant="outline" className={rdo.responsabilidade === "Contratada" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-status-attention/15 text-status-attention"}>
                          {rdo.responsabilidade}
                        </Badge>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      {casoAssociado ? (
                        <span className="text-xs text-primary font-medium line-clamp-1">{casoAssociado.titulo.substring(0, 25)}…</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => onEdit(rdo)} className="text-foreground">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!rdo.pleito_id && onCriarCaso && (
                          <Button size="sm" variant="secondary" onClick={() => onCriarCaso(rdo)} disabled={isCriandoCaso}
                            className="text-xs px-2">
                            <Plus className="w-3 h-3 mr-1" />Pleito
                          </Button>
                        )}
                        {onDelete && (
                          <Button size="sm" variant="outline" onClick={() => onDelete(rdo.id)} className="text-status-critical border-status-critical/40 hover:bg-status-critical/10">
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