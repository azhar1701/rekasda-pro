import { StateCreator } from 'zustand';
import { 
  StasiunHidrologi, 
  DataHujan, 
  CurahHujanWilayah, 
  AnalisisFrekuensi,
  QualityControlResults,
  QCStatus 
} from '@/types/hydrology.types';
import { supabase } from '@/lib/api/supabase';
import { toast } from '@/hooks/useToast';
import { runFullQC } from '@/lib/utils/qc/dataQualityMath';

export interface RainfallSlice {
  // State
  stasiunList: StasiunHidrologi[];
  selectedStasiun: StasiunHidrologi | null;
  projectStationIds: string[]; // Active stations for analysis
  dataHujan: DataHujan[];
  curahHujanWilayah: CurahHujanWilayah;
  hasilThiessen: any; 
  hasilARF: any;
  analisisFrekuensi: AnalisisFrekuensi;
  hasilAnalisisFrekuensi: any; 
  curahHujanRencana: any; 
  selectedKalaUlang: number | null;
  isQCCalculating: boolean;
  isQCOverridden: boolean;
  qcStatus: Record<string, QCStatus> | null; 
  qcResults: QualityControlResults | null;
  stasiunAmsData: Record<string, { tahun: number, hujan: number }[]>;
  activeRainfallSource: 'aljabar' | 'thiessen' | 'isohyet' | 'titik';
  arealRainfallAlgebraic: any[];
  arealRainfallThiessen: any[];
  arealRainfallIsohyet: any[];
  rentangTahun: { min: number; max: number } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setStasiunList: (stasiun: StasiunHidrologi[]) => void;
  selectStasiun: (stasiun: StasiunHidrologi | null) => void;
  setProjectStationIds: (ids: string[]) => void;
  toggleProjectStation: (id: string) => void;
  setDataHujan: (dataHujan: DataHujan[]) => void;
  updateDataHujanManual: (data: DataHujan[]) => void;
  setCurahHujanWilayah: (hujanWilayah: Partial<CurahHujanWilayah>) => void;
  setHasilThiessen: (hasil: any) => void;
  setHasilARF: (hasil: any) => void;
  setAnalisisFrekuensi: (analisis: Partial<AnalisisFrekuensi>) => void;
  setHasilAnalisisFrekuensi: (analisis: any) => void;
  setSelectedKalaUlang: (kalaUlang: number | null) => void;
  setQCCalculating: (calculating: boolean) => void;
  setQCOverride: (overridden: boolean) => void;
  setQCStatus: (status: Record<string, QCStatus> | null) => void;
  setQCResults: (results: QualityControlResults | null) => void;
  setStasiunAmsData: (data: Record<string, { tahun: number, hujan: number }[]>) => void;
  setActiveRainfallSource: (source: 'aljabar' | 'thiessen' | 'isohyet' | 'titik') => void;
  setArealRainfallData: (type: string, data: any[] | null) => void;
  fetchStasiun: () => Promise<void>;
  fetchMultipleStationsData: (ids: string[]) => Promise<void>;
  addStasiun: (stasiun: any) => Promise<void>;
  updateStasiun: (id: string, stasiun: any) => Promise<void>;
  deleteStasiun: (id: string) => Promise<void>;
  addDataHujan: (data: any) => Promise<void>;
  importDataHujanBatch: (data: any[]) => Promise<void>;
  deleteDataHujanByYear: (stasiunId: string, year: number) => Promise<void>;
  updateDataHujanSingle: (stasiunId: string, date: string, val: number, metadata?: Partial<DataHujan>) => Promise<void>;
  seedInitialStations: () => Promise<void>;
  syncRainfallMetadata: () => Promise<void>; 
  setError: (error: string | null) => void;
  resetRainfall: () => void;
}

const initialHujanWilayah: CurahHujanWilayah = {
  metode: 'aljabar',
  stasiunConfigs: [],
  hujanRataRata: 0,
  hujanRataRataAMS: []
};

const initialAnalisisFrekuensi: AnalisisFrekuensi = {
  parameterStatistik: null,
  hasilDistribusi: null,
  ujiKecocokan: null,
  metodeTerpilih: null,
  dataHujanInput: []
};

