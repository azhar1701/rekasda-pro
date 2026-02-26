import type { QCResults, MorfometriDAS, TutupanLahan, CurahHujanWilayah } from '@/stores/useHydrologyStore';

export const mockQCResults: QCResults = {
  raps: {
    isConsistent: true,
    Qr: 0.18,
    Qr_critical: 0.29,
    Qn: 0.15,
    Qn_critical: 0.29,
  },
  grubbs: {
    hasOutliers: false,
    mean: 145.6,
    stdDev: 28.4,
    lowerLimit: 60.2,
    upperLimit: 231.0,
    outliers: [],
  },
  homogeneity: {
    isHomogeneous: true,
    fTest: { statistic: 1.24, critical: 2.15, passed: true },
    tTest: { statistic: 0.87, critical: 2.05, passed: true },
  },
  overallPassed: true,
};

export const mockMorfometriDAS: MorfometriDAS = {
  luasDAS: 125.5,
  panjangSungai: 18.2,
  kemiringanSungai: 0.0085,
  elevasi: {
    hulu: 850,
    hilir: 245,
  },
};

export const mockTutupanLahan: TutupanLahan = {
  items: [
    { jenisTutupan: 'Hutan Lebat', luas: 45.5, koefisienC: 0.15, curveNumber: 55 },
    { jenisTutupan: 'Pemukiman Padat', luas: 35.2, koefisienC: 0.75, curveNumber: 85 },
    { jenisTutupan: 'Sawah', luas: 28.8, koefisienC: 0.35, curveNumber: 70 },
    { jenisTutupan: 'Perkebunan', luas: 16.0, koefisienC: 0.25, curveNumber: 65 },
  ],
  cGabungan: 0.412,
  cnKomposit: 70.2,
};

export const mockCurahHujanWilayah: CurahHujanWilayah = {
  metode: 'thiessen',
  stasiun: [
    { nama: 'Sta. Cipanas', bobot: 0.35 },
    { nama: 'Sta. Cianjur', bobot: 0.42 },
    { nama: 'Sta. Sukabumi', bobot: 0.23 },
  ],
  hasilPerhitungan: [
    { tahun: 2015, hujanWilayah: 142.5 },
    { tahun: 2016, hujanWilayah: 168.3 },
    { tahun: 2017, hujanWilayah: 135.8 },
    { tahun: 2018, hujanWilayah: 189.2 },
    { tahun: 2019, hujanWilayah: 156.7 },
    { tahun: 2020, hujanWilayah: 178.4 },
    { tahun: 2021, hujanWilayah: 145.9 },
    { tahun: 2022, hujanWilayah: 192.6 },
    { tahun: 2023, hujanWilayah: 163.2 },
    { tahun: 2024, hujanWilayah: 171.8 },
  ],
};

export const mockDataHujan = [
  { tahun: 2015, hujan: 142.5 },
  { tahun: 2016, hujan: 168.3 },
  { tahun: 2017, hujan: 135.8 },
  { tahun: 2018, hujan: 189.2 },
  { tahun: 2019, hujan: 156.7 },
  { tahun: 2020, hujan: 178.4 },
  { tahun: 2021, hujan: 145.9 },
  { tahun: 2022, hujan: 192.6 },
  { tahun: 2023, hujan: 163.2 },
  { tahun: 2024, hujan: 171.8 },
];
