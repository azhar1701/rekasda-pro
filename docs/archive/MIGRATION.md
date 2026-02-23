# 🔄 Panduan Migrasi Design System

## Status Integrasi

✅ **Design Tokens** - Terintegrasi di `index.css` dan `tailwind.config.js`  
✅ **Komponen UI** - Button, Card, DataTable, InputField sudah ada  
✅ **MainLayout** - Tersedia di `components/layout/MainLayout.tsx`  
⚠️ **App.tsx** - Masih menggunakan struktur lama

---

## Cara Menggunakan

### 1. Import Komponen

```tsx
// Cara baru (recommended)
import { Button, Card, InputField, DataTable } from '@/components/ui';
import MainLayout from '@/components/layout/MainLayout';

// Atau individual
import Button from '@/components/ui/Button';
```

### 2. Gunakan Design Tokens

```tsx
// Warna
className="bg-primary-600 text-white"
className="border-neutral-200 text-neutral-700"
className="bg-success text-white"

// Spacing (sistem 8px)
className="p-6 space-y-6"  // 48px padding, 48px gap
className="gap-4"          // 32px gap

// Typography
className="text-sm font-medium"
className="text-base font-semibold"
```

### 3. Contoh Migrasi Halaman

**Sebelum:**
```tsx
<div className="bg-white p-4 rounded">
  <h2>Title</h2>
  <input type="text" />
  <button>Submit</button>
</div>
```

**Sesudah:**
```tsx
<Card title="Title">
  <InputField label="Field" value={value} onChange={onChange} />
  <Button variant="primary">Submit</Button>
</Card>
```

---

## Komponen yang Sudah Siap

### Button
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Hitung
</Button>
```

### Card
```tsx
<Card title="Input Parameter" subtitle="Deskripsi">
  {/* Content */}
</Card>
```

### InputField
```tsx
<InputField
  label="Luas DAS"
  type="number"
  unit="ha"
  value={value}
  onChange={onChange}
  required
/>
```

### DataTable
```tsx
<DataTable
  caption="Hasil Perhitungan"
  columns={columns}
  data={results}
/>
```

### MainLayout
```tsx
<MainLayout title="Analisis Banjir">
  <div className="space-y-6">
    <Card>{/* Form */}</Card>
    <DataTable>{/* Results */}</DataTable>
  </div>
</MainLayout>
```

---

## Langkah Migrasi Bertahap

1. ✅ Design tokens sudah aktif
2. ✅ Komponen UI sudah tersedia
3. 🔄 Migrasi halaman satu per satu:
   - Ganti `<div>` dengan `<Card>`
   - Ganti `<input>` dengan `<InputField>`
   - Ganti `<button>` dengan `<Button>`
   - Ganti `<table>` dengan `<DataTable>`
4. 🔄 Wrap dengan `<MainLayout>` untuk konsistensi

---

## Contoh Lengkap

Lihat `src/pages/ExamplePage.tsx` untuk implementasi lengkap.
