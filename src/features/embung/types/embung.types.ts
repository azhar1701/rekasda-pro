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

/** Spillway hydraulic parameters (Pd. T-03-2005-A & SNI 03-3432-1994) */
export interface SpillwayConfig {
  /** Elevasi Mercu Pelimpah (m asl) — setara Muka Air Normal (MAN) */
  crestElevation: number;
  /** Lebar Efektif Mercu Pelimpah B (m) */
  crestLength: number;
  /** Koefisien Debit Pelimpah Cd (typical 1.8 - 2.2) */
  dischargeCoefficient: number;
  /** Tipe Mercu Pelimpah */
  spillwayType: 'ogee' | 'broad_crested' | 'sharp_crested';
}

/** Reservoir standard zoning (SNI 03-3432-1994) */
export interface ReservoirZoning {
  /** Elevasi Dasar Sungai (m asl) */
  riverbedElevation: number;
  /** Muka Air Rendah / Mati (MAD) */
  deadStorageElevation: number;
  /** Muka Air Normal / Mercu Pelimpah (MAN / NWL) */
  normalWaterLevel: number;
  /** Muka Air Banjir Maksimum (MAB / HWL) */
  floodWaterLevel: number;
  /** Tinggi Jagaan Minimum Freeboard (m) */
  freeboard: number;
  /** Volume Tampungan Mati (m³) */
  deadStorageVolume: number;
  /** Volume Tampungan Efektif (m³) */
  activeStorageVolume: number;
  /** Volume Tampungan Banjir (m³) */
  floodStorageVolume: number;
  /** Total Kapasitas Tampungan (m³) */
  totalStorageVolume: number;
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

/** Input untuk membuat Rating Curve (Langkah 1) dan menghitung Total (Langkah 2-4) */
export interface SedimentationInput {
  /** Array data debit Q (m³/s) - untuk membuat regresi */
  qData: number[];
  /** Array data debit sedimen Qs (Ton/hari atau Kg/s, sesuai kesepakatan) - untuk membuat regresi */
  qsData: number[];
  /** Luas Daerah Aliran Sungai (km²) */
  luasDas: number;
  /** Berat jenis sedimen (Ton/m³) */
  beratJenis: number;
  /** Persentase Bed Load dari Suspended Load (default 10-20%) */
  bedLoadPercentage: number;
  /** Opsional: Rata-rata hari per tahun atau debit harian untuk konversi dari Qs ke tahunan. 
   * Untuk kemudahan tes sesuai rumus dasar, kita asumsikan hasil fungsi ini langsung dihitung per tahun. */
  flowDurationDays?: number[];
  flowDurationQ?: number[];
  /** Kapasitas waduk (m³) untuk perhitungan Trap Efficiency Brune */
  reservoirCapacity?: number;
  /** Inflow tahunan (m³) untuk perhitungan Trap Efficiency Brune */
  annualInflow?: number;
  /** Volume tampungan mati (m³) untuk estimasi umur guna */
  deadStorageM3?: number;
}

/** Result for Sediment Yield Rating Curve calculation */
export interface SedimentYieldResult {
  /** Koefisien a dari log Qs = log a + b log Q */
  a: number;
  /** Koefisien b dari log Qs = log a + b log Q */
  b: number;
  /** Bias Correction Factor (Duan's Smearing Estimator) */
  bcf: number;
  /** Total Sedimen Suspensi (Ton/Tahun) */
  suspendedLoadTonnes: number;
  /** Total Bed Load (Ton/Tahun) */
  bedLoadTonnes: number;
  /** Total Sedimen = Suspended + Bed Load (Ton/Tahun) */
  totalLoadTonnes: number;
  /** Volume Sedimen Total (m³/Tahun) */
  totalVolumeM3: number;
  /** Efisiensi Tangkapan Waduk (Trap Efficiency) dalam persen (%) */
  trapEfficiency: number;
  /** Volume Sedimen yang Terperangkap di Waduk (m³/Tahun) */
  trappedVolumeM3: number;
  /** Laju Erosi Spesifik (mm/Tahun) */
  erosionRateMm: number;
  /** Laju Erosi (Ton/km²/Tahun) */
  specificYield: number;
  /** Estimasi Umur Guna Tampungan Mati (Tahun) */
  lifespanYears?: number;
}

/** Regional / SDR Sediment Input (SNI 03-3432-1994) */
export interface RegionalSedimentInput {
  /** Luas Daerah Aliran Sungai (km²) */
  luasDasKm2: number;
  /** Laju Erosi Lahan Regional (mm/tahun) */
  erosionRateMmYear: number;
  /** Sediment Delivery Ratio (SDR) 0 - 1 (jika kosong dihitung dengan formula Boyd: 0.47 * A^-0.125) */
  sdr?: number;
  /** Berat jenis sedimen kering terpadatkan (Ton/m³), default 1.2 - 1.6 */
  beratJenisTonM3?: number;
  /** Trap Efficiency Waduk (%) - default 95% atau dihitung via Brune */
  trapEfficiencyPercent?: number;
  /** Volume Tampungan Mati (m³) */
  deadStorageM3?: number;
}

/** Result of Regional Sediment Yield Calculation */
export interface RegionalSedimentResult {
  /** Volume Erosi Kotor Permukaan DAS (m³/tahun) */
  grossErosionM3: number;
  /** Berat Erosi Kotor (Ton/tahun) */
  grossErosionTonnes: number;
  /** Nilai SDR yang digunakan */
  sdr: number;
  /** Hasil Sedimen Sampai ke Waduk / Sediment Yield (m³/tahun) */
  sedimentYieldM3: number;
  /** Hasil Sedimen Sampai ke Waduk (Ton/tahun) */
  sedimentYieldTonnes: number;
  /** Trap Efficiency Waduk (%) */
  trapEfficiencyPercent: number;
  /** Volume Sedimen Terperangkap di Waduk (m³/tahun) */
  trappedVolumeM3: number;
  /** Laju Erosi Terhitung (mm/tahun) */
  erosionRateMmYear: number;
  /** Estimasi Umur Guna Tampungan Mati (Tahun) */
  lifespanYears?: number;
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

