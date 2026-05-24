import React, { useState, useRef, useEffect } from "react";
import { Terminal, Send, TrendingUp, FileText, Landmark, ShieldCheck, Loader2 } from "lucide-react";

interface AiTerminalProps {
  onAnalyze: (prompt: string) => Promise<{ text: string; isSimulated: boolean }>;
}

export default function AiTerminal({ onAnalyze }: AiTerminalProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{ q: string; timestamp: string }>>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Run default analysis on boot
    handleFastCommand("Generar reporte de mercado");
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery("");
    await executeQuery(userQuery);
  };

  const executeQuery = async (promptText: string) => {
    setIsLoading(true);
    setResponse(null);
    const startTime = Date.now();
    
    // Add to local terminal trace history
    const timestamp = new Date().toLocaleTimeString();
    setHistory((prev) => [{ q: promptText, timestamp }, ...prev.slice(0, 9)]);

    try {
      const result = await onAnalyze(promptText);
      const duration = Date.now() - startTime;
      setLatency(duration);
      setResponse(result.text);
      setIsSimulated(result.isSimulated);
    } catch (e) {
      setResponse(
        `## [ERROR EN RED TERMINAL]\nNo se pudo verificar respuesta. Restableciendo conexión remota con el motor de IA...\n\nSugerencia: Confirme que el servidor está en ejecución local.`
      );
      setLatency(null);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const handleFastCommand = (command: string) => {
    if (isLoading) return;
    executeQuery(command);
  };

  // Helper to colorize specific patterns for terminal output (lines, numbers, tags)
  const renderFormattedResponse = (text: string) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Direct title formatting
      if (line.startsWith("[") || line.startsWith("##") || line.startsWith("###")) {
        return (
          <div key={idx} className="text-emerald-400 font-bold tracking-wider uppercase text-xs pt-3 pb-1 border-b border-zinc-800/60 mb-2 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-emerald-500 rounded-sm"></span>
            {line.replace(/[#\[\]]/g, "").trim()}
          </div>
        );
      }
      
      // Secondary bullet point structure
      if (line.trim().startsWith("-") || /^\d+\./.test(line.trim())) {
        return (
          <div key={idx} className="pl-4 py-1.5 text-zinc-300 text-sm leading-relaxed font-mono relative">
            <span className="absolute left-0 top-2.5 text-emerald-500 text-xs">•</span>
            {line.split(/(\+?\-?\d+\.?\d*%?|\d+x|\$\d+\.?\d*[BM]?)/g).map((part, pIdx) => {
              // Highlight numerical financial indicators
              const isHighlight = /^\+?\-?\d+\.?\d*%?$/.test(part) || /^\d+x$/.test(part) || /^\$\d+\.?\d*[BM]?$/.test(part);
              return (
                <span key={pIdx} className={isHighlight ? "text-amber-400 font-semibold bg-amber-400/10 px-1 py-0.5 rounded-sm" : ""}>
                  {part}
                </span>
              );
            })}
          </div>
        );
      }

      // Check standard paragraphs
      if (line.trim() === "") return <div key={idx} className="h-2"></div>;

      return (
        <p key={idx} className="text-zinc-400 text-sm leading-relaxed font-mono py-1">
          {line.split(/(\+?\-?\d+\.?\d*%?|\d+x|\$\d+\.?\d*[BM]?)/g).map((part, pIdx) => {
            const isHighlight = /^\+?\-?\d+\.?\d*%?$/.test(part) || /^\d+x$/.test(part) || /^\$\d+\.?\d*[BM]?$/.test(part);
            return (
              <span key={pIdx} className={isHighlight ? "text-emerald-400 font-medium bg-emerald-500/10 px-1 rounded" : ""}>
                {part}
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="text-emerald-400 w-4 h-4" />
          <span className="font-semibold text-zinc-200">GLOBAL CAPITAL ANALYTICS CORESYSTEM</span>
        </div>
        <div className="flex items-center gap-4">
          {latency && (
            <span className="text-zinc-500">
              RTT: <span className="text-zinc-300 font-bold">{latency}ms</span>
            </span>
          )}
          {isSimulated ? (
            <span className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              Core Resp (Offline Backup)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Live Gemini Engine Active
            </span>
          )}
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div className="p-4 flex-1 overflow-y-auto font-mono max-h-[360px] min-h-[220px] bg-black/40">
        <div className="text-zinc-500 text-[10px] mb-4 border-b border-zinc-900 pb-2">
          SYSTEM_ESTABLISHED: OK // MODEL: gemini-3.5-flash // TARGET: PORT-3000-PROXY
        </div>

        {response ? (
          <div className="space-y-2">
            {renderFormattedResponse(response)}
            <div ref={outputRef} />
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <div className="text-xs tracking-widest text-emerald-400 animate-pulse uppercase">
              Procesando solicitud cuantitativa de IA. Evaluando YoY%...
            </div>
            <div className="text-[10px] font-mono text-zinc-600">
              Querying backend server proxy at Port 3000...
            </div>
          </div>
        ) : (
          <div className="text-zinc-500 text-sm italic py-8 text-center">
            Consola en espera de solicitudes del analista de inversión.
          </div>
        )}
      </div>

      {/* Quick Launchpad */}
      <div className="bg-zinc-900/60 p-3 border-t border-zinc-800 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono mr-1">Comandos rápidos:</span>
        <button
          onClick={() => handleFastCommand("Buscar tendencias Q2 2026")}
          disabled={isLoading}
          className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 active:border-emerald-500/40 text-emerald-400 text-xs py-1.5 px-3 rounded flex items-center gap-1.5 transition-all font-mono disabled:opacity-50"
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          Buscar tendencias Q2 2026
        </button>
        <button
          onClick={() => handleFastCommand("Generar reporte de mercado")}
          disabled={isLoading}
          className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 active:border-emerald-500/40 text-amber-500 text-xs py-1.5 px-3 rounded flex items-center gap-1.5 transition-all font-mono disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          Generar reporte de mercado
        </button>
        <button
          onClick={() => handleFastCommand("Explicar impacto financiero del EU AI Act en Q2 2026")}
          disabled={isLoading}
          className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 active:border-emerald-500/40 text-blue-400 text-xs py-1.5 px-3 rounded flex items-center gap-1.5 transition-all font-mono disabled:opacity-50"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          Impacto EU AI Act
        </button>
        <button
          onClick={() => handleFastCommand("Detallar flujo de capital geográfico en fundiciones de chips")}
          disabled={isLoading}
          className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 active:border-emerald-500/40 text-indigo-400 text-xs py-1.5 px-3 rounded flex items-center gap-1.5 transition-all font-mono disabled:opacity-50"
        >
          <Landmark className="w-3.5 h-3.5 text-indigo-500" />
          Chips CapEx
        </button>
      </div>

      {/* Command input form */}
      <form onSubmit={handleSubmit} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
        <span className="text-emerald-500 font-bold ml-1 text-sm font-mono">&gt;_</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escriba consulta macrofinanciera de IA aquí (ej: 'Valuación promedio M&A')"
          disabled={isLoading}
          className="bg-transparent text-zinc-200 outline-none flex-1 text-sm font-mono placeholder-zinc-600 focus:placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-zinc-800 hover:bg-emerald-600 border border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-white p-2 rounded transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-zinc-800"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
