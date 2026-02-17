/**
 * HSS Nakayasu (Nakayasu Synthetic Unit Hydrograph)
 * ========================================
 * 
 * Metode hidrograf satuan sintetik untuk DAS besar (> 300 Ha)
 * Dikembangkan oleh Nakayasu (Jepang) dan disesuaikan untuk Indonesia
 * 
 * Reference:
 * - SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana)
 * - Soewarno (1995) "Hidrologi Aplikasi Metode Statistik"
 * - Sosrodarsono & Takeda (1983)
 */

export interface NakayasuParams {
  A: number;      // Luas DAS (km²)
  L: number;      // Panjang sungai utama (km)
  Ro: number;     // Hujan satuan (mm)
  Alpha: number;  // Koefisien karakteristik DAS (1.5-3.0)
}

export interface NakayasuResults {
  Tg: number;     // Waktu konsentrasi (jam)
  Tp: number;     // Waktu puncak (jam)
  T03: number;    // Waktu dasar hidrograf (jam)
  Qp: number;     // Debit puncak (m³/s)
}

/**
 * Hitung waktu konsentrasi (Tg)
 * Tg = 0.21 × L^0.7
 * 
 * @param L - Panjang sungai utama (km)
 * @returns Waktu konsentrasi (jam)
 */
export function calculateTg(L: number): number {
  if (L <= 0) return 0;
  return 0.21 * Math.pow(L, 0.7);
}

/**
 * Hitung waktu dari puncak hujan sampai puncak hidrograf (Tp)
 * Tp = Tg + 0.8 × tr
 * dimana tr = 0.5 × Tg sampai Tg (biasanya diambil tr = Alpha × Tg)
 * 
 * @param Tg - Waktu konsentrasi (jam)
 * @param Alpha - Koefisien karakteristik DAS
 * @returns Waktu puncak (jam)
 */
export function calculateTp(Tg: number, Alpha: number): number {
  const tr = Alpha * Tg;
  return Tg + 0.8 * tr;
}

/**
 * Hitung waktu dasar hidrograf (T03)
 * T03 = Alpha × Tg
 * 
 * @param Alpha - Koefisien karakteristik DAS
 * @param Tg - Waktu konsentrasi (jam)
 * @returns Waktu dasar (jam)
 */
export function calculateT03(Alpha: number, Tg: number): number {
  return Alpha * Tg;
}

/**
 * Hitung debit puncak (Qp)
 * Qp = (0.278 × A × Ro) / (3.6 × Tp)
 * 
 * @param A - Luas DAS (km²)
 * @param Ro - Hujan satuan (mm)
 * @param Tp - Waktu puncak (jam)
 * @returns Debit puncak (m³/s)
 */
export function calculateQp(A: number, Ro: number, Tp: number): number {
  if (A <= 0 || Ro <= 0 || Tp <= 0) return 0;
  return (0.278 * A * Ro) / (3.6 * Tp);
}

/**
 * Hitung ordinat hidrograf pada waktu t
 * 
 * Kurva naik (0 < t < Tp):
 * Qt = Qp × (t/Tp)^2.4
 * 
 * Kurva turun (t >= Tp):
 * - Tp < t < (Tp + T03): Qt = Qp × 0.3^((t-Tp)/T03)
 * - (Tp + T03) < t < (Tp + T03 + 1.5×T03): Qt = Qp × 0.3^(1 + (t-Tp-T03)/(1.5×T03))
 * - t > (Tp + 2.5×T03): Qt = Qp × 0.3^(2.5 + (t-Tp-2.5×T03)/(2×T03))
 */
export function calculateDischargeAtTime(
  t: number,
  Qp: number,
  Tp: number,
  T03: number
): number {
  if (t < 0) return 0;
  
  // Kurva naik
  if (t < Tp) {
    return Qp * Math.pow(t / Tp, 2.4);
  }
  
  // Kurva turun - segmen 1
  if (t < Tp + T03) {
    return Qp * Math.pow(0.3, (t - Tp) / T03);
  }
  
  // Kurva turun - segmen 2
  if (t < Tp + T03 + 1.5 * T03) {
    return Qp * Math.pow(0.3, 1 + (t - Tp - T03) / (1.5 * T03));
  }
  
  // Kurva turun - segmen 3
  return Qp * Math.pow(0.3, 2.5 + (t - Tp - 2.5 * T03) / (2 * T03));
}

/**
 * Generate data hidrograf lengkap
 */
export function generateHydrograph(
  Qp: number,
  Tp: number,
  T03: number,
  timeStep: number = 0.5
): Array<{ time: number; discharge: number }> {
  const data: Array<{ time: number; discharge: number }> = [];
  const totalTime = Tp + 3 * T03; // Total durasi hidrograf
  
  for (let t = 0; t <= totalTime; t += timeStep) {
    const Q = calculateDischargeAtTime(t, Qp, Tp, T03);
    data.push({
      time: parseFloat(t.toFixed(2)),
      discharge: parseFloat(Q.toFixed(3))
    });
  }
  
  return data;
}

/**
 * Perhitungan lengkap HSS Nakayasu
 */
export function calculateNakayasu(params: NakayasuParams): NakayasuResults {
  const { A, L, Ro, Alpha } = params;
  
  // Validasi input
  if (A <= 0) throw new Error('Luas DAS harus > 0 km²');
  if (L <= 0) throw new Error('Panjang sungai harus > 0 km');
  if (Ro <= 0) throw new Error('Hujan satuan harus > 0 mm');
  if (Alpha < 1.5 || Alpha > 3.0) {
    console.warn('Alpha biasanya antara 1.5-3.0');
  }
  
  // Perhitungan
  const Tg = calculateTg(L);
  const Tp = calculateTp(Tg, Alpha);
  const T03 = calculateT03(Alpha, Tg);
  const Qp = calculateQp(A, Ro, Tp);
  
  return { Tg, Tp, T03, Qp };
}
