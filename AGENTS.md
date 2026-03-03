# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-04
**Commit:** dev
**Branch:** main

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
| Global State | `src/stores/useHydrologyStore.ts` | Centralized hydrology state |
| UI Components | `src/components/ui` | GovTech standard components |
| DB Schema | `database/setup` | Table definitions and pilot data |
| AI Logic | `src/services/geminiService.ts` | Gemini API integration |
| Web Workers | `src/hooks/useHydrologyWorker.ts` | Heavy math offloading |

## CONVENTIONS
- **SNI First**: All calculations must reference SNI constants in `src/lib/constants/sni.ts`.
- **SSOT**: Data flows from Supabase -> Store -> Engines. No manual overrides without QC.
- **Worker-First**: Heavy math logic (HSS, Frequency Analysis) should not block the main thread.
- **GovTech UI**: High-density UI strictly required for all data tables (`tabular-nums`, strict zebra stripes).
- **Type Safety**: Strict TypeScript usage; avoid `any` at all costs.

## ANTI-PATTERNS
- **Hardcoded Parameters**: Never use magic numbers for rainfall coefficients; use `SNI` constants.
- **Direct State Mutation**: Always use store actions to update hydrology data.
- **Main-Thread Blocking**: Running heavy spatial/hydrology algorithms without Web Workers.
- **Mock Data in Production**: Ensure `fjMock.ts` or similar are only used in test/dev environments.

## COMMANDS
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run hydrology tests
npm run typecheck # Check TS strict mode
npm run lint     # Run ESLint
```

## NOTES
- Rational Method is limited to DAS ≤ 300 ha per SNI 2415:2016.
- HSS Nakayasu uses alpha = 2.0 as standard unless calibrated.
- Water Balance follows SNI 19-6728.1-2002 methodology.

**Generated:** 2026-03-03
**Commit:** dev
**Branch:** main

## OVERVIEW
Professional Water Resources Engineering Platform for hydrological analysis compliant with SNI. Core stack: React 18, TypeScript 5.9, Supabase, Tailwind CSS.

## STRUCTURE
```
rekasda-pro/
├── src/
│   ├── features/        # Feature modules (Flood, Master Data, Water Balance)
│   ├── components/ui/   # Shared GovTech UI components
│   ├── hooks/           # Custom React hooks & Web Workers
│   ├── lib/             # Core libraries (Engine, Utils, Constants)
│   ├── stores/          # State management (Zustand)
│   └── services/        # External integrations (Satellite, API)
├── database/            # SQL schemas and setup
└── supabase/            # Migrations and Edge Functions
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Hydrology Logic | `src/lib/engine` | SNI-compliant calculations |
| Rainfall Ingestion| `src/services/satelliteRainfallService.ts` | Satellite rainfall data |
| Global State | `src/stores/useHydrologyStore.ts` | Centralized hydrology state |
| UI Components | `src/components/ui` | GovTech standard components |
| DB Schema | `supabase/migrations` | Table: `master_data_hujan` |

## CONVENTIONS
- **SNI First**: All calculations must reference SNI constants in `src/lib/constants/sni.ts`.
- **SSOT**: Rainfall data flows from Supabase -> Store -> Engines. No manual overrides without QC.
- **Worker-First**: Heavy math logic should not block the main thread.

## ANTI-PATTERNS (THIS PROJECT)
- **Mock Data in Production**: `generateMockDataHujan` is strictly for development and has been removed from core logic.
- **Hardcoded Parameters**: Never use magic numbers for rainfall coefficients; use `SNI` constants.
- **Direct State Mutation**: Always use store actions to update hydrology data.
- **Main-Thread Blocking**: Running heavy spatial/hydrology algorithms without Web Workers.

## UNIQUE STYLES
- High-density GovTech UI strictly required for all data tables (`tabular-nums`, strict zebra stripes).

## COMMANDS
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run hydrology tests
npm run typecheck # Check TS strict mode
```

## NOTES
- SIHKA scraping feature has been removed. Rainfall data is ingested via Excel import, satellite fetch, or manual entry.
- Data Quality (QC) is automatically run on manual data updates in the store.
