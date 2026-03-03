import { create } from 'zustand';
import { calculateTimeOfConcentration } from '@/lib/utils/derivedState';
import { runFullQC } from '@/lib/utils/qc/dataQualityMath';

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
  tanggal: string; 
  curah_hujan: number; 
  created_at?: string;
}

export interface ThiessenStasiunConfig {
  stasiunId: string;
  namaStasiun: string;
  luasPengaruh: number;  
  bobot: number;         
}

export interface IsohyetConfig {
  id: string;
  label: string; 
  curahHujanRataRata: number; 
  luasAntarGaris: number; 
  bobot: number; 
}

export interface HasilThiessen {
  stasiunConfigs: ThiessenStasiunConfig[];
  totalLuas: number;
  hujanRataRataDAS: number[];  
}

export interface HasilARF {
  arfValue: number;           
  arfOverride: number | null; 
  hujanTitik: number;         
  hujanDAS: number;           
}

export interface DesignRainfallValue {
  Tr: number;    
  R24: number;   
  kalaUlang: number; // For compatibility
  curahHujan: number; // For compatibility
}

export interface HasilAnalisisFrekuensi {
  metodeTerpilih: string;
  lulusUjiKecocokan: boolean;
  curahHujanRencana: DesignRainfallValue[];
  selectedKalaUlang: number | null;
  qcResults?: QualityControlResults;
}

export interface QualityControlResults {
  konsistensi: { isPassed: boolean; method: 'RAPS' | 'DoubleMass'; rapsValue?: number; threshold?: number; message: string; };
  homogenitas: { isPassed: boolean; method: 'F-Test' | 'T-Test'; fValue?: number; tValue?: number; criticalValue?: number; message: string; };
  outlier: { isPassed: boolean; method: 'Grubbs-Beck' | 'Rosner'; outlierIndices: number[]; message: string; };
  overallPassed: boolean;
}

export interface LandCoverParameters {
  C?: number;
  CN?: number;
  phiIndex?: number;
  method: 'C' | 'CN' | 'PhiIndex';
  description?: string;
}

export interface MorfometriDAS {
  luasDAS: number;           
  panjangSungai: number;     
  kemiringanSungai: number;  
  elevasi: number;           
}

export interface TutupanLahanItem {
  id: string;
  jenis: string;
  luas: number;    
  nilaiC: number;  
  nilaiCN: number; 
}

export interface TutupanLahan {
  items: TutupanLahanItem[];
  koefisienPengaliranGabungan: number; 
  curveNumberGabungan: number;         
  totalLuas: number;                   
}

export interface CurahHujanWilayah {
  metode: 'aljabar' | 'thiessen' | 'isohyet';
  stasiunConfigs: ThiessenStasiunConfig[];
  isohyetConfigs?: IsohyetConfig[];
  hujanRataRata: number; 
}

export interface AnalisisFrekuensi {
  parameterStatistik: {
    asli: { mean: number; stdDev: number; cv: number; cs: number; ck: number };
    log: { mean: number; stdDev: number; cv: number; cs: number; ck: number };
  } | null;
  hasilDistribusi: Array<{
    method: string;
    values: DesignRainfallValue[];
  }> | null;
  ujiKecocokan: Array<{
    method: string;
    chiSquare: { statistic: number; critical: number; accepted: boolean };
    kolmogorovSmirnov: { statistic: number; critical: number; accepted: boolean };
  }> | null;
  metodeTerpilih: string | null;
  dataHujanInput: number[];
}

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

export interface HasilMock {
  monthlyResults: {
    month: string;
    precipitation: number;
    eto: number;
    waterSurplus: number;
    baseFlow: number;
    directRunoff: number;
    totalRunoff: number;
    discharge: number;
    daysInMonth: number;
  }[];
  qAndalan: number;
  probability: number;
  metode: 'mock' | 'manual' | 'weibull';
}

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

export interface IdentitasLokasi {
  namaPekerjaan: string;
  namaDAS: string;
  namaSungai: string;
  provinsi: string;
  kabupaten: string;
  koordinat: { lat: number | null; lng: number | null; };
}

