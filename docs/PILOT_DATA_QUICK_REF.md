# Quick Reference - Data Pilot Debit Banjir

## 🚀 Cara Cepat Menggunakan

1. **Buka Modul** → Debit Banjir Rencana
2. **Klik** → Tombol "Muat Data Pilot" (ungu, di atas sidebar)
3. **Pilih** → Dataset yang sesuai dengan kondisi DAS Anda
4. **Klik** → "Muat Data"
5. **Selesai** → Data otomatis terisi, hasil langsung muncul!

## 📊 Pilihan Dataset

### Metode Rasional (DAS Kecil)
| Dataset | C | A (km²) | tc (min) | Cocok Untuk |
|---------|---|---------|----------|-------------|
| Urban Bandung | 0.75 | 2.5 | 45 | Perkotaan padat |
| Pertanian Jabar | 0.45 | 5.8 | 60 | Sawah, irigasi |
| Perumahan Jakarta | 0.85 | 1.2 | 30 | Perumahan padat |
| Hutan Jateng | 0.30 | 8.5 | 90 | Konservasi |
| Industri Bekasi | 0.90 | 3.2 | 35 | Kawasan industri |

### HSS Nakayasu (DAS Besar)
| Dataset | A (km²) | L (km) | α | Cocok Untuk |
|---------|---------|--------|---|-------------|
| Citarum Hulu | 450 | 35 | 2.0 | Pegunungan |
| Ciliwung Tengah | 180 | 22 | 2.2 | Urban sedang |
| Brantas Hulu | 620 | 48 | 1.8 | Dataran tinggi |
| Bengawan Solo | 1250 | 65 | 2.5 | DAS sangat besar |
| Progo Hulu | 380 | 28 | 1.7 | Lereng curam |
| Serayu Tengah | 520 | 42 | 2.1 | Campuran |

## 🎯 Tips Memilih Dataset

**Pilih berdasarkan:**
- ✅ Luas DAS yang mirip
- ✅ Karakteristik tutupan lahan
- ✅ Topografi (datar/bergelombang/pegunungan)
- ✅ Tingkat urbanisasi

**Setelah dimuat:**
- 📝 Sesuaikan parameter dengan kondisi spesifik
- 🧮 Gunakan kalkulator mini untuk parameter akurat
- 💾 Simpan hasil ke database

## 📍 Lokasi Dataset

Semua dataset berbasis DAS riil di:
- Jawa Barat (Bandung, Sumedang, Bekasi)
- Jakarta & Depok
- Jawa Tengah (Banjarnegara, Banyumas, Sragen, Magelang)
- Jawa Timur (Batu)

## ⚡ Fitur Otomatis

Saat data dimuat, otomatis terisi:
- ✓ Semua parameter input
- ✓ Data lokasi & koordinat
- ✓ Hujan rencana Q2-Q100
- ✓ Perhitungan langsung jalan
- ✓ Hidrograf langsung muncul

## 🔧 Troubleshooting

**Data tidak muncul?**
→ Refresh halaman, coba lagi

**Hasil tidak masuk akal?**
→ Periksa parameter, sesuaikan dengan kondisi lokal

**Tidak bisa simpan?**
→ Pastikan "Nama Saluran" sudah terisi di Identitas Lokasi

---

**Dokumentasi Lengkap:** `docs/PILOT_DATA_GUIDE.md`
