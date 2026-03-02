import React, { useState, useEffect } from 'react';
import { Waves, CloudRain, Scale, Database, Sparkles, Droplets, FileText, TrendingUp } from 'lucide-react';
import { ManningCalculator } from '@/features/channel-analysis/components/ManningCalculator';
import { ModulBanjirStepper } from '@/features/flood-analysis/components/ModulBanjirStepper';
import { WaterBalanceTab } from '@/features/water-balance/components/WaterBalanceTab';
import { EmbungDashboard } from '@/features/embung/components/EmbungDashboard';
import { ExecutiveDashboard } from '@/features/dashboard/components/ExecutiveDashboard';
import { GeminiConsultant } from '@/features/ai-consultant/GeminiConsultant';
import { AIConsultantDrawer } from '@/features/ai-consultant/AIConsultantDrawer';
import { MasterDataPage } from '@/features/master-data/components/MasterDataPage';
import { ModulAnalisisFrekuensi } from '@/features/flood-analysis/components/ModulAnalisisFrekuensi';
import { ReportModal } from '@/components/ui/modals/ReportModal';
import { AllDataTab } from '@/features/history/components/AllDataTab';
import { AllDataDetailModal } from '@/components/ui/modals/AllDataDetailModal';
import { AllCalculationsData } from '@/services/allCalculationsService';
import { ToastContainer } from '@/components/ui/feedback/Toast';
import { CalculationType } from '@/types/types';
import type { CalculationResult } from '@/types/common.types';
import type { ActiveModule } from '@/hooks/useAIContext';

import { Header } from '@/components/ui/navigation/Header';
import { Footer } from '@/components/ui/navigation/Footer';

import { useDatabase } from '@/hooks/useDatabase';
import { useDatabaseStatus } from '@/features/history/components/DatabaseTest';
import { APP_NAME } from '@/constants';
import { SideDrawer } from '@/components/SideDrawer';
import { WorkflowCanvas } from '@/features/workflow/WorkflowCanvas';
import { GitMerge } from 'lucide-react';

