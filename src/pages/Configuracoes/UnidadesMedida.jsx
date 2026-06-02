import { Ruler } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { UNIDADES_MEDIDA } from "@/lib/unidadesMedida";

export default function UnidadesMedida() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Lista gerenciada via código</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Esta lista é a fonte única de unidades de medida do sistema — usada em Suprimentos, Take-Off,
              Medições e demais módulos. Para adicionar ou remover uma unidade, edite o arquivo{" "}
              <code className="font-mono bg-blue-100 dark:bg-blue-800 rounded px-1">src/lib/unidadesMedida.js</code>{" "}
              e faça deploy.
            </p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Unidades de Medida — {UNIDADES_MEDIDA.length} cadastradas
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Und</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
              </tr>
            </thead>
            <tbody>
              {UNIDADES_MEDIDA.map((u, i) => (
                <tr
                  key={u.sigla}
                  className={`border-b border-border/50 ${i % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                >
                  <td className="px-5 py-3">
                    <span className="inline-block font-mono text-xs font-bold bg-muted text-foreground rounded px-2 py-0.5">
                      {u.sigla}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground">{u.nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
