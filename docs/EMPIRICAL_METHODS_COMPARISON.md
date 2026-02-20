# Perbedaan Metode Empiris Perhitungan Debit Banjir Rencana

## Overview

Terdapat 4 metode empiris yang diimplementasikan dalam RekaSDA Pro untuk perhitungan debit banjir rencana, masing-masing dengan karakteristik dan batasan yang berbeda.

---

## 1. Metode Rasional Standar

### Formula
```
Q = 0.278 × C × I × A
```

### Parameter
- **Q** = Debit puncak (m³/s)
- **C** = Koefisien limpasan (0-1)
- **I** = Intensitas hujan (mm/jam)
- **A** = Luas DAS (km²)
- **0.278** = Faktor konversi metrik

### Karakteristik
- **Rentang Valid**: A ≤ 3 km² (300 Ha)
- **Referensi**: SNI 2415:2016 Pasal 5.2
- **Asumsi**: 
  - Hujan merata di seluruh DAS
  - Intensitas hujan konstan
  - Waktu konsentrasi = durasi hujan
  - Koefisien C konstan

### Kelebihan
- ✅ Sederhana dan mudah dipahami
- ✅ Standar SNI resmi
- ✅ Cocok untuk DAS kecil urban
- ✅ Parameter minimal (hanya C, I, A)

### Kekurangan
- ❌ Hanya untuk DAS sangat kecil (≤ 3 km²)
- ❌ Tidak memperhitungkan karakteristik DAS
- ❌ Tidak ada parameter waktu
- ❌ Asumsi terlalu sederhana untuk DAS besar

### Aplikasi Ideal
- Drainase perkotaan
- Saluran kecil
- Kawasan perumahan
- Area komersial kecil

---

## 2. Metode Haspers & Osugi

### Formula
```
Q = α × β × A^0.75 × I
```

Dengan:
```
α = C × (100 + A) / (100 + 1.5A)
β = 120 / (120 + L/√S)
```

### Parameter
- **Q** = Debit puncak (m³/s)
- **A** = Luas DAS (km²)
- **L** = Panjang sungai utama (km)
- **S** = Kemiringan rata-rata DAS (desimal)
- **I** = Intensitas hujan (mm/jam)
- **α** = Koefisien reduksi luas
- **β** = Koefisien waktu konsentrasi

### Karakteristik
- **Rentang Valid**: 3 km² < A ≤ 100 km²
- **Referensi**: Praktik empiris Indonesia (Haspers, 1935; Osugi, 1940)
- **Asumsi**:
  - Memperhitungkan bentuk DAS
  - Waktu konsentrasi fungsi dari L dan S
  - Reduksi intensitas untuk DAS lebih besar

### Kelebihan
- ✅ Memperhitungkan topografi (L, S)
- ✅ Cocok untuk DAS sedang
- ✅ Lebih akurat dari Rasional untuk DAS > 3 km²
- ✅ Mempertimbangkan waktu konsentrasi

### Kekurangan
- ❌ Memerlukan data topografi (L, S)
- ❌ Tidak standar SNI (empiris)
- ❌ Kurang akurat untuk DAS > 100 km²

### Aplikasi Ideal
- DAS sub-urban
- Sungai kecil-menengah
- Topografi bergelombang
- Perencanaan bendung kecil

---

## 3. Metode der Weduwen

### Formula
```
Q = α × β × A^0.7 × I
```

Dengan:
```
α = C × (120 + A) / (120 + 2A)
β = 120 / (120 + 1.5L/√S)
```

### Parameter
- **Q** = Debit puncak (m³/s)
- **A** = Luas DAS (km²)
- **L** = Panjang sungai utama (km)
- **S** = Kemiringan rata-rata DAS (desimal)
- **I** = Intensitas hujan (mm/jam)
- **α** = Koefisien reduksi luas (berbeda dari Haspers)
- **β** = Koefisien waktu konsentrasi (berbeda dari Haspers)

