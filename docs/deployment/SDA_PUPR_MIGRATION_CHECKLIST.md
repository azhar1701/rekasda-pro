# ✅ SDA PUPR UI/UX Migration Checklist

## 🎯 Overview
Checklist ini membantu developer memastikan semua perubahan UI/UX SDA PUPR telah diterapkan dengan benar.

---

## 📋 Pre-Migration Checklist

- [ ] Backup kode existing
- [ ] Review dokumentasi: `docs/standards/SDA_PUPR_UI_ADOPTION.md`
- [ ] Pastikan dependencies up-to-date
- [ ] Test environment siap

---

## 🔧 Component Updates

### 1. Header Component
**File**: `src/components/ui/navigation/Header.tsx`

- [ ] Import statement sudah benar
- [ ] Gradient biru PUPR diterapkan (`#0c3a66`)
- [ ] Branding Kementerian PUPR visible di desktop
- [ ] Scroll effect (backdrop blur) berfungsi
- [ ] Height adjustment (h-16 → h-20) diterapkan
- [ ] Status badge styling updated
- [ ] Responsive behavior correct (mobile vs desktop)

**Test**:
```bash
# Visual check
- Scroll halaman, pastikan header berubah dari gradient → white blur
- Resize window, pastikan branding hilang di mobile
- Check status badge visibility
```

---

### 2. Navigation System
**File**: `src/App.tsx`

#### Desktop Navigation
- [ ] Horizontal layout di bawah header
- [ ] Position: `fixed top-20` (di bawah header)
- [ ] Background: white dengan border
- [ ] Active state: biru PUPR (`#0c3a66`)
- [ ] Divider antar grup menu
- [ ] Icon + label visible
- [ ] Hover effects smooth

#### Mobile Navigation
- [ ] Bottom bar position correct
- [ ] Icon + label compact
- [ ] Touch targets ≥56px
- [ ] Active state styling
- [ ] Safe area inset applied

**Test**:
```bash
# Desktop (≥768px)
- Navigation horizontal di bawah header
- Click setiap menu, pastikan active state benar
- Hover effect smooth

# Mobile (<768px)
- Navigation di bottom
- Touch-friendly (easy to tap)
- Active state visible
```

---

### 3. Footer Component (NEW)
**File**: `src/components/ui/navigation/Footer.tsx`

- [ ] File created
- [ ] Gradient biru PUPR background
- [ ] 3-column layout (Tentang, Kontak, Tautan)
- [ ] External links functional
- [ ] Copyright & version info
- [ ] Desktop only (hidden di mobile)
- [ ] Imported di `App.tsx`
- [ ] Positioned correctly (before closing div)

**Test**:
```bash
# Desktop
- Footer visible di bottom
- Links clickable (open in new tab)
- Layout rapi (3 columns)

# Mobile
- Footer hidden
```

---

### 4. Layout & Spacing
**File**: `src/App.tsx`

- [ ] Background gradient applied
- [ ] Main content padding updated:
  - [ ] `py-6 md:py-8`
  - [ ] `pb-28` (mobile for bottom nav)
  - [ ] `md:pb-8` (desktop)
  - [ ] `md:pt-24` (desktop for horizontal nav)
- [ ] Max width: `max-w-7xl`
- [ ] Horizontal padding: `px-4 md:px-6`

**Test**:
```bash
# Check spacing
- Content tidak tertutup navigation
- Scroll smooth tanpa jump
- Responsive spacing correct
```

---

### 5. Card Components
**File**: `src/components/ui/layout/StandardCard.tsx`

- [ ] Border updated: `border-slate-200`
- [ ] Border radius: `rounded-lg` (bukan xl)
- [ ] Header gradient: `from-slate-50 to-white`
- [ ] Hover effect: `hover:shadow-md`
- [ ] Typography: `font-bold tracking-tight`
- [ ] Transition smooth: `transition-shadow duration-200`

**Test**:
```bash
# Visual check
- Card border visible dan tegas
- Hover effect smooth
- Header gradient subtle
```

---

### 6. Button Components
**File**: `src/components/ui/forms/Button.tsx`

- [ ] Primary variant: biru PUPR (`#0c3a66`)
- [ ] Border added untuk depth
- [ ] Shadow updated: `shadow-sm`
- [ ] Hover: `hover:shadow-md`
- [ ] Active: `active:scale-[0.98]`
- [ ] Secondary variant updated