export const createRainfallSlice: StateCreator<RainfallSlice> = (set, get) => ({
  stasiunList: [],
  selectedStasiun: null,
  projectStationIds: [],
  dataHujan: [],
  curahHujanWilayah: initialHujanWilayah,
  hasilThiessen: null,
  hasilARF: null,
  analisisFrekuensi: initialAnalisisFrekuensi,
  hasilAnalisisFrekuensi: null,
  curahHujanRencana: [],
  selectedKalaUlang: null,
  isQCCalculating: false,
  isQCOverridden: false,
  qcStatus: null,
  qcResults: null,
  stasiunAmsData: {},
  activeRainfallSource: 'titik',
  arealRainfallAlgebraic: [],
  arealRainfallThiessen: [],
  arealRainfallIsohyet: [],
  rentangTahun: null,
  isLoading: false,
  error: null,

  setStasiunList: (stasiunList) => set({ stasiunList }),
  selectStasiun: (selectedStasiun) => {
    set({ selectedStasiun, activeRainfallSource: 'titik' });
    if (selectedStasiun) {
      get().fetchMultipleStationsData([selectedStasiun.id]);
    }
  },
  
  setProjectStationIds: (projectStationIds) => set({ projectStationIds }),
  
  toggleProjectStation: (id) => set((state) => {
    const isSelected = state.projectStationIds.includes(id);
    const newIds = isSelected 
      ? state.projectStationIds.filter(pid => pid !== id)
      : [...state.projectStationIds, id];
    return { projectStationIds: newIds };
  }),

  setDataHujan: (dataHujan) => set({ dataHujan }),
  
  updateDataHujanManual: (data) => {
    set({ dataHujan: data });
    
    // Group by year to find annual maximums for Auto-QC
    const yearMap: Record<number, number> = {};
    data.forEach(d => {
      const year = new Date(d.tanggal).getFullYear();
      if (!yearMap[year] || d.curah_hujan > yearMap[year]) {
        yearMap[year] = d.curah_hujan;
      }
    });

    const annualMax = Object.entries(yearMap)
      .map(([year, hujan]) => ({ tahun: parseInt(year), hujan }))
      .sort((a, b) => a.tahun - b.tahun);

    if (annualMax.length >= 10) {
      try {
        const qc = runFullQC(annualMax);
        set({ qcResults: { [data[0]?.stasiun_id]: qc } as any });
      } catch (e) {
        console.warn('Auto QC failed:', e);
      }
    }
  },

  setCurahHujanWilayah: (curahHujanWilayah) => set((state) => ({
    curahHujanWilayah: { ...state.curahHujanWilayah, ...curahHujanWilayah }
  })),

  setHasilThiessen: (hasilThiessen) => set({ hasilThiessen }),
  setHasilARF: (hasilARF) => set({ hasilARF }),

  setAnalisisFrekuensi: (analisisFrekuensi) => set((state) => ({
    analisisFrekuensi: { ...state.analisisFrekuensi, ...analisisFrekuensi }
  })),

  setHasilAnalisisFrekuensi: (hasilAnalisisFrekuensi) => set({
    hasilAnalisisFrekuensi,
    curahHujanRencana: hasilAnalisisFrekuensi?.curahHujanRencana || []
  }),

  setSelectedKalaUlang: (selectedKalaUlang) => set((state) => ({
    selectedKalaUlang,
    analisisFrekuensi: { ...state.analisisFrekuensi, selectedKalaUlang: selectedKalaUlang as any },
    hasilAnalisisFrekuensi: state.hasilAnalisisFrekuensi ? { ...state.hasilAnalisisFrekuensi, selectedKalaUlang } : null
  })),

  setQCCalculating: (isQCCalculating) => set({ isQCCalculating }),
  setQCOverride: (isQCOverridden) => set({ isQCOverridden }),
  setQCStatus: (qcStatus) => set({ qcStatus }),
  setQCResults: (qcResults) => set({ qcResults }),
  setStasiunAmsData: (stasiunAmsData) => set({ stasiunAmsData }),
  
  setActiveRainfallSource: (activeRainfallSource) => set({ activeRainfallSource }),
  
  setArealRainfallData: (type, data) => set((state) => {
    const safeData = data || [];
    switch (type) {
      case 'aljabar': return { arealRainfallAlgebraic: safeData };
      case 'thiessen': return { arealRainfallThiessen: safeData };
      case 'isohyet': return { arealRainfallIsohyet: safeData };
      default: return state;
    }
  }),

  fetchStasiun: async () => {
    if (!supabase) return;
    set({ isLoading: true, error: null });
    
    const executeFetch = async (retries = 3): Promise<any> => {
      try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase.from('master_stasiun').select('*').order('nama_stasiun');
        if (error) throw error;
        return data;
      } catch (err: any) {
        if (retries > 0 && (err.message?.includes('fetch') || err.status === 502)) {
          await new Promise(r => setTimeout(r, 1000));
          return executeFetch(retries - 1);
        }
        throw err;
      }
    };

    try {
      const data = await executeFetch();
      set({ stasiunList: data || [] });
    } catch (err: any) {
      const isPaused = err.message?.includes('fetch') || err.message?.includes('Failed to fetch');
      const msg = isPaused ? 'Database Offline (Supabase Paused?). Pastikan project Supabase aktif.' : err.message;
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMultipleStationsData: async (ids) => {
    if (!supabase || ids.length === 0) return;
    set({ isLoading: true, error: null });
    
    try {
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 500; 

      const fetchPageWithRetry = async (currentPage: number, retries = 3): Promise<any> => {
        try {
          if (!supabase) throw new Error('Supabase client not initialized');
          const { data, error } = await supabase
            .from('master_data_hujan')
            .select('*')
            .in('stasiun_id', ids)
            .order('tanggal', { ascending: true })
            .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

          if (error) throw error;
          return data;
        } catch (err: any) {
          if (retries > 0 && (err.message?.includes('fetch') || err.status === 502)) {
            await new Promise(r => setTimeout(r, 1500)); 
            return fetchPageWithRetry(currentPage, retries - 1);
          }
          throw err;
        }
      };

      while (hasMore) {
        const data = await fetchPageWithRetry(page);

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
            await new Promise(r => setTimeout(r, 100));
          }
        } else {
          hasMore = false;
        }
      }
      set({ dataHujan: allData });
    } catch (err: any) {
      const isPaused = err.message?.includes('fetch') || err.message?.includes('Failed to fetch');
      const msg = isPaused ? 'Koneksi Cloud Terputus. Periksa internet atau status Supabase.' : err.message;
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ isLoading: false });
    }
  },
  
  addStasiun: async (stasiun) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('master_stasiun').insert([stasiun]).select().single();
      if (error) throw error;
      set((state) => ({ stasiunList: [...state.stasiunList, data] }));
      toast.success('Stasiun berhasil ditambahkan.');
    } catch (err: any) {
      toast.error(err.message);
    }
  },
  
  updateStasiun: async (id, stasiun) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('master_stasiun').update(stasiun).eq('id', id).select().single();
      if (error) throw error;
      set((state) => ({
        stasiunList: state.stasiunList.map(s => s.id === id ? data : s),
        selectedStasiun: state.selectedStasiun?.id === id ? data : state.selectedStasiun
      }));
      toast.success('Stasiun berhasil diperbarui.');
    } catch (err: any) {
      toast.error(err.message);
    }
  },
  
  deleteStasiun: async (id) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('master_stasiun').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        stasiunList: state.stasiunList.filter(s => s.id !== id),
        selectedStasiun: state.selectedStasiun?.id === id ? null : state.selectedStasiun,
        projectStationIds: state.projectStationIds.filter(pid => pid !== id)
      }));
      toast.success('Stasiun berhasil dihapus.');
    } catch (err: any) {
      toast.error(err.message);
    }
  },
  
  addDataHujan: async (data) => {
    if (!supabase) return;
    try {
      const { data: result, error } = await supabase.from('master_data_hujan').insert([data]).select().single();
      if (error) throw error;
      set((state) => ({ dataHujan: [...state.dataHujan, result] }));
      toast.success('Data hujan berhasil ditambahkan.');
    } catch (err: any) {
      toast.error(err.message);
    }
  },
  
  importDataHujanBatch: async (data) => {
    if (!supabase || data.length === 0) return;
    try {
      const validData = data.filter(d => d.stasiun_id && d.tanggal);
      if (validData.length === 0) throw new Error('Data tidak valid: stasiun_id atau tanggal kosong.');

      const { error } = await supabase
        .from('master_data_hujan')
        .upsert(validData, { 
          onConflict: 'stasiun_id, tanggal',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      
      const currentId = get().selectedStasiun?.id;
      if (currentId && validData.some(d => d.stasiun_id === currentId)) {
        get().fetchMultipleStationsData([currentId]);
      }
      
      toast.success(`${validData.length} data hujan berhasil disinkronkan.`);
    } catch (err: any) {
      toast.error('Gagal impor batch: ' + err.message);
    }
  },
  
  deleteDataHujanByYear: async (stasiunId, year) => {
    if (!supabase) return;
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const { error } = await supabase
        .from('master_data_hujan')
        .delete()
        .eq('stasiun_id', stasiunId)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);
      if (error) throw error;
      set((state) => ({
        dataHujan: state.dataHujan.filter(d => d.stasiun_id !== stasiunId || new Date(d.tanggal).getFullYear() !== year)
      }));
      toast.success(`Data hujan tahun ${year} berhasil dihapus.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  },
  
  updateDataHujanSingle: async (stasiunId, date, val, metadata = {}) => {
    if (!supabase) return;
    try {
      const payload = { 
        stasiun_id: stasiunId, 
        tanggal: date, 
        curah_hujan: val,
        ...metadata
      };
      
      const { data, error } = await supabase
        .from('master_data_hujan')
        .upsert(payload, { onConflict: 'stasiun_id, tanggal' })
        .select()
        .single();
      if (error) throw error;
      set((state) => ({
        dataHujan: state.dataHujan.map(d => (d.stasiun_id === stasiunId && d.tanggal === date) ? data : d)
      }));
    } catch (err: any) {
      toast.error(err.message);
    }
  },

  syncRainfallMetadata: async () => {
    const { dataHujan } = get();
    if (!supabase || dataHujan.length === 0) return;
    
    set({ isLoading: true });
    try {
      const batchSize = 500;
      for (let i = 0; i < dataHujan.length; i += batchSize) {
        const batch = dataHujan.slice(i, i + batchSize).map(d => ({
          stasiun_id: d.stasiun_id,
          tanggal: d.tanggal,
          curah_hujan: d.curah_hujan,
          is_infilled: d.is_infilled || false,
          infilled_from: d.infilled_from || null,
          anomaly_type: d.anomaly_type || null,
          keterangan: d.keterangan || null
        }));
        
        const { error } = await supabase
          .from('master_data_hujan')
          .upsert(batch, { onConflict: 'stasiun_id, tanggal' });
          
        if (error) throw error;
      }
      toast.success('Metadata kualitas data berhasil disinkronkan ke cloud.');
    } catch (err: any) {
      toast.error(`Sinkronisasi gagal: ${err.message}`);
    } finally {
      set({ isLoading: false });
    }
  },
  
  seedInitialStations: async () => {
    if (!supabase) return;
    set({ isLoading: true });
    try {
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

      const { error } = await supabase
        .from('master_stasiun')
        .insert(initialStations);

      if (error && (error as any).code !== '23505') { 
        throw error;
      }
      await get().fetchStasiun();
      toast.success('Stasiun awal berhasil di-seed.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error) => set({ error }),

  resetRainfall: () => {
    set({
      stasiunList: [],
      selectedStasiun: null,
      projectStationIds: [],
      dataHujan: [],
      curahHujanWilayah: initialHujanWilayah,
      hasilThiessen: null,
      hasilARF: null,
      analisisFrekuensi: initialAnalisisFrekuensi,
      hasilAnalisisFrekuensi: null,
      curahHujanRencana: [],
      selectedKalaUlang: null,
      isQCCalculating: false,
      isQCOverridden: false,
      qcStatus: null,
      qcResults: null,
      stasiunAmsData: {},
      activeRainfallSource: 'titik',
      arealRainfallAlgebraic: [],
      arealRainfallThiessen: [],
      arealRainfallIsohyet: [],
      rentangTahun: null,
      isLoading: false,
      error: null
    });
  }
});
