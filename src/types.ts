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
