import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Settings2, Wifi, WifiOff } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const MASTRA_BASE = import.meta.env.VITE_MASTRA_URL || "http://localhost:4111";

const AGENTS = [
  {
    id: "executor-dados",
    name: "Executor de Dados",
    description: "Consulta e manipula dados do projeto via linguagem natural. Executa queries, gera relatórios e filtra informações.",
    icon: "🤖",
    color: "#3b82f6",
    endpoint: `${MASTRA_BASE}/api/agents/executor-dados/chat`,
  },
  {
    id: "analista-negocio",
    name: "Analista de Negócio",
    description: "Analisa KPIs, identifica desvios e fornece insights estratégicos sobre o desempenho do projeto.",
    icon: "📊",
    color: "#8b5cf6",
    endpoint: `${MASTRA_BASE}/api/agents/analista-negocio/chat`,
  },
  {
    id: "analista-contratual",
    name: "Analista Contratual",
    description: "Analisa pleitos, mudanças e riscos contratuais. Fornece pareceres técnicos e recomendações jurídicas.",
    icon: "⚖️",
    color: "#c35e1e",
    endpoint: `${MASTRA_BASE}/api/agents/analista-contratual/chat`,
  },
];

export default function AgenteConfig() {
  const [mastraStatus, setMastraStatus] = useState("checking"); // checking | online | offline
  const [checking, setChecking] = useState(false);

  const checkMastra = async () => {
    setChecking(true);
    setMastraStatus("checking");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/mastra-api/api', { signal: controller.signal });
      clearTimeout(timeout);
      setMastraStatus(res.ok ? "online" : "offline");
    } catch {
      setMastraStatus("offline");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { checkMastra(); }, []);

  const statusConfig = {
    checking: { icon: RefreshCw, color: "#9ca3af", label: "Verificando...", className: "animate-spin" },
    online: { icon: Wifi, color: "#16a34a", label: "Online", className: "" },
    offline: { icon: WifiOff, color: "#ef4444", label: "Offline", className: "" },
  };

  const sc = statusConfig[mastraStatus];
  const StatusIcon = sc.icon;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button variant="outline" onClick={checkMastra} disabled={checking}>
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Verificar Conectividade
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Status Mastra */}
      <Card className={`border-2 ${mastraStatus === "online" ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10" : mastraStatus === "offline" ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10" : "border-border"}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: sc.color + "20" }}>
            <StatusIcon className={`w-6 h-6 ${sc.className}`} style={{ color: sc.color }} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Mastra Framework</p>
            <p className="text-sm text-muted-foreground">{MASTRA_BASE}</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: sc.color }}>
              {sc.label}
            </p>
          </div>
          {mastraStatus === "offline" && (
            <div className="ml-auto p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300 max-w-sm">
              <p className="font-medium mb-1">Como iniciar o Mastra:</p>
              <code className="block bg-black/10 px-2 py-1 rounded font-mono text-xs">npm run dev</code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards dos Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map(agent => (
          <Card key={agent.id} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: agent.color + "15" }}>
                  {agent.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-bold text-foreground leading-tight">{agent.name}</CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${mastraStatus === "online" ? "bg-green-500" : "bg-red-400"}`} />
                    <span className="text-xs text-muted-foreground">{mastraStatus === "online" ? "Disponível" : "Indisponível"}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              <div className="mt-3 p-2 bg-muted/60 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Endpoint:</p>
                <code className="text-xs font-mono text-foreground break-all">{agent.endpoint}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Settings2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Como funciona</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Os agentes de IA são executados pelo Mastra Framework localmente na porta 4111.
                Para usar os agentes, inicie o servidor Mastra e acesse cada agente pelo menu lateral
                em &quot;Agentes de IA&quot;. Os agentes têm acesso ao contexto do projeto selecionado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
