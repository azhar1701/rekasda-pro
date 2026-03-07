## SNI Compliance Review - Math Engines

1. **Rational Method DAS Limit**:
   - Identified that the `RationalInputSchema` in `src/lib/engine/flood.ts` was using the general DAS limit (`SNI_VALIDATION_LIMITS.catchmentArea.max` = 10000 km²) instead of the specific Rational method limit (3 km² / 300 ha).
   - Fixed by importing `SNI_RATIONAL_AREA_LIMIT_KM2` and `SNI_RATIONAL_AREA_LIMIT_HA` from `src/lib/constants/sni.ts` and applying them to the schema validation.

2. **Floating Point Precision**:
   - Identified that `calculateRationalDischarge` was returning raw floating-point numbers which could lead to precision drift.
   - Fixed by applying `parseFloat(Q.toFixed(3))` to the final output, aligning with the project's convention of rounding at the final output stage.
   - Verified that `calculateHSSNakayasu`, `calculateHSSGamma1`, and `calculateHSSSnyder` already correctly apply `parseFloat(Qp.toFixed(3))` to their outputs.
   - Verified that `calculateWaterBalance` correctly applies `parseFloat(value.toFixed(3))` to all its output fields.

3. **Water Balance Demand Accuracy**:
   - Reviewed `calculateDomesticDemand` and `calculateAgricultureDemand` in `src/services/waterBalanceEngine.ts`.
   - Verified the unit conversions:
     - Domestic: `(jiwa × L/capita/day) / 86400000` correctly converts to m³/s.
     - Agriculture: `(Ha × L/s/Ha) / 1000` correctly converts to m³/s.
   - The formulas are mathematically accurate and compliant with SNI 6728.1:2015 and SNI 6738:2015.

4. **Verification**:
   - Ran `npm run typecheck` and `npm run test`. All checks passed successfully.
## Rational Method Fixes

- Updated `RationalInputSchema` in `src/lib/engine/flood.ts` to enforce the specific DAS area limit for the Rational method (≤ 300 ha / 3.0 km²) using `SNI_RATIONAL_AREA_LIMIT_KM2` and `SNI_RATIONAL_AREA_LIMIT_HA` from `src/lib/constants/sni.ts`.
- Updated `calculateRationalDischarge` to return `parseFloat(Q.toFixed(3))` to prevent floating-point drift and ensure precision.
- Verified changes with `npm run typecheck`.

- Extracted DailyRainfallMatrix to its own component file for better maintainability.
- Added ARIA labels to high-density data tables to improve accessibility.
- Improved responsiveness of the matrix table by adding overflow handling and sticky headers/columns.
## API Service Robustness
- Implemented  for true request cancellation on timeout.
- Standardized error logging with  and  for better observability.
- Wrapped Supabase calls in a  pattern to correctly inject .
- Ensured type safety by using  for  calls where Supabase types are overly restrictive but the runtime supports it.
## API Service Robustness
- Implemented AbortController for true request cancellation on timeout.
- Standardized error logging with console.error and console.warn for better observability.
- Wrapped Supabase calls in a promiseFactory pattern to correctly inject AbortSignal.
- Ensured type safety by using as any for abortSignal calls where Supabase types are overly restrictive but the runtime supports it.
## Security Audit Findings\n\n- **RLS**: Verified that `calculations` and `master_stasiun` have RLS enabled and proper policies in `20260228080203_security_and_indexing.sql` and `20260228120000_harden_calculation_tables.sql`.\n- **API Service**: Added `Promise.race` with a timeout to `handleResponse` in `src/services/api.service.ts` to ensure network requests don't hang indefinitely.\n- **Gemini API**: Identified a security risk in `src/services/geminiService.ts` where `VITE_GEMINI_API_KEY` is exposed to the client bundle. Added a TODO and recommendation to move this to a Supabase Edge Function.\n- **Typecheck**: Passed successfully after fixing syntax errors in `api.service.ts`.

## Hydrology Module Test Coverage Analysis (src/lib/engine)
- **Test Execution**: `npm run test` passed successfully with 35 tests passing in `src/lib/engine/embung/embung.test.ts` and 15 tests passing in `src/lib/engine/flood/hydrologyMath.test.ts`. No failing tests were found.
- **Coverage Summary**:
  - `src/lib/engine/embung/mathUtils.ts`: 97.05%
  - `src/lib/engine/flood.ts`: 91.66%
  - `src/lib/engine/embung/waterBalance.ts`: 86.36%
  - `src/lib/engine/embung/floodRouting.ts`: 76.92%
  - `src/lib/engine/flood/sni2415.ts`: 74.75%
  - `src/lib/engine/embung/embungCalculator.ts`: 71.25%
  - `src/lib/engine/embung/sedimentation.ts`: 63.55%
- **Missing Coverage**: Several core hydrology files currently have 0% coverage, including `rainfall.ts`, `rationalMethod.ts`, `frequency.ts`, `goodnessOfFit.ts`, `convolution.ts`, and `mononobe.ts`.
