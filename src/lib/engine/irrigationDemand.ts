/**
 * Irrigation Demand Calculator — KP-01 Standard
 * ===============================================
 * Pure mathematical functions for calculating:
 *   - Net Field Requirement (NFR)
 *   - Diversion Requirement (DR)
 *
 * Based on KP-01 (Standar Perencanaan Irigasi) and SNI 6728.1:2015
 */

// ─── Type Definitions ───────────────────────────────────────────────

/** Crop type determines Kc ranges */
export type PolaTanam = 'padi' | 'palawija' | 'bero';

/** Monthly irrigation parameter row */
export interface IrrigationMonthlyInput {
  /** Month label */
  month: string;
  /** Days in this month */
  daysInMonth: number;
  /** Crop type for this month */
  polaTanam: PolaTanam;
  /** Crop coefficient Kc (dimensionless, 0–2) */
  kc: number;
  /** Percolation rate P (mm/day) — standard 1–3 */
  perkolasi: number;
  /** Water Layer Replacement WLR (mm/day) — land preparation phase */
  wlr: number;
  /** Effective rainfall Reff (mm/day) */
  rpiEfektif: number;
  /** Potential evapotranspiration ETo (mm/day) */
  eto: number;
}

/** Global irrigation parameters */
export interface IrrigationParams {
  /** Irrigated area (Ha) */
  luasIrigasi: number;
  /** Irrigation efficiency (0–1), typically 0.55–0.65 */
  efisiensi: number;
}

/** Output per month */
export interface IrrigationMonthlyResult {
  month: string;
  polaTanam: PolaTanam;
  /** Consumptive Use = ETo × Kc (mm/day) */
  etc: number;
  /** Percolation (mm/day) */
  perkolasi: number;
  /** Water Layer Replacement (mm/day) */
  wlr: number;
  /** Effective rainfall (mm/day) */
  rpiEfektif: number;
  /** Net Field Requirement NFR (mm/day) */
  nfr: number;
  /** Diversion Requirement DR (m³/s) */
  dr: number;
  /** NFR in L/s/Ha for reference */
  nfrLsHa: number;
}

// ─── Default Kc per crop type ───────────────────────────────────────

/** Default Kc values per crop type (KP-01 look-up) */
export const DEFAULT_KC: Record<PolaTanam, number> = {
  padi: 1.10,     // average across growth stages
  palawija: 0.80, // average for secondary crops
  bero: 0.00,     // fallow — no crop
};

/** Default percolation rate per crop type (mm/day) */
export const DEFAULT_PERKOLASI: Record<PolaTanam, number> = {
  padi: 2.0,      // flooded paddy
  palawija: 1.0,  // dryland secondary crops
  bero: 0.0,      // fallow
};

/** Indonesian month labels */
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/** Standard days per month */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ─── Default cropping pattern (MT-I: Padi, MT-II: Palawija, Bero) ──

/** Default 12-month cropping pattern for typical Indonesian irrigation */
export const DEFAULT_POLA_TANAM: PolaTanam[] = [
  'padi', 'padi', 'padi', 'padi',           // MT-I: Nov planting, harvest Mar-Apr
  'palawija', 'palawija', 'palawija', 'palawija', // MT-II: secondary crops
  'bero', 'bero',                             // Fallow Sep-Oct
  'padi', 'padi',                             // MT-III or MT-I early planting
];

// ─── Default ETo (mm/day) for Indonesia lowlands ────────────────────

/** Default monthly ETo in mm/day (typical Indonesia lowland) */
export const DEFAULT_ETO_DAILY: number[] = [
  4.8, 5.0, 5.0, 5.0, 4.5, 4.0, 3.7, 4.0, 4.5, 5.0, 5.0, 4.8,
];

// ─── Core Calculation ───────────────────────────────────────────────

