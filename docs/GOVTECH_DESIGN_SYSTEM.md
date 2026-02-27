# 🏛️ GovTech UI/UX - PUPR Official Design System

**Institutional & Official Design untuk RekaSDA Pro**

---

## 🎯 Design Philosophy

**"Institutional, Formal, High-Density, Clean & Clear"**

Mengadopsi identitas visual resmi Direktorat Jenderal Sumber Daya Air Kementerian PUPR untuk kredibilitas maksimal.

---

## 🎨 PUPR Official Colors

### Primary Colors
```css
pupr-blue: #0c3a66    /* Biru institusi PUPR */
pupr-yellow: #f2c114  /* Kuning aksen PUPR */
```

### System Colors
```css
pupr-surface: #f8fafc  /* Latar netral */
pupr-border: #e2e8f0   /* Border tegas */
pupr-text: #1e293b     /* Teks kontras tinggi */
```

---

## 📦 Components

### 1. ButtonGovTech

```tsx
import { ButtonGovTech } from '@/components/ui/ButtonGovTech';
import { Save, Download } from 'lucide-react';

// Primary PUPR (Biru institusi)
<ButtonGovTech variant="pupr-primary">
  <Save />
  Simpan Data
</ButtonGovTech>

// Accent PUPR (Kuning aksen)
<ButtonGovTech variant="pupr-accent">
  <Download />
  Export Laporan
</ButtonGovTech>

// Secondary (Outline)
<ButtonGovTech variant="secondary">
  Batal
</ButtonGovTech>
```

