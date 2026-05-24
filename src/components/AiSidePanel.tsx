import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, Brain, ChevronRight, ChevronLeft, Globe, 
  Settings, AlertTriangle, Play, Sparkles, Send, RefreshCw, Eye
} from "lucide-react";
import { InfraProject, IndexDataset, NewsItem, AiResponse } from "../types";

interface AiSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedProject: InfraProject | null;
  allProjects: InfraProject[];
  onSelectProject: (project: InfraProject | null) => void;
  indices: IndexDataset | null;
  news: NewsItem[];
  onAnalyze: (prompt: string) => Promise<AiResponse>;
  
  // Settings linkages from parent states
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showOnlyConfirmed: boolean;
  onToggleShowOnlyConfirmed: () => void;
  showConnections: boolean;
  onToggleShowConnections: () => void;
  filterSector: string;
  onChangeFilterSector: (sector: string) => void;
  filterStatus: string[];
  onChangeFilterStatus: (status: string[]) => void;
}

interface Message {
  role: "user" | "ai";
  text: string;
  timestamp: string;
}

export default function AiSidePanel({
  isOpen,
  onToggle,
  selectedProject,
  allProjects,
  onSelectProject,
  indices,
  news,
  onAnalyze,

  autoRotate,
  onToggleAutoRotate,
  showOnlyConfirmed,
  onToggleShowOnlyConfirmed,
  showConnections,
  onToggleShowConnections,
  filterSector,
  onChangeFilterSector,
  filterStatus,
  onChangeFilterStatus,
}: AiSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"market" | "geo" | "risk" | "settings">("market");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [geoAnalysis, setGeoAnalysis] = useState<string>("");
  const [geoLoading, setGeoLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-generate market brief on load
  useEffect(() => {
    const fetchInitialBrief = async () => {
      setIsAiLoading(true);
      try {
        const response = await onAnalyze("Generar breve reporte del estado financiero global de IA de este trimestre.");
        setMessages([
          {
            role: "ai",
            text: response.text,
            timestamp: new Date().toLocaleTimeString(),
          }
        ]);
      } catch (err) {
        setMessages([
          {
            role: "ai",
            text: "[AI OFFLINE ADVISOR] Servidor no disponible temporalmente. Se ha cargado análisis predictivo en base de datos local para Q2 2026. Los índices sugieren robustez en semiconductores con resiliencia en márgenes logísticos globales.",
            timestamp: new Date().toLocaleTimeString(),
          }
        ]);
      } finally {
        setIsAiLoading(false);
      }
    };
    fetchInitialBrief();
  }, []);

  // Watch for selected project changes to switch to GEO tab and launch target analysis
  useEffect(() => {
    if (selectedProject) {
      setActiveTab("geo");
      triggerProjectAnalysis(selectedProject);
    }
  }, [selectedProject]);

  // Scroll terminal messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // Direct analysis lookup for a project
  const triggerProjectAnalysis = async (project: InfraProject) => {
    setGeoLoading(true);
    setGeoAnalysis("");
    try {
      const res = await fetch("/api/ai/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id })
      });
      if (res.ok) {
        const data = await res.json();
        setGeoAnalysis(data.text);
      } else {
        throw new Error("Analysis failed");
      }
    } catch {
      // Simulate standard offline high fidelity terminal lookup
      setTimeout(() => {
        setGeoAnalysis(`[OFFLINE SECURITY INSIGHT - ${project.id}]
TARGET CAPEX: ${project.amount}B ${project.currency}
PROYECTO: ${project.name}

1. POSICIONAMIENTO GEOPOLÍTICO:
   - Refuerza la autonomía digital en ${project.investorCountry} y mitiga la vulnerabilidad de cadenas de hardware externas de forma inmediata.
   
2. EXPOSICIÓN COMPETITIVA:
   - Incrementa de modo exponencial la barrera de entrada para otros consorcios tecnológicos en el sector ${project.sector}.

3. RECOMENDACIÓN DE RIESGOS:
   - Monitorear de cerca el cumplimiento normativo. Viabilidad local asegurada al 80% conforme con proyecciones operativas para ${project.operationsDate}.`);
      }, 500);
    } finally {
      setGeoLoading(false);
    }
  };

  // Submit free user input
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiLoading) return;

    const userText = input;
    setInput("");
    
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, { role: "user", text: userText, timestamp }]);
    setIsAiLoading(true);

    try {
      const response = await onAnalyze(userText);
      setMessages(prev => [...prev, { role: "ai", text: response.text, timestamp: new Date().toLocaleTimeString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: `[ERROR] Excepción crítica de red en transceptor IA. Operaciones simuladas nominales. INTENT: "${userText}"`,
        timestamp: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick Action Buttons
  const handleQuickAction = async (promptText: string) => {
    if (isAiLoading) return;
    setInput(promptText);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    
    // Smooth delay before firing query
    setTimeout(() => {
      // Create user message first
      setMessages(prev => [...prev, { role: "user", text: promptText, timestamp: new Date().toLocaleTimeString() }]);
      setIsAiLoading(true);
      onAnalyze(promptText).then(response => {
        setMessages(prev => [...prev, { role: "ai", text: response.text, timestamp: new Date().toLocaleTimeString() }]);
      }).catch(() => {
        setMessages(prev => [...prev, { 
          role: "ai", 
          text: `[ERROR] No se pudo obtener respuesta del servidor de Inteligencia para "${promptText}".`,
          timestamp: new Date().toLocaleTimeString() 
        }]);
      }).finally(() => {
        setIsAiLoading(false);
        setInput("");
      });
    }, 100);
  };

  // Color text formatter to highlight ratios and stock percentages in green/yellow
  const styleResponseText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // highlight index markers, percentage, USD or B letters
      let coloredLine = line;
      
      // Numbers or percentages highlight
      const hasPositiveNum = /(\+\d+\.?\d*%\s*YoY|\b\d+\.?\d*%\b|\+\d+\.?\d*%|\b\d+\.?\d*B\b|\b\d+\.?\d*x\b)/g;
      
      if (line.startsWith("[") || line.startsWith("TEMA") || line.startsWith("TARGET") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
        return (
          <div key={idx} className="text-[#00FF41] font-bold tracking-tight text-[11.5px] mt-1.5 mb-0.5">
            {line}
          </div>
        );
      }
      return (
        <p key={idx} className="text-zinc-300 leading-relaxed text-[11px] font-sans pr-1">
          {line}
        </p>
      );
    });
  };

  // Find nearest projects geographically
  const getRelatedProjects = (active: InfraProject) => {
    return allProjects
      .filter(p => p.id !== active.id)
      .map(p => {
        const dist = Math.sqrt(Math.pow(p.lat - active.lat, 2) + Math.pow(p.lng - active.lng, 2));
        return { project: p, dist };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map(item => item.project);
  };

  const selectedRelated = selectedProject ? getRelatedProjects(selectedProject) : [];

  return (
    <div 
      style={{ width: isOpen ? "380px" : "48px" }}
      className="h-full bg-[#0A0A0A] border-l border-[#222] flex flex-col transition-all duration-300 relative z-30 select-none overflow-hidden"
    >
      {/* Expand/Collapse Handle Bar */}
      <button
        onClick={onToggle}
        className="absolute left-[-11px] top-[45%] bg-[#0A0A0A] border border-[#333] hover:border-[#00FF41] rounded-full p-0.5 text-[#00FF41] hover:bg-black transition-colors z-40 shadow-[0_0_10px_rgba(0,0,255,0.4)] cursor-pointer"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* COLLAPSED MINI-BAR PORT STATE */}
      {!isOpen ? (
        <div className="flex flex-col items-center py-4 gap-6 h-full font-mono text-zinc-500">
          <button onClick={onToggle} className="text-[#00FF41] hover:text-white transition cursor-pointer">
            <Brain className="w-5 h-5 animate-pulse" />
          </button>
          
          <div className="flex-1 flex flex-col justify-center gap-10">
            <button 
              onClick={() => { onToggle(); setActiveTab("market"); }}
              className={`p-1 uppercase tracking-widest text-[10px] transform -rotate-90 origin-center whitespace-nowrap ${
                activeTab === "market" ? "text-[#00FF41] font-bold" : "hover:text-white"
              }`}
            >
              MKT_INT
            </button>
            <button 
              onClick={() => { onToggle(); setActiveTab("geo"); }}
              className={`p-1 uppercase tracking-widest text-[10px] transform -rotate-90 origin-center whitespace-nowrap ${
                activeTab === "geo" ? "text-[#00FF41] font-bold" : "hover:text-white"
              }`}
            >
              GEO_INT
            </button>
            <button 
              onClick={() => { onToggle(); setActiveTab("risk"); }}
              className={`p-1 uppercase tracking-widest text-[10px] transform -rotate-90 origin-center whitespace-nowrap ${
                activeTab === "risk" ? "text-[#00FF41] font-bold" : "hover:text-white"
              }`}
            >
              RISK_MON
            </button>
          </div>
          
          <button 
            onClick={() => { onToggle(); setActiveTab("settings"); }}
            className="text-zinc-600 hover:text-white transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* EXPANDED PANEL LAYOUT */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="p-3 border-b border-[#222] flex items-center justify-between bg-black/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00FF41] animate-pulse" />
              <h1 className="text-xs font-bold uppercase tracking-tight text-white flex items-center gap-1.5">
                ⚡ AI INTELLIGENCE CORE
              </h1>
            </div>
            <span className="text-[9px] text-[#00FF41] bg-[#00FF41]/10 px-1.5 py-0.2 rounded border border-[#00FF41]/20 font-bold">
              v5.0_LIVE
            </span>
          </header>

          {/* Navigation Tab selection */}
          <nav className="grid grid-cols-4 border-b border-[#222] bg-[#0D0D0D] text-[10px] font-bold select-none text-center">
            <button
              onClick={() => setActiveTab("market")}
              className={`py-2 border-r border-[#222] uppercase tracking-tighter ${
                activeTab === "market" ? "text-[#00FF41] bg-black border-b-[2px] border-b-[#00FF41]" : "text-zinc-500 hover:text-white hover:bg-black/20"
              }`}
            >
              MARKET
            </button>
            <button
              onClick={() => setActiveTab("geo")}
              className={`py-2 border-r border-[#222] uppercase tracking-tighter relative ${
                activeTab === "geo" ? "text-[#00FF41] bg-black border-b-[2px] border-b-[#00FF41]" : "text-zinc-500 hover:text-white hover:bg-black/20"
              }`}
            >
              GEO
              {selectedProject && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00FF41] rounded-full animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("risk")}
              className={`py-2 border-r border-[#222] uppercase tracking-tighter ${
                activeTab === "risk" ? "text-[#00FF41] bg-black border-b-[2px] border-b-[#00FF41]" : "text-zinc-500 hover:text-white hover:bg-black/20"
              }`}
            >
              RISK
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-2 uppercase tracking-tighter ${
                activeTab === "settings" ? "text-[#00FF41] bg-black border-b-[2px] border-b-[#00FF41]" : "text-zinc-500 hover:text-white hover:bg-black/20"
              }`}
            >
              SETTINGS
            </button>
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* TAB 1: MARKET INTELLIGENCE */}
            {activeTab === "market" && (
              <div className="space-y-4">
                {/* Micro market telemetry readout */}
                <div className="bg-black/40 border border-[#222] p-2 rounded text-[10px]/relaxed font-mono">
                  <span className="text-zinc-600 uppercase text-[8px] block tracking-widest font-bold">INDEX SPARK TELEMETRY</span>
                  <div className="grid grid-cols-3 gap-1.5 mt-1 text-center font-bold">
                    <div className="bg-[#111] p-1.5 rounded border border-[#1A1A1A]">
                      <span className="text-zinc-500 text-[8px] block">AITX</span>
                      <span className="text-[#00FF41]">134.5 ▲</span>
                    </div>
                    <div className="bg-[#111] p-1.5 rounded border border-[#1A1A1A]">
                      <span className="text-zinc-500 text-[8px] block">SOX-AI</span>
                      <span className="text-[#00FF41]">148.2 ▲</span>
                    </div>
                    <div className="bg-[#111] p-1.5 rounded border border-[#1A1A1A]">
                      <span className="text-zinc-500 text-[8px] block">ESIX</span>
                      <span className="text-amber-500">119.7 ▲</span>
                    </div>
                  </div>
                </div>

                {/* Live advisory feed terminal */}
                <div className="bg-[#0D0D0D] border border-[#222] rounded p-3 space-y-2.5 max-h-[200px] overflow-y-auto text-[11px] font-mono whitespace-pre-wrap">
                  <div className="text-[#00FF41] border-b border-[#1A1A1A] pb-1 uppercase font-bold text-[9px]">
                    &gt;_ ADVISOR_ADVICE_STREAM
                  </div>
                  {messages.length === 0 ? (
                    <span className="text-[#555] italic">Inicializando analista de portafolios...</span>
                  ) : (
                    messages.filter(m => m.role === "ai").slice(-1).map((m, i) => (
                      <div key={i} className="text-zinc-300">
                        {styleResponseText(m.text)}
                      </div>
                    ))
                  )}
                </div>

                {/* Quick actions triggers */}
                <div className="space-y-2">
                  <span className="text-zinc-600 uppercase text-[8px] tracking-wider block font-bold">QUICK EXECUTIVE INQUIRIES</span>
                  <button
                    onClick={() => handleQuickAction("Buscar tendencias Q2 2026")}
                    className="w-full text-left bg-black hover:bg-[#111] border border-[#222] hover:border-[#333] p-2.5 rounded text-[11px] font-mono text-zinc-300 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span>&gt;_ Buscar tendencias Q2 2026</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#00FF41] opacity-0 group-hover:opacity-100 transition" />
                  </button>
                  <button
                    onClick={() => handleQuickAction("Generar reporte de mercado")}
                    className="w-full text-left bg-black hover:bg-[#111] border border-[#222] hover:border-[#333] p-2.5 rounded text-[11px] font-mono text-zinc-300 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span>&gt;_ Generar reporte de mercado</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#00FF41] opacity-0 group-hover:opacity-100 transition" />
                  </button>
                  <button
                    onClick={() => handleQuickAction("Analizar proyección de CapEx consolidado para fábricas de chips")}
                    className="w-full text-left bg-black hover:bg-[#111] border border-[#222] hover:border-[#333] p-2.5 rounded text-[11px] font-mono text-zinc-300 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span>&gt;_ CapEx Forecast (Fábricas Chips)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#00FF41] opacity-0 group-hover:opacity-100 transition" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: GEOPOLITICAL INTELLIGENCE */}
            {activeTab === "geo" && (
              <div className="space-y-4">
                {!selectedProject ? (
                  <div className="bg-[#0D0D0D] border border-[#222] p-4 rounded text-center text-zinc-600 text-xs font-mono space-y-2 py-8">
                    <Globe className="w-8 h-8 mx-auto text-zinc-800 animate-pulse" />
                    <p className="uppercase font-bold tracking-tight">NINGÚN PIN SELECCIONADO</p>
                    <p className="text-[10px] text-zinc-500">Seleccione un nodo en el globo 3D para decodificar flujos de capital e impacto geopolítico.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Selected project details card */}
                    <div className="bg-black/40 border border-[#00FF41]/20 rounded p-3 text-[10.5px] font-mono relative">
                      {/* Accent vertical line inside */}
                      <div className="absolute top-0 bottom-0 left-0 w-[2.5px] bg-[#00FF41]"></div>
                      <span className="text-[9px] text-[#00FF41] uppercase tracking-wider block font-bold mb-1 pl-2">DETALLES DE INFRAESTRUCTURA</span>
                      <h3 className="text-white text-xs font-bold uppercase pl-2 leading-tight block truncate pr-5" title={selectedProject.name}>
                        {selectedProject.name}
                      </h3>
                      
                      <div className="mt-2.5 space-y-1.5 text-zinc-300 pl-2">
                        <div className="flex justify-between border-b border-[#1A1A1A] pb-1.5">
                          <span className="text-zinc-500">SECTOR</span>
                          <span className="text-white font-semibold">{selectedProject.sector}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1A1A1A] pb-1.5">
                          <span className="text-zinc-500">INVERSIONISTA</span>
                          <span className="text-[#00BFFF] font-bold">{selectedProject.investor}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1A1A1A] pb-1.5">
                          <span className="text-zinc-500">MONTO DE CAPITAL</span>
                          <span className="text-[#00FF41] font-bold">{selectedProject.currency} {selectedProject.amount}B</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1A1A1A] pb-1.5">
                          <span className="text-zinc-500">CAPACIDAD DEL NODO</span>
                          <span className="text-zinc-300 truncate max-w-[190px]" title={selectedProject.capacity}>{selectedProject.capacity}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1A1A1A] pb-1.5">
                          <span className="text-zinc-500">ARRANQUE</span>
                          <span className="text-amber-500 font-bold">{selectedProject.operationsDate}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-zinc-500">ROI ANUAL ESP.</span>
                          <span className="text-white font-bold">+{selectedProject.annualROI}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Geopolitical text analysis generated/simulated by Gemini */}
                    <div className="bg-[#0D0D0D] border border-[#222] p-3 rounded font-mono text-[11px] relative min-h-[140px]">
                      <div className="text-white uppercase font-bold text-[9px] border-b border-[#161616] pb-1.5 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#00FF41] animate-spin" />
                        &gt;_ EX_ANTE_GEOPOLITICAL_ANALYSIS
                      </div>
                      {geoLoading ? (
                        <div className="absolute inset-0 bg-[#0D0D0D]/90 flex flex-col items-center justify-center text-zinc-500 border border-[#222]">
                          <Sparkles className="w-4 h-4 text-[#00FF41] animate-bounce" />
                          <span className="text-[9px] uppercase tracking-wider text-[#00FF41] animate-pulse mt-1">Conectando con Advisor Engine...</span>
                        </div>
                      ) : (
                        <div className="text-zinc-300 space-y-2 whitespace-pre-wrap max-h-[180px] overflow-y-auto pr-1">
                          {styleResponseText(geoAnalysis)}
                        </div>
                      )}
                    </div>

                    {/* Button to analyze the whole region */}
                    <button
                      onClick={() => handleQuickAction(`Analizar impacto macro y riesgos geopolíticos de la región: ${selectedProject.investorCountry}`)}
                      className="w-full bg-[#00FF41]/10 border border-[#00FF41]/30 hover:bg-[#00FF41] hover:text-black hover:font-bold text-[#00FF41] p-1.5 rounded transition text-[10px] uppercase font-mono tracking-tight cursor-pointer"
                    >
                      Analizar región completa ({selectedProject.investorCountry})
                    </button>

                    {/* Geographically or sector related nearby projects */}
                    <div className="space-y-1.5">
                      <span className="text-zinc-600 uppercase text-[8px] tracking-wide block font-bold">NODOS DE RELACIÓN DIRECTA</span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {selectedRelated.map((proj) => (
                          <div
                            key={proj.id}
                            onClick={() => onSelectProject(proj)}
                            className="bg-black hover:bg-[#111] border border-[#1A1A1A] p-2 rounded flex justify-between items-center text-[10px] font-mono cursor-pointer transition select-none hover:border-[#333]"
                          >
                            <div className="truncate max-w-[210px]">
                              <span className="text-[#00FF41] font-bold block truncate">
                                {proj.name}
                              </span>
                              <span className="text-zinc-500 block text-[8px] truncate">
                                {proj.sector} // {proj.investorCountry}
                              </span>
                            </div>
                            <span className="text-white font-extrabold bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded text-[8px]">
                              {proj.currency} {proj.amount}B
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RISK MONITOR */}
            {activeTab === "risk" && (
              <div className="space-y-4">
                {/* 2x2 Interactive Risk Matrix Visual */}
                <div className="space-y-2">
                  <span className="text-zinc-600 uppercase text-[8px] tracking-wide block font-bold">MATRIZ DE RIESGO COGNITIVO 2x2</span>
                  <div className="border border-[#222] bg-black/40 rounded p-3 text-[10px] font-mono select-none relative">
                    {/* Matrix Labels decoration */}
                    <div className="absolute top-2 left-2 text-[8px] text-zinc-500">I_PROB ▲</div>
                    <div className="absolute bottom-2 right-2 text-[8px] text-zinc-500">I_IMPACT ▶</div>

                    <div className="grid grid-cols-2 gap-2 h-32 relative">
                      {/* Quadrant Q2: High Prob, Low Impact */}
                      <div className="border border-[#222]/30 p-1 flex flex-col justify-between bg-zinc-900/10">
                        <span className="text-zinc-600 text-[8px]">AMORTIZACIÓN</span>
                        <div className="flex flex-wrap gap-1">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" title="EU AI compliance costs"></span>
                        </div>
                      </div>
                      {/* Quadrant Q1: High Prob, High Impact */}
                      <div className="border border-[#222]/30 p-1 flex flex-col justify-between bg-red-950/5">
                        <span className="text-red-900 font-bold text-[8px]">CRÍTICO / CUANT</span>
                        <div className="flex flex-wrap gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#EF4444]" title="Foundry chip supply delay"></span>
                          <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" title="Sovereign AI protectionism"></span>
                        </div>
                      </div>
                      {/* Quadrant Q4: Low Prob, Low Impact */}
                      <div className="border border-[#222]/30 p-1 flex flex-col justify-between bg-zinc-900/10">
                        <span className="text-zinc-600 text-[8px]">NOMINAL / MENOR</span>
                        <div className="flex flex-wrap gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" title="Minor licensing friction"></span>
                        </div>
                      </div>
                      {/* Quadrant Q3: Low Prob, High Impact */}
                      <div className="border border-[#222]/30 p-1 flex flex-col justify-between bg-amber-950/5">
                        <span className="text-amber-900 font-bold text-[8px]">PROYECTADO</span>
                        <div className="flex flex-wrap gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" title="Regulatory revision blocking"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regulation compliance list */}
                <div className="bg-black/20 border border-[#222] p-2.5 rounded text-[10.5px] font-mono space-y-2">
                  <span className="text-zinc-600 uppercase text-[8px] tracking-wider block font-bold">ESTADO EXPOSICIÓN LEY PREVISTA</span>
                  <div className="flex justify-between border-b border-[#1A1A1A] pb-1.5 text-[10px]">
                    <span className="text-zinc-400">EU AI Act Tier-1 Compliance</span>
                    <span className="text-[#EF4444] font-bold">HIGH RISK EXP</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1A1A1A] pb-1.5 text-[10px]">
                    <span className="text-zinc-400">GDPR audit requirement (EU)</span>
                    <span className="text-[#00FF41] font-bold">COMPLIANT</span>
                  </div>
                  <div className="flex justify-between pb-0.5 text-[10px]">
                    <span className="text-zinc-400">Sovereign Data Storage acts</span>
                    <span className="text-yellow-500 font-bold">RE-AUDITING</span>
                  </div>
                </div>

                {/* Regulatory quick forecast text */}
                <div className="bg-[#0D0D0D] border border-[#222] p-2 rounded text-[9.5px] font-sans italic text-zinc-500 leading-normal">
                  Proyección regulatoria Bloomberg: En el transcurso de Q3-Q4 2026, la exigencia de auditorías externas elevará el costo por clúster operativo en el continente europeo un 8.5% interanual. Se aconseja provisionar amortización de capital en activos de foundry.
                </div>

                {/* News warnings snippet */}
                <div className="space-y-1.5">
                  <span className="text-zinc-600 uppercase text-[8px] tracking-wide block font-bold">ALERTAS RECIENTES POR GRAVEDAD</span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {news.slice(0, 3).map((item) => {
                      const isHigh = item.impact === "High" || item.impact === "Very High";
                      return (
                        <div key={item.id} className="bg-[#000] border border-[#1A1A1A] text-[10px]/relaxed p-2 rounded font-mono">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] text-[#666]">[{item.date}]</span>
                            <span className={`text-[8px] font-bold p-0.5 px-1 rounded uppercase ${
                              isHigh ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"
                            }`}>
                              {item.impact}
                            </span>
                          </div>
                          <span className="text-white font-semibold line-clamp-1 block hover:text-[#00FF41] cursor-pointer" title={item.title}>
                            {item.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: SETTINGS SYSTEM CONFIGURATION */}
            {activeTab === "settings" && (
              <div className="space-[#1A1A1A] space-y-4">
                <span className="text-zinc-600 uppercase text-[8px] tracking-wider block font-bold">3D GLOBE RENDER SETTINGS</span>
                
                {/* Globe rotation controls toggler */}
                <div className="bg-black/40 border border-[#222] p-3 rounded font-mono space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white block">Auto-rotación del Globo</span>
                      <span className="text-[9px] text-zinc-500 block">Movimiento orbital lento continuo</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoRotate}
                        onChange={onToggleAutoRotate}
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#00FF41]"></div>
                    </label>
                  </div>

                  {/* Confirmed projects filtering */}
                  <div className="flex items-center justify-between text-xs border-t border-[#161616] pt-3">
                    <div>
                      <span className="text-white block">Solo Nodos Confirmados</span>
                      <span className="text-[9px] text-zinc-500 block">Esconder propuestas preliminares</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showOnlyConfirmed}
                        onChange={onToggleShowOnlyConfirmed}
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#00FF41]"></div>
                    </label>
                  </div>

                  {/* Lines connection overlay */}
                  <div className="flex items-center justify-between text-xs border-t border-[#161616] pt-3">
                    <div>
                      <span className="text-white block">Líneas de Relación</span>
                      <span className="text-[9px] text-zinc-500 block">Lazos de inversión y patentes de capital</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showConnections}
                        onChange={onToggleShowConnections}
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#00FF41]"></div>
                    </label>
                  </div>
                </div>

                {/* Selector/filter variables dropdown */}
                <div className="space-y-3 bg-black/40 border border-[#222] p-3 rounded font-mono">
                  <span className="text-zinc-600 uppercase text-[8px] tracking-widest block font-bold">CRATER FILTERS</span>
                  
                  {/* Sector Filter select */}
                  <div className="flex flex-col gap-1 text-[11px]">
                    <label className="text-zinc-500 uppercase text-[9px]">Sectores de infraestructura</label>
                    <select
                      value={filterSector}
                      onChange={(e) => onChangeFilterSector(e.target.value)}
                      className="bg-black border border-[#222] text-[#00FF41]/90 rounded p-1.5 tracking-tight focus:border-[#00FF41] outline-none"
                    >
                      <option value="all">TODOS LOS SECTORES</option>
                      <option value="Data Center / AI Compute">Data Center & AI Compute</option>
                      <option value="Semiconductor Fabrication">Semiconductor Fabs</option>
                      <option value="AI Research Campus">AI Research</option>
                      <option value="Sovereign AI Data Center">Sovereign Fabs</option>
                      <option value="Advanced Memory Semiconductor">Advanced memory</option>
                      <option value="AI Supercomputer">Supercomputación</option>
                    </select>
                  </div>

                  {/* Status checklist or toggle select */}
                  <div className="flex flex-col gap-1 text-[11px] pt-2 border-t border-[#111]">
                    <label className="text-zinc-500 uppercase text-[9px]">Etapa del Proyecto</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      {["confirmed", "permitted", "announced", "review"].map((stage) => {
                        const isChecked = filterStatus.includes(stage) || filterStatus.length === 0;
                        return (
                          <button
                            key={stage}
                            onClick={() => {
                              if (filterStatus.includes(stage)) {
                                onChangeFilterStatus(filterStatus.filter(s => s !== stage));
                              } else {
                                onChangeFilterStatus([...filterStatus, stage]);
                              }
                            }}
                            className={`p-1 border uppercase text-[8px] rounded transition ${
                              isChecked 
                                ? "bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]" 
                                : "bg-black border-[#222] text-zinc-500 hover:text-white"
                            }`}
                          >
                            {stage === "review" ? "revisión" : stage === "announced" ? "anunciado" : stage === "permitted" ? "en trámite" : "aprobado"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="border border-[#222] p-3.5 rounded bg-[#111] text-[9.5px]/relaxed text-zinc-600 font-sans italic">
                  ADVERTENCIA DE SEGURIDAD OPERACIONAL: Los filtros de nodo afectarán la correspondencia de conexiones virtuales representadas orbitalmente en el globo terráqueos 3D de forma sincrónica.
                </div>
              </div>
            )}

          </div>

          {/* Persistent Terminal Input Query Box at the bottom */}
          <footer className="p-3 border-t border-[#222] bg-black/80 font-mono flex flex-col gap-2">
            <div className="flex justify-between items-center text-[9px] text-[#555] uppercase">
              <span>TERMINAL DE INTEGRACIÓN COGNITIVA</span>
              <span className="text-[#00FF41] animate-pulse">STANDBY</span>
            </div>
            <form onSubmit={handleQuerySubmit} className="flex gap-2">
              <div className="flex-1 bg-[#000] border border-[#222] hover:border-[#333] rounded px-1.5 py-1 flex items-center gap-1">
                <span className="text-[#00FF41] text-[11px]">&gt;_</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hacer consulta libre de capitales e IA..."
                  className="bg-transparent border-0 flex-1 outline-none text-[#FFF] text-[11px] placeholder-zinc-700 font-mono focus:ring-0"
                />
              </div>
              <button
                type="submit"
                disabled={isAiLoading || !input.trim()}
                className="bg-[#00FF41] text-black hover:bg-emerald-400 disabled:bg-[#00FF41]/10 disabled:text-zinc-600 disabled:border-zinc-800 disabled:font-normal font-bold p-1 px-3 rounded text-[11px] uppercase transition cursor-pointer"
              >
                {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </footer>
        </div>
      )}
    </div>
  );
}
