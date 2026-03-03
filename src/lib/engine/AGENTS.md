# ENGINE KNOWLEDGE BASE

## OVERVIEW
SNI-compliant hydrological calculation engines for flood, rainfall, and water balance analysis.

## WHERE TO LOOK
| Engine | File | Standard |
|--------|------|----------|
| Flood Discharge | `flood.ts` | SNI 2415:2016 (Rational, Nakayasu) |
| Frequency Analysis | `statistics/frequency.ts` | SNI 2415:2016 (Gumbel, Log-Pearson III) |
| Rainfall Analysis | `rainfallAnalysis.ts` | PSA 007 (Thiessen, ARF, PMP) |
| Dependable Flow | `dependableFlow.ts` | SNI 6738:2015 (Q80) |
| Water Demand | `irrigationDemand.ts` | SNI 6728.1:2015 |

## CONVENTIONS
- **Zod Validation**: Every engine must use a Zod schema to validate inputs against `SNI_VALIDATION_LIMITS`.
- **Pure Functions**: Engines should be stateless, deterministic, and return plain objects.
- **Metric Units**: All calculations use metric (SI) units (km², m³/s, mm/hr) unless explicitly stated.
- **Indonesian Errors**: Validation error messages must be in Indonesian for end-user clarity.

## ANTI-PATTERNS
- **Magic Numbers**: Never hardcode coefficients. Use `src/lib/constants/sni.ts`.
- **Floating Point Drift**: Use `toFixed()` or rounding utilities only at the final output stage.
- **Implicit Defaults**: Always require critical parameters (e.g., `Alpha` for Nakayasu) or log a warning if using a fallback.
- **Direct Console Logs**: Use the validation engine or return a `warnings` array instead of `console.log` in production logic.
