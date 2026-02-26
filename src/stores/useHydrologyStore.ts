import { create } from 'zustand';
import { calculateTimeOfConcentration } from '@/lib/utils/derivedState';

// TAHAP 2: Global State Management (Zustand) dengan TypeScript yang Ketat

// --- Interfaces ---

export interface StasiunHidrologi {
  id: string;
  nama_stasiun: string;
  koordinat_x: number | null;
  koordinat_y: number | null;
  elevasi: number | null;
  keterangan: string | null;
  created_at?: string;
}

export interface DataHujan {
  id: string;
  stasiun_id: string;
  tanggal: string; // Format YYYY-MM-DD
  curah_hujan: number; 
  created_at?: string;
}

export interface ThiessenStasiunConfig {
  stasiunId: string;
  namaStasiun: string;
  luasPengaruh: number;  // km² — area of influence
  bobot: number;         // auto-calculated weight
}

export interface HasilThiessen {
  stasiunConfigs: ThiessenStasiunConfig[];
  totalLuas: number;
  hujanRataRataDAS: number[];  // weighted avg annual max series
}

export interface HasilARF {
  arfValue: number;           // calculated ARF
  arfOverride: number | null; // user override
  hujanTitik: number;         // point rainfall (mm)
  hujanDAS: number;           // areal rainfall (mm)
}

export interface DesignRainfallValue {
  kalaUlang: number;    // 2, 5, 10, 25, 50, 100
  curahHujan: number;   // mm
}

export interface HasilAnalisisFrekuensi {
  metodeTerpilih: string;
  lulusUjiKecocokan: boolean;
  curahHujanRencana: DesignRainfallValue[];
  selectedKalaUlang: number | null;
  qcResults?: QualityControlResults;
}

/** Hasil Uji Kualitas Data (QC) */
export interface QualityControlResults {
  konsistensi: {
    isPassed: boolean;
    method: 'RAPS' | 'DoubleMass';
    rapsValue?: number;
    threshold?: number;
    message: string;
  };
  homogenitas: {
    isPassed: boolean;
    method: 'F-Test' | 'T-Test';
    fValue?: number;
    tValue?: number;
    criticalValue?: number;
    message: string;
  };
  outlier: {
    isPassed: boolean;
    method: 'Grubbs-Beck' | 'Rosner';
    outlierIndices: number[];
    message: string;
  };
  overallPassed: boolean;
}

/** Parameter Tutupan Lahan untuk Hujan Efektif */
export interface LandCoverParameters {
  C?: number;
  CN?: number;
  phiIndex?: number;
  method: 'C' | 'CN' | 'PhiIndex';
  description?: string;
}

/** Morfometri DAS */
export interface MorfometriDAS {
  luasDAS: number;           // km²
  panjangSungai: number;     // km
  kemiringanSungai: number;  // m/m atau %
  elevasi: number;           // m
}

/** Tutupan Lahan Item */
export interface TutupanLahanItem {
  id: string;
  jenis: string;
  luas: number;    // km²
  nilaiC: number;  // Koefisien Pengaliran
  nilaiCN: number; // Curve Number
}

/** Tutupan Lahan State */
export interface TutupanLahan {
  items: TutupanLahanItem[];
  koefisienPengaliranGabungan: number; // C weighted
  curveNumberGabungan: number;         // CN weighted
  totalLuas: number;                   // km²
}

/** Curah Hujan Wilayah Config */
export interface CurahHujanWilayah {
  metode: 'aljabar' | 'thiessen';
  stasiunConfigs: ThiessenStasiunConfig[];
  hujanRataRata: number; // mm
}

/** Analisis Frekuensi State */
export interface AnalisisFrekuensi {
  parameterStatistik: {
    asli: { mean: number; stdDev: number; cv: number; cs: number; ck: number };
    log: { mean: number; stdDev: number; cv: number; cs: number; ck: number };
  } | null;
  hasilDistribusi: Array<{
    method: string;
    values: Array<{ Tr: number; R24: number }>;
  }> | null;
  ujiKecocokan: Array<{
    method: string;
    chiSquare: { statistic: number; critical: number; accepted: boolean };
    kolmogorovSmirnov: { statistic: number; critical: number; accepted: boolean };
  }> | null;
  metodeTerpilih: string | null;
  dataHujanInput: number[];
}

