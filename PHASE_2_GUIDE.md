# Phase 2 Quick Start Guide
## Ground Truth Population

**Prerequisites**: Phase 1 Complete ✅

---

## 📋 What You Need

1. Your Ground Truth Excel file
2. Text editor (VS Code recommended)
3. 15-30 minutes

---

## 🎯 Step-by-Step Instructions

### Step 1: Open Your Excel File

Look for sheets named:
- "Parameter DAS" or "Input Parameters"
- "HSS Nakayasu" or "Output Results"

### Step 2: Extract Input Parameters

From Excel, find these values:

```
Luas DAS (A)        = _______ km²
Panjang Sungai (L)  = _______ km
Hujan Efektif (Ro)  = _______ mm
Time Lag (Tg)       = _______ jam
Time Unit (Tr)      = _______ jam
Alpha               = _______ (usually 2.0)
```

**Example from typical Indonesian watershed**:
```
A  = 125.5 km²
L  = 18.2 km
Ro = 50 mm
Tg = 3.5 jam
Tr = 1.75 jam
Alpha = 2.0
```

### Step 3: Extract Expected Outputs

From Excel HSS Nakayasu results:

```
Debit Puncak (Qp)  = _______ m³/s
Waktu Puncak (Tp)  = _______ jam
Waktu Dasar (Tb)   = _______ jam
```

**Example**:
```
Qp = 89.47 m³/s
Tp = 5.25 jam
Tb = 21.0 jam
```

### Step 4: Update Test File

Open: `src/lib/engine/flood/hydrologyMath.test.ts`

Find line ~20 (the first test):

**BEFORE** (placeholder values):
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

**AFTER** (your Excel values):
```typescript
it('should match Excel ground truth for standard watershed', () => {
  const input: HSSNakayasuInput = {
    Ro: YOUR_VALUE,
    Tg: YOUR_VALUE,
    Tr: YOUR_VALUE,
    Alpha: YOUR_VALUE,
    A: YOUR_VALUE,
    L: YOUR_VALUE,
  };

  const expectedQp = YOUR_VALUE;
  const expectedTp = YOUR_VALUE;
  const expectedTb = YOUR_VALUE;
```

### Step 5: Save and Test

```bash
npm test hydrologyMath.test.ts
```

**Expected Output**:
```
✓ should match Excel ground truth for standard watershed
✓ should handle small watershed correctly
✓ should handle large watershed correctly
✓ should throw error for invalid input
✓ should conserve mass (volume balance)
```

---

## ❓ Troubleshooting

### Test Still Fails After Update

**Problem**: `expected X to be close to Y`

**Solutions**:

1. **Check Units**
   - Excel in km² → Test needs km²
   - Excel in m³/s → Test needs m³/s
   - Excel in hours → Test needs hours

2. **Verify Excel Formulas**
   - Ensure Excel calculations are correct
   - Check if Excel uses different Alpha value
   - Verify Tg calculation: `Tg = 0.21 * L^0.7`

3. **Adjust Tolerance**
   If values are close but not exact:
   ```typescript
   // Change from 2 decimals to 1 decimal
   expect(result.Qp).toBeCloseTo(expectedQp, 1);
   ```

4. **Check Excel Method**
   - Ensure Excel uses same Nakayasu formula
   - Verify time step (dt) is consistent
   - Check if Excel applies any correction factors

### Mass Conservation Fails

**Problem**: `expected 0.91 to be greater than 0.95`

**Cause**: Usually related to incorrect input values or time step

**Solution**:
1. Verify Ro (effective rainfall) is correct
2. Check that A (area) matches
3. Ensure hydrograph time step is appropriate

---

## 📊 Validation Checklist

After updating values, verify:

- [ ] All input values match Excel exactly
- [ ] All expected outputs match Excel exactly
- [ ] Units are consistent (km², m³/s, hours)
- [ ] Test passes with tolerance of 2 decimal places
- [ ] Mass conservation test passes (ratio 0.95-1.05)

---

## 🎯 Success Criteria

You're done with Phase 2 when:

1. ✅ All 7 active tests pass
2. ✅ Ground truth test shows < 1% error
3. ✅ Mass conservation validated
4. ✅ No test failures

---

## 📞 Need Help?

### Common Excel Locations

**Input Parameters** usually in:
- Sheet: "Parameter DAS"
- Sheet: "Input"
- Sheet: "Data Morfometri"

**Output Results** usually in:
- Sheet: "HSS Nakayasu"
- Sheet: "Hidrograf"
- Sheet: "Hasil Perhitungan"

### Can't Find Values?

If Excel doesn't have these exact values:
1. Use pilot data from `src/data/floodPilotData.ts`
2. Or use standard Indonesian watershed values:
   - A = 125.5 km²
   - L = 18.2 km
   - Ro = 50 mm
   - Calculate Tg = 0.21 * 18.2^0.7 = 3.5 jam
   - Tr = 0.5 * Tg = 1.75 jam
   - Alpha = 2.0

Then run Excel with these inputs to get expected outputs.

---

## ⏭️ Next Phase

Once Phase 2 is complete:
- **Phase 3**: UI Integration
- **Phase 4**: Full Testing & Validation
- **Phase 5**: Documentation
- **Phase 6**: Deployment

**Estimated Time**: 15-30 minutes for Phase 2

---

**Ready?** Open your Excel file and let's populate those ground truth values! 🚀
