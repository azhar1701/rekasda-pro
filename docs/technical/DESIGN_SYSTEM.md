# Design System - Water Resources Engineering Tools

## 🎨 Color Palette

### Primary (Teal - Water Context)
- `primary-500`: #14b8a6 - Main brand color
- `primary-600`: #0d9488 - Hover states
- `primary-50`: #f0fdfa - Light backgrounds

### Secondary (Blue - Technical)
- `secondary-500`: #0ea5e9 - Secondary actions
- `secondary-600`: #0284c7 - Hover states

### Semantic Colors
- `success-500`: #22c55e - Success states
- `warning-500`: #f59e0b - Warning states
- `danger-500`: #ef4444 - Error states
- `info-500`: #3b82f6 - Info states

### Neutrals
- `slate-50` to `slate-900` - Text and backgrounds

## 📏 Spacing Scale (8px Grid)
- xs: 8px
- sm: 12px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

## 🔤 Typography
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px

## 🔘 Border Radius
- sm: 8px - Inputs
- md: 12px - Buttons
- lg: 16px - Cards
- xl: 24px - Modals

## 🌑 Shadows
- sm: Subtle hover
- md: Cards
- lg: Modals
- xl: Dropdowns

## 📦 Components

### Button
```tsx
<Button variant="primary" size="md" isLoading={false}>
  Save
</Button>
```

### Input
```tsx
<Input 
  label="Channel Width"
  type="number"
  error={errors.width}
  icon={<Icon />}
/>
```

### Card
```tsx
<Card padding="md" hover>
  Content
</Card>
```

### LoadingState
```tsx
<LoadingState message="Loading..." size="md" />
```

### EmptyState
```tsx
<EmptyState 
  title="No data"
  description="Start by creating new data"
  action={{ label: "Create", onClick: () => {} }}
/>
```

## 🔌 API Integration

### Using API Service
```tsx
import { apiService } from './services/api.service';

const response = await apiService.saveCalculation(data);
if (response.error) {
  toast.error(response.error.message);
} else {
  toast.success('Saved successfully');
}
```

### Using Toast
```tsx
import { toast } from './hooks/useToast';

toast.success('Operation successful');
toast.error('Operation failed');
toast.warning('Warning message');
toast.info('Info message');
```
