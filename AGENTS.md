# PROJECT KNOWLEDGE BASE

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
│   ├── lib/            # Core libraries (Engine, Utils, Constants)
│   ├── stores/         # State management (Zustand)
│   └── services/       # External integrations (Satellite)
├── database/           # SQL schemas and setup
└── supabase/           # Migrations and Edge Functions
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Hydrology Logic | `src/lib/engine` | SNI-compliant calculations |
| Rainfall Ingestion| `src/services/satelliteRainfallService.ts` | Satellite rainfall data |
| Global State | `src/stores/useHydrologyStore.ts` | Centralized hydrology state |
| DB Schema | `supabase/migrations` | Table: `master_data_hujan` |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `useHydrologyStore` | Store | `src/stores/useHydrologyStore.ts` | Orchestrates all hydrology data |
| `SNI_2415` | Constant | `src/lib/constants/sni.ts` | Standard parameters for flood analysis |

## CONVENTIONS
- **SNI First**: All calculations must reference SNI constants in `src/lib/constants/sni.ts`.
- **SSOT**: Rainfall data flows from Supabase -> Store -> Engines. No manual overrides without QC.

## ANTI-PATTERNS (THIS PROJECT)
- **Mock Data in Production**: `generateMockDataHujan` is strictly for development and has been removed from core logic.
- **Hardcoded Parameters**: Never use magic numbers for rainfall coefficients; use `SNI` constants.
- **Direct State Mutation**: Always use store actions to update hydrology data.

## COMMANDS
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run hydrology tests
```

## NOTES
- SIHKA scraping feature has been removed. Rainfall data is ingested via Excel import, satellite fetch, or manual entry.
- Data Quality (QC) is automatically run on manual data updates in the store.
