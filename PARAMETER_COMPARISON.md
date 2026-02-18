# 📊 Parameter Input: Metode Rasional vs HSS Nakayasu

## ✅ KOREKSI: Kedua Metode Menggunakan Koefisien Limpasan (C)

---

## 🔍 Kesamaan & Perbedaan

### ✅ KESAMAAN: Koefisien Limpasan (C)

**Kedua metode menggunakan C untuk menghitung hujan efektif:**

#### Metode Rasional:
```
Q = 0.278 × C × I × A
```
- C langsung dalam formula debit

#### HSS Nakayasu:
```
Ro = C × R
Qp = (α × Ro × A) / (3.6 × (0.3 × Tp + T0.3))
```
- C digunakan untuk menghitung Ro (hujan efektif)
- Ro kemudian digunakan dalam formula Qp

---

## 📊 Koefisien Limpasan (C)

**Definisi:**
Rasio antara limpasan permukaan dengan curah hujan total

**Rentang:** 0.1 - 0.9 (umumnya 0.15 - 0.95)

**Nilai Berdasarkan Tata Guna Lahan:**
| Karakteristik | Nilai C | Keterangan |
|---------------|---------|------------|
| Jalan Aspal | 0.95 | Urban, vegetasi jarang |
| Pusat Kota | 0.85 | Area terbangun padat |
| Pemukiman Padat | 0.70 | Permukiman/beton |
| Pemukiman Sedang | 0.50 | Campuran bangunan-taman |
| Pertanian | 0.30 | Infiltrasi sedang |
| Taman/RTH | 0.15 | Resapan baik |
| Hutan | 0.15 | Vegetasi lebat, resapan tinggi |

**Faktor yang Mempengaruhi:**
1. **Penggunaan Lahan** - Area terbangun (C tinggi) vs hutan (C rendah)
2. **Infiltrasi** - Laju infiltrasi besar → C kecil
3. **Kemiringan Lereng** - Lereng curam → C tinggi (air cepat mengalir)
4. **Jenis Tanah** - Tanah liat (C tinggi) vs pasir (C rendah)

**Referensi:** Permen PU No. 12/2014, Suripin (2004), UMY, ITN Yogyakarta

---

## 🎯 Perbedaan Parameter Lainnya

### Parameter Unik Metode Rasional:

| Parameter | Nama | Satuan | Rentang |
|-----------|------|--------|---------|
| I | Intensitas Hujan | mm/jam | 10 - 300 |
| tc | Waktu Konsentrasi | menit | 5 - 120 |

### Parameter Unik HSS Nakayasu:

| Parameter | Nama | Satuan | Rentang |
|-----------|------|--------|---------|
| **α** | Parameter DAS | - | 1.5 - 3.0 |
| Ro | Hujan Efektif | mm | 1 - 20 |
| Tg | Time Lag | jam | 0.1 - 48 |
| Tr | Time Unit | jam | 0.5Tg - Tg |
| L | Panjang Sungai | km | 0.1 - 1000 |

---

## 🔧 Implementasi di UI

### Metode Rasional
```typescript
<RunoffCoefficientInput
  value={rationalInputs.C}
  onChange={(v) => setRationalInputs({ ...rationalInputs, C: v || 0.70 })}
  required={true}
/>
```

### HSS Nakayasu
```typescript
// 1. Input Koefisien Limpasan (C)
<RunoffCoefficientInput
  value={nakayasuInputs.C}
  onChange={(v) => setNakayasuInputs({ ...nakayasuInputs, C: v || 0.70 })}
  required={false}
/>

// 2. Input Hujan Efektif (Ro)
// Ro = C × R (dihitung otomatis atau manual)
<input
  type="number"
  value={nakayasuInputs.Ro}
  onChange={e => setNakayasuInputs({...nakayasuInputs, Ro: parseFloat(e.target.value) || 0})}
/>

// 3. Input Parameter Alpha (α)
<AlphaParameterInput
  value={nakayasuInputs.Alpha}
  onChange={(v) => setNakayasuInputs({ ...nakayasuInputs, Alpha: v || 2.0 })}
  required={true}
/>
```

---

## 📋 Tabel Ringkasan

| Aspek | Metode Rasional | HSS Nakayasu |
|-------|-----------------|---------------|
| **Koefisien C** | ✅ Ya (langsung) | ✅ Ya (untuk Ro) |
| **Parameter α** | ❌ Tidak | ✅ Ya |
| **Hujan Efektif** | Implisit (C×I) | Eksplisit (Ro=C×R) |
| **Hidrograf** | Tidak ada | Ada (lengkap) |
| **Kompleksitas** | Sederhana | Kompleks |
| **DAS** | < 50 km² | > 10 km² |

