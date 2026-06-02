import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/dateUtils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";

const tipoColors = {
  "Ata de Reunião": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "RDO": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "E-mail": "bg-status-attention/15 text-status-attention",
  "Notificação": "bg-status-critical/15 text-status-critical",
};

export default function RegistrosList({ incidentes, casos, isLoading, onEdit, onDelete }) {
  const [viewItem, setViewItem] = useState(null);

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

  const fmtDate = (d) => formatDateTime(d) || "—";

  return (
    <>
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
                  <TableHead className="text-right w-28"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidentes.map((incidente) => {
                  const casoAssociado = casos?.find((c) => c.id === incidente.pleito_id);
                  const isRDO = incidente.tipo_registro === "RDO";
                  return (
                    <TableRow key={incidente.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {fmtDate(incidente.data_hora)}
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
                        <RowActions
                          onView={() => setViewItem(incidente)}
                          onEdit={() => onEdit(incidente)}
                          onDelete={onDelete ? () => onDelete(incidente.id) : undefined}
                          deleteDescription="O registro será excluído permanentemente."
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {viewItem && (
        <DetailDialog
          open={!!viewItem}
          onOpenChange={(o) => !o && setViewItem(null)}
          title={`Registro — ${viewItem.tipo_registro || ""}`}
          sections={[
            { label: "Data/Hora", value: fmtDate(viewItem.data_hora) },
            { label: "Tipo", value: viewItem.tipo_registro },
            { label: "Status", value: viewItem.status },
            { label: "Responsabilidade", value: viewItem.responsabilidade },
            { label: "Nº RDO", value: viewItem.numero_rdo },
            { label: "Área", value: viewItem.area },
            { label: "Disciplina", value: viewItem.disciplina },
            { label: "Responsável", value: viewItem.responsavel_registro },
            { label: "Descrição", value: viewItem.descricao, full: true },
            { label: "Ocorrências", value: viewItem.ocorrencias, full: true },
          ]}
        />
      )}
    </>
  );
}
