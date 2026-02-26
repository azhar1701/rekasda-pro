# Quick Reference: Testing & Alignment System

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## 📦 New Imports

```typescript
// Store
import { useHydrologyStore } from '@/stores/useHydrologyStore';

// Services
import { calculateAllHSS } from '@/services/hssComparisonService';
import { performQualityControl } from '@/services/qualityControlService';
import { calculateEffectiveRainfallByC, calculateEffectiveRainfallByCN } from '@/services/effectiveRainfallService';

// Components
import { HSSComparisonChart } from '@/features/flood-analysis/components/HSSComparisonChart';
```

## 🔧 Common Patterns

### 1. Quality Control
```typescript
const { setQCResults } = useHydrologyStore();

// Perform QC on rainfall data
const annualMaxSeries = [45, 67, 89, 34, 56, 78, 90, 43];
const qcResults = performQualityControl(annualMaxSeries);

if (!qcResults.overallPassed) {
  alert('Data tidak lolos QC!');
  return;
}

setQCResults(qcResults);
```

### 2. Effective Rainfall
```typescript
const { setLandCoverParams, setEffectiveRainfall } = useHydrologyStore();

// Set land cover
setLandCoverParams({
  C: 0.65,
  method: 'C',
  description: 'Perumahan sedang',
});

// Calculate effective rainfall
const result = calculateEffectiveRainfallByC(100, 0.65);
setEffectiveRainfall(result);
// result.effectiveRainfall = 65 mm
```

### 3. HSS Comparison
```typescript
const { setHSSComparisonResults } = useHydrologyStore();

// Calculate all methods
const results = await calculateAllHSS({
  effectiveRainfall: 50,
  A: 125.5,
  L: 18.2,
});

setHSSComparisonResults(results);

// Render chart
<HSSComparisonChart results={results} />
```

## 📊 State Structure

```typescript
// Access state
const {
  qcResults,              // QC test results
  landCoverParams,        // Land cover parameters
  effectiveRainfall,      // Effective rainfall result
  hssComparisonResults,   // Multi-method HSS results
} = useHydrologyStore();
```

## ✅ Testing Checklist

Before deploying:
- [ ] All unit tests pass (`npm test`)
- [ ] Ground truth values updated
- [ ] QC tests pass for sample data
- [ ] HSS comparison produces valid results
- [ ] Mass conservation validated
- [ ] UI renders correctly

## 🐛 Common Issues

### Test fails with "Cannot find module"
```bash
# Check vitest.config.ts aliases match vite.config.ts
```

### HSS comparison returns empty array
```typescript
// Check that input parameters are valid
// A > 0, L > 0, effectiveRainfall > 0
```

### QC always fails
```typescript
// Check data quality - need at least 10 years
// Remove obvious errors first
```

## 📝 File Locations

```
src/
├── stores/
│   └── useHydrologyStore.ts          ← State management
├── services/
│   ├── hssComparisonService.ts       ← HSS comparison
│   ├── qualityControlService.ts      ← QC tests
│   └── effectiveRainfallService.ts   ← Effective rainfall
├── features/flood-analysis/components/
│   └── HSSComparisonChart.tsx        ← Comparison UI
└── lib/engine/flood/
    └── hydrologyMath.test.ts         ← Unit tests
```

## 🎯 Performance Tips

1. **Memoize HSS calculations** - expensive operations
2. **Debounce QC tests** - run only when data changes
3. **Lazy load chart** - only render when visible
4. **Cache comparison results** - avoid recalculation

## 📞 Support

Issues? Check:
1. `docs/technical/TESTING_ALIGNMENT_SYSTEM.md` - Full documentation
2. Test files for examples
3. Service files for API reference