enum Tab {
  WORKFLOW = 'WORKFLOW',
  SALURAN = 'SALURAN',
  BANJIR = 'BANJIR',
  NERACA = 'NERACA',
  EMBUNG = 'EMBUNG',
  MASTER = 'MASTER',
  FREKUENSI = 'FREKUENSI',
  HISTORY = 'HISTORY',
  AI = 'AI',
  EXEC = 'EXEC'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.MASTER);
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
      const tabName = e.detail as string;
      if (tabName in Tab) {
        setActiveTab(Tab[tabName as keyof typeof Tab]);
      }
    };
    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);
    return () => window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
  }, []);





  const saveToHistory = async (record: CalculationResult) => {
    try {
      await saveCalculation(record);
      setReportModalOpen(false);
      setActiveTab(Tab.HISTORY);
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Gagal menyimpan ke database. Data disimpan lokal.');
      // Fallback to localStorage
      const storedHistory = JSON.parse(localStorage.getItem('hydrofield_history') || '[]');
      const updated = [record, ...storedHistory];
      localStorage.setItem('hydrofield_history', JSON.stringify(updated));
      setReportModalOpen(false);
      setActiveTab(Tab.HISTORY);
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
        { tab: Tab.EXEC, label: 'Laporan', icon: <FileText strokeWidth={2.5} className="w-5 h-5" /> },
      ],
    },
  ];

  return (
    <>
      <SideDrawer />
      <ToastContainer />
      <div className="min-h-screen font-sans flex flex-col bg-gradient-to-b from-slate-50 to-white">

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
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-28 md:pb-8 md:pt-24">
          <div className="transition-opacity duration-300">
            {activeTab === Tab.WORKFLOW && <div className="h-[800px] w-full"><WorkflowCanvas /></div>}
            {activeTab === Tab.SALURAN && <ManningCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.MANNING, i, o)} />}
            {activeTab === Tab.BANJIR && <ModulBanjirStepper />}
            {activeTab === Tab.NERACA && <WaterBalanceTab onConsultAI={() => {
              setLastContext('Neraca Air - Analisis ketersediaan dan kebutuhan air');
              setAiInitialQuery('Berikan analisis komprehensif tentang neraca air ini, termasuk interpretasi surplus/defisit, bulan kritis, dan rekomendasi pengelolaan sumber daya air.');
              setAiTriggerCount(prev => prev + 1);
              setIsAIDrawerOpen(true);
            }} />}
            {activeTab === Tab.EMBUNG && <EmbungDashboard onConsultAI={(tabType, data, result) => {
              setLastContext(`Modul Embung: ${tabType}\nInput: ${JSON.stringify(data)}\nOutput: ${JSON.stringify(result)}`);
              setAiInitialQuery(`Berikan analisis teknis komprehensif mengenai hasil perhitungan ${tabType} ini. Sebutkan poin-poin penting, potensi isu, dan rekomendasi desain yang sesuai dengan SNI.`);
              setAiTriggerCount(prev => prev + 1);
              setIsAIDrawerOpen(true);
            }} />}
            {activeTab === Tab.MASTER && <MasterDataPage />}
            {activeTab === Tab.FREKUENSI && <ModulAnalisisFrekuensi />}
            {activeTab === Tab.EXEC && <ExecutiveDashboard />}
            {activeTab === Tab.AI && <div className="max-w-4xl mx-auto"><GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} /></div>}

            {activeTab === Tab.HISTORY && <AllDataTab
              onViewDetail={(item) => setViewAllDataDetail(item)}
              onMapDetail={(item) => setMapDetailItem(item)}
              onConsultAI={(item) => {
                const typeLabel = item.type === 'manning' ? 'Saluran Manning' : item.type === 'flood' ? 'Banjir' : 'Neraca Air';
                setLastContext(`Tipe: ${typeLabel}\nProyek: ${item.project_name}\nData: ${JSON.stringify(item.data)}`);
                setAiInitialQuery(`Analisis hasil perhitungan ${typeLabel} untuk proyek ${item.project_name} menurut SNI.`);
                setAiTriggerCount(prev => prev + 1);
                setIsAIDrawerOpen(true);
              }}
            />}
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMapDetailItem(null)}>
            <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 px-6 py-5 shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
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
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(mapDetailItem.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {mapDetailItem.inputs.site?.channelName || 'Detail Proyek Tidak Bernama'}
                    </h2>
                  </div>

                  <button
                    onClick={() => setMapDetailItem(null)}
                    className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 bg-slate-50">

                {/* Result Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Output Utama</span>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-slate-900 tracking-tight">
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
        <nav className="fixed bottom-0 left-0 right-0 md:top-20 md:bottom-auto z-50">
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
                        onClick={() => setActiveTab(item.tab)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
                          activeTab === item.tab
                            ? 'bg-[#0c3a66] text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-[#0c3a66]'
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
                  className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    isAIDrawerOpen
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
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-lg">
            <div className="px-3 py-2 safe-area-inset-bottom">
              <div className="flex items-center justify-evenly gap-0.5 overflow-x-auto scrollbar-hide">
                {navGroups.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    {group.items.map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => setActiveTab(item.tab)}
                        className={`flex flex-col items-center justify-center min-w-[60px] min-h-[56px] px-2 py-2 rounded-xl transition-all duration-200 shrink-0 ${
                          activeTab === item.tab
                            ? 'text-[#0c3a66] bg-blue-50'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className={`text-[10px] mt-1 transition-all duration-200 ${
                          activeTab === item.tab ? 'font-bold' : 'font-medium'
                        }`}>{item.label}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}

                {/* AI Consultant Mobile */}
                <button
                  onClick={() => setIsAIDrawerOpen((prev) => !prev)}
                  className={`relative flex flex-col items-center justify-center min-w-[60px] min-h-[56px] px-2 py-2 rounded-xl transition-all duration-200 shrink-0 ${
                    isAIDrawerOpen
                      ? 'text-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'text-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <Sparkles strokeWidth={2.5} className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] mt-1 transition-all duration-200 ${
                    isAIDrawerOpen ? 'font-bold' : 'font-medium'
                  }`}>AI</span>
                  {isAIDrawerOpen && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
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

export default App;