/**
 * Calculate monthly irrigation demand using KP-01 standard.
 *
 * NFR (mm/day) = (ETo × Kc) + P + WLR − Reff
 * DR  (m³/s)   = NFR × LuasIrigasi × 10000 / (Efisiensi × 86400)
 *
 * Conversion note:
 *   NFR (mm/day) × Area (Ha) × 10000 m²/Ha × 0.001 m/mm = volume m³/day
 *   volume / 86400 = m³/s
 *   Divide by efficiency to get diversion requirement
 *
 * @param params  Global irrigation parameters
 * @param data    Array of 12 monthly input rows
 * @returns       Array of 12 IrrigationMonthlyResult rows
 */
export function calculateIrrigationDemand(
  params: IrrigationParams,
  data: IrrigationMonthlyInput[],
): IrrigationMonthlyResult[] {
  if (data.length === 0) {
    throw new Error('Data input bulanan tidak boleh kosong.');
  }
  if (params.luasIrigasi <= 0) {
    throw new Error('Luas irigasi harus > 0 Ha.');
  }
  if (params.efisiensi <= 0 || params.efisiensi > 1) {
    throw new Error('Efisiensi irigasi harus antara 0 dan 1.');
  }

  return data.map((d) => {
    // ETc = ETo × Kc  (consumptive use, mm/day)
    const etc = d.eto * d.kc;

    // NFR = ETc + P + WLR − Reff  (mm/day)
    // If bero (fallow), NFR = 0
    let nfr: number;
    if (d.polaTanam === 'bero') {
      nfr = 0;
    } else {
      nfr = Math.max(0, etc + d.perkolasi + d.wlr - d.rpiEfektif);
    }

    // NFR in L/s/Ha for reference
    // 1 mm/day × 10000 m²/Ha × 0.001 m/mm = 10 m³/Ha/day
    // 10 / 86400 × 1000 = 0.1157 L/s/Ha per mm/day
    const nfrLsHa = nfr * (10000 * 0.001) / 86400 * 1000;

    // DR = NFR (mm/day) × Area (Ha) × 10 / (efisiensi × 86400)
    //    = NFR × Area / (efisiensi × 8640)
    // Result in m³/s
    const dr = (nfr * params.luasIrigasi * 10) / (params.efisiensi * 86400);

    return {
      month: d.month,
      polaTanam: d.polaTanam,
      etc: round(etc, 2),
      perkolasi: round(d.perkolasi, 2),
      wlr: round(d.wlr, 2),
      rpiEfektif: round(d.rpiEfektif, 2),
      nfr: round(nfr, 2),
      dr: round(dr, 4),
      nfrLsHa: round(nfrLsHa, 4),
    };
  });
}

// ─── Helper: Generate default 12-month input ────────────────────────

/**
 * Generate default 12-month irrigation input using typical Indonesian values.
 * Rainfall effective defaults to 0 (user should override from store data).
 */
export function generateDefaultIrrigationInput(
  monthlyReffMm?: number[],
): IrrigationMonthlyInput[] {
  return MONTH_LABELS.map((month, i) => {
    const pola = DEFAULT_POLA_TANAM[i];
    // Padi Reff factor = 0.7, Palawija Reff factor = 0.5 (KP-01)
    const factorReff = pola === 'padi' ? 0.7 : 0.5;
    const reffDaily = monthlyReffMm
      ? (monthlyReffMm[i] * factorReff) / DAYS_IN_MONTH[i]  // R80 × factor
      : 0;

    return {
      month,
      daysInMonth: DAYS_IN_MONTH[i],
      polaTanam: pola,
      kc: DEFAULT_KC[pola],
      perkolasi: DEFAULT_PERKOLASI[pola],
      wlr: (pola === 'padi' && (i === 0 || i === 10)) ? 1.1 : 0, // WLR at planting months
      rpiEfektif: round(reffDaily, 2),
      eto: DEFAULT_ETO_DAILY[i],
    };
  });
}

