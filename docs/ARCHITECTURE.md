# Architecture Guide
## Rekasda Pro - Professional Engineering Dashboard

---

## 📐 System Architecture Overview

### Layered Architecture Pattern

```
┌─────────────────────────────────────────┐
│       PRESENTATION LAYER                │
│  (React Components, UI/UX)              │
├─────────────────────────────────────────┤
│       STATE MANAGEMENT LAYER             │
│  (Hooks, Context, Local State)          │
├─────────────────────────────────────────┤
│       BUSINESS LOGIC LAYER              │
│  (Calculations, Validations)            │
├─────────────────────────────────────────┤
│       DATA LAYER                        │
│  (Services, API, Database)              │
└─────────────────────────────────────────┘
```

### Key Design Principles

#### 1. **Separation of Concerns**
- **UI Components**: Focused only on presentation
- **Calculation Logic**: Pure functions in `/utils/calculations`
- **Form State**: Managed via hooks in `/hooks`
- **Data Persistence**: Handled by services in `/services`

#### 2. **Type Safety**
- All inputs/outputs fully typed with TypeScript
- JSDoc comments on critical functions
- Runtime validation with helpful error messages

#### 3. **Scalability**
- Feature-based folder structure
- Component composition patterns
- Modular utility functions
- Reusable hooks

---

## 🗂️ Detailed Folder Structure

### `/components/ui` - Atomic Components
**Purpose**: Base reusable UI building blocks  
**Pattern**: shadcn/ui style - simple, composable, unstyled-by-default

Files:
- `Input.tsx` - Text/number input field
- `Select.tsx` - Dropdown select
- `Button.tsx` - Action button
- `Card.tsx` - Container with shadow
- `FormField.tsx` - Label + input wrapper
- `Badge.tsx` - Status badge
- `Alert.tsx` - Alert/warning box
- `Tabs.tsx` - Tab navigation
- `Stepper.tsx` - Step progress
- `Tooltip.tsx` - Hover tooltip

### `/components/forms` - Form Sections
**Purpose**: Grouped input forms for specific domains  
**Pattern**: Compose UI components + form validation

Key files:
- `ChannelParameterForm.tsx` - Manning geometry inputs
- `CoefficientForm.tsx` - Manning roughness & other coefficients (TODO)
- `RainfallDataForm.tsx` - Rational method inputs (TODO)
- `SiteIdentityForm.tsx` - Project metadata

### `/components/results` - Results Display
**Purpose**: Present calculation outputs professionally  
**Pattern**: Card-based metrics, tabbed details, export options

Key files:
- `SummaryCard.tsx` - KPI metrics in grid layout
- `DetailedResults.tsx` - Detailed tabbed results
- `ResultsExport.tsx` - PDF/CSV export (TODO)

### `/components/charts` - Visualizations
**Purpose**: Data visualization using Recharts  
**Pattern**: Responsive, interaction-ready charts

Planned:
- `HydrographChart.tsx` - Time series flow data
- `CrossSectionChart.tsx` - Channel profile display
- `PerformanceChart.tsx` - KPI trends

### `/utils/calculations` - Pure Calculation Logic
**Purpose**: Business logic isolated from UI  
**Pattern**: Pure functions with JSDoc, no side effects

Files:
- `manning.ts` - Manning equation calculators
- `rational.ts` - Rational method calculators
- `helpers.ts` - Common helper functions
- `validators.ts` - Input validation rules

### `/utils/formatting` - Data Formatters
**Purpose**: Consistent number/date/unit formatting  
**Pattern**: Formatter objects for specific domains

Files:
- `numbers.ts` - Number formatting utilities
- `units.ts` - Unit conversion (TODO)
- `dates.ts` - Date formatting (TODO)

### `/hooks` - Custom React Hooks
**Purpose**: Stateful logic reuse  
**Pattern**: React Hooks conventions

Key files:
- `useHydraulicCalculations.ts` - Calculation + state
- `useFormState.ts` - Form validation + state (TODO)
- `useValidation.ts` - Reusable validators (TODO)
- `useLocalStorage.ts` - Persist form drafts (TODO)
- `useResponsive.ts` - Responsive breakpoints (TODO)

### `/services` - API & External Integration
**Purpose**: Database, API, external service integration  
**Pattern**: Service objects with public methods

Files:
- `calculationService.ts` - Wrapper around utils (re-export)
- `databaseService.ts` - Supabase operations
- `geminiService.ts` - Google Generative AI
- `locationService.ts` - Geolocation & mapping
- `csvParser.ts` - CSV import/export

---

## 📊 Data Flow Pattern

### Manning Calculation Flow

```
User Input (Form)
        ↓
useHydraulicCalculations Hook
        ↓
Validation (validators.ts)
        ↓
calculateManning (utils/calculations/manning.ts)
        ↓
Format Results (HydraulicFormatter)
        ↓
Display in SummaryCard & DetailedResults
        ↓
Store in Database (optional)
```

### Component tree example for Manning Calculation:

```
<ManningCalculator>
  ├─ <ChannelParameterForm /> (inputs)
  ├─ <SummaryCard /> (key results)
  └─ <DetailedResults /> (detailed output)
```

---

## 🎨 Design System Usage

