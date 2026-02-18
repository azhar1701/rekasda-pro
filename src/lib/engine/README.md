# 🔧 Calculation Engine - REKASDA Pro

Modul perhitungan hidrologi yang telah dikalibrasi sesuai standar SNI.

---

## 📁 Struktur Modul

```
src/lib/engine/
├── flood.ts              # Metode Rasional & HSS Nakayasu
├── rainfall.ts           # Intensitas hujan & waktu konsentrasi
├── dependableFlow.ts     # Debit andalan (Q80)
├── validation.ts         # Validasi perhitungan
├── test.ts              # Test cases & verifikasi
└── index.ts             # Barrel export
```

---

## 🎯 Modul Perhitungan

### 1. Flood Analysis (`flood.ts`)

#### Metode Rasional
```typescript
import { calculateRationalDischarge } from '@/lib/engine';

const result = calculateRationalDischarge({
  C: 0.70,  // Koefisien pengaliran
  I: 120,   // Intensitas hujan (mm/jam)
  A: 2.5,   // Luas DAS (km²)
});

console.log(result.Q); // Debit puncak (m³/s)
```

**Referensi:** SNI 2415:2016 Pasal 5.2.1

#### HSS Nakayasu
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

console.log(result.Qp);         // Debit puncak
console.log(result.hydrograph); // Array {time, discharge}
```

**Referensi:** SNI 2415:2016 Pasal 6.3

---

### 2. Rainfall Intensity (`rainfall.ts`)

#### Intensitas Hujan - Mononobe
```typescript
import { calculateRainfallIntensity } from '@/lib/engine';

const result = calculateRainfallIntensity({
  R24: 100,           // Curah hujan 24 jam (mm)
  tc: 1.0,            // Durasi hujan (jam)
  method: 'mononobe', // Metode perhitungan
});

console.log(result.I); // Intensitas (mm/jam)
```

**Metode Tersedia:**
- `mononobe` - SNI 2415:2016 (Rekomendasi untuk Indonesia)
- `talbot` - Alternatif untuk data terbatas
- `sherman` - Untuk daerah tropis

#### Waktu Konsentrasi
```typescript
import { calculateTimeConcentration } from '@/lib/engine';

const Tc = calculateTimeConcentration({
  L: 1.5,            // Panjang aliran (km)
  S: 0.01,           // Kemiringan (m/m)
  method: 'kirpich', // Metode perhitungan
});

console.log(Tc); // Waktu konsentrasi (menit)
```

**Metode Tersedia:**
- `kirpich` - SNI 2415:2016 (Standard)
- `california` - Untuk DAS kecil perkotaan

---

### 3. Dependable Flow (`dependableFlow.ts`)

#### Debit Andalan (Q80)
```typescript
import { calculateDependableFlow } from '@/lib/engine';

const result = calculateDependableFlow({
  dischargeData: [15.2, 18.5, 22.3, ...], // Data debit (m³/s)
  probability: 80,                         // Probabilitas (%)
});

console.log(result.Q80);  // Debit andalan
console.log(result.Qavg); // Debit rata-rata
```

**Referensi:** SNI 6738:2015 Pasal 4.2

#### Flow Duration Curve
```typescript
import { calculateFlowDurationCurve } from '@/lib/engine';

const curve = calculateFlowDurationCurve(dischargeData);
// Returns: [{probability, discharge}, ...]
```

#### Validasi Ketersediaan Air
```typescript
import { validateWaterAvailability } from '@/lib/engine';

const validation = validateWaterAvailability(
  Q80,    // Debit andalan (m³/s)
  demand  // Kebutuhan air (m³/s)
);

console.log(validation.status);         // 'Aman' | 'Waspada' | 'Kritis'
console.log(validation.recommendation); // Rekomendasi
```

---

### 4. Validation (`validation.ts`)

#### Validasi Metode Rasional
```typescript
import { validateRationalMethod } from '@/lib/engine';

const validation = validateRationalMethod({
  C: 0.70,
  I: 120,
  A: 2.5,
  landUse: 'pemukiman-padat',
});

if (!validation.valid) {
  console.log('Errors:', validation.errors);
}
console.log('Warnings:', validation.warnings);
```

#### Validasi Manning
```typescript
import { validateManningCalculation } from '@/lib/engine';

const validation = validateManningCalculation({
  n: 0.013,
  S: 0.002,
  V: 2.5,
  Fr: 0.8,
  freeboard: 0.5,
  Q: 6.5,
  material: 'beton',
  channelType: 'primer',
});
```

#### Validasi HSS Nakayasu
```typescript
import { validateNakayasuParameters } from '@/lib/engine';

