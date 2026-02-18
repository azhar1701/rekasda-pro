# 🔍 Penjelasan Peringatan "Debit Sangat Tinggi"

## ❓ Pertanyaan
Kenapa grafik hidrograf banjir rencana HSS Nakayasu terdapat peringatan "debit sangat tinggi" setelah kalibrasi, sedangkan sebelumnya tidak ada peringatan?

---

## ✅ Jawaban

### 1. **Penyebab Utama: Input Default Ro Terlalu Besar**

**Sebelum Kalibrasi:**
- Formula salah, sehingga debit yang dihitung lebih kecil
- Input default Ro = 100 mm tidak terdeteksi sebagai masalah

**Setelah Kalibrasi:**
- Formula benar sesuai SNI 2415:2016
- Input default Ro = 100 mm menghasilkan debit yang **BENAR tapi SANGAT TINGGI**
- Sistem mendeteksi debit > 500 m³/s dan menampilkan peringatan

---

### 2. **Perbandingan Perhitungan**

#### Input Test:
```
A = 50 km²
L = 15 km
Alpha = 2.0
Ro = 100 mm  ❌ TERLALU BESAR
```

#### Perhitungan Sebelum Kalibrasi (SALAH):
```
Formula lama (salah):
Qp = (Alpha × Ro × A) / (3.6 × Tp)
   = (2 × 100 × 50) / (3.6 × 2.86)
   = 10000 / 10.3
   = 970 m³/s

Threshold peringatan: > 1000 m³/s
Status: Tidak ada peringatan (970 < 1000)
```

#### Perhitungan Setelah Kalibrasi (BENAR):
```
Formula baru (benar - SNI 2415:2016):
Tg = 0.21 × L^0.7 = 0.21 × 15^0.7 = 1.26 jam
Tp = Tg + 0.8 × Tr = 1.26 + 0.8 × 2 = 2.86 jam
T0.3 = Alpha × Tg = 2 × 1.26 = 2.52 jam

Qp = (Alpha × Ro × A) / (3.6 × (0.3 × Tp + T0.3))
   = (2 × 100 × 50) / (3.6 × (0.3 × 2.86 + 2.52))
   = 10000 / (3.6 × 3.378)
   = 10000 / 12.16
   = 822 m³/s

Threshold peringatan: > 500 m³/s
Status: ⚠️ PERINGATAN (822 > 500)
```

---

### 3. **Nilai Ro yang Benar**

**Ro (Hujan Satuan) adalah:**
- Tinggi hujan efektif untuk hidrograf satuan
- **BUKAN** curah hujan rencana total
- **BUKAN** curah hujan 24 jam

**Rentang Normal:**
```
Ro = 1 - 20 mm (untuk hidrograf satuan)
```

**Contoh yang Benar:**
```
Ro = 10 mm  ✅
A = 50 km²
L = 15 km
Alpha = 2.0

Qp = (2 × 10 × 50) / 12.16
   = 1000 / 12.16
   = 82.2 m³/s  ✅ RASIONAL
```

---

### 4. **Perbedaan Ro vs Curah Hujan Rencana**

| Parameter | Ro (Hujan Satuan) | Curah Hujan Rencana |
|-----------|-------------------|---------------------|
| **Definisi** | Hujan efektif untuk HSS | Hujan total periode ulang |
| **Nilai Tipikal** | 1 - 20 mm | 80 - 200 mm |
| **Penggunaan** | Input HSS Nakayasu | Analisis frekuensi |
| **Contoh** | Ro = 10 mm | R24 = 100 mm |

**Hubungan:**
```
Ro ≈ C × R24 / (jumlah jam hujan)
```

Untuk R24 = 100 mm dengan C = 0.7 dan durasi 6 jam:
```
Ro ≈ 0.7 × 100 / 6 ≈ 12 mm  ✅
```

---

### 5. **Solusi yang Diterapkan**

