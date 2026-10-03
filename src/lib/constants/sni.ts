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
// ─────────────────────────────────────────────────────────────────────────────
// KLASIFIKASI TUTUPAN LAHAN — Koefisien C & Curve Number CN
// SSOT untuk TutupanLahanCard dropdown & agent-assisted input
// Sumber: SNI 2415:2016, Suripin (2004), SCS-CN USDA, Permen PU 12/2014
// ─────────────────────────────────────────────────────────────────────────────

export type LandCoverCategory = 'hutan_alami' | 'pertanian' | 'permukiman' | 'industri_komersial' | 'permukaan_keras' | 'perairan' | 'lain';

export interface LandCoverClassification {
  /** Kode unik tutupan lahan */
  id: string;
  /** Nama tutupan lahan (Bahasa Indonesia) */
  nama: string;
  /** Deskripsi detail kondisi lahan */
  deskripsi: string;
  /** Kategori tutupan lahan */
  kategori: LandCoverCategory;
  /** Label kategori untuk tampilan UI */
  kategoriLabel: string;
  /** Koefisien Pengaliran (C) — nilai tengah */
  nilaiC: number;
  /** Range Koefisien C [min, max] */
  rangeC: [number, number];
  /** Curve Number (CN) — kondisi tanah HSG-B (normal) */
  nilaiCN: number;
  /** Range CN [min, max] untuk berbagai kondisi tanah */
  rangeCN: [number, number];
  /** Referensi standar */
  sumber: string;
}

