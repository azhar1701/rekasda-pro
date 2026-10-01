import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateTimeOfConcentration } from '@/lib/utils/derivedState';
import { runFullQC } from '@/lib/utils/qc/dataQualityMath';
import { supabase } from '@/lib/api/supabase';
import { chunkArray } from '@/lib/sanitizer/rainfallSanitizer';


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
  is_infilled?: boolean;
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
  annualMax?: number[]; // Added to store time-series data
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
  hujanRataRataAMS?: number[]; // Added to store the Annual Maximum Series array
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
  waterScarcity?: {
    ikaPercent: number;
    status: string;
    description: string;
    badgeColor: string;
  };
  storageRequiredM3?: number;
  storageRequiredJutaM3?: number;
  monthlySupply?: number[];
  monthlyDemand?: number[];
}

export interface HasilEmbung {
  isAman: boolean;
  reduksiPuncak: number; 
  umurSedimen: number;
  peakInflow?: number;
  peakOutflow?: number;
  maxElevation?: number;
  freeboardResidual?: number;
}

export interface HasilSaluran {
  shape: 'trapezoid' | 'rectangular' | 'triangular' | 'circular';
  channelName?: string;
  dischargeCapacity: number;
  designDischarge?: number;
  velocity: number;
  froudeNumber: number;
  flowRegime: 'Subkritis' | 'Kritis' | 'Superkritis';
  isSafe: boolean;
  isVelocitySafe: boolean;
  velocityStatus: 'Normal' | 'Rawan Gerusan (Scouring)' | 'Rawan Sedimentasi (Silting)';
  freeboardActual: number;
  freeboardRecommended: number;
  isFreeboardSafe: boolean;
  dimensions: {
    width?: number;
    depth: number;
    totalDepth: number;
    sideSlope?: number;
    diameter?: number;
    topWidth?: number;
  };
  materialName?: string;
  n: number;
  slope: number;
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
  monthlyQAndalan?: number[];
  monthlyRAndalan?: number[];
  yearsCount?: number;
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
  hasilBanjirEmpiris: Record<string, any> | null;
  hasilBanjirHSS: Record<string, any> | null;
  hasilKonvolusi: HasilKonvolusi | null;
  hasilNeraca: HasilNeraca | null;
  hasilEmbung: HasilEmbung | null;
  hasilSaluran: HasilSaluran | null;
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
  activeRainfallSource: 'titik' | 'aljabar' | 'thiessen' | 'isohyet';
  arealRainfallAlgebraic: DataHujan[] | null;
  arealRainfallThiessen: DataHujan[] | null;
  arealRainfallIsohyet: DataHujan[] | null;
  isBanjirDirty: boolean;
  isNeracaDirty: boolean;
  isLoading: boolean;
  error: string | null;
  selectedKalaUlang: number;
  deletedStationIds: string[];

  // Actions
  setError: (error: string | null) => void;
  setLuasDas: (luas: string) => void;
  setPanjangSungai: (val: string) => void;
  setCurahHujanRencana: (val: string) => void;
  fetchStasiun: () => Promise<void>;
  seedInitialStations: () => Promise<void>;

  addStasiun: (stasiun: Omit<StasiunHidrologi, 'id' | 'created_at'>) => Promise<void>;
  updateStasiun: (id: string, data: Partial<StasiunHidrologi>) => Promise<void>;
  deleteStasiun: (id: string) => Promise<void>;
  addDataHujan: (data: Omit<DataHujan, 'id' | 'created_at'>) => Promise<void>;
  importDataHujanBatch: (dataList: Omit<DataHujan, 'id' | 'created_at'>[], onProgress?: (progress: number) => void) => Promise<void>;
  deleteDataHujanByYear: (stasiunId: string, year: number) => Promise<void>;
  updateDataHujanSingle: (stasiunId: string, tanggal: string, curah_hujan: number) => Promise<void>;
  selectStasiun: (stasiun: StasiunHidrologi | null) => void;
  fetchDataHujan: (stasiunId: string, tahun?: number) => Promise<void>;
  setHasilThiessen: (hasil: HasilThiessen | null) => void;
  setHasilARF: (hasil: HasilARF | null) => void;
  setMorfometriDAS: (data: MorfometriDAS | null) => void;
  updateMorfometriDAS: (data: MorfometriDAS | null) => void; 
  setTutupanLahan: (data: TutupanLahan | null) => void;
  saveMorfometriDAS: (data: MorfometriDAS) => Promise<void>;
  saveTutupanLahan: (data: TutupanLahan) => Promise<void>;
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
  setHasilBanjirEmpiris: (hasil: Record<string, any> | null) => void;
  setHasilBanjirHSS: (hasil: Record<string, any> | null) => void;
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
  setHasilSaluran: (hasil: HasilSaluran | null) => void;
  fetchMultipleStationsData: (stasiunIds: string[]) => Promise<void>;

