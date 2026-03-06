# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-05
**Commit:** latest
**Branch:** main

## OVERVIEW
Professional Water Resources Engineering Platform for hydrological analysis compliant with Indonesian National Standards (SNI). Core stack: React 18.3, TypeScript 5.9, Supabase, Tailwind CSS 3.4, and Google Gemini AI.

## STRUCTURE
```
rekasda-pro/
├── src/             # Feature modules & core logic
├── scripts/         # Automation & maintenance scripts (automation/)
├── docs/            # Technical and user documentation (visuals/)
├── supabase/        # Migrations and Edge Functions
├── database/        # SQL schemas
├── dist/            # Build output
└── ...
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Hydrology Logic | `src/lib/engine` | SNI-compliant calculations |
| SNI Constants | `src/lib/constants/sni.ts` | SSOT for coefficients and limits |
| Rainfall Management | `MasterHidrologiTab.tsx` | Main CRUD + Bulk Matrix Ingestion |
| UI Components | `src/components/ui` | GovTech standard components |
| Nginx Config | `nginx.conf` | Port 3000, SPA routing, security headers |
| Automation | `scripts/automation/` | Legacy fix & parse scripts |
| DB Schema | `supabase/migrations` | Table definitions and migrations |
| AI Logic | `src/services/geminiService.ts` | Gemini API integration |

## CONVENTIONS
- **Environment**: Never commit `.env`. Use `.env.example` as a template. Build args for prod.
- **SNI First**: All calculations must reference SNI constants in `src/lib/constants/sni.ts`.
- **SSOT**: Data flows from Supabase -> Store -> Engines.
- **Worker-First**: Heavy math logic should not block the main thread.
- **GovTech UI**: High-density UI strictly required for all data tables.
- **Type Safety**: Strict TypeScript usage; avoid `any`.

## ANTI-PATTERNS
- **Hardcoded Parameters**: Never use magic numbers for rainfall coefficients.
- **Direct State Mutation**: Always use store actions.
- **Committed Secrets**: Never commit `.env` or sensitive API keys.
- **Root Script Sprawl**: Keep project root clean; use `scripts/automation/` for utility scripts.
- **Main-Thread Blocking**: Running heavy algorithms without Web Workers.

## COMMANDS
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run test      # Run hydrology tests
```

## NOTES
- Rational Method is limited to DAS ≤ 300 ha per SNI 2415:2016.
- HSS Nakayasu uses alpha = 2.0 as standard unless calibrated.
- Water Balance follows SNI 19-6728.1-2002 methodology.

