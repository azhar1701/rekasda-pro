/**
 * Hydrological Calculation Types
 * Compliant with SNI 2415:2016 and Permen PU No. 12/PRT/M/2014
 */

/**
 * Metode Rasional - Input Parameters
 * Sesuai SNI 2415:2016 Pasal 5
 */
export interface RationalMethodInput {
  /** Koefisien Limpasan (Runoff Coefficient) */
  C: number;
  /** Luas DAS (Catchment Area) - km² */
  A: number;
  /** Panjang Sungai Utama (River Length) - km */
  L: number;
  /** Kemiringan Rata-rata DAS (Slope) - m/m */
  S: number;
  /** Curah Hujan Harian Maksimum (Max Daily Rainfall) - mm */
  R24: number;
  /** Intensitas Hujan (Intensity) - mm/jam (Optional: if already calculated) */
  I?: number;
  /** Waktu Konsentrasi (Optional: akan dihitung Kirpich) - jam */
  tc?: number;
}

/**
 * Metode Rasional - Output
 */
export interface RationalMethodOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Intensitas Hujan (Intensity) - mm/jam */
  I: number;
  /** Waktu Konsentrasi (Time of Concentration) - jam */
  tc: number;
}

/**
 * Metode Melchior - Input Parameters
 */
export interface MelchiorInput {
  /** Luas DAS (A) - km² */
  A: number;
  /** Panjang Sungai (L) - km */
  L: number;
  /** Kemiringan Rata-rata (Slope) - m/m */
  S: number;
  /** Curah Hujan Harian Maksimum (R24) - mm */
  R24: number;
}

export interface MelchiorOutput {
  /** Debit Puncak (Qp) - m³/s */
  Qp: number;
  /** Koefisien Reduksi (Alpha) */
  Alpha: number;
  /** Waktu Konsentrasi (tc) - jam */
  tc: number;
}

/**
 * Metode Haspers - Input Parameters
 */
export interface HaspersInput {
  /** Luas DAS (A) - km² */
  A: number;
  /** Panjang Sungai (L) - km */
  L: number;
  /** Kemiringan Rata-rata (Slope) - m/m */
  S: number;
  /** Curah Hujan Harian Maksimum (R24) - mm */
  R24: number;
}

export interface HaspersOutput {
  /** Debit Puncak (Qp) - m³/s */
  Qp: number;
  /** Koefisien Reduksi (Alpha) */
  Alpha: number;
  /** Waktu Konsentrasi (tc) - jam */
  tc: number;
}

/**
 * Metode Der Weduwen - Input Parameters
 */
export interface DerWeduwenInput {
  /** Luas DAS (A) - km² */
  A: number;
  /** Panjang Sungai (L) - km */
  L: number;
  /** Kemiringan Rata-rata (Slope) - m/m */
  S: number;
  /** Curah Hujan Harian Maksimum (R24) - mm */
  R24: number;
}

export interface DerWeduwenOutput {
  /** Debit Puncak (Qp) - m³/s */
  Qp: number;
  /** Koefisien Reduksi (Alpha) */
  Alpha: number;
  /** Waktu Konsentrasi (tc) - jam */
  tc: number;
}

/**
 * HSS Nakayasu - Input Parameters
 * Sesuai SNI 2415:2016 Pasal 6.3
 */
export interface HSSNakayasuInput {
  /** Hujan Satuan (Unit Rainfall) - mm */
  Ro: number;
  /** Time Lag - jam (Optional: akan dihitung otomatis jika tidak diisi) */
  Tg?: number;
  /** Time Unit (0.5 - 1.0 * Tg) - jam (Optional: akan dihitung otomatis) */
  Tr?: number;
  /** Parameter Hidrograf (1.5 - 3.0, standard = 2.0) */
  Alpha: number;
  /** Luas DAS (Catchment Area) - km² */
  A: number;
  /** Panjang Sungai Utama (Main River Length) - km */
  L: number;
}

/**
 * HSS Nakayasu - Output
 */
export interface HSSNakayasuOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Waktu Dasar (Base Time) - jam */
  Tb: number;
  /** Data Hidrograf (Time-Discharge pairs) */
  hydrograph: Array<{ time: number; discharge: number }>;
}

/**
 * HSS Gamma I - Input Parameters
 * Metode Hidrograf Satuan Sintetik Gamma I (Sri Harto, 1993)
 */
export interface HSSGamma1Input {
  /** Hujan Satuan (Unit Rainfall) - mm */
  Ro: number;
  /** Luas DAS (Catchment Area) - km² */
  A: number;
  /** Panjang Sungai Utama (Main River Length) - km */
  L: number;
  /** Kemiringan Sungai (Slope) - m/m */
  S: number;
  /** Faktor Sumber (Source Factor) - dimensionless */
  SF: number;
  /** Faktor Simetri (Symmetry Index) */
  SIM: number;
  /** Jumlah Pertemuan Sungai (Number of Junctions) */
  JN: number;
  /** Frekuensi Sumber (Source Frequency) */
  SN: number;
  /** Luas Relatif Hulu (Relative Upstream Area) */
  RUA: number;
  /** Waktu Konsentrasi (Optional) */
  Tc?: number;
}

/**
 * HSS Gamma I - Output
 */
