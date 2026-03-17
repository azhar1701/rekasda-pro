import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ManningCalculator } from '@/features/channel-analysis/components/ManningCalculator';
import { MasterDataPage } from '@/features/master-data/components/MasterDataPage';
import { ModulAnalisisFrekuensi } from '@/features/flood-analysis/components/ModulAnalisisFrekuensi';
import { ExecutiveDashboard } from '@/features/dashboard/components/ExecutiveDashboard';
import { GeminiConsultant } from '@/features/ai-consultant/GeminiConsultant';
import { AIConsultantDrawer } from '@/features/ai-consultant/AIConsultantDrawer';
import { AllDataTab } from '@/features/history/components/AllDataTab';
import { ReportModal } from '@/components/ui/modals/ReportModal';
import { AllDataDetailModal } from '@/components/ui/modals/AllDataDetailModal';
import { AllCalculationsData } from '@/services/allCalculationsService';
import { ToastContainer } from '@/components/ui/feedback/Toast';
import { OfflineBanner } from '@/components/ui/feedback/OfflineBanner';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CalculationType } from '@/types/types';
import type { CalculationResult } from '@/types/common.types';
import type { ActiveModule } from '@/hooks/useAIContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useDatabaseStatus } from '@/features/history/components/DatabaseTest';
import { APP_NAME } from '@/constants';
import { SideDrawer } from '@/components/SideDrawer';
import { OnboardingProvider } from '@/providers/OnboardingProvider';
import { Header } from '@/components/ui/navigation/Header';
import { Navbar, Tab } from '@/components/ui/navigation/Navbar';
import { Footer } from '@/components/ui/navigation/Footer';
import { toast } from '@/hooks/useToast';

// Lazy load heavy computational tabs/modules
const FloodAnalysisTab = React.lazy(() => import('@/features/flood-analysis/components/FloodAnalysisTab').then(m => ({ default: m.FloodAnalysisTab })));
const WaterBalanceTab = React.lazy(() => import('@/features/water-balance/components/WaterBalanceTab').then(m => ({ default: m.WaterBalanceTab })));
const EmbungDashboard = React.lazy(() => import('@/features/embung/components/EmbungDashboard').then(m => ({ default: m.EmbungDashboard })));
const WorkflowCanvas = React.lazy(() => import('@/features/workflow/WorkflowCanvas').then(m => ({ default: m.WorkflowCanvas })));

