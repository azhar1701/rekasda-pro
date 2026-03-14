/**
 * F.J. Mock Rainfall-Runoff Model & Weibull Dependable Flow
 * =========================================================
 * Pure mathematical functions — no side-effects, no DOM access.
 *
 * References:
 * - Mock, F.J. (1973) — Land Capability Appraisal, FAO/UNDP
 * - SNI 6738:2015 — Perhitungan Debit Andalan
 * - Weibull plotting position: P = m / (n+1) × 100%
 */

// ─── Type Definitions ───────────────────────────────────────────────

/** Global parameters for the F.J. Mock model */
export interface MockParams {
 /** Luas DAS (km²) — used for mm→m³/s conversion */
 luasDas: number;
 /** Soil Moisture Capacity / Kapasitas Kelembaban Tanah (mm) */
 smc: number;
 /** Initial Soil Moisture / Kelembaban Tanah Awal (mm) — for month t=0 */
 ism: number;
 /** Infiltration Factor (0–1) — fraction of Water Surplus that infiltrates */
 infiltrationFactor: number;
 /** Groundwater Recession Constant K (0–1) — controls baseflow decay */
 k: number;
 /** Exposed Surface fraction m (0–1) — fraction of catchment without vegetation */
 exposedSurface: number;
 /** Initial Groundwater Storage (mm) — for month t=0, default 0 */
 initialGwStorage?: number;
}

/** Monthly input data for each iteration step */
export interface MockMonthlyInput {
 /** Month label (e.g. "Jan", "Feb") */
 month: string;
 /** Monthly precipitation P (mm) */
 precipitation: number;
 /** Monthly potential evapotranspiration ETo (mm) */
 eto: number;
 /** Number of days in this month (28–31) */
 daysInMonth: number;
}

/** Complete output row for one month of the Mock model */
export interface MockMonthlyResult {
 /** Month label */
 month: string;
 /** Curah Hujan P (mm) */
 precipitation: number;
 /** Evapotranspirasi Potensial ETo (mm) */
 eto: number;
 /** Selisih P − ETo (mm) — positive = wet, negative = dry */
 deltaS: number;
 /** Soil Moisture at end of month (mm) */
 soilMoisture: number;
 /** Actual Evapotranspiration ETa (mm) */
 eta: number;
 /** Water Surplus WS (mm) — excess after soil storage filled */
 waterSurplus: number;
 /** Infiltration I (mm) = WS × infiltrationFactor */
 infiltration: number;
 /** Groundwater Storage Vg at end of month (mm) */
 gwStorage: number;
 /** Base Flow BF (mm) — released from groundwater */
 baseFlow: number;
 /** Direct Runoff DRO (mm) = WS − I */
 directRunoff: number;
 /** Total Runoff TRO (mm) = BF + DRO */
 totalRunoff: number;
 /** Debit aliran (m³/s) — converted from TRO using catchment area */
 discharge: number;
 /** Days in this month */
 daysInMonth: number;
}

// ─── F.J. Mock Algorithm ────────────────────────────────────────────

/**
 * Calculate Rainfall-Runoff using the F.J. Mock (1973) monthly water balance.
 *
 * Iterates month-by-month, carrying forward Soil Moisture (SM) and
 * Groundwater Storage (Vg) from the previous month.
 *
 * Conversion to discharge:
 * Q (m³/s) = TRO (mm) × A (km²) × 1000 / (days × 86400)
 *
 * @param params Global model parameters
 * @param data Array of 12 monthly input rows (Jan–Dec)
 * @returns Array of 12 MockMonthlyResult rows
 * @throws Error if inputs are invalid
 */
