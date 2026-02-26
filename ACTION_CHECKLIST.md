# 📋 ACTION CHECKLIST
## Full-System Alignment & Unit Testing Implementation

**Status**: Foundation Complete ✅  
**Your Next Steps**: Follow this checklist

---

## 🚀 Phase 1: Setup & Validation (Day 1)

### Step 1: Install Dependencies
```bash
cd rekasda-pro
npm install
```

**Expected Output**: 
- ✅ vitest installed
- ✅ @vitest/ui installed
- ✅ @vitest/coverage-v8 installed

**Verify**:
```bash
npm test -- --version
```
Should show: `Vitest v2.1.8`

---

### Step 2: Verify File Structure

Check that these files exist:

**Core Files**:
- [ ] `vitest.config.ts`
- [ ] `src/stores/useHydrologyStore.ts` (modified)
- [ ] `src/services/hssComparisonService.ts` (new)
- [ ] `src/services/qualityControlService.ts` (new)
- [ ] `src/services/effectiveRainfallService.ts` (new)
- [ ] `src/features/flood-analysis/components/HSSComparisonChart.tsx` (new)
- [ ] `src/lib/engine/flood/hydrologyMath.test.ts` (new)

**Documentation**:
- [ ] `docs/technical/TESTING_ALIGNMENT_SYSTEM.md`
- [ ] `docs/technical/TESTING_QUICK_REF.md`
- [ ] `docs/technical/TESTING_SETUP.md`
- [ ] `IMPLEMENTATION_SUMMARY.md`

---

### Step 3: Run Initial Tests

```bash
npm test
```

**Expected**: Some tests will be marked as TODO, but basic structure should work.

**If errors occur**:
1. Check `vitest.config.ts` path aliases
2. Verify imports in test files
3. See `docs/technical/TESTING_SETUP.md` troubleshooting section

---

## 📊 Phase 2: Ground Truth Population (Day 2-3)

### Step 4: Extract Values from Excel

Open your Ground Truth Excel file and extract:

**Input Parameters** (Sheet: "Parameter DAS"):
- [ ] Luas DAS (A) = _______ km²
- [ ] Panjang Sungai (L) = _______ km
- [ ] Hujan Efektif (Ro) = _______ mm
- [ ] Time Lag (Tg) = _______ jam
- [ ] Time Unit (Tr) = _______ jam
- [ ] Alpha = _______ (biasanya 2.0)

**Expected Outputs** (Sheet: "HSS Nakayasu"):
- [ ] Debit Puncak (Qp) = _______ m³/s
- [ ] Waktu Puncak (Tp) = _______ jam
- [ ] Waktu Dasar (Tb) = _______ jam

---

### Step 5: Update Test File

Edit: `src/lib/engine/flood/hydrologyMath.test.ts`

Find this section:
```typescript
it('should match Excel ground truth for standard watershed', () => {
  const input: HSSNakayasuInput = {
    Ro: 50,        // ← UPDATE THIS
    Tg: 3.5,       // ← UPDATE THIS
    Tr: 1.75,      // ← UPDATE THIS
    Alpha: 2.0,    // ← UPDATE THIS
    A: 125.5,      // ← UPDATE THIS
    L: 18.2,       // ← UPDATE THIS
  };

  const expectedQp = 89.47;  // ← UPDATE THIS
  const expectedTp = 5.25;   // ← UPDATE THIS
  const expectedTb = 21.0;   // ← UPDATE THIS
```

Replace with your Excel values.

---

### Step 6: Run Ground Truth Test

```bash
npm test hydrologyMath.test.ts
```

**Expected**: Test should pass with your Excel values.

**If test fails**:
1. Double-check Excel values
2. Verify unit conversions (mm vs m, hours vs seconds)
3. Check Excel formulas are correct
4. Adjust tolerance if needed: `.toBeCloseTo(value, 1)` for 1 decimal place

---

## 🎨 Phase 3: UI Integration (Day 4-5)

### Step 7: Review Example Integration

Read: `src/features/flood-analysis/components/FloodAnalysisModuleEnhanced.example.tsx`

This shows how to integrate:
- Quality Control UI
- Effective Rainfall UI
- HSS Comparison Chart

---

### Step 8: Integrate QC Section

In your existing flood analysis component:

```tsx
import { performQualityControl } from '@/services/qualityControlService';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

const { qcResults, setQCResults } = useHydrologyStore();

const handleQC = () => {
  const annualMax = extractAnnualMaxSeries(dataHujan);
  const results = performQualityControl(annualMax);
  setQCResults(results);
};
```

**Test**:
- [ ] QC button appears
- [ ] Clicking runs QC tests
- [ ] Results display correctly
- [ ] Pass/fail status shows

---

### Step 9: Integrate Effective Rainfall

```tsx
import { calculateEffectiveRainfallByC } from '@/services/effectiveRainfallService';

const { effectiveRainfall, setEffectiveRainfall } = useHydrologyStore();

const handleEffectiveRainfall = () => {
  const result = calculateEffectiveRainfallByC(
    parseFloat(curahHujanRencana),
    0.65 // C coefficient
  );
  setEffectiveRainfall(result);
};
```

**Test**:
- [ ] Land use selector works
- [ ] Calculation button works
- [ ] Results display (total, effective, losses)
- [ ] Values are reasonable

---

