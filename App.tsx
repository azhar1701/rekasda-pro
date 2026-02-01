import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, AppBar, Toolbar, Typography, Container, Paper, BottomNavigation, BottomNavigationAction, Fab, Alert, LinearProgress } from '@mui/material';
import { WaterDrop, Flood, History, Psychology, Add } from '@mui/icons-material';
import { theme } from './theme';
import { ManningCalculator } from './components/ManningCalculator';
import { RationalCalculator } from './components/RationalCalculator';
import { GeminiConsultant } from './components/GeminiConsultant';
import { ReportModal } from './components/ReportModal';
import { DetailModal } from './components/DetailModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { HistoryMap } from './components/HistoryMap';
import { EnhancedErrorBoundary } from './components/EnhancedErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ProgressiveHistory } from './components/ProgressiveHistory';
import { CompactExport } from './components/CompactExport';
import { CalculationType, CalculationResult, ChannelShape, ManningInputs, RationalInputs } from './types';
import { Button } from './components/Button';
import { calculateManning, calculateRational } from './services/calculationService';
import { useDatabase } from './lib/useDatabase';
import { useDatabaseStatus } from './components/DatabaseTest';
import { OfflineStorage } from './services/offlineStorage';
import { APP_NAME } from './constants';

enum Tab {
  SALURAN = 'SALURAN',
  BANJIR = 'BANJIR',
  HISTORY = 'HISTORY',
  AI = 'AI'
}

