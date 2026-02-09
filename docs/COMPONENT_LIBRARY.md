# 📚 Component Library Reference

Complete documentation for all new professional UI components and form elements.

---

## UI Base Components

### Input

**Path**: `components/ui/Input.tsx`

Professional text/number input with error states and icons.

```tsx
import { Input } from '../ui/Input';

// Basic usage
<Input 
  type="number"
  placeholder="Enter value"
  value={width}
  onChange={(e) => setWidth(parseFloat(e.target.value))}
/>

// With error state
<Input 
  type="number"
  value={width}
  error={errors.width || undefined}
  onChange={(e) => setWidth(parseFloat(e.target.value))}
/>

// With icon
<Input 
  type="number"
  icon={<svg>...</svg>}
  placeholder="0.0"
/>

// Size variations
<Input size="sm" />  // Small
<Input size="md" />  // Medium (default)
<Input size="lg" />  // Large

// Props
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;           // Error message
  icon?: React.ReactNode;   // Icon element
  size?: 'sm' | 'md' | 'lg'; // Size
  variant?: 'default' | 'subtle';
}
```

**States**:
- ✅ Valid: Blue border, focus ring
- ❌ Error: Red border, error message below
- ⏸️ Disabled: Gray background, no cursor

---

### Select

**Path**: `components/ui/Select.tsx`

Dropdown select with custom styling and error handling.

```tsx
import { Select } from '../ui/Select';

const options = [
  { value: 'trapezoid', label: 'Trapezoid Channel' },
  { value: 'circular', label: 'Circular Pipe' },
  { value: 'rectangular', label: 'Rectangular Channel' },
];

// Basic usage
<Select 
  options={options}
  value={shape}
  onChange={(e) => setShape(e.target.value)}
/>

// With placeholder & error
<Select 
  options={options}
  placeholder="Select channel type"
  value={shape}
  error={errors.shape}
  onChange={(e) => setShape(e.target.value)}
/>

// Disabled options
const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B', disabled: true },
];

// Size variations
<Select options={options} size="sm" />
<Select options={options} size="md" />
<Select options={options} size="lg" />

// Props
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  error?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

---

### FormField

**Path**: `components/ui/FormField.tsx`

Wrapper untuk input fields dengan label, hint, dan error.

```tsx
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';

// Basic usage
<FormField label="Channel Width" required>
  <Input type="number" value={width} onChange={...} />
</FormField>

// With all features
<FormField
  label="Water Depth"
  unit="m"
  required
  hint="Distance from bottom to water surface"
  error={errors.depth}
>
  <Input 
    type="number" 
    step="0.01"
    min="0"
    value={depth}
    onChange={...}
  />
</FormField>

// Props
interface FormFieldProps {
  label: string;           // Required field label
  error?: string;          // Error message
  required?: boolean;      // Show required asterisk
  hint?: string;          // Hint text below label
  unit?: string;          // Unit in parentheses
  helperText?: string;    // Helper text (if no error)
  children: ReactNode;    // Input element
  className?: string;     // Additional classes
}
```

**Features**:
- Label + Required indicator
- Optional unit display: "(m)", "(m/s)", "(m²)"
- Hint text untuk guidance
- Error message styling
- Automatic error icon

---

### Badge

**Path**: `components/ui/Badge.tsx`

Small component for status, tags, or labels.

```tsx
import { Badge } from '../ui/Badge';

// Status badges
<Badge variant="success">✓ Aman</Badge>
<Badge variant="warning">⚠ Waspada</Badge>
<Badge variant="danger">✕ Kritis</Badge>
<Badge variant="info">ℹ Informasi</Badge>
<Badge variant="primary">★ Penting</Badge>

// With icon
<Badge variant="success" icon={<CheckIcon />}>
  Flow Normal
</Badge>

// Size variations
<Badge size="sm">Small</Badge>    // Tiny
<Badge size="md">Medium</Badge>   // Normal

