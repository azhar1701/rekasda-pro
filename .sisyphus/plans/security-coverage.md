# 🛡️ Work Plan: High-Priority Security & Coverage

This work plan details the execution steps for migrating Gemini API calls to a secure Supabase Edge Function and achieving 100% test coverage for critical hydrology and statistics engines.

## 🎯 Goals
1.  **Security**: Prevent `VITE_GEMINI_API_KEY` leakage by migrating all Gemini API operations to a Supabase Edge Function (`extract-rainfall`).
2.  **Reliability**: Ensure `rainfall.ts`, `rationalMethod.ts`, `frequency.ts`, and `goodnessOfFit.ts` have comprehensive Vitest coverage mapping strictly to SNI standards.

## 🏗️ Technical Approach

### Phase 1: Edge Function Migration (Gemini Security)
- **Supabase CLI**: Create a new Edge Function named `extract-rainfall`.
- **Environment**: Configure Supabase secrets (`supabase secrets set GEMINI_API_KEY=...`).
- **Function Logic**: Port `src/services/geminiService.ts` logic into the Deno Edge Function. Implement authentication verification (JWT) and request size limits.
- **Client Update**: Refactor `src/services/geminiService.ts` to call the new Edge Function via `supabase.functions.invoke()`.
- **Validation**: Ensure the existing PDF OCR functionality in the frontend still works identically.

### Phase 2: Core Engine Test Coverage
- **`src/lib/engine/rainfall.ts`**: Test Thiessen polygon weighting, IDW calculations, and missing data infill logic.
- **`src/lib/engine/rationalMethod.ts`**: Test runoff coefficient (C) composite logic, intensity duration frequency (IDF) integration, and edge cases for large/small DAS areas.
- **`src/lib/engine/statistics/frequency.ts`**: Test Normal, Log-Normal, Gumbel, and Log-Pearson Type III distributions against known dataset benchmarks.
- **`src/lib/engine/statistics/goodnessOfFit.ts`**: Test Smirnov-Kolmogorov and Chi-Square tests to ensure accurate rejection/acceptance of distribution hypotheses.

## 📋 Tasks

### 1. Edge Function Creation & Client Refactor
- [x] Initialize `supabase/functions/extract-rainfall` via Supabase CLI.
- [ ] Migrate prompt logic and Gemini SDK calls into `extract-rainfall/index.ts`.
- [ ] Implement Supabase JWT verification in the Edge Function to prevent unauthorized OCR usage.
- [x] Refactor `src/services/geminiService.ts` to use `supabase.functions.invoke('extract-rainfall', { body: { fileData, mimeType, prompt } })`.
- [x] **QA**: Test PDF upload in `MasterHidrologiTab` and verify the network tab does NOT expose the API key.

### 2. Test Coverage: Rainfall & Rational Method
- [x] Create `src/lib/engine/rainfall.test.ts`. Add tests for `calculateThiessen` and `calculateIDW`.
- [x] Create `src/lib/engine/rationalMethod.test.ts`. Test standard, modified, and composite Rational calculations.
- [x] **QA**: Run `npm run test:coverage` and verify both files hit >90% statement coverage.

### 3. Test Coverage: Statistical Engines
- [x] Create `src/lib/engine/statistics/frequency.test.ts`. Add known dataset arrays and test Gumbel and Log-Pearson III outputs.
- [x] Create `src/lib/engine/statistics/goodnessOfFit.test.ts`. Test Chi-Square and Smirnov-Kolmogorov logic.
- [x] **QA**: Run `npm run test:coverage` and verify the `statistics/` directory hits >90% coverage.

### 4. Final Deployment & Cleanup
- [x] Remove `VITE_GEMINI_API_KEY` references from `.env.example` and frontend config files.
- [x] Document the new Edge Function deployment process in `README.md`.
- [x] Run a final `npm run typecheck` and `npm run test`.

## 🏁 Success Criteria
- The Gemini API key is completely removed from the frontend bundle.
- Supabase Edge Function successfully processes PDF OCR requests.
- `vitest` coverage report shows >90% for `rainfall.ts`, `rationalMethod.ts`, `frequency.ts`, and `goodnessOfFit.ts`.
- All TypeScript types remain intact.