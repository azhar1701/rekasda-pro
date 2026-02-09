import React, { useState, useEffect } from 'react';
import { ManningCalculator } from './components/ManningCalculator';
import { RationalCalculator } from './components/RationalCalculator';
import { WaterBalanceTab } from './components/WaterBalanceTab';
import { GeminiConsultant } from './components/GeminiConsultant';
import { ReportModal } from './components/ReportModal';
import { DetailModal } from './components/DetailModal';
import { HistoryMap } from './components/HistoryMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CalculationType, CalculationResult, ChannelShape, ManningInputs, RationalInputs } from './types';
import { Button } from './components/Button';
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
    // Convert Supabase calculations to CalculationResult format
    const convertedHistory = calculations.map(calc => ({
      id: calc.id || `calc-${Date.now()}`,
      type: calc.calculation_type === 'manning' ? CalculationType.MANNING : CalculationType.RATIONAL,
      date: calc.created_at || new Date().toISOString(),
      inputs: calc.input_data,
      outputs: calc.result_data,
      // Fix location mapping - check both input_data.location and direct location field
      location: calc.input_data?.location || calc.location,
      notes: calc.input_data?.notes || calc.notes || '',
      photoUrl: calc.photo_url || calc.input_data?.photoUrl || calc.input_data?.site?.photoUrl
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Decorative Background Gradients */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none z-0"></div>

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
      {/* INCREASED BOTTOM PADDING to ensure footer doesn't cover content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-8 pb-40 lg:pb-32 z-10 relative">
          <div className="transition-all duration-500 ease-out transform">
          {activeTab === Tab.SALURAN && <ManningCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.MANNING, i, o)} />}
          {activeTab === Tab.BANJIR && <RationalCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.RATIONAL, i, o)} />}
          {activeTab === Tab.NERACA && <WaterBalanceTab />}
          {activeTab === Tab.AI && <div className="max-w-4xl mx-auto pt-4 animate-slide-up"><GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} /></div>}
          
          {activeTab === Tab.HISTORY && (
               <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4">
                      <div className="w-full md:w-auto">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Database Proyek</h2>
                        <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">Kelola dan analisis riwayat perhitungan lapangan.</p>
                      </div>
                      
                      {/* Unified Toolbar */}
                      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto self-start md:self-auto">
                        <div className="flex bg-slate-100 p-1 rounded-xl flex-1 md:flex-none">
                            <button 
                                onClick={() => setHistoryViewMode('LIST')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${historyViewMode === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Daftar
                            </button>
                            <button 
                                onClick={() => setHistoryViewMode('MAP')}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${historyViewMode === 'MAP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Peta
                            </button>
                        </div>
                        
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>
                        
                        {/* Auto-Save Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-emerald-700 hidden sm:inline">Auto-sync</span>
                        </div>
                      </div>
                  </div>
                  
                  {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                          <div className="flex justify-center mb-6">
                             <span className="p-6 bg-slate-50 rounded-full text-slate-300">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             </span>
                          </div>
                          <p className="text-slate-400 font-medium mb-8 max-w-sm">Belum ada data tersimpan. Mulai dengan membuat data baru atau generate data contoh.</p>
                          <Button variant="outline" onClick={seedPilotData} disabled={loading} className="mx-auto text-xs py-3 px-8 border-dashed bg-white hover:bg-slate-50">
                            {loading ? 'Menyimpan...' : '+ Generate Pilot Data'}
                          </Button>
                      </div>
                  ) : (
                      <>
                        {historyViewMode === 'MAP' ? (
                            <div className="animate-in fade-in zoom-in-95 duration-300 bg-white p-2 rounded-[2.5rem] shadow-soft border border-slate-100">
                                <HistoryMap data={history} />
                                    <div className="p-4 flex justify-between items-center">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Menampilkan {history.filter(h => h.location).length} Lokasi Terdata</p>
                                        {loading && <div className="flex items-center gap-2 text-blue-500"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div><span className="text-xs">Sync...</span></div>}
                                        {!loading && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                                    </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                                {history.map((item) => (
                                <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-soft hover:shadow-float border border-slate-100 transition-all duration-300 flex flex-col justify-between h-full group">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${item.type === CalculationType.MANNING ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {item.type}
                                            </div>
                                            <button 
                                                onClick={(e) => deleteHistoryItem(e, item.id)} 
                                                className="p-2 -mr-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                title="Hapus Data"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-slate-900 leading-tight mb-2 text-lg line-clamp-2">{item.inputs.site?.channelName || 'Tanpa Nama'}</h3>
                                        <p className="text-xs text-slate-500 mb-6 flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                        </p>
                                        
                                        <div className="mb-8 p-4 bg-slate-50 rounded-2xl">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Output Utama</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900">{item.outputs.Discharge}</span>
                                                <span className="text-sm font-bold text-slate-400">m³/s</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-auto">
                                        <div className="flex gap-2">
                                            <button onClick={() => setViewDetailItem(item)} className="flex-1 py-3 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                                                Lihat Detail
                                            </button>
                                            <button onClick={() => copyToClipboard(item)} className="px-4 py-3 text-slate-400 bg-white border border-slate-200 rounded-xl hover:text-safety-blue hover:border-safety-blue transition-colors shadow-sm" title="Salin Ringkasan">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1" /></svg>
                                            </button>
                                        </div>
                                        <button onClick={() => handleConsultAI(item.type, item.inputs, item.outputs)} className="w-full py-3 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            AI Analisis
                                        </button>
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

      {/* --- Floating Navigation Dock --- */}
      {/* UPDATED: Floating style with padding bottom to avoid covering content */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-4 lg:pb-8">
        <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-card w-[92%] max-w-lg lg:w-auto rounded-2xl lg:rounded-2xl pointer-events-auto transition-all duration-300">
            <div className="flex justify-around items-center px-2 py-3 lg:px-6 lg:py-4 gap-1 lg:gap-4 min-w-[320px]">
            {navigationItems.map((item, idx) => (
                <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className={`
                        relative flex flex-col lg:flex-row items-center justify-center p-3 lg:px-6 lg:py-3 rounded-xl lg:rounded-lg transition-all duration-300 group
                        ${
                          activeTab === item.tab
                            ? idx === 0
                              ? 'bg-teal-600 text-white shadow-card'
                              : idx === 1
                              ? 'bg-emerald-600 text-white shadow-card'
                              : idx === 2
                              ? 'bg-blue-600 text-white shadow-card'
                              : idx === 3
                              ? 'bg-slate-700 text-white shadow-card'
                              : 'bg-indigo-600 text-white shadow-card'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }
                    `}
                >
                    <div className={`transition-transform duration-300`}>
                    {item.icon}
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold mt-1 lg:mt-0 lg:ml-2 transition-all duration-300 ${activeTab === item.tab ? 'opacity-100 max-w-[100px]' : 'opacity-100 lg:opacity-0 lg:max-w-0 overflow-hidden'}`}>{item.label}</span>
                    
                    {/* Active Indicator Dot (Mobile Only) */}
                    {activeTab === item.tab && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full lg:hidden"></span>
                    )}
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
