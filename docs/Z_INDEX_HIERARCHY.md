# Z-Index Hierarchy - Rekasda Pro

## 🎯 Purpose
Dokumentasi lengkap z-index layers untuk menghindari tumpang tindih komponen.

## 📊 Z-Index Layers

```
┌─────────────────────────────────────────┐
│  z-[110] - Toasts & Notifications       │  ← Highest (Always visible)
├─────────────────────────────────────────┤
│  z-[101] - Modal Content                │
├─────────────────────────────────────────┤
│  z-[100] - Modal Backdrop               │
├─────────────────────────────────────────┤
│  z-50    - Navigation Dock              │
├─────────────────────────────────────────┤
│  z-10    - Main Content                 │
├─────────────────────────────────────────┤
│  z-0     - Base Layer                   │  ← Lowest (Background)
└─────────────────────────────────────────┘
```

## 🔢 Layer Definitions

### Layer 0: Base (z-0)
**Components:**
- Background gradients
- Decorative elements
- Base page content

**Usage:**
```tsx
<div className="z-0">Background</div>
```

### Layer 10: Main Content (z-10)
**Components:**
- Main application content
- Cards
- Forms
- Charts

**Usage:**
```tsx
<main className="z-10 relative">
  {/* Main content */}
</main>
```

### Layer 50: Navigation (z-50)
**Components:**
- Bottom navigation dock
- Fixed headers
- Floating action buttons

**Usage:**
```tsx
<div className="fixed bottom-6 z-50">
  {/* Navigation */}
</div>
```

### Layer 100: Modal Backdrop (z-[100])
**Components:**
- Modal backdrop/overlay
- Drawer backdrop
- Lightbox backdrop

**Usage:**
```tsx
<div 
  className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
  onClick={onClose}
/>
```

### Layer 101: Modal Content (z-[101])
**Components:**
- Modal dialogs
- Drawers
- Popovers
- Dropdowns

**Usage:**
```tsx
<div className="fixed inset-0 z-[101] flex items-center justify-center">
  <div className="bg-white rounded-3xl">
    {/* Modal content */}
  </div>
</div>
```

### Layer 110: Toasts (z-[110])
**Components:**
- Toast notifications
- Snackbars
- Alert messages
- Loading indicators

**Usage:**
```tsx
<div className="fixed top-24 z-[110]">
  {/* Toast message */}
</div>
```

## 📝 Implementation Examples

### Example 1: Modal with Backdrop
```tsx
{isOpen && (
  <>
    {/* Backdrop - z-[100] */}
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
      onClick={() => setIsOpen(false)}
    />
    
    {/* Modal Content - z-[101] */}
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl">
        {/* Content */}
      </div>
    </div>
  </>
)}
```

### Example 2: Toast Notification
```tsx
{message && (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110]">
    <div className="bg-purple-50 border-2 border-purple-500 rounded-xl px-6 py-3">
      {message}
    </div>
  </div>
)}
```

### Example 3: Navigation Dock
```tsx
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
  <nav className="bg-white/95 backdrop-blur-xl rounded-3xl">
    {/* Navigation items */}
  </nav>
</div>
```

## ⚠️ Common Mistakes

### ❌ Wrong: Same z-index for modal and backdrop
```tsx
<div className="z-50">Backdrop</div>
<div className="z-50">Modal</div>
```

### ✅ Correct: Different z-index layers
```tsx
<div className="z-[100]">Backdrop</div>
<div className="z-[101]">Modal</div>
```

### ❌ Wrong: Toast below modal
```tsx
<div className="z-50">Toast</div>
<div className="z-[100]">Modal</div>
```

### ✅ Correct: Toast above modal
```tsx
<div className="z-[110]">Toast</div>
<div className="z-[101]">Modal</div>
```

## 🔧 Component-Specific Z-Index

### App.tsx
- Main content: `z-10`
- Navigation dock: `z-50`

### FloodDischargeCalculator.tsx
- Toast notifications: `z-[110]`
- Main content: `z-10`

### PilotDataLoader.tsx
- Modal backdrop: `z-[100]`
- Modal content: `z-[101]`

### Header.tsx
- Fixed header: `z-40` (below navigation)

## 🎨 Visual Stacking Order

```
User's View (Top to Bottom):
┌─────────────────────────────────┐
│ 🔔 Toast Notification (z-110)   │
├─────────────────────────────────┤
│ 📱 Modal Dialog (z-101)         │
├─────────────────────────────────┤
│ ⬛ Modal Backdrop (z-100)       │
├─────────────────────────────────┤
│ 🧭 Navigation Dock (z-50)       │
├─────────────────────────────────┤
│ 📄 Main Content (z-10)          │
├─────────────────────────────────┤
│ 🎨 Background (z-0)             │
└─────────────────────────────────┘
```

## 🚀 Best Practices

### 1. Use Semantic Layers
- Don't use arbitrary z-index values
- Follow the defined hierarchy
- Document any new layers

### 2. Avoid Z-Index Wars
- Don't increment z-index to fix overlaps
- Fix the root cause instead
- Use proper layer assignment

### 3. Test Interactions
- Test modal + toast combinations
- Test navigation + modal
- Test all overlay scenarios

### 4. Maintain Consistency
- Use same z-index for same layer across components
- Update this document when adding new layers
- Review z-index in code reviews

## 📋 Checklist for New Components

When adding new components:
- [ ] Identify which layer it belongs to
- [ ] Use appropriate z-index from hierarchy
- [ ] Test with other overlays
- [ ] Verify no visual conflicts
- [ ] Update this document if needed

## 🔍 Debugging Z-Index Issues

### Step 1: Identify the Problem
- Which components are overlapping?
- What are their current z-index values?
- What is the expected stacking order?

### Step 2: Check the Hierarchy
- Refer to this document
- Verify components are using correct layers
- Check for custom z-index values

### Step 3: Fix the Issue
- Assign correct z-index from hierarchy
- Test the fix
- Verify no side effects

### Step 4: Document
- Update this document if needed
- Add comments in code
- Share with team

## 📚 References

- [MDN: z-index](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)
- [CSS Tricks: z-index](https://css-tricks.com/almanac/properties/z/z-index/)
- [Tailwind CSS: z-index utilities](https://tailwindcss.com/docs/z-index)

## 🔄 Version History

### v1.1.0 (Current)
- Added z-[110] for toasts
- Separated modal backdrop (z-[100]) and content (z-[101])
- Fixed overlap issues

### v1.0.0
- Initial z-index hierarchy
- Basic layer definitions

---

**Last Updated:** 2024  
**Status:** ✅ Active  
**Maintainer:** Development Team
