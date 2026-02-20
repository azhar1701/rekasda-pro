import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const WaterBalanceFormulaDisplay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border-2 border-cyan-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-cyan-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-cyan-900">Neraca Air</h3>
            <p className="text-xs text-cyan-600">SNI 6738:2015 & SNI 19-6728.1-2002</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-cyan-700">Lihat Rumus</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-cyan-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cyan-600" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t-2 border-cyan-200 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 space-y-3">
          {/* Main Formula */}
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-semibold text-cyan-700 mb-2">Persamaan Neraca Air:</p>
            <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
              <code className="text-sm font-mono font-bold text-cyan-900 block text-center">
                Surplus/Defisit = Ketersediaan - Kebutuhan
              </code>
            </div>
          </div>

          {/* Supply Formulas */}
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-semibold text-cyan-700 mb-2">Ketersediaan Air:</p>
            <div className="space-y-1.5">
              <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
                <code className="text-xs font-mono text-cyan-900 block">
                  Q80 = Debit andalan 80% (SNI 6738:2015)
                </code>
              </div>
              <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
                <code className="text-xs font-mono text-cyan-900 block">
                  Qmin = Q80 - Qenv (Aliran minimum)
                </code>
              </div>
              <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
                <code className="text-xs font-mono text-cyan-900 block">
                  Qenv = 0.1 × Q80 (Aliran lingkungan 10%)
                </code>
              </div>
            </div>
          </div>

          {/* Demand Formulas */}
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-semibold text-cyan-700 mb-2">Kebutuhan Air:</p>
            <div className="space-y-1.5">
              <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
                <code className="text-xs font-mono text-cyan-900 block">
                  Qdom = P × q / 86400 (Domestik)
                </code>
              </div>
              <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
                <code className="text-xs font-mono text-cyan-900 block">
                  Qirr = (A × NFR) / 86400 (Irigasi)
                </code>
              </div>
              <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-200">
                <code className="text-xs font-mono text-cyan-900 block">
                  Qtotal = Qdom + Qirr (Total kebutuhan)
                </code>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-lg p-3 border border-cyan-200">
            <p className="text-xs font-semibold text-cyan-700 mb-2">Keterangan Parameter:</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">Q80</code>
                <span className="text-slate-700 flex-1">= Debit andalan 80%</span>
                <span className="text-slate-500 font-medium">(m³/s)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">Qenv</code>
                <span className="text-slate-700 flex-1">= Aliran lingkungan (10% Q80)</span>
                <span className="text-slate-500 font-medium">(m³/s)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">Qdom</code>
                <span className="text-slate-700 flex-1">= Kebutuhan domestik</span>
                <span className="text-slate-500 font-medium">(m³/s)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">P</code>
                <span className="text-slate-700 flex-1">= Jumlah penduduk</span>
                <span className="text-slate-500 font-medium">(jiwa)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">q</code>
                <span className="text-slate-700 flex-1">= Kebutuhan per kapita</span>
                <span className="text-slate-500 font-medium">(L/org/hari)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">Qirr</code>
                <span className="text-slate-700 flex-1">= Kebutuhan irigasi</span>
                <span className="text-slate-500 font-medium">(m³/s)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">A</code>
                <span className="text-slate-700 flex-1">= Luas lahan irigasi</span>
                <span className="text-slate-500 font-medium">(ha)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="font-mono font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded min-w-[2.5rem] text-center">NFR</code>
                <span className="text-slate-700 flex-1">= Net Field Requirement</span>
                <span className="text-slate-500 font-medium">(mm/hari)</span>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="bg-cyan-100 rounded-lg p-2 border border-cyan-300">
            <p className="text-xs text-cyan-800">
              <span className="font-semibold">Referensi:</span> SNI 6738:2015 (Debit Andalan), SNI 19-6728.1-2002 (Neraca Air), SNI 03-7065-2005 (Kebutuhan Domestik)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
