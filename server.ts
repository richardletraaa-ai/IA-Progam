import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Global baseline indices data for Q1 2025 - Q2 2026
const marketIndices = {
  dates: [
    "Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", 
    "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", 
    "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26"
  ],
  datasets: [
    {
      name: "AI Tech Index",
      code: "AITX",
      current: 134.5,
      changeYoY: 28.4,
      points: [100.0, 102.4, 105.1, 108.9, 111.4, 113.8, 112.5, 114.2, 118.0, 121.3, 125.7, 128.0, 129.4, 131.1, 132.8, 133.9, 134.5]
    },
    {
      name: "Semiconductor Index",
      code: "SOX-AI",
      current: 148.2,
      changeYoY: 41.6,
      points: [100.0, 104.8, 109.5, 115.2, 118.9, 124.6, 121.2, 125.0, 129.8, 133.4, 139.1, 142.3, 143.0, 144.9, 146.5, 147.8, 148.2]
    },
    {
      name: "Enterprise Services Index",
      code: "ESIX",
      current: 119.7,
      changeYoY: 15.3,
      points: [100.0, 101.2, 102.8, 104.2, 105.9, 107.5, 107.0, 108.4, 110.1, 112.3, 114.8, 116.2, 117.1, 118.0, 118.9, 119.4, 119.7]
    }
  ]
};

// Geopolitical Capital Flow Hubs representing tech capital allocations
const capitalFlows = [
  { id: "hub-1", name: "Silicon Valley, USA", lat: 37.4, lng: -122.0, inflow: 42.5, YoY: 31.4, marginImpact: 8.5, primarySector: "Foundation Models & Compute" },
  { id: "hub-2", name: "Paris, France / London, UK", lat: 50.1, lng: -0.1, inflow: 18.2, YoY: 24.1, marginImpact: 5.2, primarySector: "Sovereign AI & Regulatory Tech" },
  { id: "hub-3", name: "Tokyo, Japan / Seoul, S. Korea", lat: 36.5, lng: 133.5, inflow: 15.6, YoY: 38.2, marginImpact: 11.4, primarySector: "Foundry CapEx & Packaging" },
  { id: "hub-4", name: "Bengaluru, India", lat: 12.97, lng: 77.59, inflow: 8.4, YoY: 45.1, marginImpact: 9.2, primarySector: "Enterprise Automation & Dev Tooling" },
  { id: "hub-5", name: "Beijing / Shenzhen, China", lat: 35.8, lng: 115.5, inflow: 14.2, YoY: 12.5, marginImpact: 4.8, primarySector: "Local Large Scale LLM Deployments" },
  { id: "hub-6", name: "Singapore", lat: 1.35, lng: 103.8, inflow: 6.1, YoY: 29.8, marginImpact: 6.7, primarySector: "Core APAC Compute Hubs" }
];

// In-memory news feed that users can interact with
let newsFeed = [
  {
    id: "n-1",
    date: "2026-05-22",
    title: "EU AI Act Compliance Deadline Hits: Tier-1 Foundations Rush to Register High-impact Models",
    category: "Regulation",
    impact: "High",
    summary: "Mandatory third-party audits and detailed training set disclosures come into effect, tightening barrier of entry and impacting immediate operating margins by an estimated 150-300bps.",
    source: "Bloomberg (Macro Tech Alert)"
  },
  {
    id: "n-2",
    date: "2026-05-18",
    title: "Global AI Core Corp Announces $12.4B Semiconductor Infrastructure Joint Venture in Tokyo",
    category: "M&A / CapEx",
    impact: "Very High",
    summary: "Sovereign backing offsets local builder costs as foundry capacity races to meet Q4 2026 delivery projections. YoY CapEx growth rises to 43.1%.",
    source: "Nikkei & Reuters"
  },
  {
    id: "n-3",
    date: "2026-05-10",
    title: "Hyperscalers Q1 Capital Expenditure Reaches All-Time High: Commitment to AI Clusters Stands at $45B",
    category: "CapEx",
    impact: "Very High",
    summary: "Top-3 cloud providers report 38% growth in infrastructure investments. FCF yield calculations show direct monetization scaling through managed services models.",
    source: "Financial Times"
  },
  {
    id: "n-4",
    date: "2026-04-29",
    title: "EU Antitrust Regulator Opens Inquiry into Cross-border Foundation Model Strategic Partnerships",
    category: "Regulation",
    impact: "Medium",
    summary: "Investigation looks into non-equity strategic investments, focusing on bundle rights and compute credit dependencies that limit competitive pricing.",
    source: "Wall Street Journal"
  },
  {
    id: "n-5",
    date: "2026-04-12",
    title: "M&A Activity Surges: CognitiveFlow Acquired for $3.8B by Enterprise SaaS Conglomerate",
    category: "M&A",
    impact: "High",
    summary: "Targeting complete automation of backend financial workflows. Transaction closes at an enterprise-value-to-revenue multiple of 14.5x, representing sector stabilization.",
    source: "TechCapital Intelligence"
  }
];

