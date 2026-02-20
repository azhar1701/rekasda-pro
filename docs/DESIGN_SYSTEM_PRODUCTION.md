# 🎨 Production-Grade Design System

## Design Tokens - Foundation

### Spacing System (8px Grid)

```css
--space-1: 4px   /* Micro spacing - icon gaps */
--space-2: 8px   /* Tight spacing - inline elements */
--space-3: 12px  /* Small spacing - label to input */
--space-4: 16px  /* Base spacing - between elements */
--space-5: 20px  /* Medium spacing */
--space-6: 24px  /* Large spacing - card padding */
--space-8: 32px  /* XL spacing - section gaps */
--space-10: 40px /* XXL spacing */
--space-12: 48px /* Container spacing */
```

**Usage Rules:**
- Card padding: `24px` (space-6)
- Section gaps: `24px` (space-6)
- Element gaps: `16px` (space-4)
- Label to input: `12px` (space-3)

---

### Typography Scale

```css
/* DISPLAY - Hero numbers */
--font-size-display: 48px
font-weight: 700 (bold)
line-height: 1.25 (tight)
letter-spacing: -0.02em

/* H1 - Page titles */
--font-size-3xl: 36px
font-weight: 700 (bold)
line-height: 1.25 (tight)
letter-spacing: -0.01em

/* H2 - Section titles */
--font-size-2xl: 28px
font-weight: 700 (bold)
line-height: 1.25 (tight)

/* H3 - Card titles */
--font-size-xl: 22px
font-weight: 600 (semibold)
line-height: 1.5 (normal)

/* BODY - Content text */
--font-size-base: 15px
font-weight: 400 (normal)
line-height: 1.5 (normal)

/* LABEL - Form labels */
--font-size-sm: 13px
font-weight: 600 (semibold)
text-transform: uppercase
letter-spacing: 0.05em

/* CAPTION - Helper text */
--font-size-xs: 11px
font-weight: 500 (medium)
line-height: 1.75 (relaxed)
```

**Utility Classes:**
```css
.text-display  /* Hero numbers */
.text-h1       /* Page titles */
.text-h2       /* Section titles */
.text-h3       /* Card titles */
.text-body     /* Content */
.text-label    /* Form labels */
.text-caption  /* Helper text */
```

---

### Component Heights (Touch-Friendly)

```css
--input-height: 44px      /* All inputs */
--button-height: 44px     /* Standard buttons */
--button-height-sm: 36px  /* Small buttons */
--button-height-lg: 52px  /* Large buttons */
```

**Consistency Rule:**
All interactive elements (inputs, selects, buttons) = **44px height**

---

### Border Radius

```css
--radius-sm: 6px   /* Small elements */
--radius-md: 8px   /* Medium elements */
--radius-lg: 12px  /* Standard cards */
--radius-xl: 16px  /* Large cards */
```

**Standard:** All cards use `12px` (rounded-xl)

---

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.08)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
```

**Standard:** Cards use `shadow-lg`

---

## Component Standards

### Card Container

```tsx
<div className="glass-card rounded-xl">
  {/* Header with consistent padding */}
  <div className="px-6 py-5 border-b border-white/20">
    <h3 className="text-h3 text-neutral-900">Title</h3>
    <p className="text-body text-neutral-600 mt-2">Subtitle</p>
  </div>
  
  {/* Content with consistent padding */}
  <div className="p-6">
    {/* Content with 16px gaps */}
    <div className="space-y-4">
      {/* Elements */}
    </div>
  </div>
</div>
```

**Rules:**
- Header padding: `px-6 py-5` (24px horizontal, 20px vertical)
- Content padding: `p-6` (24px all sides)
- Element gaps: `space-y-4` (16px vertical)

---

### Input Field

```tsx
<div className="space-y-3">
  <label className="text-label text-neutral-900">
    Field Label
  </label>
  <input className="w-full h-11 px-4 text-body glass-card rounded-lg" />
  <p className="text-caption text-neutral-600">Helper text</p>
</div>
```

**Rules:**
- Label to input gap: `12px` (space-y-3)
- Input height: `44px` (h-11)
- Input padding: `16px` horizontal (px-4)
- Helper text: `text-caption`

---

### Button

```tsx
<button className="h-11 px-5 text-base font-semibold rounded-lg">
  Button Text
</button>
```

**Rules:**
- Height: `44px` (h-11) - matches input
- Padding: `20px` horizontal (px-5)
- Font: `text-base font-semibold`
- Radius: `rounded-lg` (12px)

---

## Before & After

### BEFORE (Inconsistent)
```
❌ Card padding: 16px, 20px, 24px (varies)
❌ Input heights: 38px, 42px, 44px (varies)
❌ Font sizes: 12px, 13px, 14px, 15px (no scale)
❌ Gaps: 8px, 12px, 16px, 20px (random)
❌ Border radius: 8px, 10px, 12px, 16px (varies)
```

### AFTER (Consistent)
```
✅ Card padding: 24px (always)
✅ Input heights: 44px (always)
✅ Font scale: Display/H1/H2/H3/Body/Label/Caption
✅ Gaps: 12px (label), 16px (elements), 24px (sections)
✅ Border radius: 12px (cards), 8px (inputs)
```

---

## Visual Hierarchy

### Data Display (Results)

```tsx
{/* Primary metric - LARGEST */}
<div className="text-display text-neutral-900">
  2.45
</div>

{/* Unit - SMALLER */}
<span className="text-body text-neutral-600">
  m³/s
</span>

{/* Label - SMALLEST */}
<p className="text-label text-neutral-600">
  DEBIT BANJIR
</p>
```

**Ratio:** Display (48px) : Body (15px) : Label (13px) = 3.2:1

---

## Alignment Grid

All elements align to **8px grid**:

```
0px   ├─ Container edge
24px  ├─ Content starts (padding)
40px  ├─ First element
56px  ├─ Second element (16px gap)
72px  ├─ Third element (16px gap)
```

**Rule:** Every element position is divisible by 8

---

## Implementation Checklist

- [x] Spacing system (8px grid)
- [x] Typography scale (7 levels)
- [x] Component heights (44px standard)
- [x] Border radius (12px cards)
- [x] Shadows (consistent)
- [x] Card padding (24px)
- [x] Element gaps (16px)
- [x] Label gaps (12px)
- [x] Typography utilities
- [x] Visual hierarchy

---

**Result:** Production-grade, pixel-perfect, consistent UI
