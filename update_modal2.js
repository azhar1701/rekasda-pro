const fs = require('fs');

const content = `import React from 'react';
import { AllCalculationsData } from '@/services/allCalculationsService';
import { TableGovTech } from '@/components/ui/TableGovTech';
import { Waves, Droplets, CloudRain, Calendar, Layers, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

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
    if (type === 'manning') return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: <Waves className="w-5 h-5" /> };
    if (type === 'flood') return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', icon: <CloudRain className="w-5 h-5" /> };
    if (type === 'water_balance') return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', icon: <Droplets className="w-5 h-5" /> };
    return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', icon: <Layers className="w-5 h-5" /> };
  };

  const typeStyle = getTypeStyle(data.type);

  // --- RENDERS ---
  const renderManningDetail = () => {
    const results = data.data.results;
    if (!results) return null;
    return (
      <div className="space-y-6">
        {/* Output Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <Waves className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Debit Rancangan (Q)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{results.Discharge}</p>
              <span className="text-sm font-bold text-slate-500">m³/s</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Kecepatan Aliran (V)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{results.Velocity}</p>
              <span className="text-sm font-bold text-slate-500">m/s</span>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className={\`rounded-xl p-5 shadow-sm border \${results.SafetyStatus === 'Aman' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}\`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {results.SafetyStatus === 'Aman' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              )}
              <div>
                <span className={\`text-xs font-bold uppercase tracking-wide block mb-1 \${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}\`}>Status Keamanan</span>
                <p className={\`text-lg font-black tracking-tight \${results.SafetyStatus === 'Aman' ? 'text-emerald-900' : 'text-rose-900'}\`}>
                  {results.SafetyStatus}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={\`text-xs font-bold uppercase tracking-wide block mb-1 \${results.SafetyStatus === 'Aman' ? 'text-emerald-700' : 'text-rose-700'}\`}>Tipe Aliran</span>
              <p className={\`text-lg font-black tracking-tight \${results.SafetyStatus === 'Aman' ? 'text-emerald-900' : 'text-rose-900'}\`}>
                {results.FlowType}
              </p>
            </div>
          </div>
        </div>

        {/* Geometri Section */}
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Geometri Saluran
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-4">
              <span className="text-xs text-slate-500 block mb-1">Luas Basah (A)</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Area} <span className="text-xs text-slate-500 font-normal">m²</span></span>
            </div>
            <div className="p-4">
              <span className="text-xs text-slate-500 block mb-1">Jari-jari Hidrolis (R)</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Radius} <span className="text-xs text-slate-500 font-normal">m</span></span>
            </div>
            <div className="p-4">
              <span className="text-xs text-slate-500 block mb-1">Angka Froude (Fr)</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Froude}</span>
            </div>
            <div className="p-4 bg-slate-50/50">
              <span className="text-xs text-slate-500 block mb-1">Tinggi Jagaan</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{results.Freeboard} <span className="text-xs text-slate-500 font-normal">m</span></span>
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
      <div className="space-y-6">
        <div className="bg-purple-50 rounded-xl p-5 shadow-sm border border-purple-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-1">Metode Analisis</span>
            <span className="text-lg font-black text-purple-900">{data.data.method || 'Rasional'}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-1">Volume Banjir</span>
            <span className="text-xl font-black text-purple-900 tabular-nums">{(results.volume / 1000)?.toFixed(1)} <span className="text-sm font-bold text-purple-700">×10³ m³</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Debit Puncak (Q)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{results.qPeak?.toFixed(2)}</p>
              <span className="text-sm font-bold text-slate-500">m³/s</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Waktu Puncak (tc)</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl 
