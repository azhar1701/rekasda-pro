- Initialized 'extract-rainfall' Supabase Edge Function using 'npx supabase functions new extract-rainfall'.

- Migrated Gemini API call logic and prompt construction into the `extract-rainfall` Edge Function.
- Implemented Supabase JWT verification using `supabase.auth.getUser(token)` to secure the endpoint.
- Used standard `fetch` to call the Gemini API directly from Deno, avoiding the need for the `@google/generative-ai` SDK which might have compatibility issues in Edge environments.## Gemini Service Refactoring (2026-03-07)
- Successfully refactored `src/services/geminiService.ts` to use Supabase Edge Functions.
- Removed direct dependency on `@google/generative-ai` and `VITE_GEMINI_API_KEY`.
- All AI operations (embeddings, consultation, and rainfall extraction) now go through `supabase.functions.invoke`.
- Added null checks for `supabase` client to satisfy TypeScript strict mode.
- Implemented a non-streaming fallback for `consultHydrologistStream` until Edge Function streaming is fully configured.
- Verified changes with `npm run typecheck`.
QA for PDF upload requires a running Supabase instance with the edge function deployed. Skipping automated QA for this step.

## Rainfall Engine Tests
- Discovered that `calculateThiessen` and `calculateIDW` are not in `src/lib/engine/rainfall.ts` but rather in `src/lib/engine/rainfallAnalysis.ts` and `src/lib/utils/spatialMath.ts` respectively.
- Created comprehensive tests in `src/lib/engine/rainfall.test.ts` covering the core rainfall intensity methods (Mononobe, Talbot, Sherman), time of concentration methods (Kirpich, Bransby-Williams, California Culvert), as well as the requested Thiessen polygon weighting and IDW missing data infill logic.
- All tests pass successfully using Vitest.

## Rational Method Testing
- The `rationalMethod.ts` module relies heavily on Zod for input validation, which simplifies testing by allowing us to expect throws for invalid inputs.
- Composite runoff coefficient (C) logic is not a standalone function but is easily simulated and tested by calculating the weighted average of C before passing it to `calculateRationalDischarge`.
- IDF integration is similarly handled by calculating Intensity (I) externally (e.g., using Mononobe) and passing it to the Rational Method function.
- The module correctly generates warnings for edge cases like DAS > 300 Ha, DAS > 5000 Ha, and extreme C values, which are crucial for SNI compliance.
## Coverage Analysis - 2026-03-07
- Verified coverage for `src/lib/engine/rainfall.ts` (90.14%) and `src/lib/engine/rationalMethod.ts` (97.43%).
- Added edge case tests for `calculateTimeConcentration` (California and Bransby-Williams methods) to achieve >90% coverage in `rainfall.ts`.
- Note: Zod validation prevents some default branches from being reachable without `@ts-ignore`, but core logic is fully covered.
### Rainfall Test Fix
- Encountered a syntax error (Unexpected "}") in `src/lib/engine/rainfall.test.ts` due to duplicated and malformed test blocks at the end of the file.
- Cleaned up the file by removing redundant `describe` blocks and ensuring proper closing braces.
- Verified the fix with `npm run test src/lib/engine/rainfall.test.ts`, which passed with 17 tests.

## Frequency Analysis Tests
- Created comprehensive tests for `src/lib/engine/statistics/frequency.ts`.
- Verified Normal, Log-Normal, Gumbel, and Log-Pearson Type III distributions.
- Used a known dataset array to validate the statistical parameters and design values.
- All tests passed successfully using vitest.

## Goodness of Fit Tests
- Created comprehensive tests for Chi-Square and Kolmogorov-Smirnov goodness of fit tests in `src/lib/engine/statistics/goodnessOfFit.test.ts`.
- Verified that the tests pass successfully using `npm run test`.
- The tests cover normal, gumbel, lognormal, and logpearson3 distributions for both Chi-Square and Kolmogorov-Smirnov methods.
- The `validateDistributionFit` function was also tested to ensure it correctly combines the results of both tests.


## Coverage Analysis - src/lib/engine/statistics/ (2026-03-07)
- **Directory**: `src/lib/engine/statistics/`
- **Overall Coverage**: 92.13% (Statements/Lines)
- **Status**: ✅ PASSED (>90% threshold)

### File Breakdown
- `frequency.ts`: 93% coverage.
  - Uncovered lines: 412-413 (Log-Normal selection), 421-422 (Default Log-Pearson III selection).
  - These lines are in `suggestDistribution`, which uses heuristics for distribution selection.
- `goodnessOfFit.ts`: 92.2% coverage.
  - Uncovered lines: 314-315 (KS failure warning), 323-328 (Specific failure recommendations).
  - These lines handle cases where tests fail, which are less frequent in standard test suites but should be covered by edge case tests.

### Observations
- The core mathematical logic for Gumbel, Log-Pearson III, Chi-Square, and Kolmogorov-Smirnov is well-covered.
- Warnings about "frekuensi harapan < 5" were noted in the test output, which is expected for small datasets in Chi-Square tests.
## Gemini API Key Removal (2026-03-07)
- Successfully removed all references to `VITE_GEMINI_API_KEY` from the frontend codebase to prevent client-side leakage.
- Files modified:
  - `.env.example`: Removed the variable definition.
  - `vite-env.d.ts`: Removed the type definition for `ImportMetaEnv`.
  - `.github/workflows/production.yml`: Removed the build argument injection.
  - `CICD_SECRETS_GUIDE.md`: Removed from the secrets list and checklist.
  - `docs/deployment/DEPLOYMENT_CHECKLIST.md`: Removed from environment setup.
  - `docs/deployment/DEPLOYMENT_GUIDE.md`: Removed from required variables.
  - `docs/deployment/PRODUCTION_BUILD_VERIFICATION.md`: Removed from environment configuration.
- Verified that `GEMINI_API_KEY` remains in Supabase Edge Functions (`supabase/functions/extract-rainfall/index.ts`) as intended for secure server-side usage.

## Edge Function Documentation (2026-03-07)
- Documented the Supabase Edge Function deployment process for `extract-rainfall` in `README.md`.
- Included instructions for setting the `GEMINI_API_KEY` secret using the Supabase CLI.
- Placed the documentation under the "Quick Start" section as an optional step.
- Verified that the README now contains clear steps for `supabase login`, `supabase link`, `supabase secrets set`, and `supabase functions deploy`.


## Final Verification (2026-03-07)
- Ran `npm run typecheck` and `npm run test` to ensure project stability.
- **Typecheck**: Passed successfully.
- **Tests**: 82 tests passed across 11 test files.
- **Observations**: Chi-Square tests for small datasets correctly log warnings about expected frequencies < 5, which is expected behavior for the implemented statistical logic.