# Modul Debit Banjir Rencana - Dokumentasi

## Overview
Modul komprehensif untuk perhitungan debit banjir rencana dengan dukungan multi-metode sesuai SNI 2415:2016.

## Fitur Utama

### 1. Multi-Method Support
- **Metode Rasional**: Untuk DAS kecil (< 300 Ha)
  - Formula: Q = 0.278 × C × I × A
  - Parameter: Koefisien limpasan (C), Intensitas hujan (I), Luas DAS (A)
  
- **HSS Nakayasu**: Untuk DAS besar (> 300 Ha)
  - Hidrograf Satuan Sintetik Nakayasu
  - Parameter: Luas DAS (A), Panjang sungai (L), Hujan satuan (Ro), Koefisien Alpha (α)

### 2. Kalkulator Waktu Konsentrasi (Tc)
- Rumus Kirpich: tc = 0.0195 × L^0.77 × S^-0.385
- Helper tool terintegrasi di panel input
- Input: Panjang aliran (L) dan Kemiringan (S)

### 3. Visualisasi Hidrograf
- Grafik interaktif menggunakan Recharts
- X-Axis: Waktu (jam)
- Y-Axis: Debit (m³/s)
- **Metode Rasional**: Hidrograf segitiga sederhana
- **HSS Nakayasu**: Kurva lengkung naik-turun lengkap dengan persamaan:
  - Kurva naik: Qt = Qp × (t/Tp)^2.4
  - Kurva turun (3 segmen dengan faktor 0.3)

### 4. Komparasi Kala Ulang
- Input hujan rencana untuk berbagai periode (Q2, Q5, Q10, Q25)
- Tabel perbandingan Qpeak untuk setiap kala ulang
- Update otomatis saat parameter berubah

## Struktur File

```
components/
  └── FloodDischargeCalculator.tsx    # Komponen utama

utils/calculations/
  ├── rational.ts                      # Perhitungan Metode Rasional (existing)
  └── nakayasu.ts                      # Perhitungan HSS Nakayasu (new)
```

## Cara Penggunaan

### Import Komponen
```tsx
import { FloodDischargeCalculator } from './components/FloodDischargeCalculator';

function App() {
  return <FloodDischargeCalculator />;
}
```

### Integrasi dengan App Existing
Tambahkan ke routing atau tab navigation:

```tsx
// Di App.tsx atau routing file
<Tab label="Debit Banjir Rencana">
  <FloodDischargeCalculator />
</Tab>
```

## Parameter Input

### Metode Rasional
| Parameter | Satuan | Range | Deskripsi |
|-----------|--------|-------|-----------|
| C | - | 0-1 | Koefisien limpasan |
| A | km² | > 0 | Luas DAS |
| tc | menit | > 5 | Waktu konsentrasi |
| I | mm/jam | > 0 | Intensitas hujan |

### HSS Nakayasu
| Parameter | Satuan | Range | Deskripsi |
|-----------|--------|-------|-----------|
| A | km² | > 0 | Luas DAS |
| L | km | > 0 | Panjang sungai utama |
| Ro | mm | > 0 | Hujan satuan |
| Alpha (α) | - | 1.5-3.0 | Koefisien karakteristik DAS |

## Output

### Hasil Perhitungan
- **Qpeak**: Debit puncak (m³/s)
- **Hidrograf**: Grafik debit vs waktu
- **Tabel Komparasi**: Qpeak untuk berbagai kala ulang

### Metode Rasional - Output Tambahan
- Waktu konsentrasi (tc)
- Intensitas hujan (I)
- Volume total

### HSS Nakayasu - Output Tambahan
- Tg: Waktu konsentrasi (jam)
- Tp: Waktu puncak (jam)
- T03: Waktu dasar hidrograf (jam)

## Referensi Standar
- SNI 2415:2016: Tata Cara Perhitungan Debit Banjir Rencana
- Soewarno (1995): "Hidrologi Aplikasi Metode Statistik"
- Sosrodarsono & Takeda (1983): "Hidrologi untuk Pengairan"

## Dependencies
```json
{
  "recharts": "^2.x.x"  // Untuk visualisasi grafik
}
```

Pastikan recharts sudah terinstall:
```bash
npm install recharts
```

## Styling
- Menggunakan Tailwind CSS (existing)
- Warna tema: Emerald/Green (konsisten dengan design system)
- Responsive design untuk mobile & desktop
- Animasi smooth transitions

## Tips Penggunaan

1. **Pemilihan Metode**:
   - DAS < 300 Ha → Gunakan Metode Rasional
   - DAS > 300 Ha → Gunakan HSS Nakayasu

2. **Kalkulator Tc**:
   - Klik icon kalkulator di sebelah input tc
   - Masukkan panjang aliran (L) dan kemiringan (S)
   - Hasil otomatis dimasukkan ke input tc

3. **Komparasi Kala Ulang**:
   - Edit nilai hujan rencana untuk setiap periode
   - Tabel akan update otomatis
   - Gunakan untuk analisis sensitivitas

## Troubleshooting

### Grafik tidak muncul
- Pastikan recharts terinstall
- Check console untuk error
- Verifikasi data hydrographData tidak kosong

### Nilai Qpeak = 0
- Periksa semua input > 0
- Untuk Nakayasu, pastikan Alpha antara 1.5-3.0
- Check console untuk validation errors

### Hidrograf tidak smooth
- Adjust timeStep di generateHydrograph()
- Default: 0.5 jam (dapat diperkecil untuk detail lebih)
