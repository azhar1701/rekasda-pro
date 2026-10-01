import React from 'react';
import { Droplet, AlertTriangle, CheckCircle2, ShieldAlert, Layers } from 'lucide-react';
import { ComplianceBadge } from '@/components/ui/data-display/ComplianceComponents';
import type { WaterBalanceSummary } from '@/services/waterBalanceEngine';

interface Props {
  summary: WaterBalanceSummary | null;
  totalSupply: number;
  totalDemand: number;
  netBalance: number;
}

export const WaterBalanceKpiGrid: React.FC<Props> = ({
  summary,
  totalSupply,
  totalDemand,
  netBalance,
}) => {
  const isSurplus = netBalance >= 0;
  const ika = summary?.waterScarcity;

  const getIkaBadgeStyle = (status?: string) => {
    switch (status) {
      case 'Aman':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Sedang':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Kritis':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Sangat Kritis':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Ketersediaan */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            Total Ketersediaan
          </span>
          <div className="w-8 h-8 rounded-sm bg-blue-100 flex items-center justify-center">
            <Droplet className="w-4 h-4 text-pupr-blue" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-pupr-blue font-mono tabular-nums">
            {totalSupply.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">m³/s (Rerata/Akumulasi)</div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
          Debit Andalan Q80 (Mock/Gauge)
        </div>
      </div>

      {/* 2. Total Kebutuhan */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            Total Kebutuhan
          </span>
          <div className="w-8 h-8 rounded-sm bg-orange-100 flex items-center justify-center">
            <Layers className="w-4 h-4 text-orange-600" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-600 font-mono tabular-nums">
            {totalDemand.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">m³/s (Irigasi + Baku + Lingk.)</div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
          Standar KP-01 & UU 17/2019
        </div>
      </div>

      {/* 3. Status Neraca Air */}
      <div className={`bg-white rounded-sm border-2 p-4 shadow-none flex flex-col justify-between ${
        isSurplus ? 'border-emerald-300 bg-emerald-50/20' : 'border-rose-300 bg-rose-50/20'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Status Neraca
          </span>
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
            isSurplus ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {isSurplus ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
        </div>
        <div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
            isSurplus ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {isSurplus ? '+' : ''}{netBalance.toFixed(2)}
          </div>
          <div className={`text-[11px] font-bold mt-0.5 uppercase tracking-wide ${
            isSurplus ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {isSurplus ? 'SURPLUS AIR' : 'DEFISIT AIR'}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
          <ComplianceBadge sniCode="SNI 19-6728.1-2002" />
          <span className="text-[10px] font-semibold text-slate-500">
            {summary?.deficitMonths ? `${summary.deficitMonths} bln defisit` : '100% aman'}
          </span>
        </div>
      </div>

      {/* 4. Indeks Kekritisan Air (SNI 19-6728.1-2002) */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            Indeks Kekritisan (IKA)
          </span>
          <div className="w-8 h-8 rounded-sm bg-purple-100 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-purple-700" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 font-mono tabular-nums">
              {ika ? `${ika.ikaPercent}%` : '-'}
            </span>
            {ika && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border ${getIkaBadgeStyle(ika.status)}`}>
                {ika.status}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate" title={ika?.description}>
            {ika?.description || 'Rasio Kebutuhan / Ketersediaan'}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span>Kritis: &gt; 75%</span>
          <span>Bulan Kritis: <strong className="text-rose-600">{summary?.criticalMonth?.month || '-'}</strong></span>
        </div>
      </div>
    </div>
  );
};