### Colors
```tsx
// Primary actions
className="bg-primary-500 text-white"    // Blue

// Status indicators
className="bg-success-500"   // Green (safe)
className="bg-warning-500"   // Amber (caution)
className="bg-danger-500"    // Red (critical)

// Backgrounds
className="bg-slate-50"      // Light neutral
className="bg-slate-100"     // Medium neutral
className="bg-white"         // Pure white
```

### Typography
```tsx
// Headings
className="text-h2 font-bold"      // 30px, bold
className="text-h3 font-semibold"  // 24px, semibold
className="text-h4 font-semibold"  // 20px, semibold

// Body text
className="text-body font-normal"   // 16px, regular
className="text-body-sm"            // 14px, regular
className="text-body-xs"            // 12px, regular

// Labels
className="text-label font-medium"  // 14px, medium weight
```

### Spacing (8px base)
```tsx
className="p-2"    // 8px
className="p-4"    // 16px
className="p-6"    // 24px
className="p-8"    // 32px
className="gap-4"  // 16px gap
```

---

## 🔄 State Management Pattern

### Local Component State
```tsx
const [inputs, setInputs] = useState<ManningInputs>({...});
const [results, setResults] = useState<ManningResults | null>(null);
```

### Custom Hook State
```tsx
// In useHydraulicCalculations hook
const { results, errors, isCalculating } = useHydraulicCalculations(inputs);
```

### Form State with Validation
```tsx
// Hook handles state + validation
const { values, errors, handleChange, validate } = useFormState(initialValues);
```

---

## 📝 Input Validation Pattern

### Validation Structure
```tsx
// In validator files
export const validators = {
  manning: {
    roughness: (value: number) => {
      if (value <= 0) return 'Roughness must be positive';
      if (value > 0.15) return 'Roughness seems too high';
      return null; // Valid
    },
    // ... more validators
  }
};

// Usage in component
const error = validators.manning.roughness(inputs.roughness);
if (error) setErrors({ ...errors, roughness: error });
```

---

## 🚀 Performance Patterns

### Memoization
```tsx
// Memoize expensive calculations
const results = useMemo(() => calculateManning(inputs), [inputs]);

// Memoize callbacks
const handleChange = useCallback((field, value) => {
  setInputs(prev => ({ ...prev, [field]: value }));
}, []);
```

### Code Splitting
```tsx
// Lazy load chart components
const HydrographChart = lazy(() => import('./HydrographChart'));

// Usage with Suspense
<Suspense fallback={<Loading />}>
  <HydrographChart data={results} />
</Suspense>
```

---

## 🧪 Testing Patterns

### Calculation Unit Tests
```tsx
// In tests/manning.test.ts
import { calculateManning } from '@/utils/calculations/manning';

describe('Manning Calculations', () => {
  it('should calculate discharge correctly', () => {
    const results = calculateManning(testInputs);
    expect(results.Discharge).toBe('5.234');
  });
});
```

### Component Tests
```tsx
// In tests/ManningCalculator.test.tsx
import { render, screen, userEvent } from '@testing-library/react';
import { ManningCalculator } from '@/components/ManningCalculator';

describe('ManningCalculator', () => {
  it('should display results on valid input', async () => {
    render(<ManningCalculator />);
    // ... test user interactions
  });
});
```

---

## 📚 JSDoc Standard

All calculation functions must have complete JSDoc:

```tsx
/**
 * Calculate Manning velocity for open channel flow
 * 
 * Core Manning equation: V = (1/n) * R^(2/3) * S^(1/2)
 * Reference: Chow (1959) Open Channel Hydraulics
 * 
 * @param roughness - Manning coefficient (0.008 to 0.15)
 * @param hydraulicRadius - Hydraulic radius A/P (meters)
 * @param slope - Channel slope m/m (0.0001 to 0.1 typical)
 * @returns Velocity in m/s
 * @throws Error if parameters invalid
 * 
 * @example
 * const vel = calculateManningVelocity(0.025, 1.5, 0.001);
 * // vel ≈ 2.15 m/s
 */
export function calculateManningVelocity(
  roughness: number,
  hydraulicRadius: number,
  slope: number
): number { ... }
```

---

## 🔗 Component Used checklist

- ✅ FormField - Input label wrapper
- ✅ Input - Text/number field
- ✅ Select - Dropdown
- ✅ Badge - Status indicator
- ✅ Card - Container
- ✅ Alert - Warning/info messages
- ✅ SummaryCard - Results display
- ✅ DetailedResults - Detailed breakdown
- 🔄 Tabs - Tab navigation (exists, refine)
- ⏳ ChannelParameterForm - Grouped inputs (new)
- ⏳ Charts - Visualization (to build)

---

## 🎯 Next Implementation Steps

### Phase 3: Forms & Inputs
1. ✅ Create ChannelParameterForm with grouped inputs
2. ⏳ Create CoefficientForm for Manning coefficients
3. ⏳ Create RainfallDataForm for Rational inputs
4. ⏳ Add localStorage persistence for draft forms

### Phase 4: Visualization
1. ⏳ Install Recharts library
2. ⏳ Create HydrographChart component
3. ⏳ Create CrossSectionChart component
4. ⏳ Create PerformanceChart component

### Phase 5: Polish
1. ⏳ Add loading states with skeleton screens
2. ⏳ Implement error boundaries
3. ⏳ Add responsive design utilities
4. ⏳ Performance optimization & code splitting

---

**Last Updated**: 2026-02-09  
**Status**: In Implementation  
**Version**: 2.0.0-beta
