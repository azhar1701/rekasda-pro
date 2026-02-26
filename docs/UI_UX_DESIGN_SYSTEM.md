# 📘 UI/UX DESIGN SYSTEM - EMBUNG STANDARD

## 🎯 Prinsip Desain

**"Clean & Clear"** - Setiap modul harus mengikuti standar visual Embung Dashboard

---

## 🎨 Design Tokens

### 1. Layout Structure

#### Container Utama
```tsx
<div className="w-full h-full flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[85vh]">
```

#### Header Section
```tsx
<PageHeader 
  title="Judul Modul"
  subtitle="Deskripsi singkat"
  icon={IconComponent}
  iconColor="bg-teal-50 text-teal-600"
/>
```

#### Content Area
```tsx
<div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
  {/* Content */}
</div>
```

---

## 🧩 Komponen Standar

### 1. PageHeader
**File**: `src/components/ui/layout/PageHeader.tsx`

**Usage**:
```tsx
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { CloudRain } from 'lucide-react';

<PageHeader
  title="Analisis Banjir Rencana"
  subtitle="Perhitungan debit banjir berdasarkan SNI 2415:2016"
  icon={CloudRain}
  iconColor="bg-blue-50 text-blue-600"
  actions={
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
      Export PDF
    </button>
  }
/>
```

**Icon Colors**:
- Teal: `bg-teal-50 text-teal-600` (Embung, Water)
- Blue: `bg-blue-50 text-blue-600` (Flood, Rain)
- Purple: `bg-purple-50 text-purple-600` (Frequency Analysis)
- Green: `bg-green-50 text-green-600` (Water Balance)
- Orange: `bg-orange-50 text-orange-600` (Channel)

---

### 2. StandardCard
**File**: `src/components/ui/layout/StandardCard.tsx`

**Usage**:
```tsx
import { StandardCard } from '@/components/ui/layout/StandardCard';

<StandardCard
  title="Parameter Input"
  subtitle="Masukkan data perhitungan"
  actions={
    <button className="text-sm text-blue-600">Reset</button>
  }
>
  {/* Form content */}
</StandardCard>
```

**Variants**:
```tsx
// No padding (for tables)
<StandardCard noPadding>
  <table>...</table>
</StandardCard>

// No header
<StandardCard>
  <p>Simple content</p>
</StandardCard>
```

---

### 3. InputReadonly (SSOT)
**File**: `src/components/ui/forms/InputReadonly.tsx`

**Usage**:
```tsx
import { InputReadonly } from '@/components/ui/forms/InputReadonly';

<InputReadonly
  label="Luas DAS"
  value={125.5}
  unit="km²"
  source="Master Data Morfometri"
/>
```

**Features**:
- 🔒 Lock icon (read-only indicator)
- Gray background (`bg-slate-50`)
- Source attribution
- Cursor not-allowed

---

### 4. DataPanel & ResultPanel
**File**: `src/components/ui/layout/Panels.tsx`

**Usage**:
```tsx
import { DataPanel, ResultPanel } from '@/components/ui/layout/Panels';

// Grid Layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <DataPanel>
    <StandardCard title="Input">
      {/* Forms */}
    </StandardCard>
  </DataPanel>
  
  <ResultPanel>
    <StandardCard title="Hasil">
      {/* Charts/Tables */}
    </StandardCard>
  </ResultPanel>
</div>
```

---

### 5. ScrollableTable
**File**: `src/components/ui/layout/ScrollableTable.tsx`

**Usage**:
```tsx
import { ScrollableTable, StickyHeaderTable } from '@/components/ui/layout/ScrollableTable';

<ScrollableTable maxHeight="max-h-[500px]">
  <StickyHeaderTable headers={['Tahun', 'Hujan', 'Status']}>
    {data.map(row => (
      <tr key={row.id}>
        <td className="px-4 py-3">{row.year}</td>
        <td className="px-4 py-3">{row.rain}</td>
        <td className="px-4 py-3">{row.status}</td>
      </tr>
    ))}
  </StickyHeaderTable>
</ScrollableTable>
```

**Features**:
- Sticky header (stays visible on scroll)
- Max height constraint
- Horizontal scroll for wide tables
- Zebra striping (`divide-y divide-slate-100`)

