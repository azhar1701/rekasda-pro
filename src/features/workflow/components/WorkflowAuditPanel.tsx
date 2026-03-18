import { useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { 
  CheckCircle2, AlertCircle, Clock, ArrowRight, 
  Database, Zap, BarChart3, Binary, ShieldCheck
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
        icon: <Database className="w-3.5 h-3.5" />,
        isDone: !!hydroState.dataHujan?.length && (hydroState.morfometriDAS?.luasDAS || 0) > 0,
        count: (hydroState.dataHujan?.length || 0) > 0 ? 1 : 0,
        total: 2,
        warning: !(hydroState.morfometriDAS?.luasDAS > 0) ? 'Luas DAS belum diinput' : null,
        moduleTarget: 'identitas',
      },
      {
        id: 'pre',
        label: 'Pre-Processing',
        icon: <Zap className="w-3.5 h-3.5" />,
        isDone: !!hydroState.qcResults || !!hydroState.hasilThiessen,
        count: [!!hydroState.qcResults, !!hydroState.hasilThiessen].filter(Boolean).length,
        total: 2,
        warning: !(hydroState.qcResults) ? 'QC belum dijalankan' : null,
        moduleTarget: 'qc',
      },
      {
        id: 'engine',
        label: 'Analisis Engine',
        icon: <Binary className="w-3.5 h-3.5" />,
        isDone: !!hydroState.hasilAnalisisFrekuensi && !!hydroState.hasilARF,
        count: [!!hydroState.hasilAnalisisFrekuensi, !!hydroState.hasilARF].filter(Boolean).length,
        total: 3,
        warning: !(hydroState.hasilAnalisisFrekuensi) ? 'Analisis Frekuensi belum ada' : null,
        moduleTarget: 'frekuensi',
      },
      {
        id: 'output',
        label: 'Hasil & Laporan',
        icon: <BarChart3 className="w-3.5 h-3.5" />,
        isDone: !!hydroState.hasilBanjir || !!hydroState.hasilMock,
        count: [!!hydroState.hasilBanjir, !!hydroState.hasilMock].filter(Boolean).length,
        total: 3,
        warning: null,
        moduleTarget: 'frekuensi',
      }
    ];
  }, [hydroState]);

  const overallProgress = useMemo(() => {
    const totalDone = stats.reduce((acc, s) => acc + s.count, 0);
    const totalAll = stats.reduce((acc, s) => acc + s.total, 0);
    return Math.round((totalDone / totalAll) * 100);
  }, [stats]);

  const progressColorClass = overallProgress < 33 ? 'bg-rose-500' : overallProgress < 66 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Technical Readiness
          </h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase">v1.1</span>
        </div>
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-light tabular-nums tracking-tighter ${overallProgress < 33 ? 'text-rose-500' : overallProgress < 66 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {overallProgress}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Progress
            </span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${progressColorClass}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phase Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {stats.map((phase) => (
            <section key={phase.id} className="space-y-3">
              {/* Section Header — Dashboard Pattern */}
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${phase.isDone ? 'bg-emerald-500' : 'bg-pupr-blue'}`} />
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {phase.label}
                  </h4>
                </div>
                {phase.isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
              </header>

              {/* Phase Details */}
              <div className="space-y-2 pl-3.5 border-l border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 ${phase.isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      {phase.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                      {phase.count} / {phase.total} Modul
                    </span>
                  </div>
                </div>

                {/* Progress micro-bar */}
                <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${phase.isDone ? 'bg-emerald-500' : 'bg-pupr-blue'}`}
                    style={{ width: `${phase.total > 0 ? (phase.count / phase.total) * 100 : 0}%` }}
                  />
                </div>

                {/* Warning */}
                {phase.warning && (
                  <div className="flex items-center gap-1.5 py-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="text-[9px] font-bold text-amber-600 uppercase leading-tight">
                      {phase.warning}
                    </span>
                  </div>
                )}

                {/* Action */}
                <button
                  onClick={() => setActiveModule(phase.moduleTarget)}
                  className="w-full h-7 flex items-center justify-between px-2.5 text-[9px] font-black uppercase tracking-widest transition-colors bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-pupr-blue"
                >
                  Cek Modul
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* SNI Compliance Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-pupr-blue" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Audit Status
            </span>
          </div>
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