const validation = validateNakayasuParameters({
  Alpha: 2.0,
  Tg: 2.5,
  Tr: 1.5,
  A: 50,
});
```

---

## 🧪 Testing & Verifikasi

### Menjalankan Test
```typescript
import { runAllTests } from '@/lib/engine/test';

// Jalankan semua test cases
runAllTests();
```

### Test Individual
```typescript
import {
  testRationalMethod,
  testHSSNakayasu,
  testManningTrapezoid,
  testWaterBalance,
} from '@/lib/engine/test';

testRationalMethod();
testHSSNakayasu();
```

---

## 📊 Konstanta SNI

### Import Konstanta
```typescript
import {
  SNI_RUNOFF_COEFFICIENTS,
  SNI_MANNING_ROUGHNESS,
  SNI_HSS_NAKAYASU,
  RATIONAL_CONVERSION_FACTOR,
  SNI_VALIDATION_LIMITS,
} from '@/lib/constants/sni';
```

### Contoh Penggunaan
```typescript
// Koefisien pengaliran
const C = SNI_RUNOFF_COEFFICIENTS.PEMUKIMAN_PADAT.value; // 0.70

// Koefisien Manning
const n = SNI_MANNING_ROUGHNESS.BETON_HALUS.value; // 0.013

// Parameter HSS
const alpha = SNI_HSS_NAKAYASU.alpha; // 2.0
```

---

## ✅ Validasi Input

Semua fungsi menggunakan Zod schema untuk validasi:

```typescript
try {
  const result = calculateRationalDischarge({ C: 1.5, I: 120, A: 2.5 });
} catch (error) {
  // ZodError: "Koefisien C tidak boleh > 1"
  console.error(error.errors);
}
```

**Pesan Error dalam Bahasa Indonesia:**
- "Koefisien C tidak boleh > 1"
- "Intensitas hujan terlalu rendah"
- "Luas DAS tidak boleh negatif"
- "Alpha minimum 1.5"

---

## 📚 Referensi Standar

1. **SNI 2415:2016** - Tata Cara Perhitungan Debit Banjir Rencana
2. **SNI 6738:2015** - Debit Andalan Sungai dengan Kurva Durasi Debit
3. **SNI 6728.1:2015** - Penyusunan Neraca Spasial Sumber Daya Air
4. **SNI 03-3424-1994** - Tata Cara Perencanaan Drainase Permukaan Jalan
5. **Permen PU No. 12/PRT/M/2014** - Sistem Drainase Perkotaan
6. **SK Menteri PU No. 306/1989** - Standar Perencanaan Irigasi
7. **UU No. 17/2019** - Sumber Daya Air

---

## 🔄 Integrasi dengan Services

Modul engine dapat diintegrasikan dengan services yang ada:

```typescript
// calculationService.ts
import { calculateRationalDischarge } from '@/lib/engine';

export const calculateRational = (inputs: RationalInputs) => {
  // Hitung Tc
  const Tc = calculateTimeConcentration({...});
  
  // Hitung I
  const { I } = calculateRainfallIntensity({...});
  
  // Hitung Q
  const { Q } = calculateRationalDischarge({
    C: inputs.runoffCoefficient,
    I,
    A: inputs.area,
  });
  
  return { Q, I, Tc };
};
```

---

## 📈 Performa

- ✅ Perhitungan real-time (< 10ms)
- ✅ Validasi input otomatis
- ✅ Type-safe dengan TypeScript
- ✅ Zero dependencies (kecuali Zod)

---

## 🚀 Roadmap

### Fase 1 (Selesai)
- ✅ Metode Rasional
- ✅ HSS Nakayasu
- ✅ Intensitas Hujan
- ✅ Debit Andalan
- ✅ Validasi Komprehensif

### Fase 2 (Planned)
- ⏳ Metode SCS-CN
- ⏳ Analisis Frekuensi (Log Pearson III, Gumbel)
- ⏳ Routing Hidrograf (Muskingum)
- ⏳ Evapotranspirasi (Penman-Monteith)

---

## 📞 Support

Untuk pertanyaan teknis:
- Dokumentasi: `docs/standards/CALCULATION_CALIBRATION.md`
- Test Cases: `src/lib/engine/test.ts`
- SNI Compliance: `docs/standards/SNI_COMPLIANCE.md`

---

**Status:** ✅ Production Ready - Dikalibrasi sesuai SNI 2415:2016, SNI 6738:2015, SNI 6728.1:2015
