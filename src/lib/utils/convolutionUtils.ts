/**
 * Safe Convolution Utility
 * Fungsi konvolusi hidrologi yang aman dengan validasi lengkap
 */

export interface ConvolutionInput {
 hujanEfektif: number[];
 ordinatHSS: number[];
 baseflow?: number;
 timeStep?: number;
}

export interface ConvolutionResult {
 debitBanjir: number[];
 debitPuncak: number;
 waktuPuncak: number;
 volumeTotal: number;
}

/**
 * Hitung konvolusi hidrograf dengan superposisi matriks
 * 
 * @param input - Data hujan efektif dan ordinat HSS
 * @returns Hasil konvolusi dengan debit puncak
 */
export function calculateConvolution(input: ConvolutionInput): ConvolutionResult {
 const { hujanEfektif, ordinatHSS, baseflow = 0, timeStep = 0.5 } = input;

 // Validasi input
 if (!hujanEfektif?.length || !ordinatHSS?.length) {
 return {
 debitBanjir: [],
 debitPuncak: 0,
 waktuPuncak: 0,
 volumeTotal: 0
 };
 }

 // Hitung panjang output
 const totalJam = hujanEfektif.length + ordinatHSS.length - 1;
 const debitBanjir = new Array<number>(totalJam).fill(0);

 // Superposisi: Q(n) = Σ [P(i) × U(n-i)]
 for (let i = 0; i < hujanEfektif.length; i++) {
 for (let j = 0; j < ordinatHSS.length; j++) {
 debitBanjir[i + j] += hujanEfektif[i] * ordinatHSS[j];
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

 // Hitung volume total (trapezoidal rule)
 let volumeTotal = 0;
 for (let i = 0; i < debitDenganBaseflow.length - 1; i++) {
 const avgQ = (debitDenganBaseflow[i] + debitDenganBaseflow[i + 1]) / 2;
 volumeTotal += avgQ * timeStep * 3600; // Convert to m³
 }

 return {
 debitBanjir: debitDenganBaseflow,
 debitPuncak: Number(debitPuncak.toFixed(2)),
 waktuPuncak: Number(waktuPuncak.toFixed(1)),
 volumeTotal: Number(volumeTotal.toFixed(2))
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
