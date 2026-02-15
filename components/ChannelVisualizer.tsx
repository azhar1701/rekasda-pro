import React, { useState } from 'react';
import { ManningInputs, ChannelShape } from '../types';
import { MANNING_ROUGHNESS } from '../constants';

interface Props {
  inputs: ManningInputs;
  results?: any;
}

export const ChannelVisualizer: React.FC<Props> = ({ inputs, results }) => {
  const [hoveredPart, setHoveredPart] = useState<'water' | 'channel' | null>(null);
  
  const viewBoxW = 400;
  const viewBoxH = 250;
  const padding = 50;
  const drawAreaW = viewBoxW - padding * 2;
  const drawAreaH = viewBoxH - padding * 2;
  const centerX = viewBoxW / 2;
  const bottomY = viewBoxH - padding;

  const getMaterialName = () => {
    const material = MANNING_ROUGHNESS.find(m => m.value === inputs.roughness);
    return material ? material.name : `n = ${inputs.roughness}`;
  };

  const getStatusColor = () => {
    if (!results?.SafetyStatus) return 'bg-slate-100 text-slate-700';
    const status = results.SafetyStatus.toLowerCase();
    if (status === 'safe' || status === 'aman') return 'bg-emerald-100 text-emerald-700';
    if (status === 'warning' || status === 'peringatan') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const renderCircular = () => {
    const D = inputs.diameter || 1;
    const h = inputs.depth || 0;
    const scale = Math.min(drawAreaW / D, drawAreaH / D);
    const rPx = (D / 2) * scale;
    const hPx = h * scale;
    const centerY = bottomY - rPx;

    const isOverflow = h > D;
    const waterHeight = Math.min(h, D);
    
    let waterPath = "";
    if (waterHeight >= D) {
      waterPath = `M ${centerX} ${centerY - rPx} A ${rPx} ${rPx} 0 1 1 ${centerX} ${centerY + rPx} A ${rPx} ${rPx} 0 1 1 ${centerX} ${centerY - rPx}`;
    } else if (waterHeight > 0) {
      const theta = 2 * Math.acos(1 - (2 * waterHeight) / D);
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
      <g className="transition-all duration-500 ease-out">
        <circle 
          cx={centerX} cy={centerY} r={rPx} 
          fill="none"
          stroke="#334155"
          strokeWidth="3"
          className="cursor-help transition-all duration-500 ease-out"
          onMouseEnter={() => setHoveredPart('channel')}
          onMouseLeave={() => setHoveredPart(null)}
        />
        
        {waterPath && (
          <path 
            d={waterPath}
            fill={isOverflow ? '#ef4444' : '#0d9488'}
            opacity="0.7"
            className="cursor-help transition-all duration-500 ease-out"
            onMouseEnter={() => setHoveredPart('water')}
            onMouseLeave={() => setHoveredPart(null)}
          />
        )}

        <g className="text-xs font-semibold fill-slate-600 transition-all duration-500 ease-out">
          <line x1={centerX - rPx} y1={centerY - rPx - 15} x2={centerX + rPx} y2={centerY - rPx - 15} stroke="#94a3b8" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" className="transition-all duration-500 ease-out" />
          <text x={centerX} y={centerY - rPx - 20} textAnchor="middle" className="fill-slate-700 font-bold text-[11px] transition-all duration-500 ease-out">D: {D}m</text>

          {h > 0 && (
            <>
              <line x1={centerX} y1={centerY + rPx} x2={centerX} y2={centerY + rPx - hPx} stroke="#0d9488" strokeWidth="2" strokeDasharray="3 2" className="transition-all duration-500 ease-out" />
              <text x={centerX + 8} y={centerY + rPx - hPx/2 + 4} textAnchor="start" className="fill-teal-700 font-bold text-[11px] transition-all duration-500 ease-out">h: {h}m</text>
            </>
          )}
        </g>
      </g>
    );
  };

  const renderTrapezoid = () => {
    const b = inputs.width || 1;
    const B = inputs.topWidth || b * 1.2;
    const h = inputs.depth || 0;
    const H = inputs.totalDepth || h * 1.2;
    const z = inputs.sideSlope || 0;

    const maxDisplayH = Math.max(H, h);
    const maxDisplayW = Math.max(B, b + 2 * z * h);
    const scale = Math.min(drawAreaW / maxDisplayW, drawAreaH / maxDisplayH);
    
    const bPx = b * scale;
    const BPx = B * scale;
    const HPx = H * scale;
    const hPx = Math.min(h, H) * scale;
    const zhPx = (z * Math.min(h, H)) * scale;

    const xBL = centerX - bPx / 2;
    const xBR = centerX + bPx / 2;
    const xTL = centerX - BPx / 2;
    const xTR = centerX + BPx / 2;
    const yTop = bottomY - HPx;

    const xWL = xBL - zhPx;
    const xWR = xBR + zhPx;
    const yWater = bottomY - hPx;

    const isOverflow = h > H;

    return (
      <g className="transition-all duration-500 ease-out">
        <path 
          d={`M ${xTL-15} ${yTop} L ${xTL} ${yTop} L ${xBL} ${bottomY} L ${xBR} ${bottomY} L ${xTR} ${yTop} L ${xTR+15} ${yTop}`}
          fill="none"
          stroke="#334155"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cursor-help transition-all duration-500 ease-out"
          onMouseEnter={() => setHoveredPart('channel')}
          onMouseLeave={() => setHoveredPart(null)}
        />

        <path 
          d={`M ${xBL} ${bottomY} L ${xBR} ${bottomY} L ${xWR} ${yWater} L ${xWL} ${yWater} Z`}
          fill={isOverflow ? '#ef4444' : '#0d9488'}
          opacity="0.7"
          className="cursor-help transition-all duration-500 ease-out"
          onMouseEnter={() => setHoveredPart('water')}
          onMouseLeave={() => setHoveredPart(null)}
        />

        <g className="text-xs font-semibold fill-slate-600 transition-all duration-500 ease-out">
          <line x1={xBL} y1={bottomY + 12} x2={xBR} y2={bottomY + 12} stroke="#94a3b8" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" className="transition-all duration-500 ease-out" />
          <text x={centerX} y={bottomY + 24} textAnchor="middle" className="fill-slate-700 font-bold text-[11px] transition-all duration-500 ease-out">b: {b}m</text>

          <line x1={xTL} y1={yTop - 12} x2={xTR} y2={yTop - 12} stroke="#94a3b8" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" className="transition-all duration-500 ease-out" />
          <text x={centerX} y={yTop - 16} textAnchor="middle" className="fill-slate-700 font-bold text-[11px] transition-all duration-500 ease-out">B: {B}m</text>

          {h > 0 && (
            <>
              <line x1={centerX} y1={bottomY} x2={centerX} y2={yWater} stroke="#0d9488" strokeWidth="2" strokeDasharray="3 2" className="transition-all duration-500 ease-out" />
              <text x={centerX + 8} y={yWater + hPx/2 + 4} textAnchor="start" className="fill-teal-700 font-bold text-[11px] transition-all duration-500 ease-out">h: {h}m</text>
            </>
          )}
        </g>
      </g>
    );
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 relative">
      {/* Tooltip */}
      {hoveredPart && results && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
          {hoveredPart === 'water' ? (
            <div className="space-y-1">
              <div className="font-bold text-teal-300">Badan Air</div>
              <div>Luas: {results.Area} m²</div>
              <div>Keliling Basah: {results.Perimeter} m</div>
              <div>Debit: {results.Discharge} m³/s</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-bold text-slate-300">Saluran</div>
              <div>Material: {getMaterialName()}</div>
              <div>Kemiringan: {inputs.slope} m/m</div>
            </div>
          )}
        </div>
      )}

      <svg viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} className="w-full h-auto">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <circle cx="4" cy="4" r="2" fill="#94a3b8" />
          </marker>
        </defs>
        <g className="animate-in fade-in zoom-in-95 duration-500">
          {inputs.shape === ChannelShape.CIRCULAR ? renderCircular() : renderTrapezoid()}
        </g>
      </svg>
      
      {results && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
          <div className="grid grid-cols-2 gap-2 text-xs flex-1">
            <div className="bg-white rounded px-3 py-2 border border-slate-200 transition-all hover:shadow-md hover:border-teal-300">
              <div className="text-slate-500 font-medium">Luas Basah</div>
              <div className="text-slate-900 font-bold">{results.Area} m²</div>
            </div>
            <div className="bg-white rounded px-3 py-2 border border-slate-200 transition-all hover:shadow-md hover:border-teal-300">
              <div className="text-slate-500 font-medium">Keliling Basah</div>
              <div className="text-slate-900 font-bold">{results.Perimeter} m</div>
            </div>
          </div>
          <div className={`ml-3 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${getStatusColor()}`}>
            {results.SafetyStatus}
          </div>
        </div>
      )}
    </div>
  );
};
