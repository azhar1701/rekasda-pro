# ⚡ Quick Reference - Kalibrasi Perhitungan

Panduan cepat untuk menggunakan modul perhitungan yang telah dikalibrasi.

---

## 🚀 Import

```typescript
// Engine modules
import {
  calculateRationalDischarge,
  calculateHSSNakayasu,
  calculateRainfallIntensity,
  calculateTimeConcentration,
  calculateDependableFlow,
  validateRationalMethod,
  validateManningCalculation,
} from '@/lib/engine';

// Services
import { calculateManning, calculateRational } from '@/services/calculationService';
import { calculateWaterBalance } from '@/services/waterBalanceEngine';

// Constants
import {
  SNI_RUNOFF_COEFFICIENTS,
  SNI_MANNING_ROUGHNESS,
  SNI_HSS_NAKAYASU,
} from '@/lib/constants/sni';
```

---

## 📐 Formula Cepat

### Metode Rasional
```typescript
// Q = 0.278 × C × I × A
const { Q } = calculateRationalDischarge({
  C: 0.70,  // Koefisien pengaliran (0-1)
  I: 120,   // Intensitas hujan (mm/jam)
  A: 2.5,   // Luas DAS (km²)
});
```

### Intensitas Hujan (Mononobe)
```typescript
// I = (R24/24) × (24/tc)^(2/3)
const { I } = calculateRainfallIntensity({
  R24: 100,           // Curah hujan 24 jam (mm)
  tc: 1.0,            // Durasi (jam)
  method: 'mononobe',
});
```

### Waktu Konsentrasi (Kirpich)
```typescript
// Tc = 0.0195 × L^0.77 × S^-0.385
const Tc = calculateTimeConcentration({
  L: 1.5,            // Panjang aliran (km)
  S: 0.01,           // Kemiringan (m/m)
  method: 'kirpich',
});
```

### Manning
```typescript
// V = (1/n) × R^(2/3) × S^(1/2)
// Q = A × V
const result = calculateManning({
  shape: ChannelShape.TRAPEZOID,
  roughness: 0.013,  // n
  slope: 0.002,      // S (m/m)
  width: 2.0,        // b (m)
  depth: 1.0,        // h (m)
  sideSlope: 1.0,    // z
  totalDepth: 1.5,   // H (m)
  diameter: 0,
});
```

### HSS Nakayasu
```typescript
// Qp = (α × Ro × A) / (3.6 × (0.3 × Tp + Tg))
// Tp = Tg + 0.8 × Tr
const result = calculateHSSNakayasu({
  Ro: 10,      // Hujan satuan (mm)
  Tg: 2.5,     // Time lag (jam)
  Tr: 1.5,     // Time unit (jam)
  Alpha: 2.0,  // Parameter (1.5-3.0)
  A: 50,       // Luas DAS (km²)
  L: 15,       // Panjang sungai (km)
});
```

### Debit Andalan (Q80)
```typescript
// Metode Weibull: P = m/(n+1) × 100%
const result = calculateDependableFlow({
  dischargeData: [15.2, 18.5, 22.3, ...], // Data debit (m³/s)
  probability: 80,                         // Probabilitas (%)
});
```

### Neraca Air
```typescript
const results = calculateWaterBalance({
  population: 50000,        // jiwa
  agricultureArea: 500,     // Ha
  domesticStandard: 100,    // L/capita/day
  irrigationDemand: 1.0,    // L/s/Ha
  monthlySupply: [2.5, ...], // 12 bulan (m³/s)
});
```

---

## 📊 Konstanta SNI

### Koefisien Pengaliran (C)
```typescript
const C_JALAN = SNI_RUNOFF_COEFFICIENTS.JALAN_ASPAL.value;      // 0.95
const C_KOTA = SNI_RUNOFF_COEFFICIENTS.PUSAT_KOTA.value;        // 0.85
const C_PADAT = SNI_RUNOFF_COEFFICIENTS.PEMUKIMAN_PADAT.value;  // 0.70
const C_SEDANG = SNI_RUNOFF_COEFFICIENTS.PEMUKIMAN_SEDANG.value;// 0.50
const C_TAMAN = SNI_RUNOFF_COEFFICIENTS.TAMAN.value;            // 0.15
const C_HUTAN = SNI_RUNOFF_COEFFICIENTS.HUTAN.value;            // 0.15
```

### Koefisien Manning (n)
```typescript
const n_BETON_HALUS = SNI_MANNING_ROUGHNESS.BETON_HALUS.value;  // 0.013
const n_BETON_KASAR = SNI_MANNING_ROUGHNESS.BETON_KASAR.value;  // 0.015
const n_PASANGAN = SNI_MANNING_ROUGHNESS.PASANGAN_BATU.value;   // 0.025
const n_PVC = SNI_MANNING_ROUGHNESS.PVC.value;                  // 0.010
const n_TANAH = SNI_MANNING_ROUGHNESS.TANAH_BERSIH.value;       // 0.022
const n_RUMPUT = SNI_MANNING_ROUGHNESS.BERUMPUT.value;          // 0.035
```

### Parameter HSS
```typescript
const ALPHA_STANDARD = SNI_HSS_NAKAYASU.alpha;           // 2.0
const ALPHA_MIN = SNI_HSS_NAKAYASU.range.min;            // 1.5
const ALPHA_MAX = SNI_HSS_NAKAYASU.range.max;            // 3.0
const CONVERSION_FACTOR = RATIONAL_CONVERSION_FACTOR;    // 0.278
```

