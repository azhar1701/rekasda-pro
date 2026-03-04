# SERVICES KNOWLEDGE BASE

## OVERVIEW
API and business logic layer handling data ingestion, database operations, and complex hydrological engines.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Database Ops | `src/services/api.service.ts` | Primary Supabase interface with validation |
| Bulk Ingestion | `src/stores/useHydrologyStore.ts` | `importDataHujanBatch` for matrix upserts |
| Water Balance | `src/services/waterBalanceEngine.ts` | SNI 6738:2015 & UU 17/2019 logic |
| Satellite Data | `src/services/satelliteRainfallService.ts` | CHIRPS/GPM data simulation and fetching |
| QC Logic | `src/services/qualityControlService.ts` | Rainfall data validation and outlier detection |
| AI Integration | `src/services/geminiService.ts` | Google Gemini API wrapper for AI Consultant |
| Spatial Ops | `src/services/demDelineationService.ts` | Watershed delineation and DEM processing |

## CONVENTIONS
- **Validation First**: Use Zod schemas (e.g., `WaterBalanceInputsSchema`) to validate all engine inputs.
- **Error Handling**: Wrap Supabase calls in `handleResponse` within `ApiService` for consistent error shapes.
- **Unit Conversion**: Perform all SI conversions (e.g., L/s to m³/s) within the service layer, not the UI.
- **Deterministic Mocks**: Satellite mocks use coordinate-seeded randoms to ensure consistent data for the same location.

## ANTI-PATTERNS
- **Direct Supabase Calls**: Avoid using `supabase` client directly in components; use `apiService`.
- **UI-Bound Logic**: Never put SNI calculation formulas in React components.
- **Floating Point Neglect**: Always use `.toFixed()` or rounding utilities for final results to avoid precision artifacts in UI.
- **Legacy DB Service**: `databaseService.ts` is deprecated; use `apiService.ts` for new features.
