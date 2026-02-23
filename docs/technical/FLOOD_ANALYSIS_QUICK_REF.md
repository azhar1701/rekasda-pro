# Flood Analysis - Quick Reference

## 🎯 Two Analysis Paths

### 1️⃣ Debit Puncak (Metode Empiris)
**Purpose**: Calculate single peak discharge value (Qp)

**Methods Available**:
- ✅ Rasional Standar → A ≤ 3 km²
- ✅ Haspers & Osugi → 3-100 km²
- ✅ der Weduwen → 3-100 km²
- ✅ Melchior → A > 100 km²

**Output**: 
```
┌─────────────────────┐
│  Debit Puncak (Qp)  │
│      52.13          │
│     m³/detik        │
└─────────────────────┘
```

**NO CHART** - Just the number!

---

### 2️⃣ Hidrograf Banjir (Metode HSS)
**Purpose**: Generate full hydrograph time-series

**Methods Available**:
- ✅ HSS Nakayasu (Implemented)
- ⏳ HSS Gamma I (Planned)
- ⏳ HSS Snyder (Planned)

**Output**:
```
Qp: 45.23 m³/s  |  Tp: 3.5 jam

    Q (m³/s)
     │     ╱╲
     │    ╱  ╲
     │   ╱    ╲___
     │  ╱         ╲___
     │ ╱              ╲___
     └─────────────────────→ t (jam)
```

**WITH CHART** - Full curve visualization!

---

## 🔄 How to Switch

Click the mode selector at the top:
- **[TrendingUp] Debit Puncak** → For Qp only
- **[Activity] Hidrograf Banjir** → For full curve

---

## 📊 Smart Recommendations

Green checkmark (✓) appears when:
- Rational: Your area ≤ 3 km²
- Haspers/Weduwen: Your area is 3-100 km²
- Melchior: Your area > 100 km²

---

## 🧮 Calculation Engines

**Empirical Methods**:
```typescript
// Rational Standard
calculateRationalDischarge({ C, I, A })

// Modified Rational
calculateHaspersOsugi(A, L, S, R24)
calculateDerWeduwen(A, L, S, R24)
calculateMelchior(A, L, S, R24, C)
```

**HSS Methods**:
```typescript
// Nakayasu
calculateHSSNakayasu({ Ro, Tg, Tr, Alpha, A, L })
// Returns: { Qp, Tp, Tb, hydrograph: [{time, discharge}] }
```

---

## 📐 SNI Compliance

| Method | Standard | Area Range |
|--------|----------|------------|
| Rasional | SNI 2415:2016 §5.2 | < 5000 Ha |
| Haspers & Osugi | Sosrodarsono | > 3 km² |
| der Weduwen | Sosrodarsono | 3-100 km² |
| Melchior | Sosrodarsono | > 100 km² |
| HSS Nakayasu | SNI 2415:2016 §6.3 | All sizes |

---

## 🎨 UI Components

```
FloodAnalysisTab
├─ Mode Selector (2 buttons)
├─ PeakDischargeCalculator
│  ├─ Method selector (4 options)
│  ├─ Input form (conditional fields)
│  └─ Result card (Qp number)
└─ HydrographCalculator
   ├─ Method selector (3 options)
   ├─ Input form (HSS parameters)
   └─ Result (cards + LineChart)
```

---

## ✅ Testing Checklist

- [ ] Switch between Debit Puncak ↔ Hidrograf Banjir
- [ ] Calculate Rational (A = 2 km²) → See checkmark
- [ ] Calculate Haspers (A = 50 km²) → See checkmark
- [ ] Calculate Melchior (A = 150 km²) → See checkmark
- [ ] Calculate Nakayasu → See hydrograph chart
- [ ] Verify NO chart for empirical methods
- [ ] Verify chart ONLY for HSS methods
- [ ] Check AI Consultant button works
- [ ] Verify inputs persist when switching tabs

---

## 🚀 Next Development

1. Implement HSS Gamma I
2. Implement HSS Snyder
3. Add PDF export for both analysis types
4. Add comparison mode (multiple methods side-by-side)
5. Remove deprecated FloodDischargeCalculator.tsx