export interface HSSGamma1Output {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Waktu Dasar (Base Time) - jam */
  Tb: number;
  /** Data Hidrograf (Time-Discharge pairs) */
  hydrograph: Array<{ time: number; discharge: number }>;
}

/**
 * HSS SCS - Input Parameters
 * Metode Hidrograf Satuan Sintetik SCS (Soil Conservation Service)
 */
export interface HSSSCSInput {
  /** Hujan Satuan (Unit Rainfall) - mm */
  Ro: number;
  /** Luas DAS (Catchment Area) - km² */
  A: number;
  /** Panjang Sungai Utama (Main River Length) - km */
  L: number;
  /** Kemiringan Rata-rata (Slope) - m/m */
  S: number;
  /** Waktu Konsentrasi (Tc) - jam (Optional) */
  Tc?: number;
}

/**
 * HSS SCS - Output
 */
export interface HSSSCSOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Waktu Dasar (Base Time) - jam */
  Tb: number;
  /** Data Hidrograf (Time-Discharge pairs) */
  hydrograph: Array<{ time: number; discharge: number }>;
}

export interface HSSSnyderInput {
  /** Hujan Satuan (Unit Rainfall) - mm */
  Ro: number;
  /** Luas DAS (Catchment Area) - km² */
  A: number;
  /** Panjang Sungai Utama (Main River Length) - km */
  L: number;
  /** Panjang dari outlet ke titik berat DAS (Distance to Centroid) - km */
  Lc: number;
  /** Koefisien Ct (0.4 - 0.8, standard = 0.6) */
  Ct: number;
  /** Koefisien Cp (0.4 - 0.8, standard = 0.6) */
  Cp: number;
}

export interface HSSSnyderOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Waktu Dasar (Base Time) - jam */
  Tb: number;
  /** Data Hidrograf (Time-Discharge pairs) */
  hydrograph: Array<{ time: number; discharge: number }>;
}

/**
 * HSS Clark - Input Parameters
 * Metode Hidrograf Satuan Sintetik Clark
 */
export interface HSSClarkInput {
  /** Hujan Satuan (Unit Rainfall) - mm */
  Ro: number;
  /** Luas DAS (Catchment Area) - km² */
  A: number;
  /** Waktu Konsentrasi (Tc) - jam */
  Tc: number;
  /** Koefisien Tampungan (Storage Coefficient R) - jam */
  R: number;
}

/**
 * HSS Clark - Output
 */
export interface HSSClarkOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Waktu Dasar (Base Time) - jam */
  Tb: number;
  /** Data Hidrograf (Time-Discharge pairs) */
  hydrograph: Array<{ time: number; discharge: number }>;
}

/**
 * HSS Snyder - Output
 */
export interface HSSSnyderOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Waktu Dasar (Base Time) - jam */
  Tb: number;
  /** Data Hidrograf (Time-Discharge pairs) */
  hydrograph: Array<{ time: number; discharge: number }>;
}

/**
 * Manning Formula - Input Parameters
 * Untuk perhitungan kapasitas saluran
 */
export interface ManningInput {
  /** Koefisien Kekasaran Manning */
  n: number;
  /** Kemiringan Dasar Saluran (Slope) - m/m */
  S: number;
  /** Luas Penampang Basah (Wetted Area) - m² */
  A: number;
  /** Keliling Basah (Wetted Perimeter) - m */
  P: number;
}

/**
 * Manning Formula - Output
 */
export interface ManningOutput {
  /** Kecepatan Aliran (Flow Velocity) - m/s */
  V: number;
  /** Debit (Discharge) - m³/s */
  Q: number;
  /** Jari-jari Hidrolik (Hydraulic Radius) - m */
  R: number;
  /** Bilangan Froude (Froude Number) - dimensionless */
  Fr?: number;
}

/**
 * Waktu Konsentrasi - Input Parameters
 * Sesuai Permen PU No. 12/2014
 */
export interface TimeConcentrationInput {
  /** Panjang Aliran (Flow Length) - m */
  L: number;
  /** Beda Tinggi (Elevation Difference) - m */
  H: number;
  /** Koefisien Pengaliran */
  C: number;
}

/**
 * Intensitas Hujan - Input Parameters
 * Menggunakan Rumus Mononobe atau Talbot
 */
export interface RainfallIntensityInput {
  /** Curah Hujan Rencana (Design Rainfall) - mm */
  R: number;
  /** Durasi Hujan (Duration) - jam */
  t: number;
  /** Metode perhitungan */
  method: 'mononobe' | 'talbot';
}

/**
 * Convolution - Input Parameters
 */
export interface ConvolutionInput {
  /** Hujan Efektif (Effective Rainfall) - mm (array per jam) */
  effectiveRainfall: number[];
  /** Ordinat Hidrograf Satuan (Unit Hydrograph) - m³/s/mm */
  unitHydrograph: Array<{ time: number; discharge: number }>;
}

/**
 * Convolution - Output
 */
export interface ConvolutionOutput {
  /** Hidrograf Banjir (Flood Hydrograph) - m³/s */
  hydrograph: Array<{ time: number; discharge: number }>;
  /** Debit Puncak (Peak Discharge) - m³/s */
  Qp: number;
  /** Waktu Puncak (Time to Peak) - jam */
  Tp: number;
  /** Total Volume Limpasan Banjir (m³) */
  totalVolume?: number;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}
