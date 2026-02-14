# Data Directory

## 📁 Struktur File

```
data/
├── floodPilotData.ts      # Database data pilot untuk pemodelan banjir
└── testPilotData.ts       # Test suite untuk validasi data
```

## 📊 floodPilotData.ts

File ini berisi dataset lengkap untuk pemodelan debit banjir rencana dengan dua metode:

### Metode Rasional
- **5 Dataset** berbeda karakteristik DAS kecil
- Parameter: C, A, tc, I
- Cocok untuk DAS < 300 Ha

### HSS Nakayasu
- **6 Dataset** berbeda karakteristik DAS besar
- Parameter: A, L, Ro, Alpha
- Cocok untuk DAS > 300 Ha

### Struktur Data

```typescript
interface PilotDataRational {
  name: string;              // Nama dataset
  description: string;       // Deskripsi karakteristik
  location: {
    channelName: string;     // Nama saluran/sungai
    kabupaten: string;       // Kabupaten/Kota
    kecamatan: string;       // Kecamatan
    desa: string;            // Desa/Kelurahan
    coordinates?: {          // Koordinat GPS
      lat: number;
      lng: number;
    };
  };
  inputs: {
    C: number;               // Koefisien limpasan
    A: number;               // Luas DAS (km²)
    tc: number;              // Waktu konsentrasi (menit)
    I: number;               // Intensitas hujan (mm/jam)
  };
  returnPeriods: Array<{
    period: string;          // Q2, Q5, Q10, Q25, Q50, Q100
    rainfall: number;        // Hujan rencana (mm)
  }>;
}

interface PilotDataNakayasu {
  name: string;
  description: string;
  location: { /* sama seperti di atas */ };
  inputs: {
    A: number;               // Luas DAS (km²)
    L: number;               // Panjang sungai (km)
    Ro: number;              // Hujan satuan (mm)
    Alpha: number;           // Koefisien DAS (1.5-3.0)
  };
  returnPeriods: Array<{
    period: string;
    rainfall: number;
  }>;
}
```

### Exported Functions

```typescript
// Ambil data berdasarkan nama
getRationalPilotByName(name: string): PilotDataRational | undefined
getNakayasuPilotByName(name: string): PilotDataNakayasu | undefined

// Ambil semua nama dataset
getAllRationalPilotNames(): string[]
getAllNakayasuPilotNames(): string[]

// Array data lengkap
rationalPilotData: PilotDataRational[]
nakayasuPilotData: PilotDataNakayasu[]
```

## 🧪 testPilotData.ts

File test untuk memvalidasi:
- ✅ Struktur data lengkap
- ✅ Range nilai parameter valid
- ✅ Koordinat GPS tersedia
- ✅ Data kala ulang lengkap (6 periode)
- ✅ Helper functions berfungsi

### Menjalankan Test

```typescript
import './data/testPilotData';
// Output akan muncul di console
```

## 📖 Dokumentasi

- **Lengkap:** `docs/PILOT_DATA_GUIDE.md`
- **Quick Ref:** `docs/PILOT_DATA_QUICK_REF.md`

## 🔄 Menambah Data Baru

1. Buka `floodPilotData.ts`
2. Tambahkan object baru ke array `rationalPilotData` atau `nakayasuPilotData`
3. Pastikan struktur sesuai interface
4. Validasi dengan menjalankan `testPilotData.ts`
5. Update dokumentasi jika perlu

### Template Data Baru

```typescript
{
  name: "Nama DAS",
  description: "Karakteristik DAS",
  location: {
    channelName: "Nama Saluran",
    kabupaten: "Kabupaten",
    kecamatan: "Kecamatan",
    desa: "Desa",
    coordinates: { lat: -7.0000, lng: 110.0000 }
  },
  inputs: {
    // Parameter sesuai metode
  },
  returnPeriods: [
    { period: 'Q2', rainfall: 80 },
    { period: 'Q5', rainfall: 100 },
    { period: 'Q10', rainfall: 120 },
    { period: 'Q25', rainfall: 140 },
    { period: 'Q50', rainfall: 160 },
    { period: 'Q100', rainfall: 180 }
  ]
}
```

## ⚠️ Validasi Parameter

### Metode Rasional
- **C:** 0.0 - 1.0 (0.3 hutan, 0.5 pertanian, 0.7-0.9 urban)
- **A:** > 0 km² (biasanya < 10 km² untuk metode rasional)
- **tc:** > 0 menit (biasanya 10-120 menit)
- **I:** > 0 mm/jam (biasanya 50-200 mm/jam)

### HSS Nakayasu
- **A:** > 0 km² (biasanya > 50 km² untuk Nakayasu)
- **L:** > 0 km (panjang sungai utama)
- **Ro:** > 0 mm (hujan efektif)
- **Alpha:** 1.5 - 3.0 (1.5-2.0 pegunungan, 2.0-2.5 dataran, 2.5-3.0 rawa)

## 🌍 Sumber Data

Data pilot berdasarkan:
- Studi DAS di Indonesia
- Data BMKG untuk curah hujan
- Peta topografi dan tutupan lahan
- Standar SNI 2415:2016
- Literatur hidrologi Indonesia

## 📝 Lisensi

Data pilot ini untuk keperluan edukasi dan demonstrasi aplikasi.
Untuk penggunaan profesional, lakukan validasi dengan data lapangan.
