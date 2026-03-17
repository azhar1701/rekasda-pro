import React, { useState } from 'react';
import { ManningInputs, ChannelShape } from '@/types/types';
import { MANNING_ROUGHNESS } from '@/constants';
import { CHART_COLORS } from '@/lib/constants/chartColors';

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
    if (!results?.SafetyStatus) return 'text-slate-400';
    const status = results.SafetyStatus.toLowerCase();
    if (status === 'safe' || status === 'aman') return 'text-emerald-500';
    if (status === 'warning' || status === 'peringatan') return 'text-amber-500';
    return 'text-rose-500';
  };

  const renderCircular = () => {
    const D = inputs.diameter || 1;
    const h = inputs.depth || 0;
    const scale = Math.min(drawAreaW / D, drawAreaH / D);
    const rPx = (D / 2) * scale;
    const hPx = h * scale;
    const centerYCircular = bottomY - rPx;

    const isOverflow = h > D;
    const waterHeight = Math.min(h, D);
    
    let waterPath = "";
    if (waterHeight >= D) {
      waterPath = `M ${centerX} ${centerYCircular - rPx} A ${rPx} ${rPx} 0 1 1 ${centerX} ${centerYCircular + rPx} A ${rPx} ${rPx} 0 1 1 ${centerX} ${centerYCircular - rPx}`;
    } else if (waterHeight > 0) {
      const theta = 2 * Math.acos(1 - (2 * waterHeight) / D);
      const startAngle = Math.PI / 2 - theta / 2;
      const endAngle = Math.PI / 2 + theta / 2;
      
      const startX = centerX + rPx * Math.cos(startAngle);
      const startY = centerYCircular + rPx * Math.sin(startAngle);
      const endX = centerX + rPx * Math.cos(endAngle);
      const endY = centerYCircular + rPx * Math.sin(endAngle);

      const largeArcFlag = theta > Math.PI ? 1 : 0;
      waterPath = `M ${startX} ${startY} A ${rPx} ${rPx} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    }

    // Dynamic positioning for h to avoid D collision when full
    const hRatio = h / D;
    const hTextX = hRatio > 0.85 ? centerX + 25 : centerX + 8;
    const hTextAnchor = hRatio > 0.85 ? "start" : "start";

    return (
      <g className="transition-all duration-300 ease-in-out">
        {/* Main Channel Circle */}
        <circle 
          cx={centerX} cy={centerYCircular} r={rPx} 
          fill={inputs.roughness > 0.02 ? "url(#patternEarth)" : "url(#patternConcrete)"}
          fillOpacity="0.1"
          stroke={isOverflow ? CHART_COLORS.deficit : CHART_COLORS.axisLine}
          strokeWidth="3"
          className="cursor-pointer transition-colors duration-300"
          onMouseEnter={() => setHoveredPart('channel')}
          onMouseLeave={() => setHoveredPart(null)}
        />
        
        {/* Water Level Area with Gradient */}
        {waterPath && (
          <path 
            d={waterPath}
            fill="url(#waterGradient)"
            fillOpacity={hoveredPart === 'water' ? "0.9" : "0.7"}
            className="cursor-pointer transition-all duration-300"
            onMouseEnter={() => setHoveredPart('water')}
            onMouseLeave={() => setHoveredPart(null)}
            filter={hoveredPart === 'water' ? "url(#shadow)" : "none"}
          />
        )}

        {/* Annotations */}
        <g className="text-[10px] font-black fill-slate-500 tracking-tighter tabular-nums" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: '2.5px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          {/* Diameter D */}
          <line x1={centerX - rPx} y1={centerYCircular - rPx - 20} x2={centerX + rPx} y2={centerYCircular - rPx - 20} stroke={CHART_COLORS.gridLine} strokeWidth="1.2" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
          <text x={centerX} y={centerYCircular - rPx - 30} textAnchor="middle" className="fill-slate-400" stroke="none">D: {D.toFixed(2)}m</text>

          {/* Water Depth h */}
          {h > 0 && (
            <g>
              <line 
                x1={centerX} y1={centerYCircular + rPx} 
                x2={centerX} y2={centerYCircular + rPx - hPx} 
                stroke={CHART_COLORS.hydrograph} 
                strokeWidth="1.8" 
                markerStart="url(#arrow-blue)"
              />
              <text x={hTextX} y={centerYCircular + rPx - hPx/2 + 4} textAnchor={hTextAnchor} className="fill-pupr-blue font-black text-[11px]" stroke="none">h: {h.toFixed(2)}m</text>
            </g>
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

    const xBL = centerX - bPx / 2;
    const xBR = centerX + bPx / 2;
    const xTL = centerX - BPx / 2;
    const xTR = centerX + BPx / 2;
    const yTop = bottomY - HPx;

    const actualHPx = HPx > 0 ? HPx : 1;
    const xWL = xBL - ((xBL - xTL) / actualHPx) * hPx;
    const xWR = xBR + ((xTR - xBR) / actualHPx) * hPx;
    const yWater = bottomY - hPx;
    const freeboard = H - h;
    const isOverflow = h > H;

    return (
      <g className="transition-all duration-300 ease-in-out">
        {/* Pattern Background for Channel Structure */}
        <path 
          d={`M ${xTL-20} ${yTop} L ${xTL} ${yTop} L ${xBL} ${bottomY} L ${xBR} ${bottomY} L ${xTR} ${yTop} L ${xTR+20} ${yTop}`}
          fill={inputs.roughness > 0.02 ? "url(#patternEarth)" : "url(#patternConcrete)"}
          className="opacity-20"
        />

        {/* Main Channel Structure Line */}
        <path 
          d={`M ${xTL-20} ${yTop} L ${xTL} ${yTop} L ${xBL} ${bottomY} L ${xBR} ${bottomY} L ${xTR} ${yTop} L ${xTR+20} ${yTop}`}
          fill="none"
          stroke={CHART_COLORS.axisLine}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cursor-pointer"
          onMouseEnter={() => setHoveredPart('channel')}
          onMouseLeave={() => setHoveredPart(null)}
        />

        {/* Water Area with Gradient */}
        <path 
          d={`M ${xBL} ${bottomY} L ${xBR} ${bottomY} L ${xWR} ${yWater} L ${xWL} ${yWater} Z`}
          fill="url(#waterGradient)"
          fillOpacity={hoveredPart === 'water' ? "0.9" : "0.7"}
          className="cursor-pointer transition-all duration-300"
          onMouseEnter={() => setHoveredPart('water')}
          onMouseLeave={() => setHoveredPart(null)}
          filter={hoveredPart === 'water' ? "url(#shadow)" : "none"}
        />
        
        {/* Surface Line */}
        <line 
          x1={xWL} y1={yWater} x2={xWR} y2={yWater} 
          stroke={CHART_COLORS.hydrograph} 
          strokeWidth="2.5" 
          strokeDasharray={isOverflow ? "none" : "4 2"}
          className="animate-pulse"
        />

        {/* Dimension Annotations with Markers */}
        <g className="text-[10px] font-black fill-slate-500 tracking-tighter tabular-nums" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: '2.5px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          {/* Bottom Width b */}
          <line x1={xBL} y1={bottomY + 18} x2={xBR} y2={bottomY + 18} stroke={CHART_COLORS.gridLine} strokeWidth="1.2" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
          <text x={centerX} y={bottomY + 32} textAnchor="middle" className="fill-slate-400" stroke="none">b: {b.toFixed(2)}m</text>

          {/* Top Width B */}
          <line x1={xTL} y1={yTop - 18} x2={xTR} y2={yTop - 18} stroke={CHART_COLORS.gridLine} strokeWidth="1.2" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
          <text x={centerX} y={yTop - 30} textAnchor="middle" className="fill-slate-400" stroke="none">B: {B.toFixed(2)}m</text>

          {/* Water Depth h - Positioned slightly right to avoid strike-through */}
          {h > 0 && (
            <g>
              <line 
                x1={centerX - 25} y1={bottomY} x2={centerX - 25} y2={yWater} 
                stroke={CHART_COLORS.hydrograph} 
                strokeWidth="1.8" 
                markerStart="url(#arrow-blue)" 
              />
              <text x={centerX - 12} y={yWater + hPx/2 + 4} textAnchor="start" className="fill-pupr-blue font-black text-[11px]" stroke="none">h: {h.toFixed(2)}m</text>
            </g>
          )}

          {/* Total Depth H & Freeboard - Polished Vertical Stacking */}
          <g>
            <line x1={xTR + 25} y1={bottomY} x2={xTR + 25} y2={yTop} stroke={CHART_COLORS.gridLine} strokeWidth="1.2" strokeDasharray="3 3" />
            <text x={xTR + 32} y={yTop + HPx/2 + 4} textAnchor="start" className="fill-slate-400 font-bold uppercase text-[8px]" stroke="none">H: {H.toFixed(2)}m</text>
            
            {!isOverflow && freeboard > 0 && (
              <text x={xTR + 32} y={yTop + 10} textAnchor="start" className="fill-emerald-600 font-black text-[9px] uppercase tracking-widest" stroke="none">FB: {freeboard.toFixed(2)}m</text>
            )}
          </g>
        </g>
      </g>
    );
  };

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden h-full flex flex-col items-center justify-center">
      {/* Dynamic Data Overlay */}
      {hoveredPart && results && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/95 text-white px-3 py-2 border-l-2 border-pupr-blue shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-left-2 duration-200">
          {hoveredPart === 'water' ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Penampang Basah</span>
              <span className="text-xs font-bold tabular-nums">A = {results.Area} m²</span>
              <span className="text-xs font-bold tabular-nums">P = {results.Perimeter} m</span>
              <span className="text-[10px] font-black text-pupr-blue uppercase mt-1">Q = {results.Discharge} m³/s</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kapasitas Maksimal</span>
              <span className="text-xs font-bold">{getMaterialName()}</span>
              <span className="text-xs font-bold tabular-nums">S = {inputs.slope} m/m</span>
            </div>
          )}
        </div>
      )}

      <svg viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} className="w-full max-w-lg h-auto drop-shadow-sm">
        <defs>
          {/* Professional Dimension Arrow Markers */}
          <marker id="arrow-start" markerWidth="10" markerHeight="10" refX="0" refY="3" orientation="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L4,3 Z" fill={CHART_COLORS.gridLine} />
          </marker>
          <marker id="arrow-end" markerWidth="10" markerHeight="10" refX="4" refY="3" orientation="auto" markerUnits="strokeWidth">
            <path d="M0,3 L4,0 L4,6 Z" fill={CHART_COLORS.gridLine} />
          </marker>
          <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="4" refY="4" orientation="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={CHART_COLORS.hydrograph} />
          </marker>

          {/* Dynamic Water Gradient */}
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.8" />
          </linearGradient>

          {/* Material Patterns */}
          <pattern id="patternConcrete" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
          </pattern>
          <pattern id="patternEarth" patternUnits="userSpaceOnUse" width="8" height="8">
            <circle cx="2" cy="2" r="1" fill="#94a3b8" opacity="0.3" />
          </pattern>

          {/* Filters */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="1" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="animate-in fade-in zoom-in-95 duration-200">
          {inputs.shape === ChannelShape.CIRCULAR ? renderCircular() : renderTrapezoid()}
        </g>
      </svg>
      
      {results && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 w-full flex items-center justify-between">
           <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ratio R/H</span>
                <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300">
                  {(Number(results.Radius || 0) / Number(inputs.depth || 1)).toFixed(3)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Audit</span>
                <span className={`text-[10px] px-2 py-0.5 font-black uppercase tracking-tight border ${
                  getStatusColor().replace('text-', 'border-').replace('text-', 'bg-').replace('500', '500/10')
                } ${getStatusColor()}`}>
                  {results.SafetyStatus || '-'}
                </span>
              </div>
           </div>
           <div className="bg-slate-900 border border-slate-800 px-3 py-2 flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Froude (Fr)</span>
                <span className="text-xs font-black text-white tabular-nums leading-none">{Number(results.Froude || 0).toFixed(3)}</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Discharge (Q)</span>
                <span className="text-xs font-black text-pupr-yellow tabular-nums leading-none">{Number(results.Discharge || 0).toFixed(2)} <small className="text-[8px] opacity-70">m³/s</small></span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
