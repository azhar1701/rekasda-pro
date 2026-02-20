# Migration Guide: SNI 2415:2016 Compliant Engine

## Overview

This guide helps you migrate existing code to use the new SNI 2415:2016 compliant flood calculation engine.

## Step 1: Update Imports

### Before (Old)
```typescript
import { calculateRationalDischarge } from '@/lib/engine/flood';
```

### After (New)
```typescript
import { 
  validateSNI2415Workflow,
  calculateRationalDischarge,
  calculateHSSNakayasu 
} from '@/lib/engine/flood/sni2415';
```

## Step 2: Add Workflow Validation

### Before (Old - Non-compliant)
```typescript
// Direct calculation without validation
const result = calculateRationalDischarge({
  C: 0.7,
  I: 120,
  A: 25, // ❌ This would work but violates SNI!
});
```

### After (New - Compliant)
```typescript
// Validate workflow first
const workflow = validateSNI2415Workflow(25);

if (!workflow.isRationalValid) {
  // Show warning to user
  console.warn(workflow.warning);
  // Use HSS instead
  const result = calculateHSSNakayasu({ /* params */ });
} else {
  const result = calculateRationalDischarge({ C, I, A });
}
```

## Step 3: Handle Validation Errors

### Before (Old)
```typescript
// No error handling needed
const result = calculateRationalDischarge({ C, I, A });
```

### After (New)
```typescript
import { z } from 'zod';

try {
  const result = calculateRationalDischarge({ C, I, A });
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
    error.errors.forEach(err => {
      console.error(`${err.path}: ${err.message}`);
    });
  }
}
```

## Step 4: Update React Components

### Before (Old)
```tsx
const FloodForm = () => {
  const [area, setArea] = useState(25);
  
  const handleSubmit = () => {
    // No validation
    const result = calculateRationalDischarge({ C, I, A: area });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

### After (New)
```tsx
import { useSNI2415Workflow } from '@/hooks/useSNI2415Workflow';

const FloodForm = () => {
  const [area, setArea] = useState(25);
  const workflow = useSNI2415Workflow(area);
  
  const handleSubmit = () => {
    if (workflow.isRationalValid) {
      const result = calculateRationalDischarge({ C, I, A: area });
    } else {
      const result = calculateHSSNakayasu({ /* params */ });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {workflow.warning && (
        <Alert variant="warning">{workflow.warning}</Alert>
      )}
      {/* Form fields */}
    </form>
  );
};
```

## Step 5: Update Area Input Validation

### Before (Old)
```tsx
<input
  type="number"
  value={area}
  onChange={(e) => setArea(parseFloat(e.target.value))}
/>
```

### After (New)
```tsx
import { SNI_RATIONAL_AREA_LIMIT_KM2 } from '@/lib/engine/flood/sni2415';

<div>
  <input
    type="number"
    value={area}
    onChange={(e) => setArea(parseFloat(e.target.value))}
  />
  <p className="text-sm text-gray-500">
    Batas Metode Rasional: {SNI_RATIONAL_AREA_LIMIT_KM2} km² (300 ha)
  </p>
  {area > SNI_RATIONAL_AREA_LIMIT_KM2 && (
    <p className="text-sm text-amber-600">
      ⚠️ Area melebihi batas. Gunakan Metode HSS.
    </p>
  )}
</div>
```

## Step 6: Update Method Selection UI

### Before (Old)
```tsx
<select value={method} onChange={(e) => setMethod(e.target.value)}>
  <option value="rational">Metode Rasional</option>
  <option value="hss">Metode HSS</option>
</select>
```

### After (New)
```tsx
const workflow = useSNI2415Workflow(area);

<select 
  value={method} 
  onChange={(e) => setMethod(e.target.value)}
>
  <option 
    value="rational" 
    disabled={!workflow.isRationalValid}
  >
    Metode Rasional {!workflow.isRationalValid && '(Tidak Valid)'}
  </option>
  <option value="hss">
    Metode HSS {!workflow.isRationalValid && '(Wajib)'}
  </option>
</select>
```

## Common Migration Patterns

### Pattern 1: Conditional Method Selection

```typescript
const selectMethod = (area: number) => {
  const workflow = validateSNI2415Workflow(area);
  return workflow.recommendedMethod;
};

const method = selectMethod(25); // Returns 'hss'
```

### Pattern 2: Form Validation

```typescript
const validateForm = (data: FormData) => {
  const workflow = validateSNI2415Workflow(data.area);
  
  if (data.method === 'rational' && !workflow.isRationalValid) {
    return {
      valid: false,
      error: workflow.warning,
    };
  }
  
  return { valid: true };
};
```

### Pattern 3: Dynamic Form Fields

```tsx
const FloodForm = () => {
  const [area, setArea] = useState(2.5);
  const workflow = useSNI2415Workflow(area);
  
  return (
    <>
      <AreaInput value={area} onChange={setArea} />
      
      {workflow.isRationalValid ? (
        <RationalMethodFields />
      ) : (
        <HSSMethodFields />
      )}
    </>
  );
};
```

## Testing Migration

### Test Case 1: Small Catchment
```typescript
test('should allow Rational Method for small catchment', () => {
  const workflow = validateSNI2415Workflow(2.5);
  expect(workflow.isRationalValid).toBe(true);
  expect(workflow.recommendedMethod).toBe('rational');
});
```

### Test Case 2: Large Catchment
```typescript
test('should require HSS for large catchment', () => {
  const workflow = validateSNI2415Workflow(25);
  expect(workflow.isRationalValid).toBe(false);
  expect(workflow.recommendedMethod).toBe('hss');
  expect(workflow.warning).toBeDefined();
});
```

### Test Case 3: Boundary Condition
```typescript
test('should handle boundary condition correctly', () => {
  const workflow = validateSNI2415Workflow(3.0);
  expect(workflow.isRationalValid).toBe(true);
  
  const workflow2 = validateSNI2415Workflow(3.01);
  expect(workflow2.isRationalValid).toBe(false);
});
```

## Checklist

- [ ] Update all imports to use new engine
- [ ] Add workflow validation before calculations
- [ ] Add error handling for Zod validation
- [ ] Update React components with `useSNI2415Workflow` hook
- [ ] Add warning alerts for area > 300 ha
- [ ] Update area input with limit indicators
- [ ] Disable/hide invalid method options
- [ ] Add unit tests for new validation logic
- [ ] Update user documentation
- [ ] Test all edge cases (boundary conditions)

## Rollback Plan

If issues arise, you can temporarily use the old engine:

```typescript
// Fallback to old engine (not recommended)
import { calculateRationalDischarge } from '@/lib/engine/flood';
```

However, note that the old engine is **NOT SNI 2415:2016 compliant** and should only be used temporarily.

## Support

- 📖 Full Documentation: `docs/SNI_2415_AUDIT_REPORT.md`
- 🚀 Quick Reference: `docs/SNI_2415_QUICK_REFERENCE.md`
- 💡 Examples: `docs/examples/sni2415-usage.ts`
- 🐛 Issues: GitHub Issues

---

**Migration Status**: Ready for Production  
**Estimated Time**: 2-4 hours for full codebase migration