export interface HydrologyState {
  luasDas: string;
  panjangSungai: string;
  curahHujanRencana: string;
  stasiunList: StasiunHidrologi[];
  selectedStasiun: StasiunHidrologi | null;
  identitasLokasi: IdentitasLokasi;
  morfometriDAS: MorfometriDAS | null;
  tutupanLahan: TutupanLahan | null;
  curahHujanWilayah: CurahHujanWilayah | null;
  analisisFrekuensi: AnalisisFrekuensi | null;
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
  hujanEfektif: number[] | null;
  durasiHujan: number;
  qcResults: Record<string, QualityControlResults> | null;
  qcStatus: Record<string, { konsisten: boolean; bebasOutlier: boolean; homogen: boolean }> | null;
  isQCOverridden: boolean;
  isQCCalculating: boolean;
  rentangTahun: { min: number, max: number } | null;
  landCoverParams: LandCoverParameters | null;
  effectiveRainfall: EffectiveRainfallResult | null;
  hssComparisonResults: HSSComparisonResult[] | null;
  isBanjirDirty: boolean;
  isNeracaDirty: boolean;
  isLoading: boolean;
  error: string | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLuasDas: (luas: string) => void;
  setPanjangSungai: (val: string) => void;
  setCurahHujanRencana: (val: string) => void;
  fetchStasiun: () => Promise<void>;
  addStasiun: (stasiun: Omit<StasiunHidrologi, 'id' | 'created_at'>) => Promise<void>;
  addDataHujan: (data: Omit<DataHujan, 'id' | 'created_at'>) => Promise<void>;
  importDataHujanBatch: (dataList: Omit<DataHujan, 'id' | 'created_at'>[]) => Promise<void>;
  selectStasiun: (stasiun: StasiunHidrologi | null) => void;
  fetchDataHujan: (stasiunId: string, tahun?: number) => Promise<void>;
  setHasilThiessen: (hasil: HasilThiessen | null) => void;
  setHasilARF: (hasil: HasilARF | null) => void;
  setMorfometriDAS: (data: MorfometriDAS | null) => void;
  updateMorfometriDAS: (data: MorfometriDAS | null) => void; 
  setTutupanLahan: (data: TutupanLahan | null) => void;
  setCurahHujanWilayah: (data: CurahHujanWilayah | null) => void;
  setAnalisisFrekuensi: (data: AnalisisFrekuensi | null) => void;
  getTimeOfConcentration: () => number;
  getDesignRainfall: (returnPeriod: number) => number | null;
  getDesignDischarge: (type: 'flood' | 'irrigation') => number | null;
  setQCResults: (results: Record<string, QualityControlResults> | null) => void;
  setQCStatus: (status: Record<string, { konsisten: boolean; bebasOutlier: boolean; homogen: boolean }> | null) => void;
  setQCOverride: (override: boolean) => void;
  setQCCalculating: (calculating: boolean) => void;
  updateDataHujanManual: (data: DataHujan[]) => void;
  setLandCoverParams: (params: LandCoverParameters | null) => void;
  setEffectiveRainfall: (result: EffectiveRainfallResult | null) => void;
  setHasilAnalisisFrekuensi: (hasil: HasilAnalisisFrekuensi | null) => void;
  setSelectedKalaUlang: (kalaUlang: number) => void;
  setHasilBanjir: (hasil: HasilBanjir | null) => void;
  setHasilKonvolusi: (hasil: HasilKonvolusi | null) => void;
  setDistribusiHujanJamJaman: (data: number[] | null) => void;
  setHujanEfektif: (data: number[] | null) => void;
  setDurasiHujan: (durasi: number) => void;
  setHSSComparisonResults: (results: HSSComparisonResult[] | null) => void;
  setIdentitasLokasi: (data: Partial<IdentitasLokasi>) => void;
  setHasilNeraca: (hasil: HasilNeraca | null) => void;
  setHasilMock: (hasil: HasilMock | null) => void;
  setNeracaFinal: (data: NeracaFinalRow[] | null) => void;
  setHasilEmbung: (hasil: HasilEmbung | null) => void;
}

