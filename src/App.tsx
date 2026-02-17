import React, { useState, useEffect } from 'react';
import { ManningCalculator } from '@/features/channel-analysis/components/ManningCalculator';
import { FloodDischargeCalculator } from '@/features/flood-analysis/components/FloodDischargeCalculator';
import { WaterBalanceTab } from '@/features/water-balance/components/WaterBalanceTab';
import { GeminiConsultant } from '@/features/ai-consultant/GeminiConsultant';
import { ReportModal } from '@/components/ui/modals/ReportModal';
import { AllDataTab } from '@/features/history/components/AllDataTab';
import { AllDataDetailModal } from '@/components/ui/modals/AllDataDetailModal';
import { AllCalculationsData } from '@/services/allCalculationsService';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToastContainer } from '@/components/ui/feedback/Toast';
import { CalculationType, CalculationResult } from '@/types/types';

import { Header } from '@/components/ui/navigation/Header';

import { useDatabase } from '@/lib/useDatabase';
import { useDatabaseStatus } from '@/features/history/components/DatabaseTest';
import { APP_NAME } from '@/constants';

enum Tab {
  SALURAN = 'SALURAN',
  BANJIR = 'BANJIR',
  NERACA = 'NERACA',
  HISTORY = 'HISTORY',
  AI = 'AI'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SALURAN);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [tempCalculation, setTempCalculation] = useState<Partial<CalculationResult> | null>(null);
  const [history, setHistory] = useState<CalculationResult[]>([]);
  const [viewAllDataDetail, setViewAllDataDetail] = useState<AllCalculationsData | null>(null);
  const [lastContext, setLastContext] = useState<string>('');
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const { calculations, saveCalculation } = useDatabase();
  const { status: dbStatus, message: dbMessage, getStatusColor } = useDatabaseStatus();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const convertedHistory: CalculationResult[] = calculations.map(calc => {
      const result: CalculationResult = {
        id: calc.id || `calc-${Date.now()}`,
        type: calc.calculation_type === 'manning' ? CalculationType.MANNING : CalculationType.RATIONAL,
        date: calc.created_at || new Date().toISOString(),
        inputs: calc.input_data as any,
        outputs: calc.result_data as any,
        location: calc.input_data?.location || calc.location,
        notes: calc.input_data?.notes || calc.notes || '',
        photoUrl: calc.photo_url || calc.input_data?.photoUrl || calc.input_data?.site?.photoUrl
      };
      return result;
    });
    setHistory(convertedHistory);
  }, [calculations]);



  const saveToHistory = async (record: CalculationResult) => {
    try {
      await saveCalculation(record);
      setReportModalOpen(false);
      setActiveTab(Tab.HISTORY);
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Gagal menyimpan ke database. Data disimpan lokal.');
      // Fallback to localStorage
      const updated = [record, ...history];
      setHistory(updated);
      localStorage.setItem('hydrofield_history', JSON.stringify(updated));
      setReportModalOpen(false);
      setActiveTab(Tab.HISTORY);
    }
  };



  const handleConsultAI = (type: CalculationType, inputs: any, outputs: any) => {
    const contextStr = `Tipe: ${type}\nIdentitas: ${JSON.stringify(inputs.site)}\nInput: ${JSON.stringify(inputs)}\nOutput: ${JSON.stringify(outputs)}`;
    setLastContext(contextStr);
    setAiInitialQuery(`Analisis hasil perhitungan ${type === CalculationType.MANNING ? 'Saluran Manning' : 'Debit Rasional'} di ${inputs.site?.channelName || 'lokasi ini'} menurut SNI.`);
    setActiveTab(Tab.AI);
  };

  const handleCalculationSave = (type: CalculationType, inputs: any, outputs: any) => {
    setTempCalculation({ type, inputs, outputs, location: inputs.site?.location, photoUrl: inputs.site?.photoUrl });
    setReportModalOpen(true);
  };

  const navigationItems = [
    { 
      tab: Tab.SALURAN, 
      label: 'Saluran', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 10l8-8m0 0l8 8M12 2v20" /></svg>,
    },
    { 
      tab: Tab.BANJIR, 
      label: 'Banjir', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
    },
    { 
      tab: Tab.NERACA, 
      label: 'Neraca', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
    },
    { 
      tab: Tab.HISTORY, 
      label: 'Data', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zM4 10h16M10 4v16" /></svg>,
    },
    { 
      tab: Tab.AI, 
      label: 'Konsultan', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    }
  ];

  return (
    <ErrorBoundary>
    <ToastContainer />
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">

      {/* --- Header --- */}
      <Header 
        appName={APP_NAME}
        appSubtitle="Water Resources Engineering Tools"
        statusBadge={{
          label: dbMessage,
          color: getStatusColor(),
          isLoading: dbStatus === 'testing'
        }}
        version="1.0"
        isScrolled={scrolled}
      />

      {/* --- Main Content --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-4 pb-24 md:pb-32">
          <div className="transition-opacity duration-300">
          {activeTab === Tab.SALURAN && <ManningCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.MANNING, i, o)} />}
          {activeTab === Tab.BANJIR && <FloodDischargeCalculator onConsultAI={() => {
            setLastContext('Analisis Banjir - Perhitungan debit puncak dan hidrograf');
            setAiInitialQuery('Berikan analisis komprehensif tentang hasil perhitungan banjir ini, termasuk interpretasi debit puncak, waktu puncak, dan rekomendasi desain saluran.');
            setActiveTab(Tab.AI);
          }} />}
          {activeTab === Tab.NERACA && <WaterBalanceTab onConsultAI={() => {
            setLastContext('Neraca Air - Analisis ketersediaan dan kebutuhan air');
            setAiInitialQuery('Berikan analisis komprehensif tentang neraca air ini, termasuk interpretasi surplus/defisit, bulan kritis, dan rekomendasi pengelolaan sumber daya air.');
            setActiveTab(Tab.AI);
          }} />}
          {activeTab === Tab.AI && <div className="max-w-4xl mx-auto"><GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} /></div>}
          
          {activeTab === Tab.HISTORY && <AllDataTab 
            onViewDetail={(item) => setViewAllDataDetail(item)}
            onConsultAI={(item) => {
              const typeLabel = item.type === 'manning' ? 'Saluran Manning' : item.type === 'flood' ? 'Banjir' : 'Neraca Air';
              setLastContext(`Tipe: ${typeLabel}\nProyek: ${item.project_name}\nData: ${JSON.stringify(item.data)}`);
              setAiInitialQuery(`Analisis hasil perhitungan ${typeLabel} untuk proyek ${item.project_name} menurut SNI.`);
              setActiveTab(Tab.AI);
            }}
          />}
          </div>
      </main>

      <ReportModal isOpen={reportModalOpen} data={tempCalculation} onClose={() => setReportModalOpen(false)} onConfirmSave={saveToHistory} />
      <AllDataDetailModal isOpen={!!viewAllDataDetail} data={viewAllDataDetail} onClose={() => setViewAllDataDetail(null)} />

      {/* --- Navigation Bar (Mobile-First Bottom Nav) --- */}
      <nav className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 md:w-auto md:max-w-full">
        <div className="bg-white border-t md:border md:border-slate-200 md:shadow-lg md:rounded-full px-2 md:px-2 py-2 md:py-2 safe-area-inset-bottom">
            <div className="flex items-center justify-around md:gap-1">
            {navigationItems.map((item) => (
                <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 md:px-4 py-2 rounded-xl md:rounded-full transition-all ${
                          activeTab === item.tab
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100'
                        }`}
                >
                    <div className="w-5 h-5">{item.icon}</div>
                    <span className="text-[10px] md:text-xs font-medium mt-0.5">{item.label}</span>
                </button>
            ))}
            </div>
        </div>
      </nav>
      
    </div>
    </ErrorBoundary>
  );
};

export default App;
