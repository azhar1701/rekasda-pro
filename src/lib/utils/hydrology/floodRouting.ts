/**
 * Modul Penelusuran Banjir (Flood/Reservoir Routing)
 * 
 * Meliputi simulasi penelusuran banjir untuk desain waduk atau embung
 * menggunakan metode Modified Puls (Level-Pool Routing).
 */

export interface RoutingStep {
 timeIndex: number; // t
 inflow: number; // I
 outflow: number; // O
 storage: number; // S
 elevation: number; // H (Elevasi Muka Air)
}

/**
 * Kurva Karakteristik Tampungan Waduk 
 * Relasi S (Storage) terhadap H (Elevasi) terhadap O (Outflow dr Pelimpah).
 */
export interface ReservoirCharacteristicCurve {
 elevations: number[]; // Array ketinggian H (m)
 storages: number[]; // Array volume S (m3) -> harus sinkron indeks dgn H
 outflows: number[]; // Array kapasitas pelimpah O (m3/s) pada elevasi H
}

/**
 * Interpolasi Linier Sederhana. 
 * Cari Y pada saat X diketahui dalam kurva X-Y.
 */
function interpolate(x: number, xArray: number[], yArray: number[]): number {
 if (x <= xArray[0]) return yArray[0];
 const lastIdx = xArray.length - 1;
 if (x >= xArray[lastIdx]) return yArray[lastIdx];

 for (let i = 0; i < lastIdx; i++) {
 if (x >= xArray[i] && x <= xArray[i + 1]) {
 const slope = (yArray[i + 1] - yArray[i]) / (xArray[i + 1] - xArray[i]);
 return yArray[i] + slope * (x - xArray[i]);
 }
 }
 return 0; // Fallback
}

/**
 * Penelusuran Banjir Metode Modified Puls
 * Persamaan dasar: (I1 + I2)/2 * dt + (S1 - O1*dt/2) = (S2 + O2*dt/2)
 *
 * @param inflowHydrograph Array seri Inflow Waduk (Q In, m3/dtk) dari Hidrograf
 * @param dtSeconds Interval waktu / Time Step (dt) dalam detik (misal 3600 untuk 1 jam)
 * @param curve Kurva karakteristik Hidraulik Waduk (Elevasi, Volume, Discharge)
 * @param initialElevation Elevasi awal muka air (default: elevasi pelimpah/Mercu)
 */
export function modifiedPulsRouting(
 inflowHydrograph: number[],
 dtSeconds: number,
 curve: ReservoirCharacteristicCurve,
 initialElevation: number = curve.elevations[0]
): RoutingStep[] {
 
 if (inflowHydrograph.length < 2 || curve.elevations.length < 2) {
 throw new Error('Data hidrograf inflow atau kurva waduk tidak lengkap.');
 }

 // 1. Persiapkan Kurva Bantuan (Indikator Modified Puls) -> S_plus_O = S + (O * dt / 2)
 // Untuk mencari O_next dari nilai fungsi Modified Puls.
 // Karena S dalam m3 dan O dalam m3/dtk, konversikan satuan agar komparabel.
 // Konsep: F_Puls = (2S/dt) + O, lalu kita interpolasi O dari F_puls
 const fPulsCurve: number[] = [];
 for (let i = 0; i < curve.elevations.length; i++) {
 const s = curve.storages[i]; // m3
 const o = curve.outflows[i]; // m3/s
 
 // (2 * S / dt) + O
 const fPuls = ((2 * s) / dtSeconds) + o;
 fPulsCurve.push(fPuls);
 }

 const results: RoutingStep[] = [];
 
 // Tentukan state awal (t=0)
 // Ekstrak S1 dan O1 berdasarkan Interpolasi terhadap InitialElevation.
 let S1 = interpolate(initialElevation, curve.elevations, curve.storages);
 let O1 = interpolate(initialElevation, curve.elevations, curve.outflows);
 
 results.push({
 timeIndex: 0,
 inflow: inflowHydrograph[0],
 outflow: O1,
 storage: S1,
 elevation: initialElevation
 });

 // Eksekusi iterasi Runge-Kutta/Puls
 for (let t = 1; t < inflowHydrograph.length; t++) {
 const I1 = inflowHydrograph[t - 1]; // Inflow periode sblmnya
 const I2 = inflowHydrograph[t]; // Inflow sekarang

 // Cari nilai Indikator Puls (2S1/dt - O1) ... ini merupakan turunan manipulasi aljabar
 // Ruas kiri = I1 + I2 + (2S1/dt - O1)
 const pulsIndicator = (2 * S1) / dtSeconds - O1;
 const ruasKiri = I1 + I2 + pulsIndicator;
 // Nilai ruasKiri = (2S2/dt + O2), yakni berkorespondensi ke fPulsCurve untuk t berikutnya

 // Cari O2 dgn interpolasi terbalik dari kurva F_Puls (X) vs Outflow O (Y)
 const O2 = interpolate(ruasKiri, fPulsCurve, curve.outflows);
 
 // Cari S2 dgn interpolasi terbalik dari kurva F_Puls (X) vs Storage S (Y)
 const S2 = interpolate(ruasKiri, fPulsCurve, curve.storages);

 // Cari H2 elevasi utk kelengkapan
 const elev2 = interpolate(S2, curve.storages, curve.elevations);

 results.push({
 timeIndex: t,
 inflow: I2,
 outflow: O2,
 storage: S2,
 elevation: elev2
 });

 // Update state utk siklus selanjutnya
 S1 = S2;
 O1 = O2;
 }

 return results;
}
