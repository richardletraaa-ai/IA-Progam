export interface MarketIndex {
  name: string;
  code: string;
  current: number;
  changeYoY: number;
  points: number[];
}

export interface IndexDataset {
  dates: string[];
  datasets: MarketIndex[];
}

export interface CapitalFlowHub {
  id: string;
  name: string;
  lat: number;
  lng: number;
  inflow: number; // in Billions USD
  YoY: number; // YoY percentage change
  marginImpact: number; // projected basis points or % impact on corporate EBITDA
  primarySector: string;
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  category: string;
  impact: "Low" | "Medium" | "High" | "Very High";
  summary: string;
  source: string;
}

export interface PredictionItem {
  quarter: string;
  rate?: number;
  amount?: number;
  multiple?: number;
}

export interface PredictionsData {
  adoptionRates: Array<{ quarter: string; rate: number }>;
  foundryCapEx: Array<{ quarter: string; amount: number }>;
  valuationMultiples: Array<{ quarter: string; multiple: number }>;
}

export interface AiResponse {
  text: string;
  isSimulated: boolean;
}

export interface InfraProject {
  id: string;
  name: string;               // Nombre del proyecto/instalación
  lat: number;
  lng: number;
  status: "confirmed" | "permitted" | "announced" | "review";
  investor: string;           // Quién invierte
  investorCountry: string;    // País de origen del capital
  amount: number;             // En billones USD
  currency: "USD" | "EUR" | "JPY" | "GBP";
  sector: string;             // "Data Center" | "Semiconductor Fab" | "AI Research Campus" | etc.
  purpose: string;            // Descripción de la finalidad
  capacity: string;           // Ej: "200MW compute" | "3nm wafer production" | "10,000 H100 GPUs"
  operationsDate: string;     // Fecha estimada de apertura "Q3 2027"
  confirmed: boolean;         // Si hay anuncio oficial o fuente primaria
  confirmationSource: string; // Ej: "Bloomberg 2026-04-12" | "Official Press Release"
  annualROI: number;          // % proyectado
  jobsCreated: number;
  notes: string;              // Detalles adicionales relevantes
}