/**
 * Computes KP-01 effective rainfall array (mm/day) from 80% dependable rainfall (mm/month)
 * Sesuai Standar Perencanaan Irigasi KP-01 Pasal 4.3:
 * - Padi: Reff = 0.70 × R80 / hari
 * - Palawija: Reff = 0.50 × R80 / hari
 * - Bero: Reff = 0
 * 
 * @param r80Monthly Array of 12 monthly R80 values (mm)
 * @param polaTanam Array of 12 crop types ('padi' | 'palawija' | 'bero')
 * @returns Array of 12 daily effective rainfall rates (mm/day)
 */
export function calculateKPEffectiveRainfall(
  r80Monthly: number[],
  polaTanam: PolaTanam[] = DEFAULT_POLA_TANAM
): number[] {
  if (!r80Monthly || r80Monthly.length < 12) return new Array(12).fill(0);

  return r80Monthly.map((r80, i) => {
    const pola = polaTanam[i] || 'padi';
    if (pola === 'bero') return 0;
    const factor = pola === 'padi' ? 0.70 : 0.50; // KP-01
    const days = DAYS_IN_MONTH[i] || 30;
    return round((r80 * factor) / days, 2);
  });
}

// ─── Raw Water Demand (Domestik + Industri) ─────────────────────────

export interface RawWaterDemandInput {
  /** Population (jiwa) */
  populasi: number;
  /** Domestic standard (L/capita/day) */
  standarDomestik: number;
  /** Industrial demand (m³/s) — constant */
  industriM3s: number;
}

/**
 * Calculate raw water demand (constant across all months).
 * @returns demand in m³/s
 */
export function calculateRawWaterDemand(input: RawWaterDemandInput): number {
  // Domestic: (jiwa × L/cap/day) / (1000 × 86400) = m³/s
  const domestic = (input.populasi * input.standarDomestik) / 86400000;
  return domestic + input.industriM3s;
}

// ─── Final Water Balance ────────────────────────────────────────────

export interface NeracaAirFinalRow {
  month: string;
  ketersediaan: number;  // m³/s (from Mock/manual)
  irigasi: number;       // m³/s (DR)
  airBaku: number;       // m³/s (domestic + industry)
  lingkungan: number;    // m³/s (10% of ketersediaan)
  totalKebutuhan: number;
  neraca: number;        // surplus (+) / deficit (−)
  status: 'Surplus' | 'Defisit' | 'Seimbang';
}

/**
 * Calculate final 12-month water balance.
 *
 * @param supply          Monthly water availability (m³/s) — 12 values
 * @param irrigationDR    Monthly irrigation DR (m³/s) — 12 values
 * @param rawWaterDemand  Constant raw water demand (m³/s)
 * @returns 12 rows of final neraca
 */
export function calculateNeracaAirFinal(
  supply: number[],
  irrigationDR: number[],
  rawWaterDemand: number,
): NeracaAirFinalRow[] {
  if (supply.length !== 12 || irrigationDR.length !== 12) {
    throw new Error('Data ketersediaan dan irigasi harus 12 bulan.');
  }

  return MONTH_LABELS.map((month, i) => {
    const ketersediaan = supply[i];
    const irigasi = irrigationDR[i];
    const airBaku = rawWaterDemand;
    // Environmental flow = 10% of available (UU 17/2019 Pasal 22)
    const lingkungan = ketersediaan * 0.10;
    const totalKebutuhan = irigasi + airBaku + lingkungan;
    const neraca = ketersediaan - totalKebutuhan;

    let status: 'Surplus' | 'Defisit' | 'Seimbang';
    if (neraca > 0.001) status = 'Surplus';
    else if (neraca < -0.001) status = 'Defisit';
    else status = 'Seimbang';

    return {
      month,
      ketersediaan: round(ketersediaan, 4),
      irigasi: round(irigasi, 4),
      airBaku: round(airBaku, 4),
      lingkungan: round(lingkungan, 4),
      totalKebutuhan: round(totalKebutuhan, 4),
      neraca: round(neraca, 4),
      status,
    };
  });
}

// ─── Utility ────────────────────────────────────────────────────────

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