/** Hasil Hujan Efektif */
export interface EffectiveRainfallResult {
  totalRainfall: number;
  effectiveRainfall: number;
  losses: number;
  method: string;
  hourlyDistribution?: number[];
}

export interface HasilBanjir {
  debitPuncak: number;
  hidrograf: { time: number; inflow: number }[];
  method?: string;
}

/** Hasil Perbandingan Multi-Metode HSS */
export interface HSSComparisonResult {
  method: string;
  Qp: number;
  Tp: number;
  Tb: number;
  hydrograph: { time: number; discharge: number }[];
  color: string;
}

export interface HasilKonvolusi {
  floodHydrograph: { time: number; discharge: number }[];
  peakDischarge: number;
  timeToPeak: number;
  totalVolume: number;
  componentHydrographs: { time: number; discharge: number }[][];
}

export interface HasilNeraca {
  isSurplus: boolean;
  totalSurplusDefisit: number;
  bulanKritis: string;
  chartData: { bulan: string; ketersediaan: number; kebutuhan: number; neraca: number; }[];
}

export interface HasilEmbung {
  isAman: boolean;
  reduksiPuncak: number; 
  umurSedimen: number;
}

/** Hasil perhitungan F.J. Mock + Weibull */
export interface HasilMock {
  /** 12-month Mock results (precipitation, eto, TRO, discharge, etc.) */
  monthlyResults: {
    month: string;
    precipitation: number;
    eto: number;
    waterSurplus: number;
    baseFlow: number;
    directRunoff: number;
    totalRunoff: number;
    discharge: number;
  }[];
  /** Debit Andalan at target probability (m³/s) */
  qAndalan: number;
  /** Target probability (%) */
  probability: number;
  /** Metode yang digunakan */
  metode: 'mock' | 'manual' | 'weibull';
}

/** Hasil akhir neraca air per bulan */
export interface NeracaFinalRow {
  month: string;
  ketersediaan: number;
  irigasi: number;
  airBaku: number;
  lingkungan: number;
  totalKebutuhan: number;
  neraca: number;
  status: 'Surplus' | 'Defisit' | 'Seimbang';
}

export interface HydrologyState {
  // State Fundamental
  luasDas: string;
  panjangSungai: string;
  curahHujanRencana: string;
  stasiunList: StasiunHidrologi[];
  selectedStasiun: StasiunHidrologi | null;
  
  // Parameter Spasial & Kewilayahan
  morfometriDAS: MorfometriDAS | null;
  tutupanLahan: TutupanLahan | null;
  curahHujanWilayah: CurahHujanWilayah | null;
  
  // Analisis Frekuensi
  analisisFrekuensi: AnalisisFrekuensi | null;
  
  // State Data Output
  dataHujan: DataHujan[];
  hasilThiessen: HasilThiessen | null;
  hasilARF: HasilARF | null;
  hasilAnalisisFrekuensi: HasilAnalisisFrekuensi | null;
  hasilBanjir: HasilBanjir | null;
  hasilKonvolusi: HasilKonvolusi | null;
  hasilNeraca: HasilNeraca | null;
  hasilEmbung: HasilEmbung | null;
  hasilMock: HasilMock | null;
  neracaFinal: NeracaFinalRow[] | null;
  distribusiHujanJamJaman: number[] | null;
  durasiHujan: number;
  
  // QC State
  qcResults: QualityControlResults | null;
  qcStatus: { konsisten: boolean; bebasOutlier: boolean; homogen: boolean } | null;
  isQCOverridden: boolean;
  isQCCalculating: boolean;
  landCoverParams: LandCoverParameters | null;
  effectiveRainfall: EffectiveRainfallResult | null;
  
  // TAHAP 2: Multi-Method Comparison
  hssComparisonResults: HSSComparisonResult[] | null;
  
