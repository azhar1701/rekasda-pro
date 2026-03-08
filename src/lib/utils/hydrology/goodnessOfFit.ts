/**
 * Modul Uji Kecocokan (Goodness of Fit Test)
 * 
 * Melakukan dua macam pengujian statistik untuk menentukan kecocokan
 * distribusi frekuensi probabilitas teoritis dengan probabilitas empirik (pengamatan).
 */

export interface ChiSquareResult {
  accepted: boolean;
  computedX2: number;
  criticalX2: number;
  message: string;
}

export interface KolmogorovResult {
  accepted: boolean;
  maxDelta: number;
  criticalDelta: number;
  message: string;
}

/**
 * UJI CHI-SQUARE (SNI 2415:2016)
 * Mengukur tingkat signifikansi beda nilai frekuensi yang diamati (Of) dengan 
 * frekuensi yang diharapkan secara teoritis (Ef).
 * 
 * X² = Σ ((Of - Ef)² / Ef)
 * 
 * @param observed Array frekuensi observasi kelas (Of)
 * @param expected Array frekuensi harapan (Ef)
 * @param degreesOfFreedom Besaran derajat kebebasan (K - 1 - P)
 * @param significance Alpha rate, misal 0.05 (5%)
 */
export function chiSquareTest(
  observed: number[],
  expected: number[],
  degreesOfFreedom: number,
  _significance: number = 0.05
): ChiSquareResult {
  if (observed.length !== expected.length || observed.length === 0) {
    throw new Error('Panjang array observasi dan ekspektasi harus sama dan tidak kosong.');
  }

  let computedX2 = 0;
  for (let i = 0; i < observed.length; i++) {
    const Ef = expected[i];
    const Of = observed[i];
    
    // Hindari pembagian dengan nol
    if (Ef > 0) {
      computedX2 += Math.pow(Of - Ef, 2) / Ef;
    }
  }

  // CATATAN PRODUKSI: Nilai kritikal idealnya dilookup dari tabel Chi-Square (mis. P=0.05, DoF=2 -> X²Cr=5.991)
  // Untuk blueprint ini, kita akan me-mock sedikit nilai lookup DoF dasar.
  let criticalX2 = 5.991; // Mock default untuk DoF=2 alpha=0.05
  if (degreesOfFreedom === 1) criticalX2 = 3.841;
  else if (degreesOfFreedom === 2) criticalX2 = 5.991;
  else if (degreesOfFreedom === 3) criticalX2 = 7.815;
  else if (degreesOfFreedom === 4) criticalX2 = 9.488;
  else if (degreesOfFreedom === 5) criticalX2 = 11.070;

  const accepted = computedX2 < criticalX2;

  return {
    accepted,
    computedX2,
    criticalX2,
    message: accepted 
      ? `Data Fit (Diterima): X² hitung (${computedX2.toFixed(3)}) < X² kritis (${criticalX2.toFixed(3)})` 
      : `Data Tidak Fit (Ditolak): X² hitung (${computedX2.toFixed(3)}) >= X² kritis (${criticalX2.toFixed(3)})`
  };
}


/**
 * UJI SMIRNOV-KOLMOGOROV
 * Pengujian penyimpangan maksimum absolut (Δ maks) dari distribusi probabilitas empirik
 * dibandingkan dengan distribusi teoritis (Weibull dsb).
 * 
 * Δ maks = max | Pe - Pt |
 * 
 * @param data Array curah hujan hasil pengukuran.
 * @param theoreticalProb Function pointer yang mengembalikan Probabilitas Kumulatif F(x)
 * @param significance Alpha rate (0.05)
 */
export function smirnovKolmogorovTest(
  data: number[],
  theoreticalProb: (x: number) => number,
  _significance: number = 0.05
): KolmogorovResult {
  const n = data.length;
  // Urutkan data descending
  const sorted = [...data].sort((a, b) => b - a);
  let maxDelta = 0;

  for (let i = 0; i < n; i++) {
    // Probabilitas empiris Weibull: P(X >= x) = m / (n + 1)
    const m = i + 1;
    const empiricalProb = m / (n + 1);
    
    // Probabilitas teoritis
    const theoreticalP = theoreticalProb(sorted[i]);
    
    const delta = Math.abs(empiricalProb - theoreticalP);
    if (delta > maxDelta) {
      maxDelta = delta;
    }
  }

  // Nilai kritis Kolmogorov-Smirnov sederhana (Untuk alpha=0.05, aproksimasi N > 35 adalah 1.36/√n)
  // Jika n <= 35, lebih akurat menggunakan lookup tabel.
  const criticalDelta = 1.36 / Math.sqrt(n); 

  const accepted = maxDelta < criticalDelta;

  return {
    accepted,
    maxDelta,
    criticalDelta,
    message: accepted
      ? `Data Fit (Diterima): Δ maks (${maxDelta.toFixed(3)}) < Δ kritis (${criticalDelta.toFixed(3)})`
      : `Data Tidak Fit (Ditolak): Δ maks (${maxDelta.toFixed(3)}) >= Δ kritis (${criticalDelta.toFixed(3)})`
  };
}
