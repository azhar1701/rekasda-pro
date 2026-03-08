/**
 * Modul Transformasi Hujan-Debit (Runoff & Hidrograf)
 * 
 * Meliputi Intensitas Hujan (Mononobe), Metode Puncak Rasional, 
 * dan Interface untuk Hidrograf Satuan Sintetis (HSS).
 */

/**
 * Menghitung Intensitas Curah Hujan dengan Persamaan Mononobe
 * 
 * Sering digunakan di Indonesia untuk menurunkan kurva IDF/intensitas
 * dari data hujan curah harian maksimum rata-rata 24 jam.
 * 
 * I = (R24 / 24) * (24 / tc)^(2/3)
 * 
 * @param R24 Curah hujan maksimum 24 jam (Hujan Rencana dari Analisis Frekuensi) [mm]
 * @param timeOfConcentration Waktu Konsentrasi (tc) dalam jam.
 * @returns Intensitas Curah Hujan (I) dalam satuan mm/jam
 */
export function calculateMononobeIntensity(R24: number, timeOfConcentration: number): number {
  if (timeOfConcentration <= 0) return 0;
  return (R24 / 24.0) * Math.pow(24.0 / timeOfConcentration, 2.0 / 3.0);
}

/**
 * Menghitung Debit Puncak dengan METODE RASIONAL
 * 
 * Asumsi: Luas DAS biasanya di bawah 300 hektar (3 km²) atau maksimum 50 km²,
 * Intensitas seragam merata se-DAS.
 * 
 * Q = 0.278 * C * I * A 
 * (0.278 adalah faktor konversi dari (km² * mm/jam) menjadi (m³/detik))
 * 
 * @param runoffCoef Koefisien Pengaliran Limbasan / Koef. Runoff (C) [0 - 1.0]
 * @param intensity Intensitas Curah Hujan (I) [mm/jam]
 * @param areaKm2 Luas area tangkapan air (A) [km²]
 * @returns Debit Puncak / Limpasan (Q) dalam m³/detik [cms]
 */
export function calculateRationalPeak(runoffCoef: number, intensity: number, areaKm2: number): number {
  return 0.278 * runoffCoef * intensity * areaKm2;
}

// ─── BLUEPRINT: HIDROGRAF SATUAN SINTETIK (HSS) ───

/**
 * Interface Struktur Data Parameter Input Morfometri DAS untuk HSS
 */
export interface BasinParameters {
  area: number;                // A (Luas DAS, km2)
  mainRiverLength: number;     // L (Panjang sungai utama, km)
  channelSlope: number;        // S (Kemiringan dasar sungai / Gradient)
  Lca?: number;                // Jarak ke titik berat DAS (km) - Untuk Snyder
}

/**
 * Tipe Bentuk Ordinat Dasar (Waktu & Debit Relatif)
 */
export interface OrdinateResult {
  timeIndex: number;          // T (Jam)
  dischargeRelative: number;  // Debit m3/dtk per mm hujan efektif (m3/s/mm)
}

/**
 * Abstract Blueprint Interface / Contract untuk Kelas HSS (Polymorphism)
 * 
 * Berfungsi memaksa developer (termasuk modul ekstensi) patuh pada
 * metode pengembalian standar `getPeakDischarge` dan `getHydrographOrdinates`.
 */
export interface SyntheticUnitHydrograph {
  readonly methodName: string; // Misal: "Gama I", "Nakayasu", "Snyder"
  
  /**
   * Mengembalikan Q peak spesifik m3/dtk per mm hujan berdasarkan morfologi DAS lokal.
   * Harus didefinisikan secara unik oleh tiap metode (contoh Nakayasu: A*Ro / (3.6) * ...)
   */
  getPeakDischarge(basin: BasinParameters): number;
  
  /**
   * Menghitung kurva lengkung naik dan turun (Rising Limb / Recession Limb).
   */
  getHydrographOrdinates(basin: BasinParameters, timeStepHours: number): OrdinateResult[];
}

// ─── METODE HUJAN EFEKTIF (EFFECTIVE RAINFALL) ───

/**
 * 1. Metode Koefisien Pengaliran (C)
 * P_eff = P * C
 */
export function calculateEffectiveRainfallByC(P: number, C: number): number {
  return P * C;
}

/**
 * 2. Metode Curve Number (SCS-CN)
 * P_eff = (P - 0.2S)^2 / (P + 0.8S)
 */
export function calculateEffectiveRainfallByCN(totalRainfallMm: number, CN: number): number {
  const P = totalRainfallMm / 25.4; // Konversi ke inci
  if (CN <= 0 || CN >= 100) return 0;

  const S = (1000 / CN) - 10;
  const Ia = 0.2 * S; // Initial Abstraction

  if (P <= Ia) return 0;

  const Peff_inches = Math.pow(P - Ia, 2) / (P + 0.8 * S);
  return Peff_inches * 25.4; // Konversi balik ke mm
}

/**
 * 3. Metode Infiltrasi Indeks (Phi-Index)
 * P_eff = P - (Phi * t)
 */
export function calculateEffectiveRainfallByPhi(P: number, phiMmPerHour: number, durationHours: number): number {
  const loss = phiMmPerHour * durationHours;
  return Math.max(0, P - loss);
}
