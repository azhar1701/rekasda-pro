/**
 * Convolution (Superposition) Engine
 * ====================================
 * Converts a Unit Hydrograph (UH) into a Design Flood Hydrograph (DFH)
 * by convolving it with effective rainfall from the Alternating Block Method.
 *
 * Mathematical basis (SNI 2415:2016, Modul Analisis Hidrologi Terapan):
 *
 *   Q(n) = Σ_{m=1}^{M}  P_eff(m) × U(n - m + 1)
 *
 *   where:
 *     Q(n)      = total discharge at time step n (m³/s)
 *     P_eff(m)  = effective rainfall at hour m (mm)  — from ABM
 *     U(k)      = unit hydrograph ordinate at step k (m³/s per mm)
 *     M         = total number of rainfall intervals
 *
 * The output hydrograph length = len(UH) + len(P_eff) - 1
 *
 * Reference:
 *   - Chow, Maidment & Mays (1988) "Applied Hydrology", Ch. 7
 *   - SNI 2415:2016 Pasal 6 — Hidrograf Banjir Rencana
 *   - Sosrodarsono & Takeda (1983)
 */

// ─── Type Definitions ───────────────────────────────────────────────

/** A single time–discharge pair in the hydrograph */
export interface HydrographPoint {
  /** Time from start (hours) */
  time: number;
  /** Discharge (m³/s) */
  discharge: number;
}

/** Input for the convolution function */
export interface ConvolutionInput {
  /** Unit Hydrograph ordinates — discharge per mm of excess rainfall */
  unitHydrograph: HydrographPoint[];
  /** Effective rainfall series in mm (ABM-ordered), one value per time step */
  effectiveRainfall: number[];
  /** Time step of the unit hydrograph (hours), e.g. 0.5 or 1.0 */
  timeStep: number;
}

/** Result of the convolution */
export interface ConvolutionResult {
  /** Design Flood Hydrograph — the convolved result */
  floodHydrograph: HydrographPoint[];
  /** Peak discharge (m³/s) */
  peakDischarge: number;
  /** Time to peak (hours) */
  timeToPeak: number;
  /** Total volume under hydrograph (m³) */
  totalVolume: number;
  /** Per-rainfall-pulse component hydrographs (for visualization) */
  componentHydrographs: HydrographPoint[][];
}

// ─── Core Convolution Function ──────────────────────────────────────

/**
 * Perform discrete convolution of a Unit Hydrograph with effective rainfall.
 *
 * This implements the standard superposition principle:
 *   1. For each rainfall pulse P_eff(m), shift the UH by (m-1) time steps
 *      and scale its ordinates by P_eff(m).
 *   2. Sum all shifted+scaled UH pulses to get the total flood hydrograph.
 *
 * @param input  ConvolutionInput with UH, rainfall series, and time step
 * @returns      ConvolutionResult with flood hydrograph, peak, and components
 * @throws       Error if inputs are invalid
 *
 * @example
 * ```ts
 * const result = convolveUnitHydrograph({
 *   unitHydrograph: [
 *     { time: 0, discharge: 0 },
 *     { time: 1, discharge: 5.2 },
 *     { time: 2, discharge: 12.8 },
 *     { time: 3, discharge: 8.1 },
 *     { time: 4, discharge: 3.5 },
 *     { time: 5, discharge: 1.0 },
 *   ],
 *   effectiveRainfall: [15.2, 42.6, 28.1, 18.5, 10.3, 5.8],
 *   timeStep: 1.0,
 * });
 *  // Peak of the design flood
 * ```
 */
export function convolveUnitHydrograph(input: ConvolutionInput): ConvolutionResult {
  const { unitHydrograph, effectiveRainfall, timeStep } = input;

  // ── Validation ──
  if (unitHydrograph.length < 2) {
    throw new Error('Unit Hydrograph harus memiliki minimal 2 ordinat.');
  }
  if (effectiveRainfall.length < 1) {
    throw new Error('Hujan efektif harus memiliki minimal 1 interval.');
  }
  if (timeStep <= 0) {
    throw new Error('Time step harus > 0 jam.');
  }

  const N = unitHydrograph.length; // Number of UH ordinates
  const M = effectiveRainfall.length; // Number of rainfall pulses
  const L = N + M - 1; // Length of convolved hydrograph

  // Extract UH discharge ordinates
  const U = unitHydrograph.map(p => p.discharge);

  // ── Superposition: Q(n) = Σ P_eff(m) × U(n - m + 1) ──
  const Q = new Array<number>(L).fill(0);
  const componentHydrographs: HydrographPoint[][] = [];

  for (let m = 0; m < M; m++) {
    const P = effectiveRainfall[m];
    const component: HydrographPoint[] = [];

    for (let k = 0; k < N; k++) {
      const n = m + k; // Output time index
      const contribution = P * U[k];
      Q[n] += contribution;

      component.push({
        time: round(n * timeStep, 2),
        discharge: round(contribution, 4),
      });
    }

    componentHydrographs.push(component);
  }

  // ── Build output hydrograph ──
  const floodHydrograph: HydrographPoint[] = Q.map((q, i) => ({
    time: round(i * timeStep, 2),
    discharge: round(q, 4),
  }));

  // ── Find peak ──
  let peakDischarge = 0;
  let timeToPeak = 0;
  for (const point of floodHydrograph) {
    if (point.discharge > peakDischarge) {
      peakDischarge = point.discharge;
      timeToPeak = point.time;
    }
  }

  // ── Calculate total volume (trapezoidal rule) ──
  // Volume = Σ (Q_i + Q_{i+1}) / 2 × Δt × 3600  [m³]
  let totalVolume = 0;
  for (let i = 0; i < floodHydrograph.length - 1; i++) {
    const avgQ = (floodHydrograph[i].discharge + floodHydrograph[i + 1].discharge) / 2;
    totalVolume += avgQ * timeStep * 3600; // Convert hours to seconds
  }

  return {
    floodHydrograph,
    peakDischarge: round(peakDischarge, 4),
    timeToPeak: round(timeToPeak, 2),
    totalVolume: round(totalVolume, 2),
    componentHydrographs,
  };
}

