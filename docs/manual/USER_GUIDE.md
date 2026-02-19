# 📘 Panduan Pengguna RekaSDA Pro

**Rekayasa Sumber Daya Air - Manual Pengguna**

Versi: 1.0.0  
Terakhir Diperbarui: 2024

---

## 1. Pengantar

### 1.1 Apa itu RekaSDA Pro?

**RekaSDA Pro** adalah aplikasi web profesional untuk analisis hidrologi dan perhitungan hidraulika yang dirancang khusus untuk Insinyur Sipil di Indonesia. Aplikasi ini menyediakan:

- ✅ Perhitungan sesuai **Standar Nasional Indonesia (SNI)**
- ✅ Antarmuka mobile-friendly untuk pengumpulan data lapangan
- ✅ Visualisasi spasial dengan peta interaktif
- ✅ Asisten AI untuk konsultasi teknis
- ✅ Penyimpanan data proyek secara otomatis

### 1.2 Persyaratan Sistem

**Browser yang Didukung:**
- Google Chrome (versi terbaru)
- Microsoft Edge (versi terbaru)
- Mozilla Firefox (versi terbaru)
- Safari (iOS 13+)

**Koneksi Internet:**
- Diperlukan untuk menyimpan data ke cloud
- Mode offline tersedia untuk perhitungan dasar

**Perangkat:**
- Desktop/Laptop (Windows, macOS, Linux)
- Tablet (iPad, Android)
- Smartphone (untuk pengumpulan data lapangan)

---

## 2. Memulai Aplikasi

### 2.1 Mengakses Aplikasi

1. Buka browser Anda
2. Akses URL: `https://rekasda.pro` (atau URL deployment Anda)
3. Aplikasi akan langsung terbuka tanpa perlu login (untuk versi publik)

`[MASUKKAN GAMBAR DASHBOARD DISINI]`

### 2.2 Navigasi Utama

Aplikasi menggunakan **Bottom Navigation Bar** (mobile) atau **Floating Navigation** (desktop) dengan 5 menu utama:

| Icon | Menu | Fungsi |
|------|------|--------|
| 🌊 | **Saluran** | Analisis kapasitas saluran terbuka (Manning) |
| ☔ | **Banjir** | Perhitungan debit banjir rencana |
| ⚖️ | **Neraca** | Analisis neraca air (supply vs demand) |
| 📊 | **Data** | Riwayat perhitungan & peta lokasi |
| ✨ | **Konsultan** | Asisten AI untuk konsultasi teknis |

> **Tips:** Pada layar mobile, menu navigasi berada di bagian bawah layar untuk kemudahan akses dengan jempol.

---

## 3. Panduan Fitur: Analisis Saluran

### 3.1 Tujuan Modul

Modul ini digunakan untuk menghitung **kapasitas debit saluran terbuka** menggunakan **Rumus Manning** sesuai dengan:
- SNI 2415:2016 (Debit Banjir Rencana)
- SNI 03-3424-1994 (Drainase Permukaan Jalan)

`[MASUKKAN GAMBAR FORM SALURAN DISINI]`

### 3.2 Langkah-Langkah Perhitungan

#### **Langkah 1: Identitas Lokasi**

1. Klik tab **Saluran** pada menu navigasi
2. Isi **Identitas Lokasi** (opsional tapi direkomendasikan):
   - **Nama Saluran**: Contoh "Saluran Drainase Jl. Sudirman"
   - **Kabupaten/Kota**: Pilih dari dropdown
   - **Kecamatan**: Pilih dari dropdown
   - **Desa/Kelurahan**: Pilih dari dropdown
   - **Koordinat**: Klik tombol **Ambil Lokasi GPS** atau input manual

> **Catatan:** Data lokasi akan digunakan untuk visualisasi di peta.

#### **Langkah 2: Pilih Bentuk Penampang**

Pilih salah satu dari 3 bentuk saluran:

| Bentuk | Keterangan | Contoh Penggunaan |
|--------|------------|-------------------|
| **Trapesium** | Saluran dengan kemiringan dinding | Saluran tanah, irigasi |
| **Persegi** | Saluran dengan dinding vertikal | Saluran beton, gorong-gorong |
| **Lingkaran** | Pipa atau gorong-gorong bulat | Drainase perkotaan |