**Test**:
```bash
# Interaction check
- Click button, scale effect smooth
- Hover, shadow muncul
- Disabled state correct
```

---

### 7. Styles & CSS
**File**: `src/styles/index.css`

- [ ] Body background gradient
- [ ] `.glass-card` shadow updated
- [ ] Color variables (optional)
- [ ] No breaking changes

**Test**:
```bash
# Visual check
- Background gradient subtle
- Card shadows consistent
```

---

## 🎨 Design Token Verification

### Colors
- [ ] PUPR Blue: `#0c3a66` used consistently
- [ ] PUPR Blue Light: `#0d4578` for hover
- [ ] PUPR Blue Dark: `#0a2f52` for borders
- [ ] Slate palette consistent

### Spacing
- [ ] Header height: 64px (mobile), 80px (desktop)
- [ ] Navigation height: 48px (desktop), 64px (mobile)
- [ ] Content padding: 24px (mobile), 32px (desktop)

### Typography
- [ ] Font family: Plus Jakarta Sans
- [ ] Font weights: 400, 500, 600, 700
- [ ] Line heights consistent

---

## 📱 Responsive Testing

### Desktop (≥768px)
- [ ] Header dengan branding visible
- [ ] Horizontal navigation functional
- [ ] Footer visible
- [ ] Spacing optimal
- [ ] Hover states working

### Tablet (768px - 1024px)
- [ ] Layout responsive
- [ ] Navigation accessible
- [ ] Content readable

### Mobile (<768px)
- [ ] Compact header
- [ ] Bottom navigation
- [ ] Footer hidden
- [ ] Touch targets adequate
- [ ] Content tidak terpotong

---

## 🔍 Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## ♿ Accessibility Check

- [ ] Color contrast ratio ≥4.5:1 (WCAG AA)
- [ ] Touch targets ≥44px (mobile)
- [ ] Keyboard navigation working
- [ ] Focus states visible
- [ ] Screen reader friendly

---

## 🚀 Performance Check

- [ ] No layout shift (CLS)
- [ ] Smooth transitions (60fps)
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] CSS animations hardware-accelerated

---

## 📊 Visual Regression Testing

### Header
- [ ] Gradient correct
- [ ] Branding positioned correctly
- [ ] Scroll effect smooth

### Navigation
- [ ] Desktop: horizontal layout
- [ ] Mobile: bottom bar
- [ ] Active states correct

### Cards
- [ ] Border visible
- [ ] Shadow consistent
- [ ] Hover effect smooth

### Buttons
- [ ] Color correct (PUPR blue)
- [ ] Hover/active states
- [ ] Loading state

### Footer
- [ ] Layout correct
- [ ] Links working
- [ ] Responsive behavior

---

## 🐛 Known Issues & Solutions

### Issue 1: Navigation overlap dengan content
**Solution**: Pastikan `md:pt-24` applied di main content

### Issue 2: Footer tidak muncul
**Solution**: Check `hidden md:block` class

### Issue 3: Button color tidak berubah
**Solution**: Clear cache, rebuild

### Issue 4: Gradient tidak smooth
**Solution**: Check CSS gradient syntax

---

## 📝 Documentation Updates

- [ ] README.md updated (jika perlu)
- [ ] CHANGELOG.md entry added
- [ ] Component docs updated
- [ ] Screenshots updated (jika ada)

---

## ✅ Final Verification

### Functionality
- [ ] Semua fitur existing masih berfungsi
- [ ] Tidak ada breaking changes
- [ ] Navigation working correctly
- [ ] Forms submittable
- [ ] Calculations accurate

### Visual
- [ ] Consistent dengan SDA PUPR style
- [ ] Professional appearance
- [ ] Clean & clear layout
- [ ] Responsive di semua devices

### Performance
- [ ] Load time acceptable
- [ ] Smooth animations
- [ ] No console errors
- [ ] No memory leaks

---

## 🎯 Sign-off

- [ ] Developer review complete
- [ ] QA testing passed
- [ ] Stakeholder approval
- [ ] Ready for deployment

---

## 📞 Support

Jika ada masalah:
1. Check dokumentasi: `docs/standards/SDA_PUPR_UI_ADOPTION.md`
2. Review visual comparison: `docs/standards/VISUAL_COMPARISON_SDA_PUPR.md`
3. Check quick reference: `docs/SDA_PUPR_ADOPTION_QUICK_REF.md`

---

**Migration Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Completed by**: _______________  
**Date**: _______________  
**Version**: 1.1.0
