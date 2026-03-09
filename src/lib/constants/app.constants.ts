export const APP_NAME = 'RekaSDA';
export const VERSION = '1.0.0';

export const CHART_COLORS = {
  primary: '#0d9488',
  secondary: '#64748b',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#10b981',
} as const;

export const WATER_STANDARDS = {
  SNI: {
    'SNI 6728.1:2015': 'Neraca Sumber Daya Air - Bagian 1: Spasial',
    'SNI 6728-1:2015': 'Kebutuhan Air (60-90 L/orang/hari untuk semi-urban)',
    'SNI 2415:2016': 'Perhitungan Debit Banjir untuk Perencanaan Bangunan Air',
    'SNI 6738:2015': 'Perhitungan Debit Andalan Sungai untuk Irigasi',
  },
  KP: {
    'KP-01': 'Perencanaan Jaringan Irigasi',
    'KP-02': 'Bangunan Utama (Bendung dan pengambilan bebas)',
    'KP-03': 'Saluran (Dimensi dan kapasitas saluran irigasi)',
    'KP-04': 'Bangunan (Bangunan bagi, sadap, dan pengukur)',
    'KP-05': 'Petak Tersier (Sistem irigasi tingkat usaha tani)',
    'KP-06': 'Parameter Bangunan (Struktur bangunan irigasi)',
    'KP-07': 'Bangunan Ukur dan Alat Ukur (Pengukuran debit air)',
  },
} as const;
