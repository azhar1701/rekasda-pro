# 💧 Work Plan: Rekasda Pro Full Platform Evaluation

This plan outlines a comprehensive review and evaluation of the Rekasda Pro platform, covering frontend UI/UX, core hydrology logic, backend security, and system synchronization.

## 🎯 Goal
Ensure the platform is functionally accurate (SNI compliant), synchronized across modules, secure, and performant.

## 🛠️ Tech Stack & Standards
- **Frontend**: React 18.3, TypeScript 5.9, Zustand, Tailwind CSS.
- **Backend**: Supabase (PostgreSQL, Auth, PostGIS, Edge Functions).
- **AI**: Google Gemini (OCR & Consultation).
- **Standards**: SNI 2415:2016, SNI 6738:2015, SNI 19-6728.1-2002.

## 🏗️ Technical Approach
1.  **Static Logic Review**: Analyze math engines in `src/lib/engine` for algorithm correctness and Zod validation depth.
2.  **State Synchronization Audit**: Trace `isDirty` flags and reactive updates from Master Data through to downstream features.
3.  **UI/UX Verification**: Evaluate against GovTech standard components and responsiveness.
4.  **Backend & Security Audit**: Review Supabase RLS policies and API error handling patterns.
5.  **Test Suite Execution**: Run `npm test` and analyze coverage for critical engineering functions.

## 📋 Tasks

### 1. Logic & Algorithm Accuracy (SNI Compliance)
- [x] Review `src/lib/engine/flood.ts` for Nakayasu and Rational method precision.
- [x] Review `src/services/waterBalanceEngine.ts` for domestic and agricultural demand accuracy.
- [x] Verify `src/lib/constants/sni.ts` constants against official documentation.
- [x] **QA**: Verify that Rational method enforces DAS area limits (≤ 300 ha).
- [ ] Review `src/services/waterBalanceEngine.ts` for domestic and agricultural demand accuracy.
- [ ] Verify `src/lib/constants/sni.ts` constants against official documentation.
- [ ] **QA**: Verify that Rational method enforces DAS area limits (≤ 300 ha).

### 2. Frontend & UI/UX Evaluation
- [ ] Audit `src/components/ui` for consistency in GovTech design patterns.
- [x] Review responsiveness of `DailyRainfallMatrix` and `WebGISContainer`.
- [x] Check accessibility (ARIA labels) and high-density data legibility in tables.
- [ ] **QA**: Test UI behavior when a Web Worker calculation fails or takes > 5s.

### 3. Backend & Security Audit
- [ ] Review `supabase/migrations` for RLS (Row Level Security) coverage on `calculations` and `master_stasiun`.
- [x] Inspect `src/services/api.service.ts` for robust error handling and network timeout logic.
- [ ] Verify Gemini API integration security (API key usage in `geminiService.ts`).
- [ ] **QA**: Attempt unauthorized data access to verify RLS effectiveness.

### 4. System Synchronization & Performance
- [x] Trace the lifecycle of data changes from `useHydrologyStore` to `useEmbungStore`.
- [x] Audit `src/workers/hydrology.worker.ts` for potential memory leaks or message overhead.
- [x] Review `DependencyWarningBanner` implementation for all relevant modules.
- [x] **QA**: Modify rainfall data and verify that all downstream charts show "Dirty" or auto-update.

### 5. Final Verification Wave
- [x] Run `npm run typecheck` to ensure zero TS errors.
- [x] Run `npm test` and `npm run test:coverage`.
- [x] Analyze Vitest results for hydrology engines specifically.
- [x] Generate a summary report of findings and recommended fixes.

## 🏁 Success Criteria
- Zero critical bugs in math engines.
- 100% synchronization of "Dirty" states across all modules.
- All RLS policies correctly enforced.
- Test coverage > 80% for core calculation engines.
