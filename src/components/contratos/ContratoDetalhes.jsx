import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Edit, DollarSign, Calendar, User, Building, Download } from "lucide-react";
import ConfirmDeleteButton from "@/components/ui/ConfirmDeleteButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, addDaysToDate } from "@/lib/dateUtils";
import ContratoExportDialog from "@/components/contratos/ContratoExportDialog";
import ContratoVisaoGeral from "@/components/contratos/ContratoVisaoGeral";
import ContratoPQP from "@/components/contratos/ContratoPQP";
import ContratoMedicoes from "@/components/contratos/ContratoMedicoes";
import ContratoAditivos from "@/components/contratos/ContratoAditivos";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const CONCLUIDAS = ["Concluído", "Aprovada", "Paga"];

export default function ContratoDetalhes({ contrato, onBack, onEdit, onDelete }) {
  const [showExport, setShowExport] = useState(false);

  // Queries próprias (deduplicadas com as das abas) para o card-resumo do contrato
  const { data: medicoes = [] } = useQuery({
    queryKey: ["medicoes", "contrato", contrato.id],
    queryFn: () => entities.Medicao.filter({ contrato_id: contrato.id }),
    enabled: !!contrato.id,
  });
  const { data: aditivos = [] } = useQuery({
    queryKey: ["aditivos", contrato.id],
    queryFn: () => entities.Aditivo.filter({ contrato_id: contrato.id }),
    enabled: !!contrato.id,
  });

  const totalMedido = medicoes.filter((m) => CONCLUIDAS.includes(m.status)).reduce((s, m) => s + (m.valor || 0), 0);
  // Mesma base da listagem: valor do contrato + aditivos de valor assinados
  const valorAditivos = aditivos.filter((a) => a.status === "Assinado" && a.valor).reduce((s, a) => s + a.valor, 0);
  const valorAjustado = (contrato.valor_total || 0) + valorAditivos;
  const saldo = valorAjustado - totalMedido;
  const percentMedido = valorAjustado ? (totalMedido / valorAjustado) * 100 : 0;

  const totalPrazoDias = aditivos.filter((a) => a.status === "Assinado" && a.prazo_dias).reduce((s, a) => s + (a.prazo_dias || 0), 0);
  const terminoAtual = totalPrazoDias > 0 ? addDaysToDate(contrato.data_fim, totalPrazoDias) : contrato.data_fim;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h2 className="text-lg font-bold flex-1 text-foreground">Detalhes do Contrato</h2>
        <Button size="sm" variant="outline" onClick={() => setShowExport(true)}><Download className="w-4 h-4 mr-1" /> Exportar</Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(contrato)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
        <ConfirmDeleteButton size="sm" onConfirm={() => onDelete(contrato.id)} description="O contrato e todos os seus dados associados serão excluídos permanentemente." />
      </div>

      {/* Card-resumo — apenas indicadores DESTE contrato */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {contrato.numero && <span className="text-xs font-mono text-muted-foreground">{contrato.numero}</span>}
                <StatusBadge status={contrato.status} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{contrato.objeto}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-status-positive">{fmt(contrato.valor_total)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fornecedor</p>
                <p className="text-sm font-semibold text-foreground">{contrato.fornecedor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Gestor</p>
                <p className="text-sm font-semibold text-foreground">{contrato.gestor || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Início → Término</p>
                <p className="text-sm font-semibold text-foreground">{(formatDate(contrato.data_inicio) || "—")} → {(formatDate(terminoAtual) || "—")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="text-sm font-semibold text-status-critical">{fmt(saldo)}</p>
                {aditivos.filter((a) => a.status === "Assinado").length > 0 && (
                  <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {aditivos.filter((a) => a.status === "Assinado").length}
                    </span>
                    {" "}aditivo{aditivos.filter((a) => a.status === "Assinado").length !== 1 ? "s" : ""} assinado{aditivos.filter((a) => a.status === "Assinado").length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Medido</span>
              <span className="text-xs font-semibold text-foreground">{percentMedido.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full transition-all bg-ocre" style={{ width: `${Math.min(percentMedido, 100)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="visao">
            <TabsList className="mb-4">
              <TabsTrigger value="visao">Visão Geral</TabsTrigger>
              <TabsTrigger value="pqp">PQP</TabsTrigger>
              <TabsTrigger value="medicoes">Medições</TabsTrigger>
              <TabsTrigger value="aditivos">Aditivos</TabsTrigger>
            </TabsList>
            <TabsContent value="visao"><ContratoVisaoGeral contrato={contrato} aditivos={aditivos} /></TabsContent>
            <TabsContent value="pqp"><ContratoPQP contrato={contrato} /></TabsContent>
            <TabsContent value="medicoes"><ContratoMedicoes contrato={contrato} /></TabsContent>
            <TabsContent value="aditivos"><ContratoAditivos contrato={contrato} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showExport && (
        <ContratoExportDialog
          open={showExport}
          onOpenChange={setShowExport}
          contrato={contrato}
          medicoes={medicoes}
          aditivos={aditivos}
        />
      )}
    </div>
  );
}
