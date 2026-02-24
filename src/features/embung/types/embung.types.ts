/**
 * =============================================================================
 * Embung (Small Dam) Module — Type Definitions
 * Berdasarkan Modul 6 Analisis Hidrologi PUPR
 * =============================================================================
 * Semua tipe data untuk 4 layanan utama:
 *  1. Capacity Calculator (Sequent Peak / Rippl)
 *  2. Flood Routing (Level-Pool Routing)
 *  3. Water Balance (Reservoir Operation)
 *  4. Sedimentation (Sediment Yield)
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Common / Shared Types
// ---------------------------------------------------------------------------

/** Custom error class for hydrology validation failures */
export class HydroValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HydroValidationError';
  }
}

/** A single point on any X-Y curve (e.g., Elevation-Storage) */
export interface CurvePoint {
  x: number;
  y: number;
}

/**
 * Stage-Storage-Area-Discharge curve.
 * Each point maps an elevation (stage) to storage volume, surface area,
 * and (optionally) outflow discharge through the spillway.
 * All arrays MUST be the same length and sorted ascending by `elevation`.
 */
export interface StageStorageCurve {
  /** Water surface elevation (m asl) — must be monotonically increasing */
  elevation: number[];
  /** Cumulative storage volume at each elevation (m³) */
  storage: number[];
  /** Water surface area at each elevation (m²) */
  area: number[];
}

/** Stage-Discharge relationship for the spillway / outlet */
export interface StageDischargeCurve {
  /** Water surface elevation (m asl) — must be monotonically increasing */
  elevation: number[];
  /** Outflow discharge at each elevation (m³/s) */
  discharge: number[];
}

// ---------------------------------------------------------------------------
// 1. Capacity Calculator (Sequent Peak Algorithm / Rippl)
// ---------------------------------------------------------------------------

/** Monthly hydrological data row for Rippl analysis */
export interface MonthlyData {
  id: string;
  month: string;
  inflow: number;   // Volume inflow (Juta m³)
  outflow: number;  // Volume outflow / demand (Juta m³)
  evaporation?: number;
  rainfall?: number;
}

/** Input parameters for the Sequent Peak Algorithm */
export interface SequentPeakInput {
  /** Monthly inflow volumes — length must equal outflow length */
  inflow: number[];
  /** Monthly outflow / demand volumes */
  outflow: number[];
}

/** Result of the Sequent Peak Algorithm */
export interface SequentPeakResult {
  /** Net flow per period (inflow - outflow) */
  netFlow: number[];
  /** Cumulative net flow (mass curve) */
  cumulativeNetFlow: number[];
  /** Sequent peak value at each period */
  sequentPeak: number[];
  /** Required storage at each period */
  requiredStorage: number[];
  /** Maximum effective storage capacity needed (Juta m³) */
  maxStorageRequired: number;
  /** Mass curve data for charting */
  massCurveData: MassCurvePoint[];
}

export interface MassCurvePoint {
  period: number;
  month: string;
  cumulativeInflow: number;
  cumulativeOutflow: number;
  cumulativeNetFlow: number;
}

/** Kept for backward-compat with UI layer */
export interface RipplCalculationResult {
  cumulativeInflow: number[];
  cumulativeOutflow: number[];
  deficit: number[];
  storageRequired: number;
  massCurveData: {
    month: string;
    cumulativeInflow: number;
    cumulativeOutflow: number;
  }[];
}

// ---------------------------------------------------------------------------
// 2. Flood Routing (Level-Pool / Storage Routing)
// ---------------------------------------------------------------------------

/** A single time-step of an inflow hydrograph */
export interface HydrographPoint {
  /** Time from start (seconds) */
  time: number;
  /** Discharge at this time (m³/s) */
  discharge: number;
}

/** Input for the Level-Pool Routing calculation */
export interface FloodRoutingInput {
  /** Inflow hydrograph — must have ≥ 2 points, sorted ascending by time */
  inflowHydrograph: HydrographPoint[];
  /** Stage-Storage relationship */
  stageStorageCurve: StageStorageCurve;
  /** Stage-Discharge (spillway outflow) relationship */
  stageDischargeCurve: StageDischargeCurve;
  /** Time step for routing (seconds), e.g. 3600 for hourly */
  deltaT: number;
  /** Initial water surface elevation (m asl) */
  initialElevation: number;
}

/** Result of a single routing time-step */
export interface RoutingTimeStep {
  /** Time from start (seconds) */
  time: number;
  /** Average inflow during this step (m³/s) */
  inflowAvg: number;
  /** Outflow at the end of this step (m³/s) */
  outflow: number;
  /** Storage at end of step (m³) */
  storage: number;
  /** Water surface elevation at end of step (m asl) */
  elevation: number;
}

