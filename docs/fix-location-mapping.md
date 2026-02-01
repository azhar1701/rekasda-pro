# Fix: Titik Lokasi Tidak Muncul pada Peta Database

## Masalah
Titik lokasi tidak muncul pada peta di halaman database laporan meskipun aplikasi sudah terintegrasi dengan Supabase.

## Penyebab
1. **Struktur data lokasi tidak konsisten**: Lokasi disimpan di berbagai tempat dalam struktur data
2. **Schema database tidak optimal**: Tidak ada kolom `location` terpisah untuk query yang efisien
3. **Mapping data tidak robust**: Kode tidak mengecek semua kemungkinan lokasi data

## Solusi yang Diterapkan

### 1. Perbaikan Schema Database
Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- Jalankan file: database/migration-fix-locations.sql
```

Script ini akan:
- Menambah kolom `location`, `notes`, dan `photo_url` terpisah
- Migrasi data existing dari `input_data` ke kolom terpisah
- Membuat index untuk performa query lokasi
- Membuat fungsi validasi lokasi

### 2. Perbaikan Kode Aplikasi

#### a. Database Service (`services/databaseService.ts`)
- Ekstrak lokasi dari `input_data` saat menyimpan
- Simpan lokasi di kolom terpisah untuk query yang lebih efisien

#### b. Database Hook (`lib/useDatabase.ts`)
- Menyimpan lokasi di kolom terpisah saat save
- Mapping data yang lebih robust saat load

#### c. App Component (`App.tsx`)
- Prioritaskan kolom `location` terpisah
- Fallback ke `input_data.location` dan `input_data.site.location`
- Mapping `photoUrl` yang lebih konsisten

#### d. History Map (`components/HistoryMap.tsx`)
- Filter data lokasi yang lebih robust
- Cek multiple sumber lokasi
- Debugging yang lebih detail
- Validasi koordinat (tidak 0,0)

### 3. Debugging Tools
- Tambah `LocationDebugger` component untuk troubleshooting
- Logging yang lebih detail di console
- Statistik lokasi data

## Langkah-langkah Implementasi

### 1. Jalankan Migrasi Database
```sql
-- Copy dan jalankan isi file database/migration-fix-locations.sql di Supabase SQL Editor
```

### 2. Deploy Kode Baru
Kode sudah diperbaiki dan siap di-deploy.

### 3. Test Aplikasi
1. Buka halaman Database Proyek
2. Switch ke view "Peta"
3. Periksa apakah titik lokasi muncul
4. Klik tombol "Debug" (kanan bawah) untuk melihat statistik lokasi

### 4. Tambah Data Baru
1. Klik "Data Baru" 
2. Isi form dengan lokasi GPS
3. Simpan dan periksa apakah muncul di peta

## Verifikasi

### Cek di Console Browser
```javascript
// Periksa data lokasi
console.log('History data:', history);
console.log('Valid locations:', history.filter(h => h.location));
```

### Cek di Database
```sql
-- Periksa data lokasi di database
SELECT 
    id, 
    site_name,
    location,
    is_valid_location(location) as valid
FROM calculations 
WHERE location IS NOT NULL;
```

## Troubleshooting

### Jika Masih Tidak Muncul:
1. Periksa console browser untuk error
2. Gunakan LocationDebugger untuk melihat statistik
3. Periksa apakah migrasi database berhasil
4. Pastikan data memiliki koordinat yang valid (bukan 0,0)

### Data Lama Tanpa Lokasi:
- Data lama yang tidak memiliki lokasi GPS tidak akan muncul di peta
- Perlu input ulang atau edit manual untuk menambah lokasi

## Catatan Penting
- LocationDebugger hanya untuk development, hapus di production
- Backup database sebelum menjalankan migrasi
- Test di environment development dulu sebelum production