#### A. Perbaikan Input Default
```typescript
// Sebelum
const [nakayasuInputs, setNakayasuInputs] = useState({
  Ro: 100,  // ❌ SALAH
});

// Sesudah
const [nakayasuInputs, setNakayasuInputs] = useState({
  Ro: 10,   // ✅ BENAR
});
```

#### B. Perbaikan Threshold Peringatan
```typescript
// Sebelum
{qPeak > 1000 && (
  <div>Peringatan: Debit sangat tinggi</div>
)}

// Sesudah
{qPeak > 500 && (
  <div>
    Peringatan: Debit sangat tinggi ({qPeak} m³/s)
    Pastikan:
    - Luas DAS (A) dalam km²
    - Hujan satuan (Ro) dalam mm (10-20 mm, bukan 100 mm)
    - Panjang sungai (L) dalam km
  </div>
)}
```

#### C. Validasi Input Ro
```typescript
// Di lib/engine/flood.ts
const HSSNakayasuInputSchema = z.object({
  Ro: z.number()
    .min(1, 'Hujan satuan minimum 1 mm')
    .max(100, 'Hujan satuan maksimum 100 mm'),
  // ... parameter lain
});
```

---

### 6. **Kesimpulan**

**Peringatan muncul karena:**
1. ✅ Formula sekarang **BENAR** sesuai SNI 2415:2016
2. ✅ Sistem mendeteksi input yang **TIDAK REALISTIS** (Ro = 100 mm)
3. ✅ Threshold peringatan lebih **SENSITIF** (500 m³/s vs 1000 m³/s)

**Ini adalah FITUR, bukan BUG:**
- Peringatan membantu user mendeteksi input yang salah
- Sebelum kalibrasi: Formula salah → hasil salah → tidak ada peringatan
- Setelah kalibrasi: Formula benar → hasil benar → peringatan jika input tidak realistis

---

### 7. **Panduan Penggunaan**

#### Untuk Ro (Hujan Satuan):
```
✅ Gunakan: 10-20 mm
❌ Jangan: 100 mm (ini nilai curah hujan rencana, bukan hujan satuan)
```

#### Untuk Analisis Kala Ulang:
```
Gunakan kolom "Hujan (mm)" di tabel kala ulang untuk:
- Q2: 80 mm
- Q5: 100 mm
- Q10: 120 mm
- dst.

Ini akan otomatis dihitung menjadi Ro yang sesuai.
```

---

### 8. **Verifikasi Hasil**

**Debit Rasional untuk DAS 50 km²:**
```
DAS Kecil (< 10 km²):   Q = 5-50 m³/s
DAS Sedang (10-100 km²): Q = 50-500 m³/s  ✅
DAS Besar (> 100 km²):   Q = 500-5000 m³/s
```

**Dengan Ro = 10 mm:**
```
Qp = 82.2 m³/s  ✅ Masuk akal untuk DAS 50 km²
```

**Dengan Ro = 100 mm:**
```
Qp = 822 m³/s  ⚠️ Terlalu tinggi untuk DAS 50 km²
```

---

## 📊 Ringkasan

| Aspek | Sebelum Kalibrasi | Setelah Kalibrasi |
|-------|-------------------|-------------------|
| **Formula** | ❌ Salah | ✅ Benar (SNI 2415:2016) |
| **Input Default Ro** | 100 mm | 10 mm |
| **Qp (Ro=100mm)** | 970 m³/s | 822 m³/s |
| **Qp (Ro=10mm)** | 97 m³/s | 82 m³/s |
| **Threshold** | > 1000 m³/s | > 500 m³/s |
| **Peringatan** | Tidak muncul | ✅ Muncul (membantu user) |

---

**Status:** ✅ **DIPERBAIKI** - Input default Ro diubah dari 100mm menjadi 10mm, threshold peringatan lebih sensitif dengan pesan informatif.
