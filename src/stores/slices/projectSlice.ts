import { StateCreator } from 'zustand';
import { IdentitasLokasi, MorfometriDAS } from '@/types/hydrology.types';

export interface ProjectSlice {
  // State
  identitasLokasi: IdentitasLokasi;
  morfometriDAS: MorfometriDAS;
  luasDas: any; // Allow string or number for legacy compatibility
  panjangSungai: any;
  
  // Actions
  setIdentitasLokasi: (identitas: Partial<IdentitasLokasi>) => void;
  updateMorfometriDAS: (morfometri: Partial<MorfometriDAS>) => void;
  saveMorfometriDAS: (morfometri: MorfometriDAS) => void;
  setLuasDas: (luas: any) => void;
  setPanjangSungai: (panjang: any) => void;
  resetProject: () => void;
}

const initialIdentitas: IdentitasLokasi = {
  namaPekerjaan: '',
  namaDAS: '',
  namaSungai: '',
  provinsi: '',
  kabupaten: '',
  koordinat: { lat: null, lng: null }
};

const initialMorfometri: MorfometriDAS = {
  luasDAS: 0,
  panjangSungai: 0,
  kemiringanSungai: 0,
  elevasi: 0
};

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  identitasLokasi: initialIdentitas,
  morfometriDAS: initialMorfometri,
  luasDas: 0,
  panjangSungai: 0,

  setIdentitasLokasi: (identitas) => set((state) => ({
    identitasLokasi: { ...state.identitasLokasi, ...identitas }
  })),

  updateMorfometriDAS: (morfometri) => set((state) => ({
    morfometriDAS: { ...state.morfometriDAS, ...morfometri },
    luasDas: morfometri.luasDAS ?? state.luasDas,
    panjangSungai: morfometri.panjangSungai ?? state.panjangSungai
  })),

  saveMorfometriDAS: (morfometri) => set({
    morfometriDAS: morfometri,
    luasDas: morfometri.luasDAS,
    panjangSungai: morfometri.panjangSungai
  }),

  setLuasDas: (luasDas) => set((state) => ({
    luasDas,
    morfometriDAS: { ...state.morfometriDAS, luasDAS: typeof luasDas === 'string' ? parseFloat(luasDas) || 0 : luasDas }
  })),

  setPanjangSungai: (panjangSungai) => set((state) => ({
    panjangSungai,
    morfometriDAS: { ...state.morfometriDAS, panjangSungai: typeof panjangSungai === 'string' ? parseFloat(panjangSungai) || 0 : panjangSungai }
  })),

  resetProject: () => set({
    identitasLokasi: initialIdentitas,
    morfometriDAS: initialMorfometri,
    luasDas: 0,
    panjangSungai: 0
  })
});
