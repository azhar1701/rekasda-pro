# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-04
**Commit:** e1def56
**Branch:** v1.1-dev

## OVERVIEW
Professional Water Resources Engineering Platform for hydrological analysis compliant with Indonesian National Standards (SNI). Core stack: React 18.3, TypeScript 5.9, Supabase, Tailwind CSS 3.4, and Google Gemini AI.

## STRUCTURE
```
rekasda-pro/
├── src/
│   ├── features/        # Feature modules (Flood, Channel, Water Balance, AI)
│   ├── components/ui/   # Shared GovTech UI components
│   ├── hooks/           # Custom React hooks & Web Workers
│   ├── lib/             # Core libraries (Engine, Constants, Utils)
│   ├── services/        # API, Database, & Business Logic
│   ├── stores/          # State management (Zustand)
│   └── types/           # TypeScript definitions
├── database/            # SQL schemas and setup
├── supabase/            # Migrations and Edge Functions
└── docs/                # Technical and user documentation
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Hydrology Logic | `src/lib/engine` | SNI-compliant calculations |
| SNI Constants | `src/lib/constants/sni.ts` | SSOT for coefficients and limits |
| Rainfall Management | `MasterHidrologiTab.tsx` | Main CRUD + Bulk Matrix Ingestion |
| UI Components | `src/components/ui` | GovTech standard components |
| DB Schema | `supabase/migrations` | Table definitions and migrations |
| AI Logic | `src/services/geminiService.ts` | Gemini API integration |
| Web Workers | `src/hooks/useHydrologyWorker.ts` | Heavy math offloading |
| Entry Point | `src/index.tsx` | Main application entry |

## CONVENTIONS
- **SNI First**: All calculations must reference SNI constants in `src/lib/constants/sni.ts`.
- **SSOT**: Data flows from Supabase -> Store -> Engines. No manual overrides without QC.
- **Worker-First**: Heavy math logic (HSS, Frequency Analysis) should not block the main thread.
- **GovTech UI**: High-density UI strictly required for all data tables (`tabular-nums`, strict zebra stripes).
- **Type Safety**: Strict TypeScript usage; avoid `any` at all costs.
- **Feature Barrels**: Each feature in `src/features` should have an `index.ts` for clean exports.

## ANTI-PATTERNS
- **Hardcoded Parameters**: Never use magic numbers for rainfall coefficients; use `SNI` constants.
- **Direct State Mutation**: Always use store actions to update hydrology data.
- **Main-Thread Blocking**: Running heavy spatial/hydrology algorithms without Web Workers.
- **Mock Data in Production**: Ensure `fjMock.ts` or similar are only used in test/dev environments.
- **Direct Supabase Calls**: Use `apiService` or `useDatabase` hook instead of direct client calls.

## COMMANDS
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run hydrology tests (Vitest)
npm run typecheck # Check TS strict mode
npm run lint     # Run ESLint
```

## NOTES
- Rational Method is limited to DAS ≤ 300 ha per SNI 2415:2016.
- HSS Nakayasu uses alpha = 2.0 as standard unless calibrated.
- Water Balance follows SNI 19-6728.1-2002 methodology.
- Project uses Vitest for testing and Vite for building.