/** Complete result of Level-Pool Routing */
export interface FloodRoutingResult {
  /** All time-step results */
  steps: RoutingTimeStep[];
  /** Peak inflow (m³/s) */
  peakInflow: number;
  /** Peak outflow (m³/s) — should be ≤ peakInflow (attenuation) */
  peakOutflow: number;
  /** Maximum water surface elevation reached (m asl) */
  maxElevation: number;
  /** Maximum storage reached (m³) */
  maxStorage: number;
  /** Peak attenuation ratio (1 - peakOutflow/peakInflow) */
  attenuationRatio: number;
}

// ---------------------------------------------------------------------------
// 3. Water Balance (Reservoir Operation Simulation)
// ---------------------------------------------------------------------------

/** Input for a single time-step of Water Balance simulation */
export interface WaterBalanceStepInput {
  /** Inflow volume (m³) */
  inflow: number;
  /** Water demand / release (m³) */
  demand: number;
  /** Rainfall depth over reservoir (mm) */
  rainfall: number;
  /** Evaporation depth from reservoir (mm) */
  evaporation: number;
}

/** Configuration / reservoir parameters for the Water Balance */
export interface WaterBalanceConfig {
  /** Maximum storage capacity (m³) */
  maxStorage: number;
  /** Dead storage below which no release is possible (m³) */
  deadStorage: number;
  /** Initial storage at start of simulation (m³) */
  initialStorage: number;
  /** Constant surface area of the reservoir (m²). Used to convert mm→m³ */
  surfaceArea: number;
  /** Infiltration / seepage loss rate (m³ per time step), default 0 */
  seepageLoss?: number;
}

/** Result of a single Water Balance time-step */
export interface WaterBalanceTimeStep {
  /** Period index (0-based) */
  period: number;
  /** Storage at start of period (m³) */
  storageStart: number;
  /** Inflow volume (m³) */
  inflow: number;
  /** Demand / release fulfilled (m³) */
  release: number;
  /** Unmet demand (m³) — positive means deficit */
  deficit: number;
  /** Rainfall gain (m³) */
  rainfallGain: number;
  /** Evaporation loss (m³) */
  evaporationLoss: number;
  /** Seepage loss (m³) */
  seepageLoss: number;
  /** Spillway overflow (m³) — when storage exceeds max */
  overflow: number;
  /** Storage at end of period (m³) */
  storageEnd: number;
  /** Status label */
  status: 'surplus' | 'deficit' | 'spill' | 'normal';
}

/** Complete Water Balance simulation result */
export interface WaterBalanceResult {
  steps: WaterBalanceTimeStep[];
  /** Total overflow volume (m³) */
  totalOverflow: number;
  /** Total deficit volume (m³) */
  totalDeficit: number;
  /** Reliability (% of periods where demand is fully met) */
  reliability: number;
}

// ---------------------------------------------------------------------------
// 4. Sedimentation (Sediment Yield)
// ---------------------------------------------------------------------------

/** A single sediment measurement sample */
export interface SedimentSample {
  /** Suspended sediment concentration (mg/L) */
  concentration: number;
  /** Water discharge at time of sampling (m³/s) */
  discharge: number;
  /** Duration represented by this sample (seconds) */
  duration: number;
}

/** Result of sediment yield calculation */
export interface SedimentYieldResult {
  /** Total sediment load (tonnes/year) */
  totalLoadTonnesPerYear: number;
  /** Total sediment volume (m³/year) */
  totalVolumeM3PerYear: number;
  /** Specific sediment yield (tonnes/km²/year) */
  specificYield: number;
  /** Erosion rate (mm/year) — volume yield ÷ catchment area */
  erosionRate: number;
  /** Estimated useful life of reservoir (years) */
  reservoirUsefulLife: number;
  /** Per-sample breakdown */
  sampleDetails: SedimentSampleDetail[];
}

export interface SedimentSampleDetail {
  /** Sediment transport rate (kg/s) */
  transportRate: number;
  /** Total sediment mass for the sample's duration (tonnes) */
  totalMass: number;
}

/** Input configuration for Sedimentation analysis */
export interface SedimentationInput {
  /** Sediment samples */
  samples: SedimentSample[];
  /** Dry bulk density of sediment (tonnes/m³), typical 1.1–1.5 */
  bulkDensity: number;
  /** Catchment area (km²) */
  catchmentArea: number;
  /** Active storage capacity of the reservoir (m³) — for useful life calc */
  activeStorage: number;
  /** Trap efficiency (0–1), e.g. 0.90 */
  trapEfficiency: number;
}

// ---------------------------------------------------------------------------
// Reservoir Parameters (legacy compat)
// ---------------------------------------------------------------------------

export interface ReservoirParameters {
  maxStorage: number;
  deadStorage: number;
  activeStorage: number;
  initialStorage: number;
}
