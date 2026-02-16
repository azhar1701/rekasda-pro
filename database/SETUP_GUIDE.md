# Setup Database Supabase

## Langkah-langkah Setup

### 1. Buat Project Supabase
- Buka https://supabase.com
- Login dan buat project baru
- Catat URL dan Anon Key

### 2. Jalankan SQL Schema
Buka SQL Editor di Supabase Dashboard dan jalankan file `create-all-tables.sql`:

```sql
-- Copy paste isi file create-all-tables.sql
```

### 3. Konfigurasi Environment
Buat file `.env.local` di root project:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Verifikasi Tabel
Pastikan 3 tabel sudah terbuat:
- `manning_calculations` - untuk perhitungan Saluran Manning
- `flood_calculations` - untuk perhitungan Banjir (Rational & Nakayasu)
- `water_balance_calculations` - untuk perhitungan Neraca Air

## Struktur Data

### Manning Calculations
```json
{
  "id": "uuid",
  "project_name": "string",
  "inputs": {
    "site": {
      "channelName": "string",
      "regency": "string",
      "district": "string",
      "village": "string",
      "location": {
        "latitude": number,
        "longitude": number
      }
    },
    "shape": "TRAPEZOID | CIRCULAR",
    "roughness": number,
    "slope": number,
    "width": number,
    "depth": number,
    ...
  },
  "results": {
    "Discharge": "string",
    "Velocity": "string",
    ...
  },
  "created_at": "timestamp"
}
```

### Flood Calculations
```json
{
  "id": "uuid",
  "method": "RATIONAL | NAKAYASU",
  "project_name": "string",
  "inputs": {
    "location": {
      "channelName": "string",
      "kabupaten": "string",
      "kecamatan": "string",
      "desa": "string",
      "coordinates": {
        "lat": number,
        "lng": number
      }
    },
    ...
  },
  "results": {
    "qPeak": number,
    "tPeak": number,
    "volume": number,
    "returnPeriods": [...],
    "hydrographData": [...]
  },
  "created_at": "timestamp"
}
```

### Water Balance Calculations
```json
{
  "id": "uuid",
  "project_name": "string",
  "monthly_inputs": {
    "location": {
      "channelName": "string",
      "kabupaten": "string",
      "kecamatan": "string",
      "desa": "string",
      "coordinates": {
        "lat": number,
        "lng": number
      }
    },
    "population": number,
    "agricultureArea": number,
    "domesticStandard": number,
    "irrigationDemand": number,
    "monthlySupply": [12 numbers]
  },
  "monthly_results": [...],
  "summary": {
    "surplusMonths": number,
    "deficitMonths": number,
    "totalDeficit": number,
    "totalSurplus": number,
    "criticalMonth": {...}
  },
  "created_at": "timestamp"
}
```

## Fitur Integrasi

### 1. Simpan Data
Setiap tab (Saluran, Banjir, Neraca Air) memiliki tombol "Simpan Hasil" yang akan menyimpan data ke Supabase.

### 2. Tampil di Halaman Data
Semua data yang tersimpan akan muncul di tab "Data" dengan:
- View List: Tampilan kartu grid
- View Map: Tampilan peta dengan marker lokasi

### 3. Koordinat Lokasi
Pastikan setiap perhitungan memiliki koordinat lokasi agar bisa tampil di peta:
- Manning: `inputs.site.location.latitude/longitude`
- Flood: `inputs.location.coordinates.lat/lng`
- Water Balance: `monthly_inputs.location.coordinates.lat/lng`

## Troubleshooting

### Data tidak tersimpan
- Cek koneksi internet
- Verifikasi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di `.env.local`
- Cek RLS policies di Supabase (pastikan "Allow all" enabled)

### Data tidak muncul di peta
- Pastikan data memiliki koordinat lokasi yang valid
- Koordinat harus berupa angka, bukan string
- Latitude: -90 sampai 90
- Longitude: -180 sampai 180

### Error "table does not exist"
- Jalankan ulang SQL schema `create-all-tables.sql`
- Refresh Supabase Dashboard
