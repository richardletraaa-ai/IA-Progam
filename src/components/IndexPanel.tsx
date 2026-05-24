import React, { useState } from "react";
import { IndexDataset, MarketIndex } from "../types";
import { TrendingUp, ArrowUpRight, Shield, Sliders, CheckSquare, Square } from "lucide-react";

interface IndexPanelProps {
  data: IndexDataset;
  onModifyMultiplier: (factor: number) => void;
}

export default function IndexPanel({ data, onModifyMultiplier }: IndexPanelProps) {
  const [activeSeries, setActiveSeries] = useState<string[]>(["AITX", "SOX-AI", "ESIX"]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1.0);

  const toggleSeries = (code: string) => {
    if (activeSeries.includes(code)) {
      if (activeSeries.length > 1) {
        setActiveSeries(activeSeries.filter((x) => x !== code));
      }
    } else {
      setActiveSeries([...activeSeries, code]);
    }
  };

  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setMultiplier(newVal);
    onModifyMultiplier(newVal);
  };

  // SVG Dimension Math basics
  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Global Y range
  const minY = 90;
  const maxY = 160;

  const xStep = chartWidth / (data.dates.length - 1);

  const getCoordinates = (points: number[]) => {
    return points.map((pt, idx) => {
      const x = paddingLeft + idx * xStep;
      // Map min/max Y to chartHeight
      const scaledVal = pt * multiplier;
      const y = paddingTop + chartHeight - ((scaledVal - minY) / (maxY - minY)) * chartHeight;
      return { x, y, val: scaledVal };
    });
  };

  const colors: { [key: string]: { stroke: string; fill: string; shadow: string } } = {
    AITX: { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.05)", shadow: "#047857" },
    "SOX-AI": { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.05)", shadow: "#b45309" },
    ESIX: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.05)", shadow: "#1d4ed8" }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col h-full shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
        <div>
          <h2 className="text-zinc-100 font-mono text-sm tracking-wider font-semibold uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Resumen: Índices de Mercado (Q1 2025 - Q2 2026)
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Base 100 en enero 2025. Datos consolidados de capitales.</p>
        </div>

        {/* Adjust Scenario Simulation Slide */}
        <div className="flex items-center gap-3 bg-zinc-900/60 p-2 rounded-md border border-zinc-800/80">
          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
          <div className="flex flex-col">
            <label className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Simulación Market Stress: {multiplier.toFixed(2)}x</label>
            <input
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={multiplier}
              onChange={handleMultiplierChange}
              className="w-28 accent-emerald-500 cursor-pointer h-1"
            />
          </div>
        </div>
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {data.datasets.map((ds) => {
          const isActive = activeSeries.includes(ds.code);
          const currentVal = ds.current * multiplier;
          return (
            <div
              key={ds.code}
              onClick={() => toggleSeries(ds.code)}
              className={`cursor-pointer border p-3 rounded-md transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-zinc-900/60 border-zinc-700 hover:border-zinc-600"
                  : "bg-zinc-950 border-zinc-900 opacity-40 hover:opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-zinc-400 font-semibold uppercase">{ds.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 font-mono">
                  {ds.code}
                </span>
              </div>
              
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {currentVal.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center font-bold">
                  +{ds.changeYoY.toFixed(1)}% YoY
                  <ArrowUpRight className="w-3.5 h-3.5 ml-0.5 text-emerald-500" />
                </span>
              </div>

              {/* Legend selection box */}
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                <span>Visualización</span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-1.5" style={{ backgroundColor: colors[ds.code].stroke }} />
                  {isActive ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Custom SVG Line Chart */}
      <div className="relative flex-1 min-h-[220px] bg-black/40 rounded border border-zinc-900/60 p-2 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full text-zinc-600"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            // Map clickX to chart coordinates
            const relativeXRatio = clickX / rect.width;
            const chartXValue = relativeXRatio * width;
            
            // Find closest idx
            const stepWidth = chartWidth / (data.dates.length - 1);
            let idx = Math.round((chartXValue - paddingLeft) / stepWidth);
            idx = Math.max(0, Math.min(data.dates.length - 1, idx));
            setHoverIndex(idx);
          }}
        >
          {/* Grid lines (horizontal) */}
          {[100, 110, 120, 130, 140, 150].map((gridVal) => {
            const y = paddingTop + chartHeight - ((gridVal - minY) / (maxY - minY)) * chartHeight;
            return (
              <g key={gridVal}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1c1917"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#57534e"
                  fontSize="9"
                  className="font-mono"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Grid lines / tick markers for Dates (vertical) */}
          {data.dates.map((date, idx) => {
            const x = paddingLeft + idx * xStep;
            const isLabelable = idx % 2 === 0 || idx === data.dates.length - 1; // display every second label
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + chartHeight}
                  stroke={hoverIndex === idx ? "#292524" : "#0c0a09"}
                  strokeWidth="1"
                />
                {isLabelable && (
                  <text
                    x={x}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    fill="#57534e"
                    fontSize="9"
                    className="font-mono"
                  >
                    {date}
                  </text>
                )}
              </g>
            );
          })}

          {/* Vertical indicator for hover state */}
          {hoverIndex !== null && (
            <line
              x1={paddingLeft + hoverIndex * xStep}
              y1={paddingTop}
              x2={paddingLeft + hoverIndex * xStep}
              y2={paddingTop + chartHeight}
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              className="opacity-80"
            />
          )}

          {/* Render lines for active series */}
          {data.datasets.map((ds) => {
            if (!activeSeries.includes(ds.code)) return null;

            const coords = getCoordinates(ds.points);
            let pathString = `M ${coords[0].x} ${coords[0].y}`;
            for (let i = 1; i < coords.length; i++) {
              pathString += ` L ${coords[i].x} ${coords[i].y}`;
            }

            // Fill area path
            const fillPathString = `${pathString} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`;

            return (
              <g key={ds.code}>
                <path
                  d={fillPathString}
                  fill={colors[ds.code].fill}
                  className="transition-all duration-300"
                />
                <path
                  d={pathString}
                  fill="none"
                  stroke={colors[ds.code].stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                
                {/* Dot for current end point */}
                <circle
                  cx={coords[coords.length - 1].x}
                  cy={coords[coords.length - 1].y}
                  r="3.5"
                  fill={colors[ds.code].stroke}
                />

                {/* Draw dot over hovered section */}
                {hoverIndex !== null && hoverIndex < coords.length && (
                  <circle
                    cx={coords[hoverIndex].x}
                    cy={coords[hoverIndex].y}
                    r="5"
                    fill="#000"
                    stroke={colors[ds.code].stroke}
                    strokeWidth="2.5"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover overlay stats panel inside card */}
        {hoverIndex !== null && (
          <div className="absolute top-3 right-3 bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[10px] font-mono shadow-xl space-y-1 z-20 min-w-[150px]">
            <div className="text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1 mb-1 font-bold">
              MES: {data.dates[hoverIndex]}
            </div>
            {data.datasets.map((ds) => {
              if (!activeSeries.includes(ds.code)) return null;
              const val = ds.points[hoverIndex] * multiplier;
              const startVal = ds.points[0] * multiplier;
              const yoyChange = ((val - startVal) / startVal) * 100;
              return (
                <div key={ds.code} className="flex items-center justify-between text-zinc-300 gap-4">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[ds.code].stroke }} />
                    {ds.code}
                  </span>
                  <span className="font-bold text-zinc-100">{val.toFixed(1)}</span>
                  <span className={yoyChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {yoyChange >= 0 ? "+" : ""}{yoyChange.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
