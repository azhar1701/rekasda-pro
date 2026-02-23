import React, { useState } from 'react';

interface FlowInsightProps {
  discharge: number;
  velocity?: number;
  label?: string;
  type: 'MANNING' | 'RATIONAL';
}

/**
 * FlowInsight Component - Production Grade Flow Visualization
 * 
 * Features:
 * - Dark mode elegant design (bg-slate-900 with subtle borders)
 * - Clean typography hierarchy (uppercase title, bold discharge value)
 * - Animated SVG path flow (smooth, professional)
 * - Interactive node styling (dashed green inlet, solid cyan outlet)
 * - Glow effects and hover states
 */
export const FlowInsight: React.FC<FlowInsightProps> = ({ discharge, velocity, label, type }) => {
  const [hoveredNode, setHoveredNode] = useState<'inlet' | 'outlet' | null>(null);
  
  // Validate inputs
  const safeDischarge = typeof discharge === 'number' && !isNaN(discharge) ? discharge : 0;
  const flowSpeed = velocity && typeof velocity === 'number' && !isNaN(velocity) 
    ? Math.min(Math.max(velocity, 0.5), 5) 
    : (safeDischarge > 0 ? 2 : 0);

  // Determine status badge
  const getStatusLabel = (): { text: string; color: string } => {
    if (safeDischarge <= 0) return { text: 'Tidak Ada Aliran', color: 'text-slate-400' };
    if (safeDischarge > 5) return { text: 'Debit Tinggi', color: 'text-red-400' };
    return { text: 'Aliran Normal', color: 'text-emerald-400' };
  };

  const status = getStatusLabel();

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl overflow-hidden relative">
      {/* ============================================
          HEADER SECTION - Title & Discharge Value
          ============================================ */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-slate-100 font-black text-xs uppercase tracking-widest">
            Visualisasi Dinamika Aliran
          </h3>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mt-1">
            {label || 'Simulasi Pergerakan Air'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-white font-black text-3xl leading-tight">
            {safeDischarge.toFixed(2)}
          </div>
          <div className="text-slate-400 text-xs font-bold mt-0.5">m³/s</div>
        </div>
      </div>

      {/* ============================================
          FLOW VISUALIZATION - SVG Path Animation
          ============================================ */}
      <div className="relative h-28 bg-slate-800/40 rounded-xl border border-slate-700 flex items-center justify-between px-6 overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-emerald-900/10 to-slate-900/20 pointer-events-none" />

        {/* SVG Flow Animation */}
        <svg
          viewBox="0 0 600 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
            
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <marker
              id="flowArrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,10 L10,5 z" fill="#06b6d4" opacity="0.8" />
            </marker>
          </defs>

          {/* Background stationary line */}
          <line
            x1="50"
            y1="50"
            x2="550"
            y2="50"
            stroke="#334155"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Animated flowing line with glow */}
          <line
            x1="50"
            y1="50"
            x2="550"
            y2="50"
            stroke="url(#flowGradient)"
            strokeWidth="3"
            filter="url(#glowFilter)"
            strokeLinecap="round"
            markerEnd="url(#flowArrow)"
            className="flow-line-animated"
            style={{
              '--flow-animation-duration': `${Math.max(3, 5 / flowSpeed)}s`,
            } as React.CSSProperties}
          />
        </svg>

        {/* ============================================
            NODE ELEMENTS (Positioned absolutely)
            ============================================ */}
        
        {/* INLET Node - Left Side */}
        <div
          className="relative z-20 flex flex-col items-center"
          onMouseEnter={() => setHoveredNode('inlet')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Glow effect */}
          {hoveredNode === 'inlet' && (
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-lg animate-pulse" />
          )}
          
          {/* Node circle - Dashed border, green accent */}
          <div className="relative w-12 h-12 rounded-full bg-slate-800 border-2 border-dashed border-emerald-500/60 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors duration-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            {type === 'RATIONAL' ? (
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
              </svg>
            )}
          </div>
          
          {/* Label */}
          <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
            {type === 'RATIONAL' ? 'DAS / Hujan' : 'Inlet'}
          </span>
        </div>

        {/* OUTLET Node - Right Side */}
        <div
          className="relative z-20 flex flex-col items-center"
          onMouseEnter={() => setHoveredNode('outlet')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Glow effect */}
          {hoveredNode === 'outlet' && (
            <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-lg animate-pulse" />
          )}
          
          {/* Node square - Solid border, cyan accent */}
          <div className="relative w-14 h-14 rounded-lg bg-slate-800 border-2 border-solid border-cyan-400/70 flex items-center justify-center cursor-pointer hover:border-cyan-300 hover:scale-110 transition-all duration-300 shadow-[0_0_16px_rgba(34,211,238,0.25)]">
            {/* Double chevron icon */}
            <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Label */}
          <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Saluran Utama
          </span>
        </div>
      </div>

      {/* ============================================
          STATUS BADGE - Below visualization
          ============================================ */}
      <div className="mt-4 flex items-center justify-center">
        <div className={`px-3 py-1.5 rounded-full border border-slate-700 text-xs font-bold uppercase tracking-widest ${status.color} bg-slate-800/60`}>
          {status.text}
        </div>
      </div>

      {/* ============================================
          CSS ANIMATIONS - Smooth flow effects
          ============================================ */}
      <style>{`
        @keyframes flowPathAnimation {
          0% {
            stroke-dashoffset: 40;
            opacity: 0.4;
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.4;
          }
        }

        .flow-line-animated {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: flowPathAnimation var(--flow-animation-duration, 3.5s) linear infinite;
        }
      `}</style>
    </div>
  );
};
