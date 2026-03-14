/**
 * Core Hydrology Math Engine
 * Fungsi matematika murni untuk transformasi R24 → IDF → ABM → Hujan Efektif
 * SNI 2415:2016 compliant
 */

/**
 * 1. Fungsi Mononobe (IDF Curve)
 * Menghitung intensitas hujan berdasarkan durasi
 * 
 * Formula: I = (R24 / 24) × (24 / t)^(2/3)
 * 
 * @param R24 - Hujan harian maksimum (mm)
 * @param t - Durasi hujan kumulatif (jam)
 * @returns Intensitas hujan (mm/jam)
 */
export function calculateMononobe(R24: number, t: number): number {
 if (t <= 0) return 0;
 const I = (R24 / 24) * Math.pow(24 / t, 2 / 3);
 return I;
}

/**
 * 2. Alternating Block Method (ABM)
 * Mendistribusikan hujan harian menjadi distribusi jam-jaman
 * 
 * Algoritma 6 Langkah:
 * 1. Hitung intensitas I untuk setiap jam t (Mononobe)
 * 2. Hitung kedalaman kumulatif X = I × t
 * 3. Hitung selisih ΔX (incremental depth)
 * 4. Hitung persentase ΔX terhadap total
 * 5. Distribusi alternating (terbesar di tengah)
 * 6. Kalikan persentase dengan R24
 * 
 * @param R24 - Hujan harian maksimum (mm)
 * @param durasiHujan - Durasi total hujan (jam)
 * @param interval - Interval waktu (jam), default 1
 * @returns Array distribusi hujan jam-jaman (mm)
 */
export function distributeRainfallABM(
 R24: number,
 durasiHujan: number,
 interval: number = 1
): number[] {
 const n = Math.floor(durasiHujan / interval);
 if (n <= 0) return [];

 // Step 1 & 2: Hitung intensitas dan kedalaman kumulatif
 const cumulativeDepth: number[] = [];
 for (let i = 1; i <= n; i++) {
 const t = i * interval;
 const I = calculateMononobe(R24, t);
 const X = I * t;
 cumulativeDepth.push(X);
 }

 // Step 3: Hitung selisih ΔX (incremental depth)
 const incrementalDepth: number[] = [];
 for (let i = 0; i < n; i++) {
 const deltaX = i === 0 ? cumulativeDepth[0] : cumulativeDepth[i] - cumulativeDepth[i - 1];
 incrementalDepth.push(deltaX);
 }

 // Step 4: Normalisasi - hitung persentase dari total incremental depth
 const totalDepth = incrementalDepth.reduce((sum, val) => sum + val, 0);
 const percentages = incrementalDepth.map(val => (val / totalDepth) * 100);

 // Step 5: Distribusi Alternating Block (terbesar di tengah)
 // Sort descending
 const sortedIndices = percentages
 .map((val, idx) => ({ val, idx }))
 .sort((a, b) => b.val - a.val);

 const hyetograph: number[] = new Array(n).fill(0);
 const mid = Math.floor(n / 2);

 for (let i = 0; i < sortedIndices.length; i++) {
 let position: number;
 if (i === 0) {
 // Terbesar di tengah
 position = mid;
 } else if (i % 2 === 1) {
 // Ganjil: di bawah tengah
 position = mid + Math.ceil(i / 2);
 } else {
 // Genap: di atas tengah
 position = mid - i / 2;
 }
 
 // Ensure position is within bounds
 position = Math.max(0, Math.min(n - 1, position));
 hyetograph[position] = percentages[sortedIndices[i].idx];
 }

 // Step 6: Kalikan persentase dengan R24
 const rainfallDistribution = hyetograph.map(pct => (pct / 100) * R24);

 // CRITICAL FIX: Normalisasi untuk memastikan 100% volume conservation
 // Mononobe IDF tidak konservatif, jadi kita scale output ke R24
 const totalDistributed = rainfallDistribution.reduce((sum, val) => sum + val, 0);
 const scaleFactor = R24 / totalDistributed;
 const normalized = rainfallDistribution.map(val => val * scaleFactor);

 return normalized;
}

