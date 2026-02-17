# RekaSDA Brand Identity System

## 🎨 Visual Identity

### Logo Design
**Component:** `src/components/ui/BrandLogo.tsx`

**Concept:** Geometric Water Droplet with Contour Lines
- Symbolizes: Engineering precision + Water resources + Data analysis
- Construction: Layered contour lines forming a droplet shape
- Center point: Represents data accuracy

**Usage:**
```tsx
import { BrandLogo } from '@/components/ui/BrandLogo';

// With text
<BrandLogo size="md" showText={true} />

// Icon only
<BrandLogo size="sm" showText={false} />

// Sizes: 'sm' | 'md' | 'lg'
```

### Favicon
**File:** `public/favicon.svg`
- Square 32x32 viewBox
- Thick strokes (2-2.5px) for browser tab visibility
- Same geometric droplet design
- Linked in `index.html`

---

## 🎨 Color Palette

### Semantic Colors (Tailwind Config)

#### Primary - Blue (#2563eb)
**Usage:** Main actions, brand identity, active states
```tsx
className="bg-primary text-white hover:bg-primary-700"
```

**Shades:**
- `primary-50` to `primary-900` (full blue scale)
- Main: `primary` = `#2563eb` (blue-600)

#### Secondary - Cyan (#06b6d4)
**Usage:** Water theme accents, secondary actions
```tsx
className="bg-secondary text-white"
```

#### Surface Colors
- `surface`: `#f8fafc` (slate-50) - Page backgrounds
- `surface-highlight`: `#ffffff` - Cards, elevated surfaces

### Legacy Colors (Compatibility)
- `safety-orange`: #ff5722
- `safety-blue`: #0062cc
- `field-green`: #2e7d32
- `alert-red`: #d32f2f

---

## 🎯 Icon System

### Standard: Lucide React
**Package:** `lucide-react@0.563.0`

**Rules:**
1. **Stroke Width:** `strokeWidth={2}` (consistent)
2. **Size:** `w-5 h-5` (standard), `w-6 h-6` (headers)
3. **Color Logic:**
   - Active: `text-primary` or `text-white` (on primary bg)
   - Inactive: `text-slate-400`
   - Hover: `hover:text-primary hover:bg-blue-50`

**Navigation Icons:**
```tsx
import { Waves, CloudRain, Scale, Database, Sparkles } from 'lucide-react';

<Waves className="w-5 h-5" strokeWidth={2} />
```

**Icon Mapping:**
- Saluran (Channel): `Waves`
- Banjir (Flood): `CloudRain`
- Neraca (Balance): `Scale`
- Data (History): `Database`
- AI Konsultan: `Sparkles`

---

## 🎨 Component Styling

### Button Component
**File:** `src/components/ui/forms/Button.tsx`

**Variants:**
```tsx
// Primary (Brand Blue)
<Button variant="primary">Save</Button>
// bg-primary hover:bg-primary-700

// Secondary (Cyan)
<Button variant="secondary">Action</Button>
// bg-secondary hover:bg-cyan-600

// Outline
<Button variant="outline">Cancel</Button>
// border-slate-200 hover:border-primary hover:bg-blue-50

// Ghost
<Button variant="ghost">Link</Button>
// transparent hover:bg-slate-50
```

### Navigation Bar
**Active State:**
```tsx
className="bg-primary text-white"
```

**Inactive State:**
```tsx
className="text-slate-400 hover:text-primary hover:bg-blue-50"
```

---

## 📐 Typography

### Brand Text
```tsx
<span className="font-bold text-slate-900">Reka</span>
<span className="font-normal text-slate-500">SDA</span>
```

### Font Stack
- **Sans:** Plus Jakarta Sans (primary)
- **Mono:** JetBrains Mono (code/data)

---

## ✅ Implementation Checklist

### Completed
- [x] BrandLogo component with geometric droplet
- [x] SVG favicon (32x32, thick strokes)
- [x] Semantic color palette in Tailwind config
- [x] Lucide React icons in navigation
- [x] Button component semantic colors
- [x] Primary action buttons use `bg-primary`
- [x] Hover states use `hover:bg-blue-50`
- [x] Active states use `text-primary`

### Color Migration
- [x] App.tsx navigation: `bg-slate-900` → `bg-primary`
- [x] WaterBalanceTab save button: `bg-blue-600` → `bg-primary`
- [x] FloodDischargeCalculator save: `bg-teal-600` → `bg-primary`
- [x] Button component variants updated

---

## 🎯 Design Principles

1. **Precision:** Clean geometric shapes, grid-based layouts
2. **Water:** Blue-cyan gradient, flowing contour lines
3. **Clarity:** High contrast, readable typography, consistent spacing

---

## 🚀 Usage Guidelines

### DO:
✅ Use `bg-primary` for main actions
✅ Use Lucide React icons with `strokeWidth={2}`
✅ Use `BrandLogo` component (don't recreate)
✅ Use semantic color names (`primary`, `secondary`, `surface`)
✅ Maintain 44px minimum touch targets

### DON'T:
❌ Hardcode `bg-blue-600` (use `bg-primary`)
❌ Mix inline SVG icons with Lucide
❌ Use inconsistent stroke widths
❌ Create custom logo variations
❌ Use colors outside the palette

---

## 📦 Files Modified

1. `src/components/ui/BrandLogo.tsx` - NEW
2. `public/favicon.svg` - NEW
3. `index.html` - Favicon link updated
4. `tailwind.config.js` - Semantic colors added
5. `src/components/ui/index.ts` - BrandLogo export
6. `src/components/ui/navigation/Header.tsx` - Uses BrandLogo
7. `src/App.tsx` - Lucide icons + semantic colors
8. `src/components/ui/forms/Button.tsx` - Semantic colors
9. `src/features/water-balance/components/WaterBalanceTab.tsx` - Primary color
10. `src/features/flood-analysis/components/FloodDischargeCalculator.tsx` - Primary color

---

## 🎨 Color Reference Card

```
Primary (Brand):    #2563eb  ███████  Blue-600
Secondary (Water):  #06b6d4  ███████  Cyan-500
Surface:            #f8fafc  ███████  Slate-50
Surface Highlight:  #ffffff  ███████  White
Text Primary:       #0f172a  ███████  Slate-900
Text Secondary:     #64748b  ███████  Slate-500
```

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Maintained by:** RekaSDA Development Team
