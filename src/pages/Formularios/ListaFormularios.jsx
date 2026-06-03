import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { countFields } from "@/lib/formularios/formSchema";

export default function ListaFormularios() {
  const navigate = useNavigate();
  const { selectedProjectId } = useProject();

  const { data: formularios = [], isPending } = useQuery({
    queryKey: ["formularios_digitais", "ativos"],
    queryFn: () => entities.FormularioDigital.filter({ ativo: true }),
  });

  const { data: respostas = [] } = useQuery({
    queryKey: ["formulario_respostas_count", selectedProjectId],
    queryFn: () => entities.FormularioResposta.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const respostasCount = respostas.reduce((acc, r) => {
    acc[r.formulario_id] = (acc[r.formulario_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6">
        {isPending ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : formularios.length === 0 ? (
          <PageEmptyState
            icon={ClipboardList}
            description="Nenhum formulário ativo. Crie e ative formulários em Configurações → Cadastros → Formulários."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formularios.map(f => {
              const nItens = countFields(f.definicao || {});
              const nRespostas = selectedProjectId ? (respostasCount[f.id] || 0) : null;
              return (
                <div
                  key={f.id}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{f.titulo}</h3>
                    {f.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{nItens} {nItens === 1 ? "item" : "itens"}</span>
                    {nRespostas !== null && (
                      <>
                        <span>·</span>
                        {nRespostas > 0 ? (
                          <span className="text-status-positive font-semibold">
                            {nRespostas} {nRespostas === 1 ? "resposta" : "respostas"}
                          </span>
                        ) : (
                          <span>sem respostas neste projeto</span>
                        )}
                      </>
                    )}
                  </div>
                  {selectedProjectId ? (
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => navigate(`/formularios/${f.id}/responder`)}
                        className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Responder
                      </button>
                      <button
                        onClick={() => navigate(`/formularios/${f.id}/respostas`)}
                        className="flex-1 border border-border rounded-lg py-2 text-sm font-semibold hover:bg-muted/30 transition-colors"
                      >
                        Respostas
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-auto">
                      Selecione um projeto para responder.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
