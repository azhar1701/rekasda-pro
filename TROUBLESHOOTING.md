# Troubleshooting: Pilihan Kabupaten/Kota Tidak Muncul di Deployment

## Masalah
Pilihan kabupaten/kota tidak muncul saat aplikasi di-deploy, padahal berfungsi normal di local development.

## Penyebab
Masalah ini disebabkan oleh file CSV data lokasi yang tidak dapat diakses di environment production.

## Solusi yang Telah Diterapkan

### 1. Multiple Path Fallback
File `services/csvParser.ts` sekarang mencoba beberapa path:
- `/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv`
- `./docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv`
- `/public/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv`

### 2. Enhanced Error Handling
- Logging yang lebih detail untuk debugging
- Error message yang informatif untuk user
- Fallback data untuk testing

### 3. Build Configuration
File `vite.config.ts` telah diperbarui untuk memastikan file public disalin dengan benar.

## Cara Debugging

### 1. Jalankan Build Check
```bash
# Windows
check-build.bat

# Linux/Mac
chmod +x check-build.sh
./check-build.sh
```

### 2. Test di Browser
Akses `/debug-location.html` di situs yang sudah di-deploy untuk melihat status file CSV.

### 3. Check Browser Console
Buka Developer Tools dan lihat console untuk error messages yang detail.

## Langkah Troubleshooting

### Jika CSV file tidak ada di dist/ setelah build:
1. Pastikan file ada di `public/docs/`
2. Periksa konfigurasi build tool (Vite/Webpack)
3. Pastikan folder public di-copy ke output directory

### Jika file ada tapi tidak bisa diakses:
1. Periksa konfigurasi server (nginx, apache, dll)
2. Pastikan MIME type untuk .csv file dikonfigurasi dengan benar
3. Periksa CORS settings jika applicable

### Jika masih bermasalah:
1. Gunakan fallback data yang sudah disediakan
2. Pertimbangkan memindahkan data ke database
3. Atau embed data langsung di JavaScript

## File yang Dimodifikasi
- `services/csvParser.ts` - Multiple path fallback dan error handling
- `components/LocationSelector.tsx` - Enhanced error display
- `vite.config.ts` - Build configuration
- `public/debug-location.html` - Debug tool
- `check-build.bat/sh` - Build verification script

## Testing
Setelah deployment:
1. Akses aplikasi dan coba pilih lokasi
2. Jika masih error, akses `/debug-location.html`
3. Check browser console untuk error details
4. Jika perlu, gunakan fallback data sementara