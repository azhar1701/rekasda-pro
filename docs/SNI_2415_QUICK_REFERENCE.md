# SNI 2415:2016 Compliance - Quick Reference

## 🚨 Critical Changes

### 1. Area Limit Enforcement (NEW)

**SNI Rule**: Rational Method ONLY valid for catchments ≤ 300 ha (3 km²)

```typescript
// ✅ VALID - Area within limit
calculateRationalDischarge({ C: 0.7, I: 120, A: 2.5 });
// Result: Q = 58.8 m³/s

// ❌ INVALID - Area exceeds limit (throws ZodError)
calculateRationalDischarge({ C: 0.7, I: 120, A: 25 });
// Error: "Luas DAS (A) melebihi 3 km² (300 ha). Gunakan Metode HSS sesuai SNI 2415:2016."
```

### 2. Workflow Validation Function (NEW)

```typescript
import { validateSNI2415Workflow } from '@/lib/engine/flood/sni2415';

const workflow = validateSNI2415Workflow(25); // 25 km²
console.log(workflow);
// {
//   recommendedMethod: 'hss',
//   isRationalValid: false,
//   warning: 'Luas DAS (25.00 km² / 2500 ha) melebihi batas...',
//   areaKm2: 25
// }
```

### 3. React Hook for UI (NEW)

```tsx
import { useSNI2415Workflow } from '@/hooks/useSNI2415Workflow';

const MyComponent = () => {
  const [area, setArea] = useState(2.5);
  const workflow = useSNI2415Workflow(area);

  return (
    <>
      {workflow.warning && <Alert variant="warning">{workflow.warning}</Alert>}
      
      {workflow.isRationalValid ? (
        <RationalMethodForm />
      ) : (
        <HSSMethodForm disabled={false} required />
      )}
    </>
  );
};
```

---

## 📐 Formula Reference

### Rational Method (A ≤ 3 km²)

```
Q = 0.278 × C × I × A

Q  = Peak discharge (m³/s)
C  = Runoff coefficient (0-1)
I  = Rainfall intensity (mm/hr)
A  = Catchment area (km²)
```

**Constraints**:
- C ∈ [0, 1]
- A ≤ 3 km² (300 ha) ← **ENFORCED**
- I ∈ [0.1, 500] mm/hr

### HSS Nakayasu (A > 3 km²)

```
Tg   = 0.4 + 0.058 × L
Tp   = Tg + 0.8 × Tr
T0.3 = α × Tg
Qp   = (A × Ro) / (3.6 × (0.3 × Tp + T0.3))
Tb   = Tp + 2.5 × T0.3

Hydrograph:
  Rising:    Qt = Qp × (t / Tp)^2.4        (0 < t ≤ Tp)
  Recession: Qt = Qp × 0.3^((t-Tp)/T0.3)   (t > Tp)
```

**Parameters**:
- Ro = Unit rainfall (mm) ∈ [1, 100]
- Tg = Time lag (hr) ∈ [0.1, 48]
- Tr = Effective duration (hr), must satisfy: 0.5×Tg ≤ Tr ≤ Tg
- α = Hydrograph parameter ∈ [1.5, 3.0], default = 2.0
- A = Catchment area (km²) ∈ [0.01, 10000]
- L = Main river length (km) ∈ [0.1, 1000]

---

## 🔄 Migration Guide

### Step 1: Update Imports

```typescript
// OLD (still works, but deprecated)
import { calculateRationalDischarge } from '@/lib/engine/flood';

// NEW (recommended)
import { 
  validateSNI2415Workflow,
  calculateRationalDischarge,
  calculateHSSNakayasu 
} from '@/lib/engine/flood/sni2415';
```

### Step 2: Add Workflow Validation

```typescript
// Before calculation, validate the workflow
const workflow = validateSNI2415Workflow(areaKm2);

if (!workflow.isRationalValid) {
  // Show warning to user
  alert(workflow.warning);
  // Redirect to HSS method
  return;
}

// Proceed with Rational Method
const result = calculateRationalDischarge({ C, I, A });
```

### Step 3: Handle Validation Errors

```typescript
import { z } from 'zod';

try {
  const result = calculateRationalDischarge({ C: 0.7, I: 120, A: 25 });
} catch (error) {
  if (error instanceof z.ZodError) {
    // Display validation errors to user
    error.errors.forEach(err => {
      console.error(`${err.path}: ${err.message}`);
    });
  }
}
```

---

## 📋 UI Implementation Checklist

- [ ] Add area input validation (show warning at 300 ha threshold)
- [ ] Implement `useSNI2415Workflow()` hook in form components
- [ ] Display SNI warning alert when area > 300 ha
- [ ] Disable/hide Rational Method option when area > 300 ha
- [ ] Update form labels with SNI terminology (Luas DAS, Koefisien Pengaliran, etc.)
- [ ] Add tooltips explaining SNI 2415:2016 requirements
- [ ] Show recommended method badge (e.g., "Metode Rasional (SNI Compliant)")

---

## 🧪 Test Cases

```typescript
// Test 1: Valid Rational Method
expect(validateSNI2415Workflow(2.5).isRationalValid).toBe(true);

// Test 2: Invalid Rational Method
expect(validateSNI2415Workflow(25).isRationalValid).toBe(false);

// Test 3: Boundary condition
expect(validateSNI2415Workflow(3.0).isRationalValid).toBe(true);
expect(validateSNI2415Workflow(3.01).isRationalValid).toBe(false);

// Test 4: Rational calculation within limit
const result = calculateRationalDischarge({ C: 0.7, I: 120, A: 2.5 });
expect(result.Q).toBeCloseTo(58.8, 1);

// Test 5: Rational calculation exceeds limit (should throw)
expect(() => {
  calculateRationalDischarge({ C: 0.7, I: 120, A: 25 });
}).toThrow(z.ZodError);

// Test 6: HSS Nakayasu calculation
const hssResult = calculateHSSNakayasu({
  Ro: 50,
  Tg: 2.0,
  Tr: 1.5,
  Alpha: 2.0,
  A: 25,
  L: 15
});
expect(hssResult.Qp).toBeGreaterThan(0);
expect(hssResult.hydrograph.length).toBeGreaterThan(0);
```

---

## 📞 Support

For questions about SNI 2415:2016 compliance:
- 📖 Read: `docs/SNI_2415_AUDIT_REPORT.md`
- 🐛 Report issues: GitHub Issues
- 💬 Discuss: GitHub Discussions

---

**Last Updated**: 2025  
**Compliance Status**: ✅ SNI 2415:2016 COMPLIANT
