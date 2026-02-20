# Flood Analysis Architecture Refactor

## Overview
Fundamental refactor to separate two distinct hydrological concepts:
1. **Peak Discharge Analysis (Metode Empiris)** - Single Qp value
2. **Hydrograph Analysis (Metode HSS)** - Time-series curve

## Architecture Changes

### New Component Structure
```
FloodAnalysisTab (Main Wrapper)
├── PeakDischargeCalculator (Metode Empiris)
│   ├── Rasional Standar (A ≤ 3 km²)
│   ├── Haspers & Osugi (3-100 km²)
│   ├── der Weduwen (3-100 km²)
│   └── Melchior (A > 100 km²)
└── HydrographCalculator (Metode HSS)
    ├── HSS Nakayasu ✅
    ├── HSS Gamma I (planned)
    └── HSS Snyder (planned)
```

### UI/UX Improvements

#### Mode Selector
Two-tab interface at the top:
- **Debit Puncak (Metode Empiris)** - TrendingUp icon
- **Hidrograf Banjir (Metode HSS)** - Activity icon

#### Peak Discharge Calculator
- Method selector with area-based recommendations (CheckCircle2 badges)
- Conditional inputs (L, S only for Modified Rational methods)
- Large number card result (Qp in m³/s)
- Parameter summary table
- **NO LINE CHART** (conceptually different from hydrograph)

#### Hydrograph Calculator
- Method selector (Nakayasu, Gamma I, Snyder)
- HSS-specific inputs (Ro, Tg, Tr, Alpha, A, L)
- Summary cards (Qp, Tp)
- **RECHARTS LINE CHART** showing rising limb, peak, recession
- Full time-series visualization

## Technical Implementation

### Engine Functions Used

**Peak Discharge:**
- `calculateRationalDischarge()` from `@/lib/engine/rationalMethod`
- `calculateHaspersOsugi()` from `@/lib/engine/flood/modifiedRationalIndo`
- `calculateDerWeduwen()` from `@/lib/engine/flood/modifiedRationalIndo`
- `calculateMelchior()` from `@/lib/engine/flood/modifiedRationalIndo`

**Hydrograph:**
- `calculateHSSNakayasu()` from `@/lib/engine/flood`
- Returns: `{ Qp, Tp, Tb, hydrograph: Array<{time, discharge}> }`

### Type Safety
- `HSSNakayasuInput` from `@/types/hydrology`
- `HSSNakayasuOutput` from `@/types/hydrology`
- Custom `Inputs` interface for Peak Discharge

### State Management
- Separate state for each calculator
- Shared inputs preserved when switching tabs (area, L)
- Method-specific parameters reset on tab switch

## Files Modified

### New Files
- `src/features/flood-analysis/components/FloodAnalysisTab.tsx` - Main wrapper
- `src/features/flood-analysis/components/PeakDischargeCalculator.tsx` - Empirical methods
- `src/features/flood-analysis/components/HydrographCalculator.tsx` - HSS methods

### Modified Files
- `src/App.tsx` - Import FloodAnalysisTab instead of FloodDischargeCalculator
- `src/features/flood-analysis/index.ts` - Export new components

### Deprecated Files
- `src/features/flood-analysis/components/FloodDischargeCalculator.tsx` - Can be removed after testing

## SNI Compliance

### Peak Discharge Methods
- **Rasional Standar**: SNI 2415:2016 Pasal 5.2
- **Modified Rational**: Sosrodarsono "Hidrologi untuk Pengairan"
- Area constraints enforced with visual recommendations

### HSS Methods
- **Nakayasu**: SNI 2415:2016 Pasal 6.3
- **Gamma I**: Planned (SNI 2415:2016)
- **Snyder**: Planned (International standard)

## User Benefits

1. **Conceptual Clarity**: No confusion between Qp calculation vs. hydrograph generation
2. **Smart Recommendations**: CheckCircle2 badges guide method selection based on area
3. **Appropriate Visualization**: Chart only shown for time-series data (HSS)
4. **Professional UX**: Clean separation matches engineering workflow
5. **Minimal Code**: Reuses existing engine functions, no duplication

## Next Steps

1. ✅ Test new architecture in dev environment
2. ⏳ Implement HSS Gamma I method
3. ⏳ Implement HSS Snyder method
4. ⏳ Remove deprecated FloodDischargeCalculator.tsx
5. ⏳ Add unit tests for new components
6. ⏳ Update user documentation

## Migration Notes

**Breaking Changes**: None (backward compatible)
**API Changes**: None (internal refactor only)
**Data Migration**: Not required