export const SNI_LAND_COVER_CLASSIFICATIONS: LandCoverClassification[] = [
  // ── Hutan & Vegetasi Alami ─────────────────────────────────────────────────
  {
    id: 'HUTAN_LEBAT',
    nama: 'Hutan Lebat / Primer',
    deskripsi: 'Hutan kerapatan tinggi, tajuk menutup >75%, serasah tebal',
    kategori: 'hutan_alami',
    kategoriLabel: 'Hutan & Vegetasi Alami',
    nilaiC: 0.10,
    rangeC: [0.05, 0.15],
    nilaiCN: 45,
    rangeCN: [30, 55],
    sumber: 'Suripin (2004), SCS-CN USDA',
  },
  {
    id: 'HUTAN_SEKUNDER',
    nama: 'Hutan Sekunder / Bekas Tebang',
    deskripsi: 'Hutan yang pernah ditebang, dalam proses pemulihan',
    kategori: 'hutan_alami',
    kategoriLabel: 'Hutan & Vegetasi Alami',
    nilaiC: 0.18,
    rangeC: [0.10, 0.25],
    nilaiCN: 55,
    rangeCN: [45, 65],
    sumber: 'Suripin (2004)',
  },
  {
    id: 'SEMAK_BELUKAR',
    nama: 'Semak Belukar / Brush',
    deskripsi: 'Vegetasi perdu dan semak, tutupan sedang 40–75%',
    kategori: 'hutan_alami',
    kategoriLabel: 'Hutan & Vegetasi Alami',
    nilaiC: 0.25,
    rangeC: [0.15, 0.35],
    nilaiCN: 65,
    rangeCN: [55, 75],
    sumber: 'SCS-CN USDA TR-55',
  },
  {
    id: 'PADANG_RUMPUT',
    nama: 'Padang Rumput / Grassland',
    deskripsi: 'Tutupan rumput, tidak diolah, kerapatan sedang hingga tinggi',
    kategori: 'hutan_alami',
    kategoriLabel: 'Hutan & Vegetasi Alami',
    nilaiC: 0.22,
    rangeC: [0.10, 0.35],
    nilaiCN: 61,
    rangeCN: [49, 74],
    sumber: 'SCS-CN USDA TR-55',
  },
  {
    id: 'MANGROVE',
    nama: 'Hutan Mangrove / Bakau',
    deskripsi: 'Vegetasi pesisir di zona pasang surut, tanah jenuh',
    kategori: 'hutan_alami',
    kategoriLabel: 'Hutan & Vegetasi Alami',
    nilaiC: 0.12,
    rangeC: [0.05, 0.20],
    nilaiCN: 50,
    rangeCN: [40, 60],
    sumber: 'Suripin (2004)',
  },

  // ── Pertanian & Perkebunan ────────────────────────────────────────────────
  {
    id: 'SAWAH_IRIGASI',
    nama: 'Sawah Irigasi',
    deskripsi: 'Lahan padi sawah dengan irigasi teknis, kondisi tergenang',
    kategori: 'pertanian',
    kategoriLabel: 'Pertanian & Perkebunan',
    nilaiC: 0.55,
    rangeC: [0.40, 0.70],
    nilaiCN: 90,
    rangeCN: [85, 95],
    sumber: 'SNI 2415:2016, Suripin (2004)',
  },
  {
    id: 'SAWAH_TADAH_HUJAN',
    nama: 'Sawah Tadah Hujan',
    deskripsi: 'Lahan padi bergantung hujan, periode kering dan basah',
    kategori: 'pertanian',
    kategoriLabel: 'Pertanian & Perkebunan',
    nilaiC: 0.45,
    rangeC: [0.30, 0.60],
    nilaiCN: 80,
    rangeCN: [70, 90],
    sumber: 'Suripin (2004)',
  },
  {
    id: 'LADANG_TEGALAN',
    nama: 'Ladang / Tegalan (Palawija)',
    deskripsi: 'Lahan pertanian kering: jagung, kedelai, sayuran',
    kategori: 'pertanian',
    kategoriLabel: 'Pertanian & Perkebunan',
    nilaiC: 0.35,
    rangeC: [0.20, 0.50],
    nilaiCN: 72,
    rangeCN: [60, 82],
    sumber: 'Suripin (2004), SCS-CN USDA',
  },
  {
    id: 'PERKEBUNAN',
    nama: 'Perkebunan (Kelapa Sawit, Karet, Kakao)',
    deskripsi: 'Perkebunan monokultur, tajuk sedang, ground cover ada',
    kategori: 'pertanian',
    kategoriLabel: 'Pertanian & Perkebunan',
    nilaiC: 0.30,
    rangeC: [0.20, 0.40],
    nilaiCN: 65,
    rangeCN: [55, 75],
    sumber: 'Suripin (2004)',
  },
  {
    id: 'KEBUN_CAMPURAN',
    nama: 'Kebun Campuran / Agroforestri',
    deskripsi: 'Kombinasi pohon buah dan tanaman semusim, multi-strata',
    kategori: 'pertanian',
    kategoriLabel: 'Pertanian & Perkebunan',
    nilaiC: 0.25,
    rangeC: [0.15, 0.35],
    nilaiCN: 60,
    rangeCN: [50, 70],
    sumber: 'Suripin (2004)',
  },

  // ── Permukiman ────────────────────────────────────────────────────────────
  {
    id: 'PERMUKIMAN_PADAT',
    nama: 'Permukiman Padat Perkotaan',
    deskripsi: 'Kawasan perumahan rapat, tutupan bangunan >70%, sedikit RTH',
    kategori: 'permukiman',
    kategoriLabel: 'Permukiman & Perumahan',
    nilaiC: 0.75,
    rangeC: [0.60, 0.90],
    nilaiCN: 85,
    rangeCN: [77, 92],
    sumber: 'Permen PU 12/2014, Suripin (2004)',
  },
  {
    id: 'PERMUKIMAN_SEDANG',
    nama: 'Permukiman Sedang (Suburban)',
    deskripsi: 'Perumahan suburban, bangunan 40–70%, terdapat halaman dan RTH',
    kategori: 'permukiman',
    kategoriLabel: 'Permukiman & Perumahan',
    nilaiC: 0.55,
    rangeC: [0.40, 0.70],
    nilaiCN: 77,
    rangeCN: [70, 84],
    sumber: 'Permen PU 12/2014, Suripin (2004)',
  },
  {
    id: 'PERMUKIMAN_JARANG',
    nama: 'Permukiman Jarang / Pedesaan',
    deskripsi: 'Perumahan pedesaan, bangunan <40%, banyak vegetasi dan halaman luas',
    kategori: 'permukiman',
    kategoriLabel: 'Permukiman & Perumahan',
    nilaiC: 0.30,
    rangeC: [0.20, 0.45],
    nilaiCN: 66,
    rangeCN: [58, 74],
    sumber: 'Suripin (2004)',
  },

  // ── Industri & Komersial ──────────────────────────────────────────────────
  {
    id: 'PUSAT_KOTA',
    nama: 'Pusat Kota / Central Business District',
    deskripsi: 'Kawasan perdagangan dan jasa rapat, hampir seluruh area terbangun',
    kategori: 'industri_komersial',
    kategoriLabel: 'Industri & Komersial',
    nilaiC: 0.88,
    rangeC: [0.75, 0.95],
    nilaiCN: 90,
    rangeCN: [85, 95],
    sumber: 'Permen PU 12/2014',
  },
  {
    id: 'KAWASAN_INDUSTRI',
    nama: 'Kawasan Industri',
    deskripsi: 'Pabrik, gudang, dan infrastruktur industri; banyak area paved',
    kategori: 'industri_komersial',
    kategoriLabel: 'Industri & Komersial',
    nilaiC: 0.80,
    rangeC: [0.65, 0.90],
    nilaiCN: 85,
    rangeCN: [80, 92],
    sumber: 'Suripin (2004)',
  },
  {
    id: 'KAWASAN_KOMERSIAL',
    nama: 'Kawasan Komersial / Ritel',
    deskripsi: 'Pertokoan, mall, ruko; sebagian besar area kedap',
    kategori: 'industri_komersial',
    kategoriLabel: 'Industri & Komersial',
    nilaiC: 0.80,
    rangeC: [0.70, 0.90],
    nilaiCN: 87,
    rangeCN: [82, 93],
    sumber: 'Permen PU 12/2014',
  },

  // ── Permukaan Keras & Infrastruktur ──────────────────────────────────────
  {
    id: 'JALAN_ASPAL',
    nama: 'Jalan Aspal / Beton',
    deskripsi: 'Perkerasan jalan aspal atau beton, hampir kedap air',
    kategori: 'permukaan_keras',
    kategoriLabel: 'Permukaan Keras & Infrastruktur',
    nilaiC: 0.95,
    rangeC: [0.90, 0.98],
    nilaiCN: 98,
    rangeCN: [96, 100],
    sumber: 'Permen PU 12/2014',
  },
  {
    id: 'JALAN_PAVING',
    nama: 'Jalan Paving Block',
    deskripsi: 'Paving block dengan celah, infiltrasi lebih tinggi dari aspal',
    kategori: 'permukaan_keras',
    kategoriLabel: 'Permukaan Keras & Infrastruktur',
    nilaiC: 0.85,
    rangeC: [0.75, 0.90],
    nilaiCN: 90,
    rangeCN: [85, 95],
    sumber: 'Suripin (2004)',
  },
  {
    id: 'ATAP_GEDUNG',
    nama: 'Atap Gedung / Rooftop',
    deskripsi: 'Permukaan atap beton, metal, atau genteng; kedap air',
    kategori: 'permukaan_keras',
    kategoriLabel: 'Permukaan Keras & Infrastruktur',
    nilaiC: 0.92,
    rangeC: [0.85, 0.98],
    nilaiCN: 97,
    rangeCN: [95, 99],
    sumber: 'Permen PU 12/2014',
  },
  {
    id: 'TANAH_TERBUKA',
    nama: 'Tanah Terbuka / Gundul',
    deskripsi: 'Lahan terbuka tanpa vegetasi, rawan erosi',
    kategori: 'permukaan_keras',
    kategoriLabel: 'Permukaan Keras & Infrastruktur',
    nilaiC: 0.60,
    rangeC: [0.50, 0.70],
    nilaiCN: 77,
    rangeCN: [68, 85],
    sumber: 'Suripin (2004)',
  },
  {
    id: 'TAMAN_RTH',
    nama: 'Taman / Ruang Terbuka Hijau',
    deskripsi: 'Area taman kota dengan rumput, pohon, jalur setapak',
    kategori: 'permukaan_keras',
    kategoriLabel: 'Permukaan Keras & Infrastruktur',
    nilaiC: 0.15,
    rangeC: [0.10, 0.25],
    nilaiCN: 61,
    rangeCN: [49, 74],
    sumber: 'Permen PU 12/2014',
  },

  // ── Perairan ──────────────────────────────────────────────────────────────
  {
    id: 'BADAN_AIR',
    nama: 'Badan Air (Danau, Situ, Waduk)',
    deskripsi: 'Permukaan air bebas, seluruh hujan menjadi aliran',
    kategori: 'perairan',
    kategoriLabel: 'Badan Air & Rawa',
    nilaiC: 1.00,
    rangeC: [1.00, 1.00],
    nilaiCN: 100,
    rangeCN: [100, 100],
    sumber: 'SNI 2415:2016',
  },
  {
    id: 'RAWA',
    nama: 'Rawa / Lahan Basah',
    deskripsi: 'Lahan dengan muka air tinggi, vegetasi air, sering tergenang',
    kategori: 'perairan',
    kategoriLabel: 'Badan Air & Rawa',
    nilaiC: 0.65,
    rangeC: [0.50, 0.80],
    nilaiCN: 88,
    rangeCN: [80, 95],
    sumber: 'SCS-CN USDA TR-55',
  },
];

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