export function calculateFJMock(
 params: MockParams,
 data: MockMonthlyInput[],
): MockMonthlyResult[] {
 // ── Input validation ──
 if (data.length === 0) {
 throw new Error('Data bulanan tidak boleh kosong.');
 }
 if (params.luasDas <= 0) {
 throw new Error('Luas DAS harus > 0 km².');
 }
 if (params.smc <= 0) {
 throw new Error('Soil Moisture Capacity (SMC) harus > 0 mm.');
 }
 if (params.infiltrationFactor < 0 || params.infiltrationFactor > 1) {
 throw new Error('Infiltration Factor harus antara 0 dan 1.');
 }
 if (params.k < 0 || params.k > 1) {
 throw new Error('Recession Constant K harus antara 0 dan 1.');
 }
 if (params.exposedSurface < 0 || params.exposedSurface > 1) {
 throw new Error('Exposed Surface (m) harus antara 0 dan 1.');
 }

 const results: MockMonthlyResult[] = [];

 // Carry-forward state
 let prevSM = params.ism;
 let prevVg = params.initialGwStorage ?? 0;

 for (let t = 0; t < data.length; t++) {
 const { month, precipitation: P, eto: ETo, daysInMonth } = data[t];

 // ── Step 1: Water Balance Surface ──
 // ΔS = P − ETo
 const deltaS = P - ETo;

 // ── Step 2: Soil Moisture & Actual Evapotranspiration ──
 let SM: number;
 let ETa: number;

 if (deltaS >= 0) {
 // Wet month: soil moisture refills up to SMC
 // ETa = ETo (full potential ET is met)
 ETa = ETo;
 SM = Math.min(prevSM + deltaS, params.smc);
 } else {
 // Dry month: soil moisture depletes
 // Soil moisture loss depends on exposed surface fraction m
 // SM(t) = SM(t-1) × (1 − m × |ΔS| / SMC) clamped to [0, SMC]
 // This models partial drying: more exposed surface → faster drying
 const dryingFraction = params.exposedSurface * Math.abs(deltaS) / params.smc;
 SM = Math.max(0, prevSM * (1 - dryingFraction));
 // ETa = P + (SM_prev − SM_now): rain + moisture actually extracted
 ETa = P + (prevSM - SM);
 }

 // ── Step 3: Water Surplus ──
 // WS = P − ETa − ΔSM (excess water available for runoff & infiltration)
 // Equivalently in wet months: WS = ΔS − (SM − SM_prev)
 // In dry months: WS = 0 (no surplus if drying)
 const deltaSM = SM - prevSM;
 const WS = Math.max(0, P - ETa - deltaSM);

 // ── Step 4: Infiltration ──
 // I = WS × Infiltration Factor
 const I = WS * params.infiltrationFactor;

 // ── Step 5: Direct Runoff ──
 // DRO = WS − I (surface runoff that flows directly to stream)
 const DRO = WS - I;

 // ── Step 6: Groundwater Storage & Base Flow ──
 // Vg(t) = K × Vg(t−1) + I (storage recharges from infiltration)
 // BF = Vg(t−1) + I − Vg(t) (water released as base flow)
 // = (1 − K) × Vg(t−1) + (1 − K) × I ... simplified
 // = (1 − K) × (Vg(t−1) + I)
 //
 // Alternative derivation:
 // Vg(t) = K × (Vg(t-1) + I) → BF = (1-K) × (Vg(t-1) + I)
 const Vg = params.k * (prevVg + I);
 const BF = (1 - params.k) * (prevVg + I);

 // ── Step 7: Total Runoff ──
 // TRO (mm) = BF + DRO
 const TRO = BF + DRO;

 // ── Step 8: Convert mm/month → m³/s ──
 // Q = TRO × A × 1000 / (days × 86400)
 // TRO in mm
 // A in km² (1 km² = 1e6 m²)
 // 1 mm = 0.001 m depth → volume = A×1e6 × TRO×0.001 = A × TRO × 1000
 const seconds = daysInMonth * 86400;
 const discharge = (TRO * params.luasDas * 1000) / seconds;

 results.push({
 month,
 precipitation: round(P, 2),
 eto: round(ETo, 2),
 deltaS: round(deltaS, 2),
 soilMoisture: round(SM, 2),
 eta: round(ETa, 2),
 waterSurplus: round(WS, 2),
 infiltration: round(I, 2),
 gwStorage: round(Vg, 2),
 baseFlow: round(BF, 2),
 directRunoff: round(DRO, 2),
 totalRunoff: round(TRO, 2),
 discharge: round(discharge, 4),
 daysInMonth,
 });

 // Carry forward
 prevSM = SM;
 prevVg = Vg;
 }

 return results;
}

