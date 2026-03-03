# Workflow Ekstraksi Data Satelit CHIRPS (Zonal Statistics)

## Tahap 1: Inisiasi dari WebGIS (Frontend)
**Aksi:** Insinyur selesai menggambar poligon batas DAS (Catchment Area) di antarmuka peta RekaSDA. Insinyur kemudian memilih rentang tahun (misal: 2000 - 2020) dan mengklik tombol "Tarik Data CHIRPS".
**Proses:** UI (React) mengubah status tombol menjadi Loading ("Sedang memproses..."). Di belakang layar, UI mengirimkan bentuk geometri poligon DAS (format GeoJSON) beserta rentang tanggal ke API Route internal kita (Backend).

## Tahap 2: Pengajuan Pekerjaan / Job Submission (Backend)
**Aksi:** API internal kita menerima GeoJSON tersebut dan meneruskannya (via POST request) ke server penyedia data satelit (misal: ClimateSERV API).
**Proses:** Karena komputasinya berat, server satelit tidak langsung membalas dengan data curah hujan. Sebagai gantinya, mereka memberikan sebuah Job ID (ibarat nomor antrean pesanan di restoran cepat saji).

## Tahap 3: Mekanisme Polling / Menunggu Antrean (Backend)
**Aksi:** Ini adalah fase paling kritis. API internal kita masuk ke mode Polling (mengecek berkala).
**Proses:** Menggunakan looping (perulangan), API kita akan bertanya ke server satelit setiap 3 atau 5 detik: "Apakah Job ID #12345 sudah selesai?".
- Jika dijawab "Sedang diproses (40%)", API kita akan jeda (sleep) dan bertanya lagi nanti.
- Proses ini terus berulang sampai server satelit menjawab "Sukses (100%)".

## Tahap 4: Pengunduhan & Pembersihan Data / Transform (Backend)
**Aksi:** Setelah mendapat sinyal "Sukses", API kita segera mengunduh data mentah (raw JSON) dari server satelit.
**Proses:** Data mentah dari satelit biasanya berantakan format waktunya (menggunakan Unix Epoch time). API kita akan melakukan pembersihan (Transformasi):
- Mengubah timestamp 13 digit menjadi format standar YYYY-MM-DD.
- Membulatkan angka curah hujan menjadi 2 angka desimal (misal: 14.56 mm).
- Jika ada data piksel yang cacat/kosong (biasanya bernilai NaN atau -9999), akan diubah menjadi 0.

## Tahap 5: Injeksi ke Basis Data / Load (Backend ke Supabase)
**Aksi:** API kita sekarang memiliki ribuan baris data curah hujan harian (sekitar 7.300 baris untuk 20 tahun) yang sudah rapi dan matang.
**Proses:** API menggunakan metode Bulk Upsert untuk memasukkan seluruh data tersebut ke tabel `master_data_hujan` di Supabase secara sekaligus. Upsert memastikan jika ada data tanggal yang sama untuk DAS tersebut, datanya akan ditimpa (di-update), bukan menjadi ganda.

## Tahap 6: Notifikasi & Integrasi (Frontend)
**Aksi:** Setelah data aman di Supabase, API kita merespons kembali ke UI Frontend dengan kode "200 OK".
**Proses:** Tombol Loading di layar insinyur berhenti berputar. Sebuah Toast Notification hijau muncul: "Berhasil menarik 7.305 hari data hujan CHIRPS".
**Hasil Akhir:** Data tersebut sekarang sudah tersedia dan langsung bisa dikirim ke Modul Analisis Frekuensi untuk dihitung nilai Gumbel, Log Pearson III, atau Normal-nya!