const MOCK_STASIUN_LIST: StasiunHidrologi[] = [
  { id: 'a1b2c3d4', nama_stasiun: 'Stasiun Cikampak', koordinat_x: 106.7562, koordinat_y: -6.5872, elevasi: 250, keterangan: 'Tipe Manual.' },
  { id: 'e5f6g7h8', nama_stasiun: 'Stasiun AWS Katulampa', koordinat_x: 106.8415, koordinat_y: -6.6358, elevasi: 260, keterangan: 'Otomatis.' },
  { id: 'z9y8x7w6', nama_stasiun: 'Stasiun Curug Bitung', koordinat_x: 106.3321, koordinat_y: -6.4421, elevasi: 120, keterangan: 'Hilir.' }
];

export const generateMockDataHujan = (stasiunId: string, elevation: number = 0): DataHujan[] => {
  const data: DataHujan[] = [];
  const baseline = 110 + (elevation / 100) * 15 + (stasiunId.length % 40); 
  for (let year = 2010; year <= 2024; year++) {
    const annualMax = Math.max(40, baseline + (Math.random() - 0.5) * 50); 
    data.push({ id: crypto.randomUUID(), stasiun_id: stasiunId, tanggal: `${year}-01-15`, curah_hujan: parseFloat(annualMax.toFixed(1)) });
  }
  return data;
};

