import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Eye } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import RespostaView from "@/components/formularios/renderer/RespostaView";

function formatAnswer(field, val) {
  if (val === undefined || val === null || val === "") return "—";
  if (field.type === "multiple_choice") {
    if (!Array.isArray(val)) return "—";
    return val.map(v => field.options?.find(o => o.value === v)?.label || v).join(", ") || "—";
  }
  if (field.type === "single_choice" || field.type === "dropdown") {
    return field.options?.find(o => o.value === val)?.label || val;
  }
  if (field.type === "rating") {
    return val ? `${"★".repeat(val)}${"☆".repeat((field.max || 5) - val)}` : "—";
  }
  return String(val);
}

export default function RespostasFormulario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProjectId } = useProject();
  const [viewing, setViewing] = useState(null);

  const { data: formulario, isError: isErrorFormulario } = useQuery({
    queryKey: ["formulario_digital", id],
    queryFn: async () => {
      const [result] = await entities.FormularioDigital.filter({ id });
      return result || null;
    },
    enabled: !!id,
  });

  const { data: respostas = [], isPending, isError } = useQuery({
    queryKey: ["formulario_respostas", id, selectedProjectId],
    queryFn: () => entities.FormularioResposta.filter({
      formulario_id: id,
      projeto_id: selectedProjectId,
    }),
    enabled: !!id && !!selectedProjectId,
  });

  const definition = formulario?.definicao;

  // Dynamic columns: first 4 non-section fields from the definition
  const columns = [];
  if (definition?.sections) {
    for (const sec of definition.sections) {
      for (const f of sec.fields) {
        if (f.type !== "section" && columns.length < 4) {
          columns.push(f);
        }
      }
    }
  }

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <PageEmptyState icon={ClipboardList} description="Selecione um projeto para ver as respostas." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">{formulario?.titulo || "Respostas"}</h2>
            <p className="text-sm text-muted-foreground">
              {respostas.length} {respostas.length === 1 ? "resposta" : "respostas"} neste projeto
            </p>
            {isErrorFormulario && (
              <p className="text-sm text-destructive">Erro ao carregar a definição do formulário.</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/formularios")}
              className="border border-border rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted/30"
            >
              ← Voltar
            </button>
            <button
              onClick={() => navigate(`/formularios/${id}/responder`)}
              className="bg-primary text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-primary/90"
            >
              Nova resposta
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Respondente</th>
                {columns.map(col => (
                  <th key={col.id} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">
                    {col.label || "(sem título)"}
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Enviado em</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-6 text-center text-status-critical">Erro ao carregar respostas.</td></tr>
              )}
              {!isPending && !isError && respostas.length === 0 && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-6 text-center text-muted-foreground">Nenhuma resposta registrada neste projeto.</td></tr>
              )}
              {respostas.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{r.respondente || "—"}</td>
                  {columns.map(col => (
                    <td key={col.id} className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {formatAnswer(col, r.answers?.[col.id])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewing(r)}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      title="Ver resposta completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <RespostaView
          open={!!viewing}
          onClose={() => setViewing(null)}
          definition={definition}
          answers={viewing.answers}
          respondente={viewing.respondente}
          createdAt={viewing.created_at}
        />
      )}
    </div>
  );
}
