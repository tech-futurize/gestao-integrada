import { useState, useRef, useEffect, memo } from "react";
import { Send, Loader2, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useProject } from "@/lib/ProjectContext";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useAuth } from "@/lib/AuthContext";
import { useAgentTelemetry } from "@/hooks/useAgentTelemetry";
import { supabase } from "@/lib/supabaseClient";

export default function AgenteChat({ agent }) {
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const AgentIcon = agent.icon;
  const { selectedProjectId } = useProject();
  const { user } = useAuth();
  const logTelemetry = useAgentTelemetry();

  const { data: projetos = [] } = useQuery({
    queryKey: ["projeto_agente", selectedProjectId],
    queryFn: () => entities.Projeto.filter({ id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });
  const project = projetos[0] ?? null;

  // Reinicia a conversa ao trocar de projeto ou de agente — aborta o stream em
  // curso, senão as escritas do stream antigo vazariam para o chat novo
  useEffect(() => {
    abortRef.current?.abort();
    setMessages([]);
    setThreadId(crypto.randomUUID());
  }, [selectedProjectId, agent.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Aborta stream pendente ao desmontar o componente
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const buildApiMessages = (history, newContent) => {
    const userMessages = [...history, { role: "user", content: newContent }];

    if (!project) return userMessages;

    const systemMessage = {
      role: "system",
      content: [
        "Você está operando no contexto do seguinte projeto de engenharia/construção:",
        `- Nome: ${project.nome}`,
        `- ID do projeto: ${project.id}`,
        `- Cliente: ${project.cliente || "Não informado"}`,
        "",
        "Sempre que o usuário solicitar dados, análises ou consultas, use este projeto como referência padrão.",
        `Ao filtrar dados no banco, utilize projeto_id = "${project.id}".`,
        "Não mencione este contexto explicitamente nas respostas, apenas aplique-o silenciosamente.",
      ].join("\n"),
    };

    return [systemMessage, ...userMessages];
  };

  const sendMessage = async (text = input.trim()) => {
    if (!text || isStreaming) return;

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    const assistantIndex = updatedMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;
    const startTime = Date.now();

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      // Token da sessão como Bearer (não a anon key): permite à Edge Function
      // autenticar o usuário real e derivar o e-mail do JWT verificado
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada — faça login novamente.");
      const response = await fetch(`${supabaseUrl}/functions/v1/agent-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          agentSlug: agent.id,
          messages: buildApiMessages(messages, text),
          projectId: selectedProjectId,
          userEmail: user?.email,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Erro ${response.status}: ${body || response.statusText || "falha na Edge Function"}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      const applyDelta = () => {
        setMessages((prev) => {
          // stream antigo após reset: índice fora do array — ignora em vez de
          // criar array esparso (que quebrava o render com msg undefined)
          if (assistantIndex >= prev.length) return prev;
          const updated = [...prev];
          updated[assistantIndex] = { role: "assistant", content: accumulated };
          return updated;
        });
      };

      const processLine = (line) => {
        if (!line.startsWith("data: ")) return;
        const raw = line.slice(6).trim();
        if (!raw) return;
        try {
          const event = JSON.parse(raw);
          if (event.type === "text-delta" && event.payload?.text) {
            accumulated += event.payload.text;
            applyDelta();
          }
        } catch { /* evento malformado */ }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // buffer entre reads: uma linha "data:" dividida em dois chunks era
        // descartada em silêncio e palavras sumiam da resposta
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) processLine(line);
      }
      if (buffer) processLine(buffer);

      logTelemetry({
        agenteSlug: agent.id,
        modelo: agent.modelo || 'gpt-4o-mini',
        provider: agent.provider || 'openai',
        usuarioEmail: user?.email,
        projetoId: selectedProjectId,
        latenciaMs: Date.now() - startTime,
        threadId,
        status: 'success',
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = {
          role: "assistant",
          content: `Erro ao conectar com o agente: ${err.message}`,
        };
        return updated;
      });
      logTelemetry({
        agenteSlug: agent.id,
        modelo: agent.modelo || 'gpt-4o-mini',
        provider: agent.provider || 'openai',
        usuarioEmail: user?.email,
        projetoId: selectedProjectId,
        latenciaMs: Date.now() - startTime,
        threadId,
        status: 'error',
      });
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-muted/20">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: (agent.cor || '#26405d') + '22' }}
            >
              <AgentIcon className="w-8 h-8" style={{ color: agent.cor || '#26405d' }} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">{agent.name}</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">{agent.description}</p>
            </div>
            {!project && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-status-attention/10 border border-status-attention/20 text-xs text-status-attention font-medium max-w-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Selecione um projeto no menu lateral para que o agente filtre os dados automaticamente.
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 mt-2 text-left w-full max-w-md">
              {agent.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:border-primary/50 hover:bg-muted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} cor={agent.cor} AgentIcon={AgentIcon} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bg-background border-t border-border px-4 py-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Pergunte ao ${agent.name}...`}
            rows={1}
            disabled={isStreaming}
            className={`flex-1 resize-none border border-border bg-background text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none ${agent.ring || "focus:ring-2 focus:ring-primary/30"} disabled:opacity-50 min-h-[44px] max-h-32 overflow-y-auto placeholder:text-muted-foreground`}
            style={{ lineHeight: "1.5" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
            }}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="h-11 w-11 p-0 rounded-xl flex-shrink-0 text-white hover:opacity-90"
            style={{ background: agent.cor || '#26405d' }}
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">As respostas são geradas por Inteligência Artificial e podem conter imprecisões. Não substituem validação técnica ou profissional.</p>
      </div>
    </div>
  );
}

// Memoizado: durante o stream cada text-delta atualiza só a última mensagem —
// sem memo, todas as anteriores re-parseavam o markdown a cada token
const ChatMessage = memo(function ChatMessage({ msg, cor, AgentIcon }) {
  if (!msg) return null;
  return (
    <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {msg.role === "assistant" && (
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: cor || '#26405d' }}
        >
          <AgentIcon className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          msg.role === "user"
            ? "text-white rounded-tr-sm"
            : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"
        }`}
        style={msg.role === "user" ? { background: cor || '#26405d' } : undefined}
      >
        {msg.role === "assistant" ? (
          msg.content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )
        ) : (
          msg.content
        )}
      </div>
      {msg.role === "user" && (
        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center mt-0.5">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
});
