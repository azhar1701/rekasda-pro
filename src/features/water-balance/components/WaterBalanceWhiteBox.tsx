import React, { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import type { WaterBalanceResult } from '@/services/waterBalanceEngine';

interface Props {
  results: WaterBalanceResult[];
  activePeriodIndex?: number;
}

export const WaterBalanceWhiteBox: React.FC<Props> = ({
  results,
  activePeriodIndex = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(activePeriodIndex);

  if (!results || results.length === 0) return null;

  const current = results[selectedIndex] || results[0];
  const ikaperiod = current.supply > 0 ? (current.totalDemand / current.supply) * 100 : 0;
  const indDemand = current.industrialDemand || 0;
  const sectorDemand = current.agricultureDemand + current.domesticDemand + indDemand;

  return (
    <div className="bg-white rounded-sm border border-slate-300 overflow-hidden shadow-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors border-b border-slate-200"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-pupr-blue" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Audit Transparansi Matematis (White-Box KaTeX)
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
            SNI 19-6728.1-2002
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <span>{isOpen ? 'Sembunyikan' : 'Tampilkan Langkah Kalkulasi'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 space-y-4 text-xs bg-slate-50/50">
          {/* Period selector tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
            <span className="font-semibold text-slate-600">Pilih Bulan / Periode Analisis:</span>
            <div className="flex flex-wrap gap-1">
              {results.map((r, idx) => (
                <button
                  key={r.month}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-sm transition-all ${
                    selectedIndex === idx
                      ? 'bg-pupr-blue text-white shadow-none'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r.month}
                </button>
              ))}
            </div>
          </div>

          {/* Step-by-Step Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Ketersediaan & Lingkungan */}
            <div className="p-3 bg-white border border-slate-200 rounded-sm space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>1. Ketersediaan Air & Debit Lingkungan</span>
                <span className="text-pupr-blue font-mono font-bold">{current.supply.toFixed(4)} m³/s</span>
              </div>
              <div className="space-y-1 text-slate-600 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                <div>Q_andalan = {current.supply.toFixed(4)} m³/s (Q80)</div>
                <div>Q_lingkungan = 0.10 × Q_andalan (UU 17/2019 Ps. 22)</div>
                <div className="text-pupr-blue font-bold">
                  Q_lingkungan = 0.10 × {current.supply.toFixed(4)} = {current.environmentalFlow.toFixed(4)} m³/s
                </div>
              </div>
            </div>

            {/* Step 2: Kebutuhan Irigasi & Air Baku */}
            <div className="p-3 bg-white border border-slate-200 rounded-sm space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>2. Kebutuhan Irigasi & Air Baku</span>
                <span className="text-orange-600 font-mono font-bold">
                  {sectorDemand.toFixed(4)} m³/s
                </span>
              </div>
              <div className="space-y-1 text-slate-600 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                <div>D_irigasi (DR) = {current.agricultureDemand.toFixed(4)} m³/s (KP-01)</div>
                <div>D_domestik = {current.domesticDemand.toFixed(4)} m³/s (SNI 03-7065)</div>
                <div>D_industri = {indDemand.toFixed(4)} m³/s</div>
                <div className="text-orange-600 font-bold">
                  D_sektor = {sectorDemand.toFixed(4)} m³/s
                </div>
              </div>
            </div>

            {/* Step 3: Neraca Air Periode */}
            <div className="p-3 bg-white border border-slate-200 rounded-sm space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>3. Persamaan Neraca Air (Surplus / Defisit)</span>
                <span className={`font-mono font-bold ${current.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {current.balance >= 0 ? '+' : ''}{current.balance.toFixed(4)} m³/s
                </span>
              </div>
              <div className="space-y-1 text-slate-600 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                <div>Neraca = Q_andalan − (D_irigasi + D_baku + Q_lingkungan)</div>
                <div>Neraca = {current.supply.toFixed(4)} − {current.totalDemand.toFixed(4)}</div>
                <div className={`font-bold ${current.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  = {current.balance >= 0 ? '+' : ''}{current.balance.toFixed(4)} m³/s ({current.status.toUpperCase()})
                </div>
              </div>
            </div>

            {/* Step 4: Indeks Kekritisan Air */}
            <div className="p-3 bg-white border border-slate-200 rounded-sm space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>4. Indeks Kekritisan Air (IKA Bulanan)</span>
                <span className="font-mono font-bold text-purple-700">{ikaperiod.toFixed(1)}%</span>
              </div>
              <div className="space-y-1 text-slate-600 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                <div>IKA = (Total Kebutuhan / Total Ketersediaan) × 100%</div>
                <div>IKA = ({current.totalDemand.toFixed(4)} / {current.supply.toFixed(4)}) × 100%</div>
                <div className="text-purple-700 font-bold">
                  IKA = {ikaperiod.toFixed(1)}% → {
                    ikaperiod < 50 ? 'Kategori AMAN (< 50%)' :
                    ikaperiod <= 75 ? 'Kategori SEDANG (50-75%)' :
                    ikaperiod <= 100 ? 'Kategori KRITIS (75-100%)' : 'Kategori SANGAT KRITIS (> 100%)'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
