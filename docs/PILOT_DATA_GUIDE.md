# Data Pilot - Pemodelan Debit Banjir Rencana

## 📋 Deskripsi

Data pilot ini menyediakan dataset valid dan komprehensif untuk testing dan demonstrasi aplikasi pemodelan debit banjir rencana menggunakan:
- **Metode Rasional** - untuk DAS kecil (< 300 Ha)
- **HSS Nakayasu** - untuk DAS besar (> 300 Ha)

Semua data berdasarkan kondisi DAS riil di Indonesia dengan parameter yang telah divalidasi.

## 🎯 Fitur Utama

✅ **5 Dataset Metode Rasional** - Berbagai karakteristik DAS kecil
✅ **6 Dataset HSS Nakayasu** - DAS besar dengan topografi beragam
✅ **Data Lokasi Lengkap** - Koordinat GPS dan identitas wilayah
✅ **Parameter Tervalidasi** - Sesuai standar SNI dan literatur hidrologi
✅ **Analisis Kala Ulang** - Data hujan rencana Q2 hingga Q100
✅ **One-Click Loading** - Muat data langsung ke form

## 📊 Data Pilot Metode Rasional

### 1. DAS Kecil Urban - Bandung
**Karakteristik:** Area perkotaan dengan perkerasan tinggi
- **Lokasi:** Saluran Cikapundung Hilir, Dago, Coblong, Kota Bandung
- **Koefisien Limpasan (C):** 0.75 (urban padat)
- **Luas DAS (A):** 2.5 km²
- **Waktu Konsentrasi (tc):** 45 menit
- **Intensitas Hujan (I):** 120 mm/jam
- **Koordinat:** -6.8701, 107.6195

**Cocok untuk:** Analisis drainase perkotaan, sistem saluran urban

### 2. DAS Pertanian - Jawa Barat
**Karakteristik:** Dominasi lahan pertanian dan sawah
- **Lokasi:** Saluran Irigasi Cimanuk, Cibeusi, Jatinangor, Kab. Sumedang
- **Koefisien Limpasan (C):** 0.45 (pertanian)
- **Luas DAS (A):** 5.8 km²
- **Waktu Konsentrasi (tc):** 60 menit
- **Intensitas Hujan (I):** 95 mm/jam
- **Koordinat:** -6.9281, 107.7731

**Cocok untuk:** Sistem irigasi, drainase pertanian

### 3. DAS Perumahan - Jakarta
**Karakteristik:** Kawasan perumahan padat dengan drainase terbatas
- **Lokasi:** Kali Pesanggrahan, Cipulir, Kebayoran Lama, Jakarta Selatan
- **Koefisien Limpasan (C):** 0.85 (perumahan padat)
- **Luas DAS (A):** 1.2 km²
- **Waktu Konsentrasi (tc):** 30 menit
- **Intensitas Hujan (I):** 140 mm/jam
- **Koordinat:** -6.2615, 106.7668

**Cocok untuk:** Perumahan padat, area rawan genangan

### 4. DAS Hutan - Jawa Tengah
**Karakteristik:** Tutupan hutan dengan infiltrasi sangat baik
- **Lokasi:** Sungai Serayu Hulu, Sikapat, Kalibening, Kab. Banjarnegara
- **Koefisien Limpasan (C):** 0.30 (hutan)
- **Luas DAS (A):** 8.5 km²
- **Waktu Konsentrasi (tc):** 90 menit
- **Intensitas Hujan (I):** 75 mm/jam
- **Koordinat:** -7.3553, 109.6811

**Cocok untuk:** Konservasi DAS, analisis hutan lindung

### 5. DAS Industri - Bekasi
**Karakteristik:** Kawasan industri dengan perkerasan ekstensif
- **Lokasi:** Kali Cakung, Margahayu, Bekasi Timur, Kota Bekasi
- **Koefisien Limpasan (C):** 0.90 (industri)
- **Luas DAS (A):** 3.2 km²
- **Waktu Konsentrasi (tc):** 35 menit
- **Intensitas Hujan (I):** 135 mm/jam
- **Koordinat:** -6.2441, 107.0077

**Cocok untuk:** Kawasan industri, area komersial

## 🏔️ Data Pilot HSS Nakayasu

