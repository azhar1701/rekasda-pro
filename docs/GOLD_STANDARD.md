# 🏆 Gold Standard - Executive Dashboard

**Clean & Clear Design System untuk Professional Engineers**

---

## 🎯 Prinsip Design

### 1. **Clarity Over Decoration**
- ❌ Hapus glassmorphism (`backdrop-blur`, `bg-*/80`)
- ❌ Hapus gradient blur backgrounds
- ❌ Hapus rounded-3xl (terlalu bulat)
- ✅ Gunakan `border-neutral-200` solid
- ✅ Gunakan `rounded-xl` konsisten
- ✅ Gunakan `bg-white` untuk cards

### 2. **Professional Typography**
- ✅ `tabular-nums tracking-tight` untuk SEMUA angka
- ✅ Font size konsisten: `text-lg` (heading), `text-sm` (body)
- ✅ Font weight: `font-bold` (heading), `font-semibold` (subheading)
- ✅ Uppercase + tracking-wide untuk labels

### 3. **Neutral Color Palette**
- ✅ `neutral-900` → Teks utama
- ✅ `neutral-500` → Teks sekunder
- ✅ `neutral-200` → Border
- ✅ `neutral-100` → Background icon
- ✅ `neutral-50` → Background empty state

### 4. **Semantic Colors (Minimal)**
- ✅ `primary-600` → Primary actions
- ✅ `error` → Danger/flood data
- ✅ `success` → Success/feasibility
- ✅ `warning` → Warning/critical

### 5. **Spacing System**
- ✅ Gap: `gap-6` (24px) untuk grid
- ✅ Padding: `p-6` (24px) untuk cards
- ✅ Margin: `mb-4` (16px) untuk sections

---

## 📐 Layout Pattern

### Grid System
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* 3 equal columns on desktop */}
</div>
```

### Card Structure
```tsx
<div className="bg-white border border-neutral-200 rounded-xl p-6">
  <h2 className="text-lg font-bold text-neutral-900 mb-4">Title</h2>
  {/* Content */}
</div>
```

### Icon Container
```tsx
<div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
  <Icon className="w-5 h-5 text-neutral-600" />
</div>
```

### Metric Display
```tsx
<p className="text-4xl font-bold text-neutral-900 tabular-nums tracking-tight mb-2">
  {value}
</p>
<p className="text-sm font-semibold text-neutral-500">
  Unit · Label
</p>
```

---

## 🎨 Component Patterns

### 1. Info Card with Icon
```tsx
<div className="flex items-start gap-3">
  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
    <MapPin className="w-5 h-5 text-neutral-600" />
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

### 2. Metric Card with Header
```tsx
<div className="bg-white border border-neutral-200 rounded-xl p-6">
  <div className="flex items-center gap-2 mb-4">
    <div className="p-2 bg-primary-50 rounded-lg">
      <Icon className="w-4 h-4 text-primary-600" />
    </div>
    <h3 className="text-lg font-bold text-neutral-900">Title</h3>
  </div>
  <div className="mt-6">
    <p className="text-4xl font-bold text-neutral-900 tabular-nums tracking-tight mb-2">
      {value}
    </p>
    <p className="text-sm font-semibold text-neutral-500">Unit · Label</p>
  </div>
</div>
```

### 3. Badge/Pill
```tsx
<div className="flex items-center gap-2 px-3 py-1.5 bg-warning-light border border-warning rounded-lg">
  <Calendar className="w-4 h-4 text-warning-dark" />
  <span className="text-xs font-semibold text-warning-dark uppercase tracking-wide">
    Label: Value
  </span>
</div>
```

### 4. Empty State
```tsx
<div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
  <AlertTriangle className="w-8 h-8 text-neutral-400 mb-2" />
  <p className="text-sm font-medium text-neutral-500">Message</p>
</div>
```

---

## 📊 Chart Styling

### Recharts Configuration
```tsx
<BarChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
  <CartesianGrid 
    strokeDasharray="3 3" 
    vertical={false} 
    stroke="#E0F2FE"  // neutral-200 equivalent
  />
  <XAxis 
    axisLine={false} 
    tickLine={false} 
    tick={{ fontSize: 12, fill: '#0EA5E9' }}  // neutral-500
  />
  <YAxis 
    axisLine={false} 
    tickLine={false} 
    tick={{ fontSize: 12, fill: '#0EA5E9' }}
  />
  <Tooltip
    cursor={{ fill: '#F0F9FF' }}  // neutral-50
    contentStyle={{ 
      borderRadius: '8px', 
      border: '1px solid #BAE6FD',  // neutral-200
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
    }}
  />
  <Bar 
    dataKey="value" 
    fill="#2563EB"  // primary-600
    radius={[4, 4, 0, 0]} 
    barSize={24} 
  />
</BarChart>
```

---

## ✅ Checklist Refactoring

Untuk setiap file yang di-refactor:

- [ ] Hapus `backdrop-blur`, `bg-*/80`, `bg-*/50`
- [ ] Ganti `rounded-3xl` → `rounded-xl`
- [ ] Ganti `rounded-full` (icon) → `rounded-lg`
- [ ] Ganti `border-slate-*` → `border-neutral-*`
- [ ] Ganti `text-slate-*` → `text-neutral-*`
- [ ] Tambahkan `tabular-nums tracking-tight` pada angka
- [ ] Gunakan Button dari Design System
- [ ] Gunakan lucide-react icons
- [ ] Spacing konsisten: `gap-6`, `p-6`, `mb-4`
- [ ] Font size konsisten: `text-lg`, `text-sm`, `text-xs`

---

## 🚫 Anti-Patterns

### ❌ JANGAN
```tsx
// Glassmorphism
<div className="bg-slate-50/80 backdrop-blur">

// Gradient blur
<div className="absolute ... bg-indigo-50 rounded-full blur-3xl">

// Terlalu bulat
<div className="rounded-3xl">

// Hardcoded colors
<button className="bg-indigo-600 hover:bg-indigo-700">

// Angka tanpa tabular-nums
<span className="text-3xl font-bold">{value}</span>
```

### ✅ LAKUKAN
```tsx
// Solid background
<div className="bg-white border border-neutral-200">

// No gradient blur (clean)

// Konsisten rounded
<div className="rounded-xl">

// Design System Button
<Button variant="primary">

// Tabular numbers
<span className="text-3xl font-bold tabular-nums tracking-tight">{value}</span>
```

---

**Status:** TAHAP 4 - Gold Standard Defined ✅  
**Next:** Apply to other modules