#### **Langkah 3: Input Parameter Geometri**

**Untuk Saluran Trapesium:**
- **Lebar Dasar (b)**: Lebar dasar saluran dalam meter
- **Kedalaman Air (h)**: Tinggi muka air dalam meter
- **Kemiringan Dinding (z)**: Rasio horizontal:vertikal (contoh: 1.5 untuk 1.5H:1V)
- **Kedalaman Total (H)**: Tinggi total saluran (untuk cek freeboard)

**Untuk Saluran Persegi:**
- **Lebar (b)**: Lebar saluran dalam meter
- **Kedalaman Air (h)**: Tinggi muka air dalam meter
- **Kedalaman Total (H)**: Tinggi total saluran

**Untuk Saluran Lingkaran:**
- **Diameter (D)**: Diameter pipa dalam meter
- **Kedalaman Air (h)**: Tinggi muka air dalam meter

#### **Langkah 4: Input Parameter Hidraulik**

**Koefisien Kekasaran Manning (n):**

Pilih nilai sesuai material saluran:

| Material | Nilai n | Keterangan |
|----------|---------|------------|
| Beton halus | 0.013 | Saluran beton finishing baik |
| Beton kasar | 0.017 | Saluran beton tanpa finishing |
| Pasangan batu | 0.025 | Saluran batu kali |
| Tanah bersih | 0.022 | Saluran tanah terawat |
| Tanah berumput | 0.030 | Saluran tanah dengan vegetasi |

> **Penting:** Nilai n sangat mempengaruhi hasil perhitungan. Gunakan nilai yang sesuai dengan kondisi lapangan.

**Kemiringan Dasar (S):**
- Input dalam format desimal (contoh: 0.001 untuk kemiringan 1:1000)
- Atau gunakan **Kalkulator Kemiringan** untuk menghitung dari elevasi

#### **Langkah 5: Hitung & Interpretasi Hasil**

1. Klik tombol **Hitung Kapasitas**
2. Hasil akan ditampilkan dalam kartu hasil:

**Output Utama:**
- **Debit (Q)**: Kapasitas aliran dalam m³/s
- **Kecepatan (V)**: Kecepatan aliran dalam m/s
- **Bilangan Froude (Fr)**: Klasifikasi aliran
  - Fr < 1.0: **Sub-kritis** (aliran tenang)
  - Fr = 1.0: **Kritis**
  - Fr > 1.0: **Super-kritis** (aliran deras)

**Output Tambahan:**
- **Luas Penampang Basah (A)**: m²
- **Keliling Basah (P)**: m
- **Jari-jari Hidrolik (R)**: m
- **Tinggi Jagaan (Freeboard)**: m
- **Status Keamanan**: Aman / Waspada / MELUAP

> **Peringatan:** Jika status menunjukkan **MELUAP**, saluran tidak aman dan perlu redesain.

`[MASUKKAN GAMBAR HASIL PERHITUNGAN SALURAN DISINI]`

### 3.3 Menyimpan Hasil

1. Klik tombol **Simpan Hasil**
2. Isi **Catatan** (opsional)
3. Klik **Konfirmasi Simpan**
4. Data akan tersimpan di menu **Data**

---

## 4. Panduan Fitur: Analisis Banjir

### 4.1 Tujuan Modul

Modul ini digunakan untuk menghitung **debit banjir rencana** sesuai **SNI 2415:2016** menggunakan:
- **Metode Rasional** (untuk DAS < 5000 ha)
- **HSS Nakayasu** (untuk DAS > 5000 ha dengan data hujan jam-jaman)

`[MASUKKAN GAMBAR FORM BANJIR DISINI]`

### 4.2 Memilih Metode Perhitungan

#### **Metode Rasional**

**Kapan Digunakan:**
- Luas DAS < 5000 ha (50 km²)
- Perhitungan cepat untuk desain drainase
- Data hujan harian tersedia

**Rumus:**
```
Q = 0.278 × C × I × A
```

#### **Metode HSS Nakayasu**

**Kapan Digunakan:**
- Luas DAS > 5000 ha
- Memerlukan hidrograf lengkap
- Data hujan jam-jaman tersedia

