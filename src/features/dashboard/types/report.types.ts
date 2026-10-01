/**
 * =============================================================================
 * Tipe Data Laporan Eksekutif & Ringkasan Teknis Rekayasa SDA / SNI
 * Modul: Executive Dashboard & Reporting Engine
 * =============================================================================
 */

export interface ReportKopData {
  instansi: string;
  balai: string;
  subTitle: string;
  nomorDokumen: string;
  tanggalDokumen: string;
  statusDokumen: 'DRAFT' | 'REVIEW' | 'FINAL';
  penandatangan: {
    penyusun: string;
    jabatanPenyusun: string;
    verifikator: string;
    jabatanVerifikator: string;
    penggunaJasa: string;
    jabatanPenggunaJasa: string;
  };
}

export interface ReportIdentitasData {
  namaPekerjaan: string;
  namaDAS?: string;
  provinsi?: string;
  kabupaten?: string;
  tahunAnalisis?: number;
  latitude?: number;
  longitude?: number;
  luasDas?: number; // km²
  panjangSungai?: number; // km
  kemiringanSungai?: number; // m/m or %
  waktuKonsentrasi?: number; // jam
  koefisienLimpasan?: number; // C atau CN
}

export interface ReportFrekuensiData {
  metodeTerpilih: string;
  lulusUji: boolean;
  curahHujanRencana: { Tr: number; R24: number }[];
  ujiStatistik?: {
    metodeUji: string;
    nilaiHitung?: number;
    nilaiKritis?: number;
    kesimpulan: string;
  };
}

export interface ReportBanjirData {
  metode: string;
  debitPuncak: number; // m³/s
  waktuPuncak: number; // jam
  volumeTotal: number; // m³
  returnPeriods?: { period: number; qPeak: number }[];
}

export interface ReportNeracaData {
  bulanKritis: string;
  ikaPercent?: number;
  ikaStatus?: string;
  totalKetersediaan: number; // m³/s kumulatif atau juta m³
  totalKebutuhan: number; // m³/s kumulatif atau juta m³
  netBalance: number;
  storageRequiredM3?: number;
  monthlyRows: {
    bulan: string;
    ketersediaan: number;
    kebutuhan: number;
    neraca: number;
    status: string;
  }[];
}

export interface ReportEmbungData {
  isAman: boolean;
  reduksiPuncak: number; // %
  umurSedimen: number; // tahun
  effectiveStorage?: number; // m³
  deadStorage?: number; // m³
  totalCapacity?: number; // m³
  maxElevation?: number; // m DPL
  peakInflow?: number; // m³/s
  peakOutflow?: number; // m³/s
}

export interface ReportSaluranData {
  shape: string;
  channelName?: string;
  dischargeCapacity: number; // m³/s
  designDischarge?: number; // m³/s
  velocity: number; // m/s
  froudeNumber: number;
  flowRegime: string;
  isSafe: boolean;
  isVelocitySafe: boolean;
  velocityStatus: string;
  freeboardActual: number; // m
  freeboardRecommended: number; // m
  materialName?: string;
  manningN?: number;
  bedSlope?: number;
  dimensions?: {
    width?: number;
    depth?: number;
    totalDepth?: number;
    sideSlope?: number;
    diameter?: number;
  };
}

export interface ReportSectionsConfig {
  showKop: boolean;
  showIdentitas: boolean;
  showFrekuensi: boolean;
  showBanjir: boolean;
  showNeraca: boolean;
  showEmbung: boolean;
  showSaluran: boolean;
  showPengesahan: boolean;
  showAiSummary: boolean;
}

export interface ExecutiveReportPayload {
  kop: ReportKopData;
  identitas: ReportIdentitasData;
  frekuensi?: ReportFrekuensiData;
  banjir?: ReportBanjirData;
  neraca?: ReportNeracaData;
  embung?: ReportEmbungData;
  saluran?: ReportSaluranData;
  rekomendasiTeknis: string[];
  aiSummary?: string;
  sectionsConfig: ReportSectionsConfig;
}
