import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/StatusBadge";

const tipoColors = {
  "Ata de Reunião": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "RDO": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "E-mail": "bg-status-attention/15 text-status-attention",
  "Notificação": "bg-status-critical/15 text-status-critical",
};

export default function RegistrosList({ incidentes, casos, isLoading, onEdit, onDelete }) {
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
          <AlertTriangle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum Registro</h3>
          <p className="text-muted-foreground">Comece registrando eventos do projeto</p>
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
              <TableRow className="bg-muted/50">
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
                const casoAssociado = casos?.find((c) => c.id === incidente.pleito_id);
                const isRDO = incidente.tipo_registro === "RDO";
                return (
                  <TableRow key={incidente.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
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
                          <p className="font-medium text-foreground text-sm">Nº {incidente.numero_rdo || "—"}</p>
                          <p className="text-xs text-muted-foreground">{incidente.disciplina} {incidente.area ? `· ${incidente.area}` : ""}</p>
                          {incidente.ocorrencias && (
                            <p className="text-xs text-foreground mt-1 line-clamp-2">{incidente.ocorrencias}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-foreground text-sm line-clamp-2">{incidente.descricao}</p>
                          {incidente.responsavel_registro && (
                            <p className="text-xs text-muted-foreground mt-1">Resp.: {incidente.responsavel_registro}</p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {incidente.responsabilidade ? (
                        <Badge variant="outline" className={incidente.responsabilidade === "Contratada" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-status-attention/15 text-status-attention"}>
                          {incidente.responsabilidade}
                        </Badge>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={incidente.status} />
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
                        <Button size="sm" variant="outline" onClick={() => onEdit(incidente)} className="text-foreground">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {onDelete && (
                          <Button size="sm" variant="outline" onClick={() => onDelete(incidente.id)} className="text-status-critical border-status-critical/40 hover:bg-status-critical/10">
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