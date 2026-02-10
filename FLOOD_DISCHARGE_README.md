# 🌊 Modul Debit Banjir Rencana - Quick Reference

## ✨ Fitur Lengkap

### 1️⃣ Multi-Method Calculation
- ✅ **Metode Rasional** (DAS < 300 Ha)
  - Formula: Q = 0.278 × C × I × A
  - Hidrograf segitiga sederhana
  
- ✅ **HSS Nakayasu** (DAS > 300 Ha)
  - Hidrograf satuan sintetik
  - Kurva lengkung naik-turun lengkap

### 2️⃣ Kalkulator Tc (Time of Concentration)
- Rumus Kirpich: tc = 0.0195 × L^0.77 × S^-0.385
- Helper tool terintegrasi
- Auto-fill ke input tc

### 3️⃣ Visualisasi Hidrograf
- Grafik interaktif (Recharts)
- Real-time update
- Export-ready

### 4️⃣ Komparasi Kala Ulang
- Q2, Q5, Q10, Q25
- Tabel perbandingan Qpeak
- Editable rainfall values

## 🚀 Quick Start

### Install Dependencies
```bash
npm install recharts
```

### Import & Use
```tsx
import { FloodDischargeCalculator } from './components/FloodDischargeCalculator';

<FloodDischargeCalculator />
```

## 📊 Input Parameters

### Metode Rasional
| Parameter | Unit | Contoh |
|-----------|------|--------|
| C | - | 0.70 |
| A | km² | 0.5 |
| tc | menit | 30 |
| I | mm/jam | 100 |

### HSS Nakayasu
| Parameter | Unit | Contoh |
|-----------|------|--------|
| A | km² | 50 |
| L | km | 15 |
| Ro | mm | 100 |
| α | - | 2.0 |

## 📈 Output

- **Qpeak**: Debit puncak (m³/s)
- **Hidrograf**: Grafik debit vs waktu
- **Tabel Kala Ulang**: Komparasi Q2-Q25

## 🎨 Design

- Warna: Emerald/Green theme
- Responsive: Mobile & Desktop
- Clean dashboard style
- Smooth animations

## 📚 Referensi

- SNI 2415:2016
- Soewarno (1995)
- Sosrodarsono & Takeda (1983)

## 📁 File Structure

```
components/
  └── FloodDischargeCalculator.tsx

utils/calculations/
  ├── rational.ts
  └── nakayasu.ts

docs/
  ├── FLOOD_DISCHARGE_MODULE.md
  └── INTEGRATION_GUIDE_FLOOD_DISCHARGE.md
```

## 🔧 Troubleshooting

**Grafik tidak muncul?**
```bash
npm install recharts --save
```

**Nilai Qpeak = 0?**
- Check semua input > 0
- Untuk Nakayasu: Alpha harus 1.5-3.0

**Styling tidak sesuai?**
- Pastikan Tailwind CSS configured
- Check tailwind.config.js

## 💡 Tips

1. **Pilih metode sesuai luas DAS**
   - < 300 Ha → Rasional
   - > 300 Ha → Nakayasu

2. **Gunakan Kalkulator Tc**
   - Klik icon kalkulator
   - Input L dan S
   - Auto-fill tc

3. **Edit Kala Ulang**
   - Ubah nilai rainfall
   - Tabel update otomatis

## 🎯 Next Steps

1. Install recharts
2. Import komponen
3. Tambahkan ke routing/tabs
4. Test kedua metode
5. Customize sesuai kebutuhan

---

**Dibuat oleh**: Senior Water Resources Engineer & Full Stack Developer  
**Standar**: SNI 2415:2016  
**Framework**: React + TypeScript + Tailwind CSS + Recharts