  // State Tracking / Validation
  isBanjirDirty: boolean;
  isNeracaDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // Setters dengan Dependency Tracking & Workflow Otomatis (Pipelines)
  setLuasDas: (luas: string) => void;
  setPanjangSungai: (val: string) => void;
  setCurahHujanRencana: (val: string) => void;
  
  // Pipeline 1: Master Data -> Hujan Rata-rata DAS
  fetchStasiun: () => Promise<void>;
  addStasiun: (stasiun: Omit<StasiunHidrologi, 'id' | 'created_at'>) => Promise<void>;
  addDataHujan: (data: Omit<DataHujan, 'id' | 'created_at'>) => Promise<void>;
  importDataHujanBatch: (dataList: Omit<DataHujan, 'id' | 'created_at'>[]) => Promise<void>;
  selectStasiun: (stasiun: StasiunHidrologi | null) => void;
  fetchDataHujan: (stasiunId: string, tahun?: number) => Promise<void>;
  setHasilThiessen: (hasil: HasilThiessen | null) => void;
  setHasilARF: (hasil: HasilARF | null) => void;
  
  // Parameter Spasial Setters with Cascade Invalidation
  setMorfometriDAS: (data: MorfometriDAS | null) => void;
  updateMorfometriDAS: (data: MorfometriDAS | null) => void; // With cascade
  setTutupanLahan: (data: TutupanLahan | null) => void;
  setCurahHujanWilayah: (data: CurahHujanWilayah | null) => void;
  
  // Analisis Frekuensi Setters
  setAnalisisFrekuensi: (data: AnalisisFrekuensi | null) => void;
  
  // Derived State Getters
  getTimeOfConcentration: () => number;
  getDesignRainfall: (returnPeriod: number) => number | null;
  getDesignDischarge: (type: 'flood' | 'irrigation') => number | null;
  
  setQCResults: (results: QualityControlResults | null) => void;
  setQCStatus: (status: { konsisten: boolean; bebasOutlier: boolean; homogen: boolean } | null) => void;
  setQCOverride: (override: boolean) => void;
  setQCCalculating: (calculating: boolean) => void;
  updateDataHujanManual: (data: DataHujan[]) => void;
  setLandCoverParams: (params: LandCoverParameters | null) => void;
  setEffectiveRainfall: (result: EffectiveRainfallResult | null) => void;
  
  // Pipeline 2: Hujan Rata-rata DAS -> Analisis Frekuensi -> Hujan Rencana
  setHasilAnalisisFrekuensi: (hasil: HasilAnalisisFrekuensi | null) => void;
  setSelectedKalaUlang: (kalaUlang: number) => void;
  
  // Pipeline 3: Hujan Rencana -> Distribusi Jam-jaman -> Konvolusi -> Banjir
  setHasilBanjir: (hasil: HasilBanjir | null) => void;
  setHasilKonvolusi: (hasil: HasilKonvolusi | null) => void;
  
  // Pipeline 3.5: Multi-Method HSS Comparison (TAHAP 2)
  setHSSComparisonResults: (results: HSSComparisonResult[] | null) => void;
  
  // Pipeline 4: Evapotranspirasi + Hujan Rencana -> Neraca Air (Mock)
  setHasilNeraca: (hasil: HasilNeraca | null) => void;
  setHasilMock: (hasil: HasilMock | null) => void;
  setNeracaFinal: (data: NeracaFinalRow[] | null) => void;
  
  // Pipeline 5: Banjir + Neraca Air -> Embung
  setHasilEmbung: (hasil: HasilEmbung | null) => void;
  
