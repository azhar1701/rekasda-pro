# Integrasi Koefisien Limpasan SNI

## Fitur Baru

Telah ditambahkan fungsi input koefisien limpasan (C) yang sesuai dengan SNI pada halaman Peak Discharge Calculator (Metode Rasional).

## Komponen yang Digunakan

### RunoffCoefficientInput
- **Lokasi**: `src/features/flood-analysis/components/RunoffCoefficientInput.tsx`
- **Fungsi**: Dropdown dengan pencarian untuk memilih karakteristik tata guna lahan
- **Data**: Berdasarkan Permen PU No. 12/2014 dan Suripin (2004)

### Data Koefisien SNI
- **Lokasi**: `src/lib/constants/sni.ts`
- **Konstanta**: `SNI_RUNOFF_COEFFICIENTS`

## Kategori Tata Guna Lahan

### Permukaan Jalan
- Jalan Aspal: C = 0.95
- Jalan Beton: C = 0.95
- Jalan Paving Block: C = 0.85

### Kawasan Perkotaan
- Pusat Kota (Komersial): C = 0.85
- Pemukiman Padat: C = 0.70
- Pemukiman Sedang: C = 0.50
- Pemukiman Jarang: C = 0.30

### Kawasan Terbuka
- Taman dan RTH: C = 0.15
- Lapangan Olahraga: C = 0.20

### Kawasan Rural
- Hutan Lebat: C = 0.15
- Lahan Pertanian: C = 0.30
- Tanah Terbuka/Gundul: C = 0.60

## Cara Penggunaan

### Mode Tabel SNI (Default)
1. Klik dropdown "Pilih karakteristik tata guna lahan"
2. Cari atau pilih jenis lahan yang sesuai
3. Nilai C otomatis terisi sesuai standar SNI
4. Informasi referensi ditampilkan di bawah dropdown

### Mode Input Manual
1. Klik tombol "✏️ Input Manual" di pojok kanan atas
2. Masukkan nilai C secara manual (0.00 - 1.00)
3. Klik "📋 Gunakan Tabel SNI" untuk kembali ke mode tabel

## Toggle Feature

User dapat beralih antara:
- **Tabel SNI**: Pilih dari daftar standar (lebih aman, sesuai regulasi)
- **Input Manual**: Masukkan nilai custom (untuk kasus khusus)

## Validasi

- Nilai C harus antara 0.0 - 1.0
- Validasi sesuai `SNI_VALIDATION_LIMITS.runoffCoefficient`
- Error message ditampilkan jika input tidak valid

## Referensi

- **Permen PU No. 12/PRT/M/2014**: Penyelenggaraan Sistem Drainase Perkotaan
- **Suripin (2004)**: Sistem Drainase Perkotaan Berkelanjutan
- **SNI 2415:2016**: Tata Cara Perhitungan Debit Banjir Rencana

## Build Status

✅ Build berhasil dengan ukuran 697.96 kB
✅ Integrasi komponen berhasil tanpa error
✅ TypeScript type checking passed