### Step 10: Integrate HSS Comparison

```tsx
import { calculateAllHSS } from '@/services/hssComparisonService';
import { HSSComparisonChart } from '@/features/flood-analysis/components/HSSComparisonChart';

const { hssComparisonResults, setHSSComparisonResults } = useHydrologyStore();

const handleCompare = async () => {
  const results = await calculateAllHSS({
    effectiveRainfall: effectiveRainfall.effectiveRainfall,
    A: parseFloat(luasDas),
    L: parseFloat(panjangSungai),
  });
  setHSSComparisonResults(results);
};

// Render
{hssComparisonResults && (
  <HSSComparisonChart results={hssComparisonResults} />
)}
```

**Test**:
- [ ] Compare button works
- [ ] Chart renders with multiple lines
- [ ] Legend is interactive (click to toggle)
- [ ] Summary table shows Qp, Tp, Tb
- [ ] All methods have different colors

---

## 🧪 Phase 4: Testing & Validation (Day 6-7)

### Step 11: Run Full Test Suite

```bash
npm test
```

**Checklist**:
- [ ] All HSS Nakayasu tests pass
- [ ] HSS comparison tests pass
- [ ] No console errors
- [ ] Coverage > 70%

---

### Step 12: Run Coverage Report

```bash
npm run test:coverage
```

Open: `coverage/index.html`

**Target Coverage**:
- [ ] hssComparisonService.ts > 80%
- [ ] qualityControlService.ts > 80%
- [ ] effectiveRainfallService.ts > 80%

---

### Step 13: Manual UI Testing

Test the complete workflow:

1. **QC Test**:
   - [ ] Load sample data
   - [ ] Run QC
   - [ ] Verify pass/fail logic
   - [ ] Check outlier detection

2. **Effective Rainfall**:
   - [ ] Select different land uses
   - [ ] Verify C coefficients
   - [ ] Check calculations
   - [ ] Verify effective ≤ total

3. **HSS Comparison**:
   - [ ] Run comparison
   - [ ] Verify all methods execute
   - [ ] Check chart renders
   - [ ] Toggle legend items
   - [ ] Verify table values

---

## 📝 Phase 5: Documentation & Cleanup (Day 8)

### Step 14: Update Project Documentation

Update `README.md`:
- [ ] Add testing section
- [ ] Add QC workflow
- [ ] Add HSS comparison feature
- [ ] Update screenshots

---

### Step 15: Code Review Checklist

- [ ] No console.log statements
- [ ] No commented code
- [ ] Proper error handling
- [ ] TypeScript types correct
- [ ] No any types
- [ ] Imports organized

---

### Step 16: Performance Check

- [ ] HSS comparison < 2 seconds
- [ ] QC tests < 1 second
- [ ] Chart renders smoothly
- [ ] No memory leaks

---

## 🚢 Phase 6: Deployment Preparation (Day 9-10)

### Step 17: Build Test

```bash
npm run build
```

**Verify**:
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Bundle size reasonable
- [ ] No warnings

---

### Step 18: Preview Production Build

```bash
npm run preview
```

**Test in preview**:
- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive

---

### Step 19: Create Release Notes

Document:
- [ ] New features added
- [ ] Breaking changes (if any)
- [ ] Migration guide
- [ ] Known issues

---

## ✅ Final Checklist

Before marking complete:

**Code Quality**:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] No TypeScript errors
- [ ] No ESLint warnings

**Functionality**:
- [ ] QC workflow works end-to-end
- [ ] Effective rainfall calculates correctly
- [ ] HSS comparison shows all methods
- [ ] Chart is interactive
- [ ] State management works

**Documentation**:
- [ ] README updated
- [ ] API docs complete
- [ ] Examples provided
- [ ] Troubleshooting guide available

**Performance**:
- [ ] Load time < 3s
- [ ] Calculations < 2s
- [ ] No UI freezing
- [ ] Memory usage acceptable

**User Experience**:
- [ ] Intuitive workflow
- [ ] Clear error messages
- [ ] Loading states shown
- [ ] Results easy to interpret

---

## 🎯 Success Criteria

You're done when:

1. ✅ `npm test` shows all tests passing
2. ✅ Ground truth validation matches Excel within 1%
3. ✅ UI shows QC, Effective Rainfall, and HSS Comparison
4. ✅ Chart displays multiple HSS methods correctly
5. ✅ Documentation is complete and clear
6. ✅ Production build works without errors

---

## 📞 Need Help?

**Documentation**:
- Full guide: `docs/technical/TESTING_ALIGNMENT_SYSTEM.md`
- Quick ref: `docs/technical/TESTING_QUICK_REF.md`
- Setup: `docs/technical/TESTING_SETUP.md`

**Common Issues**:
- Tests failing → Check ground truth values
- Import errors → Check path aliases in vitest.config.ts
- Chart not rendering → Verify Recharts is installed
- State not updating → Check Zustand store setters

**Example Code**:
- See: `src/features/flood-analysis/components/FloodAnalysisModuleEnhanced.example.tsx`

---

## 🎉 Completion

When all checkboxes are ✅:

1. Commit your changes
2. Push to repository
3. Create pull request
4. Deploy to production

**Congratulations!** 🎊

You've successfully implemented a production-grade testing and alignment system for RekaSDA Pro.

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0  
**Status**: Ready for Implementation
