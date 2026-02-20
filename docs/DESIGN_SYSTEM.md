# 🎨 RekaSDA Pro Design System

## Overview

Sistem desain production-grade untuk aplikasi RekaSDA Pro dengan fokus pada keterbacaan data teknis, konsistensi UI, dan maintainability.

---

## 🎯 Prinsip Desain

### 1. **Clean & Clear**
- Background bersih (#F8FAFC)
- Whitespace yang cukup (sistem 8px)
- Kontras warna optimal untuk angka

### 2. **Consistency**
- Komponen reusable & modular
- Design tokens terpusat
- Layout seragam di semua halaman

### 3. **Production-Ready**
- TypeScript strict mode
- Props validation
- Error handling
- Accessibility compliant

---

## 🎨 Design Tokens

### Colors

```tsx
// Primary (Blue)
primary-50: #EFF6FF
primary-600: #2563EB  // Main action color
primary-700: #1D4ED8

// Accent (Cyan)
accent-500: #06B6D4
accent-600: #0891B2

// Neutral (Gray)
neutral-50: #F8FAFC   // Background
neutral-200: #E2E8F0  // Borders
neutral-700: #334155  // Text
```

### Typography

```tsx
Font: Plus Jakarta Sans
Sizes: xs(12px), sm(14px), base(16px), lg(18px), xl(20px)
Weights: normal(400), medium(500), semibold(600), bold(700)

// Tabular numbers untuk data
font-feature-settings: 'tnum' on, 'lnum' on
```

### Spacing (8px system)

```tsx
spacing-1: 8px
spacing-2: 16px
spacing-3: 24px
spacing-4: 32px
spacing-6: 48px
```

---

## 📦 Komponen

### 1. MainLayout

Layout utama dengan sidebar & header.

```tsx
import MainLayout from '@/components/layout/MainLayout';

<MainLayout title="Analisis Banjir">
  {/* Content */}
</MainLayout>
```

**Props:**
- `children`: ReactNode (required)
- `title`: string (optional) - Judul halaman

---

### 2. Card

Container untuk mengelompokkan konten.

```tsx
import { Card } from '@/components/ui';

<Card 
  title="Input Parameter"
  subtitle="Deskripsi singkat"
  action={<Button>Action</Button>}
>
  {/* Content */}
</Card>
```

**Props:**
- `children`: ReactNode (required)
- `title`: string
- `subtitle`: string
- `action`: ReactNode
- `className`: string

---

### 3. InputField

Input field dengan label, unit, dan validasi.

```tsx
import { InputField } from '@/components/ui';

<InputField
  label="Luas DAS"
  type="number"
  unit="ha"
  value={value}
  onChange={handleChange}
  error={error}
  helperText="Maksimal 5000 ha"
  required
/>
```

**Props:**
- `label`: string (required)
- `unit`: string - Satuan di sebelah kanan
- `error`: string - Pesan error
- `helperText`: string - Teks bantuan
- Semua props HTMLInputElement

---

### 4. DataTable

Tabel untuk menampilkan hasil perhitungan.

```tsx
import { DataTable } from '@/components/ui';

const columns = [
  { key: 'parameter', header: 'Parameter', align: 'left' },
  { 
    key: 'value', 
    header: 'Nilai', 
    align: 'right',
    render: (row) => row.value.toFixed(3)
  },
];

<DataTable
  caption="Hasil Perhitungan"
  columns={columns}
  data={results}
  striped
/>
```

**Props:**
- `columns`: Column[] (required)
- `data`: T[] (required)
- `caption`: string
- `striped`: boolean (default: true)

**Column Interface:**
```tsx
{
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T) => ReactNode;
}
```

---

### 5. Button

Tombol dengan berbagai varian.

```tsx
import { Button } from '@/components/ui';

<Button 
  variant="primary"
  size="md"
  onClick={handleClick}
  isLoading={loading}
>
  Hitung
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- Semua props HTMLButtonElement

---

## 🏗️ Struktur File

```
src/
├── components/
│   ├── layout/
│   │   └── MainLayout.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── DataTable.tsx
│       ├── InputField.tsx
│       └── index.ts
├── pages/
│   └── ExamplePage.tsx
└── styles/
    └── design-tokens.css
```

---

## 📝 Best Practices

### 1. Pemisahan Concerns

```tsx
// ❌ Jangan campur UI dengan logika
function AnalysisPage() {
  return (
    <div>
      <input onChange={(e) => {
        const value = parseFloat(e.target.value);
        const result = complexCalculation(value);
        setResult(result);
      }} />
    </div>
  );
}

// ✅ Pisahkan logika dari UI
function AnalysisPage() {
  const { formData, results, handleCalculate } = useAnalysisLogic();
  
  return (
    <Card>
      <InputField value={formData.area} onChange={handleInputChange} />
      <Button onClick={handleCalculate}>Hitung</Button>
    </Card>
  );
}
```

### 2. Konsistensi Layout

```tsx
// ✅ Selalu gunakan MainLayout
<MainLayout title="Halaman Anda">
  <div className="space-y-6">
    <Card>{/* Form */}</Card>
    <DataTable>{/* Results */}</DataTable>
  </div>
</MainLayout>
```

### 3. Type Safety

```tsx
// ✅ Definisikan interface untuk data
interface CalculationResult {
  parameter: string;
  value: number;
  unit: string;
}

const [results, setResults] = useState<CalculationResult[]>([]);
```

---

## 🎨 Contoh Implementasi

Lihat `src/pages/ExamplePage.tsx` untuk contoh lengkap implementasi:
- Form input dengan validasi
- Perhitungan dengan loading state
- Tabel hasil dengan formatting
- Info card dengan icon

---

## 🔄 Update & Maintenance

### Menambah Komponen Baru

1. Buat file di `src/components/ui/`
2. Export di `src/components/ui/index.ts`
3. Ikuti pattern TypeScript + props interface
4. Gunakan design tokens dari Tailwind

### Modifikasi Design Tokens

Edit `tailwind.config.js` untuk perubahan global:
- Colors
- Spacing
- Typography
- Shadows

---

## ✅ Checklist Production

- [ ] TypeScript strict mode enabled
- [ ] Props validation dengan interface
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (ARIA labels)
- [ ] Consistent spacing (8px system)
- [ ] Tabular numbers untuk data numerik

---

**Built for Indonesian Water Resources Engineers** 💧