type ViewMode = 'LIST' | 'MAP';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SALURAN);
  const [historyViewMode, setHistoryViewMode] = useState<ViewMode>('LIST');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [manualEntryModalOpen, setManualEntryModalOpen] = useState(false);
  const [tempCalculation, setTempCalculation] = useState<Partial<CalculationResult> | null>(null);
  const [history, setHistory] = useState<CalculationResult[]>([]);
  const [viewDetailItem, setViewDetailItem] = useState<CalculationResult | null>(null);
  const [lastContext, setLastContext] = useState<string>('');
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const [pullToRefresh, setPullToRefresh] = useState(false);
  const { calculations, saveCalculation, deleteCalculation, loading, syncing, error, isOnline, refetch } = useDatabase();
  const { status: dbStatus, message: dbMessage, getStatusColor } = useDatabaseStatus();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
    }
  }, []);

  // Pull to refresh functionality
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0 && window.scrollY === 0 && !isRefreshing) {
        setPullToRefresh(diff > 100);
      }
    };

    const handleTouchEnd = async () => {
      if (pullToRefresh && !isRefreshing) {
        isRefreshing = true;
        setPullToRefresh(false);
        try {
          await refetch();
        } catch (error) {
          console.error('Refresh failed:', error);
        }
        isRefreshing = false;
      }
      setPullToRefresh(false);
    };

    const options = { passive: true };
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullToRefresh, refetch]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
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
      // Data is already saved offline by the hook
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
    { tab: Tab.SALURAN, label: 'Saluran', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 10l8-8m0 0l8 8M12 2v20" /></svg>, activeColor: 'text-safety-blue bg-safety-blue/10 shadow-[0_0_15px_rgba(0,98,204,0.3)]' },
    { tab: Tab.BANJIR, label: 'Banjir', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>, activeColor: 'text-alert-red bg-alert-red/10 shadow-[0_0_15px_rgba(211,47,47,0.3)]' },
    { tab: Tab.HISTORY, label: 'Data', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zM4 10h16M10 4v16" /></svg>, activeColor: 'text-slate-900 bg-slate-200' },
    { tab: Tab.AI, label: 'AI', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, activeColor: 'text-indigo-600 bg-indigo-50 shadow-[0_0_15px_rgba(79,70,229,0.3)]' }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EnhancedErrorBoundary>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
          {/* Pull to refresh indicator */}
          {pullToRefresh && (
            <Alert severity="info" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderRadius: 0 }}>
              Lepaskan untuk refresh
            </Alert>
          )}
          
          {/* Offline indicator */}
          {!isOnline && (
            <Alert severity="warning" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, borderRadius: 0 }}>
              Mode Offline - Data akan disinkronkan saat online
            </Alert>
          )}
          
          {/* Sync indicator */}
          {syncing && (
            <Alert severity="info" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress size={16} />
                Menyinkronkan data...
              </Box>
            </Alert>
          )}

          {/* Header */}
          <AppBar position="sticky" elevation={scrolled ? 4 : 0} sx={{ bgcolor: scrolled ? 'background.paper' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none' }}>
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                <Paper sx={{ p: 1, bgcolor: 'primary.main', color: 'white' }}>
                  <WaterDrop />
                </Paper>
                <Box>
                  <Typography variant="h6" component="h1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {APP_NAME} <Box component="span" sx={{ color: 'primary.main' }}>Pro</Box>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Field Engineering Tools
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                <Paper sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getStatusColor(), animation: dbStatus === 'testing' ? 'pulse 2s infinite' : 'none' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{dbMessage}</Typography>
                    {!isOnline && <Typography variant="caption" sx={{ bgcolor: 'warning.light', color: 'warning.dark', px: 1, py: 0.5, borderRadius: 1 }}>OFFLINE</Typography>}
                  </Box>
                </Paper>
                <Typography variant="caption" sx={{ bgcolor: 'background.default', px: 2, py: 1, borderRadius: 2, fontWeight: 700 }}>v2.0 Enhanced</Typography>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Main Content */}
          <Container maxWidth="xl" sx={{ flex: 1, py: 4, pb: 12 }}>
            <Box sx={{ transition: 'all 0.5s ease-out' }}>
              {activeTab === Tab.SALURAN && <ManningCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.MANNING, i, o)} />}
              {activeTab === Tab.BANJIR && <RationalCalculator onSave={handleCalculationSave} onConsultAI={(i, o) => handleConsultAI(CalculationType.RATIONAL, i, o)} />}
              {activeTab === Tab.AI && <Box sx={{ maxWidth: 'lg', mx: 'auto', pt: 2 }}><GeminiConsultant lastContext={lastContext} initialQuery={aiInitialQuery} /></Box>}
              
              {activeTab === Tab.HISTORY && (
                <Box sx={{ maxWidth: 'xl', mx: 'auto', space: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Database Proyek</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">Kelola dan analisis riwayat perhitungan lapangan</Typography>
                        {history.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Paper sx={{ px: 1, py: 0.5, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                              <Typography variant="caption">{history.filter(h => h.type === CalculationType.MANNING).length} Manning</Typography>
                            </Paper>
                            <Paper sx={{ px: 1, py: 0.5, bgcolor: 'error.light', color: 'error.contrastText' }}>
                              <Typography variant="caption">{history.filter(h => h.type === CalculationType.RATIONAL).length} Rational</Typography>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    
                    <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompactExport data={history} />
                      <Fab size="small" color="primary" onClick={() => setManualEntryModalOpen(true)} disabled={loading}>
                        <Add />
                      </Fab>
                    </Paper>
                  </Box>
                  
                  {history.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
                      <WaterDrop sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" sx={{ mb: 1 }}>Belum Ada Data</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Mulai dengan membuat perhitungan baru atau generate data contoh</Typography>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button variant="outline" onClick={seedPilotData} disabled={loading}>
                          {loading ? 'Menyimpan...' : '+ Generate Data Contoh'}
                        </Button>
                        <Button onClick={() => setManualEntryModalOpen(true)}>
                          + Tambah Data Manual
                        </Button>
                      </Box>
                    </Paper>
                  ) : (
                    <ProgressiveHistory
                      data={history}
                      loading={loading}
                      renderItem={(item, index) => (
                        <Paper sx={{ p: 3, '&:hover': { boxShadow: 4 } }}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Paper sx={{ display: 'inline-block', px: 1, py: 0.5, mb: 2, bgcolor: item.type === CalculationType.MANNING ? 'primary.light' : 'error.light', color: 'white' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.type}</Typography>
                              </Paper>
                              <Typography variant="h6" sx={{ mb: 1 }}>{item.inputs.site?.channelName || 'Tanpa Nama'}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                {item.location && ' • GPS'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" onClick={() => setViewDetailItem(item)}>Detail</Button>
                                <Button size="small" variant="outline" onClick={() => copyToClipboard(item)}>Salin</Button>
                                <Button size="small" variant="outline" onClick={() => handleConsultAI(item.type, item.inputs, item.outputs)}>AI Analisis</Button>
                              </Box>
                            </Box>
                            <Paper sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
                              <Typography variant="caption" color="text.secondary">Debit</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 800 }}>{item.outputs.Discharge}</Typography>
                              <Typography variant="caption" color="text.secondary">m³/s</Typography>
                            </Paper>
                          </Box>
                        </Paper>
                      )}
                      className="flex flex-col gap-4"
                    />
                  )}
                </Box>
              )}
            </Box>
          </Container>

          <ReportModal isOpen={reportModalOpen} data={tempCalculation} onClose={() => setReportModalOpen(false)} onConfirmSave={saveToHistory} />
          <DetailModal isOpen={!!viewDetailItem} data={viewDetailItem} onClose={() => setViewDetailItem(null)} />
          <ManualEntryModal isOpen={manualEntryModalOpen} onClose={() => setManualEntryModalOpen(false)} onSave={saveToHistory} />

          {/* Bottom Navigation */}
          <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }} elevation={8}>
            <BottomNavigation
              value={activeTab}
              onChange={(event, newValue) => setActiveTab(newValue)}
              sx={{ height: 80 }}
            >
              <BottomNavigationAction label="Saluran" value={Tab.SALURAN} icon={<WaterDrop />} />
              <BottomNavigationAction label="Banjir" value={Tab.BANJIR} icon={<Flood />} />
              <BottomNavigationAction label="Data" value={Tab.HISTORY} icon={<History />} />
              <BottomNavigationAction label="AI" value={Tab.AI} icon={<Psychology />} />
            </BottomNavigation>
          </Paper>
        </Box>
      </EnhancedErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
