# Update Data Pilot Sesuai SNI

## Perubahan yang Dilakukan

Data pilot untuk Metode Rasional telah disesuaikan agar menggunakan nilai koefisien limpasan (C) yang sesuai dengan standar SNI dan referensi resmi.

## Referensi Standar

- **Permen PU No. 12/PRT/M/2014**: Penyelenggaraan Sistem Drainase Perkotaan
- **Suripin (2004)**: Sistem Drainase Perkotaan Berkelanjutan
- **SNI 2415:2016**: Tata Cara Perhitungan Debit Banjir Rencana

## Detail Perubahan Data Pilot Rasional

### 1. DAS Kecil Urban - Bandung
**Sebelum**: C = 0.75 (Urban area dengan perkerasan tinggi)
**Sesudah**: C = 0.70 (Pemukiman Padat - Suripin 2004)
- Deskripsi diperbarui: "DAS kecil di area perkotaan dengan pemukiman padat"
- Lebih akurat menggambarkan karakteristik kawasan pemukiman

### 2. DAS Komersial - Jakarta
**Sebelum**: "DAS Perumahan - Jakarta", C = 0.85 (Area perumahan padat)
**Sesudah**: "DAS Komersial - Jakarta", C = 0.85 (Pusat Kota/Kawasan Komersial - Permen PU 12/2014)
- Nama diubah untuk mencerminkan karakteristik sebenarnya
- Deskripsi: "Kawasan pusat kota dengan area komersial"
- Nilai C tetap 0.85 sesuai standar untuk kawasan komersial

### 3. DAS Jalan Aspal - Bekasi
**Sebelum**: "DAS Industri - Bekasi", C = 0.90 (Kawasan industri)
**Sesudah**: "DAS Jalan Aspal - Bekasi", C = 0.95 (Jalan Aspal - Permen PU 12/2014)
- Nama diubah menjadi "DAS Jalan Aspal"
- Deskripsi: "Kawasan dengan dominasi jalan aspal dan perkerasan"
- Nilai C dinaikkan ke 0.95 sesuai standar untuk jalan aspal

### 4. DAS Pertanian - Jawa Barat
**Sebelum**: C = 0.45 (Lahan pertanian dengan infiltrasi baik)
**Sesudah**: C = 0.30 (Lahan Pertanian - Suripin 2004)
- Nilai C disesuaikan ke 0.30 sesuai standar untuk lahan pertanian
- Lebih realistis untuk karakteristik lahan pertanian Indonesia

### 5. DAS Pemukiman Sedang - Semarang
**Sebelum**: "DAS Campuran - Semarang", C = 0.60 (Campuran perumahan dan taman)
**Sesudah**: "DAS Pemukiman Sedang - Semarang", C = 0.50 (Pemukiman Sedang - Suripin 2004)
- Nama diubah untuk kejelasan kategori
- Deskripsi: "DAS dengan pemukiman sedang dan ruang terbuka"
- Nilai C disesuaikan ke 0.50 sesuai standar pemukiman sedang

## Mapping Nilai C dengan SNI_RUNOFF_COEFFICIENTS

| Pilot Data | Nilai C | Kategori SNI | Referensi |
|------------|---------|--------------|-----------|
| DAS Kecil Urban - Bandung | 0.70 | PEMUKIMAN_PADAT | Suripin 2004 |
| DAS Komersial - Jakarta | 0.85 | PUSAT_KOTA | Permen PU 12/2014 |
| DAS Jalan Aspal - Bekasi | 0.95 | JALAN_ASPAL | Permen PU 12/2014 |
| DAS Pertanian - Jawa Barat | 0.30 | PERTANIAN | Suripin 2004 |
| DAS Pemukiman Sedang - Semarang | 0.50 | PEMUKIMAN_SEDANG | Suripin 2004 |

## Kepatuhan SNI 2415:2016

### Validasi Luas DAS
✅ Semua data pilot memiliki A ≤ 3 km² (Pasal 3.1)
- DAS Komersial Jakarta: 1.2 km²
- DAS Pemukiman Sedang Semarang: 1.8 km²
- DAS Pertanian Jawa Barat: 2.2 km²
- DAS Kecil Urban Bandung: 2.5 km²
- DAS Jalan Aspal Bekasi: 2.8 km²

### Validasi Koefisien Limpasan
✅ Semua nilai C dalam rentang 0.0 - 1.0
✅ Nilai C sesuai dengan karakteristik tata guna lahan
✅ Referensi standar tercantum dalam komentar kode

### Validasi Parameter Lain
✅ Intensitas hujan (I): 95-140 mm/jam (realistis untuk Indonesia)
✅ Waktu konsentrasi (tc): 30-50 menit (sesuai ukuran DAS kecil)

## Manfaat Perubahan

1. **Akurasi Lebih Tinggi**: Nilai C sesuai dengan standar resmi
2. **Traceability**: Setiap nilai memiliki referensi yang jelas
3. **Konsistensi**: Selaras dengan komponen RunoffCoefficientInput
4. **Edukasi**: User dapat belajar nilai C standar untuk berbagai tata guna lahan
5. **Compliance**: Memenuhi persyaratan SNI 2415:2016

## Kategori Tata Guna Lahan yang Tersedia

Pilot data sekarang mencakup 5 kategori berbeda:
1. **Pemukiman Padat** (C = 0.70)
2. **Pusat Kota/Komersial** (C = 0.85)
3. **Jalan Aspal** (C = 0.95)
4. **Lahan Pertanian** (C = 0.30)
5. **Pemukiman Sedang** (C = 0.50)

Rentang nilai: 0.30 - 0.95 (mencakup spektrum dari rural hingga urban padat)

## Build Status

✅ Build berhasil: 697.96 kB
✅ TypeScript compilation passed
✅ Semua validasi SNI terpenuhi

## Rekomendasi Penggunaan

- **DAS Urban Padat**: Gunakan pilot data Bandung (C=0.70) atau Jakarta (C=0.85)
- **DAS dengan Jalan Aspal**: Gunakan pilot data Bekasi (C=0.95)
- **DAS Rural/Pertanian**: Gunakan pilot data Jawa Barat (C=0.30)
- **DAS Pemukiman Campuran**: Gunakan pilot data Semarang (C=0.50)

## Update Date

2025-01-XX - Data pilot disesuaikan dengan SNI_RUNOFF_COEFFICIENTS
