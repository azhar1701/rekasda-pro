import React, { useEffect, useState } from 'react';
import { X, Calculator, Waves, CloudRain, ShieldCheck, TrendingUp, Compass, Settings2, Info, ArrowRightLeft, FileJson, CheckCircle2 } from 'lucide-react';
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
  morfometri: {
    title: 'Karakteristik Fisik DAS',
    icon: <Compass size={24} />,
    targetTab: 'MASTER',
    description: 'Pemetaan luas Daerah Aliran Sungai (DAS) dan pengukuran panjang sungai utama secara spasial maupun manual.',
    algorithm: 'Delineasi DEM, Slope Measurement',
    inputs: ['Peta DEM (Raster)', 'Titik Outlet (Koordinat)'],
    outputs: ['Luas DAS (km²)', 'Panjang Sungai (km)'],
    status: 'completed'
  },
  presipitasi: {
    title: 'Data Presipitasi',
    icon: <CloudRain size={24} />,
    targetTab: 'MASTER',
    description: 'Manajemen data mentah curah hujan historis dari berbagai stasiun pencatat curah hujan (ARR/Manual).',
    algorithm: 'Uji Kualitas Data (Outlier, RAPS, F-Test)',
    inputs: ['Excel/CSV Hujan Harian', 'Nama & Koordinat Stasiun'],
    outputs: ['Data Hujan Terkoreksi', 'Status Kelulusan Uji QC'],
    status: 'completed'
  },
  thiessen: {
    title: 'Hujan Kawasan',
    icon: <CloudRain size={24} />,
    targetTab: 'FREKUENSI',
    description: 'Perhitungan curah hujan rata-rata representatif untuk seluruh area DAS menggunakan pembobotan stasiun terdekat.',
    algorithm: 'Poligon Thiessen (Spatial Weighting)',
    inputs: ['Data Hujan Stasiun (Terkoreksi)', 'Koordinat Stasiun', 'Luas DAS'],
    outputs: ['Curah Hujan Wilayah Tahunan/Bulanan (mm)'],
    status: 'completed'
  },
  neraca: {
    title: 'Neraca Air & Kehilangan',
    icon: <TrendingUp size={24} />,
    targetTab: 'NERACA',
    description: 'Simulasi ketersediaan air andalan bulanan dengan menghitung surplus dan defisit kelembaban tanah (Soil Moisture Balance).',
    algorithm: 'Metode F.J. Mock',
    inputs: ['Hujan Wilayah Bulanan', 'Evapotranspirasi', 'Koefisien Infiltrasi Lahan'],
    outputs: ['Debit Andalan Q80/Q90 (m³/dt)', 'Volume Surplus/Defisit'],
    status: 'active'
  },
  banjir: {
    title: 'Transformasi Hidrograf',
    icon: <Waves size={24} />,
    targetTab: 'BANJIR',
    description: 'Pemodelan debit puncak banjir rencana berdasarkan hujan lebat berdurasi pendek (Hujan Efektif).',
    algorithm: 'HSS Nakayasu, HSS Snyder',
    inputs: ['Hujan Rencana Terkoreksi ARF', 'Distribusi Hujan Jam-jaman', 'Parameter Morfometri DAS'],
    outputs: ['Hidrograf Banjir (m³/s per jam)', 'Debit Puncak (Qp)'],
    status: 'pending'
  },
  hidraulika: {
    title: 'Pemodelan Saluran',
    icon: <Calculator size={24} />,
    targetTab: 'SALURAN',
    description: 'Analisis kapasitas penampang saluran terbuka untuk memastikan dimensi saluran sanggup mengalirkan debit banjir rencana tanpa meluap.',
    algorithm: 'Persamaan Manning, Aliran Seragam',
    inputs: ['Debit Rencana (Qp)', 'Geometri Saluran (b, m, h)', 'Koefisien Kekasaran Manning (n)'],
    outputs: ['Tinggi Muka Air Normal (yn)', 'Tegangan Geser Izin', 'Status Kapasitas'],
    status: 'pending'
  },
  validasi: {
    title: 'Validasi Hidrometri',
    icon: <ShieldCheck size={24} />,
    targetTab: 'HISTORY',
    description: 'Proses kalibrasi model teoritis terhadap data pengukuran debit lapangan aktual (AWLR / Current Meter).',
    algorithm: 'Rating Curve Fitting',
    inputs: ['Data Pengukuran AWLR', 'Output Model (Q)'],
    outputs: ['Error Margin (%)', 'Parameter Terkalibrasi'],
    status: 'active'
  }
};

