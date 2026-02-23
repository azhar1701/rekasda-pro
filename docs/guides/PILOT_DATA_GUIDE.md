# Panduan Data Pilot - RekaSDA Pro

## Overview
Data pilot telah dikonfigurasi untuk menyesuaikan dengan setiap metode perhitungan debit banjir rencana, baik metode empiris maupun metode HSS.

## Struktur Data Pilot

### 1. Metode Empiris (Peak Discharge Calculator)

#### A. Metode Rasional (A ≤ 3 km²)
- **File**: `rationalPilotData`
- **Parameter**: C, A, tc, I
- **Jumlah Data**: 5 dataset
- **Rentang Luas DAS**: 1.2 - 2.8 km²
- **Contoh**: DAS Kecil Urban Bandung, DAS Perumahan Jakarta

#### B. Metode Haspers & Osugi (3-100 km²)
- **File**: `haspersPilotData`
- **Parameter**: A, L, S, I
- **Jumlah Data**: 3 dataset
- **Rentang Luas DAS**: 25 - 68 km²
- **Contoh**: DAS Cikapundung Tengah, DAS Cisadane Hulu

#### C. Metode der Weduwen (3-100 km²)
- **File**: `weduwenPilotData`
- **Parameter**: A, L, S, I
- **Jumlah Data**: 3 dataset
- **Rentang Luas DAS**: 35 - 78 km²
- **Contoh**: DAS Cimanuk Hulu, DAS Citanduy Tengah

#### D. Metode Melchior (> 100 km²)
- **File**: `melchiorPilotData`
- **Parameter**: A, L, S, I, C
- **Jumlah Data**: 3 dataset
- **Rentang Luas DAS**: 280 - 620 km²
- **Contoh**: DAS Citarum Tengah, DAS Cimanuk Hilir

### 2. Metode HSS (Hydrograph Calculator)

#### A. HSS Nakayasu (> 3 km²)
- **File**: `nakayasuPilotData`
- **Parameter**: A, L, Ro, Alpha
- **Jumlah Data**: 6 dataset
- **Rentang Luas DAS**: 180 - 1250 km²
- **Contoh**: DAS Citarum Hulu, DAS Ciliwung Tengah

#### B. HSS Gamma I (Kecil-Menengah)
- **File**: `gamma1PilotData`
- **Parameter**: A, L, Ro, Alpha
- **Jumlah Data**: 2 dataset
- **Rentang Luas DAS**: 85 - 120 km²
- **Status**: Data tersedia, metode belum diimplementasikan

#### C. HSS Snyder (DAS Besar)
- **File**: `snyderPilotData`
- **Parameter**: A, L, Ro, Alpha
- **Jumlah Data**: 2 dataset
- **Rentang Luas DAS**: 850 - 1580 km²
- **Status**: Data tersedia, metode belum diimplementasikan

## Cara Kerja

### Automatic Method Detection
Komponen `PilotDataLoader` secara otomatis mendeteksi metode yang dipilih dan menampilkan data pilot yang sesuai:

```typescript
// Di PeakDischargeCalculator
<PilotDataLoader
  method={method === 'rational' ? 'RATIONAL' : 
         method === 'haspers' ? 'HASPERS' : 
         method === 'weduwen' ? 'WEDUWEN' : 'MELCHIOR'}
  onLoadRational={handleLoadPilot}
  onLoadModifiedRational={handleLoadModifiedPilot}
  onLoadNakayasu={() => {}}
/>

// Di HydrographCalculator
<PilotDataLoader
  method={method === 'nakayasu' ? 'NAKAYASU' : 
         method === 'gamma1' ? 'GAMMA1' : 'SNYDER'}
  onLoadRational={() => {}}
  onLoadModifiedRational={() => {}}
  onLoadNakayasu={handleLoadPilot}
/>
```

### Data Loading Flow
1. User memilih metode perhitungan
2. PilotDataLoader otomatis menampilkan data pilot yang sesuai
3. User memilih salah satu data pilot
4. Data dimuat ke form input
5. User dapat langsung menghitung atau memodifikasi parameter

