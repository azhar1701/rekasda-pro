# 🚀 Professional Dashboard Upgrade - Complete Guide

**Target**: Enterprise-grade technical dashboard untuk engineer sumber daya air  
**Status**: In Progress  
**Last Updated**: 2026-02-09

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure (New)](#folder-structure-new)
3. [Design System Specifications](#design-system-specifications)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Code Snippets & Examples](#code-snippets--examples)

---

## 🏗️ Architecture Overview

### Core Principles
- **Separation of Concerns**: UI ↔ Business Logic ↔ Data Layer
- **Scalability**: Folder structure mendukung pertumbuhan modular
- **Type Safety**: Full TypeScript dengan dokumentasi JSDoc
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Lazy loading, code splitting, optimized renders

### Technology Stack
```
Frontend: React 18.3 + TypeScript 5.5
Build: Vite 7.3 + TailwindCSS 3.4
State: React Hooks (local state)
Database: Supabase
Maps: Leaflet
Charts: Recharts (to be added)
AI: Google Generative AI
```

---

## 📁 Folder Structure (New)

### Recommended Structure

```
rekasda-pro/
├── src/
│   ├── app/                      # Page-level components & layouts
│   │   ├── layout/
│   │   │   └── MainLayout.tsx
│   │   └── pages/
│   │
│   ├── components/               # Reusable UI Components
│   │   ├── ui/                   # Atomic UI components (shadcn/ui style)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── Input.tsx         # NEW: Standard text input
│   │   │   ├── Select.tsx        # NEW: Dropdown with Tailwind
│   │   │   ├── Tabs.tsx
│   │   │   ├── Stepper.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx         # NEW: Status badges
│   │   │   └── Tooltip.tsx
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── PageHeader.tsx    # NEW: Title + breadcrumb
│   │   │   ├── SidebarNav.tsx    # NEW: Navigation overlay
│   │   │   └── Footer.tsx        # NEW: Footer section
│   │   │
│   │   ├── charts/               # Data visualization
│   │   │   ├── HydrographChart.tsx  # NEW: Hydrograph display
│   │   │   ├── CrossSectionChart.tsx # NEW: Profil melintang
│   │   │   └── PerformanceChart.tsx  # NEW: KPI charts
│   │   │
│   │   ├── forms/                # Form sections & wrappers
│   │   │   ├── ChannelParameterForm.tsx    # NEW
│   │   │   ├── CoefficientForm.tsx         # NEW
│   │   │   ├── RainfallDataForm.tsx        # NEW
│   │   │   └── SiteIdentityForm.tsx        # Existing, refactored
│   │   │
│   │   ├── results/              # Results & output display
│   │   │   ├── SummaryCard.tsx   # NEW: Key metrics card
│   │   │   ├── DetailedResults.tsx # NEW: Tabbed result view
│   │   │   └── ResultsExport.tsx # NEW: Export functionality
│   │   │
│   │   └── [existing components]
│   │
│   ├── utils/                    # Utility functions
│   │   ├── calculations/         # NEW: Refactored calculation logic
│   │   │   ├── manning.ts        # Manning formula + JSDoc
│   │   │   ├── rational.ts       # Rational formula + JSDoc
│   │   │   ├── helpers.ts        # Common calculations
│   │   │   └── validators.ts     # Input validation rules
│   │   │
│   │   ├── formatting/           # NEW: Data formatting
│   │   │   ├── numbers.ts
│   │   │   ├── units.ts
│   │   │   └── dates.ts
│   │   │
│   │   ├── constants/            # NEW: Organized constants
│   │   │   ├── materials.ts      # Manning coefficients
│   │   │   ├── defaults.ts       # Default values
│   │   │   └── limits.ts         # Min/max boundaries
│   │   │
│   │   └── classNames.ts         # Tailwind utility helpers
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useHydraulicCalculations.ts  # Existing, improved
│   │   ├── useFormState.ts       # NEW: Form state management
│   │   ├── useValidation.ts      # NEW: Reusable validation logic
│   │   ├── useLocalStorage.ts    # NEW: Persist form drafts
│   │   └── useResponsive.ts      # NEW: Responsive breakpoints
│   │
│   ├── services/                 # API & external service integration
│   │   ├── calculationService.ts # Keep exports, move logic to utils
│   │   ├── databaseService.ts
│   │   ├── geminiService.ts
│   │   ├── locationService.ts
│   │   └── csvParser.ts
│   │
│   ├── types/                    # NEW: Centralized type definitions
│   │   ├── index.ts              # Main exports
│   │   ├── calculations.ts
│   │   ├── form.ts
│   │   └── api.ts
│   │
│   ├── config/                   # NEW: Configuration management
│   │   ├── theme.ts              # Design tokens
│   │   ├── breakpoints.ts        # Responsive design
│   │   └── constants.ts          # App constants
│   │
│   ├── store/                    # Global state (reusable context)
│   │   ├── CalculationContext.tsx
│   │   └── UIContext.tsx         # NEW: Theme, loading states
│   │
│   ├── styles/                   # Global styles
│   │   ├── globals.css           # Tailwind directives
│   │   └── animations.css        # Custom animations
│   │
│   ├── App.tsx                   # Main app component
│   ├── index.tsx                 # Entry point
│   └── index.css
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # NEW: System design
│   ├── CALCULATION_GUIDE.md      # NEW: Formula documentation
│   ├── COMPONENT_LIBRARY.md      # NEW: UI Component specs
│   └── CONTRIBUTION.md           # NEW: Contributing guidelines
│
└── [Config files: vite.config.ts, tailwind.config.js, tsconfig.json, etc.]
```

---

## 🎨 Design System Specifications

### Color Palette (Professional Engineering)

```typescript
// tailwind.config.js - Extended colors
const colors = {
  // Neutral: Slate/Zinc for professional look
  slate: {
    50: '#f8fafc',    // Lightest
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',   // Primary neutral
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',   // Darkest
  },
  
  // Primary: Blue/Indigo for technical context
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',    // Primary Blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c2d6b',    // Dark Blue
  },
  
  // Semantic Colors
  success: '#10b981',     // Green for success
  warning: '#f59e0b',     // Amber for warnings
  danger: '#ef4444',      // Red for errors/critical
  info: '#3b82f6',        // Blue for information
};

// Typography
const typography = {
  // Headings
  h1: 'text-4xl font-bold leading-tight tracking-tight',      // 36px
  h2: 'text-3xl font-bold leading-snug tracking-tight',        // 30px
  h3: 'text-2xl font-semibold leading-snug',                   // 24px
  h4: 'text-xl font-semibold leading-normal',                  // 20px
  
  // Body
  body: 'text-base leading-relaxed',                            // 16px
  body_sm: 'text-sm leading-relaxed',                           // 14px
  body_xs: 'text-xs leading-relaxed',                           // 12px
  
  // Labels
  label: 'text-sm font-medium text-slate-700',                 // Form labels
  legend: 'text-xs uppercase font-semibold tracking-wider',    // Form legends
};

// Spacing System (8px base)
const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px (base)
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
};
```

### Component Design Patterns

#### 1. **Input Fields** (shadcn/ui inspired)
- Subtle border: `border-slate-200`
- Focus state: `focus:ring-2 focus:ring-primary-500`
- Error state: `border-red-500 bg-red-50`
- Disabled: `bg-slate-50 text-slate-400`

#### 2. **Cards**
- White background with subtle shadow
- Light border: `border border-slate-200`
- Hover state for interactive cards

#### 3. **Buttons**
- **Primary**: Blue background, white text, rounded corners
- **Secondary**: Slate border, slate text, white background
- **Ghost**: Minimal styling, hover state only
- States: Normal, Hover, Active, Disabled, Loading

#### 4. **Tabs & Steppers**
- Underline indicator for active tab (primary color)
- Smooth transitions
- Accessible focus states

---

## 📊 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- ✅ Analyze current structure
- [ ] Create new folder structure
- [ ] Extract calculation logic to `/utils/calculations`
- [ ] Create comprehensive type definitions in `/types`
- [ ] Update Tailwind config with professional palette

### Phase 2: Component System (Week 2)
- [ ] Create base UI components library
- [ ] Implement form components (Input, Select, FormField)
- [ ] Create layout components (PageHeader, Footer)
- [ ] Build results display components (SummaryCard, DetailedResults)

### Phase 3: Forms & Inputs (Week 3)
- [ ] Refactor ManningCalculator with tabbed form structure
- [ ] Implement forms for parameter grouping:
  - Channel Parameters (width, depth, slope)
  - Coefficients (roughness, runoff coefficient)
  - Rainfall Data
- [ ] Add real-time validation with error messages
- [ ] Implement form state persistence (localStorage)

### Phase 4: Data Visualization (Week 4)
- [ ] Install and integrate Recharts
- [ ] Create Hydrograph visualization component
- [ ] Create Cross-section profile display
- [ ] Create performance/KPI charts

### Phase 5: Polish & Optimization (Week 5)
- [ ] Loading states for calculations
- [ ] Error boundaries & error handling
- [ ] Responsive design verification
- [ ] Performance optimization
- [ ] Accessibility audit

---

## 💻 Code Snippets & Examples

### 1. Refactored Calculation Logic (util/calculations/manning.ts)

```typescript
/**
 * Manning Formula Calculator
 * Menghitung debit saluran terbuka menggunakan rumus Manning
 * 
 * Reference: 
 * - Chow, V.T. (1959) Open Channel Hydraulics
 * - SNI 8066:2015 (Indonesian Standard)
 */

import { ManningInputs, ChannelShape } from '../../types';
import { formatNumber } from '../formatting/numbers';

/**
 * Core Manning Equation: V = (1/n) * R^(2/3) * S^(1/2)
 * 
 * @param n - Manning roughness coefficient (0.008-0.15 typical range)
 * @param R - Hydraulic radius (Area / Wetted Perimeter) in meters
 * @param S - Channel slope (dimensionless, typical 0.0001-0.1)
 * @returns Velocity in m/s
 */
export function calculateManningVelocity(n: number, R: number, S: number): number {
  if (n <= 0 || R <= 0 || S <= 0) return 0;
  return (1 / n) * Math.pow(R, 2/3) * Math.pow(S, 1/2);
}

/**
 * Calculate wetted perimeter for trapezoid channel
 * 
 * @param b - Bottom width (m)
 * @param h - Water depth (m)
 * @param z - Side slope (h:1 ratio, e.g., 0.5 for 0.5:1)
 * @returns Perimeter in m
 */
export function calculateTrapezoidPerimeter(b: number, h: number, z: number): number {
  return b + 2 * h * Math.sqrt(1 + z * z);
}

/**
 * Calculate cross-sectional area for trapezoid
 * Returns NaN if inputs invalid
 */
export function calculateTrapezoidArea(
  bottomWidth: number,
  waterDepth: number,
  sideSlope: number
): number {
  return bottomWidth > 0 && waterDepth > 0 
    ? (bottomWidth + sideSlope * waterDepth) * waterDepth 
    : NaN;
}

/**
 * Full Manning calculation with all hydraulic parameters
 * 
 * @param inputs - ManningInputs object containing channel properties
 * @returns Object with all calculated hydraulic parameters
 */
export function calculateManning(inputs: ManningInputs) {
  const { shape, roughness, slope, width, diameter, depth, sideSlope } = inputs;
  
  // Input validation
  if (roughness <= 0 || slope <= 0) {
    throw new Error('Roughness and slope must be positive');
  }

  let area = 0, perimeter = 0, topWidth = 0;

  // Geometry calculations based on shape
  if (shape === ChannelShape.CIRCULAR) {
    const results = calculateCircularGeometry(diameter, depth);
    area = results.area;
    perimeter = results.perimeter;
    topWidth = results.topWidth;
  } else {
    // TRAPEZOID
    area = calculateTrapezoidArea(width, depth, sideSlope);
    perimeter = calculateTrapezoidPerimeter(width, depth, sideSlope);
    topWidth = width + 2 * sideSlope * depth;
  }

  // Hydraulic calculations
  const radius = area > 0 ? area / perimeter : 0;
  const velocity = calculateManningVelocity(roughness, radius, slope);
  const discharge = area * velocity;
  
  // Froude number
  const hydraulicDepth = topWidth > 0 ? area / topWidth : 0;
  const froudeNumber = hydraulicDepth > 0 
    ? velocity / Math.sqrt(9.81 * hydraulicDepth) 
    : 0;

  // Determine flow regime
  let flowType = 'Unknown';
  if (froudeNumber < 0.9) flowType = 'Sub-kritis (Aliran Tenang)';
  else if (froudeNumber > 1.1) flowType = 'Super-kritis (Aliran Deras)';
  else flowType = 'Kritis';

  return {
    // Geometry
    area: formatNumber(area, 4),
    perimeter: formatNumber(perimeter, 4),
    hydraulicRadius: formatNumber(radius, 4),
    topWidth: formatNumber(topWidth, 3),
    
    // Hydraulics
    velocity: formatNumber(velocity, 3),
    discharge: formatNumber(discharge, 3),
    froudeNumber: formatNumber(froudeNumber, 3),
    flowType,
    
    // Additional parameters
    velocityHead: formatNumber(Math.pow(velocity, 2) / (2 * 9.81), 3),
    specificEnergy: formatNumber(depth + Math.pow(velocity, 2) / (2 * 9.81), 3),
    
    // Quality indicators
    reynoldsNumber: calculateReynoldsNumber(velocity, radius),
  };
}

/**
 * Calculate and classify flow regime based on Reynolds number
 */
function calculateReynoldsNumber(velocity: number, radius: number): string {
  const Re = (velocity * radius) / 1.004e-6; // kinematic viscosity at 20°C
  
  if (Re < 500) return 'Laminar (Re < 500)';
  if (Re < 2000) return 'Transisi (500 ≤ Re < 2000)';
  if (Re < 4000) return 'Laminar-Turbulen (2000 ≤ Re < 4000)';
  return `Turbulen (Re = ${formatNumber(Re, 0)})`;
}

/**
 * Calculate circular channel geometry
 */
function calculateCircularGeometry(diameter: number, depth: number) {
  const D = diameter;
  const h = Math.min(depth, D);
  
  // Central angle
  const theta = 2 * Math.acos(1 - (2 * h) / D);
  
  // Cross-sectional area
  const area = (Math.pow(D, 2) / 8) * (theta - Math.sin(theta));
  
  // Wetted perimeter
  const perimeter = (theta * D) / 2;
  
  // Top width
  const topWidth = D * Math.sin(theta / 2);

  return { area, perimeter, topWidth };
}
```

### 2. Professional Form Component Structure

```typescript
// components/forms/ChannelParameterForm.tsx
/**
 * Channel Parameter Input Form
 * Groups related hydraulic channel properties for better UX
 */

import React from 'react';
import { ManningInputs, ChannelShape } from '../../types';
import { FormField } from '../ui/FormField';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';

interface ChannelParameterFormProps {
  inputs: ManningInputs;
  errors: Record<string, string>;
  onChange: (field: keyof ManningInputs, value: any) => void;
}

export const ChannelParameterForm: React.FC<ChannelParameterFormProps> = ({
  inputs,
  errors,
  onChange,
}) => {
  const isTrapezoid = inputs.shape === ChannelShape.TRAPEZOID;

  return (
    <Card className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Parameter Saluran
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Tentukan geometri dan karakteristik fisik saluran
        </p>
      </div>

      {/* Shape Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { shape: ChannelShape.TRAPEZOID, label: 'Trapezoid', icon: '▁▔▁' },
          { shape: ChannelShape.CIRCULAR, label: 'Circular', icon: '◯' },
        ].map((option) => (
          <button
            key={option.shape}
            onClick={() => onChange('shape', option.shape)}
            className={`relative p-3 border-2 rounded-lg transition-all ${
              inputs.shape === option.shape
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-2xl mb-2">{option.icon}</div>
            <div className="text-sm font-medium text-slate-900">
              {option.label}
            </div>
          </button>
        ))}
      </div>

      {/* Trapezoid-specific inputs */}
      {isTrapezoid && (
        <div className="space-y-4">
          <FormField
            label="Lebar Dasar (m)"
            unit="m"
            required
            error={errors.width}
          >
            <input
              type="number"
              step="0.01"
              min="0"
              value={inputs.width}
              onChange={(e) => onChange('width', parseFloat(e.target.value) || 0)}
              className="form-input"
              placeholder="0.0"
            />
          </FormField>

          <FormField
            label="Kedalaman Air (m)"
            unit="m"
            required
            error={errors.depth}
            hint="Dari dasar hingga permukaan"
          >
            <input
              type="number"
              step="0.01"
              min="0"
              value={inputs.depth}
              onChange={(e) => onChange('depth', parseFloat(e.target.value) || 0)}
              className="form-input"
              placeholder="0.0"
            />
          </FormField>

          <FormField
            label="Kemiringan Tebing (z)"
            required
            hint="Rasio h:1 (0.5 = 0.5:1)"
            error={errors.sideSlope}
          >
            <input
              type="number"
              step="0.1"
              min="0"
              value={inputs.sideSlope}
              onChange={(e) => onChange('sideSlope', parseFloat(e.target.value) || 0)}
              className="form-input"
              placeholder="0.0"
            />
          </FormField>
        </div>
      )}

      {/* Circular-specific inputs */}
      {!isTrapezoid && (
        <FormField
          label="Diameter (m)"
          unit="m"
          required
          error={errors.diameter}
        >
          <input
            type="number"
            step="0.01"
            min="0"
            value={inputs.diameter}
            onChange={(e) => onChange('diameter', parseFloat(e.target.value) || 0)}
            className="form-input"
            placeholder="0.0"
          />
        </FormField>
      )}

      {/* Common parameters */}
      <div className="border-t border-slate-200 pt-4 space-y-4">
        <FormField
          label="Kemiringan Dasar (m/m)"
          unit="m/m"
          required
          error={errors.slope}
          hint="Typical: 0.0001 - 0.1"
        >
          <input
            type="number"
            step="0.0001"
            min="0"
            value={inputs.slope}
            onChange={(e) => onChange('slope', parseFloat(e.target.value) || 0)}
            className="form-input"
            placeholder="0.001"
          />
        </FormField>
      </div>

      {/* Warning if slope is unusual */}
      {inputs.slope > 0.1 && (
        <Alert type="warning">
          Kemiringan saluran sangat curam. Periksa kembali input.
        </Alert>
      )}
    </Card>
  );
};
```

### 3. Summary Card Component (Results Display)

```typescript
// components/results/SummaryCard.tsx
/**
 * Summary card displaying key calculation results
 * Professional KPI-style presentation
 */

