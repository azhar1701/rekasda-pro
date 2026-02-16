# Production-Grade Refactoring Guide
## Rekasda Hydrology Application

---

## 📋 Table of Contents
1. [New Folder Structure](#new-folder-structure)
2. [File Anatomy Rules](#file-anatomy-rules)
3. [TypeScript Standards](#typescript-standards)
4. [Migration Checklist](#migration-checklist)
5. [Code Examples](#code-examples)

---

## 🗂️ New Folder Structure

### Feature-Based Architecture (Domain-Driven)

```
src/
├── features/                      # Feature modules (domain-driven)
│   ├── channel-analysis/          # Manning Calculator domain
│   │   ├── components/
│   │   │   ├── ChannelParameterForm.tsx
│   │   │   ├── ChannelVisualizer.tsx
│   │   │   ├── ChannelCapacity.tsx
│   │   │   └── ManningCalculator.tsx
│   │   ├── hooks/
│   │   │   └── useHydraulicCalculations.ts
│   │   ├── types/
│   │   │   └── channel.types.ts
│   │   ├── utils/
│   │   │   └── manning.ts
│   │   └── index.ts               # Barrel export
│   │
│   ├── flood-analysis/            # Flood discharge domain
│   │   ├── components/
│   │   │   ├── FloodDischargeCalculator.tsx
│   │   │   ├── HydrographChart.tsx
│   │   │   ├── RationalCalculator.tsx
│   │   │   └── FloodInsights.tsx
│   │   ├── types/
│   │   │   └── flood.types.ts
│   │   ├── utils/
│   │   │   ├── nakayasu.ts
│   │   │   └── rational.ts
│   │   └── index.ts
│   │
│   ├── water-balance/             # Water balance domain
│   │   ├── components/
│   │   │   ├── WaterBalanceTab.tsx
│   │   │   ├── WaterBalanceChart.tsx
│   │   │   └── WaterBalanceAnalysis.tsx
│   │   ├── services/
│   │   │   └── waterBalanceEngine.ts
│   │   ├── types/
│   │   │   └── waterBalance.types.ts
│   │   └── index.ts
│   │
│   ├── history/                   # Data history domain
│   │   ├── components/
│   │   │   ├── AllDataTab.tsx
│   │   │   ├── AllDataDetailModal.tsx
│   │   │   └── HistoryMap.tsx
│   │   ├── types/
│   │   │   └── history.types.ts
│   │   └── index.ts
│   │
│   └── ai-consultant/             # AI consultant domain
│       ├── components/
│       │   └── GeminiConsultant.tsx
│       ├── services/
│       │   └── geminiService.ts
│       ├── types/
│       │   └── ai.types.ts
│       └── index.ts
│
├── components/                    # Shared UI components (Design System)
│   ├── ui/                        # Atomic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Accordion.tsx
│   │   ├── Badge.tsx
│   │   ├── Alert.tsx
│   │   └── index.ts               # Barrel export
│   ├── forms/                     # Form components
│   │   ├── FormField.tsx
│   │   ├── Select.tsx
│   │   └── index.ts
│   ├── layout/                    # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Layout.tsx
│   │   └── index.ts
│   ├── feedback/                  # User feedback components
│   │   ├── LoadingState.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   └── index.ts                   # Master barrel export
│
├── hooks/                         # Shared custom hooks
│   ├── useToast.ts
│   ├── useDatabase.ts
│   ├── useLocalStorage.ts
│   └── index.ts
│
├── lib/                           # Core utilities & configs
│   ├── api/
│   │   ├── supabase.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── app.constants.ts
│   │   ├── chart.constants.ts
│   │   └── index.ts
│   └── utils/
│       ├── classNames.ts
│       ├── formatting.ts
│       └── index.ts
│
├── services/                      # Global services (cross-domain)
│   ├── databaseService.ts
│   ├── locationService.ts
│   ├── csvParser.ts
│   └── index.ts
│
├── types/                         # Global shared types
│   ├── api.types.ts
│   ├── database.types.ts
│   ├── common.types.ts
│   └── index.ts
│
├── App.tsx                        # Root component
├── main.tsx                       # Entry point
└── vite-env.d.ts
```

---

## 📝 File Anatomy Rules

### The "Pro" File Structure (Strict Order)

Every `.tsx` file MUST follow this anatomy:

```typescript
// ============================================================================
// 1. IMPORTS (Grouped & Ordered)
// ============================================================================
// React imports first
import { useState, useEffect, useMemo } from 'react';

// External library imports
import { AreaChart, Area } from 'recharts';

// Internal component imports
import { Button } from '@/components/ui';
import { formatNumber } from '@/lib/utils/formatting';

// Type imports (last)
import type { HydrographData } from './types';

// ============================================================================
// 2. TYPES/INTERFACES (Props first, then internal)
// ============================================================================
interface ComponentNameProps {
  data: HydrographData[];
  onSave: (data: unknown) => void;
  className?: string;
}

interface InternalState {
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// 3. CONSTANTS (Component-scoped)
// ============================================================================
const DEFAULT_HEIGHT = 400;
const ANIMATION_DURATION = 800;

// ============================================================================
// 4. HELPER COMPONENTS (Internal, not exported)
// ============================================================================
const LoadingSpinner = (): JSX.Element => (
  <div className="animate-spin">Loading...</div>
);

// ============================================================================
// 5. UTILITY FUNCTIONS (Pure functions with explicit return types)
// ============================================================================
const calculateMetrics = (data: HydrographData[]): number => {
  return data.reduce((sum, item) => sum + item.value, 0);
};

// ============================================================================
// 6. MAIN COMPONENT (Named export)
// ============================================================================
export const ComponentName = ({
  data,
  onSave,
  className = '',
}: ComponentNameProps): JSX.Element => {
  // --- LOGIC LAYER ---
  // 6.1 State declarations
  const [state, setState] = useState<InternalState>({
    isLoading: false,
    error: null,
  });

  // 6.2 Hooks
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  // 6.3 Handlers
  const handleSave = (): void => {
    onSave(data);
  };

  // 6.4 Effects
  useEffect(() => {
    // Side effects here
  }, []);

  // --- RENDER LAYER ---
  return (
    <div className={className}>
      {state.isLoading ? <LoadingSpinner /> : <div>{metrics}</div>}
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
```

---

## 🔒 TypeScript Standards

### 1. NO `any` - Zero Tolerance

❌ **WRONG:**
```typescript
const handleData = (data: any) => {
  return data.value;
};
```

✅ **CORRECT:**
```typescript
const handleData = (data: unknown): number => {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: number }).value;
  }
  throw new Error('Invalid data structure');
};
```

### 2. Explicit Return Types

❌ **WRONG:**
```typescript
const calculateArea = (width: number, height: number) => {
  return width * height;
};
```

✅ **CORRECT:**
```typescript
const calculateArea = (width: number, height: number): number => {
  return width * height;
};
```

### 3. Props: Use `interface`, Not `type`

❌ **WRONG:**
```typescript
type ButtonProps = {
  label: string;
  onClick: () => void;
};
```

✅ **CORRECT:**
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}
```

### 4. Barrel Exports (index.ts)

**File: `components/ui/index.ts`**
```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Modal } from './Modal';

export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
```

**Usage:**
```typescript
// ❌ WRONG
import { Button } from '@/components/ui/Button/Button';

// ✅ CORRECT
import { Button } from '@/components/ui';
```

### 5. Strict Type Guards

```typescript
interface HydrographData {
  time: number;
  discharge: number;
}

const isHydrographData = (data: unknown): data is HydrographData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'time' in data &&
    'discharge' in data &&
    typeof (data as HydrographData).time === 'number' &&
    typeof (data as HydrographData).discharge === 'number'
  );
};
```

---

## ✅ Migration Checklist

### Phase 1: Setup New Structure
- [ ] Create `features/` directory
- [ ] Create feature subdirectories (channel-analysis, flood-analysis, etc.)
- [ ] Create `components/ui/` for shared components
- [ ] Create `lib/constants/` and move constants
- [ ] Create barrel exports (`index.ts`) in each folder

### Phase 2: Type Safety
- [ ] Create `types/` folder in each feature
- [ ] Split `types.ts` into domain-specific files
- [ ] Add explicit return types to all functions
- [ ] Replace all `any` with proper types
- [ ] Convert `type` to `interface` for Props

### Phase 3: Component Migration
- [ ] Move `ManningCalculator.tsx` → `features/channel-analysis/`
- [ ] Move `FloodDischargeCalculator.tsx` → `features/flood-analysis/`
- [ ] Move `WaterBalanceTab.tsx` → `features/water-balance/`
- [ ] Move `GeminiConsultant.tsx` → `features/ai-consultant/`
- [ ] Move `AllDataTab.tsx` → `features/history/`

### Phase 4: Refactor Components
- [ ] Apply file anatomy rules to each component
- [ ] Extract inline logic to helper functions
- [ ] Separate logic layer from render layer
- [ ] Add proper TypeScript types

### Phase 5: Update Imports
- [ ] Update all imports to use barrel exports
- [ ] Use path aliases (`@/features`, `@/components`)
- [ ] Remove relative path imports (`../../`)

### Phase 6: Testing
- [ ] Test each feature independently
- [ ] Verify no TypeScript errors
- [ ] Check build output

---

## 💡 Code Examples

### Example 1: Feature Module Structure

**File: `features/flood-analysis/index.ts`**
```typescript
// Public API for flood-analysis feature
export { FloodDischargeCalculator } from './components/FloodDischargeCalculator';
export { HydrographChart } from './components/HydrographChart';
export { RationalCalculator } from './components/RationalCalculator';

export type { FloodAnalysisData, HydrographDataPoint } from './types/flood.types';
```

### Example 2: Type-Safe Hook

**File: `features/channel-analysis/hooks/useHydraulicCalculations.ts`**
```typescript
import { useState, useCallback } from 'react';
import type { ManningInputs, ManningOutputs } from '../types/channel.types';

interface UseHydraulicCalculationsReturn {
  calculate: (inputs: ManningInputs) => ManningOutputs;
  isCalculating: boolean;
  error: string | null;
}

export const useHydraulicCalculations = (): UseHydraulicCalculationsReturn => {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback((inputs: ManningInputs): ManningOutputs => {
    setIsCalculating(true);
    setError(null);

    try {
      // Calculation logic
      const velocity = (1 / inputs.roughness) * Math.pow(inputs.depth, 2/3) * Math.sqrt(inputs.slope);
      
      return {
        velocity,
        discharge: velocity * inputs.width * inputs.depth,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return { calculate, isCalculating, error };
};
```

### Example 3: Shared UI Component

**File: `components/ui/Button.tsx`**
```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/classNames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps): JSX.Element => {
  const baseStyles = 'rounded-lg font-semibold transition-all';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

---

## 🎯 Key Principles

1. **Feature Isolation**: Each feature is self-contained with its own components, types, and logic
2. **Type Safety**: Zero `any`, explicit return types, strict null checks
3. **Clean Imports**: Use barrel exports and path aliases
4. **Separation of Concerns**: Logic layer separate from render layer
5. **Reusability**: Shared components in `components/`, shared hooks in `hooks/`
6. **Scalability**: Easy to add new features without touching existing code

---

## 📚 Next Steps

1. Review the golden sample: `GOLDEN_SAMPLE.tsx`
2. Start with one feature (e.g., `flood-analysis`)
3. Apply the refactoring rules incrementally
4. Update imports across the app
5. Run TypeScript compiler to catch errors
6. Test thoroughly before moving to next feature

---

**Remember**: Production-grade code is not about being clever—it's about being clear, maintainable, and type-safe.
