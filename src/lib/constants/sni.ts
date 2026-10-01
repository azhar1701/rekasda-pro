/**
 * SNI Constants for Hydrological Calculations
 * Based on:
 * - SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana)
 * - Permen PU No. 12/PRT/M/2014 (Penyelenggaraan Sistem Drainase Perkotaan)
 * - SK Menteri PU No. 306/1989
 * - Suripin (2004) - Sistem Drainase Perkotaan Berkelanjutan
 */

export interface RunoffCoefficientData {
  value: number;
  description: string;
  source: string;
  category: 'urban' | 'rural' | 'surface';
}

export interface ManningRoughnessData {
  value: number;
  description: string;
  source: string;
  category: 'natural' | 'artificial';
}

export interface HSSParameter {
  alpha: number;
  description: string;
  range: { min: number; max: number };
  source: string;
}

/**
 * Koefisien Pengaliran (C) - Runoff Coefficients
 * Sumber: Permen PU No. 12/PRT/M/2014 & Suripin (2004)
 */
export const SNI_RUNOFF_COEFFICIENTS: Record<string, RunoffCoefficientData> = {
  // Permukaan Jalan
  JALAN_ASPAL: {
    value: 0.95,
    description: 'Jalan Aspal',
    source: 'Permen PU 12/2014',
    category: 'surface',
  },
  JALAN_BETON: {
    value: 0.95,
    description: 'Jalan Beton',
    source: 'Permen PU 12/2014',
    category: 'surface',
  },
  JALAN_PAVING: {
    value: 0.85,
    description: 'Jalan Paving Block',
    source: 'Suripin 2004',
    category: 'surface',
  },

  // Kawasan Perkotaan
  PUSAT_KOTA: {
    value: 0.85,
    description: 'Pusat Kota (Kawasan Komersial)',
    source: 'Permen PU 12/2014',
    category: 'urban',
  },
  PEMUKIMAN_PADAT: {
    value: 0.70,
    description: 'Pemukiman Padat',
    source: 'Suripin 2004',
    category: 'urban',
  },
  PEMUKIMAN_SEDANG: {
    value: 0.50,
    description: 'Pemukiman Sedang',
    source: 'Suripin 2004',
    category: 'urban',
  },
  PEMUKIMAN_JARANG: {
    value: 0.30,
    description: 'Pemukiman Jarang',
    source: 'Suripin 2004',
    category: 'urban',
  },

  // Kawasan Terbuka
  TAMAN: {
    value: 0.15,
    description: 'Taman dan Ruang Terbuka Hijau',
    source: 'Permen PU 12/2014',
    category: 'urban',
  },
  LAPANGAN: {
    value: 0.20,
    description: 'Lapangan Olahraga',
    source: 'Suripin 2004',
    category: 'urban',
  },

  // Kawasan Rural
  HUTAN: {
    value: 0.15,
    description: 'Hutan Lebat',
    source: 'Suripin 2004',
    category: 'rural',
  },
  PERTANIAN: {
    value: 0.30,
    description: 'Lahan Pertanian',
    source: 'Suripin 2004',
    category: 'rural',
  },
  TANAH_GUNDUL: {
    value: 0.60,
    description: 'Tanah Terbuka/Gundul',
    source: 'Suripin 2004',
    category: 'rural',
  },
};

/**
 * Koefisien Kekasaran Manning (n)
 * Sumber: Modul Drainase Perkotaan & SNI 2415:2016
 */
export const SNI_MANNING_ROUGHNESS: Record<string, ManningRoughnessData> = {
  // Saluran Buatan
  BETON_HALUS: {
    value: 0.013,
    description: 'Beton Halus (Finishing Sendok)',
    source: 'SNI 2415:2016',
    category: 'artificial',
  },
  BETON_KASAR: {
    value: 0.015,
    description: 'Beton Kasar',
    source: 'SNI 2415:2016',
    category: 'artificial',
  },
  PASANGAN_BATU: {
    value: 0.025,
    description: 'Pasangan Batu Kali (Semen)',
    source: 'Modul Drainase',
    category: 'artificial',
  },
  BAJA: {
    value: 0.012,
    description: 'Pipa Baja',
    source: 'SNI 2415:2016',
    category: 'artificial',
  },
  PVC: {
    value: 0.010,
    description: 'Pipa PVC',
    source: 'SNI 2415:2016',
    category: 'artificial',
  },

  // Saluran Alami
  TANAH_BERSIH: {
    value: 0.022,
    description: 'Saluran Tanah Bersih',
    source: 'SNI 2415:2016',
    category: 'natural',
  },
  TANAH_KERIKIL: {
    value: 0.030,
    description: 'Saluran Tanah Berkerikil',
    source: 'SNI 2415:2016',
    category: 'natural',
  },
  BERUMPUT: {
    value: 0.035,
    description: 'Saluran Alami Berumput',
    source: 'SNI 2415:2016',
    category: 'natural',
  },
  SUNGAI_BERLIKU: {
    value: 0.045,
    description: 'Sungai Alami Berliku',
    source: 'SNI 2415:2016',
    category: 'natural',
  },
};