import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'safe' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

interface SummaryCardProps {
  title: string;
  subtitle?: string;
  metrics: MetricItem[];
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  subtitle,
  metrics,
}) => {
  return (
    <Card className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              metric.status === 'safe'
                ? 'bg-green-50 border-green-200'
                : metric.status === 'warning'
                ? 'bg-amber-50 border-amber-200'
                : metric.status === 'critical'
                ? 'bg-red-50 border-red-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {metric.icon && <div className="mb-2 text-xl">{metric.icon}</div>}
            
            <p className="text-xs uppercase font-medium text-slate-600 tracking-wider">
              {metric.label}
            </p>
            
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {metric.value}
              {metric.unit && (
                <span className="text-sm font-normal text-slate-600 ml-1">
                  {metric.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};
```

---

## 📚 Next Steps

1. **Review Structure**: Verify folder structure matches your project needs
2. **Setup Foundation**: Create new directories and move files gradually
3. **Refactor Calculations**: Extract logic following Manning.ts pattern
4. **Component Library**: Build UI components in isolation (Storybook optional)
5. **Form Refactoring**: Implement tabbed forms with validation
6. **Integration**: Wire with existing services and state management
7. **Testing**: Manual QA across devices and scenarios
8. **Documentation**: Update README with new structure and usage

---

**Need clarification on any section? Review ARCHITECTURE.md in docs/ folder for deep dives.**