### 4.3 Langkah Perhitungan Metode Rasional

#### **Langkah 1: Input Identitas DAS**

1. Pilih tab **Banjir**
2. Pilih metode **Rasional**
3. Isi identitas DAS:
   - **Nama DAS**: Contoh "DAS Ciliwung Hulu"
   - **Lokasi**: Kabupaten/Kecamatan/Desa

#### **Langkah 2: Input Parameter DAS**

**Luas DAS (A):**
- Input dalam **hektar (ha)** atau **km²**
- Dapat diukur dari peta topografi atau Google Earth

> **Peringatan:** Jika A > 5000 ha, aplikasi akan menampilkan peringatan untuk menggunakan metode Nakayasu.

**Koefisien Pengaliran (C):**

Pilih sesuai karakteristik DAS:

| Tipe Lahan | Nilai C | Keterangan |
|------------|---------|------------|
| Hutan lebat | 0.10 - 0.20 | Vegetasi rapat |
| Pertanian | 0.20 - 0.40 | Sawah/ladang |
| Pemukiman jarang | 0.40 - 0.60 | Perumahan dengan taman |
| Pemukiman padat | 0.60 - 0.80 | Perkotaan |
| Aspal/beton | 0.80 - 0.95 | Area kedap air |

**Panjang Sungai Utama (L):**
- Input dalam **kilometer (km)**
- Diukur dari outlet hingga titik terjauh

**Kemiringan DAS (S):**
- Input dalam format desimal (contoh: 0.02 untuk 2%)
- Dihitung dari: S = ΔH / L

#### **Langkah 3: Input Data Hujan**

**Hujan Rencana (R24):**
- Input hujan harian maksimum dalam **mm**
- Untuk periode ulang tertentu (Q2, Q5, Q10, Q25, Q50, Q100)

> **Catatan:** Gunakan data dari stasiun hujan terdekat atau analisis frekuensi.

#### **Langkah 4: Hitung & Interpretasi Hasil**

1. Klik tombol **Hitung Debit Banjir**
2. Hasil akan ditampilkan:

**Output Utama:**
- **Debit Puncak (Qp)**: m³/s
- **Intensitas Hujan (I)**: mm/jam
- **Waktu Konsentrasi (Tc)**: menit

**Grafik Hidrograf:**
- Sumbu X: Waktu (jam)
- Sumbu Y: Debit (m³/s)
- **Rising Limb**: Fase naik (hujan mulai)
- **Peak**: Debit puncak
- **Recession Limb**: Fase turun (hujan berhenti)

`[MASUKKAN GAMBAR HIDROGRAF DISINI]`

> **Interpretasi:** Debit puncak digunakan untuk desain dimensi saluran atau bangunan air.

### 4.4 Langkah Perhitungan Metode Nakayasu

#### **Langkah 1: Input Parameter Nakayasu**

Selain parameter DAS, input tambahan:
- **Koefisien α**: 2.0 - 3.0 (default 2.5)
- **Koefisien β**: 1.5 - 2.5 (default 2.0)
- **Data Hujan Jam-jaman**: 24 jam

#### **Langkah 2: Interpretasi Hidrograf**

Hasil berupa **hidrograf lengkap** dengan:
- Waktu puncak (Tp)
- Debit puncak (Qp)
- Waktu dasar (Tb)
- Volume limpasan

---

## 5. Panduan Fitur: Neraca Air

### 5.1 Tujuan Modul

Modul ini digunakan untuk analisis **keseimbangan air** (supply vs demand) sesuai:
- **SNI 19-6728.1-2002** (Neraca Sumber Daya Air)
- **SNI 6738:2015** (Debit Andalan)

`[MASUKKAN GAMBAR FORM NERACA AIR DISINI]`

### 5.2 Langkah-Langkah Perhitungan

#### **Langkah 1: Input Parameter Kebutuhan**

**Jumlah Penduduk:**
- Input dalam **jiwa**
- Untuk perhitungan kebutuhan domestik

**Luas Lahan Irigasi:**
- Input dalam **hektar (Ha)**
- Untuk perhitungan kebutuhan pertanian