// Props
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
}
```

**Color Mapping**:
- `success` → Green (safe/ok)
- `warning` → Amber (caution/check)
- `danger` → Red (critical/error)
- `info` → Blue (information)
- `primary` → Primary blue (highlight)

---

### Card

**Path**: `components/ui/Card.tsx`

Container with shadow and consistent padding.

```tsx
import { Card } from '../ui/Card';

// Basic container
<Card>
  <h3>Section Title</h3>
  <p>Content here...</p>
</Card>

// With padding & spacing
<Card className="space-y-4 p-6">
  {/* Content */}
</Card>

// Props
interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated';
}
```

---

### Alert

**Path**: `components/ui/Alert.tsx`

Alert/warning/info box with icon.

```tsx
import { Alert } from '../ui/Alert';

// Info alert
<Alert type="info">
  ℹ️ This is informational
</Alert>

// Warning alert
<Alert type="warning">
  ⚠️ Check this value
</Alert>

// Error alert
<Alert type="error">
  ✕ Input is invalid
</Alert>

// Success alert
<Alert type="success">
  ✓ Operation successful
</Alert>

// Props
interface AlertProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'error' | 'success';
  closeable?: boolean;
  className?: string;
}
```

---

## Form Components

### ChannelParameterForm

**Path**: `components/forms/ChannelParameterForm.tsx`

Grouped form for Manning channel inputs.

```tsx
import { ChannelParameterForm } from '../forms/ChannelParameterForm';

// Usage
<ChannelParameterForm
  inputs={manningInputs}
  errors={formErrors}
  onChange={(field, value) => {
    setManningInputs(prev => ({ ...prev, [field]: value }));
  }}
/>

// Props
interface ChannelParameterFormProps {
  inputs: ManningInputs;
  errors: Record<string, string>;
  onChange: (field: keyof ManningInputs, value: any) => void;
  disabled?: boolean;
}
```

**Features**:
- Group 1: Channel Type (Trapezoid/Circular)
- Group 2: Geometric Parameters (width, depth, slope, diameter)
- Group 3: Hydraulic Properties (Manning coeff, slope)
- Inline validation errors
- Automatic top-width calculation
- Visual warnings for unusual values

---

## Result Display Components

### SummaryCard

**Path**: `components/results/SummaryCard.tsx`

KPI-style metrics display in grid layout.

```tsx
import { SummaryCard } from '../results/SummaryCard';

const metrics = [
  {
    label: 'Discharge',
    value: 5.234,
    unit: 'm³/s',
    highlight: true,
    status: 'safe',
    icon: '💧'
  },
  {
    label: 'Velocity',
    value: 2.15,
    unit: 'm/s',
    status: 'safe'
  },
  {
    label: 'Flow Type',
    value: 'Sub-kritis',
    status: 'safe'
  },
  {
    label: 'Freeboard',
    value: 0.45,
    unit: 'm',
    status: 'warning'
  }
];

<SummaryCard
  title="Manning Calculation Results"
  subtitle="Channel: Saluran Sekunder Soreang"
  metrics={metrics}
  layout="grid"  // or "compact"
/>

// Props
interface SummaryCardProps {
  title: string;
  subtitle?: string;
  metrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
    status?: 'safe' | 'warning' | 'critical' | 'neutral';
    icon?: ReactNode;
    highlight?: boolean;
  }>;
  className?: string;
  layout?: 'grid' | 'compact';
}
```

**Status Colors**:
- `safe` → Green background
- `warning` → Amber background
- `critical` → Red background
- `neutral` → Gray background

---

### DetailedResults

**Path**: `components/results/DetailedResults.tsx`

Tabbed detailed results with sections.

```tsx
import { DetailedResults } from '../results/DetailedResults';