// Loading fallback component
const TabFallback = () => (
  <div className="flex flex-col items-center justify-center p-12 w-full h-96 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ">
    <div className="w-12 h-12 border-4 border-[#0c3a66]/20 border-t-[#0c3a66] rounded-sm animate-spin mb-4" />
    <p className="text-sm font-bold text-slate-500 animate-pulse">Memuat Modul...</p>
  </div>
);

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  useOfflineSync();
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
  const [isMobileOverflowOpen, setIsMobileOverflowOpen] = useState(false);
  const { saveCalculation } = useDatabase();
  const { status: dbStatus, message: dbMessage, getStatusColor } = useDatabaseStatus();

  useEffect(() => {
    const handleNavigateToTab = (e: CustomEvent) => {
      const tabPath = e.detail as string;
      if (Object.values(Tab).includes(tabPath as Tab)) {
        navigate(tabPath);
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
      navigate(Tab.HISTORY);
    }
  };

  const handleConsultAI = (type: CalculationType, inputs: any, outputs: any) => {
    const contextStr = `Tipe: ${type}\nIdentitas: ${JSON.stringify(inputs.site)}\nInput: ${JSON.stringify(inputs)}\nOutput: ${JSON.stringify(outputs)}`;
    setLastContext(contextStr);
    setAiInitialQuery(`Analisis hasil perhitungan ${type === CalculationType.MANNING ? 'Saluran Manning' : 'Debit Rasional'} di ${inputs.site?.channelName || 'lokasi ini'} menurut SNI.`);
    setAiTriggerCount(prev => prev + 1);
    setIsAIDrawerOpen(true);
  };

  const handleCalculationSave = (type: CalculationType, inputs: any, outputs: any) => {
    setTempCalculation({ type, inputs, outputs, location: inputs.site?.location, photoUrl: inputs.site?.photoUrl });
    setReportModalOpen(true);
  };

  return (
    <>
      <SideDrawer />
      <ToastContainer />
      <OfflineBanner />
      <div className="min-h-screen font-sans flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header
          appName={APP_NAME}
          statusBadge={{
            label: dbMessage,
            color: getStatusColor(),
            isLoading: dbStatus === 'testing'
          }}
          version="1.1"
        />

        <Navbar 
          isAIDrawerOpen={isAIDrawerOpen}
          setIsAIDrawerOpen={setIsAIDrawerOpen}
          isMobileOverflowOpen={isMobileOverflowOpen}
          setIsMobileOverflowOpen={setIsMobileOverflowOpen}
        />

        <main className="flex-1 w-full flex flex-col pb-24 md:pb-8 pt-4 md:pt-[120px]">
          <div className="transition-opacity flex-1 flex flex-col duration-75 max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8">
            <React.Suspense fallback={<TabFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to={Tab.MASTER} replace />} />
                <Route path={Tab.WORKFLOW} element={<WorkflowCanvas />} />
                <Route path={Tab.SALURAN} element={<ManningCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.MANNING, i, o)} />} />
                <Route path={Tab.BANJIR} element={<FloodAnalysisTab onConsultAI={() => {
                   setLastContext('Analisis Banjir - Perhitungan Hidrograf dan HSS');
                   setAiInitialQuery('Audit hasil perhitungan hidrograf banjir saya.');
                   setAiTriggerCount(prev => prev + 1);
                   setIsAIDrawerOpen(true);
                 }} />} />
                <Route path={Tab.NERACA} element={<WaterBalanceTab onConsultAI={() => {
                   setLastContext('Neraca Air');
                   setIsAIDrawerOpen(true);
                 }} />} />
                <Route path={Tab.EMBUNG} element={<EmbungDashboard onConsultAI={() => setIsAIDrawerOpen(true)} />} />
                <Route path={Tab.MASTER} element={<MasterDataPage />} />
                <Route path={Tab.FREKUENSI} element={<ModulAnalisisFrekuensi />} />
                <Route path={Tab.EXEC} element={<ExecutiveDashboard />} />
                <Route path={Tab.AI} element={<GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} />} />
                <Route path={Tab.HISTORY} element={
                  <AllDataTab
                    onViewDetail={(item) => setViewAllDataDetail(item)}
                    onMapDetail={(item) => setMapDetailItem(item)}
                    onConsultAI={(item) => {
                      setLastContext(`Data: ${JSON.stringify(item.data)}`);
                      setIsAIDrawerOpen(true);
                    }}
                  />
                } />
                <Route path="*" element={<Navigate to={Tab.MASTER} replace />} />
              </Routes>
            </React.Suspense>
          </div>
        </main>

        <Footer />
      </div>

      <ReportModal isOpen={reportModalOpen} data={tempCalculation} onClose={() => setReportModalOpen(false)} onConfirmSave={saveToHistory} />
      <AllDataDetailModal isOpen={!!viewAllDataDetail} data={viewAllDataDetail} onClose={() => setViewAllDataDetail(null)} />
      
      {/* Modenized Map Detail Modal */}
      {mapDetailItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMapDetailItem(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-none shadow-none border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-75" onClick={(e) => e.stopPropagation()}>
            {/* ... simplified modal content for brevity or full content if needed ... */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h2 className="text-xl font-bold">Detail Lokasi</h2>
              <button onClick={() => setMapDetailItem(null)}>Close</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-none border border-slate-200">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Latitude</span>
                   <p className="text-lg font-bold tabular-nums">{mapDetailItem.location?.latitude.toFixed(6)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-none border border-slate-200">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Longitude</span>
                   <p className="text-lg font-bold tabular-nums">{mapDetailItem.location?.longitude.toFixed(6)}</p>
                </div>
              </div>
              <div className="mt-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Input Data</span>
                <pre className="mt-2 p-4 bg-slate-900 text-green-400 text-xs overflow-x-auto">
                  {JSON.stringify(mapDetailItem.inputs, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <AIConsultantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        activeTab={activeTab as ActiveModule}
        initialQuery={aiInitialQuery}
        lastContext={lastContext}
        triggerCount={aiTriggerCount}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <OnboardingProvider>
        <AppLayout />
      </OnboardingProvider>
    </BrowserRouter>
  );
};

export default App;
