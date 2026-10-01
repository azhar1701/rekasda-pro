import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, TrendingUp, Info, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { KarakteristikDASCard } from './KarakteristikDASCard';
import { TutupanLahanCard } from './TutupanLahanCard';
import { HujanWilayahCard } from './HujanWilayahCard';
import { AutoDelineationCard } from './AutoDelineationCard';
const WebGISPanel = React.lazy(() => import('../../spatial-analysis/WebGISPanel').then(m => ({ default: m.WebGISPanel })));

const MapFallback = () => (
  <div className="w-full h-96 bg-slate-100 animate-pulse rounded-lg border border-slate-200 flex items-center justify-center">
    <div className="text-slate-400 font-bold flex flex-col items-center gap-2">
      <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-primary-600 animate-spin" />
      Memuat Peta Spasial...
    </div>
  </div>
);

export const ParameterSpasial: React.FC = () => {
  const { morfometriDAS, tutupanLahan, curahHujanWilayah, fetchSpatialParameters } = useHydrologyStore();
  const [showAutoDelineation, setShowAutoDelineation] = useState(false);

  useEffect(() => {
    fetchSpatialParameters();
  }, [fetchSpatialParameters]);

  const completionStatus = {
    morfometri: morfometriDAS !== null,
    tutupanLahan: tutupanLahan !== null,
    hujanWilayah: curahHujanWilayah !== null,
  };

  const completionCount = Object.values(completionStatus).filter(Boolean).length;
  const isComplete = completionCount === 3;
  const completionPercentage = (completionCount / 3) * 100;

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-700 rounded-xl shadow-lg shadow-primary-700/20">
            <MapPin className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase leading-tight">Parameter Spasial & Kewilayahan</h2>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 text-primary-600" />
              Sistem Otomasi Delineasi & Karakterisasi Geospasial DAS (SNI 2415:2016)
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border-2 transition-all duration-300 ${isComplete
            ? 'bg-emerald-50 border-emerald-200 ring-4 ring-emerald-50'
            : 'bg-amber-50 border-amber-200 ring-4 ring-amber-50'
          }`}>
          <div className={`p-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className={`text-xs font-extrabold uppercase tracking-widest ${isComplete ? 'text-emerald-700' : 'text-amber-700'
              }`}>
              {isComplete ? 'Data Lengkap' : 'Data Belum Lengkap'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className={`text-sm font-bold tabular-nums ${isComplete ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                {completionCount}/3 <small className="font-medium opacity-70 italic text-[10px]">Selesai</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full transition-all duration-500">
        <React.Suspense fallback={<MapFallback />}>
          <WebGISPanel />
        </React.Suspense>
      </div>

      {/* Guidance Box & Auto-Delineation Toggle */}
      <div className="flex flex-col gap-3">
        <div className="p-4 bg-sky-50 border border-sky-100 rounded-lg flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-primary-800 uppercase tracking-wider text-xs block mb-1">Alur Kerja Geospasial Terpadu:</span>
              Unggah batas poligon DAS atau pilih preset demo. Sistem menghitung **Luas DAS**, **Interseksi Tata Guna Lahan**, dan **Poligon Thiessen** secara instan.
              Nilai yang dihasilkan tersinkronisasi otomatis ke modul Analisis Banjir dan Neraca Air.
            </div>
          </div>
          <button
            onClick={() => setShowAutoDelineation(!showAutoDelineation)}
            type="button"
            className="px-3 py-1.5 bg-white border border-sky-200 hover:bg-sky-100 text-sky-800 text-xs font-bold rounded-md flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            {showAutoDelineation ? 'Tutup Alat DEM' : 'Alat Auto-DEM'}
            {showAutoDelineation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showAutoDelineation && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <AutoDelineationCard />
          </div>
        )}
      </div>

      {/* Technical Modules Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]"></div>
          Hasil Analisis Spasial & Rincian Teknis Modul
        </h3>

        <div className="flex flex-col gap-6">
          <div className="transition-all hover:translate-y-[-2px] duration-300">
            <KarakteristikDASCard />
          </div>

          <div className="transition-all hover:translate-y-[-2px] duration-300">
            <TutupanLahanCard />
          </div>

          <div className="transition-all hover:translate-y-[-2px] duration-300">
            <HujanWilayahCard />
          </div>
        </div>
      </div>
    </div>
  );
};
