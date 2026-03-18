import React from 'react';
import { AllCalculationsData } from '@/services/allCalculationsService';
import { Waves, Droplets, CloudRain, Calendar, ShieldCheck, Layers } from 'lucide-react';

interface Props {
 isOpen: boolean;
 data: AllCalculationsData | null;
 onClose: () => void;
}

export const AllDataDetailModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
 if (!isOpen || !data) return null;

 const getTypeLabel = (type: string) => {
 if (type === 'manning') return 'Saluran Manning';
 if (type === 'flood') return 'Banjir Rasional';
 if (type === 'water_balance') return 'Neraca Air';
 return type;
 };

 const getTypeStyle = (type: string) => {
 if (type === 'manning') return { bg: 'bg-pupr-surface0/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: <Waves className="w-5 h-5" /> };
 if (type === 'flood') return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', icon: <CloudRain className="w-5 h-5" /> };
 if (type === 'water_balance') return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', icon: <Droplets className="w-5 h-5" /> };
 return { bg: 'bg-slate-50 dark:bg-slate-8000/20', text: 'text-slate-300', border: 'border-slate-500/30', icon: <Layers className="w-5 h-5" /> };
 };

 const typeStyle = getTypeStyle(data.type);

 // --- RENDERS ---
  const renderManningDetail = () => {
    const results = data.data.results;
    if (!results) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Kapasitas Debit (Q)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-pupr-blue tabular-nums tracking-tighter leading-none">{Number(results.Discharge || 0).toFixed(3)}</span>
              <span className="text-xs font-bold text-slate-500">m³/s</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Kecepatan (V)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-slate-700 tabular-nums tracking-tighter leading-none">{Number(results.Velocity || 0).toFixed(3)}</span>
              <span className="text-xs font-bold text-slate-500">m/s</span>
            </div>
          </div>
        </div>

        <div className={`border p-6 ${results.SafetyStatus === 'Aman' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${results.SafetyStatus === 'Aman' ? 'text-emerald-500' : 'text-rose-500'}`}>Status Keamanan</span>
              <p className={`text-2xl font-black tracking-tight ${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {results.SafetyStatus}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${results.SafetyStatus === 'Aman' ? 'text-emerald-500' : 'text-rose-500'}`}>Tipe Aliran</span>
              <p className={`text-2xl font-black tracking-tight ${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {results.FlowType}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Geometri Saluran
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-5 text-center sm:text-left">
              <span className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">Luas (A)</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{results.Area} <span className="text-[10px] text-slate-400 font-bold">m²</span></span>
            </div>
            <div className="p-5 text-center sm:text-left">
              <span className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">Jari-Jari (R)</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{results.Radius} <span className="text-[10px] text-slate-400 font-bold">m</span></span>
            </div>
            <div className="p-5 text-center sm:text-left">
              <span className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">Froude (Fr)</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{results.Froude}</span>
            </div>
            <div className="p-5 text-center sm:text-left bg-slate-50">
              <span className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">Freeboard</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{results.Freeboard} <span className="text-[10px] text-slate-400 font-bold">m</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFloodDetail = () => {
    const results = data.data.results;
    if (!results) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Debit Puncak (Q)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-rose-600 tabular-nums tracking-tighter leading-none">{Number(results.qPeak || 0).toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-500">m³/s</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Waktu Puncak (tc)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-slate-700 tabular-nums tracking-tighter leading-none">{Number(results.tPeak || 0).toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-500">jam</span>
            </div>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 flex items-center justify-between p-6">
          <div>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">Metode Analisis</span>
            <span className="text-xl font-bold text-rose-900">{data.data.method || 'Rasional'}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">Volume Banjir</span>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-2xl font-bold text-rose-900 tabular-nums tracking-tight">{(results.volume / 1000)?.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-rose-700">×10³ m³</span>
            </div>
          </div>
        </div>

        {results.returnPeriods && results.returnPeriods.length > 0 && (
          <div className="bg-white border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <CloudRain className="w-3.5 h-3.5 text-slate-500" />
                Debit Kala Ulang
              </h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0c3a66] text-white">
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest">Kala Ulang</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-right">Debit Puncak (m³/s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.returnPeriods.map((rp: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-2.5 text-xs font-bold text-slate-700">{rp.period}</td>
                    <td className="px-5 py-2.5 text-xs font-bold text-slate-700 tabular-nums text-right">{rp.qPeak?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderWaterBalanceDetail = () => {
    const totalSupply = data.data.monthly_inputs?.monthlySupply?.reduce((a: number, b: number) => a + b, 0) || 0;
    const summary = data.data.summary;
    const monthlyResults = data.data.monthly_results || [];
    const netBalance = totalSupply - monthlyResults.reduce((sum: number, r: any) => sum + parseFloat(r.totalDemand || 0), 0);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Total Ketersediaan</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-pupr-blue tabular-nums tracking-tighter leading-none">{Number(totalSupply).toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-500">m³/s</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status Neraca Tahunan</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-light tabular-nums tracking-tighter leading-none ${netBalance >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                {Number(netBalance).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">m³/s</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-4 text-center flex flex-col justify-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Bulan Surplus</span>
            <span className="text-2xl font-black text-emerald-600 tabular-nums leading-none">{summary?.surplusMonths || 0}</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 text-center flex flex-col justify-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Bulan Defisit</span>
            <span className="text-2xl font-black text-rose-600 tabular-nums leading-none">{summary?.deficitMonths || 0}</span>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 text-center flex flex-col justify-center">
            <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest mb-2">Bulan Kritis</span>
            <span className="text-2xl font-black text-orange-900 leading-none">{summary?.criticalMonth?.month || '-'}</span>
          </div>
        </div>

        {monthlyResults.length > 0 && (
          <div className="bg-white border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Neraca Bulanan
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0c3a66] text-white">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Bulan</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Andalan (m³/s)</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Kebutuhan (m³/s)</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Neraca (m³/s)</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyResults.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors tabular-nums">
                      <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{r.month}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 text-right">{parseFloat(r.supply || 0).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 text-right">{parseFloat(r.totalDemand || 0).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-slate-700 text-right">{parseFloat(r.balance || 0).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 mt-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest ${
                          r.status === 'Surplus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-50 shadow-2xl ring-1 ring-slate-200/50 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="relative bg-[#0f172a] px-6 py-6 shrink-0 border-b border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            {React.cloneElement(typeStyle.icon as React.ReactElement, { className: 'w-32 h-32' })}
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="pr-12">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white/90`}>
                  {getTypeLabel(data.type)}
                </span>
                <span className="text-white/50 text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                {data.project_name || 'Detail Proyek Tidak Bernama'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          {data.type === 'manning' && renderManningDetail()}
          {data.type === 'flood' && renderFloodDetail()}
          {data.type === 'water_balance' && renderWaterBalanceDetail()}
        </div>

        <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold border border-slate-200 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
