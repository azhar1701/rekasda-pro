# GovTech UI Standardization - Automated Fix Script
# FASE 2 - TAHAP 3: Global UI Sweeping

## 🎨 GovTech SDA PUPR Standards

### **Colors**
- Primary: `#0c3a66` (bg-pupr-blue / bg-[#0c3a66])
- Accent: `#f2c114` (bg-pupr-yellow / bg-[#f2c114])
- Success: `#059669` (emerald-600)
- Warning: `#f59e0b` (amber-500)
- Danger: `#dc2626` (red-600)

### **Border Radius**
- Standard: `rounded-md` (0.375rem / 6px)
- Cards: `rounded-lg` (0.5rem / 8px)
- Buttons: `rounded-md`
- NO: `rounded-full`, `rounded-2xl`, `rounded-3xl`

### **Typography**
- Numbers: MUST use `tabular-nums tracking-tight`
- Tables: MUST use `font-mono` for numbers
- Charts: MUST use `tabular-nums` for axis labels

---

## 🔍 Issues Found (Automated Scan)

### **Generic Colors to Replace**

```bash
# Blue variants (non-PUPR)
bg-blue-500 → bg-[#0c3a66]
text-blue-500 → text-[#0c3a66]
border-blue-500 → border-[#0c3a66]

# Green variants (keep emerald for success)
bg-green-500 → bg-emerald-600
text-green-500 → text-emerald-600

# Red variants (keep for danger)
bg-red-500 → bg-red-600 (OK)
```

### **Rounded Styles to Replace**

```bash
# Over-rounded elements
rounded-full → rounded-md (for buttons, badges)
rounded-2xl → rounded-lg (for cards)
rounded-3xl → rounded-lg (for containers)

# EXCEPTIONS (keep rounded-full):
- Avatar images
- Loading spinners
- Status indicators (dots)
- Icon containers (small circles)
```

### **Missing tabular-nums**

```bash
# Add to all number displays
<span className="font-bold">123.45</span>
→
<span className="font-bold tabular-nums tracking-tight">123.45</span>
```

---

## 🛠️ Manual Fixes Required

Due to the large number of files (100+), automated replacement is risky.  
Instead, we'll create a **style guide** and fix **critical files** manually.

### **Priority 1: Core Components (High Impact)**

1. ✅ `src/App.tsx` - Main app badges
2. ✅ `src/components/ui/data-display/Badge.tsx` - Badge component
3. ✅ `src/components/ui/Button.tsx` - Button component
4. ✅ `src/components/ui/Modal.tsx` - Modal dialogs
5. ✅ `src/features/history/components/AllDataTab.tsx` - History cards

### **Priority 2: Feature Modules (Medium Impact)**

6. `src/features/flood-analysis/` - Flood analysis UI
7. `src/features/master-data/` - Master data UI
8. `src/features/water-balance/` - Water balance UI

### **Priority 3: Minor Components (Low Impact)**

9. Loading states
10. Empty states
11. Tooltips

---

## 📝 Style Guide for Developers

### **DO's**

```tsx
// ✅ GOOD: PUPR Blue
<div className="bg-[#0c3a66] text-white">

// ✅ GOOD: Standard rounded
<button className="rounded-md px-4 py-2">

// ✅ GOOD: Tabular numbers
<span className="tabular-nums tracking-tight">1,234.56</span>

// ✅ GOOD: Emerald for success
<div className="bg-emerald-600 text-white">
```

### **DON'Ts**

```tsx
// ❌ BAD: Generic blue
<div className="bg-blue-500 text-white">

// ❌ BAD: Over-rounded
<button className="rounded-full px-4 py-2">

// ❌ BAD: Non-tabular numbers
<span className="font-bold">1,234.56</span>

// ❌ BAD: Generic green
<div className="bg-green-500 text-white">
```

---

## 🎯 Implementation Strategy

### **Phase 1: Create Utility Classes (Immediate)**

Add to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'pupr-blue': '#0c3a66',
        'pupr-yellow': '#f2c114',
      },
      borderRadius: {
        'govtech': '0.375rem', // 6px
      },
    },
  },
}
```

### **Phase 2: Update Core Components (1 hour)**

Manually fix 5 critical files listed in Priority 1.

### **Phase 3: Gradual Migration (Ongoing)**

Update feature modules as they are touched during development.

---

## ✅ Quick Wins (Immediate Impact)

### **1. Badge Component**

File: `src/components/ui/data-display/Badge.tsx`

```tsx
// BEFORE
<span className="inline-flex items-center gap-1.5 rounded-full">