  // --- Rainfall Routing Setters ---
  setActiveRainfallSource: (source: 'titik' | 'aljabar' | 'thiessen' | 'isohyet') => void;
  setArealRainfallData: (type: 'aljabar' | 'thiessen' | 'isohyet', data: DataHujan[] | null) => void;
}

// Mock data removed for production integration


export const useHydrologyStore = create<HydrologyState>()(
  persist(
    (set, get) => ({
  luasDas: '', panjangSungai: '', curahHujanRencana: '', stasiunList: [], selectedStasiun: null, dataHujan: [],
  identitasLokasi: { namaPekerjaan: '', namaDAS: '', namaSungai: '', provinsi: '', kabupaten: '', koordinat: { lat: null, lng: null } },
  morfometriDAS: null, tutupanLahan: null, curahHujanWilayah: null, analisisFrekuensi: null,
  hasilThiessen: null, hasilARF: null, hasilAnalisisFrekuensi: null,
  hasilBanjir: null, hasilBanjirEmpiris: null, hasilBanjirHSS: null,
  hasilNeraca: null, hasilEmbung: null, hasilSaluran: null, hasilMock: null,
  hasilKonvolusi: null, neracaFinal: null, distribusiHujanJamJaman: null, hujanEfektif: null, durasiHujan: 6,
  qcResults: null, qcStatus: null, isQCOverridden: false, isQCCalculating: false, rentangTahun: null, landCoverParams: null, effectiveRainfall: null,
  hssComparisonResults: null, isBanjirDirty: false, isNeracaDirty: false, isLoading: false, error: null,
  selectedKalaUlang: 25,

  // --- Initial Rainfall Routing States ---
  activeRainfallSource: 'titik',
  arealRainfallAlgebraic: null,
  arealRainfallThiessen: null,
  arealRainfallIsohyet: null,
  deletedStationIds: [],

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setLuasDas: (luas: string) => set({ luasDas: luas, isBanjirDirty: true, isNeracaDirty: true }),
  setPanjangSungai: (val: string) => set({ panjangSungai: val, isBanjirDirty: true }),
  setCurahHujanRencana: (val: string) => set({ curahHujanRencana: val, isBanjirDirty: true, isNeracaDirty: true }),
  
  fetchStasiun: async () => {
    const deletedIds = get().deletedStationIds || [];
    if (!supabase) {
      // Offline mode: jika stasiunList kosong, inisialisasi default
      const currentList = get().stasiunList.filter(s => !deletedIds.includes(s.id));
      if (currentList.length === 0 && deletedIds.length === 0) {
        await get().seedInitialStations();
      } else {
        const currentSelected = get().selectedStasiun;
        const stillValid = currentSelected && currentList.some(s => s.id === currentSelected.id);
        set({
          stasiunList: currentList,
          selectedStasiun: stillValid ? currentSelected : (currentList[0] || null)
        });
      }
      return;
    }
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('master_stasiun')
        .select('*')
        .order('nama_stasiun');
      
      if (error) throw error;
      const activeStations = (data || []).filter(s => !deletedIds.includes(s.id));
      const currentSelected = get().selectedStasiun;
      const stillValid = currentSelected && activeStations.some(s => s.id === currentSelected.id);
      set({
        stasiunList: activeStations,
        selectedStasiun: stillValid ? currentSelected : (activeStations[0] || null)
      });
    } catch (error: any) {
      console.warn('fetchStasiun gagal, menggunakan data lokal:', error.message);
      const activeStations = get().stasiunList.filter(s => !deletedIds.includes(s.id));
      const currentSelected = get().selectedStasiun;
      const stillValid = currentSelected && activeStations.some(s => s.id === currentSelected.id);
      set({
        stasiunList: activeStations,
        selectedStasiun: stillValid ? currentSelected : (activeStations[0] || null)
      });
    } finally {
      set({ isLoading: false });
    }
  },
  seedInitialStations: async () => {
    const initialStations = [
      { nama_stasiun: 'Panjalu', koordinat_x: 108.2711, koordinat_y: -7.1242, elevasi: 730, keterangan: null },
      { nama_stasiun: 'Panawangan', koordinat_x: 108.3842, koordinat_y: -7.0983, elevasi: 620, keterangan: null },
      { nama_stasiun: 'Sadananya', koordinat_x: 108.3245, koordinat_y: -7.2842, elevasi: 450, keterangan: null },
      { nama_stasiun: 'Sidamulih', koordinat_x: 108.4562, koordinat_y: -7.6542, elevasi: 120, keterangan: null },
      { nama_stasiun: 'Tanjungsukur', koordinat_x: 108.5242, koordinat_y: -7.3452, elevasi: 50, keterangan: null },
      { nama_stasiun: 'Cikupa', koordinat_x: 108.2145, koordinat_y: -7.4212, elevasi: 350, keterangan: null },
      { nama_stasiun: 'Kawali', koordinat_x: 108.3562, koordinat_y: -7.1842, elevasi: 420, keterangan: null },
      { nama_stasiun: 'Rancah', koordinat_x: 108.5123, koordinat_y: -7.2142, elevasi: 380, keterangan: null },
      { nama_stasiun: 'Kaso', koordinat_x: 108.4212, koordinat_y: -7.2562, elevasi: 310, keterangan: null },
      { nama_stasiun: 'Janggala', koordinat_x: 108.4842, koordinat_y: -7.3842, elevasi: 150, keterangan: null },
      { nama_stasiun: 'Ciamis', koordinat_x: 108.3542, koordinat_y: -7.3242, elevasi: 210, keterangan: null }
    ];

    if (!supabase) {
      const seeded = initialStations.map((s, idx) => ({
        id: `seed_stn_${idx + 1}`,
        ...s,
        created_at: new Date().toISOString()
      }));
      set(state => ({
        stasiunList: seeded,
        selectedStasiun: state.selectedStasiun || seeded[0]
      }));
      return;
    }

    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('master_stasiun')
        .insert(initialStations);

      if (error) {
        if (error && (error as any).code === '42P01') {
          throw new Error('Relation "public.master_stasiun" does not exist. Silakan jalankan DDL SQL di dashboard Supabase untuk membuat tabel.');
        }
        throw error;
      }
      await get().fetchStasiun();
    } catch (error: any) {
      console.warn('seedInitialStations gagal ke DB, populate lokal:', error.message);
      const seeded = initialStations.map((s, idx) => ({
        id: `seed_stn_${idx + 1}`,
        ...s,
        created_at: new Date().toISOString()
      }));
      set(state => ({
        stasiunList: seeded,
        selectedStasiun: state.selectedStasiun || seeded[0]
      }));
    } finally {
      set({ isLoading: false });
    }
  },



  addStasiun: async (stasiun) => {
    set({ isLoading: true });
    try {
      if (!supabase) {
        const newStation: StasiunHidrologi = {
          id: `stn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ...stasiun,
          created_at: new Date().toISOString(),
        };
        set(state => ({
          stasiunList: [...state.stasiunList, newStation],
          selectedStasiun: state.selectedStasiun || newStation,
          deletedStationIds: (state.deletedStationIds || []).filter(delId => delId !== newStation.id)
        }));
        return;
      }

      const { data, error } = await supabase
        .from('master_stasiun')
        .insert([stasiun])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newStation = data[0];
        set(state => ({
          stasiunList: [...state.stasiunList, newStation],
          selectedStasiun: state.selectedStasiun || newStation,
          deletedStationIds: (state.deletedStationIds || []).filter(delId => delId !== newStation.id)
        }));
      }
    } catch (error: any) {
      console.warn('Supabase addStasiun gagal, simpan ke lokal:', error);
      const fallbackStation: StasiunHidrologi = {
        id: `stn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...stasiun,
        created_at: new Date().toISOString(),
      };
      set(state => ({
        stasiunList: [...state.stasiunList, fallbackStation],
        selectedStasiun: state.selectedStasiun || fallbackStation,
        deletedStationIds: (state.deletedStationIds || []).filter(delId => delId !== fallbackStation.id)
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  updateStasiun: async (id, data) => {
    set({ isLoading: true });
    try {
      if (!supabase) {
        set(state => ({
          stasiunList: state.stasiunList.map(s => s.id === id ? { ...s, ...data } as StasiunHidrologi : s),
          selectedStasiun: state.selectedStasiun?.id === id ? { ...state.selectedStasiun, ...data } as StasiunHidrologi : state.selectedStasiun
        }));
        return;
      }

      const { data: updatedData, error } = await supabase
        .from('master_stasiun')
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      if (updatedData && updatedData.length > 0) {
        const updated = updatedData[0];
        set(state => ({
          stasiunList: state.stasiunList.map(s => s.id === id ? updated : s),
          selectedStasiun: state.selectedStasiun?.id === id ? updated : state.selectedStasiun
        }));
      } else {
        set(state => ({
          stasiunList: state.stasiunList.map(s => s.id === id ? { ...s, ...data } as any : s),
          selectedStasiun: state.selectedStasiun?.id === id ? { ...state.selectedStasiun, ...data } as any : state.selectedStasiun
        }));
      }
    } catch (error: any) {
      console.warn('Supabase updateStasiun gagal, update lokal:', error);
      set(state => ({
        stasiunList: state.stasiunList.map(s => s.id === id ? { ...s, ...data } as StasiunHidrologi : s),
        selectedStasiun: state.selectedStasiun?.id === id ? { ...state.selectedStasiun, ...data } as StasiunHidrologi : state.selectedStasiun
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  deleteStasiun: async (id) => {
    set({ isLoading: true });
    try {
      if (supabase) {
        const { error: rainErr } = await supabase
          .from('master_data_hujan')
          .delete()
          .eq('stasiun_id', id);
        if (rainErr) console.warn('Supabase delete data hujan error:', rainErr);

        const { error } = await supabase
          .from('master_stasiun')
          .delete()
          .eq('id', id);
        if (error) console.warn('Supabase delete stasiun error:', error);
      }

      set(state => {
        const remaining = state.stasiunList.filter(s => s.id !== id);
        const updatedDeletedIds = Array.from(new Set([...(state.deletedStationIds || []), id]));
        return {
          deletedStationIds: updatedDeletedIds,
          stasiunList: remaining,
          selectedStasiun: state.selectedStasiun?.id === id ? (remaining[0] || null) : state.selectedStasiun,
          dataHujan: state.dataHujan.filter(d => d.stasiun_id !== id)
        };
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addDataHujan: async (data) => {
    set({ isLoading: true });
    try {
      if (supabase) {
        const { data: inserted, error } = await supabase
          .from('master_data_hujan')
          .insert([data])
          .select();
        
        if (error) console.warn('Supabase insert single error:', error);
        if (inserted && inserted.length > 0) {
          set(state => ({ dataHujan: [...state.dataHujan, inserted[0]] }));
          return;
        }
      }

      // Local fallback
      set(state => ({
        dataHujan: [
          ...state.dataHujan,
          {
            id: `local_ch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            ...data
          }
        ]
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  importDataHujanBatch: async (dataList, onProgress) => {
    set({ isLoading: true });
    try {
      if (!supabase) {
        // Fallback penyimpanan lokal jika Supabase tidak dikonfigurasi / offline
        set(state => {
          const existingMap = new Map(state.dataHujan.map(d => [`${d.stasiun_id}_${d.tanggal}`, d]));
          dataList.forEach(item => {
            const key = `${item.stasiun_id}_${item.tanggal}`;
            existingMap.set(key, {
              id: existingMap.get(key)?.id || `local_${Date.now()}_${Math.random()}`,
              ...item
            });
          });
          return { dataHujan: Array.from(existingMap.values()) };
        });
        if (onProgress) onProgress(100);
        return;
      }

      // Chunking batch per 365 baris untuk stabilitas jaringan
      const chunks = chunkArray(dataList, 365);
      const totalChunks = chunks.length;

      for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const { error } = await supabase
          .from('master_data_hujan')
          .upsert(chunk, { onConflict: 'stasiun_id, tanggal' });
        
        if (error) throw error;
        if (onProgress) {
          onProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
      }

      // Refresh current view if needed
      const currentStasiun = get().selectedStasiun;
      if (currentStasiun) {
        await get().fetchDataHujan(currentStasiun.id);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDataHujanByYear: async (stasiunId, year) => {
    set({ isLoading: true });
    try {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;

      if (supabase) {
        const { error } = await supabase
          .from('master_data_hujan')
          .delete()
          .eq('stasiun_id', stasiunId)
          .gte('tanggal', start)
          .lte('tanggal', end);
        if (error) console.warn('Supabase delete year error:', error);
      }

      set(state => ({
        dataHujan: state.dataHujan.filter(
          d => !(d.stasiun_id === stasiunId && d.tanggal >= start && d.tanggal <= end)
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateDataHujanSingle: async (stasiunId, tanggal, curah_hujan) => {
    set({ isLoading: true });
    try {
      if (supabase) {
        const { error } = await supabase
          .from('master_data_hujan')
          .upsert({ stasiun_id: stasiunId, tanggal, curah_hujan }, { onConflict: 'stasiun_id, tanggal' });
        if (error) console.warn('Supabase update single error:', error);
      }

      set(state => {
        const existingIdx = state.dataHujan.findIndex(
          d => d.stasiun_id === stasiunId && d.tanggal === tanggal
        );
        if (existingIdx >= 0) {
          const updated = [...state.dataHujan];
          updated[existingIdx] = { ...updated[existingIdx], curah_hujan, is_infilled: false };
          return { dataHujan: updated };
        } else {
          return {
            dataHujan: [
              ...state.dataHujan,
              {
                id: `local_ch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                stasiun_id: stasiunId,
                tanggal,
                curah_hujan,
                is_infilled: false,
              }
            ]
          };
        }
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  selectStasiun: (stasiun) => {
    set({ selectedStasiun: stasiun, activeRainfallSource: 'titik' });
    if (stasiun) {
      get().fetchDataHujan(stasiun.id);
    } else {
      set({ dataHujan: [] });
    }
  },

  fetchDataHujan: async (stasiunId, tahun) => {
    if (!supabase) return;
    set({ isLoading: true });
    try {
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;

      while (hasMore) {
        let query = supabase
          .from('master_data_hujan')
          .select('*')
          .eq('stasiun_id', stasiunId)
          .order('tanggal', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (tahun) {
          const start = `${tahun}-01-01`;
          const end = `${tahun}-12-31`;
          query = query.gte('tanggal', start).lte('tanggal', end);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < pageSize || tahun) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      set({ dataHujan: allData });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setHasilThiessen: (hasil: HasilThiessen | null) => {
    // Bridge: auto-sync legacy hasilThiessen → new arealRainfallThiessen
    let arealData: DataHujan[] | null = null;
    if (hasil && hasil.hujanRataRataDAS && hasil.hujanRataRataDAS.length > 0) {
      arealData = hasil.hujanRataRataDAS.map((val, idx) => ({
        id: `thiessen-bridge-${idx}`,
        stasiun_id: 'thiessen',
        tanggal: `${2011 + idx}-12-31`,
        curah_hujan: val
      }));
    }
    set({
      hasilThiessen: hasil,
      arealRainfallThiessen: arealData,
      activeRainfallSource: hasil ? 'thiessen' : 'titik',
      isBanjirDirty: true,
      isNeracaDirty: true
    });
  },
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
  saveMorfometriDAS: async (data) => {
    // Catchment morphometry is a property of the DAS, update store state immediately
    set({ 
      morfometriDAS: data, 
      luasDas: data ? String(data.luasDAS) : '', 
      panjangSungai: data ? String(data.panjangSungai) : '', 
      analisisFrekuensi: null, 
      hasilBanjir: null, 
      isBanjirDirty: true,
      isNeracaDirty: true
    });

    const stasiunId = get().selectedStasiun?.id;
    if (!stasiunId || !supabase) {
      return;
    }
    
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('master_morfometri_das')
        .upsert({
          stasiun_id: stasiunId,
          luas_das: data.luasDAS,
          panjang_sungai: data.panjangSungai,
          kemiringan_sungai: data.kemiringanSungai,
          elevasi: data.elevasi
        }, { onConflict: 'stasiun_id' });
        
      if (error) console.warn('Supabase sync warning for Morfometri DAS:', error);
    } catch (error: any) {
      console.warn('Error syncing Morfometri DAS to database:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveTutupanLahan: async (data) => {
    // Land cover is a property of the DAS, update store state immediately
    set({ tutupanLahan: data, isBanjirDirty: true, isNeracaDirty: true });

    const stasiunId = get().selectedStasiun?.id;
    if (!stasiunId || !supabase) {
      return;
    }

    set({ isLoading: true });
    try {
      const { error: deleteError } = await supabase
        .from('master_tutupan_lahan')
        .delete()
        .eq('stasiun_id', stasiunId);
        
      if (deleteError) throw deleteError;

      if (data.items.length > 0) {
        const insertData = data.items.map(item => ({
          stasiun_id: stasiunId,
          jenis: item.jenis,
          luas: item.luas,
          nilai_c: item.nilaiC,
          nilai_cn: item.nilaiCN
        }));
        
        const { error: insertError } = await supabase
          .from('master_tutupan_lahan')
          .insert(insertData);
          
        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.warn('Error syncing Tutupan Lahan to database:', error);
    } finally {
      set({ isLoading: false });
    }
  },

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
  setHasilBanjirEmpiris: (results) => set({ hasilBanjirEmpiris: results }),
  setHasilBanjirHSS: (results) => set({ hasilBanjirHSS: results }),
  setHasilKonvolusi: (hasil) => set({ hasilKonvolusi: hasil }),
  setHSSComparisonResults: (results) => set({ hssComparisonResults: results }),
  setHasilNeraca: (hasil) => set({ hasilNeraca: hasil, isNeracaDirty: false }),
  setHasilMock: (hasil) => set({ hasilMock: hasil, isNeracaDirty: true }),
  setNeracaFinal: (data) => set({ neracaFinal: data, isNeracaDirty: false }),
  setHasilEmbung: (hasil) => set({ hasilEmbung: hasil }),
  setHasilSaluran: (hasil) => set({ hasilSaluran: hasil }),
  setDistribusiHujanJamJaman: (data) => set({ distribusiHujanJamJaman: data, isBanjirDirty: true }),
  setHujanEfektif: (data) => set({ hujanEfektif: data, isBanjirDirty: true }),
  setDurasiHujan: (durasi) => set({ durasiHujan: durasi, isBanjirDirty: true }),

  fetchMultipleStationsData: async (stasiunIds) => {
    if (!supabase || stasiunIds.length === 0) return;
    set({ isLoading: true });
    try {
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;

      while (hasMore) {
        const { data, error } = await supabase
          .from('master_data_hujan')
          .select('*')
          .in('stasiun_id', stasiunIds)
          .order('tanggal', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      set({ dataHujan: allData });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveRainfallSource: (source) => set({ activeRainfallSource: source }),
  setArealRainfallData: (type, data) => {
    if (type === 'aljabar') set({ arealRainfallAlgebraic: data });
    else if (type === 'thiessen') set({ arealRainfallThiessen: data });
    else if (type === 'isohyet') set({ arealRainfallIsohyet: data });
    },
  }),
  {
    name: 'rekasda-hydrology-store',
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => {
      // Hanya persist state yang penting — exclude transient/loading states
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isLoading, error, isBanjirDirty, isNeracaDirty, isQCCalculating, ...persisted } = state;
      return persisted;
    },
  }
));
