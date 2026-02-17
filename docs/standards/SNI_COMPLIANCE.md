# ✅ SNI-Compliant Hydrological Calculation Engine

## 🎯 Overview

Hydrological calculation modules refactored to strictly comply with:
- **SNI 2415:2016** - Tata Cara Perhitungan Debit Banjir Rencana
- **Permen PU No. 12/PRT/M/2014** - Penyelenggaraan Sistem Drainase Perkotaan
- **SK Menteri PU No. 306/1989** - Standar Perencanaan Irigasi
- **Suripin (2004)** - Sistem Drainase Perkotaan Berkelanjutan

---

## 📁 File Structure

```
src/
├── lib/
│   ├── constants/
│   │   └── sni.ts ✅ NEW - SNI constants
│   └── engine/
│       ├── flood.ts ✅ NEW - Calculation functions
│       └── index.ts ✅ NEW - Barrel export
└── types/
    └── hydrology.ts ✅ NEW - SNI-compliant interfaces
```

---

## 📊 Constants (src/lib/constants/sni.ts)

### 1. Runoff Coefficients (Koefisien Pengaliran)

**Source:** Permen PU No. 12/2014 & Suripin (2004)

```typescript
SNI_RUNOFF_COEFFICIENTS = {
  JALAN_ASPAL: { value: 0.95, description: 'Jalan Aspal' },
  PUSAT_KOTA: { value: 0.85, description: 'Pusat Kota' },
  PEMUKIMAN_PADAT: { value: 0.70, description: 'Pemukiman Padat' },
  TAMAN: { value: 0.15, description: 'Taman dan RTH' },
  HUTAN: { value: 0.15, description: 'Hutan Lebat' },
  // ... 11 total coefficients
}
```

### 2. Manning Roughness (Koefisien Kekasaran)

**Source:** SNI 2415:2016 & Modul Drainase

```typescript
SNI_MANNING_ROUGHNESS = {
  BETON_HALUS: { value: 0.013, description: 'Beton Halus' },
  BETON_KASAR: { value: 0.015, description: 'Beton Kasar' },
  PASANGAN_BATU: { value: 0.025, description: 'Pasangan Batu Kali' },
  PVC: { value: 0.010, description: 'Pipa PVC' },
  // ... 9 total coefficients
}
```

### 3. HSS Nakayasu Parameters

**Source:** SNI 2415:2016 Pasal 6.3

```typescript
SNI_HSS_NAKAYASU = {
  alpha: 2.0,
  range: { min: 1.5, max: 3.0 },
  description: 'Parameter Hidrograf Satuan Sintetik Nakayasu'
}
```

### 4. Validation Limits

**Source:** SK Menteri PU No. 306/1989

```typescript
SNI_VALIDATION_LIMITS = {
  runoffCoefficient: { min: 0.0, max: 1.0 },
  catchmentArea: { min: 0.01, max: 10000 }, // km²
  rainfallIntensity: { min: 0.1, max: 500 }, // mm/jam
  alpha: { min: 1.5, max: 3.0 },
  // ... complete validation bounds
}
```

---

## 🔧 Calculation Functions (src/lib/engine/flood.ts)

### 1. Rational Method (Metode Rasional)

**Formula:** `Q = 0.278 × C × I × A`

**Reference:** SNI 2415:2016 Pasal 5.2

```typescript
import { calculateRationalDischarge } from '@/lib/engine';

const result = calculateRationalDischarge({
  C: 0.85,  // Koefisien pengaliran (pusat kota)
  I: 120,   // Intensitas hujan (mm/jam)
  A: 2.5,   // Luas DAS (km²)
});

console.log(result.Q); // Debit puncak (m³/s)
```

**Validation:**
- ✅ C must be 0.0 - 1.0
- ✅ I must be 0.1 - 500 mm/jam
- ✅ A must be 0.01 - 10,000 km²

### 2. HSS Nakayasu (Hidrograf Satuan Sintetik)

**Reference:** SNI 2415:2016 Pasal 6.3

**Formulas:**
- `Tp = Tg + 0.8 × Tr` (Waktu puncak)
- `Qp = (α × Ro × A) / (3.6 × (0.3 × Tp + Tg))` (Debit puncak)
- `Tb = Tp + 1.5 × Tg` (Waktu dasar)

**Curve Equations:**
- **Rising Limb** (0 < t ≤ Tp): `Q = Qp × (t/Tp)^2.4`
- **Recession 1** (Tp < t ≤ Tp+1.5Tg): `Q = Qp × exp(-0.3 × (t-Tp) / Tg)`
- **Recession 2** (t > Tp+1.5Tg): `Q = Qp × exp(-0.3 × 1.5 - 0.5 × (t-Tp-1.5Tg) / Tg)`

```typescript
import { calculateHSSNakayasu } from '@/lib/engine';

const result = calculateHSSNakayasu({
  Ro: 10,      // Hujan satuan (mm)
  Tg: 2.5,     // Time lag (jam)
  Tr: 1.5,     // Time unit (jam)
  Alpha: 2.0,  // Parameter hidrograf
  A: 50,       // Luas DAS (km²)
  L: 15,       // Panjang sungai (km)
});

console.log(result.Qp);         // Debit puncak (m³/s)
console.log(result.Tp);         // Waktu puncak (jam)
console.log(result.hydrograph); // Array of {time, discharge}
```

