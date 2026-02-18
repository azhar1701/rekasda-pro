# 📝 Changelog - Kalibrasi Perhitungan

## [1.0.0] - 2024 - KALIBRASI LENGKAP

### ✨ Modul Baru

#### `src/lib/engine/rainfall.ts`
- Perhitungan intensitas hujan dengan 3 metode:
  - Mononobe (SNI 2415:2016) - Rekomendasi
  - Talbot - Alternatif
  - Sherman - Daerah tropis
- Perhitungan waktu konsentrasi (Tc):
  - Kirpich (SNI 2415:2016)
  - California Culvert
- Validasi input dengan Zod schema
- Dokumentasi lengkap dengan referensi SNI

#### `src/lib/engine/dependableFlow.ts`
- Perhitungan debit andalan (Q80) sesuai SNI 6738:2015
- Metode Weibull untuk analisis probabilitas
- Flow Duration Curve
- Validasi ketersediaan air
- Konversi data harian ke bulanan
- Statistik lengkap (Qmax, Qmin, Qavg)

#### `src/lib/engine/validation.ts`
- Validasi koefisien pengaliran berdasarkan tata guna lahan
- Validasi luas DAS untuk metode rasional (< 50 km²)
- Validasi parameter HSS Nakayasu
- Validasi kecepatan aliran berdasarkan material
- Validasi tinggi jagaan (freeboard)
- Validasi neraca air
- Validasi bilangan Froude
- Fungsi validasi komprehensif untuk semua metode

#### `src/lib/engine/test.ts`
- 8 test cases lengkap:
  1. Metode Rasional - Drainase perkotaan
  2. HSS Nakayasu - Analisis banjir sungai
  3. Manning - Saluran trapesium
  4. Manning - Pipa lingkaran
  5. Intensitas hujan - Mononobe & Talbot
  6. Waktu konsentrasi - Kirpich
  7. Debit andalan - Q80
  8. Neraca air - 12 bulan
- Fungsi runAllTests() untuk verifikasi lengkap
- Output terformat dengan console.log

### 🔧 Perbaikan Formula

#### `src/services/calculationService.ts`

**Metode Rasional:**
- ✅ Formula Tc menggunakan Kirpich standar (SNI 2415:2016)
  - Sebelumnya: SCS untuk S < 0.3%, Kirpich untuk S ≥ 0.3%
  - Sekarang: Kirpich untuk semua kondisi
  - Formula: `Tc = 0.0195 × L^0.77 × S^-0.385`
- ✅ Intensitas hujan Mononobe sesuai SNI 2415:2016 Pasal 5.2.2
  - Formula: `I = (R24/24) × (24/Tc)^(2/3)`
- ✅ Debit puncak dengan faktor konversi 0.278
  - Formula: `Q = 0.278 × C × I × A`
- ✅ Parameter tambahan:
  - Volume limpasan total
  - Debit spesifik
  - Waktu lag (0.6 × Tc)
  - Hujan efektif

**Manning:**
- ✅ Geometri saluran lingkaran diperbaiki
  - Sudut sentral: `θ = 2 × arccos(1 - 2h/D)`
  - Luas: `A = (D²/8) × (θ - sin θ)`
  - Keliling: `P = (θ × D) / 2`
- ✅ Geometri trapesium dengan validasi sideSlope
  - Luas: `A = (b + z×h) × h`
  - Keliling: `P = b + 2×h×√(1 + z²)`
- ✅ Bilangan Froude dengan threshold 1.0 (bukan 0.9/1.1)
  - Sub-kritis: Fr < 1.0
  - Kritis: Fr = 1.0
  - Super-kritis: Fr > 1.0
- ✅ Kedalaman kritis dengan formula standar
  - `hc = (Q²/(g×T²))^(1/3)`
- ✅ Kemiringan kritis dengan presisi 6 desimal
  - `Sc = (n²×g×A) / (T×R^(4/3))`
- ✅ Default roughness = 0.013 (beton halus)

#### `src/services/waterBalanceEngine.ts`

**Neraca Air:**
- ✅ Dokumentasi lengkap sesuai SNI 6728.1:2015
- ✅ Standar kebutuhan air domestik:
  - Kota Besar: 120-150 L/capita/day
  - Kota Sedang: 100-120 L/capita/day
  - Kota Kecil: 80-100 L/capita/day
  - Pedesaan: 60-80 L/capita/day
- ✅ Kebutuhan irigasi:
  - Padi: 1.0-1.5 L/s/Ha
  - Palawija: 0.5-0.8 L/s/Ha
  - Perkebunan: 0.3-0.5 L/s/Ha
- ✅ Debit lingkungan 10% (UU 17/2019 Pasal 22)
- ✅ Parameter reliabilitas pasokan air
  - `Reliabilitas = (Bulan Surplus / 12) × 100%`

#### `src/lib/engine/flood.ts`

**HSS Nakayasu:**
- ✅ Dokumentasi lengkap sesuai SNI 2415:2016 Pasal 6.3
- ✅ Formula parameter hidrograf:
  - `Tp = Tg + 0.8 × Tr`
  - `Tb = Tp + 1.5 × Tg`
  - `Qp = (α × Ro × A) / (3.6 × (0.3 × Tp + Tg))`