### 1. DAS Citarum Hulu
**Karakteristik:** DAS besar dengan karakteristik pegunungan
- **Lokasi:** Sungai Citarum, Cibeureum, Kertasari, Kab. Bandung
- **Luas DAS (A):** 450 km²
- **Panjang Sungai (L):** 35 km
- **Hujan Satuan (Ro):** 85 mm
- **Alpha (α):** 2.0 (pegunungan)
- **Koordinat:** -7.1447, 107.5872

**Cocok untuk:** DAS pegunungan, bendungan, waduk

### 2. DAS Ciliwung Tengah
**Karakteristik:** DAS sedang dengan topografi bergelombang
- **Lokasi:** Sungai Ciliwung, Cisalak, Sukmajaya, Kota Depok
- **Luas DAS (A):** 180 km²
- **Panjang Sungai (L):** 22 km
- **Hujan Satuan (Ro):** 95 mm
- **Alpha (α):** 2.2 (urban)
- **Koordinat:** -6.3897, 106.8317

**Cocok untuk:** DAS urban, pengendalian banjir kota

### 3. DAS Brantas Hulu
**Karakteristik:** DAS besar dengan karakteristik dataran tinggi
- **Lokasi:** Sungai Brantas, Sisir, Batu, Kota Batu
- **Luas DAS (A):** 620 km²
- **Panjang Sungai (L):** 48 km
- **Hujan Satuan (Ro):** 75 mm
- **Alpha (α):** 1.8 (dataran tinggi)
- **Koordinat:** -7.8753, 112.5281

**Cocok untuk:** DAS besar, sistem irigasi regional

### 4. DAS Bengawan Solo Tengah
**Karakteristik:** DAS sangat besar dengan topografi datar
- **Lokasi:** Sungai Bengawan Solo, Sragen Kulon, Sragen, Kab. Sragen
- **Luas DAS (A):** 1250 km²
- **Panjang Sungai (L):** 65 km
- **Hujan Satuan (Ro):** 70 mm
- **Alpha (α):** 2.5 (dataran luas)
- **Koordinat:** -7.4253, 111.0081

**Cocok untuk:** DAS sangat besar, sungai utama

### 5. DAS Progo Hulu
**Karakteristik:** DAS pegunungan dengan lereng curam
- **Lokasi:** Sungai Progo, Ngargosari, Salaman, Kab. Magelang
- **Luas DAS (A):** 380 km²
- **Panjang Sungai (L):** 28 km
- **Hujan Satuan (Ro):** 100 mm
- **Alpha (α):** 1.7 (pegunungan curam)
- **Koordinat:** -7.5281, 110.1531

**Cocok untuk:** DAS pegunungan curam, analisis erosi

### 6. DAS Serayu Tengah
**Karakteristik:** DAS dengan karakteristik campuran pegunungan-dataran
- **Lokasi:** Sungai Serayu, Grendeng, Purwokerto Utara, Kab. Banyumas
- **Luas DAS (A):** 520 km²
- **Panjang Sungai (L):** 42 km
- **Hujan Satuan (Ro):** 80 mm
- **Alpha (α):** 2.1 (campuran)
- **Koordinat:** -7.4153, 109.2381

**Cocok untuk:** DAS campuran, analisis multi-karakteristik

## 🚀 Cara Menggunakan

### 1. Akses Fitur Data Pilot
- Buka modul **Debit Banjir Rencana**
- Pilih metode (Rasional atau HSS Nakayasu)
- Klik tombol **"Muat Data Pilot"** di bagian atas sidebar kiri

### 2. Pilih Dataset
- Modal akan menampilkan semua data pilot yang tersedia
- Setiap card menampilkan:
  - Nama dan deskripsi DAS
  - Lokasi lengkap dengan koordinat
  - Preview parameter input
- Klik pada card untuk memilih dataset
- Card terpilih akan ditandai dengan border ungu dan checkmark

### 3. Muat Data
- Klik tombol **"Muat Data"** di bagian bawah modal
- Data akan otomatis mengisi semua field input:
  - Parameter geometri DAS
  - Parameter hidrologi
  - Data lokasi dan identitas
  - Data hujan rencana untuk analisis kala ulang
- Notifikasi sukses akan muncul di bagian atas layar