**Standar Kebutuhan Air:**
- Input dalam **liter/orang/hari**
- Default: 100 L/org/hari (SNI 03-7065-2005)
- Perkotaan: 120-150 L/org/hari
- Pedesaan: 60-100 L/org/hari

**Kebutuhan Irigasi:**
- Input dalam **L/s/Ha**
- Default: 1.0 L/s/Ha
- Padi: 1.5-2.0 L/s/Ha
- Palawija: 0.8-1.2 L/s/Ha

#### **Langkah 2: Input Debit Andalan (Q80)**

**Cara 1: Input Manual**
- Masukkan debit bulanan (12 bulan) dalam **m³/s**

**Cara 2: Gunakan Kalkulator Hujan**
1. Klik tombol **Kalkulator Hujan**
2. Input data hujan bulanan (mm)
3. Input luas DAS (km²)
4. Klik **Hitung Debit Andalan**
5. Hasil akan otomatis terisi

> **Catatan:** Debit andalan adalah debit yang dapat diandalkan 80% dari waktu (Q80).

#### **Langkah 3: Interpretasi Hasil**

**KPI Cards (Kartu Indikator):**

1. **Total Ketersediaan**
   - Warna: Biru
   - Nilai: Total debit andalan (m³/s)

2. **Total Kebutuhan**
   - Warna: Oranye
   - Nilai: Domestik + Irigasi + Lingkungan (m³/s)

3. **Status Neraca**
   - Warna: Hijau (Surplus) / Merah (Defisit)
   - Nilai: Selisih ketersediaan - kebutuhan

4. **Bulan Kritis**
   - Warna: Merah
   - Nilai: Bulan dengan defisit terbesar

**Grafik Neraca Bulanan:**
- Garis Biru: Ketersediaan (Supply)
- Garis Oranye: Kebutuhan (Demand)
- Area Hijau: Surplus
- Area Merah: Defisit

`[MASUKKAN GAMBAR GRAFIK NERACA AIR DISINI]`

**Tabel Detail Bulanan:**

| Bulan | Supply | Domestik | Irigasi | Lingkungan | Total Demand | Neraca | Status |
|-------|--------|----------|---------|------------|--------------|--------|--------|
| Jan | 2.5 | 0.3 | 0.8 | 0.25 | 1.35 | +1.15 | Surplus |
| ... | ... | ... | ... | ... | ... | ... | ... |

> **Interpretasi:**
> - **Surplus (Hijau)**: Air cukup, dapat dialokasikan untuk kebutuhan lain
> - **Defisit (Merah)**: Air kurang, perlu sumber tambahan atau pengaturan alokasi

#### **Langkah 4: Badge Kepatuhan SNI**

Pada hasil perhitungan, akan muncul **badge SNI** yang menunjukkan:
- ✅ **SNI 19-6728.1-2002**: Metode neraca air
- ✅ **SNI 6738:2015**: Perhitungan debit andalan
- ✅ **SNI 03-7065-2005**: Standar kebutuhan domestik

> **Arti Badge:** Perhitungan telah mengikuti standar nasional yang berlaku.

---

## 6. Manajemen Data & Peta

### 6.1 Menyimpan Perhitungan

**Langkah Menyimpan:**
1. Setelah perhitungan selesai, klik tombol **Simpan**
2. Isi **Nama Proyek** (wajib)
3. Isi **Catatan** (opsional)
4. Klik **Konfirmasi Simpan**
5. Data tersimpan di cloud (Supabase)

> **Tips:** Gunakan nama proyek yang deskriptif, contoh: "Saluran Drainase Jl. Sudirman Km 5+200"

### 6.2 Melihat Riwayat Data

1. Klik tab **Data** pada menu navigasi
2. Pilih mode tampilan:
   - **Daftar**: Tampilan kartu per proyek
   - **Peta**: Visualisasi spasial

**Mode Daftar:**
- Menampilkan semua proyek dalam bentuk kartu
- Informasi: Tipe, Nama, Tanggal, Output Utama
- Aksi: Lihat Detail, Tampilkan di Peta, Analisis AI, Hapus

**Mode Peta:**
- Marker berwarna sesuai tipe:
  - 🔵 **Biru**: Analisis Saluran (Manning)
  - 🔴 **Merah**: Analisis Banjir (Rational/Nakayasu)
  - 🟢 **Hijau**: Neraca Air (Water Balance)
