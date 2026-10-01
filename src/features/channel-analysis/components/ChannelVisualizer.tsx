import React, { useState } from 'react';
import type { ChannelShapeType, ChannelHydraulicResult } from '@/lib/engine/channelEngine';
import { SNI_CHANNEL_MATERIALS } from '@/lib/engine/channelEngine';

interface Props {
  inputs: {
    shape: ChannelShapeType;
    width?: number;
    depth: number;
    totalDepth?: number;
    sideSlope?: number;
    diameter?: number;
    slope: number;
    roughness: number;
    materialId?: string;
  };
  results?: ChannelHydraulicResult | null;
  qDesign?: number | null;
}

export const ChannelVisualizer: React.FC<Props> = ({ inputs, results, qDesign }) => {
  const [hoveredPart, setHoveredPart] = useState<'water' | 'channel' | 'energy' | 'critical' | null>(null);

  const viewBoxW = 440;
  const viewBoxH = 260;
  const paddingX = 50;
  const paddingY = 40;
  const drawAreaW = viewBoxW - paddingX * 2;
  const drawAreaH = viewBoxH - paddingY * 2;
  const centerX = viewBoxW / 2;
  const bottomY = viewBoxH - 35;

  const getMaterialName = () => {
    const material = SNI_CHANNEL_MATERIALS.find(m => m.id === inputs.materialId || Math.abs(m.n - inputs.roughness) < 0.003);
    return material ? material.name : `n = ${inputs.roughness}`;
  };

  const isOverflow = results ? (inputs.totalDepth ? inputs.depth > inputs.totalDepth : false) : false;
  const isVelocityIssue = results ? !results.isVelocitySafe : false;
  const isCapacityIssue = (qDesign && results) ? results.discharge < qDesign : false;

  const getWaterColor = () => {
    if (isOverflow || isCapacityIssue) return '#ef4444'; // Red (Bahaya/Meluap)
    if (isVelocityIssue) return '#f59e0b'; // Amber (Peringatan Gerus/Endap)
    return '#0284c7'; // Blue PUPR (Aman)
  };

  // 1. RENDER CIRCULAR
  const renderCircular = () => {
    const D = Math.max(0.2, inputs.diameter || 1.0);
    const h = Math.max(0, inputs.depth || 0);
    const scale = Math.min(drawAreaW / D, drawAreaH / D) * 0.85;
    const rPx = (D / 2) * scale;
    const hPx = Math.min(h, D) * scale;
    const centerY = bottomY - rPx;

    let waterPath = "";
    if (h >= D) {
      waterPath = `M ${centerX} ${centerY - rPx} A ${rPx} ${rPx} 0 1 1 ${centerX} ${centerY + rPx} A ${rPx} ${rPx} 0 1 1 ${centerX} ${centerY - rPx}`;
    } else if (h > 0) {
      const theta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - (2 * h) / D)));
      const startAngle = Math.PI / 2 - theta / 2;
      const endAngle = Math.PI / 2 + theta / 2;

      const startX = centerX + rPx * Math.cos(startAngle);
      const startY = centerY + rPx * Math.sin(startAngle);
      const endX = centerX + rPx * Math.cos(endAngle);
      const endY = centerY + rPx * Math.sin(endAngle);

      const largeArcFlag = theta > Math.PI ? 1 : 0;
      waterPath = `M ${startX} ${startY} A ${rPx} ${rPx} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    }

    return (
      <g>
        {/* Pipe Wall */}
        <circle
          cx={centerX}
          cy={centerY}
          r={rPx}
          fill="#f8fafc"
          stroke="#475569"
          strokeWidth="4"
          onMouseEnter={() => setHoveredPart('channel')}
          onMouseLeave={() => setHoveredPart(null)}
          className="cursor-pointer transition-all duration-300"
        />

        {/* Water Area */}
        {waterPath && (
          <path
            d={waterPath}
            fill={getWaterColor()}
            fillOpacity="0.45"
            stroke={getWaterColor()}
            strokeWidth="1.5"
            onMouseEnter={() => setHoveredPart('water')}
            onMouseLeave={() => setHoveredPart(null)}
            className="cursor-pointer transition-all duration-300"
          />
        )}

        {/* Dimension labels */}
        <g className="text-xs font-semibold fill-slate-600">
          <line x1={centerX - rPx} y1={centerY - rPx - 10} x2={centerX + rPx} y2={centerY - rPx - 10} stroke="#94a3b8" strokeWidth="1.5" markerStart="url(#dot)" markerEnd="url(#dot)" />
          <text x={centerX} y={centerY - rPx - 16} textAnchor="middle" className="fill-slate-700 font-bold text-[11px]">D = {D.toFixed(2)} m</text>

          {h > 0 && (
            <>
              <line x1={centerX} y1={centerY + rPx} x2={centerX} y2={centerY + rPx - hPx} stroke="#0284c7" strokeWidth="2" strokeDasharray="3 2" />
              <text x={centerX + 10} y={centerY + rPx - hPx / 2 + 4} textAnchor="start" className="fill-blue-700 font-bold text-[11px]">h = {h.toFixed(2)} m</text>
            </>
          )}
        </g>
      </g>
    );
  };

  // 2. RENDER TRAPEZOID & RECTANGULAR & TRIANGULAR
  const renderPolygonChannel = () => {
    const isTriangular = inputs.shape === 'triangular';
    const isRectangular = inputs.shape === 'rectangular';

    const b = isTriangular ? 0 : Math.max(0.1, inputs.width || 1.0);
    const m = isRectangular ? 0 : Math.max(0, inputs.sideSlope ?? (isTriangular ? 1.0 : 1.0));
    const h = Math.max(0, inputs.depth || 0);
    const H = Math.max(h, inputs.totalDepth || (h * 1.3));

    const topWidthTotal = b + 2 * m * H;

    const maxDisplayW = Math.max(topWidthTotal * 1.15, 1.0);
    const maxDisplayH = Math.max(H * 1.25, 0.5);
    const scale = Math.min(drawAreaW / maxDisplayW, drawAreaH / maxDisplayH);

    const bPx = b * scale;
    const HPx = H * scale;
    const hPx = h * scale;
    const mHPx = (m * H) * scale;
    const mhPx = (m * h) * scale;

    // Bed coordinates
    const xBL = centerX - bPx / 2;
    const xBR = centerX + bPx / 2;
    const yBed = bottomY;

    // Channel Top coordinates
    const xTL = xBL - mHPx;
    const xTR = xBR + mHPx;
    const yTop = yBed - HPx;

    // Water level coordinates
    const xWL = xBL - mhPx;
    const xWR = xBR + mhPx;
    const yWater = yBed - hPx;

    // Critical Depth (yc) coordinates
    const yc = results?.criticalDepth ? Math.min(results.criticalDepth, H) : null;
    const ycPxFan = yc ? yc * scale : 0;
    const yCrit = yc ? yBed - ycPxFan : null;
    const xCritL = yc ? xBL - (m * yc * scale) : 0;
    const xCritR = yc ? xBR + (m * yc * scale) : 0;

    // Specific Energy (E = h + V²/2g)
    const E = results?.specificEnergy ? Math.min(results.specificEnergy, H * 1.3) : null;
    const yEPx = E ? E * scale : 0;
    const yEnergy = E ? yBed - yEPx : null;

    // Channel boundary path
    const channelPath = isTriangular
      ? `M ${xTL - 15} ${yTop} L ${xTL} ${yTop} L ${centerX} ${yBed} L ${xTR} ${yTop} L ${xTR + 15} ${yTop}`
      : `M ${xTL - 15} ${yTop} L ${xTL} ${yTop} L ${xBL} ${yBed} L ${xBR} ${yBed} L ${xTR} ${yTop} L ${xTR + 15} ${yTop}`;

    // Water polygon path
    const waterPath = isTriangular
      ? `M ${centerX} ${yBed} L ${xWR} ${yWater} L ${xWL} ${yWater} Z`
      : `M ${xBL} ${yBed} L ${xBR} ${yBed} L ${xWR} ${yWater} L ${xWL} ${yWater} Z`;

    return (
      <g>
        {/* Ground fill outside banks */}
        <path
          d={`M ${xTL - 30} ${yTop} L ${xTL} ${yTop} L ${xBL} ${yBed} L ${xBR} ${yBed} L ${xTR} ${yTop} L ${xTR + 30} ${yTop} L ${xTR + 30} ${bottomY + 15} L ${xTL - 30} ${bottomY + 15} Z`}
          fill="#f1f5f9"
          stroke="none"
        />

        {/* Channel Lining (Dinding Saluran) */}
        <path
          d={channelPath}
          fill="none"
          stroke="#334155"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          onMouseEnter={() => setHoveredPart('channel')}
          onMouseLeave={() => setHoveredPart(null)}
          className="cursor-pointer transition-all duration-300"
        />

        {/* Water Area */}
        {h > 0 && (
          <path
            d={waterPath}
            fill={getWaterColor()}
            fillOpacity="0.38"
            stroke={getWaterColor()}
            strokeWidth="1.5"
            onMouseEnter={() => setHoveredPart('water')}
            onMouseLeave={() => setHoveredPart(null)}
            className="cursor-pointer transition-all duration-300"
          />
        )}

        {/* Water Surface Line */}
        {h > 0 && (
          <line
            x1={xWL}
            y1={yWater}
            x2={xWR}
            y2={yWater}
            stroke={getWaterColor()}
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        )}

        {/* Critical Depth line (yc) */}
        {yCrit !== null && yc && yc < H && (
          <g
            onMouseEnter={() => setHoveredPart('critical')}
            onMouseLeave={() => setHoveredPart(null)}
            className="cursor-help"
          >
            <line
              x1={xCritL}
              y1={yCrit}
              x2={xCritR}
              y2={yCrit}
              stroke="#d97706"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text x={xCritR + 6} y={yCrit + 3} className="fill-amber-700 text-[9px] font-bold">
              yc: {yc.toFixed(2)}m
            </text>
          </g>
        )}

        {/* Energy Head line (E) */}
        {yEnergy !== null && yEnergy > 10 && results?.specificEnergy !== undefined && (
          <g
            onMouseEnter={() => setHoveredPart('energy')}
            onMouseLeave={() => setHoveredPart(null)}
            className="cursor-help"
          >
            <line
              x1={xWL - 10}
              y1={yEnergy}
              x2={xWR + 10}
              y2={yEnergy}
              stroke="#7c3aed"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <text x={xWR + 14} y={yEnergy + 3} className="fill-purple-700 text-[9px] font-bold">
              E = {results.specificEnergy ? results.specificEnergy.toFixed(2) : '-'}m
            </text>
          </g>
        )}

        {/* Dimension Annotations */}
        <g className="text-xs font-semibold">
          {/* Bottom width b */}
          {!isTriangular && b > 0 && (
            <>
              <line x1={xBL} y1={yBed + 10} x2={xBR} y2={yBed + 10} stroke="#94a3b8" strokeWidth="1.5" markerStart="url(#dot)" markerEnd="url(#dot)" />
              <text x={centerX} y={yBed + 22} textAnchor="middle" className="fill-slate-700 font-bold text-[10px]">b = {b.toFixed(2)} m</text>
            </>
          )}

          {/* Top width B */}
          <line x1={xTL} y1={yTop - 10} x2={xTR} y2={yTop - 10} stroke="#94a3b8" strokeWidth="1.5" markerStart="url(#dot)" markerEnd="url(#dot)" />
          <text x={centerX} y={yTop - 15} textAnchor="middle" className="fill-slate-700 font-bold text-[10px]">B = {topWidthTotal.toFixed(2)} m</text>

          {/* Water Depth h */}
          {h > 0 && (
            <g>
              <line x1={centerX} y1={yBed} x2={centerX} y2={yWater} stroke={getWaterColor()} strokeWidth="1.5" strokeDasharray="3 2" />
              <text x={centerX + 6} y={yBed - hPx / 2 + 3} textAnchor="start" className="fill-blue-800 font-bold text-[10px]">
                h = {h.toFixed(2)} m
              </text>
            </g>
          )}

          {/* Side slope slope label */}
          {m > 0 && (
            <text x={xTL + 12} y={yBed - HPx / 2} className="fill-slate-500 font-semibold text-[9px]">
              1 : {m}
            </text>
          )}
        </g>
      </g>
    );
  };

  return (
    <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-200 relative overflow-hidden">
      {/* Tooltip on Hover */}
      {hoveredPart && results && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 text-white px-3 py-2 rounded-md text-xs shadow-lg backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {hoveredPart === 'water' && (
            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold text-sky-300">Badan Aliran Air</div>
              <div>Luas Penampang Basah (A): <strong>{results.area.toFixed(3)} m²</strong></div>
              <div>Keliling Basah (P): <strong>{results.wettedPerimeter.toFixed(3)} m</strong></div>
              <div>Jari-jari Hidrolis (R): <strong>{results.hydraulicRadius.toFixed(3)} m</strong></div>
              <div>Debit Aliran (Q): <strong>{results.discharge.toFixed(3)} m³/s</strong></div>
            </div>
          )}
          {hoveredPart === 'channel' && (
            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold text-slate-300">Konstruksi Dinding Saluran</div>
              <div>Material: <strong>{getMaterialName()}</strong></div>
              <div>Kekasaran Manning (n): <strong>{inputs.roughness}</strong></div>
              <div>Kemiringan Dasar (S): <strong>{inputs.slope} m/m</strong></div>
            </div>
          )}
          {hoveredPart === 'critical' && (
            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold text-amber-300">Garis Kedalaman Kritis (yc)</div>
              <div>Kedalaman Kritis: <strong>{results.criticalDepth.toFixed(3)} m</strong></div>
              <div>Kondisi Aliran: <strong>{results.flowRegime} (Fr = {results.froudeNumber.toFixed(2)})</strong></div>
            </div>
          )}
          {hoveredPart === 'energy' && (
            <div className="space-y-0.5 text-[11px]">
              <div className="font-bold text-purple-300">Garis Energi Spesifik (E)</div>
              <div>Tinggi Tekan (h): <strong>{inputs.depth.toFixed(2)} m</strong></div>
              <div>Tinggi Kecepatan (V²/2g): <strong>{results.velocityHead.toFixed(3)} m</strong></div>
              <div>Energi Spesifik Total: <strong>{results.specificEnergy.toFixed(3)} m</strong></div>
            </div>
          )}
        </div>
      )}

      {/* SVG Canvas */}
      <svg viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} className="w-full h-auto select-none">
        <defs>
          <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <circle cx="3" cy="3" r="2" fill="#94a3b8" />
          </marker>
        </defs>
        {inputs.shape === 'circular' ? renderCircular() : renderPolygonChannel()}
      </svg>

      {/* Footer Metrics Row */}
      {results && (
        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="bg-white p-2 rounded border border-slate-200">
            <span className="text-slate-400 block text-[9px] font-bold uppercase">Luas Basah (A)</span>
            <span className="font-bold text-slate-800">{results.area.toFixed(2)} m²</span>
          </div>
          <div className="bg-white p-2 rounded border border-slate-200">
            <span className="text-slate-400 block text-[9px] font-bold uppercase">Keliling Basah (P)</span>
            <span className="font-bold text-slate-800">{results.wettedPerimeter.toFixed(2)} m</span>
          </div>
          <div className="bg-white p-2 rounded border border-slate-200">
            <span className="text-slate-400 block text-[9px] font-bold uppercase">Jari-Jari Hidrolis (R)</span>
            <span className="font-bold text-slate-800">{results.hydraulicRadius.toFixed(3)} m</span>
          </div>
          <div className="bg-white p-2 rounded border border-slate-200">
            <span className="text-slate-400 block text-[9px] font-bold uppercase">Tinggi Jagaan Aktual</span>
            <span className={`font-bold ${results.isFreeboardSafe ? 'text-emerald-700' : 'text-rose-600'}`}>
              {results.freeboardActual.toFixed(2)} m
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
