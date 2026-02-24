/**
 * =============================================================================
 * Sedimentation Service — Sediment Yield Calculation
 * =============================================================================
 * Converts suspended sediment concentration (mg/L) and discharge (m³/s)
 * into sediment load (tonnes/year), volume (m³/year), specific yield,
 * erosion rate (mm/year), and estimated reservoir useful life.
 *
 * Referensi: Modul 6 Analisis Hidrologi PUPR — Perkiraan Sedimen
 * =============================================================================
 */

import {
  HydroValidationError,
  type SedimentationInput,
  type SedimentYieldResult,
} from '@/features/embung/types/embung.types';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateInput(input: SedimentationInput): void {
  if (!input.qData || !input.qsData) {
    throw new HydroValidationError('Data Q dan Qs tidak boleh kosong.', 'EMPTY_SAMPLES');
  }

  if (input.qData.length !== input.qsData.length) {
    throw new HydroValidationError(
      'Panjang array data Q dan Qs harus sama.',
      'ARRAY_LENGTH_MISMATCH',
      { qLength: input.qData.length, qsLength: input.qsData.length }
    );
  }

  if (input.qData.length < 2) {
    throw new HydroValidationError(
      'Dibutuhkan minimal 2 pasang data debit untuk melakukan regresi linear.',
      'INSUFFICIENT_DATA'
    );
  }

  if (input.beratJenis <= 0) {
    throw new HydroValidationError(
      `Berat jenis sedimen harus positif (diberikan: ${input.beratJenis}).`,
      'INVALID_BULK_DENSITY',
      { bulkDensity: input.beratJenis }
    );
  }

  if (input.luasDas <= 0) {
    throw new HydroValidationError(
      `Luas DAS harus positif (diberikan: ${input.luasDas}).`,
      'INVALID_CATCHMENT_AREA',
      { catchmentArea: input.luasDas }
    );
  }

  if (input.bedLoadPercentage < 0 || input.bedLoadPercentage > 100) {
    throw new HydroValidationError(
      `Persentase bed load harus di antara 0-100 (diberikan: ${input.bedLoadPercentage}).`,
      'INVALID_BEDLOAD_PERCENTAGE',
      { bedLoadPercentage: input.bedLoadPercentage }
    );
  }

  // Cek apakah ada nilai 0 atau negatif di data sampel, karena kita butuh nilai log!
  for (let i = 0; i < input.qData.length; i++) {
    if (input.qData[i] <= 0 || input.qsData[i] <= 0) {
       // Kita tangani di regresi dengan max(..., 1e-10) tetapi lebih baik kasih peringatan/error
       console.warn(`Peringatan: Q atau Qs bernilai <= 0 pada indeks ${i}, akan dibulatkan asimtotik ke nilai kecil karena skala Log.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Core Calculation
// ---------------------------------------------------------------------------

/**
 * Menghitung Total Sedimen menggunakan Kurva Lengkung Sedimen (Rating Curve)
 *
 * **Metode**: Lengkung Sedimen Suspensi & Konversi Volume
 * **Langkah 1**: Regresi Linier log Qs = log a + b log Q
 * **Langkah 2**: Total Sedimen = Suspensi + Dasar (Bed load)
 * **Langkah 3**: Volume = Total / Berat Jenis
 * **Langkah 4**: Laju Erosi = Volume / Luas DAS
 *
 * @param input SedimentationInput object yang berisi data sampel dan parameter DAS
 */
export function calculateSedimentYield(input: SedimentationInput): SedimentYieldResult {
  validateInput(input);

  const { qData, qsData, luasDas, beratJenis, bedLoadPercentage, flowDurationDays, flowDurationQ } = input;

  // Langkah 1: Regresi Linear (Rating Curve)
  // log Qs = log a + b * log Q
  // Kita konversi data ke log basis 10
  let sumLogQ = 0;
  let sumLogQs = 0;
  let sumLogQLogQs = 0;
  let sumLogQSquare = 0;
  const n = qData.length;

  for (let i = 0; i < n; i++) {
    // Hindari log(0) dengan Math.max(..., 1e-10)
    const logQ = Math.log10(Math.max(qData[i], 1e-10));
    const logQs = Math.log10(Math.max(qsData[i], 1e-10));

    sumLogQ += logQ;
    sumLogQs += logQs;
    sumLogQLogQs += logQ * logQs;
    sumLogQSquare += logQ * logQ;
  }

  // Rumus Koefisien b
  // b = (n*E(xy) - E(x)*E(y)) / (n*E(x^2) - (E(x))^2)
  const numeratorB = n * sumLogQLogQs - sumLogQ * sumLogQs;
  const denominatorB = n * sumLogQSquare - sumLogQ * sumLogQ;
  
  // Guard untuk pembagian dengan nol
  let b = 1; 
  if (denominatorB !== 0) {
    b = numeratorB / denominatorB;
  }

  // Rumus Koefisien log a
  // log a = (E(y) - b*E(x)) / n
  const logA = (sumLogQs - b * sumLogQ) / n;
  const a = Math.pow(10, logA);

  // Jika ada flow duration curve yang diberikan, maka kita terapkan log Qs = log a + b log Q
  // pada setiap distribusi debit (flow duration curve), untuk mengestimasi akumulasi tahunan.
  // Jika tidak, kita estimasi bedasarkan total rata-rata untuk mock tes.
  let suspendedLoadTonnes = 0;
  
  if (flowDurationQ && flowDurationDays && flowDurationQ.length === flowDurationDays.length) {
    // Iterasi kurva distribusi debit
    for (let i = 0; i < flowDurationQ.length; i++) {
        const Q = flowDurationQ[i];
        const days = flowDurationDays[i];
        
        // Qs = a * Q^b (dalam satuan yang sama dengan data masukan, misal Ton/Hari)
        const qs = a * Math.pow(Q, b);
        
        // Asumsi Qs sudah dalam Ton/Hari
        suspendedLoadTonnes += qs * days;
    }
  } else {
    // Fallback kasar jika tak ada distribusi: anggap sampel Q rata-rata terjadi sepanjang 365 hari
    const avgQ = qData.reduce((sum, val) => sum + val, 0) / n;
    const avgQs = a * Math.pow(avgQ, b); // rata-rata ton/hari
    suspendedLoadTonnes = avgQs * 365;
  }

  // Langkah 2: Total Sedimen (Suspensi + Dasar)
  const bedLoadFraction = bedLoadPercentage / 100;
  const bedLoadTonnes = suspendedLoadTonnes * bedLoadFraction;
  const totalLoadTonnes = suspendedLoadTonnes + bedLoadTonnes;

  // Langkah 3: Konversi Volume
  // Volume (m³/Tahun) = Total Berat (Ton/Tahun) / Berat Jenis (Ton/m³)
  let totalVolumeM3 = 0;
  if (beratJenis > 0) {
    totalVolumeM3 = totalLoadTonnes / beratJenis;
  }

  // Langkah 4: Laju Erosi (Sediment Yield)
  // Erosi Rate (mm/Tahun) = (Volume / Luas DAS) * 1000
  // Note: Luas DAS biasanya dalam km². Maka konversi ke m²: Luas DAS * 1.000.000
  let erosionRateMm = 0;
  let specificYield = 0;
  if (luasDas > 0) {
    const luasDasM2 = luasDas * 1e6;
    erosionRateMm = (totalVolumeM3 / luasDasM2) * 1000;
    
    // Spesifik yield (Ton/km²/tahun)
    specificYield = totalLoadTonnes / luasDas;
  }

  return {
    a,
    b,
    suspendedLoadTonnes,
    bedLoadTonnes,
    totalLoadTonnes,
    totalVolumeM3,
    erosionRateMm,
    specificYield
  };
}
