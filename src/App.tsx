import React, { useState, useEffect } from "react";
import { Terminal, Cpu, Globe, Activity, Plus, X, RefreshCw, Layers, ShieldCheck, Database, CheckSquare } from "lucide-react";
import AiTerminal from "./components/AiTerminal";
import IndexPanel from "./components/IndexPanel";
import MapPanel from "./components/MapPanel";
import { IndexDataset, CapitalFlowHub, NewsItem, PredictionsData } from "./types";

export default function App() {
  // Main state fetched from backend APIs
  const [indices, setIndices] = useState<IndexDataset | null>(null);
  const [mapHubs, setMapHubs] = useState<CapitalFlowHub[] | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  
  // Custom interactive state
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form values for new news item
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("M&A");
  const [newImpact, setNewImpact] = useState<"Low" | "Medium" | "High" | "Very High">("Medium");
  const [newSummary, setNewSummary] = useState("");
  const [newSource, setNewSource] = useState("");

  // Simulated live ticking local date & time representation for Q2 2026
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    // Tick current time
    const interval = setInterval(() => {
      const live = new Date();
      // Adjust year to look like 2026 as per setup
      const year = "2026";
      const month = String(live.getMonth() + 1).padStart(2, "0");
      const day = String(live.getDate()).padStart(2, "0");
      const hours = String(live.getHours()).padStart(2, "0");
      const minutes = String(live.getMinutes()).padStart(2, "0");
      const seconds = String(live.getSeconds()).padStart(2, "0");
      setUtcTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch initial analytical datasets from the node endpoints
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      const [indRes, mapRes, newsRes, predRes] = await Promise.all([
        fetch("/api/indices").then((r) => r.json()),
        fetch("/api/map").then((r) => r.json()),
        fetch("/api/news").then((r) => r.json()),
        fetch("/api/predictions").then((r) => r.json()),
      ]);

      setIndices(indRes);
      setMapHubs(mapRes);
      setNews(newsRes);
      setPredictions(predRes);
    } catch (err) {
      console.error("Using offline client-side fail-safe data", err);
      // Fallback fallback simulated data in case server is not running or building
      setIndices({
        dates: ["Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26"],
        datasets: [
          { name: "AI Tech Index", code: "AITX", current: 134.5, changeYoY: 28.4, points: [100.0, 102.4, 105.1, 108.9, 111.4, 113.8, 112.5, 114.2, 118.0, 121.3, 125.7, 128.0, 129.4, 131.1, 132.8, 133.9, 134.5] },
          { name: "Semiconductor Index", code: "SOX-AI", current: 148.2, changeYoY: 41.6, points: [100.0, 104.8, 109.5, 115.2, 118.9, 124.6, 121.2, 125.0, 129.8, 133.4, 139.1, 142.3, 143.0, 144.9, 146.5, 147.8, 148.2] },
          { name: "Enterprise Services Index", code: "ESIX", current: 119.7, changeYoY: 15.3, points: [100.0, 101.2, 102.8, 104.2, 105.9, 107.5, 107.0, 108.4, 110.1, 112.3, 114.8, 116.2, 117.1, 118.0, 118.9, 119.4, 119.7] }
        ]
      });
      setMapHubs([
        { id: "hub-1", name: "Silicon Valley, USA", lat: 37.4, lng: -122.0, inflow: 42.5, YoY: 31.4, marginImpact: 8.5, primarySector: "Foundation Models & Compute" },
        { id: "hub-2", name: "Paris & London Corridor", lat: 50.1, lng: -0.1, inflow: 18.2, YoY: 24.1, marginImpact: 5.2, primarySector: "Sovereign AI & RegTech" },
        { id: "hub-3", name: "Tokyo & Seoul Axis", lat: 36.5, lng: 133.5, inflow: 15.6, YoY: 38.2, marginImpact: 11.4, primarySector: "Foundry CapEx & Packaging" },
        { id: "hub-4", name: "Bengaluru, IndiaHub", lat: 12.97, lng: 77.59, inflow: 8.4, YoY: 45.1, marginImpact: 9.2, primarySector: "Enterprise Automation" }
      ]);
      setNews([
        { id: "n-1", date: "2026-05-22", title: "EU AI Act Compliance Deadline Hits: Tier-1 Foundations Rush to Register High-impact Models", category: "Regulation", impact: "High", summary: "Mandatory third-party audits and detailed training set disclosures come into effect.", source: "Bloomberg" },
        { id: "n-2", date: "2026-05-18", title: "Global AI Core Corp Announces $12.4B Semiconductor Infrastructure Joint Venture in Tokyo", category: "CapEx", impact: "Very High", summary: "Sovereign backing offsets local builder costs as foundry capacity races to meet delivery.", source: "Nikkei" }
      ]);
      setPredictions({
        adoptionRates: [{ quarter: "Q1 26", rate: 43 }, { quarter: "Q2 26", rate: 49 }, { quarter: "Q3 26 (P)", rate: 55 }, { quarter: "Q4 26 (P)", rate: 61 }],
        foundryCapEx: [{ quarter: "Q1 26", amount: 43.5 }, { quarter: "Q2 26", amount: 46.8 }, { quarter: "Q3 26 (P)", amount: 50.2 }, { quarter: "Q4 26 (P)", amount: 54 }],
        valuationMultiples: [{ quarter: "Q1 26", multiple: 17.8 }, { quarter: "Q2 26", multiple: 18.2 }, { quarter: "Q3 26 (P)", multiple: 19.0 }, { quarter: "Q4 26 (P)", multiple: 19.5 }]
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Post dynamic macro alert item through proxy path
  const handleAddNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const payload = {
      title: newTitle,
      category: newCategory,
      impact: newImpact,
      summary: newSummary,
      source: newSource || "Reuters Global Capital"
    };

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const addedAlert = await res.json();
        setNews((prev) => [addedAlert, ...prev]);
        setShowAddNewsModal(false);
        // Reset form inputs
        setNewTitle("");
        setNewSummary("");
        setNewSource("");
      }
    } catch {
      // Offline fallback simulate locally
      const mockNew: NewsItem = {
        id: `n-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        title: newTitle,
        category: newCategory,
        impact: newImpact,
        summary: newSummary,
        source: newSource || "Reuters Global (Stub)"
      };
      setNews((prev) => [mockNew, ...prev]);
      setShowAddNewsModal(false);
      setNewTitle("");
      setNewSummary("");
      setNewSource("");
    }
  };

  // Callback to execute server AI queries
  const handleAiCall = async (promptToSend: string) => {
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend })
      });
      return await response.json();
    } catch (err) {
      console.warn("API AI failure, falling back to simulated generation", err);
      throw err;
    }
  };

  // Multiplier modifier from market stress simulation
  const handleMultiplierChange = (factor: number) => {
    setMultiplier(factor);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#D4D4D4] font-mono p-4 flex flex-col selection:bg-[#00FF41] selection:text-black">
      {/* Top Main High-Density Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#333] pb-2 mb-4 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#00FF41] w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_#00FF41]"></div>
          <h1 className="text-lg font-bold tracking-tighter text-[#FFF] uppercase">
            GLOBAL AI FINANCE ENGINE v4.2
          </h1>
          <span className="text-[9px] text-[#00FF41] bg-[#00FF41]/10 border border-[#00FF41]/30 px-2 py-0.5 uppercase tracking-widest font-semibold rounded-sm">
            LIVE_FEED: ACTIVE_CORE_SECURE
          </span>
          <button
            onClick={fetchAllData}
            title="Refrescar datos del terminal"
            className="p-1 text-zinc-500 hover:text-[#00FF41] hover:bg-zinc-900 rounded transition-all ml-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00FF41]' : ''}`} />
          </button>
        </div>

        {/* Live indices quick tape readout */}
        <div className="flex flex-wrap gap-5 text-[11px] font-mono">
          <div className="flex flex-col bg-[#0A0A0A] border border-[#222]/60 px-2.5 py-1 rounded">
            <span className="text-[#666] text-[9px] uppercase tracking-wide">AI TECH INDEX (AITX)</span>
            <span className="text-[#00FF41] font-bold">
              {(134.5 * multiplier).toFixed(1)} ▲ +28.4% YoY
            </span>
          </div>
          <div className="flex flex-col bg-[#0A0A0A] border border-[#222]/60 px-2.5 py-1 rounded">
            <span className="text-[#666] text-[9px] uppercase tracking-wide">SEMI INDEX (SOX-AI)</span>
            <span className="text-[#00FF41] font-bold">
              {(148.2 * multiplier).toFixed(1)} ▲ +41.6% YoY
            </span>
          </div>
          <div className="flex flex-col bg-[#0A0A0A] border border-[#222]/60 px-2.5 py-1 rounded">
            <span className="text-[#666] text-[9px] uppercase tracking-wide">ENTERPRISE (ESIX)</span>
            <span className="text-amber-500 font-bold">
              {(119.7 * multiplier).toFixed(1)} ▲ +15.3% YoY
            </span>
          </div>
          <div className="flex flex-col border-l border-[#333] pl-4 justify-center">
            <span className="text-[#666] text-[9px] uppercase">UTC CORE TIME</span>
            <span className="text-[#FFF] font-semibold tracking-wider">
              {utcTime || "2026-05-24 17:09:27"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Section */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 pb-2">
        
        {/* Left Side: Macro news feed & compliance (col-span-3) */}
        <aside className="xl:col-span-3 flex flex-col gap-4 overflow-hidden">
          {/* News Feed Panel */}
          <div className="bg-[#0A0A0A] border border-[#222] p-3 flex flex-col flex-1 rounded max-h-[460px] xl:max-h-none overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] text-[#FFF] tracking-wider uppercase font-bold flex items-center gap-1.5 font-mono">
                <span className="w-1 h-3 bg-[#00FF41] inline-block"></span> 
                MACRO NEWS FEED
              </h2>
              <button
                onClick={() => setShowAddNewsModal(true)}
                className="bg-[#00FF41]/10 text-[#00FF41] hover:bg-[#00FF41] hover:text-black hover:font-bold border border-[#00FF41]/30 transition-all text-[9.5px] px-2 py-0.5 rounded flex items-center gap-1 font-mono uppercase cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Nueva Alerta
              </button>
            </div>

            {/* Scrollable Feed Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-[#1A1A1A] text-[11px]">
              {news.length === 0 ? (
                <div className="text-zinc-600 italic font-mono py-10 text-center">
                  Cargando flujo internacional de capitales...
                </div>
              ) : (
                news.map((item, idx) => {
                  const isHigh = item.impact === "High" || item.impact === "Very High";
                  return (
                    <div key={item.id} className={`${idx !== 0 ? 'pt-3' : ''} group`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#888] font-mono text-[10px]">
                          [{item.date}] {item.category.toUpperCase()}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 uppercase tracking-widest font-bold rounded ${
                          isHigh ? "bg-red-500/15 text-[#FF3131] border border-red-500/20" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {item.impact}
                        </span>
                      </div>
                      <h3 className="text-[#FFF] font-semibold leading-tight text-xs hover:text-[#00FF41] transition-all cursor-pointer">
                        {item.title}
                      </h3>
                      <p className="text-zinc-500 font-sans leading-relaxed text-[10.5px] mt-1 line-clamp-2">
                        {item.summary}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[9px] text-[#666]">
                        <span className="truncate max-w-[150px]">Fte: {item.source}</span>
                        <span className="text-[#00FF41] opacity-0 group-hover:opacity-100 transition-opacity">
                          EXPANDIR &gt;
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-[#0A0A0A] border border-[#222] p-3 rounded">
            <h2 className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-2">COMPLIANCE STATUS</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] border-b border-[#1A1A1A] pb-1.5">
                <span className="text-zinc-400">SOC2 TYPE III SECURE</span>
                <span className="text-[#00FF41] bg-[#00FF41]/10 px-1.5 py-0.2 rounded font-bold border border-[#00FF41]/20">
                  ACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] border-b border-[#1A1A1A] pb-1.5">
                <span className="text-zinc-400">GDPR-AI COMPLIANCE</span>
                <span className="text-[#00FF41] bg-[#00FF41]/10 px-1.5 py-0.2 rounded font-bold border border-[#00FF41]/20">
                  CERTIFIED
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400">ISO/IEC 42001 (SAFETY)</span>
                <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded font-bold border border-amber-500/20 animate-pulse">
                  RE-AUDIT
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Section: Core Visualizers (col-span-6) */}
        <main className="xl:col-span-6 flex flex-col gap-4 overflow-hidden">
          
          {/* Capital Flows Map component */}
          <div className="flex-1 min-h-[350px]">
            {mapHubs ? (
              <MapPanel hubs={mapHubs} />
            ) : (
              <div className="bg-[#0A0A0A] border border-[#222] rounded h-full flex items-center justify-center text-zinc-600 font-mono">
                Decodificando flujos de capital globales...
              </div>
            )}
          </div>

          {/* Markets interactive index chart */}
          <div className="h-[290px]">
            {indices ? (
              <IndexPanel data={indices} onModifyMultiplier={handleMultiplierChange} />
            ) : (
              <div className="bg-[#0A0A0A] border border-[#222] rounded h-full flex items-center justify-center text-zinc-600 font-mono">
                Sincronizando índices cuantitativos...
              </div>
            )}
          </div>

        </main>

        {/* Right Side: Predictions & AI Analytics (col-span-3) */}
        <aside className="xl:col-span-3 flex flex-col gap-4 overflow-hidden">
          
          {/* Predictions block */}
          <div className="bg-[#0A0A0A] border border-[#222] p-3 flex-1 flex flex-col rounded">
            <h2 className="text-[10px] text-[#FFF] tracking-wider uppercase font-bold mb-3 font-mono">
              Q2 2026 QUANT PREDICTIONS
            </h2>
            
            <div className="space-y-4 flex-1">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-zinc-400">Enterprise AI Adoption Rate</span>
                  <span className="text-[#00FF41] font-bold">49% &gt; 68% (P)</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-[#00FF41] h-full" style={{ width: "68%" }}></div>
                </div>
                <span className="text-[9px] text-[#666] font-mono mt-0.5 block">Siguiente hito esperado para finales de Q3 2026.</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-zinc-400">Aggregate GPU Cluster CapEx</span>
                  <span className="text-[#00FF41] font-bold">$46.8B &gt; $54B</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-[#00FF41] h-full transition-all duration-300" style={{ width: `${(46.8 * multiplier / 60) * 100}%` }}></div>
                </div>
                <span className="text-[9px] text-[#666] font-mono mt-0.5 block">Cifras en Millardos USD. Ritmo trimestral en fundiciones.</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-zinc-400">EV/Revenue Valuation multiple</span>
                  <span className="text-[#00FF41] font-bold">18.2x &gt; 19.5x</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-sm overflow-hidden">
                  <div className="bg-yellow-500 h-full" style={{ width: "85%" }}></div>
                </div>
                <span className="text-[9px] text-[#666] font-mono mt-0.5 block">Múltiplo ponderado de consolidación de mercado SaaS.</span>
              </div>
            </div>

            {/* AI Insights block */}
            <div className="mt-4 bg-[#111] p-3 border border-[#222] rounded text-[10px] font-mono">
              <p className="text-[#00FF41] mb-1 font-bold">&gt; INSIGHTS_ENGINE_SYS_01:</p>
              <p className="text-[#888] leading-relaxed italic">
                La transición hacia agentes de inferencia y modelos autoinstruidos mitiga costes transaccionales de tokens en un 30%, optimizando el flujo de caja operativo disponible de las corporaciones Fortune 500.
              </p>
            </div>
          </div>

          {/* AI Terminal query panel component */}
          <div className="h-[360px]">
            <AiTerminal onAnalyze={handleAiCall} />
          </div>

        </aside>

      </div>

      {/* Footer System Analytics metadata lines */}
      <footer className="mt-4 pt-2 border-t border-[#333] flex flex-col md:flex-row justify-between gap-2 text-[9px] text-[#555] font-mono">
        <div>
          TRADING_NODE_REF: <span className="text-[#D4D4D4]">BLMBRG-AI-2026-STABLE</span> // ENCRYPTION: <span className="text-zinc-400">AES-512-GCM</span> // PORT_STATUS: <span className="text-[#00FF41]">NOMINAL_PROXY</span>
        </div>
        <div>
          SECURE CLIENT CORRIDOR // REAL-TIME MODEL GRAPHS // CORE_VER: <span className="text-[#FFF]">v4.2.0-STABLE</span>
        </div>
      </footer>

      {/* News Addition popover modal */}
      {showAddNewsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0A0A] border border-[#333] w-full max-w-md p-5 rounded-lg shadow-2xl space-y-4 font-mono">
            
            <div className="flex items-center justify-between border-b border-[#222] pb-2">
              <span className="text-xs font-bold text-[#00FF41] uppercase flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Nueva Alerta de Mercado Macro
              </span>
              <button
                onClick={() => setShowAddNewsModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewsSubmit} className="space-y-3.5 text-xs text-zinc-300">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-zinc-500">Título de la Alerta de Mercado</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Inversión récord en clúster GPU en Reino Unido"
                  className="bg-black border border-[#222] p-2 rounded text-zinc-100 placeholder-zinc-700 outline-none focus:border-[#00FF41]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-black border border-[#222] p-2 rounded text-zinc-100 outline-none focus:border-[#00FF41]"
                  >
                    <option value="M&A">M&A / Adquisición</option>
                    <option value="Regulation">Regulación / Leyes</option>
                    <option value="CapEx">CapEx / Infraestructura</option>
                    <option value="Valuation">Valuación / Multiplo</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500">Nivel de Impacto</label>
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value as any)}
                    className="bg-black border border-[#222] p-2 rounded text-zinc-100 outline-none focus:border-[#00FF41]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-zinc-500">Resumen de Análisis Financiero</label>
                <textarea
                  required
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Detallar métricas de retorno, YoY%, o impacto en márgenes de flujo"
                  className="bg-black border border-[#222] p-2 rounded text-zinc-100 placeholder-zinc-700 outline-none focus:border-[#00FF41] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-zinc-500">Fuente / Proveedor de Datos</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="Reuters, Morgan Stanley, Financial Times..."
                  className="bg-black border border-[#222] p-2 rounded text-zinc-100 placeholder-zinc-700 outline-none focus:border-[#00FF41]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00FF41] hover:bg-emerald-400 text-black font-bold p-2.5 rounded transition-all text-sm uppercase mt-2 tracking-wider cursor-pointer"
              >
                Inyectar Alerta de Datos
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
