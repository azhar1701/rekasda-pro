# Penyesuaian Batasan Luas DAS SNI 2415:2016

## Perubahan yang Dilakukan

Fungsi `useSNI2415Workflow` telah disesuaikan untuk mendukung semua metode empiris perhitungan debit banjir rencana, bukan hanya Rasional vs HSS.

## Batasan Luas DAS Berdasarkan Metode

### 1. Metode Rasional Standar
- **Rentang**: A ≤ 3 km² (300 Ha)
- **Referensi**: SNI 2415:2016 Pasal 3.1
- **Status**: Metode resmi SNI
- **Karakteristik**: DAS kecil, urban/perkotaan

### 2. Metode Haspers & Osugi
- **Rentang**: 3 km² < A ≤ 100 km²
- **Referensi**: Praktik empiris Indonesia
- **Status**: Metode modifikasi rasional
- **Karakteristik**: DAS sedang, topografi bergelombang

### 3. Metode der Weduwen
- **Rentang**: 3 km² < A ≤ 100 km²
- **Referensi**: Praktik empiris Indonesia
- **Status**: Metode modifikasi rasional
- **Karakteristik**: DAS sedang, pegunungan

### 4. Metode Melchior
- **Rentang**: A > 100 km²
- **Referensi**: Praktik empiris Indonesia
- **Status**: Metode untuk DAS besar
- **Karakteristik**: DAS besar, dataran luas

### 5. HSS Nakayasu
- **Rentang**: A > 3 km² (untuk analisis hidrograf lengkap)
- **Referensi**: SNI 2415:2016 Pasal 6.3
- **Status**: Metode resmi SNI
- **Karakteristik**: Semua ukuran DAS > 3 km²

## Logika Validasi Baru

### Kondisi 1: A ≤ 3 km²
```typescript
isValid: true
recommended: 'RATIONAL'
warnings: []
```
**Metode yang valid**: Rasional Standar

### Kondisi 2: 3 km² < A ≤ 100 km²
```typescript
isValid: false  // Rasional tidak valid
recommended: 'HSS_NAKAYASU'
warnings: [
  "Luas DAS melebihi batas Metode Rasional (300 Ha)",
  "Gunakan Metode Empiris Modifikasi (Haspers/Weduwen) atau HSS"
]
```
**Metode yang valid**: Haspers, der Weduwen, HSS Nakayasu

### Kondisi 3: A > 100 km²
```typescript
isValid: false  // Rasional tidak valid
recommended: 'HSS_NAKAYASU'
warnings: [
  "Luas DAS melebihi batas Metode Rasional (300 Ha)",
  "Gunakan Metode Melchior (A > 100 km²) atau HSS"
]
```
**Metode yang valid**: Melchior, HSS Nakayasu

## Contoh Kasus

### Kasus 1: DAS 1.5 km²
- ✅ **Rasional**: Valid (A ≤ 3 km²)
- ❌ **Haspers**: Tidak sesuai (A harus > 3 km²)
- ❌ **Weduwen**: Tidak sesuai (A harus > 3 km²)
- ❌ **Melchior**: Tidak sesuai (A harus > 100 km²)
- ⚠️ **HSS**: Bisa digunakan, tapi Rasional lebih efisien

### Kasus 2: DAS 25 km²
- ❌ **Rasional**: Tidak valid (A > 3 km²)
- ✅ **Haspers**: Valid (3 < A ≤ 100 km²) - **RECOMMENDED**
- ✅ **Weduwen**: Valid (3 < A ≤ 100 km²)
- ❌ **Melchior**: Tidak sesuai (A harus > 100 km²)
- ✅ **HSS**: Valid (A > 3 km²)

### Kasus 3: DAS 150 km²
- ❌ **Rasional**: Tidak valid (A > 3 km²)
- ❌ **Haspers**: Tidak sesuai (A > 100 km²)
- ❌ **Weduwen**: Tidak sesuai (A > 100 km²)
- ✅ **Melchior**: Valid (A > 100 km²) - **RECOMMENDED**
- ✅ **HSS**: Valid (A > 3 km²)

## Pesan Warning yang Ditampilkan

### Untuk DAS 3-100 km²
```
⚠️ Peringatan SNI 2415:2016 Pasal 3.1

• Luas DAS (2500 Ha / 25.00 km²) melebihi batas Metode Rasional (300 Ha).
• Sesuai SNI 2415:2016 Pasal 3.1, gunakan Metode Empiris Modifikasi 
  (Haspers/Weduwen) atau HSS (Hidrograf Satuan Sintetis).
```

### Untuk DAS > 100 km²
```
⚠️ Peringatan SNI 2415:2016 Pasal 3.1

• Luas DAS (15000 Ha / 150.00 km²) melebihi batas Metode Rasional (300 Ha).
• Sesuai SNI 2415:2016 Pasal 3.1, gunakan Metode Melchior (A > 100 km²) 
  atau HSS (Hidrograf Satuan Sintetis).
```

## Rekomendasi Metode di UI

### MethodSelector Logic
```typescript
{ 
  id: 'rational', 
  recommended: inputs.area > 0 && inputs.area <= 3 
}
{ 
  id: 'haspers', 
  recommended: inputs.area > 3 && inputs.area <= 100 
}
{ 
  id: 'weduwen', 
  recommended: false  // Tidak auto-recommend
}
{ 
  id: 'melchior', 
  recommended: inputs.area > 100 
}
```

## Manfaat Perubahan

1. **Akurasi Lebih Tinggi**: Setiap metode digunakan sesuai rentang validnya
2. **Guidance yang Jelas**: User mendapat rekomendasi metode yang tepat
3. **Compliance SNI**: Tetap mengacu pada SNI 2415:2016 Pasal 3.1
4. **Fleksibilitas**: Mendukung metode empiris modifikasi untuk DAS sedang
5. **User Experience**: Pesan warning yang informatif dan actionable

## Referensi

- **SNI 2415:2016 Pasal 3.1**: Batasan Metode Rasional (A ≤ 300 Ha)
- **SNI 2415:2016 Pasal 6.3**: Metode HSS Nakayasu
- **Triatmodjo (2013)**: Hidrologi Terapan
- **Suripin (2004)**: Sistem Drainase Perkotaan Berkelanjutan
- **Praktik Empiris Indonesia**: Metode Haspers, Weduwen, Melchior

## Build Status

✅ Build berhasil: 697.94 kB
✅ TypeScript compilation passed
✅ Validasi SNI terintegrasi dengan semua metode empiris

## Update Date

2025-01-XX - Batasan luas DAS disesuaikan untuk mendukung semua metode empiris