  // Setters statis murni untuk keperluan internal/mocking
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// --- Mock Data untuk UI Development Awal ---
const MOCK_STASIUN_LIST: StasiunHidrologi[] = [
  {
    id: 'a1b2c3d4-1234-5678-abcd-56781234abcd',
    nama_stasiun: 'Stasiun Cikampak',
    koordinat_x: 106.7562,
    koordinat_y: -6.5872,
    elevasi: 250,
    keterangan: 'Tipe Manual. Terawat baik.'
  },
  {
    id: 'e5f6g7h8-1234-5678-abcd-56781234abcd',
    nama_stasiun: 'Stasiun AWS Katulampa',
    koordinat_x: 106.8415,
    koordinat_y: -6.6358,
    elevasi: 260,
    keterangan: 'Otomatis. Telemetri aktif.'
  },
  {
    id: 'z9y8x7w6-1234-5678-abcd-56781234abcd',
    nama_stasiun: 'Stasiun Curug Bitung',
    koordinat_x: 106.3321,
    koordinat_y: -6.4421,
    elevasi: 120,
    keterangan: 'Berada di hilir titik bendung.'
  }
];

const generateMockDataHujan = (stasiunId: string, tahun: number = 2026): DataHujan[] => {
  const data: DataHujan[] = [];
  
  // Simulate 1 month of dummy data for the selected year
  for (let i = 1; i <= 30; i++) {
    const mm = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const dd = String(i).padStart(2, '0');
    const curah_hujan = Math.random() > 0.6 ? Math.floor(Math.random() * 50) + 0.5 : 0;
    
    data.push({
      id: crypto.randomUUID(),
      stasiun_id: stasiunId,
      tanggal: `${tahun}-${mm}-${dd}`,
      curah_hujan: parseFloat(curah_hujan.toFixed(1))
    });
  }
  
  // Sort by date ascending
  return data.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
};

// --- Store Implementation ---

export const useHydrologyStore = create<HydrologyState>((set, get) => ({
  // Initial State
  luasDas: '',
  panjangSungai: '',
  curahHujanRencana: '',
  stasiunList: [],
  selectedStasiun: null,
  dataHujan: [],
  
  // Parameter Spasial
  morfometriDAS: null,
  tutupanLahan: null,
  curahHujanWilayah: null,
  
  // Analisis Frekuensi
  analisisFrekuensi: null,
  
  hasilThiessen: null,
  hasilARF: null,
  hasilAnalisisFrekuensi: null,
  hasilBanjir: null,
  hasilNeraca: {
    isSurplus: true, 
    totalSurplusDefisit: 1540.5, 
    bulanKritis: 'September', 
    chartData: [
      { bulan: 'Jan', ketersediaan: 120, kebutuhan: 80, neraca: 40 },
      { bulan: 'Feb', ketersediaan: 140, kebutuhan: 80, neraca: 60 },
      { bulan: 'Agt', ketersediaan: 80, kebutuhan: 90, neraca: -10 },
      { bulan: 'Sep', ketersediaan: 60, kebutuhan: 95, neraca: -35 },
    ]
  },
  hasilEmbung: {
    isAman: true,
    reduksiPuncak: 45.2,
    umurSedimen: 50
  },
  hasilMock: null,
  hasilKonvolusi: null,
  neracaFinal: null,
  distribusiHujanJamJaman: null,
  durasiHujan: 6,
  
  qcResults: null,
  qcStatus: null,
  isQCOverridden: false,
  isQCCalculating: false,
  landCoverParams: null,
  effectiveRainfall: null,
  
  // TAHAP 2: Multi-Method Comparison
  hssComparisonResults: null,
  
  isBanjirDirty: false, // Menandakan bahwa parameter banjir berubah dan perlu re-kalkulasi
  isNeracaDirty: false, // Menandakan bahwa parameter neraca air berubah dan perlu re-kalkulasi
  isLoading: false,
  error: null,

  // Setters statis murni
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Setters dengan Dependency Tracking (DIRTY STATE MIDDLEWARE & CASCADING INVALIDATION)
  setLuasDas: (luas) => set((state) => {
    if (state.luasDas !== luas) {
      // Invalidate both Flood and Water Balance when Catchment Area changes
      return { luasDas: luas, isBanjirDirty: true, isNeracaDirty: true, hasilKonvolusi: null, hasilBanjir: null, hasilMock: null, neracaFinal: null };
    }
    return state;
  }),
  setPanjangSungai: (val) => set((state) => {
    if (state.panjangSungai !== val) {
      // Stream length only affects Unit Hydrograph (Flood) Time of Concentration / Time Lag
      return { panjangSungai: val, isBanjirDirty: true, hasilKonvolusi: null, hasilBanjir: null };
    }
    return state;
  }),
  setCurahHujanRencana: (val) => set((state) => {
    if (state.curahHujanRencana !== val) {
      // Design Rainfall affects EVERYTHING (Flood -> Routing, Mock -> Water Balance)
      return { 
        curahHujanRencana: val, 
        isBanjirDirty: true, 
        isNeracaDirty: true,
        hasilKonvolusi: null,
        hasilBanjir: null,
        hasilMock: null,
        neracaFinal: null,
        hasilEmbung: null 
      };
    }
    return state;
  }),
  
  selectStasiun: (stasiun) => {
    const state = get();
    if (state.selectedStasiun?.id !== stasiun?.id) {
      set({ 
        selectedStasiun: stasiun, 
        dataHujan: [],
        isBanjirDirty: true, 
        isNeracaDirty: true 
      });
      
      if (stasiun && state.stasiunList.some(s => s.id === stasiun.id && MOCK_STASIUN_LIST.some(m => m.id === s.id))) {
        get().fetchDataHujan(stasiun.id, new Date().getFullYear());
      }
    }
  },

  setHasilThiessen: (hasil) => set({
    hasilThiessen: hasil,
    isBanjirDirty: true,
    isNeracaDirty: true,
    hasilAnalisisFrekuensi: null,
    curahHujanRencana: '',
    hasilKonvolusi: null,
    hasilBanjir: null,
    qcResults: null,
  }),
  setHasilARF: (hasil) => set({
    hasilARF: hasil,
    isBanjirDirty: true,
  }),
  
  // Parameter Spasial Setters (Simple - no cascade)
  setMorfometriDAS: (data) => set({ 
    morfometriDAS: data,
    luasDas: data ? String(data.luasDAS) : '',
    panjangSungai: data ? String(data.panjangSungai) : '',
  }),
  
  // Parameter Spasial Setters with CASCADE INVALIDATION
  updateMorfometriDAS: (data) => set({ 
    morfometriDAS: data,
    luasDas: data ? String(data.luasDAS) : '',
    panjangSungai: data ? String(data.panjangSungai) : '',
    // CASCADE: Invalidate all downstream calculations
    analisisFrekuensi: null,
    hasilBanjir: null,
    hasilKonvolusi: null,
    hasilMock: null,
    neracaFinal: null,
    hasilEmbung: null,
    isBanjirDirty: true,
    isNeracaDirty: true,
  }),
  setTutupanLahan: (data) => set({ 
    tutupanLahan: data,
    isBanjirDirty: true,
  }),
  setCurahHujanWilayah: (data) => set({ 
    curahHujanWilayah: data,
    isBanjirDirty: true,
    isNeracaDirty: true,
  }),
  
  // Analisis Frekuensi Setter with CASCADE
  setAnalisisFrekuensi: (data) => set({ 
    analisisFrekuensi: data,
    // CASCADE: Invalidate flood calculations when frequency changes
    hasilBanjir: null,
    hasilKonvolusi: null,
    isBanjirDirty: true,
  }),
  
  // DERIVED STATE GETTERS (Computed from SSOT)
  getTimeOfConcentration: () => {
    const state = get();
    const L = state.morfometriDAS?.panjangSungai || 0;
    const S = state.morfometriDAS?.kemiringanSungai || 0;
    return calculateTimeOfConcentration(L, S);
  },
  
  getDesignRainfall: (returnPeriod: number) => {
    const state = get();
    if (!state.analisisFrekuensi?.hasilDistribusi) return null;
    
    const selectedDist = state.analisisFrekuensi.hasilDistribusi.find(
      d => d.method === state.analisisFrekuensi?.metodeTerpilih
    );
    
    if (!selectedDist) return null;
    const value = selectedDist.values.find(v => v.Tr === returnPeriod);
    return value?.R24 || null;
  },
  
  getDesignDischarge: (type: 'flood' | 'irrigation') => {
    const state = get();
    if (type === 'flood') {
      return state.hasilBanjir?.debitPuncak || null;
    }
    if (type === 'irrigation') {
      return state.hasilMock?.qAndalan || null;
    }
    return null;
  },
  setQCResults: (results) => set({ qcResults: results }),
  setQCStatus: (status) => set({ qcStatus: status, isQCOverridden: false }),
  setQCOverride: (override) => set({ isQCOverridden: override }),
  setQCCalculating: (calculating) => set({ isQCCalculating: calculating }),
  
  updateDataHujanManual: (data) => {
    set({ dataHujan: data, isQCCalculating: true });
    
    if (data.length < 10) {
      set({ 
        qcStatus: null, 
        qcResults: null,
        isQCCalculating: false 
      });
      return;
    }
    
    try {
      const { runFullQC } = require('@/lib/utils/qc/dataQualityMath');
      const byYear = new Map<number, number>();
      data.forEach(d => {
        const year = new Date(d.tanggal).getFullYear();
        const current = byYear.get(year) || 0;
        if (d.curah_hujan > current) byYear.set(year, d.curah_hujan);
      });
      const annualMax = Array.from(byYear.entries()).map(([tahun, hujan]) => ({ tahun, hujan }));
      
      if (annualMax.length >= 10) {
        const qcResult = runFullQC(annualMax);
        set({
          qcStatus: {
            konsisten: qcResult.isKonsisten,
            bebasOutlier: qcResult.isBebasOutlier,
            homogen: qcResult.isHomogen
          },
          isQCCalculating: false
        });
      } else {
        set({ qcStatus: null, isQCCalculating: false });
      }
    } catch (error) {
      console.error('QC calculation error:', error);
      set({ qcStatus: null, isQCCalculating: false });
    }
  },
  setLandCoverParams: (params) => set({ 
    landCoverParams: params,
    effectiveRainfall: null,
    isBanjirDirty: true,
  }),
  setEffectiveRainfall: (result) => set({ 
    effectiveRainfall: result,
    isBanjirDirty: true,
  }),
  setHasilAnalisisFrekuensi: (hasil) => set({ 
    hasilAnalisisFrekuensi: hasil, 
    isBanjirDirty: true,
    isNeracaDirty: true,
  }),
  setSelectedKalaUlang: (kalaUlang) => set((state) => {
    const freq = state.hasilAnalisisFrekuensi;
    if (!freq) return state;
    const match = freq.curahHujanRencana.find(v => v.kalaUlang === kalaUlang);
    
    // Automatically pipe the selected design rainfall into the global state for next modules
    const newRainfall = match ? String(match.curahHujan) : state.curahHujanRencana;
    
    return {
      hasilAnalisisFrekuensi: { ...freq, selectedKalaUlang: kalaUlang },
      curahHujanRencana: newRainfall,
      isBanjirDirty: state.curahHujanRencana !== newRainfall ? true : state.isBanjirDirty,
      isNeracaDirty: state.curahHujanRencana !== newRainfall ? true : state.isNeracaDirty,
      // Clear downstream calculations to force them to recalculate with new return period
      hasilKonvolusi: state.curahHujanRencana !== newRainfall ? null : state.hasilKonvolusi,
      hasilBanjir: state.curahHujanRencana !== newRainfall ? null : state.hasilBanjir,
    };
  }),
  setHasilBanjir: (hasil) => set({ 
    hasilBanjir: hasil, 
    isBanjirDirty: false,
    // CASCADE: When flood changes, invalidate embung
    hasilEmbung: null
  }),
  setHasilKonvolusi: (hasil) => set({ 
    hasilKonvolusi: hasil,
  }),
  
  // TAHAP 2: Multi-Method HSS Comparison
  setHSSComparisonResults: (results) => set({ 
    hssComparisonResults: results,
    isBanjirDirty: false,
  }),
  setHasilNeraca: (hasil) => set({ 
    hasilNeraca: hasil, 
    isNeracaDirty: false,
    // When water balance changes, Reservoir Routing (Embung) must be invalidated
    hasilEmbung: null 
  }),
  setHasilEmbung: (hasil) => set({ hasilEmbung: hasil }),
  setHasilMock: (hasil) => set({ 
    hasilMock: hasil, 
    isNeracaDirty: true,
    // Mock generates the inflow for Neraca Final
    neracaFinal: null
  }),
  setNeracaFinal: (data) => set({ 
    neracaFinal: data, 
    isNeracaDirty: false,
    hasilEmbung: null 
  }),

  // Fetch semua stasiun dari sumber data/API
  fetchStasiun: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Ganti dengan pemanggilan Supabase API sebenarnya
      // const { data, error } = await supabase.from('master_stasiun').select('*');
      
      // Menggunakan Mock Data untuk sementara sesuai tahap implementasi UI
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulasi network delay
      
      set({ stasiunList: MOCK_STASIUN_LIST, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengambil data stasiun hidrologi', isLoading: false });
    }
  },

  addStasiun: async (stasiun) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Ganti dengan Supabase insert
      // const { data, error } = await supabase.from('master_stasiun').insert([stasiun]).select().single();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStasiun: StasiunHidrologi = {
        ...stasiun,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      
      set(state => ({ 
        stasiunList: [...state.stasiunList, newStasiun],
        selectedStasiun: newStasiun,
        dataHujan: [],
        isLoading: false 
      }));
    } catch (err: any) {
      set({ error: err.message || 'Gagal menambah stasiun', isLoading: false });
      throw err;
    }
  },

  addDataHujan: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Ganti dengan Supabase insert
      // const { data: newData, error } = await supabase.from('data_hujan').insert([data]).select().single();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newData: DataHujan = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      
      set(state => ({ 
        dataHujan: [...state.dataHujan, newData].sort((a, b) => 
          new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
        ),
        isLoading: false 
      }));
      
      const state = get();
      if (state.dataHujan.length >= 10) {
        state.updateDataHujanManual(state.dataHujan);
      }
    } catch (err: any) {
      set({ error: err.message || 'Gagal menambah data hujan', isLoading: false });
      throw err;
    }
  },

  importDataHujanBatch: async (dataList) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Ganti dengan Supabase batch insert
      // const { data, error } = await supabase.from('data_hujan').insert(dataList).select();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newDataList: DataHujan[] = dataList.map(d => ({
        ...d,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }));
      
      set(state => ({ 
        dataHujan: [...state.dataHujan, ...newDataList].sort((a, b) => 
          new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
        ),
        isLoading: false 
      }));
      
      const state = get();
      if (state.dataHujan.length >= 10) {
        state.updateDataHujanManual(state.dataHujan);
      }
    } catch (err: any) {
      set({ error: err.message || 'Gagal import data hujan', isLoading: false });
      throw err;
    }
  },

  // (selectStasiun logic has been moved higher with dirty tracking)

  // Fetch data runtut waktu hujan
  fetchDataHujan: async (stasiunId, tahun = new Date().getFullYear()) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Ganti dengan filter pemanggilan Supabase (WHERE stasiun_id = $1 AND extract(year from tanggal) = $2)
      
      // Simulasi fetch
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      // Placeholder for actual Supabase query
      // const query = supabase.from('data_hujan').select('*').eq('stasiun_id', stasiunId).filter('tanggal', 'gte', `${tahun}-01-01`).filter('tanggal', 'lte', `${tahun}-12-31`);
      // For now, we'll use mock data to keep the code syntactically correct.
      const mockedData = generateMockDataHujan(stasiunId, tahun);
      const data = mockedData; // Simulate data from query
      const error = null; // Simulate no error
      
      if (error) throw error;
      set({ dataHujan: data || [] });
    } catch (err: any) {
      set({ error: err.message, dataHujan: [] });
    } finally {
      set({ isLoading: false });
    }
  }
}));