---

## ✅ Validasi

### Validasi Metode Rasional
```typescript
const validation = validateRationalMethod({
  C: 0.70,
  I: 120,
  A: 2.5,
  landUse: 'pemukiman-padat',
});

if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

### Validasi Manning
```typescript
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

### Validasi HSS Nakayasu
```typescript
const validation = validateNakayasuParameters({
  Alpha: 2.0,
  Tg: 2.5,
  Tr: 1.5,
  A: 50,
});
```

---

## 🎯 Batasan & Validasi

### Metode Rasional
- C: 0.0 - 1.0
- I: 10 - 300 mm/jam (normal)
- A: < 50 km² (batasan metode)
- Tc: > 0.1 jam

### HSS Nakayasu
- α: 1.5 - 3.0 (standard = 2.0)
- Tr: 0.5×Tg - 1.0×Tg
- A: > 10 km² (rekomendasi)
- Ro: 1 - 100 mm

### Manning
- n: 0.010 - 0.045 (normal)
- S: > 0.0001 m/m
- V: 0.3 - 6.0 m/s (tergantung material)
- Freeboard: > 0.2 m (minimum)

### Debit Andalan
- Data: minimum 12 bulan
- Probabilitas: 50 - 95%
- Q80: debit pada P=80%

---

## 🧪 Testing

### Run All Tests
```typescript
import { runAllTests } from '@/lib/engine/test';
runAllTests();
```

### Individual Tests
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

## 📚 Referensi Cepat

### SNI 2415:2016
- Pasal 5.2.1: Metode Rasional
- Pasal 5.2.2: Intensitas Hujan (Mononobe)
- Pasal 6.3: HSS Nakayasu

### SNI 6738:2015
- Pasal 4.2: Debit Andalan (Q80)
- Metode Weibull

### SNI 6728.1:2015
- Neraca Air
- Kebutuhan Domestik & Pertanian

### UU 17/2019
- Pasal 22: Debit Lingkungan (10%)

---

## 🔧 Troubleshooting

### Error: "Koefisien C tidak boleh > 1"
```typescript
// Pastikan C antara 0-1
const C = Math.min(0.95, inputC); // Cap at 0.95
```

### Error: "Luas DAS terlalu besar"
```typescript
// Metode Rasional hanya untuk A < 50 km²
if (area > 50) {
  // Gunakan HSS Nakayasu
  const result = calculateHSSNakayasu({...});
}
```

### Error: "Alpha minimum 1.5"
```typescript
// Alpha harus 1.5 - 3.0
const Alpha = Math.max(1.5, Math.min(3.0, inputAlpha));
```

### Warning: "Kecepatan terlalu tinggi"
```typescript
// Periksa material dan kemiringan
// Tambahkan peredam energi jika V > 6 m/s
```

---

## 💡 Tips

### 1. Pilih Metode yang Tepat
- **Rasional:** DAS < 50 km², drainase perkotaan
- **HSS Nakayasu:** DAS > 10 km², analisis banjir sungai

### 2. Gunakan Konstanta SNI
```typescript
// Lebih baik
const C = SNI_RUNOFF_COEFFICIENTS.PEMUKIMAN_PADAT.value;

// Daripada
const C = 0.70; // Dari mana nilainya?
```

### 3. Validasi Sebelum Hitung
```typescript
const validation = validateRationalMethod(inputs);
if (validation.valid) {
  const result = calculateRationalDischarge(inputs);
}
```

### 4. Dokumentasi Output
```typescript
const result = calculateManning(inputs);
console.log(`Q = ${result.Discharge} m³/s (${result.FlowType})`);
console.log(`Freeboard = ${result.Freeboard} m (${result.SafetyStatus})`);
```

---

## 📖 Dokumentasi Lengkap

- **Kalibrasi:** `docs/standards/CALCULATION_CALIBRATION.md`
- **Engine:** `src/lib/engine/README.md`
- **SNI Compliance:** `docs/standards/SNI_COMPLIANCE.md`
- **Changelog:** `CALIBRATION_CHANGELOG.md`
- **Summary:** `CALIBRATION_SUMMARY.md`

---

## 🎓 Contoh Lengkap

### Analisis Drainase Perkotaan
```typescript
// 1. Hitung Tc
const Tc = calculateTimeConcentration({
  L: 1.5,
  S: 0.01,
  method: 'kirpich',
});

// 2. Hitung I
const { I } = calculateRainfallIntensity({
  R24: 100,
  tc: Tc / 60, // Convert to hours
  method: 'mononobe',
});

// 3. Hitung Q
const { Q } = calculateRationalDischarge({
  C: SNI_RUNOFF_COEFFICIENTS.PEMUKIMAN_PADAT.value,
  I,
  A: 2.5,
});

// 4. Design saluran
const channel = calculateManning({
  shape: ChannelShape.TRAPEZOID,
  roughness: SNI_MANNING_ROUGHNESS.BETON_HALUS.value,
  slope: 0.002,
  width: 2.0,
  depth: 1.0,
  sideSlope: 1.0,
  totalDepth: 1.5,
  diameter: 0,
});

// 5. Validasi
if (parseFloat(channel.Discharge) >= Q) {
  console.log('✅ Kapasitas saluran mencukupi');
} else {
  console.log('❌ Perlu perbesar dimensi saluran');
}
```

---

**Status:** ✅ Production Ready - Dikalibrasi sesuai SNI 2415:2016, SNI 6738:2015, SNI 6728.1:2015
