import { calculateStatisticalParameters } from './statistics';

/**
 * @deprecated Modul ini telah digantikan oleh `@/lib/utils/frequencyMath.ts`.
 * Jangan import dari file ini — gunakan `frequencyMath.ts` sebagai single source of truth.
 * File ini dipertahankan sementara sebagai referensi dan akan dihapus di versi berikutnya.
 *
 * Modul Analisis Frekuensi Hidrologi
 * 
 * Modul ini menyediakan fungsi untuk menghitung Curah Hujan Rencana (Xt) 
 * pada berbagai Kala Ulang / Periode Ulang (Return Period / Tr) menggunakan
 * 4 metode distribusi teoritis utama (SNI 2415:2016).
 */

// ─── UTILS: FAKTOR FREKUENSI NORMAL (K) ───
// Pendekatan invers CDF (Probabilitas Normal Standar).
interface NormalFrequencyFactor {
 Tr: number;
 K: number;
}
const NORMAL_FACTORS: NormalFrequencyFactor[] = [
 { Tr: 2, K: 0.000 },
 { Tr: 5, K: 0.842 },
 { Tr: 10, K: 1.282 },
 { Tr: 20, K: 1.645 },
 { Tr: 25, K: 1.751 },
 { Tr: 50, K: 2.054 },
 { Tr: 100, K: 2.326 },
 { Tr: 200, K: 2.576 },
];
function getNormalK(Tr: number): number {
 const match = NORMAL_FACTORS.find(f => f.Tr === Tr);
 if (match) return match.K;
 // Fallback: Jika nilai eksak tidak ada, kembalikan 0. (Dalam produksi riil, gunakan spline interpolator numerik).
 return 0; // Aproksimasi yang sangat disederhanakan.
}

// ─── Tabel Gumbel Reduksi (Yn dan Sn) ───
// Secara standar hidrologi, Yn dan Sn bergantung pada jumlah pengamatan (n).
function getGumbelParams(n: number): { Yn: number, Sn: number } {
 // Standar nilai asimtotik (Gumbel 1941) untuk n menuju tak hingga adalah Yn=0.5772 dan Sn=1.2825.
 // Untuk n terbatas, nilai empiris biasanya antara n=10 sampai n=100.
 // Disini kita gunakan rata-rata aproksimasi cepat jika tabel lookup tidak diberikan.
 // Nilai ini valid dan umum digunakan dalam perangkat lunak praktis jika n ~ 10-50.
 
 let Yn = 0.54; // Kisaran n=10-50 (0.49 - 0.56)
 let Sn = 1.10; // Kisaran n=10-50 (0.94 - 1.16)

 if (n <= 10) { Yn = 0.4952; Sn = 0.9496; }
 else if (n <= 15) { Yn = 0.5128; Sn = 1.0206; }
 else if (n <= 20) { Yn = 0.5236; Sn = 1.0628; }
 else if (n <= 25) { Yn = 0.5309; Sn = 1.0915; }
 else if (n <= 30) { Yn = 0.5362; Sn = 1.1124; }
 else if (n <= 40) { Yn = 0.5436; Sn = 1.1413; }
 else if (n <= 50) { Yn = 0.5485; Sn = 1.1607; }
 else if (n <= 100) { Yn = 0.5600; Sn = 1.2065; }
 else { Yn = 0.5772; Sn = 1.2825; }

 return { Yn, Sn };
}

// ─── FAKTOR K LOG PEARSON TIPE III ───
// Faktor K bergantung pada kemencengan (Cs) dan Kala Ulang (Tr).
function getPearsonK(Cs: number, Tr: number): number {
 // Menggunakan pendekatan analitik/numerik (Rumus Kite, 1977):
 // K = z + (z^2 - 1)k + 1/3 (z^3 - 6z)k^2 - (z^2 - 1)k^3 + zk^4 + 1/3k^5
 // Dimana z = normal standar deviasi, k = Cs/6.
 const z = getNormalK(Tr); 
 const k = Cs / 6.0;
 
 if (Tr === 2) { 
 // z untuk Tr 2 = 0
 return 2 / Cs * (Math.pow(1 - Cs*Cs/36, 3) - 1); 
 }

 const K_pearson = z + 
 (Math.pow(z, 2) - 1) * k + 
 (1/3) * (Math.pow(z, 3) - 6*z) * Math.pow(k, 2) - 
 (Math.pow(z, 2) - 1) * Math.pow(k, 3) + 
 z * Math.pow(k, 4) + 
 (1/3) * Math.pow(k, 5);
 
 return K_pearson;
}

/**
 * 1. DISTRIBUSI NORMAL
 * Xt = X_mean + K * S
 */
export function distNormal(data: number[], Tr: number): number {
 const stats = calculateStatisticalParameters(data);
 const K = getNormalK(Tr);
 return stats.mean + (K * stats.stdDev);
}

/**
 * 2. DISTRIBUSI LOG NORMAL (2-Parameter)
 * Yt = Y_mean + K * Sy (Dimana Y = log(X))
 * Xt = 10^Yt
 */
export function distLogNormal(data: number[], Tr: number): number {
 // Transformasi data ke Log10
 const logData = data.map(val => Math.log10(val));
 const statsLog = calculateStatisticalParameters(logData);
 
 const K = getNormalK(Tr);
 const Yt = statsLog.mean + (K * statsLog.stdDev);
 
 return Math.pow(10, Yt);
}

/**
 * 3. DISTRIBUSI LOG PEARSON TIPE III
 * Yt = Y_mean + K(Cs) * Sy (Dimana Y = log(X))
 * Xt = 10^Yt
 */
export function distLogPearsonIII(data: number[], Tr: number): number {
 const logData = data.map(val => Math.log10(val));
 const statsLog = calculateStatisticalParameters(logData);
 
 const K = getPearsonK(statsLog.skewness, Tr);
 const Yt = statsLog.mean + (K * statsLog.stdDev);
 
 return Math.pow(10, Yt);
}

/**
 * 4. DISTRIBUSI GUMBEL TIPE I
 * Xt = X_mean + S * ((Yt - Yn) / Sn)
 * Dimana Yt = -ln(-ln((Tr-1)/Tr))
 */
export function distGumbel(data: number[], Tr: number): number {
 const stats = calculateStatisticalParameters(data);
 
 // Yt (Reduced Variate Gumbel)
 const Yt = -Math.log(-Math.log((Tr - 1) / Tr));
 
 // Ambil konstanta reduksi berdasarkan jumlah data N
 const { Yn, Sn } = getGumbelParams(stats.n);
 
 const K = (Yt - Yn) / Sn;
 return stats.mean + (K * stats.stdDev);
}
