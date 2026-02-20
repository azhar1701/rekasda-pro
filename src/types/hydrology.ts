/**
 * Hydrological Calculation Types
 * Compliant with SNI 2415:2016 and Permen PU No. 12/PRT/M/2014
 */

/**
 * Metode Rasional - Input Parameters
 * Sesuai SNI 2415:2016 Pasal 5
 */
export interface RationalMethodInput {
  /** Koefisien Pengaliran (Runoff Coefficient) - Dimensionless (0-1) */
  C: number;
  /** Intensitas Hujan (Rainfall Intensity) - mm/jam */
  I: number;
  /** Luas Daerah Aliran Sungai (Catchment Area) - km² */
  A: number;
}

/**
 * Metode Rasional - Output
 */
export interface RationalMethodOutput {
  /** Debit Puncak (Peak Discharge) - m³/s */
  Q: number;
  /** Waktu Konsentrasi (Time of Concentration) - jam */
  tc?: number;
}

/**
 * HSS Nakayasu - Input Parameters
 * Sesuai SNI 2415:2016 Pasal 6.3
 */
export interface HSSNakayasuInput {
  /** Hujan Satuan (Unit Rainfall) - mm */
  Ro: number;
  /** Time Lag - jam */
  Tg: number;
  /** Time Unit (0.5 - 1.0 * Tg) - jam */
  Tr: number;
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
  /** Faktor Sumber (Source Factor) - dimensionless */
  SF: number;
  /** Waktu Konsentrasi (Time of Concentration) - jam */
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
 * HSS Snyder - Input Parameters
 * Metode Hidrograf Satuan Sintetik Snyder (1938)
 */
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
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}
