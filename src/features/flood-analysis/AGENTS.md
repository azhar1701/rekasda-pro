# FLOOD ANALYSIS KNOWLEDGE BASE

## OVERVIEW
UI layer for performing SNI-compliant flood hydrograph simulations using Rational and Nakayasu methods.

## WHERE TO LOOK
| Component | Purpose | Engine Link |
|-----------|---------|-------------|
| `FloodAnalysisPanel.tsx` | Main entry point for simulations | `flood.ts` |
| `MethodSelector.tsx` | Switch between Rational & Nakayasu | - |
| `HydrographChart.tsx` | Visualizes discharge vs time | `engine/statistics` |
| `FloodParametersForm.tsx` | Input validation for A, C, L, Alpha | `zod` schemas |

## CONVENTIONS
- **Hydrograph Real-time**: Simulations should re-run on every valid parameter change (debounced).
- **Unit Clarity**: Always display units (km², mm, m³/s) next to input fields.
- **Comparison Mode**: Support side-by-side comparison of different methods/return periods.

## ANTI-PATTERNS
- **Implicit Defaults**: Never hide critical parameters like 'Alpha' or 'C'; make them explicit with tooltips.
- **UI Logic in Component**: Complex hydrograph transformations must live in `lib/engine` or specialized hooks.