export function SideDrawer() {
  const { activeModule, setActiveModule } = useWorkflowStore();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Local state for internal drawer tabs
  const [drawerTab, setDrawerTab] = useState<'info' | 'flow'>('info');

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
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9990] transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      {/* Slide-in Drawer (GovTech Style) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.2)] z-[9999] flex flex-col border-l-4 border-pupr-yellow transform transition-transform duration-300 ease-in-out ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header GovTech */}
        <div className="bg-pupr-blue text-white p-6 pb-8 flex flex-col items-start shrink-0 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-white/5 transform -rotate-12 scale-[3]">
            {meta.icon}
          </div>
          
          <div className="w-full flex justify-between items-start mb-4 relative z-10">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${
              meta.status === 'completed' ? 'bg-success/20 text-success-light border border-success/30' :
              meta.status === 'active' ? 'bg-blue-400/20 text-blue-200 border border-blue-400/30' :
              'bg-slate-500/20 text-slate-300 border border-slate-500/30'
            }`}>
              {meta.status === 'completed' ? 'Tersedia' : meta.status === 'active' ? 'Dalam Pengerjaan' : 'Antrean Integrasi'}
            </span>
            <button 
              onClick={handleClose}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-slate-300 hover:text-white"
              aria-label="Tutup panel"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="relative z-10 w-full pr-4">
            <h2 className="font-extrabold text-2xl flex items-center gap-3 leading-tight tracking-tight">
              {meta.title}
            </h2>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 shadow-sm relative z-20">
          <button 
            onClick={() => setDrawerTab('info')}
            className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              drawerTab === 'info' ? 'border-pupr-blue text-pupr-blue bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Info size={18} />
            Informasi Modul
          </button>
          <button 
            onClick={() => setDrawerTab('flow')}
            className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              drawerTab === 'flow' ? 'border-pupr-blue text-pupr-blue bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowRightLeft size={18} />
            Data Flow (I/O)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          
          {/* TAB: INFO */}
          {drawerTab === 'info' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deskripsi Fungsi</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {meta.description}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-400 transition-all hover:shadow-md">
                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileJson size={16} />
                  Metode & Algoritma
                </h3>
                <p className="text-sm font-mono text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                  {meta.algorithm}
                </p>
              </div>
            </div>
          )}

          {/* TAB: FLOW */}
          {drawerTab === 'flow' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              {/* Inputs */}
              <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500"></div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Input</span>
                  Dependensi Data Masuk
                </h3>
                <ul className="space-y-3">
                  {meta.inputs.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outputs */}
              <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute left-0 top-0 w-1.5 h-full bg-green-500"></div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Output</span>
                  Hasil Perhitungan (Payload)
                </h3>
                <ul className="space-y-3">
                  {meta.outputs.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
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
        <div className="p-5 border-t border-slate-200 bg-white shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex gap-3 z-30 relative">
          <button 
            onClick={handleClose}
            className="flex-[0.8] py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Tutup
          </button>
          <button 
            onClick={handleNavigateToModule}
            className="flex-[1.5] py-3 px-4 bg-pupr-blue hover:bg-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pupr-blue focus:ring-offset-2"
          >
            Buka Modul {meta.targetTab}
            <ArrowRightLeft size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
