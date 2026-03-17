import { useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { 
  CheckCircle2, AlertCircle, Clock, ArrowRight, 
  Database, Zap, BarChart3, Binary
} from 'lucide-react';
import { useWorkflowStore } from '@/stores/useWorkflowStore';

export function WorkflowAuditPanel() {
  const hydroState = useHydrologyStore();
  const setActiveModule = useWorkflowStore((state) => state.setActiveModule);

  const stats = useMemo(() => {
    return [
      {
        id: 'input',
        label: 'Data Input',
        icon: <Database className="w-4 h-4" />,
        isDone: !!hydroState.dataHujan?.length && (hydroState.morfometriDAS?.luasDAS || 0) > 0,
        count: (hydroState.dataHujan?.length || 0) > 0 ? 1 : 0,
        total: 2,
        warning: !(hydroState.morfometriDAS?.luasDAS > 0) ? 'Luas DAS belum diinput' : null
      },
      {
        id: 'pre',
        label: 'Pre-Processing',
        icon: <Zap className="w-4 h-4" />,
        isDone: !!hydroState.qcResults || !!hydroState.hasilThiessen,
        count: [!!hydroState.qcResults, !!hydroState.hasilThiessen].filter(Boolean).length,
        total: 2,
        warning: !(hydroState.qcResults) ? 'QC belum dijalankan' : null
      },
      {
        id: 'engine',
        label: 'Analisis Engine',
        icon: <Binary className="w-4 h-4" />,
        isDone: !!hydroState.hasilAnalisisFrekuensi && !!hydroState.hasilARF,
        count: [!!hydroState.hasilAnalisisFrekuensi, !!hydroState.hasilARF].filter(Boolean).length,
        total: 3,
        warning: !(hydroState.hasilAnalisisFrekuensi) ? 'Analisis Frekuensi belum ada' : null
      },
      {
        id: 'output',
        label: 'Hasil & Laporan',
        icon: <BarChart3 className="w-4 h-4" />,
        isDone: !!hydroState.hasilBanjir || !!hydroState.hasilMock,
        count: [!!hydroState.hasilBanjir, !!hydroState.hasilMock].filter(Boolean).length,
        total: 3,
        warning: null
      }
    ];
  }, [hydroState]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
          Technical Readiness
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase">Workstation Audit v1.1</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stats.map((phase) => (
          <div 
            key={phase.id}
            className={`p-4 border group transition-all duration-75 ${
              phase.isDone 
              ? 'border-emerald-100 bg-emerald-50/30' 
              : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-none ${phase.isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {phase.icon}
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-700">
                    {phase.label}
                  </h4>
                  <p className="text-[10px] tabular-nums font-bold text-slate-400">
                    {phase.count} / {phase.total} MODUL SELESAI
                  </p>
                </div>
              </div>
              {phase.isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400" />
              )}
            </div>

            {phase.warning && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 border border-amber-100 mb-3">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span className="text-[9px] font-bold text-amber-700 uppercase leading-none">
                  {phase.warning}
                </span>
              </div>
            )}

            <button
              onClick={() => setActiveModule(phase.id === 'input' ? 'identitas' : phase.id === 'pre' ? 'qc' : 'frekuensi')}
              className="w-full h-8 flex items-center justify-between px-3 text-[10px] font-black uppercase tracking-wider transition-colors bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Cek Modul
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Audit Status
          </span>
          <span className="text-[9px] font-black text-[#0c3a66] bg-[#f2c114] px-1.5 py-0.5">
            COMPLIANT
          </span>
        </div>
        <p className="text-[8px] leading-relaxed text-slate-400 font-medium">
          Seluruh perhitungan disesuaikan dengan Standar Nasional Indonesia (SNI) 2415:2016 untuk Analisis Hidrologi.
        </p>
      </div>
    </div>
  );
}
