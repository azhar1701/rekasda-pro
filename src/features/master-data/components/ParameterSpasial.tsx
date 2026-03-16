import React from 'react';
import { MapPin, Layers } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { KarakteristikDASCard } from './KarakteristikDASCard';
import { TutupanLahanCard } from './TutupanLahanCard';
import { HujanWilayahCard } from './HujanWilayahCard';
import { ThiessenCalculator } from './ThiessenCalculator';
import { WebGISPanel } from '../../spatial-analysis/WebGISPanel';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';

export const ParameterSpasial: React.FC = () => {
  const { projectStationIds } = useHydrologyStore();

  const isStationSelected = projectStationIds.length > 0;

  return (
    <div className="space-y-8 p-1">
      <ProjectContextBanner />

      {/* Header: Flattened & Quieter — matching FormIdentitasLokasi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-8">
        <div>
          <h2 className="text-3xl font-medium text-[#1e293b] dark:text-slate-100 tracking-tight">Analisis Spasial & Kewilayahan</h2>
          <p className="text-sm text-slate-500 mt-1">Sistem Otomasi Delineasi & Karakterisasi Geospasial DAS</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <MapPin className="w-3.5 h-3.5 text-pupr-blue" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {projectStationIds.length} Stasiun Terdaftar
          </span>
        </div>
      </div>

      {/* STEP 1: Mandatory Station Selection Tool */}
      <ThiessenCalculator />

      {!isStationSelected ? (
        <div className="p-12 border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Menunggu Seleksi Stasiun</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-2">
            Gunakan tool di atas untuk memilih stasiun hujan dari database sebelum melanjutkan ke analisis morfometri dan tata guna lahan.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <WebGISPanel>
            <div className="space-y-6 pt-2">
              <KarakteristikDASCard />
              <TutupanLahanCard />
              <HujanWilayahCard />
            </div>
          </WebGISPanel>
        </div>
      )}
    </div>
  );
};
