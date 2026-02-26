# 🔄 Batch Refactoring Script - Gold Standard

**Apply Clean & Clear Design ke Seluruh Modul**

---

## 📋 File Priority List

### High Priority (Main Modules)
1. ✅ `ExecutiveDashboard.tsx` - DONE (Gold Standard)
2. ⏳ `ManningCalculator.tsx` - Partial (needs button update)
3. ⏳ `WaterBalanceAnalysis.tsx` - Partial (needs button update)
4. ⏳ `ModulAnalisisFrekuensi.tsx` - Needs full refactor
5. ⏳ `EmbungDashboard.tsx` - Needs refactor
6. ⏳ `CapacityAnalysisTab.tsx` - Needs refactor
7. ⏳ `RoutingAnalysisTab.tsx` - Needs refactor

### Medium Priority (Sub-components)
8. `FloodAnalysisTab.tsx`
9. `RainfallFrequencyAnalysis.tsx`
10. `HydrographCalculator.tsx`
11. `MasterDataDashboard.tsx`
12. `ThiessenCalculator.tsx`

---

## 🔧 Refactoring Checklist (Per File)

### 1. Remove Glassmorphism
```bash
# Find and replace
backdrop-blur → (remove)
bg-slate-50/80 → bg-white
bg-*/50 → bg-white
bg-*/30 → bg-white
```

### 2. Fix Rounded Corners
```bash
rounded-3xl → rounded-xl
rounded-2xl → rounded-xl
rounded-full (for icons) → rounded-lg
```

### 3. Update Colors
```bash
# Borders
border-slate-* → border-neutral-*

# Text
text-slate-* → text-neutral-*

# Backgrounds
bg-slate-* → bg-neutral-*

# Keep semantic colors
bg-blue-* → bg-primary-*
bg-red-* → bg-error*
bg-green-* → bg-success*
bg-amber-* → bg-warning*
```

### 4. Add Tabular Numbers
```tsx
// Before
<span className="text-3xl font-bold">{value}</span>

// After
<span className="text-3xl font-bold tabular-nums tracking-tight">{value}</span>
```

### 5. Update Buttons
```tsx
// Before
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
  Save
</button>

// After
<Button variant="primary">
  <Save />
  Save
</Button>
```

### 6. Update Icons
```tsx
// Before
<svg className="w-4 h-4">...</svg>

// After
import { Save } from 'lucide-react';
<Save className="w-4 h-4" />
```

### 7. Standardize Spacing
```tsx
// Grid gaps
gap-8 → gap-6

// Card padding
p-8 → p-6

// Section margins
mb-8 → mb-4
```

---

## 🎨 Component Pattern Templates

### Card with Header
```tsx
<div className="bg-white border border-neutral-200 rounded-xl p-6">
  <div className="flex items-center gap-2 mb-4">
    <div className="p-2 bg-primary-50 rounded-lg">
      <Icon className="w-4 h-4 text-primary-600" />
    </div>
    <h3 className="text-lg font-bold text-neutral-900">Title</h3>
  </div>
  {/* Content */}
</div>
```

### Metric Display
```tsx
<div>
  <p className="text-4xl font-bold text-neutral-900 tabular-nums tracking-tight mb-2">
    {value}
  </p>
  <p className="text-sm font-semibold text-neutral-500">
    Unit · Label
  </p>
</div>
```

### Info Row
```tsx
<div className="flex items-start gap-3">
  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
    <Icon className="w-5 h-5 text-neutral-600" />
  </div>
  <div className="flex-1">
    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
      Label
    </p>
    <p className="text-sm font-semibold text-neutral-900">
      Value
    </p>
  </div>
</div>
```

### Badge
```tsx
<div className="flex items-center gap-2 px-3 py-1.5 bg-warning-light border border-warning rounded-lg">
  <Icon className="w-4 h-4 text-warning-dark" />
  <span className="text-xs font-semibold text-warning-dark uppercase tracking-wide">
    Label
  </span>
</div>
```

---

## 🚀 Automated Find & Replace

### VS Code Regex Patterns

**1. Remove backdrop-blur:**
```regex
Find: backdrop-blur(-\w+)?
Replace: (empty)
```

**2. Fix rounded-3xl:**
```regex
Find: rounded-3xl
Replace: rounded-xl
```

**3. Update slate to neutral:**
```regex
Find: (border|text|bg)-slate-(\d+)
Replace: $1-neutral-$2
```

**4. Add tabular-nums to numbers:**
```regex
Find: (className="[^"]*text-\d+xl[^"]*font-bold[^"]*)"
Replace: $1 tabular-nums tracking-tight"
```

---

## 📊 Progress Tracking

| File | Status | Notes |
|------|--------|-------|
| ExecutiveDashboard.tsx | ✅ Done | Gold Standard |
| ManningCalculator.tsx | 🟡 Partial | Update buttons |
| WaterBalanceAnalysis.tsx | 🟡 Partial | Update buttons |
| ModulAnalisisFrekuensi.tsx | ⏳ Pending | Full refactor |
| EmbungDashboard.tsx | ⏳ Pending | Remove glassmorphism |
| CapacityAnalysisTab.tsx | ⏳ Pending | Full refactor |
| RoutingAnalysisTab.tsx | ⏳ Pending | Full refactor |

---

## 🎯 Quick Wins (Low Effort, High Impact)

1. **Global Find & Replace:**
   - `backdrop-blur` → (remove)
   - `rounded-3xl` → `rounded-xl`
   - `border-slate-` → `border-neutral-`

2. **Button Updates:**
   - Replace all `<button className="bg-blue-600...">` with `<Button variant="primary">`

3. **Add Tabular Numbers:**
   - Find all number displays
   - Add `tabular-nums tracking-tight`

---

## ✅ Validation Checklist

After refactoring each file:

- [ ] No `backdrop-blur` or glassmorphism
- [ ] All `rounded-3xl` → `rounded-xl`
- [ ] All colors use neutral palette
- [ ] All numbers have `tabular-nums tracking-tight`
- [ ] All buttons use Design System Button
- [ ] All icons from lucide-react
- [ ] Spacing consistent (`gap-6`, `p-6`, `mb-4`)
- [ ] No hardcoded colors

---

**Status:** Ready for batch execution  
**Estimated Time:** 2-3 hours for all high priority files
