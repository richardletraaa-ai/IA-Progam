import React, { useState } from "react";
import { CapitalFlowHub } from "../types";
import { Landmark, TrendingUp, Cpu, Globe, ArrowRight, ShieldCheck, DollarSign } from "lucide-react";

interface MapPanelProps {
  hubs: CapitalFlowHub[];
  onSelectHub?: (hub: CapitalFlowHub) => void;
}

export default function MapPanel({ hubs, onSelectHub }: MapPanelProps) {
  const [selectedHub, setSelectedHub] = useState<CapitalFlowHub>(hubs[0]);
  const [hoveredHub, setHoveredHub] = useState<CapitalFlowHub | null>(null);

  // Simplified World Map SVG outlines for visual backdrop ( continents )
  // Width: 800, Height: 380, centered roughly
  const mapWidth = 800;
  const mapHeight = 350;

  // Convert lat/lng to simple coordinate math for standard projection approximation inside map bounds
  // center is roughly lat 30, lng 0
  const getXY = (lat: number, lng: number) => {
    // lng goes from -180 to 180, lat from -90 to 90
    // shift center
    const x = ((lng + 180) / 360) * mapWidth;
    // Mercator approximation or simple projection
    const y = ((90 - lat) / 180) * mapHeight + 30;
    return { x, y };
  };

  // Static simplified path outlines representing continents roughly
  const continents = [
    // North America
    "M 120 100 L 190 95 L 220 120 L 260 130 L 250 160 L 210 180 L 160 210 L 145 250 L 138 280 L 145 300 Q 155 310 150 320 T 130 330 L 120 280 L 110 230 L 90 200 L 60 170 L 40 130 Z",
    // South America
    "M 180 250 Q 210 260 230 280 L 220 310 L 180 340 L 170 360 L 160 380 L 155 370 L 158 340 L 170 290 Z",
    // Eurasia / Africa
    "M 330 110 L 370 120 Q 420 80 470 95 L 520 80 L 590 85 L 680 90 L 730 130 Q 750 160 720 180 L 680 190 L 650 220 L 620 200 L 590 215 L 570 240 L 580 250 L 590 280 L 585 300 L 530 290 Q 520 260 500 240 L 480 250 L 450 260 L 420 250 L 390 220 L 375 190 L 350 170 L 330 150 Z",
    // Australia
    "M 650 280 L 690 290 Q 720 310 710 330 L 660 340 L 640 310 Z",
    // Greenland
    "M 260 50 Q 290 40 310 60 L 290 85 Z"
  ];

  const handleSelect = (hub: CapitalFlowHub) => {
    setSelectedHub(hub);
    if (onSelectHub) onSelectHub(hub);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col h-full shadow-lg">
      <div className="border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-zinc-100 font-mono text-sm tracking-wider font-semibold uppercase flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            Mapa Global: Flujo de Capitales Geográfico (Hubs IA 2026)
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Volumen neto de adquisiciones, compute clusters, y capital de riesgo asignado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        {/* Hub Selection Sidebar */}
        <div className="lg:col-span-1 space-y-2 max-h-[300px] lg:max-h-[350px] overflow-y-auto pr-1">
          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-semibold mb-1">Listado de Hubs</div>
          {hubs.map((hub) => {
            const isSel = selectedHub.id === hub.id;
            return (
              <button
                key={hub.id}
                onClick={() => handleSelect(hub)}
                onMouseEnter={() => setHoveredHub(hub)}
                onMouseLeave={() => setHoveredHub(null)}
                className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between ${
                  isSel
                    ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs font-semibold truncate text-zinc-300">{hub.name.split(",")[0]}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{hub.primarySector}</span>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="text-xs text-zinc-200 font-bold font-mono">${hub.inflow.toFixed(1)}B</span>
                  <span className="text-[9px] text-emerald-400 font-mono font-semibold">+{hub.YoY.toFixed(0)}% YoY</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Global Vector SVG and Live Overlay */}
        <div className="lg:col-span-3 flex flex-col h-full bg-black/60 rounded border border-zinc-900 relative min-h-[260px] p-2 overflow-hidden justify-center items-center">
          <div className="absolute top-2 left-2 flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            MONITORING GEOGRAPHIC INTENSITY
          </div>

          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full h-auto text-zinc-800 pointer-events-auto"
            style={{ opacity: 0.8 }}
          >
            {/* Outline Continent Background Map */}
            {continents.map((continentPath, idx) => (
              <path
                key={idx}
                d={continentPath}
                fill="#0c0a09"
                stroke="#1c1917"
                strokeWidth="1.2"
              />
            ))}

            {/* Connecting capital lines from centers if styled, or just concentric waves */}
            {hubs.map((hub) => {
              const { x, y } = getXY(hub.lat, hub.lng);
              const isHovered = hoveredHub?.id === hub.id;
              const isSelected = selectedHub.id === hub.id;
              // Size of capital flows maps ripple
              const pulseSize = hub.inflow * 0.7;

              return (
                <g
                  key={hub.id}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => handleSelect(hub)}
                  onMouseEnter={() => setHoveredHub(hub)}
                  onMouseLeave={() => setHoveredHub(null)}
                >
                  {/* Concentric waves showing investment scope */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pulseSize}
                    className="fill-emerald-500/5 stroke-emerald-500/20"
                    strokeWidth="0.8"
                  />
                  
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={pulseSize * 1.5}
                      className="fill-transparent stroke-emerald-500/10 animate-ping"
                      strokeWidth="0.5"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered || isSelected ? 8 : 4.5}
                    className={`transition-all duration-300 ${
                      isSelected ? "fill-emerald-400 stroke-white stroke-2" : "fill-emerald-600 stroke-zinc-950 stroke-1"
                    }`}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floated Hub Metrics Inspection Panel */}
          <div className="absolute bottom-3 right-3 left-3 md:left-auto bg-zinc-950/95 border border-zinc-800 p-3.5 rounded-md min-w-[270px] shadow-2xl space-y-2 z-10 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" />
                {selectedHub.name}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono rounded">
                Efectos Q2 2026
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase">Flujo Capital Recibido</span>
                <span className="text-base font-bold text-zinc-100 mt-0.5 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 -mr-0.5" />
                  {selectedHub.inflow.toFixed(1)}B
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase">Crecimiento YoY</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5">
                  +{selectedHub.YoY.toFixed(1)}% YoY
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 py-1 border-t border-b border-zinc-900">
              <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Sector Foco Principal</span>
              <span className="text-zinc-300 font-medium flex items-center gap-1 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {selectedHub.primarySector}
              </span>
            </div>

            <div className="bg-emerald-950/10 border border-emerald-500/10 p-2 rounded text-[10px] font-mono text-zinc-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                Efecto Margen Corporativo EBITDA:{" "}
                <span className="text-emerald-400 font-semibold">
                  +{selectedHub.marginImpact.toFixed(1)}% (impacto positivo esperado)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
