import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Waves, CloudRain, Scale, Database, Sparkles, Droplets, FileText, TrendingUp, History, Map, Calendar, X, Zap } from 'lucide-react';
import { ManningCalculator } from '@/features/channel-analysis/components/ManningCalculator';
import { MasterDataPage } from '@/features/master-data/components/MasterDataPage';
import { ModulAnalisisFrekuensi } from '@/features/flood-analysis/components/ModulAnalisisFrekuensi';
import { ExecutiveDashboard } from '@/features/dashboard/components/ExecutiveDashboard';
import { GeminiConsultant } from '@/features/ai-consultant/GeminiConsultant';
import { AIConsultantDrawer } from '@/features/ai-consultant/AIConsultantDrawer';
import { AllDataTab } from '@/features/history/components/AllDataTab';
import { ReportModal } from '@/components/ui/modals/ReportModal';
import { AllDataDetailModal } from '@/components/ui/modals/AllDataDetailModal';

// Lazy load heavy computational tabs/modules
const FloodAnalysisTab = React.lazy(() => import('@/features/flood-analysis/components/FloodAnalysisTab').then(m => ({ default: m.FloodAnalysisTab })));
const WaterBalanceTab = React.lazy(() => import('@/features/water-balance/components/WaterBalanceTab').then(m => ({ default: m.WaterBalanceTab })));
const EmbungDashboard = React.lazy(() => import('@/features/embung/components/EmbungDashboard').then(m => ({ default: m.EmbungDashboard })));
const WorkflowCanvas = React.lazy(() => import('@/features/workflow/WorkflowCanvas').then(m => ({ default: m.WorkflowCanvas })));
import { AllCalculationsData } from '@/services/allCalculationsService';
import { ToastContainer } from '@/components/ui/feedback/Toast';
import { CalculationType } from '@/types/types';
import type { CalculationResult } from '@/types/common.types';
import type { ActiveModule } from '@/hooks/useAIContext';

import { Header } from '@/components/ui/navigation/Header';
import { Footer } from '@/components/ui/navigation/Footer';
import { toast } from '@/hooks/useToast';

import { useDatabase } from '@/hooks/useDatabase';
import { useDatabaseStatus } from '@/features/history/components/DatabaseTest';
import { APP_NAME } from '@/constants';
import { SideDrawer } from '@/components/SideDrawer';
import { GitMerge } from 'lucide-react';

// Loading fallback component
const TabFallback = () => (
  <div className="flex flex-col items-center justify-center p-12 w-full h-96 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm">
    <div className="w-12 h-12 border-4 border-pupr-blue/20 border-t-pupr-blue rounded-full animate-spin mb-4" />
    <p className="text-sm font-bold text-slate-500 animate-pulse">Memuat Modul...</p>
  </div>
);