const sections = [
  {
    title: 'Geometry',
    color: 'blue',
    icon: '📐',
    items: [
      {
        label: 'Cross-sectional Area',
        value: 4.234,
        unit: 'm²',
        description: 'Luas penampang basah'
      },
      {
        label: 'Wetted Perimeter',
        value: 6.123,
        unit: 'm',
        description: 'Keliling penampang basah'
      },
      {
        label: 'Top Width',
        value: 3.456,
        unit: 'm',
        highlight: true
      }
    ]
  },
  {
    title: 'Hydraulics',
    color: 'green',
    icon: '💧',
    items: [
      {
        label: 'Velocity',
        value: 2.154,
        unit: 'm/s',
        highlight: true
      },
      {
        label: 'Froude Number',
        value: 0.85,
        description: 'Flow regime indicator'
      }
    ]
  },
  {
    title: 'Safety',
    color: 'amber',
    icon: '⚠️',
    items: [
      {
        label: 'Freeboard',
        value: 0.45,
        unit: 'm'
      },
      {
        label: 'Status',
        value: 'Aman'
      }
    ]
  }
];

<DetailedResults
  title="Detailed Hydraulic Analysis"
  sections={sections}
  printable={true}
/>

// Props
interface DetailedResultsProps {
  title: string;
  sections: Array<{
    title: string;
    color?: 'blue' | 'green' | 'amber' | 'slate';
    icon?: string;
    items: Array<{
      label: string;
      value: string | number;
      unit?: string;
      description?: string;
      highlight?: boolean;
    }>;
  }>;
  className?: string;
  printable?: boolean;
}
```

**Color Options**:
- `blue` → Information
- `green` → Success/Valid
- `amber` → Warning/Caution
- `slate` → Neutral

---

## Utility Functions

### classNames

**Path**: `utils/classNames.ts`

Helper for conditionally joining Tailwind classes.

```tsx
import { classNames } from '../utils/classNames';

// Basic usage
const buttonClass = classNames(
  'px-4 py-2 rounded',
  isActive ? 'bg-primary-500 text-white' : 'bg-slate-100'
);

// Array syntax
const classes = classNames([
  'base-class',
  isDark && 'dark-mode',
  isLarge && 'text-lg'
]);

// Object syntax
const styles = classNames({
  'bg-primary': isPrimary,
  'bg-secondary': isSecondary,
  'text-white': isDark
});
```

---

### Number Formatters

**Path**: `utils/formatting/numbers.ts`

Format numbers with proper precision for engineering context.

```tsx
import { 
  formatNumber,
  HydraulicFormatter 
} from '../utils/formatting/numbers';

// Generic formatting
formatNumber(5.123456, 2)        // "5.12"
formatNumber(1000.5, 0)          // "1001"

// Hydraulic-specific formatting
HydraulicFormatter.area(4.23456)           // "4.2346"
HydraulicFormatter.velocity(2.15789)       // "2.158"
HydraulicFormatter.discharge(5.23456)      // "5.235"
HydraulicFormatter.slope(0.001234)         // "0.001234"
HydraulicFormatter.manning(0.02534)        // "0.0253"
HydraulicFormatter.dimensionless(0.85436)  // "0.854"

// Percentages
formatPercentage(0.85)     // "85%"
formatPercentage(0.8523, 1) // "85.2%"

// With separators
formatWithCommas(1234.567) // "1,234.57"
```

---

### Manning Calculations

**Path**: `utils/calculations/manning.ts`

Pure calculation functions with full JSDoc.

```tsx
import {
  calculateManning,
  calculateManningVelocity,
  calculateTrapezoidArea,
  calculateTrapezoidPerimeter
} from '../utils/calculations/manning';

// Full calculation
const results = calculateManning({
  shape: ChannelShape.TRAPEZOID,
  roughness: 0.025,
  slope: 0.001,
  width: 2.0,
  depth: 1.0,
  sideSlope: 0.5,
  // ... other fields
});

// Individual functions
const velocity = calculateManningVelocity(
  roughness: 0.025,
  radius: 1.2,
  slope: 0.001
);