/**
 * Parameter HSS Nakayasu
 * Sumber: SNI 2415:2016 Pasal 6.3
 */
export const SNI_HSS_NAKAYASU: HSSParameter = {
  alpha: 2.0,
  description: 'Parameter Hidrograf Satuan Sintetik Nakayasu (Standard)',
  range: { min: 1.5, max: 3.0 },
  source: 'SNI 2415:2016 Pasal 6.3',
};

/**
 * Konstanta Konversi Metode Rasional
 * Q = 0.278 * C * I * A
 * 0.278 = Faktor konversi dari mm/jam ke m³/s untuk luas dalam km²
 */
export const RATIONAL_CONVERSION_FACTOR = 0.278;

/**
 * Batas Luas DAS untuk Metode Rasional (SNI 2415:2016 Pasal 5.2)
 * Metode Rasional berlaku untuk DAS ≤ 5000 ha (50 km²)
 */
export const SNI_RATIONAL_AREA_LIMIT_KM2 = 50.0;
export const SNI_RATIONAL_AREA_LIMIT_HA = 5000;

/**
 * Batas Validasi Input (SK Menteri PU No. 306/1989)
 */
export const SNI_VALIDATION_LIMITS = {
  runoffCoefficient: { min: 0.0, max: 1.0 },
  catchmentArea: { min: 0.01, max: 10000 }, // km²
  rainfallIntensity: { min: 0.1, max: 500 }, // mm/jam
  timeConcentration: { min: 0.1, max: 24 }, // jam
  alpha: { min: 1.5, max: 3.0 },
  unitRainfall: { min: 1, max: 100 }, // mm
  timeLag: { min: 0.1, max: 48 }, // jam
  riverLength: { min: 0.1, max: 1000 }, // km
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BATAS KEBERLAKUAN METODE (SNI Method Applicability Boundaries)
// Digunakan sebagai SSOT oleh semua kalkulator dan UI badge.
// Menggantikan magic number yang tersebar di berbagai komponen.
// ─────────────────────────────────────────────────────────────────────────────

export interface SNIMethodBoundary {
  /** Batas luas DAS minimum (km²) */
  minAreaKm2?: number;
  /** Batas luas DAS maksimum (km²) */
  maxAreaKm2?: number;
  /** Batas luas DAS dalam satuan Ha untuk display */
  maxAreaHa?: number;
  /** Batas waktu konsentrasi maksimum (jam) */
  maxTcHours?: number;
  /** Referensi SNI lengkap */
  standard: string;
  /** Pasal dalam standar */
  clause: string;
  /** Keterangan batas dan asumsi */
  notes: string;
}

/**
 * Batas keberlakuan setiap metode hidrologi sesuai SNI.
 * Gunakan ini — JANGAN hardcode angka di komponen.
 *
 * @standard SNI 2415:2016
 * @standard SNI 19-6728.1-2002
 * @standard SNI 03-3432-1994
 */
export const SNI_METHOD_BOUNDARIES: Record<string, SNIMethodBoundary> = {
  /** Metode Rasional — SNI 2415:2016 Pasal 5.2 */
  RASIONAL: {
    maxAreaKm2: 50,
    maxAreaHa: 5000,
    maxTcHours: 6,
    standard: 'SNI 2415:2016',
    clause: 'Pasal 5.2',
    notes: 'DAS ≤ 50 km² (5000 Ha), DAS homogen, waktu konsentrasi < 6 jam',
  },
  /** Batas praktis (best accuracy) Metode Rasional */
  RASIONAL_OPTIMAL: {
    maxAreaKm2: 3,
    maxAreaHa: 300,
    standard: 'SNI 2415:2016',
    clause: 'Pasal 5.2',
    notes: 'Akurasi terbaik pada DAS ≤ 3 km² (300 Ha)',
  },
  /** HSS Nakayasu — SNI 2415:2016 Pasal 6.3 */
  HSS_NAKAYASU: {
    minAreaKm2: 0.1,
    standard: 'SNI 2415:2016',
    clause: 'Pasal 6.3',
    notes: 'Berlaku untuk DAS dengan data pengamatan debit terbatas. α=2.0 (standar), α=1.5 (DAS landai), α=3.0 (DAS terjal)',
  },
  /** F.J. Mock Water Balance — SNI 19-6728.1-2002 */
  FJ_MOCK: {
    standard: 'SNI 19-6728.1-2002',
    clause: 'Pasal 5–6',
    notes: 'Neraca air bulanan. Data minimal 5 tahun untuk kalibrasi K dan SMC yang andal.',
  },
  /** Embung / Small Dam — SNI 03-3432-1994 */
  EMBUNG: {
    standard: 'SNI 03-3432-1994',
    clause: 'Pasal 4.2',
    notes: 'Tampungan < 3 juta m³ atau luas genangan < 200 ha',
  },
};

/**
 * Metadata badge untuk UI — digunakan oleh komponen kalkulator
 * untuk menampilkan Engineering Badge dan WhiteBox transparency.
 */
export interface SNIBadgeMetadata {
  label: string;
  standard: string;
  clause: string;
  color: 'blue' | 'green' | 'amber' | 'red';
}

export const SNI_METADATA: Record<string, SNIBadgeMetadata> = {
  RASIONAL: {
    label: 'Metode Rasional',
    standard: 'SNI 2415:2016',
    clause: 'Pasal 5.2',
    color: 'blue',
  },
  HSS_NAKAYASU: {
    label: 'HSS Nakayasu',
    standard: 'SNI 2415:2016',
    clause: 'Pasal 6.3',
    color: 'green',
  },
  FJ_MOCK: {
    label: 'Neraca Air F.J. Mock',
    standard: 'SNI 19-6728.1-2002',
    clause: 'Pasal 5–6',
    color: 'blue',
  },
  EMBUNG: {
    label: 'Perencanaan Embung',
    standard: 'SNI 03-3432-1994',
    clause: 'Pasal 4.2',
    color: 'amber',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDARY CHECK UTILITY — digunakan oleh semua kalkulator frontend
// ─────────────────────────────────────────────────────────────────────────────

export interface BoundaryCheckResult {
  /** true jika input masih dalam batas keberlakuan */
  isWithinBounds: boolean;
  /** Tingkat peringatan: 'ok' | 'warning' | 'error' */
  severity: 'ok' | 'warning' | 'error';
  /** Pesan peringatan yang siap ditampilkan di UI */
  message: string | null;
  /** Referensi standar yang dilanggar (jika ada) */
  reference: string | null;
}

/**
 * Periksa apakah parameter input masih dalam batas keberlakuan SNI suatu metode.
 *
 * @param method  - Kode metode ('RASIONAL' | 'HSS_NAKAYASU' | 'FJ_MOCK' | 'EMBUNG')
 * @param areaKm2 - Luas DAS dalam km² (opsional)
 * @param tcHours - Waktu konsentrasi dalam jam (opsional)
 * @returns BoundaryCheckResult dengan status dan pesan siap tampil
 *
 * @example
 * ```ts
 * const check = checkSNIBoundary('RASIONAL', 4.5);
 * if (check.severity === 'warning') showWarning(check.message);
 * ```
 */
export function checkSNIBoundary(
  method: keyof typeof SNI_METHOD_BOUNDARIES,
  areaKm2?: number,
  tcHours?: number,
): BoundaryCheckResult {
  const boundary = SNI_METHOD_BOUNDARIES[method];

  if (!boundary) {
    return { isWithinBounds: true, severity: 'ok', message: null, reference: null };
  }

  // Cek batas Tc (hanya Rasional yang membatasi Tc)
  if (tcHours !== undefined && boundary.maxTcHours !== undefined && tcHours > boundary.maxTcHours) {
    return {
      isWithinBounds: false,
      severity: 'warning',
      message: `Waktu konsentrasi (Tc = ${tcHours.toFixed(2)} jam) melebihi batas ${boundary.clause} (maks. ${boundary.maxTcHours} jam). Verifikasi delineasi DAS.`,
      reference: `${boundary.standard} ${boundary.clause}`,
    };
  }

  if (areaKm2 === undefined) {
    return { isWithinBounds: true, severity: 'ok', message: null, reference: null };
  }

  // Cek batas maksimum area
  if (boundary.maxAreaKm2 !== undefined && areaKm2 > boundary.maxAreaKm2) {
    const areaHa = (areaKm2 * 100).toFixed(0);
    return {
      isWithinBounds: false,
      severity: 'error',
      message: `⚠️ Luas DAS (${areaKm2.toFixed(2)} km² / ${areaHa} Ha) melebihi batas ${method === 'RASIONAL' ? 'Metode Rasional' : method} sesuai ${boundary.standard} ${boundary.clause} (maks. ${boundary.maxAreaKm2} km² / ${boundary.maxAreaHa} Ha). Gunakan HSS Nakayasu.`,
      reference: `${boundary.standard} ${boundary.clause}`,
    };
  }

  // Cek zona akurasi optimal (Rasional: 3 km² terbaik, 50 km² masih diizinkan)
  if (method === 'RASIONAL') {
    const optimal = SNI_METHOD_BOUNDARIES.RASIONAL_OPTIMAL;
    if (optimal.maxAreaKm2 !== undefined && areaKm2 > optimal.maxAreaKm2 && areaKm2 <= (boundary.maxAreaKm2 ?? Infinity)) {
      return {
        isWithinBounds: true,
        severity: 'warning',
        message: `Luas DAS (${areaKm2.toFixed(2)} km²) melampaui zona akurasi optimal Metode Rasional (> ${optimal.maxAreaKm2} km²). Hasil masih valid, namun pertimbangkan HSS Nakayasu untuk akurasi lebih tinggi.`,
        reference: `${boundary.standard} ${boundary.clause}`,
      };
    }
  }

  return { isWithinBounds: true, severity: 'ok', message: null, reference: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// WATER SCARCITY INDEX (IKA) — SNI 19-6728.1-2002
// ─────────────────────────────────────────────────────────────────────────────

export interface WaterScarcityCategory {
  maxRatio: number; // Ratio Total Demand / Total Supply
  status: 'Aman' | 'Sedang' | 'Kritis' | 'Sangat Kritis';
  description: string;
  badgeColor: 'emerald' | 'amber' | 'orange' | 'rose';
}

export const SNI_WATER_SCARCITY_CATEGORIES: WaterScarcityCategory[] = [
  {
    maxRatio: 0.50,
    status: 'Aman',
    description: 'Ketersediaan air berlebih, pemanfaatan < 50% dari debit andalan.',
    badgeColor: 'emerald',
  },
  {
    maxRatio: 0.75,
    status: 'Sedang',
    description: 'Pemanfaatan moderat (50% - 75%), pengawasan alokasi air diperlukan.',
    badgeColor: 'amber',
  },
  {
    maxRatio: 1.00,
    status: 'Kritis',
    description: 'Pemanfaatan tinggi (75% - 100%), mendekati kapasitas pasokan andalan.',
    badgeColor: 'orange',
  },
  {
    maxRatio: Infinity,
    status: 'Sangat Kritis',
    description: 'Defisit air (> 100%), mutlak memerlukan tampungan buatan (embung/waduk).',
    badgeColor: 'rose',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KP-01 DITJEN SDA IRRIGATION STANDARDS
// ─────────────────────────────────────────────────────────────────────────────

export const KP01_IRRIGATION_STANDARDS = {
  standard: 'Kriteria Perencanaan Irigasi KP-01',
  efficiency: {
    tertier: 0.80,
    sekunder: 0.90,
    primer: 0.90,
    totalTypical: 0.65, // 0.80 × 0.90 × 0.90 ≈ 0.648
  },
  landPreparation: {
    defaultDurationDays: 30,
    defaultSaturationDepthMm: 250, // 200 - 300 mm
    openWaterEvaporationFactor: 1.1, // Eo = 1.1 × ETo
  },
  percolation: {
    clay: 1.0,
    clayLoam: 2.0,
    sandyLoam: 3.0,
  },
  wlr: {
    recommendedMmDay: 3.3, // 50 mm / 15 hari
  },
  effectiveRainfallFactor: {
    padi: 0.70, // 70% dari R80
    palawija: 0.50, // 50% dari R50/R80
  },
  domesticStandardPerCityClass: {
    metropolitan: 150, // > 1.000.000 jiwa
    kotaBesar: 120,    // 500.000 - 1.000.000 jiwa
    kotaSedang: 100,   // 100.000 - 500.000 jiwa
    kotaKecil: 90,     // 20.000 - 100.000 jiwa
    pedesaan: 60,      // < 20.000 jiwa
  },
};


