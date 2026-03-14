/**
 * Mononobe Rainfall Intensity & Alternating Block Method (ABM)
 * =============================================================
 * Pure mathematical functions for:
 * 1. Mononobe intensity formula (R24 → hourly intensity)
 * 2. Cumulative & incremental rainfall breakdown
 * 3. Alternating Block Method (ABM) reordering
 *
 * Reference: Mononobe (1932), Indonesian KP-01 standard
 */

// ─── Type Definitions ───────────────────────────────────────────────

/** Result for a single time step in the hyetograph */
export interface HyetographRow {
 /** Hour index (1-based) */
 jam: number;
 /** Mononobe intensity at this duration (mm/hr) */
 intensitas: number;
 /** Cumulative rainfall from t=0 to this hour (mm) */
 kumulatif: number;
 /** Incremental rainfall at this hour (mm) — before ABM reordering */
 inkremental: number;
 /** ABM-ordered rainfall at this hour (mm) */
 abm: number;
}

/** Full hyetograph output */
export interface HyetographResult {
 /** Duration in hours */
 durasi: number;
 /** R24 design rainfall (mm) */
 r24: number;
 /** Array of per-hour data */
 rows: HyetographRow[];
 /** Peak hour (1-based) in ABM arrangement */
 jamPuncak: number;
 /** Peak rainfall intensity in ABM (mm) */
 hujanPuncak: number;
 /** Total rainfall (mm) — should equal cumulative at last hour */
 totalHujan: number;
}

// ─── Core Functions ─────────────────────────────────────────────────

/**
 * Calculate Mononobe intensity for a given duration.
 *
 * Formula: I(t) = (R24 / 24) × (24 / t)^(2/3)
 *
 * @param R24 Design daily rainfall (mm/day)
 * @param t Duration in hours (must be > 0)
 * @returns Rainfall intensity (mm/hr)
 */
export function calculateMononobe(R24: number, t: number): number {
 if (t <= 0) throw new Error('Durasi t harus > 0');
 if (R24 <= 0) return 0;
 return (R24 / 24) * Math.pow(24 / t, 2 / 3);
}

/**
 * Generate cumulative and incremental rainfall for each hour.
 *
 * For each hour t (1..T):
 * - Intensity I(t) = Mononobe(R24, t)
 * - Cumulative R(t) = I(t) × t
 * - Incremental = R(t) - R(t-1)
 *
 * @param R24 Design daily rainfall (mm)
 * @param durasi Total duration in hours (e.g. 6)
 * @returns Array of incremental rainfalls (mm) for each hour, sorted by time
 */
export function generateIncrementalRainfall(R24: number, durasi: number): number[] {
 if (durasi <= 0 || !Number.isInteger(durasi)) {
 throw new Error('Durasi harus bilangan bulat positif.');
 }

 const cumulatives: number[] = [];
 for (let t = 1; t <= durasi; t++) {
 const intensity = calculateMononobe(R24, t);
 cumulatives.push(intensity * t);
 }

 // Incremental: difference between consecutive cumulatives
 const incrementals: number[] = [];
 for (let i = 0; i < cumulatives.length; i++) {
 if (i === 0) {
 incrementals.push(cumulatives[0]);
 } else {
 incrementals.push(Math.max(0, cumulatives[i] - cumulatives[i - 1]));
 }
 }

 return incrementals;
}

/**
 * Alternating Block Method (ABM) — reorder incremental rainfalls.
 *
 * Algorithm:
 * 1. Sort incrementals descending (largest first)
 * 2. Place largest value at center of output array
 * 3. Place 2nd largest to the RIGHT of center
 * 4. Place 3rd largest to the LEFT of center
 * 5. Continue alternating: right, left, right, left...
 *
 * This produces a bell-curve shaped hyetograph.
 *
 * @param incrementals Array of incremental rainfalls (mm)
 * @returns ABM-ordered array of same length
 */
export function arrangeABM(incrementals: number[]): number[] {
 const n = incrementals.length;
 if (n === 0) return [];
 if (n === 1) return [...incrementals];

 // Sort descending
 const sorted = [...incrementals].sort((a, b) => b - a);

 // Create result array filled with 0
 const result = new Array(n).fill(0);

 // Center index
 const center = Math.floor(n / 2);

 // Place values using alternating pattern
 let left = center;
 let right = center;

 for (let i = 0; i < sorted.length; i++) {
 if (i === 0) {
 // Largest → center
 result[center] = sorted[i];
 } else if (i % 2 === 1) {
 // Odd index → go right
 right++;
 if (right < n) {
 result[right] = sorted[i];
 }
 } else {
 // Even index → go left
 left--;
 if (left >= 0) {
 result[left] = sorted[i];
 }
 }
 }

 return result;
}

/**
 * Generate complete hyetograph using Mononobe + ABM.
 *
 * This is the main entry point that combines all steps:
 * 1. Calculate Mononobe intensity for each hour
 * 2. Compute cumulative rainfall
 * 3. Derive incremental rainfall
 * 4. Apply ABM reordering
 *
 * @param R24 Design daily rainfall (mm)
 * @param durasi Total storm duration in hours (default: 6)
 * @returns Complete HyetographResult
 */
export function generateHyetograph(R24: number, durasi: number = 6): HyetographResult {
 if (R24 <= 0) throw new Error('Hujan harian rencana (R24) harus > 0 mm.');
 if (durasi <= 0 || durasi > 24) throw new Error('Durasi hujan harus antara 1–24 jam.');

 const incrementals = generateIncrementalRainfall(R24, durasi);
 const abmValues = arrangeABM(incrementals);

 // Build detailed rows
 const rows: HyetographRow[] = [];
 let cumSum = 0;
 for (let t = 1; t <= durasi; t++) {
 const intensity = calculateMononobe(R24, t);
 cumSum = intensity * t;
 rows.push({
 jam: t,
 intensitas: round(intensity, 2),
 kumulatif: round(cumSum, 2),
 inkremental: round(incrementals[t - 1], 2),
 abm: round(abmValues[t - 1], 2),
 });
 }

 // Find peak
 const peakIdx = abmValues.indexOf(Math.max(...abmValues));

 return {
 durasi,
 r24: R24,
 rows,
 jamPuncak: peakIdx + 1,
 hujanPuncak: round(abmValues[peakIdx], 2),
 totalHujan: round(abmValues.reduce((s, v) => s + v, 0), 2),
 };
}

// ─── Utility ────────────────────────────────────────────────────────

function round(value: number, decimals: number): number {
 const factor = Math.pow(10, decimals);
 return Math.round(value * factor) / factor;
}