// AFTER
<span className="inline-flex items-center gap-1.5 rounded-md">
```

### **2. Button Component**

File: `src/components/ui/Button.tsx`

```tsx
// BEFORE
className="rounded-full"

// AFTER
className="rounded-md"
```

### **3. Number Displays**

Global search and replace pattern:

```tsx
// BEFORE
<span className="font-bold">{number}</span>

// AFTER
<span className="font-bold tabular-nums tracking-tight">{number}</span>
```

---

## 📊 Impact Analysis

### **Files Affected**

- Total files with issues: ~100
- Critical files (Priority 1): 5
- Medium priority files: 15
- Low priority files: 80

### **Estimated Effort**

- Phase 1 (Utility classes): 10 minutes
- Phase 2 (Core components): 1 hour
- Phase 3 (Full migration): 4-6 hours (gradual)

### **Risk Assessment**

- **Low Risk**: Utility classes (no breaking changes)
- **Medium Risk**: Core components (test thoroughly)
- **Low Risk**: Gradual migration (one file at a time)

---

## 🧪 Testing Checklist

After each fix:

- [ ] Visual regression test (screenshot comparison)
- [ ] Responsive design check (mobile, tablet, desktop)
- [ ] Accessibility check (contrast ratios)
- [ ] Browser compatibility (Chrome, Firefox, Safari)

---

## 📁 Files to Fix (Priority 1)

### **1. src/App.tsx**

Lines to fix:
- Line 228: `bg-blue-500/20` → `bg-[#0c3a66]/20`
- Line 229: `bg-red-500/20` → `bg-red-600/20`
- Line 230: `bg-green-500/20` → `bg-emerald-600/20`
- Line 234: `rounded-full` → `rounded-md` (close button)

### **2. src/components/ui/data-display/Badge.tsx**

Line to fix:
- `rounded-full` → `rounded-md`

### **3. src/components/ui/Modal.tsx**

Lines to fix:
- `rounded-2xl` → `rounded-lg`
- `rounded-full` → `rounded-md` (close button)

### **4. src/features/history/components/AllDataTab.tsx**

Lines to fix:
- `rounded-2xl` → `rounded-lg` (cards)
- Add `tabular-nums` to all number displays

### **5. src/components/ui/Button.tsx**

Check if exists, fix:
- `rounded-full` → `rounded-md`

---

## 🚀 Execution Plan

### **Step 1: Add Utility Classes**

```bash
# Edit tailwind.config.js
# Add pupr-blue and pupr-yellow colors
```

### **Step 2: Fix Core Components**

```bash
# Fix 5 files manually
# Test each file after fix
```

### **Step 3: Document Changes**

```bash
# Update CHANGELOG.md
# Update style guide
```

---

## 📝 Completion Criteria

- [x] Utility classes added to Tailwind config
- [ ] 5 core components fixed
- [ ] Visual regression tests passed
- [ ] Style guide documented
- [ ] Team notified of new standards

---

**Note**: Due to the large scope (100+ files), we'll implement **Phase 1 & 2 only** for TAHAP 3.  
Phase 3 (full migration) will be done gradually during normal development.

---

**Prepared by**: Amazon Q  
**Standard**: GovTech SDA PUPR UI Guidelines  
**Status**: Ready for Manual Implementation
