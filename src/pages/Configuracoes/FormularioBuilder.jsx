import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useToast } from "@/components/ui/use-toast";
import { createEmptyDefinition } from "@/lib/formularios/formSchema";
import FormBuilderHeader from "@/components/formularios/builder/FormBuilderHeader";
import FormBuilderCanvas from "@/components/formularios/builder/FormBuilderCanvas";
import FormRenderer from "@/components/formularios/renderer/FormRenderer";

export default function FormularioBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState(
    searchParams.get("mode") === "view" ? "preview" : "edit"
  );
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [titulo, setTitulo] = useState("Formulário sem título");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [definition, setDefinition] = useState(null);

  const { data: formulario, isPending, isError } = useQuery({
    queryKey: ["formulario_digital", id],
    queryFn: async () => {
      const [result] = await entities.FormularioDigital.filter({ id });
      return result || null;
    },
    enabled: !!id,
  });

  // Sync fetched data to local state
  useEffect(() => {
    if (formulario) {
      setTitulo(formulario.titulo || "Formulário sem título");
      setDescricao(formulario.descricao || "");
      setAtivo(formulario.ativo ?? false);
      const def = formulario.definicao;
      setDefinition(def?.sections ? def : createEmptyDefinition());
    }
  }, [formulario]);

  const saveMut = useMutation({
    mutationFn: payload => entities.FormularioDigital.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios_digitais"] });
      queryClient.invalidateQueries({ queryKey: ["formularios_digitais", "ativos"] });
      queryClient.invalidateQueries({ queryKey: ["formulario_digital", id] });
      toast({ variant: "success", title: "Formulário salvo com sucesso." });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar formulário." }),
  });

  function handleSave() {
    saveMut.mutate({ titulo, descricao, ativo, definicao: definition });
  }

  // id apagado/inválido ou erro de rede: sem isso o spinner ficava para sempre
  if (isError || (!isPending && !formulario)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <p>Formulário não encontrado ou removido.</p>
        <button className="text-sm underline" onClick={() => window.history.back()}>Voltar</button>
      </div>
    );
  }

  if (isPending || !definition) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const previewMaxWidth = previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl";

  return (
    <div className="flex flex-col h-full">
      <FormBuilderHeader
        titulo={titulo}
        descricao={descricao}
        ativo={ativo}
        onTituloChange={setTitulo}
        onDescricaoChange={setDescricao}
        onAtivoChange={setAtivo}
        mode={mode}
        onModeChange={setMode}
        previewDevice={previewDevice}
        onPreviewDeviceChange={setPreviewDevice}
        onSave={handleSave}
        saving={saveMut.isPending}
      />

      <div className="flex-1 overflow-auto p-6">
        {mode === "edit" ? (
          <div className="max-w-2xl mx-auto">
            <FormBuilderCanvas definition={definition} onChange={setDefinition} />
          </div>
        ) : (
          <div className={`mx-auto ${previewMaxWidth}`}>
            <div className="bg-card border border-border border-t-[5px] border-t-primary rounded-xl p-5 mb-4">
              <h1 className="text-xl font-bold">{titulo || "Formulário sem título"}</h1>
              {descricao && <p className="text-sm text-muted-foreground mt-2">{descricao}</p>}
            </div>
            <FormRenderer
              definition={definition}
              value={{}}
              onChange={() => {}}
              errors={{}}
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );
}
