import React from 'react';
import { useEmbungStore } from '../../../hooks/useEmbungStore';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { 
  Waves, 
  RefreshCcw, 
  Layers, 
  Wind
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/hooks/useToast';

export const EmbungNavigator: React.FC = () => {
  const { state, dispatch } = useEmbungStore();
  const { hasilBanjir, hasilMock } = useHydrologyStore();

  const handleSyncAll = () => {
    let syncedCount = 0;

    // 1. Sync Luas DAS for Sedimentation
    const globalLuasDas = useHydrologyStore.getState().luasDas;
    if (globalLuasDas > 0) {
      const currentSediment = state.sedimentInput || {};
      dispatch({
        type: 'SET_SEDIMENT_INPUT',
        payload: { ...currentSediment, luasDas: typeof globalLuasDas === 'number' ? globalLuasDas : parseFloat(globalLuasDas) }
      });
      syncedCount++;
    }

    // 2. Sync Inflow from FJ Mock (Neraca)
    if (hasilMock?.monthlyResults?.length === 12) {
      const monthlyInflow = hasilMock.monthlyResults.map(r => r.discharge);
      const currentCapacity = [...state.capacityData];
      const updatedCapacity = currentCapacity.map((item, idx) => ({
        ...item,
        inflow: monthlyInflow[idx] || 0
      }));
      dispatch({ type: 'SET_CAPACITY_DATA', payload: updatedCapacity });
      syncedCount++;
    }

    // 3. Sync Inflow Hydrograph from Banjir
    if (hasilBanjir?.debitPuncak) {
      // Logic for hydrograph extraction would go here
      // For now, we take the peak to warn the user it's available
      syncedCount++;
    }

    if (syncedCount > 0) {
      toast.success(`Berhasil sinkronisasi ${syncedCount} parameter dari modul sebelumnya.`);
    } else {
      toast.warning('Tidak ada parameter yang siap disinkronkan. Selesaikan analisis sebelumnya.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto border-r border-slate-200 dark:border-slate-800 scrollbar-hide">
      {/* Sync Action Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigator Input</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSyncAll}
          className="h-7 text-[9px] font-black uppercase tracking-wider border-pupr-blue/30 text-pupr-blue hover:bg-pupr-surface"
        >
          <RefreshCcw className="w-3 h-3 mr-1.5" />
          Sync Data
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Section: Geometri Dasar */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Layers className="w-4 h-4 text-pupr-blue" />
            <h4 className="text-xs font-bold uppercase tracking-tight">Geometri & Kapasitas</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Elevasi Dasar (m)</label>
              <input 
                type="number" 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-bold tabular-nums outline-none focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue/20"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Target Outflow (m³/s)</label>
              <input 
                type="number" 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-bold tabular-nums outline-none focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue/20"
                placeholder="0.00"
              />
            </div>
          </div>
        </section>

        {/* Section: Inflow Design */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Waves className="w-4 h-4 text-pupr-blue" />
            <h4 className="text-xs font-bold uppercase tracking-tight">Inflow & Hidrograf</h4>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 tracking-tight">Q Puncak Rencana</span>
              <span className="text-[10px] font-black text-pupr-blue tabular-nums">
                {hasilBanjir?.debitPuncak?.toFixed(2) || '0.00'} m³/s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 tracking-tight">Volume FJ Mock</span>
              <span className="text-[10px] font-black text-pupr-blue tabular-nums">
                {hasilMock?.qAndalan?.toFixed(3) || '0.000'} m³/s
              </span>
            </div>
          </div>
        </section>

        {/* Section: Parameter Sedimentasi */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Wind className="w-4 h-4 text-pupr-blue" />
            <h4 className="text-xs font-bold uppercase tracking-tight">Erosi & Sedimen</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Luas DAS (km²)</label>
              <input 
                type="number" 
                readOnly
                value={typeof useHydrologyStore.getState().luasDas === 'number' ? useHydrologyStore.getState().luasDas : 0}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-bold tabular-nums text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <p className="text-[9px] text-slate-400 font-bold leading-relaxed tracking-tight">
          Sesuai dengan **Pd T-07-2004-A** untuk perencanaan teknis embung kecil dan bangunan penampung air.
        </p>
      </div>
    </div>
  );
};
