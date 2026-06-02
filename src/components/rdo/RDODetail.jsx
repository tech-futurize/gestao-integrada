import { Button } from "@/components/ui/button";
import { BookOpen, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FormDialog } from "@/components/ui/FormDialog";

function ClimaDisplay({ turno }) {
  if (!turno?.ativo) return <span className="text-muted-foreground/40 text-xs">—</span>;
  return (
    <div>
      {turno.condicao && <p className="text-xs font-medium text-foreground">{turno.condicao}</p>}
      {turno.praticabilidade && (
        <p className={`text-xs font-medium ${turno.praticabilidade === "Praticável" ? "text-status-positive" : "text-blue-600 dark:text-blue-400"}`}>
          {turno.praticabilidade}
        </p>
      )}
    </div>
  );
}

export function RDODetail({ rdo, casos, tarefas, onClose }) {
  const atividadeNome = id => {
    const t = (tarefas || []).find(t => t.id === id);
    return t?.nome || t?.titulo || id;
  };

  const title = `${rdo.numero || "RDO"} — ${rdo.data ? format(new Date(rdo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : ""}`;

  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={BookOpen}
      title={title}
      subtitle={rdo.area ? `Área: ${rdo.area}` : "Relatório Diário de Obra"}
      variant="bar-top"
      maxWidth="max-w-2xl"
      mode="view"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" className="text-xs gap-1.5" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />Gerar PDF
          </Button>
          <Button variant="outline" onClick={onClose} className="text-xs">Fechar</Button>
        </>
      }
    >
      <div className="text-sm space-y-5">
        {/* Disciplinas */}
        {rdo.disciplinas?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rdo.disciplinas.map(d => (
              <span key={d} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{d}</span>
            ))}
          </div>
        )}

        {/* Clima */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">Condições Climáticas</p>
          <div className="grid grid-cols-3 gap-3">
            {[["Manhã", rdo.clima?.manha], ["Tarde", rdo.clima?.tarde], ["Noite", rdo.clima?.noite]].map(([label, t]) => (
              <div key={label} className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <ClimaDisplay turno={t} />
              </div>
            ))}
          </div>
        </div>

        {/* MO */}
        {rdo.mao_de_obra?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">👥 Mão de Obra</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left py-2 px-3">Nome</th>
                  <th className="text-left py-2 px-3">Função</th>
                  <th className="text-left py-2 px-3">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {rdo.mao_de_obra.map((m, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-2 px-3">{m.nome || "—"}</td>
                    <td className="py-2 px-3">{m.funcao || "—"}</td>
                    <td className="py-2 px-3 font-bold">{m.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Equipamentos */}
        {rdo.equipamentos?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">🚜 Equipamentos</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left py-2 px-3">Equipamento</th>
                  <th className="text-left py-2 px-3">Identificação</th>
                  <th className="text-left py-2 px-3">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {rdo.equipamentos.map((e, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-2 px-3">{e.nome}</td>
                    <td className="py-2 px-3">{e.identificacao || "—"}</td>
                    <td className="py-2 px-3 font-bold">{e.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Atividades Vinculadas */}
        {rdo.atividades_vinculadas?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">📋 Atividades Produzidas</p>
            <div className="flex flex-wrap gap-2">
              {rdo.atividades_vinculadas.map(id => (
                <span key={id} className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  {atividadeNome(id)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ocorrências */}
        {rdo.ocorrencias?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">⚠️ Ocorrências</p>
            <div className="space-y-3">
              {rdo.ocorrencias.map((oc, i) => {
                const pleito = (casos || []).find(c => c.id === oc.pleito_id);
                return (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                    <p className="text-foreground">{oc.descricao}</p>
                    {oc.responsabilidade && (
                      <p className="text-xs text-muted-foreground">
                        Responsabilidade: <span className="font-semibold">{oc.responsabilidade}</span>
                      </p>
                    )}
                    {oc.categorias?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {oc.categorias.map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-ocre/15 text-ocre">{c}</span>
                        ))}
                      </div>
                    )}
                    {oc.atividades_vinculadas?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {oc.atividades_vinculadas.map(id => (
                          <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            {atividadeNome(id)}
                          </span>
                        ))}
                      </div>
                    )}
                    {pleito && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">🔗 Pleito: {pleito.titulo}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Evidências */}
        {rdo.evidencias?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">📷 Evidências</p>
            <div className="flex flex-wrap gap-2">
              {rdo.evidencias.map((ev, i) => (
                <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-blue-600 dark:text-blue-400 hover:bg-muted transition-colors">
                  {ev.nome}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
