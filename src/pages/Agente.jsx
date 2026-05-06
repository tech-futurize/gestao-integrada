import React, { useState, useRef, useEffect } from "react";
import { Bot, BrainCircuit, Scale, Send, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useProject } from "@/lib/ProjectContext";

const AGENTS = [
  {
    id: "supabase-analyst-agent",
    name: "Executor de Dados",
    icon: Bot,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100",
    activeColor: "text-blue-600 border-blue-600",
    description: "Consultas diretas à base de dados. Busca e retorna informações específicas do projeto.",
    color: "bg-blue-600",
    ring: "focus:ring-blue-400/30 focus:border-blue-500",
    btnColor: "bg-blue-600 hover:bg-blue-700",
    suggestions: [
      "Quantos projetos existem no sistema?",
      "Liste os contratos ativos com seus valores.",
      "Qual é o histórico de mão de obra do mês passado?",
      "Quais são os riscos mais críticos cadastrados?",
    ],
  },
  {
    id: "business-analyst-agent",
    name: "Analista de Negócio",
    icon: BrainCircuit,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-100",
    activeColor: "text-indigo-600 border-indigo-600",
    description: "Análises comparativas e históricas. Refina os parâmetros da solicitação antes de executar para entregar análises direcionadas e objetivas.",
    color: "bg-indigo-600",
    ring: "focus:ring-indigo-400/30 focus:border-indigo-400",
    btnColor: "bg-indigo-600 hover:bg-indigo-700",
    suggestions: [
      "Como está o desempenho do histograma de mão de obra no último mês?",
      "Quais contratos estão com prazo vencido ou próximo do vencimento?",
      "Compare o avanço físico planejado vs realizado nas últimas 4 semanas.",
      "Quais são os riscos críticos abertos há mais tempo?",
    ],
  },
  {
    id: "contractual-analyst-agent",
    name: "Analista Contratual",
    icon: Scale,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-100",
    activeColor: "text-emerald-600 border-emerald-600",
    description: "Elabora respostas formais a cartas de notificação, emails e atas de reunião com base nos registros de pleitos do projeto.",
    color: "bg-emerald-600",
    ring: "focus:ring-emerald-400/30 focus:border-emerald-500",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
    suggestions: [
      "Quero elaborar uma resposta a uma carta de notificação sobre atraso.",
      "Preciso redigir um email formal sobre o pleito de variação de quantitativos.",
      "Me ajude a responder a ata de reunião mais recente.",
      "Liste os pleitos abertos para eu escolher qual responder.",
    ],
  },
];

export default function Agente() {
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const agent = AGENTS[selectedAgentIndex];
  const { selectedProjectId } = useProject();
  const AgentIcon = agent.icon;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const switchAgent = (index) => {
    if (index === selectedAgentIndex) return;
    abortRef.current?.abort();
    abortRef.current = null;
    setSelectedAgentIndex(index);
    setMessages([]);
    setThreadId(crypto.randomUUID());
    setInput("");
    setIsStreaming(false);
  };

  const buildApiMessages = (history, newContent) => {
    const all = [...history, { role: "user", content: newContent }];

    return all.map((m, i) => {
      if (i === 0 && m.role === "user" && selectedProjectId) {
        return { role: "user", content: `[Projeto ativo: ${selectedProjectId}]\n\n${m.content}` };
      }
      return m;
    });
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

    try {
      const response = await fetch(`/mastra-api/api/agents/${agent.id}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: buildApiMessages(messages, text),
          threadId,
          resourceId: "user-session",
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === "text-delta" && event.payload?.text) {
              accumulated += event.payload.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = { role: "assistant", content: accumulated };
                return updated;
              });
            }
          } catch { /* chunk parcial */ }
        }
      }
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-0">
        {/* Tabs */}
        <div className="flex gap-1 mb-0">
          {AGENTS.map((a, i) => {
            const Icon = a.icon;
            const active = i === selectedAgentIndex;
            return (
              <button
                key={a.id}
                onClick={() => switchAgent(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all border-b-2 ${
                  active
                    ? `${a.activeColor} bg-gray-50`
                    : "border-transparent text-gray-400 hover:text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? a.iconColor : "text-gray-400"}`} />
                {a.name}
              </button>
            );
          })}
        </div>
        {/* Description bar */}
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-500">{agent.description}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className={`w-16 h-16 rounded-2xl ${agent.iconBg} flex items-center justify-center`}>
              <AgentIcon className={`w-8 h-8 ${agent.iconColor}`} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{agent.name}</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">{agent.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-2 text-left w-full max-w-md">
              {agent.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className={`w-8 h-8 rounded-full ${agent.color} flex-shrink-0 flex items-center justify-center mt-0.5`}>
                <AgentIcon className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? `${agent.color} text-white rounded-tr-sm`
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.content ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center mt-0.5">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Pergunte ao ${agent.name}...`}
            rows={1}
            disabled={isStreaming}
            className={`flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${agent.ring} disabled:opacity-50 min-h-[44px] max-h-32 overflow-y-auto`}
            style={{ lineHeight: "1.5" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
            }}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className={`${agent.btnColor} h-11 w-11 p-0 rounded-xl flex-shrink-0`}
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  );
}
