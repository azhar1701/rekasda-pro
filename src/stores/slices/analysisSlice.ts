import { StateCreator } from 'zustand';
import { 
 HasilBanjir, 
 HasilNeraca, 
 HasilEmbung, 
 TutupanLahan, 
 HSSComparisonResult,
 HasilKonvolusi,
 HasilMock,
 NeracaFinalRow
} from '@/types/hydrology.types';

export interface AnalysisSlice {
 // State
 tutupanLahan: TutupanLahan;
 landCoverParams: any; // Legacy name
 hasilBanjir: HasilBanjir | null;
 hasilBanjirEmpiris: HasilBanjir | null;
 hasilBanjirHSS: HasilBanjir | null;
 hssComparison: HSSComparisonResult[] | null;
 hasilKonvolusi: HasilKonvolusi | null;
 hasilNeraca: HasilNeraca | null;
 hasilMock: HasilMock | null;
 neracaFinal: NeracaFinalRow[];
 hasilEmbung: HasilEmbung | null;
 durasiHujan: number;
 hujanEfektif: number[] | null;
 
 // Dirty Flags
 isBanjirDirty: boolean;
 isNeracaDirty: boolean;

 // Actions
 saveTutupanLahan: (tutupanLahan: TutupanLahan) => void;
 setTutupanLahan: (tutupanLahan: TutupanLahan) => void; // Legacy name
 setHasilBanjir: (hasil: HasilBanjir | null) => void;
 setHasilBanjirEmpiris: (hasil: HasilBanjir | null) => void;
 setHasilBanjirHSS: (hasil: HasilBanjir | null) => void;
 setHSSComparison: (results: HSSComparisonResult[] | null) => void;
 setHasilKonvolusi: (hasil: HasilKonvolusi | null) => void;
 setHasilNeraca: (hasil: HasilNeraca | null) => void;
 setHasilMock: (hasil: HasilMock | null) => void;
 setNeracaFinal: (neraca: NeracaFinalRow[]) => void;
 setHasilEmbung: (hasil: HasilEmbung | null) => void;
 setBanjirDirty: (dirty: boolean) => void;
 setNeracaDirty: (dirty: boolean) => void;
 setDurasiHujan: (durasi: number) => void;
 setHujanEfektif: (hujanEfektif: number[] | null) => void;
 resetAnalysis: () => void;
}

const initialTutupanLahan: TutupanLahan = {
 items: [],
 koefisienPengaliranGabungan: 0,
 curveNumberGabungan: 0,
 totalLuas: 0
};

export const createAnalysisSlice: StateCreator<AnalysisSlice> = (set) => ({
 tutupanLahan: initialTutupanLahan,
 landCoverParams: null,
 hasilBanjir: null,
 hasilBanjirEmpiris: null,
 hasilBanjirHSS: null,
 hssComparison: null,
 hasilKonvolusi: null,
 hasilNeraca: null,
 hasilMock: null,
 neracaFinal: [],
 hasilEmbung: null,
 durasiHujan: 24,
 hujanEfektif: null,
 isBanjirDirty: true,
 isNeracaDirty: true,

 saveTutupanLahan: (tutupanLahan) => set({ 
 tutupanLahan,
 landCoverParams: {
 C: tutupanLahan.koefisienPengaliranGabungan,
 CN: tutupanLahan.curveNumberGabungan,
 method: 'C'
 }
 }),

 setTutupanLahan: (tutupanLahan) => set({ 
 tutupanLahan,
 landCoverParams: {
 C: tutupanLahan.koefisienPengaliranGabungan,
 CN: tutupanLahan.curveNumberGabungan,
 method: 'C'
 }
 }),

 setHasilBanjir: (hasilBanjir) => set({ hasilBanjir }),
 setHasilBanjirEmpiris: (hasilBanjirEmpiris) => set({ hasilBanjirEmpiris }),
 setHasilBanjirHSS: (hasilBanjirHSS) => set({ hasilBanjirHSS }),
 
 setHSSComparison: (hssComparison) => set({ hssComparison }),
 setHasilKonvolusi: (hasilKonvolusi) => set({ hasilKonvolusi }),
 setHasilNeraca: (hasilNeraca) => set({ hasilNeraca }),
 setHasilMock: (hasilMock) => set({ hasilMock }),
 setNeracaFinal: (neracaFinal) => set({ neracaFinal }),
 setHasilEmbung: (hasilEmbung) => set({ hasilEmbung }),
 
 setBanjirDirty: (isBanjirDirty) => set({ isBanjirDirty }),
 setNeracaDirty: (isNeracaDirty) => set({ isNeracaDirty }),
 setDurasiHujan: (durasiHujan) => set({ durasiHujan }),
 setHujanEfektif: (hujanEfektif) => set({ hujanEfektif }),

 resetAnalysis: () => set({
 tutupanLahan: initialTutupanLahan,
 landCoverParams: null,
 hasilBanjir: null,
 hasilBanjirEmpiris: null,
 hasilBanjirHSS: null,
 hssComparison: null,
 hasilKonvolusi: null,
 hasilNeraca: null,
 hasilMock: null,
 neracaFinal: [],
 hasilEmbung: null,
 durasiHujan: 24,
 hujanEfektif: null,
 isBanjirDirty: true,
 isNeracaDirty: true
 })
});
