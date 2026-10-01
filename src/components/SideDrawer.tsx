import { useEffect, useState } from 'react';
import {
  X,
  Info,
  ArrowRightLeft,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { useHydrologyStore } from '../stores/useHydrologyStore';
import { computeWorkflowStatus, ModuleId } from '@/features/workflow/utils/workflowStatusEngine';

export function SideDrawer() {
  const { activeModule, setActiveModule } = useWorkflowStore();
  const hydroState = useHydrologyStore();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Local state for internal drawer tabs
  const [drawerTab, setDrawerTab] = useState<'info' | 'flow' | 'prereq'>('info');

  // Compute live workflow statuses
  const workflowData = computeWorkflowStatus(hydroState);
  const currentModuleInfo = activeModule ? workflowData.modules[activeModule as ModuleId] : null;

  // Smooth mount/unmount logic
  useEffect(() => {
    if (activeModule) {
      setShouldRender(true);
      setDrawerTab('info');
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [activeModule]);

  if (!shouldRender || !currentModuleInfo) return null;

  const handleClose = () => setActiveModule(null);

  // Navigation Logic to Main App with deep-link
  const handleNavigateToModule = () => {
    const target = currentModuleInfo.targetTab;
    setActiveModule(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: target }));
    }, 150);
  };

  const isSuccess = currentModuleInfo.status === 'Selesai' || currentModuleInfo.status === 'Tersedia';
  const isReady = currentModuleInfo.statusType === 'ready';
  const isWarning = currentModuleInfo.statusType === 'warning';

  const phaseColors: Record<string, { bg: string; badge: string }> = {
    input: { bg: 'bg-sky-700', badge: 'bg-sky-100 text-sky-800' },
    pre: { bg: 'bg-amber-600', badge: 'bg-amber-100 text-amber-800' },
    engine: { bg: 'bg-rose-600', badge: 'bg-rose-100 text-rose-800' },
    module: { bg: 'bg-purple-700', badge: 'bg-purple-100 text-purple-800' },
    output: { bg: 'bg-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  };

  const pColor = phaseColors[currentModuleInfo.phase] || { bg: 'bg-pupr-blue', badge: 'bg-slate-100 text-slate-800' };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9990] transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Slide-in Drawer (GovTech PUPR Standard) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[460px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.25)] z-[9999] flex flex-col border-l-4 border-pupr-yellow transform transition-transform duration-300 ease-in-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header GovTech */}
        <div className={`${pColor.bg} text-white p-6 pb-6 flex flex-col items-start shrink-0 relative overflow-hidden`}>
          <div className="w-full flex justify-between items-start mb-3 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-white/20 text-white border border-white/30">
                {currentModuleInfo.phaseLabel}
              </span>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                    : isReady
                    ? 'bg-blue-400/20 text-blue-200 border border-blue-400/40'
                    : isWarning
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
                    : 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                ) : isReady ? (
                  <ArrowUpRight className="w-3 h-3 text-blue-300" />
                ) : isWarning ? (
                  <AlertCircle className="w-3 h-3 text-amber-300" />
                ) : (
                  <Clock className="w-3 h-3 text-slate-300" />
                )}
                {currentModuleInfo.status}
              </span>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-slate-200 hover:text-white"
              aria-label="Tutup panel"
            >
              <X size={22} />
            </button>
          </div>

          <div className="relative z-10 w-full pr-2">
            <h2 className="font-extrabold text-xl leading-snug tracking-tight text-white">
              {currentModuleInfo.label}
            </h2>
            <p className="text-xs text-slate-200 mt-1 line-clamp-1">
              {currentModuleInfo.shortName} • Tahap {currentModuleInfo.order} dari 17
            </p>
          </div>
        </div>

        {/* Live Parameter State Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Status Nilai Saat Ini (Live Payload)
          </div>
          <div className="font-mono text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm leading-relaxed">
            {currentModuleInfo.metricSummary}
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 shadow-sm relative z-20">
          <button
            onClick={() => setDrawerTab('info')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              drawerTab === 'info'
                ? 'border-pupr-blue text-pupr-blue bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
            }`}
          >
            <Info size={15} />
            Fungsi & Standar
          </button>
          <button
            onClick={() => setDrawerTab('flow')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              drawerTab === 'flow'
                ? 'border-pupr-blue text-pupr-blue bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
            }`}
          >
            <ArrowRightLeft size={15} />
            I/O Data Flow
          </button>
          <button
            onClick={() => setDrawerTab('prereq')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              drawerTab === 'prereq'
                ? 'border-pupr-blue text-pupr-blue bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
            }`}
          >
            <CheckCircle2 size={15} />
            Prasyarat
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {/* TAB: INFO */}
          {drawerTab === 'info' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Deskripsi Fungsi Teknis
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentModuleInfo.description}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileJson size={15} />
                  Metode & Rumus Perhitungan
                </h3>
                <p className="text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {currentModuleInfo.algorithm}
                </p>
              </div>

              {currentModuleInfo.sniReference && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-pupr-blue">
                  <h3 className="text-xs font-bold text-pupr-blue uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <BookOpen size={15} />
                    Rujukan Standar Nasional Indonesia (SNI)
                  </h3>
                  <p className="text-xs font-semibold text-slate-800">
                    {currentModuleInfo.sniReference}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: FLOW */}
          {drawerTab === 'flow' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Inputs */}
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500"></div>
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Input
                  </span>
                  Dependensi Data Masuk
                </h3>
                <ul className="space-y-2">
                  {currentModuleInfo.inputs.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outputs */}
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-500"></div>
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Output
                  </span>
                  Hasil Perhitungan (Payload)
                </h3>
                <ul className="space-y-2">
                  {currentModuleInfo.outputs.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100"
                    >
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span className="font-medium font-mono">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB: PREREQUISITES */}
          {drawerTab === 'prereq' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                  Kesiapan Prasyarat Analisis
                </h3>
                <ul className="space-y-2.5">
                  {currentModuleInfo.prerequisites.map((prereq, i) => (
                    <li
                      key={i}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium ${
                        prereq.isMet
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50/70 border-amber-200 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {prereq.isMet ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span>{prereq.name}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white shadow-xs">
                        {prereq.isMet ? 'Terpenuhi' : 'Belum Lengkap'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] flex gap-3 z-30 relative">
          <button
            onClick={handleClose}
            className="flex-[0.8] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            Tutup
          </button>
          <button
            onClick={handleNavigateToModule}
            className="flex-[1.6] py-2.5 px-4 bg-pupr-blue hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Buka Modul {currentModuleInfo.shortName}</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
