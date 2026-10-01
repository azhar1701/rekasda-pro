import React from 'react';
import { Waves, ArrowRight, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';
import type { WaterBalanceResult, WaterBalanceSummary } from '@/services/waterBalanceEngine';

interface Props {
  results: WaterBalanceResult[];
  summary: WaterBalanceSummary | null;
  onNavigateToEmbung?: () => void;
}

export const SequentPeakCard: React.FC<Props> = ({
  results,
  summary,
  onNavigateToEmbung,
}) => {
  const { setHasilNeraca } = useHydrologyStore();

  const requiredStorageM3 = summary?.storageRequiredM3 || 0;
  const requiredStorageJutaM3 = summary?.storageRequiredJutaM3 || 0;
  const hasDeficit = (summary?.deficitMonths || 0) > 0;

  const handleSyncToEmbung = () => {
    if (!results || results.length === 0) {
      toast.error('Data neraca air belum dihitung.');
      return;
    }

    const monthlySupply = results.map(r => r.supply);
    const monthlyDemand = results.map(r => r.totalDemand);
    const chartData = results.map(r => ({
      bulan: r.month,
      ketersediaan: r.supply,
      kebutuhan: r.totalDemand,
      neraca: r.balance,
    }));

    setHasilNeraca({
      isSurplus: (summary?.netBalance || 0) >= 0,
      totalSurplusDefisit: summary?.netBalance || 0,
      bulanKritis: summary?.criticalMonth?.month || '-',
      chartData,
      waterScarcity: summary?.waterScarcity ? {
        ikaPercent: summary.waterScarcity.ikaPercent,
        status: summary.waterScarcity.status,
        description: summary.waterScarcity.description,
        badgeColor: summary.waterScarcity.badgeColor,
      } : undefined,
      storageRequiredM3: requiredStorageM3,
      storageRequiredJutaM3: requiredStorageJutaM3,
      monthlySupply,
      monthlyDemand,
    });

    toast.success('Data Inflow (Q80) & Outflow (Kebutuhan) berhasil disinkronkan ke Modul Embung!');
    if (onNavigateToEmbung) {
      onNavigateToEmbung();
    }
  };

  return (
    <div className="bg-white rounded-sm border border-slate-300 overflow-hidden shadow-none">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded text-pupr-blue">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Kebutuhan Tampungan Waduk / Embung (Sequent Peak Algorithm)
            </h3>
            <p className="text-[10px] text-slate-500">
              Analisis volume tampungan efektif aktif (Ripple Mass Curve) untuk menjamin keandalan 100%
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          SNI 03-3432-1994
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Kolom 1: Volume Tampungan Diperlukan */}
          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Kapasitas Tampungan Efektif (V_storage)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-pupr-blue tabular-nums">
                {requiredStorageJutaM3.toFixed(3)}
              </span>
              <span className="text-xs font-bold text-slate-600">Juta m³</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              ≈ {requiredStorageM3.toLocaleString('id-ID')} m³
            </div>
          </div>

          {/* Kolom 2: Status Defisit & Durasi */}
          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Evaluasi Periode Kering
            </span>
            <div className="flex items-center gap-2 mb-1">
              {hasDeficit ? (
                <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{summary?.deficitMonths} Bulan Defisit</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pasokan Surplus Sepanjang Tahun</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {hasDeficit
                ? `Puncak defisit pada bulan ${summary?.criticalMonth?.month} sebesar ${Math.abs(summary?.criticalMonth?.balance || 0).toFixed(3)} m³/s.`
                : 'Tidak membutuhkan tampungan suplementer untuk pola tanam saat ini.'}
            </p>
          </div>

          {/* Kolom 3: Action Sinkronisasi ke Embung */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSyncToEmbung}
              className="w-full min-h-[44px] px-4 py-2.5 bg-pupr-blue hover:bg-blue-700 active:bg-blue-800 text-white rounded-sm font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-none"
            >
              <Database className="w-4 h-4" />
              <span>Sinkronkan ke Modul Embung</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Mentransfer debit Q80 dan outflow kebutuhan ke modul Analisis Kapasitas Embung.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