## Kepatuhan SNI 2415:2016

### Metode Rasional
- ✅ Semua data memiliki A ≤ 3 km² (Pasal 3.1)
- ✅ Nilai C realistis (0.45 - 0.90)
- ✅ Intensitas hujan sesuai kondisi Indonesia (95-140 mm/jam)

### Metode Haspers & der Weduwen
- ✅ Semua data memiliki A dalam rentang 3-100 km²
- ✅ Kemiringan realistis (1.2% - 3.2%)
- ✅ Panjang sungai proporsional dengan luas DAS

### Metode Melchior
- ✅ Semua data memiliki A > 100 km²
- ✅ Kemiringan rendah untuk DAS besar (0.5% - 0.8%)
- ✅ Koefisien C disesuaikan dengan karakteristik DAS

### HSS Nakayasu
- ✅ Semua data memiliki A > 3 km² (Pasal 3.1)
- ✅ Nilai Ro realistis sebagai hujan satuan (8-18 mm)
- ✅ Koefisien Alpha sesuai karakteristik DAS (1.7-2.6)

## Lokasi Data

Semua data pilot menggunakan lokasi DAS nyata di Indonesia:
- **Jawa Barat**: Citarum, Cikapundung, Cisadane, Cimanuk
- **Jakarta**: Ciliwung, Pesanggrahan, Cakung
- **Jawa Tengah**: Serayu, Bengawan Solo, Progo
- **Jawa Timur**: Brantas

## Helper Functions

```typescript
// Metode Empiris
getRationalPilotByName(name: string)
getHaspersPilotByName(name: string)
getWeduwenPilotByName(name: string)
getMelchiorPilotByName(name: string)

// Metode HSS
getNakayasuPilotByName(name: string)
getGamma1PilotByName(name: string)
getSnyderPilotByName(name: string)

// Get All Names
getAllRationalPilotNames()
getAllHaspersPilotNames()
getAllWeduwenPilotNames()
getAllMelchiorPilotNames()
getAllNakayasuPilotNames()
getAllGamma1PilotNames()
getAllSnyderPilotNames()
```

## Menambah Data Pilot Baru

### 1. Untuk Metode Rasional
```typescript
{
  name: "Nama DAS",
  description: "Deskripsi singkat",
  location: {
    channelName: "Nama Saluran",
    kabupaten: "Kabupaten",
    kecamatan: "Kecamatan",
    desa: "Desa",
    coordinates: { lat: -6.xxx, lng: 107.xxx }
  },
  inputs: {
    C: 0.75,    // 0-1
    A: 2.5,     // ≤ 3 km²
    tc: 45,     // menit
    I: 120      // mm/jam
  },
  returnPeriods: [...]
}
```

### 2. Untuk Metode Modified Rational (Haspers, Weduwen, Melchior)
```typescript
{
  name: "Nama DAS",
  description: "Deskripsi singkat",
  location: {...},
  inputs: {
    A: 25,      // km²
    L: 12,      // km
    S: 2.5,     // %
    I: 110,     // mm/jam
    C: 0.55     // opsional, hanya untuk Melchior
  },
  returnPeriods: [...]
}
```

### 3. Untuk Metode HSS
```typescript
{
  name: "Nama DAS",
  description: "Deskripsi singkat",
  location: {...},
  inputs: {
    A: 450,     // km²
    L: 35,      // km
    Ro: 12,     // mm (hujan satuan)
    Alpha: 2.0  // 1.5-3.0
  },
  returnPeriods: [...]
}
```

## Update Log

**2025-01-XX**: 
- ✅ Menambahkan data pilot untuk semua metode empiris (Haspers, Weduwen, Melchior)
- ✅ Menambahkan data pilot untuk HSS Gamma I dan Snyder
- ✅ Implementasi automatic method detection di PilotDataLoader
- ✅ Semua data pilot telah divalidasi sesuai SNI 2415:2016
- ✅ Build berhasil dengan ukuran bundle 695.41 kB