enum Tab {
  WORKFLOW = '/workflow',
  SALURAN = '/saluran',
  BANJIR = '/banjir',
  NERACA = '/neraca',
  EMBUNG = '/embung',
  MASTER = '/master',
  FREKUENSI = '/frekuensi',
  HISTORY = '/history',
  AI = '/ai',
  EXEC = '/exec'
}

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname;
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [tempCalculation, setTempCalculation] = useState<Partial<CalculationResult> | null>(null);

  const [viewAllDataDetail, setViewAllDataDetail] = useState<AllCalculationsData | null>(null);
  const [mapDetailItem, setMapDetailItem] = useState<any>(null);
  const [lastContext, setLastContext] = useState<string>('');
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [aiTriggerCount, setAiTriggerCount] = useState<number>(0);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const { saveCalculation } = useDatabase();
  const { status: dbStatus, message: dbMessage, getStatusColor } = useDatabaseStatus();

  useEffect(() => {
    const handleNavigateToTab = (e: CustomEvent) => {
      const tabPath = e.detail as string;
      if (Object.values(Tab).includes(tabPath as Tab)) {
        navigate(tabPath);
      } else if (tabPath in Tab) { // Fallback if using old enum keys
        navigate(Tab[tabPath as keyof typeof Tab]);
      }
    };
    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);
    return () => window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
  }, [navigate]);





  const saveToHistory = async (record: CalculationResult) => {
    try {
      await saveCalculation(record);
      setReportModalOpen(false);
      navigate(Tab.HISTORY);
    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Gagal menyimpan ke database. Data disimpan lokal.');
      // Fallback to localStorage
      const storedHistory = JSON.parse(localStorage.getItem('hydrofield_history') || '[]');
      const updated = [record, ...storedHistory];
      localStorage.setItem('hydrofield_history', JSON.stringify(updated));
      setReportModalOpen(false);
      navigate(Tab.HISTORY);
    }
  };



  const handleConsultAI = (type: CalculationType, inputs: any, outputs: any) => {
    const contextStr = `Tipe: ${type}\nIdentitas: ${JSON.stringify(inputs.site)}\nInput: ${JSON.stringify(inputs)}\nOutput: ${JSON.stringify(outputs)}`;
    setLastContext(contextStr);
    setAiInitialQuery(`Analisis hasil perhitungan ${type === CalculationType.MANNING ? 'Saluran Manning' : 'Debit Rasional'} di ${inputs.site?.channelName || 'lokasi ini'} menurut SNI.`);
    setAiTriggerCount(prev => prev + 1);
    setIsAIDrawerOpen(true); // Open drawer instead of switching tab
  };

  const handleCalculationSave = (type: CalculationType, inputs: any, outputs: any) => {
    setTempCalculation({ type, inputs, outputs, location: inputs.site?.location, photoUrl: inputs.site?.photoUrl });
    setReportModalOpen(true);
  };

  // ── Navbar: Grouped by workflow phase ──
  const navGroups = [
    // Grup 1: Input
    {
      items: [
        { tab: Tab.WORKFLOW, label: 'Alur Kerja', icon: <GitMerge strokeWidth={2.5} className="w-5 h-5" /> },
        { tab: Tab.MASTER, label: 'Data Master', icon: <Database strokeWidth={2.5} className="w-5 h-5" /> },
      ],
    },
    // Grup 2: Analisis
    {
      items: [
        { tab: Tab.FREKUENSI, label: 'Frekuensi', icon: <TrendingUp strokeWidth={2.5} className="w-5 h-5" /> },
        { tab: Tab.BANJIR, label: 'Banjir', icon: <CloudRain strokeWidth={2.5} className="w-5 h-5" /> },
        { tab: Tab.NERACA, label: 'Neraca', icon: <Scale strokeWidth={2.5} className="w-5 h-5" /> },
      ],
    },
    // Grup 3: Desain Infrastruktur
    {
      items: [
        { tab: Tab.EMBUNG, label: 'Embung', icon: <Droplets strokeWidth={2.5} className="w-5 h-5" /> },
        { tab: Tab.SALURAN, label: 'Saluran', icon: <Waves strokeWidth={2.5} className="w-5 h-5" /> },
      ],
    },
    // Grup 4: Output
    {
      items: [
        { tab: Tab.HISTORY, label: 'Riwayat', icon: <History strokeWidth={2.5} className="w-5 h-5" /> },
        { tab: Tab.EXEC, label: 'Laporan', icon: <FileText strokeWidth={2.5} className="w-5 h-5" /> },
      ],
    },
  ];

  return (
    <>
      <SideDrawer />
      <ToastContainer />
      <div className="min-h-screen font-sans flex flex-col bg-gradient-to-b from-slate-50 to-white">

        {/* Skip to content link for keyboard users */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[99999] focus:bg-pupr-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg">Langsung ke konten utama</a>

        {/* --- Header --- */}
        <Header
          appName={APP_NAME}
          appSubtitle="Water Resources Engineering Tools"
          statusBadge={{
            label: dbMessage,
            color: getStatusColor(),
            isLoading: dbStatus === 'testing'
          }}
          version="1.1"
        />

        {/* --- Main Content --- */}
        <main id="main-content" aria-label="Konten utama aplikasi" className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-32 md:pb-12 md:pt-24">
          <div className="transition-opacity duration-300">
            <React.Suspense fallback={<TabFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to={Tab.MASTER} replace />} />
                <Route path={Tab.WORKFLOW} element={<div className="h-[70vh] md:h-[80vh] w-full"><WorkflowCanvas /></div>} />
                <Route path={Tab.SALURAN} element={<ManningCalculator onSave={handleCalculationSave} onConsultAI={(i: any, o: any) => handleConsultAI(CalculationType.MANNING, i, o)} />} />
                <Route path={Tab.BANJIR} element={<FloodAnalysisTab onConsultAI={() => {
                  setLastContext('Analisis Banjir - Perhitungan Hidrograf dan HSS');
                  setAiInitialQuery('Audit hasil perhitungan hidrograf banjir saya. Apakah debit puncak dan Tp yang dihasilkan masuk akal untuk karakteristik DAS ini? Berikan saran optimasi parameter jika perlu.');
                  setAiTriggerCount(prev => prev + 1);
                  setIsAIDrawerOpen(true);
                }} />} />
                <Route path={Tab.NERACA} element={<WaterBalanceTab onConsultAI={() => {
                  setLastContext('Neraca Air - Analisis ketersediaan dan kebutuhan air');
                  setAiInitialQuery('Berikan analisis komprehensif tentang neraca air ini, termasuk interpretasi surplus/defisit, bulan kritis, dan rekomendasi pengelolaan sumber daya air.');
                  setAiTriggerCount(prev => prev + 1);
                  setIsAIDrawerOpen(true);
                }} />} />
                <Route path={Tab.EMBUNG} element={<EmbungDashboard onConsultAI={(tabType, data, result) => {
                  setLastContext(`Modul Embung: ${tabType}\nInput: ${JSON.stringify(data)}\nOutput: ${JSON.stringify(result)}`);
                  setAiInitialQuery(`Berikan analisis teknis komprehensif mengenai hasil perhitungan ${tabType} ini. Sebutkan poin-poin penting, potensi isu, dan rekomendasi desain yang sesuai dengan SNI.`);
                  setAiTriggerCount(prev => prev + 1);
                  setIsAIDrawerOpen(true);
                }} />} />
                <Route path={Tab.MASTER} element={<MasterDataPage />} />
                <Route path={Tab.FREKUENSI} element={<ModulAnalisisFrekuensi />} />
                <Route path={Tab.EXEC} element={<ExecutiveDashboard />} />
                <Route path={Tab.AI} element={<div className="max-w-4xl mx-auto"><GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} /></div>} />
                <Route path={Tab.HISTORY} element={
                  <AllDataTab
                    onViewDetail={(item) => setViewAllDataDetail(item)}
                    onMapDetail={(item) => setMapDetailItem(item)}
                    onConsultAI={(item) => {
                      const typeLabel = item.type === 'manning' ? 'Saluran Manning' : item.type === 'flood' ? 'Banjir' : 'Neraca Air';
                      setLastContext(`Tipe: ${typeLabel}\nProyek: ${item.project_name}\nData: ${JSON.stringify(item.data)}`);
                      setAiInitialQuery(`Analisis hasil perhitungan ${typeLabel} untuk proyek ${item.project_name} menurut SNI.`);
                      setAiTriggerCount(prev => prev + 1);
                      setIsAIDrawerOpen(true);
                    }}
                  />
                } />
                <Route path="*" element={<Navigate to={Tab.MASTER} replace />} />
              </Routes>
            </React.Suspense>
          </div>
        </main>

        <ReportModal isOpen={reportModalOpen} data={tempCalculation} onClose={() => setReportModalOpen(false)} onConfirmSave={saveToHistory} />
        <AllDataDetailModal isOpen={!!viewAllDataDetail} data={viewAllDataDetail} onClose={() => setViewAllDataDetail(null)} />

        {/* Context-Aware AI Consultant Drawer — accessible from ANY tab */}
        <AIConsultantDrawer
          isOpen={isAIDrawerOpen}
          onClose={() => setIsAIDrawerOpen(false)}
          activeTab={activeTab as ActiveModule}
          initialQuery={aiInitialQuery}
          lastContext={lastContext}
          triggerCount={aiTriggerCount}
        />

        {/* Modenized Map Detail Modal */}
        {mapDetailItem && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail proyek: ${mapDetailItem.inputs.site?.channelName || 'Detail Proyek'}`}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMapDetailItem(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setMapDetailItem(null); }}>
            <div className="bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 px-6 py-5 shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Map className="w-32 h-32 text-white" />
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div className="pr-12">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${mapDetailItem.type === CalculationType.MANNING ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        mapDetailItem.type === CalculationType.RATIONAL ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                        {mapDetailItem.type === CalculationType.MANNING ? 'Saluran Manning' :
                          mapDetailItem.type === CalculationType.RATIONAL ? 'Banjir Rasional' : 'Neraca Air'}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(mapDetailItem.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {mapDetailItem.inputs.site?.channelName || 'Detail Proyek Tidak Bernama'}
                    </h2>
                  </div>

                  <button
                    onClick={() => setMapDetailItem(null)}
                    aria-label="Tutup dialog detail proyek"
                    className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 bg-slate-50">

                {/* Result Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Output Utama</span>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {mapDetailItem.outputs.Discharge}
                      </p>
                      <span className="text-sm font-bold text-slate-500">m³/s</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      Kapasitas / Debit Rancangan maksimum
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                      <svg className="w-32 h-32 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex flex-shrink-0 items-center justify-center">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Koordinat Titik</span>
                        <p className="text-sm font-mono font-bold text-slate-900 tracking-tight">
                          {mapDetailItem.location?.latitude.toFixed(6)}, {mapDetailItem.location?.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Table */}
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      Administrasi Wilayah
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <span className="text-sm text-slate-500">Provinsi / Kabupaten</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{mapDetailItem.inputs.site?.regency || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <span className="text-sm text-slate-500">Kecamatan</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{mapDetailItem.inputs.site?.district || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <span className="text-sm text-slate-500">Desa / Kelurahan</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{mapDetailItem.inputs.site?.village || '-'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0 flex justify-end">
                <button
                  onClick={() => setMapDetailItem(null)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-lg transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Navigation Bar (Desktop Horizontal + Mobile Bottom) --- */}
        <nav aria-label="Navigasi utama" className="fixed bottom-0 left-0 right-0 md:top-20 md:bottom-auto z-50">
          {/* Desktop Navigation - Horizontal below header */}
          <div className="hidden md:block bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-start gap-1 overflow-x-auto scrollbar-hide py-2">
                {navGroups.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    {groupIndex > 0 && (
                      <div className="w-px h-8 bg-slate-200 mx-2 shrink-0" />
                    )}
                    {group.items.map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => navigate(item.tab)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab.startsWith(item.tab)
                          ? 'bg-pupr-blue text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-pupr-blue'
                          }`}
                      >
                        <div className="flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className={`text-sm font-semibold`}>{item.label}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}

                {/* Divider before AI */}
                <div className="w-px h-8 bg-slate-200 mx-2 shrink-0" />

                {/* AI Consultant */}
                <button
                  onClick={() => setIsAIDrawerOpen((prev) => !prev)}
                  className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${isAIDrawerOpen
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg ring-2 ring-indigo-200'
                    : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <Sparkles strokeWidth={2.5} className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">AI Konsultan</span>
                  {isAIDrawerOpen && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border-2 border-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation - Bottom Bar */}
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="px-1 py-1.5 safe-area-inset-bottom">
              <div className="flex items-center justify-between gap-0.5 w-full">
                {navGroups.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    {group.items.map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => navigate(item.tab)}
                        className={`flex flex-col items-center justify-center w-full min-w-0 min-h-[50px] rounded-lg transition-all duration-200 ${activeTab.startsWith(item.tab)
                          ? 'text-pupr-blue bg-blue-50/80 shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50/80'
                          }`}
                      >
                        <div className={`flex items-center justify-center transition-transform duration-200 ${activeTab.startsWith(item.tab) ? 'scale-110' : 'scale-100'}`}>
                          {React.cloneElement(item.icon as React.ReactElement, { className: 'w-[18px] h-[18px] sm:w-5 sm:h-5' })}
                        </div>
                        <span className={`text-[11px] sm:text-[10px] mt-1 truncate w-full text-center px-0.5 transition-all duration-200 ${activeTab.startsWith(item.tab) ? 'font-bold' : 'font-medium'
                          }`}>{item.label}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}

                {/* AI Consultant Mobile */}
                <button
                  onClick={() => setIsAIDrawerOpen((prev) => !prev)}
                  className={`relative flex flex-col items-center justify-center w-full min-w-0 min-h-[50px] rounded-lg transition-all duration-200 ${isAIDrawerOpen
                    ? 'text-indigo-600 bg-indigo-50 ring-1 ring-indigo-200 shadow-sm'
                    : 'text-indigo-400 hover:bg-indigo-50/50'
                    }`}
                >
                  <div className={`flex items-center justify-center transition-transform duration-200 ${isAIDrawerOpen ? 'scale-110' : 'scale-100'}`}>
                    <Sparkles strokeWidth={2.5} className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] mt-1 truncate w-full text-center px-0.5 transition-all duration-200 ${isAIDrawerOpen ? 'font-bold' : 'font-medium'
                    }`}>AI</span>
                  {isAIDrawerOpen && (
                    <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse border border-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer - Desktop Only */}
        <Footer />

      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
