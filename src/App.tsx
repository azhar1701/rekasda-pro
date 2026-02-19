import React, { useState, useEffect } from 'react';
import { Waves, CloudRain, Scale, Database, Sparkles } from 'lucide-react';
import { ManningCalculator } from '@/features/channel-analysis/components/ManningCalculator';
import { FloodDischargeCalculator } from '@/features/flood-analysis/components/FloodDischargeCalculator';
import { ModifiedRationalCalculator } from '@/features/flood-analysis';
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
  BANJIR_MODIFIED = 'BANJIR_MODIFIED',
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
  const [mapDetailItem, setMapDetailItem] = useState<any>(null);
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
      icon: <Waves strokeWidth={2} />,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600'
    },
    { 
      tab: Tab.BANJIR, 
      label: 'Banjir', 
      icon: <CloudRain strokeWidth={2} />,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    { 
      tab: Tab.BANJIR_MODIFIED, 
      label: 'Modified', 
      icon: <CloudRain strokeWidth={2} />,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    { 
      tab: Tab.NERACA, 
      label: 'Neraca', 
      icon: <Scale strokeWidth={2} />,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    { 
      tab: Tab.HISTORY, 
      label: 'Data', 
      icon: <Database strokeWidth={2} />,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    { 
      tab: Tab.AI, 
      label: 'Konsultan', 
      icon: <Sparkles strokeWidth={2} />,
      color: 'bg-amber-500',
      textColor: 'text-amber-600'
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
          {activeTab === Tab.BANJIR_MODIFIED && <ModifiedRationalCalculator />}
          {activeTab === Tab.NERACA && <WaterBalanceTab onConsultAI={() => {
            setLastContext('Neraca Air - Analisis ketersediaan dan kebutuhan air');
            setAiInitialQuery('Berikan analisis komprehensif tentang neraca air ini, termasuk interpretasi surplus/defisit, bulan kritis, dan rekomendasi pengelolaan sumber daya air.');
            setActiveTab(Tab.AI);
          }} />}
          {activeTab === Tab.AI && <div className="max-w-4xl mx-auto"><GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} /></div>}
          
          {activeTab === Tab.HISTORY && <AllDataTab 
            onViewDetail={(item) => setViewAllDataDetail(item)}
            onMapDetail={(item) => setMapDetailItem(item)}
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
      
      {/* Map Detail Modal */}
      {mapDetailItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setMapDetailItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mb-2 ${mapDetailItem.type === CalculationType.MANNING ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {mapDetailItem.type}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{mapDetailItem.inputs.site?.channelName || 'Detail Proyek'}</h2>
              </div>
              <button onClick={() => setMapDetailItem(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Tanggal</span>
                  <p className="text-sm font-medium text-slate-900">{new Date(mapDetailItem.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Output Utama</span>
                  <p className="text-2xl font-black text-slate-900">{mapDetailItem.outputs.Discharge} <span className="text-sm font-semibold text-slate-600">m³/s</span></p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide block mb-1">Koordinat Lokasi</span>
                    <p className="text-sm font-mono text-blue-900">{mapDetailItem.location?.latitude.toFixed(6)}, {mapDetailItem.location?.longitude.toFixed(6)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Informasi Lokasi</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kabupaten:</span>
                    <span className="font-semibold text-slate-900">{mapDetailItem.inputs.site?.regency || 'Tidak tersedia'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kecamatan:</span>
                    <span className="font-semibold text-slate-900">{mapDetailItem.inputs.site?.district || 'Tidak tersedia'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Desa:</span>
                    <span className="font-semibold text-slate-900">{mapDetailItem.inputs.site?.village || 'Tidak tersedia'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                            ? `${item.color} text-white shadow-md`
                            : `text-slate-400 hover:${item.textColor} hover:bg-blue-50 active:bg-blue-100`
                        }`}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {React.cloneElement(item.icon as React.ReactElement, {
                        className: 'w-5 h-5',
                        stroke: 'currentColor',
                        fill: 'none'
                      })}
                    </div>
                    <span className="text-[10px] md:text-xs font-medium mt-0.5 text-current">{item.label}</span>
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
