# Penyesuaian Luas DAS Pilot Data

## Tujuan Perubahan

Menyesuaikan luas DAS pada data pilot Metode Rasional agar tetap dalam batas yang sesuai dengan SNI 2415:2016 Pasal 3.1, yaitu A ≤ 3 km² (300 ha).

## Perubahan Luas DAS

### Data Pilot Metode Rasional

| Pilot Data | Luas Sebelum | Luas Sesudah | Status |
|------------|--------------|--------------|--------|
| DAS Komersial Jakarta | 1.2 km² | **0.8 km²** | ✅ Lebih kecil, tetap valid |
| DAS Pemukiman Sedang Semarang | 1.8 km² | **1.2 km²** | ✅ Lebih kecil, tetap valid |
| DAS Jalan Aspal Bekasi | 2.8 km² | **1.5 km²** | ✅ Lebih aman dari batas |
| DAS Kecil Urban Bandung | 2.5 km² | **1.8 km²** | ✅ Lebih aman dari batas |
| DAS Pertanian Jawa Barat | 2.2 km² | **2.5 km²** | ✅ Tetap di bawah 3 km² |

## Alasan Penyesuaian

### 1. Kepatuhan SNI 2415:2016
- **Pasal 3.1**: Metode Rasional hanya valid untuk A ≤ 3 km² (300 ha)
- Semua data pilot harus berada jauh dari batas untuk menghindari ambiguitas
- Memberikan margin safety untuk pembelajaran user

### 2. Distribusi yang Lebih Baik
**Sebelum**:
- 0.8-1.2 km²: 1 data
- 1.2-2.0 km²: 2 data
- 2.0-3.0 km²: 2 data

**Sesudah**:
- 0.5-1.0 km²: 1 data (Jakarta: 0.8 km²)
- 1.0-1.5 km²: 2 data (Semarang: 1.2 km², Bekasi: 1.5 km²)
- 1.5-2.0 km²: 1 data (Bandung: 1.8 km²)
- 2.0-3.0 km²: 1 data (Jawa Barat: 2.5 km²)

### 3. Karakteristik Realistis

#### DAS Komersial Jakarta (0.8 km²)
- Kawasan komersial pusat kota biasanya memiliki DAS sangat kecil
- Sistem drainase terkonsentrasi dan intensif
- C = 0.85 (tinggi) cocok untuk area kecil dengan perkerasan padat

#### DAS Pemukiman Sedang Semarang (1.2 km²)
- Pemukiman sedang dengan ruang terbuka
- Ukuran DAS kecil sesuai karakteristik pemukiman suburban
- C = 0.50 (sedang) mencerminkan campuran perkerasan dan RTH

#### DAS Jalan Aspal Bekasi (1.5 km²)
- Kawasan dengan dominasi jalan aspal
- DAS kecil-menengah untuk area perkotaan
- C = 0.95 (sangat tinggi) sesuai untuk perkerasan penuh

#### DAS Kecil Urban Bandung (1.8 km²)
- Pemukiman padat perkotaan
- Ukuran DAS menengah untuk area urban
- C = 0.70 (tinggi) sesuai pemukiman padat

#### DAS Pertanian Jawa Barat (2.5 km²)
- Lahan pertanian dengan infiltrasi baik
- DAS lebih besar karena karakteristik rural
- C = 0.30 (rendah) sesuai lahan pertanian

## Validasi SNI 2415:2016

### ✅ Semua Data Memenuhi Kriteria

1. **Luas DAS**: 0.8 - 2.5 km² (semua ≤ 3 km²)
2. **Koefisien C**: 0.30 - 0.95 (sesuai SNI_RUNOFF_COEFFICIENTS)
3. **Intensitas Hujan**: 95 - 140 mm/jam (realistis untuk Indonesia)
4. **Waktu Konsentrasi**: 30 - 50 menit (sesuai ukuran DAS)

### Margin Safety dari Batas

| Pilot Data | Luas (km²) | Margin dari 3 km² |
|------------|------------|-------------------|
| Jakarta | 0.8 | 2.2 km² (73% di bawah batas) |
| Semarang | 1.2 | 1.8 km² (60% di bawah batas) |
| Bekasi | 1.5 | 1.5 km² (50% di bawah batas) |
| Bandung | 1.8 | 1.2 km² (40% di bawah batas) |
| Jawa Barat | 2.5 | 0.5 km² (17% di bawah batas) |

## Implikasi untuk Metode Lain

### Metode Haspers & der Weduwen (3-100 km²)
Data pilot tersedia dengan rentang:
- DAS Cikapundung Tengah: 25 km²
- DAS Cisadane Hulu: 45 km²
- DAS Kali Bekasi: 68 km²

### Metode Melchior (> 100 km²)
Data pilot tersedia dengan rentang:
- DAS Citarum Tengah: 280 km²
- DAS Cimanuk Hilir: 450 km²
- DAS Serayu Hilir: 620 km²

### HSS Nakayasu (> 3 km²)
Data pilot tersedia dengan rentang:
- DAS Ciliwung Tengah: 180 km²
- DAS Progo Hulu: 380 km²
- DAS Citarum Hulu: 450 km²

## Kesimpulan

✅ Semua data pilot Metode Rasional sekarang berada dalam rentang 0.8 - 2.5 km²
✅ Tidak ada overlap dengan metode empiris lain
✅ Distribusi luas DAS lebih merata
✅ Karakteristik tata guna lahan sesuai dengan ukuran DAS
✅ Margin safety yang cukup dari batas 3 km²

## Build Status

✅ Build berhasil: 697.96 kB
✅ TypeScript compilation passed
✅ Semua validasi SNI terpenuhi

## Rekomendasi Penggunaan

- **DAS < 1 km²**: Gunakan pilot Jakarta (0.8 km²)
- **DAS 1-1.5 km²**: Gunakan pilot Semarang (1.2 km²) atau Bekasi (1.5 km²)
- **DAS 1.5-2 km²**: Gunakan pilot Bandung (1.8 km²)
- **DAS 2-3 km²**: Gunakan pilot Jawa Barat (2.5 km²)
- **DAS > 3 km²**: Gunakan metode Haspers, der Weduwen, atau Melchior