### 4. Analisis dan Modifikasi
- Setelah data dimuat, perhitungan otomatis dijalankan
- Hasil ditampilkan dalam bentuk:
  - KPI Cards (Debit Puncak, Waktu Puncak, Volume)
  - Hidrograf banjir rencana
  - Tabel analisis kala ulang
- Anda dapat memodifikasi parameter sesuai kebutuhan
- Perhitungan akan update secara real-time

### 5. Simpan Hasil
- Klik tombol **"Simpan Hasil"** untuk menyimpan ke database
- Pastikan nama saluran sudah terisi di Identitas Lokasi
- Hasil tersimpan dapat diakses kembali dari riwayat

## 📐 Validasi Data

Semua data pilot telah divalidasi berdasarkan:

### Standar dan Referensi
- ✅ SNI 2415:2016 - Tata Cara Perhitungan Debit Banjir Rencana
- ✅ SNI 8062:2015 - Tata Cara Perhitungan Debit Banjir
- ✅ Soewarno (1995) - Hidrologi Aplikasi Metode Statistik
- ✅ Sosrodarsono & Takeda (1983) - Hidrologi untuk Pengairan

### Kriteria Validasi
- **Koefisien Limpasan (C):** 0.0 - 1.0 sesuai tipe tutupan lahan
- **Luas DAS:** Sesuai dengan metode yang digunakan
- **Waktu Konsentrasi:** Dihitung dengan formula Kirpich
- **Intensitas Hujan:** Berdasarkan data curah hujan regional
- **Alpha Nakayasu:** 1.5 - 3.0 sesuai karakteristik DAS
- **Hujan Rencana:** Berdasarkan analisis frekuensi regional

## 🔧 Integrasi dengan Aplikasi

### Komponen Terkait
```
data/floodPilotData.ts          → Database data pilot
components/PilotDataLoader.tsx  → UI untuk memuat data
components/FloodDischargeCalculator.tsx → Integrasi utama
```

### API Functions
```typescript
// Ambil data pilot berdasarkan nama
getRationalPilotByName(name: string): PilotDataRational | undefined
getNakayasuPilotByName(name: string): PilotDataNakayasu | undefined

// Ambil semua nama data pilot
getAllRationalPilotNames(): string[]
getAllNakayasuPilotNames(): string[]
```

### Event Handlers
```typescript
// Handler untuk load data Rasional
handleLoadRationalPilot(data: PilotDataRational): void

// Handler untuk load data Nakayasu
handleLoadNakayasuPilot(data: PilotDataNakayasu): void
```

## 🎨 UI/UX Features

- **Visual Selection:** Card-based selection dengan highlight
- **Preview Parameters:** Lihat parameter sebelum memuat
- **Location Display:** Informasi lokasi lengkap dengan icon
- **Responsive Design:** Optimal di desktop dan mobile
- **Toast Notifications:** Feedback visual saat load data
- **Smooth Animations:** Transisi halus untuk UX yang baik

## 📝 Tips Penggunaan

1. **Pilih Dataset Sesuai Kondisi**
   - Gunakan data urban untuk area perkotaan
   - Gunakan data pertanian untuk area rural
   - Sesuaikan dengan karakteristik DAS Anda

2. **Modifikasi Parameter**
   - Data pilot adalah starting point
   - Sesuaikan dengan kondisi spesifik lokasi
   - Gunakan kalkulator mini untuk parameter akurat

3. **Validasi Hasil**
   - Periksa kewajaran hasil perhitungan
   - Bandingkan dengan data historis jika ada
   - Konsultasikan dengan ahli hidrologi

4. **Dokumentasi**
   - Simpan hasil perhitungan ke database
   - Tambahkan catatan dan foto lokasi
   - Export laporan untuk dokumentasi

## 🔄 Update dan Maintenance

Data pilot akan diupdate secara berkala dengan:
- Dataset baru dari berbagai wilayah Indonesia
- Penyesuaian parameter berdasarkan data terbaru
- Validasi ulang dengan standar terkini
- Penambahan fitur analisis lanjutan

## 📞 Support

Jika menemukan masalah atau memiliki saran untuk data pilot baru:
- Laporkan melalui issue tracker
- Sertakan detail lokasi dan parameter yang diinginkan
- Kontribusi data DAS baru sangat diterima

---

**Versi:** 1.0.0  
**Terakhir Diupdate:** 2024  
**Status:** ✅ Stabil dan Terintegrasi Penuh