// ─── Helper: Resample UH to Match Rainfall Interval ─────────────────

/**
 * Resample a unit hydrograph to a different time step using linear interpolation.
 *
 * Useful when the UH has a fine time step (e.g., 0.1h) but the ABM rainfall
 * is at hourly intervals (1.0h). This function resamples the UH to match
 * the rainfall time step for proper convolution.
 *
 * @param uh       Original unit hydrograph with fine time step
 * @param newStep  Desired time step (hours), typically 1.0 for hourly ABM
 * @returns        Resampled unit hydrograph
 */
export function resampleUnitHydrograph(
  uh: HydrographPoint[],
  newStep: number
): HydrographPoint[] {
  if (uh.length < 2 || newStep <= 0) return [...uh];

  const maxTime = uh[uh.length - 1].time;
  const resampled: HydrographPoint[] = [];

  for (let t = 0; t <= maxTime; t += newStep) {
    // Find bracketing points
    let lower = uh[0];
    let upper = uh[1];

    for (let i = 0; i < uh.length - 1; i++) {
      if (uh[i].time <= t && uh[i + 1].time >= t) {
        lower = uh[i];
        upper = uh[i + 1];
        break;
      }
    }

    // Linear interpolation
    const dt = upper.time - lower.time;
    const q = dt > 0
      ? lower.discharge + ((upper.discharge - lower.discharge) * (t - lower.time)) / dt
      : lower.discharge;

    resampled.push({
      time: round(t, 2),
      discharge: round(Math.max(0, q), 4),
    });
  }

  return resampled;
}

// ─── Integration Helper: ABM → Convolution Pipeline ─────────────────

/**
 * Convenience wrapper that takes ABM-ordered rainfall (mm per hour) and
 * a unit hydrograph, resamples the UH to match the ABM time step (1 hour),
 * and performs convolution.
 *
 * This is the recommended entry point for most use cases.
 *
 * @param unitHydrograph   UH from Nakayasu/Gama-1/Snyder/SCS
 * @param abmRainfall      ABM-ordered rainfall in mm (one value per hour)
 * @param uhTimeStep       Time step of the UH (hours), e.g. 0.1 or 0.5
 * @returns                ConvolutionResult
 *
 * @example
 * ```ts
 * const uh = calculateNakayasu({ A: 125.5, L: 35.2, Ro: 1, Alpha: 2 });
 * const hyetograph = generateHyetograph(185.0, 6);
 * const abm = hyetograph.rows.map(r => r.abm);
 *
 * const flood = computeDesignFloodHydrograph(
 *   generateHydrograph(uh.Qp, uh.Tp, uh.T03, 0.5),
 *   abm,
 *   0.5
 * );
 * 
 * ```
 */
export function computeDesignFloodHydrograph(
  unitHydrograph: HydrographPoint[],
  abmRainfall: number[],
  uhTimeStep: number = 1.0
): ConvolutionResult {
  // If UH time step matches rainfall interval (1 hour), convolve directly
  // Otherwise, resample UH to 1-hour intervals first
  const rainfallInterval = 1.0; // ABM is always hourly

  let uh = unitHydrograph;
  let step = uhTimeStep;

  if (Math.abs(uhTimeStep - rainfallInterval) > 0.01) {
    uh = resampleUnitHydrograph(unitHydrograph, rainfallInterval);
    step = rainfallInterval;
  }

  return convolveUnitHydrograph({
    unitHydrograph: uh,
    effectiveRainfall: abmRainfall,
    timeStep: step,
  });
}

// ─── Utility ────────────────────────────────────────────────────────

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