---

## 💡 Contoh Perhitungan

### Metode Rasional:
```
C = 0.70 (Pemukiman Padat)
I = 120 mm/jam
A = 2.5 km²

Q = 0.278 × 0.70 × 120 × 2.5
  = 58.8 m³/s
```

### HSS Nakayasu:
```
C = 0.70 (Pemukiman Padat)
R = 100 mm (Curah hujan rencana)
Ro = C × R = 0.70 × 100 = 70 mm (Hujan efektif)

α = 2.0
A = 50 km²
Tg = 1.26 jam
Tp = 2.46 jam
T0.3 = 2.52 jam

Qp = (2.0 × 70 × 50) / (3.6 × (0.3 × 2.46 + 2.52))
   = 7000 / 12.16
   = 575.7 m³/s
```

---

## ✅ Kesimpulan

1. **Kedua metode MENGGUNAKAN Koefisien Limpasan (C)**
   - Rasional: C langsung dalam formula
   - Nakayasu: C untuk menghitung Ro

2. **C memiliki nilai yang sama** (0.15 - 0.95)
   - Tergantung tata guna lahan
   - Referensi: Permen PU 12/2014

3. **Perbedaan utama:**
   - Rasional: Lebih sederhana, debit puncak saja
   - Nakayasu: Lebih kompleks, hidrograf lengkap, butuh parameter α

4. **UI Implementation:**
   - RunoffCoefficientInput untuk C (kedua metode)
   - AlphaParameterInput untuk α (hanya Nakayasu)

---

**Status:** ✅ Koreksi selesai - Kedua metode menggunakan koefisien limpasan (C) dengan dropdown yang sama.

---

## 🔍 Perbedaan Parameter

### 1. Metode Rasional

**Formula:**
```
Q = 0.278 × C × I × A
```

**Parameter Utama:**
| Parameter | Nama | Satuan | Rentang | Tergantung |
|-----------|------|--------|---------|------------|
| **C** | Koefisien Limpasan | - | 0.15 - 0.95 | Tata guna lahan |
| I | Intensitas Hujan | mm/jam | 10 - 300 | Analisis hujan |
| A | Luas DAS | km² | < 50 | Pengukuran |

**Koefisien C berdasarkan:**
- Jalan Aspal: 0.95
- Pusat Kota: 0.85
- Pemukiman Padat: 0.70
- Pemukiman Sedang: 0.50
- Taman/RTH: 0.15
- Hutan: 0.15

**Referensi:** Permen PU No. 12/2014 & Suripin (2004)

---

### 2. HSS Nakayasu

**Formula:**
```
Qp = (α × Ro × A) / (3.6 × (0.3 × Tp + T0.3))
Tp = Tg + 0.8 × Tr
T0.3 = α × Tg
```

**Parameter Utama:**
| Parameter | Nama | Satuan | Rentang | Tergantung |
|-----------|------|--------|---------|------------|
| **α** | Parameter DAS | - | 1.5 - 3.0 | Karakteristik DAS |
| Ro | Hujan Satuan | mm | 1 - 20 | Analisis hujan |
| Tg | Time Lag | jam | 0.1 - 48 | L, A (0.21×L^0.7) |
| Tr | Time Unit | jam | 0.5Tg - Tg | Durasi hujan |
| A | Luas DAS | km² | > 10 | Pengukuran |
| L | Panjang Sungai | km | 0.1 - 1000 | Pengukuran |

**Parameter α berdasarkan:**
- DAS Curam (Pegunungan): 1.5
- DAS Agak Curam: 1.8
- DAS Normal (Standard): 2.0 ✅
- DAS Agak Landai: 2.5
- DAS Landai (Dataran): 3.0

**Referensi:** SNI 2415:2016 Pasal 6.3

---

## 📋 Perbandingan Detail

### Koefisien Limpasan (C) - Metode Rasional

**Definisi:**
- Rasio antara limpasan permukaan dengan curah hujan total
- Menunjukkan berapa persen hujan yang menjadi aliran

**Faktor yang Mempengaruhi:**
- ✅ Tata guna lahan (aspal, beton, rumput, hutan)
- ✅ Jenis permukaan (kedap air vs resapan)
- ✅ Kemiringan lahan
- ✅ Kondisi tanah

