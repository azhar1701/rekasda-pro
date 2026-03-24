/**
 * Floating-Point Safety Utilities
 *
 * Fungsi utilitas untuk menangani presisi floating-point pada kalkulasi
 * hidrologi presisi tinggi. Mencegah akumulasi error pada iterasi panjang
 * (e.g., hydrograph generation) dan perbandingan floating-point tidak aman.
 *
 * @standard SNI 2415:2016
 */

import { PRECISION, PrecisionKey } from '@/lib/constants/precision';

/**
 * Epsilon tolerance untuk perbandingan floating-point hidrologi.
 * Cukup kecil untuk presisi teknik (~10 digit signifikan)
 * tapi cukup besar untuk menghindari false positives dari IEEE 754 rounding.
 */
export const EPSILON = 1e-10;

/**
 * Perbandingan aman: a ≤ b (dengan epsilon tolerance)
 * Mencegah false negatives akibat akumulasi error floating-point.
 *
 * @example
 * // Instead of: if (t <= Tp + T03)
 * if (lte(t, Tp + T03)) { ... }
 */
export function lte(a: number, b: number): boolean {
  return a < b + EPSILON;
}

/**
 * Perbandingan aman: a ≥ b (dengan epsilon tolerance)
 */
export function gte(a: number, b: number): boolean {
  return a > b - EPSILON;
}

/**
 * Perbandingan aman: a ≈ b (within epsilon)
 */
export function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

/**
 * Pembulatan ke presisi engineering standar.
 * Menggunakan Math.round() yang lebih deterministik daripada toFixed().
 *
 * @param value - Nilai yang akan dibulatkan
 * @param decimals - Jumlah desimal (default: 3)
 * @returns Nilai yang sudah dibulatkan
 *
 * @example
 * roundEng(3.14159265, 3) // → 3.142
 * roundEng(0.30000000000000004, 1) // → 0.3
 */
export function roundEng(value: number, decimals: number = 3): number {
  if (!isFinite(value)) return value;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Pembulatan menggunakan kunci presisi standar dari PRECISION constants.
 *
 * @param value - Nilai yang akan dibulatkan
 * @param key - Kunci presisi dari PRECISION constants
 * @returns Nilai yang sudah dibulatkan sesuai standar
 *
 * @example
 * roundByKey(3.14159, 'discharge') // → 3.142 (3 desimal)
 * roundByKey(12345.6789, 'volume') // → 12346 (bilangan bulat)
 */
export function roundByKey(value: number, key: PrecisionKey): number {
  return roundEng(value, PRECISION[key]);
}

/**
 * Generator iterator step aman (anti-drift).
 * Menghitung posisi dari indeks integer × step, bukan akumulasi t += step.
 *
 * KRITIS: Menggantikan pola rentan drift:
 *   for (let t = 0; t <= maxTime; t += 0.1)  // ❌ drift setelah ~15 iterasi
 *
 * Dengan:
 *   for (const t of safeRange(0, maxTime, 0.1))  // ✅ presisi terjaga
 *
 * @param start - Nilai awal
 * @param end - Nilai akhir (inclusive)
 * @param step - Ukuran langkah
 * @yields Nilai-nilai dari start hingga end dengan presisi terjaga
 *
 * @example
 * [...safeRange(0, 1, 0.1)]
 * // → [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
 */
export function* safeRange(start: number, end: number, step: number): Generator<number> {
  if (step <= 0) throw new Error('Step harus bernilai positif');
  if (start > end) return;

  const count = Math.round((end - start) / step);
  // Determine precision from step size
  const stepStr = step.toString();
  const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;

  for (let i = 0; i <= count; i++) {
    yield roundEng(start + i * step, Math.max(decimals, 6));
  }
}

/**
 * Koleksi nilai dari safeRange ke array.
 * Convenience wrapper untuk kasus di mana array diperlukan langsung.
 */
export function safeRangeArray(start: number, end: number, step: number): number[] {
  return [...safeRange(start, end, step)];
}
