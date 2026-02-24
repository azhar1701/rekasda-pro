import { create } from 'zustand';

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

export interface HasilBanjir {
  debitPuncak: number;
  hidrograf: { time: number; inflow: number }[];
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

export interface HydrologyState {
  // State Fundamental
  luasDas: string;
  stasiunList: StasiunHidrologi[];
  selectedStasiun: StasiunHidrologi | null;
  
  // State Data Output
  dataHujan: DataHujan[];
  hasilBanjir: HasilBanjir | null;
  hasilNeraca: HasilNeraca | null;
  hasilEmbung: HasilEmbung | null;
  
  // State Tracking / Validation
  isBanjirDirty: boolean;
  isNeracaDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions Basic
  setLuasDas: (luas: string) => void;
  fetchStasiun: () => Promise<void>;
  selectStasiun: (stasiun: StasiunHidrologi | null) => void;
  fetchDataHujan: (stasiunId: string, tahun?: number) => Promise<void>;
  setHasilBanjir: (hasil: HasilBanjir | null) => void;
  setHasilNeraca: (hasil: HasilNeraca | null) => void;
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
  stasiunList: [],
  selectedStasiun: null,
  dataHujan: [],
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
  isBanjirDirty: false,
  isNeracaDirty: false,
  isLoading: false,
  error: null,

  // Setters statis murni
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Setters dengan Dependency Tracking (DIRTY STATE MIDDLEWARE)
  setLuasDas: (luas) => set((state) => {
    if (state.luasDas !== luas) {
      return { luasDas: luas, isBanjirDirty: true, isNeracaDirty: true };
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
      
      if (stasiun) {
        get().fetchDataHujan(stasiun.id, new Date().getFullYear());
      }
    }
  },

  setHasilBanjir: (hasil) => set({ hasilBanjir: hasil, isBanjirDirty: false }),
  setHasilNeraca: (hasil) => set({ hasilNeraca: hasil, isNeracaDirty: false }),
  setHasilEmbung: (hasil) => set({ hasilEmbung: hasil }),

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
