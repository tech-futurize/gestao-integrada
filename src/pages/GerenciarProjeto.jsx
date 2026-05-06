import React, { useState } from "react";
import { entities } from "@/api/supabaseEntities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Upload, FileText, Save } from "lucide-react";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useProject } from "@/lib/ProjectContext";

export default function GerenciarProjeto() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);

  const { data: projeto, isLoading: loadingProjeto } = useQuery({
    queryKey: ["projeto", selectedProjectId],
    queryFn: async () => {
      const projetos = await entities.Projeto.list();
      return projetos.find((p) => p.id === selectedProjectId);
    },
    enabled: !!selectedProjectId,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ["documentos", selectedProjectId],
    queryFn: () =>
      entities.DocumentoContratual.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const [formData, setFormData] = useState({});

  React.useEffect(() => {
    if (projeto) {
      setFormData(projeto);
    }
  }, [projeto]);

  const updateProjetoMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Projeto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projeto"] });
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      setEditando(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProjetoMutation.mutate({ id: selectedProjectId, data: formData });
  };

  if (!selectedProjectId) {
    return <PageEmptyState icon={FolderOpen} description="Selecione um projeto para gerenciar suas informações." />;
  }

  if (loadingProjeto) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-[480px] w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!projeto) {
    return <PageEmptyState icon={FolderOpen} description="Projeto não encontrado." />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-primary">
              Informações do Projeto
            </h2>
            <p className="text-gray-600 mt-1">
              Dados cadastrais e documentos contratuais
            </p>
          </div>
          {!editando && (
            <Button onClick={() => setEditando(true)} className="bg-brand-accent text-white hover:bg-brand-accent/90">
              <FileText className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-brand-primary/5">
            <CardTitle>Dados do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Nome do Projeto</Label>
                  <Input
                    value={formData.nome || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    disabled={!editando}
                    className="mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Objeto do Contrato</Label>
                  <Textarea
                    value={formData.descricao || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    disabled={!editando}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Cliente</Label>
                  <Input
                    value={formData.cliente || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, cliente: e.target.value })
                    }
                    disabled={!editando}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Responsável Geral</Label>
                  <Input
                    value={formData.responsavel_geral || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavel_geral: e.target.value })
                    }
                    disabled={!editando}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Data do Contrato</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, data_inicio: e.target.value })
                    }
                    disabled={!editando}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Data de Conclusão da Obra</Label>
                  <Input
                    type="date"
                    value={formData.data_prevista_termino || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_prevista_termino: e.target.value,
                      })
                    }
                    disabled={!editando}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Valor do Contrato (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_contrato || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valor_contrato: parseFloat(e.target.value),
                      })
                    }
                    disabled={!editando}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status || "Em Andamento"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                    disabled={!editando}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planejamento">Planejamento</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    disabled={!editando}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>

              {editando && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditando(false);
                      setFormData(projeto);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-brand-accent text-white hover:bg-brand-accent/90"
                    disabled={updateProjetoMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProjetoMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-brand-primary/5">
            <CardTitle className="flex items-center justify-between">
              <span>Documentos Contratuais</span>
              <Button size="sm" className="bg-brand-accent text-white hover:bg-brand-accent/90">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {documentos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum documento anexado
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {doc.nome_documento}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.tipo_documento}
                          {doc.data_referencia &&
                            ` - ${format(new Date(doc.data_referencia), "dd/MM/yyyy")}`}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}