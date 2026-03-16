import { MapPin } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { KarakteristikDASCard } from './KarakteristikDASCard';
import { TutupanLahanCard } from './TutupanLahanCard';
import { HujanWilayahCard } from './HujanWilayahCard';
import { ThiessenCalculator } from './ThiessenCalculator';
import { WebGISMap, SpatialMonitor, ChirpsEngine } from '../../spatial-analysis/WebGISPanel';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';

/**
 * PAGE: Parameter Spasial (Analisis Spasial & Kewilayahan)
 * Mengatur tata letak full-width stacked untuk alur kerja geospasial.
 */
export const ParameterSpasial: React.FC = () => {
  const { projectStationIds } = useHydrologyStore();

  return (
    <div className="space-y-8 p-1">
      <ProjectContextBanner />

      {/* Header: Flattened & Professional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-8">
        <div>
          <h2 className="text-3xl font-medium text-[#1e293b] dark:text-slate-100 tracking-tight">Analisis Spasial & Kewilayahan</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-[0.2em] font-bold text-[10px]">Workstation Otomasi Geospasial DAS</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <MapPin className="w-3.5 h-3.5 text-pupr-blue" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {projectStationIds.length} Stasiun Terdaftar
          </span>
        </div>
      </div>

      <div className="space-y-12">
        {/* 1. WEBGIS (Full Width) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 bg-pupr-blue text-white text-[10px] font-black tracking-tighter">01</div>
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Delineasi DAS & Sungai</h3>
          </div>
          <WebGISMap />
        </section>

        {/* 2. MORFOMETRI (Full Width) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-black tracking-tighter">02</div>
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Morfometri DAS (Karakteristik)</h3>
          </div>
          <KarakteristikDASCard />
        </section>

        {/* 3. TUTUPAN LAHAN (Full Width) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-black tracking-tighter">03</div>
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Tutupan Lahan & Koefisien</h3>
          </div>
          <TutupanLahanCard />
        </section>

        {/* 4. RESULTS (Full Width) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 bg-pupr-yellow text-pupr-blue text-[10px] font-black tracking-tighter">04</div>
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Monitor Geometri & Satelit (CHIRPS)</h3>
          </div>
          <SpatialMonitor />
          <ChirpsEngine />
        </section>

        {/* 5. SELEKSI STASIUN (Full Width) */}
        <section className="space-y-4 pt-8 border-t border-dashed border-slate-200">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-black tracking-tighter">05</div>
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Seleksi Stasiun Project</h3>
          </div>
          <ThiessenCalculator />
        </section>

        {/* 6. CURAH HUJAN WILAYAH (Full Width) */}
        <section className="space-y-4 pb-20">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 bg-[#000] text-white text-[10px] font-black tracking-tighter">06</div>
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Analisis Curah Hujan Kewilayahan</h3>
          </div>
          <HujanWilayahCard />
        </section>
      </div>
    </div>
  );
};
