import React, { useEffect, useState, useRef } from 'react';
import { X, Calculator, Waves, CloudRain, ShieldCheck, TrendingUp, Compass, Settings2, Info, ArrowRightLeft, FileJson, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { useWorkflowStore } from '../stores/useWorkflowStore';

// Definisi MetaData kaya untuk setiap modul
type ModuleMeta = {
 title: string;
 icon: React.ReactNode;
 targetTab: string; // Navigasi ke main app Tab
 description: string;
 algorithm: string;
 inputs: string[];
 outputs: string[];
 status: 'active' | 'pending' | 'completed';
};

const moduleDatabase: Record<string, ModuleMeta> = {
 identitas: {
 title: 'Identitas Proyek & Lokasi',
 icon: <Info size={24} />,
 targetTab: 'MASTER',
 description: 'Data identitas proyek dan administrasi wilayah DAS.',
 algorithm: 'Form input manual → Simpan ke Zustand store & Supabase',
 inputs: ['Nama Proyek', 'Provinsi/Kabupaten/Kecamatan/Desa', 'Koordinat GPS'],
 outputs: ['identitasLokasi: IdentitasLokasi'],
 status: 'completed'
 },
 hujan: {
 title: 'Data Hujan Multi-Sumber',
 icon: <CloudRain size={24} />,
 targetTab: 'MASTER',
 description: 'Ingestion data curah hujan via manual entry, Excel/CSV, bulk paste matrix, dan PDF OCR (Gemini Multimodal).',
 algorithm: 'Multi-source ingestion (csvParser.ts, geminiService.ts)',
 inputs: ['Data Hujan Excel/CSV', 'PDF Scan (Gemini OCR)', 'Bulk Paste Matrix', 'Nama & Koordinat Stasiun'],
 outputs: ['stasiunList: StasiunHidrologi[]', 'dataHujan: DataHujan[]'],
 status: 'completed'
 },
 spasial: {
 title: 'Karakteristik & Spasial DAS',
 icon: <Compass size={24} />,
 targetTab: 'MASTER',
 description: 'Parameter fisik DAS dan analisis spasial WebGIS (delineasi otomatis, sungai GeoJSON, CHIRPS zonal).',
 algorithm: 'WebGIS geoprocessing engine (Auto-delineation DEM)',
 inputs: ['Luas DAS (A)', 'Panjang Sungai (L)', 'GeoJSON DAS & Sungai', 'DEM Upload'],
 outputs: ['morfometriDAS: MorfometriDAS', 'spatialData: SpatialData'],
 status: 'completed'
 },
 tutupan: {
 title: 'Tutupan Lahan',
 icon: <Settings2 size={24} />,
 targetTab: 'MASTER',
 description: 'Parameter pengaliran/infiltrasi (Koefisien C runoff).',
 algorithm: 'Weighted average calculation untuk Koefisien C',
 inputs: ['Jenis Lahan', 'Luas Lahan'],
 outputs: ['tutupanLahan: TutupanLahan', 'landCoverParams: LandCoverParameters'],
 status: 'completed'
 },
 qc: {
 title: 'Quality Control (QC)',
 icon: <ShieldCheck size={24} />,
 targetTab: 'MASTER',
 description: 'Uji kelayakan data hujan (Outlier, Konsistensi, Homogenitas) dengan sinkronisasi Dashboard Kualitas Data.',
 algorithm: 'Outlier (Kn), Konsistensi (RAPS), Homogenitas (T/F-Test)',
 inputs: ['state.dataHujan', 'Pilihan Stasiun'],
 outputs: ['qcResults: Record<string, QualityControlResults>', 'Status Lulus/Gagal'],
 status: 'completed'
 },
 thiessen: {
 title: 'Curah Hujan Wilayah',
 icon: <CloudRain size={24} />,
 targetTab: 'FREKUENSI',
 description: 'Menghitung hujan perwakilan wilayah metode Polygon Thiessen.',
 algorithm: 'CHw = Σ (CH Stasiun × Luas Pengaruh) / Luas Total DAS',
 inputs: ['Data Hujan Tervalidasi', 'Luas Area Pengaruh Stasiun'],
 outputs: ['hasilThiessen: HasilThiessen'],
 status: 'completed'
 },
 satelit: {
 title: 'Infilling Data (CHIRPS)',
 icon: <CloudRain size={24} />,
 targetTab: 'MASTER',
 description: 'Ekstraksi data hujan satelit CHIRPS dan pengisian data kosong (missing data infilling).',
 algorithm: 'CHIRPS zonal extraction API & Infilling algorithm',
 inputs: ['Koordinat DAS', 'Rentang Tahun', 'Data Hujan (dengan gap)'],
 outputs: ['dataSatelit: DataCHIRPS[]', 'dataHujanInfilled: DataHujan[]'],
 status: 'completed'
 },
 frekuensi: {
 title: 'Analisis Frekuensi',
 icon: <TrendingUp size={24} />,
 targetTab: 'FREKUENSI',
 description: 'Menghitung Curah Hujan Rencana kala ulang (Tr) 2–100 tahun dengan uji kecocokan distribusi.',
 algorithm: 'Normal, Log Normal, Gumbel, Log Pearson III, Smirnov-Kolmogorov',
 inputs: ['Hujan Maksimum Tahunan (dari Thiessen)'],
 outputs: ['hasilAnalisisFrekuensi: HasilAnalisisFrekuensi', 'curahHujanRencana: number[]'],
 status: 'completed'
 },
 arf: {
 title: 'Areal Reduction Factor',
 icon: <ArrowRightLeft size={24} />,
 targetTab: 'FREKUENSI',
 description: 'Koreksi pengurangan hujan titik ke hujan area DAS.',
 algorithm: 'ARF = 1 - (0.048 × A^0.5)',
 inputs: ['curahHujanRencana', 'morfometriDAS.luas'],
 outputs: ['hasilARF: HasilARF (Hujan Rencana Terkoreksi)'],
 status: 'completed'
 },
 distribusi: {
 title: 'Distribusi & Hujan Efektif',
 icon: <TrendingUp size={24} />,
 targetTab: 'BANJIR',
 description: 'Memecah hujan harian ke jam-jaman (Mononobe) dan kalkulasi hujan efektif.',
 algorithm: 'PT = R24/t × (t/T)^(2/3), Hujan Efektif = PT × C',
 inputs: ['Hujan Terkoreksi ARF', 'landCoverParams.C', 'Durasi Hujan'],
 outputs: ['distribusiHujanJamJaman: number[]', 'hujanEfektif: number[]'],
 status: 'completed'
 },
 banjir: {
 title: 'Modul Banjir Rencana',
 icon: <Waves size={24} />,
 targetTab: 'BANJIR',
 description: 'Simulasi Hidrograf Satuan Sintetis (HSS Nakayasu, Snyder, SCS).',
 algorithm: 'Konvolusi: Q = Σ (U × Pe)',
 inputs: ['state.hujanEfektif', 'morfometriDAS (L, A, S)'],
 outputs: ['hasilBanjir: HasilBanjir (Q Peak, Ordinat HSS)'],
 status: 'completed'
 },
 neraca: {
 title: 'Modul Neraca Air',
 icon: <Waves size={24} />,
 targetTab: 'NERACA',
 description: 'Simulasi ketersediaan air andalan metode FJ Mock.',
 algorithm: 'Soil Moisture Balance → Surplus/Defisit → Baseflow → Runoff',
 inputs: ['Hujan Bulanan (Thiessen)', 'Evapotranspirasi', 'Water Holding Capacity'],
 outputs: ['hasilMock: HasilMock', 'Debit Andalan (Q80)'],
 status: 'completed'
 },
 embung: {
 title: 'Modul Perencanaan Embung',
 icon: <TrendingUp size={24} />,
 targetTab: 'EMBUNG',
 description: 'Penelusuran waduk (Routing) dan desain dimensi embung dengan persistensi hasil.',
 algorithm: 'Simulasi Storage (ΔS = Inflow - Outflow), Desain Spillway',
 inputs: ['Debit Banjir (Q Peak)', 'Debit Andalan (Inflow)', 'Kebutuhan Air (Outflow)'],
 outputs: ['hasilEmbung: HasilEmbung (Dimensi, Volume Efektif)'],
 status: 'completed'
 },
 saluran: {
 title: 'Kapasitas Saluran (Manning)',
 icon: <Calculator size={24} />,
 targetTab: 'SALURAN',
 description: 'Analisis kapasitas hidraulik saluran terbuka metode Manning.',
 algorithm: 'Q = (1/n) × A × R^(2/3) × S^(1/2)',
 inputs: ['Debit Rencana (Q)', 'Geometri Saluran (B, h, m)', 'Koefisien Manning (n)'],
 outputs: ['hasilManning: HasilManning (V, Q, Fr, freeboard)'],
 status: 'completed'
 },
 dashboard: {
 title: 'Dashboard Eksekutif',
 icon: <TrendingUp size={24} />,
 targetTab: 'EXEC',
 description: 'Ringkasan eksekutif seluruh hasil analisis hidrologi dalam satu tampilan terintegrasi.',
 algorithm: 'Aggregation & visualization via Recharts',
 inputs: ['Seluruh State Hasil', 'Identitas Proyek'],
 outputs: ['Dashboard Interaktif', 'Kartu Statistik Eksekutif'],
 status: 'completed'
 },
 ai: {
 title: 'AI Consultant (Gemini)',
 icon: <Sparkles size={24} />,
 targetTab: 'AI',
 description: 'Penasihat teknis cerdas berbasis Gemini AI dengan RAG kontekstual dan Multimodal OCR.',
 algorithm: 'RAG Context Building → Prompt Engineering → Gemini Pro API',
 inputs: ['Rekapitulasi Parameter & Hasil Perhitungan', 'Context dari Modul Aktif'],
 outputs: ['Rekomendasi Teknis SNI', 'Kesimpulan Analisis Markdown'],
 status: 'completed'
 },
 ekspor: {
 title: 'Ekspor Laporan',
 icon: <FileText size={24} />,
 targetTab: 'MASTER',
 description: 'Cetak dokumen PDF dan Excel secara offline dari seluruh modul.',
 algorithm: 'react-to-pdf, exceljs',
 inputs: ['DOM Elements', 'JSON State', 'Dashboard Data'],
 outputs: ['LaporanBanjir.pdf', 'DataNeraca.xlsx'],
 status: 'completed'
 }
};

export function SideDrawer() {
 const { activeModule, setActiveModule } = useWorkflowStore();
 const [shouldRender, setShouldRender] = useState(false);
 const [isAnimating, setIsAnimating] = useState(false);
 const drawerRef = useRef<HTMLDivElement>(null);
 
 // Local state for internal drawer tabs
 const [drawerTab, setDrawerTab] = useState<'info' | 'flow'>('info');

 // Handle Escape key
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && shouldRender) {
 setActiveModule(null);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [shouldRender, setActiveModule]);

 // Trap focus on mount
 useEffect(() => {
 if (isAnimating && drawerRef.current) {
 drawerRef.current.focus();
 }
 }, [isAnimating]);

 // Smooth mount/unmount logic
 useEffect(() => {
 if (activeModule) {
 setShouldRender(true);
 setDrawerTab('info'); // Reset tab on new module
 const timer = setTimeout(() => setIsAnimating(true), 10);
 return () => clearTimeout(timer);
 } else {
 setIsAnimating(false);
 const timer = setTimeout(() => setShouldRender(false), 300);
 return () => clearTimeout(timer);
 }
 }, [activeModule]);

 if (!shouldRender) return null;

 const handleClose = () => setActiveModule(null);

 // Safely get module data
 const meta: ModuleMeta = activeModule && moduleDatabase[activeModule] 
 ? moduleDatabase[activeModule] 
 : {
 title: 'Modul Sistem',
 icon: <Settings2 size={24} />,
 targetTab: 'MASTER',
 description: 'Detail modul tidak ditemukan.',
 algorithm: 'Unknown',
 inputs: [], outputs: [],
 status: 'pending'
 };

 // Navigation Logic to Main App
 const handleNavigateToModule = () => {
 setActiveModule(null);
 setTimeout(() => {
 window.dispatchEvent(new CustomEvent('navigateToTab', { detail: meta.targetTab }));
 }, 150);
 };

 return (
 <>
 {/* Backdrop */}
 <div 
 className={`fixed inset-0 bg-slate-900 z-[9990] transition-opacity duration-75 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
 onClick={handleClose}
 />
 
 {/* Slide-in Drawer (GovTech Style) */}
 <div 
 ref={drawerRef}
 tabIndex={-1}
 role="dialog"
 aria-modal="true"
 aria-labelledby="drawer-title"
 className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-white dark:bg-slate-900 shadow-none z-[9999] flex flex-col border-l-4 border-pupr-yellow transform transition-transform duration-75 ease-in-out outline-none ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}
 >
 {/* Header GovTech */}
 <div className="bg-pupr-blue text-white p-6 pb-8 flex flex-col items-start shrink-0 relative overflow-hidden">
 <div className="absolute -right-4 -bottom-4 text-white/5 transform -rotate-12 scale-[3]">
 {meta.icon}
 </div>
 
 <div className="w-full flex justify-between items-start mb-4 relative z-10">
 <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-sm ${
 meta.status === 'completed' ? 'bg-success/20 text-success-light border border-success/30' :
 meta.status === 'active' ? 'bg-blue-400/20 text-blue-200 border border-blue-400/30' :
 'bg-slate-50 dark:bg-slate-8000/20 text-slate-300 border border-slate-500/30'
 }`}>
 {meta.status === 'completed' ? 'Tersedia' : meta.status === 'active' ? 'Dalam Pengerjaan' : 'Antrean Integrasi'}
 </span>
 <button 
 onClick={handleClose}
 className="p-1.5 hover:bg-white dark:bg-slate-900 rounded-sm transition-colors text-slate-300 hover:text-white"
 aria-label="Tutup panel"
 >
 <X size={24} />
 </button>
 </div>
 
 <div className="relative z-10 w-full pr-4">
 <h2 id="drawer-title" className="font-extrabold text-2xl flex items-center gap-3 leading-tight tracking-tight">
 {meta.title}
 </h2>
 </div>
 </div>

 {/* Drawer Tabs */}
 <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 relative z-20">
 <button 
 onClick={() => setDrawerTab('info')}
 className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
 drawerTab === 'info' ? 'border-pupr-blue text-pupr-blue bg-pupr-surface/50' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100'
 }`}
 >
 <Info size={18} />
 Informasi Modul
 </button>
 <button 
 onClick={() => setDrawerTab('flow')}
 className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
 drawerTab === 'flow' ? 'border-pupr-blue text-pupr-blue bg-pupr-surface/50' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100'
 }`}
 >
 <ArrowRightLeft size={18} />
 Data Flow (I/O)
 </button>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
 
 {/* TAB: INFO */}
 {drawerTab === 'info' && (
 <div className="p-6 space-y-6 animate-in fade-in duration-75">
 <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-700 transition-all hover:">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deskripsi Fungsi</h3>
 <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
 {meta.description}
 </p>
 </div>

 <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-400 transition-all hover:">
 <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <FileJson size={16} />
 Metode & Algoritma
 </h3>
 <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-100">
 {meta.algorithm}
 </p>
 </div>
 </div>
 )}

 {/* TAB: FLOW */}
 {drawerTab === 'flow' && (
 <div className="p-6 space-y-6 animate-in fade-in duration-75">
 {/* Inputs */}
 <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-pupr-border relative overflow-hidden transition-all hover:">
 <div className="absolute left-0 top-0 w-1.5 h-full bg-pupr-surface0"></div>
 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
 <span className="bg-blue-100 text-pupr-blue text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Input</span>
 Dependensi Data Masuk
 </h3>
 <ul className="space-y-3">
 {meta.inputs.map((item, i) => (
 <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-sm border border-slate-100">
 <div className="w-2 h-2 rounded-sm bg-blue-400 shrink-0" />
 <span className="font-medium">{item}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Outputs */}
 <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-green-100 relative overflow-hidden transition-all hover:">
 <div className="absolute left-0 top-0 w-1.5 h-full bg-green-500"></div>
 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
 <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Output</span>
 Hasil Perhitungan (Payload)
 </h3>
 <ul className="space-y-3">
 {meta.outputs.map((item, i) => (
 <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-sm border border-slate-100">
 <CheckCircle2 size={18} className="text-green-500 shrink-0" />
 <span className="font-medium">{item}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 )}

 </div>
 
 {/* Footer Actions */}
 <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex gap-3 z-30 relative">
 <button 
 onClick={handleClose}
 className="flex-[0.8] py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-sm font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
 >
 Tutup
 </button>
 <button 
 onClick={handleNavigateToModule}
 className="flex-[1.5] py-3 px-4 bg-pupr-blue hover:bg-blue-800 text-white rounded-sm font-bold text-sm transition-all hover: flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pupr-blue focus:ring-offset-2"
 >
 Buka Modul {meta.targetTab}
 <ArrowRightLeft size={18} />
 </button>
 </div>
 </div>
 </>
 );
}
