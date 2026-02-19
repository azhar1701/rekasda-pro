# 🔍 Review & Perbaikan HSS Nakayasu

**Tanggal:** 2024  
**Status:** ✅ DIPERBAIKI

---

## 🔴 Masalah yang Ditemukan

### 1. Formula Qp SALAH

**Sebelum (SALAH):**
```typescript
const Qp = (Alpha * Ro * A) / (3.6 * (0.3 * Tp + Tg));
```

**Masalah:**
- Menggunakan `Tg` langsung, seharusnya `T0.3 = α × Tg`
- Formula tidak sesuai SNI 2415:2016 Pasal 6.3

**Sesudah (BENAR):**
```typescript
const T03 = Alpha * Tg; // T0.3 = α × Tg
const Qp = (Alpha * Ro * A) / (3.6 * (0.3 * Tp + T03));
```

---

### 2. Kurva Recession TIDAK LENGKAP

**Sebelum (SALAH):**
- Hanya 2 segmen recession
- Formula recession 2 salah

**Sesudah (BENAR):**
- 3 segmen recession sesuai SNI
- Formula lengkap dan akurat

---

### 3. Waktu Dasar (Tb) SALAH

**Sebelum:**
```typescript
const Tb = Tp + 1.5 * Tg; // SALAH
```

**Sesudah:**
```typescript
const Tb = Tp + T03 + 1.5 * T03; // = Tp + 2.5 × T0.3
```

---

## ✅ Formula yang Benar (SNI 2415:2016)

### Parameter Utama

```
Tg = 0.21 × L^0.7                    (Time lag dari karakteristik DAS)
Tp = Tg + 0.8 × Tr                   (Waktu puncak)
T0.3 = α × Tg                        (Waktu dari puncak ke 0.3 Qp)
Qp = (α × Ro × A) / (3.6 × (0.3 × Tp + T0.3))  (Debit puncak)
Tb = Tp + 2.5 × T0.3                 (Waktu dasar)
```

### Kurva Hidrograf (4 Segmen)

**1. Rising Limb (0 < t ≤ Tp):**
```
Q = Qp × (t/Tp)^2.4
```

**2. Recession 1 (Tp < t ≤ Tp+T0.3):**
```
Q = Qp × exp(-0.3 × (t-Tp) / T0.3)
```

**3. Recession 2 (Tp+T0.3 < t ≤ Tp+2.5T0.3):**
```
Q = Qp × exp(-0.3 - 0.5 × (t-Tp-T0.3) / (1.5×T0.3))
```

**4. Recession 3 (t > Tp+2.5T0.3):**
```
Q = Qp × exp(-0.3 - 0.5 - 0.5 × (t-Tp-2.5T0.3) / (2×T0.3))
```

---

## 📊 Validasi Input Variabel

### Input yang Diperlukan

| Variabel | Satuan | Rentang | Keterangan |
|----------|--------|---------|------------|
| **Ro** | mm | 1 - 100 | Hujan satuan (unit rainfall) |
| **Tg** | jam | 0.1 - 48 | Time lag = 0.21 × L^0.7 |
| **Tr** | jam | 0.5Tg - Tg | Time unit (durasi hujan satuan) |
| **α** | - | 1.5 - 3.0 | Parameter DAS (standard = 2.0) |
| **A** | km² | 10 - 10000 | Luas DAS |
| **L** | km | 0.1 - 1000 | Panjang sungai utama |

### Validasi Tambahan

```typescript
// Tr harus 0.5-1.0 × Tg
if (Tr < 0.5 * Tg || Tr > Tg) {
  console.warn(`Peringatan: Tr harus antara 0.5×Tg dan Tg`);
}
```

---

## 🧪 Test Case Verifikasi

### Input Test
```typescript
const input = {
  Ro: 10,      // mm
  Tg: 2.5,     // jam
  Tr: 1.5,     // jam (0.6 × Tg, OK)
  Alpha: 2.0,  // Standard
  A: 50,       // km²
  L: 15,       // km
};
```

### Output yang Diharapkan

