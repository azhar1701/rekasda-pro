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
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl overflow-hidden relative backdrop-blur-xl" style={{ backdropFilter: 'blur(10px)' }}>
      {/* ============================================
          HEADER SECTION - Title & Discharge Value
          ============================================ */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex-1">
          <h3 className="text-slate-100 font-black text-xs uppercase tracking-widest">
            Visualisasi Dinamika Aliran
          </h3>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mt-1.5">
            {label || 'Simulasi Pergerakan Air'}
          </p>
        </div>
        <div className="text-right pl-4">
          <div className="text-white font-black text-4xl leading-none tracking-tight">
            {safeDischarge.toFixed(2)}
          </div>
          <div className="text-slate-400 text-xs font-bold mt-1">m³/s</div>
        </div>
      </div>

      {/* ============================================
          FLOW VISUALIZATION - SVG Path Animation
          ============================================ */}
      <div className="relative h-32 bg-slate-800/60 rounded-xl border border-slate-700/80 flex items-center justify-between px-8 overflow-hidden backdrop-blur-sm">
        {/* Background gradient effect - more visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/5 via-cyan-950/5 to-emerald-950/5 pointer-events-none" />

        {/* SVG Flow Animation */}
        <svg
          viewBox="0 0 600 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
            </linearGradient>
            
            <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>

            <marker
              id="flowArrow"
              markerWidth="8"
              markerHeight="8"
              refX="5"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill="#06b6d4" opacity="0.7" />
            </marker>
          </defs>

          {/* Background stationary line - subtle reference */}
          <line
            x1="50"
            y1="50"
            x2="550"
            y2="50"
            stroke="#1e293b"
            strokeWidth="1"
            opacity="0.6"
            strokeDasharray="4,4"
          />

          {/* Animated flowing line with glow - Main Animation */}
          <line
            x1="50"
            y1="50"
            x2="550"
            y2="50"
            stroke="url(#flowGradient)"
            strokeWidth="4"
            filter="url(#glowFilter)"
            strokeLinecap="round"
            strokeDasharray="40,20"
            markerEnd="url(#flowArrow)"
            style={{
              animation: `flowPathAnimation ${Math.max(2.5, 6 / flowSpeed)}s linear infinite`,
              animationPlayState: safeDischarge > 0 ? 'running' : 'paused',
            }}
          />

          {/* Secondary animated pulse line for extra visual effect */}
          <line
            x1="50"
            y1="50"
            x2="550"
            y2="50"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="40,20"
            opacity="0.3"
            style={{
              animation: `flowPathAnimationDelay ${Math.max(2.5, 6 / flowSpeed)}s linear infinite`,
              animationDelay: `${Math.max(2.5, 6 / flowSpeed) * 0.33}s`,
              animationPlayState: safeDischarge > 0 ? 'running' : 'paused',
            }}
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
          {/* Glow effect on hover */}
          {hoveredNode === 'inlet' && (
            <div className="absolute -inset-5 bg-emerald-500/25 rounded-full blur-xl animate-pulse pointer-events-none" />
          )}
          
          {/* Node circle - Dashed border, green accent */}
          <div className="relative w-13 h-13 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-dashed border-emerald-500/70 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.4)] transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            {type === 'RATIONAL' ? (
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
              </svg>
            )}
          </div>
          
          {/* Label with better styling */}
          <span className="text-xs font-bold text-slate-300 mt-2.5 uppercase tracking-wider">
            {type === 'RATIONAL' ? 'DAS / Hujan' : 'Inlet'}
          </span>
        </div>

        {/* OUTLET Node - Right Side */}
        <div
          className="relative z-20 flex flex-col items-center"
          onMouseEnter={() => setHoveredNode('outlet')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Glow effect on hover */}
          {hoveredNode === 'outlet' && (
            <div className="absolute -inset-5 bg-cyan-500/25 rounded-xl blur-xl animate-pulse pointer-events-none" />
          )}
          
          {/* Node square - Solid border, cyan accent */}
          <div className="relative w-14 h-14 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-solid border-cyan-400/80 flex items-center justify-center cursor-pointer hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-110 transition-all duration-300 shadow-[0_0_16px_rgba(34,211,238,0.3)]">
            {/* Double chevron icon with smooth stroke */}
            <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Label with better styling */}
          <span className="text-xs font-bold text-slate-300 mt-2.5 uppercase tracking-wider">
            Saluran Utama
          </span>
        </div>
      </div>

      {/* ============================================
          STATUS BADGE - Below visualization
          ============================================ */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {/* Status indicator dot */}
        <div className={`w-2 h-2 rounded-full ${
          safeDischarge <= 0 ? 'bg-slate-400 animate-pulse' :
          safeDischarge > 5 ? 'bg-red-400 animate-pulse' :
          'bg-emerald-400 animate-pulse'
        }`} />
        {/* Status badge */}
        <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${
          safeDischarge <= 0 ? 'border-slate-600 text-slate-300 bg-slate-800/50' :
          safeDischarge > 5 ? 'border-red-600/50 text-red-300 bg-red-900/30' :
          'border-emerald-600/50 text-emerald-300 bg-emerald-900/30'
        }`}>
          {status.text}
        </div>
      </div>

      {/* ============================================
          CSS ANIMATIONS - Smooth flow effects
          ============================================ */}
      <style>{`
        @keyframes flowPathAnimation {
          0% {
            stroke-dashoffset: 200;
            opacity: 0.3;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            stroke-dashoffset: -200;
            opacity: 0.3;
          }
        }

        @keyframes flowPathAnimationDelay {
          0% {
            stroke-dashoffset: 200;
            opacity: 0.1;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            stroke-dashoffset: -200;
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
};
