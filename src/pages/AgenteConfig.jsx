import React, { useState, useEffect } from "react";
import { Settings2, ExternalLink, WifiOff, RefreshCw } from "lucide-react";

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || "http://localhost:4111";

export default function AgenteConfig() {
  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setLoadError(false);
    fetch(MASTRA_URL, { mode: "no-cors", signal: AbortSignal.timeout(4000) })
      .catch(() => setLoadError(true));
  }, [key]);

  const retry = () => {
    setKey(k => k + 1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-brand-accent" />
          <span className="font-semibold text-brand-primary text-sm">Mastra Studio — Gerenciamento de Agentes</span>
        </div>
        <div className="flex items-center gap-3">
          {loadError && (
            <button
              onClick={retry}
              className="flex items-center gap-1.5 text-xs text-brand-accent hover:opacity-80 transition-opacity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          )}
          <a
            href={MASTRA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-accent transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir em nova aba
          </a>
        </div>
      </div>

      {loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-700 text-base">Mastra Studio não encontrado</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              O servidor Mastra não está acessível em{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">{MASTRA_URL}</code>.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Execute <code className="bg-gray-100 rounded px-1">npm run dev</code> dentro da pasta{" "}
              <code className="bg-gray-100 rounded px-1">/mastra</code> para iniciar o servidor.
            </p>
          </div>
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      ) : (
        <iframe
          key={key}
          src={MASTRA_URL}
          className="flex-1 w-full border-0"
          title="Mastra Studio"
          allow="clipboard-write"
        />
      )}
    </div>
  );
}
