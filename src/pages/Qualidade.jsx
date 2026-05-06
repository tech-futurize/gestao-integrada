import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, AlertTriangle, BookOpen } from "lucide-react";
import EngenhariaPanel from "../components/engenharias/EngenhariaPanel";
import RelatoriosNNC from "../components/qualidade/RelatoriosNNC";
import LicoesAprendidas from "../components/qualidade/LicoesAprendidas";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

const tiposEngenharia = ["Engenharia","Suprimentos","Construção","Planejamento","Contratos","Qualidade/SSMA"];

export default function Qualidade() {
  const { selectedProjectId } = useProject();
  const [engenhariaAtiva, setEngenhariaAtiva] = useState("Engenharia");


  if (!selectedProjectId) {
    return <PageEmptyState icon={Settings} description="Selecione um projeto na barra lateral para gerenciar planos de ação." />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="nnc">
          <TabsList className="mb-4">
            <TabsTrigger value="nnc" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />Relatórios NNC
            </TabsTrigger>
            <TabsTrigger value="planos" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />Planos de Ação
            </TabsTrigger>
            <TabsTrigger value="licoes" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />Lições Aprendidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nnc">
            <RelatoriosNNC />
          </TabsContent>

          <TabsContent value="planos">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-brand-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-accent" />
                  Gestão por Plano de Ação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={engenhariaAtiva} onValueChange={setEngenhariaAtiva}>
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
                    {tiposEngenharia.map((tipo) => (
                      <TabsTrigger key={tipo} value={tipo}>{tipo}</TabsTrigger>
                    ))}
                  </TabsList>
                  {tiposEngenharia.map((tipo) => (
                    <TabsContent key={tipo} value={tipo}>
                      <EngenhariaPanel tipo={tipo} projetoId={selectedProjectId} />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licoes">
            <Card className="bg-white shadow-sm border-0"><CardContent className="p-6"><LicoesAprendidas /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}