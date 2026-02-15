import React, { useState, useEffect } from 'react';
import { ManningCalculator } from './components/ManningCalculator';
import { FloodDischargeCalculator } from './components/FloodDischargeCalculator';
import { WaterBalanceTab } from './components/WaterBalanceTab';
import { GeminiConsultant } from './components/GeminiConsultant';
import { ReportModal } from './components/ReportModal';
import { DetailModal } from './components/DetailModal';
import { HistoryMap } from './components/HistoryMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { CalculationType, CalculationResult, ChannelShape, ManningInputs, RationalInputs } from './types';
import { Button } from './components/ui/Button';
import { Header } from './components/ui/Header';
import { calculateManning, calculateRational } from './services/calculationService';
import { useDatabase } from './lib/useDatabase';
import { useDatabaseStatus } from './components/DatabaseTest';
import { APP_NAME } from './constants';

enum Tab {
  SALURAN = 'SALURAN',
  BANJIR = 'BANJIR',
  NERACA = 'NERACA',
  HISTORY = 'HISTORY',
  AI = 'AI'
}

type ViewMode = 'LIST' | 'MAP';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SALURAN);
  const [historyViewMode, setHistoryViewMode] = useState<ViewMode>('LIST');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [tempCalculation, setTempCalculation] = useState<Partial<CalculationResult> | null>(null);
  const [history, setHistory] = useState<CalculationResult[]>([]);
  const [viewDetailItem, setViewDetailItem] = useState<CalculationResult | null>(null);
  const [lastContext, setLastContext] = useState<string>('');
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, loading } = useDatabase();
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

  const seedPilotData = async () => {
    const timestamp = Date.now();
    const manningInput: ManningInputs = {
      site: { channelName: 'Sekunder Soreang (Pilot)', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
      shape: ChannelShape.TRAPEZOID,
      roughness: 0.015,
      slope: 0.002,
      width: 1.2,
      topWidth: 2.0,
      diameter: 1.0,
      depth: 0.45,
      totalDepth: 1.0,
      sideSlope: 0.4,
    };
    const manningOutput = calculateManning(manningInput);
    const manningRecord: CalculationResult = {
      id: `pilot-manning-${timestamp}`,
      type: CalculationType.MANNING,
      date: new Date(timestamp - 86400000).toISOString(),
      inputs: manningInput,
      outputs: manningOutput,
      location: { latitude: -7.0223, longitude: 107.5198, accuracy: 10, timestamp: timestamp },
      notes: "Kondisi dinding beton baik. Sedimen minimal."
    };

    const rationalInput: RationalInputs = {
      site: { channelName: 'DAS Soreang Indah (Pilot)', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
      runoffCoefficient: 0.75,
      rainfallDesign: 145,
      area: 0.25,
      flowLength: 0.6,
      catchmentSlope: 0.02
    };
    const rationalOutput = calculateRational(rationalInput);
    const rationalRecord: CalculationResult = {
      id: `pilot-rational-${timestamp}`,
      type: CalculationType.RATIONAL,
      date: new Date(timestamp - 172800000).toISOString(),
      inputs: rationalInput,
      outputs: rationalOutput,
      location: { latitude: -7.0250, longitude: 107.5250, accuracy: 15, timestamp: timestamp },
      notes: "Kawasan pemukiman padat."
    };

    try {
      await saveCalculation(manningRecord);
      await saveCalculation(rationalRecord);
      alert("2 Rekaman Pilot berhasil ditambahkan ke Database!");
    } catch (error) {
      console.error('Error saving pilot data:', error);
      alert("Gagal menyimpan ke database. Cek koneksi Supabase.");
    }
  };

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

  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (window.confirm("Hapus rekaman ini secara permanen?")) {
      try {
        await deleteCalculation(id);
      } catch (error) {
        console.error('Error deleting from database:', error);
        alert('Gagal menghapus dari database.');
      }
    }
  };

  const copyToClipboard = (item: CalculationResult) => {
    const typeLabel = item.type === CalculationType.MANNING ? 'Saluran Manning' : 'Debit Rasional';
    const text = `LAPORAN ${typeLabel}\nLokasi: ${item.inputs.site?.channelName}\nQ: ${item.outputs.Discharge} m3/s\nSumber: TirtaSakti Pro`;
    navigator.clipboard.writeText(text).then(() => alert("Disalin!")).catch(console.error);
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
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 pb-32">
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
          
          {activeTab === Tab.HISTORY && (
               <div className="space-y-6">
                  {/* Header */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Database Proyek</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola dan analisis riwayat perhitungan</p>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex justify-end">
                    <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
                      <button 
                        onClick={() => setHistoryViewMode('LIST')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
                          historyViewMode === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Daftar
                      </button>
                      <button 
                        onClick={() => setHistoryViewMode('MAP')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
                          historyViewMode === 'MAP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Peta
                      </button>
                    </div>
                  </div>
                  
                  {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <p className="text-slate-600 mb-6">Belum ada data tersimpan</p>
                          <Button variant="outline" onClick={seedPilotData} disabled={loading} isLoading={loading}>
                            Generate Pilot Data
                          </Button>
                      </div>
                  ) : (
                      <>
                        {historyViewMode === 'MAP' ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Peta Lokasi Proyek</h2>
                                <HistoryMap data={history} />
                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <p className="text-xs text-slate-500">{history.filter(h => h.location).length} lokasi terdata</p>
                                    {loading && <div className="flex items-center gap-2 text-teal-600"><div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div><span className="text-xs font-medium">Sync...</span></div>}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {history.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col h-full">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`px-2 py-1 rounded text-xs font-semibold ${item.type === CalculationType.MANNING ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {item.type}
                                            </div>
                                            <button 
                                                onClick={(e) => deleteHistoryItem(e, item.id)} 
                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                title="Hapus"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{item.inputs.site?.channelName || 'Tanpa Nama'}</h3>
                                        <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                        </p>
                                        
                                        <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                                            <span className="text-xs text-slate-500 block mb-1">Debit</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-slate-900">{item.outputs.Discharge}</span>
                                                <span className="text-sm text-slate-500">m³/s</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-auto">
                                        <button onClick={() => setViewDetailItem(item)} className="w-full py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                                            Lihat Detail
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => copyToClipboard(item)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" title="Salin">
                                                Salin
                                            </button>
                                            <button onClick={() => handleConsultAI(item.type, item.inputs, item.outputs)} className="flex-1 py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                                                AI Analisis
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        )}
                      </>
                  )}
               </div>
          )}
          </div>
      </main>

      <ReportModal isOpen={reportModalOpen} data={tempCalculation} onClose={() => setReportModalOpen(false)} onConfirmSave={saveToHistory} />
      <DetailModal isOpen={!!viewDetailItem} data={viewDetailItem} onClose={() => setViewDetailItem(null)} />

      {/* --- Navigation Bar --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white border border-slate-200 shadow-lg rounded-full px-2 py-2">
            <div className="flex items-center gap-1">
            {navigationItems.map((item) => (
                <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className={`flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all ${
                          activeTab === item.tab
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                >
                    {item.icon}
                    <span className="text-xs font-medium mt-0.5">{item.label}</span>
                </button>
            ))}
            </div>
        </div>
      </div>
      
    </div>
    </ErrorBoundary>
  );
};

export default App;