- Klik marker untuk melihat detail
- Zoom otomatis ke lokasi proyek

`[MASUKKAN GAMBAR PETA LOKASI DISINI]`

### 6.3 Tombol "Tampilkan di Peta"

**Fungsi:**
- Beralih ke mode peta
- Zoom otomatis ke lokasi proyek
- Membuka popup detail proyek

**Cara Menggunakan:**
1. Pada mode Daftar, klik tombol **Tampilkan di Peta**
2. Peta akan terbuka dengan animasi smooth
3. Marker akan di-highlight
4. Popup detail akan terbuka otomatis

### 6.4 Menggunakan AI Konsultan

**Tujuan:**
- Mendapatkan interpretasi hasil perhitungan
- Verifikasi kepatuhan SNI
- Rekomendasi desain
- Troubleshooting masalah

**Cara Menggunakan:**

**Dari Hasil Perhitungan:**
1. Setelah perhitungan selesai, klik tombol **Analisis AI**
2. Aplikasi akan beralih ke tab **Konsultan**
3. Konteks perhitungan otomatis terkirim
4. AI akan memberikan analisis

**Dari Riwayat Data:**
1. Pada tab **Data**, klik tombol **Analisis AI** pada kartu proyek
2. AI akan menganalisis data historis

**Contoh Pertanyaan:**
- "Apakah debit ini sesuai SNI 2415:2016?"
- "Berapa dimensi saluran yang direkomendasikan?"
- "Mengapa hasil saya 0?"
- "Apa arti Bilangan Froude 1.5?"

`[MASUKKAN GAMBAR AI KONSULTAN DISINI]`

---

## 7. FAQ & Troubleshooting

### 7.1 Pertanyaan Umum

**Q: Mengapa hasil perhitungan saya 0 atau NaN?**

A: Kemungkinan penyebab:
- ❌ Input parameter kosong atau 0
- ❌ Kemiringan (S) terlalu kecil (< 0.00001)
- ❌ Koefisien Manning (n) tidak valid
- ✅ **Solusi:** Periksa kembali semua input, pastikan tidak ada yang kosong

---

**Q: Apa arti badge SNI pada hasil?**

A: Badge SNI menunjukkan bahwa:
- ✅ Perhitungan mengikuti **Standar Nasional Indonesia**
- ✅ Rumus dan metode sesuai regulasi
- ✅ Hasil dapat dipertanggungjawabkan secara teknis

Contoh:
- **SNI 2415:2016**: Metode perhitungan debit banjir
- **SNI 03-3424-1994**: Perhitungan hidraulika saluran

---

**Q: Bagaimana cara mengubah satuan?**

A: Aplikasi menggunakan satuan SI standar:
- Panjang: meter (m)
- Luas: m² atau hektar (ha)
- Debit: m³/s
- Kecepatan: m/s

Untuk konversi:
- 1 km² = 100 ha
- 1 L/s = 0.001 m³/s

---

**Q: Apakah data saya aman?**

A: Ya, data Anda aman karena:
- ✅ Disimpan di **Supabase** (cloud PostgreSQL)
- ✅ Enkripsi HTTPS
- ✅ Row Level Security (RLS) aktif
- ✅ Backup otomatis

---

**Q: Bisakah saya menggunakan aplikasi tanpa internet?**

A: Terbatas:
- ✅ Perhitungan dasar dapat dilakukan offline
- ❌ Penyimpanan data memerlukan internet
- ❌ AI Konsultan memerlukan internet
- ❌ Peta memerlukan internet

---

**Q: Bagaimana cara export hasil ke PDF?**

A: Fitur export PDF sedang dalam pengembangan (Roadmap v1.1).

Saat ini, Anda dapat:
- Screenshot hasil perhitungan
- Copy-paste data ke Word/Excel
- Gunakan fitur Print browser (Ctrl+P)

---

### 7.2 Troubleshooting Umum

#### **Masalah: Peta tidak muncul**

**Penyebab:**
- Koneksi internet lambat
- Browser memblokir lokasi GPS

**Solusi:**
1. Refresh halaman (F5)
2. Periksa koneksi internet
3. Izinkan akses lokasi di browser
4. Coba browser lain (Chrome/Edge)

