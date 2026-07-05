import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useToast } from "@/components/ui/use-toast";
import { getDefaultAnswer } from "@/lib/formularios/formSchema";
import { validateAnswers } from "@/lib/formularios/formValidation";
import FormRenderer from "@/components/formularios/renderer/FormRenderer";

export default function ResponderFormulario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});
  const [respondente, setRespondente] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const { data: formulario, isPending, isError } = useQuery({
    queryKey: ["formulario_digital", id],
    queryFn: async () => {
      const [result] = await entities.FormularioDigital.filter({ id });
      return result || null;
    },
    enabled: !!id,
  });

  const definition = formulario?.definicao;

  function buildDefaults(def) {
    const defaults = {};
    def?.sections?.forEach(sec => {
      sec.fields.forEach(f => { defaults[f.id] = getDefaultAnswer(f); });
    });
    return defaults;
  }

  useEffect(() => {
    if (definition?.sections) setAnswers(buildDefaults(definition));
  }, [definition]);

  const createMut = useMutation({
    mutationFn: payload => entities.FormularioResposta.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulario_respostas_count", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["formulario_respostas", id, selectedProjectId] });
      toast({ variant: "success", title: "Resposta enviada com sucesso!" });
      setSubmitted(true);
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao enviar resposta." }),
  });

  function handleSubmit() {
    if (!definition) return;
    const { valid, errors: errs } = validateAnswers(definition, answers);
    if (!valid) {
      setErrors(errs);
      toast({ variant: "destructive", title: "Corrija os campos obrigatórios antes de enviar." });
      return;
    }
    createMut.mutate({
      formulario_id: id,
      projeto_id: selectedProjectId,
      respondente: respondente.trim() || null,
      answers,
    });
  }

  function handleFieldChange(fieldId, val) {
    setAnswers(prev => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors(prev => { const e = { ...prev }; delete e[fieldId]; return e; });
    }
  }

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <PageEmptyState icon={ClipboardList} description="Selecione um projeto para preencher o formulário." />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (isError || !formulario) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center text-status-critical">Formulário não encontrado.</div>
      </div>
    );
  }

  // Desativado no cadastro: bloqueia novas respostas mesmo com o link direto
  if (formulario.ativo === false) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Este formulário foi desativado e não aceita novas respostas.
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-bold">Resposta enviada!</h2>
          <p className="text-muted-foreground">Sua resposta foi registrada com sucesso.</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => { setSubmitted(false); setAnswers(buildDefaults(definition)); setErrors({}); setRespondente(""); }}
              className="border border-border rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-muted/30"
            >
              Nova resposta
            </button>
            <button
              onClick={() => navigate(`/formularios/${id}/respostas`)}
              className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary/90"
            >
              Ver respostas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border border-t-[5px] border-t-primary rounded-xl p-5 mb-4">
            <h1 className="text-xl font-bold">{formulario.titulo}</h1>
            {formulario.descricao && (
              <p className="text-sm text-muted-foreground mt-2">{formulario.descricao}</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <label className="text-sm font-semibold block mb-2">Seu nome (opcional)</label>
            <input
              value={respondente}
              onChange={e => setRespondente(e.target.value)}
              placeholder="Digite seu nome..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>

          <FormRenderer
            definition={definition}
            value={answers}
            onChange={handleFieldChange}
            errors={errors}
          />

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => navigate("/formularios")}
              className="border border-border rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-muted/30"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMut.isPending}
              className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {createMut.isPending ? "Enviando..." : "Enviar resposta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
