# Features Knowledge Base

## OVERVIEW
Core domain modules implementing specific hydrological analysis workflows.

## STRUCTURE
```
src/features/
├── ai-consultant/     # Gemini-powered analysis & OCR
├── channel-analysis/  # Manning's open channel hydraulics
├── flood-analysis/    # Rational & HSS Nakayasu flood calculations
├── water-balance/     # FJ Mock supply-demand analysis
├── history/           # Calculation persistence & versioning
└── dashboard/         # Executive summary & PWA reporting
```

## WHERE TO LOOK
- **Hydrology Logic**: Look for `engine.ts` or `calculations.ts` in each feature.
- **UI State**: Managed via `stores/` but features use local refs for PDF generation.
- **OCR Logic**: Found in `ai-consultant` services.

## CONVENTIONS
- **index.ts**: Each feature must export its main component and types via a barrel file.
- **Dirty State**: Use `isDirty` flags from stores to trigger `DependencyWarningBanner`.

## ANTI-PATTERNS
- **Cross-Feature Imports**: Avoid importing logic from one feature directly into another; use `src/lib` for shared logic.
- **Implicit Units**: Always comment the expected units (e.g., m³/s, ha, mm) in calculation functions.
