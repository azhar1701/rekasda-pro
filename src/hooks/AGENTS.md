# HOOKS KNOWLEDGE BASE

## OVERVIEW
Custom React hooks for SNI-compliant hydrology workflows, state management, and external service integration.

## WHERE TO LOOK
| Hook | Role | Notes |
|------|------|-------|
| `useSNI2415Workflow` | SNI 2415:2016 Validation | Recommends methods based on watershed area |
| `useHydrologyWorker` | Off-thread Calculations | Handles CPU-intensive convolution and ABM |
| `useDataQualityControl`| Rainfall QC | Validates consistency, outliers, and homogeneity |
| `useDatabase` | Supabase Persistence | Manages calculation history via TanStack Query |
| `useAuth` | Authentication | Supabase Auth state and session management |
| `useFrequencyAnalysis` | Statistical Analysis | Log Pearson III and Gumbel distributions |
| `useHydraulicCalculations`| Channel Analysis | Manning's equation and geometric analysis |

## CONVENTIONS
- **Worker-First for Math**: Any calculation involving large arrays (hyetographs, hydrographs) must use `useHydrologyWorker`.
- **Store Integration**: Hooks that modify global state (e.g., `useDataQualityControl`) must use `useHydrologyStore` actions.
- **Type Safety**: All hooks must export or re-export their Input/Result types for component-level type safety.
- **Error Handling**: Use `useToast` for user-facing errors and `setError` in the store for calculation-blocking errors.

## ANTI-PATTERNS
- **Main Thread Blocking**: Never perform heavy math (loops > 1000 iterations) directly in a hook; delegate to the worker.
- **Direct Supabase Calls**: Avoid calling `supabase` client directly in components; use `useDatabase` or `useAuth`.
- **Manual State Sync**: Don't manually sync local state with `useHydrologyStore`; use the store's reactive selectors.
- **Magic Numbers**: Never hardcode SNI thresholds (e.g., 300 ha for Rational method) inside hooks; use `src/lib/constants`.