const area = calculateTrapezoidArea(
  bottomWidth: 2.0,
  waterDepth: 1.0,
  sideSlope: 0.5
);

const perimeter = calculateTrapezoidPerimeter(
  bottomWidth: 2.0,
  waterDepth: 1.0,
  sideSlope: 0.5
);
```

**Return Type**:
```tsx
{
  Area: string;              // m²
  Perimeter: string;         // m
  Radius: string;            // m (hydraulic)
  TopWidth: string;          // m
  Velocity: string;          // m/s
  Discharge: string;         // m³/s
  Froude: string;            // dimensionless
  FlowType: string;          // Sub-kritis | Kritis | Super-kritis
  VelocityHead: string;      // m
  SpecificEnergy: string;    // m
  ReynoldsNumber: string;    // Classification
  ShearStress: string;       // N/m²
  StreamPower: string;       // W/m²
  Freeboard: string;         // m
  SafetyStatus: string;      // Aman | Waspada | MELUAP
}
```

---

### Rational Calculations

**Path**: `utils/calculations/rational.ts`

Rational method peak discharge calculations.

```tsx
import {
  calculateRational,
  calculateRationalDischarge,
  calculateTimeOfConcentration,
  calculateRainfallIntensity
} from '../utils/calculations/rational';

// Full calculation
const results = calculateRational({
  runoffCoefficient: 0.75,
  area: 0.5,              // km²
  rainfallDesign: 120,    // mm
  flowLength: 1000,       // m
  catchmentSlope: 0.01    // m/m
});

// Individual functions
const Qpeak = calculateRationalDischarge(
  0.75,      // C
  150,       // I (mm/hour)
  0.5        // A (km²)
);

const Tc = calculateTimeOfConcentration(
  1000,      // length (m)
  0.01       // slope (m/m)
);

const intensity = calculateRainfallIntensity(
  30,        // duration (min)
  120        // design 24h (mm)
);
```

---

## Usage Patterns

### Complete Form & Results Example

```tsx
import { useState } from 'react';
import { ManningInputs, ChannelShape } from '../types';
import { ChannelParameterForm } from '../components/forms/ChannelParameterForm';
import { SummaryCard } from '../components/results/SummaryCard';
import { DetailedResults } from '../components/results/DetailedResults';
import { calculateManning } from '../utils/calculations/manning';
import { Alert } from '../components/ui/Alert';

export function ManningCalculatorExample() {
  const [inputs, setInputs] = useState<ManningInputs>({
    shape: ChannelShape.TRAPEZOID,
    width: 2.0,
    depth: 1.0,
    sideSlope: 0.5,
    roughness: 0.025,
    slope: 0.001,
    topWidth: 2.5,
    diameter: 0,
    totalDepth: 1.5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState(null);

  const handleChange = (field: keyof ManningInputs, value: any) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);

    try {
      const calcResults = calculateManning(newInputs);
      setResults(calcResults);
      setErrors({});
    } catch (error) {
      setErrors({ _form: error.message });
      setResults(null);
    }
  };

  const metrics = results ? [
    {
      label: 'Discharge',
      value: results.Discharge,
      unit: 'm³/s',
      highlight: true,
      status: 'safe'
    },
    {
      label: 'Velocity',
      value: results.Velocity,
      unit: 'm/s',
      status: 'safe'
    },
    // ... more metrics
  ] : [];

  return (
    <div className="space-y-8">
      {errors._form && <Alert type="error">{errors._form}</Alert>}
      
      <ChannelParameterForm
        inputs={inputs}
        errors={errors}
        onChange={handleChange}
      />

      {results && (
        <>
          <SummaryCard
            title="Manning Results"
            metrics={metrics}
          />
          
          <DetailedResults
            title="Detailed Analysis"
            sections={[/* ... */]}
          />
        </>
      )}
    </div>
  );
}
```

---

**Last Updated**: 2026-02-09  
**Component Library Version**: 2.0.0-beta
