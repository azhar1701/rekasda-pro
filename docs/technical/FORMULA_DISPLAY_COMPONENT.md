# FormulaDisplay Component

## Overview

Komponen UI untuk menampilkan keterangan rumus persamaan pada setiap metode empiris perhitungan debit banjir rencana.

## Lokasi File

`src/components/ui/data-display/FormulaDisplay.tsx`

## Fitur

### 1. Tampilan Rumus Utama
- Formula matematika dalam format code block
- Background berwarna untuk highlight
- Font monospace untuk keterbacaan

### 2. Rumus Pendukung (Sub-formulas)
- Ditampilkan untuk metode yang memiliki perhitungan tambahan
- Haspers: α dan β
- der Weduwen: α dan β
- Melchior: α, β, dan t

### 3. Keterangan Parameter
- Simbol parameter
- Deskripsi lengkap
- Satuan pengukuran
- Format tabel yang rapi

### 4. Informasi Tambahan
- Rentang validitas (luas DAS)
- Referensi standar/literatur
- Visual badge untuk identifikasi cepat

## Metode yang Didukung

### 1. Rasional
```
Q = 0.278 × C × I × A
```
- **Parameter**: C, I, A
- **Rentang**: A ≤ 3 km²
- **Referensi**: SNI 2415:2016 Pasal 5.2

### 2. Haspers & Osugi
```
Q = α × β × A^0.75 × I
α = C × (100 + A) / (100 + 1.5A)
β = 120 / (120 + L/√S)
```
- **Parameter**: A, L, S, I, α, β
- **Rentang**: 3 km² < A ≤ 100 km²
- **Referensi**: Haspers (1935), Osugi (1940)

### 3. der Weduwen
```
Q = α × β × A^0.70 × I
α = C × (120 + A) / (120 + 2A)
β = 120 / (120 + 1.5L/√S)
```
- **Parameter**: A, L, S, I, α, β
- **Rentang**: 3 km² < A ≤ 100 km² (pegunungan)
- **Referensi**: der Weduwen (1951)

### 4. Melchior
```
Q = α × β × C × A^0.8 × I
α = (200 + A) / (200 + 3A)
β = 120 / (120 + 2L/√S)
t = 0.1 × L / √S
```
- **Parameter**: C, A, L, S, I, α, β, t
- **Rentang**: A > 100 km²
- **Referensi**: Melchior (1960)

## Integrasi

### Di PeakDischargeCalculator
```typescript
import { FormulaDisplay } from '@/components/ui/data-display/FormulaDisplay';

// Dalam render
<FormulaDisplay method={method} />
```

### Props
```typescript
interface FormulaDisplayProps {
  method: 'rational' | 'haspers' | 'weduwen' | 'melchior';
}
```

## Styling

### Color Scheme
- **Background**: Gradient blue-50 to indigo-50
- **Border**: Blue-200
- **Text**: Blue-900 (heading), Blue-700 (body)
- **Code**: Blue-900 on blue-50 background
- **Icon**: White on blue-600

### Responsive
- Padding: 4-5 (mobile-desktop)
- Font size: xs-base (mobile-desktop)
- Grid layout untuk parameter

## Manfaat

1. **Edukasi**: User memahami formula yang digunakan
2. **Transparansi**: Perhitungan tidak black-box
3. **Referensi**: Standar dan literatur tercantum
4. **Validasi**: User dapat cross-check manual
5. **Compliance**: Menunjukkan kepatuhan SNI

## Build Impact

- **Size**: +4.89 kB (ui-components: 262.03 → 266.92 kB)
- **CSS**: +0.15 kB (69.51 → 69.66 kB)
- **Total**: 697.97 kB

## Screenshot Contoh

### Metode Rasional
```
┌─────────────────────────────────────┐
│ ℹ️  Metode Rasional                 │
│    Rentang Valid: A ≤ 3 km²         │
├─────────────────────────────────────┤
│ Rumus Utama:                        │
│ ┌─────────────────────────────────┐ │
│ │ Q = 0.278 × C × I × A           │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Keterangan Parameter:               │
│ Q   = Debit puncak        (m³/s)    │
│ C   = Koefisien limpasan  (0-1)     │
│ I   = Intensitas hujan    (mm/jam)  │
│ A   = Luas DAS            (km²)     │
│ 0.278 = Faktor konversi   (-)       │
├─────────────────────────────────────┤
│ Referensi: SNI 2415:2016 Pasal 5.2 │
└─────────────────────────────────────┘
```

### Metode Haspers
```
┌─────────────────────────────────────┐
│ ℹ️  Metode Haspers & Osugi          │
│    Rentang Valid: 3-100 km²         │
├─────────────────────────────────────┤
│ Rumus Utama:                        │
│ ┌─────────────────────────────────┐ │
│ │ Q = α × β × A^0.75 × I          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Rumus Pendukung:                    │
│ ┌─────────────────────────────────┐ │
│ │ α = C × (100+A)/(100+1.5A)      │ │
│ │ β = 120/(120+L/√S)              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Keterangan Parameter:               │
│ Q = Debit puncak          (m³/s)    │
│ A = Luas DAS              (km²)     │
│ L = Panjang sungai        (km)      │
│ S = Kemiringan            (desimal) │
│ I = Intensitas hujan      (mm/jam)  │
│ α = Koefisien reduksi     (-)       │
│ β = Koefisien waktu       (-)       │
├─────────────────────────────────────┤
│ Referensi: Haspers (1935)           │
└─────────────────────────────────────┘
```

## Update Date

2025-01-XX - FormulaDisplay component created and integrated
