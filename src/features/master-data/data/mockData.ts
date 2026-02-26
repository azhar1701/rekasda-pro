import type { MorfometriDAS, TutupanLahan, CurahHujanWilayah } from '@/stores/useHydrologyStore';

export interface QCResults {
  raps: {
    isConsistent: boolean;
    Qr: number;
    Qr_critical: number;
    Qn: number;
    Qn_critical: number;
  };
  grubbs: {
    hasOutliers: boolean;
    mean: number;
    stdDev: number;
    lowerLimit: number;
    upperLimit: number;
    outliers: number[];
  };
  homogeneity: {
    isHomogeneous: boolean;
    fTest: { statistic: number; critical: number; passed: boolean };
    tTest: { statistic: number; critical: number; passed: boolean };
  };
  overallPassed: boolean;
}

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
  elevasi: 850,
};

export const mockTutupanLahan: TutupanLahan = {
  items: [
    { id: '1', jenis: 'Hutan Lebat', luas: 45.5, nilaiC: 0.15, nilaiCN: 55 },
    { id: '2', jenis: 'Pemukiman Padat', luas: 35.2, nilaiC: 0.75, nilaiCN: 85 },
    { id: '3', jenis: 'Sawah', luas: 28.8, nilaiC: 0.35, nilaiCN: 70 },
    { id: '4', jenis: 'Perkebunan', luas: 16.0, nilaiC: 0.25, nilaiCN: 65 },
  ],
  koefisienPengaliranGabungan: 0.412,
  curveNumberGabungan: 70.2,
  totalLuas: 125.5,
};

export const mockCurahHujanWilayah: CurahHujanWilayah = {
  metode: 'thiessen',
  stasiunConfigs: [
    { stasiunId: '1', namaStasiun: 'Sta. Cipanas', luasPengaruh: 43.75, bobot: 0.35 },
    { stasiunId: '2', namaStasiun: 'Sta. Cianjur', luasPengaruh: 52.5, bobot: 0.42 },
    { stasiunId: '3', namaStasiun: 'Sta. Sukabumi', luasPengaruh: 28.75, bobot: 0.23 },
  ],
  hujanRataRata: 165.4,
};

export const mockDataHujan = [
  { id: '1', stasiun_id: '1', tanggal: '2015-01-15', curah_hujan: 142.5 },
  { id: '2', stasiun_id: '1', tanggal: '2016-02-20', curah_hujan: 168.3 },
  { id: '3', stasiun_id: '1', tanggal: '2017-03-10', curah_hujan: 135.8 },
  { id: '4', stasiun_id: '1', tanggal: '2018-04-05', curah_hujan: 189.2 },
  { id: '5', stasiun_id: '1', tanggal: '2019-05-12', curah_hujan: 156.7 },
  { id: '6', stasiun_id: '1', tanggal: '2020-06-18', curah_hujan: 178.4 },
  { id: '7', stasiun_id: '1', tanggal: '2021-07-22', curah_hujan: 145.9 },
  { id: '8', stasiun_id: '1', tanggal: '2022-08-30', curah_hujan: 192.6 },
  { id: '9', stasiun_id: '1', tanggal: '2023-09-14', curah_hujan: 163.2 },
  { id: '10', stasiun_id: '1', tanggal: '2024-10-08', curah_hujan: 171.8 },
];