/**
 * 3. Hujan Efektif (Effective Rainfall)
 * Menghitung hujan efektif dengan metode Koefisien Pengaliran (C)
 * 
 * Formula: Pe = P × C
 * 
 * @param hyetograph - Array distribusi hujan jam-jaman (mm)
 * @param koefisienC - Koefisien pengaliran (0-1)
 * @returns Array hujan efektif (mm)
 */
export function calculateEffectiveRainfall(
 hyetograph: number[],
 koefisienC: number
): number[] {
 if (koefisienC < 0 || koefisienC > 1) {
 throw new Error('Koefisien C harus antara 0 dan 1');
 }
 
 return hyetograph.map(rainfall => rainfall * koefisienC);
}

/**
 * Utility: Generate tabel lengkap untuk visualisasi ABM
 * 
 * @param R24 - Hujan harian maksimum (mm)
 * @param durasiHujan - Durasi total hujan (jam)
 * @param interval - Interval waktu (jam)
 * @returns Array objek dengan kolom lengkap untuk tabel
 */
export interface ABMTableRow {
 t: number; // Durasi (jam)
 I: number; // Intensitas (mm/jam)
 X: number; // Kedalaman kumulatif (mm)
 deltaX: number; // Selisih kedalaman (mm)
 deltaXPercent: number; // Persentase (%)
 hyetograph: number; // Distribusi ABM (mm)
}

export function generateABMTable(
 R24: number,
 durasiHujan: number,
 interval: number = 1
): ABMTableRow[] {
 const n = Math.floor(durasiHujan / interval);
 if (n <= 0) return [];

 // Hitung semua nilai
 const table: ABMTableRow[] = [];
 const cumulativeDepth: number[] = [];
 const incrementalDepth: number[] = [];

 // Step 1-3
 for (let i = 1; i <= n; i++) {
 const t = i * interval;
 const I = calculateMononobe(R24, t);
 const X = I * t;
 cumulativeDepth.push(X);
 
 const deltaX = i === 1 ? X : X - cumulativeDepth[i - 2];
 incrementalDepth.push(deltaX);
 }

 // Step 4: Normalisasi - hitung persentase dari total incremental depth
 const totalDepth = incrementalDepth.reduce((sum, val) => sum + val, 0);
 const percentages = incrementalDepth.map(val => (val / totalDepth) * 100);

 // Step 5
 const sortedIndices = percentages
 .map((val, idx) => ({ val, idx }))
 .sort((a, b) => b.val - a.val);

 const hyetograph: number[] = new Array(n).fill(0);
 const mid = Math.floor(n / 2);

 for (let i = 0; i < sortedIndices.length; i++) {
 let position: number;
 if (i === 0) {
 position = mid;
 } else if (i % 2 === 1) {
 position = mid + Math.ceil(i / 2);
 } else {
 position = mid - i / 2;
 }
 position = Math.max(0, Math.min(n - 1, position));
 hyetograph[position] = percentages[sortedIndices[i].idx];
 }

 // Step 6: Kalikan persentase dengan R24 dan normalisasi
 const rainfallDistribution = hyetograph.map(pct => (pct / 100) * R24);
 const totalDistributed = rainfallDistribution.reduce((sum, val) => sum + val, 0);
 const scaleFactor = R24 / totalDistributed;
 const normalized = rainfallDistribution.map(val => val * scaleFactor);

 // Build table
 for (let i = 0; i < n; i++) {
 table.push({
 t: (i + 1) * interval,
 I: calculateMononobe(R24, (i + 1) * interval),
 X: cumulativeDepth[i],
 deltaX: incrementalDepth[i],
 deltaXPercent: percentages[i],
 hyetograph: normalized[i]
 });
 }

 return table;
}