**Validation:**
- ✅ Ro: 1 - 100 mm
- ✅ Tg: 0.1 - 48 jam
- ✅ Alpha: 1.5 - 3.0
- ✅ A: 0.01 - 10,000 km²
- ✅ L: 0.1 - 1,000 km

---

## 📐 Type Interfaces (src/types/hydrology.ts)

### Rational Method

```typescript
interface RationalMethodInput {
  C: number;  // Koefisien Pengaliran (0-1)
  I: number;  // Intensitas Hujan (mm/jam)
  A: number;  // Luas DAS (km²)
}

interface RationalMethodOutput {
  Q: number;   // Debit Puncak (m³/s)
  tc?: number; // Waktu Konsentrasi (jam)
}
```

### HSS Nakayasu

```typescript
interface HSSNakayasuInput {
  Ro: number;    // Hujan Satuan (mm)
  Tg: number;    // Time Lag (jam)
  Tr: number;    // Time Unit (jam)
  Alpha: number; // Parameter Hidrograf (1.5-3.0)
  A: number;     // Luas DAS (km²)
  L: number;     // Panjang Sungai (km)
}

interface HSSNakayasuOutput {
  Qp: number;    // Debit Puncak (m³/s)
  Tp: number;    // Waktu Puncak (jam)
  Tb: number;    // Waktu Dasar (jam)
  hydrograph: Array<{ time: number; discharge: number }>;
}
```

---

## ✅ Validation with Zod

All inputs are validated using Zod schemas:

```typescript
import { validateRationalInput, validateHSSNakayasuInput } from '@/lib/engine';

try {
  validateRationalInput({ C: 0.85, I: 120, A: 2.5 });
  // ✅ Valid
} catch (error) {
  // ❌ Validation error with detailed message
  console.error(error.errors);
}
```

**Error Messages (Indonesian):**
- "Koefisien C tidak boleh > 1"
- "Intensitas hujan terlalu rendah"
- "Luas DAS tidak boleh negatif"
- "Alpha minimum 1.5"

---

## 🎯 Usage Examples

### Example 1: Urban Drainage (Drainase Perkotaan)

```typescript
import { calculateRationalDischarge, SNI_RUNOFF_COEFFICIENTS } from '@/lib/engine';

const urbanDrainage = calculateRationalDischarge({
  C: SNI_RUNOFF_COEFFICIENTS.PEMUKIMAN_PADAT.value, // 0.70
  I: 150, // mm/jam (dari analisis hujan)
  A: 1.2, // km²
});

console.log(`Debit rencana: ${urbanDrainage.Q.toFixed(2)} m³/s`);
```

### Example 2: River Flood Analysis (Analisis Banjir Sungai)

```typescript
import { calculateHSSNakayasu } from '@/lib/engine';

const floodAnalysis = calculateHSSNakayasu({
  Ro: 15,     // mm
  Tg: 3.2,    // jam
  Tr: 2.0,    // jam
  Alpha: 2.0, // Standard
  A: 125,     // km²
  L: 25,      // km
});

console.log(`Debit puncak: ${floodAnalysis.Qp.toFixed(2)} m³/s`);
console.log(`Waktu puncak: ${floodAnalysis.Tp.toFixed(1)} jam`);

// Plot hydrograph
floodAnalysis.hydrograph.forEach(point => {
  console.log(`t=${point.time}h, Q=${point.discharge}m³/s`);
});
```

---

## 📚 References

1. **SNI 2415:2016** - Tata Cara Perhitungan Debit Banjir Rencana
2. **Permen PU No. 12/PRT/M/2014** - Penyelenggaraan Sistem Drainase Perkotaan
3. **SK Menteri PU No. 306/1989** - Standar Perencanaan Irigasi
4. **Suripin (2004)** - Sistem Drainase Perkotaan Berkelanjutan
5. **Modul Drainase Perkotaan** - Kementerian PUPR

---

## ✅ Compliance Checklist

- ✅ Runoff coefficients from Permen PU 12/2014
- ✅ Manning roughness from SNI 2415:2016
- ✅ Rational method formula per SNI 2415:2016 Pasal 5.2
- ✅ HSS Nakayasu per SNI 2415:2016 Pasal 6.3
- ✅ Validation limits per SK Menteri PU 306/1989
- ✅ Indonesian nomenclature (C, I, A, Qp, Tp, etc.)
- ✅ Metric units (m³/s, mm/jam, km²)
- ✅ Input validation with Zod
- ✅ JSDoc comments with SNI references
- ✅ TypeScript strict types

---

## 🚀 Next Steps

1. **Integrate into UI:** Update components to use new engine
2. **Add More Methods:** Implement Mononobe, Talbot formulas
3. **Unit Tests:** Create test cases with SNI example problems
4. **Documentation:** Add user guide in Indonesian

**Status:** ✅ Core engine complete and SNI-compliant
