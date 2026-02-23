# ✅ Checklist Integrasi UI/UX Glassmorphism

## Status Komponen

### Core UI Components ✅
- [x] Button - Glassmorphism variants
- [x] Card - Glass-card styling
- [x] InputField - Glass-card background
- [x] DataTable - Glass-card container
- [x] Modal - Glass-strong with backdrop

### Layout Components ✅
- [x] MainLayout - Sidebar & header glass
- [x] LocationIdentity - Glass-card styling

### Feature Components 🔄
- [x] ManningCalculator - Cards updated
- [ ] FloodAnalysisTab
- [ ] WaterBalanceTab
- [ ] GeminiConsultant
- [ ] AllDataTab
- [ ] HistoryMap

### Shared Components
- [ ] Alert
- [ ] Toast
- [ ] SelectWithSearch
- [ ] InputGroup
- [ ] Collapsible

---

## Panduan Update Komponen

### Pattern 1: Card Container
```tsx
// Before
<div className="bg-white rounded-lg border border-slate-200">

// After
<div className="glass-card rounded-xl shadow-lg border border-white/20">
```

### Pattern 2: Text Colors
```tsx
// Before
text-slate-800  → text-neutral-900
text-slate-600  → text-neutral-700
text-slate-500  → text-neutral-600

// After - Lebih kontras untuk glassmorphism
```

### Pattern 3: Background
```tsx
// Before
bg-slate-50

// After
(remove - transparent background)
```

---

## Prioritas Update

### High Priority (User-facing)
1. FloodAnalysisTab
2. WaterBalanceTab
3. AllDataTab

### Medium Priority (Interactive)
4. GeminiConsultant
5. Alert/Toast components
6. Form components

### Low Priority (Internal)
7. Utility components
8. Helper components

---

## Testing Checklist

- [ ] Keterbacaan teks pada semua komponen
- [ ] Kontras warna memenuhi WCAG AA
- [ ] Data numerik tetap tajam (tidak blur)
- [ ] Responsive di mobile & desktop
- [ ] Performance rendering smooth
- [ ] Browser compatibility (Chrome, Firefox, Safari)

---

## Notes

- Gradient background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Glass utilities: `.glass`, `.glass-strong`, `.glass-card`
- Prioritaskan keterbacaan di atas estetika
- Test di berbagai kondisi cahaya layar