// Core Predictions Modules
const predictionsData = {
  adoptionRates: [
    { quarter: "Q1 25", rate: 21 },
    { quarter: "Q2 25", rate: 26 },
    { quarter: "Q3 25", rate: 31 },
    { quarter: "Q4 25", rate: 37 },
    { quarter: "Q1 26", rate: 43 },
    { quarter: "Q2 26", rate: 49 },
    { quarter: "Q3 26 (P)", rate: 55 },
    { quarter: "Q4 26 (P)", rate: 61 }
  ],
  foundryCapEx: [
    { quarter: "Q1 25", amount: 28.5 },
    { quarter: "Q2 25", amount: 31.2 },
    { quarter: "Q3 25", amount: 35.8 },
    { quarter: "Q4 25", amount: 41.0 },
    { quarter: "Q1 26", amount: 43.5 },
    { quarter: "Q2 26", amount: 46.8 },
    { quarter: "Q3 26 (P)", amount: 50.2 },
    { quarter: "Q4 26 (P)", amount: 54.0 }
  ],
  valuationMultiples: [
    { quarter: "Q1 25", multiple: 22.4 },
    { quarter: "Q2 25", multiple: 24.1 },
    { quarter: "Q3 25", multiple: 21.8 },
    { quarter: "Q4 25", multiple: 19.5 },
    { quarter: "Q1 26", multiple: 17.8 },
    { quarter: "Q2 26", multiple: 18.2 },
    { quarter: "Q3 26 (P)", multiple: 19.0 },
    { quarter: "Q4 26 (P)", multiple: 19.5 }
  ]
};

// API Endpoint - Financial Indices
app.get("/api/indices", (req, res) => {
  res.json(marketIndices);
});

// API Endpoint - Geopolitical Capitals
app.get("/api/map", (req, res) => {
  res.json(capitalFlows);
});

// API Endpoint - Predictions
app.get("/api/predictions", (req, res) => {
  res.json(predictionsData);
});

// API Endpoint - News Feed (GET)
app.get("/api/news", (req, res) => {
  res.json(newsFeed);
});