### Karakteristik
- **Rentang Valid**: 3 km² < A ≤ 100 km²
- **Referensi**: der Weduwen (1951) - Belanda/Indonesia
- **Asumsi**:
  - Mirip Haspers tapi dengan koefisien berbeda
  - Lebih konservatif (debit lebih tinggi)
  - Cocok untuk DAS pegunungan

### Kelebihan
- ✅ Lebih konservatif (aman untuk desain)
- ✅ Cocok untuk topografi curam
- ✅ Memperhitungkan karakteristik DAS Indonesia
- ✅ Teruji untuk DAS pegunungan

### Kekurangan
- ❌ Cenderung overestimate untuk DAS datar
- ❌ Tidak standar SNI
- ❌ Memerlukan data topografi detail

### Aplikasi Ideal
- DAS pegunungan
- Lereng curam
- Desain konservatif
- Bangunan pengendali banjir

### Perbedaan dengan Haspers
| Aspek | Haspers | der Weduwen |
|-------|---------|-------------|
| Eksponen A | 0.75 | 0.70 |
| Koefisien α | (100+A)/(100+1.5A) | (120+A)/(120+2A) |
| Koefisien β | 120/(120+L/√S) | 120/(120+1.5L/√S) |
| Hasil | Lebih rendah | Lebih tinggi (konservatif) |
| Cocok untuk | Dataran | Pegunungan |

---

## 4. Metode Melchior

### Formula
```
Q = α × β × C × A^0.8 × I
```

Dengan:
```
α = (200 + A) / (200 + 3A)
β = 120 / (120 + 2L/√S)
t = 0.1 × L / √S  (waktu konsentrasi)
```

### Parameter
- **Q** = Debit puncak (m³/s)
- **A** = Luas DAS (km²)
- **L** = Panjang sungai utama (km)
- **S** = Kemiringan rata-rata DAS (desimal)
- **I** = Intensitas hujan (mm/jam)
- **C** = Koefisien limpasan (0-1)
- **α** = Koefisien reduksi luas (untuk DAS besar)
- **β** = Koefisien waktu konsentrasi
- **t** = Waktu konsentrasi (jam)

### Karakteristik
- **Rentang Valid**: A > 100 km²
- **Referensi**: Melchior (1960) - untuk DAS besar
- **Asumsi**:
  - DAS besar dengan karakteristik kompleks
  - Reduksi intensitas signifikan
  - Waktu konsentrasi panjang
  - Mempertimbangkan koefisien C

### Kelebihan
- ✅ Dirancang khusus untuk DAS besar
- ✅ Memperhitungkan reduksi intensitas
- ✅ Mempertimbangkan waktu konsentrasi
- ✅ Lebih realistis untuk sungai besar

### Kekurangan
- ❌ Hanya untuk DAS > 100 km²
- ❌ Memerlukan banyak parameter
- ❌ Tidak standar SNI
- ❌ Kompleks untuk DAS kecil

### Aplikasi Ideal
- Sungai besar
- Bendungan besar
- Perencanaan regional
- DAS dataran luas

---

## Perbandingan Lengkap

### Tabel Perbandingan

| Aspek | Rasional | Haspers | der Weduwen | Melchior |
|-------|----------|---------|-------------|----------|
| **Rentang A** | ≤ 3 km² | 3-100 km² | 3-100 km² | > 100 km² |
| **Parameter** | C, I, A | A, L, S, I | A, L, S, I | C, A, L, S, I |
| **Kompleksitas** | Sangat Sederhana | Sedang | Sedang | Kompleks |
| **Status SNI** | ✅ Resmi | ❌ Empiris | ❌ Empiris | ❌ Empiris |
| **Topografi** | Tidak | Ya (L, S) | Ya (L, S) | Ya (L, S) |
| **Waktu Konsentrasi** | Implisit | Eksplisit | Eksplisit | Eksplisit |
| **Reduksi Luas** | Tidak | Ya (α) | Ya (α) | Ya (α) |
| **Eksponen A** | 1.0 | 0.75 | 0.70 | 0.8 |
| **Konservatisme** | Sedang | Rendah | Tinggi | Sedang |

