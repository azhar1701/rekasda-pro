/**
 * @deprecated Neraca air dan SPA telah dikonsolidasikan ke `@/services/waterBalanceEngine.ts`.
 * Gunakan `calculateWaterBalance()` dan `sequentPeakAlgorithm()` dari `waterBalanceEngine.ts`.
 * File ini dipertahankan sementara sebagai referensi dan akan dihapus di versi berikutnya.
 *
 * Modul Neraca Air & Kapasitas Waduk (Water Balance)
 * 
 * Meliputi simulasi tata guna air (Ketersediaan vs Kebutuhan) 
 * dan penentuan kapasitas tampungan efektif menggunakan SPA.
 */

export interface WaterBalanceStep {
 timeIndex: number;
 label: string; // Contoh: "Jan", "Feb"
 inflow: number; // I (m3) - Ketersediaan / Andalan
 outflow: number; // O (m3) - Kebutuhan Rencana 
 losses: number; // R (m3) - Evaporasi + Rembesan
 storage: number; // S (m3) - Tampungan Aktual di Akhir dt
 spill: number; // L (m3) - Limpasan / Buangan jika S > Kapasitas Maks
 deficit: number; // K (m3) - Kekurangan pemenuhan air
}

/**
 * Simulasi Neraca Air Step-by-Step
 * P.Kesinambungan: St = St-1 + (I - R - O - L + K)
 * 
 * @param inflows Array ketersediaan air (m3)
 * @param outflows Array kebutuhan air rencana (m3)
 * @param evaporationLosses Array kehilangan air rata-rata (m3)
 * @param maxCapacity Kapasitas maksimum waduk (m3)
 * @param initialStorage Tampungan awal di t=0 (m3), biasanya diset penuh (maks capacity)
 * @param timeLabels Label array waktu, misal: ['Jan', 'Feb', ...]
 */
export function simulateWaterBalance(
 inflows: number[],
 outflows: number[],
 evaporationLosses: number[],
 maxCapacity: number,
 initialStorage: number,
 timeLabels?: string[]
): WaterBalanceStep[] {
 const steps: WaterBalanceStep[] = [];
 const n = inflows.length;

 // Asumsi array sejajar
 if (outflows.length !== n || evaporationLosses.length !== n) {
 throw new Error('Dimensi array waktu untuk inflow, outflow, dan losses harus identik.');
 }

 let currentStorage = initialStorage;

 for (let t = 0; t < n; t++) {
 const I = inflows[t];
 const O = outflows[t];
 const R = evaporationLosses[t];
 
 // Perubahan tampungan sebelum Spill/Deficit
 let S_tentative = currentStorage + I - R - O;
 let spill = 0;
 let deficit = 0;

 // Evaluasi Kesinambungan
 if (S_tentative > maxCapacity) {
 spill = S_tentative - maxCapacity;
 S_tentative = maxCapacity; // Air melimpah lewat spillway
 } else if (S_tentative < 0) {
 deficit = Math.abs(S_tentative); // Tampungan waduk habis, gagal suplai penuh
 S_tentative = 0;
 }

 steps.push({
 timeIndex: t,
 label: timeLabels && timeLabels[t] ? timeLabels[t] : `t=${t}`,
 inflow: I,
 outflow: O,
 losses: R,
 storage: S_tentative,
 spill: spill,
 deficit: deficit
 });

 currentStorage = S_tentative;
 }

 return steps;
}

/**
 * Algoritma Sequent Peak (SPA - Numerik)
 * 
 * Menentukan Volume Tampungan Efektif Waduk yang dibutuhkan untuk
 * mengatisispasi kemarau kritis. Memakai 2 siklus (2 Tahun/Periode) 
 * jika ujung tahun tidak kosong.
 * 
 * Xt = Inflow - Outflow - Losses
 * Vt = Vt-1 - Xt
 * Jika Vt < 0 maka Vt = 0.
 * Kapasitas Maksimum Waduk (C) = Max(Vt) dari seluruh siklus.
 * 
 * @param inflows Array Ketersediaan
 * @param outflows Array Kebutuhan Total
 * @returns Kapasitas Tampungan Minimum yang diwajibkan (m3)
 */
export function sequentPeakAlgorithm(
 inflows: number[],
 outflows: number[]
): number {
 if (inflows.length !== outflows.length || inflows.length === 0) return 0;
 
 // Gandakan array menjadi 2 siklus (agar mengakomodir kemarau panjang lintas tahun akhir)
 const cycleInflows = [...inflows, ...inflows];
 const cycleOutflows = [...outflows, ...outflows];

 let currentV = 0;
 let maxV = 0;

 for (let i = 0; i < cycleInflows.length; i++) {
 // Xt: Selisih Ketersediaan dan Kebutuhan
 const Xt = cycleInflows[i] - cycleOutflows[i];
 
 // Vt (Defisit Kumulatif)
 // Jika Kebutuhan > Inflow, maka Vt naik (menyerap tampungan)
 currentV = currentV - Xt;

 if (currentV < 0) {
 currentV = 0; // Surplus tdk bisa kurang dari nol, waduk diasumsikan melimpah (spill)
 }

 if (currentV > maxV) {
 maxV = currentV;
 }
 }

 return maxV;
}
