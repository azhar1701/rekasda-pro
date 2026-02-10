# 🧮 Mini-Calculators - Dokumentasi

## ✅ 4 Helper Calculators Terintegrasi

### 1. **Kalkulator Waktu Konsentrasi (tc) - Metode Kirpich**
- **Lokasi**: Di sebelah input "Waktu Konsentrasi (tc)" - Metode Rasional
- **Tombol**: "Hitung tc" (warna biru)
- **Input**:
  - Panjang Alur Sungai (L) dalam km
  - Kemiringan Rata-rata (S) dalam m/m
- **Rumus**: tc = 0.0195 × L^0.77 × S^-0.385
- **Output**: Waktu konsentrasi dalam menit
- **Action**: Auto-fill ke input tc utama

### 2. **Kalkulator Intensitas Hujan (I) - Metode Mononobe**
- **Lokasi**: Di sebelah input "Intensitas Hujan (I)" - Metode Rasional
- **Tombol**: "Hitung I" (warna emerald)
- **Input**:
  - Curah Hujan Harian Maksimum (R₂₄) dalam mm
  - Menggunakan tc dari state utama
- **Rumus**: I = (R₂₄/24) × (24/tc)^(2/3)
- **Output**: Intensitas hujan dalam mm/jam
- **Action**: Auto-fill ke input I utama

### 3. **Kalkulator Analisis Frekuensi - Metode Gumbel**
- **Lokasi**: Header tabel "Analisis Kala Ulang"
- **Tombol**: "Analisis Frekuensi" (warna teal)
- **Input**:
  - Rata-rata Hujan Maksimum (X̄) dalam mm
  - Standar Deviasi (S) dalam mm
- **Rumus**: XT = X̄ + (K × S)
- **Faktor K Gumbel**:
  - Q2: -0.164
  - Q5: 0.719
  - Q10: 1.305
  - Q25: 2.044
  - Q50: 2.592
  - Q100: 3.137
- **Output**: Tabel lengkap hujan rencana untuk semua periode
- **Action**: "Terapkan Semua" - mengisi seluruh baris tabel kala ulang

### 4. **Kalkulator Hujan Efektif (Ro)**
- **Lokasi**: Di sebelah input "Hujan Satuan (Ro)" - Metode Nakayasu
- **Tombol**: "Hitung Ro" (warna purple)
- **Input**:
  - Hujan Rencana (Rplan) dalam mm
  - Koefisien Limpasan (C)
- **Rumus**: Reff = C × Rplan
- **Output**: Hujan efektif dalam mm
- **Action**: Auto-fill ke input Ro utama

## 🎨 Styling & UX

### Warna Konsisten
- **tc Calculator**: Blue (#3B82F6)
- **Intensity Calculator**: Emerald (#10B981)
- **Frequency Analysis**: Teal (#14B8A6)
- **Effective Rainfall**: Purple (#9333EA)

### Komponen UI
- **Popover/Inline**: tc, Intensity, Effective Rainfall (muncul di bawah input)
- **Modal/Dialog**: Frequency Analysis (full screen overlay)

### Interaksi
1. Klik tombol "Hitung [Parameter]"
2. Popover/Modal muncul dengan form
3. Input nilai yang diperlukan
4. Lihat hasil real-time
5. Klik "Gunakan" atau "Terapkan"
6. Nilai otomatis masuk ke form utama
7. Popover/Modal tertutup

## 📁 File Structure

```
components/
  ├── FloodDischargeCalculator.tsx  (Main component)
  └── MiniCalculators.tsx            (4 helper calculators)
```

## 🚀 Cara Menggunakan

### Contoh Workflow: Metode Rasional

1. **Hitung tc**:
   - Klik "Hitung tc"
   - Input L = 0.8 km, S = 0.01
   - Hasil: tc ≈ 30 menit
   - Klik "Gunakan tc = 30 menit"

2. **Hitung I**:
   - Klik "Hitung I"
   - Input R₂₄ = 100 mm
   - tc otomatis dari step 1 (30 menit)
   - Hasil: I ≈ 100 mm/jam
   - Klik "Gunakan I = 100 mm/jam"

3. **Analisis Frekuensi**:
   - Klik "Analisis Frekuensi" di header tabel
   - Input X̄ = 100 mm, S = 20 mm
   - Lihat tabel hasil untuk Q2-Q100
   - Klik "Terapkan Semua ke Tabel"
   - Semua nilai hujan rencana terisi otomatis

### Contoh Workflow: Metode Nakayasu

1. **Hitung Ro**:
   - Klik "Hitung Ro"
   - Input Rplan = 100 mm, C = 0.7
   - Hasil: Reff = 70 mm
   - Klik "Gunakan Reff = 70 mm"

2. **Analisis Frekuensi**:
   - Sama seperti Metode Rasional
   - Terapkan ke tabel kala ulang

## 🎯 Keunggulan

1. **Terintegrasi**: Tidak perlu Excel terpisah
2. **Real-time**: Hasil langsung terlihat
3. **Auto-fill**: Satu klik untuk mengisi form
4. **Konsisten**: Styling seragam dengan dashboard
5. **Informatif**: Rumus ditampilkan di setiap calculator
6. **Responsive**: Bekerja di mobile & desktop

## 📚 Referensi

- **Kirpich**: Time of concentration formula
- **Mononobe**: Rainfall intensity formula (Japanese method)
- **Gumbel**: Extreme value distribution for frequency analysis
- **Effective Rainfall**: C × R method

---

**Status**: ✅ Fully Integrated  
**Last Updated**: ${new Date().toLocaleDateString('id-ID')}