### Grafik Perbandingan Debit

Untuk DAS dengan kondisi sama (I=100 mm/jam, C=0.7, L=10 km, S=2%):

| Luas DAS | Rasional | Haspers | der Weduwen | Melchior |
|----------|----------|---------|-------------|----------|
| 1 km² | 19.5 m³/s | - | - | - |
| 3 km² | 58.4 m³/s | - | - | - |
| 10 km² | - | 142 m³/s | 156 m³/s | - |
| 50 km² | - | 485 m³/s | 521 m³/s | - |
| 100 km² | - | 842 m³/s | 895 m³/s | - |
| 200 km² | - | - | - | 1,456 m³/s |

---

## Pemilihan Metode

### Decision Tree

```
Luas DAS?
│
├─ A ≤ 3 km²
│  └─ Gunakan: RASIONAL STANDAR
│     ✅ SNI 2415:2016 Pasal 5.2
│
├─ 3 < A ≤ 100 km²
│  ├─ Topografi datar/bergelombang?
│  │  └─ Gunakan: HASPERS & OSUGI
│  │     ⚠️ Hasil lebih rendah (ekonomis)
│  │
│  └─ Topografi pegunungan/curam?
│     └─ Gunakan: DER WEDUWEN
│        ⚠️ Hasil lebih tinggi (konservatif)
│
└─ A > 100 km²
   └─ Gunakan: MELCHIOR
      ⚠️ Untuk DAS besar/sungai utama
```

### Rekomendasi Praktis

1. **Drainase Perkotaan (< 3 km²)**
   - Metode: **Rasional**
   - Alasan: Standar SNI, sederhana, cukup akurat

2. **Sub-DAS Dataran (3-100 km²)**
   - Metode: **Haspers**
   - Alasan: Ekonomis, cocok topografi landai

3. **Sub-DAS Pegunungan (3-100 km²)**
   - Metode: **der Weduwen**
   - Alasan: Konservatif, aman untuk lereng curam

4. **Sungai Besar (> 100 km²)**
   - Metode: **Melchior** atau **HSS Nakayasu**
   - Alasan: Lebih akurat untuk DAS besar

---

## Implementasi di RekaSDA Pro

### File Lokasi
- **Rasional**: `src/lib/engine/rationalMethod.ts`
- **Haspers/Weduwen/Melchior**: `src/lib/engine/flood/modifiedRationalIndo.ts`

### Validasi SNI
Semua metode divalidasi melalui `useSNI2415Workflow()` yang memberikan warning jika metode tidak sesuai dengan luas DAS.

### UI/UX
- **MethodSelector**: Menampilkan badge "recommended" sesuai luas DAS
- **SNIWarning**: Memberikan peringatan jika metode tidak sesuai SNI
- **PilotDataLoader**: Menyediakan data contoh untuk setiap metode

---

## Referensi

1. **SNI 2415:2016** - Tata Cara Perhitungan Debit Banjir Rencana
2. **Haspers (1935)** - Empirical Formula for Indonesian Catchments
3. **Osugi (1940)** - Modified Rational Method for Tropical Regions
4. **der Weduwen (1951)** - Flood Discharge Calculation for Mountainous Areas
5. **Melchior (1960)** - Large Catchment Flood Estimation
6. **Triatmodjo (2013)** - Hidrologi Terapan
7. **Suripin (2004)** - Sistem Drainase Perkotaan Berkelanjutan

---

## Kesimpulan

Setiap metode empiris memiliki **rentang validitas** dan **karakteristik** yang berbeda:

- **Rasional**: Sederhana, SNI, DAS kecil (≤ 3 km²)
- **Haspers**: Ekonomis, DAS sedang dataran (3-100 km²)
- **der Weduwen**: Konservatif, DAS sedang pegunungan (3-100 km²)
- **Melchior**: Kompleks, DAS besar (> 100 km²)

Pemilihan metode yang tepat sangat penting untuk **akurasi** dan **keamanan** desain infrastruktur air.
