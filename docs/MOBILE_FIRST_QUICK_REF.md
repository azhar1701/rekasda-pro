# Mobile-First Quick Reference

## 🎯 Golden Rules

1. **Inputs MUST be 16px** → `text-base` (prevents iOS zoom)
2. **Touch targets MUST be 44px** → `min-h-[44px] min-w-[44px]`
3. **Mobile first, desktop second** → `class="mobile md:desktop"`
4. **Tables → Cards on mobile** → `hidden md:block` + `md:hidden`
5. **Full-width buttons on mobile** → `w-full md:w-auto`

## 📐 Layout Patterns

### Stack → Side-by-Side
```tsx
<div className="flex flex-col lg:flex-row gap-6">
  <div className="w-full lg:w-1/3">Sidebar</div>
  <div className="w-full lg:w-2/3">Content</div>
</div>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### Conditional Width
```tsx
<div 
  className="w-full lg:w-auto" 
  style={{ width: window.innerWidth >= 1024 ? '35%' : '100%' }}
>
```

## 🔘 Buttons

### Primary Action
```tsx
<button className="w-full md:w-auto min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold">
  Save
</button>
```

### Button Group
```tsx
<div className="flex flex-col md:flex-row gap-2">
  <button className="flex-1 min-h-[44px]">Primary</button>
  <button className="w-full md:w-auto min-h-[44px]">Secondary</button>
</div>
```

## 📝 Forms

### Input (16px minimum)
```tsx
<input 
  type="text"
  className="w-full h-12 px-4 text-base bg-slate-50 border rounded-lg"
/>
```

### Select (16px minimum)
```tsx
<select className="w-full h-12 px-4 text-base bg-slate-50 border rounded-lg">
  <option>Option</option>
</select>
```

### Textarea (16px minimum)
```tsx
<textarea 
  className="w-full min-h-[120px] p-4 text-base bg-slate-50 border rounded-lg"
/>
```

## 📊 Tables → Cards

### Desktop Table
```tsx
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    {/* Standard table */}
  </table>
</div>
```

### Mobile Cards
```tsx
<div className="md:hidden space-y-3">
  {data.map(item => (
    <div key={item.id} className="bg-white rounded-lg p-4 border">
      <div className="flex justify-between mb-2">
        <span className="text-xs text-slate-500">Label</span>
        <span className="font-bold">{item.value}</span>
      </div>
      {/* More fields */}
    </div>
  ))}
</div>
```

## 🎨 Spacing

### Container Padding
```tsx
<div className="p-4 md:p-6">Content</div>
```

### Vertical Spacing
```tsx
<div className="space-y-4 md:space-y-6">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Gap in Flex/Grid
```tsx
<div className="flex gap-3 md:gap-4">
  <div>A</div>
  <div>B</div>
</div>
```

## 📱 Navigation

### Bottom Nav (Mobile-First)
```tsx
<nav className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 safe-area-inset-bottom">
  <div className="bg-white border-t md:border md:rounded-full px-2 py-2">
    <div className="flex justify-around md:gap-1">
      {items.map(item => (
        <button 
          key={item.id}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center px-3 py-2 rounded-xl md:rounded-full"
        >
          <Icon />
          <span className="text-[10px] md:text-xs">{item.label}</span>
        </button>
      ))}
    </div>
  </div>
</nav>
```

## 🪟 Modals → Bottom Sheets

### Use MobileBottomSheet Component
```tsx
import { MobileBottomSheet } from '@/components/ui/modals/MobileBottomSheet';

<MobileBottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  <div className="space-y-4">
    {/* Content */}
  </div>
</MobileBottomSheet>
```

## 📏 Typography

### Headings
```tsx
<h1 className="text-2xl md:text-3xl font-bold">Title</h1>
<h2 className="text-xl md:text-2xl font-bold">Subtitle</h2>
<h3 className="text-lg md:text-xl font-semibold">Section</h3>
```

### Body Text
```tsx
<p className="text-xs md:text-sm text-slate-600">Description</p>
<span className="text-sm md:text-base">Label</span>
```

## 🎭 Show/Hide Elements

### Hide on Mobile
```tsx
<div className="hidden md:block">Desktop Only</div>
```

### Hide on Desktop
```tsx
<div className="md:hidden">Mobile Only</div>
```

### Conditional Rendering
```tsx
<div className="block lg:hidden">Mobile/Tablet</div>
<div className="hidden lg:block">Desktop</div>
```

## 🖼️ Charts

### Responsive Height
```tsx
<div className="h-64 md:h-96">
  <Chart height={window.innerWidth < 768 ? 250 : 400} />
</div>
```

## 🔧 Utility Classes

### Safe Area (iPhone Notch)
```tsx
<div className="safe-area-inset-bottom">
  {/* Adds padding for iPhone home indicator */}
</div>
```

### Active States (Tactile Feedback)
```tsx
<button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800">
  Tap Me
</button>
```

### Prevent Text Selection (Buttons)
```tsx
<button className="select-none">Button</button>
```

## 🚨 Common Mistakes

### ❌ DON'T
```tsx
// Input too small (causes iOS zoom)
<input className="text-sm" />

// Touch target too small
<button className="p-1">X</button>

// Desktop-first
<div className="lg:flex-col flex-row">

// Fixed width on mobile
<div className="w-64">
```

### ✅ DO
```tsx
// 16px minimum
<input className="text-base" />

// 44px touch target
<button className="min-h-[44px] min-w-[44px] p-3">X</button>

// Mobile-first
<div className="flex-col lg:flex-row">

// Full width on mobile
<div className="w-full lg:w-64">
```

## 📱 Testing Commands

```bash
# Test on different viewports
# Chrome DevTools: Cmd+Shift+M (Mac) / Ctrl+Shift+M (Windows)

# Common breakpoints to test:
# 375px  - iPhone SE
# 390px  - iPhone 12/13
# 414px  - iPhone Pro Max
# 768px  - iPad
# 1024px - Desktop
# 1440px - Large Desktop
```

## 🎯 Checklist for New Components

- [ ] All inputs are `text-base` (16px)
- [ ] All buttons are `min-h-[44px]`
- [ ] Layout is `flex-col lg:flex-row`
- [ ] Grids are `grid-cols-1 md:grid-cols-*`
- [ ] Tables have mobile card view
- [ ] Buttons are `w-full md:w-auto`
- [ ] Spacing is `p-4 md:p-6`
- [ ] Typography scales: `text-2xl md:text-3xl`
- [ ] Active states for tactile feedback
- [ ] Safe area padding on bottom nav