// ─── Weibull Dependable Flow ────────────────────────────────────────

/** Result of a Weibull dependable flow calculation */
export interface WeibullResult {
 /** Debit Andalan at the target probability (m³/s) */
 qAndalan: number;
 /** Target probability (%) */
 probability: number;
 /** Full ranked series with Weibull probabilities */
 rankedSeries: { rank: number; discharge: number; probability: number }[];
}

/**
 * Calculate Dependable Flow (Debit Andalan) using Weibull plotting position
 * with linear interpolation.
 *
 * Weibull formula: P(m) = m / (n+1) × 100%
 * where m = rank (1 = largest), n = total data count
 *
 * If the target probability falls between two ranked data points,
 * linear interpolation is used to extract the precise Q value.
 *
 * @param dischargeSeries Array of discharge values (any length ≥ 2)
 * @param targetProbability Target exceedance probability (%, e.g. 80 for Q80)
 * @returns WeibullResult with interpolated discharge and full ranked series
 * @throws Error if data is insufficient or probability out of range
 */
export function calculateWeibullDependableFlow(
 dischargeSeries: number[],
 targetProbability: number,
): WeibullResult {
 // Validation
 if (dischargeSeries.length < 2) {
 throw new Error('Minimal 2 data debit diperlukan untuk analisis Weibull.');
 }
 if (targetProbability <= 0 || targetProbability >= 100) {
 throw new Error('Probabilitas target harus antara 0% dan 100% (eksklusif).');
 }

 const n = dischargeSeries.length;

 // Sort descending (rank 1 = largest discharge)
 const sorted = [...dischargeSeries].sort((a, b) => b - a);

 // Build ranked series with Weibull probabilities
 const rankedSeries = sorted.map((discharge, index) => {
 const rank = index + 1;
 const probability = (rank / (n + 1)) * 100; // Weibull formula
 return {
 rank,
 discharge: round(discharge, 4),
 probability: round(probability, 2),
 };
 });

 // ── Find Q at target probability via linear interpolation ──
 const target = targetProbability;

 // Edge cases: target outside data range
 if (target <= rankedSeries[0].probability) {
 return { qAndalan: rankedSeries[0].discharge, probability: target, rankedSeries };
 }
 if (target >= rankedSeries[n - 1].probability) {
 return { qAndalan: rankedSeries[n - 1].discharge, probability: target, rankedSeries };
 }

 // Find bracketing pair: P_lower ≤ target < P_upper
 let lower = rankedSeries[0];
 let upper = rankedSeries[1];

 for (let i = 0; i < n - 1; i++) {
 if (rankedSeries[i].probability <= target && rankedSeries[i + 1].probability >= target) {
 lower = rankedSeries[i];
 upper = rankedSeries[i + 1];
 break;
 }
 }

 // Linear interpolation between the two bracketing points
 // Q_target = Q_lower + (Q_upper − Q_lower) × (P_target − P_lower) / (P_upper − P_lower)
 const pRange = upper.probability - lower.probability;
 const qAndalan =
 pRange === 0
 ? lower.discharge
 : lower.discharge +
 ((upper.discharge - lower.discharge) * (target - lower.probability)) / pRange;

 return {
 qAndalan: round(qAndalan, 4),
 probability: target,
 rankedSeries,
 };
}

// ─── Default ETo (Thornthwaite-based typical Indonesia) ─────────────

/**
 * Default monthly ETo values for tropical Indonesia (mm/month).
 * Based on Thornthwaite estimates for lowland equatorial regions.
 * Use these as starting defaults; engineers should override with local data.
 */
export const DEFAULT_ETO_INDONESIA: number[] = [
 150, 140, 155, 150, 140, 120, 115, 125, 140, 155, 150, 150,
];

/**
 * Standard days per month (non-leap year).
 */
export const DAYS_IN_MONTH: number[] = [
 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];

/**
 * Month labels in Bahasa Indonesia abbreviation.
 */
export const MONTH_LABELS: string[] = [
 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

// ─── Utility ────────────────────────────────────────────────────────

/** Round a number to n decimal places */
function round(value: number, decimals: number): number {
 const factor = Math.pow(10, decimals);
 return Math.round(value * factor) / factor;
}