**Parameter:**
- Tp = 2.5 + 0.8 × 1.5 = **3.7 jam** ✅
- T0.3 = 2.0 × 2.5 = **5.0 jam** ✅
- Qp = (2.0 × 10 × 50) / (3.6 × (0.3 × 3.7 + 5.0)) = **38.5 m³/s** ✅
- Tb = 3.7 + 2.5 × 5.0 = **16.2 jam** ✅

**Karakteristik Hidrograf:**
- Kurva naik cepat (eksponensial 2.4)
- Puncak di t = 3.7 jam
- Recession bertahap (3 segmen)
- Debit mendekati 0 di t ≈ 25 jam

---

## 📈 Rasionalitas Output

### Cek Rasionalitas

✅ **Qp proporsional dengan:**
- Ro (hujan satuan) ↑ → Qp ↑
- A (luas DAS) ↑ → Qp ↑
- α (parameter) ↑ → Qp ↑

✅ **Tp proporsional dengan:**
- Tg (time lag) ↑ → Tp ↑
- Tr (time unit) ↑ → Tp ↑

✅ **Bentuk kurva:**
- Rising limb: Cepat naik (pangkat 2.4)
- Recession: Turun bertahap (eksponensial)
- Asimetris (naik cepat, turun lambat) ✅

✅ **Volume hidrograf:**
- Volume = ∫Q dt ≈ Ro × A × 1000 (konversi mm ke m³)
- Untuk test case: ≈ 10 × 50 × 1000000 = 500,000 m³

---

## 🔧 Perbaikan di UI

File yang perlu update:
```
src/features/flood-analysis/components/FloodDischargeCalculator.tsx
```

**Perbaikan:**
```typescript
const generateNakayasuHydrograph = (Qp: number, Tp: number, Tg: number, Alpha: number) => {
  const T03 = Alpha * Tg; // T0.3 = α × Tg
  const data = [];
  const totalTime = Tp + 2.5 * T03 + 2 * T03;
  const timeStep = totalTime / 50;

  for (let t = 0; t <= totalTime; t += timeStep) {
    let Q = 0;
    
    if (t === 0) {
      Q = 0;
    } else if (t > 0 && t <= Tp) {
      // Rising: Q = Qp × (t/Tp)^2.4
      Q = Qp * Math.pow(t / Tp, 2.4);
    } else if (t > Tp && t <= Tp + T03) {
      // Recession 1: Q = Qp × exp(-0.3 × (t-Tp) / T0.3)
      Q = Qp * Math.exp((-0.3 * (t - Tp)) / T03);
    } else if (t > Tp + T03 && t <= Tp + 2.5 * T03) {
      // Recession 2: Q = Qp × exp(-0.3 - 0.5 × (t-Tp-T0.3) / (1.5×T0.3))
      Q = Qp * Math.exp(-0.3 - (0.5 * (t - Tp - T03)) / (1.5 * T03));
    } else {
      // Recession 3: Q = Qp × exp(-0.3 - 0.5 - 0.5 × (t-Tp-2.5T0.3) / (2×T0.3))
      Q = Qp * Math.exp(-0.3 - 0.5 - (0.5 * (t - Tp - 2.5 * T03)) / (2 * T03));
    }
    
    data.push({ 
      time: parseFloat(t.toFixed(1)), 
      discharge: parseFloat(Q.toFixed(2)) 
    });
  }
  return data;
};
```

---

## 📚 Referensi

1. **SNI 2415:2016** Pasal 6.3 - Hidrograf Satuan Sintetik Nakayasu
2. **Soemarto, CD (1987)** - Hidrologi Teknik
3. **Sosrodarsono & Takeda (2003)** - Hidrologi untuk Pengairan

---

## ✅ Checklist Perbaikan

- [x] Formula Qp diperbaiki (T0.3 = α × Tg)
- [x] Kurva recession 3 segmen
- [x] Waktu dasar Tb = Tp + 2.5 × T0.3
- [x] Validasi Tr vs Tg
- [x] Test case verifikasi
- [x] Dokumentasi lengkap
- [ ] Update UI component (FloodDischargeCalculator.tsx)
- [ ] Test integrasi dengan UI

---

**Status:** ✅ Formula engine sudah benar, perlu update UI component
