
import React, { useState } from 'react';
import { ManningInputs, ChannelShape } from '../types';
import { MANNING_ROUGHNESS } from '../constants';

interface Props {
  inputs: ManningInputs;
  results?: any;
}

export const ChannelVisualizer: React.FC<Props> = ({ inputs, results }) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const viewBoxW = 400;
  const viewBoxH = 280; // Increased height to accommodate top dimensions
  const padding = 60;
  const drawAreaW = viewBoxW - padding * 2;
  const drawAreaH = viewBoxH - padding * 2;
  const centerX = viewBoxW / 2;
  const bottomY = viewBoxH - padding;

  const material = MANNING_ROUGHNESS.find(m => m.value === inputs.roughness);

  const renderCircular = () => {
    const D = inputs.diameter || 1;
    const h = inputs.depth || 0;
    const scale = Math.min(drawAreaW / D, drawAreaH / D);
    const rPx = (D / 2) * scale;
    const hPx = h * scale;
    const centerY = bottomY - rPx; // Geometric center of the circle

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
      <g className="transition-all duration-500 ease-in-out">
        {/* Main Circle */}
        <circle 
          cx={centerX} cy={centerY} r={rPx} 
          className={`fill-none stroke-gray-700 stroke-[4] transition-colors cursor-pointer ${hoveredPart === 'wall' ? 'stroke-safety-blue' : ''}`}
          onMouseEnter={() => setHoveredPart('wall')}
          onMouseLeave={() => setHoveredPart(null)}
        />
        
        {/* Water Fill */}
        {waterPath && (
          <path 
            d={waterPath}
            className={`transition-all duration-500 fill-safety-blue/60 hover:fill-safety-blue/80 cursor-pointer ${isOverflow ? 'fill-red-500/70 animate-pulse' : ''}`}
            onMouseEnter={() => setHoveredPart('water')}
            onMouseLeave={() => setHoveredPart(null)}
          />
        )}

        <g className="text-[10px] font-black fill-gray-500 select-none pointer-events-none">
          
          {/* --- LABEL DIAMETER (Outside Top) --- */}
          {/* Extension lines going up */}
          <path d={`M ${centerX - rPx} ${centerY} L ${centerX - rPx} ${centerY - rPx - 25}`} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d={`M ${centerX + rPx} ${centerY} L ${centerX + rPx} ${centerY - rPx - 25}`} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
          
          {/* Dimension Line */}
          <path d={`M ${centerX - rPx} ${centerY - rPx - 15} L ${centerX + rPx} ${centerY - rPx - 15}`} stroke="#64748b" markerStart="url(#tick)" markerEnd="url(#tick)" />
          
          {/* Text D */}
          <rect x={centerX - 20} y={centerY - rPx - 28} width="40" height="14" fill="white" rx="4" className="opacity-80" />
          <text x={centerX} y={centerY - rPx - 18} textAnchor="middle" className="fill-slate-600 font-bold">D: {D}m</text>


          {/* --- LABEL WATER HEIGHT (Inside Center) --- */}
          {h > 0 && (
            <g>
               {/* Vertical Line */}
               <path d={`M ${centerX} ${centerY + rPx} L ${centerX} ${centerY + rPx - (isOverflow ? D*scale : hPx)}`} stroke="#0057b7" strokeWidth="2" />
               
               {/* Text h with background for legibility */}
               <g transform={`translate(${centerX + 6}, ${centerY + rPx - hPx/2})`}>
                  <rect x="-2" y="-7" width="38" height="14" fill="white" rx="3" className="opacity-70" />
                  <text x="0" y="3" textAnchor="start" className="fill-safety-blue font-black">h: {h}m</text>
               </g>
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
      <g className="transition-all duration-500 ease-in-out">
        {/* Penampang Fisik */}
        <path 
          d={`M ${xTL-20} ${yTop} L ${xTL} ${yTop} L ${xBL} ${bottomY} L ${xBR} ${bottomY} L ${xTR} ${yTop} L ${xTR+20} ${yTop}`}
          fill="none"
          stroke="#4b5563"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-colors duration-300 cursor-pointer ${hoveredPart === 'wall' ? 'stroke-safety-blue' : ''}`}
          onMouseEnter={() => setHoveredPart('wall')}
          onMouseLeave={() => setHoveredPart(null)}
        />

        {/* Air */}
        <path 
          d={`M ${xBL} ${bottomY} L ${xBR} ${bottomY} L ${xWR} ${yWater} L ${xWL} ${yWater} Z`}
          className={`transition-all duration-500 fill-safety-blue/50 hover:fill-safety-blue/70 cursor-pointer ${isOverflow ? 'fill-red-500/60 animate-pulse' : ''}`}
          onMouseEnter={() => setHoveredPart('water')}
          onMouseLeave={() => setHoveredPart(null)}
        />

        <g className="text-[10px] font-black fill-gray-500 select-none pointer-events-none">
          {/* Label Lebar Bawah */}
          <path d={`M ${xBL} ${bottomY + 10} L ${xBR} ${bottomY + 10}`} stroke="#94a3b8" markerStart="url(#tick)" markerEnd="url(#tick)" />
          <text x={centerX} y={bottomY + 22} textAnchor="middle">b: {b}m</text>

          {/* Label Lebar Atas */}
          <path d={`M ${xTL} ${yTop - 10} L ${xTR} ${yTop - 10}`} stroke="#94a3b8" markerStart="url(#tick)" markerEnd="url(#tick)" />
          <text x={centerX} y={yTop - 18} textAnchor="middle">B: {B}m</text>

          {h > 0 && (
            <g>
              <path d={`M ${centerX - bPx/4} ${bottomY} L ${centerX - bPx/4} ${yWater}`} stroke="#0057b7" strokeDasharray="2 2" />
              <g transform={`translate(${centerX - bPx/4 - 6}, ${yWater + hPx/2})`}>
                 <rect x="-30" y="-7" width="35" height="14" fill="white" rx="3" className="opacity-70" />
                 <text x="0" y="3" textAnchor="end" className="fill-safety-blue font-black">h: {h}m</text>
              </g>
            </g>
          )}
        </g>
      </g>
    );
  };

  return (
    <div className="relative group bg-white p-2 rounded-2xl">
      <div className="absolute top-2 left-2 right-2 pointer-events-none z-20 flex justify-center">
        {hoveredPart === 'water' && results && (
          <div className="bg-safety-blue/95 backdrop-blur-md text-white p-4 rounded-2xl text-[10px] font-bold shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-2 duration-300 min-w-[220px]">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-4 border-b border-white/20 pb-1.5 mb-1">
                <span className="opacity-70 uppercase tracking-tighter font-black">DATA HIDROLIKA AIR</span>
                <span className="font-black">h={inputs.depth}m</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="opacity-70 uppercase tracking-tighter">Luas Basah (A)</span>
                <span className="font-black">{results.Area} m²</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex justify-center items-center bg-gray-50/50 rounded-xl border border-gray-100/50">
        <svg viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} className="w-full h-auto max-w-[400px]" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tick" markerWidth="1" markerHeight="10" refX="0.5" refY="5" orient="auto">
              <line x1="0.5" y1="0" x2="0.5" y2="10" stroke="#94a3b8" strokeWidth="1" />
            </marker>
          </defs>
          {inputs.shape === ChannelShape.CIRCULAR ? renderCircular() : renderTrapezoid()}
        </svg>
      </div>
    </div>
  );
};
