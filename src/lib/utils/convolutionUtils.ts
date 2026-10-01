/**
 * Safe Convolution Utility
 * Fungsi konvolusi hidrologi yang aman dengan validasi lengkap
 */

export interface ConvolutionInput {
  hujanEfektif: number[];
  ordinatHSS: number[];
  baseflow?: number;
  timeStep?: number;
  rainInterval?: number;
  luasDas?: number;
}

export interface ConvolutionResult {
  debitBanjir: number[];
  debitPuncak: number;
  waktuPuncak: number;
  volumeTotal: number;
  volumeConservationRatio?: number;
}

/**
 * Hitung konvolusi hidrograf dengan superposisi matriks berbasis time-lag nyata
 * SNI 2415:2016 Compliant
 * 
 * @param input - Data hujan efektif dan ordinat HSS
 * @returns Hasil konvolusi dengan debit puncak dan volume total
 */
export function calculateConvolution(input: ConvolutionInput): ConvolutionResult {
  const {
    hujanEfektif,
    ordinatHSS,
    baseflow = 0,
    timeStep = 0.5,
    rainInterval = 1.0,
    luasDas,
  } = input;

  // Validasi input
  if (!hujanEfektif?.length || !ordinatHSS?.length) {
    return {
      debitBanjir: [],
      debitPuncak: 0,
      waktuPuncak: 0,
      volumeTotal: 0
    };
  }

  // Hitung faktor pergeseran indeks berdasarkan rasio interval hujan vs step HSS
  // Misal: rainInterval = 1.0h, timeStep = 0.5h -> lagSteps = 2 (tiap pulsa bergeser 2 ordinat)
  const lagSteps = Math.max(1, Math.round(rainInterval / timeStep));

  // Hitung total steps yang tepat
  const totalSteps = (hujanEfektif.length - 1) * lagSteps + ordinatHSS.length;
  const debitBanjir = new Array<number>(totalSteps).fill(0);

  // Superposisi diskrit: Q(t) = Σ [P(i) × U(t - i × Δt_rain)]
  for (let i = 0; i < hujanEfektif.length; i++) {
    const lagIndex = i * lagSteps;
    const rain = hujanEfektif[i];
    if (rain === 0) continue;

    for (let j = 0; j < ordinatHSS.length; j++) {
      debitBanjir[lagIndex + j] += rain * ordinatHSS[j];
    }
  }

  // Tambahkan baseflow
  const debitDenganBaseflow = debitBanjir.map(q => {
    const total = q + baseflow;
    return isFinite(total) ? total : 0;
  });

  // Ekstraksi nilai puncak
  const debitPuncak = Math.max(...debitDenganBaseflow, 0);
  const indexPuncak = debitDenganBaseflow.indexOf(debitPuncak);
  const waktuPuncak = indexPuncak * timeStep;

  // Hitung volume total (trapezoidal rule) dalam m³
  let volumeTotal = 0;
  for (let i = 0; i < debitDenganBaseflow.length - 1; i++) {
    const avgQ = (debitDenganBaseflow[i] + debitDenganBaseflow[i + 1]) / 2;
    volumeTotal += avgQ * timeStep * 3600; // Convert to m³
  }

  // Verifikasi konservasi volume air limpasan (Runoff Volume Conservation Ratio)
  let volumeConservationRatio: number | undefined;
  if (luasDas && luasDas > 0) {
    const totalEffectiveRainMm = hujanEfektif.reduce((sum, v) => sum + v, 0);
    const expectedDirectRunoffVolume = totalEffectiveRainMm * luasDas * 1000; // 1 mm * 1 km² = 1000 m³
    const directRunoffVolume = volumeTotal - (baseflow * totalSteps * timeStep * 3600);
    if (expectedDirectRunoffVolume > 0) {
      volumeConservationRatio = Number((directRunoffVolume / expectedDirectRunoffVolume).toFixed(4));
    }
  }

  return {
    debitBanjir: debitDenganBaseflow,
    debitPuncak: Number(debitPuncak.toFixed(2)),
    waktuPuncak: Number(waktuPuncak.toFixed(1)),
    volumeTotal: Number(volumeTotal.toFixed(2)),
    volumeConservationRatio,
  };
}

/**
 * Validasi data sebelum konvolusi
 */
export function validateConvolutionData(
  hujanEfektif: number[] | undefined,
  ordinatHSS: number[] | undefined
): { valid: boolean; message: string } {
  if (!hujanEfektif?.length) {
    return { valid: false, message: 'Selesaikan Distribusi Hujan terlebih dahulu' };
  }
  if (!ordinatHSS?.length) {
    return { valid: false, message: 'Pilih metode HSS terlebih dahulu' };
  }
  if (hujanEfektif.some(v => !isFinite(v))) {
    return { valid: false, message: 'Data hujan efektif mengandung nilai tidak valid' };
  }
  if (ordinatHSS.some(v => !isFinite(v))) {
    return { valid: false, message: 'Data ordinat HSS mengandung nilai tidak valid' };
  }
  return { valid: true, message: 'Data valid' };
}