- ✅ Kurva hidrograf 3 segmen:
  - Rising: `Q = Qp × (t/Tp)^2.4`
  - Recession 1: `Q = Qp × exp(-0.3 × (t-Tp)/Tg)`
  - Recession 2: `Q = Qp × exp(-0.3×1.5 - 0.5×(t-Tp-1.5Tg)/Tg)`
- ✅ Output dengan pembulatan konsisten:
  - Qp: 3 desimal
  - Tp, Tb: 2 desimal
  - Hydrograph: time 2 desimal, discharge 4 desimal

### 📚 Dokumentasi Baru

#### `docs/standards/CALCULATION_CALIBRATION.md`
- Dokumentasi lengkap kalibrasi perhitungan
- Referensi standar SNI lengkap
- Formula dengan penjelasan parameter
- Test cases dengan hasil verifikasi
- Checklist kalibrasi
- Peningkatan dari versi sebelumnya

#### `src/lib/engine/README.md`
- Panduan penggunaan modul engine
- Contoh kode untuk setiap fungsi
- Referensi API lengkap
- Integrasi dengan services
- Roadmap pengembangan

#### `CALIBRATION_SUMMARY.md`
- Ringkasan kalibrasi
- Daftar file yang diubah
- Formula yang dikalibrasi
- Test results
- Checklist lengkap

### 🔄 Update Export

#### `src/lib/engine/index.ts`
```typescript
export * from './flood';
export * from './rainfall';
export * from './dependableFlow';
export * from './validation';
```

### ✅ Validasi Input

**Semua modul menggunakan Zod schema:**
- Pesan error dalam Bahasa Indonesia
- Rentang nilai sesuai SNI
- Type-safe dengan TypeScript
- Validasi otomatis sebelum perhitungan

**Contoh pesan error:**
- "Koefisien C tidak boleh > 1"
- "Intensitas hujan terlalu rendah"
- "Luas DAS tidak boleh negatif"
- "Alpha minimum 1.5"
- "Time unit harus positif"

### 📊 Konstanta SNI

**Tidak ada perubahan pada `src/lib/constants/sni.ts`:**
- Sudah sesuai standar
- Dokumentasi lengkap
- Referensi SNI jelas

### 🧪 Testing

**Test Coverage:**
- ✅ Metode Rasional
- ✅ HSS Nakayasu
- ✅ Manning (Trapezoid & Circular)
- ✅ Intensitas Hujan (Mononobe, Talbot)
- ✅ Waktu Konsentrasi (Kirpich)
- ✅ Debit Andalan (Q80)
- ✅ Neraca Air (12 bulan)

**Verifikasi:**
- ✅ Contoh soal SNI
- ✅ Boundary conditions
- ✅ Edge cases
- ✅ Manual calculation

### 🎯 Compliance

**Standar yang Diikuti:**
- ✅ SNI 2415:2016 - Debit Banjir Rencana
- ✅ SNI 6738:2015 - Debit Andalan
- ✅ SNI 6728.1:2015 - Neraca Air
- ✅ SNI 03-3424-1994 - Drainase Jalan
- ✅ Permen PU No. 12/2014 - Drainase Perkotaan
- ✅ SK Menteri PU No. 306/1989 - Irigasi
- ✅ UU No. 17/2019 - Sumber Daya Air

### 📈 Peningkatan Kualitas

**Code Quality:**
- ✅ JSDoc lengkap dengan referensi SNI
- ✅ Komentar inline untuk formula kompleks
- ✅ Type-safe dengan TypeScript
- ✅ Consistent naming convention
- ✅ Error handling yang baik

**Output Quality:**
- ✅ Unit konsisten (m³/s, mm/jam, km²)
- ✅ Presisi desimal sesuai standar
- ✅ Parameter tambahan lengkap
- ✅ Interpretasi hasil jelas
- ✅ Rekomendasi praktis

**Documentation Quality:**
- ✅ Dokumentasi lengkap
- ✅ Contoh penggunaan
- ✅ Referensi SNI
- ✅ Test cases
- ✅ Troubleshooting guide

---

## 🔜 Roadmap

### Fase 2 (Planned)
- [ ] Metode SCS-CN (Curve Number)
- [ ] Analisis Frekuensi (Log Pearson III, Gumbel)
- [ ] Routing Hidrograf (Muskingum)
- [ ] Evapotranspirasi (Penman-Monteith)
- [ ] Unit Hydrograph (Snyder, SCS)
- [ ] Infiltrasi (Horton, Green-Ampt)

### Fase 3 (Future)
- [ ] Sediment Transport
- [ ] Water Quality Modeling
- [ ] Groundwater Analysis
- [ ] Climate Change Scenarios

---

## 📞 Support

Untuk pertanyaan terkait kalibrasi:
- Dokumentasi: `docs/standards/CALCULATION_CALIBRATION.md`
- Test Cases: `src/lib/engine/test.ts`
- Engine README: `src/lib/engine/README.md`

---

**Catatan:** Semua perubahan telah diverifikasi dengan contoh soal dari SNI dan literatur standar. Perhitungan siap untuk production deployment.
