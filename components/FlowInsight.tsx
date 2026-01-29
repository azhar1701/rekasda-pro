import React from 'react';

interface FlowInsightProps {
  discharge: number;
  velocity?: number;
  label?: string;
  type: 'MANNING' | 'RATIONAL';
}

export const FlowInsight: React.FC<FlowInsightProps> = ({ discharge, velocity, label, type }) => {
  // Normalize flow intensity for animation (scale 1-10)
  const intensity = Math.min(Math.max(discharge * 2, 1), 15);
  const flowSpeed = velocity ? Math.min(Math.max(velocity, 0.5), 5) : (discharge > 0 ? 2 : 0);

  return (
    <div className="bg-gray-900 rounded-3xl p-5 border border-white/10 shadow-2xl overflow-hidden relative">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Visualisasi Dinamika Aliran</h3>
          <p className="text-safety-blue text-[9px] font-bold uppercase">{label || 'Simulasi Pergerakan Air'}</p>
        </div>
        <div className="text-right">
          <span className="text-white font-black text-xl">{discharge}</span>
          <span className="text-gray-500 text-[10px] ml-1 font-bold">m³/s</span>
        </div>
      </div>

      <div className="relative h-24 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between px-8 overflow-hidden">
        {/* Particle Animation Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {[...Array(Math.ceil(intensity))].map((_, i) => (
            <div
              key={i}
              className="absolute h-[2px] bg-safety-blue rounded-full"
              style={{
                width: `${Math.random() * 40 + 20}px`,
                top: `${Math.random() * 100}%`,
                left: '-50px',
                animation: `flow-move ${4 / flowSpeed}s linear infinite`,
                animationDelay: `${Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Source Node */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center text-white">
            {type === 'RATIONAL' ? (
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            ) : (
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
            )}
          </div>
          <span className="text-[8px] font-bold text-gray-500 mt-1 uppercase">{type === 'RATIONAL' ? 'DAS / Hujan' : 'Inlet'}</span>
        </div>

        {/* Connection Path */}
        <div className="flex-1 h-[2px] mx-4 bg-gradient-to-r from-gray-800 via-safety-blue to-gray-800 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-2">
            <div className={`px-2 py-0.5 rounded-full border border-safety-blue/30 text-[8px] font-bold ${discharge > 0 ? 'text-safety-blue animate-pulse' : 'text-gray-600'}`}>
              {discharge > 5 ? 'DEBIT TINGGI' : discharge > 0 ? 'ALIRAN NORMAL' : 'TIDAK ADA ALIRAN'}
            </div>
          </div>
        </div>

        {/* Channel Node */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-safety-blue/20 border-2 border-safety-blue flex items-center justify-center text-safety-blue shadow-[0_0_15px_rgba(0,87,183,0.3)]">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </div>
          <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Saluran Utama</span>
        </div>
      </div>

      <style>{`
        @keyframes flow-move {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(450px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