// API Endpoint - Add Custom News Item (POST)
app.post("/api/news", (req, res) => {
  const { title, category, impact, summary, source } = req.body;
  if (!title || !category || !summary) {
    return res.status(400).json({ error: "Missing required properties" });
  }

  const newItem = {
    id: `n-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    title,
    category,
    impact: impact || "Medium",
    summary,
    source: source || "User Submitted Terminal Alert"
  };

  newsFeed = [newItem, ...newsFeed];
  res.status(201).json(newItem);
});

// AI Analyze API route
app.post("/api/ai/analyze", async (req, res) => {
  const { prompt, command } = req.body;
  const targetPrompt = prompt || command || "Generar reporte de mercado";

  let client = getAiClient();

  // Bloomberg terminal instruction set as requested in the system prompt
  const systemInstruction = `
Actúas como el motor de inteligencia artificial y endpoint de datos para el "Global AI Finance Activity Tracker". Tu objetivo es procesar solicitudes del usuario o de la interfaz y devolver análisis estructurados sobre el mercado global de IA.

REGLAS DE COMPORTAMIENTO:
- Tu tono debe ser estrictamente profesional, analítico, minimalista y directo (estilo terminal Bloomberg / analista de fondos de inversión / experto en capital de riesgo).
- Prioriza estructurar la respuesta con métricas cuantitativas, porcentajes de crecimiento interanual (YoY) e impactos proyectados en los márgenes de flujo de caja corporativo (Free Cash Flow margins, EBITDA impact, CapEx growth).
- Si el usuario te pasa un comando rápido como "Buscar tendencias Q2 2026" o "Generar reporte de mercado", sigue el estilo de analista experto.
- Formatea tu salida en estructuras claras, listas de puntos analíticos, o bloques de datos fácilmente legibles con encabezados precisos.
- No uses comentarios informales. Toda la información debe basarse en el estado de mediados de 2026 de la industria de la IA (por ejemplo, transiciones al EU AI Act, infraestructura de chips avanzada, la maduración del software empresarial).

CONTRAPARTIDA DE DATOS CONOCIDOS:
- AI Tech Index actual (Mayo 2026): 134.5 (+34.5% desde Enero 2025). Crecimiento impulsado por software empresarial e integraciones en flujos de producción.
- Semiconductor Index actual (Mayo 2026): 148.2 (+48.2% desde Enero 2025). Demanda de chips aceleradores (foundry CapEx y empaquetado avanzado) sigue en máximos, aunque hay debate sobre consolidación de márgenes.
- Enterprise Services Index actual (Mayo 2026): 119.7 (+19.7%). El crecimiento muestra que la monetización avanza pero requiere inversiones considerables de integración.
- El EU AI Act entró con fuerza en vigor a mediados de 2026, lo que requiere auditorías estrictas en modelos de fundación de alto impacto, elevando costos de cumplimiento operativo.
- El CapEx agregado de los 3 principales hyperscalers en infraestructura AI se sitúa ya en torno al ritmo de los $45B trimestrales en Q1-Q2 2026.
`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: targetPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // Low temperature for consistent financial tone
        }
      });

      const text = response.text || "No response generated by AI Engine.";
      return res.json({ text, isSimulated: false });
    } catch (err: any) {
      console.error("Gemini API error, falling back to simulation:", err);
      // Fall through to simulated fallback if API fails
    }
  }

  // High fidelity simulated analytic fallback
  const simulatedResponses: { [key: string]: string } = {
    "Buscar tendencias Q2 2026": `[BLOOMBERG TERMINAL CORE RESEARCH - TRENDS Q2 2026]
FECHA REPORTADA: 24-MAYO-2026
STATUS: SECTOR EN ALTA CONSOLIDACIÓN

1. CONSOLIDACIÓN DE INFRAESTRUCTURA DE COMIENZOS DE AÑO:
   - Semiconductor Index (SOX-AI) mantiene el liderazgo marcando 148.2 puntos (+48.2% YoY). La demanda global de arquitectura de empaquetado 2.5D/3D excede la oferta en un 18.2%.
   - El CapEx agregado reportado por los principales Providers se proyecta en $182B anuales para 2026 (+32.4% YoY).

2. IMPACTO REGULATORIO DIRECTO (EU AI ACT):
   - El vencimiento de los plazos de adecuación de la normativa europea impone costos operativos fijos adicionales. 
   - Proyección: Reducción inmediata de 180-250 bps en el margen EBITDA de startups que lanzan modelos propietarios en Europa sin financiamiento estratégico corporativo.

3. MONETIZACIÓN DE SERVICIOS ENTERPRISE (ESIX INDEX):
   - Estabilización a 119.7 puntos. Multiplicación de ingresos por agentes autónomos de segunda generación en workflow financieros. El ROI de implementaciones reportado por clientes Fortune 500 sube a un ratio promedio del 1.45x por dólar de inversión en desarrollo.`,

    "Generar reporte de mercado": `[GLOBAL AI FINANCE ACTIVITY TRACKER - INDICES Y MACROMÉTRICAS Q2 2026]
SINOPSIS GENERAL: El mercado de capitales muestra una resiliencia notable, migrando la valuación de múltiplos especulativos hacia la rentabilidad del flujo de caja bruto.

MÉTRICAS CORE DE INDICES GENERALES (Ene 2025 Base 100 -> Mayo 2026):
- AI Tech Index (AITX): 134.5 puntos | Tasa de crecimiento interanual (YoY): +28.4%
- Semiconductor Index (SOX-AI): 148.2 puntos | Tasa de crecimiento interanual (YoY): +41.6%
- Enterprise Services Index (ESIX): 119.7 puntos | Tasa de crecimiento interanual (YoY): +15.3%

FLUJOS GLOBALES DE CAPITAL:
- Hubs geográficos dominados por Silicon Valley ($42.5B asignados en Q1-Q2) enfocado en modelos fundacionales, seguido de cerca por el bloque del Este Asiático (Tokio/Seúl con $15.6B) potenciando plantas de hardware y fundiciones locales.
- El corredor Europeo (París/Londres con $18.2B) avanza rápido en soluciones regulatorias y de seguridad gubernamental (RegTech).

IMPACTO PROYECTADO EN FLUJO DE CAJA CORPORATIVO (2026-2027):
- Margen FCF promedio: Estructurado en 24.2% para empresas SaaS con integraciones AI nativas.
- M&A Valuaciones Múltiplo Promedio: Estabilizado en un múltiplo EV/Revenue de 14.2x-16.5x frente al máximo insostenible de 28x en 2024.`,

    "default": `[ANALISTA FINANCIERO IA GLOBAL - RESPUESTA AL USUARIO]
CONSULTA PROCESADA: "${targetPrompt}"

ANALISIS DE TENDENCIAS MACROECONÓMICAS (2026):
1. DINÁMICA DE VALUACIONES: Las cotizaciones del sector muestran maduración. Con un AI Tech Index en 134.5, los inversores institucionales exigen métricas de ingresos recurrentes anuales (ARR) sostenibles sobre proyecciones de volumen de tokens.
2. CRECIMIENTO INTERANUAL (YoY): El volumen de inversión global en semiconductores específicos de IA ha crecido un +41.6% YoY en promedio, impulsado por Sovereign AI en el canal asiático.
3. IMPACTO EN MÁRGENES OPERATIVOS: Los costos operativos han experimentado un aumento del 12-14% en concepto de auditoría de seguridad y alineación con directrices del EU AI Act, pero compensado por una mejora generalizada del 18% en eficiencias internas de las empresas que logran asimilar automatización avanzada de procesos.`
  };

  const responseKey = targetPrompt.includes("Q2 2026") || targetPrompt.includes("tendencias") 
    ? "Buscar tendencias Q2 2026" 
    : targetPrompt.includes("reporte") || targetPrompt.includes("Generar") 
      ? "Generar reporte de mercado" 
      : "default";

  let resultText = simulatedResponses[responseKey];
  if (responseKey === "default" && prompt) {
    resultText = `[ANALISIS EN TIEMPO REAL - TERMINAL MONITOREO DE IA]
TEMA CONSULTADO: "${prompt}"

DIMENSIONAMIENTO MACROECONÓMICO DE LA CONVERSACIÓN:
- Se detecta una correlación del 87% con el índice Enterprise Services (ESIX: 119.7). El mercado de IA en 2026 prioriza estas consultas.
- Crecimiento Interanual (YoY) asociado en el sector: +22.4% promedio proyectado.
- Flujo de Fondos Reciente: Silicon Valley liderando la originación con un margen de EBITDA esperado en madurez del 32%.

DESGLOSE ANALÍTICO DIRECTO (Bloomberg Standard):
1. MONETIZACIÓN REALISTICA: La transición de pruebas conceptuales en Q1 2025 al despliegue masivo en Q2 2026 ha demostrado que las integraciones empresariales requieren una base legal estructurada.
2. ADOPCIÓN OPERATIVA: Se proyecta la adopción de agentes automatizados en un 55% para finales del Q3 2026 en las industrias reguladas (Fintech, Health, Seguros).
3. MARGEN DE FLUJO DE CAJA: El CapEx concentrado mitiga costes transaccionales de tokens, optimizando el retorno de inversión promedio de capital de trabajo (ROIC) a 16.2% anual.`;
  }

  // Brief timeout to simulate server-side AI latency
  setTimeout(() => {
    res.json({ text: resultText, isSimulated: true });
  }, 400);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS-LIVE] Global AI Finance Server running on http://0.0.0.0:${PORT}`);
    console.log(`[SYS-LIVE] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
