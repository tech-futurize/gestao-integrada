import { Users2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

function FuncoesContent() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Funções</p>
          <p className="text-xs text-muted-foreground">Cadastro de funções de mão de obra</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Users2 className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Em breve</p>
        <p className="text-xs text-muted-foreground/70 max-w-xs">
          O cadastro de funções estará disponível em breve.
        </p>
      </div>
    </div>
  );
}

export default function Funcoes({ asTab = false }) {
  if (asTab) return <FuncoesContent />;

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6">
        <FuncoesContent />
      </div>
    </div>
  );
}