export const useHydrologyStore = create<HydrologyState>((set, get) => ({
  luasDas: '', panjangSungai: '', curahHujanRencana: '', stasiunList: [], selectedStasiun: null, dataHujan: [],
  identitasLokasi: { namaPekerjaan: '', namaDAS: '', namaSungai: '', provinsi: '', kabupaten: '', koordinat: { lat: null, lng: null } },
  morfometriDAS: null, tutupanLahan: null, curahHujanWilayah: null, analisisFrekuensi: null,
  hasilThiessen: null, hasilARF: null, hasilAnalisisFrekuensi: null, hasilBanjir: null, hasilNeraca: null, hasilEmbung: null, hasilMock: null,
  hasilKonvolusi: null, neracaFinal: null, distribusiHujanJamJaman: null, hujanEfektif: null, durasiHujan: 6,
  qcResults: null, qcStatus: null, isQCOverridden: false, isQCCalculating: false, rentangTahun: null, landCoverParams: null, effectiveRainfall: null,
  hssComparisonResults: null, isBanjirDirty: false, isNeracaDirty: false, isLoading: false, error: null,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLuasDas: (luas) => set({ luasDas: luas, isBanjirDirty: true, isNeracaDirty: true }),
  setPanjangSungai: (val) => set({ panjangSungai: val, isBanjirDirty: true }),
  setCurahHujanRencana: (val) => set({ curahHujanRencana: val, isBanjirDirty: true, isNeracaDirty: true }),
  
  fetchStasiun: async () => { set({ stasiunList: MOCK_STASIUN_LIST }); },
  addStasiun: async (stasiun) => set(state => ({ stasiunList: [...state.stasiunList, { ...stasiun, id: crypto.randomUUID() }] })),
  addDataHujan: async (data) => set(state => ({ dataHujan: [...state.dataHujan, { ...data, id: crypto.randomUUID() }] })),
  importDataHujanBatch: async (dataList) => set(state => ({ dataHujan: [...state.dataHujan, ...dataList.map(d => ({ ...d, id: crypto.randomUUID() }))] })),
  
  selectStasiun: (stasiun) => set({ selectedStasiun: stasiun, dataHujan: stasiun ? generateMockDataHujan(stasiun.id, stasiun.elevasi || 0) : [] }),
  fetchDataHujan: async (stasiunId, _tahun) => set({ dataHujan: generateMockDataHujan(stasiunId) }),

  setHasilThiessen: (hasil) => set({ hasilThiessen: hasil, isBanjirDirty: true, isNeracaDirty: true }),
  setHasilARF: (hasil) => set((state) => {
    const freq = state.hasilAnalisisFrekuensi;
    let newRainfall = state.curahHujanRencana;
    if (freq && freq.selectedKalaUlang) {
      const match = freq.curahHujanRencana.find(v => v.Tr === freq.selectedKalaUlang);
      if (match) newRainfall = (match.R24 * (hasil?.arfValue || 1.0)).toFixed(2);
    }
    return { hasilARF: hasil, curahHujanRencana: newRainfall, isBanjirDirty: true };
  }),

  setMorfometriDAS: (data) => set({ morfometriDAS: data, luasDas: data ? String(data.luasDAS) : '', panjangSungai: data ? String(data.panjangSungai) : '' }),
  updateMorfometriDAS: (data) => set({ morfometriDAS: data, luasDas: data ? String(data.luasDAS) : '', panjangSungai: data ? String(data.panjangSungai) : '', analisisFrekuensi: null, hasilBanjir: null, isBanjirDirty: true }),
  setTutupanLahan: (data) => set({ tutupanLahan: data, isBanjirDirty: true }),
  setCurahHujanWilayah: (data) => set({ curahHujanWilayah: data, isBanjirDirty: true }),
  setAnalisisFrekuensi: (data) => set({ analisisFrekuensi: data, hasilBanjir: null, isBanjirDirty: true }),
  setIdentitasLokasi: (data) => set(state => ({ identitasLokasi: { ...state.identitasLokasi, ...data } })),

  getTimeOfConcentration: () => calculateTimeOfConcentration(parseFloat(get().morfometriDAS?.panjangSungai + '' || '0'), 0.01),
  getDesignRainfall: (Tr) => get().analisisFrekuensi?.hasilDistribusi?.find(d => d.method === get().analisisFrekuensi?.metodeTerpilih)?.values.find(v => v.Tr === Tr)?.R24 || null,
  getDesignDischarge: (type) => type === 'flood' ? get().hasilBanjir?.debitPuncak || null : get().hasilMock?.qAndalan || null,

  setQCResults: (results) => set({ qcResults: results }),
  setQCStatus: (status) => set({ qcStatus: status }),
  setQCOverride: (override) => set({ isQCOverridden: override }),
  setQCCalculating: (calculating) => set({ isQCCalculating: calculating }),
  updateDataHujanManual: (data) => {
    set({ dataHujan: data });
    if (data.length >= 10) {
      const years = Array.from(new Set(data.map(d => new Date(d.tanggal).getFullYear())));
      const annualMax = years.map(y => ({ tahun: y, hujan: Math.max(...data.filter(d => new Date(d.tanggal).getFullYear() === y).map(d => d.curah_hujan)) }));
      const qc = runFullQC(annualMax);
      set({ qcResults: { [data[0]?.stasiun_id]: qc } as any });
    }
  },

  setLandCoverParams: (params) => set({ landCoverParams: params, isBanjirDirty: true }),
  setEffectiveRainfall: (result) => set({ effectiveRainfall: result, isBanjirDirty: true }),
  setHasilAnalisisFrekuensi: (hasil) => set({ hasilAnalisisFrekuensi: hasil, isBanjirDirty: true }),
  setSelectedKalaUlang: (kalaUlang) => set(state => {
    const freq = state.hasilAnalisisFrekuensi;
    if (!freq) return state;
    const match = freq.curahHujanRencana.find(v => v.Tr === kalaUlang);
    const arf = state.hasilARF?.arfValue || 1.0;
    const newRainfall = match ? (match.R24 * arf).toFixed(2) : state.curahHujanRencana;
    return { hasilAnalisisFrekuensi: { ...freq, selectedKalaUlang: kalaUlang }, curahHujanRencana: newRainfall, isBanjirDirty: true, hasilBanjir: null, hasilKonvolusi: null };
  }),

  setHasilBanjir: (hasil) => set({ hasilBanjir: hasil, isBanjirDirty: false }),
  setHasilKonvolusi: (hasil) => set({ hasilKonvolusi: hasil }),
  setHSSComparisonResults: (results) => set({ hssComparisonResults: results }),
  setHasilNeraca: (hasil) => set({ hasilNeraca: hasil, isNeracaDirty: false }),
  setHasilMock: (hasil) => set({ hasilMock: hasil, isNeracaDirty: true }),
  setNeracaFinal: (data) => set({ neracaFinal: data, isNeracaDirty: false }),
  setHasilEmbung: (hasil) => set({ hasilEmbung: hasil }),
  setDistribusiHujanJamJaman: (data) => set({ distribusiHujanJamJaman: data, isBanjirDirty: true }),
  setHujanEfektif: (data) => set({ hujanEfektif: data, isBanjirDirty: true }),
  setDurasiHujan: (durasi) => set({ durasiHujan: durasi, isBanjirDirty: true })
}));

