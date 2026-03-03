# ENGINE KNOWLEDGE BASE (init-deep)

## OVERVIEW
Core hydrological calculation engines for REKASDA Pro. Implements Indonesian National Standards (SNI) for flood analysis, rainfall intensity, and water balance. All engines are designed as pure, stateless functions with Zod-backed validation.

## DIRECTORY STRUCTURE
- `flood/`: Advanced flood methods (Modified Rational, Haspers, Melchior, der Weduwen).
- `statistics/`: Frequency analysis (Gumbel, Log-Pearson III).
- `embung/`: Small dam / reservoir specific calculations.
- `rationalMethod.ts`: Standard Rational Method (SNI 2415:2016).
- `rainfall.ts`: Rainfall intensity (Mononobe) and time of concentration.
- `dependableFlow.ts`: Dependable flow (Q80) using Weibull (SNI 6738:2015).
- `irrigationDemand.ts`: Water demand for agriculture (SNI 6728.1:2015).
- `validation.ts`: Centralized validation logic and SNI limit checks.

## CORE ENGINES & STANDARDS
| Feature | Method | Standard | File |
|---------|--------|----------|------|
| Flood (Small DAS) | Rational | SNI 2415:2016 | `rationalMethod.ts` |
| Flood (Medium DAS) | der Weduwen | Indonesian Empirical | `flood/modifiedRationalIndo.ts` |
| Flood (Large DAS) | Melchior / Haspers | Indonesian Empirical | `flood/modifiedRationalIndo.ts` |
| Unit Hydrograph | HSS Nakayasu | SNI 2415:2016 | `flood.ts` |
| Rainfall Intensity | Mononobe | SNI 2415:2016 | `rainfall.ts` |
| Dependable Flow | Q80 (Weibull) | SNI 6738:2015 | `dependableFlow.ts` |
| Water Balance | Supply vs Demand | SNI 19-6728.1-2002 | `irrigationDemand.ts` |

## IMPLEMENTATION CONVENTIONS
- **Pure Functions**: Every engine must be a pure function. No side effects, no global state access.
- **Zod First**: All inputs must be validated using Zod schemas before calculation. Use `SNI_VALIDATION_LIMITS` from constants.
- **Metric SSOT**: Internal calculations use SI units (km², m³/s, mm). Convert UI inputs (ha, liters) at the boundary.
- **Indonesian Errors**: Validation messages must be in Indonesian for end-user clarity.
- **Iterative Solvers**: For methods like der Weduwen, use a maximum of 20 iterations with a 0.001 tolerance.

## ANTI-PATTERNS
- **Magic Numbers**: Never hardcode coefficients (e.g., Manning's n). Use `src/lib/constants/sni.ts`.
- **Floating Point Drift**: Rounding should only happen at the final output stage using `toFixed(3)` or similar.
- **Implicit Defaults**: Critical parameters (like Alpha in Nakayasu) must be explicitly provided or trigger a warning.
- **Direct Console Logs**: Return a `warnings` array in the result object instead of logging to console.

## TESTING STRATEGY
- **Unit Tests**: Every engine must have a corresponding test in `__tests__/`.
- **Calibration**: Test cases should include "Golden Values" from SNI documentation or manual spreadsheet calculations.
- **Edge Cases**: Always test with minimum/maximum DAS areas to verify method routing logic.
