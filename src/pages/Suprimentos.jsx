import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ShoppingCart, ClipboardList, BarChart2, CheckCircle } from "lucide-react";
import RequisicoesList from "@/components/suprimentos/RequisicoesList";
import RequisicaoForm from "@/components/suprimentos/RequisicaoForm";
import CotacoesList from "@/components/suprimentos/CotacoesList";
import CotacaoForm from "@/components/suprimentos/CotacaoForm";
import MapaSuprimentos from "@/components/suprimentos/MapaSuprimentos";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useProject } from "@/lib/ProjectContext";

export default function Suprimentos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("requisicoes");
  const [showReqForm, setShowReqForm] = useState(false);
  const [editReq, setEditReq] = useState(null);
  const [showCotForm, setShowCotForm] = useState(false);
  const [editCot, setEditCot] = useState(null);

  const { data: requisicoes = [], isLoading: loadingReq } = useQuery({
    queryKey: ["requisicoes", selectedProjectId],
    queryFn: () => entities.RequisicaoCompra.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: cotacoes = [], isLoading: loadingCot } = useQuery({
    queryKey: ["cotacoes", selectedProjectId],
    queryFn: () => entities.Cotacao.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createReq = useMutation({
    mutationFn: (data) => entities.RequisicaoCompra.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["requisicoes"]); setShowReqForm(false); },
  });

  const updateReq = useMutation({
    mutationFn: ({ id, data }) => entities.RequisicaoCompra.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["requisicoes"]); setShowReqForm(false); setEditReq(null); },
  });

  const deleteReq = useMutation({
    mutationFn: (id) => entities.RequisicaoCompra.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["requisicoes"]),
  });

  const createCot = useMutation({
    mutationFn: (data) => entities.Cotacao.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["cotacoes"]); setShowCotForm(false); },
  });

  const updateCot = useMutation({
    mutationFn: ({ id, data }) => entities.Cotacao.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["cotacoes"]); setShowCotForm(false); setEditCot(null); },
  });

  const deleteCot = useMutation({
    mutationFn: (id) => entities.Cotacao.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["cotacoes"]),
  });

  if (!selectedProjectId) {
    return <PageEmptyState icon={ShoppingCart} description="Selecione um projeto no menu lateral para acessar suprimentos." />;
  }

  const reqAprovadas = requisicoes.filter(r => r.status === "Aprovada").length;
  const reqEmCotacao = requisicoes.filter(r => r.status === "Em Cotação").length;
  const cotAberta = cotacoes.filter(c => c.status === "Aberta" || c.status === "Em Análise").length;
  const cotAprovadas = cotacoes.filter(c => c.status === "Aprovada").length;

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
  const totalAprovado = cotacoes.filter(c => c.status === "Aprovada").reduce((s, c) => s + (c.valor_aprovado || 0), 0);

  const handleSaveReq = (data) => {
    if (editReq) updateReq.mutate({ id: editReq.id, data });
    else createReq.mutate({ ...data, projeto_id: selectedProjectId });
  };

  const handleSaveCot = (data) => {
    if (editCot) updateCot.mutate({ id: editCot.id, data });
    else createCot.mutate({ ...data, projeto_id: selectedProjectId });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Requisições Aprovadas", value: reqAprovadas, icon: CheckCircle, color: "#00a49a" },
          { label: "Em Cotação", value: reqEmCotacao, icon: ClipboardList, color: "#f59e0b" },
          { label: "Cotações Abertas", value: cotAberta, icon: BarChart2, color: "#3b82f6" },
          { label: "Total Aprovado", value: fmt(totalAprovado), icon: ShoppingCart, color: "#26405d" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-brand-primary">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="requisicoes">Requisições</TabsTrigger>
            <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
            <TabsTrigger value="mapa">Mapa de Suprimentos (MAS)</TabsTrigger>
          </TabsList>
          {tab !== "mapa" && (
            <Button
              onClick={() => tab === "cotacoes" ? setShowCotForm(true) : setShowReqForm(true)}
              className="bg-brand-accent text-white hover:bg-brand-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              {tab === "cotacoes" ? "Nova Cotação" : "Nova Requisição"}
            </Button>
          )}
        </div>

        <TabsContent value="requisicoes" className="mt-4">
          <RequisicoesList
            requisicoes={requisicoes}
            isLoading={loadingReq}
            onEdit={(r) => { setEditReq(r); setShowReqForm(true); }}
            onDelete={(id) => deleteReq.mutate(id)}
            onUpdateStatus={(id, status) => updateReq.mutate({ id, data: { status } })}
          />
        </TabsContent>

        <TabsContent value="cotacoes" className="mt-4">
          <CotacoesList
            cotacoes={cotacoes}
            isLoading={loadingCot}
            onEdit={(c) => { setEditCot(c); setShowCotForm(true); }}
            onDelete={(id) => deleteCot.mutate(id)}
            onUpdateStatus={(id, status) => updateCot.mutate({ id, data: { status } })}
          />
        </TabsContent>

        <TabsContent value="mapa" className="mt-4">
          <MapaSuprimentos selectedProjectId={selectedProjectId} />
        </TabsContent>
      </Tabs>

      {showReqForm && (
        <RequisicaoForm
          requisicao={editReq}
          onSave={handleSaveReq}
          onClose={() => { setShowReqForm(false); setEditReq(null); }}
        />
      )}
      {showCotForm && (
        <CotacaoForm
          cotacao={editCot}
          requisicoes={requisicoes}
          onSave={handleSaveCot}
          onClose={() => { setShowCotForm(false); setEditCot(null); }}
        />
      )}
    </div>
  );
}