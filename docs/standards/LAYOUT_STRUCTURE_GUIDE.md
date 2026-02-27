# 📐 Layout Structure Guide - SDA PUPR Style

## 🎯 Overview
Panduan visual untuk memahami struktur layout baru setelah adopsi UI/UX SDA PUPR.

---

## 🖥️ Desktop Layout (≥768px)

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER (h-20)                           │
│  ████████████████████████████████████████████████████████████   │
│  🌊 RekaSDA Pro │ KEMENTERIAN PUPR    [●] Online    [v1.1]     │
│                 │ Ditjen SDA                                    │
│  (Gradient: #0c3a66 → #0d4578 → #0c3a66)                       │
│  (Sticky, z-40)                                                 │
├─────────────────────────────────────────────────────────────────┤
│                   HORIZONTAL NAVIGATION                         │
│  📊 Data Master │ 📈 Frekuensi │ 🌧️ Banjir │ ⚖️ Neraca │      │
│  💧 Embung │ 🏗️ Saluran │ 📄 Laporan │ ✨ AI Konsultan        │
│  (Fixed top-20, bg-white, border-b, shadow-sm)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        MAIN CONTENT                             │
│                     (max-w-7xl, mx-auto)                        │
│                     (px-6, py-8, pt-24)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                    Content Cards                          │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   Card 1    │  │   Card 2    │  │   Card 3    │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                          FOOTER                                 │
│  ████████████████████████████████████████████████████████████   │
│                                                                 │
│  TENTANG REKASDA PRO  │  KONTAK           │  TAUTAN TERKAIT    │
│  Platform analisis... │  📧 Email         │  🔗 SDA PUPR       │
│                       │  📞 Phone         │  🔗 Kementerian    │
│                       │  📍 Location      │  🔗 BSN            │
│                                                                 │
│  © 2025 RekaSDA Pro  │  Privacy  │  Terms  │  v1.1.0          │
│  (Gradient: #0c3a66, py-8)                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Measurements (Desktop)
```
Header Height:        80px (h-20)
Nav Height:           48px (auto)
Nav Position:         Fixed, top-20 (below header)
Content Padding Top:  96px (pt-24, for nav clearance)
Content Padding X:    24px (px-6)
Content Padding Y:    32px (py-8)
Footer Padding:       32px (py-8)
Max Content Width:    1280px (max-w-7xl)
```

---

## 📱 Mobile Layout (<768px)

```
┌─────────────────────────────────────┐
│          HEADER (h-16)              │
│  ████████████████████████████████   │
│  🌊 RekaSDA Pro    [●]    [v1.1]   │
│  (Gradient: #0c3a66)                │
│  (Sticky, z-40)                     │
├─────────────────────────────────────┤
│                                     │
│         MAIN CONTENT                │
│      (px-4, py-6, pb-28)            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │      Content Cards            │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │       Card 1            │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │       Card 2            │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│                                     │
│  (Footer hidden on mobile)          │
│                                     │
├─────────────────────────────────────┤
│    BOTTOM NAVIGATION BAR            │
│  📊  📈  🌧️  ⚖️  💧  🏗️  📄  ✨   │
│  Data Frek Banjir Neraca Embung... │
│  (Fixed bottom, h-16, safe-area)   │
└─────────────────────────────────────┘
```

### Key Measurements (Mobile)
```
Header Height:        64px (h-16)
Bottom Nav Height:    64px (h-16)
Content Padding Top:  24px (py-6)
Content Padding X:    16px (px-4)
Content Padding Bot:  112px (pb-28, for nav clearance)
Touch Target Min:     44px (tap-target)
Safe Area Inset:      Applied to bottom nav
```

---

## 🎨 Component Hierarchy

### Z-Index Layers
```
Layer 5 (z-50):  Navigation (both desktop & mobile)
Layer 4 (z-40):  Header (sticky)
Layer 3 (z-30):  Modals & Overlays
Layer 2 (z-20):  Dropdowns & Tooltips
Layer 1 (z-10):  Floating elements
Layer 0 (z-0):   Content
```

### Color Hierarchy
```
Primary:     #0c3a66 (PUPR Blue) - Header, active states, primary buttons
Secondary:   #0d4578 (PUPR Blue Light) - Hover states
Tertiary:    #0a2f52 (PUPR Blue Dark) - Borders, shadows
Accent:      #f2c114 (PUPR Yellow) - Future use
Neutral:     #f8fafc → #ffffff (Backgrounds)
Text:        #1e293b (Primary text)
```

---

## 📏 Spacing System

### Container Spacing
```css
/* Desktop */
.container-desktop {
  max-width: 1280px;      /* max-w-7xl */
  padding-left: 24px;     /* px-6 */
  padding-right: 24px;
  padding-top: 32px;      /* py-8 */
  padding-bottom: 32px;
}

/* Mobile */
.container-mobile {
  padding-left: 16px;     /* px-4 */
  padding-right: 16px;
  padding-top: 24px;      /* py-6 */
  padding-bottom: 112px;  /* pb-28 (for bottom nav) */
}
```

### Card Spacing
```css
.card {
  padding: 24px;          /* p-6 */
  gap: 16px;              /* gap-4 (between elements) */
  border-radius: 8px;     /* rounded-lg */
  border: 1px solid #e2e8f0;
}

.card-header {
  padding: 16px 24px;     /* px-6 py-4 */
  background: linear-gradient(to right, #f8fafc, #ffffff);
}
```

---

## 🔄 Responsive Breakpoints

```css
/* Tailwind Breakpoints */
sm:  640px   /* Small devices */
md:  768px   /* Tablets (navigation switch point) */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large screens */
```

### Navigation Behavior
```
< 768px:  Bottom navigation bar
≥ 768px:  Horizontal navigation below header
```

### Footer Behavior
```
< 768px:  Hidden (display: none)
≥ 768px:  Visible (display: block)
```

### Header Branding
```
< 1024px: Hidden (lg:hidden)
≥ 1024px: Visible (lg:flex)
```

---

## 🎯 Touch Targets (Mobile)

```
Minimum Size:     44px × 44px (WCAG 2.1 Level AAA)
Recommended:      48px × 48px
Current:          56px × 60px (bottom nav buttons)

Example:
┌────────────┐
│            │  60px height
│    📊      │  
│   Data     │  
│            │
└────────────┘
   60px width
```

---

## 📐 Grid System

### Desktop (3-column example)
```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Column 1  │  │   Column 2  │  │   Column 3  │     │
│  │             │  │             │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  (grid grid-cols-3 gap-6)                               │
└─────────────────────────────────────────────────────────┘
```

### Mobile (1-column stack)
```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │       Column 1            │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │       Column 2            │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │       Column 3            │  │
│  └───────────────────────────┘  │
│  (grid grid-cols-1 gap-4)       │
└─────────────────────────────────┘
```

---

## 🎨 Visual States

### Button States
```
Default:   bg-[#0c3a66] border-[#0a2f52] shadow-sm
Hover:     bg-[#0d4578] shadow-md
Active:    scale-[0.98]
Disabled:  opacity-50 cursor-not-allowed
Loading:   opacity-75 + spinner
```

### Card States
```
Default:   border-slate-200 shadow-sm
Hover:     shadow-md (transition-shadow duration-200)
Active:    (no change)
```

### Navigation States
```
Default:   text-slate-600 bg-transparent
Hover:     bg-slate-100 text-slate-700
Active:    bg-[#0c3a66] text-white shadow-md
```

---

## 🔍 Accessibility Features

### Focus States
```css
.focus-visible {
  outline: 2px solid #0c3a66;
  outline-offset: 2px;
}
```

### Color Contrast
```
Text on White:     #1e293b (16.5:1) ✅ AAA
Text on PUPR Blue: #ffffff (8.6:1)  ✅ AAA
Links:             #0c3a66 (7.2:1)  ✅ AA
```

### Screen Reader
```html
<!-- Navigation -->
<nav aria-label="Main navigation">
  <button aria-current="page">Data Master</button>
</nav>

<!-- Footer -->
<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

---

## 📱 Safe Area Insets (iOS)

```css
.safe-area-inset-bottom {
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}

/* Applied to bottom navigation */
.bottom-nav {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 🎯 Quick Reference

### Header
- Desktop: `h-20` (80px), gradient PUPR
- Mobile: `h-16` (64px), gradient PUPR
- Position: `sticky top-0 z-40`

### Navigation
- Desktop: `fixed top-20`, horizontal
- Mobile: `fixed bottom-0`, vertical icons
- Z-index: `z-50`

### Main Content
- Desktop: `pt-24` (for nav), `pb-8`
- Mobile: `pt-6`, `pb-28` (for bottom nav)
- Max width: `max-w-7xl`

### Footer
- Desktop: Visible, `py-8`
- Mobile: Hidden
- Background: Gradient PUPR

---

**Reference**: `docs/standards/SDA_PUPR_UI_ADOPTION.md`  
**Version**: 1.1.0  
**Last Updated**: 2025-01-XX
