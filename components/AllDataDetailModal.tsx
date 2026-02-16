import React from 'react';
import { AllCalculationsData } from '../services/allCalculationsService';

interface Props {
  isOpen: boolean;
  data: AllCalculationsData | null;
  onClose: () => void;
}

export const AllDataDetailModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
  if (!isOpen || !data) return null;

  const getTypeLabel = (type: string) => {
    if (type === 'manning') return 'Saluran Manning';
    if (type === 'flood') return 'Banjir';
    if (type === 'water_balance') return 'Neraca Air';
    return type;
  };

  const renderManningDetail = () => (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-teal-800 uppercase tracking-wide mb-3">Hasil Utama</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-teal-600 block mb-1">Debit (Q)</span>
            <span className="text-2xl font-bold text-teal-900">{data.data.results.Discharge}</span>
            <span className="text-xs text-teal-600 ml-1">m³/s</span>
          </div>
          <div>
            <span className="text-xs text-teal-600 block mb-1">Kecepatan (V)</span>
            <span className="text-2xl font-bold text-teal-900">{data.data.results.Velocity}</span>
            <span className="text-xs text-teal-600 ml-1">m/s</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Luas (A)</span>
          <span className="text-lg font-bold text-slate-900">{data.data.results.Area}</span>
          <span className="text-xs text-slate-500"> m²</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Jari-jari (R)</span>
          <span className="text-lg font-bold text-slate-900">{data.data.results.Radius}</span>
          <span className="text-xs text-slate-500"> m</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Froude (Fr)</span>
          <span className="text-lg font-bold text-slate-900">{data.data.results.Froude}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-600 block mb-1">Tipe Aliran</span>
            <span className="text-lg font-bold text-blue-900">{data.data.results.FlowType}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-blue-600 block mb-1">Status Keamanan</span>
            <span className={`text-lg font-bold ${data.data.results.SafetyStatus === 'Aman' ? 'text-green-600' : 'text-red-600'}`}>
              {data.data.results.SafetyStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Freeboard</span>
          <span className="text-base font-bold text-slate-900">{data.data.results.Freeboard} m</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Energi Spesifik</span>
          <span className="text-base font-bold text-slate-900">{data.data.results.SpecificEnergy} m</span>
        </div>
      </div>
    </div>
  );

  const renderFloodDetail = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-purple-800 uppercase tracking-wide">Metode</h4>
          <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">{data.data.method}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-xs text-purple-600 block mb-1">Debit Puncak</span>
            <span className="text-2xl font-bold text-purple-900">{data.data.results.qPeak?.toFixed(2)}</span>
            <span className="text-xs text-purple-600 ml-1">m³/s</span>
          </div>
          <div>
            <span className="text-xs text-purple-600 block mb-1">Waktu Puncak</span>
            <span className="text-2xl font-bold text-purple-900">{data.data.results.tPeak?.toFixed(2)}</span>
            <span className="text-xs text-purple-600 ml-1">jam</span>
          </div>
          <div>
            <span className="text-xs text-purple-600 block mb-1">Volume</span>
            <span className="text-2xl font-bold text-purple-900">{(data.data.results.volume / 1000)?.toFixed(1)}</span>
            <span className="text-xs text-purple-600 ml-1">×10³ m³</span>
          </div>
        </div>
      </div>

      {data.data.results.returnPeriods && (
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Kala Ulang</h4>
          <div className="grid grid-cols-3 gap-2">
            {data.data.results.returnPeriods.slice(0, 6).map((rp: any) => (
              <div key={rp.period} className="bg-white p-2 rounded border border-slate-200">
                <span className="text-xs text-slate-500 block">{rp.period}</span>
                <span className="text-sm font-bold text-slate-900">{rp.qPeak?.toFixed(2)} m³/s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderWaterBalanceDetail = () => {
    const totalSupply = data.data.monthly_inputs?.monthlySupply?.reduce((a: number, b: number) => a + b, 0) || 0;
    const summary = data.data.summary;
    const monthlyResults = data.data.monthly_results || [];
    const netBalance = totalSupply - monthlyResults.reduce((sum: number, r: any) => sum + parseFloat(r.totalDemand || 0), 0);
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-3">Ringkasan Neraca</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-blue-600 block mb-1">Total Ketersediaan</span>
              <span className="text-2xl font-bold text-blue-900">{totalSupply.toFixed(1)}</span>
              <span className="text-xs text-blue-600 ml-1">m³/s</span>
            </div>
            <div>
              <span className="text-xs text-blue-600 block mb-1">Status Neraca</span>
              <span className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(1)}
              </span>
              <span className="text-xs text-blue-600 ml-1">m³/s</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <span className="text-xs text-green-600 block mb-1">Bulan Surplus</span>
            <span className="text-2xl font-bold text-green-900">{summary?.surplusMonths || 0}</span>
            <span className="text-xs text-green-600 ml-1">bulan</span>
          </div>
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <span className="text-xs text-red-600 block mb-1">Bulan Defisit</span>
            <span className="text-2xl font-bold text-red-900">{summary?.deficitMonths || 0}</span>
            <span className="text-xs text-red-600 ml-1">bulan</span>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <span className="text-xs text-orange-600 block mb-1">Bulan Kritis</span>
            <span className="text-2xl font-bold text-orange-900">{summary?.criticalMonth?.month || '-'}</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Data Bulanan</h4>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {monthlyResults.slice(0, 12).map((r: any, i: number) => (
              <div key={i} className={`p-2 rounded border ${
                r.status === 'Surplus' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <span className="text-xs font-bold text-slate-700 block">{r.month}</span>
                <span className={`text-sm font-bold ${
                  r.status === 'Surplus' ? 'text-green-700' : 'text-red-700'
                }`}>{parseFloat(r.balance).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{getTypeLabel(data.type)}</h3>
            <p className="text-sm text-slate-500 mt-1">{data.project_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <span className="text-xs text-slate-500">Tanggal: {new Date(data.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
        </div>

        {data.type === 'manning' && renderManningDetail()}
        {data.type === 'flood' && renderFloodDetail()}
        {data.type === 'water_balance' && renderWaterBalanceDetail()}

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