---

#### **Masalah: Hasil tidak sesuai ekspektasi**

**Penyebab:**
- Input parameter salah
- Satuan tidak sesuai
- Metode tidak tepat

**Solusi:**
1. Periksa kembali semua input
2. Pastikan satuan benar (m, m³/s, ha)
3. Gunakan **AI Konsultan** untuk verifikasi
4. Bandingkan dengan perhitungan manual

---

#### **Masalah: Data tidak tersimpan**

**Penyebab:**
- Koneksi internet terputus
- Nama proyek kosong
- Database penuh

**Solusi:**
1. Periksa koneksi internet
2. Pastikan **Nama Proyek** terisi
3. Coba simpan ulang
4. Hubungi support jika masalah berlanjut

---

#### **Masalah: AI Konsultan tidak merespon**

**Penyebab:**
- API key tidak valid
- Koneksi internet lambat
- Server AI sedang sibuk

**Solusi:**
1. Tunggu beberapa detik
2. Refresh halaman
3. Coba pertanyaan yang lebih sederhana
4. Periksa koneksi internet

---

## 8. Tips & Best Practices

### 8.1 Tips Penggunaan

✅ **Gunakan Data Pilot**
- Setiap modul memiliki tombol **Muat Data Pilot**
- Gunakan untuk belajar dan validasi

✅ **Isi Identitas Lokasi Lengkap**
- Memudahkan pencarian data historis
- Visualisasi peta lebih akurat

✅ **Simpan Hasil Secara Berkala**
- Hindari kehilangan data
- Mudah untuk review di kemudian hari

✅ **Gunakan AI Konsultan**
- Verifikasi hasil perhitungan
- Dapatkan rekomendasi desain
- Troubleshooting masalah

✅ **Screenshot Hasil Penting**
- Untuk dokumentasi laporan
- Backup lokal

### 8.2 Best Practices Teknis

**Untuk Analisis Saluran:**
- Gunakan nilai Manning (n) sesuai kondisi lapangan
- Periksa freeboard minimal 0.3 m
- Pastikan Froude < 1.0 untuk aliran stabil

**Untuk Analisis Banjir:**
- Gunakan Metode Rasional untuk DAS < 5000 ha
- Gunakan data hujan dari stasiun terdekat
- Verifikasi dengan perhitungan manual

**Untuk Neraca Air:**
- Input debit andalan (Q80) yang akurat
- Pertimbangkan debit lingkungan (10%)
- Identifikasi bulan kritis untuk perencanaan

---

## 9. Kontak & Dukungan

### 9.1 Bantuan Teknis

**Dokumentasi:**
- 📖 [Panduan Lengkap](../README.md)
- 🏗️ [Arsitektur Sistem](../technical/SYSTEM_ARCHITECTURE.md)
- 📏 [Kepatuhan SNI](../standards/SNI_COMPLIANCE.md)

**Dukungan:**
- 🐛 [Laporkan Bug](https://github.com/yourusername/rekasda-pro/issues)
- 💬 [Forum Diskusi](https://github.com/yourusername/rekasda-pro/discussions)
- 📧 Email: support@rekasda.pro

### 9.2 Pelatihan & Konsultasi

Untuk pelatihan penggunaan aplikasi atau konsultasi teknis:
- 📞 Hubungi: +62-xxx-xxxx-xxxx
- 📧 Email: training@rekasda.pro
- 🌐 Website: www.rekasda.pro

---

## 10. Changelog & Update

**Versi 1.0.0 (2024)**
- ✅ Rilis perdana
- ✅ Modul Saluran, Banjir, Neraca Air
- ✅ Integrasi AI Konsultan
- ✅ Peta interaktif
- ✅ Penyimpanan cloud

**Roadmap v1.1 (Q1 2025)**
- 📄 Export PDF
- 📊 Export Excel
- 👥 Multi-user collaboration
- 📚 Template proyek

---

<div align="center">

**Terima kasih telah menggunakan RekaSDA Pro!**

Untuk pertanyaan lebih lanjut, silakan hubungi tim support kami.

[⬆ Kembali ke Atas](#-panduan-pengguna-rekasda-pro)

</div>
