import React, { useState, useEffect } from "react";
import { 
  Globe, Shield, Activity, Plus, X, RefreshCw, 
  Database, DatabaseZap, Clock, Cpu, LayoutGrid 
} from "lucide-react";
import IndexPanel from "./components/IndexPanel";
import GlobePanel from "./components/GlobePanel";
import AiSidePanel from "./components/AiSidePanel";
import { 
  IndexDataset, NewsItem, PredictionsData, 
  InfraProject, AiResponse 
} from "./types";

export default function App() {
  // Analytical & financial states
  const [indices, setIndices] = useState<IndexDataset | null>(null);
  const [projects, setProjects] = useState<InfraProject[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  
  // Custom interaction states
  const [selectedProject, setSelectedProject] = useState<InfraProject | null>(null);
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Settings for 3D Globe & general mapping (linked with parent)
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showOnlyConfirmed, setShowOnlyConfirmed] = useState<boolean>(false);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(true);

  // Form values for injecting artificial market news alerts
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("M&A");
  const [newImpact, setNewImpact] = useState<"Low" | "Medium" | "High" | "Very High">("Medium");
  const [newSummary, setNewSummary] = useState("");
  const [newSource, setNewSource] = useState("");

  // Live ticking clock adjusted to Q2 2026
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const live = new Date();
      const year = "2026"; // Lock to specs Q2 2026 era
      const month = String(live.getUTCMonth() + 1).padStart(2, "0");
      const day = String(live.getUTCDate()).padStart(2, "0");
      const hours = String(live.getUTCHours()).padStart(2, "0");
      const minutes = String(live.getUTCMinutes()).padStart(2, "0");
      const seconds = String(live.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch macro financial indicators and the geopolitical infrastructure project lists
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      const [indRes, projRes, newsRes, predRes] = await Promise.all([
        fetch("/api/indices").then((r) => r.json()),
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/news").then((r) => r.json()),
        fetch("/api/predictions").then((r) => r.json()),
      ]);

      setIndices(indRes);
      setProjects(projRes);
      setNews(newsRes);
      setPredictions(predRes);
    } catch (err) {
      console.warn("REST services not reachable. Using robust client-side fallback telemetry.", err);
      // Hardcoded fallback safety matching exactly specs constraints
      setIndices({
        dates: ["Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26"],
        datasets: [
          { name: "AI Tech Index", code: "AITX", current: 134.5, changeYoY: 28.4, points: [100.0, 102.4, 105.1, 108.9, 111.4, 113.8, 112.5, 114.2, 118.0, 121.3, 125.7, 128.0, 129.4, 131.1, 132.8, 133.9, 134.5] },
          { name: "Semiconductor Index", code: "SOX-AI", current: 148.2, changeYoY: 41.6, points: [100.0, 104.8, 109.5, 115.2, 118.9, 124.6, 121.2, 125.0, 129.8, 133.4, 139.1, 142.3, 143.0, 144.9, 146.5, 147.8, 148.2] },
          { name: "Enterprise Services Index", code: "ESIX", current: 119.7, changeYoY: 15.3, points: [100.0, 101.2, 102.8, 104.2, 105.9, 107.5, 107.0, 108.4, 110.1, 112.3, 114.8, 116.2, 117.1, 118.0, 118.9, 119.4, 119.7] }
        ]
      });
      setNews([
        { id: "n-1", date: "2026-05-22", title: "EU AI Act Compliance Deadline Hits: Tier-1 Foundations Rush to Register High-impact Models", category: "Regulation", impact: "High", summary: "Mandatory third-party audits and detailed training set disclosures come into effect.", source: "Bloomberg" },
        { id: "n-2", date: "2026-05-18", title: "Global AI Core Corp Announces $12.4B Semiconductor Infrastructure Joint Venture in Tokyo", category: "M&A", impact: "Very High", summary: "Sovereign backing offsets local builder costs as foundry capacity races to meet delivery.", source: "Nikkei" }
      ]);
      setPredictions({
        adoptionRates: [{ quarter: "Q1 26", rate: 43 }, { quarter: "Q2 26", rate: 49 }, { quarter: "Q3 26 (P)", rate: 55 }, { quarter: "Q4 26 (P)", rate: 61 }],
        foundryCapEx: [{ quarter: "Q1 26", amount: 43.5 }, { quarter: "Q2 26", amount: 46.8 }, { quarter: "Q3 26 (P)", amount: 50.2 }, { quarter: "Q4 26 (P)", amount: 54 }],
        valuationMultiples: [{ quarter: "Q1 26", multiple: 17.8 }, { quarter: "Q2 26", multiple: 18.2 }, { quarter: "Q3 26 (P)", multiple: 19.0 }, { quarter: "Q4 26 (P)", multiple: 19.5 }]
      });
      setProjects([
        {
          id: "proj-001",
          name: "Microsoft Azure AI Mega-Campus — Quincy, WA",
          lat: 47.23, lng: -119.85,
          status: "confirmed",
          investor: "Microsoft Corporation",
          investorCountry: "USA",
          amount: 14.2,
          currency: "USD",
          sector: "Data Center / AI Compute",
          purpose: "Expansión masiva de capacidad de inferencia para Azure OpenAI Services y Copilot global",
          capacity: "500MW compute, 50,000+ GPU cluster",
          operationsDate: "Q2 2027",
          confirmed: true,
          confirmationSource: "Microsoft Investor Relations Q1 2026",
          annualROI: 18.4,
          jobsCreated: 3200,
          notes: "Segunda fase de expansión. Primera fase operativa desde Q3 2025."
        },
        {
          id: "proj-002",
          name: "TSMC Arizona Fab 21 — Phoenix, AZ",
          lat: 33.44, lng: -112.07,
          status: "confirmed",
          investor: "TSMC + US CHIPS Act",
          investorCountry: "Taiwan / USA",
          amount: 40.0,
          currency: "USD",
          sector: "Semiconductor Fabrication",
          purpose: "Producción de chips de 2nm para IA avanzada en suelo estadounidense",
          capacity: "600,000 wafers/año en plena capacidad",
          operationsDate: "Q4 2027",
          confirmed: true,
          confirmationSource: "TSMC Press Release + CHIPS Act DOC filing",
          annualROI: 22.1,
          jobsCreated: 6000,
          notes: "Recibe $6.6B en subsidios federales bajo CHIPS and Science Act."
        },
        {
          id: "proj-003",
          name: "Google DeepMind AI Research Hub — London, UK",
          lat: 51.53, lng: -0.10,
          status: "confirmed",
          investor: "Alphabet / Google",
          investorCountry: "USA",
          amount: 4.5,
          currency: "GBP",
          sector: "AI Research Campus",
          purpose: "Consolidación del hub europeo de investigación en AGI, safety y multimodal",
          capacity: "2,000 investigadores, 8,000 GPU cluster dedicado",
          operationsDate: "Q1 2027",
          confirmed: true,
          confirmationSource: "Google UK Official Statement 2026-03-15",
          annualROI: 0,
          jobsCreated: 2000,
          notes: "No orientado a ROI directo. Activo estratégico de talento e investigación."
        }
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Post dynamic macro alert item through real proxy paths
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
        // Reset state
        setNewTitle("");
        setNewSummary("");
        setNewSource("");
      }
    } catch {
      // Offline fallback simulator
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

  // Perform Gemini AI prompts proxy calls
  const handleAiCall = async (promptToSend: string): Promise<AiResponse> => {
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend })
      });
      return await response.json();
    } catch (err) {
      console.warn("API AI endpoint error. Simulation context triggered.", err);
      throw err;
    }
  };

  // Stress Multiplier Factor
  const handleMultiplierChange = (factor: number) => {
    setMultiplier(factor);
  };

  // Handler for custom selection de proyecto from the globe or sidebar lists
  const handleSelectProject = (project: InfraProject | null) => {
    setSelectedProject(project);
  };

  // Filter project arrays dynamically for the Globe inputs
  const displayedProjects = projects.filter(p => {
    if (showOnlyConfirmed && p.status !== "confirmed") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#030303] text-[#F0F0F0] font-mono p-4 flex flex-col selection:bg-[#00FF41] selection:text-black">
      
      {/* HEADER: Logo + Indices quick tape readout + Live UTC clock */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#222] pb-3 mb-4 gap-4 bg-black/30 p-2.5 rounded-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#00FF41] w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_#00FF41]"></div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#00FF41]" />
            <h1 className="text-[13px] font-bold tracking-tighter text-[#FFF] uppercase font-mono">
              GLOBAL AI FINANCE PLATFORM v5.0
            </h1>
          </div>
          <span className="text-[9px] text-[#00FF41] bg-[#00FF41]/10 border border-[#00FF41]/20 px-2 py-0.5 uppercase tracking-widest font-bold rounded-sm">
            ACTIVE EXECUTIVE TELEMETRY
          </span>
          <button
            onClick={fetchAllData}
            title="Refrescar datos del terminal"
            className="p-1 text-zinc-500 hover:text-[#00FF41] hover:bg-zinc-900 rounded transition-all ml-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00FF41]' : ''}`} />
          </button>
        </div>

        {/* Live Indices Ticker Quick Tape */}
        <div className="flex flex-wrap gap-4 text-[11px] font-mono">
          <div className="flex flex-col bg-[#0A0A0A] border border-[#222] px-2.5 py-1 rounded">
            <span className="text-zinc-500 text-[8px] uppercase tracking-wide">AITX INDEX</span>
            <span className="text-[#00FF41] font-bold">
              {(134.5 * multiplier).toFixed(1)} ▲ +28.4%
            </span>
          </div>
          <div className="flex flex-col bg-[#0A0A0A] border border-[#222] px-2.5 py-1 rounded">
            <span className="text-zinc-500 text-[8px] uppercase tracking-wide">SOX-AI INDEX</span>
            <span className="text-[#00FF41] font-bold">
              {(148.2 * multiplier).toFixed(1)} ▲ +41.6%
            </span>
          </div>
          <div className="flex flex-col bg-[#0A0A0A] border border-[#222] px-2.5 py-1 rounded">
            <span className="text-zinc-500 text-[8px] uppercase tracking-wide">ESIX INDEX</span>
            <span className="text-amber-500 font-bold">
              {(119.7 * multiplier).toFixed(1)} ▲ +15.3%
            </span>
          </div>
          <div className="flex flex-col border-l border-[#222] pl-3.5 justify-center">
            <span className="text-zinc-500 text-[8px] uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              SMC SECURE TIME
            </span>
            <span className="text-[#FFF] font-semibold text-[10px] tracking-wider">
              {utcTime || "2026-05-24 20:16:58 UTC"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">
        
        {/* LEFT SECTION: 3D Globe + News & Charts Panels */}
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto pr-0.5">
          
          {/* GLOBE 3D PANELS (Occupies top 60% dynamic height) */}
          <section className="h-[430px] md:h-[480px] w-full flex-shrink-0">
            <GlobePanel 
              projects={displayedProjects}
              onSelectProject={handleSelectProject}
              selectedProject={selectedProject}
              filterStatus={filterStatus}
              filterSector={filterSector}
              showConnections={showConnections}
            />
          </section>

          {/* LOWER GRID: News (40%) and Charts Portfolio (60%) */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-[300px]">
            
            {/* Column col-span-5: News alerts feed */}
            <div className="md:col-span-5 flex flex-col bg-[#0D0D0D] border border-[#222] p-4 rounded-lg relative overflow-hidden group hover:border-[#333] transition-all">
              {/* Card visual accent bar */}
              <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-[#00FF41]"></div>
              
              <div className="flex items-center justify-between mb-3.5 pl-2">
                <h2 className="text-[10px] text-[#FFF] tracking-wide uppercase font-bold flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-[#00FF41]" />
                  MACRO CAPITAL NEWS SHIELD
                </h2>
                <button
                  onClick={() => setShowAddNewsModal(true)}
                  className="bg-[#00FF41]/10 text-[#00FF41] hover:bg-[#00FF41] hover:text-black border border-[#00FF41]/30 transition-all text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Nueva Alerta
                </button>
              </div>

              {/* News Feed Scroll */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 divide-y divide-[#1A1A1A] text-[11px] pl-2">
                {news.length === 0 ? (
                  <div className="text-zinc-600 italic font-mono py-12 text-center">
                    Cargando flujo de capital macro...
                  </div>
                ) : (
                  news.map((item, idx) => {
                    const isHigh = item.impact === "High" || item.impact === "Very High";
                    return (
                      <div key={item.id} className={`${idx !== 0 ? 'pt-3.5' : ''} group/item`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-zinc-500 font-mono text-[9px]">
                            [{item.date}] {item.category.toUpperCase()}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.2 uppercase tracking-wide font-extrabold rounded ${
                            isHigh ? "bg-red-500/15 text-red-500 border border-red-500/25" : "bg-zinc-850 text-zinc-400"
                          }`}>
                            {item.impact}
                          </span>
                        </div>
                        <h3 className="text-white font-bold leading-tight text-[11.5px] hover:text-[#00FF41] transition-all cursor-pointer">
                          {item.title}
                        </h3>
                        <p className="text-zinc-500 font-mono text-[10px] mt-1 line-clamp-3">
                          {item.summary}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[9px] text-[#555]">
                          <span>Fuente: {item.source}</span>
                          <span className="text-[#00FF41] opacity-0 group-hover/item:opacity-100 transition-opacity">
                            EXPAND &gt;&gt;
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column col-span-7: Markets index chart SVG */}
            <div className="md:col-span-7 h-full flex flex-col relative overflow-hidden">
              {indices ? (
                <IndexPanel data={indices} onModifyMultiplier={handleMultiplierChange} />
              ) : (
                <div className="bg-[#0D0D0D] border border-[#222] rounded-lg h-full flex items-center justify-center text-zinc-600 font-mono">
                  Sincronizando índices cuantitativos...
                </div>
              )}
            </div>

          </section>
        </main>

        {/* RIGHT SECTION: AI PERSISTENT SIDEBAR PANEL */}
        <aside className="self-stretch flex-shrink-0">
          <AiSidePanel 
            isOpen={aiPanelOpen}
            onToggle={() => setAiPanelOpen(!aiPanelOpen)}
            selectedProject={selectedProject}
            allProjects={projects}
            onSelectProject={handleSelectProject}
            indices={indices}
            news={news}
            onAnalyze={handleAiCall}
            
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
            showOnlyConfirmed={showOnlyConfirmed}
            onToggleShowOnlyConfirmed={() => setShowOnlyConfirmed(!showOnlyConfirmed)}
            showConnections={showConnections}
            onToggleShowConnections={() => setShowConnections(!showConnections)}
            filterSector={filterSector}
            onChangeFilterSector={(sector) => setFilterSector(sector)}
            filterStatus={filterStatus}
            onChangeFilterStatus={(statuses) => setFilterStatus(statuses)}
          />
        </aside>

      </div>

      {/* FOOTER SYSTEM METADATA ALIGNEMENT */}
      <footer className="mt-4 pt-2 border-t border-[#222] flex flex-col md:flex-row justify-between gap-2 text-[9px] text-zinc-600 font-mono">
        <div className="flex gap-2">
          <span>BLMBRG-SYS REF:</span>
          <span className="text-white">COGNITIVE-FINANCE-v5.0-SECURE</span>
          <span className="text-zinc-700">//</span>
          <span>ENCRYPTION:</span>
          <span>AES-512-GCM</span>
          <span className="text-zinc-700">//</span>
          <span>INTERFACE:</span>
          <span className="text-[#00FF41]">3D_ORBIT_RENDER</span>
        </div>
        <div>
          DECISION CORRIDOR // REAL-TIME PERSISTENT AI CHAT // INTEL v5.0.0-PRO
        </div>
      </footer>

      {/* New alert injection popover modal dialog */}
      {showAddNewsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0A0A] border border-[#333] w-full max-w-md p-5 rounded-lg shadow-2xl space-y-4 font-mono relative">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#00FF41]"></div>

            <div className="flex items-center justify-between border-b border-[#222] pb-2">
              <span className="text-xs font-bold text-[#00FF41] uppercase flex items-center gap-1.5">
                <DatabaseZap className="w-4 h-4 text-[#00FF41]" />
                Inyectar Nueva Alerta Financiera Macro
              </span>
              <button
                onClick={() => setShowAddNewsModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewsSubmit} className="space-y-4 text-xs text-zinc-300">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase text-zinc-500">Título de la Alerta</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Capitalización récord de chips en Phoenix"
                  className="bg-black border border-[#222] p-2.5 rounded text-zinc-100 placeholder-zinc-700 outline-none focus:border-[#00FF41] text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase text-zinc-500">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-black border border-[#222] p-2.5 rounded text-zinc-100 outline-none focus:border-[#00FF41] text-xs font-mono"
                  >
                    <option value="M&A">M&A / Adquisición</option>
                    <option value="Regulation">Regulación / Leyes</option>
                    <option value="CapEx">CapEx / Infraestructura</option>
                    <option value="Valuation">Valuación / Múltiplo</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase text-zinc-500">Gravedad / Impacto</label>
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value as any)}
                    className="bg-black border border-[#222] p-2.5 rounded text-zinc-100 outline-none focus:border-[#00FF41] text-xs font-mono"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase text-zinc-500">Resumen del Análisis de Impacto</label>
                <textarea
                  required
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Detallar variables YoY%, EBITDA, o restricciones de inventario..."
                  className="bg-black border border-[#222] p-2.5 rounded text-zinc-100 placeholder-zinc-700 outline-none focus:border-[#00FF41] resize-none text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase text-zinc-500">Fuente de Información</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="Morgan Stanley, Reuters, Bloomberg..."
                  className="bg-black border border-[#222] p-2.5 rounded text-zinc-100 placeholder-zinc-700 outline-none focus:border-[#00FF41] text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00FF41] hover:bg-emerald-400 text-black font-extrabold p-3 rounded transition-all text-xs uppercase mt-3 tracking-widest cursor-pointer"
              >
                Inyectar Alerta de Datos en Core
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
