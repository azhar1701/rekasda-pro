# 🎨 RekaSDA Pro Design System

**Production-Grade Design System untuk Aplikasi Hidrologi**

---

## 📋 Status Implementasi

- ✅ **TAHAP 1:** Color Palette (Blue Gradient) - SELESAI
- ✅ **TAHAP 2:** Tipografi & Tabular Numbers - SELESAI
- ✅ **TAHAP 3:** Button Component & Iconography - SELESAI
- ⏳ **TAHAP 4:** Refactoring Berbasis Gold Standard

---

## 🎨 TAHAP 1: Color Palette (Blue Gradient)

### Neutral - Blue-gray Spectrum
```css
neutral-50:  #F0F9FF  /* Background utama (blue tint) */
neutral-100: #E0F2FE  /* Background sekunder */
neutral-200: #BAE6FD  /* Border */
neutral-500: #0EA5E9  /* Label/teks sekunder */
neutral-800: #075985  /* Teks utama */
```

### Primary - Professional Blue
```css
primary-600: #2563EB  /* Default */
primary-700: #1D4ED8  /* Hover */
```

### Semantic Colors
```css
success: #10B981  /* Hijau lembut */
error:   #DC2626  /* Merah bata */
warning: #F59E0B  /* Kuning pastel */
```

---

## 📐 TAHAP 2: Standarisasi Tipografi

### Aturan Mutlak: Tabular Numbers

**SETIAP elemen yang menampilkan angka WAJIB menggunakan:**

```tsx
className="tabular-nums tracking-tight"
```

### Implementasi Global

**1. CSS Global (Otomatis)**
```css
/* src/styles/index.css */
input[type="number"],
.numeric,
.tabular {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' on, 'lnum' on;
}
```

**2. Manual untuk Display Numbers**
```tsx
// ✅ BENAR - Angka sejajar vertikal
<span className="text-3xl font-bold tabular-nums tracking-tight">
  {results.avgBalance}
</span>

// ❌ SALAH - Angka tidak sejajar
<span className="text-3xl font-bold">
  {results.avgBalance}
</span>
```

### File yang Sudah Di-refactor

- ✅ `StatCard.tsx` - Semua angka statistik
- ✅ `DataInputTable.tsx` - Input tahun & hujan
- ✅ `WaterBalanceAnalysis.tsx` - Semua metric & input bulanan
- ✅ `FrequencyAnalysisSummary.tsx` - Ringkasan analisis

### Checklist Implementasi

Untuk SETIAP komponen baru yang menampilkan angka:

- [ ] Tabel data → `tabular-nums tracking-tight`
- [ ] Input number → Otomatis via CSS global
- [ ] Display metrics → `tabular-nums tracking-tight`
- [ ] Koordinat → `tabular-nums tracking-tight`
- [ ] Hasil perhitungan → `tabular-nums tracking-tight`
- [ ] Probabilitas → `tabular-nums tracking-tight`

---

## 🎯 TAHAP 3: Button Component & Iconography

### Button Variants

```tsx
import { Button } from '@/components/ui/Button';
import { Save, Trash2, Download } from 'lucide-react';

// Primary (default)
<Button variant="primary">
  <Save />
  Hitung Debit
</Button>

// Secondary (outline)
<Button variant="secondary">
  <Download />
  Export Excel
</Button>

// Ghost (transparent)
<Button variant="ghost" size="sm">Batal</Button>

// Danger (destructive)
<Button variant="danger">
  <Trash2 />
  Hapus Data
</Button>
```

### Iconography Rules

**HANYA gunakan `lucide-react`:**

```tsx
// ✅ BENAR
import { Save, Download, Trash2, Plus } from 'lucide-react';

// ❌ SALAH
import { FaSave } from 'react-icons/fa';
import SaveIcon from '@mui/icons-material/Save';
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>      // h-8, text-xs
<Button size="default">Default</Button> // h-10, text-sm (default)
<Button size="lg">Large</Button>      // h-12, text-base
```

### File Locations

- **Primary:** `src/components/ui/Button.tsx` (shadcn/ui)
- **Legacy:** `src/components/ui/forms/Button.tsx` (synced)

**Dokumentasi lengkap:** `docs/BUTTON_COMPONENT.md`

---

## 🎯 Contoh Penggunaan

### Tabel Data
```tsx
<td className="px-3 py-2 tabular-nums tracking-tight">
  {row.rainfall.toFixed(2)}
</td>
```

### Metric Cards
```tsx
<div className="text-2xl font-bold tabular-nums tracking-tight">
  {statistics.mean.toFixed(2)}
</div>
```

### Input Fields
```tsx
<input 
  type="number" 
  className="tabular-nums tracking-tight"
  // CSS global sudah handle, tapi explicit lebih baik
/>
```

---

## 📐 Prinsip Design

1. **Alignment is King** - Angka harus sejajar vertikal seperti Excel
2. **Consistency** - Semua angka menggunakan font yang sama
3. **Readability** - `tracking-tight` untuk angka desimal panjang
4. **Accessibility** - Font size minimum 14px untuk angka
5. **Icon Unity** - Hanya lucide-react, tidak ada library lain
6. **Color Harmony** - Blue gradient untuk eye-comfort

---

**Status:** TAHAP 1-3 SELESAI ✅  
**Next:** TAHAP 4 - Refactoring berbasis ModulEmbung.jsx