**Karakteristik:**
- Nilai tetap untuk satu perhitungan
- Tidak berubah dengan waktu
- Spesifik untuk kondisi permukaan

**Contoh Penggunaan:**
```typescript
// Pemukiman padat
C = 0.70
Q = 0.278 × 0.70 × 120 × 2.5 = 58.8 m³/s
```

---

### Parameter Alpha (α) - HSS Nakayasu

**Definisi:**
- Parameter karakteristik DAS yang mempengaruhi bentuk hidrograf
- Menunjukkan respon DAS terhadap hujan

**Faktor yang Mempengaruhi:**
- ✅ Topografi (curam vs landai)
- ✅ Morfologi DAS (bentuk, panjang sungai)
- ✅ Vegetasi (lebat vs jarang)
- ✅ Jenis tanah (permeabilitas)
- ✅ Kondisi geologi

**Karakteristik:**
- Mempengaruhi waktu puncak dan bentuk hidrograf
- α kecil → puncak tinggi, respon cepat
- α besar → puncak rendah, respon lambat

**Contoh Penggunaan:**
```typescript
// DAS Normal
α = 2.0
Tg = 0.21 × 15^0.7 = 1.26 jam
Tp = 1.26 + 0.8 × 1.5 = 2.46 jam
T0.3 = 2.0 × 1.26 = 2.52 jam
Qp = (2.0 × 10 × 50) / (3.6 × (0.3 × 2.46 + 2.52)) = 82.2 m³/s
```

---

## 🎯 Kapan Menggunakan Apa?

### Gunakan Metode Rasional (dengan C):
- ✅ DAS kecil (< 50 km²)
- ✅ Drainase perkotaan
- ✅ Perhitungan cepat
- ✅ Data terbatas
- ✅ Fokus pada debit puncak saja

### Gunakan HSS Nakayasu (dengan α):
- ✅ DAS sedang-besar (> 10 km²)
- ✅ Analisis banjir sungai
- ✅ Perlu hidrograf lengkap
- ✅ Data hujan jam-jaman tersedia
- ✅ Desain bangunan air

---

## 🔧 Implementasi di UI

### Metode Rasional
```typescript
<RunoffCoefficientInput
  value={rationalInputs.C}
  onChange={(v) => setRationalInputs({ ...rationalInputs, C: v || 0.70 })}
  required={true}
/>
```

**Dropdown Options:**
- Jalan Aspal (C = 0.95)
- Pusat Kota (C = 0.85)
- Pemukiman Padat (C = 0.70)
- dst.

### HSS Nakayasu
```typescript
<AlphaParameterInput
  value={nakayasuInputs.Alpha}
  onChange={(v) => setNakayasuInputs({ ...nakayasuInputs, Alpha: v || 2.0 })}
  required={true}
/>
```

**Dropdown Options:**
- DAS Curam (α = 1.5)
- DAS Agak Curam (α = 1.8)
- DAS Normal (α = 2.0) ✅ Standard
- DAS Agak Landai (α = 2.5)
- DAS Landai (α = 3.0)

---

## 📊 Tabel Ringkasan

| Aspek | Koefisien C (Rasional) | Parameter α (Nakayasu) |
|-------|------------------------|------------------------|
| **Definisi** | Rasio limpasan/hujan | Karakteristik DAS |
| **Rentang** | 0.15 - 0.95 | 1.5 - 3.0 |
| **Standard** | 0.70 (pemukiman) | 2.0 (normal) |
| **Tergantung** | Tata guna lahan | Topografi DAS |
| **Pengaruh** | Besaran debit | Bentuk hidrograf |
| **Referensi** | Permen PU 12/2014 | SNI 2415:2016 |
| **Input UI** | RunoffCoefficientInput | AlphaParameterInput |

---

## ✅ Kesimpulan

1. **C dan α adalah parameter BERBEDA**
   - C untuk Metode Rasional
   - α untuk HSS Nakayasu

2. **Tidak bisa dipertukarkan**
   - C fokus pada tata guna lahan
   - α fokus pada karakteristik DAS

3. **Keduanya punya dropdown sendiri**
   - RunoffCoefficientInput untuk C
   - AlphaParameterInput untuk α

4. **Referensi berbeda**
   - C: Permen PU No. 12/2014
   - α: SNI 2415:2016 Pasal 6.3

---

**Status:** ✅ Kedua komponen dropdown sudah terintegrasi dengan data SNI yang sesuai.