---

## 🎨 Color Palette

### Background
```css
bg-slate-50    /* Page background */
bg-white       /* Card background */
bg-slate-100   /* Disabled state */
```

### Borders
```css
border-slate-200  /* Default border */
border-slate-300  /* Input border */
```

### Text
```css
text-slate-900  /* Primary text (headings) */
text-slate-700  /* Secondary text (labels) */
text-slate-500  /* Tertiary text (descriptions) */
text-slate-400  /* Disabled text */
```

### Accent Colors
```css
/* Teal (Primary) */
bg-teal-50 text-teal-600 border-teal-200

/* Blue (Info) */
bg-blue-50 text-blue-600 border-blue-200

/* Green (Success) */
bg-green-50 text-green-600 border-green-200

/* Yellow (Warning) */
bg-yellow-50 text-yellow-600 border-yellow-200

/* Red (Error) */
bg-red-50 text-red-600 border-red-200
```

---

## 📐 Spacing System

### Padding
```css
p-4 sm:p-6     /* Content area */
px-6 py-5      /* Header */
px-4 py-2.5    /* Buttons/Tabs */
p-6            /* Card content */
```

### Gap
```css
gap-1   /* Tight (tabs) */
gap-2   /* Small (inline elements) */
gap-3   /* Medium (header) */
gap-4   /* Large (cards) */
gap-6   /* XL (sections) */
```

### Border Radius
```css
rounded-lg   /* Small (8px) - buttons, inputs */
rounded-xl   /* Medium (12px) - cards, tabs */
rounded-2xl  /* Large (16px) - page container */
```

---

## 🔄 State Patterns

### Loading State
```tsx
{isLoading && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
  </div>
)}
```

### Empty State
```tsx
{data.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Data</h3>
    <p className="text-sm text-slate-500 max-w-sm">
      Lengkapi data prasyarat terlebih dahulu
    </p>
  </div>
)}
```

### Error State
```tsx
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-red-900">Error Message</p>
      <p className="text-xs text-red-700 mt-1">Error details</p>
    </div>
  </div>
</div>
```

---

## 🎯 Button Patterns

### Primary Action
```tsx
<button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition-colors">
  Hitung
</button>
```

### Secondary Action
```tsx
<button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
  Reset
</button>
```

### Disabled State
```tsx
<button 
  disabled
  className="px-6 py-3 bg-slate-300 text-slate-500 font-semibold rounded-lg cursor-not-allowed"
>
  Menunggu Data...
</button>
```

---

## 📊 Tab Navigation (Embung Style)

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList className="w-full justify-start p-1 bg-slate-200/50 rounded-xl mb-6 flex-wrap h-auto gap-1">
    <TabsTrigger
      value="tab1"
      className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold text-slate-600 px-4 py-2.5 transition-all"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>Tab 1</span>
      </div>
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="tab1">
    {/* Content */}
  </TabsContent>
</Tabs>
```

---

## ✅ Checklist Standarisasi

Setiap modul HARUS memiliki:

- [ ] PageHeader dengan icon dan subtitle
- [ ] Container dengan `bg-slate-50 rounded-2xl border`
- [ ] StandardCard untuk grouping konten
- [ ] InputReadonly untuk data SSOT
- [ ] ScrollableTable untuk tabel panjang
- [ ] Loading/Empty/Error states
- [ ] Consistent spacing (p-4 sm:p-6)
- [ ] Consistent colors (slate + accent)
- [ ] Responsive grid (grid-cols-1 lg:grid-cols-2)

---

## 🚀 Migration Guide

### Before (Old Style)
```tsx
<div className="p-4">
  <h2 className="text-2xl font-bold mb-4">Title</h2>
  <div className="bg-white p-6 rounded shadow">
    {/* Content */}
  </div>
</div>
```

### After (Embung Standard)
```tsx
<div className="w-full h-full flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[85vh]">
  <PageHeader
    title="Title"
    subtitle="Description"
    icon={Icon}
  />
  <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
    <StandardCard>
      {/* Content */}
    </StandardCard>
  </div>
</div>
```

---

**Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Standard**: Embung Dashboard
