/**
 * =============================================================================
 * Layanan Manajemen Paket Proyek Mandiri (.rekasda / JSON Package)
 * RekasDA Pro — Platform Rekayasa Analisis SDA & Hidrologi (SNI Compliant)
 * =============================================================================
 * Menyediakan kapabilitas ekspor, impor, validasi integritas, dan restorasi
 * seluruh data pemodelan terpadu (Identitas, Morfometri DAS, Tutupan Lahan,
 * Stasiun & Deret Hujan Harian, Frekuensi, Banjir, Neraca, Embung, Saluran).
 */

import { type HydrologyState } from '@/stores/useHydrologyStore';

export const CURRENT_PROJECT_SCHEMA_VERSION = '1.1';

export interface ProjectMetadata {
  projectName: string;
  dasName: string;
  riverName: string;
  location: string;
  author: string;
  institution: string;
  createdAt: string;
  exportedAt: string;
  schemaVersion: string;
  app: 'RekasDA Pro';
  totalStations: number;
  totalDailyRecords: number;
  notes?: string;
}

export interface ProjectPackagePayload {
  app: 'RekasDA Pro';
  schemaVersion: string;
  metadata: ProjectMetadata;
  state: {
    identitasLokasi: HydrologyState['identitasLokasi'];
    morfometriDAS: HydrologyState['morfometriDAS'];
    tutupanLahan: HydrologyState['tutupanLahan'];
    stasiunList: HydrologyState['stasiunList'];
    curahHujanWilayah: HydrologyState['curahHujanWilayah'];
    activeRainfallSource: HydrologyState['activeRainfallSource'];
    dataHujan: HydrologyState['dataHujan'];
    arealRainfallAlgebraic: HydrologyState['arealRainfallAlgebraic'];
    arealRainfallThiessen: HydrologyState['arealRainfallThiessen'];
    arealRainfallIsohyet: HydrologyState['arealRainfallIsohyet'];
    analisisFrekuensi: HydrologyState['analisisFrekuensi'];
    selectedKalaUlang: HydrologyState['selectedKalaUlang'];
    curahHujanRencana: HydrologyState['curahHujanRencana'];
    hasilARF: HydrologyState['hasilARF'];
    distribusiHujanJamJaman: HydrologyState['distribusiHujanJamJaman'];
    durasiHujan: HydrologyState['durasiHujan'];
    hujanEfektif: HydrologyState['hujanEfektif'];
    hasilBanjir: HydrologyState['hasilBanjir'];
    hasilBanjirEmpiris: HydrologyState['hasilBanjirEmpiris'];
    hasilBanjirHSS: HydrologyState['hasilBanjirHSS'];
    hasilKonvolusi: HydrologyState['hasilKonvolusi'];
    hasilNeraca: HydrologyState['hasilNeraca'];
    hasilMock: HydrologyState['hasilMock'];
    neracaFinal: HydrologyState['neracaFinal'];
    hasilEmbung: HydrologyState['hasilEmbung'];
    hasilSaluran: HydrologyState['hasilSaluran'];
    qcResults: HydrologyState['qcResults'];
    qcStatus: HydrologyState['qcStatus'];
  };
  summary: {
    hasFrequency: boolean;
    hasFlood: boolean;
    hasWaterBalance: boolean;
    hasEmbung: boolean;
    hasChannel: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  payload?: ProjectPackagePayload;
}

/**
 * Menghasilkan objek paket data proyek utuh dari state aktif aplikasi
 */
export function exportProjectBundle(
  state: HydrologyState,
  customMetadata?: Partial<ProjectMetadata>
): ProjectPackagePayload {
  const identitas = state.identitasLokasi;
  const now = new Date().toISOString();

  const metadata: ProjectMetadata = {
    projectName: customMetadata?.projectName || identitas?.namaPekerjaan || 'Proyek Hidrologi SDA',
    dasName: customMetadata?.dasName || identitas?.namaDAS || (state.morfometriDAS ? 'DAS Model' : 'DAS Tidak Terdefinisi'),
    riverName: customMetadata?.riverName || identitas?.namaSungai || '-',
    location: customMetadata?.location || `${identitas?.kabupaten || '-'}, ${identitas?.provinsi || '-'}`,
    author: customMetadata?.author || 'Tim Ahli Hidrologi',
    institution: customMetadata?.institution || 'Direktorat Jenderal Sumber Daya Air / Konsultan Perencana',
    createdAt: customMetadata?.createdAt || now,
    exportedAt: now,
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    app: 'RekasDA Pro',
    totalStations: state.stasiunList?.length || 0,
    totalDailyRecords: state.dataHujan?.length || 0,
    notes: customMetadata?.notes || ''
  };

  const payload: ProjectPackagePayload = {
    app: 'RekasDA Pro',
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    metadata,
    state: {
      identitasLokasi: state.identitasLokasi,
      morfometriDAS: state.morfometriDAS,
      tutupanLahan: state.tutupanLahan,
      stasiunList: state.stasiunList || [],
      curahHujanWilayah: state.curahHujanWilayah,
      activeRainfallSource: state.activeRainfallSource || 'titik',
      dataHujan: state.dataHujan || [],
      arealRainfallAlgebraic: state.arealRainfallAlgebraic || null,
      arealRainfallThiessen: state.arealRainfallThiessen || null,
      arealRainfallIsohyet: state.arealRainfallIsohyet || null,
      analisisFrekuensi: state.analisisFrekuensi || null,
      selectedKalaUlang: state.selectedKalaUlang || 25,
      curahHujanRencana: state.curahHujanRencana || '0',
      hasilARF: state.hasilARF || null,
      distribusiHujanJamJaman: state.distribusiHujanJamJaman || null,
      durasiHujan: state.durasiHujan || 6,
      hujanEfektif: state.hujanEfektif || null,
      hasilBanjir: state.hasilBanjir || null,
      hasilBanjirEmpiris: state.hasilBanjirEmpiris || null,
      hasilBanjirHSS: state.hasilBanjirHSS || null,
      hasilKonvolusi: state.hasilKonvolusi || null,
      hasilNeraca: state.hasilNeraca || null,
      hasilMock: state.hasilMock || null,
      neracaFinal: state.neracaFinal || null,
      hasilEmbung: state.hasilEmbung || null,
      hasilSaluran: state.hasilSaluran || null,
      qcResults: state.qcResults || null,
      qcStatus: state.qcStatus || null,
    },
    summary: {
      hasFrequency: Boolean(state.analisisFrekuensi?.metodeTerpilih),
      hasFlood: Boolean(state.hasilBanjir?.debitPuncak),
      hasWaterBalance: Boolean(state.hasilNeraca?.totalSurplusDefisit !== undefined),
      hasEmbung: Boolean(state.hasilEmbung?.reduksiPuncak),
      hasChannel: Boolean(state.hasilSaluran?.dischargeCapacity),
    }
  };

  return payload;
}

/**
 * Memicu unduhan file paket proyek (.rekasda atau .json) ke komputer pengguna
 */
export function downloadProjectFile(
  payload: ProjectPackagePayload,
  customFilename?: string
): void {
  if (typeof window === 'undefined') return;

  const rawJson = JSON.stringify(payload, null, 2);
  const blob = new Blob([rawJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanName = (payload.metadata.projectName || 'Proyek_Hidrologi')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `${cleanName}_${dateStr}.rekasda`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validasi dan parse isi berkas teks proyek
 */
export function validateAndParseProjectContent(rawContent: string): ValidationResult {
  try {
    const parsed = JSON.parse(rawContent);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Berkas tidak berisi format JSON objek yang valid.' };
    }

    if (parsed.app !== 'RekasDA Pro') {
      return { isValid: false, error: 'Format berkas tidak dikenali. Berkas harus dibuat oleh RekasDA Pro.' };
    }

    if (!parsed.metadata || !parsed.state) {
      return { isValid: false, error: 'Struktur paket proyek tidak lengkap (metadata atau state hilang).' };
    }

    if (!Array.isArray(parsed.state.stasiunList)) {
      return { isValid: false, error: 'Data stasiun hidrologi dalam berkas korup atau tidak valid.' };
    }

    return {
      isValid: true,
      payload: parsed as ProjectPackagePayload
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Gagal membaca isi berkas: ${err.message || 'Format tidak valid'}`
    };
  }
}

/**
 * Membaca File dari input drag-and-drop / file input dan memvalidasinya
 */
export async function readProjectFile(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        resolve({ isValid: false, error: 'Berkas kosong atau tidak dapat dibaca.' });
        return;
      }
      resolve(validateAndParseProjectContent(content));
    };
    reader.onerror = () => {
      resolve({ isValid: false, error: 'Terjadi kesalahan saat membaca berkas dari disk.' });
    };
    reader.readAsText(file);
  });
}

/**
 * Menerapkan data paket proyek ke Zustand Hydrology Store
 */
export function applyProjectToStore(
  payload: ProjectPackagePayload,
  setStoreState: (partial: Partial<HydrologyState>) => void
): void {
  const { state } = payload;

  setStoreState({
    identitasLokasi: state.identitasLokasi,
    morfometriDAS: state.morfometriDAS,
    tutupanLahan: state.tutupanLahan,
    stasiunList: state.stasiunList || [],
    selectedStasiun: state.stasiunList?.[0] || null,
    curahHujanWilayah: state.curahHujanWilayah,
    activeRainfallSource: state.activeRainfallSource || 'titik',
    dataHujan: state.dataHujan || [],
    arealRainfallAlgebraic: state.arealRainfallAlgebraic || null,
    arealRainfallThiessen: state.arealRainfallThiessen || null,
    arealRainfallIsohyet: state.arealRainfallIsohyet || null,
    analisisFrekuensi: state.analisisFrekuensi || null,
    selectedKalaUlang: state.selectedKalaUlang || 25,
    curahHujanRencana: state.curahHujanRencana || '0',
    hasilARF: state.hasilARF || null,
    distribusiHujanJamJaman: state.distribusiHujanJamJaman || null,
    durasiHujan: state.durasiHujan || 6,
    hujanEfektif: state.hujanEfektif || null,
    hasilBanjir: state.hasilBanjir || null,
    hasilBanjirEmpiris: state.hasilBanjirEmpiris || null,
    hasilBanjirHSS: state.hasilBanjirHSS || null,
    hasilKonvolusi: state.hasilKonvolusi || null,
    hasilNeraca: state.hasilNeraca || null,
    hasilMock: state.hasilMock || null,
    neracaFinal: state.neracaFinal || null,
    hasilEmbung: state.hasilEmbung || null,
    hasilSaluran: state.hasilSaluran || null,
    qcResults: state.qcResults || null,
    qcStatus: state.qcStatus || null,
    isFrekuensiDirty: false,
    isBanjirDirty: false,
    isNeracaDirty: false,
    error: null,
    isLoading: false,
  });
}