**Variants:**
- `pupr-primary` → Biru PUPR (#0c3a66), teks putih, border solid
- `pupr-accent` → Kuning PUPR (#f2c114), teks hitam tebal
- `secondary` → Border tegas, background putih
- `ghost` → Transparan, hover abu-abu
- `danger` → Merah untuk aksi destruktif

**Features:**
- ✅ `rounded-md` (formal, bukan rounded-xl)
- ✅ Hover tegas (opacity 90%, bukan shadow)
- ✅ Border solid untuk kredibilitas
- ✅ Font semibold untuk ketegasan

---

### 2. CardGovTech

```tsx
import { CardGovTech } from '@/components/ui/CardGovTech';

<CardGovTech 
  title="Data Hidrologi" 
  subtitle="Analisis Curah Hujan Maksimum"
  headerAction={<ButtonGovTech size="sm">Export</ButtonGovTech>}
>
  {/* Content */}
</CardGovTech>
```

**Features:**
- ✅ Background putih bersih
- ✅ Border `border-pupr-border` (#e2e8f0)
- ✅ Header dengan `bg-pupr-surface`
- ✅ Judul uppercase + tracking-wide (formal)
- ✅ `shadow-sm` (subtle, tidak berlebihan)
- ✅ `rounded-md` (tegas, bukan rounded-xl)

---

### 3. TableGovTech

```tsx
import { TableGovTech } from '@/components/ui/TableGovTech';

const columns = [
  { key: 'tahun', label: 'Tahun', align: 'left' },
  { key: 'hujan', label: 'Hujan (mm)', align: 'right', numeric: true },
  { key: 'status', label: 'Status', align: 'center' }
];

const data = [
  { tahun: '2023', hujan: 125.50, status: 'Valid' },
  { tahun: '2022', hujan: 98.75, status: 'Valid' }
];

<TableGovTech 
  columns={columns} 
  data={data}
  stickyHeader={true}
  zebraStripe={true}
/>
```

**Features:**
- ✅ Header `bg-pupr-blue text-white` sticky
- ✅ Zebra-striping (`even:bg-slate-50`)
- ✅ Border collapse untuk ketegasan
- ✅ Numeric columns dengan `tabular-nums tracking-tight`
- ✅ Hover effect untuk interaktivitas
- ✅ Border tegas `border-pupr-border`

---

### 4. WebGISContainer

```tsx
import { WebGISContainer } from '@/components/ui/WebGISContainer';

<WebGISContainer title="Peta DAS Citarum" height="h-[600px]">
  <LeafletMap />
</WebGISContainer>
```

**Features:**
- ✅ Border tebal `border-2 border-pupr-blue/20`
- ✅ Header biru PUPR dengan icon peta
- ✅ Overflow hidden untuk bingkai rapi
- ✅ Gaya dokumen resmi
- ✅ `rounded-md` konsisten

---

### 5. Skeleton Loading

```tsx
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton';

// Basic skeleton
<Skeleton height="20px" width="60%" />

// Table skeleton
<SkeletonTable rows={5} cols={4} />

// Card skeleton
<SkeletonCard />
```

**Features:**
- ✅ `animate-pulse bg-slate-200`
- ✅ `rounded-md` konsisten
- ✅ Variants: text, rectangular, circular
- ✅ Pre-built: SkeletonTable, SkeletonCard

---

## 📐 Typography Rules

### Data Numbers (WAJIB)
```tsx
// ✅ BENAR - Semua angka
<td className="tabular-nums tracking-tight font-medium">
  125.50
</td>

// ❌ SALAH
<td>125.50</td>
```

### Headings (Formal)
```tsx
// ✅ BENAR - Judul formal
<h3 className="text-base font-bold text-pupr-blue uppercase tracking-wide">
  Data Hidrologi
</h3>

// ❌ SALAH - Terlalu casual
<h3 className="text-lg font-semibold">Data Hidrologi</h3>
```

### Labels
```tsx
// ✅ BENAR - Label tegas
<p className="text-xs font-bold text-pupr-text/60 uppercase tracking-wider">
  Stasiun Hujan
</p>
```

---

## 🎨 Color Usage

### Primary Actions
```tsx
// ✅ Gunakan pupr-blue
<ButtonGovTech variant="pupr-primary">Simpan</ButtonGovTech>
<h3 className="text-pupr-blue">Judul</h3>
```

### Accent/Highlight
```tsx
// ✅ Gunakan pupr-yellow
<ButtonGovTech variant="pupr-accent">Export</ButtonGovTech>
<div className="bg-pupr-yellow/20 border border-pupr-yellow">Warning</div>
```

### Borders & Surfaces
```tsx
// ✅ Gunakan pupr-border & pupr-surface
<div className="border border-pupr-border bg-pupr-surface">
  Content
</div>
```

---

## 📊 Table Standards

### GovTech Table Pattern
```tsx
<div className="overflow-x-auto border border-pupr-border rounded-md">
  <table className="w-full border-collapse">
    <thead className="bg-pupr-blue text-white sticky top-0 z-10">
      <tr>
        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left">
          Tahun
        </th>
        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">
          Hujan (mm)
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="even:bg-slate-50 border-b border-pupr-border hover:bg-pupr-surface">
        <td className="px-4 py-2.5 text-sm text-pupr-text">2023</td>
        <td className="px-4 py-2.5 text-sm text-pupr-text text-right tabular-nums tracking-tight font-medium">
          125.50
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## ✅ Implementation Checklist

### Per Component
- [ ] Gunakan `ButtonGovTech` (bukan Button biasa)
- [ ] Gunakan `CardGovTech` (bukan Card biasa)
- [ ] Gunakan `TableGovTech` untuk tabel data
- [ ] Semua angka: `tabular-nums tracking-tight`
- [ ] Judul: `text-pupr-blue font-bold uppercase tracking-wide`
- [ ] Border: `border-pupr-border`
- [ ] Rounded: `rounded-md` (bukan xl)
- [ ] Loading: `Skeleton` components

### Per Page
- [ ] Header dengan icon PUPR blue
- [ ] Cards dengan CardGovTech
- [ ] Buttons dengan variant pupr-primary/pupr-accent
- [ ] Tables dengan sticky header + zebra stripe
- [ ] Numbers dengan tabular-nums
- [ ] Loading states dengan Skeleton

---

## 🚀 Migration Guide

### From Clean & Clear to GovTech

```tsx
// BEFORE (Clean & Clear)
import { Button } from '@/components/ui/Button';
<Button variant="primary">Save</Button>

// AFTER (GovTech)
import { ButtonGovTech } from '@/components/ui/ButtonGovTech';
<ButtonGovTech variant="pupr-primary">Save</ButtonGovTech>
```

```tsx
// BEFORE
<div className="bg-white border border-neutral-200 rounded-xl p-6">
  <h3 className="text-lg font-bold">Title</h3>
</div>

// AFTER
<CardGovTech title="Title">
  {/* Content */}
</CardGovTech>
```

---

## 📈 Benefits

### Before (Clean & Clear)
- ✅ Eye-comfort
- ✅ Professional
- ❌ Kurang formal
- ❌ Tidak ada identitas institusi

### After (GovTech PUPR)
- ✅ Eye-comfort
- ✅ Professional
- ✅ Formal & kredibel
- ✅ Identitas PUPR resmi
- ✅ High-density data
- ✅ Production-grade

---

**Status:** TAHAP 1-4 COMPLETE ✅  
**Applied:** ExecutiveDashboard.tsx  
**Next:** Apply to all modules
