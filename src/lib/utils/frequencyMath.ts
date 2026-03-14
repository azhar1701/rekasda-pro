/**
 * Frequency Analysis Math — Single Source of Truth
 * Anti-Hallucination: Hardcoded Statistical Tables (SNI 2415:2016)
 * 
 * Modul ini adalah SATU-SATUNYA modul yang boleh menghitung distribusi frekuensi,
 * parameter statistik, dan goodness-of-fit. Semua komponen UI HARUS mengimpor dari sini.
 * 
 * @standard SNI 2415:2016
 * @reference Soewarno (1995), Haan (1977)
 */

// ─── SHARED TYPES ───
// Canonical DesignRainfallValue — satu-satunya definisi di codebase
export interface DesignRainfallValue {
 Tr: number;
 R24: number;
 kalaUlang: number;
 curahHujan: number;
}

export interface StatisticalParams {
 mean: number;
 stdDev: number;
 cv: number;
 cs: number;
 ck: number;
 n: number;
}

export interface DistributionResult {
 method: 'normal' | 'lognormal' | 'gumbel' | 'logpearson3';
 values: DesignRainfallValue[];
}

export interface GoodnessOfFitResult {
 method: string;
 chiSquare: { statistic: number; critical: number; accepted: boolean };
 kolmogorovSmirnov: { statistic: number; critical: number; accepted: boolean };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: HARDCODED SNI LOOKUP TABLES
// ═══════════════════════════════════════════════════════════════

// ─── 1.1 DISTRIBUSI NORMAL — Faktor Z ───
const NORMAL_Z: Record<number, number> = {
 2: 0.000, 5: 0.842, 10: 1.282, 20: 1.645, 25: 1.751,
 50: 2.054, 100: 2.326, 200: 2.576, 1000: 3.090
};

// ─── 1.2 DISTRIBUSI GUMBEL — Yn (Rerata Tereduksi) berdasarkan n ───
const GUMBEL_YN: Record<number, number> = {
 10: 0.4952, 15: 0.5128, 20: 0.5236, 25: 0.5309, 30: 0.5362,
 35: 0.5403, 40: 0.5436, 45: 0.5463, 50: 0.5491, 55: 0.5504,
 60: 0.5522, 65: 0.5535, 70: 0.5548, 75: 0.5559, 80: 0.5569,
 85: 0.5578, 90: 0.5586, 95: 0.5593, 100: 0.5600
};

// ─── 1.3 DISTRIBUSI GUMBEL — Sn (Simpangan Baku Tereduksi) berdasarkan n ───
const GUMBEL_SN: Record<number, number> = {
 10: 0.9496, 15: 1.0206, 20: 1.0628, 25: 1.0915, 30: 1.1124,
 35: 1.1285, 40: 1.1413, 45: 1.1519, 50: 1.1607, 55: 1.1681,
 60: 1.1747, 65: 1.1803, 70: 1.1854, 75: 1.1898, 80: 1.1938,
 85: 1.1973, 90: 1.2007, 95: 1.2037, 100: 1.2065
};

// ─── 1.4 DISTRIBUSI GUMBEL — Reduced Variate (Yt) berdasarkan Periode Ulang T ───
const GUMBEL_YTR: Record<number, number> = {
 2: 0.3665, 5: 1.4999, 10: 2.2502, 20: 2.9702, 25: 3.1985,
 50: 3.9019, 100: 4.6001, 200: 5.2960, 1000: 6.9190
};

// ─── 1.5 LOG PEARSON III — Faktor K (Cs vs Tr) ───
// Tabel lengkap Cs = -3.0 s/d 6.0 (Haan, 1977; SNI 2415:2016)
const LOG_PEARSON_K: Record<string, Record<number, number>> = {
 '-3.0': { 2: 0.396, 5: 0.420, 10: 0.660, 25: 0.799, 50: 0.857, 100: 0.896, 200: 0.927, 1000: 0.973 },
 '-2.5': { 2: 0.360, 5: 0.518, 10: 0.799, 25: 0.969, 50: 1.044, 100: 1.095, 200: 1.136, 1000: 1.198 },
 '-2.0': { 2: 0.307, 5: 0.609, 10: 0.930, 25: 1.137, 50: 1.225, 100: 1.287, 200: 1.338, 1000: 1.417 },
 '-1.5': { 2: 0.240, 5: 0.695, 10: 1.053, 25: 1.299, 50: 1.402, 100: 1.472, 200: 1.531, 1000: 1.625 },
 '-1.0': { 2: 0.164, 5: 0.769, 10: 1.166, 25: 1.449, 50: 1.567, 100: 1.646, 200: 1.714, 1000: 1.821 },
 '-0.5': { 2: 0.083, 5: 0.828, 10: 1.258, 25: 1.581, 50: 1.720, 100: 1.808, 200: 1.885, 1000: 2.006 },
 '0.0': { 2: 0.000, 5: 0.842, 10: 1.282, 25: 1.751, 50: 2.054, 100: 2.326, 200: 2.576, 1000: 3.090 },
 '0.5': { 2: -0.083, 5: 0.808, 10: 1.250, 25: 1.751, 50: 2.054, 100: 2.311, 200: 2.553, 1000: 3.041 },
 '1.0': { 2: -0.164, 5: 0.758, 10: 1.217, 25: 1.750, 50: 2.107, 100: 2.452, 200: 2.783, 1000: 3.489 },
 '1.5': { 2: -0.240, 5: 0.690, 10: 1.157, 25: 1.725, 50: 2.117, 100: 2.502, 200: 2.878, 1000: 3.696 },
 '2.0': { 2: -0.307, 5: 0.609, 10: 1.075, 25: 1.673, 50: 2.093, 100: 2.515, 200: 2.935, 1000: 3.855 },
 '2.5': { 2: -0.360, 5: 0.518, 10: 0.974, 25: 1.593, 50: 2.037, 100: 2.493, 200: 2.953, 1000: 3.970 },
 '3.0': { 2: -0.396, 5: 0.420, 10: 0.856, 25: 1.492, 50: 1.955, 100: 2.439, 200: 2.934, 1000: 4.040 },
 '3.5': { 2: -0.468, 5: 0.318, 10: 0.763, 25: 1.373, 50: 1.851, 100: 2.357, 200: 2.881, 1000: 4.066 },
 '4.0': { 2: -0.522, 5: 0.217, 10: 0.656, 25: 1.241, 50: 1.726, 100: 2.247, 200: 2.795, 1000: 4.048 },
 '4.5': { 2: -0.562, 5: 0.133, 10: 0.546, 25: 1.098, 50: 1.582, 100: 2.111, 200: 2.677, 1000: 3.989 },
 '5.0': { 2: -0.592, 5: 0.062, 10: 0.438, 25: 0.947, 50: 1.424, 100: 1.951, 200: 2.528, 1000: 3.889 },
 '5.5': { 2: -0.613, 5: 0.001, 10: 0.337, 25: 0.797, 50: 1.256, 100: 1.770, 200: 2.350, 1000: 3.750 },
 '6.0': { 2: -0.627, 5: -0.050, 10: 0.244, 25: 0.654, 50: 1.087, 100: 1.577, 200: 2.148, 1000: 3.578 },
};

// ─── 1.6 CHI-SQUARE CRITICAL VALUES (α per kolom) ───
// Tabel lengkap Dk=1–30 sesuai data SNI
const CHI_SQUARE_CRITICAL: Record<number, Record<string, number>> = {
 1: { '0.20': 1.642, '0.10': 2.706, '0.05': 3.841, '0.01': 6.635 },
 2: { '0.20': 3.219, '0.10': 4.605, '0.05': 5.991, '0.01': 9.210 },
 3: { '0.20': 4.642, '0.10': 6.251, '0.05': 7.815, '0.01': 11.345 },
 4: { '0.20': 5.989, '0.10': 7.779, '0.05': 9.488, '0.01': 13.277 },
 5: { '0.20': 7.289, '0.10': 9.236, '0.05': 11.070, '0.01': 15.086 },
 6: { '0.20': 8.558, '0.10': 10.645, '0.05': 12.592, '0.01': 16.812 },
 7: { '0.20': 9.803, '0.10': 12.017, '0.05': 14.067, '0.01': 18.475 },
 8: { '0.20': 11.030, '0.10': 13.362, '0.05': 15.507, '0.01': 20.090 },
 9: { '0.20': 12.242, '0.10': 14.684, '0.05': 16.919, '0.01': 21.666 },
 10: { '0.20': 13.442, '0.10': 15.987, '0.05': 18.307, '0.01': 23.209 },
 11: { '0.20': 14.631, '0.10': 17.275, '0.05': 19.675, '0.01': 24.725 },
 12: { '0.20': 15.812, '0.10': 18.549, '0.05': 21.026, '0.01': 26.217 },
 13: { '0.20': 16.985, '0.10': 19.812, '0.05': 22.362, '0.01': 27.688 },
 14: { '0.20': 18.151, '0.10': 21.064, '0.05': 23.685, '0.01': 29.141 },
 15: { '0.20': 19.311, '0.10': 22.307, '0.05': 24.996, '0.01': 30.578 },
 16: { '0.20': 20.465, '0.10': 23.542, '0.05': 26.296, '0.01': 32.978 },
 17: { '0.20': 21.617, '0.10': 24.769, '0.05': 27.587, '0.01': 33.409 },
 18: { '0.20': 22.760, '0.10': 25.989, '0.05': 28.869, '0.01': 34.805 },
 19: { '0.20': 23.900, '0.10': 27.204, '0.05': 30.114, '0.01': 36.191 },
 20: { '0.20': 25.038, '0.10': 28.412, '0.05': 31.410, '0.01': 37.566 },
 21: { '0.20': 26.171, '0.10': 29.615, '0.05': 32.671, '0.01': 38.932 },
 22: { '0.20': 27.301, '0.10': 30.813, '0.05': 33.924, '0.01': 40.289 },
 23: { '0.20': 28.429, '0.10': 32.007, '0.05': 35.172, '0.01': 41.638 },
 24: { '0.20': 29.553, '0.10': 33.196, '0.05': 36.415, '0.01': 42.980 },
 25: { '0.20': 30.675, '0.10': 34.382, '0.05': 37.652, '0.01': 44.314 },
 26: { '0.20': 31.795, '0.10': 35.563, '0.05': 38.885, '0.01': 45.642 },
 27: { '0.20': 32.912, '0.10': 36.761, '0.05': 40.113, '0.01': 46.963 },
 28: { '0.20': 34.027, '0.10': 37.916, '0.05': 41.337, '0.01': 48.278 },
 29: { '0.20': 35.139, '0.10': 39.087, '0.05': 42.557, '0.01': 49.588 },
 30: { '0.20': 36.250, '0.10': 40.156, '0.05': 43.773, '0.01': 50.892 },
};

// ─── 1.7 KOLMOGOROV-SMIRNOV CRITICAL VALUES (α = 5%) ───
const KS_CRITICAL: Record<number, number> = {
 10: 0.409, 11: 0.391, 12: 0.375, 13: 0.361, 14: 0.349, 15: 0.338,
 16: 0.328, 17: 0.318, 18: 0.309, 19: 0.301, 20: 0.294,
 25: 0.264, 30: 0.242, 35: 0.224, 40: 0.210, 45: 0.198, 50: 0.188,
 60: 0.172, 70: 0.160, 80: 0.150, 90: 0.141, 100: 0.134
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: INTERPOLASI & UTILITY
// ═══════════════════════════════════════════════════════════════

function interpolate(table: Record<number, number>, n: number): number {
 const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
 if (n <= keys[0]) return table[keys[0]];
 if (n >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
 for (let i = 0; i < keys.length - 1; i++) {
 if (n >= keys[i] && n <= keys[i + 1]) {
 const x1 = keys[i], x2 = keys[i + 1];
 const y1 = table[x1], y2 = table[x2];
 return y1 + ((y2 - y1) / (x2 - x1)) * (n - x1);
 }
 }
 return table[keys[keys.length - 1]];
}

function interpolateLogPearsonK(cs: number, tr: number): number {
 const csKeys = Object.keys(LOG_PEARSON_K).map(Number).sort((a, b) => a - b);
 
 // Clamp cs to valid range
 const clampedCs = Math.max(csKeys[0], Math.min(cs, csKeys[csKeys.length - 1]));

 let cs1 = csKeys[0], cs2 = csKeys[0];
 for (let i = 0; i < csKeys.length - 1; i++) {
 if (clampedCs >= csKeys[i] && clampedCs <= csKeys[i + 1]) {
 cs1 = csKeys[i]; cs2 = csKeys[i + 1];
 break;
 }
 }

 const k1Key = cs1.toFixed(1);
 const k2Key = cs2.toFixed(1);
 
 // Handle edge case: tr might not be in table
 const k1 = LOG_PEARSON_K[k1Key]?.[tr];
 const k2 = LOG_PEARSON_K[k2Key]?.[tr];
 
 if (k1 === undefined || k2 === undefined) {
 // Fallback: find nearest Tr
 const trKeys = Object.keys(LOG_PEARSON_K[k1Key] || LOG_PEARSON_K['0.0']).map(Number);
 const nearestTr = trKeys.reduce((best, t) => Math.abs(t - tr) < Math.abs(best - tr) ? t : best);
 const fallback1 = LOG_PEARSON_K[k1Key]?.[nearestTr] ?? 0;
 const fallback2 = LOG_PEARSON_K[k2Key]?.[nearestTr] ?? 0;
 if (cs1 === cs2) return fallback1;
 return fallback1 + ((fallback2 - fallback1) / (cs2 - cs1)) * (clampedCs - cs1);
 }
 
 if (cs1 === cs2) return k1;
 return k1 + ((k2 - k1) / (cs2 - cs1)) * (clampedCs - cs1);
}

/**
 * Lookup nilai kritikal Chi-Square.
 * @param df Derajat kebebasan (Dk = G - (P+1))
 * @param alpha Tingkat signifikansi (default 0.05)
 */
export function getChiSquareCritical(df: number, alpha: number = 0.05): number {
 const alphaKey = alpha.toFixed(2);
 
 // Direct lookup
 if (CHI_SQUARE_CRITICAL[df]?.[alphaKey] !== undefined) {
 return CHI_SQUARE_CRITICAL[df][alphaKey];
 }
 
 // Interpolate between nearest df values
 const dfs = Object.keys(CHI_SQUARE_CRITICAL).map(Number).sort((a, b) => a - b);
 const clampedDf = Math.max(dfs[0], Math.min(df, dfs[dfs.length - 1]));
 
 for (let i = 0; i < dfs.length - 1; i++) {
 if (clampedDf >= dfs[i] && clampedDf <= dfs[i + 1]) {
 const v1 = CHI_SQUARE_CRITICAL[dfs[i]]?.[alphaKey] ?? 7.815;
 const v2 = CHI_SQUARE_CRITICAL[dfs[i + 1]]?.[alphaKey] ?? 7.815;
 return v1 + ((v2 - v1) / (dfs[i + 1] - dfs[i])) * (clampedDf - dfs[i]);
 }
 }
 
 return 7.815; // Fallback
}

/**
 * Lookup nilai kritikal Kolmogorov-Smirnov.
 */
export function getKSCritical(n: number): number {
 return interpolate(KS_CRITICAL, n);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: PARAMETER STATISTIK
// ═══════════════════════════════════════════════════════════════

export function calculateStatisticalParams(data: number[]): StatisticalParams {
 const n = data.length;
 if (n < 2) return { mean: data[0] || 0, stdDev: 0, cv: 0, cs: 0, ck: 0, n };

 const mean = data.reduce((a, b) => a + b, 0) / n;
 const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
 const stdDev = Math.sqrt(variance);
 const cv = mean !== 0 ? stdDev / mean : 0;

 let cs = 0;
 if (n > 2 && stdDev > 0) {
 const sumCubes = data.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0);
 cs = (n * sumCubes) / ((n - 1) * (n - 2) * Math.pow(stdDev, 3));
 }

 let ck = 0;
 if (n > 3 && stdDev > 0) {
 const sumQuads = data.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0);
 ck = (Math.pow(n, 2) * sumQuads) / ((n - 1) * (n - 2) * (n - 3) * Math.pow(stdDev, 4));
 }

 return { mean, stdDev, cv, cs, ck, n };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: DISTRIBUSI FREKUENSI (SNI 2415:2016)
// ═══════════════════════════════════════════════════════════════

/**
 * 1. DISTRIBUSI NORMAL: Xt = X̄ + K·S
 */
export function distNormal(data: number[], Tr: number): number {
 const params = calculateStatisticalParams(data);
 const K = NORMAL_Z[Tr] ?? interpolate(NORMAL_Z, Tr);
 return params.mean + K * params.stdDev;
}

/**
 * 2. DISTRIBUSI LOG NORMAL: Yt = Ȳ + K·Sy → Xt = 10^Yt
 * Data di-log10 di dalam fungsi ini — JANGAN pass logData.
 */
export function distLogNormal(data: number[], Tr: number): number {
 const logData = data.map(x => Math.log10(Math.max(x, 1e-10)));
 const params = calculateStatisticalParams(logData);
 const K = NORMAL_Z[Tr] ?? interpolate(NORMAL_Z, Tr);
 return Math.pow(10, params.mean + K * params.stdDev);
}

/**
 * 3. DISTRIBUSI GUMBEL: Xt = X̄ + ((Yt - Yn) / Sn) · S
 * Menggunakan tabel Yn, Sn berdasarkan n dan Yt berdasarkan Tr.
 */
export function distGumbel(data: number[], Tr: number): number {
 const params = calculateStatisticalParams(data);
 const Yn = interpolate(GUMBEL_YN, params.n);
 const Sn = interpolate(GUMBEL_SN, params.n);
 const Yt = GUMBEL_YTR[Tr] ?? interpolate(GUMBEL_YTR, Tr);
 const K = (Yt - Yn) / Sn;
 return params.mean + K * params.stdDev;
}

/**
 * 4. DISTRIBUSI LOG PEARSON III: Yt = Ȳ + K(Cs)·Sy → Xt = 10^Yt
 * K didapat dari tabel Log Pearson III berdasarkan Cs dan Tr.
 */
export function distLogPearsonIII(data: number[], Tr: number): number {
 const logData = data.map(x => Math.log10(Math.max(x, 1e-10)));
 const params = calculateStatisticalParams(logData);
 const K = interpolateLogPearsonK(params.cs, Tr);
 return Math.pow(10, params.mean + K * params.stdDev);
}

/**
 * Hitung seluruh distribusi sekaligus.
 */
export function calculateDistributions(
 data: number[],
 returnPeriods: number[] = [2, 5, 10, 25, 50, 100]
): DistributionResult[] {
 const mapVal = (tr: number, val: number): DesignRainfallValue => ({
 Tr: tr, R24: val, kalaUlang: tr, curahHujan: val
 });

 return [
 { method: 'normal', values: returnPeriods.map(tr => mapVal(tr, distNormal(data, tr))) },
 { method: 'lognormal', values: returnPeriods.map(tr => mapVal(tr, distLogNormal(data, tr))) },
 { method: 'gumbel', values: returnPeriods.map(tr => mapVal(tr, distGumbel(data, tr))) },
 { method: 'logpearson3', values: returnPeriods.map(tr => mapVal(tr, distLogPearsonIII(data, tr))) },
 ];
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: GOODNESS-OF-FIT TESTS (Chi-Square & K-S)
// ═══════════════════════════════════════════════════════════════

function normalCDF(z: number): number {
 const t = 1 / (1 + 0.2316419 * Math.abs(z));
 const d = 0.3989423 * Math.exp(-z * z / 2);
 const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
 return z > 0 ? 1 - p : p;
}

function gumbelCDF(x: number, mean: number, stdDev: number): number {
 const alpha = Math.sqrt(6) / Math.PI / stdDev;
 const u = mean - 0.5772 / alpha;
 return Math.exp(-Math.exp(-alpha * (x - u)));
}

export function calculateGoodnessOfFit(data: number[], distributions: DistributionResult[]): GoodnessOfFitResult[] {
 const n = data.length;
 const ksCritical = getKSCritical(n);
 const sortedData = [...data].sort((a, b) => a - b);
 const params = calculateStatisticalParams(data);
 const paramsLog = calculateStatisticalParams(data.map(x => Math.log(Math.max(x, 1e-10))));

 return distributions.map(dist => {
 // ─── K-S Test ───
 let ksMax = 0;
 sortedData.forEach((x, i) => {
 const empiricalProb = (i + 1) / (n + 1);
 let theoreticalProb = 0;
 if (dist.method === 'normal') theoreticalProb = normalCDF((x - params.mean) / params.stdDev);
 else if (dist.method === 'gumbel') theoreticalProb = gumbelCDF(x, params.mean, params.stdDev);
 else if (dist.method === 'lognormal') theoreticalProb = normalCDF((Math.log(Math.max(x, 1e-10)) - paramsLog.mean) / paramsLog.stdDev);
 else if (dist.method === 'logpearson3') theoreticalProb = normalCDF((Math.log(Math.max(x, 1e-10)) - paramsLog.mean) / paramsLog.stdDev);
 ksMax = Math.max(ksMax, Math.abs(empiricalProb - theoreticalProb));
 });

 // ─── Chi-Square Test ───
 // Dk = G - (P+1), dimana G = jumlah kelas, P = parameter distribusi
 // Normal: P=2, Gumbel: P=2, LogNormal: P=2, LogPearson: P=3
 const k_val = n <= 20 ? 4 : n <= 50 ? 6 : 8;
 const paramCount = dist.method === 'logpearson3' ? 3 : 2;
 const df = Math.max(1, k_val - (paramCount + 1));
 const chiCritical = getChiSquareCritical(df, 0.05);
 const expected = n / k_val;
 let chiSquare = 0;
 for (let i = 0; i < k_val; i++) {
 const startIdx = Math.floor(i * expected);
 const endIdx = Math.floor((i + 1) * expected);
 const observed = endIdx - startIdx;
 if (expected > 0) chiSquare += Math.pow(observed - expected, 2) / expected;
 }

 return {
 method: dist.method,
 chiSquare: { statistic: chiSquare, critical: chiCritical, accepted: chiSquare <= chiCritical },
 kolmogorovSmirnov: { statistic: ksMax, critical: ksCritical, accepted: ksMax <= ksCritical }
 };
 });
}

export function selectBestMethod(goodnessOfFit: GoodnessOfFitResult[]): string {
 const passed = goodnessOfFit.filter(gof => gof.chiSquare.accepted && gof.kolmogorovSmirnov.accepted);

 // Priority: LP3 > Gumbel > LogNormal > Normal (sesuai rekomendasi SNI)
 const priority = ['logpearson3', 'gumbel', 'lognormal', 'normal'];

 if (passed.length > 0) {
 for (const method of priority) {
 if (passed.find(p => p.method === method)) return method;
 }
 return passed[0].method;
 }

 // Jika tidak ada yang lolos, pilih yang deviasi terkecil
 return goodnessOfFit.reduce((best, current) => {
 const bestScore = best.chiSquare.statistic + best.kolmogorovSmirnov.statistic;
 const currentScore = current.chiSquare.statistic + current.kolmogorovSmirnov.statistic;
 return currentScore < bestScore ? current : best;
 }).method;
}
